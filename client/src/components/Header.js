import React from 'react';
import '../styles/Header.css';

function Header() {
  return (
    <header className="header">
      <div className="logo">
        {/* Add your logo here */}
        <img src="path/to/logo.png" alt="Logo" />
      </div>
      <nav className="navbar">
        <a href="/" className="nav-item">Strona Główna</a>
        <a href="/popularne" className="nav-item">Popularne</a>
        <a href="/kategorie" className="nav-item ">Kategorie</a>
        <a href="/login" className="nav-item">Zaloguj</a>
      </nav>
    </header>
  );
}

export default Header;