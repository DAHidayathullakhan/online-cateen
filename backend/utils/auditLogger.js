const { AuditLog } = require('../models/MiscModels');

const logAudit = async ({ user, action, target, targetId, details, req }) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null;
    await AuditLog.create({
      user: user ? user._id || user.id : null,
      action,
      target,
      targetId: targetId ? targetId.toString() : null,
      details,
      ipAddress
    });
  } catch (err) {
    console.error('Audit log creation failed:', err.message);
  }
};

module.exports = { logAudit };
