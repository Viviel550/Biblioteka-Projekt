from flask import Flask, jsonify, request, session
import requests, logging, sys, os
from blueprints.login import auth
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
app = Flask(__name__)
app.secret_key = 'lubiekotki123'

# register the login blueprint
app.register_blueprint(auth)  

# Configure logging
logging.basicConfig(level=logging.INFO)

# Members API Route
@app.route('/testbooks')
def testbooks():
    authors = ["arthur-conan-doyle", "adam-asnyk"]
    books = []

    for author in authors:
        response = requests.get(f'https://wolnelektury.pl/api/authors/{author}/books/')
        if response.status_code == 200:
            author_books = response.json()
            logging.info(f"Fetched {len(author_books)} books for author {author}")
            books.extend(author_books)
        else:
            logging.error(f"Failed to fetch books for author {author}")

    logging.info(f"Total books fetched: {len(books)}")
    return jsonify(books)

@app.route('/genres')
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

@app.route('/sendGenre', methods=['POST'])
def sendGenre():
    data = request.get_json()
    genreName = data.get('genre')

    if not genreName:
        return jsonify({'error': 'Brak gatunku'}), 400

    session['current_genre'] = genreName
    return jsonify({'message': f'Zapisano gatunek: {genreName}'}), 200


@app.route('/genreBooks')
def genreBooks():
    genreName = session.get('current_genre')
    books = []
    logging.info(f"https://wolnelektury.pl/api/genres/{genreName}/books/")
    response = requests.get(f'https://wolnelektury.pl/api/genres/{genreName}/books/')
    if response.status_code == 200:
        genre_books = response.json()
        logging.info(f"Fetched {len(genre_books)} books for genre {genreName}")
        books.extend(genre_books)
    else:
        logging.error(f"Failed to fetch books for genre {genreName}")
    return jsonify(books)


if __name__ == '__main__':
    app.run(debug=True)