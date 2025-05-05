import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/bookSearch.css';

function BookSearch({ onClose, onSubmit }) {
  const [searchType, setSearchType] = useState('book'); // 'book' lub 'author'
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleTypeChange = (e) => {
    setSearchType(e.target.value);
  };

  const handleTextChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleTextareaKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.target.form && e.target.form.requestSubmit();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/getBookSearch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          type: searchType, 
          query: searchText 
        })
      });
      if (!response.ok) throw new Error('Błąd podczas wysyłania zapytania');
      const data = await response.json();
      setSearchResults(data);
      console.log('Znalezione książki:', data);
    } catch (err) {
      setError(err.message);
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="bookSearch-popup-overlay">
      <div className="bookSearch-popup-content">
        <button
          className="bookSearch-close-btn"
          onClick={onClose}
          aria-label="Zamknij wyszukiwarkę"
        >
          &times;
        </button>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label>
              <input
                type="radio"
                name="searchType"
                value="book"
                checked={searchType === 'book'}
                onChange={handleTypeChange}
              />
              Książka
            </label>
            <label style={{ marginLeft: '1rem' }}>
              <input
                type="radio"
                name="searchType"
                value="author"
                checked={searchType === 'author'}
                onChange={handleTypeChange}
              />
              Autor
            </label>
          </div>
          <div>
            <textarea
              className="bookSearch-popup-textarea"
              placeholder={
                searchType === 'book'
                  ? 'Wpisz tytuł książki...'
                  : 'Wpisz nazwisko autora...'
              }
              value={searchText}
              onChange={handleTextChange}
              onKeyDown={handleTextareaKeyDown}
              autoFocus
            />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <button type="submit">Szukaj</button>
          </div>
        </form>

        <div className="search-results">
          {isLoading && <p>Wyszukiwanie...</p>}

          {error && <p className="search-error">{error}</p>}

          {!isLoading && searchResults && searchResults.results && searchResults.results.length > 0 && (
            <>
              <h3>
                Znaleziono {searchResults.count} wyników dla "{searchResults.query}":
              </h3>
              <ul className="results-list">
                {searchResults.results.map((book, idx) => (
                  <li className="book-result" key={idx}>
                    <img
                      className="search-book-cover"
                      src={`https://wolnelektury.pl/media/${book.cover}`}
                      alt={book.title}
                    />
                    <div className="book-info">
                      <h4>{book.title}</h4>
                      <p>
                        {book.author
                          ? (typeof book.author === "object"
                              ? Object.keys(book.author).join(", ")
                              : book.author)
                          : "Autor nieznany"}
                      </p>
                      <button onClick={() => navigate(`/book/${book.slug}`)} style={{ cursor: 'pointer' }}>Szczegóły</button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {!isLoading &&
            searchResults &&
            searchResults.results &&
            searchResults.results.length === 0 && (
              <p>Brak wyników dla podanego zapytania.</p>
            )}
        </div>
       

      </div>
    </div>
  );
}

export default BookSearch;
