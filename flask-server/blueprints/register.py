from flask import Blueprint, request, jsonify
import psycopg, datetime
from config import Config

reg = Blueprint('register', __name__)

@reg.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')

    if not username or not password:
        return jsonify({"error": "Nazwa użytkownika i hasło są wymagane."}), 400

    try:
        # Connect to the PostgreSQL database using psycopg 3.2.6
        with psycopg.connect(**Config.get_db_connection_params()) as connection:
            with connection.cursor() as cursor:
                # Check if the username already exists and insert if it doesn't
                query = """
                    INSERT INTO users (name, password, email, created_at)
                    SELECT %s, crypt(%s, gen_salt('bf', 10)), %s, NOW()
                    WHERE NOT EXISTS (
                        SELECT 1 FROM users WHERE name = %s OR email = %s
                    )
                    RETURNING user_id;
                """
                cursor.execute(query, (username, password, email, username, email))
                result = cursor.fetchone()

                if not result:
                    return jsonify({"error": "Użytkownik o podanej nazwie lub emailu już istnieje."}), 400

                user_id = result[0]

                # Commit the transaction
                connection.commit()

                return jsonify({"message": "Rejestracja zakończona sukcesem!", "user_id": user_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500