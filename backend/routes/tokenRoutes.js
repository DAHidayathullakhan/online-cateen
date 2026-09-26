const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/order/:orderId', protect, tokenController.getTokenByOrderId);
router.post('/verify', protect, authorize('Admin', 'Canteen Operator', 'Kitchen Staff', 'Branch Manager'), tokenController.verifyToken);

module.exports = router;
