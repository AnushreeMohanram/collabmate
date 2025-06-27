// controllers/adminController.js

const User = require('../models/User');
const Project = require('../models/Project');
const Message = require('../models/Message');
const Collaboration = require('../models/Collaboration');
const bcrypt = require('bcryptjs'); 
const getStartOfDay = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

exports.getAdminStats = async (req, res) => {
  try {
    const range = parseInt(req.query.range) || 7; 
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - range);

    const [
      totalUsers,
      activeUsers,
      totalProjects,
      totalCollaborations, 
      newUsersThisPeriod,
      activeProjectsCount,
      recentActivity 
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ active: true }),
      Project.countDocuments(),
      Collaboration.countDocuments(), 
      User.countDocuments({ createdAt: { $gte: dateFilter } }), 
      Project.countDocuments({ status: 'active' }),
      Message.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('sender', 'name')
        .populate('project', 'title')
        .lean()
    ]);

    
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
      recentActivity: recentActivity.map(activity => ({
        type: 'message',
        description: `${activity.sender?.name || 'Unknown'} sent a message in ${activity.project?.title || 'a project'}`,
        timestamp: activity.createdAt
      }))
    });
  } catch (err) {
    console.error('Error fetching dashboard statistics:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

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

exports.getAllCollaborations = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

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

    res.json({ message: 'User account deleted successfully.' });

  } catch (err) {
    console.error(`Error deleting user ${req.params.userId}:`, err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
};


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

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error(`Error deleting project ${req.params.id}:`, err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};
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
exports.getUserRoleDistribution = async (req, res) => {
  try {
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role', 
          count: { $sum: 1 } 
        }
      },
      {
        $project: {
          _id: 0, 
          role: '$_id', 
          count: 1
        }
      }
    ]);

    
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

