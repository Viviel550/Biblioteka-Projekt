from flask import Blueprint, request, jsonify
import psycopg
import jwt  # Import PyJWT
import datetime  # For token expiration

auth = Blueprint('auth', __name__)

# PostgreSQL connection details
DB_HOST = "localhost"
DB_NAME = "Biblioteka"
DB_USER = "postgres"
DB_PASSWORD = "123"

# Secret key for signing JWT tokens
SECRET_KEY = "secret"  # Replace with a secure, random key

@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Nazwa użytkownika i hasło są wymagane."}), 400

    try:
        # Connect to the PostgreSQL database using psycopg 3.2.6
        with psycopg.connect(
            host=DB_HOST,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        ) as connection:
            with connection.cursor() as cursor:
                # Query the database and convert the result to JSON using row_to_json()
                query = """
                    SELECT row_to_json(users) 
                    FROM users 
                    WHERE name = %s AND password = %s
                """
                cursor.execute(query, (username, password))
                result = cursor.fetchone()

                if result:
                    user_data = result[0]  # The JSON object is in the first column

                    # Generate a JWT token
                    token = jwt.encode(
                        {
                            "user_id": user_data["user_id"],
                            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)  # Token expires in 1 hour
                        },
                        SECRET_KEY,
                        algorithm="HS256"
                    )

                    # Return the JSON data with the token
                    return jsonify({
                        "message": "Zalogowano pomyślnie!",
                        "token": token,
                        "user": user_data
                    }), 200
                else:
                    return jsonify({"error": "Nieprawidłowa nazwa użytkownika lub hasło."}), 401

    except psycopg.Error as e:
        return jsonify({"error": f"Wystąpił błąd: {str(e)}"}), 500