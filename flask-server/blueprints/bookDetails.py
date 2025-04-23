from flask import Blueprint, jsonify, request, session
import requests, logging

bookDetails_bp = Blueprint('bookDetails', __name__)

logging.basicConfig(level=logging.INFO)

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
