const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Clean up API key by removing any whitespace or line breaks
const cleanApiKey = (key) => key.replace(/\s+/g, '');

const openai = new OpenAI({
  apiKey: cleanApiKey(process.env.OPENAI_API_KEY),
});

// Get AI-generated suggestions
router.get('/ai', authMiddleware, async (req, res) => {
  try {
    const prompt = `Generate 3 unique and practical project ideas that would be good for a developer portfolio. 
    Each idea should be:
    1. Feasible to build
    2. Showcase technical skills
    3. Solve a real problem
    4. Be within 30 words
    Format each idea as a numbered list.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    });

    const rawText = response.choices[0].message.content;
    const ideas = rawText
      .split('\n')
      .filter(line => line.trim())
      .map(idea => idea.replace(/^\d+\.\s*/, ''));

    res.json({ suggestions: ideas });
  } catch (err) {
    console.error('❌ AI suggestion error:', err.message);
    // Fallback suggestions in case of API error
    const fallbackSuggestions = [
      "Build a real-time collaborative code editor with syntax highlighting and live preview",
      "Create a task management app with drag-and-drop interface and team collaboration features",
      "Develop a personal finance tracker with expense categorization and budget visualization"
    ];
    res.json({ suggestions: fallbackSuggestions });
  }
});

// Get saved suggestions
router.get('/saved', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ suggestions: user.savedSuggestions || [] });
  } catch (err) {
    console.error('❌ Error fetching saved suggestions:', err);
    res.status(500).json({ error: 'Failed to fetch saved suggestions' });
  }
});

// Save a suggestion
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { suggestion } = req.body;
    if (!suggestion) {
      return res.status(400).json({ error: 'Suggestion is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user.savedSuggestions) {
      user.savedSuggestions = [];
    }

    // Check if suggestion is already saved
    if (user.savedSuggestions.includes(suggestion)) {
      return res.status(400).json({ error: 'Suggestion already saved' });
    }

    user.savedSuggestions.push(suggestion);
    await user.save();

    res.json({ message: 'Suggestion saved successfully' });
  } catch (err) {
    console.error('❌ Error saving suggestion:', err);
    res.status(500).json({ error: 'Failed to save suggestion' });
  }
});

// Remove a saved suggestion
router.delete('/saved', authMiddleware, async (req, res) => {
  try {
    const { suggestion } = req.body;
    if (!suggestion) {
      return res.status(400).json({ error: 'Suggestion is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user.savedSuggestions) {
      return res.status(404).json({ error: 'No saved suggestions found' });
    }

    user.savedSuggestions = user.savedSuggestions.filter(s => s !== suggestion);
    await user.save();

    res.json({ message: 'Suggestion removed successfully' });
  } catch (err) {
    console.error('❌ Error removing suggestion:', err);
    res.status(500).json({ error: 'Failed to remove suggestion' });
  }
});

module.exports = router;
