const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3002;

/**
 * ✅ CSP Header cho phép Jitsi & WebAssembly
 */
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' https://meet.jit.si; frame-src https://meet.jit.si; connect-src *; style-src 'self' 'unsafe-inline'; img-src * data: blob:;"
  );
  next();
});

// Middleware parse JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connect
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/coursedb';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected for Course Service');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Routes
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const jitsiRoutes = require('./routes/jitsiRoutes');
const studentRoutes = require('./routes/studentRoutes');
const datedScheduleRoutes = require('./routes/datedScheduleRoutes');

// ✅ Import cron jobs
const { startCronJobs } = require('./services/cronService');

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'course-service',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
app.use('/enrollments', enrollmentRoutes);
app.use('/admin', adminRoutes);
app.use('/', courseRoutes);
app.use('/upload', uploadRoutes);
app.use('/jitsi', jitsiRoutes);
app.use('/students', studentRoutes);
app.use('/dated-schedules', datedScheduleRoutes);

console.log('✅ Mounted routes:');
console.log('   - /enrollments -> enrollmentRoutes');
console.log('   - /admin -> adminRoutes');
console.log('   - / -> courseRoutes');
console.log('   - /dated-schedules -> datedScheduleRoutes');

// Error handler
app.use((error, req, res, next) => {
  console.error(`❌ Error at ${req.method} ${req.url}:`, error);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

// Start server
connectDB().then(() => {
  // ✅ Khởi động cron jobs sau khi kết nối DB
  startCronJobs();

  app.listen(port, () => {
    console.log(`🚀 Course Service running on port ${port}`);
  });
});

module.exports = app;