const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

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
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'User Service Running', timestamp: new Date() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'user-service' });
});

// User routes (mở rộng sau)
app.get('/api/users', (req, res) => {
  res.json({ users: [], message: 'Users endpoint working' });
});

// Connect to DB and start server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`User Service running on port ${port}`);
  });
});