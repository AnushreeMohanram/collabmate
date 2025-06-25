// server/models/Message.js (FINAL UPDATED VERSION)
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Recipient is required IF there's no conversation specified
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      // 'this' refers to the document being validated.
      // Recipient is required ONLY if 'conversation' is NOT present.
      return !this.conversation;
    }
  },
  // Conversation is required IF there's no recipient specified
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: function() {
      // Conversation is required ONLY if 'recipient' is NOT present.
      // This creates a mutually exclusive requirement: either conversation OR recipient.
      return !this.recipient;
    }
  },
  // Subject is required IF there's no conversation (i.e., it's a direct message)
  subject: {
    type: String,
    required: function() {
      // Subject is required ONLY if 'conversation' is NOT present.
      return !this.conversation;
    },
    trim: true
  },
  content: {
    type: String,
    required: function() { // Make content optional if attachments are present
        return !this.attachments || this.attachments.length === 0;
    },
    trim: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  thread: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  type: {
    type: String,
    enum: ['message', 'notification', 'system'],
    default: 'message'
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted', 'flagged'],
    default: 'active'
  },
  // CORRECTED AND UPDATED ATTACHMENTS FIELD
  attachments: [{
    filePath: { type: String, required: true }, // The URL to access the file (e.g., /uploads/12345-my_file.pdf)
    fileName: { type: String, required: true }, // The unique name given by Multer
    originalName: { type: String, required: true }, // The original name from user's computer
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
},
{
  timestamps: true // This is correctly placed here as the second argument to Schema
});

// Indexes for better query performance (keep as is)
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ type: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;