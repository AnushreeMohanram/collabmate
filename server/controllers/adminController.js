// controllers/adminController.js

const User = require('../models/User');
const Project = require('../models/Project');
const Message = require('../models/Message');
const Collaboration = require('../models/Collaboration');
const bcrypt = require('bcryptjs'); // For password hashing if you need reset logic here

// Helper function to get start of day for aggregation queries (important for consistent date ranges)
const getStartOfDay = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0); // Normalize to UTC start of day to avoid timezone issues
  return d;
};

// @desc    Get overall dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
exports.getAdminStats = async (req, res) => {
  try {
    const range = parseInt(req.query.range) || 7; // Default to 7 days
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - range);

    const [
      totalUsers,
      activeUsers,
      totalProjects,
      totalCollaborations, // Assuming this is needed for overall stats
      newUsersThisPeriod,
      activeProjectsCount,
      recentActivity // This is for recent messages/activity, not a chart
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ active: true }),
      Project.countDocuments(),
      Collaboration.countDocuments(), // Total collaborations count
      User.countDocuments({ createdAt: { $gte: dateFilter } }), // New users in period
      Project.countDocuments({ status: 'active' }), // Active projects count
      Message.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('sender', 'name')
        .populate('project', 'title')
        .lean()
    ]);

    // Calculate percentages
    const activeUsersPercentage = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
    const newUsersPercentage = totalUsers > 0 ? (newUsersThisPeriod / totalUsers) * 100 : 0;
    const activeProjectsPercentage = totalProjects > 0 ? (activeProjectsCount / totalProjects) * 100 : 0;

    res.json({
      totalUsers,
      activeUsers,
      totalProjects,
      totalCollaborations,
      newUsersThisPeriod,
      activeProjects: activeProjectsCount,
      userStats: {
        activePercentage: activeUsersPercentage,
        newUsersPercentage
      },
      projectStats: {
        activePercentage: activeProjectsPercentage
      },
      // Ensure recentActivity mapping is correct based on your Message model and desired display
      recentActivity: recentActivity.map(activity => ({
        type: 'message', // Assuming all activities here are messages
        description: `${activity.sender?.name || 'Unknown'} sent a message in ${activity.project?.title || 'a project'}`,
        timestamp: activity.createdAt
      }))
    });
  } catch (err) {
    console.error('Error fetching dashboard statistics:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

// @desc    Get paginated and filterable list of all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { search, status, role, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.active = status === 'active';
    }

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// @desc    Get paginated and filterable list of all projects
// @route   GET /api/admin/projects
// @access  Private (Admin only)
exports.getAllProjects = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    if (status) {
      query.status = status;
    }

    const projects = await Project.find(query)
      .populate('owner', 'name email')
      .populate('collaborators', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Project.countDocuments(query);

    res.json({
      projects,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

// @desc    Get paginated and filterable list of all collaborations
// @route   GET /api/admin/collaborations
// @access  Private (Admin only)
exports.getAllCollaborations = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    // For searching on populated fields, you typically need to use aggregation or perform multiple queries.
    // For simplicity, the provided route did not implement search on populated fields,
    // so it's omitted here to match the user's provided route behavior.
    // If you need it, you would use Mongoose aggregation for text search across populated fields.

    const collaborations = await Collaboration.find(query)
      .populate('project', 'title')
      .populate('receiver', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Collaboration.countDocuments(query);

    res.json({
      collaborations,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error fetching collaborations:', err);
    res.status(500).json({ error: 'Failed to fetch collaborations' });
  }
};

// @desc    Activate or Deactivate a user account
// @route   POST /api/admin/users/:userId/:action
// @access  Private (Admin only)
exports.handleUserAction = async (req, res) => {
  try {
    const { userId, action } = req.params;
    const validActions = ['activate', 'deactivate'];

    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid user action provided. Must be "activate" or "deactivate".' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (action === 'deactivate' && user.role === 'admin') {
      const activeAdminCount = await User.countDocuments({ role: 'admin', active: true });
      if (activeAdminCount <= 1) {
        return res.status(400).json({ error: 'Cannot deactivate the last active admin user. This would lock the system.' });
      }
    }

    user.active = (action === 'activate');
    await user.save();

    res.json({ message: `User account has been ${action === 'activate' ? 'activated' : 'deactivated'} successfully.` });

  } catch (err) {
    console.error(`Error processing user action (${req.params.action}) for user ${req.params.userId}:`, err);
    res.status(500).json({ error: 'Failed to update user status.' });
  }
};

// @desc    Delete a user account permanently
// @route   DELETE /api/admin/users/:userId
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found for deletion.' });
    }

    if (userToDelete.role === 'admin') {
      const activeAdminCount = await User.countDocuments({ role: 'admin', active: true });
      if (activeAdminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user. This would lock the system.' });
      }
    }

    await User.findByIdAndDelete(userId);

    // OPTIONAL: Cascading deletes (uncomment if you want to delete related data)
    // await Message.deleteMany({ sender: userId });
    // await Collaboration.deleteMany({ $or: [{ receiver: userId }, { initiator: userId }] }); // Adjust if initiator is on Collaboration schema
    // await Project.updateMany({ owner: userId }, { $set: { owner: null } }); // Or delete projects owned by this user
    // await Project.updateMany({ collaborators: userId }, { $pull: { collaborators: userId } });

    res.json({ message: 'User account deleted successfully.' });

  } catch (err) {
    console.error(`Error deleting user ${req.params.userId}:`, err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
};


// @desc    Mark a message as deleted
// @route   DELETE /api/admin/messages/:messageId
// @access  Private (Admin only)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findByIdAndUpdate(messageId, { status: 'deleted' }, { new: true });

    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }
    res.json({ message: 'Message marked as deleted successfully.' });
  } catch (err) {
    console.error('Error marking message as deleted:', err);
    res.status(500).json({ error: 'Failed to mark message as deleted.' });
  }
};

