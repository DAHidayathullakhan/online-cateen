const { ComplaintTicket } = require('../models/SupportModels');
const { logAudit } = require('../utils/auditLogger');

// POST /api/tickets (Create Ticket)
exports.createTicket = async (req, res, next) => {
  try {
    const { category, orderId, description } = req.body;
    const ticketNumber = `TCK-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const ticket = await ComplaintTicket.create({
      ticketNumber,
      student: req.user.id,
      category,
      order: orderId || null,
      description,
      status: 'Submitted'
    });

    await logAudit({ user: req.user, action: 'CREATE_COMPLAINT_TICKET', target: 'ComplaintTicket', targetId: ticket._id, req });

    res.status(201).json({ success: true, message: `Support ticket ${ticketNumber} created.`, data: ticket });
  } catch (err) {
    next(err);
  }
};

// GET /api/tickets
exports.getTickets = async (req, res, next) => {
  try {
    const filter = req.user.role === 'Student' || req.user.role === "Master's Student" ? { student: req.user.id } : {};
    const tickets = await ComplaintTicket.find(filter)
      .populate('student', 'name email phone studentId')
      .populate('order', 'orderNumber finalAmount')
      .populate('responses.user', 'name role')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (err) {
    next(err);
  }
};

// POST /api/tickets/:id/reply (Reply / Update Status)
exports.replyTicket = async (req, res, next) => {
  try {
    const { message, status } = req.body;
    const ticket = await ComplaintTicket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ success: false, message: 'Support ticket not found.' });

    if (message) {
      ticket.responses.push({
        user: req.user.id,
        message
      });
    }

    if (status) ticket.status = status;
    await ticket.save();

    res.json({ success: true, message: 'Ticket updated.', data: ticket });
  } catch (err) {
    next(err);
  }
};
