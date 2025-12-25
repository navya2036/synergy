const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendTaskAssignmentEmail } = require('../utils/email');

const router = express.Router();

// Create a new task (only project leads can create tasks)
router.post('/', auth, async (req, res) => {
  try {
    const { 
      projectId, 
      title, 
      description, 
      assignedTo, 
      assignedToName,
      priority, 
      dueDate 
    } = req.body;

    // Get authenticated user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify that the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify that the person creating the task is the project creator (using authenticated user)
    if (project.creatorEmail !== user.email) {
      return res.status(403).json({ message: 'Only project creator can assign tasks' });
    }

    // Verify that the assignee is a member of the project
    if (!project.members.includes(assignedTo)) {
      return res.status(400).json({ message: 'Cannot assign task to non-member' });
    }

    // Create the task using authenticated user's data
    const task = new Task({
      projectId,
      title,
      description,
      assignedTo,
      assignedToName,
      assignedBy: user.email,
      assignedByName: user.name,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined
    });

    await task.save();

    // Send email notification to the assigned team member
    try {
      await sendTaskAssignmentEmail(
        assignedTo,
        assignedToName,
        title,
        description,
        project.title,
        user.name,
        dueDate
      );
    } catch (emailError) {
      console.error('❌ Failed to send task assignment email, but task was created:', emailError.message);
      // Don't fail the task creation if email fails
    }

    res.status(201).json({
      message: 'Task created and assigned successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all tasks for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Get authenticated user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify that the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify that the user is a member of the project or the project creator
    if (!project.members.includes(user.email) && project.creatorEmail !== user.email) {
      return res.status(403).json({ message: 'Not authorized to view tasks for this project' });
    }

    const tasks = await Task.find({ projectId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get tasks assigned to a specific user
router.get('/assigned/:userEmail', auth, async (req, res) => {
  try {
    // Get authenticated user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { status } = req.query;

    const filter = { assignedTo: user.email }; // Use authenticated user's email
    if (status) {
      filter.status = status;
    }

    const tasks = await Task.find(filter)
      .populate('projectId', 'title description')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update task status
router.put('/:taskId/status', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!['pending', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Get authenticated user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only the assigned person or project creator can update task status
    const project = await Project.findById(task.projectId);
    if (task.assignedTo !== user.email && project.creatorEmail !== user.email) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date();
    }

    await task.save();

    res.json({
      message: 'Task status updated successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update task details (only project creator can update)
router.put('/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, priority, dueDate } = req.body;

    // Get authenticated user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only project creator can update task details
    const project = await Project.findById(task.projectId);
    if (project.creatorEmail !== user.email) {
      return res.status(403).json({ message: 'Only project creator can update task details' });
    }

    // Update fields
    if (title) task.title = title;
    if (description) task.description = description;
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;

    await task.save();

    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete task (only project creator can delete)
router.delete('/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params;

    // Get authenticated user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only project creator can delete tasks
    const project = await Project.findById(task.projectId);
    if (project.creatorEmail !== user.email) {
      return res.status(403).json({ message: 'Only project creator can delete tasks' });
    }

    await Task.findByIdAndDelete(taskId);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;