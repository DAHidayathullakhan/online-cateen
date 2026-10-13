const CashRegister = require('../models/CashRegister');
const Order = require('../models/Order');
const { isSupabaseConfigured, cashRegisterService } = require('../services/supabaseService');

exports.getCurrentRegister = async (req, res, next) => {
  try {
    const branch = req.query.branch || 'Main Canteen';

    if (isSupabaseConfigured()) {
      const register = await cashRegisterService.getCurrentRegister(branch, req.user);
      return res.json({
        success: true,
        data: register
      });
    }

    let register = await CashRegister.findOne({ status: 'OPEN', branch }).sort({ createdAt: -1 });

    if (!register) {
      // Auto-open an active register session if none open
      register = await CashRegister.create({
        branch,
        openedBy: req.user._id,
        openedByName: req.user.name,
        openingBalance: 5000,
        expectedClosingCash: 5000,
        status: 'OPEN'
      });
    }

    // Synchronize real-time cash sales from Orders collection since register opened
    const paidCashOrders = await Order.find({
      branch,
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      paidAt: { $gte: register.openedAt }
    });

    const totalOrderCash = paidCashOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    register.cashSales = totalOrderCash;
    register.expectedClosingCash = register.openingBalance + register.cashSales - register.cashRefunds - register.cashExpenses;
    await register.save();

    res.json({
      success: true,
      data: register
    });
  } catch (err) {
    next(err);
  }
};

exports.openRegister = async (req, res, next) => {
  try {
    const { branch, openingBalance, notes } = req.body;
    const branchName = branch || 'Main Canteen';

    if (isSupabaseConfigured()) {
      const reg = await cashRegisterService.openRegister({ branch, openingBalance, notes }, req.user);
      return res.status(200).json({
        success: true,
        message: `Cash register opened for ${branchName} with opening balance ₹${openingBalance || 0}`,
        data: reg
      });
    }

    // Auto-archive any previous open register for this branch
    await CashRegister.updateMany(
      { status: 'OPEN', branch: branchName },
      { $set: { status: 'CLOSED', closedAt: new Date() } }
    );

    const opening = parseFloat(openingBalance);
    const validOpening = isNaN(opening) || opening < 0 ? 0 : opening;

    const register = await CashRegister.create({
      branch: branchName,
      openedBy: req.user._id,
      openedByName: req.user.name,
      openingBalance: validOpening,
      currentCashBalance: validOpening,
      expectedClosingCash: validOpening,
      cashSales: 0,
      cashExpenses: 0,
      cashRefunds: 0,
      totalExpenses: 0,
      totalRefunds: 0,
      notes: notes || '',
      status: 'OPEN'
    });

    res.status(200).json({
      success: true,
      message: `Cash register opened for ${branchName} with opening balance ₹${validOpening}`,
      data: register
    });
  } catch (err) {
    next(err);
  }
};

exports.addTransaction = async (req, res, next) => {
  try {
    const { type, amount, reason, branch } = req.body;
    const branchName = branch || 'Main Canteen';

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Transaction amount must be greater than 0.' });
    }

    if (!['EXPENSE', 'REFUND', 'FLOAT'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Transaction type must be EXPENSE, REFUND, or FLOAT.' });
    }

    if (isSupabaseConfigured()) {
      const reg = await cashRegisterService.addTransaction({ type, amount, reason, branch }, req.user);
      return res.json({
        success: true,
        message: `Cash ${type.toLowerCase()} of ₹${numAmount} recorded successfully.`,
        data: reg
      });
    }

    const register = await CashRegister.findOne({ status: 'OPEN', branch: branchName });
    if (!register) {
      return res.status(404).json({ success: false, message: 'No active cash register found to record transaction.' });
    }

    if (type === 'EXPENSE') {
      register.cashExpenses += numAmount;
      register.totalExpenses = (register.totalExpenses || 0) + numAmount;
    } else if (type === 'REFUND') {
      register.cashRefunds += numAmount;
      register.totalRefunds = (register.totalRefunds || 0) + numAmount;
    }

    register.transactions.push({
      type,
      amount: numAmount,
      reason: reason || '',
      performedBy: req.user._id,
      performedByName: req.user.name
    });

    register.expectedClosingCash = register.openingBalance + register.cashSales - register.cashRefunds - register.cashExpenses;
    register.currentCashBalance = register.expectedClosingCash;
    await register.save();

    res.json({
      success: true,
      message: `Cash ${type.toLowerCase()} of ₹${numAmount} recorded successfully.`,
      data: register
    });
  } catch (err) {
    next(err);
  }
};

exports.closeRegister = async (req, res, next) => {
  try {
    const { actualClosingCash, closingBalance, notes, branch } = req.body;
    const branchName = branch || 'Main Canteen';

    const cashValue = actualClosingCash !== undefined ? actualClosingCash : closingBalance;
    const actual = parseFloat(cashValue);
    if (isNaN(actual) || actual < 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid actual closing cash count.' });
    }

    if (isSupabaseConfigured()) {
      const reg = await cashRegisterService.closeRegister({ actualClosingCash, closingBalance, notes, branch }, req.user);
      return res.json({
        success: true,
        message: `Cash register closed. Expected: ₹${reg.expectedClosingCash}, Actual: ₹${actual}, Variance: ${reg.variance >= 0 ? '+' : ''}₹${reg.variance}`,
        data: reg
      });
    }

    const register = await CashRegister.findOne({ status: 'OPEN', branch: branchName });
    if (!register) {
      return res.status(404).json({ success: false, message: 'No active cash register session is currently open.' });
    }

    // Refresh real-time order cash sales
    const paidCashOrders = await Order.find({
      branch: branchName,
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      paidAt: { $gte: register.openedAt }
    });
    register.cashSales = paidCashOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    register.expectedClosingCash = register.openingBalance + register.cashSales - register.cashRefunds - register.cashExpenses;
    register.actualClosingCash = actual;
    register.difference = actual - register.expectedClosingCash;
    register.variance = register.difference;
    register.currentCashBalance = actual;
    register.status = 'CLOSED';
    register.closedAt = new Date();
    register.closedBy = req.user._id;
    register.closedByName = req.user.name;
    if (notes) register.notes += ` | Closing: ${notes}`;

    await register.save();

    res.json({
      success: true,
      message: `Cash register closed. Expected: ₹${register.expectedClosingCash}, Actual: ₹${actual}, Variance: ${register.variance >= 0 ? '+' : ''}₹${register.variance}`,
      data: register
    });
  } catch (err) {
    next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    if (isSupabaseConfigured()) {
      const history = await cashRegisterService.getHistory();
      return res.json({
        success: true,
        count: history.length,
        data: history
      });
    }

    const history = await CashRegister.find().sort({ createdAt: -1 }).limit(20);
    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (err) {
    next(err);
  }
};
