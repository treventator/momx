const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth, adminAuth } = require('../middlewares/authMiddleware');

// Get payment settings (admin only)
router.get('/settings', auth, adminAuth, paymentController.getPaymentSettings);

// Update payment settings (admin only)
router.put('/settings', auth, adminAuth, paymentController.updatePaymentSettings);

// Generate PromptPay QR code (Static - legacy)
router.get('/promptpay/qr', paymentController.generatePromptPayQR);

// Payment verification webhook (legacy)
router.post('/verify', paymentController.verifyPayment);

// =============================================
// Omise PromptPay Routes
// =============================================

// Create PromptPay charge (requires auth)
router.post('/omise/promptpay', auth, paymentController.createOmisePromptPay);

// Check charge status (public for polling)
router.get('/omise/status/:chargeId', paymentController.getOmiseChargeStatus);

// Omise webhook (no auth - called by Omise)
router.post('/omise/webhook', express.raw({ type: 'application/json' }), paymentController.handleOmiseWebhook);

module.exports = router; 