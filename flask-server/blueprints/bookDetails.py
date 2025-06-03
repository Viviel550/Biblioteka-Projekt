from flask import Blueprint, jsonify, request, session
import requests, logging, psycopg, jwt, json
from functools import wraps
from config import Config
bookDetails_bp = Blueprint('bookDetails', __name__)

logging.basicConfig(level=logging.INFO)

# JWT Secret Key
SECRET_KEY = Config.SECRET_KEY

# Middleware: JWT Auth decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "Brak tokenu"}), 401
        try:
            if token.startswith("Bearer "):
                token = token.split(" ")[1]
            decodedToken = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.user_id = decodedToken.get("user_id")
            request.rola = decodedToken.get("rola")
            request.worker_id = decodedToken.get("worker_id")
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token wygasł"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Nieprawidłowy token"}), 401
        return f(*args, **kwargs)
    return decorated

#pobierz szczegóły książki
@bookDetails_bp.route('/getBookDetails', methods=['POST'])
def getBookDetails():
    data = request.get_json()
    slug = data.get('slug') if data else None
    if not slug:
        logging.error(f"Slug not send")
        return jsonify({'error': 'Brak slug'}), 400
    logging.error(f"Received slug: {slug}")
    #pobranie danych ksiązki
    details = []
    response = requests.get(f'https://wolnelektury.pl/api/books/{slug}/')
    if response.status_code == 200:
        bookDetails = response.json()
        logging.info(f"Fetched deatils for book {slug}")
        return jsonify(bookDetails)
    else:
        logging.error(f"Failed to fetch details for book {slug}")
        return jsonify({'error': 'Nie znaleziono książki'}), 404


#dodanie książki do ulubionych
@bookDetails_bp.route('/addToFavorites', methods=['PUT'])
@token_required
def addToFavorites():
    user_id = request.user_id
    data = request.get_json()
    slug = data.get('slug') if data else None
    if not slug:
        return jsonify({'error': 'Brak slug'}), 400
    logging.info(f"Received slug: {slug}, user_id: {user_id}")

    try:
        with psycopg.connect(**Config.get_db_connection_params()) as conn:
            with conn.cursor() as cur:
                # Dodaj książkę do Books jeśli nie istnieje
                cur.execute("""
                    INSERT INTO public."Books" (slug)
                    SELECT %s
                    WHERE NOT EXISTS (
                        SELECT 1 FROM public."Books" WHERE slug = %s
                    )
                """, (slug, slug))

                # Pobierz book_id
                cur.execute("""
                    SELECT book_id FROM public."Books" WHERE slug = %s
                """, (slug,))                
                row = cur.fetchone()
                if not row:
                    return jsonify({"error": "Nie udało się pobrać book_id"}), 500
                book_id = row[0]
                logging.info(f"Received book_id: {book_id}")

                # Sprawdź, czy użytkownik już dodał tę książkę do ulubionych
                cur.execute("""
                    SELECT 1 FROM public."favorites" WHERE user_id = %s AND book_id = %s
                """, (user_id, book_id))
                if cur.fetchone():
                    return jsonify({"message": "UWAGA!!! Ta książka jest już dodana do ulubionych!"}), 200

                # Dodaj do favorites
                cur.execute("""
                    INSERT INTO public."favorites" (user_id, book_id, added_at)
                    VALUES (%s, %s, CURRENT_DATE)
                """, (user_id, book_id))

                conn.commit()
                return jsonify({"message": "Książka dodana do ulubionych!"}), 200           
    except psycopg.Error as e:
        return jsonify({"error": str(e)}), 500
    

#pobierz opinie
@bookDetails_bp.route('/getBookOpinions', methods=['GET'])
def getBookOpinions():
    slug = request.args.get('slug')
    if not slug:
        return jsonify({'error': 'Brak slug'}), 400
    logging.info(f"Received slug for opinions: {slug}")

    try:
        with psycopg.connect(**Config.get_db_connection_params()) as conn:
            with conn.cursor() as cur:
                # Pobierz book_id
                cur.execute("""
                    SELECT book_id FROM public."Books" WHERE slug = %s
                """, (slug,))                
                row = cur.fetchone()
                if not row:
                    logging.info("Brak ksiązki o takim slug")
                    return jsonify([]), 200
                book_id = row[0]
                logging.info(f"Found book_id for opinions: {book_id}")

                # Pobierz opinie
                cur.execute("""
                    SELECT * FROM public.book_reviews
                    WHERE book_id = %s
                    ORDER BY review_date ASC
                """, (book_id,))                
                opinions = cur.fetchall()           

                result = []
                for opinion in opinions:

                    #pobranie danych autora
                    user_id = opinion[2]
                    cur.execute("""
                    SELECT * FROM public.users
                    WHERE user_id = %s
                     """, (user_id,))                
                    author = cur.fetchone()

                    #dołączenie danych
                    result.append({
                        "review_id": opinion[0],                       
                        "book_id": opinion[1],
                        "user_id": opinion[2],
                        "nickname": author[1],
                        "rating": opinion[3],
                        "review": opinion[4],
                        "review_date": opinion[5]
                    })

                conn.commit()
                return jsonify(result), 200           
    except psycopg.Error as e:
        return jsonify({"error": str(e)}), 500


