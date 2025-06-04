
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Popular.css';

function Popular() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Add this line

    useEffect(() => {
        fetchPopularBooks();
    }, []);

    const fetchPopularBooks = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3000/popular');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Process the data to match our component structure
            const processedBooks = data.map(book => ({
                title: book.title || book.simple?.title || 'Nieznany tytuł',
                author: book.authors?.[0]?.name || book.simple?.author || 'Nieznany autor',
                slug: book.slug,
                book_id: book.book_id,
                favorite_count: book.favorite_count || 0,
                description: book.fragment_data?.html ? 
                    stripHtml(book.fragment_data.html).substring(0, 300) + '...' : 
                    (book.description || 'Brak opisu dostępnego.'),
                image: book.cover_thumb || book.simple?.cover_thumb || 
                       'https://via.placeholder.com/150x200?text=Brak+okładki',
                genres: book.genres?.map(genre => genre.name).join(', ') || 'Różne',
                url: book.url
            }));
            
            setBooks(processedBooks);
            setError(null);
        } catch (err) {
            console.error('Error fetching popular books:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to strip HTML tags
    const stripHtml = (html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    // Updated function to navigate to book details page
    const handleBookClick = (book) => {
        if (book.slug) {
            navigate(`/book/${book.slug}`);
        }
    };

    if (loading) {
        return (
            <div className="popular">
                <h2>Popularne</h2>
                <div className="loading">
                    <p>Ładowanie popularnych książek...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="popular">
                <h2>Popularne</h2>
                <div className="error">
                    <p>Błąd podczas ładowania książek: {error}</p>
                    <button onClick={fetchPopularBooks} className="retry-btn">
                        Spróbuj ponownie
                    </button>
                </div>
            </div>
        );
    }

    if (books.length === 0) {
        return (
            <div className="popular">
                <h2>Popularne</h2>
                <div className="no-books">
                    <p>Brak dostępnych książek.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="popular">
            <div className="popular-header">
                <h2>Popularne książki tego miesiąca</h2>
                <button onClick={fetchPopularBooks} className="refresh-btn">
                    Odśwież
                </button>
            </div>
            
            <ul className="books-list">
                {books.map((book, index) => (
                    <li key={book.book_id || index} className="book-item">
                        <div 
                            className="book-image-container"
                            onClick={() => handleBookClick(book)}
                            style={{ cursor: 'pointer' }}
                        >
                            <img 
                                src={book.image} 
                                alt={book.title} 
                                className="book-image"
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/150x200?text=Brak+okładki';
                                }}
                            />
                            {book.favorite_count > 0 && (
                                <div className="favorite-badge">
                                    ❤️ {book.favorite_count}
                                </div>
                            )}
                        </div>
                        
                        <div className="book-details">
                            <h3 
                                className="book-title"
                                onClick={() => handleBookClick(book)}
                                style={{ cursor: 'pointer' }}
                            >
                                {book.title}
                            </h3>
                            <p className="book-author">Autor: {book.author}</p>
                            <p className="book-genres">Gatunki: {book.genres}</p>
                            <p className="book-description">{book.description}</p>
                            
                            <div className="book-actions">
                                <button 
                                    onClick={() => handleBookClick(book)}
                                    className="view-book-btn"
                                >
                                    Zobacz książkę
                                </button>
                                {book.favorite_count > 0 && (
                                    <span className="popularity-indicator">
                                        🔥 Popularna ({book.favorite_count} polubień)
                                    </span>
                                )}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Popular;