const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, orderController.createOrder);
router.get('/', protect, orderController.getOrders);
router.get('/capacity-monitor', orderController.getCapacityStatus);
router.get('/:id', protect, orderController.getOrderById);
router.patch('/:id/status', protect, authorize('Admin', 'Kitchen Staff', 'Canteen Operator', 'Delivery Staff', 'Branch Manager'), orderController.updateOrderStatus);
router.patch('/:id/modify', protect, orderController.modifyOrder);
router.post('/:id/reorder', protect, orderController.reorder);

module.exports = router;
