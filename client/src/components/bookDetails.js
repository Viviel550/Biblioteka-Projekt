import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../styles/bookDetails.css';
import Rating from '@mui/material/Rating';

function FavoritesPopup({ message, isSuccess, onClose }) {
  useEffect(() => {
    // Auto-close after 3 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="popup-overlay">
      <div className={`favorites-popup-content ${isSuccess ? 'success' : 'error'}`}>
        <div className="favorites-popup-header">
          <h3>{isSuccess ? '✅ Sukces!' : '❌ Błąd!'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="favorites-popup-body">
          <p>{message}</p>
        </div>
        <div className="favorites-popup-footer">
          <button 
            className={`favorites-popup-btn ${isSuccess ? 'success-btn' : 'error-btn'}`}
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

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
        <button className="close-btn" onClick={onClose}>
          <span>×</span>
        </button>
        <h3>Dodaj opinię</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Ocena:</label>
            <Rating
              name="star-rating"
              value={rating}
              onChange={(event, newValue) => setRating(newValue < 1 ? 1 : newValue)}
              max={5}
              size="large"
              sx={{
                '& .MuiRating-iconFilled': {
                  color: '#e67e22',
                },
                '& .MuiRating-iconHover': {
                  color: '#d35400',
                },
              }}
              required
            />
          </div>
          <div className="form-group">
            <label>Twoja opinia:</label>
            <textarea
              className="popup-textarea"
              value={opinion}
              onChange={e => setOpinion(e.target.value)}
              placeholder="Podziel się swoją opinią o książce..."
              required
            />
          </div>
          <div className="popup-buttons">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Anuluj
            </button>
            <button type="submit" className="btn-primary">
              Wyślij opinię
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BookDetails() {
  const { slug } = useParams();
  const [details, setDetails] = useState({});
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [opinions, setOpinions] = useState([]);
  const [showOpinionPopup, setShowOpinionPopup] = useState(false);
  const [average, setAverage] = useState(null);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [showFavoritesPopup, setShowFavoritesPopup] = useState(false);
  const [favoritesMessage, setFavoritesMessage] = useState('');
  const [favoritesIsSuccess, setFavoritesIsSuccess] = useState(false);
  const token = localStorage.getItem('token');

  //uzyskanie user_id z tokenu
  let user_Id_token = null;
  let worker_Id_token = null;
  let decodedToken = null;
  try {
    const token = localStorage.getItem('token');
    if (token) {
      decodedToken = jwtDecode(token);
      user_Id_token = decodedToken.user_id;
      worker_Id_token = decodedToken.worker_id;
    }
  } catch (e) {
    user_Id_token = null;
    worker_Id_token = null;
    decodedToken = null;
  }

  //pobranie szczegółów
  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    fetch('/getBookDetails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ slug })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.error) {
        throw new Error(data.error);
      }
      setDetails(data);
      setLoading(false);
      console.log('Otrzymane dane:', data);
    })
    .catch(error => {
      handleError(error);
      setLoading(false);
    });
  }, [slug]);

  const handleError = (error) => {
    console.error('Error:', error);
    setFavoritesMessage('Wystąpił błąd podczas pobierania danych.');
    setFavoritesIsSuccess(false);
    setShowFavoritesPopup(true);
    setError(true);
  };

  //pobranie opinii
  const fetchOpinions = () => {
    if (!slug) return;

    fetch(`/getBookOpinions?slug=${encodeURIComponent(slug)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }
        setOpinions(Array.isArray(data) ? data : []);
        console.log('Otrzymane opinie:', data);
      })
      .catch(error => {
        console.error('Błąd podczas pobierania opinii:', error);
        setOpinions([]);
      });
  };

  //pobranie średniej oceny
  const fetchAvarage = () => {
    if (!slug) return;

    fetch(`/getAvgRating?slug=${encodeURIComponent(slug)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }
        if (Array.isArray(data) && data.length > 0) {
          setAverage(data[0].avarage);
          setRatingsCount(data[0].count);
        } else {
          setAverage(null);
          setRatingsCount(0);
        }
        console.log('Otrzymane oceny:', data);
      })
      .catch(error => {
        console.error('Błąd podczas pobierania średniej:', error);
        setAverage(null);
        setRatingsCount(0);
      });
  };

  //odświeżenie przy dodaniu lub usunięciu opini
  useEffect(() => {
    if (!slug) return;
    fetchOpinions();
    fetchAvarage();
  }, [slug]);

  //dodanie do ulubionych
  const handleClickFavorites = (slug) => {
    if (!token) {
      setFavoritesMessage('Aby dodać książkę do ulubionych musisz się zalogować!');
      setFavoritesIsSuccess(false);
      setShowFavoritesPopup(true);
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
    .then(data => {
      const message = data.message || data.error;
      const isSuccess = !data.error;
      
      setFavoritesMessage(message);
      setFavoritesIsSuccess(isSuccess);
      setShowFavoritesPopup(true);
    })
    .catch(error => {
      setFavoritesMessage('Wystąpił błąd podczas dodawania do ulubionych.');
      setFavoritesIsSuccess(false);
      setShowFavoritesPopup(true);
    });
  };

  //dodanie opini
  const handleClickAddOpinion = (slug) => {
    if (!token) {
      setFavoritesMessage('Aby dodać opinię musisz się zalogować!');
      setFavoritesIsSuccess(false);
      setShowFavoritesPopup(true);
      return;
    }
    if (decodedToken && decodedToken.rola === "Bibliotekarz") {
      setFavoritesMessage('Nie możesz dodawać komentarzy.');
      setFavoritesIsSuccess(false);
      setShowFavoritesPopup(true);
      return;
    }
    setShowOpinionPopup(true);
  };

  const handleOpinionSubmit = (opinionText, rating) => {
    if (!opinionText.trim()) {
      setFavoritesMessage('Opinia nie może być pusta!');
      setFavoritesIsSuccess(false);
      setShowFavoritesPopup(true);
      return;
    }
    if (!rating || rating < 1 || rating > 5) {
      setFavoritesMessage('Ocena musi być w zakresie 1-5!');
      setFavoritesIsSuccess(false);
      setShowFavoritesPopup(true);
      return;
    }

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
      const message = data.message || data.error;
      const isSuccess = !data.error;
      
      setFavoritesMessage(message);
      setFavoritesIsSuccess(isSuccess);
      setShowFavoritesPopup(true);
      
      if (isSuccess) {
        setShowOpinionPopup(false);
        fetchOpinions();
        fetchAvarage();
      }
    })
    .catch(error => {
      setFavoritesMessage('Wystąpił błąd podczas dodawania opinii.');
      setFavoritesIsSuccess(false);
      setShowFavoritesPopup(true);
    });
  };

  //usunięcie opini
  const handleDeleteOpinion = (review_id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę opinię?')) return;
    
    if (!token) {
      setFavoritesMessage('Musisz być zalogowany aby usunąć opinię!');
      setFavoritesIsSuccess(false);
      setShowFavoritesPopup(true);
      return;
    }

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
      const message = data.message || data.error;
      const isSuccess = !data.error;
      
      setFavoritesMessage(message);
      setFavoritesIsSuccess(isSuccess);
      setShowFavoritesPopup(true);
      
      if (isSuccess) {
        fetchOpinions();
        fetchAvarage();
      }
    })
    .catch(err => {
      setFavoritesMessage('Błąd podczas usuwania opinii');
      setFavoritesIsSuccess(false);
      setShowFavoritesPopup(true);
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Ładowanie szczegółów książki...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h1>Strona Tymczasowo Niedostępna</h1>
        <p>Wystąpił błąd podczas ładowania danych.</p>
      </div>
    );
  }

  return (
    <div className="book-details-main">
      <div className="book-details-container">
        <div className="book-details-cover">
          {details.cover ? (
            <img
              src={details.cover}
              alt={`Okładka książki ${details.title}`}
              className="detail-cover"
            />
          ) : (
            <div className="placeholder-cover">
              <span>Brak okładki</span>
            </div>
          )}
        </div>
        
        <div className="book-details-info">
          <h1 className="details-title">{details.title || "Brak tytułu"}</h1>
          
          <div className="details-meta">
            <p className="details-author">
              <strong>Autor:</strong> {details.authors && details.authors.length > 0
                ? details.authors.map(author => author.name).join(', ')
                : 'Brak autora'}
            </p>
            
            {details.translators && details.translators.length > 0 && (
              <p className="details-translation">
                <strong>Tłumaczenie:</strong> {details.translators.map(t => t.name).join(', ')}
              </p>
            )}
            
            <div className="details-rating">
              {average !== null && average > 0 ? (
                <>
                  <Rating 
                    value={parseFloat(average)} 
                    readOnly 
                    precision={0.1}
                    sx={{
                      '& .MuiRating-iconFilled': {
                        color: '#e67e22',
                      },
                    }}
                  />
                  <span className="rating-text">
                    {parseFloat(average).toFixed(1)} ({ratingsCount} {ratingsCount === 1 ? 'głos' : ratingsCount < 5 ? 'głosy' : 'głosów'})
                  </span>
                </>
              ) : (
                <span className="no-rating">Brak ocen</span>
              )}
            </div>
          </div>

          {details.description && (
            <div className="details-description">
              <h4>Opis:</h4>
              <p>{details.description}</p>
            </div>
          )}

          <div className="details-links">
            {details.pdf ? (
              <a 
                href={details.pdf} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary btn-large"
              >
                📖 Czytaj Online
              </a>
            ) : (
              <button 
                className="btn-primary btn-large disabled"
                disabled
                title="PDF niedostępny"
              >
                📖 Czytaj Online
              </button>
            )}
            
            {details.epub ? (
              <a 
                href={details.epub} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-secondary btn-large"
                download
              >
                📥 Pobierz EPUB
              </a>
            ) : (
              <button 
                className="btn-secondary btn-large disabled"
                disabled
                title="EPUB niedostępny"
              >
                📥 Pobierz EPUB
              </button>
            )}
          </div>
          
          {/* Conditionally render favorites button only if user has user_id (not worker_id) */}
          {user_Id_token && !worker_Id_token && (
            <div className='details-favorites'>
              <button 
                onClick={() => handleClickFavorites(slug)}
                className="btn-secondary btn-large"
              >
                ❤️ Dodaj do ulubionych
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="opinions-section">
        <div className="opinions-header">
          <h3 className="opinions-title">Opinie czytelników</h3>
          {user_Id_token && !worker_Id_token && (
            <button 
              onClick={() => handleClickAddOpinion(slug)}
              className="btn-primary"
            >
              ✍️ Dodaj opinię
            </button>
          )}
        </div>

        {opinions.length === 0 ? (
          <div className="no-opinions">
            <p>Brak opinii. Bądź pierwszy i podziel się swoją opinią!</p>
          </div>
        ) : (
          <div className="opinions-list">
            {opinions.map((opinion, index) => (
              <div key={opinion.review_id || index} className="opinion-item">
                <div className="opinion-header">
                  <div className="opinion-user">
                    <strong>{opinion.nickname || 'Anonim'}</strong>
                    <Rating 
                      value={opinion.rating || 0} 
                      readOnly 
                      size="small"
                      sx={{
                        '& .MuiRating-iconFilled': {
                          color: '#e67e22',
                        },
                      }}
                    />
                  </div>
                  <div className="opinion-date">
                    {opinion.review_date ? new Date(opinion.review_date).toLocaleDateString('pl-PL') : ""}
                  </div>
                </div>
                
                <div className="opinion-content">
                  {opinion.review || ''}
                </div>
                
                {((user_Id_token && opinion.user_id === user_Id_token) || 
                  (decodedToken && decodedToken.rola === "Bibliotekarz")) && (
                  <button
                    className="delete-opinion-btn"
                    onClick={() => handleDeleteOpinion(opinion.review_id)}
                    title="Usuń opinię"
                  >
                    🗑️ Usuń
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {showOpinionPopup && (
        <OpinionPopup
          onClose={() => setShowOpinionPopup(false)}
          onSubmit={handleOpinionSubmit}
        />
      )}
      
      {showFavoritesPopup && (
        <FavoritesPopup
          message={favoritesMessage}
          isSuccess={favoritesIsSuccess}
          onClose={() => setShowFavoritesPopup(false)}
        />
      )}
    </div>
  );
}

export default BookDetails;