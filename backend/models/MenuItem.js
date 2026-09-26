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
      default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
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
        'Special Items'
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
      type: Number, // in minutes
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
    allergyInfo: [{ type: String }], // e.g. ["Peanuts", "Dairy", "Gluten"]
    dietaryTags: [{ type: String }], // e.g. ["Jain", "No Onion", "No Garlic"]
    branches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
      }
    ],
    scheduledDay: {
      type: String,
      default: 'All'
    },
    soldOutEstimatedTime: {
      type: String // e.g. "01:10 PM"
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

menuItemSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('MenuItem', menuItemSchema);
