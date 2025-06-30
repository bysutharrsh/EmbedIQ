import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Chat from './components/Chat';
import Navbar from './components/Navbar';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
