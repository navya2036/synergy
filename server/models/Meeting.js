const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  projectTitle: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  scheduledBy: {
    type: String, // Email of the project lead who scheduled the meeting
    required: true
  },
  scheduledByName: {
    type: String,
    required: true
  },
  meetingDate: {
    type: Date,
    required: true
  },
  meetingTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // Duration in minutes
    default: 60
  },
  meetingLink: {
    type: String, // Zoom/Teams/Meet link
    default: ''
  },
  location: {
    type: String, // Physical location or "Online"
    default: 'Online'
  },
  agenda: {
    type: String,
    default: ''
  },
  attendees: [{
    email: String,
    name: String,
    status: {
      type: String,
      enum: ['invited', 'accepted', 'declined', 'maybe'],
      default: 'invited'
    }
  }],
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
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
meetingSchema.index({ projectId: 1, meetingDate: 1 });
meetingSchema.index({ scheduledBy: 1, status: 1 });
meetingSchema.index({ 'attendees.email': 1, meetingDate: 1 });

// Update the updatedAt field before saving
meetingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Meeting', meetingSchema);