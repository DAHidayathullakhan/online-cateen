const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    }
  },
  { timestamps: true }
);

favoriteSchema.index({ student: 1, menuItem: 1 }, { unique: true });

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'order_placed',
        'order_accepted',
        'order_preparing',
        'order_ready',
        'delivery_started',
        'order_delivered',
        'order_cancelled',
        'low_stock',
        'branch_closure',
        'transfer_update',
        'announcement'
      ],
      default: 'announcement'
    },
    read: { type: Boolean, default: false },
    link: { type: String }
  },
  { timestamps: true }
);

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: { type: String, required: true },
    target: { type: String },
    targetId: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String }
  },
  { timestamps: true }
);

const systemSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    description: { type: String }
  },
  { timestamps: true }
);

module.exports = {
  Favorite: mongoose.model('Favorite', favoriteSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  AuditLog: mongoose.model('AuditLog', auditLogSchema),
  SystemSetting: mongoose.model('SystemSetting', systemSettingSchema)
};
