const express = require('express');
const router = express.Router();
const stockTransferController = require('../controllers/stockTransferController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, authorize('Admin', 'Branch Manager', 'Canteen Operator'), stockTransferController.getTransfers);
router.post('/', protect, authorize('Admin', 'Branch Manager', 'Canteen Operator'), stockTransferController.requestTransfer);
router.patch('/:id/approve', protect, authorize('Admin', 'Branch Manager'), stockTransferController.approveTransfer);
router.patch('/:id/receive', protect, authorize('Admin', 'Branch Manager', 'Canteen Operator'), stockTransferController.receiveTransfer);

module.exports = router;