#dodanie opini o książce
@bookDetails_bp.route('/addOpinion', methods=['POST'])
@token_required
def addOpinion():
    user_id = request.user_id
    data = request.get_json()
    slug = data.get('slug') if data else None
    opinionText = data.get('opinionText') if data else None
    rating = data.get('rating') if data else None
    if not slug:
        return jsonify({'error': 'Brak slug'}), 400
    if not opinionText:
        return jsonify({'error': 'Brak opinionText'}), 400
    if not rating:
        return jsonify({'error': 'Brak rating'}), 400
    
    logging.info("Received slug, user_id and opinion.")

    try:
        with psycopg.connect(**Config.get_db_connection_params()) as conn:
            with conn.cursor() as cur:
                # Dodaj książkę do Books jeśli nie istnieje
                cur.execute("""
                    INSERT INTO public."Books" (slug)
                    SELECT %s
                    WHERE NOT EXISTS (
                        SELECT 1 FROM public."Books" WHERE slug = %s
                    )
                """, (slug, slug))

                # Pobierz book_id
                cur.execute("""
                    SELECT book_id FROM public."Books" WHERE slug = %s
                """, (slug,))                
                row = cur.fetchone()
                if not row:
                    return jsonify({"error": "Nie udało się pobrać book_id"}), 500
                book_id = row[0]
                logging.info(f"Received book_id: {book_id}")

                # Dodaj opinie
                cur.execute("""
                    INSERT INTO public.book_reviews (book_id, user_id, rating, review, review_date)
                    VALUES (%s, %s, %s, %s, CURRENT_DATE)
                """, (book_id, user_id, rating, opinionText))

                conn.commit()
                return jsonify({"message": "Opinia dodana!"}), 200           
    except psycopg.Error as e:
        return jsonify({"error": str(e)}), 500
    
#usunięcie opini o książce
@bookDetails_bp.route('/deleteOpinion', methods=['DELETE'])
@token_required
def deleteOpinion():
    user_id = request.user_id
    worker_id = request.worker_id
    rola = request.rola
    data = request.get_json()
    review_id = data.get('review_id') if data else None
    if not review_id:
        return jsonify({'error': 'Brak review_id'}), 400
    
    if(rola == "Bibliotekarz"):
        try:
            logging.info(f"Received review_id: {review_id} for delete, by Bibliotekarz: {worker_id}.")
            with psycopg.connect(**Config.get_db_connection_params()) as conn:
                with conn.cursor() as cur:
                    # Get review details before deletion for logging
                    cur.execute("""
                        SELECT user_id, book_id, rating, review 
                        FROM public.book_reviews 
                        WHERE review_id = %s
                    """, (review_id,))
                    review_data = cur.fetchone()
                    
                    if not review_data:
                        return jsonify({"error": "Nie znaleziono opinii."}), 404

                    # usunięcie opini przez Bibliotekarza
                    cur.execute("""
                        DELETE FROM public.book_reviews 
                        WHERE review_id = %s 
                    """, (review_id,))

                    if cur.rowcount == 0:
                        return jsonify({"error": "Nie znaleziono opinii."}), 404

                    # Add log entry
                    log_data = {
                        "review_id": review_id,
                        "deleted_by": "Bibliotekarz",
                        "original_user_id": review_data[0],
                        "book_id": review_data[1],
                        "rating": review_data[2],
                        "review_text": review_data[3]
                    }
                    
                    cur.execute("""
                        INSERT INTO public."Employee_log" (employee_id, action, action_data)
                        VALUES (%s, %s, %s)
                    """, (worker_id, "DELETE_OPINION", json.dumps(log_data)))

                    conn.commit()
                    return jsonify({"message": "Opinia usunięta przez Bibliotekarza!"}), 200           
        except psycopg.Error as e:
            return jsonify({"error": str(e)}), 500

    try:
        logging.info(f"Received review_id: {review_id} for delete, by user: {user_id}.")
        with psycopg.connect(**Config.get_db_connection_params()) as conn:
            with conn.cursor() as cur:
                # usunięcie opini
                cur.execute("""
                    DELETE FROM public.book_reviews 
                    WHERE review_id = %s 
                    AND user_id = %s;
                """, (review_id, user_id))

                if cur.rowcount == 0:
                    return jsonify({"error": "Nie znaleziono opinii lub brak uprawnień"}), 404

                conn.commit()
                return jsonify({"message": "Opinia usunięta!"}), 200           
    except psycopg.Error as e:
        return jsonify({"error": str(e)}), 500
    
#pobierz średnią
@bookDetails_bp.route('/getAvgRating', methods=['GET'])
def getAvgRating():
    slug = request.args.get('slug')
    if not slug:
        return jsonify({'error': 'Brak slug'}), 400
    logging.info(f"Received slug for avg rating: {slug}")

    try:
        with psycopg.connect(**Config.get_db_connection_params()) as conn:
            with conn.cursor() as cur:
                # Pobierz book_id
                cur.execute("""
                    SELECT book_id FROM public."Books" WHERE slug = %s
                """, (slug,))                
                row = cur.fetchone()
                if not row:
                    logging.info("Brak ksiązki o takim slug")
                    return jsonify([]), 200
                book_id = row[0]
                logging.info(f"Found book_id for opinions: {book_id}")

                # Pobierz średnią
                cur.execute("""
                    SELECT 
                        ROUND(AVG(rating), 2) AS average_rating,
                        COUNT(rating) AS ratings_count
                    FROM public.book_reviews
                    WHERE book_id = %s
                """, (book_id,))                
                avarage = cur.fetchone() 

                avarageArray = []
                avarageArray.append({
                        "avarage": avarage[0],                       
                        "count": avarage[1],
                    })          

                conn.commit()
                return jsonify(avarageArray), 200           
    except psycopg.Error as e:
        return jsonify({"error": str(e)}), 500
