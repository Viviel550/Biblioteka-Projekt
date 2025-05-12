from flask import Flask, jsonify, request, session
import requests, logging, sys, os
from blueprints.login import auth
from blueprints.categories import categories_bp
from blueprints.register import reg
from blueprints.workerpanel import workerpanel
from blueprints.bookDetails import bookDetails_bp
from blueprints.bookSearch import bookSearch_bp
from blueprints.adminpanel import adminpanel
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
app = Flask(__name__)
app.register_blueprint(workerpanel)
app.secret_key = 'lubiekotki123'

# Register blueprints
app.register_blueprint(adminpanel)
app.register_blueprint(auth)
app.register_blueprint(categories_bp)  
app.register_blueprint(reg)
app.register_blueprint(bookDetails_bp)
app.register_blueprint(bookSearch_bp)
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