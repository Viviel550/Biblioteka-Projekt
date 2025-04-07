import React, {useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../styles/UserPanel.css';

function WorkerPanel() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
        // No token, redirect to login
            navigate('/login');
            return;
        }

        try {
            const decodedToken = jwtDecode(token);

            // Check if the token has expired
            const currentTime = Date.now() / 1000; // Current time in seconds
            if (decodedToken.exp < currentTime) {
                // Token has expired, redirect to login
                localStorage.removeItem('token'); // Clear expired token
                window.location.href = '/login';
                return;
            }
            // Check if the user has the correct role
            if (decodedToken.rola !== 'Bibliotekarz') {
                // User is not a worker, redirect to login
                navigate('/login');
                return;
            }  
        } catch (error) {
            console.error('Invalid token:', error);
            navigate('/login'); // Redirect if token is invalid
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('worker_id');
        localStorage.removeItem('user_role'); // Remove user role from local storage
        
        window.location.href = '/login';
    };
    return (
        <div className="user-panel">
            <h2>Panel Pracownika</h2>
            <div className="user-info">
                <h3>Witaj, {localStorage.getItem('worker_id')}</h3>
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
export default WorkerPanel;
