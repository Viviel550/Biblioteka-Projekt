import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles/Main.css";

const Library = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchResults, setSearchResults] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [searchType, setSearchType] = useState('book'); // 'book' or 'author'
    const [isSearchActive, setIsSearchActive] = useState(false);
    const navigate = useNavigate();
  
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

    // Function to handle book click navigation
    const handleBookClick = (book) => {
      if (book.slug) {
        navigate(`/book/${book.slug}`);
      } else {
        console.error('No slug available for book:', book.title);
      }
    };

    // Handle search API call
    const performSearch = async (query, type) => {
      if (!query.trim() || query.length < 2) {
        setSearchResults(null);
        setIsSearchActive(false);
        return;
      }

      setSearchLoading(true);
      setSearchError(null);
      setIsSearchActive(true);

      try {
        const response = await fetch('/getBookSearch', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ 
            type: type, 
            query: query 
          })
        });
        
        if (!response.ok) throw new Error('Błąd podczas wyszukiwania');
        
        const data = await response.json();
        setSearchResults(data);
        console.log('Znalezione książki:', data);
      } catch (err) {
        setSearchError(err.message);
        setSearchResults(null);
      } finally {
        setSearchLoading(false);
      }
    };

    // Handle search input change with debounce
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        if (searchTerm.trim().length >= 2) {
          performSearch(searchTerm, searchType);
        } else if (searchTerm.trim().length === 0) {
          setSearchResults(null);
          setIsSearchActive(false);
        }
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }, [searchTerm, searchType]);

    // Handle search input click (open search mode)
    const handleSearchClick = () => {
      setIsSearchActive(true);
    };

    // Handle search type change
    const handleSearchTypeChange = (type) => {
      setSearchType(type);
      if (searchTerm.trim().length >= 2) {
        performSearch(searchTerm, type);
      }
    };
    const scrollToCollections = () => {
      const collectionsElement = document.querySelector('.collection');
      if (collectionsElement) {
        collectionsElement.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    };
    // Clear search
    const clearSearch = () => {
      setSearchTerm('');
      setSearchResults(null);
      setIsSearchActive(false);
      setSearchError(null);
    };
  
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
  
    // Filtrowanie książek na podstawie kategorii (bez wyszukiwania, bo mamy dedykowaną funkcję)
    const filteredBooks = books.filter(book => {
      const matchesCategory = selectedCategory === 'all' || 
        (book.genres && book.genres.some(genre => genre.name === selectedCategory));
      
      return matchesCategory;
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

    // Component for rendering individual books
    const BookItem = ({ book }) => (
      <div 
        className="book" 
        onClick={() => handleBookClick(book)}
        style={{ cursor: 'pointer' }}
        title={`Zobacz szczegóły: ${book.title}`}
      >
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
    );

    // Component for search result books
    const SearchResultItem = ({ book }) => (
      <div 
        className="search-result-book" 
        onClick={() => handleBookClick(book)}
        title={`Zobacz szczegóły: ${book.title}`}
      >
        <div className="search-book-cover">
          {book.cover ? (
            <img
              src={`https://wolnelektury.pl/media/${book.cover}`}
              alt={book.title}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<div class="search-placeholder-cover">' + book.title.substring(0, 15) + '</div>';
              }}
            />
          ) : (
            <div className="search-placeholder-cover">
              {book.title.substring(0, 15)}
            </div>
          )}
        </div>
        <div className="search-book-info">
          <h4>{book.title}</h4>
          <p>
            {book.author
              ? (typeof book.author === "object"
                  ? Object.keys(book.author).join(", ")
                  : book.author)
              : "Autor nieznany"}
          </p>
        </div>
      </div>
    );

    if (loading) return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Ładowanie biblioteki książek...</p>
      </div>
    );
    
    if (error) return <div className="error">Błąd: {error}</div>;

    return (
      <div className="main">
        <header className="header-main">
          <h1>BiblioStream</h1>
          
          <div className="search-bar">
            <input
              type="text"
              placeholder="Szukaj książki lub autora..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onClick={handleSearchClick}
            />
            {searchLoading && <div className="search-spinner-inline"></div>}
            {searchTerm && (
              <button className="clear-search-inline" onClick={clearSearch}>
                ✕
              </button>
            )}
          </div>

          {/* Search type selector - only show when search is active */}
          {isSearchActive && (
            <div className="search-type-selector">
              <label className={`search-type-option ${searchType === 'book' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="searchType"
                  value="book"
                  checked={searchType === 'book'}
                  onChange={(e) => handleSearchTypeChange(e.target.value)}
                />
                📚 Książka
              </label>
              <label className={`search-type-option ${searchType === 'author' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="searchType"
                  value="author"
                  checked={searchType === 'author'}
                  onChange={(e) => handleSearchTypeChange(e.target.value)}
                />
                ✍️ Autor
              </label>
            </div>
          )}
          {!isSearchActive && (
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
    )}
        </header>

        {isSearchActive && (
          <section className="search-results-section">
            <div className="search-results-header">
              <h3>
                {searchLoading ? (
                  "Wyszukiwanie..."
                ) : searchError ? (
                  "Błąd wyszukiwania"
                ) : searchResults && searchResults.results ? (
                  `Znaleziono ${searchResults.count} wyników dla "${searchResults.query}"`
                ) : searchTerm.length < 2 ? (
                  "Wpisz co najmniej 2 znaki"
                ) : (
                  "Brak wyników"
                )}
              </h3>
              <button className="close-search-btn" onClick={clearSearch}>
                Zamknij wyszukiwanie
              </button>
            </div>

            {searchError && (
              <div className="search-error">
                <p>❌ {searchError}</p>
              </div>
            )}

            {!searchLoading && searchResults && searchResults.results && searchResults.results.length > 0 && (
              <div className="search-results-grid">
                {searchResults.results.map((book, idx) => (
                  <SearchResultItem key={idx} book={book} />
                ))}
              </div>
            )}

            {!searchLoading && searchResults && searchResults.results && searchResults.results.length === 0 && (
              <div className="no-search-results">
                <p>🔍 Brak wyników dla podanego zapytania.</p>
                <p>Spróbuj zmienić wyszukiwane słowa lub typ wyszukiwania.</p>
              </div>
            )}
          </section>
        )}

        {!isSearchActive && (
          <section className="hero">
            <div className="hero-content">
              <h2>Odkryj świat literatury</h2>
              <p>Tysiące klasycznych dzieł dostępnych za darmo</p>
              <button className="cta-button" onClick={scrollToCollections}>
                Zacznij czytać
              </button>
            </div>
          </section>
        )}

        {!isSearchActive && (
          <>
            <section className="collection">
              <h3>Popularne książki</h3>
              <div className="books">
                {popularBooks.map(book => (
                  <BookItem key={book.id || book.url} book={book} />
                ))}
              </div>
            </section>

            <section className="collection">
              <h3>Klasyka literatury</h3>
              <div className="books">
                {classicsBooks.map(book => (
                  <BookItem key={book.id || book.url} book={book} />
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
                    <BookItem key={book.id || book.url} book={book} />
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