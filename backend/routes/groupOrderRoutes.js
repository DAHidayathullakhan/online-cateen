const express = require('express');
const router = express.Router();
const groupOrderController = require('../controllers/groupOrderController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, groupOrderController.createGroupOrder);
router.post('/join', protect, groupOrderController.joinGroupOrder);
router.get('/:id', protect, groupOrderController.getGroupOrderById);
router.post('/:id/items', protect, groupOrderController.addMemberItems);
router.post('/:id/pay-split', protect, groupOrderController.paySplitAmount);

module.exports = router;
