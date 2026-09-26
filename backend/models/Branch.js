const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    location: {
      type: String,
      required: true
    },
    operatingHours: {
      open: { type: String, default: '08:00 AM' },
      close: { type: String, default: '08:00 PM' }
    },
    isClosed: {
      type: Boolean,
      default: false
    },
    closureMessage: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Branch', branchSchema);
