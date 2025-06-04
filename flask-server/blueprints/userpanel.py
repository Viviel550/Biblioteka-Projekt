# flask-server/blueprints/userpanel.py
from flask import Blueprint, request, jsonify
import psycopg, jwt, datetime, requests
from functools import wraps
from config import Config

userpanel = Blueprint('userpanel', __name__)

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
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.user_id = decoded.get("user_id")
            # Sprawdź czy to jest zwykły użytkownik (nie pracownik)
            if decoded.get("rola") == "Bibliotekarz":
                return jsonify({"error": "Brak uprawnień"}), 403
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token wygasł"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Nieprawidłowy token"}), 401
        return f(*args, **kwargs)
    return decorated


# 1. Informacje o profilu użytkownika
@userpanel.route('/user/profile', methods=['GET'])
@token_required
def get_profile():
    user_id = request.user_id
    try:
        with psycopg.connect(**Config.get_db_connection_params()) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT user_id, name, email, created_at 
                    FROM users 
                    WHERE user_id = %s
                """, (user_id,))
                data = cur.fetchone()
                if not data:
                    return jsonify({"error": "Użytkownik nie znaleziony"}), 404

                return jsonify({
                    "user_id": data[0],
                    "name": data[1],
                    "email": data[2],
                    "created_at": data[3].isoformat() if data[3] else None,
                    "profile_picture": None  # Placeholder
                }), 200
    except psycopg.Error as e:
        return jsonify({"error": str(e)}), 500


# 2a. Zmiana emaila
@userpanel.route('/user/email', methods=['PUT'])
@token_required
def update_email():
    user_id = request.user_id
    data = request.get_json()
    new_email = data.get("email")
    
    if not new_email:
        return jsonify({"error": "Nowy email jest wymagany"}), 400

    try:
        with psycopg.connect(**Config.get_db_connection_params()) as conn:
            with conn.cursor() as cur:
                # Sprawdź czy email już istnieje
                cur.execute("""
                    SELECT user_id FROM users WHERE email = %s AND user_id != %s
                """, (new_email, user_id))
                if cur.fetchone():
                    return jsonify({"error": "Email już istnieje w systemie"}), 400

                # Zaktualizuj email
                cur.execute("""
                    UPDATE users
                    SET email = %s
                    WHERE user_id = %s
                """, (new_email, user_id))
                conn.commit()
                return jsonify({"message": "Email zaktualizowany pomyślnie"}), 200
    except psycopg.Error as e:
        return jsonify({"error": str(e)}), 500


# 2b. Zmiana hasła
@userpanel.route('/user/password', methods=['PUT'])
@token_required
def update_password():
    user_id = request.user_id
    data = request.get_json()
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not old_password or not new_password:
        return jsonify({"error": "Wszystkie pola są wymagane"}), 400

    if len(new_password) < 6:
        return jsonify({"error": "Nowe hasło musi mieć co najmniej 6 znaków"}), 400

    try:
        with psycopg.connect(**Config.get_db_connection_params()) as conn:
            with conn.cursor() as cur:
                # Sprawdź stare hasło (zakładając że używasz bcrypt/crypt)
                cur.execute("""
                    SELECT user_id FROM users
                    WHERE user_id = %s AND password = crypt(%s, password)
                """, (user_id, old_password))
                if not cur.fetchone():
                    return jsonify({"error": "Obecne hasło jest nieprawidłowe"}), 401

                # Zmień hasło
                cur.execute("""
                    UPDATE users
                    SET password = crypt(%s, gen_salt('bf'))
                    WHERE user_id = %s
                """, (new_password, user_id))
                conn.commit()

                return jsonify({"message": "Hasło zostało zmienione"}), 200

    except psycopg.Error as e:
        return jsonify({"error": str(e)}), 500


# 3. Pobierz ulubione książki użytkownika
@userpanel.route('/user/favorites', methods=['GET'])
@token_required
def get_favorite_books():
    user_id = request.user_id
    try:
        with psycopg.connect(**Config.get_db_connection_params()) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        b.book_id,
                        b.slug,
                        f.added_at
                    FROM favorites f
                    JOIN "Books" b ON f.book_id = b.book_id
                    WHERE f.user_id = %s
                    ORDER BY f.added_at DESC
                """, (user_id,))
                
                favorites = cur.fetchall()
                
                if not favorites:
                    return jsonify({"favorites": []}), 200

                # Dla każdej książki pobierz szczegóły z API
                favorite_books = []
                for book in favorites:
                    book_id, slug, added_at = book
                    
                    # Pobierz szczegóły książki z zewnętrznego API
                    try:
                        # Przykład wywołania API - dostosuj URL do swojego API
                        api_url = f"https://wolnelektury.pl/api/books/{slug}/"
                        response = requests.get(api_url, timeout=5)
                        
                        if response.status_code == 200:
                            book_data = response.json()
                           
                            genres = [genre['name'] for genre in book_data.get("genres", [])]

                            # Wyciągnij potrzebne informacje
                            book_info = {
                                "book_id": book_id,
                                "slug": slug,
                                "title": book_data.get("title", "Nieznany tytuł"),
                                "author": book_data.get("author", "Nieznany autor"),
                                "cover": book_data.get("cover", None),
                                "cover_thumb": book_data.get("cover_thumb", None),
                                "simple_thumb": book_data.get("simple_thumb", None),
                                "genres": genres,
                                "kinds": book_data.get("kinds", []),
                                "epochs": book_data.get("epochs", []),
                                "url": book_data.get("url", ""),
                                "added_at": added_at.isoformat() if added_at else None
                            }
                            favorite_books.append(book_info)
                        else:
                            # Jeśli API nie odpowiada, dodaj podstawowe info
                            book_info = {
                                "book_id": book_id,
                                "slug": slug,
                                "title": f"Książka {slug}",
                                "author": "Nieznany autor",
                                "cover": None,
                                "cover_thumb": None,
                                "simple_thumb": None,
                                "genres": [],
                                "kinds": [],
                                "epochs": [],
                                "url": "",
                                "added_at": added_at.isoformat() if added_at else None,
                                "api_error": True
                            }
                            favorite_books.append(book_info)
                            
                    except requests.RequestException as e:
                        # W przypadku błędu API, dodaj podstawowe informacje
                        book_info = {
                            "book_id": book_id,
                            "slug": slug,
                            "title": f"Książka {slug}",
                            "author": "Nieznany autor",
                            "cover": None,
                            "cover_thumb": None,
                            "simple_thumb": None,
                            "genres": [],
                            "kinds": [],
                            "epochs": [],
                            "url": "",
                            "added_at": added_at.isoformat() if added_at else None,
                            "api_error": True
                        }
                        favorite_books.append(book_info)

                return jsonify({"favorites": favorite_books}), 200

    except psycopg.Error as e:
        return jsonify({"error": str(e)}), 500


