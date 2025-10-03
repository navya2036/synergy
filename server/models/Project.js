const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  skills: [String],
  creator: { type: String, required: true },
  creatorEmail: { type: String, required: true },
  members: [String],
  timeline: String,
  maxMembers: { type: Number, default: 5 },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', projectSchema);