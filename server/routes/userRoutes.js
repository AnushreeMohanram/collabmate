const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises; 
const {
  getUserProfile,
  updateUserProfile,
  searchUsers 
} = require('../controllers/userController');



const avatarUploadDir = 'uploads/avatars'; 

const avatarStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(avatarUploadDir, { recursive: true }); 
      cb(null, avatarUploadDir);
    } catch (err) {
      console.error('Error creating avatar upload directory:', err);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const userId = req.user._id || 'unknown'; 
    cb(null, `avatar-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});


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
    fileSize: 5 * 1024 * 1024 
  }
});



router.get('/', authMiddleware, searchUsers); 



router.get('/profile', authMiddleware, getUserProfile); 


router.put('/profile', authMiddleware, updateUserProfile); 



router.post('/profile/avatar', authMiddleware, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      await fs.unlink(req.file.path);
      return res.status(404).json({ message: 'User not found.' });
    }
    if (user.avatar && !user.avatar.includes('blank-profile-picture') && user.avatar.startsWith('/uploads/avatars')) {
      const oldAvatarPath = path.join(__dirname, '..', user.avatar); 
      try {
        await fs.unlink(oldAvatarPath);
        console.log(`Deleted old avatar: ${oldAvatarPath}`);
      } catch (unlinkErr) {
        console.warn(`Could not delete old avatar ${oldAvatarPath}:`, unlinkErr.message);

      }
    }

    
    user.avatar = `/${req.file.path}`; 
    await user.save();

    res.status(200).json({
      message: 'Avatar updated successfully',
      avatar: user.avatar 
    });

  } catch (err) {
    console.error('Error uploading avatar:', err);
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
        console.log(`Deleted failed upload: ${req.file.path}`);
      } catch (unlinkErr) {
        console.error('Error deleting failed upload:', unlinkErr);
      }
    }
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large! Max 5MB allowed.' });
      }
      return res.status(400).json({ message: `File upload error: ${err.message}` });
    }
    if (err.message.includes('Only image files')) { 
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error updating avatar', error: err.message });
  }
});


module.exports = router;
