import React, { useState } from 'react';
import '../styles/Header.css';

function Header() {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('user_id');
  const workerId = localStorage.getItem('worker_id');
  
  const [menuOpen, setMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className={`header ${menuOpen ? 'menu-open' : ''}`}>
      <div className="header-content">
        <div className="logo">
          <a href="/">
            <span className="logo-text">Biblio<span className="logo-accent">Stream</span></span>
          </a>
        </div>
        
        <div className="mobile-toggle" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        
        <nav className={`navbar ${menuOpen ? 'active' : ''}`}>
          <a href="/" className="nav-item">Strona Główna</a>
          <a href="/popularne" className="nav-item">Popularne</a>
          <a href="/kategorie" className="nav-item">Kategorie</a>
          <a href="/nowosci" className="nav-item">Nowości</a>
          <a href="/autorzy" className="nav-item">Autorzy</a>
          
          <div className="auth-buttons">
            {token && (userId || workerId) ? (
              <a href="/Panel" className="nav-item profile-btn">
                <span className="profile-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                Mój profil
              </a>
            ) : (
              <a href="/login" className="nav-item login-btn">Zaloguj się</a>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
