import React, {useEffect} from 'react';
import '../styles/UserPanel.css';

function WorkerPanel() {
    // Check if the user is logged in by checking for token and user_id in local storage
    useEffect(() => {
        const token = localStorage.getItem('token');
        const workerId = localStorage.getItem('worker_id');
        const userRole = localStorage.getItem('user_role'); // Assuming you store user role in local storage
        alert(userRole);
        if (!token || !workerId || userRole !== 'Bibliotekarz') {
            // User is not logged in, redirect to the login page
            window.location.href = '/login';
        }
    }, []);

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
