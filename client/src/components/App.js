import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './Header';
import Login from './Login';
import WorkerLogin from './WorkerLogin'; 
import Main from './Main';
import Popular from './Popular';
import Categories from './Categories';
import UserPanel from './UserPanel';  
import AdminPanel from './AdminPanel';
import WorkerPanel from './WorkerPanel'; 
import Register from './Register';
import '../styles/App.css';
import BookDetails from './bookDetails';

function App() {
  const [error, setError] = useState(false);
  const [isChecking, setIsChecking] = useState(true); // New state to track delay

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsChecking(false); // Allow error to be shown after delay
    }, 100); 

    fetch('/testbooks')
      .then(response => {
        clearTimeout(timeout); // Clear timeout if the response is successful
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        // Do nothing with data, just checking connection
        setIsChecking(false); // Backend is reachable, stop checking
      })
      .catch(error => {
        console.error('Error fetching books:', error);
        setError(true);
        setIsChecking(false); // Stop checking after error
      });

    return () => clearTimeout(timeout); // Cleanup timeout on unmount
  }, []);

  if (isChecking) {
    return (
      <div className="Wrapper">
        
      </div>
    );
  }

  if (error) {
    return (
      <div className="errorApp">
        <h1>Strona Tymczasowo Niedostępna</h1>
      </div>
    );
  }

  return (
    <Router>
      <div className="Wrapper">
        <Header />
        
          <Routes>
            <Route path="/" element={<Main />} />
            <Route path="/popularne" element={<Popular />} />
            <Route path="/kategorie" element={<Categories />} />
            <Route path="/login" element={<Login />} />
            <Route path="/Panel" element={<UserPanel />} />
            <Route path="/AdminPanel" element={<AdminPanel />} />
            <Route path="/WorkerLogin" element={<WorkerLogin />} /> 
            <Route path="/WorkerPanel" element={<WorkerPanel />} />
            <Route path="/register" element={<Register />} />
            <Route path="/book/:slug" element={<BookDetails />} />
          </Routes>
    
      </div>
    </Router>
  );
}

export default App;