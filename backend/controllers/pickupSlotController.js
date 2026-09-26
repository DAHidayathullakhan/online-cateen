const PickupWindow = require('../models/PickupWindow');
const { logAudit } = require('../utils/auditLogger');

// GET /api/pickup-slots
exports.getPickupSlots = async (req, res, next) => {
  try {
    const { branchId, date } = req.query;
    const filter = { isActive: true };
    if (branchId) filter.branch = branchId;
    if (date) filter.date = date;

    const slots = await PickupWindow.find(filter).populate('branch', 'name code').sort({ startTime: 1 });
    res.json({ success: true, data: slots });
  } catch (err) {
    next(err);
  }
};

// POST /api/pickup-slots (Admin / Operator)
exports.createPickupSlot = async (req, res, next) => {
  try {
    const { branch, date, startTime, endTime, maxOrders } = req.body;
    const slot = await PickupWindow.create({
      branch,
      date: date || new Date().toISOString().split('T')[0],
      startTime,
      endTime,
      maxOrders: maxOrders || 20
    });
    await logAudit({ user: req.user, action: 'CREATE_PICKUP_SLOT', target: 'PickupWindow', targetId: slot._id, req });
    res.status(201).json({ success: true, data: slot });
  } catch (err) {
    next(err);
  }
};

// PUT /api/pickup-slots/:id
exports.updatePickupSlot = async (req, res, next) => {
  try {
    const slot = await PickupWindow.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!slot) return res.status(404).json({ success: false, message: 'Pickup window not found' });
    await logAudit({ user: req.user, action: 'UPDATE_PICKUP_SLOT', target: 'PickupWindow', targetId: slot._id, req });
    res.json({ success: true, data: slot });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/pickup-slots/:id
exports.deletePickupSlot = async (req, res, next) => {
  try {
    const slot = await PickupWindow.findByIdAndDelete(req.params.id);
    if (!slot) return res.status(404).json({ success: false, message: 'Pickup window not found' });
    await logAudit({ user: req.user, action: 'DELETE_PICKUP_SLOT', target: 'PickupWindow', targetId: req.params.id, req });
    res.json({ success: true, message: 'Pickup slot deleted successfully' });
  } catch (err) {
    next(err);
  }
};
