from flask import Blueprint, request, jsonify
import psycopg
import jwt
import datetime
from functools import wraps

adminpanel = Blueprint('adminpanel', __name__)

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
@adminpanel.route('/admin/profile', methods=['GET'])
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
@adminpanel.route('/admin/email', methods=['PUT'])
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
                            SELECT id FROM public."Employees" WHERE id != %s AND email = %s
                            """, (worker_id, new_email))
                if cur.fetchone():
                    return jsonify({"error": "Email już istnieje w bazie pracowników"}), 400
                
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
@adminpanel.route('/admin/password', methods=['PUT'])
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

@adminpanel.route('/admin/users', methods=['GET'])
@token_required
def get_users():
    try:
        with psycopg.connect(
            host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD
        ) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT user_id, name, created_at
                    FROM public.users
                    ORDER BY user_id ASC
                """)
                users = cur.fetchall()
                return jsonify([
                    {"id": user[0], "name": user[1], "created_at": user[2]}
                    for user in users
                ]), 200
    except psycopg.Error as e:
        return jsonify({"error": str(e)}), 500

# 3. Dezaktywacja użytkownika (teoretyczna)
@adminpanel.route('/admin/deactivate-user/<int:user_id>', methods=['DELETE'])
@token_required
def deactivate_user(user_id):
    try:
        with psycopg.connect(
            host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD
        ) as conn:
            with conn.cursor() as cur:
                # Delete the user from the public.users table
                cur.execute("""
                    DELETE FROM public.users
                    WHERE user_id = %s
                """, (user_id,))
                conn.commit()
                return jsonify({"message": f"Użytkownik {user_id} został usunięty"}), 200
    except psycopg.Error as e:
        return jsonify({"error": str(e)}), 500

@adminpanel.route('/admin/jobs', methods=['GET'])
@token_required
def get_jobs():
    try:
        with psycopg.connect(
            host=DB_HOST,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        ) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT id, name FROM public.\"Employees_jobs\" ORDER BY id ASC;")
                jobs = cursor.fetchall()
                return jsonify([{"id": job[0], "name": job[1]} for job in jobs]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@adminpanel.route('/admin/createworker', methods=['POST'])
@token_required
def create_user():
    data = request.get_json()
    name = data.get('name')
    surname = data.get('surname')
    email = data.get('email')
    position = data.get('position')
    if not name or not surname or not email or not position:
        return jsonify({"error": "Wszystkie pola są wymagane"}), 400
    
    password = (name[:3] + surname[:3] + str(len(email))).lower()

    try:
        with psycopg.connect(
            host=DB_HOST,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        ) as connection:
            with connection.cursor() as cursor:
                # Check if the username already exists and insert if it doesn't
                query = """
                    INSERT INTO public."Employees" (first_name, last_name, email, password, status, rola)
                    SELECT %s, %s, %s, crypt(%s, gen_salt('bf', 10)), NULL, %s
                    WHERE NOT EXISTS (
                        SELECT 1 FROM public."Employees" WHERE email = %s
                    )
                    RETURNING id, password;
                """
                cursor.execute(query, (name, surname, email, password, position, email))
                result = cursor.fetchone()

                if not result:
                    return jsonify({"error": "Użytkownik o podanej nazwie lub emailu już istnieje."}), 400

                user_id = result[0]

                # Commit the transaction
                connection.commit()

                return jsonify({"message": "Rejestracja zakończona sukcesem!", "user_id": user_id, "password": password}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@adminpanel.route('/admin/workers', methods=['GET'])
@token_required
def get_workers():
    try:
        with psycopg.connect(
            host=DB_HOST,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        ) as connection:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT e.id, e.first_name, e.last_name,e.status, j.name AS job
                    FROM public."Employees" e
                    LEFT JOIN public."Employees_jobs" j ON e.rola = j.id
                    ORDER BY e.id ASC;
                """)
                workers = cursor.fetchall()
                return jsonify([
                    {"id": worker[0], "name": worker[1], "surname": worker[2],"status": worker[3], "job": worker[4]}
                    for worker in workers
                ]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@adminpanel.route('/admin/deactivate-worker/<int:worker_id>', methods=['PUT'])
@token_required
def deactivate_worker(worker_id):
    try:
        with psycopg.connect(
            host=DB_HOST,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        ) as connection:
            with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE public."Employees"
                    SET status = FALSE
                    WHERE id = %s;
                """, (worker_id,))
                connection.commit()
                return jsonify({"message": f"Pracownik {worker_id} został dezaktywowany"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@adminpanel.route('/admin/reactivate-worker/<int:worker_id>', methods=['PUT'])
@token_required
def reactivate_worker(worker_id):
    try:
        with psycopg.connect(
            host=DB_HOST,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        ) as connection:
            with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE public."Employees"
                    SET status = TRUE
                    WHERE id = %s;
                """, (worker_id,))
                connection.commit()
                return jsonify({"message": f"Pracownik {worker_id} został reaktywowany"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500