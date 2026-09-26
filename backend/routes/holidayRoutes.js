const express = require('express');
const router = express.Router();
const holidayController = require('../controllers/holidayController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', holidayController.getHolidays);
router.post('/', protect, authorize('Admin'), holidayController.addHoliday);
router.patch('/exam-mode', protect, authorize('Admin'), holidayController.toggleExamMode);

module.exports = router;
