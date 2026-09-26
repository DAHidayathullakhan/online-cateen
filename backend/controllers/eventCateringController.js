const { EventCatering } = require('../models/SupplyChainModels');
const { logAudit } = require('../utils/auditLogger');

exports.getCateringRequests = async (req, res, next) => {
  try {
    const requests = await EventCatering.find()
      .populate('assignedBranch', 'name code')
      .populate('requestedBy', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    next(err);
  }
};

exports.createCateringRequest = async (req, res, next) => {
  try {
    const { eventTitle, department, guestCount, eventDate, eventTime, location, items, specialRequirements } = req.body;

    const request = await EventCatering.create({
      eventTitle,
      department,
      guestCount: Number(guestCount),
      eventDate,
      eventTime,
      location,
      items: items || [],
      specialRequirements,
      requestedBy: req.user.id
    });

    await logAudit({ user: req.user, action: 'CREATE_CATERING_REQUEST', target: 'EventCatering', targetId: request._id, req });

    res.status(201).json({ success: true, message: 'Bulk catering request submitted.', data: request });
  } catch (err) {
    next(err);
  }
};

exports.updateCateringStatus = async (req, res, next) => {
  try {
    const { status, assignedBranchId } = req.body;
    const request = await EventCatering.findById(req.params.id);

    if (!request) return res.status(404).json({ success: false, message: 'Catering request not found.' });

    if (status) request.status = status;
    if (assignedBranchId) request.assignedBranch = assignedBranchId;
    await request.save();

    res.json({ success: true, message: `Catering request status updated to ${status}.`, data: request });
  } catch (err) {
    next(err);
  }
};
