const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging middleware chi tiết
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'api-gateway' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'SkillShare Hub API Gateway',
    timestamp: new Date(),
    services: {
      users: '/api/users',
      courses: '/api/courses', 
      payments: '/api/payments'
    }
  });
});

// Service endpoints
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL || 'http://course-service:3002';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003';

// Proxy configuration với logging chi tiết
const createProxy = (target, serviceName, pathRewrite = {}) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    timeout: 5000,
    proxyTimeout: 5000,
    pathRewrite,
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Proxying to ${serviceName}: ${req.method} ${req.originalUrl} -> ${target}${req.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`Response from ${serviceName}: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).json({ error: 'Service unavailable' });
    }
  });
};

// Route proxying với path rewrite
app.use('/api/users', createProxy(
  USER_SERVICE_URL, 
  'user-service',
  { '^/api/users': '/' } // Xóa /api/users khỏi đường dẫn
));

app.use('/api/courses', createProxy(
  COURSE_SERVICE_URL, 
  'course-service',
  { '^/api/courses': '/' } // Xóa /api/courses khỏi đường dẫn
));

app.use('/api/payments', createProxy(
  PAYMENT_SERVICE_URL, 
  'payment-service',
  { '^/api/payments': '/' } // Xóa /api/payments khỏi đường dẫn
));

app.listen(port, '0.0.0.0', () => {
  console.log(`API Gateway running on port ${port}`);
  console.log(`Proxying to:`);
  console.log(`  Users: ${USER_SERVICE_URL}`);
  console.log(`  Courses: ${COURSE_SERVICE_URL}`);
  console.log(`  Payments: ${PAYMENT_SERVICE_URL}`);
});