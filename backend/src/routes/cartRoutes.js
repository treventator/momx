const express = require('express');
const cartController = require('../controllers/cartController');
const { auth, optionalAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

// ใช้ middleware optionalAuth เพื่อรองรับทั้งผู้ใช้ที่ล็อกอินและไม่ได้ล็อกอิน
router.get('/', optionalAuth, cartController.getCart);
router.post('/', optionalAuth, cartController.addToCart);
router.put('/:itemId', optionalAuth, cartController.updateCartItem);
router.delete('/:itemId', optionalAuth, cartController.removeFromCart);
router.delete('/', optionalAuth, cartController.clearCart);

module.exports = router; 