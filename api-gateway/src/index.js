// api-gateway/index.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

/**
 * =====================
 *  CORS CONFIG
 * =====================
 */
const allowedOrigins = [
  'http://localhost:5173',   // FE chạy vite
  'http://localhost:8081',   // FE docker/nginx
  'https://app.skillsharehub.com', // Production FE domain
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

/**
 * =====================
 *  LOGGING
 * =====================
 */
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

/**
 * =====================
 *  HEALTH CHECK
 * =====================
 */
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'api-gateway' });
});

/**
 * =====================
 *  ROOT INFO
 * =====================
 */
app.get('/', (req, res) => {
  res.json({
    message: 'SkillShare Hub API Gateway',
    timestamp: new Date(),
    services: {
      users: '/api/users',
      courses: '/api/courses',
      admin: '/api/admin',
      payments: '/api/payments',
      upload: '/api/upload'
    }
  });
});

/**
 * =====================
 *  SERVICES CONFIG
 * =====================
 */
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL || 'http://course-service:3002';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003';

const createProxy = (target, serviceName, pathRewrite = {}) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req) => {
      console.log(`➡️ ${serviceName}: ${req.method} ${req.originalUrl}`);

      // ✅ Giữ lại Authorization header nếu có
      if (req.headers['authorization']) {
        proxyReq.setHeader('authorization', req.headers['authorization']);
      }

      // ✅ Giữ lại cookie (nếu có đăng nhập bằng cookie)
      if (req.headers['cookie']) {
        proxyReq.setHeader('cookie', req.headers['cookie']);
      }
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`⬅️ ${serviceName}: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      console.error(`❌ Proxy error [${serviceName}]:`, err.message);
      res.status(500).json({ error: 'Service unavailable' });
    }
  });
};


/**
 * =====================
 *  ROUTES
 * =====================
 */
 
app.use('/api/upload', (req, res, next) => {
  console.log('🔍 [Upload Debug] Request received:', {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    contentType: req.headers['content-type'],
    body: req.body
  });
  next();
}, createProxy(COURSE_SERVICE_URL, 'upload-service', { 
  '^/api/upload': '/upload' 
}));
app.use('/api/enrollments/check', createProxyMiddleware({
  target: COURSE_SERVICE_URL || 'http://course-service:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/enrollments/check': '/enrollments/public/check' }
}));
app.use('/api/enrollments', createProxyMiddleware({
  target: COURSE_SERVICE_URL || 'http://course-service:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/enrollments': '/enrollments' }
}));

app.use('/api/users', createProxy(USER_SERVICE_URL, 'user-service', { '^/api/users': '/' }));

app.use('/api/admin', createProxy(COURSE_SERVICE_URL, 'course-service', (path, req) => {
  console.log('Original path:', path);
  const newPath = `/admin${path.replace(/^\/api\/admin/, '')}`;
  console.log('Rewritten path:', newPath);
  return newPath;
}));
app.use('/api/courses', createProxy(COURSE_SERVICE_URL, 'course-service', { '^/api/courses': '/' }));

app.use('/api/payments', createProxy(PAYMENT_SERVICE_URL, 'payment-service', { '^/api/payments': '/' }));
app.use('/api/students', createProxyMiddleware({
  target: COURSE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/students': '/students'
  },
  onProxyReq: (proxyReq, req) => {
    console.log(`➡️ Student Service: ${req.method} ${req.originalUrl}`);
  }
}));
/**
 * =====================
 *  START SERVER
 * =====================
 */
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 API Gateway running on port ${port}`);
  console.log(`  Users: ${USER_SERVICE_URL}`);
  console.log(`  Courses: ${COURSE_SERVICE_URL}`);
  console.log(`  Payments: ${PAYMENT_SERVICE_URL}`);
});
