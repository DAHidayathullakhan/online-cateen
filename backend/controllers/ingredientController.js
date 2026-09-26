const { Ingredient, Recipe } = require('../models/SupplyChainModels');
const MenuItem = require('../models/MenuItem');
const { logAudit } = require('../utils/auditLogger');

// GET /api/ingredients
exports.getIngredients = async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const filter = {};
    if (branchId) filter.branch = branchId;

    const ingredients = await Ingredient.find(filter).populate('branch', 'name code');
    res.json({ success: true, count: ingredients.length, data: ingredients });
  } catch (err) {
    next(err);
  }
};

// POST /api/ingredients (Add / Restock Raw Ingredient)
exports.createOrUpdateIngredient = async (req, res, next) => {
  try {
    const { name, unit, quantity, minStock, branchId, supplier } = req.body;
    let ing = await Ingredient.findOne({ name, branch: branchId });

    if (ing) {
      ing.quantity += Number(quantity);
      if (supplier) ing.supplier = supplier;
      await ing.save();
    } else {
      ing = await Ingredient.create({
        name,
        unit: unit || 'kg',
        quantity: Number(quantity),
        minStock: Number(minStock) || 10,
        branch: branchId,
        supplier: supplier || 'Local Farm Fresh'
      });
    }

    await logAudit({ user: req.user, action: 'UPDATE_INGREDIENT_STOCK', target: 'Ingredient', targetId: ing._id, req });

    res.json({ success: true, message: `Ingredient ${ing.name} stock updated.`, data: ing });
  } catch (err) {
    next(err);
  }
};

// GET /api/ingredients/predictions (Low Stock & Sell Out Estimation)
exports.getPredictions = async (req, res, next) => {
  try {
    const ingredients = await Ingredient.find();
    const lowIngredients = ingredients.filter(i => i.quantity <= i.minStock);

    const items = await MenuItem.find({ isActive: true });
    const predictions = items.map(item => {
      const avgRatePerHour = Math.max(1, Math.floor(item.popularity / 10)); // estimate order rate
      const minutesRemaining = Math.floor((item.stockQuantity / avgRatePerHour) * 60);

      const now = new Date();
      const sellOutTime = new Date(now.getTime() + minutesRemaining * 60 * 1000);

      return {
        menuItemId: item._id,
        name: item.name,
        stockQuantity: item.stockQuantity,
        estimatedMinutesRemaining: minutesRemaining,
        estimatedSellOutTime: sellOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        confidence: item.popularity > 20 ? 'High Confidence' : 'Medium Confidence'
      };
    });

    res.json({
      success: true,
      lowIngredients,
      predictions
    });
  } catch (err) {
    next(err);
  }
};
