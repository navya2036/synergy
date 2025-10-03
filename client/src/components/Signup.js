import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const Signup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    college: '',
    education: '',
    skills: '',
    about: '',
    projectsDone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.college || !formData.education || !formData.about) {
      setError('Please fill in all required fields');
      return false;
    }
    return true;
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    setError('');

    try {
      const skillsArray = formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
      const projectsArray = formData.projectsDone.split(',').map(project => project.trim()).filter(project => project);

      const response = await axios.post('/api/auth/register', {
        ...formData,
        skills: skillsArray,
        projectsDone: projectsArray
      });

      setUserId(response.data.userId);
      setCurrentStep(3);
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/verify-otp', {
        userId,
        otp
      });

      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      alert('Account created successfully! Welcome to Synergy Platform.');
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');

    try {
      await axios.post('/api/auth/resend-otp', { userId });
      alert('OTP sent successfully! Please check your email.');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <form onSubmit={handleStep1Submit} className="auth-form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="name">Full Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Enter your full name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email Address *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="Enter your email"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password *</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          placeholder="Enter your password (min 6 characters)"
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password *</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          placeholder="Confirm your password"
        />
      </div>

      <button type="submit" className="auth-button">
        Next
      </button>
    </form>
  );

  const renderStep2 = () => (
    <form onSubmit={handleStep2Submit} className="auth-form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="college">College/University *</label>
        <input
          type="text"
          id="college"
          name="college"
          value={formData.college}
          onChange={handleChange}
          required
          placeholder="Enter your college or university"
        />
      </div>

      <div className="form-group">
        <label htmlFor="education">Education Level *</label>
        <select
          id="education"
          name="education"
          value={formData.education}
          onChange={handleChange}
          required
        >
          <option value="">Select your education level</option>
          <option value="Bachelor's">Bachelor's Degree</option>
          <option value="Master's">Master's Degree</option>
          <option value="PhD">PhD</option>
          <option value="Diploma">Diploma</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="skills">Skills (comma-separated)</label>
        <input
          type="text"
          id="skills"
          name="skills"
          value={formData.skills}
          onChange={handleChange}
          placeholder="e.g., React, Python, UI/UX Design, Machine Learning"
        />
      </div>

      <div className="form-group">
        <label htmlFor="about">About Yourself *</label>
        <textarea
          id="about"
          name="about"
          value={formData.about}
          onChange={handleChange}
          required
          rows="4"
          placeholder="Tell us about yourself, your interests, and what you're looking for in team projects"
        />
      </div>

      <div className="form-group">
        <label htmlFor="projectsDone">Previous Projects (comma-separated)</label>
        <textarea
          id="projectsDone"
          name="projectsDone"
          value={formData.projectsDone}
          onChange={handleChange}
          rows="3"
          placeholder="e.g., E-commerce Website, Mobile App, Data Analysis Project"
        />
      </div>

      <div className="form-buttons">
        <button 
          type="button" 
          className="auth-button secondary"
          onClick={() => setCurrentStep(1)}
        >
          Back
        </button>
        <button 
          type="submit" 
          className="auth-button"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </div>
    </form>
  );

  const renderStep3 = () => (
    <form onSubmit={handleOtpSubmit} className="auth-form">
      <div className="otp-info">
        <h3>Verify Your Email</h3>
        <p>We've sent a 6-digit OTP to your email address. Please enter it below to verify your account.</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="otp">Enter OTP</label>
        <input
          type="text"
          id="otp"
          name="otp"
          value={otp}
          onChange={handleOtpChange}
          required
          maxLength="6"
          placeholder="Enter 6-digit OTP"
          className="otp-input"
        />
      </div>

      <button 
        type="submit" 
        className="auth-button"
        disabled={loading}
      >
        {loading ? 'Verifying...' : 'Verify Account'}
      </button>

      <div className="resend-otp">
        <p>
          Didn't receive OTP? 
          <button 
            type="button" 
            className="link-button"
            onClick={handleResendOtp}
            disabled={loading}
          >
            Resend OTP
          </button>
        </p>
      </div>
    </form>
  );

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Join Synergy Platform</h2>
          <p>
            {currentStep === 1 && 'Create your account - Step 1 of 2'}
            {currentStep === 2 && 'Complete your profile - Step 2 of 2'}
            {currentStep === 3 && 'Verify your email address'}
          </p>
        </div>

        <div className="step-indicator">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
        </div>

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        {currentStep < 3 && (
          <div className="auth-footer">
            <p>
              Already have an account? 
              <Link to="/login" className="auth-link"> Sign in here</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;