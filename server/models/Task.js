const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  assignedTo: {
    type: String, // Email of the assigned team member
    required: true
  },
  assignedToName: {
    type: String,
    required: true
  },
  assignedBy: {
    type: String, // Email of the project lead who assigned the task
    required: true
  },
  assignedByName: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
taskSchema.index({ projectId: 1, assignedTo: 1 });
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });

// Update the updatedAt field before saving
taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Task', taskSchema);