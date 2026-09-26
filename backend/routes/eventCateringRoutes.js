const express = require('express');
const router = express.Router();
const eventCateringController = require('../controllers/eventCateringController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, authorize('Admin', 'Branch Manager', 'Kitchen Staff'), eventCateringController.getCateringRequests);
router.post('/', protect, eventCateringController.createCateringRequest);
router.patch('/:id/status', protect, authorize('Admin', 'Branch Manager'), eventCateringController.updateCateringStatus);

module.exports = router;
