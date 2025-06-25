// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User'); // Assuming User model is needed for avatar update logic
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises; // For async file system operations

// --- Import user controller functions ---
// IMPORTANT: Ensure these functions exist and are exported correctly from userController.js
const {
  getUserProfile,
  updateUserProfile,
  searchUsers // <--- IMPORTANT: Ensure searchUsers is imported here
} = require('../controllers/userController');


// --- Multer Configuration for Avatar Uploads ---
const avatarUploadDir = 'uploads/avatars'; // Directory for avatar images

const avatarStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(avatarUploadDir, { recursive: true }); // Ensure directory exists
      cb(null, avatarUploadDir);
    } catch (err) {
      console.error('Error creating avatar upload directory:', err);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Use the user's ID in the filename to ensure unique and easily identifiable avatars
    // This assumes req.user._id is available from authMiddleware
    const userId = req.user._id || 'unknown'; // Fallback for safety
    cb(null, `avatar-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Filter to only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for avatars!'), false);
  }
};

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit for avatars
  }
});
// --- End Multer Configuration ---


// @route   GET /api/users (for searching other users)
// @desc    Search for users based on a query parameter (e.g., /api/users?search=John)
// @access  Private (only authenticated users can search other users)
router.get('/', authMiddleware, searchUsers); // This now maps to searchUsers from controller


// @route   GET /api/users/profile
// @desc    Get the profile details of the currently authenticated user
// @access  Private (only the authenticated user can access their own profile)
router.get('/profile', authMiddleware, getUserProfile); // This maps to getUserProfile from controller


// @route   PUT /api/users/profile
// @desc    Update the profile details of the currently authenticated user (non-avatar fields)
// @access  Private (only the authenticated user can update their own profile)
// IMPORTANT: This route DOES NOT handle file uploads. File uploads are handled by /profile/avatar
router.put('/profile', authMiddleware, updateUserProfile); // This maps to updateUserProfile from controller


// @route   POST /api/users/profile/avatar
// @desc    Upload or update the profile avatar for the authenticated user
// @access  Private
router.post('/profile/avatar', authMiddleware, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      // If user not found but file uploaded, delete the orphaned file
      await fs.unlink(req.file.path);
      return res.status(404).json({ message: 'User not found.' });
    }

    // Optional: Delete old avatar file if it's not the default and not a placeholder
    // Ensure the default avatar path logic matches your User model default
    if (user.avatar && !user.avatar.includes('blank-profile-picture') && user.avatar.startsWith('/uploads/avatars')) {
      const oldAvatarPath = path.join(__dirname, '..', user.avatar); // Reconstruct full path
      try {
        await fs.unlink(oldAvatarPath);
        console.log(`Deleted old avatar: ${oldAvatarPath}`);
      } catch (unlinkErr) {
        console.warn(`Could not delete old avatar ${oldAvatarPath}:`, unlinkErr.message);
        // Don't block the request if old avatar deletion fails
      }
    }

    // Update user's avatar field with the new file path
    user.avatar = `/${req.file.path}`; // Store the public URL path
    await user.save();

    res.status(200).json({
      message: 'Avatar updated successfully',
      avatar: user.avatar // Send back the new avatar URL
    });

  } catch (err) {
    console.error('Error uploading avatar:', err);
    // If a file was uploaded but an error occurred during processing, delete the file
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
        console.log(`Deleted failed upload: ${req.file.path}`);
      } catch (unlinkErr) {
        console.error('Error deleting failed upload:', unlinkErr);
      }
    }
    // Handle Multer-specific errors
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large! Max 5MB allowed.' });
      }
      return res.status(400).json({ message: `File upload error: ${err.message}` });
    }
    // Handle file filter error
    if (err.message.includes('Only image files')) { // Custom error message from fileFilter
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error updating avatar', error: err.message });
  }
});


module.exports = router;