// @desc    Delete a project permanently
// @route   DELETE /api/admin/projects/:id
// @access  Private (Admin only)
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // OPTIONAL: Cascading deletes (uncomment if you want to delete related data)
    // await Collaboration.deleteMany({ project: id });
    // await Message.deleteMany({ project: id });

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error(`Error deleting project ${req.params.id}:`, err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

// @desc    Update a collaboration request's status (accept/reject)
// @route   PUT /api/admin/collaborations/:id/:action
// @access  Private (Admin only)
exports.updateCollaborationStatus = async (req, res) => {
  try {
    const { id, action } = req.params;
    const collaboration = await Collaboration.findById(id);

    if (!collaboration) {
      return res.status(404).json({ error: 'Collaboration request not found' });
    }

    switch (action) {
      case 'accept':
        collaboration.status = 'accepted';
        // You might want to add the receiver to the project's collaborators here
        // const project = await Project.findById(collaboration.project);
        // if (project && !project.collaborators.includes(collaboration.receiver)) {
        //   project.collaborators.push(collaboration.receiver);
        //   await project.save();
        // }
        break;
      case 'reject':
        collaboration.status = 'rejected';
        break;
      default:
        return res.status(400).json({ error: 'Invalid action for collaboration status update. Use "accept" or "reject".' });
    }

    await collaboration.save();
    res.json({ message: `Collaboration request ${action}ed successfully` });
  } catch (err) {
    console.error('Error updating collaboration request:', err);
    res.status(500).json({ error: 'Failed to update collaboration request' });
  }
};

// @desc    Delete a collaboration request permanently
// @route   DELETE /api/admin/collaborations/:id
// @access  Private (Admin only)
exports.deleteCollaboration = async (req, res) => {
  try {
    const { id } = req.params;
    const collaboration = await Collaboration.findByIdAndDelete(id);

    if (!collaboration) {
      return res.status(404).json({ message: 'Collaboration request not found.' });
    }
    res.json({ message: 'Collaboration request deleted successfully.' });
  } catch (err) {
    console.error('Error deleting collaboration request:', err);
    res.status(500).json({ error: 'Failed to delete collaboration request.' });
  }
};

// @desc    Get detailed project analytics with filters and sorting
// @route   GET /api/admin/project-analytics
// @access  Private (Admin only)
exports.getProjectAnalytics = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, category, sort } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'title':
        sortOption = { title: 1 };
        break;
      case 'status':
        sortOption = { status: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const projects = await Project.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('owner', 'name email')
      .populate('collaborators', 'name email');

    const total = await Project.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      projects,
      currentPage: parseInt(page),
      totalPages,
      totalProjects: total
    });
  } catch (error) {
    console.error('Project analytics error:', error);
    res.status(500).json({ message: 'Error fetching project analytics' });
  }
};

