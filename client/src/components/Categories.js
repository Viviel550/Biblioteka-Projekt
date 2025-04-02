import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './Header';
import Login from './Login';
import Main from './Main';
import Popular from './Popular';
import Categories from './Categories';
import '../styles/Categories.css';

function GetGenres() {
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [books, setBooks] = useState([]);
  const [error, setError] = useState(false);

  // Pobieranie gatunków
  useEffect(() => {
      fetch('/genres')
          .then(response => response.json())
          .then(data => setGenres(data))
          .catch(error => handleError(error));
  }, []);

  // Pobieranie książek przy zmianie gatunku
  useEffect(() => {
      if (selectedGenre) {
          fetch('/sendGenre', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ genre: selectedGenre })
          })
          .then(() => fetch('/genreBooks'))
          .then(response => response.json())
          .then(data => setBooks(data.slice(0, 50)))
          .catch(error => handleError(error));
      }
  }, [selectedGenre]);

  const handleError = (error) => {
      console.error('Error:', error);
      alert('Wystąpił błąd podczas pobierania danych.');
      setError(true);
  };

  const handleGenreClick = (genreSlug) => {
      setSelectedGenre(genreSlug);
  };

  if (error) {
      return <div className="error"><h1>Strona Tymczasowo Niedostępna</h1></div>;
  }

  return (
      <div className="main">
          <div className="collection">
              <h3>Dostępne gatunki</h3>
              <div className="genres">
                {genres.map((genre, index) => (
                    <div key={index} className="genre">
                        <button onClick={() => handleGenreClick(genre.slug)}>
                            {genre.name}
                        </button>
                    </div>
                ))}
              </div>
              {selectedGenre && (
                    <div className="books-section">
                      <h3>Książki z gatunku: {
                        genres.find(g => g.slug === selectedGenre)?.name
                      }</h3>
                      {books.length > 0 ? (
                        <div className="books">
                          {books.map((book, index) => (
                            <div key={index} className="book">
                              <a href={book.url} target="_blank" rel="noopener noreferrer">
                                <div className="book-cover-container">
                                  <img 
                                    src={`https://wolnelektury.pl/media/${book.cover}`} 
                                    alt={book.title} 
                                    className="book-cover" 
                                  />
                                  <div className="book-title">{book.title}</div>
                                </div>
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>Brak dostępnych książek</p>
                      )}
                    </div>
                  )}
          </div>
      </div>
  )

  return (
    <Router>
      <div className="Wrapper">
        <Header />
        <div className="Content">
          <Routes>
            <Route path="/" element={<Main />} />
            <Route path="/popularne" element={<Popular />} />
            <Route path="/kategorie" element={<Categories />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default GetGenres;