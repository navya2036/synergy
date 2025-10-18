import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import './ProjectPreview.css';

const ProjectPreview = ({ user, onLogin, onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`/api/projects/${id}`);
      setProject(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching project:', error);
      setError('Project not found');
      setLoading(false);
    }
  };

  // Removed join request handling as it's now handled in the main project details page

  if (loading) {
    return (
      <div className="app">
        <Header user={user} onLogin={onLogin} onLogout={onLogout} />
        <div className="loading-container">
          <div className="loading">Loading project...</div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="app">
        <Header user={user} onLogin={onLogin} onLogout={onLogout} />
        <div className="project-preview">
          <div className="error-message">{error || 'Project not found'}</div>
          <button onClick={() => navigate('/')} className="back-button">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Simplified preview page without join functionality

  return (
    <div className="app">
      <Header user={user} onLogin={onLogin} onLogout={onLogout} />
      <div className="project-preview">
        <div className="project-preview-header">
          <button onClick={() => navigate('/')} className="back-button">
            ← Back to Dashboard
          </button>
        </div>

        <div className="project-preview-content">
          <div className="project-preview-card">
            <div className="project-header">
              <h1 className="project-title">{project.title}</h1>
              <div className="project-badges">
                <span className={`status-badge status-${project.status}`}>
                  {project.status.toUpperCase()}
                </span>
                <span className="category-badge">{project.category}</span>
              </div>
            </div>

            <div className="project-info-section">
              <h3>Description</h3>
              <p className="project-description">{project.description}</p>
            </div>

            <div className="project-info-section">
              <h3>Required Skills</h3>
              <div className="skills-container">
                {project.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>

            <div className="project-info-section">
              <h3>Project Details</h3>
              <div className="project-details-grid">
                <div className="detail-item">
                  <strong>Created by:</strong> {project.creator}
                </div>
                <div className="detail-item">
                  <strong>Team Size:</strong> {project.members.length}/{project.maxMembers} members
                </div>
                {project.timeline && (
                  <div className="detail-item">
                    <strong>Timeline:</strong> {project.timeline}
                  </div>
                )}
                <div className="detail-item">
                  <strong>Created:</strong> {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default ProjectPreview;