const GroupOrder = require('../models/GroupOrder');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const TokenService = require('../services/tokenService');
const { logAudit } = require('../utils/auditLogger');

// POST /api/groups/create
exports.createGroupOrder = async (req, res, next) => {
  try {
    const { branchId, pickupSlotId } = req.body;
    const groupCode = `GRP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const group = await GroupOrder.create({
      groupCode,
      creator: req.user.id,
      branch: branchId,
      pickupWindow: pickupSlotId || null,
      members: [{
        user: req.user.id,
        items: [],
        subtotal: 0,
        paymentStatus: 'Pending'
      }]
    });

    await logAudit({ user: req.user, action: 'CREATE_GROUP_ORDER', target: 'GroupOrder', targetId: group._id, req });

    res.status(201).json({
      success: true,
      message: `Group order created! Share code: ${groupCode}`,
      groupCode,
      group
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/groups/join
exports.joinGroupOrder = async (req, res, next) => {
  try {
    const { groupCode } = req.body;
    const group = await GroupOrder.findOne({ groupCode: groupCode.toUpperCase(), status: 'OPEN' });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Invalid or closed group order code.' });
    }

    const alreadyJoined = group.members.some(m => m.user.toString() === req.user.id);
    if (!alreadyJoined) {
      group.members.push({
        user: req.user.id,
        items: [],
        subtotal: 0,
        paymentStatus: 'Pending'
      });
      await group.save();
    }

    res.json({ success: true, message: `Joined group order ${groupCode}!`, group });
  } catch (err) {
    next(err);
  }
};

// POST /api/groups/:id/add-items (Student selects their own items)
exports.addMemberItems = async (req, res, next) => {
  try {
    const { items = [] } = req.body;
    const group = await GroupOrder.findById(req.params.id);

    if (!group || group.status !== 'OPEN') {
      return res.status(400).json({ success: false, message: 'Group order is locked or closed.' });
    }

    const member = group.members.find(m => m.user.toString() === req.user.id);
    if (!member) {
      return res.status(403).json({ success: false, message: 'You are not a member of this group order.' });
    }

    let subtotal = 0;
    const validatedItems = [];
    for (const item of items) {
      const itemDoc = await MenuItem.findById(item.menuItemId);
      if (itemDoc && itemDoc.isAvailable) {
        const itemTotal = itemDoc.price * item.quantity;
        subtotal += itemTotal;
        validatedItems.push({
          menuItem: itemDoc._id,
          name: itemDoc.name,
          price: itemDoc.price,
          quantity: item.quantity
        });
      }
    }

    member.items = validatedItems;
    member.subtotal = subtotal;

    group.totalAmount = group.members.reduce((acc, m) => acc + m.subtotal, 0);
    await group.save();

    res.json({ success: true, message: 'Group items updated.', group });
  } catch (err) {
    next(err);
  }
};

// POST /api/groups/:id/pay-split (Individual member split payment)
exports.paySplitAmount = async (req, res, next) => {
  try {
    const group = await GroupOrder.findById(req.params.id).populate('members.user', 'name email');
    if (!group) return res.status(404).json({ success: false, message: 'Group order not found.' });

    const member = group.members.find(m => m.user._id.toString() === req.user.id);
    if (!member) return res.status(403).json({ success: false, message: 'Member not found in group.' });

    member.paymentStatus = 'Paid';
    member.transactionId = `SPLIT-TXN-${Date.now()}`;
    await group.save();

    // Check if ALL members have paid
    const allPaid = group.members.every(m => m.paymentStatus === 'Paid');
    if (allPaid && group.status === 'OPEN') {
      group.status = 'SUBMITTED';

      // Create Combined Order for Kitchen
      const combinedItems = [];
      group.members.forEach(m => {
        m.items.forEach(i => combinedItems.push(i));
      });

      const orderCount = await Order.countDocuments();
      const combinedOrder = await Order.create({
        orderNumber: `ORD-GRP-${String(orderCount + 1).padStart(5, '0')}`,
        student: group.creator,
        branch: group.branch,
        orderType: 'Pickup',
        pickupWindow: group.pickupWindow,
        items: combinedItems,
        foodTotal: group.totalAmount,
        finalAmount: group.totalAmount,
        status: 'NEW',
        groupOrder: group._id,
        specialInstructions: `Group Order (${group.groupCode}) - Combined Pickup`
      });

      const tokenDoc = await TokenService.generateTokenForOrder(combinedOrder, { name: 'Group Pickup' }, { name: 'Main Canteen' }, null);
      group.groupTokenNumber = tokenDoc.tokenNumber;
      await group.save();
    }

    res.json({
      success: true,
      message: `Split payment of ₹${member.subtotal} completed successfully!`,
      isGroupComplete: allPaid,
      group
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/groups/:id
exports.getGroupOrderById = async (req, res, next) => {
  try {
    const group = await GroupOrder.findById(req.params.id)
      .populate('members.user', 'name email phone')
      .populate('branch', 'name code')
      .populate('pickupWindow');
    if (!group) return res.status(404).json({ success: false, message: 'Group order not found.' });
    res.json({ success: true, data: group });
  } catch (err) {
    next(err);
  }
};
