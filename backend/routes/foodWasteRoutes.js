const express = require('express');
const router = express.Router();
const foodWasteController = require('../controllers/foodWasteController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, authorize('Admin', 'Canteen Operator', 'Branch Manager'), foodWasteController.getFoodWasteRecords);
router.post('/', protect, authorize('Admin', 'Canteen Operator', 'Branch Manager'), foodWasteController.recordFoodWaste);

module.exports = router;
