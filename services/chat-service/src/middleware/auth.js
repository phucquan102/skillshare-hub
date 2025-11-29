// const axios = require('axios');

// const authMiddleware = async (req, res, next) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '');
//     if (!token) return res.status(401).json({ error: 'No token, authorization denied' });

//     // ✅ Verify token qua user-service
//     const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
//     const response = await axios.post(
//       `${userServiceUrl}/verify-token`,
//       {},
//       { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
//     );

//     req.user = response.data;
//     next();
//   } catch (error) {
//     console.error('Auth verify failed:', error.message);
//     res.status(401).json({ error: 'Token is not valid' });
//   }
// };

// module.exports = authMiddleware;
const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    // Lấy token
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.header('x-auth-token');
    
    if (!token) {
      console.log('❌ [Auth Middleware] No token provided');
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    console.log('🔐 [Auth Middleware] Token received, length:', token.length);

    // Verify JWT trực tiếp
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('✅ [Auth Middleware] Token verified successfully');
    
    // ✅ GÁN req.user (QUAN TRỌNG!)
    req.user = {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role,
      isActive: decoded.isActive !== false
    };

    console.log('✅ [Auth Middleware] User authenticated:', req.user.userId);
    
    next();

  } catch (error) {
    console.error('❌ [Auth Middleware] Verification failed:', error.message);
    return res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = authMiddleware;