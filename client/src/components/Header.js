import React from 'react';
import '../styles/Header.css';

function Header() {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('user_id');
  return (
    <header className="header">
      <div className="logo">
        {/* Add your logo here */}
        <img src="/" alt="Logo" />
      </div>
      <nav className="navbar">
        <a href="/" className="nav-item">Strona Główna</a>
        <a href="/popularne" className="nav-item">Popularne</a>
        <a href="/kategorie" className="nav-item ">Kategorie</a>
        {token && userId ? (
          <a href="/Panel" className="nav-item">Profil</a> // Show "Profil" if logged in
        ) : (
          <a href="/login" className="nav-item">Zaloguj</a> // Show "Zaloguj" if not logged in
        )}
      </nav>
    </header>
  );
}

export default Header;