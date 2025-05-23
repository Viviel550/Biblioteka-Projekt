import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../styles/Login.css';

function WorkerLogin() {
  const [workerid, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
              const errorData = await response.json();
              throw new Error(errorData.error || 'Wystąpił nieznany błąd.');
          }

          const data = await response.json();
          const decodedToken = jwtDecode(data.token);

          // Check if the worker's status is null
          if (data.user.status === null) {
              setShowPasswordModal(true); // Show the modal
              return;
          }

          // Save the JWT token in local storage
          localStorage.setItem('token', data.token);

          // Redirect based on role
          if (decodedToken.rola === 'Bibliotekarz') {
              window.location.href = '/WorkerPanel';
          } else if (decodedToken.rola === 'Administrator') {
              window.location.href = '/AdminPanel';
          } else {
              throw new Error('Nieprawidłowa rola użytkownika.');
          }
      } catch (err) {
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

  const abortPass = () => {
    setShowPasswordModal(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{11,}$/;
    return passwordRegex.test(password);
  };

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
      {showPasswordModal && (
        <div className="modal1">
            <div className="modal1-content">
                <h3>Ustaw nowe hasło</h3>
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (!validatePassword(newPassword)) {
                            setError('Hasło musi mieć co najmniej 11 znaków, jedną wielką literę, jedną cyfrę i jeden znak specjalny.');
                            return;
                        }
                        if (newPassword !== confirmPassword) {
                            setError('Hasła nie są zgodne.');
                            return;
                        }
                        try {
                            const response = await fetch('http://localhost:3000/worker/set-password', {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ workerid, new_password: newPassword }),
                            });

                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.error || 'Wystąpił nieznany błąd.');
                            }

                            alert('Hasło zostało pomyślnie ustawione.');
                            setShowPasswordModal(false);

                            // Redirect based on role
                            const decodedToken = jwtDecode(localStorage.getItem('token'));
                            if (decodedToken.rola === 'Bibliotekarz') {
                                window.location.href = '/WorkerPanel';
                            } else if (decodedToken.rola === 'Administrator') {
                                window.location.href = '/AdminPanel';
                            }
                        } catch (err) {
                            setError(err.message);
                        }
                    }}
                >
                    <div className="form-group">
                        <label htmlFor="newPassword">Nowe hasło:</label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Potwierdź hasło:</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <p className="error_Login">{error || '\u00A0'}</p>
                    <button className = "modal1-abort" onClick={() => abortPass()}>Anuluj</button>
                    <button className = "modal1-submit" type="submit">Ustaw hasło</button>
                    
                </form>
            </div>
        </div>
    )}
    </div>
  );
}

export default WorkerLogin;