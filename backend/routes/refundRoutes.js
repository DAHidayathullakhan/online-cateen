const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refundController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/request', protect, refundController.requestRefund);
router.get('/', protect, refundController.getRefunds);
router.patch('/:id/approve', protect, authorize('Admin', 'Branch Manager'), refundController.approveRefund);

module.exports = router;
