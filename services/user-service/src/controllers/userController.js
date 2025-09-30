const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const userController = {
  // Đăng ký người dùng mới
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

      // Tạo user mới với các giá trị mặc định từ model
      const user = new User({
        email,
        password: hashedPassword,
        fullName,
        role: role || 'student',
        // Các giá trị mặc định sẽ được tự động áp dụng từ schema
      });

      await user.save();

      // Tạo JWT token
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Đăng ký thành công',
        token,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isVerified: user.isVerified,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified
        }
      });
    } catch (error) {
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
      user = new User({
        email: payload.email,
        fullName: payload.name,
        password: await bcrypt.hash(Math.random().toString(36), 12), // random password
        role: 'student',
        isVerified: true,
      });
      await user.save();
    }

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
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Invalid Google token' });
  }
},
  // Đăng nhập
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

  // Lấy thông tin profile
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

  // Cập nhật profile
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

  // Cập nhật thống kê học tập
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

  // Xác thực email
  verifyEmail: async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.userId,
        { 
          emailVerified: true,
          isVerified: true // Có thể cập nhật isVerified khi email được xác thực
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

  // Xác thực số điện thoại
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

  // Lấy danh sách users (admin)
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

  // Lấy user theo ID
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

  // Lấy nhiều users theo danh sách ID
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
  } catch (error) {
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
  // Khóa/mở khóa tài khoản (admin)
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

  // Lấy thống kê tổng quan (admin)
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

  // Set quyền admin cho user (chỉ dùng trong development)
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
// Cập nhật thông tin người dùng (bao gồm vai trò)


module.exports = userController;