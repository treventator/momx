const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/seed-admin', authController.seedAdmin); // For development only, can be removed in production

// Protected routes
router.get('/me', auth, authController.getCurrentUser);

module.exports = router;
