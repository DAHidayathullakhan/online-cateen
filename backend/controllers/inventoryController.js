const { Inventory, InventoryTransaction } = require('../models/Inventory');
const MenuItem = require('../models/MenuItem');
const { logAudit } = require('../utils/auditLogger');

// GET /api/inventory
exports.getInventory = async (req, res, next) => {
  try {
    const { branchId, status } = req.query;
    const filter = {};
    if (branchId) filter.branch = branchId;

    let items = await Inventory.find(filter)
      .populate('menuItem')
      .populate('branch', 'name code')
      .populate('lastUpdatedBy', 'name');

    if (status) {
      items = items.filter(i => i.stockStatus === status);
    }

    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

// POST /api/inventory/adjust
exports.adjustStock = async (req, res, next) => {
  try {
    const { inventoryId, menuItemId, branchId, changeQuantity, type, notes } = req.body;

    let inv = null;
    if (inventoryId) {
      inv = await Inventory.findById(inventoryId);
    } else if (menuItemId && branchId) {
      inv = await Inventory.findOne({ menuItem: menuItemId, branch: branchId });
    }

    if (!inv) {
      inv = await Inventory.create({
        menuItem: menuItemId,
        branch: branchId,
        quantity: Math.max(0, changeQuantity || 0),
        lastUpdatedBy: req.user.id
      });
    }

    const previousQuantity = inv.quantity;
    const newQuantity = Math.max(0, previousQuantity + Number(changeQuantity));

    inv.quantity = newQuantity;
    inv.lastUpdatedBy = req.user.id;
    await inv.save();

    // Also update MenuItem overall stockQuantity
    await MenuItem.findByIdAndUpdate(inv.menuItem, { stockQuantity: newQuantity, isAvailable: newQuantity > 0 });

    const transaction = await InventoryTransaction.create({
      inventory: inv._id,
      menuItem: inv.menuItem,
      branch: inv.branch,
      type: type || 'Stock adjusted',
      changeQuantity: Number(changeQuantity),
      previousQuantity,
      newQuantity,
      performedBy: req.user.id,
      notes: notes || 'Manual adjustment'
    });

    await logAudit({ user: req.user, action: 'ADJUST_INVENTORY_STOCK', target: 'Inventory', targetId: inv._id, details: { newQuantity }, req });

    res.json({ success: true, data: inv, transaction });
  } catch (err) {
    next(err);
  }
};

// GET /api/inventory/low-stock-alerts
exports.getLowStockAlerts = async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const filter = {};
    if (branchId) filter.branch = branchId;

    const allInv = await Inventory.find(filter).populate('menuItem').populate('branch');
    const lowStock = allInv.filter(item => item.quantity <= item.minStock);

    res.json({ success: true, count: lowStock.length, data: lowStock });
  } catch (err) {
    next(err);
  }
};
