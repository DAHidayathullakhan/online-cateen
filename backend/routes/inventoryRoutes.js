const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, authorize('Admin', 'Canteen Operator', 'Branch Manager', 'Kitchen Staff'), inventoryController.getInventory);
router.get('/low-stock-alerts', protect, authorize('Admin', 'Canteen Operator', 'Branch Manager'), inventoryController.getLowStockAlerts);
router.post('/adjust', protect, authorize('Admin', 'Canteen Operator', 'Branch Manager'), inventoryController.adjustStock);

module.exports = router;
