const axios = require('axios');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token, authorization denied' });

    // ✅ Verify token qua user-service
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
    const response = await axios.post(
      `${userServiceUrl}/verify-token`,
      {},
      { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
    );

    req.user = response.data;
    next();
  } catch (error) {
    console.error('Auth verify failed:', error.message);
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
