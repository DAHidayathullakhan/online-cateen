const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  image: {
    type: String,
    default: '/images/food/placeholder.jpg'
  },
  preparationTime: {
    type: Number,
    default: 10
  }
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    tokenNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    studentName: {
      type: String,
      required: true
    },
    studentId: {
      type: String,
      required: true
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    orderType: {
      type: String,
      enum: ['Pickup', 'Room Delivery'],
      default: 'Pickup'
    },
    pickupWindow: {
      type: String
    },
    deliveryLocation: {
      type: String
    },
    roomNumber: {
      type: String
    },
    branch: {
      type: String,
      default: 'Main Canteen'
    },
    status: {
      type: String,
      enum: ['Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
      default: 'Confirmed',
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'ONLINE'],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    paidAt: {
      type: Date
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    tokenStatus: {
      type: String,
      enum: ['ACTIVE', 'USED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true
    },
    tokenUsedAt: {
      type: Date
    },
    qrCodeData: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
