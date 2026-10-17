const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Student creates order
router.post('/', protect, orderController.createOrder);

// Student gets their own orders
router.get('/my-orders', protect, orderController.getMyOrders);

// Safe public Supabase config for browser realtime subscriptions
router.get('/config/realtime', orderController.getRealtimeConfig);

// Student or staff live order tracking details
router.get('/:id/track', protect, orderController.getOrderTracking);

// Kitchen & Operator update order status with tracking timestamps, notes, and prep times
router.patch(
  '/:id/tracking-status',
  protect,
  authorize('Admin', 'Kitchen Staff', 'Canteen Operator', 'Delivery Staff', 'Branch Manager', 'College Administrator', 'Platform Super Administrator'),
  orderController.updateTrackingStatus
);

// Student or staff get single order details
router.get('/:id', protect, orderController.getOrderById);

// Staff and Admin get all orders
router.get(
  '/',
  protect,
  authorize('Admin', 'Kitchen Staff', 'Canteen Operator', 'Delivery Staff', 'Branch Manager', 'College Administrator', 'Platform Super Administrator'),
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
