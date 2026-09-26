const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', settingController.getSettings);
router.put('/', protect, authorize('Admin'), settingController.updateSetting);

module.exports = router;
