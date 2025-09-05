// middleware/auth.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Không có token, truy cập bị từ chối' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

// Middleware kiểm tra quyền instructor hoặc admin
const instructorMiddleware = (req, res, next) => {
  if (req.userRole !== 'instructor' && req.userRole !== 'admin') {
    return res.status(403).json({ 
      message: 'Chỉ giảng viên và admin mới có quyền truy cập' 
    });
  }
  next();
};

// Middleware kiểm tra quyền admin
const adminMiddleware = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập' });
  }
  next();
};

// Make sure to export correctly
module.exports = {
  authMiddleware,
  instructorMiddleware, 
  adminMiddleware
};