// middleware/csp.js
const helmet = require('helmet');

const cspConfig = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Cần thiết cho Jitsi
      "'unsafe-eval'",   // Cần thiết cho WebAssembly
      "https://meet.jit.si",
      "https://8x8.vc",
      "https://*.meet.jit.si",
      "https://*.8x8.vc"
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://meet.jit.si",
      "https://8x8.vc"
    ],
    imgSrc: [
      "'self'",
      "data:",
      "https:",
      "http:"
    ],
    connectSrc: [
      "'self'",
      "https://meet.jit.si",
      "https://8x8.vc",
      "wss://*.meet.jit.si",
      "wss://*.8x8.vc",
      "ws://localhost:*", // Development
      "wss://localhost:*" // Development
    ],
    mediaSrc: [
      "'self'",
      "https://meet.jit.si",
      "https://8x8.vc",
      "blob:"
    ],
    frameSrc: [
      "https://meet.jit.si",
      "https://8x8.vc"
    ],
    workerSrc: [
      "'self'",
      "blob:",
      "'unsafe-eval'"
    ],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"]
  }
});

// Apply CSP middleware
app.use(cspConfig);

// Cho development, disable CSP hoặc set loose hơn
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.removeHeader('Content-Security-Policy');
    next();
  });
}