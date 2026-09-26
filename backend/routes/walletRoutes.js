const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

router.get('/balance', protect, walletController.getWalletBalance);
router.post('/topup', protect, walletController.topupWallet);

module.exports = router;
