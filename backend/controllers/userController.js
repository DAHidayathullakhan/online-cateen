const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const { logAudit } = require('../utils/auditLogger');
const bcrypt = require('bcryptjs');

// GET /api/users (Admin)
exports.getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter).populate('branch', 'name code').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/profile (Student profile update)
exports.updateStudentProfile = async (req, res, next) => {
  try {
    const { phone, hostelBuilding, roomNumber } = req.body;
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, { phone });

    let profile = await StudentProfile.findOne({ user: userId });
    if (profile) {
      if (hostelBuilding) profile.hostelBuilding = hostelBuilding;
      if (roomNumber) profile.roomNumber = roomNumber;
      await profile.save();
    }

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id/role (Admin)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    await user.save();

    await logAudit({ user: req.user, action: 'UPDATE_USER_ROLE', target: 'User', targetId: user._id, details: { role, isActive }, req });

    res.json({ success: true, message: 'User updated successfully.', data: user });
  } catch (err) {
    next(err);
  }
};
