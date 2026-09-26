const { Notification } = require('../models/MiscModels');

class NotificationService {
  static async sendNotification({ recipientId, title, message, type, link }) {
    try {
      const notification = await Notification.create({
        recipient: recipientId,
        title,
        message,
        type: type || 'announcement',
        link: link || ''
      });
      console.log(`[NotificationSent] To User ${recipientId}: "${title}"`);
      return notification;
    } catch (err) {
      console.error('Failed to create notification:', err.message);
    }
  }
}

module.exports = NotificationService;
