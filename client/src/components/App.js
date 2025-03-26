import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './Header';
import Login from './Login';
import Main from './Main';
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
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;