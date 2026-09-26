const { Vendor, PurchaseOrder, Ingredient } = require('../models/SupplyChainModels');
const { logAudit } = require('../utils/auditLogger');

// GET /api/vendors
exports.getVendors = async (req, res, next) => {
  try {
    const vendors = await Vendor.find();
    res.json({ success: true, count: vendors.length, data: vendors });
  } catch (err) {
    next(err);
  }
};

// POST /api/vendors
exports.createVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.create(req.body);
    await logAudit({ user: req.user, action: 'CREATE_VENDOR', target: 'Vendor', targetId: vendor._id, req });
    res.status(201).json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
};

// GET /api/purchases
exports.getPurchaseOrders = async (req, res, next) => {
  try {
    const orders = await PurchaseOrder.find()
      .populate('vendor', 'name contactPerson phone')
      .populate('branch', 'name code')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    next(err);
  }
};

// POST /api/purchases (Create PO)
exports.createPurchaseOrder = async (req, res, next) => {
  try {
    const { vendorId, branchId, items = [] } = req.body;
    const count = await PurchaseOrder.countDocuments();
    const poNumber = `PO-2026-${String(count + 1).padStart(5, '0')}`;

    const totalCost = items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);

    const po = await PurchaseOrder.create({
      poNumber,
      vendor: vendorId,
      branch: branchId,
      items,
      totalCost,
      status: 'Ordered'
    });

    await logAudit({ user: req.user, action: 'CREATE_PURCHASE_ORDER', target: 'PurchaseOrder', targetId: po._id, req });

    res.status(201).json({ success: true, message: `Purchase Order ${poNumber} created.`, data: po });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/purchases/:id/receive (Goods Received -> Auto Restock Inventory)
exports.receivePurchaseOrder = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'Purchase Order not found.' });

    if (po.status === 'Received') {
      return res.status(400).json({ success: false, message: 'Purchase order is already received.' });
    }

    po.status = 'Received';
    po.receivedDate = new Date();
    await po.save();

    // Auto restock ingredient inventory
    for (const item of po.items) {
      if (item.ingredient) {
        let ing = await Ingredient.findById(item.ingredient);
        if (ing) {
          ing.quantity += Number(item.quantity);
          await ing.save();
        }
      }
    }

    await logAudit({ user: req.user, action: 'RECEIVE_PURCHASE_ORDER', target: 'PurchaseOrder', targetId: po._id, req });

    res.json({ success: true, message: `PO ${po.poNumber} marked Received! Ingredient stocks automatically updated.`, data: po });
  } catch (err) {
    next(err);
  }
};
