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
    const workerId = localStorage.getItem('worker_id'); // Assuming you store worker ID in local storage
    const userId = localStorage.getItem('user_id'); // Assuming you store user ID in local storage
    const userRole = localStorage.getItem('user_role'); // Assuming you store user role in local storage
    if (token) {
        if(workerId && userRole === 'Bibliotekarz'){
            // User is already logged in, redirect to WorkerPanel
            navigate('/WorkerPanel');
        }
        else if(workerId && userRole === 'Administrator'){
            // User is already logged in, redirect to AdminPanel
            navigate('/AdminPanel');
        }
        else if (userId){
            // User is already logged in, redirect to UserPanel
            navigate('/Panel');
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
  
      // Save the JWT token and user details in local storage
      localStorage.setItem('token', data.token);
      localStorage.setItem('worker_id', decodedToken.worker_id);
      localStorage.setItem('user_role', decodedToken.rola);
  
      // Redirect based on role
      if (decodedToken.rola === 'Bibliotekarz') {
        navigate('/WorkerPanel');
      } else if (decodedToken.rola === 'Administrator') {
        navigate('/AdminPanel');
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
        <p className="error">{error || '\u00A0'}</p>
        <button type="submit" class = "LoginButton" >Zaloguj</button>
        <button type="button" class = "LoginButton" onClick ={() => navigate('/login')}>Zaloguj Jako Użytkownik</button>
      </form>
    </div>
  );
}

export default WorkerLogin;