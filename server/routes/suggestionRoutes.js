const express = require('express');
const router = express.Router();
const Suggestion = require('../models/Suggestion');
const authMiddleware = require('../middleware/authMiddleware');

// Get AI-generated suggestions
router.get('/ai', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching AI suggestions for user:', req.user._id);
    
    // Generate some sample suggestions (replace with actual AI integration later)
    const suggestions = [
      "Create a task management system with real-time updates",
      "Implement a file sharing feature with version control",
      "Add a calendar integration for project deadlines",
      "Create a team chat feature with file sharing",
      "Implement a project analytics dashboard"
    ];

    console.log('Returning AI suggestions:', suggestions);
    res.json({ suggestions });
  } catch (err) {
    console.error('Error fetching AI suggestions:', err);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// Get saved suggestions for the current user
router.get('/saved', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching saved suggestions for user:', req.user._id);
    
    const suggestions = await Suggestion.find({ 
      user: req.user._id,
      status: 'active'
    }).sort({ createdAt: -1 });

    console.log('Found saved suggestions:', suggestions);

    res.json({ suggestions: suggestions.map(s => s.content) });
  } catch (err) {
    console.error('Error fetching saved suggestions:', err);
    res.status(500).json({ error: 'Failed to fetch saved suggestions' });
  }
});

// Save a suggestion
router.post('/save', authMiddleware, async (req, res) => {
  try {
    console.log('Save suggestion request body:', req.body);
    console.log('Current user:', req.user._id);

    const { suggestion } = req.body;

    // Validate input
    if (!suggestion) {
      console.log('Missing suggestion content');
      return res.status(400).json({ error: 'Suggestion content is required' });
    }

    if (typeof suggestion !== 'string') {
      console.log('Invalid suggestion content type:', typeof suggestion);
      return res.status(400).json({ error: 'Suggestion must be a string' });
    }

    if (suggestion.trim().length === 0) {
      console.log('Empty suggestion content');
      return res.status(400).json({ error: 'Suggestion content cannot be empty' });
    }

    // Check if suggestion already exists for this user
    const existingSuggestion = await Suggestion.findOne({
      user: req.user._id,
      content: suggestion.trim(),
      status: 'active'
    });

    if (existingSuggestion) {
      console.log('Suggestion already exists:', existingSuggestion);
      return res.status(400).json({ error: 'Suggestion already saved' });
    }

    // Create new suggestion
    const newSuggestion = new Suggestion({
      user: req.user._id,
      content: suggestion.trim(),
      type: 'saved',
      status: 'active'
    });

    console.log('Creating new suggestion:', newSuggestion);

    try {
      const savedSuggestion = await newSuggestion.save();
      console.log('Saved suggestion:', savedSuggestion);

      res.status(201).json({ 
        message: 'Suggestion saved successfully',
        suggestion: savedSuggestion
      });
    } catch (saveError) {
      console.error('Error saving to database:', saveError);
      console.error('Save error details:', {
        name: saveError.name,
        message: saveError.message,
        code: saveError.code
      });

      if (saveError.code === 11000) {
        return res.status(400).json({ error: 'Suggestion already saved' });
      }

      if (saveError.name === 'ValidationError') {
        return res.status(400).json({ 
          error: 'Invalid suggestion data',
          details: Object.values(saveError.errors).map(err => err.message)
        });
      }

      throw saveError;
    }
  } catch (err) {
    console.error('Error saving suggestion:', err);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    res.status(500).json({ 
      error: 'Failed to save suggestion',
      details: err.message
    });
  }
});

// Delete a saved suggestion
router.delete('/saved', authMiddleware, async (req, res) => {
  try {
    console.log('Delete suggestion request body:', req.body);
    console.log('Current user:', req.user._id);

    const { suggestion } = req.body;

    if (!suggestion) {
      console.log('Missing suggestion content');
      return res.status(400).json({ error: 'Suggestion content is required' });
    }

    const result = await Suggestion.findOneAndUpdate(
      {
        user: req.user._id,
        content: suggestion,
        status: 'active'
      },
      { status: 'archived' },
      { new: true }
    );

    if (!result) {
      console.log('Suggestion not found');
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    console.log('Archived suggestion:', result);

    res.json({ 
      message: 'Suggestion removed successfully',
      suggestion: result
    });
  } catch (err) {
    console.error('Error removing suggestion:', err);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    res.status(500).json({ 
      error: 'Failed to remove suggestion',
      details: err.message
    });
  }
});

module.exports = router; 