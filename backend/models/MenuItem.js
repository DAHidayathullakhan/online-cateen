const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    image: {
      type: String,
      default: '/images/food/placeholder.jpg'
    },
    description: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Breakfast',
        'Lunch',
        'Snacks',
        'Beverages',
        'Meals',
        'Fast Food',
        'Healthy Food',
        'Special Items',
        'Healthy',
        'Special'
      ],
      index: true
    },
    isVegetarian: {
      type: Boolean,
      default: true,
      index: true
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true
    },
    stockQuantity: {
      type: Number,
      default: 50,
      min: 0
    },
    preparationTime: {
      type: Number,
      default: 10
    },
    popularity: {
      type: Number,
      default: 0
    },
    isTodaySpecial: {
      type: Boolean,
      default: false,
      index: true
    },
    ingredients: [{ type: String }],
    allergyInfo: [{ type: String }],
    dietaryTags: [{ type: String }],
    branches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
      }
    ]
  },
  { timestamps: true }
);

menuItemSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('MenuItem', menuItemSchema);
