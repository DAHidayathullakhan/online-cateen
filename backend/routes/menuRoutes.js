const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public menu browsing
router.get('/', menuController.getMenuItems);
router.get('/:id', menuController.getMenuItemById);

// Admin & Canteen Operator dish management
router.post(
  '/',
  protect,
  authorize('Admin', 'Canteen Operator'),
  menuController.createMenuItem
);

router.put(
  '/:id',
  protect,
  authorize('Admin', 'Canteen Operator'),
  menuController.updateMenuItem
);

router.patch(
  '/:id/toggle-availability',
  protect,
  authorize('Admin', 'Canteen Operator'),
  menuController.toggleAvailability
);

module.exports = router;
