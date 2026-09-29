const mongoose = require('mongoose');

const cashTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['SALE', 'REFUND', 'EXPENSE', 'FLOAT'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    default: ''
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  performedByName: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const cashRegisterSchema = new mongoose.Schema(
  {
    branch: {
      type: String,
      default: 'Main Canteen',
      index: true
    },
    openedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    openedByName: {
      type: String,
      required: true
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    closedByName: {
      type: String
    },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED'],
      default: 'OPEN',
      index: true
    },
    openingBalance: {
      type: Number,
      required: true,
      min: 0,
      default: 5000
    },
    cashSales: {
      type: Number,
      default: 0
    },
    cashRefunds: {
      type: Number,
      default: 0
    },
    cashExpenses: {
      type: Number,
      default: 0
    },
    totalExpenses: {
      type: Number,
      default: 0
    },
    totalRefunds: {
      type: Number,
      default: 0
    },
    currentCashBalance: {
      type: Number,
      default: 5000
    },
    expectedClosingCash: {
      type: Number,
      default: 5000
    },
    actualClosingCash: {
      type: Number
    },
    difference: {
      type: Number,
      default: 0
    },
    variance: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      default: ''
    },
    openedAt: {
      type: Date,
      default: Date.now
    },
    closedAt: {
      type: Date
    },
    transactions: [cashTransactionSchema]
  },
  { timestamps: true }
);

cashRegisterSchema.index({ status: 1, branch: 1 });

module.exports = mongoose.model('CashRegister', cashRegisterSchema);
