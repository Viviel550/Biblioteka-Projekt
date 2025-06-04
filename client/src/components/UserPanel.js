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
        } finally {
            setLoading(false);
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
            }
        } catch (error) {
            console.error('Profile fetch error:', error);
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
            }
        } catch (error) {
            console.error('Favorites fetch error:', error);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    const updateEmail = async () => {
        if (!email.trim()) {
            alert('Wprowadź nowy email');
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
            alert(data.message || data.error);
            
            if (response.ok) {
                setEmail('');
                fetchProfile(); // Odśwież profil
            }
        } catch (error) {
            alert('Błąd podczas aktualizacji email');
        }
    };

    const updatePassword = async () => {
        if (newPassword !== confirmPassword) {
            alert('Nowe hasła się nie zgadzają');
            return;
        }

        if (newPassword.length < 6) {
            alert('Nowe hasło musi mieć co najmniej 6 znaków');
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
            alert(data.message || data.error);
            
            if (response.ok) {
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error) {
            alert('Błąd podczas zmiany hasła');
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
                alert(data.message);
                fetchFavorites(); // Odśwież listę ulubionych
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('Błąd podczas usuwania książki z ulubionych');
        }
    };

    return (
        <div className="user-panel">
            <div className="sidebar">
                <h2>Panel Użytkownika</h2>
                <button 
                    className={activeTab === 'profile' ? 'active' : ''}
                    onClick={() => setActiveTab('profile')}
                >
                    Profil
                </button>
                <button 
                    className={activeTab === 'edit' ? 'active' : ''}
                    onClick={() => setActiveTab('edit')}
                >
                    Edycja danych
                </button>
                <button 
                    className={activeTab === 'favorites' ? 'active' : ''}
                    onClick={() => setActiveTab('favorites')}
                >
                    Ulubione książki
                </button>
                <button onClick={handleLogout}>Wyloguj</button>
            </div>
            
            <div className="content">
                {loading && <div className="loading">Ładowanie...</div>}
                
                {activeTab === 'profile' && profile && (
                    <div className="profile">
                        <div className="profile-header">
                            <div className="avatar">[Zdjęcie]</div>
                            <div className="profile-info">
                                <p><strong>ID:</strong> {profile.user_id}</p>
                                <p><strong>Imię:</strong> {profile.name}</p>
                                <p><strong>Email:</strong> {profile.email}</p>
                                <p><strong>Data rejestracji:</strong> {
                                    profile.created_at ? 
                                    new Date(profile.created_at).toLocaleDateString() : 
                                    'Brak danych'
                                }</p>
                            </div>
                        </div>
                        
                        {stats && (
                            <div className="user-stats">
                                <h3>Twoje statystyki</h3>
                                <div className="stats-grid">
                                    <div className="stat-item">
                                        <span className="stat-number">{stats.favorites_count}</span>
                                        <span className="stat-label">Ulubione książki</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-number">{stats.reviews_count}</span>
                                        <span className="stat-label">Napisane recenzje</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-number">{stats.average_rating.toFixed(1)}</span>
                                        <span className="stat-label">Średnia ocena</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-number">{stats.recommendations_sent}</span>
                                        <span className="stat-label">Wysłane rekomendacje</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'edit' && (
                    <div className="edit-section">
                        <h3>Zmień email</h3>
                        <div className="form-group">
                            <input
                                type="email"
                                placeholder="Nowy email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <button onClick={updateEmail}>Zmień email</button>
                        </div>

                        <h3>Zmień hasło</h3>
                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="Obecne hasło"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                            />
                            <input
                                type="password"
                                placeholder="Nowe hasło"
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
                    </div>
                )}

                {activeTab === 'favorites' && (
                    <div className="favorites-section">
                        <h3>Twoje ulubione książki ({favorites.length})</h3>
                        {favorites.length === 0 ? (
                            <p className="no-favorites">Nie masz jeszcze żadnych ulubionych książek.</p>
                        ) : (
                            <div className="favorites-grid">
                                {favorites.map((book) => (
                                    <div key={book.book_id} className="book-card">
                                        <div className="book-cover">
                                            {book.cover_thumb ? (
                                                <img 
                                                    src={book.cover_thumb} 
                                                    alt={book.title}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="no-cover">Brak okładki</div>
                                            )}
                                        </div>
                                        <div className="book-info">
                                            <h4 className="book-title">{book.title}</h4>
                                            <p className="book-author">{book.author}</p>
                                            {book.genres && book.genres.length > 0 && (
                                                <div className="book-genres">
                                                    {book.genres.map((genre, index) => (
                                                        <span key={index} className="genre-tag">
                                                            {genre}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="added-date">
                                                Dodano: {new Date(book.added_at).toLocaleDateString()}
                                            </p>
                                            {book.api_error && (
                                                <p className="api-error">
                                                    Nie udało się pobrać pełnych danych
                                                </p>
                                            )}
                                        </div>
                                        <div className="book-actions">
                                            {book.url && (
                                                <a 
                                                    href={book.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="read-button"
                                                >
                                                    Czytaj
                                                </a>
                                            )}
                                            <button 
                                                onClick={() => removeFromFavorites(book.book_id)}
                                                className="remove-button"
                                            >
                                                Usuń z ulubionych
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
