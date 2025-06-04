from flask import Blueprint, request, jsonify
import psycopg, jwt, datetime  # Import PyJWT and datetime for token expiration
from config import Config

auth = Blueprint('auth', __name__)


# Secret key for signing JWT tokens
SECRET_KEY = Config.SECRET_KEY

@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Nazwa użytkownika i hasło są wymagane."}), 400

    try:
        with psycopg.connect(**Config.get_db_connection_params()) as connection:
            with connection.cursor() as cursor:
                # Modified query to include active status check
                query = """
                    SELECT row_to_json(users) 
                    FROM users 
                    WHERE name = %s AND password = crypt(%s, password) AND active = TRUE;
                """
                cursor.execute(query, (username, password))
                result = cursor.fetchone()

                if result:
                    user_data = result[0]  # The JSON object is in the first column

                    # Generate a JWT token
                    token = jwt.encode(
                        {
                            "user_id": user_data["user_id"],
                            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8)  # Token expires in 8 hours
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

@auth.route('/workerlogin', methods=['POST'])
def workerlogin():
    data = request.get_json()
    workerid = data.get('workerid')
    password = data.get('password')
    if not workerid or not password:
        return jsonify({"error": "Nazwa użytkownika i hasło są wymagane."}), 400

    try:
        # Connect to the PostgreSQL database using psycopg 3.2.6
        with psycopg.connect(**Config.get_db_connection_params()) as connection:
            with connection.cursor() as cursor:
                # Query the database and convert the result to JSON using row_to_json()
                query = """
                    SELECT row_to_json(t)
                    FROM (
                        SELECT e.*, ej.name AS role_name
                        FROM public."Employees" e
                        JOIN public."Employees_jobs" ej ON e.rola = ej.id
                        WHERE e.id = %s AND e.password = crypt(%s, e.password) AND e.status IS DISTINCT FROM FALSE
                    ) t;
                """
                cursor.execute(query, (workerid, password))
                result = cursor.fetchone()

                if result:
                    user_data = result[0]  # The JSON object is in the first column
                    # Generate a JWT token
                    token = jwt.encode(
                        {
                            "worker_id": user_data["id"],
                            "rola": user_data["role_name"],
                            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8)  # Token expires in 8 hours
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

@auth.route('/worker/set-password', methods=['PUT'])
def set_worker_password():
    data = request.get_json()
    workerid = data.get('workerid')
    new_password = data.get('new_password')

    if not workerid or not new_password:
        return jsonify({"error": "Identyfikator pracownika i nowe hasło są wymagane."}), 400

    try:
        with psycopg.connect(**Config.get_db_connection_params()) as connection:
            with connection.cursor() as cursor:
                query = """
                    UPDATE public."Employees"
                    SET password = crypt(%s, gen_salt('bf', 10)), status = TRUE
                    WHERE id = %s;
                """
                cursor.execute(query, (new_password, workerid))
                connection.commit()
                return jsonify({"message": "Hasło zostało pomyślnie ustawione."}), 200
    except psycopg.Error as e:
        return jsonify({"error": f"Wystąpił błąd: {str(e)}"}), 500