const mongoose = require('mongoose');

const joinRequestSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  projectTitle: { type: String, required: true },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requesterName: { type: String, required: true },
  requesterEmail: { type: String, required: true },
  requesterSkills: [String],
  requesterCollege: { type: String },
  message: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerEmail: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  respondedAt: { type: Date }
});

// Index for efficient queries
joinRequestSchema.index({ projectId: 1, requesterId: 1 }, { unique: true });
joinRequestSchema.index({ ownerId: 1, status: 1 });
joinRequestSchema.index({ requesterId: 1, status: 1 });

module.exports = mongoose.model('JoinRequest', joinRequestSchema);