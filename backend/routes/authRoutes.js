const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { registerValidator, loginValidator } = require('../utils/validators');
const { authRateLimiter } = require('../middleware/rateLimiter');

router.post('/register', authRateLimiter, registerValidator, authController.register);
router.post('/login', authRateLimiter, loginValidator, authController.login);
router.get('/me', protect, authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;
