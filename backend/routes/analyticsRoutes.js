const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, authorize('Admin', 'Branch Manager', 'Canteen Operator'), analyticsController.getAnalytics);

module.exports = router;
