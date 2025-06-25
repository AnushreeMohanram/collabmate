// server/controllers/conversationController.js
const Conversation = require('../models/Conversation'); // Ensure this path is correct
const Message = require('../models/Message');         // Ensure this path is correct
const User = require('../models/User');               // Ensure this path is correct

// @desc    Get all conversations for the authenticated user
// @route   GET /api/conversations
// @access  Private
const getConversations = async (req, res) => {
    try {
        // Find conversations where the current user is a participant
        const conversations = await Conversation.find({
            participants: req.user._id
        })
        .populate('participants', 'name email avatar') // Populate conversation participants
        .sort({ updatedAt: -1 }); // Sort by most recent activity

        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Server Error fetching conversations' });
    }
};

// @desc    Get a single conversation by ID with its messages
// @route   GET /api/conversations/:id
// @access  Private
const getConversationById = async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            participants: req.user._id // Ensure user is a participant
        })
        .populate('participants', 'name email avatar') // Populate conversation participants
        .populate({
            path: 'messages',
            populate: [ // Use an array for multiple nested populates
                {
                    path: 'sender',
                    select: 'name email avatar' // Select only necessary fields for sender
                },
                {
                    path: 'recipient', // Also populate recipient
                    select: 'name email avatar' // Select only necessary fields for recipient
                }
            ]
        });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found or you are not a participant' });
        }

        // Return messages separately for easier client handling if needed, or just conversation
        res.json({
            conversation: conversation,
            messages: conversation.messages
        });
    } catch (error) {
        console.error('Error fetching single conversation:', error);
        res.status(500).json({ message: 'Server Error fetching single conversation' });
    }
};

// @desc    Create a new conversation
// @route   POST /api/conversations
// @access  Private
const createConversation = async (req, res) => {
    const { participantIds, subject } = req.body;

    // Ensure current user is always a participant
    // Use Set to automatically handle duplicates and ensure unique IDs
    const allParticipantIds = Array.from(new Set([...participantIds.map(String), req.user._id.toString()]));

    if (allParticipantIds.length < 2) { // A conversation needs at least two distinct participants
        return res.status(400).json({ message: 'A conversation must have at least two participants.' });
    }

    try {
        // Check if all provided participant IDs are valid users
        const validParticipants = await User.find({ _id: { $in: allParticipantIds } });
        if (validParticipants.length !== allParticipantIds.length) {
            return res.status(400).json({ message: 'One or more participant IDs are invalid.' });
        }

        // Optional: Check for existing conversation with the exact same participants
        // This prevents creating duplicate 1-on-1 chats, but might not be desired for group chats
        // if (allParticipantIds.length === 2) { // Only check for 1-on-1
        //     const existingConversation = await Conversation.findOne({
        //         participants: { $all: allParticipantIds, $size: 2 }
        //     });
        //     if (existingConversation) {
        //         return res.status(200).json(existingConversation); // Return existing conversation
        //     }
        // }

        const newConversation = new Conversation({
            participants: allParticipantIds,
            subject: subject || 'New Conversation' // Default subject if none provided
        });

        const savedConversation = await newConversation.save();

        // Populate participants for the response
        const populatedConversation = await Conversation.findById(savedConversation._id)
                                            .populate('participants', 'name email avatar'); // Populate participants

        res.status(201).json(populatedConversation);
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ message: 'Server Error creating conversation' });
    }
};

// @desc    Add participants to an existing conversation
// @route   PUT /api/conversations/:id/participants
// @access  Private
const addParticipantsToConversation = async (req, res) => {
    const { newParticipantIds } = req.body;
    try {
        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Ensure the requesting user is already a participant to modify it
        if (!conversation.participants.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to modify this conversation' });
        }

        // Filter out participants already in the conversation
        const filteredNewParticipants = newParticipantIds.filter(
            (id) => !conversation.participants.map(p => p.toString()).includes(id)
        );

        if (filteredNewParticipants.length === 0) {
            return res.status(200).json({ message: 'No new participants to add.', conversation });
        }

        // Validate new participant IDs
        const validParticipants = await User.find({ _id: { $in: filteredNewParticipants } });
        if (validParticipants.length !== filteredNewParticipants.length) {
            return res.status(400).json({ message: 'One or more new participant IDs are invalid.' });
        }

        conversation.participants.push(...filteredNewParticipants);
        await conversation.save();

        const populatedConversation = await Conversation.findById(conversation._id)
                                                .populate('participants', 'name email avatar'); // Populate participants

        res.json(populatedConversation);
    } catch (error) {
        console.error('Error adding participants:', error);
        res.status(500).json({ message: 'Server Error adding participants' });
    }
};

// IMPORTANT: Make sure all functions you want to be available are exported here
module.exports = {
    getConversations,
    getConversationById,
    createConversation,
    addParticipantsToConversation
};