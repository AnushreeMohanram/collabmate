const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Project = require('../models/Project');
const Message = require('../models/Message');
const Collaboration = require('../models/Collaboration');
const authMiddleware = require('../middleware/authMiddleware');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Admin middleware
const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({ error: 'Server error in admin middleware' });
  }
};

// Apply both auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Get AI-powered insights
router.get('/insights', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      totalMessages,
      totalSuggestions,
      recentActivity,
      projects
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ active: true }),
      Project.countDocuments(),
      Message.countDocuments(),
      Message.countDocuments({ type: 'suggestion' }),
      Message.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('sender', 'name')
        .populate('project', 'title')
        .lean(),
      Project.find()
        .populate('owner', 'name')
        .populate('collaborators', 'name')
        .lean()
    ]);

    // Generate AI insights
    const prompt = `Analyze this collaboration platform data and provide insights:
    - Total Users: ${totalUsers}
    - Active Users: ${activeUsers}
    - Total Projects: ${totalProjects}
    - Total Messages: ${totalMessages}
    - Total Suggestions: ${totalSuggestions}
    - Recent Projects: ${JSON.stringify(projects.slice(0, 5))}
    
    Provide insights on:
    1. User engagement trends
    2. Project collaboration patterns
    3. Areas for improvement
    4. Recommendations for increasing user engagement`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    });

    const insights = completion.choices[0].message.content;

    // Calculate engagement metrics
    const userEngagement = {
      activePercentage: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
      messagesPerUser: totalUsers > 0 ? totalMessages / totalUsers : 0,
      projectsPerUser: totalUsers > 0 ? totalProjects / totalUsers : 0,
      suggestionsPerUser: totalUsers > 0 ? totalSuggestions / totalUsers : 0
    };

    // Calculate project metrics
    const projectMetrics = {
      averageCollaborators: projects.reduce((acc, proj) => acc + (proj.collaborators?.length || 0), 0) / (projects.length || 1),
      activeProjects: projects.filter(p => p.status === 'active').length,
      archivedProjects: projects.filter(p => p.status === 'archived').length,
      completedProjects: projects.filter(p => p.status === 'completed').length
    };

    res.json({
      insights,
      metrics: {
        userEngagement,
        projectMetrics
      },
      recentActivity: recentActivity.map(activity => ({
        type: activity.type,
        description: `${activity.sender?.name || 'Unknown'} ${activity.type === 'message' ? 'sent a message' : 'made a suggestion'} in ${activity.project?.title || 'a project'}`,
        timestamp: activity.createdAt
      }))
    });
  } catch (err) {
    console.error('Error generating insights:', err);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Get AI-powered project recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const [users, projects] = await Promise.all([
      User.find().select('-password').lean(),
      Project.find().populate('owner', 'name').populate('collaborators', 'name').lean()
    ]);

    const prompt = `Based on these users and projects, suggest potential collaborations:
    Users: ${JSON.stringify(users)}
    Projects: ${JSON.stringify(projects)}
    
    Provide recommendations for:
    1. Potential project collaborations between users
    2. Skills that could complement existing projects
    3. Project ideas based on user skills and interests`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    });

    const recommendations = completion.choices[0].message.content;

    res.json({ recommendations });
  } catch (err) {
    console.error('Error generating recommendations:', err);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const range = parseInt(req.query.range) || 7;
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - range);

    const [
      totalUsers,
      activeUsers,
      totalProjects,
      totalMessages,
      totalSuggestions,
      recentActivity
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ active: true }),
      Project.countDocuments(),
      Message.countDocuments({ createdAt: { $gte: dateFilter } }),
      Message.countDocuments({ type: 'suggestion', createdAt: { $gte: dateFilter } }),
      Message.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('sender', 'name')
        .populate('project', 'title')
        .lean()
    ]);

    // Calculate percentages
    const activePercentage = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: dateFilter }
    });
    const newUsersPercentage = totalUsers > 0 ? (newUsersThisWeek / totalUsers) * 100 : 0;
    const activeProjects = await Project.countDocuments({ status: 'active' });
    const activeProjectsPercentage = totalProjects > 0 ? (activeProjects / totalProjects) * 100 : 0;

    res.json({
      totalUsers,
      activeUsers,
      totalProjects,
      totalMessages,
      totalSuggestions,
      newUsersThisWeek,
      activeProjects,
      userStats: {
        activePercentage,
        newUsersPercentage
      },
      projectStats: {
        activePercentage: activeProjectsPercentage
      },
      recentActivity: recentActivity.map(activity => ({
        type: activity.type,
        description: `${activity.sender?.name || 'Unknown'} ${activity.type === 'message' ? 'sent a message' : 'made a suggestion'} in ${activity.project?.title || 'a project'}`,
        timestamp: activity.createdAt
      }))
    });
  } catch (err) {
    console.error('Stats route error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
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
});

// Get all projects
router.get('/projects', async (req, res) => {
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
});

// Get all collaborations
router.get('/collaborations', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { 'project.title': { $regex: search, $options: 'i' } },
        { 'receiver.name': { $regex: search, $options: 'i' } }
      ];
    }

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
});

// User actions (activate/deactivate)
router.post('/users/:userId/:action', async (req, res) => {
  try {
    const { userId, action } = req.params;
    const validActions = ['activate', 'deactivate'];

    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deactivating the last admin
    if (action === 'deactivate' && user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', active: true });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot deactivate the last admin user' });
      }
    }

    user.active = action === 'activate';
    await user.save();

    res.json({ message: `User ${action}d successfully` });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Project actions (archive/unarchive)
router.post('/projects/:projectId/:action', async (req, res) => {
  try {
    const { projectId, action } = req.params;
    const validActions = ['archive', 'unarchive'];

    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    project.status = action === 'archive' ? 'archived' : 'active';
    await project.save();

    res.json({ message: `Project ${action}d successfully` });
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Update project status
router.put('/projects/:id/:action', async (req, res) => {
  try {
    const { id, action } = req.params;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    switch (action) {
      case 'archive':
        project.status = 'archived';
        break;
      case 'activate':
        project.status = 'active';
        break;
      case 'delete':
        await Project.findByIdAndDelete(id);
        return res.json({ message: 'Project deleted successfully' });
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    await project.save();
    res.json({ message: `Project ${action}ed successfully` });
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Update collaboration status
router.put('/collaborations/:id/:action', async (req, res) => {
  try {
    const { id, action } = req.params;
    const collaboration = await Collaboration.findById(id);

    if (!collaboration) {
      return res.status(404).json({ error: 'Collaboration not found' });
    }

    switch (action) {
      case 'accept':
        collaboration.status = 'accepted';
        break;
      case 'reject':
        collaboration.status = 'rejected';
        break;
      case 'delete':
        await Collaboration.findByIdAndDelete(id);
        return res.json({ message: 'Collaboration deleted successfully' });
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    await collaboration.save();
    res.json({ message: `Collaboration ${action}ed successfully` });
  } catch (err) {
    console.error('Error updating collaboration:', err);
    res.status(500).json({ error: 'Failed to update collaboration' });
  }
});

module.exports = router; 