import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './Header';
import Login from './Login';
import Main from './Main';
import Popular from './Popular';
import Categories from './Categories';
import UserPanel from './UserPanel'; // Import the UserPanel component  
import '../styles/App.css';

function App() {
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/testbooks')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        // Do nothing with data, just checking connection
      })
      .catch(error => {
        console.error('Error fetching books:', error);
        setError(true);
      });
  }, []);

  if (error) {
    return (
      <div className="error">
        <h1>Strona Tymczasowo Niedostępna</h1>
      </div>
    );
  }

  return (
    <Router>
      <div className="Wrapper">
        <Header />
        <div className="Content">
          <Routes>
            <Route path="/" element={<Main />} />
            <Route path="/popularne" element={<Popular />} />
            <Route path="/kategorie" element={<Categories />} />
            <Route path="/login" element={<Login />} />
            <Route path="/Panel" element={<UserPanel />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;