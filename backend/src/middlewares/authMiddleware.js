const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { error, withSpan } = require('../utils/logger');

/**
 * ตรวจสอบว่าผู้ใช้ login แล้วหรือไม่
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const auth = async (req, res, next) => {
  await withSpan('middleware.auth', async () => {
    try {
      let token;
      
      // ตรวจสอบว่ามี token ใน header หรือไม่
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      } else if (req.cookies && req.cookies.token) {
        // ตรวจสอบจาก cookies
        token = req.cookies.token;
      }
      
      if (!token) {
        return res.status(401).json({
          status: 'error',
          message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน'
        });
      }
      
      // ตรวจสอบความถูกต้องของ token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // ตรวจสอบผู้ใช้จาก ID ใน token
      const user = await User.findById(decoded.id);
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'ไม่พบข้อมูลผู้ใช้หรือบัญชีถูกระงับ'
        });
      }
      
      // เก็บข้อมูลผู้ใช้ใน request
      req.user = user;
      next();
    } catch (err) {
      error('Authentication error', { error: err.message });
      return res.status(401).json({
        status: 'error',
        message: 'การยืนยันตัวตนล้มเหลว กรุณาเข้าสู่ระบบใหม่อีกครั้ง',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

/**
 * ตรวจสอบว่าผู้ใช้เป็น admin หรือไม่
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const adminAuth = async (req, res, next) => {
  await withSpan('middleware.adminAuth', async () => {
    try {
      // ตรวจสอบว่ามีข้อมูลผู้ใช้หรือไม่
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน'
        });
      }

      // ตรวจสอบว่าเป็น admin หรือไม่
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'คุณไม่มีสิทธิ์ในการเข้าถึงส่วนนี้'
        });
      }

      next();
    } catch (err) {
      error('Admin authentication error', { error: err.message });
      return res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

/**
 * Middleware for moderator routes - checks if user has admin or moderator role
 */
const moderator = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'moderator')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'ไม่มีสิทธิ์ในการใช้งานส่วนนี้'
    });
  }
};

// Middleware ตรวจสอบการล็อกอินแบบไม่บังคับ
const optionalAuth = async (req, res, next) => {
  await withSpan('middleware.optionalAuth', async () => {
    try {
      let token;

      // ตรวจสอบว่ามี token ใน header หรือไม่
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      } else if (req.cookies && req.cookies.token) {
        // ตรวจสอบจาก cookies
        token = req.cookies.token;
      }

      if (!token) {
        // ไม่มี token ให้ไปทำงานต่อ โดยไม่มีข้อมูลผู้ใช้
        return next();
      }

      // ตรวจสอบความถูกต้องของ token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ตรวจสอบผู้ใช้จาก ID ใน token
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        // ไม่พบผู้ใช้หรือบัญชีถูกระงับ ให้ไปทำงานต่อ โดยไม่มีข้อมูลผู้ใช้
        return next();
      }

      // เก็บข้อมูลผู้ใช้ใน request
      req.user = user;
      next();
    } catch (err) {
      // หากมีข้อผิดพลาดในการตรวจสอบ token ให้ไปทำงานต่อ โดยไม่มีข้อมูลผู้ใช้
      error('Optional authentication error', { error: err.message });
      next();
    }
  });
};

module.exports = {
  auth,
  optionalAuth,
  adminAuth,
  moderator
}; 