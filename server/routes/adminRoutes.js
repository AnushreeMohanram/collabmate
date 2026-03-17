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
  getProjectAnalytics, 
  getUserAnalytics,
  getMessageAnalytics,
  updateMessageStatus,
  getUserRegistrationTrend,
  getProjectCreationTrend,
  getUserRoleDistribution,
} = require('../controllers/adminController'); 
const User = require('../models/User'); 

const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) { 
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const adminUser = await User.findById(req.user.id); 
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({ error: 'Server error during admin verification.' });
  }
};


router.use(authMiddleware);
router.use(adminMiddleware);




router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.get('/projects', getAllProjects);
router.get('/collaborations', getAllCollaborations);
router.post('/users/:userId/:action', handleUserAction);
router.delete('/users/:userId', deleteUser);
router.delete('/projects/:id', deleteProject);
router.delete('/messages/:messageId', deleteMessage); 
router.put('/messages/:messageId/:action', updateMessageStatus); 
router.put('/collaborations/:id/:action', updateCollaborationStatus);
router.delete('/collaborations/:id', deleteCollaboration);
router.get('/project-analytics', getProjectAnalytics);
router.get('/user-analytics', getUserAnalytics);
router.get('/message-analytics', getMessageAnalytics);
router.get('/charts/user-registration-trend', getUserRegistrationTrend);
router.get('/charts/project-creation-trend', getProjectCreationTrend);
router.get('/charts/user-role-distribution', getUserRoleDistribution);


module.exports = router;