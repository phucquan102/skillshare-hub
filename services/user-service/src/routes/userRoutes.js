const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Auth
router.post('/register', userController.register);
router.post('/login', userController.login);

// Profile
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);

// Stats & verification
router.put('/stats', authMiddleware, userController.updateLearningStats);
router.put('/verify-email', authMiddleware, userController.verifyEmail);
router.put('/verify-phone', authMiddleware, userController.verifyPhone);

// Admin
router.get('/', authMiddleware, adminMiddleware, userController.getAllUsers);
router.get('/:id', authMiddleware, adminMiddleware, userController.getUserById);
router.post('/batch', authMiddleware, adminMiddleware, userController.getUsersBatch);
router.patch('/toggle-status/:userId', authMiddleware, adminMiddleware, userController.toggleUserStatus);
router.get('/stats/overview', authMiddleware, adminMiddleware, userController.getUsersStats);

module.exports = router;