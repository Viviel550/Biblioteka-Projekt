import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../styles/WorkerPanel.css';

function WorkerPanel() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [deactivateId, setDeactivateId] = useState('');

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

            if (decodedToken.rola !== 'Bibliotekarz') {
                navigate('/login');
                return;
            }

            if (activeTab === 'profile') {
                fetch('http://localhost:3000/worker/profile', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                    .then((res) => res.json())
                    .then((data) => setProfile(data));
            }
        } catch (err) {
            console.error('Invalid token:', err);
            navigate('/login');
        }
    }, [navigate, activeTab, token]);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    const updateEmail = () => {
        fetch('http://localhost:3000/worker/email', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ email }),
        })
            .then(res => res.json())
            .then(data => alert(data.message || data.error));
    };

    const updatePassword = () => {
        fetch('http://localhost:3000/worker/password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ password }),
        })
            .then(res => res.json())
            .then(data => alert(data.message || data.error));
    };

    const deactivateUser = () => {
        fetch(`http://localhost:3000/worker/deactivate-user/${deactivateId}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then(res => res.json())
            .then(data => alert(data.message || data.error));
    };

    return (
        <div className="worker-panel">
            <div className="sidebar">
                <h2>Panel Pracownika</h2>
                <button onClick={() => setActiveTab('profile')}>Profil</button>
                <button onClick={() => setActiveTab('edit')}>Edycja danych</button>
                <button onClick={() => setActiveTab('users')}>Użytkownicy</button>
                <button onClick={handleLogout}>Wyloguj</button>
            </div>
            <div className="content">
                {activeTab === 'profile' && profile && (
                    <div className="profile">
                        <div className="avatar">[Zdjęcie]</div>
                        <div>
                            <p><strong>ID:</strong> {profile.id}</p>
                            <p><strong>Imię i nazwisko:</strong> {profile.first_name} {profile.last_name}</p>
                            <p><strong>Email:</strong> {profile.email}</p>
                        </div>
                    </div>
                )}

                {activeTab === 'edit' && (
                    <div className="edit-section">
                        <h3>Zmień email</h3>
                        <input
                            type="email"
                            placeholder="Nowy email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <button onClick={updateEmail}>Zmień email</button>

                        <h3>Zmień hasło</h3>
                        <input
                            type="password"
                            placeholder="Nowe hasło"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button onClick={updatePassword}>Zmień hasło</button>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="user-management">
                        <h3>Dezaktywuj użytkownika</h3>
                        <input
                            type="number"
                            placeholder="ID użytkownika"
                            value={deactivateId}
                            onChange={(e) => setDeactivateId(e.target.value)}
                        />
                        <button onClick={deactivateUser}>Dezaktywuj</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default WorkerPanel;
