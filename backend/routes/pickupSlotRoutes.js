const express = require('express');
const router = express.Router();
const pickupSlotController = require('../controllers/pickupSlotController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', pickupSlotController.getPickupSlots);
router.post('/', protect, authorize('Admin', 'Canteen Operator', 'Branch Manager'), pickupSlotController.createPickupSlot);
router.put('/:id', protect, authorize('Admin', 'Canteen Operator', 'Branch Manager'), pickupSlotController.updatePickupSlot);
router.delete('/:id', protect, authorize('Admin', 'Canteen Operator', 'Branch Manager'), pickupSlotController.deletePickupSlot);

module.exports = router;
