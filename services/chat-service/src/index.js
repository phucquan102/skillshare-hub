const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const socketService = require('./services/socketService');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8081'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Public routes - không cần auth
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'chat-service',
    timestamp: new Date().toISOString()
  });
});

// Routes có auth
app.use('/', chatRoutes);


// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Chat service connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Error handling
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3004;

const startServer = async () => {
  await connectDB();

  // 🔥 Chỉ khởi tạo socket sau khi MongoDB đã kết nối thành công
  const io = socketService.initialize(server);
  app.set('io', io);

  server.listen(PORT, () => {
    console.log(`Chat service running on port ${PORT}`);
  });
};

startServer().catch(console.error);


module.exports = app;