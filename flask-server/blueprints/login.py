from flask import Blueprint, request, jsonify

auth = Blueprint('auth', __name__)

# Test credentials
TEST_USERNAME = "testuser"
TEST_PASSWORD = "test"

@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if username == TEST_USERNAME and password == TEST_PASSWORD:
        return jsonify({"message": "Zalogowano pomyślnie!"}), 200
    else:
        return jsonify({"error": "Nieprawidłowa nazwa użytkownika lub hasło."}), 401