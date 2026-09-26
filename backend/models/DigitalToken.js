const mongoose = require('mongoose');

const digitalTokenSchema = new mongoose.Schema(
  {
    tokenNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    student: {
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
    qrCodeDataUrl: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['Generated', 'Active', 'Verified', 'Used', 'Expired', 'Cancelled'],
      default: 'Active',
      index: true
    },
    verifiedAt: {
      type: Date
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DigitalToken', digitalTokenSchema);
