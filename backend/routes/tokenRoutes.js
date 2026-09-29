const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Canteen Operator & Admin verify student token or QR code
router.post(
  '/verify',
  protect,
  authorize('Admin', 'Canteen Operator'),
  tokenController.verifyToken
);

module.exports = router;
