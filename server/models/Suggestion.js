const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  content: {
    type: String,
    required: [true, 'Suggestion content is required'],
    trim: true,
    minlength: [1, 'Suggestion content cannot be empty']
  },
  type: {
    type: String,
    enum: {
      values: ['saved', 'generated'],
      message: '{VALUE} is not a valid suggestion type'
    },
    default: 'saved'
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'archived', 'implemented'],
      message: '{VALUE} is not a valid status'
    },
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
suggestionSchema.index({ user: 1, createdAt: -1 });
suggestionSchema.index({ type: 1 });
suggestionSchema.index({ status: 1 });

// Add a compound index for user and content to prevent duplicates
suggestionSchema.index({ user: 1, content: 1 }, { unique: true });

// Add pre-save middleware to trim content
suggestionSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.content = this.content.trim();
  }
  next();
});

// Add pre-save middleware to validate user exists
suggestionSchema.pre('save', async function(next) {
  try {
    const User = mongoose.model('User');
    const user = await User.findById(this.user);
    if (!user) {
      throw new Error('User not found');
    }
    next();
  } catch (err) {
    next(err);
  }
});

const Suggestion = mongoose.model('Suggestion', suggestionSchema);

module.exports = Suggestion; 