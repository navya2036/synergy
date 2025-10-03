import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import './ProjectDetails.css';

const ProjectDetails = ({ user, onLogin, onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [joinRequests, setJoinRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    assignedToName: '',
    priority: 'medium',
    dueDate: ''
  });
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    meetingDate: '',
    meetingTime: '',
    duration: 60,
    meetingLink: '',
    location: 'Online',
    agenda: ''
  });

  // Sample data for development - replace with API calls
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);

  const [resources, setResources] = useState([]);

  useEffect(() => {
    fetchProject();
  }, [id]);

  useEffect(() => {
    if (user && project && isUserCreator()) {
      fetchJoinRequests();
    }
    if (user && project) {
      fetchTasks();
      fetchMeetings();
    }
  }, [user, project]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`/api/projects/${id}`);
      setProject(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching project:', error);
      setLoading(false);
    }
  };

  const fetchJoinRequests = async () => {
    if (!user || !project) return;
    
    setRequestsLoading(true);
    try {
      const response = await axios.get(`/api/joinRequests/project/${id}`);
      setJoinRequests(response.data);
    } catch (error) {
      console.error('Error fetching join requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleApproveRequest = async (requestId, requesterEmail, requesterName) => {
    try {
      const response = await axios.put(`/api/joinRequests/respond/${requestId}`, {
        status: 'accepted',
        ownerEmail: user.email
      });
      
      if (response.data.message) {
        alert('Join request approved and member added to project!');
        fetchJoinRequests(); // Refresh requests
        fetchProject(); // Refresh project data
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const response = await axios.put(`/api/joinRequests/respond/${requestId}`, {
        status: 'rejected',
        ownerEmail: user.email
      });
      
      if (response.data.message) {
        alert('Join request rejected');
        fetchJoinRequests(); // Refresh requests
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  const handleJoinProject = async () => {
    if (!user) {
      alert('Please log in to send a join request');
      return;
    }

    try {
      const response = await axios.post(`/api/joinRequests/request/${id}`, {
        requesterId: user.id || user._id,
        requesterName: user.name,
        requesterEmail: user.email,
        message: `Hi, I would like to join your project "${project.title}". I have experience with ${user.skills ? user.skills.join(', ') : 'various technologies'}.`
      });

      if (response.data.message) {
        alert('Join request sent successfully! The project owner will review your request.');
      }
    } catch (error) {
      console.error('Error sending join request:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to send join request');
      }
    }
  };

  const isUserMember = () => {
    if (!user || !project) return false;
    return project.members && project.members.some(member => member.email === user.email);
  };

  const isUserCreator = () => {
    if (!user || !project) return false;
    return project.creatorEmail === user.email;
  };

  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  // Fetch tasks for the project
  const fetchTasks = async () => {
    if (!user || !project) return;
    
    try {
      const response = await axios.get(`/api/tasks/project/${id}?userEmail=${user.email}`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Fetch meetings for the project
  const fetchMeetings = async () => {
    if (!user || !project) return;
    
    try {
      const response = await axios.get(`/api/meetings/project/${id}?userEmail=${user.email}`);
      setMeetings(response.data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  const addTask = () => {
    setShowTaskForm(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (taskForm.title.trim() && taskForm.assignedTo) {
      try {
        const response = await axios.post('/api/tasks', {
          projectId: id,
          title: taskForm.title,
          description: taskForm.description,
          assignedTo: taskForm.assignedTo,
          assignedToName: taskForm.assignedToName,
          assignedBy: user.email,
          assignedByName: user.name,
          priority: taskForm.priority || 'medium',
          dueDate: taskForm.dueDate
        });

        if (response.data.message) {
          alert('Task created and assigned successfully! Email notification sent to team member.');
          setTasks([...tasks, response.data.task]);
          setTaskForm({ 
            title: '', 
            description: '', 
            assignedTo: '', 
            assignedToName: '',
            priority: 'medium',
            dueDate: '' 
          });
          setShowTaskForm(false);
        }
      } catch (error) {
        console.error('Error creating task:', error);
        alert(error.response?.data?.message || 'Failed to create task');
      }
    } else {
      alert('Please fill in all required fields');
    }
  };

  const handleTaskFormChange = (field, value) => {
    setTaskForm(prev => ({ ...prev, [field]: value }));
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await axios.put(`/api/tasks/${taskId}/status`, {
        status: newStatus,
        userEmail: user.email
      });

      if (response.data.message) {
        setTasks(tasks.map(task =>
          task._id === taskId ? { ...task, status: newStatus } : task
        ));
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      alert(error.response?.data?.message || 'Failed to update task status');
    }
  };

  const addMeeting = () => {
    setShowMeetingForm(true);
  };

  const handleMeetingSubmit = async (e) => {
    e.preventDefault();
    
    // Debug logging
    console.log('Meeting Form Data:', meetingForm);
    
    // Validate required fields
    if (!meetingForm.title.trim()) {
      alert('Please enter a meeting title');
      return;
    }
    if (!meetingForm.meetingDate) {
      alert('Please select a meeting date');
      return;
    }
    if (!meetingForm.meetingTime) {
      alert('Please select a meeting time');
      return;
    }
    
    try {
      const response = await axios.post('/api/meetings', {
        projectId: id,
        title: meetingForm.title,
        scheduledBy: user.email,
        scheduledByName: user.name,
        meetingDate: meetingForm.meetingDate,
        meetingTime: meetingForm.meetingTime,
        duration: meetingForm.duration || 60,
        meetingLink: meetingForm.meetingLink || '',
        location: meetingForm.location || 'Online',
        agenda: meetingForm.agenda
      });

        if (response.data.message) {
          alert('Meeting scheduled successfully! Email invitations sent to all team members.');
          setMeetings([...meetings, response.data.meeting]);
          setMeetingForm({ 
            title: '', 
            meetingDate: '', 
            meetingTime: '', 
            duration: 60,
            meetingLink: '',
            location: 'Online',
            agenda: ''
          });
          setShowMeetingForm(false);
        }
      } catch (error) {
        console.error('Error scheduling meeting:', error);
        alert(error.response?.data?.message || 'Failed to schedule meeting');
      }
  };

  const handleMeetingFormChange = (field, value) => {
    setMeetingForm(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return <div className="loading">Loading project details...</div>;
  if (!project) return <div className="error">Project not found</div>;

  return (
    <div className="project-details">
      <Header
        user={user}
        onLogout={onLogout}
        onLoginRequired={() => navigate('/login')}
      />
      <div className="project-details-content">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back to Dashboard
        </button>

        <div className="project-header-section">
          <div className="project-title-area">
            <h1>{project.title}</h1>
            <div className="project-badges">
              <span className={`status-badge ${project.status}`}>
                {project.status?.charAt(0).toUpperCase() + project.status?.slice(1)}
              </span>
              {isUserCreator() && <span className="creator-badge">Project Lead</span>}
              {isUserMember() && !isUserCreator() && <span className="member-badge">Team Member</span>}
            </div>
          </div>

          {!isUserMember() && !isUserCreator() && (
            <button className="join-project-btn" onClick={handleJoinProject}>
              Join Project
            </button>
          )}
        </div>

        <div className="project-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </button>
          <button
            className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            Resources
          </button>
          <button
            className={`tab-btn ${activeTab === 'connect' ? 'active' : ''}`}
            onClick={() => setActiveTab('connect')}
          >
            Connect
          </button>
          <button
            className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            Schedule
          </button>
          {isUserCreator() && (
            <button
              className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              Requests ({joinRequests.filter(req => req.status === 'pending').length})
            </button>
          )}
        </div>

        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-section">
              <div className="overview-grid">
                <div className="overview-card">
                  <h3>Project Progress</h3>
                  <div className="progress-circle">
                    <span className="progress-text">{calculateProgress()}%</span>
                  </div>
                  <p>{tasks.filter(t => t.status === 'completed').length} of {tasks.length} tasks completed</p>
                </div>

                <div className="overview-card">
                  <h3>Team Size</h3>
                  <div className="team-count">
                    <span className="count">{project.members?.length || 0}</span>
                    <span className="max">/ {project.maxMembers || project.maxTeamSize}</span>
                  </div>
                  <p>Active team members</p>
                </div>

                <div className="overview-card">
                  <h3>Next Deadline</h3>
                  <div className="deadline">
                    {tasks.filter(t => t.status !== 'completed').length > 0 ? (
                      <>
                        <span className="date">{tasks.filter(t => t.status !== 'completed')[0]?.dueDate}</span>
                        <p>{tasks.filter(t => t.status !== 'completed')[0]?.title}</p>
                      </>
                    ) : (
                      <p>No pending tasks</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="project-description">
                <h3>About This Project</h3>
                <p>{project.description}</p>
              </div>

              <div className="project-skills">
                <h3>Required Skills</h3>
                <div className="skills-tags">
                  {project.skills?.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>

              <div className="team-overview">
                <h3>Team Members</h3>
                {project.members && project.members.length > 0 ? (
                  <div className="team-grid">
                    {project.creator && (
                      <div className="team-member-card lead">
                        <h4>{project.creator}</h4>
                        <p>Project Lead</p>
                        <span className="lead-badge">LEAD</span>
                      </div>
                    )}
                    {project.members.map((member, index) => (
                      member.email !== project.creatorEmail && (
                        <div key={index} className="team-member-card">
                          <h4>{member.name}</h4>
                          <p>Team Member</p>
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">No team members yet. Be the first to join!</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="tasks-section">
              <div className="section-header">
                <h3>Project Tasks</h3>
                {(isUserMember() || isUserCreator()) && (
                  <button className="add-btn" onClick={addTask}>+ Add Task</button>
                )}
              </div>

              <div className="tasks-grid">
                {tasks.map(task => (
                  <div key={task._id} className={`task-card ${task.status}`}>
                    <div className="task-header">
                      <h4>{task.title}</h4>
                      <span className={`priority-badge ${task.priority}`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                    </div>
                    {task.description && (
                      <div className="task-description">
                        <p>{task.description}</p>
                      </div>
                    )}
                    <div className="task-details">
                      <p><strong>Assigned to:</strong> {task.assignedToName} ({task.assignedTo})</p>
                      <p><strong>Assigned by:</strong> {task.assignedByName}</p>
                      {task.dueDate && (
                        <p><strong>Due:</strong> {new Date(task.dueDate).toLocaleDateString()}</p>
                      )}
                      <p><strong>Created:</strong> {new Date(task.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="task-status">
                      <span className={`status-indicator ${task.status}`}></span>
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                        disabled={task.assignedTo !== user?.email && !isUserCreator()}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {tasks.length === 0 && (
                <div className="empty-state">
                  <p>No tasks yet. Create your first task to get started!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="resources-section">
              <div className="section-header">
                <h3>Project Resources</h3>
                {(isUserMember() || isUserCreator()) && (
                  <button className="add-btn">+ Upload File</button>
                )}
              </div>

              <div className="resources-list">
                {resources.map(resource => (
                  <div key={resource.id} className="resource-item">
                    <div className="resource-icon">
                      {resource.type === 'document' && '📄'}
                      {resource.type === 'design' && '🎨'}
                      {resource.type === 'link' && '🔗'}
                    </div>
                    <div className="resource-info">
                      <h4>{resource.name}</h4>
                      <p>Uploaded by {resource.uploadedBy} on {resource.uploadDate}</p>
                    </div>
                    <button className="download-btn">Download</button>
                  </div>
                ))}
              </div>

              {resources.length === 0 && (
                <div className="empty-state">
                  <p>No resources uploaded yet. Share files to collaborate better!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'connect' && (
            <div className="connect-section">
              <h3>Team Chat</h3>
              <div className="chat-container">
                <div className="chat-placeholder">
                  <p>💬 Chat functionality coming soon!</p>
                  <p>Connect with your team members in real-time</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="schedule-section">
              <div className="section-header">
                <h3>Meetings & Schedule</h3>
                {(isUserMember() || isUserCreator()) && (
                  <button className="add-btn" onClick={addMeeting}>+ Schedule Meeting</button>
                )}
              </div>

              <div className="meetings-list">
                {meetings.map(meeting => (
                  <div key={meeting._id} className="meeting-item">
                    <div className="meeting-header">
                      <h4>{meeting.title}</h4>
                      <span className="meeting-date">
                        {new Date(meeting.meetingDate).toLocaleDateString()} at {meeting.meetingTime}
                      </span>
                      <span className="meeting-duration">({meeting.duration} min)</span>
                    </div>
                    
                    <div className="meeting-details">
                      <div className="meeting-info">
                        <span className="meeting-location">📍 {meeting.location}</span>
                        <span className="scheduled-by">Scheduled by: {meeting.scheduledByName}</span>
                      </div>
                      
                      {meeting.agenda && (
                        <div className="meeting-agenda">
                          <strong>Agenda:</strong>
                          <div className="agenda-items">
                            {meeting.agenda.split('\n').map((item, index) => (
                              item.trim() && <div key={index} className="agenda-item">• {item.trim()}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="meeting-actions">
                      {meeting.meetingLink ? (
                        <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="join-btn">
                          Join Meeting
                        </a>
                      ) : (
                        <span className="no-link">Link pending</span>
                      )}
                      <span className="attendee-count">
                        {meeting.attendees?.length || 0} attendees
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {meetings.length === 0 && (
                <div className="empty-state">
                  <p>No meetings scheduled yet. Schedule your first team meeting!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && isUserCreator() && (
            <div className="requests-section">
              <div className="section-header">
                <h3>Join Requests</h3>
                <p className="section-description">Review and manage requests to join your project</p>
              </div>

              {requestsLoading ? (
                <div className="loading">Loading requests...</div>
              ) : (
                <div className="requests-list">
                  {joinRequests.length > 0 ? (
                    joinRequests.map(request => (
                      <div key={request._id} className={`request-card ${request.status}`}>
                        <div className="request-info">
                          <div className="requester-details">
                            <div className="requester-avatar">
                              {request.requesterName?.charAt(0).toUpperCase()}
                            </div>
                            <div className="requester-text">
                              <div className="requester-header">
                                <h4>{request.requesterName}</h4>
                                <button 
                                  className="view-profile-btn"
                                  onClick={() => navigate(`/profile/${request.requesterEmail}`)}
                                  title="View profile"
                                >
                                  � View Profile
                                </button>
                              </div>
                              <p className="requester-email">{request.requesterEmail}</p>
                              <p className="request-date">
                                Requested on {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                              {request.message && (
                                <div className="request-message">
                                  <p className="message-label">Message:</p>
                                  <div className="message-content">
                                    "{request.message}"
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="request-status">
                            <span className={`status-badge ${request.status}`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        
                        {request.status === 'pending' && (
                          <div className="request-actions">
                            <button 
                              className="approve-btn"
                              onClick={() => handleApproveRequest(request._id, request.requesterId, request.requesterName)}
                            >
                              ✓ Approve
                            </button>
                            <button 
                              className="reject-btn"
                              onClick={() => handleRejectRequest(request._id)}
                            >
                              ✗ Reject
                            </button>
                          </div>
                        )}

                        {request.status === 'accepted' && (
                          <div className="request-feedback">
                            <p className="success-message">✓ Request approved - Member added to project</p>
                          </div>
                        )}

                        {request.status === 'rejected' && (
                          <div className="request-feedback">
                            <p className="reject-message">✗ Request rejected</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">📨</div>
                      <h3>No Join Requests</h3>
                      <p>No one has requested to join your project yet. Share your project to attract collaborators!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="modal-overlay" onClick={() => setShowTaskForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Task</h3>
              <button className="close-btn" onClick={() => setShowTaskForm(false)}>×</button>
            </div>
            <form onSubmit={handleTaskSubmit} className="task-form">
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => handleTaskFormChange('title', e.target.value)}
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => handleTaskFormChange('description', e.target.value)}
                  placeholder="Enter task description"
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Assign To *</label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={(e) => {
                      const selectedEmail = e.target.value;
                      const selectedMember = project?.members?.find(email => email === selectedEmail);
                      const selectedName = selectedMember ? selectedMember : selectedEmail;
                      handleTaskFormChange('assignedTo', selectedEmail);
                      handleTaskFormChange('assignedToName', selectedName);
                    }}
                    required
                  >
                    <option value="">Select team member</option>
                    {project?.members?.map((memberEmail, index) => (
                      <option key={index} value={memberEmail}>
                        {memberEmail}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => handleTaskFormChange('priority', e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => handleTaskFormChange('dueDate', e.target.value)}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowTaskForm(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create & Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meeting Form Modal */}
      {showMeetingForm && (
        <div className="modal-overlay" onClick={() => setShowMeetingForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Schedule New Meeting</h3>
              <button className="close-btn" onClick={() => setShowMeetingForm(false)}>×</button>
            </div>
            <form onSubmit={handleMeetingSubmit} className="meeting-form">
              <div className="form-group">
                <label>Meeting Title *</label>
                <input
                  type="text"
                  value={meetingForm.title}
                  onChange={(e) => handleMeetingFormChange('title', e.target.value)}
                  placeholder="Enter meeting title"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Agenda</label>
                <textarea
                  value={meetingForm.agenda}
                  onChange={(e) => handleMeetingFormChange('agenda', e.target.value)}
                  placeholder="Meeting agenda items (one per line)"
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={meetingForm.meetingDate}
                    onChange={(e) => handleMeetingFormChange('meetingDate', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Time *</label>
                  <input
                    type="time"
                    value={meetingForm.meetingTime}
                    onChange={(e) => handleMeetingFormChange('meetingTime', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <select
                    value={meetingForm.duration}
                    onChange={(e) => handleMeetingFormChange('duration', parseInt(e.target.value))}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <select
                    value={meetingForm.location}
                    onChange={(e) => handleMeetingFormChange('location', e.target.value)}
                  >
                    <option value="Online">Online</option>
                    <option value="Office">Office</option>
                    <option value="Client Site">Client Site</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Meeting Link</label>
                  <input
                    type="text"
                    value={meetingForm.meetingLink}
                    onChange={(e) => handleMeetingFormChange('meetingLink', e.target.value)}
                    placeholder="https://meet.google.com/... (optional)"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowMeetingForm(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Schedule Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
