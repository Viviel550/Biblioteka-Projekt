from flask import Blueprint, jsonify, request, session
import requests, logging

categories_bp = Blueprint('categories', __name__)

# Configure logging
logging.basicConfig(level=logging.INFO)

@categories_bp.route('/genres')
def GetGenres():
    genres = []
    response = requests.get(f'https://wolnelektury.pl/api/genres/')
    if response.status_code == 200:
        genresResponse = response.json()
        genres.extend(genresResponse)
        logging.info(f"Fetched {len(genres)} genres")
    else:
        logging.error(f"Failed to fetch genres")
    return jsonify(genres)

@categories_bp.route('/sendGenre', methods=['POST'])
def sendGenre():
    data = request.get_json()
    genreName = data.get('genre')
    if not genreName:
        return jsonify({'error': 'Brak gatunku'}), 400
    session['current_genre'] = genreName
    return jsonify({'message': f'Zapisano gatunek: {genreName}'}), 200

@categories_bp.route('/genreBooks')
def genreBooks():
    genreName = session.get('current_genre')
    books = []
    response = requests.get(f'https://wolnelektury.pl/api/genres/{genreName}/books/')
    if response.status_code == 200:
        genre_books = response.json()
        books.extend(genre_books)
        logging.info(f"Fetched {len(genre_books)} books for genre {genreName}")
    else:
        logging.error(f"Failed to fetch books for genre {genreName}")
    return jsonify(books)
