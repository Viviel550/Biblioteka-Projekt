from flask import Flask, jsonify
import requests

app = Flask(__name__)

# Members API Route
@app.route('/testbooks')
def testbooks():
    authors = ["arthur-conan-doyle", "adam-asnyk"]
    books = []

    for author in authors:
        response = requests.get(f'https://wolnelektury.pl/api/authors/{author}/fragments/')
        if response.status_code == 200:
            books.extend(response.json())

    return jsonify(books)

if __name__ == '__main__':
    app.run(debug=True)