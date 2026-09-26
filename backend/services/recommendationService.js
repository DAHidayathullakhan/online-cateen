const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

class RecommendationService {
  static async getRecommendationsForUser(user) {
    // 1. Today's Specials
    const specials = await MenuItem.find({ isTodaySpecial: true, isAvailable: true, isActive: true }).limit(4);

    // 2. Quick Snacks under ₹50
    const budgetSnacks = await MenuItem.find({ price: { $lte: 50 }, isAvailable: true, isActive: true }).limit(4);

    // 3. Most Popular overall
    const popularItems = await MenuItem.find({ isAvailable: true, isActive: true }).sort({ popularity: -1 }).limit(4);

    return {
      todaysSpecials: specials,
      budgetSnacks,
      popularItems
    };
  }
}

module.exports = RecommendationService;
