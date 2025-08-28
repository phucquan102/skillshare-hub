const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);

// Admin routes
router.get('/all', authMiddleware, adminMiddleware, userController.getAllUsers);
router.patch('/:userId/toggle-status', authMiddleware, adminMiddleware, userController.toggleUserStatus);

module.exports = router;