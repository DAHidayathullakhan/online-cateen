const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
      index: true
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    minStock: {
      type: Number,
      default: 10
    },
    maxStock: {
      type: Number,
      default: 200
    },
    unit: {
      type: String,
      default: 'portions'
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

inventorySchema.index({ menuItem: 1, branch: 1 }, { unique: true });

inventorySchema.virtual('stockStatus').get(function () {
  if (this.quantity <= 0) return 'Out of stock';
  if (this.quantity <= this.minStock) return 'Low stock';
  return 'Available';
});

inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

const inventoryTransactionSchema = new mongoose.Schema(
  {
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    type: {
      type: String,
      enum: ['Stock added', 'Stock sold', 'Stock adjusted', 'Stock transferred', 'Stock wasted'],
      required: true
    },
    changeQuantity: {
      type: Number,
      required: true
    },
    previousQuantity: {
      type: Number,
      required: true
    },
    newQuantity: {
      type: Number,
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: { type: String }
  },
  { timestamps: true }
);

module.exports = {
  Inventory: mongoose.model('Inventory', inventorySchema),
  InventoryTransaction: mongoose.model('InventoryTransaction', inventoryTransactionSchema)
};