# 4. Dodaj książkę do ulubionych
@userpanel.route('/user/favorites', methods=['POST'])
@token_required
def add_to_favorites():
    user_id = request.user_id
    data = request.get_json()
    book_id = data.get("book_id")
    
    if not book_id:
        return jsonify({"error": "ID książki jest wymagane"}), 400

    try:
        with psycopg.connect(**Config.get_db_connection_params()) as conn:
            with conn.cursor() as cur:
                # Sprawdź czy książka już jest w ulubionych
                cur.execute("""
                    SELECT entry_id FROM favorites 
                    WHERE user_id = %s AND book_id = %s
                """, (user_id, book_id))
                
                if cur.fetchone():
                    return jsonify({"error": "Książka już jest w ulubionych"}), 400

                # Sprawdź czy książka istnieje
                cur.execute("""
                    SELECT book_id FROM "Books" WHERE book_id = %s
                """, (book_id,))
                
                if not cur.fetchone():
                    return jsonify({"error": "Książka nie istnieje"}), 404

                # Dodaj do ulubionych
                cur.execute("""
                    INSERT INTO favorites (user_id, book_id, added_at)
                    VALUES (%s, %s, CURRENT_DATE)
                """, (user_id, book_id))
                conn.commit()

                return jsonify({"message": "Książka dodana do ulubionych"}), 201

    except psycopg.Error as e:
        return jsonify({"error": str(e)}), 500


# 5. Usuń książkę z ulubionych
@userpanel.route('/user/favorites/<int:book_id>', methods=['DELETE'])
@token_required
def remove_from_favorites(book_id):
    user_id = request.user_id
    
    try:
        with psycopg.connect(**Config.get_db_connection_params()) as conn:
            with conn.cursor() as cur:
                # Sprawdź czy książka jest w ulubionych
                cur.execute("""
                    SELECT entry_id FROM favorites 
                    WHERE user_id = %s AND book_id = %s
                """, (user_id, book_id))
                
                if not cur.fetchone():
                    return jsonify({"error": "Książka nie jest w ulubionych"}), 404

                # Usuń z ulubionych
                cur.execute("""
                    DELETE FROM favorites 
                    WHERE user_id = %s AND book_id = %s
                """, (user_id, book_id))
                conn.commit()

                return jsonify({"message": "Książka usunięta z ulubionych"}), 200

    except psycopg.Error as e:
        return jsonify({"error": str(e)}), 500


# 6. Pobierz statystyki użytkownika
@userpanel.route('/user/stats', methods=['GET'])
@token_required
def get_user_stats():
    user_id = request.user_id
    
    try:
        with psycopg.connect(**Config.get_db_connection_params()) as conn:
            with conn.cursor() as cur:
                # Liczba ulubionych książek
                cur.execute("""
                    SELECT COUNT(*) FROM favorites WHERE user_id = %s
                """, (user_id,))
                favorites_count = cur.fetchone()[0]

                # Liczba recenzji
                cur.execute("""
                    SELECT COUNT(*) FROM book_reviews WHERE user_id = %s
                """, (user_id,))
                reviews_count = cur.fetchone()[0]

                # Średnia ocena wystawiona przez użytkownika
                cur.execute("""
                    SELECT AVG(rating) FROM book_reviews WHERE user_id = %s
                """, (user_id,))
                avg_rating = cur.fetchone()[0]

                # Liczba rekomendacji wysłanych
                cur.execute("""
                    SELECT COUNT(*) FROM user_recommendations WHERE rec_by_user_id = %s
                """, (user_id,))
                recommendations_sent = cur.fetchone()[0]

                # Liczba rekomendacji otrzymanych
                cur.execute("""
                    SELECT COUNT(*) FROM user_recommendations WHERE user_id = %s
                """, (user_id,))
                recommendations_received = cur.fetchone()[0]

                return jsonify({
                    "favorites_count": favorites_count,
                    "reviews_count": reviews_count,
                    "average_rating": float(avg_rating) if avg_rating else 0,
                    "recommendations_sent": recommendations_sent,
                    "recommendations_received": recommendations_received
                }), 200

    except psycopg.Error as e:
        return jsonify({"error": str(e)}), 500