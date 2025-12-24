const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const userController = require('../controllers/userController');
const orderController = require('../controllers/orderController');
const { auth, adminAuth } = require('../middlewares/authMiddleware');
const authController = require('../controllers/authController');

// Authentication
router.post('/login', authController.login);

// Product Management
router.route('/products')
  .get(auth, adminAuth, productController.getAllAdminProducts)
  .post(auth, adminAuth, productController.createProduct);

router.route('/products/:id')
  .get(auth, adminAuth, productController.getProductById)
  .put(auth, adminAuth, productController.updateProduct)
  .delete(auth, adminAuth, productController.deleteProduct);

// Order Management
router.route('/orders')
  .get(auth, adminAuth, orderController.getAllOrders);

router.route('/orders/:id')
  .get(auth, adminAuth, orderController.getOrderById)
  .put(auth, adminAuth, orderController.updateOrderStatus);

// User Management
router.route('/users')
  .get(auth, adminAuth, userController.getAllUsers);

router.route('/users/:id')
  .get(auth, adminAuth, userController.getUserById)
  .put(auth, adminAuth, userController.updateUser)
  .delete(auth, adminAuth, userController.deleteUser);

// Dashboard Statistics
router.get('/statistics', auth, adminAuth, (req, res) => {
  // TODO: Implement dashboard statistics
  res.json({ 
    success: true,
    todaySales: 0,
    newOrders: 0,
    newContacts: 0,
    totalUsers: 0
  });
});

module.exports = router; 