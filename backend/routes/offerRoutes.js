const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', offerController.getOffers);
router.post('/', protect, authorize('Admin'), offerController.createOffer);
router.delete('/:id', protect, authorize('Admin'), offerController.deleteOffer);

module.exports = router;
