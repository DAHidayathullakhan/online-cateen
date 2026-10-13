const Branch = require('../models/Branch');
const PickupWindow = require('../models/PickupWindow');
const { isSupabaseConfigured, branchService } = require('../services/supabaseService');
const { logAudit } = require('../utils/auditLogger');

// GET /api/branches
exports.getBranches = async (req, res, next) => {
  try {
    if (isSupabaseConfigured()) {
      const branches = await branchService.getBranches();
      return res.json({ success: true, data: branches });
    }

    const branches = await Branch.find({ isActive: true });
    res.json({ success: true, data: branches });
  } catch (err) {
    next(err);
  }
};

// GET /api/branches/:id
exports.getBranchById = async (req, res, next) => {
  try {
    if (isSupabaseConfigured()) {
      const branch = await branchService.getBranchById(req.params.id);
      if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
      return res.json({ success: true, data: branch });
    }

    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    res.json({ success: true, data: branch });
  } catch (err) {
    next(err);
  }
};

// POST /api/branches (Admin)
exports.createBranch = async (req, res, next) => {
  try {
    const { name, code, location, openTime, closeTime } = req.body;
    const branch = await Branch.create({
      name,
      code,
      location,
      operatingHours: { open: openTime || '08:00 AM', close: closeTime || '08:00 PM' }
    });
    await logAudit({ user: req.user, action: 'CREATE_BRANCH', target: 'Branch', targetId: branch._id, req });
    res.status(201).json({ success: true, data: branch });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/branches/:id/toggle-closure (Admin / Branch Manager)
exports.toggleEmergencyClosure = async (req, res, next) => {
  try {
    const { isClosed, closureMessage } = req.body;
    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });

    branch.isClosed = Boolean(isClosed);
    branch.closureMessage = closureMessage || (isClosed ? `${branch.name} is temporarily closed due to high load / emergency.` : '');
    await branch.save();

    // Disable active pickup slots if branch is closed
    if (isClosed) {
      await PickupWindow.updateMany({ branch: branch._id }, { isActive: false });
    } else {
      await PickupWindow.updateMany({ branch: branch._id }, { isActive: true });
    }

    await logAudit({
      user: req.user,
      action: isClosed ? 'EMERGENCY_BRANCH_CLOSE' : 'BRANCH_REOPEN',
      target: 'Branch',
      targetId: branch._id,
      details: { closureMessage: branch.closureMessage },
      req
    });

    res.json({
      success: true,
      message: `Branch ${branch.name} is now ${branch.isClosed ? 'CLOSED' : 'OPEN'}.`,
      data: branch
    });
  } catch (err) {
    next(err);
  }
};
