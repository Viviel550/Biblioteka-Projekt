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
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if(token) {
            try {
                const decodedToken = jwtDecode(token);
                if(decodedToken.worker_id && decodedToken.rola === 'Bibliotekarz'){
                    navigate('/WorkerPanel');
                    return;
                }
                else if(decodedToken.worker_id && decodedToken.rola === 'Administrator'){
                    navigate('/AdminPanel');
                    return;
                }
                else if (decodedToken.user_id){
                    navigate('/Panel');
                    return;
                }
            } catch (error) {
                // Token jest nieprawidłowy, usuń go
                localStorage.removeItem('token');
            }
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{11,}$/;
        e.preventDefault();
        setError('');
        setPasswordMismatch(false);

        if (password !== repeatpassword) {
            setError('Hasła muszą być identyczne');
            setPasswordMismatch(true);
            return;
        }
        
        if (!passwordRegex.test(password)) {
            setError('Hasło musi zawierać min. 11 znaków, jedną wielką literę i znak specjalny');
            setPasswordMismatch(true);
            return;
        }

        setIsLoading(true);

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
                throw new Error(errorData.error || 'Wystąpił nieznany błąd');
            }

            setShowPopup(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePopupClose = () => {
        setShowPopup(false);
        navigate('/login');
    };

    return (
        <div className={styles.register}>
            <h2>Dołącz do nas</h2>
            <form className={styles.formGroup} onSubmit={handleSubmit}>
                <div className={styles.inputGroup}>
                    <label htmlFor="username">Nazwa użytkownika</label>
                    <input
                        id="username"
                        type="text"
                        placeholder="Wprowadź nazwę użytkownika"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isLoading}
                        required
                    />
                </div>
                
                <div className={styles.inputGroup}>
                    <label htmlFor="email">Adres email</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="Wprowadź swój email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        required
                    />
                </div>
                
                <div className={styles.inputGroup}>
                    <label htmlFor="password">Hasło</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Utwórz silne hasło"
                        value={password}
                        style={{ borderColor: passwordMismatch ? '#ff4757' : '' }}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                    />
                </div>
                
                <div className={styles.inputGroup}>
                    <label htmlFor="repeatpassword">Potwierdź hasło</label>
                    <input
                        id="repeatpassword"
                        type="password"
                        placeholder="Powtórz hasło"
                        value={repeatpassword}
                        style={{ borderColor: passwordMismatch ? '#ff4757' : '' }}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        disabled={isLoading}
                        required
                    />
                </div>
                
                {error && <div className={styles.error}>{error}</div>}
                
                <button 
                    type="submit" 
                    className={styles.registerButton}
                    disabled={isLoading}
                >
                    {isLoading ? 'Tworzenie konta...' : 'Utwórz konto'}
                </button>
            </form>
            
            {showPopup && (
                <div className={styles.popup}>
                    <div className={styles.popupContent}>
                        <h3>✨ Witamy w naszej społeczności!</h3>
                        <p style={{color: '#e0e0e0', marginBottom: '1.5rem', fontSize: '1rem'}}>
                            Twoje konto zostało pomyślnie utworzone. Możesz teraz się zalogować.
                        </p>
                        <button onClick={handlePopupClose}>Przejdź do logowania</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Register;