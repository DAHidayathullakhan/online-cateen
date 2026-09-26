const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, authorize('Admin', 'Branch Manager'), vendorController.getVendors);
router.post('/', protect, authorize('Admin'), vendorController.createVendor);
router.get('/purchases', protect, authorize('Admin', 'Branch Manager'), vendorController.getPurchaseOrders);
router.post('/purchases', protect, authorize('Admin', 'Branch Manager'), vendorController.createPurchaseOrder);
router.patch('/purchases/:id/receive', protect, authorize('Admin', 'Branch Manager'), vendorController.receivePurchaseOrder);

module.exports = router;
