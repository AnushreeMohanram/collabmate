const Conversation = require('../models/Conversation'); 
const Message = require('../models/Message');         
const User = require('../models/User');               

const getConversations = async (req, res) => {
    try {
        
        const conversations = await Conversation.find({
            participants: req.user._id
        })
        .populate('participants', 'name email avatar') 
        .sort({ updatedAt: -1 }); 

        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Server Error fetching conversations' });
    }
};

const getConversationById = async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            participants: req.user._id 
        })
        .populate('participants', 'name email avatar') 
        .populate({
            path: 'messages',
            populate: [ 
                {
                    path: 'sender',
                    select: 'name email avatar' 
                },
                {
                    path: 'recipient', 
                    select: 'name email avatar' 
                }
            ]
        });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found or you are not a participant' });
        }

        
        res.json({
            conversation: conversation,
            messages: conversation.messages
        });
    } catch (error) {
        console.error('Error fetching single conversation:', error);
        res.status(500).json({ message: 'Server Error fetching single conversation' });
    }
};


const createConversation = async (req, res) => {
    const { participantIds, subject } = req.body;

    
    const allParticipantIds = Array.from(new Set([...participantIds.map(String), req.user._id.toString()]));

    if (allParticipantIds.length < 2) {
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


const deleteConversation = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }
        // Only allow participants to delete
        if (!conversation.participants.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to delete this conversation' });
        }
        // Delete all messages in this conversation
        await Message.deleteMany({ conversation: conversation._id });
        // Delete the conversation itself
        await Conversation.findByIdAndDelete(conversation._id);
        res.json({ message: 'Conversation and its messages deleted successfully' });
    } catch (err) {
        console.error('Error deleting conversation:', err);
        res.status(500).json({ message: 'Server error deleting conversation' });
    }
};

// IMPORTANT: Make sure all functions you want to be available are exported here
module.exports = {
    getConversations,
    getConversationById,
    createConversation,
    addParticipantsToConversation,
    deleteConversation
};