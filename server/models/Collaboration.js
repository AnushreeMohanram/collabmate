const mongoose = require('mongoose');

const collaborationSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required']
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Receiver ID is required']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'accepted', 'rejected', 'removed'],
      message: '{VALUE} is not a valid status'
    },
    default: 'pending'
  },
  role: {
    type: String,
    enum: {
      values: ['viewer', 'editor', 'admin'],
      message: '{VALUE} is not a valid role'
    },
    default: 'editor'
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot be longer than 500 characters']
  },
  permissions: {
    canEdit: {
      type: Boolean,
      default: true
    },
    canDelete: {
      type: Boolean,
      default: false
    },
    canInvite: {
      type: Boolean,
      default: false
    },
    canUpload: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
collaborationSchema.index({ project: 1, receiver: 1 }, { unique: true });
collaborationSchema.index({ sender: 1, status: 1 });
collaborationSchema.index({ receiver: 1, status: 1 });

// Add pre-save middleware to validate users and project exist
collaborationSchema.pre('save', async function(next) {
  try {
    const [User, Project] = [mongoose.model('User'), mongoose.model('Project')];
    
    // Check if sender exists
    const sender = await User.findById(this.sender);
    if (!sender) {
      throw new Error('Sender not found');
    }

    // Check if receiver exists
    const receiver = await User.findById(this.receiver);
    if (!receiver) {
      throw new Error('Receiver not found');
    }

    // Check if project exists
    const project = await Project.findById(this.project);
    if (!project) {
      throw new Error('Project not found');
    }

    // Check if sender is project owner
    if (project.owner.toString() !== this.sender.toString()) {
      throw new Error('Only project owner can send collaboration requests');
    }

    next();
  } catch (err) {
    next(err);
  }
});

const Collaboration = mongoose.model('Collaboration', collaborationSchema);

module.exports = Collaboration; 