const mongoose = require('mongoose');

const pickupWindowSchema = new mongoose.Schema(
  {
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true
    },
    startTime: {
      type: String, // e.g. "11:45 AM"
      required: true
    },
    endTime: {
      type: String, // e.g. "12:00 PM"
      required: true
    },
    maxOrders: {
      type: Number,
      required: true,
      default: 20
    },
    currentOrders: {
      type: Number,
      default: 0,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Virtual field for available capacity
pickupWindowSchema.virtual('availableCapacity').get(function () {
  return Math.max(0, this.maxOrders - this.currentOrders);
});

// Include virtuals in JSON output
pickupWindowSchema.set('toJSON', { virtuals: true });
pickupWindowSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PickupWindow', pickupWindowSchema);
