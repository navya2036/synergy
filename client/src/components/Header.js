import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateProject } from '../contexts/CreateProjectContext';
import './Header.css';

const Header = ({ user, onLogout, onLoginRequired }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { openCreateModal } = useCreateProject();

  const handleLogout = () => {
    onLogout();
    setShowDropdown(false);
    navigate('/dashboard');
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setShowDropdown(false);
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    setShowDropdown(false);
  };

  const handleNavClick = (e, path) => {
    e.preventDefault();

    if (path === '/create-project') {
      if (!user) {
        onLoginRequired && onLoginRequired('create-project');
      } else {
        openCreateModal();
      }
      return;
    }

    if (path === '/my-projects') {
      if (!user) {
        onLoginRequired && onLoginRequired('my-projects');
      } else {
        navigate('/my-projects');
      }
      return;
    }
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleSignupClick = () => {
    navigate('/signup');
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <h2>Synergy</h2>
          <span>Team-Up, Build, and Succeed</span>
        </div>
        <nav className="nav">
          <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>Dashboard</a>
          <a
            href="/create-project"
            onClick={(e) => handleNavClick(e, '/create-project')}
            className={!user ? 'auth-required' : 'nav-link'}
          >
            {!user ? '🔒 Create Project' : 'Create Project'}
          </a>
          <a
            href="/my-projects"
            onClick={(e) => handleNavClick(e, '/my-projects')}
            className={!user ? 'auth-required' : 'nav-link-secondary'}
          >
            {!user ? '🔒 My Projects' : 'My Projects'}
          </a>

          {user ? (
            <div className="user-menu">
              <button
                className="user-button"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="user-avatar">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="user-name">{user.name}</span>
              </button>

              {showDropdown && (
                <div className="dropdown-menu">
                  <div className="user-info">
                    <div className="user-details">
                      <p className="user-name-full">{user.name}</p>
                      <p className="user-email">{user.email}</p>
                      <p className="user-college">{user.college}</p>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={handleProfileClick}>Profile</button>
                  <button className="dropdown-item" onClick={handleSettingsClick}>Settings</button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <button className="login-btn" onClick={handleLoginClick}>
                Login
              </button>
              <button className="signup-btn" onClick={handleSignupClick}>
                Sign Up
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
