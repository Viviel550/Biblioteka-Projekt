import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import styles from '../styles/Register.module.css';

function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [repeatpassword, setRepeatPassword] = useState('');
    const [passwordMismatch, setPasswordMismatch] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const navigate = useNavigate();

        useEffect(() => {
        const token = localStorage.getItem('token');
        const decodedToken = token ? jwtDecode(token) : null;
        if(token) {
            const decodedToken = jwtDecode(token);
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
        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{11,}$/;
        e.preventDefault();

        if (password !== repeatpassword) {
            setError('Hasła muszą być takie same.');
            setPasswordMismatch(true);
            return;
        }
        if (!passwordRegex.test(password)) {
            setError('Hasło musi mieć co najmniej 11 znaków, jedną wielką literę i jeden znak specjalny.');
            setPasswordMismatch(true);
            return;
        }
        setPasswordMismatch(false);

        try {
            const response = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, email }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Wystąpił nieznany błąd.');
            }

            // Show the popup modal on success
            setShowPopup(true);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className={styles.register}>
            <h2>Rejestracja</h2>
            <form className={styles.formGroup} onSubmit={handleSubmit}>
                <div className={styles.inputGroup}>
                    <label htmlFor="username">Nazwa użytkownika:</label>
                    <input
                        id="username"
                        type="text"
                        placeholder="Nazwa użytkownika"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="password">Hasło:</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Hasło"
                        value={password}
                        style={{ borderColor: passwordMismatch ? 'red' : '' }}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="password">Powtórz Hasło:</label>
                    <input
                        id="repeatpassword"
                        type="password"
                        placeholder="Powtórz Hasło"
                        value={repeatpassword}
                        style={{ borderColor: passwordMismatch ? 'red' : '' }}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="email">Email:</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <p className={styles.error}>{error || '\u00A0'}</p>
                <button type="submit" className={styles.registerButton}>Zarejestruj się</button>
            </form>
            {showPopup && (
            <div className={styles.popup}>
                <div className={styles.popupContent}>
                    <h3>Konto zostało pomyślnie utworzone!</h3>
                    <button onClick={() => window.location.href = '/login'}>Ok</button>
                </div>
            </div>
        )}
        </div>
    );
}

export default Register;