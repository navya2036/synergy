import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Header from './Header';
import './Settings.css';

const Settings = ({ user, onLogin, onLogout }) => {
  const [activeTab, setActiveTab] = useState('password');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    emailNotifications: true,
    projectInviteNotifications: true,
    taskAssignmentNotifications: true,
    meetingInviteNotifications: true,
    showEmail: true,
    showCollege: true,
    showSkills: true
  });

  // Account settings state
  const [accountSettings, setAccountSettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: '24h',
    dataDownload: false
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Load user settings
    loadUserSettings();
  }, [user, navigate]);

  const loadUserSettings = async () => {
    try {
      const response = await api.get('/api/users/settings', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data) {
        setPrivacySettings(prev => ({ ...prev, ...response.data.privacy }));
        setAccountSettings(prev => ({ ...prev, ...response.data.account }));
      }
    } catch (error) {
      console.log('Settings not found, using defaults');
    }
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('New passwords do not match', 'error');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      showMessage('New password must be at least 6 characters long', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        email: user.email
      });

      if (response.data.message) {
        showMessage('Password changed successfully!', 'success');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to change password', 'error');
    }
    setLoading(false);
  };

  const handlePrivacySettingsChange = async (setting, value) => {
    const updatedSettings = { ...privacySettings, [setting]: value };
    setPrivacySettings(updatedSettings);

    try {
      await api.put('/api/users/settings/privacy', updatedSettings, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      showMessage('Privacy settings updated', 'success');
    } catch (error) {
      showMessage('Failed to update privacy settings', 'error');
    }
  };

  const handleAccountSettingsChange = async (setting, value) => {
    const updatedSettings = { ...accountSettings, [setting]: value };
    setAccountSettings(updatedSettings);

    try {
      await api.put('/api/users/settings/account', updatedSettings, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      showMessage('Account settings updated', 'success');
    } catch (error) {
      showMessage('Failed to update account settings', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      if (window.confirm('This will permanently delete all your projects and data. Type DELETE to confirm:')) {
        const confirmation = prompt('Please type DELETE to confirm account deletion:');
        if (confirmation === 'DELETE') {
          try {
            await api.delete('/api/users/account', {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            showMessage('Account deleted successfully', 'success');
            setTimeout(() => {
              onLogout();
              navigate('/');
            }, 2000);
          } catch (error) {
            showMessage('Failed to delete account', 'error');
          }
        }
      }
    }
  };

  const handleDataDownload = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users/download-data', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${user.name}-data-export.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showMessage('Data download started', 'success');
    } catch (error) {
      showMessage('Failed to download data', 'error');
    }
    setLoading(false);
  };

  if (!user) {
    return <div className="loading">Please log in to access settings</div>;
  }

  return (
    <div className="settings-page">
      <Header user={user} onLogout={onLogout} />
      
      <div className="settings-container">
        <div className="settings-sidebar">
          <h2>Settings</h2>
          <nav className="settings-nav">
            <button 
              className={activeTab === 'password' ? 'active' : ''}
              onClick={() => setActiveTab('password')}
            >
              🔒 Change Password
            </button>
            <button 
              className={activeTab === 'privacy' ? 'active' : ''}
              onClick={() => setActiveTab('privacy')}
            >
              🛡️ Privacy Settings
            </button>
            <button 
              className={activeTab === 'notifications' ? 'active' : ''}
              onClick={() => setActiveTab('notifications')}
            >
              🔔 Notifications
            </button>
            <button 
              className={activeTab === 'account' ? 'active' : ''}
              onClick={() => setActiveTab('account')}
            >
              ⚙️ Account Settings
            </button>
          </nav>
        </div>

        <div className="settings-content">
          {message && (
            <div className={`message ${messageType}`}>
              {message}
            </div>
          )}

          {activeTab === 'password' && (
            <div className="settings-section">
              <h3>Change Password</h3>
              <p>Keep your account secure by using a strong password</p>
              
              <form onSubmit={handlePasswordChange} className="password-form">
                <div className="form-group">
                  <label>Current Password *</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      currentPassword: e.target.value
                    }))}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>New Password *</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                    minLength="6"
                    required
                  />
                  <small>Password must be at least 6 characters long</small>
                </div>
                
                <div className="form-group">
                  <label>Confirm New Password *</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      confirmPassword: e.target.value
                    }))}
                    required
                  />
                </div>
                
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="settings-section">
              <h3>Privacy Settings</h3>
              <p>Control who can see your information</p>
              
              <div className="settings-group">
                <h4>Profile Visibility</h4>
                <div className="setting-item">
                  <label>Who can view your profile?</label>
                  <select 
                    value={privacySettings.profileVisibility}
                    onChange={(e) => handlePrivacySettingsChange('profileVisibility', e.target.value)}
                  >
                    <option value="public">Everyone</option>
                    <option value="registered">Registered users only</option>
                    <option value="connections">My connections only</option>
                  </select>
                </div>
                
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={privacySettings.showEmail}
                      onChange={(e) => handlePrivacySettingsChange('showEmail', e.target.checked)}
                    />
                    Show email address on profile
                  </label>
                </div>
                
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={privacySettings.showCollege}
                      onChange={(e) => handlePrivacySettingsChange('showCollege', e.target.checked)}
                    />
                    Show college information
                  </label>
                </div>
                
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={privacySettings.showSkills}
                      onChange={(e) => handlePrivacySettingsChange('showSkills', e.target.checked)}
                    />
                    Show skills and expertise
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h3>Notification Preferences</h3>
              <p>Choose what notifications you want to receive</p>
              
              <div className="settings-group">
                <h4>Email Notifications</h4>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={privacySettings.emailNotifications}
                      onChange={(e) => handlePrivacySettingsChange('emailNotifications', e.target.checked)}
                    />
                    Enable email notifications
                  </label>
                </div>
                
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={privacySettings.projectInviteNotifications}
                      onChange={(e) => handlePrivacySettingsChange('projectInviteNotifications', e.target.checked)}
                    />
                    Project invitations and join requests
                  </label>
                </div>
                
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={privacySettings.taskAssignmentNotifications}
                      onChange={(e) => handlePrivacySettingsChange('taskAssignmentNotifications', e.target.checked)}
                    />
                    Task assignments and updates
                  </label>
                </div>
                
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={privacySettings.meetingInviteNotifications}
                      onChange={(e) => handlePrivacySettingsChange('meetingInviteNotifications', e.target.checked)}
                    />
                    Meeting invitations and reminders
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="settings-section">
              <h3>Account Settings</h3>
              <p>Manage your account security and preferences</p>
              
              <div className="settings-group">
                <h4>Security</h4>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={accountSettings.twoFactorAuth}
                      onChange={(e) => handleAccountSettingsChange('twoFactorAuth', e.target.checked)}
                    />
                    Enable Two-Factor Authentication
                  </label>
                  <small>Add an extra layer of security to your account</small>
                </div>
                
                <div className="setting-item">
                  <label>Session Timeout</label>
                  <select 
                    value={accountSettings.sessionTimeout}
                    onChange={(e) => handleAccountSettingsChange('sessionTimeout', e.target.value)}
                  >
                    <option value="1h">1 hour</option>
                    <option value="8h">8 hours</option>
                    <option value="24h">24 hours</option>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                  </select>
                  <small>Automatically log out after this period of inactivity</small>
                </div>
              </div>
              
              <div className="settings-group danger-zone">
                <h4>Danger Zone</h4>
                <div className="setting-item">
                  <button className="delete-account-btn" onClick={handleDeleteAccount}>
                    Delete Account
                  </button>
                  <small>Permanently delete your account and all associated data</small>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
};

export default Settings;