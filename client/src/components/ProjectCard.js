import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './ProjectCard.css';

const ProjectCard = ({ project, user, onLoginRequired }) => {
  const navigate = useNavigate();
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState('');
  const [requestStatus, setRequestStatus] = useState('idle'); // idle, pending, sent
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleViewDetails = () => {
    if (!user) {
      // For guests, always show preview
      navigate(`/project/${project._id}/preview`);
      return;
    }

    const isMember = project.members && project.members.includes(user.email);
    const isCreator = project.creatorEmail === user.email;

    if (isMember || isCreator) {
      // Full project details for members and creators
      navigate(`/project/${project._id}`);
    } else {
      // Preview only for non-members
      navigate(`/project/${project._id}/preview`);
    }
  };

  const handleJoinProject = async () => {
    if (!user) {
      onLoginRequired();
      return;
    }
    
    // Open message modal instead of sending request immediately
    setShowMessageModal(true);
  };

  const handleSendRequest = async () => {
    if (!message.trim()) {
      alert('Please enter a message explaining why you want to join this project.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Making request to:', `/api/joinRequests/request/${project._id}`);
      console.log('Request body:', {
        requesterId: user.id || user._id,
        requesterName: user.name,
        requesterEmail: user.email,
        message: message.trim()
      });
      
      const response = await api.post(`/api/joinRequests/request/${project._id}`, {
        requesterId: user.id || user._id,
        requesterName: user.name,
        requesterEmail: user.email,
        message: message.trim()
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Success response:', data);
        alert('Join request sent successfully! The project owner will review your request.');
        setRequestStatus('sent');
        setShowMessageModal(false);
        setMessage('');
      } else {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        alert(errorData.message || 'Failed to send join request');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const truncateDescription = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  const isUserCreator = () => {
    return user && project.creatorEmail === user.email;
  };

  return (
    <div className="project-card">
      <div className="card-header">
        <h3 className="project-title">{project.title}</h3>
        <span className={`status-badge ${project.status}`}>
          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </span>
      </div>
      
      <p className="project-description">
        {truncateDescription(project.description)}
      </p>
      
      <div className="skills-section">
        <h4>Skills Required:</h4>
        <div className="skills-tags">
          {project.skills.map((skill, index) => (
            <span key={index} className="skill-tag">{skill}</span>
          ))}
        </div>
      </div>
      
      <div className="team-section">
        <h4>Team Members ({project.members?.length || 0}/{project.maxMembers}):</h4>
        <div className="team-members">
          {project.members && project.members.length > 0 ? (
            project.members.map((memberEmail, index) => (
              <div key={index} className="team-member">
                <span className="member-name">{memberEmail}</span>
              </div>
            ))
          ) : (
            <span className="no-members">No members yet</span>
          )}
        </div>
      </div>
      
      <div className="card-actions">
        <button 
          className={`btn-secondary ${!user ? 'login-required' : ''}`} 
          onClick={handleViewDetails}
        >
          View Details {!user && '🔒'}
        </button>
        {project.status !== 'completed' && (
          <button 
            className={`btn-primary ${!user ? 'login-required' : ''} ${isUserCreator() ? 'creator-btn' : ''}`}
            onClick={isUserCreator() ? undefined : handleJoinProject}
            disabled={!isUserCreator() && user && (
              (project.members?.length || 0) >= project.maxMembers || 
              (user && project.members?.includes(user.email))
            )}
            style={isUserCreator() ? {cursor: 'default', opacity: 0.8} : {}}
          >
            {isUserCreator()
              ? 'Creator 👑'
              : user && (project.members?.length || 0) >= project.maxMembers 
              ? 'Team Full' 
              : user && project.members?.includes(user.email)
              ? 'Already Joined'
              : requestStatus === 'sent'
              ? 'Request Sent ✓'
              : !user 
              ? 'Send Join Request 🔒' 
              : 'Send Join Request'
            }
          </button>
        )}
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Join Request for "{project.title}"</h3>
              <button className="close-btn" onClick={() => setShowMessageModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Tell the project owner why you're a good fit for this project. Mention your relevant skills and experience.
              </p>
              <textarea
                className="message-textarea"
                placeholder="Hi! I'm interested in joining your project because..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                maxLength={500}
              />
              <div className="character-count">
                {message.length}/500 characters
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setShowMessageModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                className="send-btn" 
                onClick={handleSendRequest}
                disabled={isSubmitting || !message.trim()}
              >
                {isSubmitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCard;
