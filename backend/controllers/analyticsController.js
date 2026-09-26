const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Branch = require('../models/Branch');
const FoodWasteRecord = require('../models/FoodWasteRecord');
const PickupWindow = require('../models/PickupWindow');

// GET /api/analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const orders = await Order.find().populate('branch', 'name code');

    let todayRevenue = 0;
    let todayOrdersCount = 0;
    let totalRevenue = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    const branchPerformance = {};
    const hourCounts = Array(24).fill(0);
    const orderTypeCounts = { Pickup: 0, 'Room Delivery': 0 };

    orders.forEach(ord => {
      totalRevenue += ord.finalAmount;

      const ordDateStr = new Date(ord.createdAt).toISOString().split('T')[0];
      if (ordDateStr === todayStr) {
        todayRevenue += ord.finalAmount;
        todayOrdersCount += 1;
      }

      if (ord.branch && ord.branch.name) {
        branchPerformance[ord.branch.name] = (branchPerformance[ord.branch.name] || 0) + ord.finalAmount;
      }

      const hr = new Date(ord.createdAt).getHours();
      hourCounts[hr] += 1;

      if (ord.orderType) {
        orderTypeCounts[ord.orderType] = (orderTypeCounts[ord.orderType] || 0) + 1;
      }
    });

    // Find Rush Hour peak period
    let maxHour = 12;
    let maxHourCount = 0;
    hourCounts.forEach((count, hr) => {
      if (count > maxHourCount) {
        maxHourCount = count;
        maxHour = hr;
      }
    });

    const rushHourText = `${maxHour}:00 - ${maxHour + 1}:00`;

    // Food sales rankings
    const popularFood = await MenuItem.find({ isActive: true }).sort({ popularity: -1 }).limit(5);
    const leastFood = await MenuItem.find({ isActive: true }).sort({ popularity: 1 }).limit(5);

    // Food waste records summary
    const wasteRecords = await FoodWasteRecord.find().populate('menuItem', 'name');
    let totalWastePortions = 0;
    wasteRecords.forEach(w => totalWastePortions += w.wastedQuantity);

    // Demand Forecast Calculation
    const estimatedTomorrowDemand = Math.round(todayOrdersCount * 1.15) || 45;

    res.json({
      success: true,
      summary: {
        todayOrdersCount,
        todayRevenue,
        totalRevenue,
        avgOrderValue: orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : 0,
        rushHourText,
        estimatedTomorrowDemand,
        totalWastePortions
      },
      chartData: {
        hourlyDistribution: hourCounts,
        branchPerformance,
        orderTypeCounts,
        popularFood: popularFood.map(f => ({ name: f.name, popularity: f.popularity })),
        leastFood: leastFood.map(f => ({ name: f.name, popularity: f.popularity }))
      }
    });
  } catch (err) {
    next(err);
  }
};
