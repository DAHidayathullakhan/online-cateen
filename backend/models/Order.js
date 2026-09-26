const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 }
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true
    },
    orderType: {
      type: String,
      enum: ['Pickup', 'Room Delivery'],
      required: true
    },
    pickupWindow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PickupWindow'
    },
    deliveryLocation: {
      building: String,
      floor: String,
      roomNumber: String
    },
    items: [orderItemSchema],
    foodTotal: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },
    finalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'],
      default: 'NEW',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PAID'
    },
    paymentMethod: {
      type: String,
      default: 'Campus Wallet / Mock Pay'
    },
    specialInstructions: { type: String, default: '' },
    queueNumber: { type: Number },
    digitalToken: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DigitalToken'
    },
    groupOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroupOrder'
    },
    preOrderDate: {
      type: String // YYYY-MM-DD for pre-orders
    },
    preparationTimeEstimated: {
      type: Number, // in minutes
      default: 10
    },
    isModified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
