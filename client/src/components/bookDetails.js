import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../styles/bookDetails.css';

function BookDetails() {
  const { slug } = useParams();
  const [details, setDetails] = useState({});
  const [error, setError] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch('/getBookDetails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ slug })
    })
    .then(response => response.json())
    .then((data) => {
      setDetails(data);
      console.log('Otrzymane dane:', data);
    })
    .catch(error => {
      handleError(error);
    });
  }, [slug]);

  const handleError = (error) => {
    console.error('Error:', error);
    alert('Wystąpił błąd podczas pobierania danych.');
    setError(true);
  };

  //dodanie do ulubionych
  const handleClickFavorites = (slug) => {
    if (!token) {
      alert('Aby dodać książkę do ulubionych musisz się zalogować!');
      return;
    }

    fetch('/addToFavorites', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ slug })
    })
    .then(response => response.json())
    .then(data => alert(data.message || data.error));
  };


  if (error) {
      return <div className="errorCategories"><h1>Strona Tymczasowo Niedostępna</h1></div>;
  }

  return (
    <div className="book-details-main">
      <div className="book-details-container">
        <div className="book-details-cover">
          <img
            src={details.cover}
            alt="Okładka"
            className="detail-cover"
          />
        </div>
        <div className="book-details-info">
          <h1 className="details-title">{details.title || "Brak tytułu"}</h1>
          <h2 className="details-author">
            Autor: {details.authors && details.authors.length > 0
              ? details.authors.map(author => author.name).join(', ')
              : 'Brak autora'}
          </h2>
          {details.translators && details.translators.length > 0 && (
            <h3 className="details-translation">
              Tłumaczenie: {details.translators.map(t => t.name).join(', ')}
            </h3>
          )}
          {details.description && (
            <div className="details-description">
              <h4>Opis:</h4>
              <p>{details.description}</p>
            </div>
          )}
          <div className="details-link">
            <a href={details.url} target="_blank" rel="noopener noreferrer">
              Czytaj lub pobierz
            </a>
          </div>
          <div className='details-favorites'>
            <button onClick={() => handleClickFavorites(slug)}>Dodaj do ulubionych</button>
          </div>
        </div>
      </div>
      <div className='details-opinions'>
          <h3>Opinie</h3>
      </div>
    </div>
  )
}

export default BookDetails;