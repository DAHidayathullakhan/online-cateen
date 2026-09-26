const { MealPlan, StudentSubscription } = require('../models/MealSubscription');
const { logAudit } = require('../utils/auditLogger');

// GET /api/subscriptions/plans
exports.getMealPlans = async (req, res, next) => {
  try {
    const plans = await MealPlan.find({ isActive: true });
    res.json({ success: true, count: plans.length, data: plans });
  } catch (err) {
    next(err);
  }
};

// GET /api/subscriptions/my-subscriptions
exports.getMySubscriptions = async (req, res, next) => {
  try {
    const subs = await StudentSubscription.find({ student: req.user.id, isActive: true })
      .populate('mealPlan')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: subs });
  } catch (err) {
    next(err);
  }
};

// POST /api/subscriptions/buy
exports.buySubscription = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const plan = await MealPlan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Meal plan not found.' });

    const expiryDate = new Date(Date.now() + plan.validityDays * 24 * 60 * 60 * 1000);

    const sub = await StudentSubscription.create({
      student: req.user.id,
      mealPlan: plan._id,
      totalMeals: plan.totalMeals,
      remainingMeals: plan.totalMeals,
      expiryDate
    });

    await logAudit({ user: req.user, action: 'BUY_MEAL_SUBSCRIPTION', target: 'StudentSubscription', targetId: sub._id, req });

    res.status(201).json({
      success: true,
      message: `Subscribed to "${plan.planName}"! Balance: ${sub.remainingMeals} meals.`,
      data: sub
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/subscriptions/consume
exports.consumeSubscriptionMeal = async (req, res, next) => {
  try {
    const sub = await StudentSubscription.findOne({
      student: req.user.id,
      isActive: true,
      remainingMeals: { $gt: 0 },
      expiryDate: { $gte: new Date() }
    });

    if (!sub) {
      return res.status(400).json({ success: false, message: 'No active meal plan with remaining meals.' });
    }

    sub.remainingMeals -= 1;
    if (sub.remainingMeals <= 0) sub.isActive = false;
    await sub.save();

    res.json({
      success: true,
      message: `Meal subscription used! Remaining meals: ${sub.remainingMeals}`,
      remainingMeals: sub.remainingMeals
    });
  } catch (err) {
    next(err);
  }
};
