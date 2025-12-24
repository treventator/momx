const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth, adminAuth } = require('../middlewares/authMiddleware');

// Get payment settings (admin only)
router.get('/settings', auth, adminAuth, paymentController.getPaymentSettings);

// Update payment settings (admin only)
router.put('/settings', auth, adminAuth, paymentController.updatePaymentSettings);

// Generate PromptPay QR code
router.get('/promptpay/qr', paymentController.generatePromptPayQR);

// Payment verification webhook
router.post('/verify', paymentController.verifyPayment);

// Placeholder route to prevent errors if file is empty but required
router.get('/placeholder', (req, res) => res.json({ message: 'Payment routes placeholder' }));

module.exports = router; 