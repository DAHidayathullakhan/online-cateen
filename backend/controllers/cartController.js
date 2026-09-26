const MenuItem = require('../models/MenuItem');
const Coupon = require('../models/Coupon');
const Branch = require('../models/Branch');

// POST /api/cart/calculate
// Calculates subtotal, discounts, delivery charge, and validates availability on server
exports.calculateCart = async (req, res, next) => {
  try {
    const { items = [], orderType = 'Pickup', couponCode = null, branchId } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    if (branchId) {
      const branch = await Branch.findById(branchId);
      if (branch && branch.isClosed) {
        return res.status(400).json({
          success: false,
          message: branch.closureMessage || `${branch.name} is currently closed.`
        });
      }
    }

    let foodTotal = 0;
    const validatedItems = [];

    for (const cartItem of items) {
      const itemDoc = await MenuItem.findById(cartItem.menuItemId);

      if (!itemDoc || !itemDoc.isActive) {
        return res.status(400).json({
          success: false,
          message: `Item "${cartItem.name || 'Selected item'}" is no longer available.`
        });
      }

      if (!itemDoc.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `"${itemDoc.name}" is currently sold out / unavailable.`
        });
      }

      if (itemDoc.stockQuantity < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${itemDoc.name}". Available stock: ${itemDoc.stockQuantity}`
        });
      }

      const itemSubtotal = itemDoc.price * cartItem.quantity;
      foodTotal += itemSubtotal;

      validatedItems.push({
        menuItem: itemDoc._id,
        name: itemDoc.name,
        price: itemDoc.price, // Trusting server DB price!
        quantity: cartItem.quantity,
        subtotal: itemSubtotal
      });
    }

    let deliveryCharge = 0;
    if (orderType === 'Room Delivery') {
      deliveryCharge = 20; // ₹20 room delivery fee
    }

    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true
      });

      if (!coupon) {
        return res.status(400).json({ success: false, message: 'Invalid or expired coupon code.' });
      }

      const now = new Date();
      if (coupon.expiryDate && now > coupon.expiryDate) {
        return res.status(400).json({ success: false, message: 'Coupon has expired.' });
      }

      if (foodTotal < coupon.minOrderValue) {
        return res.status(400).json({
          success: false,
          message: `Minimum order value for coupon ${coupon.code} is ₹${coupon.minOrderValue}.`
        });
      }

      if (coupon.discountType === 'percentage') {
        discountAmount = (foodTotal * coupon.discountValue) / 100;
      } else {
        discountAmount = coupon.discountValue;
      }

      if (discountAmount > foodTotal) discountAmount = foodTotal;
      appliedCoupon = coupon.code;
    }

    const finalAmount = Math.max(0, foodTotal + deliveryCharge - discountAmount);

    res.json({
      success: true,
      data: {
        items: validatedItems,
        foodTotal,
        deliveryCharge,
        discountAmount,
        couponCode: appliedCoupon,
        finalAmount
      }
    });
  } catch (err) {
    next(err);
  }
};
