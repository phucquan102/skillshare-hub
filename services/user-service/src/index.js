const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Thêm bcrypt
require('dotenv').config();
const userRoutes = require('./routes/userRoutes');
const User = require('./models/User'); // Đảm bảo đường dẫn đúng tới model User


const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/userdb';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected for User Service');
    await initAdmin(); // Gọi hàm khởi tạo admin
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Hàm khởi tạo admin
const initAdmin = async () => {
  try {
    // Kiểm tra xem user admin đã tồn tại chưa
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      // Cập nhật role thành admin nếu cần
      if (existingAdmin.role !== 'admin') {
        const result = await User.updateOne(
          { email: 'admin@example.com' },
          { 
            $set: { 
              role: 'admin', 
              isVerified: true,
              isActive: true,
              emailVerified: true
            } 
          }
        );
        if (result.modifiedCount > 0) {
          console.log('✅ Admin role updated for admin@example.com');
        } else {
          console.log('✅ Admin role already set for admin@example.com');
        }
      } else {
        console.log('✅ Admin user already exists');
      }
    } else {
      // Tạo user admin mới
      const hashedPassword = await bcrypt.hash('admin123', 12);
      const newAdmin = new User({
        email: 'admin@example.com',
        password: hashedPassword,
        fullName: 'Admin User',
        role: 'admin',
        isActive: true,
        isVerified: true,
        emailVerified: true,
        phoneVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: {},
        preferences: {},
        stats: {}
      });
      await newAdmin.save();
      console.log('✅ Admin user created successfully');
    }
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
};

// Basic routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'user-service' });
});

// Routes
app.use('/', userRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Connect to DB and start server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`User Service running on port ${port}`);
  });
});