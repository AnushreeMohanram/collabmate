const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');


router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('GET /users - Fetching users for collaborator search');
    console.log('Current user ID:', req.user._id);
    
    
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('name email skills')
      .lean();
    
    console.log(`Found ${users.length} potential collaborators`);
    
    
    const formattedUsers = users.map(user => ({
      ...user,
      skills: user.skills || []
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.error('Error in GET /users:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ 
      error: 'Failed to fetch collaborators',
      details: err.message
    });
  }
});

// Get user by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('GET /users/:id - Fetching user:', req.params.id);
    
    const user = await User.findById(req.params.id)
      .select('name email skills')
      .lean();
    
    if (!user) {
      console.log('User not found:', req.params.id);
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ...user,
      skills: user.skills || []
    });
  } catch (err) {
    console.error('Error in GET /users/:id:', err);
    res.status(500).json({ 
      error: 'Failed to fetch user',
      details: err.message
    });
  }
});

module.exports = router;
