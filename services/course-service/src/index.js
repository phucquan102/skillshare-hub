const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/coursedb';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected for Course Service');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Course Service Running', timestamp: new Date() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'course-service' });
});

// Course routes (mở rộng sau)
app.get('/api/courses', (req, res) => {
  res.json({ 
    courses: [
      { id: 1, title: 'JavaScript Fundamentals', instructor: 'John Doe' },
      { id: 2, title: 'React Advanced', instructor: 'Jane Smith' }
    ], 
    message: 'Courses endpoint working' 
  });
});

// Connect to DB and start server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Course Service running on port ${port}`);
  });
});