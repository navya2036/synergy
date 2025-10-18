import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProjectCard from './ProjectCard';
import Header from './Header';
import LoginModal from './LoginModal';
import './Dashboard.css';

const Dashboard = ({ user, onLogin, onLogout }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRedirectTo, setLoginRedirectTo] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    if (filter === 'all') return true;
    return project.status === filter;
  });

  const handleLoginRequired = (redirectTo = null) => {
    setLoginRedirectTo(redirectTo);
    setShowLoginModal(true);
  };

  const handleLoginSuccess = (userData) => {
    onLogin(userData);
    setShowLoginModal(false);
  };

  return (
    <div className="dashboard">
      <Header
        user={user}
        onLogout={onLogout}
        onLoginRequired={handleLoginRequired}
      />
      <div className="dashboard-content">
        <div className="dashboard-header">
          {user ? (
            <h1>Welcome back, {user.name}!</h1>
          ) : (
            <h1>Projects</h1>
          )}

          <div className="filter-buttons">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All Projects
            </button>
            <button
              className={filter === 'active' ? 'active' : ''}
              onClick={() => setFilter('active')}
            >
              Active
            </button>
            <button
              className={filter === 'completed' ? 'active' : ''}
              onClick={() => setFilter('completed')}
            >
              Completed
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading projects...</div>
        ) : (
          <div className="projects-grid">
            {filteredProjects.length > 0 ? (
              filteredProjects.map(project => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  user={user}
                  onLoginRequired={handleLoginRequired}
                />
              ))
            ) : (
              <div className="no-projects">
                <h3>No projects yet</h3>
                <p>Create your first project to get started.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLoginSuccess}
        redirectTo={loginRedirectTo}
      />
    </div>
  );
};

export default Dashboard;
