const express = require('express');
const nodemailer = require('nodemailer');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');

const router = express.Router();

// Email configuration (same as before)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send Task Assignment Email
const sendTaskAssignmentEmail = async (assigneeEmail, assigneeName, taskTitle, taskDescription, projectTitle, assignedByName, dueDate) => {
  // For development: log notification to console if email is not configured properly
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
      process.env.EMAIL_PASS === 'your-app-password' || 
      process.env.EMAIL_USER === 'your-email@gmail.com') {
    console.log(`\n📧 TASK ASSIGNMENT NOTIFICATION:`);
    console.log(`To: ${assigneeEmail} (${assigneeName})`);
    console.log(`Project: ${projectTitle}`);
    console.log(`Task: ${taskTitle}`);
    console.log(`Description: ${taskDescription}`);
    console.log(`Assigned by: ${assignedByName}`);
    console.log(`Due date: ${dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date set'}`);
    console.log(`\n📋 Please check your project dashboard to view and manage this task.`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: assigneeEmail,
      subject: `New Task Assigned: "${taskTitle}" - ${projectTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Task Assigned!</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Hi <strong>${assigneeName}</strong>,</p>
            <p>You have been assigned a new task in the project <strong>"${projectTitle}"</strong>.</p>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="color: #667eea; margin-top: 0;">📋 Task Details:</h3>
              <p><strong>Task:</strong> ${taskTitle}</p>
              <p><strong>Description:</strong> ${taskDescription}</p>
              <p><strong>Assigned by:</strong> ${assignedByName}</p>
              ${dueDate ? `<p><strong>Due date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>` : ''}
            </div>
            
            <p>Please log in to your project dashboard to view the full task details and update your progress.</p>
            
            <div style="margin: 25px 0; padding: 15px; background: #e3f2fd; border-radius: 5px;">
              <p style="margin: 0; color: #1976d2;">
                💡 <strong>Tip:</strong> Keep your team updated on your progress by updating the task status regularly.
              </p>
            </div>
            
            <p>Good luck with your task!</p>
            <p>Best regards,<br>The Synergy Platform Team</p>
          </div>
        </div>
      `
    });
    console.log(`✅ Task assignment notification sent to ${assigneeEmail}`);
  } catch (error) {
    console.error('❌ Error sending task assignment email:', error.message);
    console.log(`\n📧 FALLBACK - Task assignment notification for ${assigneeEmail}:`);
    console.log(`Task "${taskTitle}" in project "${projectTitle}" assigned by ${assignedByName}`);
    console.log(`Description: ${taskDescription}`);
    console.log(`Due: ${dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date'}`);
  }
};

// Create a new task (only project leads can create tasks)
router.post('/', async (req, res) => {
  try {
    const { 
      projectId, 
      title, 
      description, 
      assignedTo, 
      assignedToName,
      assignedBy, 
      assignedByName,
      priority, 
      dueDate 
    } = req.body;

    // Verify that the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify that the person creating the task is the project lead
    if (project.creatorEmail !== assignedBy) {
      return res.status(403).json({ message: 'Only project leads can assign tasks' });
    }

    // Verify that the assignee is a member of the project
    if (!project.members.includes(assignedTo)) {
      return res.status(400).json({ message: 'Cannot assign task to non-member' });
    }

    // Create the task
    const task = new Task({
      projectId,
      title,
      description,
      assignedTo,
      assignedToName,
      assignedBy,
      assignedByName,
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
        assignedByName,
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
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userEmail } = req.query;

    // Verify that the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify that the user is a member of the project or the project lead
    if (!project.members.includes(userEmail) && project.creatorEmail !== userEmail) {
      return res.status(403).json({ message: 'Not authorized to view tasks for this project' });
    }

    const tasks = await Task.find({ projectId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get tasks assigned to a specific user
router.get('/assigned/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;
    const { status } = req.query;

    const filter = { assignedTo: userEmail };
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
router.put('/:taskId/status', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, userEmail } = req.body;

    if (!['pending', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only the assigned person or project lead can update task status
    const project = await Project.findById(task.projectId);
    if (task.assignedTo !== userEmail && project.creatorEmail !== userEmail) {
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

// Update task details (only project lead can update)
router.put('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, priority, dueDate, userEmail } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only project lead can update task details
    const project = await Project.findById(task.projectId);
    if (project.creatorEmail !== userEmail) {
      return res.status(403).json({ message: 'Only project leads can update task details' });
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

// Delete task (only project lead can delete)
router.delete('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userEmail } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only project lead can delete tasks
    const project = await Project.findById(task.projectId);
    if (project.creatorEmail !== userEmail) {
      return res.status(403).json({ message: 'Only project leads can delete tasks' });
    }

    await Task.findByIdAndDelete(taskId);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;