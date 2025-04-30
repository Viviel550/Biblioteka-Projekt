import React, { useState, useEffect } from 'react';
import "../styles/Main.css";

const Library = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
  
    // Pobieranie książek z API WolneLektury
    useEffect(() => {
      const fetchBooks = async () => {
        try {
          setLoading(true);
          const response = await fetch('https://wolnelektury.pl/api/books/');
          
          if (!response.ok) {
            throw new Error('Problem z pobraniem danych');
          }
          
          const data = await response.json();
          
          // Pobieranie dodatkowych szczegółów dla książek, aby uzyskać okładki
          // Ograniczamy liczbę książek do przetworzenia, żeby uniknąć zbyt wielu zapytań
          const booksToProcess = data.slice(0, 50);
          
          const booksWithDetails = await Promise.all(
            booksToProcess.map(async (book) => {
              try {
                const detailsResponse = await fetch(book.href);
                if (detailsResponse.ok) {
                  const details = await detailsResponse.json();
                  return { ...book, ...details };
                }
                return book;
              } catch (err) {
                console.error(`Błąd pobierania szczegółów dla książki ${book.title}:`, err);
                return book;
              }
            })
          );
          
          setBooks(booksWithDetails);
          
          // Wyciągnięcie unikalnych kategorii
          const uniqueCategories = [...new Set(booksWithDetails.flatMap(book => 
            book.genres ? book.genres.map(genre => genre.name) : []
          ))];
          setCategories(uniqueCategories);
          
          setLoading(false);
        } catch (err) {
          setError(err.message);
          setLoading(false);
        }
      };
  
      fetchBooks();
    }, []);
  
    // Funkcja pomocnicza do generowania URL okładki
    const getCoverUrl = (book) => {
      // Sprawdzamy różne możliwe pola dla okładki
      if (book.simple_cover) return book.simple_cover;
      if (book.cover) return book.cover;
      if (book.cover_thumb) return book.cover_thumb;
      
      // Jeśli brak okładki, generujemy kolorową okładkę na podstawie ID książki
      const colors = ['#e67e22', '#3498db', '#2ecc71', '#9b59b6', '#e74c3c', '#1abc9c'];
      const colorIndex = book.id ? Math.abs(book.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length : 0;
      
      // Zwracamy placeholder z tekstem (faktycznie to będzie obsługiwane w CSS, ale potrzebujemy ustawić atrybut data)
      return 'placeholder';
    };
  
    // Filtrowanie książek na podstawie wyszukiwania i kategorii
    const filteredBooks = books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || 
        (book.genres && book.genres.some(genre => genre.name === selectedCategory));
      
      return matchesSearch && matchesCategory;
    });
  
    // Grupowanie książek według wybranych kolekcji
    const popularBooks = [...filteredBooks].sort(() => 0.5 - Math.random()).slice(0, 8);
    const classicsBooks = filteredBooks.filter(book => 
      book.epochs && book.epochs.some(epoch => 
        epoch.name === "Starożytność" || 
        epoch.name === "Renesans" || 
        epoch.name === "Średniowiecze"
      )
    ).slice(0, 8);
  
    if (loading) return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Ładowanie biblioteki książek...</p>
      </div>
    );
    
    if (error) return <div className="error">Błąd: {error}</div>;
  
    return (
      <div className="main">
        <header className="header">
          <h1>BiblioStream</h1>
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Szukaj książki..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="categories">
            <button 
              className={selectedCategory === 'all' ? 'active' : ''} 
              onClick={() => setSelectedCategory('all')}
            >
              Wszystkie
            </button>
            {categories.slice(0, 7).map(category => (
              <button 
                key={category}
                className={selectedCategory === category ? 'active' : ''}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </header>
  
        <section className="hero">
          <div className="hero-content">
            <h2>Odkryj świat literatury</h2>
            <p>Tysiące klasycznych dzieł dostępnych za darmo</p>
            <button className="cta-button">Zacznij czytać</button>
          </div>
        </section>
  
        {searchTerm ? (
          <section className="collection">
            <h3>Wyniki wyszukiwania</h3>
            <div className="books">
              {filteredBooks.length > 0 ? 
                filteredBooks.map(book => (
                  <div className="book" key={book.id || book.url}>
                    <div 
                      className={`book-cover-container ${getCoverUrl(book) === 'placeholder' ? 'placeholder-cover' : ''}`}
                      data-title={book.title}
                    >
                      {getCoverUrl(book) !== 'placeholder' ? (
                        <img 
                          className="book-cover" 
                          src={getCoverUrl(book)} 
                          alt={`Okładka ${book.title}`}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentNode.classList.add('placeholder-cover');
                            e.target.parentNode.setAttribute('data-title', book.title.substring(0, 25));
                          }}
                        />
                      ) : null}
                      <div className="book-title">{book.title}</div>
                    </div>
                    <p>{book.author ? (typeof book.author === 'string' ? book.author : book.author.name) : 'Autor nieznany'}</p>
                  </div>
                ))
                : <p className="no-results">Nie znaleziono książek pasujących do wyszukiwania</p>
              }
            </div>
          </section>
        ) : (
          <>
            <section className="collection">
              <h3>Popularne książki</h3>
              <div className="books">
                {popularBooks.map(book => (
                  <div className="book" key={book.id || book.url}>
                    <div 
                      className={`book-cover-container ${getCoverUrl(book) === 'placeholder' ? 'placeholder-cover' : ''}`} 
                      data-title={book.title}
                    >
                      {getCoverUrl(book) !== 'placeholder' ? (
                        <img 
                          className="book-cover" 
                          src={getCoverUrl(book)} 
                          alt={`Okładka ${book.title}`}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentNode.classList.add('placeholder-cover');
                            e.target.parentNode.setAttribute('data-title', book.title.substring(0, 25));
                          }}
                        />
                      ) : null}
                      <div className="book-title">{book.title}</div>
                    </div>
                    <p>{book.author ? (typeof book.author === 'string' ? book.author : book.author.name) : 'Autor nieznany'}</p>
                  </div>
                ))}
              </div>
            </section>
  
            <section className="collection">
              <h3>Klasyka literatury</h3>
              <div className="books">
                {classicsBooks.map(book => (
                  <div className="book" key={book.id || book.url}>
                    <div 
                      className={`book-cover-container ${getCoverUrl(book) === 'placeholder' ? 'placeholder-cover' : ''}`}
                      data-title={book.title}
                    >
                      {getCoverUrl(book) !== 'placeholder' ? (
                        <img 
                          className="book-cover" 
                          src={getCoverUrl(book)} 
                          alt={`Okładka ${book.title}`}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentNode.classList.add('placeholder-cover');
                            e.target.parentNode.setAttribute('data-title', book.title.substring(0, 25));
                          }}
                        />
                      ) : null}
                      <div className="book-title">{book.title}</div>
                    </div>
                    <p>{book.author ? (typeof book.author === 'string' ? book.author : book.author.name) : 'Autor nieznany'}</p>
                  </div>
                ))}
              </div>
            </section>
            
            <section className="collection">
              <h3>Polecane dla Ciebie</h3>
              <div className="books">
                {[...filteredBooks]
                  .sort(() => 0.5 - Math.random())
                  .slice(0, 8)
                  .map(book => (
                    <div className="book" key={book.id || book.url}>
                      <div 
                        className={`book-cover-container ${getCoverUrl(book) === 'placeholder' ? 'placeholder-cover' : ''}`}
                        data-title={book.title}
                      >
                        {getCoverUrl(book) !== 'placeholder' ? (
                          <img 
                            className="book-cover" 
                            src={getCoverUrl(book)} 
                            alt={`Okładka ${book.title}`}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentNode.classList.add('placeholder-cover');
                              e.target.parentNode.setAttribute('data-title', book.title.substring(0, 25));
                            }}
                          />
                        ) : null}
                        <div className="book-title">{book.title}</div>
                      </div>
                      <p>{book.author ? (typeof book.author === 'string' ? book.author : book.author.name) : 'Autor nieznany'}</p>
                    </div>
                  ))
                }
              </div>
            </section>
          </>
        )}
        
        <footer className="footer">
          <p>&copy; 2025 BiblioStream - Twoja biblioteka online</p>
          <p>Dane pochodzą z <a href="https://wolnelektury.pl" target="_blank" rel="noopener noreferrer">WolneLektury.pl</a></p>
        </footer>
      </div>
    );
  };
  
export default Library;
