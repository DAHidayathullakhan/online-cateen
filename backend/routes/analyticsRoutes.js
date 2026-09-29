const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get(
  '/summary',
  protect,
  authorize('Admin', 'Canteen Operator', 'Kitchen Staff', 'Branch Manager'),
  analyticsController.getSummary
);

module.exports = router;
