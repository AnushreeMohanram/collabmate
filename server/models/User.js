const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  
  skills: [{
    name: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    },
    verified: {
      type: Boolean,
      default: false
    }
  }],
  
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user', // default role is 'user'
  },
  active: {
    type: Boolean,
    default: true
  },
  interests: [{
    type: String
  }],
  savedSuggestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  aiPreferences: {
    suggestionFrequency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    projectRecommendations: {
      type: Boolean,
      default: true
    },
    skillMatching: {
      type: Boolean,
      default: true
    }
  },
  activity: {
    lastActive: {
      type: Date,
      default: Date.now
    },
    loginCount: {
      type: Number,
      default: 0
    },
    projectCount: {
      type: Number,
      default: 0
    },
    messageCount: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    throw err;
  }
};

// Update activity method
userSchema.methods.updateActivity = async function(type) {
  this.activity.lastActive = new Date();
  this.activity.loginCount += type === 'login' ? 1 : 0;
  this.activity.projectCount += type === 'project' ? 1 : 0;
  this.activity.messageCount += type === 'message' ? 1 : 0;
  await this.save();
};

const User = mongoose.model("User", userSchema);

module.exports = User;
