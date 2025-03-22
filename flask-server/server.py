from flask import Flask, jsonify
import requests
import logging

app = Flask(__name__)

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

if __name__ == '__main__':
    app.run(debug=True)