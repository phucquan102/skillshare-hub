// services/review-service/src/middleware/auth.js
const axios = require('axios');
const { StatusCodes } = require('http-status-codes');

/**
 * =====================
 *  AUTH MIDDLEWARE
 * =====================
 */
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'Access denied. No token provided.'
      });
    }

    // Verify token với user-service
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
    const response = await axios.post(
      `${userServiceUrl}/verify-token`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 5000
      }
    );

    if (response.data) {
      req.userId = response.data.userId;
      req.userRole = response.data.role;
      req.user = response.data;
      next();
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(StatusCodes.UNAUTHORIZED).json({
      error: 'Invalid token'
    });
  }
};

/**
 * =====================
 *  ROLE MIDDLEWARES
 * =====================
 */
const instructorAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.userRole === 'instructor' || req.userRole === 'admin') {
        next();
      } else {
        return res.status(StatusCodes.FORBIDDEN).json({
          error: 'Access denied. Instructor role required.'
        });
      }
    });
  } catch (error) {
    console.error('Instructor auth error:', error.message);
    return res.status(StatusCodes.FORBIDDEN).json({
      error: 'Access denied.'
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.userRole === 'admin') {
        next();
      } else {
        return res.status(StatusCodes.FORBIDDEN).json({
          error: 'Access denied. Admin role required.'
        });
      }
    });
  } catch (error) {
    console.error('Admin auth error:', error.message);
    return res.status(StatusCodes.FORBIDDEN).json({
      error: 'Access denied.'
    });
  }
};

const studentAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.userRole === 'student' || req.userRole === 'admin') {
        next();
      } else {
        return res.status(StatusCodes.FORBIDDEN).json({
          error: 'Access denied. Student role required.'
        });
      }
    });
  } catch (error) {
    console.error('Student auth error:', error.message);
    return res.status(StatusCodes.FORBIDDEN).json({
      error: 'Access denied.'
    });
  }
};

module.exports = {
  auth,
  instructorAuth,
  adminAuth,
  studentAuth
};