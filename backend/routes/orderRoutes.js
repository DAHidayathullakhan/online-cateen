const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Student creates order
router.post('/', protect, orderController.createOrder);

// Student gets their own orders
router.get('/my-orders', protect, orderController.getMyOrders);

// Staff and Admin get all orders
router.get(
  '/',
  protect,
  authorize('Admin', 'Kitchen Staff', 'Canteen Operator', 'Delivery Staff', 'Branch Manager'),
  orderController.getAllOrders
);

// Kitchen & Operator update order status
router.patch(
  '/:id/status',
  protect,
  authorize('Admin', 'Kitchen Staff', 'Canteen Operator', 'Delivery Staff'),
  orderController.updateOrderStatus
);

// Operator & Admin mark cash received
router.patch(
  '/:id/pay-cash',
  protect,
  authorize('Admin', 'Canteen Operator'),
  orderController.markCashReceived
);

module.exports = router;
