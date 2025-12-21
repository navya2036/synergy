const express = require('express');
const JoinRequest = require('../models/JoinRequest');
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Send join request
router.post('/request/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { message } = req.body;

    // Get authenticated user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if project is full
    if (project.members && project.members.length >= project.maxMembers) {
      return res.status(400).json({ message: 'Project is full' });
    }

    // Check if user is already a member
    if (project.members && project.members.includes(user.email)) {
      return res.status(400).json({ message: 'You are already a member of this project' });
    }

    // Check if user is the project owner
    if (project.creatorEmail === user.email) {
      return res.status(400).json({ message: 'You are the owner of this project' });
    }

    // Check if request already exists
    const existingRequest = await JoinRequest.findOne({
      projectId,
      requesterId: user._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Join request already sent and pending' });
    }

    // Get project owner info
    const owner = await User.findOne({ email: project.creatorEmail });
    if (!owner) {
      return res.status(404).json({ message: 'Project owner not found' });
    }

    // Create join request using authenticated user's data
    const joinRequest = new JoinRequest({
      projectId,
      projectTitle: project.title,
      requesterId: user._id,
      requesterName: user.name,
      requesterEmail: user.email,
      requesterSkills: user.skills || [],
      requesterCollege: user.college || '',
      message: message || '',
      ownerId: owner._id,
      ownerEmail: owner.email
    });

    await joinRequest.save();

    // Send email notification to project owner
    const { sendJoinRequestEmail } = require('../utils/email');
    await sendJoinRequestEmail(
      owner.email,
      owner.name || owner.email,
      user.name,
      project.title,
      message || `${user.name} would like to join your project.`
    );

    res.status(201).json({
      message: 'Join request sent successfully',
      request: joinRequest
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get join requests for a project owner
router.get('/owner/:ownerEmail', auth, async (req, res) => {
  try {
    // Get authenticated user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { status } = req.query; // optional filter by status

    const filter = { ownerEmail: user.email }; // Use authenticated user's email
    if (status) {
      filter.status = status;
    }

    const requests = await JoinRequest.find(filter)
      .populate('projectId', 'title description')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get join requests sent by a user
router.get('/requester/:requesterEmail', auth, async (req, res) => {
  try {
    // Get authenticated user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { status } = req.query; // optional filter by status

    const filter = { requesterEmail: user.email }; // Use authenticated user's email
    if (status) {
      filter.status = status;
    }

    const requests = await JoinRequest.find(filter)
      .populate('projectId', 'title description')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Respond to join request (accept/reject)
router.put('/respond/:requestId', auth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body; // status: 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "accepted" or "rejected"' });
    }

    // Get authenticated user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const joinRequest = await JoinRequest.findById(requestId);
    if (!joinRequest) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    // Verify owner using authenticated user's email
    if (joinRequest.ownerEmail !== user.email) {
      return res.status(403).json({ message: 'Not authorized to respond to this request' });
    }

    if (joinRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been responded to' });
    }

    // Update request status
    joinRequest.status = status;
    joinRequest.respondedAt = new Date();
    await joinRequest.save();

    // If accepted, add user to project members
    if (status === 'accepted') {
      const project = await Project.findById(joinRequest.projectId);

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Check if project is still not full
      if (project.members && project.members.length >= project.maxMembers) {
        // Update request to rejected since project is now full
        joinRequest.status = 'rejected';
        await joinRequest.save();

        // Send rejection email due to project being full
        const { sendRequestResponseEmail } = require('../utils/email');
        await sendRequestResponseEmail(
          joinRequest.requesterEmail,
          joinRequest.requesterName,
          project.title,
          'rejected',
          user.name
        );

        return res.status(400).json({ message: 'Project is now full, request automatically rejected' });
      }

      // Add user to project members if not already added
      if (!project.members.includes(joinRequest.requesterEmail)) {
        project.members.push(joinRequest.requesterEmail);
        await project.save();

        // Send acceptance email
        const { sendRequestResponseEmail } = require('../utils/email');
        await sendRequestResponseEmail(
          joinRequest.requesterEmail,
          joinRequest.requesterName,
          project.title,
          'accepted',
          user.name
        );
      }
    } else if (status === 'rejected') {
      // Fetch project for rejection email
      const project = await Project.findById(joinRequest.projectId);
      // Send rejection email
      const { sendRequestResponseEmail } = require('../utils/email');
      await sendRequestResponseEmail(
        joinRequest.requesterEmail,
        joinRequest.requesterName,
        project ? project.title : joinRequest.projectTitle,
        'rejected',
        user.name
      );
    }

    res.json({
      message: `Request ${status} successfully`,
      request: joinRequest
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete/withdraw join request
router.delete('/:requestId', auth, async (req, res) => {
  try {
    const { requestId } = req.params;

    // Get authenticated user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const joinRequest = await JoinRequest.findById(requestId);
    if (!joinRequest) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    // Only requester or owner can delete (using authenticated user's email)
    if (joinRequest.requesterEmail !== user.email && joinRequest.ownerEmail !== user.email) {
      return res.status(403).json({ message: 'Not authorized to delete this request' });
    }

    await JoinRequest.findByIdAndDelete(requestId);

    res.json({ message: 'Join request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all join requests for a specific project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Get authenticated user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify ownership using authenticated user
    const project = await Project.findById(projectId);
    if (!project || project.creatorEmail !== user.email) {
      return res.status(403).json({ message: 'Not authorized to view requests for this project' });
    }

    const requests = await JoinRequest.find({ projectId })
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;