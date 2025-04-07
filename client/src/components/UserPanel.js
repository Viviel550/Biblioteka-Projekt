import React, {useEffect} from 'react';
import '../styles/UserPanel.css';

function UserPanel() {
    // Check if the user is logged in by checking for token and user_id in local storage
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('user_id');
        if (!token || !userId) {
            // User is not logged in, redirect to the login page
            window.location.href = '/login';
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        
        window.location.href = '/login';
    };
    return (
        <div className="user-panel">
            <h2>Panel Użytkownika</h2>
            <div className="user-info">
                <h3>Witaj, {localStorage.getItem('user_id')} </h3>
                <p>Twoje konto jest aktywne.</p>
            </div>
            <div className="user-actions">
                <button className="action-button">Zarządzaj Książkami</button>
                <button className="action-button">Zarządzaj Kontem</button>
                <button className="action-button" onClick={handleLogout}>Wyloguj się</button>
            </div>
        </div>
    );
}
export default UserPanel;
