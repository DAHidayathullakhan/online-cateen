const mongoose = require('mongoose');

const foodWasteRecordSchema = new mongoose.Schema(
  {
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true
    },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
      index: true
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true
    },
    preparedQuantity: { type: Number, required: true, min: 0 },
    soldQuantity: { type: Number, required: true, min: 0 },
    remainingQuantity: { type: Number, required: true, min: 0 },
    wastedQuantity: { type: Number, required: true, min: 0 },
    wastePercentage: { type: Number, required: true, min: 0 },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    transferSuggestion: {
      suggestedTargetBranch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
      suggestedQuantity: Number,
      message: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('FoodWasteRecord', foodWasteRecordSchema);
