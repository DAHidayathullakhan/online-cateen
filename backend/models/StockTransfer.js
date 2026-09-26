const mongoose = require('mongoose');

const stockTransferSchema = new mongoose.Schema(
  {
    transferNumber: {
      type: String,
      required: true,
      unique: true
    },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    sourceBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true
    },
    destinationBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedDate: {
      type: Date,
      default: Date.now
    },
    approvalDate: Date,
    dispatchDate: Date,
    receivedDate: Date,
    status: {
      type: String,
      enum: ['Requested', 'Approved', 'Preparing', 'Dispatched', 'Received', 'Rejected'],
      default: 'Requested',
      index: true
    },
    notes: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockTransfer', stockTransferSchema);
