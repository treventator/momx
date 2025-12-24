const express = require('express');
const router = express.Router();
const lineAuthController = require('../controllers/lineAuthController');
const { auth } = require('../middlewares/authMiddleware');

/**
 * LINE Authentication Routes
 * Base path: /api/line
 */

// Public routes - ไม่ต้อง login
router.post('/auth', lineAuthController.lineAuth);           // Login/Register ผ่าน LINE LIFF
router.post('/verify', lineAuthController.verifyIdToken);    // Verify ID Token

// Protected routes - ต้อง login แล้ว
router.get('/me', auth, lineAuthController.getLineProfile);           // ดึงข้อมูลโปรไฟล์
router.put('/profile', auth, lineAuthController.updateLineProfile);   // อัพเดทโปรไฟล์

module.exports = router;

