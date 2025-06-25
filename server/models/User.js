// models/User.js
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

// Define the schema
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
  
  // ✅ NEW FIELD: Avatar URL
  avatar: {
    type: String,
    default: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png' // Default placeholder avatar
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
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned'],
    default: 'active'
  },
  active: {
    type: Boolean,
    default: true
  },
  interests: [{
    type: String
  }],
  savedSuggestions: [{
    type: String, 
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
  aiUsage: {
    totalRequests: {
      type: Number,
      default: 0
    },
    lastUsed: Date,
    tools: {
      type: Map,
      of: {
        count: {
          type: Number,
          default: 0
        },
        lastUsed: {
          type: Date,
          default: Date.now
        }
      },
      default: {
        'Code Generator': { count: 0, lastUsed: Date.now() },
        'Text Summarizer': { count: 0, lastUsed: Date.now() },
        'Project Analyzer': { count: 0, lastUsed: Date.now() },
        'Team Insights': { count: 0, lastUsed: Date.now() }
      }
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


userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ lastActive: -1 });

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


userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('Comparing passwords in User model');
    console.log('Candidate password length:', candidatePassword.length);
    console.log('Stored password length:', this.password.length);
    
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Password match result:', isMatch);
    
    return isMatch;
  } catch (err) {
    console.error('Error comparing passwords:', err);
    throw err;
  }
};


userSchema.methods.updateActivity = async function(type) {
  this.activity.lastActive = new Date();
  this.activity.loginCount += type === 'login' ? 1 : 0;
  this.activity.projectCount += type === 'project' ? 1 : 0;
  this.activity.messageCount += type === 'message' ? 1 : 0;
  await this.save();
};


userSchema.methods.updateAIUsage = async function(tool) {
  this.aiUsage.totalRequests += 1;
  this.aiUsage.lastUsed = new Date();
  
  if (!this.aiUsage.tools.has(tool)) {
    this.aiUsage.tools.set(tool, { count: 0, lastUsed: new Date() });
  }
  
  const toolData = this.aiUsage.tools.get(tool);
  toolData.count += 1;
  toolData.lastUsed = new Date();
  this.aiUsage.tools.set(tool, toolData);
  
  await this.save();
};


const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;