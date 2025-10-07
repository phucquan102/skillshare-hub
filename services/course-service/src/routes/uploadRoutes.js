// services/course-service/src/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const uploadController = require('../controllers/uploadController');
const { authMiddleware, instructorMiddleware } = require('../middleware/auth');

// Upload single image
router.post('/image', 
  authMiddleware,
  instructorMiddleware,
  upload.single('image'),
  uploadController.uploadImage
);

// Upload multiple images
router.post('/images', 
  authMiddleware,
  instructorMiddleware,
  upload.array('images', 10), // Tối đa 10 ảnh
  uploadController.uploadMultipleImages
);

// Upload video
router.post('/video', 
  authMiddleware,
  instructorMiddleware,
  upload.single('video'),
  uploadController.uploadVideo
);

// Delete file
router.delete('/file', 
  authMiddleware,
  instructorMiddleware,
  uploadController.deleteFile
);

module.exports = router;