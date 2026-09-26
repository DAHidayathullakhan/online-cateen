const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema(
  {
    planName: { type: String, required: true }, // e.g. "5 Lunches Package", "Monthly Meal Pass"
    totalMeals: { type: Number, required: true },
    price: { type: Number, required: true },
    validityDays: { type: Number, default: 30 },
    eligibleBranches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const studentSubscriptionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    mealPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealPlan',
      required: true
    },
    totalMeals: { type: Number, required: true },
    remainingMeals: { type: Number, required: true, min: 0 },
    purchaseDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = {
  MealPlan: mongoose.model('MealPlan', mealPlanSchema),
  StudentSubscription: mongoose.model('StudentSubscription', studentSubscriptionSchema)
};
