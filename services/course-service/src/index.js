const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3002;


// Add after the test routes
const courseRoutes = require('./routes/courseRoutes');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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



app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'course-service',
    timestamp: new Date()
  });
});
app.use('/', courseRoutes);


// Connect to DB and start server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Course Service running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

module.exports = app;