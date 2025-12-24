const express = require('express');
const guestOrderController = require('../controllers/guestOrderController');

const router = express.Router();

// สร้างคำสั่งซื้อใหม่
router.post('/', guestOrderController.createGuestOrder);

// ดึงข้อมูลคำสั่งซื้อจาก ID
router.get('/:orderId', guestOrderController.getGuestOrderById);

// ดึงข้อมูลคำสั่งซื้อทั้งหมดจากอีเมลและเบอร์โทรศัพท์
router.get('/', guestOrderController.getGuestOrdersByContact);

// ยกเลิกคำสั่งซื้อ
router.patch('/:orderId/cancel', guestOrderController.cancelGuestOrder);

module.exports = router; 