// server/models/Conversation.js
const mongoose = require('mongoose');

const conversationSchema = mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User', // Reference to the User model
                required: true,
            },
        ],
        subject: {
            type: String,
            trim: true,
            default: 'New Conversation', // A default subject
        },
        // This is for populating messages directly within the conversation object if desired
        // Alternatively, you can query messages separately based on conversationId
        messages: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Message', // Reference to the Message model
            },
        ],
        // AI Summary fields
        aiSummary: {
            type: String,
            default: null,
        },
        aiSummaryGeneratedAt: {
            type: Date,
            default: null,
        },
        aiSummaryNeedsUpdate: { // Flag to indicate if summary is stale (e.g., after new message)
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt fields automatically
    }
);

// Optional: Add a pre-save hook to ensure aiSummaryNeedsUpdate is true when new messages are added
// This requires that messages are pushed directly to the conversation.messages array.
// If you add messages via their own model (Message.create), you'd update this flag in the messageController.
conversationSchema.pre('save', function(next) {
    if (this.isModified('messages') && this.messages.length > 0) {
        this.aiSummaryNeedsUpdate = true;
        this.aiSummary = null; // Clear previous summary
        this.aiSummaryGeneratedAt = null;
    }
    next();
});


const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;