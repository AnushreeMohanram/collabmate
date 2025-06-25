// server/controllers/aiController.js
console.log('>>> aiController.js loaded');
const Conversation = require('../models/Conversation');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  console.error('ERROR: GEMINI_API_KEY is not set in environment variables.');
  // In a production app, you might want to throw an error or exit here
}

const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Helper function (already present in your aiRoutes, but good to have in controller for organization)
// Make sure this is also correctly implemented if you move it from aiRoutes.js
const User = require('../models/User'); // Assuming User model is available
async function updateUserAIUsage(userId, toolName) {
  try {
    const user = await User.findById(userId);
    if (user) {
      user.aiUsage = user.aiUsage || { totalRequests: 0, tools: new Map() };
      user.aiUsage.totalRequests = (user.aiUsage.totalRequests || 0) + 1;
      user.aiUsage.lastUsed = new Date();

      if (!(user.aiUsage.tools instanceof Map)) {
        user.aiUsage.tools = new Map(Object.entries(user.aiUsage.tools || {}));
      }

      let toolData = user.aiUsage.tools.get(toolName);
      if (!toolData) {
        toolData = { count: 0, lastUsed: new Date() };
      }
      toolData.count = (toolData.count || 0) + 1;
      toolData.lastUsed = new Date();
      user.aiUsage.tools.set(toolName, toolData);

      await user.save();
    }
  } catch (updateErr) {
    console.error('Error updating user AI usage stats:', updateErr);
  }
}


exports.summarizeConversation = async (req, res) => {
    const { conversationId } = req.body;
    const userId = req.user._id; // Get user ID from authenticated request

    if (!conversationId) {
        return res.status(400).json({ message: 'Conversation ID is required.' });
    }

    try {
        // 1. Fetch the conversation and its messages
        const conversation = await Conversation.findById(conversationId).populate({
            path: 'messages',
            options: { sort: { createdAt: 1 } } // Sort messages by creation date
        });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found.' });
        }

        // Optional: Check if user is a participant of the conversation for security
        const isParticipant = conversation.participants.some(p => p._id.toString() === userId.toString());
        if (!isParticipant) {
            return res.status(403).json({ message: 'Not authorized to summarize this conversation.' });
        }

        if (conversation.messages.length === 0) {
            return res.status(400).json({ summary: 'No messages to summarize.' });
        }

        // 2. Prepare the prompt for Gemini
        const chatHistory = conversation.messages.map(msg => ({
            role: msg.sender.toString() === userId.toString() ? 'user' : 'model', // Assuming 'model' for other participants, adjust if you have clear AI/human distinction in your message sender types
            parts: [{ text: msg.content }]
        }));

        const prompt = `Please provide a concise summary of the following conversation history. Focus on the main topics, decisions, and action items. Keep it to 3-5 sentences.

        Conversation History:
        ${chatHistory.map(entry => `${entry.role}: ${entry.parts[0].text}`).join('\n')}`;

        // 3. Generate summary using Gemini
        if (!model || typeof model.generateContent !== 'function') {
            throw new Error('Gemini model not initialized correctly. Check API key and network.');
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiSummary = response.text();

        // 4. Save the summary back to the conversation
        conversation.aiSummary = aiSummary;
        conversation.aiSummaryGeneratedAt = new Date();
        conversation.aiSummaryNeedsUpdate = false;
        await conversation.save();

        // 5. Update AI usage stats
        await updateUserAIUsage(userId, 'ConversationSummary');

        res.json({ summary: aiSummary });

    } catch (error) {
        console.error('Error in summarizeConversation:', error.message);
        if (error.response && error.response.data) {
            console.error('Gemini API Error details:', error.response.data);
        }
        res.status(500).json({ message: 'Failed to generate conversation summary.', error: error.message });
    }
};