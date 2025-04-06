import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    if (token && userId) {
      // User is already logged in, redirect to UserPanel
      navigate('/Panel');
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
        throw new Error('Nieprawidłowa nazwa użytkownika lub hasło.');
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
    <div className="login">
      <h2>Logowanie</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Nazwa Użytkownika:</label>
          <input 
            type="text" 
            id="username"
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
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
        <button type="submit" class = "LoginButton" >Zaloguj</button>
      </form>
    </div>
  );
}

export default Login;