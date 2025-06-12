const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads/messages';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get all messages for a user with pagination and filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;
    const projectId = req.query.projectId;
    const threadId = req.query.threadId;
    const search = req.query.search;

    console.log('Fetching messages for user:', req.user._id);
    console.log('Message type:', type);

    // Build query based on message type (sent or received)
    let query = {
      status: 'active'
    };

    if (type === 'sent') {
      query.sender = req.user._id;
    } else if (type === 'received') {
      query.recipient = req.user._id;
    } else {
      // If no type specified, get both sent and received messages
      query.$or = [
        { sender: req.user._id },
        { recipient: req.user._id }
      ];
    }

    if (projectId) query.project = projectId;
    if (threadId) query.thread = threadId;
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('Message query:', JSON.stringify(query, null, 2));

    const messages = await Message.find(query)
      .populate('sender', 'name email')
      .populate('recipient', 'name email')
      .populate('project', 'title')
      .populate('mentions', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    console.log(`Found ${messages.length} messages for user ${req.user._id}`);
    console.log('Messages:', JSON.stringify(messages, null, 2));

    const total = await Message.countDocuments(query);

    res.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a new message with attachments
router.post('/', authMiddleware, upload.array('attachments', 5), async (req, res) => {
  try {
    const { recipientId, subject, content, projectId, threadId, type } = req.body;

    // Validate required fields
    if (!recipientId || !subject || !content) {
      return res.status(400).json({ error: 'Missing required fields: recipientId, subject, and content are required' });
    }

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Handle attachments if any
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/messages/${file.filename}`
    })) : [];

    // Create new message
    const message = new Message({
      sender: req.user._id,
      recipient: recipientId,
      subject,
      content,
      project: projectId,
      thread: threadId,
      type: type || 'message',
      attachments,
      status: 'active'
    });

    // Save message
    await message.save();

    // Populate the message with user details
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email')
      .populate('recipient', 'name email')
      .populate('project', 'title')
      .populate('mentions', 'name email');

    console.log('Created message:', populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error('Error sending message:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get thread messages
router.get('/thread/:threadId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { _id: req.params.threadId },
        { thread: req.params.threadId }
      ],
      status: 'active'
    })
    .populate('sender', 'name email')
    .populate('recipient', 'name email')
    .populate('project', 'title')
    .populate('mentions', 'name email')
    .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error('Error fetching thread:', err);
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
});

// Add reaction to message
router.post('/:messageId/reactions', authMiddleware, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await message.addReaction(req.user._id, emoji);
    res.json(message);
  } catch (err) {
    console.error('Error adding reaction:', err);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Remove reaction from message
router.delete('/:messageId/reactions', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await message.removeReaction(req.user._id);
    res.json(message);
  } catch (err) {
    console.error('Error removing reaction:', err);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

// Mark message as read
router.patch('/:messageId/read', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await message.markAsRead(req.user._id);
    res.json(message);
  } catch (err) {
    console.error('Error marking message as read:', err);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Archive message
router.patch('/:messageId/archive', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findOneAndUpdate(
      {
        _id: req.params.messageId,
        $or: [
          { sender: req.user._id },
          { recipient: req.user._id }
        ]
      },
      { status: 'archived' },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json(message);
  } catch (err) {
    console.error('Error archiving message:', err);
    res.status(500).json({ error: 'Failed to archive message' });
  }
});

// Delete message
router.delete('/:messageId', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      $or: [
        { sender: req.user._id },
        { recipient: req.user._id }
      ]
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Soft delete
    message.status = 'deleted';
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Get unread message count
router.get('/unread/count', authMiddleware, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user._id,
      read: false,
      status: 'active'
    });
    res.json({ count });
  } catch (err) {
    console.error('Error getting unread count:', err);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Admin routes
router.get('/admin/all', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status;

    const query = {};
    if (status) query.status = status;

    const messages = await Message.find(query)
      .populate('sender', 'name email')
      .populate('recipient', 'name email')
      .populate('project', 'title')
      .populate('mentions', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Message.countDocuments(query);

    res.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching all messages:', err);
    res.status(500).json({ error: 'Failed to fetch all messages' });
  }
});

module.exports = router;
