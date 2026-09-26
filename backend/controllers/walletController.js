const { Wallet, WalletTransaction } = require('../models/Wallet');
const { logAudit } = require('../utils/auditLogger');

// GET /api/wallet/balance
exports.getWalletBalance = async (req, res, next) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user.id, balance: 500 });
    }

    const transactions = await WalletTransaction.find({ user: req.user.id })
      .populate('referenceOrder', 'orderNumber finalAmount')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      balance: wallet.balance,
      transactions
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/wallet/topup
exports.topupWallet = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const topupAmt = Number(amount);

    if (!topupAmt || topupAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Valid top-up amount is required.' });
    }

    let wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user.id, balance: 0 });
    }

    wallet.balance += topupAmt;
    await wallet.save();

    await WalletTransaction.create({
      wallet: wallet._id,
      user: req.user.id,
      type: 'topup',
      amount: topupAmt,
      description: `Wallet top-up via Campus Pay (Mock Dev Mode)`
    });

    await logAudit({ user: req.user, action: 'TOPUP_WALLET', target: 'Wallet', targetId: wallet._id, details: { amount: topupAmt }, req });

    res.json({
      success: true,
      message: `Successfully topped up ₹${topupAmt}! New Balance: ₹${wallet.balance}`,
      balance: wallet.balance
    });
  } catch (err) {
    next(err);
  }
};