// @desc    Get detailed user analytics with filters and sorting
// @route   GET /api/admin/user-analytics
// @access  Private (Admin only)
exports.getUserAnalytics = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status, sort } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status && status !== 'all') {
      query.active = (status === 'active');
    }

    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'name':
        sortOption = { name: 1 };
        break;
      case 'email':
        sortOption = { email: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const users = await User.find(query)
      .select('-password')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      users,
      currentPage: parseInt(page),
      totalPages,
      totalUsers: total
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ message: 'Error fetching user analytics' });
  }
};

// @desc    Get detailed message analytics with filters and sorting
// @route   GET /api/admin/message-analytics
// @access  Private (Admin only)
exports.getMessageAnalytics = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, sort } = req.query;
    const query = {};

    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'sender':
        // Sorting by populated field requires aggregation for efficiency,
        // or a simpler sort by sender ID if that's sufficient.
        // For direct sorting on sender's name/email, you'd need aggregation.
        // Keeping it as direct sender ID sort for simplicity as per original route definition.
        sortOption = { 'sender': 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const messages = await Message.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('sender', 'name email')
      .lean();

    const total = await Message.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      messages,
      currentPage: parseInt(page),
      totalPages,
      totalMessages: total
    });
  } catch (error) {
    console.error('Message analytics error:', error);
    res.status(500).json({ message: 'Error fetching message analytics' });
  }
};

// @desc    Update a message's status (flag, unflag, archive)
// @route   PUT /api/admin/messages/:messageId/:action
// @access  Private (Admin only)
exports.updateMessageStatus = async (req, res) => {
  try {
    const { messageId, action } = req.params;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    switch (action) {
      case 'flag':
        message.status = 'flagged';
        break;
      case 'unflag':
        message.status = 'active';
        break;
      case 'archive':
        message.status = 'archived';
        break;
      default:
        return res.status(400).json({ message: 'Invalid action for message status update. Use "flag", "unflag", or "archive".' });
    }

    await message.save();
    res.json({ message: `Message status updated to '${message.status}' successfully.` });
  } catch (error) {
    console.error('Message action error:', error);
    res.status(500).json({ message: 'Error updating message status.' });
  }
};


// --- NEW CHART-SPECIFIC ENDPOINTS ---

// @desc    Get user registration trend data (last 30 days)
// @route   GET /api/admin/charts/user-registration-trend
// @access  Private (Admin only)
exports.getUserRegistrationTrend = async (req, res) => {
  try {
    const today = getStartOfDay(new Date());
    const thirtyDaysAgo = getStartOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    const trend = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo, $lte: today }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Fill in missing dates with 0 count for a continuous chart
    const dateMap = new Map();
    trend.forEach(item => dateMap.set(item._id, item.count));

    const result = [];
    let currentDate = new Date(thirtyDaysAgo);
    while (currentDate <= today) {
      const dateString = currentDate.toISOString().split('T')[0];
      result.push({
        date: dateString,
        count: dateMap.get(dateString) || 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching user registration trend:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get project creation trend data (last 30 days)
// @route   GET /api/admin/charts/project-creation-trend
// @access  Private (Admin only)
exports.getProjectCreationTrend = async (req, res) => {
  try {
    const today = getStartOfDay(new Date());
    const thirtyDaysAgo = getStartOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    const trend = await Project.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo, $lte: today }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Fill in missing dates with 0 count for a continuous chart
    const dateMap = new Map();
    trend.forEach(item => dateMap.set(item._id, item.count));

    const result = [];
    let currentDate = new Date(thirtyDaysAgo);
    while (currentDate <= today) {
      const dateString = currentDate.toISOString().split('T')[0];
      result.push({
        date: dateString,
        count: dateMap.get(dateString) || 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching project creation trend:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get user role distribution data
// @route   GET /api/admin/charts/user-role-distribution
// @access  Private (Admin only)
exports.getUserRoleDistribution = async (req, res) => {
  try {
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role', // Group by the 'role' field
          count: { $sum: 1 } // Count documents in each group
        }
      },
      {
        $project: {
          _id: 0, // Exclude _id field
          role: '$_id', // Rename _id to role
          count: 1
        }
      }
    ]);

    // Format for easier consumption by frontend: { "admin": 5, "user": 20 }
    const formattedDistribution = roleDistribution.reduce((acc, item) => {
      acc[item.role] = item.count;
      return acc;
    }, {});

    res.json(formattedDistribution);
  } catch (error) {
    console.error('Error fetching user role distribution:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

