const express = require('express');
const Project = require('../models/Project');
const User = require('../models/User');

const router = express.Router();

// Get user statistics
router.get('/:email/stats', async (req, res) => {
  try {
    const userEmail = req.params.email;
    
    // Get projects created by user
    const projectsCreated = await Project.countDocuments({ 
      creatorEmail: userEmail 
    });
    
    // Get projects joined by user (but not created by them)
    const projectsJoined = await Project.countDocuments({
      members: userEmail,
      creatorEmail: { $ne: userEmail }
    });
    
    // For now, total contributions is the sum of created and joined projects
    const totalContributions = projectsCreated + projectsJoined;
    
    res.json({
      projectsCreated,
      projectsJoined,
      totalContributions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user profile by email
router.get('/profile/:email', async (req, res) => {
  try {
    const userEmail = req.params.email;
    
    // Find user in User collection
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return public profile information (excluding sensitive data like password)
    const publicProfile = {
      name: user.name,
      email: user.email,
      college: user.college,
      education: user.education,
      bio: user.about || '',
      skills: user.skills || [],
      projectsDone: user.projectsDone || [],
      linkedin: user.linkedin || '',
      github: user.github || ''
    };
    
    res.json(publicProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // For now, we'll update the user data and return it
    // In a real app, you'd verify the JWT token and get the user ID
    const { name, email, college, bio, skills, linkedin, github } = req.body;
    
    // Since we don't have a full User model with profile fields yet,
    // we'll just return the updated data for the frontend to store in localStorage
    const updatedUser = {
      name,
      email,
      college,
      bio,
      skills,
      linkedin,
      github
    };
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user settings
router.get('/settings', async (req, res) => {
  try {
    // In a real app, you'd verify JWT token and get user ID
    // For now, we'll return default settings
    const defaultSettings = {
      privacy: {
        profileVisibility: 'public',
        emailNotifications: true,
        projectInviteNotifications: true,
        taskAssignmentNotifications: true,
        meetingInviteNotifications: true,
        showEmail: true,
        showCollege: true,
        showSkills: true
      },
      account: {
        twoFactorAuth: false,
        sessionTimeout: '24h'
      }
    };
    
    res.json(defaultSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update privacy settings
router.put('/settings/privacy', async (req, res) => {
  try {
    // In a real app, you'd verify JWT and update user-specific settings
    // For now, we'll just return success
    res.json({ message: 'Privacy settings updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update account settings
router.put('/settings/account', async (req, res) => {
  try {
    // In a real app, you'd verify JWT and update user-specific settings
    // For now, we'll just return success
    res.json({ message: 'Account settings updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user account
router.delete('/account', async (req, res) => {
  try {
    // In a real app, you'd verify JWT token and delete user account
    // This is a dangerous operation and should have multiple confirmations
    res.json({ message: 'Account deletion initiated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download user data
router.get('/download-data', async (req, res) => {
  try {
    // In a real app, you'd verify JWT and compile user's data
    const userData = {
      message: 'This would contain all user data in a real implementation',
      timestamp: new Date().toISOString(),
      note: 'Data export functionality would be implemented here'
    };
    
    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;