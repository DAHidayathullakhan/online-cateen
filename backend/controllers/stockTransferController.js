const StockTransfer = require('../models/StockTransfer');
const { Inventory, InventoryTransaction } = require('../models/Inventory');
const { logAudit } = require('../utils/auditLogger');

// GET /api/transfers
exports.getTransfers = async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const filter = {};
    if (branchId) {
      filter.$or = [{ sourceBranch: branchId }, { destinationBranch: branchId }];
    }

    const transfers = await StockTransfer.find(filter)
      .populate('menuItem')
      .populate('sourceBranch', 'name code')
      .populate('destinationBranch', 'name code')
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('receivedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: transfers.length, data: transfers });
  } catch (err) {
    next(err);
  }
};

// POST /api/transfers (Request Stock Transfer)
exports.requestTransfer = async (req, res, next) => {
  try {
    const { menuItemId, quantity, sourceBranchId, destinationBranchId, notes } = req.body;

    if (!menuItemId || !quantity || !sourceBranchId || !destinationBranchId) {
      return res.status(400).json({ success: false, message: 'All transfer details (item, quantity, source, destination) are required.' });
    }

    if (sourceBranchId === destinationBranchId) {
      return res.status(400).json({ success: false, message: 'Source and destination branches cannot be identical.' });
    }

    // Check source inventory available stock
    const sourceInv = await Inventory.findOne({ menuItem: menuItemId, branch: sourceBranchId });
    if (!sourceInv || sourceInv.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock at source branch. Available: ${sourceInv ? sourceInv.quantity : 0}`
      });
    }

    const count = await StockTransfer.countDocuments();
    const transferNumber = `TRF-2026-${String(count + 1).padStart(5, '0')}`;

    const transfer = await StockTransfer.create({
      transferNumber,
      menuItem: menuItemId,
      quantity,
      sourceBranch: sourceBranchId,
      destinationBranch: destinationBranchId,
      requestedBy: req.user.id,
      notes: notes || ''
    });

    await logAudit({ user: req.user, action: 'REQUEST_STOCK_TRANSFER', target: 'StockTransfer', targetId: transfer._id, req });

    res.status(201).json({ success: true, message: 'Stock transfer request created.', data: transfer });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/transfers/:id/approve
exports.approveTransfer = async (req, res, next) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id);
    if (!transfer) return res.status(404).json({ success: false, message: 'Stock transfer request not found.' });

    if (transfer.status !== 'Requested') {
      return res.status(400).json({ success: false, message: `Transfer cannot be approved because status is '${transfer.status}'.` });
    }

    transfer.status = 'Approved';
    transfer.approvedBy = req.user.id;
    transfer.approvalDate = new Date();
    transfer.dispatchDate = new Date();
    await transfer.save();

    await logAudit({ user: req.user, action: 'APPROVE_STOCK_TRANSFER', target: 'StockTransfer', targetId: transfer._id, req });

    res.json({ success: true, message: 'Stock transfer approved and dispatched.', data: transfer });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/transfers/:id/receive (Destination receives transfer & updates inventory)
exports.receiveTransfer = async (req, res, next) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id);
    if (!transfer) return res.status(404).json({ success: false, message: 'Stock transfer record not found.' });

    if (transfer.status === 'Received') {
      return res.status(400).json({ success: false, message: 'Duplicate receive prevented: This stock transfer has already been received!' });
    }

    if (transfer.status !== 'Approved' && transfer.status !== 'Dispatched') {
      return res.status(400).json({ success: false, message: `Cannot receive transfer with status '${transfer.status}'. It must be approved first.` });
    }

    // 1. Deduct from Source Branch Inventory
    let sourceInv = await Inventory.findOne({ menuItem: transfer.menuItem, branch: transfer.sourceBranch });
    if (!sourceInv || sourceInv.quantity < transfer.quantity) {
      return res.status(400).json({ success: false, message: 'Stock transfer error: Source inventory has insufficient stock.' });
    }

    const sourcePrev = sourceInv.quantity;
    sourceInv.quantity -= transfer.quantity;
    await sourceInv.save();

    await InventoryTransaction.create({
      inventory: sourceInv._id,
      menuItem: transfer.menuItem,
      branch: transfer.sourceBranch,
      type: 'Stock transferred',
      changeQuantity: -transfer.quantity,
      previousQuantity: sourcePrev,
      newQuantity: sourceInv.quantity,
      performedBy: req.user.id,
      notes: `Transferred to Destination Branch`
    });

    // 2. Add to Destination Branch Inventory
    let destInv = await Inventory.findOne({ menuItem: transfer.menuItem, branch: transfer.destinationBranch });
    if (!destInv) {
      destInv = await Inventory.create({
        menuItem: transfer.menuItem,
        branch: transfer.destinationBranch,
        quantity: 0
      });
    }

    const destPrev = destInv.quantity;
    destInv.quantity += transfer.quantity;
    await destInv.save();

    await InventoryTransaction.create({
      inventory: destInv._id,
      menuItem: transfer.menuItem,
      branch: transfer.destinationBranch,
      type: 'Stock transferred',
      changeQuantity: transfer.quantity,
      previousQuantity: destPrev,
      newQuantity: destInv.quantity,
      performedBy: req.user.id,
      notes: `Received from Source Branch`
    });

    // 3. Mark Transfer RECEIVED
    transfer.status = 'Received';
    transfer.receivedBy = req.user.id;
    transfer.receivedDate = new Date();
    await transfer.save();

    await logAudit({ user: req.user, action: 'RECEIVE_STOCK_TRANSFER', target: 'StockTransfer', targetId: transfer._id, req });

    res.json({
      success: true,
      message: `Stock transfer received successfully! Destination inventory updated (+${transfer.quantity}), Source inventory updated (-${transfer.quantity}).`,
      data: transfer
    });
  } catch (err) {
    next(err);
  }
};
