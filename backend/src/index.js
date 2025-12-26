const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { info, error, withSpan, tracer } = require('./utils/logger');
const setupMongooseTracing = require('./utils/dbTracingMiddleware');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./utils/errors');

// Load environment variables
// Load environment variables (support both local and Docker environments)
dotenv.config();

// Create Express application
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/*
// Add request tracing middleware
app.use((req, res, next) => {
  const requestSpan = tracer.startSpan(`HTTP ${req.method} ${req.path}`);
  
  // Set span attributes
  requestSpan.setAttribute('http.method', req.method);
  requestSpan.setAttribute('http.url', req.originalUrl);
  requestSpan.setAttribute('http.user_agent', req.get('User-Agent') || 'unknown');
  
  // Generate trace ID and span ID for this request
  const { traceId, spanId } = requestSpan.spanContext();
  
  // Add trace info to response headers for debugging
  res.setHeader('X-Trace-ID', traceId);
  res.setHeader('X-Span-ID', spanId);
  
  // Log request
  info(`Received ${req.method} request to ${req.originalUrl}`, {
    traceId,
    spanId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip
  });
  
  // Capture response data
  const originalSend = res.send;
  res.send = function(body) {
    // Log response
    info(`Sending response for ${req.method} ${req.originalUrl}`, {
      traceId,
      spanId,
      statusCode: res.statusCode,
      responseTime: Date.now() - req._startTime
    });
    
    // Set span status based on response status code
    if (res.statusCode >= 400) {
      requestSpan.setStatus({ code: 2 }); // Error
    } else {
      requestSpan.setStatus({ code: 1 }); // OK
    }
    
    // End the span
    requestSpan.end();
    
    return originalSend.call(this, body);
  };
  
  // Store request start time
  req._startTime = Date.now();
  
  next();
});
*/

// Database connection
const connectDB = async () => {
  try {
    // Set up mongoose tracing before connecting
    setupMongooseTracing(mongoose);

    await withSpan('database.connect', async () => {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/momx_shop');
      info('MongoDB connected successfully');
    }, { 'db.system': 'mongodb', 'db.name': 'tanyarat_shop' });
  } catch (err) {
    error('MongoDB connection error', { error: err.message, stack: err.stack });
    process.exit(1);
  }
};
connectDB();

// API Routes
const apiPrefix = '/api';

// Auth routes
app.use(`${apiPrefix}/auth`, require('./routes/authRoutes'));

// LINE Auth routes - ระบบสมาชิกผ่าน LINE LIFF
app.use(`${apiPrefix}/line`, require('./routes/lineRoutes'));

// User routes
app.use(`${apiPrefix}/users`, require('./routes/userRoutes'));

// Shop routes
app.use(`${apiPrefix}/shop/products`, require('./routes/productRoutes'));
app.use(`${apiPrefix}/shop/cart`, require('./routes/cartRoutes'));
app.use(`${apiPrefix}/shop/orders`, require('./routes/orderRoutes'));
app.use(`${apiPrefix}/shop/categories`, require('./routes/categoryRoutes'));

// Guest orders routes - ระบบสั่งซื้อสำหรับลูกค้าที่ไม่ได้ล็อกอิน
app.use(`${apiPrefix}/guest-orders`, require('./routes/guestOrderRoutes'));

// Subscription routes - ระบบ subscription
app.use(`${apiPrefix}/subscriptions`, require('./routes/subscriptionRoutes'));

// Payment and shipping routes
app.use(`${apiPrefix}/payments`, require('./routes/paymentRoutes'));
app.use(`${apiPrefix}/shipping`, require('./routes/shippingRoutes'));

// Contact routes
app.use(`${apiPrefix}/contact`, require('./routes/contactRoutes'));

// Admin routes
app.use(`${apiPrefix}/admin`, require('./routes/adminRoutes'));

// Webhook routes
app.use(`${apiPrefix}/webhooks`, require('./routes/webhookRoutes'));

// Health check endpoints
// Root level health check for Docker
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// API level health check
app.get(`${apiPrefix}/health`, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// 404 handler - must be before error handler
app.use((req, res, next) => {
  info(`Resource not found: ${req.originalUrl}`, {
    method: req.method,
    path: req.originalUrl
  });

  res.status(404).json({
    success: false,
    error: {
      message: 'ไม่พบ API ที่ต้องการเรียกใช้งาน',
      code: 'NOT_FOUND'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 4455;
app.listen(PORT, () => {
  info(`Server running on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });

  info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  info(`API Documentation: http://localhost:${PORT}/api/docs`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  error('Unhandled Promise Rejection', {
    error: err.message,
    stack: err.stack
  });
  // Close server & exit process
  // server.close(() => process.exit(1));
});

module.exports = app; // For testing purposes 