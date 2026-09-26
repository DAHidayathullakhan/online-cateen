const { Delivery, DeliveryLocation } = require('../models/Delivery');
const Order = require('../models/Order');
const NotificationService = require('../services/notificationService');
const { logAudit } = require('../utils/auditLogger');

// GET /api/deliveries (Delivery Staff Dashboard)
exports.getDeliveries = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const deliveries = await Delivery.find(filter)
      .populate({
        path: 'order',
        populate: { path: 'items.menuItem' }
      })
      .populate('student', 'name phone studentId')
      .populate('assignedStaff', 'name phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: deliveries.length, data: deliveries });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/deliveries/:id/status (Update delivery status)
exports.updateDeliveryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery record not found.' });

    delivery.status = status;
    delivery.assignedStaff = req.user.id;
    if (status === 'Delivered') {
      delivery.deliveredAt = new Date();
    }
    await delivery.save();

    // Sync order status
    let orderStatus = 'PREPARING';
    if (status === 'Out for delivery') orderStatus = 'READY';
    if (status === 'Delivered') orderStatus = 'COMPLETED';

    await Order.findByIdAndUpdate(delivery.order, { status: orderStatus });

    await NotificationService.sendNotification({
      recipientId: delivery.student,
      title: `Delivery Status: ${status}`,
      message: `Your room delivery to ${delivery.building} Room ${delivery.roomNumber} is now: ${status}.`,
      type: status === 'Out for delivery' ? 'delivery_started' : 'order_delivered',
      link: `/orders.html`
    });

    await logAudit({ user: req.user, action: `DELIVERY_STATUS_${status}`, target: 'Delivery', targetId: delivery._id, req });

    res.json({ success: true, message: `Delivery updated to ${status}`, data: delivery });
  } catch (err) {
    next(err);
  }
};

// GET /api/deliveries/locations (Allowed campus delivery locations)
exports.getDeliveryLocations = async (req, res, next) => {
  try {
    const locations = await DeliveryLocation.find({ isAllowedForDelivery: true });
    res.json({ success: true, data: locations });
  } catch (err) {
    next(err);
  }
};

// POST /api/deliveries/locations (Admin)
exports.createDeliveryLocation = async (req, res, next) => {
  try {
    const { buildingName, floors } = req.body;
    const loc = await DeliveryLocation.create({ buildingName, floors });
    res.status(201).json({ success: true, data: loc });
  } catch (err) {
    next(err);
  }
};
