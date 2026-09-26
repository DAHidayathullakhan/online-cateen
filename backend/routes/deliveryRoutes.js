const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, authorize('Admin', 'Delivery Staff', 'Canteen Operator', 'Branch Manager'), deliveryController.getDeliveries);
router.get('/locations', deliveryController.getDeliveryLocations);
router.post('/locations', protect, authorize('Admin'), deliveryController.createDeliveryLocation);
router.patch('/:id/status', protect, authorize('Admin', 'Delivery Staff', 'Canteen Operator', 'Branch Manager'), deliveryController.updateDeliveryStatus);

module.exports = router;
