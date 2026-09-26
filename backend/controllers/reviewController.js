const Review = require('../models/Review');
const Order = require('../models/Order');

// POST /api/reviews
exports.createReview = async (req, res, next) => {
  try {
    const { orderId, foodRating, deliveryRating, comment } = req.body;
    const studentId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (order.student.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'You can only review your own completed orders.' });
    }

    if (order.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Reviews are only permitted for completed orders.' });
    }

    const existing = await Review.findOne({ order: orderId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already submitted a review for this order.' });
    }

    const review = await Review.create({
      order: orderId,
      student: studentId,
      foodRating: Number(foodRating),
      deliveryRating: deliveryRating ? Number(deliveryRating) : null,
      comment
    });

    res.status(201).json({ success: true, message: 'Thank you for your rating!', data: review });
  } catch (err) {
    next(err);
  }
};

// GET /api/reviews
exports.getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('student', 'name studentId')
      .populate('order', 'orderNumber orderType branch')
      .sort({ createdAt: -1 });

    const avgFoodRating = reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.foodRating, 0) / reviews.length).toFixed(1)
      : 5.0;

    res.json({
      success: true,
      avgFoodRating,
      count: reviews.length,
      data: reviews
    });
  } catch (err) {
    next(err);
  }
};
