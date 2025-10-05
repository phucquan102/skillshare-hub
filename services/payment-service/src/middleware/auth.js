// payment-service/src/middleware/auth.js
const axios = require('axios');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Không có token, truy cập bị từ chối' });
    }

    // Gọi API verify-token của user-service
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
    const response = await axios.post(`${userServiceUrl}/verify-token`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000
    });

    const { userId, role, isActive } = response.data;
    if (!isActive) {
      return res.status(403).json({ message: 'Tài khoản không hoạt động' });
    }

    req.userId = userId;
    req.userRole = role;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

const instructorMiddleware = (req, res, next) => {
  if (req.userRole !== 'instructor' && req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Chỉ giảng viên và admin mới có quyền truy cập' });
  }
  next();
};

const adminMiddleware = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập' });
  }
  next();
};

const studentMiddleware = (req, res, next) => {
  if (req.userRole !== 'student' && req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Chỉ học viên và admin mới có quyền truy cập' });
  }
  next();
};

module.exports = { authMiddleware, instructorMiddleware, adminMiddleware, studentMiddleware };