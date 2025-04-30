import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../styles/Login.css';

function WorkerLogin() {
  const [workerid, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const decodedToken = token ? jwtDecode(token) : null;
    if (token) {
        if(decodedToken.worker_id && decodedToken.rola === 'Bibliotekarz'){
            // User is already logged in, redirect to WorkerPanel
            navigate('/WorkerPanel');
            return;
        }
        else if(decodedToken.worker_id && decodedToken.rola  === 'Administrator'){
            // User is already logged in, redirect to AdminPanel
            navigate('/AdminPanel');
            return;
        }
        else if (decodedToken.user_id){
            // User is already logged in, redirect to UserPanel
            navigate('/Panel');
            return;
        }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch('http://localhost:3000/workerlogin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workerid, password }),
      });
  
      if (!response.ok) {
        // Extract the error message from the response
        const errorData = await response.json();
        throw new Error(errorData.error || 'Wystąpił nieznany błąd.');
      }
  
      const data = await response.json();
      const decodedToken = jwtDecode(data.token);
  
      // Save the JWT token that holds the worker_id and role in local storage
      localStorage.setItem('token', data.token);

      // Redirect based on role
      if (decodedToken.rola === 'Bibliotekarz') {
        window.location.href = '/WorkerPanel';
        return;
      } else if (decodedToken.rola === 'Administrator') {
        window.location.href = '/AdminPanel';
        return;
      } else {
        throw new Error('Nieprawidłowa rola użytkownika.');
      }
    } catch (err) {
      // Set the error message to display it in the UI
      setError(err.message);
    }
  };
  const handleWorkerIdChange = (e) => {
    const value = e.target.value;
    // Allow only numeric characters
    if (/^\d*$/.test(value)) {
      setUsername(value);
    }
  }
  return (
    <div className="login">
      <h2>Logowanie Pracownika</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Id Pracownika:</label>
          <input 
            type="text" 
            id="workerid"
            value={workerid} 
            onChange={handleWorkerIdChange} 
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Hasło:</label>
          <input 
            type="password" 
            id="password"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <p className="error_Login">{error || '\u00A0'}</p>
        <button type="submit" class = "LoginButton" >Zaloguj</button>
        <button type="button" class = "LoginButton" onClick ={() => navigate('/login')}>Zaloguj Jako Użytkownik</button>
      </form>
    </div>
  );
}

export default WorkerLogin;