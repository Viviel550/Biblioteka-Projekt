import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../styles/Login.css';

function Login() {
  const [username, setUsername] = useState('');
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
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Wystąpił nieznany błąd.');
      }

      const data = await response.json();

      // Save the JWT token and user_id in local storage
      localStorage.setItem('token', data.token); // Assuming the backend sends a JWT token
      localStorage.setItem('user_id', data.user.user_id);

      // Redirect to the UserPanel
      window.location.href = '/Panel';
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Logowanie</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Nazwa Użytkownika</label>
            <input 
              type="text" 
              id="username"
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              placeholder="Wprowadź nazwę użytkownika"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Hasło</label>
            <input 
              type="password" 
              id="password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="Wprowadź hasło"
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-button">Zaloguj</button>
        </form>
        <div className="login-footer">
          <p>Nie masz jeszcze konta?</p>
          <button type="button" className="register-button" onClick={() => navigate('/Register')}>
            Zarejestruj się
          </button>
        </div>
      </div>
      <button type="button" className="worker-login-button" onClick={() => navigate('/WorkerLogin')}>
        Zaloguj Jako Pracownik
      </button>
    </div>
  );
}

export default Login;