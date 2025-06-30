import React from 'react';
import { Link } from 'react-router-dom';
import { FaBrain } from 'react-icons/fa';
import '../styles/Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <FaBrain className="navbar-logo-icon" />
          <span>EmbedIQ</span>
        </Link>
        
        <div className="navbar-links">
          <Link to="/" className="navbar-link">
            Home
          </Link>
          <Link to="/chat" className="navbar-link">
            Chat
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 