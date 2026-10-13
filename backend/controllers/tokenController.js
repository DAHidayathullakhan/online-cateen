const Order = require('../models/Order');
const { isSupabaseConfigured, orderService, tokenService } = require('../services/supabaseService');

exports.getOrderByOrderId = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    if (isSupabaseConfigured()) {
      const order = await orderService.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      const requesterId = req.user.id || req.user._id;
      const staffRoles = ['Admin', 'Kitchen Staff', 'Canteen Operator', 'Delivery Staff', 'Branch Manager'];
      const isStaff = staffRoles.includes(req.user.role);
      if (!isStaff && String(order.userId || order.user) !== String(requesterId)) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this token.' });
      }

      return res.json({
        success: true,
        data: {
          tokenNumber: order.tokenNumber,
          status: order.tokenStatus === 'USED' ? 'Used' : 'Active',
          branch: { name: order.branch },
          pickupWindow: order.pickupWindow ? { startTime: order.pickupWindow, endTime: '' } : null,
          deliveryLocation: order.deliveryLocation,
          roomNumber: order.roomNumber,
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            finalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            status: order.status,
            items: order.items || []
          }
        }
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const requesterId = req.user._id;
    const staffRoles = ['Admin', 'Kitchen Staff', 'Canteen Operator', 'Delivery Staff', 'Branch Manager'];
    const isStaff = staffRoles.includes(req.user.role);
    if (!isStaff && String(order.user) !== String(requesterId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this token.' });
    }

    res.json({
      success: true,
      data: {
        tokenNumber: order.tokenNumber,
        status: order.tokenStatus === 'USED' ? 'Used' : 'Active',
        branch: { name: order.branch },
        pickupWindow: order.pickupWindow ? { startTime: order.pickupWindow, endTime: '' } : null,
        deliveryLocation: order.deliveryLocation,
        roomNumber: order.roomNumber,
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          finalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          status: order.status,
          items: order.items || []
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyToken = async (req, res, next) => {
  try {
    const rawToken = (req.body.token || req.body.tokenNumber || '').trim();

    if (!rawToken) {
      return res.status(400).json({ success: false, message: 'Please provide a valid token or QR code.' });
    }

    if (isSupabaseConfigured()) {
      try {
        const staffId = req.user ? (req.user.id || req.user._id) : null;
        const result = await tokenService.verifyToken(rawToken, staffId);
        return res.json({
          success: true,
          message: 'Order collected successfully.',
          data: result
        });
      } catch (tokenErr) {
        if (tokenErr.alreadyUsed) {
          return res.status(400).json({
            success: false,
            message: tokenErr.message,
            data: tokenErr.data
          });
        }
        if (tokenErr.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            message: tokenErr.message
          });
        }
        return res.status(400).json({
          success: false,
          message: tokenErr.message
        });
      }
    }

    // Fallback: MongoDB
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
