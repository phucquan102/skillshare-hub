const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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
      users: '/users',
      courses: '/courses', 
      payments: '/payments'
    }
  });
});

// Service endpoints
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL || 'http://course-service:3002';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003';

// Proxy configuration
const proxyOptions = {
  changeOrigin: true,
  timeout: 5000,
  proxyTimeout: 5000,
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Service unavailable' });
  }
};

// Route proxying
app.use('/users', createProxyMiddleware({
  target: USER_SERVICE_URL,
  ...proxyOptions
}));

app.use('/courses', createProxyMiddleware({
  target: COURSE_SERVICE_URL,
  ...proxyOptions
}));

app.use('/payments', createProxyMiddleware({
  target: PAYMENT_SERVICE_URL,
  ...proxyOptions
}));

app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
  console.log(`Proxying to:`);
  console.log(`  Users: ${USER_SERVICE_URL}`);
  console.log(`  Courses: ${COURSE_SERVICE_URL}`);
  console.log(`  Payments: ${PAYMENT_SERVICE_URL}`);
});