const express = require('express');
const router = express.Router();
const Collaboration = require('../models/Collaboration');
const Project = require('../models/Project');
const authMiddleware = require('../middleware/authMiddleware');

// Send collaboration request
router.post('/request', authMiddleware, async (req, res) => {
  try {
    console.log('Creating collaboration request:', req.body);
    
    const { projectId, receiverId, role, message } = req.body;

    // Validate input
    if (!projectId || !receiverId) {
      return res.status(400).json({ error: 'Project ID and receiver ID are required' });
    }

    // Check if project exists and user is owner
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only project owner can send collaboration requests' });
    }

    // Check if collaboration already exists
    const existingCollab = await Collaboration.findOne({
      project: projectId,
      receiver: receiverId
    });

    if (existingCollab) {
      return res.status(400).json({ error: 'Collaboration request already exists' });
    }

    // Create collaboration request
    const collaboration = new Collaboration({
      project: projectId,
      sender: req.user._id,
      receiver: receiverId,
      role: role || 'editor',
      message: message || ''
    });

    await collaboration.save();
    console.log('Collaboration request created:', collaboration);

    res.status(201).json({
      message: 'Collaboration request sent successfully',
      collaboration
    });
  } catch (err) {
    console.error('Error creating collaboration request:', err);
    res.status(500).json({ error: 'Failed to send collaboration request' });
  }
});

// Get collaboration requests (pending)
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching collaboration requests for user:', req.user._id);
    
    const requests = await Collaboration.find({
      receiver: req.user._id,
      status: 'pending'
    })
    .populate('sender', 'name email')
    .populate('project', 'name description')
    .sort({ createdAt: -1 });

    // Filter out any requests where sender or project is null
    const validRequests = requests.filter(req => req.sender && req.project);

    console.log('Found collaboration requests:', validRequests);

    res.json({ requests: validRequests });
  } catch (err) {
    console.error('Error fetching collaboration requests:', err);
    res.status(500).json({ error: 'Failed to fetch collaboration requests' });
  }
});

// Accept collaboration request
router.put('/accept/:id', authMiddleware, async (req, res) => {
  try {
    console.log('Accepting collaboration request:', req.params.id);
    
    const collaboration = await Collaboration.findOne({
      _id: req.params.id,
      receiver: req.user._id,
      status: 'pending'
    });

    if (!collaboration) {
      return res.status(404).json({ error: 'Collaboration request not found' });
    }

    collaboration.status = 'accepted';
    await collaboration.save();
    console.log('Collaboration request accepted:', collaboration);

    res.json({
      message: 'Collaboration request accepted',
      collaboration
    });
  } catch (err) {
    console.error('Error accepting collaboration request:', err);
    res.status(500).json({ error: 'Failed to accept collaboration request' });
  }
});

// Reject collaboration request
router.put('/reject/:id', authMiddleware, async (req, res) => {
  try {
    console.log('Rejecting collaboration request:', req.params.id);
    
    const collaboration = await Collaboration.findOne({
      _id: req.params.id,
      receiver: req.user._id,
      status: 'pending'
    });

    if (!collaboration) {
      return res.status(404).json({ error: 'Collaboration request not found' });
    }

    collaboration.status = 'rejected';
    await collaboration.save();
    console.log('Collaboration request rejected:', collaboration);

    res.json({
      message: 'Collaboration request rejected',
      collaboration
    });
  } catch (err) {
    console.error('Error rejecting collaboration request:', err);
    res.status(500).json({ error: 'Failed to reject collaboration request' });
  }
});

// Get project collaborators
router.get('/project/:projectId', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching collaborators for project:', req.params.projectId);
    
    const collaborators = await Collaboration.find({
      project: req.params.projectId,
      status: 'accepted'
    })
    .populate('receiver', 'name email')
    .sort({ createdAt: -1 });

    console.log('Found collaborators:', collaborators);

    res.json({ collaborators });
  } catch (err) {
    console.error('Error fetching collaborators:', err);
    res.status(500).json({ error: 'Failed to fetch collaborators' });
  }
});

// Remove collaborator
router.delete('/remove/:id', authMiddleware, async (req, res) => {
  try {
    console.log('Removing collaborator:', req.params.id);
    
    const collaboration = await Collaboration.findById(req.params.id);
    
    if (!collaboration) {
      return res.status(404).json({ error: 'Collaboration not found' });
    }

    // Check if user is project owner
    const project = await Project.findById(collaboration.project);
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only project owner can remove collaborators' });
    }

    collaboration.status = 'removed';
    await collaboration.save();
    console.log('Collaborator removed:', collaboration);

    res.json({
      message: 'Collaborator removed successfully',
      collaboration
    });
  } catch (err) {
    console.error('Error removing collaborator:', err);
    res.status(500).json({ error: 'Failed to remove collaborator' });
  }
});

module.exports = router; 