const mongoose = require('mongoose');

const deliveryLocationSchema = new mongoose.Schema(
  {
    buildingName: {
      type: String,
      required: true,
      unique: true
    },
    floors: [{ type: String }], // e.g. ["1st Floor", "2nd Floor", "3rd Floor"]
    isAllowedForDelivery: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const deliverySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    building: { type: String, required: true },
    floor: { type: String, required: true },
    roomNumber: { type: String, required: true },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['Order received', 'Preparing', 'Out for delivery', 'Delivered'],
      default: 'Order received',
      index: true
    },
    estimatedTimeMinutes: {
      type: Number,
      default: 25
    },
    deliveredAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = {
  DeliveryLocation: mongoose.model('DeliveryLocation', deliveryLocationSchema),
  Delivery: mongoose.model('Delivery', deliverySchema)
};
