const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Get all messages for a project
router.get('/projects/:projectId/messages', async (req, res) => {
  try {
    console.log('Fetching messages for project:', req.params.projectId);
    const messages = await Message.find({ projectId: req.params.projectId })
      .sort({ timestamp: 1 });
    
    // Convert messages to plain objects and ensure consistent timestamp format
    const formattedMessages = messages.map(message => ({
      ...message.toObject(),
      _id: message._id.toString(),
      timestamp: message.timestamp.toISOString()
    }));
    
    console.log('Found messages:', formattedMessages.length);
    res.json(formattedMessages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

module.exports = router;