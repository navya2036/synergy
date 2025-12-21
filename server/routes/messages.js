const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all messages for a project
router.get('/projects/:projectId/messages', auth, async (req, res) => {
  try {
    // Get authenticated user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify user is a member of the project
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is member or creator
    if (!project.members.includes(user.email) && project.creatorEmail !== user.email) {
      return res.status(403).json({ message: 'Not authorized to view messages for this project' });
    }

    const messages = await Message.find({ projectId: req.params.projectId })
      .sort({ timestamp: 1 });
    
    // Convert messages to plain objects and ensure consistent timestamp format
    const formattedMessages = messages.map(message => ({
      ...message.toObject(),
      _id: message._id.toString(),
      timestamp: message.timestamp.toISOString()
    }));
    
    res.json(formattedMessages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

module.exports = router;