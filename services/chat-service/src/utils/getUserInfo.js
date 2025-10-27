const axios = require('axios');
const redis = require('redis');

const client = redis.createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });
client.connect();

/**
 * Lấy thông tin user từ user-service và cache vào Redis
 */
const getUserInfo = async (userId) => {
  const cacheKey = `user:${userId}`;

  try {
    // 1. Kiểm tra cache Redis
    const cached = await client.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // 2. Gọi user-service
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
    const response = await axios.get(`${userServiceUrl}/internal/${userId}`, { timeout: 5000 });
    const userData = response.data;

    const userInfo = {
      _id: userData._id,
      fullName: userData.fullName || 'Unknown Name',
      email: userData.email || 'unknown@example.com',
      profile: userData.profile || { avatar: null, bio: null },
      role: userData.role || 'student'
    };

    // 3. Lưu cache 10 phút
    await client.setEx(cacheKey, 600, JSON.stringify(userInfo));

    return userInfo;
  } catch (error) {
    console.error('❌ Error fetching user info:', error.message);
    return {
      _id: userId,
      fullName: 'Unknown User',
      profile: { avatar: null, bio: null },
      role: 'student'
    };
  }
};

module.exports = { getUserInfo };
