import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isOpen, closeSidebar }) => {
  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={closeSidebar}></div>
      <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
        <button className="close-button" onClick={closeSidebar}>&times;</button>
        <ul>
          <li><Link to="/" onClick={closeSidebar}>Home</Link></li>
          <li><Link to="/dashboard" onClick={closeSidebar}>Dashboard</Link></li>
          <li><Link to="/pathways" onClick={closeSidebar}>Pathways</Link></li>
          <li><Link to="/challenges" onClick={closeSidebar}>Challenges</Link></li>
          <li><Link to="/simulations" onClick={closeSidebar}>Job Sims</Link></li>
          <li><Link to="/chat" onClick={closeSidebar}>Chat with Mee</Link></li>
        </ul>
      </nav>
    </>
  );
};

export default Sidebar;