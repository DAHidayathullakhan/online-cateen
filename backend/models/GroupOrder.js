const mongoose = require('mongoose');

const groupMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [
    {
      menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
      name: String,
      price: Number,
      quantity: Number
    }
  ],
  subtotal: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  transactionId: String
});

const groupOrderSchema = new mongoose.Schema(
  {
    groupCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    pickupWindow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PickupWindow'
    },
    members: [groupMemberSchema],
    totalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['OPEN', 'LOCKED', 'SUBMITTED', 'CANCELLED'],
      default: 'OPEN',
      index: true
    },
    groupTokenNumber: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('GroupOrder', groupOrderSchema);
