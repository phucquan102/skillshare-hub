const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging middleware
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
      admin: '/api/admin',
      payments: '/api/payments'
    }
  });
});

// Service endpoints
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL || 'http://course-service:3002';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003';

// Proxy config
const createProxy = (target, serviceName, pathRewrite = {}) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    timeout: 15000,
    proxyTimeout: 15000,
    pathRewrite,
    onProxyReq: (proxyReq, req) => {
      console.log(`Proxying to ${serviceName}: ${req.method} ${req.originalUrl} -> ${target}${req.path}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`Response from ${serviceName}: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      console.error(`Proxy error [${serviceName}]:`, err.message);
      res.status(500).json({ error: 'Service unavailable' });
    }
  });
};

// Routes
app.use('/api/users', createProxy(USER_SERVICE_URL, 'user-service', { '^/api/users': '/' }));
app.use('/api/admin', createProxy(COURSE_SERVICE_URL, 'course-service', (path, req) => {
  console.log('Original path:', path);
  const newPath = `/admin${path.replace(/^\/api\/admin/, '')}`;
  console.log('Rewritten path:', newPath);
  return newPath;
}));
app.use('/api/courses', createProxy(COURSE_SERVICE_URL, 'course-service', { '^/api/courses': '/' }));
app.use('/api/payments', createProxy(PAYMENT_SERVICE_URL, 'payment-service', { '^/api/payments': '/' }));

// Start
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 API Gateway running on port ${port}`);
  console.log(`Proxying to:`);
  console.log(`  Users: ${USER_SERVICE_URL}`);
  console.log(`  Courses: ${COURSE_SERVICE_URL}`);
  console.log(`  Payments: ${PAYMENT_SERVICE_URL}`);
});
