const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const userController = require('../controllers/userController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const User = require('../models/User');

// Auth routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/google', userController.googleLogin);

// Password reset routes
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// Email verification routes
router.post('/verify-email', userController.verifyEmailWithToken);
router.post('/resend-verification', userController.resendVerification);

// Profile routes
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);

// Stats & verification
router.put('/stats', authMiddleware, userController.updateLearningStats);
router.put('/verify-email', authMiddleware, userController.verifyEmail);
router.put('/verify-phone', authMiddleware, userController.verifyPhone);

// Admin routes
router.get('/', authMiddleware, adminMiddleware, userController.getAllUsers);
router.get('/:id', authMiddleware, adminMiddleware, userController.getUserById);
router.post('/batch', authMiddleware, adminMiddleware, userController.getUsersBatch);
router.patch('/toggle-status/:userId', authMiddleware, adminMiddleware, userController.toggleUserStatus);
router.get('/stats/overview', authMiddleware, adminMiddleware, userController.getUsersStats);
router.put('/:userId', authMiddleware, adminMiddleware, userController.updateUser);
router.delete('/:userId', authMiddleware, adminMiddleware, userController.deleteUser);
router.put('/:userId/make-admin', authMiddleware, adminMiddleware, userController.makeAdmin);
router.patch('/upgrade-to-instructor', authMiddleware, userController.upgradeToInstructor);
// Verify token (dùng cho các service khác)
router.post('/verify-token', async (req, res) => {
  try {
    console.log('🔐 Received verify-token request');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ message: 'Không có token' });
    }

    console.log('✅ Token received, verifying...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded:', decoded);

    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('❌ User not found');
      return res.status(403).json({ message: 'Người dùng không tồn tại' });
    }

    if (!user.isActive) {
      console.log('❌ User not active');
      return res.status(403).json({ message: 'Tài khoản không hoạt động' });
    }

    console.log('✅ Token verification successful for user:', user.email);
    
    res.json({
      userId: decoded.userId,
      role: decoded.role,
      isActive: user.isActive,
      email: user.email
    });
  } catch (err) {
    console.error('❌ Verify token error:', err.message);
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
});

// Internal API chỉ cho service-to-service
router.get('/internal/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profile: user.profile || {}
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

router.post('/internal/batch', async (req, res) => {
  try {
    const { userIds } = req.body;
    const users = await User.find({ _id: { $in: userIds } }).lean();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

module.exports = router;