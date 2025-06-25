// server/routes/conversationRoutes.js
const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');

const {
    getConversations,
    getConversationById,
    createConversation,
    addParticipantsToConversation,
} = require('../controllers/conversationController'); 

router.get('/', protect, getConversations);
router.get('/:id', protect, getConversationById);
router.post('/', protect, createConversation);
router.put('/:id/participants', protect, addParticipantsToConversation);

module.exports = router;