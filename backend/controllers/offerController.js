const Coupon = require('../models/Coupon');
const { logAudit } = require('../utils/auditLogger');

// GET /api/offers
exports.getOffers = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({ isActive: true });
    res.json({ success: true, count: coupons.length, data: coupons });
  } catch (err) {
    next(err);
  }
};

// POST /api/offers (Admin)
exports.createOffer = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    await logAudit({ user: req.user, action: 'CREATE_COUPON', target: 'Coupon', targetId: coupon._id, req });
    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/offers/:id
exports.deleteOffer = async (req, res, next) => {
  try {
    await Coupon.findByIdAndUpdate(req.params.id, { isActive: false });
    await logAudit({ user: req.user, action: 'DISABLE_COUPON', target: 'Coupon', targetId: req.params.id, req });
    res.json({ success: true, message: 'Coupon offer disabled.' });
  } catch (err) {
    next(err);
  }
};
