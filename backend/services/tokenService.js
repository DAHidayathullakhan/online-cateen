const QRCode = require('qrcode');
const DigitalToken = require('../models/DigitalToken');

class TokenService {
  static async generateTokenForOrder(order, student, branch, pickupWindow) {
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const year = new Date().getFullYear();
    const tokenNumber = `CAN-${year}-${randomHex}`;

    const qrPayload = JSON.stringify({
      tokenNumber,
      orderId: order._id,
      studentName: student.name,
      branchName: branch.name,
      pickupWindow: pickupWindow ? `${pickupWindow.startTime} - ${pickupWindow.endTime}` : 'Room Delivery'
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload);

    const tokenDoc = await DigitalToken.create({
      tokenNumber,
      order: order._id,
      student: student._id,
      branch: branch._id,
      pickupWindow: pickupWindow ? pickupWindow._id : null,
      qrCodeDataUrl,
      status: 'Active'
    });

    return tokenDoc;
  }

  static async verifyToken(tokenNumber, operatorUser) {
    const tokenDoc = await DigitalToken.findOne({ tokenNumber }).populate('order student branch pickupWindow');

    if (!tokenDoc) {
      return { success: false, message: 'Invalid token number. Token not found in system.' };
    }

    if (tokenDoc.status === 'Used') {
      return { success: false, message: 'Token has already been verified and used.' };
    }

    if (tokenDoc.status === 'Cancelled' || tokenDoc.status === 'Expired') {
      return { success: false, message: `Token cannot be verified because its status is ${tokenDoc.status}.` };
    }

    tokenDoc.status = 'Used';
    tokenDoc.verifiedAt = new Date();
    tokenDoc.verifiedBy = operatorUser._id;
    await tokenDoc.save();

    return {
      success: true,
      message: 'Order collected successfully.',
      token: tokenDoc
    };
  }
}

module.exports = TokenService;
