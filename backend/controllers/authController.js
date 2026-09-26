const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const { logAudit } = require('../utils/auditLogger');

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'smart_campus_canteen_jwt_secret_token_key_2026';
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role, branch: user.branch },
    secret,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role = 'Student',
      studentId,
      degreeLevel,
      programType,
      course,
      department,
      year,
      semester,
      section,
      hostelBuilding,
      roomNumber,
      branch
    } = req.body;

    // Check duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Password hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      role,
      studentId: studentId || `STU-${Math.floor(10000 + Math.random() * 90000)}`,
      branch: branch || null
    });

    // Create Student Profile if role is Student or Master's Student
    if (role === 'Student' || role === "Master's Student") {
      await StudentProfile.create({
        user: user._id,
        studentId: user.studentId,
        degreeLevel: degreeLevel || (role === "Master's Student" ? "Master's" : 'Degree'),
        programType: programType || (role === "Master's Student" ? 'MCA' : 'BCA'),
        course: course || 'Computer Applications',
        department: department || 'Department of Computer Science',
        year: year || '2nd Year',
        semester: semester || '3rd Semester',
        section: section || 'A',
        hostelBuilding: hostelBuilding || 'Hostel A',
        roomNumber: roomNumber || '203'
      });
    }

    await logAudit({ user, action: 'USER_REGISTERED', target: 'User', targetId: user._id, req });

    const token = generateToken(user);
    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId
      }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password').populate('branch');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact campus admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    await logAudit({ user, action: 'USER_LOGIN', target: 'User', targetId: user._id, req });

    let profile = null;
    if (user.role === 'Student' || user.role === "Master's Student") {
      profile = await StudentProfile.findOne({ user: user._id });
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        studentId: user.studentId,
        branch: user.branch,
        profile
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('branch');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let profile = null;
    if (user.role === 'Student' || user.role === "Master's Student") {
      profile = await StudentProfile.findOne({ user: user._id });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        studentId: user.studentId,
        branch: user.branch,
        profile
      }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
};
