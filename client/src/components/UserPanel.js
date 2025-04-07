import React, {useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../styles/UserPanel.css';

function UserPanel() {
    const navigate = useNavigate();
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token ) {
            navigate('/login');
            return;
        }
        try{
            const decodedToken = jwtDecode(token);
            if(decodedToken.exp < Date.now() / 1000) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }
            if(!decodedToken.user_id) {
                navigate('/login');
                return;
            }
        } catch (error) {
            console.error('Invalid token:', error);
            window.location.href = '/login'; // Redirect if token is invalid
            return;
        }
    }, [navigate]);

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
