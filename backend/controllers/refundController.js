const { RefundRequest } = require('../models/SupportModels');
const Order = require('../models/Order');
const { Wallet, WalletTransaction } = require('../models/Wallet');
const { logAudit } = require('../utils/auditLogger');

// POST /api/refunds/request (Student)
exports.requestRefund = async (req, res, next) => {
  try {
    const { orderId, reason } = req.body;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (order.student.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only request refunds for your own orders.' });
    }

    const existing = await RefundRequest.findOne({ order: orderId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A refund request for this order is already pending.' });
    }

    const refund = await RefundRequest.create({
      order: orderId,
      student: req.user.id,
      amount: order.finalAmount,
      reason,
      status: 'Under Review'
    });

    await logAudit({ user: req.user, action: 'REQUEST_REFUND', target: 'RefundRequest', targetId: refund._id, req });

    res.status(201).json({ success: true, message: 'Refund request submitted for review.', data: refund });
  } catch (err) {
    next(err);
  }
};

// GET /api/refunds (Admin / Staff)
exports.getRefunds = async (req, res, next) => {
  try {
    const filter = req.user.role === 'Student' || req.user.role === "Master's Student" ? { student: req.user.id } : {};
    const refunds = await RefundRequest.find(filter)
      .populate('order', 'orderNumber finalAmount status')
      .populate('student', 'name email phone studentId')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: refunds.length, data: refunds });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/refunds/:id/approve (Admin / Manager)
exports.approveRefund = async (req, res, next) => {
  try {
    const { status } = req.body; // Approved or Rejected
    const refund = await RefundRequest.findById(req.params.id);
    if (!refund) return res.status(404).json({ success: false, message: 'Refund request not found.' });

    refund.status = status;
    refund.approvedBy = req.user.id;
    if (status === 'Approved' || status === 'Completed') {
      refund.completionDate = new Date();
      refund.status = 'Completed';

      // Credit wallet
      let wallet = await Wallet.findOne({ user: refund.student });
      if (!wallet) wallet = await Wallet.create({ user: refund.student, balance: 0 });

      wallet.balance += refund.amount;
      await wallet.save();

      await WalletTransaction.create({
        wallet: wallet._id,
        user: refund.student,
        type: 'refund',
        amount: refund.amount,
        referenceOrder: refund.order,
        description: `Refund credited for Order #${refund.order}`
      });

      // Update Order Payment Status
      await Order.findByIdAndUpdate(refund.order, { paymentStatus: 'REFUNDED', status: 'CANCELLED' });
    }
    await refund.save();

    await logAudit({ user: req.user, action: `REFUND_${status.toUpperCase()}`, target: 'RefundRequest', targetId: refund._id, req });

    res.json({ success: true, message: `Refund request updated to ${status}.`, data: refund });
  } catch (err) {
    next(err);
  }
};
