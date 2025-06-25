// server/routes/attachmentRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming you want attachments to be private

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Files will be saved in the 'uploads/' directory
  },
  filename: function (req, file, cb) {
    // Use a unique filename to prevent clashes, e.g., timestamp-originalfilename
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// File filter to allow only certain file types (optional, but recommended)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip|rar|mp4|mov/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10 // 10MB file size limit
  },
  fileFilter: fileFilter
});

// Route to handle single file upload
// Example: POST /api/attachments/upload/single
router.post('/upload/single', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }
  console.log('File uploaded:', req.file);
  res.status(200).json({
    message: 'File uploaded successfully!',
    filePath: `/uploads/${req.file.filename}`, // Path to access the file from frontend
    fileName: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

// You can also add a route for multiple files if needed, e.g., upload.array('files', 5)

module.exports = router;