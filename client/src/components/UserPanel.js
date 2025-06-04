import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../styles/UserPanel.css';

function UserPanel() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [email, setEmail] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const decodedToken = jwtDecode(token);
            const currentTime = Date.now() / 1000;

            if (decodedToken.exp < currentTime) {
                localStorage.clear();
                showNotification('Sesja wygasła. Zaloguj się ponownie.', 'error');
                window.location.href = '/login';
                return;
            }

            if (!decodedToken.user_id) {
                navigate('/login');
                return;
            }

            // Sprawdź czy to nie jest pracownik
            if (decodedToken.rola === 'Bibliotekarz') {
                navigate('/worker-panel');
                return;
            }

            // Pobierz dane w zależności od aktywnej zakładki
            fetchData();
        } catch (err) {
            console.error('Invalid token:', err);
            showNotification('Nieprawidłowy token. Zaloguj się ponownie.', 'error');
            navigate('/login');
        }
    }, [navigate, activeTab, token]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'profile') {
                await fetchProfile();
                await fetchStats();
            } else if (activeTab === 'favorites') {
                await fetchFavorites();
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            showNotification('Błąd podczas pobierania danych', 'error');
        } finally {
            setLoading(false);
        }
    };
    
    const handleBookClick = (book) => {
      if (book.slug) {
        navigate(`/book/${book.slug}`);
      } else {
        console.error('No slug available for book:', book.title);
      }
    };

    const fetchProfile = async () => {
        try {
            const response = await fetch('http://localhost:3000/user/profile', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (response.ok) {
                setProfile(data);
            } else {
                console.error('Profile fetch error:', data.error);
                showNotification('Błąd podczas pobierania profilu', 'error');
            }
        } catch (error) {
            console.error('Profile fetch error:', error);
            showNotification('Błąd podczas pobierania profilu', 'error');
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:3000/user/stats', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (response.ok) {
                setStats(data);
            } else {
                console.error('Stats fetch error:', data.error);
            }
        } catch (error) {
            console.error('Stats fetch error:', error);
        }
    };

    const fetchFavorites = async () => {
        try {
            const response = await fetch('http://localhost:3000/user/favorites', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (response.ok) {
                setFavorites(data.favorites);
            } else {
                console.error('Favorites fetch error:', data.error);
                showNotification('Błąd podczas pobierania ulubionych', 'error');
            }
        } catch (error) {
            console.error('Favorites fetch error:', error);
            showNotification('Błąd podczas pobierania ulubionych', 'error');
        }
    };

    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `user-notification user-notification-${type}`;
        notification.innerHTML = `
            <div class="user-notification-content">
                <span class="user-notification-icon">${type === 'success' ? '✓' : '⚠'}</span>
                <span class="user-notification-message">${message}</span>
            </div>
        `;
        
        if (!document.querySelector('#user-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'user-notification-styles';
            style.textContent = `
                .user-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    min-width: 300px;
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    animation: userSlideIn 0.3s ease-out, userFadeOut 0.3s ease-in 2.7s;
                    animation-fill-mode: forwards;
                }
                .user-notification-success {
                    background: linear-gradient(135deg, rgba(46, 160, 67, 0.9), rgba(40, 167, 69, 0.9));
                    border: 1px solid rgba(46, 160, 67, 0.3);
                }
                .user-notification-error {
                    background: linear-gradient(135deg, rgba(220, 53, 69, 0.9), rgba(176, 42, 55, 0.9));
                    border: 1px solid rgba(220, 53, 69, 0.3);
                }
                .user-notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: white;
                    font-weight: 500;
                }
                .user-notification-icon {
                    font-size: 1.2rem;
                    font-weight: bold;
                }
                @keyframes userSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes userFadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    };

    const handleLogout = () => {
        if (window.confirm('Czy na pewno chcesz się wylogować?')) {
            localStorage.clear();
            showNotification('Zostałeś wylogowany', 'success');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        }
    };

    const updateEmail = async () => {
        if (!email.trim()) {
            showNotification('Wprowadź nowy email', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/user/email', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            
            if (data.error) {
                showNotification(data.error, 'error');
            } else {
                showNotification(data.message || 'Email został zaktualizowany', 'success');
                setEmail('');
                fetchProfile();
            }
        } catch (error) {
            showNotification('Błąd podczas aktualizacji email', 'error');
        }
    };

    const updatePassword = async () => {
        if (!oldPassword.trim() || !newPassword.trim()) {
            showNotification('Wypełnij wszystkie pola hasła', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showNotification('Nowe hasła się nie zgadzają', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showNotification('Nowe hasło musi mieć co najmniej 6 znaków', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/user/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword,
                }),
            });
            const data = await response.json();
            
            if (data.error) {
                showNotification(data.error, 'error');
            } else {
                showNotification(data.message || 'Hasło zostało zmienione', 'success');
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error) {
            showNotification('Błąd podczas zmiany hasła', 'error');
        }
    };

    const removeFromFavorites = async (bookId) => {
        if (!window.confirm('Czy na pewno chcesz usunąć tę książkę z ulubionych?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/user/favorites/${bookId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            
            if (response.ok) {
                showNotification(data.message || 'Książka została usunięta z ulubionych', 'success');
                fetchFavorites();
            } else {
                showNotification(data.error || 'Błąd podczas usuwania', 'error');
            }
        } catch (error) {
            showNotification('Błąd podczas usuwania książki z ulubionych', 'error');
        }
    };

    const renderLoadingSpinner = () => (
        <div className="user-loading-container">
            <div className="user-spinner"></div>
            <p>Ładowanie danych...</p>
        </div>
    );

    return (
        <div className="user-panel">
            <div className="user-sidebar">
                <h2>Panel Użytkownika</h2>
                <button 
                    className={activeTab === 'profile' ? 'active' : ''}
                    onClick={() => setActiveTab('profile')}
                >
                    👤 Profil
                </button>
                <button 
                    className={activeTab === 'edit' ? 'active' : ''}
                    onClick={() => setActiveTab('edit')}
                >
                    ⚙️ Edycja danych
                </button>
                <button 
                    className={activeTab === 'favorites' ? 'active' : ''}
                    onClick={() => setActiveTab('favorites')}
                >
                    ❤️ Ulubione książki
                </button>
                <button onClick={handleLogout} className="user-logout-btn">
                    🚪 Wyloguj
                </button>
            </div>
            
            <div className="user-content">
                {loading && renderLoadingSpinner()}
                
                {!loading && activeTab === 'profile' && profile && (
                    <div className="user-profile-section">
                        <div className="user-profile-header">
                            <div className="user-avatar">
                                {profile.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="user-profile-info">
                                <p><strong>ID:</strong> {profile.user_id}</p>
                                <p><strong>Imię:</strong> {profile.name}</p>
                                <p><strong>Email:</strong> {profile.email}</p>
                                <p><strong>Data rejestracji:</strong> {
                                    profile.created_at ? 
                                    new Date(profile.created_at).toLocaleDateString('pl-PL') : 
                                    'Brak danych'
                                }</p>
                            </div>
                        </div>
                        
                        {stats && (
                            <div className="user-stats-section">
                                <h3>📊 Twoje statystyki</h3>
                                <div className="user-stats-grid">
                                    <div className="user-stat-item">
                                        <span className="user-stat-number">{stats.favorites_count}</span>
                                        <span className="user-stat-label">Ulubione książki</span>
                                    </div>
                                    <div className="user-stat-item">
                                        <span className="user-stat-number">{stats.reviews_count}</span>
                                        <span className="user-stat-label">Napisane recenzje</span>
                                    </div>
                                    <div className="user-stat-item">
                                        <span className="user-stat-number">{stats.average_rating ? stats.average_rating.toFixed(1) : '0.0'}</span>
                                        <span className="user-stat-label">Średnia ocena</span>
                                    </div>
                                    <div className="user-stat-item">
                                        <span className="user-stat-number">{stats.recommendations_sent || 0}</span>
                                        <span className="user-stat-label">Wysłane rekomendacje</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!loading && activeTab === 'edit' && (
                    <div className="user-edit-section">
                        <h3>📧 Zmień email</h3>
                        <input
                            type="email"
                            placeholder="Wprowadź nowy email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <button onClick={updateEmail}>Zaktualizuj email</button>

                        <h3>🔒 Zmień hasło</h3>
                        <input
                            type="password"
                            placeholder="Obecne hasło"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Nowe hasło (min. 6 znaków)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Powtórz nowe hasło"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button onClick={updatePassword}>Zmień hasło</button>
                    </div>
                )}

                {!loading && activeTab === 'favorites' && (
                    <div className="user-favorites-section">
                        <h3>📚 Twoje ulubione książki ({favorites.length})</h3>
                        {favorites.length === 0 ? (
                            <div className="user-no-favorites">
                                <p>📖 Nie masz jeszcze żadnych ulubionych książek.</p>
                                <p>Dodaj książki do ulubionych, aby je tutaj zobaczyć!</p>
                            </div>
                        ) : (
                            <div className="user-favorites-grid">
                                {favorites.map((book) => (
                                    <div key={book.book_id} className="user-book-card">
                                        <div className="user-book-cover">
                                            {book.cover_thumb ? (
                                                <img 
                                                    src={book.cover_thumb} 
                                                    alt={book.title}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.parentNode.innerHTML = '<div class="user-no-cover">📖</div>';
                                                    }}
                                                />
                                            ) : (
                                                <div className="user-no-cover">📖</div>
                                            )}
                                        </div>
                                        <div className="user-book-info">
                                            <h4 className="user-book-title">{book.title}</h4>
                                            <p className="user-book-author">{book.author || 'Autor nieznany'}</p>
                                            {book.genres && book.genres.length > 0 && (
                                                <div className="user-book-genres">
                                                    {book.genres.map((genre, index) => (
                                                        <span key={index} className="user-genre-tag">
                                                            {genre}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="user-added-date">
                                                Dodano: {new Date(book.added_at).toLocaleDateString('pl-PL')}
                                            </p>
                                            {book.api_error && (
                                                <p className="user-api-error">
                                                    ⚠️ Nie udało się pobrać pełnych danych
                                                </p>
                                            )}
                                        </div>
                                        <div className="user-book-actions">
                                            <button 
                                                onClick={() => handleBookClick(book)}
                                                className="user-read-button"
                                            >
                                                📖 Szczegóły
                                            </button>
                                            <button 
                                                onClick={() => removeFromFavorites(book.book_id)}
                                                className="user-remove-button"
                                            >
                                                🗑️ Usuń
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserPanel;