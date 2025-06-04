from flask import Blueprint, jsonify, request, session
import requests, logging, psycopg
from config import Config

popular_bp = Blueprint('popular', __name__)

# Configure logging
logging.basicConfig(level=logging.INFO)

@popular_bp.route('/popular')
def GetPopular():
    try:
        with psycopg.connect(**Config.get_db_connection_params()) as conn:
            with conn.cursor() as cur:
                # Get popular books from materialized view
                cur.execute("""
                    SELECT book_id, slug, favorite_count
                    FROM monthly_popular_books
                    ORDER BY favorite_count DESC
                    LIMIT 10
                """)
                
                popular_books_db = cur.fetchall()
                popular_books = []
                
                # If we have books from database, fetch their details from API
                if popular_books_db:
                    for book_id, slug, favorite_count in popular_books_db:
                        try:
                            # Fetch book details from Wolne Lektury API using slug
                            response = requests.get(f'https://wolnelektury.pl/api/books/{slug}/')
                            if response.status_code == 200:
                                book_data = response.json()
                                book_data['favorite_count'] = favorite_count
                                book_data['book_id'] = book_id
                                book_data['slug'] = slug
                                popular_books.append(book_data)
                            else:
                                logging.warning(f"Failed to fetch book details for slug: {slug}")
                        except Exception as e:
                            logging.error(f"Error fetching book {slug}: {str(e)}")
                
                return jsonify(popular_books)
                
    except Exception as e:
        logging.error(f"Database error: {str(e)}")
        # Fallback to API if database fails
        try:
            response = requests.get('https://wolnelektury.pl/api/books/popular/')
            if response.status_code == 200:
                popular_books_response = response.json()
                logging.info(f"Fetched {len(popular_books_response)} popular books from API (database fallback)")
                return jsonify(popular_books_response[:10])
            else:
                return jsonify({"error": "Unable to fetch popular books"}), 500
        except Exception as api_error:
            logging.error(f"API fallback also failed: {str(api_error)}")
            return jsonify({"error": "Service temporarily unavailable"}), 503
