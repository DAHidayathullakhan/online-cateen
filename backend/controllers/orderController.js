const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Branch = require('../models/Branch');
const PickupWindow = require('../models/PickupWindow');
const Coupon = require('../models/Coupon');
const { Delivery } = require('../models/Delivery');
const { Inventory, InventoryTransaction } = require('../models/Inventory');
const { Wallet, WalletTransaction } = require('../models/Wallet');
const { Holiday } = require('../models/SupplyChainModels');
const TokenService = require('../services/tokenService');
const PaymentService = require('../services/paymentService');
const NotificationService = require('../services/notificationService');
const { logAudit } = require('../utils/auditLogger');

// POST /api/orders (Student Checkout)
exports.createOrder = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const {
      branchId,
      orderType,
      pickupSlotId,
      deliveryLocation,
      items = [],
      couponCode,
      specialInstructions,
      paymentMethod,
      preOrderDate
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cannot place order with empty cart.' });
    }

    // 0. Pre-Order & Holiday Check
    if (preOrderDate) {
      const holiday = await Holiday.findOne({ date: preOrderDate, isOrderingDisabled: true });
      if (holiday) {
        return res.status(400).json({
          success: false,
          message: `Ordering disabled: ${preOrderDate} is a registered campus holiday (${holiday.title}).`
        });
      }
    }

    // 1. Validate Branch
    const branch = await Branch.findById(branchId);
    if (!branch || !branch.isActive) {
      return res.status(400).json({ success: false, message: 'Invalid or inactive canteen branch.' });
    }
    if (branch.isClosed) {
      return res.status(400).json({
        success: false,
        message: branch.closureMessage || `Order failed: ${branch.name} is temporarily closed.`
      });
    }

    // 2. Validate Pickup Slot if Pickup
    let pickupWindow = null;
    if (orderType === 'Pickup') {
      if (!pickupSlotId) {
        return res.status(400).json({ success: false, message: 'Pickup window slot selection is required.' });
      }

      pickupWindow = await PickupWindow.findOneAndUpdate(
        { _id: pickupSlotId, isActive: true, $expr: { $lt: ['$currentOrders', '$maxOrders'] } },
        { $inc: { currentOrders: 1 } },
        { new: true }
      );

      if (!pickupWindow) {
        return res.status(400).json({
          success: false,
          message: 'SLOT FULL: The selected pickup window has reached maximum capacity. Please select another slot.'
        });
      }
    }

    // 3. Validate Delivery Location if Room Delivery
    if (orderType === 'Room Delivery') {
      if (!deliveryLocation || !deliveryLocation.building || !deliveryLocation.roomNumber) {
        return res.status(400).json({
          success: false,
          message: 'Valid building, floor, and room number are required for Room Delivery.'
        });
      }
    }

    // 4. Calculate Prices on Server & Verify Inventory Stock & Prep Time
    let foodTotal = 0;
    let maxPrepTime = 5;
    const orderItems = [];

    for (const item of items) {
      const itemDoc = await MenuItem.findById(item.menuItemId);
      if (!itemDoc || !itemDoc.isActive || !itemDoc.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Item "${item.name || 'Selected food'}" is currently unavailable.`
        });
      }

      if (itemDoc.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${itemDoc.name}".`
        });
      }

      if (itemDoc.preparationTime > maxPrepTime) maxPrepTime = itemDoc.preparationTime;

      const itemSubtotal = itemDoc.price * item.quantity;
      foodTotal += itemSubtotal;

      orderItems.push({
        menuItem: itemDoc._id,
        name: itemDoc.name,
        price: itemDoc.price,
        quantity: item.quantity
      });

      // Deduct stock
      itemDoc.stockQuantity -= item.quantity;
      if (itemDoc.stockQuantity <= 0) itemDoc.isAvailable = false;
      itemDoc.popularity += item.quantity;
      await itemDoc.save();

      // Log Inventory Transaction
      const invDoc = await Inventory.findOne({ menuItem: itemDoc._id, branch: branch._id });
      if (invDoc) {
        const prev = invDoc.quantity;
        invDoc.quantity = Math.max(0, invDoc.quantity - item.quantity);
        await invDoc.save();

        await InventoryTransaction.create({
          inventory: invDoc._id,
          menuItem: itemDoc._id,
          branch: branch._id,
          type: 'Stock sold',
          changeQuantity: -item.quantity,
          previousQuantity: prev,
          newQuantity: invDoc.quantity,
          performedBy: studentId,
          notes: `Sold via Order`
        });
      }
    }

    let deliveryCharge = orderType === 'Room Delivery' ? 20 : 0;
    let discountAmount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && foodTotal >= coupon.minOrderValue) {
        discountAmount = coupon.discountType === 'percentage' ? (foodTotal * coupon.discountValue) / 100 : coupon.discountValue;
        coupon.currentUsesTotal += 1;
        await coupon.save();
      }
    }

    const finalAmount = Math.max(0, foodTotal + deliveryCharge - discountAmount);

    // 5. Payment Handling (Support Campus Wallet option)
    let paymentStatus = 'PAID';
    if (paymentMethod === 'Campus Wallet') {
      let wallet = await Wallet.findOne({ user: studentId });
      if (!wallet) wallet = await Wallet.create({ user: studentId, balance: 500 });

      if (wallet.balance < finalAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient wallet balance (Current: ₹${wallet.balance}, Required: ₹${finalAmount}). Please top up.`
        });
      }

      wallet.balance -= finalAmount;
      await wallet.save();
    } else {
      await PaymentService.processPayment({ amount: finalAmount, paymentMethod, studentId });
    }

    // 6. Generate Order Number
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-2026-${String(orderCount + 1).padStart(5, '0')}`;

    // 7. Create Order Document
    const order = await Order.create({
      orderNumber,
      student: studentId,
      branch: branch._id,
      orderType,
      pickupWindow: pickupWindow ? pickupWindow._id : null,
      deliveryLocation: orderType === 'Room Delivery' ? deliveryLocation : null,
      items: orderItems,
      foodTotal,
      deliveryCharge,
      discountAmount,
      couponCode: couponCode || null,
      finalAmount,
      status: 'NEW',
      paymentStatus,
      paymentMethod: paymentMethod || 'Campus Wallet',
      specialInstructions: specialInstructions || '',
      queueNumber: (orderCount % 100) + 1,
      preOrderDate: preOrderDate || new Date().toISOString().split('T')[0],
      preparationTimeEstimated: maxPrepTime
    });

    if (paymentMethod === 'Campus Wallet') {
      const wDoc = await Wallet.findOne({ user: studentId });
      if (wDoc) {
        await WalletTransaction.create({
          wallet: wDoc._id,
          user: studentId,
          type: 'debit',
          amount: finalAmount,
          referenceOrder: order._id,
          description: `Paid for Order #${order.orderNumber}`
        });
      }
    }

    // 8. Generate Digital Food Token & QR Code
    const studentUser = { _id: studentId, name: req.user.name };
    const tokenDoc = await TokenService.generateTokenForOrder(order, studentUser, branch, pickupWindow);
    order.digitalToken = tokenDoc._id;
    await order.save();

    // 9. Handle Room Delivery Record
    if (orderType === 'Room Delivery') {
      await Delivery.create({
        order: order._id,
        student: studentId,
        building: deliveryLocation.building,
        floor: deliveryLocation.floor || 'Ground Floor',
        roomNumber: deliveryLocation.roomNumber,
        status: 'Order received',
        estimatedTimeMinutes: maxPrepTime + 15
      });
    }

    // 10. Send Notification
    await NotificationService.sendNotification({
      recipientId: studentId,
      title: 'Order Placed Successfully!',
      message: `Your order ${order.orderNumber} is placed. Est Prep: ${maxPrepTime} mins. Token: ${tokenDoc.tokenNumber}`,
      type: 'order_placed',
      link: `/token.html?id=${order._id}`
    });

    await logAudit({ user: req.user, action: 'CREATE_ORDER', target: 'Order', targetId: order._id, req });

    res.status(201).json({
      success: true,
      message: 'Order created successfully!',
      orderId: order._id,
      tokenNumber: tokenDoc.tokenNumber,
      qrCodeDataUrl: tokenDoc.qrCodeDataUrl,
      preparationTimeEstimated: maxPrepTime,
      order
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders (List orders filtered by role)
exports.getOrders = async (req, res, next) => {
  try {
    const { role, id: userId, branch } = req.user;
    const { status, branchId, orderType } = req.query;

    const filter = {};
    if (role === 'Student' || role === "Master's Student") {
      filter.student = userId;
    } else if (role === 'Kitchen Staff' || role === 'Canteen Operator' || role === 'Branch Manager') {
      if (branchId || branch) {
        filter.branch = branchId || branch;
      }
    } else if (role === 'Delivery Staff') {
      filter.orderType = 'Room Delivery';
    }

    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;

    const orders = await Order.find(filter)
      .populate('student', 'name email phone studentId')
      .populate('branch', 'name code')
      .populate('pickupWindow')
      .populate('digitalToken')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id (Single order detail)
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('student', 'name email phone studentId')
      .populate('branch', 'name code location')
      .populate('pickupWindow')
      .populate('digitalToken');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if ((req.user.role === 'Student' || req.user.role === "Master's Student") && order.student._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    let deliveryDoc = null;
    if (order.orderType === 'Room Delivery') {
      deliveryDoc = await Delivery.findOne({ order: order._id }).populate('assignedStaff', 'name phone');
    }

    res.json({ success: true, data: order, delivery: deliveryDoc });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status;
    await order.save();

    if (order.orderType === 'Room Delivery') {
      const delivery = await Delivery.findOne({ order: order._id });
      if (delivery) {
        if (status === 'PREPARING') delivery.status = 'Preparing';
        if (status === 'COMPLETED') delivery.status = 'Delivered';
        await delivery.save();
      }
    }

    await NotificationService.sendNotification({
      recipientId: order.student,
      title: `Order Status Update: ${status}`,
      message: `Your order ${order.orderNumber} status is now ${status}.`,
      type: `order_${status.toLowerCase()}`,
      link: `/order-details.html?id=${order._id}`
    });

    await logAudit({ user: req.user, action: `UPDATE_ORDER_STATUS_${status}`, target: 'Order', targetId: order._id, req });

    res.json({ success: true, message: `Order status updated to ${status}`, data: order });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/orders/:id/modify (Order Modification Before Prep)
exports.modifyOrder = async (req, res, next) => {
  try {
    const { specialInstructions, items } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (order.student.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only modify your own orders.' });
    }

    // Lock modifications if preparation has begun!
    if (order.status !== 'NEW' && order.status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: `Order modification locked: Preparation has already started (${order.status}).`
      });
    }

    if (specialInstructions !== undefined) order.specialInstructions = specialInstructions;

    order.isModified = true;
    await order.save();

    await logAudit({ user: req.user, action: 'MODIFY_ORDER_BEFORE_PREP', target: 'Order', targetId: order._id, req });

    res.json({ success: true, message: 'Order instructions updated before preparation.', data: order });
  } catch (err) {
    next(err);
  }
};

// POST /api/orders/:id/reorder (Order Again)
exports.reorder = async (req, res, next) => {
  try {
    const oldOrder = await Order.findById(req.params.id);
    if (!oldOrder) return res.status(404).json({ success: false, message: 'Original order not found.' });

    const cartItems = [];
    for (const item of oldOrder.items) {
      const currentItem = await MenuItem.findById(item.menuItem);
      if (currentItem && currentItem.isActive && currentItem.isAvailable) {
        cartItems.push({
          menuItemId: currentItem._id,
          name: currentItem.name,
          price: currentItem.price,
          quantity: item.quantity,
          image: currentItem.image
        });
      }
    }

    res.json({
      success: true,
      message: 'Items loaded for reorder.',
      branchId: oldOrder.branch,
      items: cartItems
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/capacity-monitor (Canteen Load Status Indicator)
exports.getCapacityStatus = async (req, res, next) => {
  try {
    const activeCount = await Order.countDocuments({ status: { $in: ['NEW', 'ACCEPTED', 'PREPARING'] } });

    let statusLabel = '🟢 Normal';
    let statusClass = 'success';
    if (activeCount > 25) {
      statusLabel = '🔴 Very Busy';
      statusClass = 'danger';
    } else if (activeCount > 10) {
      statusLabel = '🟡 Busy';
      statusClass = 'warning';
    }

    res.json({
      success: true,
      activeCount,
      statusLabel,
      statusClass
    });
  } catch (err) {
    next(err);
  }
};
