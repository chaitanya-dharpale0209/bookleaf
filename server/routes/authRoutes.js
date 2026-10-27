const express = require('express');
const router = express.Router();
const { login, quickSwitch, getCurrentUser, getDemoAccounts } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Public auth endpoints
router.post('/login', login);
router.post('/quick-switch', quickSwitch);
router.get('/demo-accounts', getDemoAccounts);

// Protected auth endpoints
router.get('/me', verifyToken, getCurrentUser);

module.exports = router;
