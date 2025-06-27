// server/routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const Conversation = require('../models/Conversation'); // <--- NEW: Import Conversation model
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads (keep as is)
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

// GET all messages for a user with pagination and filters (Keep as is)
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

    let query = {
      status: 'active'
    };

    if (type === 'sent') {
      query.sender = req.user._id;
    } else if (type === 'received') {
      query.recipient = req.user._id;
    } else {
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

// POST a new message (UPDATED TO HANDLE BOTH DIRECT AND CONVERSATION MESSAGES)
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Destructure all possible fields that might be sent
    const { recipientId, subject, content, projectId, threadId, type, conversationId } = req.body;

    // Debug logs
    console.log('req.body:', req.body);

    let messageData = {
      sender: req.user._id,
      content: content,
      project: projectId,
      thread: threadId,
      type: type || 'message', // Default type
      status: 'active'
    };
    console.log('messageData:', messageData);

    // --- CRITICAL LOGIC FOR HANDLING MESSAGE TYPES ---
    if (conversationId) {
      // This is a message within an existing conversation
      if (!content || !conversationId) { // Content is always required for conversation messages
        return res.status(400).json({ error: 'Message content and conversation ID are required for conversation messages.' });
      }

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found.' });
      }
      if (!conversation.participants.includes(req.user._id)) {
        return res.status(403).json({ error: 'You are not a participant of this conversation.' });
      }

      messageData.conversation = conversationId; // Link message to conversation
      messageData.recipient = undefined; // No direct recipient for conversation messages
      messageData.subject = undefined; // No subject for individual messages within a conversation

      // Create the message
      const message = new Message(messageData);
      await message.save();

      // Update the conversation's messages array and last activity
      conversation.messages.push(message._id);
      conversation.updatedAt = Date.now();
      conversation.aiSummaryNeedsUpdate = true; // Mark summary as stale when new messages are added
      conversation.aiSummary = null; // Clear existing summary
      conversation.aiSummaryGeneratedAt = null; // Clear timestamp
      await conversation.save();

      // Populate sender for response
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name email avatar'); // Populate name, email, avatar for frontend

      console.log('Created conversation message:', populatedMessage);

      return res.status(201).json(populatedMessage);

    } else {
      // This is a traditional direct message (original logic)
      if (!recipientId || !subject || !content) {
        return res.status(400).json({ error: 'Missing required fields: recipientId, subject, and content are required for direct messages.' });
      }

      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({ error: 'Recipient not found.' });
      }

      messageData.recipient = recipientId;
      messageData.subject = subject;

      const message = new Message(messageData);
      await message.save();

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name email')
        .populate('recipient', 'name email')
        .populate('project', 'title')
        .populate('mentions', 'name email');

      console.log('Created direct message:', populatedMessage);

      return res.status(201).json(populatedMessage);
    }

  } catch (err) {
    console.error('Error sending message:', err);
    if (err.name === 'ValidationError') {
      // Mongoose validation error
      return res.status(400).json({ error: err.message });
    }
    // Handle other general errors
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get thread messages (keep as is)
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

// Add reaction to message (keep as is)
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

// Remove reaction from message (keep as is)
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

// Mark message as read (keep as is)
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

// Archive message (keep as is)
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

// Delete message (soft delete - keep as is)
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

// Get unread message count (keep as is)
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


// Admin message status update routes (keep as is)
const adminMiddleware = require('../middleware/adminMiddleware');

router.put('/:messageId/:action', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { messageId, action } = req.params;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    switch (action) {
      case 'flag':
        message.status = 'flagged';
        break;
      case 'unflag':
        message.status = 'active';
        break;
      case 'archive':
        message.status = 'archived';
        break;
      default:
        return res.status(400).json({ message: 'Invalid action for message status update. Use "flag", "unflag", or "archive".' });
    }

    try {
      await message.save();
    } catch (saveError) {
      console.error(`Error saving message status for ${messageId}:`, saveError);
      return res.status(500).json({ message: 'Failed to save message status', details: saveError.message });
    }

    res.json({ message: `Message status updated to '${message.status}' successfully.` });
  } catch (error) {
    console.error('Message action error:', error);
    res.status(500).json({ message: 'Error updating message status.' });
  }
});

// Admin message delete route (keep as is)
router.delete('/:messageId/delete', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findByIdAndDelete(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }
    res.json({ message: 'Message deleted successfully.' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ error: 'Failed to delete message.' });
  }
});

module.exports = router;