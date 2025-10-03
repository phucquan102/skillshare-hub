const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const crypto = require('crypto');
const emailService = require('../services/emailService');

const userController = {
  register: async (req, res) => {
    try {
      const { email, password, fullName, role } = req.body;

      // Kiểm tra email đã tồn tại
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email đã được sử dụng' });
      }

      // Mã hóa password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Tạo verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      // Tạo user mới
      const user = new User({
        email,
        password: hashedPassword,
        fullName,
        role: role || 'student',
        emailVerificationToken,
        emailVerificationExpires,
        isVerified: false,
        emailVerified: false
      });

      await user.save();

      // Gửi email verification (async - không chờ)
      emailService.sendVerificationEmail(user, emailVerificationToken)
        .then(result => {
          console.log('✅ Verification email sent to:', user.email);
        })
        .catch(error => {
          console.error('❌ Failed to send verification email:', error.message);
        });

      // Tạo JWT token
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
        token,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isVerified: user.isVerified,
          isActive: user.isActive,
          emailVerified: user.emailVerified
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      
      const user = await User.findOne({ email });
      if (!user) {
        // For security, don't reveal if email exists
        return res.json({ 
          message: 'Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu' 
        });
      }

      // Tạo reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetTokenExpiry;
      await user.save();

      // Gửi email reset password (async)
      emailService.sendPasswordResetEmail(user, resetToken)
        .then(result => {
          console.log('✅ Password reset email sent to:', user.email);
        })
        .catch(error => {
          console.error('❌ Failed to send reset email:', error.message);
        });

      res.json({ 
        message: 'Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu' 
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token và mật khẩu mới là bắt buộc' });
      }

      // Tìm user bằng reset token và kiểm tra thời hạn
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
      }

      // Mã hóa mật khẩu mới
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Cập nhật mật khẩu và xóa reset token
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      // Gửi email xác nhận (async)
      emailService.sendPasswordResetConfirmationEmail(user)
        .then(result => {
          console.log('✅ Password reset confirmation email sent to:', user.email);
        })
        .catch(error => {
          console.error('❌ Failed to send reset confirmation email:', error.message);
        });

      res.json({ message: 'Đặt lại mật khẩu thành công' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  verifyEmailWithToken: async (req, res) => {
    try {
      const { token } = req.body;
      
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
      }

      user.emailVerified = true;
      user.isVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      // Gửi welcome email (async)
      emailService.sendWelcomeEmail(user)
        .then(result => {
          console.log('✅ Welcome email sent to:', user.email);
        })
        .catch(error => {
          console.error('❌ Failed to send welcome email:', error.message);
        });

      // Tạo JWT token mới
      const newToken = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({ 
        message: 'Xác thực email thành công',
        token: newToken,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          emailVerified: user.emailVerified,
          isVerified: user.isVerified
        }
      });
    } catch (error) {
      console.error('Verify email error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  resendVerification: async (req, res) => {
    try {
      const { email } = req.body;
      
      const user = await User.findOne({ email });
      if (!user) {
        return res.json({ 
          message: 'Nếu email tồn tại, chúng tôi đã gửi email xác thực' 
        });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: 'Email đã được xác thực' });
      }

      // Tạo verification token mới
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      user.emailVerificationToken = emailVerificationToken;
      user.emailVerificationExpires = emailVerificationExpires;
      await user.save();

      // Gửi email verification (async)
      emailService.sendVerificationEmail(user, emailVerificationToken)
        .then(result => {
          console.log('✅ Resent verification email to:', user.email);
        })
        .catch(error => {
          console.error('❌ Failed to resend verification email:', error.message);
        });

      res.json({ 
        message: 'Nếu email tồn tại, chúng tôi đã gửi email xác thực' 
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  googleLogin: async (req, res) => {
    try {
      const { token } = req.body;
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      let user = await User.findOne({ email: payload.email });
      if (!user) {
        // Tạo mật khẩu an toàn hơn
        const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        user = new User({
          email: payload.email,
          fullName: payload.name,
          password: await bcrypt.hash(randomPassword, 12),
          role: 'student',
          isVerified: true,
          isActive: true,
          emailVerified: true,
        });
        await user.save();
      }

      // Kiểm tra xem user có bị khóa không
      if (!user.isActive) {
        return res.status(400).json({ message: 'Tài khoản đã bị khóa' });
      }

      // Cập nhật lastLogin
      user.lastLogin = new Date();
      await user.save();

      const jwtToken = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Google login success',
        token: jwtToken,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isVerified: user.isVerified,
          isActive: user.isActive,
          lastLogin: user.lastLogin
        },
      });
    } catch (error) {
      console.error('Google login error:', error);
      res.status(401).json({ message: 'Invalid Google token' });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Tìm user theo email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
      }

      // Kiểm tra password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
      }

      // Kiểm tra tài khoản có bị khóa
      if (!user.isActive) {
        return res.status(400).json({ message: 'Tài khoản đã bị khóa' });
      }

      // Cập nhật lastLogin
      user.lastLogin = new Date();
      await user.save();

      // Tạo JWT token
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Đăng nhập thành công',
        token,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isVerified: user.isVerified,
          isActive: user.isActive,
          lastLogin: user.lastLogin
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.userId).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }

      res.json({ 
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          profile: user.profile,
          preferences: user.preferences,
          stats: user.stats,
          isVerified: user.isVerified,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { fullName, profile, preferences } = req.body;
      
      const updateData = {};
      if (fullName) updateData.fullName = fullName;
      if (profile) updateData.profile = { ...profile };
      if (preferences) updateData.preferences = { ...preferences };

      const user = await User.findByIdAndUpdate(
        req.userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }

      res.json({
        message: 'Cập nhật thành công',
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          profile: user.profile,
          preferences: user.preferences,
          stats: user.stats
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  updateLearningStats: async (req, res) => {
    try {
      const { coursesCompleted, totalLearningHours, avgRating } = req.body;
      
      const updateData = {};
      if (coursesCompleted !== undefined) updateData['stats.coursesCompleted'] = coursesCompleted;
      if (totalLearningHours !== undefined) updateData['stats.totalLearningHours'] = totalLearningHours;
      if (avgRating !== undefined) updateData['stats.avgRating'] = avgRating;

      const user = await User.findByIdAndUpdate(
        req.userId,
        updateData,
        { new: true }
      ).select('stats');

      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }

      res.json({
        message: 'Cập nhật thống kê thành công',
        stats: user.stats
      });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  verifyEmail: async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.userId,
        { 
          emailVerified: true,
          isVerified: true
        },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }

      res.json({
        message: 'Xác thực email thành công',
        user: {
          id: user._id,
          emailVerified: user.emailVerified,
          isVerified: user.isVerified
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  verifyPhone: async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.userId,
        { phoneVerified: true },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }

      res.json({
        message: 'Xác thực số điện thoại thành công',
        user: {
          id: user._id,
          phoneVerified: user.phoneVerified
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        role, 
        isActive, 
        isVerified,
        search 
      } = req.query;
      
      const filter = {};
      if (role) filter.role = role;
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
      if (search) {
        filter.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await User.find(filter)
        .select('-password')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(filter);

      res.json({
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  getUserById: async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }

      res.json({
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          profile: user.profile || {},
          preferences: user.preferences,
          stats: user.stats,
          isVerified: user.isVerified,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  getUsersBatch: async (req, res) => {
    try {
      const { userIds } = req.body;
      
      if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({ message: 'userIds array is required' });
      }

      const users = await User.find({
        _id: { $in: userIds }
      }).select('-password');

      const formattedUsers = users.map(user => ({
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        profile: user.profile || {},
        stats: user.stats,
        isVerified: user.isVerified,
        isActive: user.isActive
      }));

      res.json({
        users: formattedUsers
      });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }
      
      if (user.role === 'admin') {
        return res.status(403).json({ message: 'Không thể xóa tài khoản admin' });
      }

      await User.deleteOne({ _id: userId });

      res.json({ message: 'Xóa người dùng thành công' });
    } catch ( error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const updateData = req.body;

      // Kiểm tra vai trò hợp lệ nếu có
      if (updateData.role && !['student', 'instructor', 'admin'].includes(updateData.role)) {
        return res.status(400).json({ message: 'Vai trò không hợp lệ' });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }

      res.json({
        message: 'Cập nhật người dùng thành công',
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isActive: user.isActive,
          isVerified: user.isVerified,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          profile: user.profile || {},
          preferences: user.preferences || {},
          stats: user.stats || {},
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  toggleUserStatus: async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }

      user.isActive = !user.isActive;
      await user.save();

      res.json({
        message: `${user.isActive ? 'Mở khóa' : 'Khóa'} tài khoản thành công`,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          isActive: user.isActive
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  getUsersStats: async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const verifiedUsers = await User.countDocuments({ isVerified: true });
      const usersByRole = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        totalUsers,
        activeUsers,
        verifiedUsers,
        usersByRole
      });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  makeAdmin: async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Tìm user và cập nhật role thành admin
      const user = await User.findByIdAndUpdate(
        userId,
        { role: 'admin' },
        { new: true }
      );
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ message: 'User role updated to admin', user });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = userController;