const { Notification } = require('../models/MiscModels');

exports.getUserNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 }).limit(30);
    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user.id }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
};
