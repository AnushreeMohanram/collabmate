// server/routes/aiRoutes.js (FINAL UPDATED VERSION)
console.log('>>> aiRoutes.js loaded');
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');

// NEW: Import the AI Controller
const aiController = require('../controllers/aiController');
console.log('>>> aiController successfully required in aiRoutes.js');


const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  console.error('ERROR: GEMINI_API_KEY is not set in environment variables.');
}

// NOTE: Ideally, the GoogleGenerativeAI initialization (genAI, model)
// should also be in aiController.js if it's solely used by its functions.
// For now, it's kept here for the /get-suggestions route.
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Middleware to protect routes (ensure user is logged in)
router.use(authMiddleware);

// Helper function to update AI usage stats (keep as is if used by get-suggestions)
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

/**
 * @route POST /api/ai/get-suggestions
 * @desc Get AI-powered suggestions based on user skills and interests
 * @access Private (Auth Required)
 * @body {string[]} skills - Array of user's skill objects ({ name: String, level: String })
 * @body {string[]} interests - Array of user's interests (strings)
 */
router.post('/get-suggestions', async (req, res) => {
  const { skills, interests } = req.body;
  const userId = req.user._id;

  console.log('Incoming request to /get-suggestions:');
  console.log('  userId:', userId);
  console.log('  skills:', skills);
  console.log('  interests:', interests);

  if (!skills || !Array.isArray(skills) || !interests || !Array.isArray(interests)) {
    console.error('Validation Error: Skills or interests are missing or not arrays.');
    return res.status(400).json({ message: 'Skills and interests are required and must be arrays.' });
  }

  const formattedSkills = skills.map(s => {
    if (s && typeof s === 'object' && s.name && s.level) {
      return `${s.name} (${s.level})`;
    }
    return typeof s === 'string' ? s : 'Unknown Skill';
  }).filter(Boolean).join(', ');

  const formattedInterests = interests.filter(i => typeof i === 'string').join(', ');

  const prompt = `Given the following user profile:
Skills: ${formattedSkills || 'None provided'}
Interests: ${formattedInterests || 'None provided'}

Provide concise and actionable suggestions in the following categories. Each suggestion should be a short phrase or a single sentence. Use a bullet point list for each category.

1.  **Project Ideas:** (2-3 innovative project ideas)
2.  **Collaboration Opportunities:** (2-3 types of collaborators or areas to look for)
3.  **Learning Resources:** (2-3 areas/technologies to learn, or types of resources like courses/tutorials)
4.  **Tools & Technologies:** (2-3 relevant tools or technologies to explore)

Example format:
**Project Ideas:**
* Build an AI-powered personal assistant.
* Develop a decentralized social media platform.

**Collaboration Opportunities:**
* Connect with backend developers for full-stack projects.
* Find designers for UI/UX enhancements.

**Learning Resources:**
* Deepen knowledge in machine learning algorithms.
* Explore cloud computing certifications (AWS/Azure).

**Tools & Technologies:**
* Experiment with serverless functions (AWS Lambda/Google Cloud Functions).
* Learn a new frontend framework like Vue.js.`;

  try {
    if (!geminiApiKey) {
      throw new Error('Gemini API key is not configured.');
    }
    if (!model || typeof model.generateContent !== 'function') {
      throw new Error('Gemini model not initialized correctly. Check API key and network.');
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiSuggestions = response.text();

    await updateUserAIUsage(userId, 'Suggestions');

    res.json({ suggestions: aiSuggestions });

  } catch (error) {
    console.error('Error generating AI suggestions with Gemini:', error.message);
    if (error.response) {
      console.error('Gemini API Error Status:', error.response.status);
      console.error('Gemini API Error Data:', error.response.data);
    } else {
      console.error('Gemini Error Object (full):', error);
    }
    res.status(500).json({ message: 'Failed to generate suggestions using Gemini. Please try again.', error: error.message });
  }
});

/**
 * @route POST /api/ai/chat/summarize
 * @desc Generate a summary of a conversation using AI
 * @access Private (Auth Required)
 * @body {string} conversationId - The ID of the conversation to summarize
 */
// NEW ROUTE ADDED HERE!
router.post('/chat/summarize', aiController.summarizeConversation);
console.log('>>> aiRoutes: /chat/summarize route defined'); // Log to confirm it's reached

module.exports = router;