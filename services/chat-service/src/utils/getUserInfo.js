const axios = require('axios');
const redis = require('redis');

const client = redis.createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });
client.connect();

/**
 * Lấy thông tin user từ user-service và cache vào Redis
 */
const getUserInfo = async (userId) => {
  try {
    if (!userId) {
      console.warn('⚠️ getUserInfo: userId is required');
      return null;
    }

    console.log(`👤 [getUserInfo] Fetching user info for: ${userId}`);
    
    // ✅ SỬA URL - DÙNG ĐÚNG ROUTE CỦA USER SERVICE
    const response = await axios({
      method: 'get',
      url: `http://user-service:3001/internal/${userId}`,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    console.log(`✅ [getUserInfo] Successfully fetched user: ${userId}`);
    return response.data;

  } catch (error) {
    console.error(`❌ [getUserInfo] Error fetching user ${userId}:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    
    // Fallback user info
    return {
      _id: userId,
      fullName: 'Unknown User',
      email: 'unknown@example.com',
      role: 'user',
      profile: {
        avatar: null,
        bio: null
      }
    };
  }
};

module.exports = { getUserInfo };
