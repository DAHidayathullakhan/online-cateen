const express = require('express');
const router = express.Router();
const cashRegisterController = require('../controllers/cashRegisterController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Cash Register actions restricted to Operator, Manager, and Admin
router.get(
  '/current',
  protect,
  authorize('Admin', 'Canteen Operator', 'Branch Manager'),
  cashRegisterController.getCurrentRegister
);

router.post(
  '/open',
  protect,
  authorize('Admin', 'Canteen Operator', 'Branch Manager'),
  cashRegisterController.openRegister
);

router.post(
  '/transaction',
  protect,
  authorize('Admin', 'Canteen Operator', 'Branch Manager'),
  cashRegisterController.addTransaction
);

router.post(
  '/close',
  protect,
  authorize('Admin', 'Canteen Operator', 'Branch Manager'),
  cashRegisterController.closeRegister
);

router.get(
  '/history',
  protect,
  authorize('Admin', 'Canteen Operator', 'Branch Manager'),
  cashRegisterController.getHistory
);

module.exports = router;
