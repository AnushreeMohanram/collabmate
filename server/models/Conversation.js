const mongoose = require('mongoose');

const conversationSchema = mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User', 
                required: true,
            },
        ],
        subject: {
            type: String,
            trim: true,
            default: 'New Conversation', 
        },
        
        messages: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Message', 
            },
        ],
        
        aiSummary: {
            type: String,
            default: null,
        },
        aiSummaryGeneratedAt: {
            type: Date,
            default: null,
        },
        aiSummaryNeedsUpdate: { 
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true, 
    }
);


conversationSchema.pre('save', function(next) {
    if (this.isModified('messages') && this.messages.length > 0) {
        this.aiSummaryNeedsUpdate = true;
        this.aiSummary = null; 
        this.aiSummaryGeneratedAt = null;
    }
    next();
});


const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;