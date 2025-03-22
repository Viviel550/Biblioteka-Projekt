import React, { useState, useEffect } from 'react';
import "../styles/Main.css";

function Main() {
    const [books, setBooks] = useState([]);

    useEffect(() => {
        fetch('/testbooks')
            .then(response => response.json())
            .then(data => setBooks(data.slice(0, 50))) // Limit to 50 books
            .catch(error => {
                console.error('Error fetching books:', error);
                alert('Wystąpił błąd podczas pobierania książek.');
            });
    }, []);

    return (
        <div className="main">
            <h2>Witaj w aplikacji!</h2>
            <div className="collection">
                <h3>Nasza Kolekcja</h3>
                <div className="books">
                    {books.map((book, index) => (
                        <div key={index} className="book">
                            <a href={book.url} target="_blank" rel="noopener noreferrer">
                                <div className="book-cover-container">
                                    <img src={`https://wolnelektury.pl/media/${book.cover}`} alt={book.title} className="book-cover" />
                                    <div className="book-title">{book.title}</div>
                                </div>
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Main;