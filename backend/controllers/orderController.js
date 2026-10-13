const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const QRCode = require('qrcode');
const { isSupabaseConfigured, orderService } = require('../services/supabaseService');

exports.getOrderById = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    if (isSupabaseConfigured()) {
      const order = await orderService.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      // Check if student is requesting their own order, or staff/admin
      const requesterId = req.user.id || req.user._id;
      const staffRoles = ['Admin', 'Kitchen Staff', 'Canteen Operator', 'Delivery Staff', 'Branch Manager'];
      const isStaff = staffRoles.includes(req.user.role);
      if (!isStaff && String(order.userId || order.user) !== String(requesterId)) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this order.' });
      }

      return res.json({ success: true, data: order });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const requesterId = req.user._id;
    const staffRoles = ['Admin', 'Kitchen Staff', 'Canteen Operator', 'Delivery Staff', 'Branch Manager'];
    const isStaff = staffRoles.includes(req.user.role);
    if (!isStaff && String(order.user) !== String(requesterId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order.' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const {
      items,
      orderType,
      pickupWindow,
      deliveryLocation,
      roomNumber,
      branch,
      paymentMethod
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items cannot be empty.' });
    }

    if (!paymentMethod || !['CASH', 'ONLINE'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Please select a valid payment method: CASH or ONLINE.' });
    }

    // Verify online payment credentials if online payment requested
    const hasOnlinePayment = !!(process.env.PAYMENT_PROVIDER_KEY || process.env.RAZORPAY_KEY_ID);
    if (paymentMethod === 'ONLINE' && !hasOnlinePayment) {
      return res.status(400).json({
        success: false,
        message: 'Online payment is not configured yet. Please use Cash at Canteen.'
      });
    }

    if (isSupabaseConfigured()) {
      const order = await orderService.createOrder({
        user: req.user,
        items,
        orderType,
        pickupWindow,
        deliveryLocation,
        roomNumber,
        branch,
        paymentMethod
      });

      return res.status(201).json({
        success: true,
        message: paymentMethod === 'CASH'
          ? 'Order placed with Cash payment pending at canteen counter.'
          : 'Order placed and paid online successfully.',
        data: order
      });
    }

    // Fallback: MongoDB
    const verifiedOrderItems = [];
    let calculatedSubtotal = 0;

    for (const entry of items) {
      const itemId = entry.id || entry.item?.id || entry.item?._id || entry.itemId;
      const quantity = parseInt(entry.quantity, 10);

      if (!itemId || !quantity || quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid item or quantity in order request.' });
      }

      const food = await MenuItem.findById(itemId);
      if (!food) {
        return res.status(404).json({ success: false, message: `Food item not found for ID: ${itemId}` });
      }

      if (!food.isAvailable) {
        return res.status(400).json({ success: false, message: `"${food.name}" is currently SOLD OUT / unavailable.` });
      }

      if (food.stockQuantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${food.name}". Available: ${food.stockQuantity}, Requested: ${quantity}`
        });
      }

      // Decrement stock
      food.stockQuantity -= quantity;
      await food.save();

      const itemTotal = food.price * quantity;
      calculatedSubtotal += itemTotal;

      verifiedOrderItems.push({
        item: food._id,
        name: food.name,
        price: food.price,
        quantity,
        image: food.image,
        preparationTime: food.preparationTime
      });
    }

    const deliveryFee = orderType === 'Room Delivery' ? 20 : 0;
    const totalAmount = calculatedSubtotal + deliveryFee;

    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const tokenNumber = `CAN-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Generate scannable QR data payload (no secrets)
    const qrPayload = JSON.stringify({
      orderNumber,
      tokenNumber,
      studentId: req.user.studentId || req.user.email,
      totalAmount,
      branch: branch || 'Main Canteen'
    });

    let qrCodeData = '';
    try {
      qrCodeData = await QRCode.toDataURL(qrPayload);
    } catch (qrErr) {
      qrCodeData = '';
    }

    const order = await Order.create({
      orderNumber,
      tokenNumber,
      user: req.user._id,
      studentName: req.user.name,
      studentId: req.user.studentId || req.user.email,
      items: verifiedOrderItems,
      subtotal: calculatedSubtotal,
      deliveryFee,
      totalAmount,
      orderType: orderType || 'Pickup',
      pickupWindow: orderType === 'Pickup' ? pickupWindow : undefined,
      deliveryLocation: orderType === 'Room Delivery' ? deliveryLocation : undefined,
      roomNumber: orderType === 'Room Delivery' ? roomNumber : undefined,
      branch: branch || 'Main Canteen',
      status: 'Confirmed',
      paymentMethod,
      paymentStatus: paymentMethod === 'ONLINE' ? 'PAID' : 'PENDING',
      tokenStatus: 'ACTIVE',
      qrCodeData
    });

    res.status(201).json({
      success: true,
      message: paymentMethod === 'CASH'
        ? 'Order placed with Cash payment pending at canteen counter.'
        : 'Order placed and paid online successfully.',
      data: order
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    if (isSupabaseConfigured()) {
      const orders = await orderService.getMyOrders(req.user.id || req.user._id);
      return res.json({
        success: true,
        count: orders.length,
        data: orders
      });
    }

    // Only return the authenticated student's own orders
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    if (isSupabaseConfigured()) {
      const orders = await orderService.getAllOrders({
        branch: req.query.branch,
        status: req.query.status
      });
      return res.json({
        success: true,
        count: orders.length,
        data: orders
      });
    }

    const { branch, status } = req.query;
    let query = {};
    if (branch && branch !== 'All Branches') {
      query.branch = branch;
    }
    if (status && status !== 'All') {
      query.status = status;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    if (isSupabaseConfigured()) {
      const order = await orderService.updateOrderStatus(req.params.id, status);
      return res.json({
        success: true,
        message: `Order status updated to ${status}`,
        data: order
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    order.status = status;
    if (status === 'Completed') {
      order.tokenStatus = 'USED';
      order.tokenUsedAt = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

exports.markCashReceived = async (req, res, next) => {
  try {
    if (isSupabaseConfigured()) {
      const order = await orderService.markCashReceived(req.params.id, req.user.id || req.user._id);
      return res.json({
        success: true,
        message: `Cash payment of ₹${order.totalAmount} marked as received by ${req.user.name}.`,
        data: order
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({ success: false, message: 'Payment has already been marked as PAID.' });
    }

    order.paymentStatus = 'PAID';
    order.paidAt = new Date();
    order.paidBy = req.user._id;
    await order.save();

    res.json({
      success: true,
      message: `Cash payment of ₹${order.totalAmount} marked as received by ${req.user.name}.`,
      data: order
    });
  } catch (err) {
    next(err);
  }
};
