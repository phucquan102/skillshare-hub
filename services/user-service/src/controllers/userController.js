const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

      // Tạo user mới
      const user = new User({
        email,
        password: hashedPassword,
        fullName,
        role: role || 'student'
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
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
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
          role: user.role
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

      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // Cập nhật profile
  updateProfile: async (req, res) => {
    try {
      const { fullName, profile } = req.body;
      
      const user = await User.findByIdAndUpdate(
        req.userId,
        {
          fullName,
          profile: {
            ...profile
          }
        },
        { new: true }
      ).select('-password');

      res.json({
        message: 'Cập nhật thành công',
        user
      });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // Lấy danh sách users (admin)
  getAllUsers: async (req, res) => {
    try {
      const { page = 1, limit = 10, role } = req.query;
      
      const filter = {};
      if (role) filter.role = role;

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
  }
};

module.exports = userController;