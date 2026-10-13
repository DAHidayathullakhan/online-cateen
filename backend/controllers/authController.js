const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { isSupabaseConfigured, authService } = require('../services/supabaseService');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'smart_campus_canteen_jwt_secret_key_2026_super_secure',
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, studentId, degreeLevel, programType, course, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (isSupabaseConfigured()) {
      const existingUser = await authService.findUserByLogin(email);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'User with this email already exists.' });
      }

      const user = await authService.createUser({
        name,
        email,
        passwordHash,
        phone,
        role: role || 'Student',
        studentId,
        degreeLevel,
        programType,
        course,
        department
      });

      const token = generateToken(user.id || user._id);
      return res.status(201).json({
        success: true,
        token,
        data: {
          id: user.id || user._id,
          _id: user.id || user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          studentId: user.studentId
        }
      });
    }

    // Fallback: MongoDB
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: passwordHash,
      phone: phone || '',
      role: role || 'Student',
      studentId: studentId ? studentId.toUpperCase().trim() : undefined
    });

    if (user.role === 'Student' || user.role === "Master's Student") {
      await StudentProfile.create({
        user: user._id,
        studentId: user.studentId || `STU-${Date.now().toString().slice(-6)}`,
        degreeLevel: degreeLevel || 'Degree',
        programType: programType || 'BCA',
        course: course || 'BCA',
        department: department || 'Computer Applications'
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      data: {
        id: user._id,
        _id: user._id,
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

exports.login = async (req, res, next) => {
  try {
    const loginKey = (req.body.loginKey || req.body.email || req.body.studentId || '').trim();
    const password = req.body.password;

    if (!loginKey || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email or Student ID and password.' });
    }

    if (isSupabaseConfigured()) {
      const user = await authService.findUserByLogin(loginKey);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials. Password incorrect.' });
      }

      const token = generateToken(user.id || user._id);
      return res.json({
        success: true,
        token,
        data: {
          id: user.id || user._id,
          _id: user.id || user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          studentId: user.studentId,
          branch: user.branch
        }
      });
    }

    // Fallback: MongoDB
    const user = await User.findOne({
      $or: [
        { email: loginKey.toLowerCase() },
        { studentId: loginKey.toUpperCase() }
      ]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Password incorrect.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      data: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        branch: user.branch
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    if (isSupabaseConfigured()) {
      const user = await authService.findUserById(req.user.id || req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      return res.json({
        success: true,
        data: user
      });
    }

    const user = await User.findById(req.user.id).select('-password');
    let profile = null;
    if (user.role === 'Student' || user.role === "Master's Student") {
      profile = await StudentProfile.findOne({ user: user._id });
    }

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        profile
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
};
