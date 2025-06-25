// routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Your authentication middleware
const {
  getAdminStats,
  getAllUsers,
  getAllProjects,
  getAllCollaborations,
  handleUserAction,
  deleteUser,
  deleteMessage,
  deleteProject,
  updateCollaborationStatus,
  deleteCollaboration,
  getProjectAnalytics, // Existing analytics routes
  getUserAnalytics,
  getMessageAnalytics,
  updateMessageStatus,
  // NEW CHART CONTROLLERS
  getUserRegistrationTrend,
  getProjectCreationTrend,
  getUserRoleDistribution,
} = require('../controllers/adminController'); // Import all controllers

// Admin middleware: Ensures the user is authenticated and has 'admin' role
// Assuming req.user is populated by authMiddleware and has a 'role' property
const User = require('../models/User'); // Required to fetch user by ID for role check

const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) { // Ensure req.user and its id property exist
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const adminUser = await User.findById(req.user.id); // Fetch the user to confirm role from DB
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({ error: 'Server error during admin verification.' });
  }
};

// Apply both authentication and admin authorization middleware to all routes in this file
router.use(authMiddleware);
router.use(adminMiddleware);


// --- Dashboard Statistics and Lists (CORE FUNCTIONALITIES) ---

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.get('/projects', getAllProjects);
router.get('/collaborations', getAllCollaborations);

// --- User Management Actions (CORE FUNCTIONALITIES) ---
router.post('/users/:userId/:action', handleUserAction);
router.delete('/users/:userId', deleteUser);

// --- Project Management Actions (CORE FUNCTIONALITIES) ---
// Note: Your original file had archive/activate project routes removed.
router.delete('/projects/:id', deleteProject);

// --- Message Management Actions ---
router.delete('/messages/:messageId', deleteMessage); // Mark as deleted
router.put('/messages/:messageId/:action', updateMessageStatus); // Flag, unflag, archive

// --- Collaboration Management Actions (CORE FUNCTIONALITIES) ---
router.put('/collaborations/:id/:action', updateCollaborationStatus);
router.delete('/collaborations/:id', deleteCollaboration);

// --- Analytics Endpoints (Existing, now using actual data via controllers) ---
// The old /platform-analytics placeholder route is removed as per the updated plan.
router.get('/project-analytics', getProjectAnalytics);
router.get('/user-analytics', getUserAnalytics);
router.get('/message-analytics', getMessageAnalytics);


// --- NEW CHART-SPECIFIC ROUTES ---
router.get('/charts/user-registration-trend', getUserRegistrationTrend);
router.get('/charts/project-creation-trend', getProjectCreationTrend);
router.get('/charts/user-role-distribution', getUserRoleDistribution);


module.exports = router;