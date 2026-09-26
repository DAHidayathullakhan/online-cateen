const DigitalToken = require('../models/DigitalToken');
const Order = require('../models/Order');
const TokenService = require('../services/tokenService');
const { logAudit } = require('../utils/auditLogger');

// GET /api/tokens/order/:orderId
exports.getTokenByOrderId = async (req, res, next) => {
  try {
    const token = await DigitalToken.findOne({ order: req.params.orderId })
      .populate({
        path: 'order',
        populate: [{ path: 'items.menuItem' }, { path: 'branch' }, { path: 'pickupWindow' }]
      })
      .populate('student', 'name email phone studentId')
      .populate('branch')
      .populate('pickupWindow');

    if (!token) {
      return res.status(404).json({ success: false, message: 'Digital token not found for this order.' });
    }

    // Ownership check for students
    if ((req.user.role === 'Student' || req.user.role === "Master's Student") && token.student._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: token });
  } catch (err) {
    next(err);
  }
};

// POST /api/tokens/verify (Canteen Operator / Admin)
exports.verifyToken = async (req, res, next) => {
  try {
    const { tokenNumber } = req.body;
    if (!tokenNumber) {
      return res.status(400).json({ success: false, message: 'Token number is required for verification.' });
    }

    const result = await TokenService.verifyToken(tokenNumber.trim(), req.user);
    if (!result.success) {
      return res.status(400).json(result);
    }

    // Mark order COMPLETED
    if (result.token.order) {
      await Order.findByIdAndUpdate(result.token.order._id, { status: 'COMPLETED' });
    }

    await logAudit({
      user: req.user,
      action: 'VERIFY_DIGITAL_TOKEN',
      target: 'DigitalToken',
      targetId: result.token._id,
      details: { tokenNumber },
      req
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};
