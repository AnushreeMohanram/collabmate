const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
require('dotenv').config(); // Ensure dotenv is configured at the very top

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true, // Allow cookies and auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // Ensure PATCH is allowed
  allowedHeaders: ['Content-Type', 'Authorization'] // Ensure Authorization header is allowed
}));
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded


// --- CRITICAL: Serve static files from the uploads directory ---
// This must come BEFORE your routes that might handle similar paths,
// so the browser can directly fetch uploaded images/files.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// MongoDB Connection with retry logic and better error handling
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected:', conn.connection.host);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      code: err.code
    });
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
  // Attempt to reconnect
  setTimeout(connectDB, 5000);
});

// Connect to MongoDB
connectDB();

// --- Import and Define your API routes ---
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const messageRoutes = require('./routes/messageRoutes');
const collaborationRoutes = require('./routes/collaborationRoutes'); // For actual collaboration request logic
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes'); // Handles current authenticated user's profile
const collaboratorsRoutes = require('./routes/collaborators'); // For searching/listing other users
const conversationRoutes = require('./routes/conversationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes'); // If you have separate routes for general attachments
const eventRoutes = require('./routes/eventRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Log typeof for debugging (can be removed in production)
console.log('authRoutes:', typeof authRoutes);
console.log('projectRoutes:', typeof projectRoutes);
console.log('messageRoutes:', typeof messageRoutes);
console.log('collaborationRoutes:', typeof collaborationRoutes);
console.log('adminRoutes:', typeof adminRoutes);
console.log('userRoutes:', typeof userRoutes);
console.log('collaboratorsRoutes:', typeof collaboratorsRoutes);
console.log('conversationRoutes:', typeof conversationRoutes);
console.log('aiRoutes:', typeof aiRoutes);
console.log('attachmentRoutes:', typeof attachmentRoutes);
console.log('eventRoutes:', typeof eventRoutes);
console.log('taskRoutes:', typeof taskRoutes);

// --- Mount your API Routes ---
app.use('/api/auth', authRoutes);

// ✅ CRITICAL MOUNTING ORDER/PATHS:
// Mount userRoutes for CURRENT USER'S PROFILE under /api/users
app.use('/api/users', userRoutes);

// Mount collaboratorsRoutes for SEARCHING/LISTING *OTHER* USERS under a distinct path
app.use('/api/users-search', collaboratorsRoutes); 

// Mount other routes as they are
app.use('/api/projects', projectRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/collaborations', collaborationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/ai', aiRoutes); 
app.use('/api/attachments', attachmentRoutes); // Ensure this path is correct if still used
app.use('/api/events', eventRoutes);
app.use('/api/tasks', taskRoutes);

// Log all requests (useful for debugging network issues)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Error handling middleware (should be last amongst app.use calls, before 404)
app.use((err, req, res, next) => {
  console.error('Global error handler caught an error:', err);
  console.error('Error stack:', err.stack);
  console.error('Error details:', {
    name: err.name,
    message: err.message,
    code: err.code,
    status: res.statusCode // Check status code set by other middlewares if any
  });

  // If headers were already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Set a default status code if none was set
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode; 
  res.status(statusCode).json({
    error: 'An unexpected server error occurred!',
    details: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined // Show stack only in dev
  });
});

// Handle 404 routes (must be the very last middleware)
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({
    error: 'Route not found',
    path: req.url,
    method: req.method
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Registered API routes:');
  console.log('- /api/auth');
  console.log('- /api/users (for current user profile and avatar updates)'); // Updated description
  console.log('- /api/users-search (for listing/finding other users)'); // Confirm this path matches frontend API calls for user search
  console.log('- /api/projects');
  console.log('- /api/messages');
  console.log('- /api/collaborations');
  console.log('- /api/admin');
  console.log('- /api/conversations');
  console.log('- /api/ai');
  console.log('- /api/attachments');
  console.log('- /api/events');
  console.log('- /api/tasks');
});
