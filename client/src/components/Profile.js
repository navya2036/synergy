import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import './Profile.css';

const Profile = ({ user, onLogin, onLogout, viewMode = false }) => {
  const { userEmail } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewedUser, setViewedUser] = useState(null);
  const isViewingOtherUser = viewMode && userEmail;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    college: '',
    bio: '',
    skills: [],
    linkedin: '',
    github: ''
  });
  const [userStats, setUserStats] = useState({
    projectsCreated: 0,
    projectsJoined: 0,
    totalContributions: 0
  });
  const [userProjects, setUserProjects] = useState({
    created: [],
    joined: []
  });
  const [newSkill, setNewSkill] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isViewingOtherUser) {
      // Fetch other user's profile data
      fetchOtherUserProfile();
    } else if (user) {
      // Load current user's profile data
      setFormData({
        name: user.name || '',
        email: user.email || '',
        college: user.college || '',
        bio: user.bio || '',
        skills: user.skills || [],
        linkedin: user.linkedin || '',
        github: user.github || ''
      });

      setLoading(false);
      if (user.email) {
        fetchUserStats();
        fetchUserProjects();
      }
    } else {
      // If no user after a delay, it means user is not logged in
      const timer = setTimeout(() => {
        if (!user) {
          navigate('/login');
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user, navigate, isViewingOtherUser, userEmail]);

  const fetchUserStats = async () => {
    if (!user?.email) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/users/${user.email}/stats`, {
        headers: { 'x-auth-token': token }
      });
      setUserStats(response.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const fetchUserProjects = async () => {
    if (!user?.email) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/projects/user/${user.email}`, {
        headers: { 'x-auth-token': token }
      });
      setUserProjects(response.data);
    } catch (error) {
      console.error('Error fetching user projects:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const fetchOtherUserProfile = async () => {
    if (!userEmail) return;
    
    try {
      const response = await axios.get(`/api/users/profile/${userEmail}`);
      if (response.data) {
        const userData = response.data;
        setViewedUser(userData);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          college: userData.college || '',
          bio: userData.bio || '',
          skills: userData.skills || [],
          linkedin: userData.linkedin || '',
          github: userData.github || ''
        });
        
        // Fetch stats and projects for the viewed user
        await fetchOtherUserStats(userEmail);
        await fetchOtherUserProjects(userEmail);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setLoading(false);
    }
  };

  const fetchOtherUserStats = async (email) => {
    try {
      const response = await axios.get(`/api/users/${email}/stats`);
      if (response.data) {
        setUserStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchOtherUserProjects = async (email) => {
    try {
      const response = await axios.get(`/api/projects/user/${email}`);
      if (response.data) {
        setUserProjects(response.data);
      }
    } catch (error) {
      console.error('Error fetching user projects:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        localStorage.setItem('user', JSON.stringify(updatedUser));
        onLogin(updatedUser);
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleLoginRequired = () => {
    navigate('/login');
  };

  // Show loading state while user data is being loaded
  if (loading || !user) {
    return (
      <div style={{backgroundColor: '#f5f7fa', minHeight: '100vh'}}>
        <Header 
          user={user} 
          onLogout={onLogout} 
          onLoginRequired={handleLoginRequired}
        />
        <div style={{maxWidth: '1200px', margin: '0 auto', padding: '2rem'}}>
          <div style={{background: 'white', borderRadius: '12px', padding: '2rem', textAlign: 'center'}}>
            <h2>Loading profile...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page" style={{backgroundColor: '#f5f7fa', minHeight: '100vh'}}>
      <Header 
        user={user} 
        onLogout={onLogout} 
        onLoginRequired={handleLoginRequired}
      />
      
      <div className="profile-content" style={{maxWidth: '1200px', margin: '0 auto', padding: '2rem'}}>
        <div className="profile-header" style={{background: 'white', borderRadius: '12px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', alignItems: 'center', gap: '2rem'}}>
          <div className="profile-avatar" style={{width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold'}}>
            {(isViewingOtherUser ? formData.name : user.name)?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info" style={{flex: 1}}>
            <h1 style={{margin: '0 0 0.5rem 0', color: '#2d3748', fontSize: '2rem'}}>
              {isViewingOtherUser ? formData.name : user.name}
              {isViewingOtherUser && <span style={{fontSize: '1rem', color: '#718096', fontWeight: '400', marginLeft: '0.5rem'}}>(Viewing Profile)</span>}
            </h1>
            <p className="profile-email" style={{color: '#718096', margin: '0.25rem 0'}}>{isViewingOtherUser ? formData.email : user.email}</p>
            <p className="profile-college" style={{color: '#4a5568', margin: '0.25rem 0', fontWeight: '500'}}>{isViewingOtherUser ? formData.college : user.college}</p>
          </div>
          {!isViewingOtherUser && (
            <button 
              className={`edit-btn ${isEditing ? 'save-btn' : ''}`}
              onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}
              style={{background: isEditing ? '#48bb78' : '#667eea', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '500', cursor: 'pointer'}}
            >
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </button>
          )}
          {isViewingOtherUser && (
            <button 
              onClick={() => navigate('/profile')}
              style={{background: '#4a5568', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '500', cursor: 'pointer'}}
            >
              Back to My Profile
            </button>
          )}
        </div>

        <div className="profile-stats">
          <div className="stat-card">
            <h3>{userStats.projectsCreated}</h3>
            <p>Projects Created</p>
          </div>
          <div className="stat-card">
            <h3>{userStats.projectsJoined}</h3>
            <p>Projects Joined</p>
          </div>
          <div className="stat-card">
            <h3>{userStats.totalContributions}</h3>
            <p>Total Contributions</p>
          </div>
        </div>

        <div className="profile-sections">
          <div className="profile-section">
            <h2>About</h2>
            {isEditing ? (
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself..."
                rows="4"
                className="bio-textarea"
              />
            ) : (
              <p className="bio-text">{formData.bio || 'No bio added yet.'}</p>
            )}
          </div>

          <div className="profile-section">
            <h2>Skills</h2>
            <div className="skills-container">
              {formData.skills.map((skill, index) => (
                <span key={index} className="skill-tag">
                  {skill}
                  {isEditing && (
                    <button 
                      className="remove-skill-btn"
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              {isEditing && (
                <div className="add-skill-container">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill"
                    className="skill-input"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  />
                  <button onClick={handleAddSkill} className="add-skill-btn">+</button>
                </div>
              )}
            </div>
          </div>

          <div className="profile-section">
            <h2>Contact Information</h2>
            <div className="contact-grid">
              <div className="contact-item">
                <label>College/University</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleInputChange}
                    placeholder="Your college or university"
                  />
                ) : (
                  <p>{formData.college || 'Not specified'}</p>
                )}
              </div>
              <div className="contact-item">
                <label>LinkedIn</label>
                {isEditing ? (
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/your-profile"
                  />
                ) : (
                  <p>
                    {formData.linkedin ? (
                      <a href={formData.linkedin} target="_blank" rel="noopener noreferrer">
                        {formData.linkedin}
                      </a>
                    ) : (
                      'Not specified'
                    )}
                  </p>
                )}
              </div>
              <div className="contact-item">
                <label>GitHub</label>
                {isEditing ? (
                  <input
                    type="url"
                    name="github"
                    value={formData.github}
                    onChange={handleInputChange}
                    placeholder="https://github.com/your-username"
                  />
                ) : (
                  <p>
                    {formData.github ? (
                      <a href={formData.github} target="_blank" rel="noopener noreferrer">
                        {formData.github}
                      </a>
                    ) : (
                      'Not specified'
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h2>My Projects</h2>
            <div className="projects-overview">
              <div className="projects-category">
                <h3>Created Projects ({userProjects.created.length})</h3>
                {userProjects.created.length > 0 ? (
                  <div className="projects-list">
                    {userProjects.created.slice(0, 3).map(project => (
                      <div key={project._id} className="project-summary-card">
                        <h4>{project.title}</h4>
                        <p className="project-description">
                          {project.description && project.description.length > 100 
                            ? project.description.substring(0, 100) + '...' 
                            : project.description || 'No description available'}
                        </p>
                        <div className="project-meta">
                          <span className={`status-badge ${project.status}`}>{project.status}</span>
                          <span className="members-count">{project.members?.length || 0}/{project.maxMembers} members</span>
                        </div>
                      </div>
                    ))}
                    {userProjects.created.length > 3 && (
                      <div className="see-more">
                        <button onClick={() => navigate('/my-projects')} className="see-more-btn">
                          View all {userProjects.created.length} created projects →
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="no-projects">No projects created yet.</p>
                )}
              </div>

              <div className="projects-category">
                <h3>Joined Projects ({userProjects.joined.length})</h3>
                {userProjects.joined.length > 0 ? (
                  <div className="projects-list">
                    {userProjects.joined.slice(0, 3).map(project => (
                      <div key={project._id} className="project-summary-card">
                        <h4>{project.title}</h4>
                        <p className="project-description">
                          {project.description && project.description.length > 100 
                            ? project.description.substring(0, 100) + '...' 
                            : project.description || 'No description available'}
                        </p>
                        <div className="project-meta">
                          <span className={`status-badge ${project.status}`}>{project.status}</span>
                          <span className="members-count">{project.members?.length || 0}/{project.maxMembers} members</span>
                        </div>
                      </div>
                    ))}
                    {userProjects.joined.length > 3 && (
                      <div className="see-more">
                        <button onClick={() => navigate('/my-projects')} className="see-more-btn">
                          View all {userProjects.joined.length} joined projects →
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="no-projects">No projects joined yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="profile-actions">
            <button 
              className="cancel-btn"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  name: user.name || '',
                  email: user.email || '',
                  college: user.college || '',
                  bio: user.bio || '',
                  skills: user.skills || [],
                  linkedin: user.linkedin || '',
                  github: user.github || ''
                });
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;