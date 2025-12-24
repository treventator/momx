const express = require('express');
const router = express.Router();

// TODO: Add actual routes and controller requires here

// Placeholder route to prevent errors if file is empty but required
router.get('/placeholder', (req, res) => res.json({ message: 'Category routes placeholder' }));

module.exports = router; 