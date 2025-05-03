import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Categories.css';

function GetGenres() {
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('artykul');
  const [books, setBooks] = useState([]);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Pobieranie gatunków
  useEffect(() => {
      fetch('/genres')
          .then(response => response.json())
          .then((data) => {
            setGenres(data); 
            const defaultGenre = data.find((genre) => genre.name === 'Artykuł');
            if (defaultGenre) {
              setSelectedGenre(defaultGenre.slug); 
            }
          })
          .catch(error => handleError(error));
  }, []);

  // Pobieranie książek przy zmianie gatunku
  useEffect(() => {
      if (selectedGenre) {
        setIsLoading(true); 
        setBooks([]); 

          fetch('/sendGenre', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ genre: selectedGenre })
          })
          .then(() => fetch('/genreBooks'))
          .then(response => response.json())
          .then((data) => {
            //setBooks(data.slice(0, 18));
            setBooks(data);
            setIsLoading(false); // Koniec ładowania
          })
          .catch((error) => {
            handleError(error);
            setIsLoading(false); // Koniec ładowania
          });
          
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
      return <div className="errorCategories"><h1>Strona Tymczasowo Niedostępna</h1></div>;
  }

  return (
      <div className="main">
          <div className="collectionCategories">             
              <div className="genres">
                <div className='genres-title'>
                  <h1>Dostępne gatunki</h1>
                </div>               
                <div className='genres-module'>
                  {genres.map((genre, index) => (
                      <div key={index} className="genre">
                          <button onClick={() => handleGenreClick(genre.slug)}>
                              {genre.name}
                          </button>
                      </div>
                  ))}
                </div>
              </div>
              {selectedGenre && (
                    <div className="books-section">
                      <h3>Książki z gatunku: {
                        genres.find(g => g.slug === selectedGenre)?.name
                      }</h3>
                      {isLoading ? (
                      <div className="loading-message">
                        Ładowanie książek...
                      </div>
                      ) : books.length > 0 ? (
                        <div className="books">
                          {books.map((book, index) => (
                            <div key={index} className="book">
                              <div onClick={() => navigate(`/book/${book.slug}`)} style={{ cursor: 'pointer' }}>
                                <div className="book-cover-container">
                                  <img 
                                    src={`https://wolnelektury.pl/media/${book.cover}`} 
                                    alt={book.title} 
                                    className="book-cover" 
                                  />
                                  <div className="book-title">{book.title}</div>
                                </div>
                              </div>
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

  
}

export default GetGenres;