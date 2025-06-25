const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived', 'pending'],
    default: 'active'
  },
  type: {
    type: String,
    enum: ['project', 'collaboration'],
    default: 'project'
  },
  health: {
    type: String,
    enum: ['on-track', 'at-risk', 'delayed'],
    default: 'on-track'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tasks: [{
    title: String,
    description: String,
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'completed'],
      default: 'todo'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: Date,
    completedAt: Date
  }],
  aiUsage: {
    totalRequests: {
      type: Number,
      default: 0
    },
    lastUsed: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

// Update the updatedAt timestamp before saving
projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for better query performance
projectSchema.index({ status: 1 });
projectSchema.index({ type: 1 });
projectSchema.index({ members: 1 });
projectSchema.index({ updatedAt: -1 });
module.exports = mongoose.model('Project', projectSchema); 
