const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    balance: {
      type: Number,
      required: true,
      default: 500, // Default ₹500 starting canteen credits for dev mode
      min: 0
    }
  },
  { timestamps: true }
);

const walletTransactionSchema = new mongoose.Schema(
  {
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['credit', 'debit', 'refund', 'topup'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    referenceOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    description: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = {
  Wallet: mongoose.model('Wallet', walletSchema),
  WalletTransaction: mongoose.model('WalletTransaction', walletTransactionSchema)
};
