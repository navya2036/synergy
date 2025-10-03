const express = require('express');
const JoinRequest = require('../models/JoinRequest');
const Project = require('../models/Project');
const User = require('../models/User');

const router = express.Router();

// Send join request
router.post('/request/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      requesterId,
      requesterName,
      requesterEmail,
      requesterSkills,
      requesterCollege,
      message
    } = req.body;

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
    if (project.members && project.members.includes(requesterEmail)) {
      return res.status(400).json({ message: 'You are already a member of this project' });
    }

    // Check if user is the project owner
    if (project.creatorEmail === requesterEmail) {
      return res.status(400).json({ message: 'You are the owner of this project' });
    }

    // Check if request already exists
    const existingRequest = await JoinRequest.findOne({
      projectId,
      requesterId,
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

    // Create join request
    const joinRequest = new JoinRequest({
      projectId,
      projectTitle: project.title,
      requesterId,
      requesterName,
      requesterEmail,
      requesterSkills: requesterSkills || [],
      requesterCollege: requesterCollege || '',
      message: message || '',
      ownerId: owner._id,
      ownerEmail: owner.email
    });

    await joinRequest.save();

    res.status(201).json({
      message: 'Join request sent successfully',
      request: joinRequest
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get join requests for a project owner
router.get('/owner/:ownerEmail', async (req, res) => {
  try {
    const { ownerEmail } = req.params;
    const { status } = req.query; // optional filter by status

    const filter = { ownerEmail };
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
router.get('/requester/:requesterEmail', async (req, res) => {
  try {
    const { requesterEmail } = req.params;
    const { status } = req.query; // optional filter by status

    const filter = { requesterEmail };
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
router.put('/respond/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, ownerEmail } = req.body; // status: 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "accepted" or "rejected"' });
    }

    const joinRequest = await JoinRequest.findById(requestId);
    if (!joinRequest) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    // Verify owner
    if (joinRequest.ownerEmail !== ownerEmail) {
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
        return res.status(400).json({ message: 'Project is now full, request automatically rejected' });
      }

      // Add user to project members if not already added
      if (!project.members.includes(joinRequest.requesterEmail)) {
        project.members.push(joinRequest.requesterEmail);
        await project.save();
      }
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
router.delete('/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { userEmail } = req.body;

    const joinRequest = await JoinRequest.findById(requestId);
    if (!joinRequest) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    // Only requester or owner can delete
    if (joinRequest.requesterEmail !== userEmail && joinRequest.ownerEmail !== userEmail) {
      return res.status(403).json({ message: 'Not authorized to delete this request' });
    }

    await JoinRequest.findByIdAndDelete(requestId);

    res.json({ message: 'Join request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all join requests for a specific project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { ownerEmail } = req.query;

    // Verify ownership if ownerEmail is provided
    if (ownerEmail) {
      const project = await Project.findById(projectId);
      if (!project || project.creatorEmail !== ownerEmail) {
        return res.status(403).json({ message: 'Not authorized to view requests for this project' });
      }
    }

    const requests = await JoinRequest.find({ projectId })
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;