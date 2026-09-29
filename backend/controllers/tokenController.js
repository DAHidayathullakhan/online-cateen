const Order = require('../models/Order');

exports.verifyToken = async (req, res, next) => {
  try {
    const rawToken = (req.body.token || req.body.tokenNumber || '').trim();

    if (!rawToken) {
      return res.status(400).json({ success: false, message: 'Please provide a valid token or QR code.' });
    }

    // Try finding order by token number or order number (case-insensitive)
    const order = await Order.findOne({
      $or: [
        { tokenNumber: new RegExp(`^${rawToken}$`, 'i') },
        { orderNumber: new RegExp(`^${rawToken}$`, 'i') }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Token "${rawToken}" not found in canteen database.`
      });
    }

    // Check if token was already used
    if (order.tokenStatus === 'USED') {
      const usedTime = order.tokenUsedAt ? new Date(order.tokenUsedAt).toLocaleTimeString() : 'earlier';
      return res.status(400).json({
        success: false,
        message: `Token #${order.tokenNumber} has already been used and collected at ${usedTime}. Double collection prevented.`,
        data: order
      });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: `Order #${order.orderNumber} was cancelled and cannot be collected.`
      });
    }

    // Mark as collected
    order.tokenStatus = 'USED';
    order.tokenUsedAt = new Date();
    order.status = 'Completed';

    await order.save();

    res.json({
      success: true,
      message: 'Order collected successfully.',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        tokenNumber: order.tokenNumber,
        studentName: order.studentName,
        studentId: order.studentId,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        collectedAt: order.tokenUsedAt
      }
    });
  } catch (err) {
    next(err);
  }
};
