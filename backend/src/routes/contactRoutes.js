const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { auth, adminAuth } = require('../middlewares/authMiddleware');

// Public route สำหรับลูกค้าส่งข้อความติดต่อ
router.post('/', contactController.createContact);

// Protected admin routes
router.get('/', auth, adminAuth, contactController.getContacts);
router.get('/:id', auth, adminAuth, contactController.getContactById);
router.put('/:id', auth, adminAuth, contactController.updateContact);
router.put('/:id/read', auth, adminAuth, contactController.markAsRead);

module.exports = router; 