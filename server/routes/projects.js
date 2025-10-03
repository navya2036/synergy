const express = require('express');
const Project = require('../models/Project');

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
router.post('/', async (req, res) => {
  try {
    const project = new Project(req.body);
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
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get projects by user (created by user and joined by user)
router.get('/user/:email', async (req, res) => {
  try {
    const userEmail = req.params.email;
    
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
router.post('/:id/join', async (req, res) => {
  try {
    const projectId = req.params.id;
    const { userEmail, userName } = req.body;
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if project is full
    if (project.members.length >= project.maxMembers) {
      return res.status(400).json({ message: 'Project is full' });
    }
    
    // Check if user is already a member
    if (project.members.includes(userEmail)) {
      return res.status(400).json({ message: 'You are already a member of this project' });
    }
    
    // Add user to members
    project.members.push(userEmail);
    await project.save();
    
    res.json({ message: 'Successfully joined the project', project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add member to project (used after approving join request)
router.post('/:id/add-member', async (req, res) => {
  try {
    const projectId = req.params.id;
    const { memberEmail, memberName } = req.body;
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
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

module.exports = router;