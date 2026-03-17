const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
require('dotenv').config(); 

const app = express();


app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], 
  allowedHeaders: ['Content-Type', 'Authorization'] 
}));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
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
    setTimeout(connectDB, 5000);
  }
};
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
  setTimeout(connectDB, 5000);
});
connectDB();
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const messageRoutes = require('./routes/messageRoutes');
const collaborationRoutes = require('./routes/collaborationRoutes'); 
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes'); 
const collaboratorsRoutes = require('./routes/collaborators'); 
const conversationRoutes = require('./routes/conversationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes'); 
const eventRoutes = require('./routes/eventRoutes');
const taskRoutes = require('./routes/taskRoutes');


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


app.use('/api/auth', authRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/users-search', collaboratorsRoutes); 
app.use('/api/projects', projectRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/collaborations', collaborationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/ai', aiRoutes); 
app.use('/api/attachments', attachmentRoutes); 
app.use('/api/events', eventRoutes);
app.use('/api/tasks', taskRoutes);
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use((err, req, res, next) => {
  console.error('Global error handler caught an error:', err);
  console.error('Error stack:', err.stack);
  console.error('Error details:', {
    name: err.name,
    message: err.message,
    code: err.code,
    status: res.statusCode 
  });
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode; 
  res.status(statusCode).json({
    error: 'An unexpected server error occurred!',
    details: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
  });
});


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
  console.log('- /api/users (for current user profile and avatar updates)'); 
  console.log('- /api/users-search (for listing/finding other users)'); 
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
