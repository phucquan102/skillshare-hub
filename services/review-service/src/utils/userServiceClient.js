const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';

// Tạo một instance axios cho user service
const userServiceClient = axios.create({
  baseURL: USER_SERVICE_URL,
  timeout: 5000,
});

// Hàm lấy thông tin một user bằng userId
const getUserById = async (userId) => {
  try {
    const response = await userServiceClient.get(`/internal/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user from user service:', error.message);
    // Trả về một object mặc định nếu không tìm thấy
    return {
      _id: userId,
      fullName: 'Unknown User',
      avatar: '',
      email: 'unknown@example.com',
      profile: {}
    };
  }
};

// Hàm lấy thông tin nhiều user bằng danh sách userIds
const getUsersBatch = async (userIds) => {
  try {
    const response = await userServiceClient.post('/internal/batch', { userIds });
    // Giả sử response trả về là một object có thuộc tính users là mảng các user
    const users = response.data.users || [];
    
    // Chuyển mảng thành object với key là userId
    const userMap = {};
    users.forEach(user => {
      userMap[user._id] = user;
    });
    
    // Đảm bảo mọi userId trong danh sách đều có trong map, nếu không có thì dùng giá trị mặc định
    userIds.forEach(userId => {
      if (!userMap[userId]) {
        userMap[userId] = {
          _id: userId,
          fullName: 'Unknown User',
          avatar: '',
          email: 'unknown@example.com',
          profile: {}
        };
      }
    });
    
    return userMap;
  } catch (error) {
    console.error('Error fetching batch users from user service:', error.message);
    // Trả về một object với các user mặc định
    const userMap = {};
    userIds.forEach(userId => {
      userMap[userId] = {
        _id: userId,
        fullName: 'Unknown User',
        avatar: '',
        email: 'unknown@example.com',
        profile: {}
      };
    });
    return userMap;
  }
};

module.exports = {
  getUserById,
  getUsersBatch,
  userServiceClient
};