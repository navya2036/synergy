import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import ProjectCard from './ProjectCard';
import './MyProjects.css';

const MyProjects = ({ user, onLogin, onLogout }) => {
  const [activeTab, setActiveTab] = useState('created');
  const [createdProjects, setCreatedProjects] = useState([]);
  const [joinedProjects, setJoinedProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserProjects();
  }, [user, navigate]);

  const fetchUserProjects = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/projects/user/${user.email}`, {
        headers: {
          'x-auth-token': token
        }
      });

      setCreatedProjects(response.data.created || []);
      setJoinedProjects(response.data.joined || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(error.response?.data?.message || 'Failed to fetch projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRequired = () => {
    navigate('/login');
  };

  const handleMyProjects = () => {
    // Already on my projects page
  };

  if (!user) {
    return null; // Will redirect to login
  }

  const currentProjects = activeTab === 'created' ? createdProjects : joinedProjects;

  return (
    <div className="my-projects-page">
      <Header
        user={user}
        onLogout={onLogout}
        onLoginRequired={handleLoginRequired}
        onMyProjects={handleMyProjects}
      />

      <div className="my-projects-content">
        <div className="page-header">
          <h1>My Projects</h1>
          <p>Manage your created projects and view projects you're part of</p>
        </div>

        <div className="tabs-container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'created' ? 'active' : ''}`}
              onClick={() => setActiveTab('created')}
            >
              <span className="tab-icon">📝</span>
              Created by Me ({createdProjects.length})
            </button>
            <button
              className={`tab ${activeTab === 'joined' ? 'active' : ''}`}
              onClick={() => setActiveTab('joined')}
            >
              <span className="tab-icon">🤝</span>
              Joined Projects ({joinedProjects.length})
            </button>
          </div>
        </div>

        <div className="projects-section">
          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Loading your projects...</p>
            </div>
          ) : (
            <div className="projects-container">
              {currentProjects.length > 0 ? (
                <div className="projects-grid">
                  {currentProjects.map(project => (
                    <div key={project._id} className="project-card-wrapper">
                      <ProjectCard
                        project={project}
                        user={user}
                        onLoginRequired={handleLoginRequired}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">
                    {activeTab === 'created' ? '📝' : '🤝'}
                  </div>
                  <h3>
                    {activeTab === 'created' ? 'No Projects Created' : 'No Joined Projects'}
                  </h3>
                  <p>
                    {activeTab === 'created'
                      ? "You haven't created any projects yet. Click 'Create Project' in the header to get started!"
                      : "You haven't joined any projects yet. Browse the dashboard to find interesting projects to join!"
                    }
                  </p>
                  {activeTab === 'created' ? (
                    <button
                      className="cta-button"
                      onClick={() => navigate('/dashboard')}
                    >
                      Browse Projects
                    </button>
                  ) : (
                    <button
                      className="cta-button"
                      onClick={() => navigate('/dashboard')}
                    >
                      Find Projects
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProjects;