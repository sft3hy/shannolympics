import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Trophy, Calendar, Settings, Menu, X, Waves, Sun } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <header className="navbar-header">
      <div className="navbar-container container">
        {/* Brand Logo */}
        <NavLink to="/" className="brand-logo" onClick={closeMenu} id="nav-logo">
          <div className="logo-icon-wrapper">
            <Trophy className="logo-trophy" />
            <Waves className="logo-waves" />
          </div>
          <span className="brand-text">
            Shann<span className="brand-highlight">Olympics</span>
            <span className="brand-year">OBX '26</span>
          </span>
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} id="nav-link-leaderboard">
            <Trophy size={18} />
            Leaderboard
          </NavLink>
          <NavLink to="/events" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} id="nav-link-events">
            <Calendar size={18} />
            Events
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} id="nav-link-admin">
            <Settings size={18} />
            Admin
          </NavLink>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-toggle" 
          onClick={toggleMenu} 
          aria-label={isOpen ? "Close menu" : "Open menu"}
          id="nav-mobile-toggle"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      <div className={`mobile-nav-drawer ${isOpen ? 'open' : ''}`}>
        <nav className="mobile-nav-links">
          <NavLink to="/" end className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu} id="mobile-link-leaderboard">
            <Trophy size={20} />
            Leaderboard
          </NavLink>
          <NavLink to="/events" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu} id="mobile-link-events">
            <Calendar size={20} />
            Events
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu} id="mobile-link-admin">
            <Settings size={20} />
            Admin Panel
          </NavLink>
        </nav>
        <div className="mobile-drawer-decor">
          <Sun className="decor-sun" size={32} />
          <p>Outer Banks, NC • 60th Birthday event</p>
        </div>
      </div>
      
      {/* Backdrop for closing mobile drawer */}
      {isOpen && <div className="mobile-backdrop" onClick={closeMenu}></div>}
    </header>
  );
};

export default Navbar;
