const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const authMiddleware = require('../middleware/authMiddleware');
const Collaboration = require('../models/Collaboration');

// 🟩 Get all projects for logged-in user (including collaborations)
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching projects for user:', req.user._id);
    
    // Find projects where user is owner
    const ownedProjects = await Project.find({ owner: req.user._id });
    const ownedProjectsWithRole = ownedProjects.map(project => ({
      ...project.toObject(),
      userRole: 'owner'
    }));
    
    // Find projects where user is collaborator
    const collaborations = await Collaboration.find({
      receiver: req.user._id,
      status: 'accepted'
    }).populate('project');
    
    const collaboratedProjects = collaborations
      .filter(collab => collab.project) // Only keep collaborations with a valid project
      .map(collab => ({
        ...collab.project.toObject(),
        userRole: collab.role,
        collaborationId: collab._id
      }));
    
    // Combine both lists
    const allProjects = [...ownedProjectsWithRole, ...collaboratedProjects];
    
    console.log(`Found ${ownedProjects.length} owned projects and ${collaboratedProjects.length} collaborated projects`);
    
    res.json(allProjects);
  } catch (err) {
    console.error('❌ Error fetching projects:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project details (with collaborator check)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching project details:', req.params.id);
    
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is owner or collaborator
    const isOwner = project.owner.toString() === req.user._id.toString();
    const collaboration = await Collaboration.findOne({
      project: req.params.id,
      receiver: req.user._id,
      status: 'accepted'
    });

    if (!isOwner && !collaboration) {
      return res.status(403).json({ error: 'Not authorized to access this project' });
    }

    // Get collaborator details
    const collaborators = await Collaboration.find({
      project: req.params.id,
      status: 'accepted'
    }).populate('receiver', 'name email');

    const projectWithDetails = {
      ...project.toObject(),
      userRole: isOwner ? 'owner' : collaboration.role,
      collaborators: collaborators.map(c => ({
        user: c.receiver,
        role: c.role
      }))
    };

    res.json(projectWithDetails);
  } catch (err) {
    console.error('❌ Error fetching project details:', err);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  let { name, title, description, category } = req.body;
  name = (name || title || '').trim();
  description = (description || '').trim();
  category = (category || 'General').trim();
  if (!name || !description) {
    return res.status(400).json({ error: 'Project name and description are required' });
  }
  try {
    const project = new Project({
      owner: req.user._id,
      name,
      description,
      category,
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error('❌ Error creating project:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});


// 🟥 Delete project
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('Attempting to delete project:', req.params.id);
    console.log('User ID:', req.user._id);

    const project = await Project.findById(req.params.id);
    console.log('Found project:', project);

    if (!project) {
      console.log('Project not found');
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      console.log('Unauthorized: User is not the project owner');
      return res.status(403).json({ error: 'Not authorized to delete this project' });
    }

    // Delete the project
    await Project.findByIdAndDelete(req.params.id);
    console.log('Project deleted successfully');

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting project:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ 
      error: 'Failed to delete project',
      details: err.message 
    });
  }
});


module.exports = router;
