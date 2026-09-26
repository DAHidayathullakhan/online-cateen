const mongoose = require('mongoose');

const refundRequestSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['Under Review', 'Approved', 'Processing', 'Completed', 'Rejected'],
      default: 'Under Review',
      index: true
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completionDate: Date
  },
  { timestamps: true }
);

const complaintTicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    category: {
      type: String,
      enum: ['Wrong Food', 'Missing Item', 'Late Delivery', 'Payment Issue', 'Poor Food Quality', 'Token Problem', 'Other'],
      required: true
    },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['Submitted', 'Assigned', 'Investigating', 'Resolved', 'Closed'],
      default: 'Submitted',
      index: true
    },
    responses: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: String,
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

const lostFoundItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, enum: ['Lost', 'Found'], required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: String, required: true },
    contactMethod: { type: String, required: true },
    status: {
      type: String,
      enum: ['Reported', 'Matched', 'Returned', 'Closed'],
      default: 'Reported'
    },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = {
  RefundRequest: mongoose.model('RefundRequest', refundRequestSchema),
  ComplaintTicket: mongoose.model('ComplaintTicket', complaintTicketSchema),
  LostFoundItem: mongoose.model('LostFoundItem', lostFoundItemSchema)
};
