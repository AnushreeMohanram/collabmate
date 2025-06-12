const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'No authentication token, access denied' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded:', decoded);

      // Find user using _id from token
      const user = await User.findById(decoded._id);
      if (!user) {
        console.log('User not found for ID:', decoded._id);
        return res.status(401).json({ error: 'User not found' });
      }

      // Add user to request
      req.user = user;
      console.log('User authenticated:', user._id);
      next();
    } catch (err) {
      console.error('Token verification error:', err);
      return res.status(401).json({ error: 'Token is invalid' });
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = authMiddleware;
