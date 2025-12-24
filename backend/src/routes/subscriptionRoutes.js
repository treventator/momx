const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const { auth } = require('../middlewares/authMiddleware');

const router = express.Router();

// ดึงข้อมูลสินค้าที่สามารถสมัคร subscription ได้ (ไม่ต้องล็อกอิน)
router.get('/products', subscriptionController.getSubscribableProducts);

// route ต่อไปนี้ต้องล็อกอิน
router.use(auth);

// สร้าง subscription ใหม่
router.post('/', subscriptionController.createSubscription);

// ดึงข้อมูล subscription ของผู้ใช้
router.get('/me', subscriptionController.getMySubscription);

// ยกเลิก subscription
router.patch('/cancel', subscriptionController.cancelSubscription);

// แก้ไข subscription
router.patch('/', subscriptionController.updateSubscription);

module.exports = router; 