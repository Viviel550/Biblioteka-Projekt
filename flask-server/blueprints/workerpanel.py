# flask-server/blueprints/workerpanel.py
from flask import Blueprint, request, jsonify
import psycopg
import jwt
import datetime
from functools import wraps

workerpanel = Blueprint('workerpanel', __name__)

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
            request.worker_id = decoded.get("worker_id")
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token wygasł"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Nieprawidłowy token"}), 401
        return f(*args, **kwargs)
    return decorated


# 1. Informacje o profilu
@workerpanel.route('/worker/profile', methods=['GET'])
@token_required
def get_profile():
    worker_id = request.worker_id
    try:
        with psycopg.connect(
            host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD
        ) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, first_name, last_name, email 
                    FROM public."Employees" 
                    WHERE id = %s
                """, (worker_id,))
                data = cur.fetchone()
                if not data:
                    return jsonify({"error": "Pracownik nie znaleziony"}), 404

                return jsonify({
                    "id": data[0],
                    "first_name": data[1],
                    "last_name": data[2],
                    "email": data[3],
                    "profile_picture": None  # Placeholder
                }), 200
    except psycopg.Error as e:
        return jsonify({"error": str(e)}), 500


# 2a. Zmiana emaila
@workerpanel.route('/worker/email', methods=['PUT'])
@token_required
def update_email():
    worker_id = request.worker_id
    data = request.get_json()
    new_email = data.get("email")
    if not new_email:
        return jsonify({"error": "Nowy email jest wymagany"}), 400

    try:
        with psycopg.connect(
            host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD
        ) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE public."Employees"
                    SET email = %s
                    WHERE id = %s
                """, (new_email, worker_id))
                conn.commit()
                return jsonify({"message": "Email zaktualizowany pomyślnie"}), 200
    except psycopg.Error as e:
        return jsonify({"error": str(e)}), 500


# 2b. Zmiana hasła
@workerpanel.route('/worker/password', methods=['PUT'])
@token_required
def update_password():
    worker_id = request.worker_id
    data = request.get_json()
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not old_password or not new_password:
        return jsonify({"error": "Wszystkie pola są wymagane"}), 400

    try:
        with psycopg.connect(
            host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD
        ) as conn:
            with conn.cursor() as cur:
                # Pobierz aktualne hasło i porównaj
                cur.execute("""
                    SELECT password FROM public."Employees" WHERE id = %s
                """, (worker_id,))
                row = cur.fetchone()
                if not row:
                    return jsonify({"error": "Nie znaleziono pracownika"}), 404

                # Sprawdź stare hasło
                cur.execute("""
                    SELECT id FROM public."Employees"
                    WHERE id = %s AND password = crypt(%s, password)
                """, (worker_id, old_password))
                if not cur.fetchone():
                    return jsonify({"error": "Obecne hasło jest nieprawidłowe"}), 401

                # Zmień hasło
                cur.execute("""
                    UPDATE public."Employees"
                    SET password = crypt(%s, gen_salt('bf'))
                    WHERE id = %s
                """, (new_password, worker_id))
                conn.commit()

                return jsonify({"message": "Hasło zostało zmienione"}), 200

    except psycopg.Error as e:
        return jsonify({"error": str(e)}), 500



# 3. Dezaktywacja użytkownika (teoretyczna)
@workerpanel.route('/worker/deactivate-user/<int:user_id>', methods=['PUT'])
@token_required
def deactivate_user(user_id):
    try:
        with psycopg.connect(
            host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD
        ) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE auth.users
                    SET deleted_at = NOW()
                    WHERE user_id = %s
                """, (user_id,))
                conn.commit()
                return jsonify({"message": f"Użytkownik {user_id} został dezaktywowany"}), 200
    except psycopg.Error as e:
        return jsonify({"error": str(e)}), 500
