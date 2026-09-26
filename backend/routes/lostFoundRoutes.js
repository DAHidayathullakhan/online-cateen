const express = require('express');
const router = express.Router();
const lostFoundController = require('../controllers/lostFoundController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', lostFoundController.getLostFoundItems);
router.post('/', protect, lostFoundController.reportLostFoundItem);

module.exports = router;
