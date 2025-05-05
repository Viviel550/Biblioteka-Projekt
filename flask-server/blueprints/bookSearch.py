from flask import Blueprint, jsonify, request, session
import requests, logging

bookSearch_bp = Blueprint('bookSearch', __name__)

logging.basicConfig(level=logging.INFO)

#pobierz opinie
@bookSearch_bp.route('/getBookSearch', methods=['POST'])
def getBookSearch():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Brak danych JSON'}), 400

    search_type = data.get('type')  # 'book' lub 'author'
    search_query = data.get('query')  # tekst do wyszukania
    limit = data.get('limit', 50)  # domyślny limit wyników

    if not search_type or search_type not in ['book', 'author']:
        logging.error("Nieprawidłowy typ wyszukiwania")
        return jsonify({'error': 'Nieprawidłowy typ wyszukiwania'}), 400

    if not search_query or len(search_query.strip()) < 2:
        logging.error("Za krótki ciąg wyszukiwania")
        return jsonify({'error': 'Wpisz co najmniej 2 znaki'}), 400

    try:
        # wszystkie książki
        response = requests.get('https://wolnelektury.pl/api/books/')
        response.raise_for_status()
        all_books = response.json()

        # Filtruj książki
        filtered_books = []
        search_lower = search_query.lower()
        
        for book in all_books:
          # Pobierz podstawowe dane
          title = book.get('title', '')
          author = book.get('author', {})
          

          # Filtrowanie po tytule
          if search_type == 'book' and search_lower in title.lower():
              filtered_books.append({
                  'title': title,
                  'author': author,
                  'cover': book.get('cover'),
                  'href': book.get("href"),
                  'slug': book.get("slug")
              })
          
          # Filtrowanie po autorze
          elif search_type == 'author' and search_lower in author.lower():
              filtered_books.append({
                  'title': title,
                  'author': author,
                  'cover': book.get('cover'),
                  'href': book.get("href"),
                  'slug': book.get("slug")
              })

          # Ogranicz wyniki
          if len(filtered_books) >= limit:
              break

        logging.info(f"Znaleziono {len(filtered_books)} wyników dla {search_type}: {search_query}")
        return jsonify({
            'results': filtered_books,
            'count': len(filtered_books),
            'search_type': search_type,
            'query': search_query
        })

    except requests.exceptions.RequestException as e:
        logging.error(f"Błąd połączenia z API: {str(e)}")
        return jsonify({'error': 'Problem z połączeniem z serwisem'}), 500
    except Exception as e:
        logging.error(f"Błąd serwera: {str(e)}")
        return jsonify({'error': 'Wewnętrzny błąd serwera'}), 500

    


