// course-service/src/middleware/auth.js
const axios = require('axios');

/**
 * =====================
 *  AUTH MIDDLEWARE
 * =====================
 */
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Không có token, truy cập bị từ chối' });
    }

    // Gọi verify-token ở user-service
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
    const response = await axios.post(
      `${userServiceUrl}/users/verify-token`,
      {},
      { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
    );

    const { userId, role, isActive } = response.data;
    console.log("🔑 Auth verified:", { userId, role, isActive });

    if (!isActive) {
      return res.status(403).json({ message: 'Tài khoản không hoạt động' });
    }

    req.userId = userId;
    req.userRole = role;
    next();
  } catch (error) {
    console.error('❌ Auth error:', error.message);
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

/**
 * =====================
 *  ROLE MIDDLEWARE
 * =====================
 */
const instructorMiddleware = (req, res, next) => {
  console.log("➡️ instructorMiddleware check:", req.userRole);
  if (req.userRole === 'instructor' || req.userRole === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Chỉ giảng viên và admin mới có quyền truy cập' });
};

const adminMiddleware = (req, res, next) => {
  console.log("➡️ adminMiddleware check:", req.userRole);
  if (req.userRole === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập' });
};

const studentMiddleware = (req, res, next) => {
  console.log("🟢 studentMiddleware check:", req.userRole);
  if (req.userRole === 'student' || req.userRole === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Chỉ học viên và admin mới có quyền truy cập' });
};

module.exports = {
  authMiddleware,
  instructorMiddleware,
  adminMiddleware,
  studentMiddleware
};
