/**
 * Custom error classes for better error handling
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Invalid request parameters') {
    super(message, 400);
    this.name = 'BadRequestError';
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = {}) {
    super(message, 422);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500);
    this.name = 'InternalServerError';
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable') {
    super(message, 503);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Error handling middleware
 * @param {Error} err - The error object
 * @param {Request} req - Express request object 
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  const logger = require('./logger');
  
  // Log the error
  logger.error(`${err.name || 'Error'}: ${err.message}`, { 
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    user: req.user ? req.user._id : 'anonymous'
  });
  
  // Default values for non-operational errors
  let statusCode = err.statusCode || 500;
  let message = err.isOperational ? err.message : 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง';
  
  // Handle mongoose validation errors
  if (err.name === 'ValidationError' && !err.isOperational) {
    statusCode = 422;
    message = 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูลที่กรอก';
    const errors = {};
    
    // Format mongoose validation errors
    for (const field in err.errors) {
      errors[field] = err.errors[field].message;
    }
    
    return res.status(statusCode).json({
      success: false,
      error: {
        message,
        errors,
        code: 'VALIDATION_ERROR'
      }
    });
  }
  
  // Handle MongoDB unique constraint error
  if (err.name === 'MongoError' && err.code === 11000) {
    statusCode = 409;
    message = 'ข้อมูลซ้ำ กรุณาตรวจสอบข้อมูลที่กรอก';
    
    return res.status(statusCode).json({
      success: false,
      error: {
        message,
        field: Object.keys(err.keyPattern)[0],
        code: 'DUPLICATE_KEY'
      }
    });
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'โทเค็นไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'โทเค็นหมดอายุ กรุณาเข้าสู่ระบบใหม่';
  }
  
  // Handle file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'ไฟล์มีขนาดใหญ่เกินไป';
  }
  
  // Handle case where headers have already been sent
  if (res.headersSent) {
    return next(err);
  }
  
  // Send the error response
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: err.code || err.name || 'SERVER_ERROR'
    }
  });
};

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
  ServiceUnavailableError,
  errorHandler
}; 