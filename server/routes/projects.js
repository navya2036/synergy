const express = require('express');
const Project = require('../models/Project');
const JoinRequest = require('../models/JoinRequest');
const Task = require('../models/Task');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new project
router.post('/', auth, async (req, res) => {
  try {
    // Get user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create project with authenticated user's data
    const project = new Project({
      ...req.body,
      creatorEmail: user.email,
      creator: user.name
    });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get single project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Populate member details (excluding the creator)
    const memberEmails = project.members.filter(email => email !== project.creatorEmail);
    const membersWithDetails = await Promise.all(
      memberEmails.map(async (memberEmail) => {
        const user = await User.findOne({ email: memberEmail }).select('name email skills college');
        if (user) {
          return { 
            name: user.name, 
            email: user.email,
            skills: user.skills || [],
            college: user.college || ''
          };
        }
        return null;
      })
    );
    
    // Filter out null values (users not found)
    const validMembers = membersWithDetails.filter(member => member !== null);
    
    // Return project with populated members
    const projectData = project.toObject();
    projectData.membersDetails = validMembers;
    
    res.json(projectData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get projects by user (created by user and joined by user)
router.get('/user/:email', auth, async (req, res) => {
  try {
    // Get authenticated user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userEmail = user.email; // Use authenticated user's email, not from params
    
    // Find projects created by the user
    const createdProjects = await Project.find({ 
      creatorEmail: userEmail 
    }).sort({ createdAt: -1 });
    
    // Find projects where user is a member but not the creator
    const joinedProjects = await Project.find({
      members: userEmail,
      creatorEmail: { $ne: userEmail }
    }).sort({ createdAt: -1 });
    
    res.json({
      created: createdProjects,
      joined: joinedProjects
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Join a project
router.post('/:id/join', auth, async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // Get authenticated user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if project is full
    if (project.members.length >= project.maxMembers) {
      return res.status(400).json({ message: 'Project is full' });
    }
    
    // Check if user is already a member
    if (project.members.includes(user.email)) {
      return res.status(400).json({ message: 'You are already a member of this project' });
    }
    
    // Add user to members
    project.members.push(user.email);
    await project.save();
    
    res.json({ message: 'Successfully joined the project', project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add member to project (used after approving join request)
router.post('/:id/add-member', auth, async (req, res) => {
  try {
    const projectId = req.params.id;
    const { memberEmail, memberName } = req.body;
    
    // Get authenticated user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only project creator can add members
    if (project.creatorEmail !== user.email) {
      return res.status(403).json({ message: 'Only project creator can add members' });
    }
    
    // Check if project is full
    if (project.members.length >= project.maxMembers) {
      return res.status(400).json({ message: 'Project is full' });
    }
    
    // Check if user is already a member
    if (project.members.includes(memberEmail)) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }
    
    // Add user to members
    project.members.push(memberEmail);
    await project.save();
    
    res.json({ success: true, message: 'Member added successfully', project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete project (only accessible by creator)
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user is the project creator
    if (project.creatorEmail !== user.email) {
      return res.status(403).json({ message: 'Only project creator can delete the project' });
    }

    await Project.findByIdAndDelete(req.params.id);
    
    // Delete associated join requests
    await JoinRequest.deleteMany({ projectId: req.params.id });
    
    // Delete associated tasks
    await Task.deleteMany({ projectId: req.params.id });
    
    // Delete associated meetings
    await Meeting.deleteMany({ projectId: req.params.id });

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;