const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middlewares/authMiddleware');
const orderController = require('../controllers/orderController');

// User order routes
router.post('/', auth, orderController.createOrder);
router.get('/', auth, orderController.getUserOrders);
router.get('/:id', auth, orderController.getOrderById);
router.put('/:id/pay', auth, orderController.updateOrderToPaid);

// Admin order routes
router.get('/admin/all', auth, adminAuth, orderController.getAllOrders);
router.put('/:id/status', auth, adminAuth, orderController.updateOrderStatus);
router.put('/:id/shipping', auth, adminAuth, orderController.updateOrderShipping);

module.exports = router; 