import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CreateProjectProvider } from './contexts/CreateProjectContext';
import Dashboard from './components/Dashboard';
import MyProjects from './components/MyProjects';
import ProjectDetails from './components/ProjectDetails';
import ProjectPreview from './components/ProjectPreview';
import Profile from './components/Profile';
import Settings from './components/Settings';
import Login from './components/Login';
import Signup from './components/Signup';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleProjectCreated = (newProject) => {
    // This could be used to refresh project lists or show notifications
    console.log('New project created:', newProject);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <CreateProjectProvider user={user} onProjectCreated={handleProjectCreated}>
          <Routes>
            <Route
              path="/login"
              element={<Login onLogin={handleLogin} />}
            />
            <Route
              path="/signup"
              element={<Signup />}
            />
            <Route
              path="/dashboard"
              element={<Dashboard user={user} onLogin={handleLogin} onLogout={handleLogout} />}
            />
            <Route
              path="/my-projects"
              element={<MyProjects user={user} onLogin={handleLogin} onLogout={handleLogout} />}
            />
            <Route
              path="/project/:id"
              element={<ProjectDetails user={user} onLogin={handleLogin} onLogout={handleLogout} />}
            />
            <Route
              path="/project/:id/preview"
              element={<ProjectPreview user={user} onLogin={handleLogin} onLogout={handleLogout} />}
            />
            <Route
              path="/profile"
              element={<Profile user={user} onLogin={handleLogin} onLogout={handleLogout} />}
            />
            <Route
              path="/profile/:userEmail"
              element={<Profile user={user} onLogin={handleLogin} onLogout={handleLogout} viewMode={true} />}
            />
            <Route
              path="/settings"
              element={<Settings user={user} onLogin={handleLogin} onLogout={handleLogout} />}
            />
            <Route
              path="/"
              element={<Dashboard user={user} onLogin={handleLogin} onLogout={handleLogout} />}
            />
          </Routes>
        </CreateProjectProvider>
      </div>
    </Router>
  );
}

export default App;
