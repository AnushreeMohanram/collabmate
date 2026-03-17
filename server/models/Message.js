const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !this.conversation;
    }
  },
  
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: function() {
      return !this.recipient;
    }
  },
  subject: {
    type: String,
    required: function() {
      return !this.conversation;
    },
    trim: true
  },
  content: {
    type: String,
    required: function() { 
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
  timestamps: true 
});


messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ type: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;