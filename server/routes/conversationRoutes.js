const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');

const {
    getConversations,
    getConversationById,
    createConversation,
    addParticipantsToConversation,
    deleteConversation,
} = require('../controllers/conversationController'); 

router.get('/', protect, getConversations);
router.get('/:id', protect, getConversationById);
router.post('/', protect, createConversation);
router.put('/:id/participants', protect, addParticipantsToConversation);
router.delete('/:id', protect, deleteConversation);

module.exports = router;