import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../styles/WorkerPanel.css';

function WorkerPanel() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState(null);
    const [email, setEmail] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [deactivateId, setDeactivateId] = useState('');
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

            if (decodedToken.rola !== 'Bibliotekarz') {
                navigate('/login');
                return;
            }

            fetchTabData();
        } catch (err) {
            console.error('Invalid token:', err);
            showNotification('Nieprawidłowy token. Zaloguj się ponownie.', 'error');
            navigate('/login');
        }
    }, [navigate, activeTab, token]);

    const fetchTabData = async () => {
        if (activeTab === 'profile') {
            setLoading(true);
            try {
                const res = await fetch('http://localhost:3000/worker/profile', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await res.json();
                setProfile(data);
            } catch (error) {
                console.error('Error fetching profile:', error);
                showNotification('Błąd podczas pobierania danych profilu', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✓' : '⚠'}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    min-width: 300px;
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    animation: slideIn 0.3s ease-out, fadeOut 0.3s ease-in 2.7s;
                    animation-fill-mode: forwards;
                }
                .notification-success {
                    background: linear-gradient(135deg, rgba(46, 160, 67, 0.9), rgba(40, 167, 69, 0.9));
                    border: 1px solid rgba(46, 160, 67, 0.3);
                }
                .notification-error {
                    background: linear-gradient(135deg, rgba(220, 53, 69, 0.9), rgba(176, 42, 55, 0.9));
                    border: 1px solid rgba(220, 53, 69, 0.3);
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: white;
                    font-weight: 500;
                }
                .notification-icon {
                    font-size: 1.2rem;
                    font-weight: bold;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
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
            showNotification('Wprowadź nowy adres email', 'error');
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/worker/email', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            
            if (data.error) {
                showNotification(data.error, 'error');
            } else {
                showNotification(data.message || 'Email został zaktualizowany', 'success');
                setEmail('');
                fetchTabData();
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
            const res = await fetch('http://localhost:3000/worker/password', {
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
            const data = await res.json();
            
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

    const renderLoadingSpinner = () => (
        <div className="loading-container">
            <div className="spinner"></div>
            <p>Ładowanie danych...</p>
        </div>
    );

    return (
        <div className="worker-panel">
            <div className="sidebar">
                <h2>Panel Pracownika</h2>
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
                <button onClick={handleLogout} className="logout-btn">
                    🚪 Wyloguj
                </button>
            </div>
            
            <div className="content">
                {loading && renderLoadingSpinner()}
                
                {!loading && activeTab === 'profile' && profile && (
                    <div className="profile">
                        <div className="avatar">
                            {profile.first_name?.[0]}{profile.last_name?.[0]}
                        </div>
                        <div>
                            <p><strong>ID:</strong> {profile.id}</p>
                            <p><strong>Imię i nazwisko:</strong> {profile.first_name} {profile.last_name}</p>
                            <p><strong>Email:</strong> {profile.email}</p>
                            <p><strong>Rola:</strong> Bibliotekarz</p>
                        </div>
                    </div>
                )}

                {!loading && activeTab === 'edit' && (
                    <div className="edit-section">
                        <h3>🔧 Zmień email</h3>
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

            </div>
        </div>
    );
}

export default WorkerPanel;