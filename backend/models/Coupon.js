const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    title: { type: String, required: true },
    description: { type: String },
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    startDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    maxUsesTotal: { type: Number, default: 100 },
    currentUsesTotal: { type: Number, default: 0 },
    maxUsesPerUser: { type: Number, default: 1 },
    minOrderValue: { type: Number, default: 0 },
    eligibleCourses: [{ type: String }], // e.g. ["BCA"]
    eligibleBranches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
