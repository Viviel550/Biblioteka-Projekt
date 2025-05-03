from flask import Blueprint, jsonify, request, session
import requests, logging
import psycopg
import jwt
from functools import wraps

bookDetails_bp = Blueprint('bookDetails', __name__)

logging.basicConfig(level=logging.INFO)

# JWT Secret Key
SECRET_KEY = "secret"

# DB credentials
DB_HOST = "aws-0-eu-central-1.pooler.supabase.com"
DB_NAME = "postgres"
DB_USER = "postgres.dnmzlvofeecsinialsps"
DB_PASSWORD = "projekt!szkolny"

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
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.user_id = decoded.get("user_id")
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
        with psycopg.connect(
            host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD
        ) as conn:
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


