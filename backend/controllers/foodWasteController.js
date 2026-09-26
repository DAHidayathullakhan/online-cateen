const FoodWasteRecord = require('../models/FoodWasteRecord');
const Branch = require('../models/Branch');
const { Inventory } = require('../models/Inventory');
const { logAudit } = require('../utils/auditLogger');

// GET /api/food-waste
exports.getFoodWasteRecords = async (req, res, next) => {
  try {
    const { branchId, date } = req.query;
    const filter = {};
    if (branchId) filter.branch = branchId;
    if (date) filter.date = date;

    const records = await FoodWasteRecord.find(filter)
      .populate('branch', 'name code')
      .populate('menuItem', 'name category price')
      .populate('recordedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    next(err);
  }
};

// POST /api/food-waste
exports.recordFoodWaste = async (req, res, next) => {
  try {
    const { branchId, menuItemId, preparedQuantity, soldQuantity, remainingQuantity, wastedQuantity } = req.body;

    const prep = Number(preparedQuantity) || 0;
    const wasted = Number(wastedQuantity) || 0;
    const wastePercentage = prep > 0 ? Number(((wasted / prep) * 100).toFixed(2)) : 0;
    const todayStr = new Date().toISOString().split('T')[0];

    // Check high demand branch suggestion for "Transfer Before Waste"
    let transferSuggestion = null;
    if (wasted > 5) {
      const otherBranches = await Branch.find({ _id: { $ne: branchId }, isActive: true, isClosed: false });
      if (otherBranches.length > 0) {
        const target = otherBranches[0];
        transferSuggestion = {
          suggestedTargetBranch: target._id,
          suggestedQuantity: Math.floor(wasted * 0.8),
          message: `${target.name} has high evening demand. Consider initiating a stock transfer before final waste.`
        };
      }
    }

    const record = await FoodWasteRecord.create({
      branch: branchId,
      menuItem: menuItemId,
      date: todayStr,
      preparedQuantity: prep,
      soldQuantity: Number(soldQuantity) || 0,
      remainingQuantity: Number(remainingQuantity) || 0,
      wastedQuantity: wasted,
      wastePercentage,
      recordedBy: req.user.id,
      transferSuggestion
    });

    await logAudit({ user: req.user, action: 'RECORD_FOOD_WASTE', target: 'FoodWasteRecord', targetId: record._id, req });

    res.status(201).json({
      success: true,
      message: 'Daily food waste recorded.',
      data: record
    });
  } catch (err) {
    next(err);
  }
};
