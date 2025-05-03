import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../styles/bookDetails.css';
import Rating from '@mui/material/Rating';

function OpinionPopup({ onClose, onSubmit }) {
  const [opinion, setOpinion] = useState('');
  const [rating, setRating] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(opinion, rating);
    setOpinion('');
    setRating(1);
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
      <button className="close-btn" onClick={onClose} style={{ padding: 5 }}>X</button>
        <form onSubmit={handleSubmit}>
          <label>
            Ocena:
            <Rating
              name="star-rating"
              value={rating}
              onChange={(event, newValue) => setRating(newValue < 1 ? 1 : newValue)}
              max={5}
              required
            />
          </label>
          <label>
            <textarea
              className='popup-textarea'
              value={opinion}
              onChange={e => setOpinion(e.target.value)}
              placeholder="Twoja opinia"
              required
            />
          </label>          
          <button type="submit">Wyślij</button>
        </form>
      </div>
    </div>
  );
}

function BookDetails() {
  const { slug } = useParams();
  const [details, setDetails] = useState({});
  const [error, setError] = useState(false);
  const [opinions, setOpinions] = useState([]);
  const [showOpinionPopup, setShowOpinionPopup] = useState(false);
  const [average, setAverage] = useState(null);
  const [ratingsCount, setRatingsCount] = useState(0);

  const token = localStorage.getItem('token');

  //uzyskanie user_id z tokenu
  let user_Id_token = null;
  let decodedToken = null;
  try {
    const token = localStorage.getItem('token');
    if (token) {
      decodedToken = jwtDecode(token);
      user_Id_token = decodedToken.user_id;
    }
  } catch (e) {
    user_Id_token = null;
    decodedToken = null;
  }



  //pobranie szczegółów
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

  //pobranie opinii
  const fetchOpinions = () =>  {
    if (!slug) return;

    fetch(`/getBookOpinions?slug=${encodeURIComponent(slug)}`)
      .then(response => response.json())
      .then((data) => {
        setOpinions(data);
        console.log('Otrzymane opinie:', data);
      })
      .catch(error => {
        handleError(error);
      });
  };
  //odświeżenie przy dodaniu lub usunięciu opini
  useEffect(() => {
    if (!slug) return;
    fetchOpinions();
    fetchAvarage();
  }, [slug]);

  //pobranie średniej oceny
  const fetchAvarage = () =>  {
    if (!slug) return;

    fetch(`/getAvgRating?slug=${encodeURIComponent(slug)}`)
      .then(response => response.json())
      .then((data) => {
        if (data && data.length > 0) {
          setAverage(data[0].avarage);
          setRatingsCount(data[0].count);
        } else {
          setAverage(null);
          setRatingsCount(0);
        }
        console.log('Otrzymane oceny:', data);
      })
      .catch(error => {
        handleError(error);
      });
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

  //dodanie opini
  const handleClickAddOpinion = (slug) => {
    if (!token) {
      alert('Aby dodać opinię musisz się zalogować!');
      return;
    }
    if (decodedToken.rola==="Bibliotekarz"){
      alert('Nie możesz dodawać komentarzy.');
      return;
    }
    setShowOpinionPopup(true);
  };
  const handleOpinionSubmit = (opinionText, rating) => {
    fetch('/addOpinion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ slug, opinionText, rating })
    })
    .then(response => response.json())
    .then(data => {
      alert(data.message || data.error);
      setShowOpinionPopup(false);
      fetchOpinions();
      fetchAvarage();
    })
  };

  //usunięcie opini
  const handleDeleteOpinion = (review_id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę opinię?')) return;
    fetch('/deleteOpinion', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ review_id })
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message || data.error);
      fetchOpinions();
      fetchAvarage();
    })
    .catch(err => alert('Błąd podczas usuwania opinii'));
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
          <h2 className="details-avarage">
            {average !== null
              ? `Średnia ocen: ${average} (${ratingsCount} głosów)`
              : 'Brak ocen'}
          </h2>
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
      <div className="opinions-section">
        <h3 className="opinions-title">Opinie</h3>
        <div className='opinions-add'>
          <button onClick={() => handleClickAddOpinion(slug)}>Dodaj opinie</button>
        </div>
        {opinions.length === 0 ? (
          <h3 className="opinions-title">Brak opinii.</h3>
        ) : (
          <ul className="opinions-list">
            {opinions.map(opinion => (
              <li key={opinion.review_id} className="opinion-item">
                <div className="opinion-header">
                  <span><strong>Autor:</strong> {opinion.nickname}</span>
                  <span><strong>Ocena:</strong> {opinion.rating} / 5</span>
                  <span><strong>Data:</strong> {opinion.review_date ? new Date(opinion.review_date).toLocaleDateString() : ""}</span>
                </div>
                <div className="opinion-content">
                  {opinion.review}
                </div>
                {((user_Id_token && opinion.user_id === user_Id_token) || decodedToken.rola === "Bibliotekarz") && (
                  <button
                    className="delete-opinion-btn"
                    onClick={() => handleDeleteOpinion(opinion.review_id)}
                    style={{padding: 5}}
                  >
                    Usuń
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {showOpinionPopup && (
        <OpinionPopup
          onClose={() => setShowOpinionPopup(false)}
          onSubmit={handleOpinionSubmit}
        />
      )}
    </div>
  )
}

export default BookDetails;