const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { isSupabaseConfigured, authService, collegeService } = require('../services/supabaseService');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'smart_campus_canteen_jwt_secret_key_2026_super_secure',
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, studentId, degreeLevel, programType, course, department, collegeId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    if (!isSupabaseConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Database service (Supabase) is temporarily unavailable. Please verify your connection configuration.'
      });
    }

    const user = await authService.registerStudent({
      name,
      email,
      password,
      phone,
      role: role || 'Student',
      studentId,
      degreeLevel,
      programType,
      course,
      department,
      collegeId
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
        studentId: user.studentId,
        collegeId: user.collegeId
      }
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    return res.status(400).json({ success: false, message: err.message || 'Registration failed.' });
  }
};

exports.registerCollege = async (req, res, next) => {
  try {
    const { name, code, email, phone, address, logoUrl, adminName, adminPassword } = req.body;

    if (!name || !code || !email || !adminName || !adminPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide college name, code, official email, admin name, and admin password.'
      });
    }

    const result = await collegeService.registerCollege({
      name,
      code,
      email,
      phone,
      address,
      logoUrl,
      adminName,
      adminPassword
    });

    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    return res.status(400).json({ success: false, message: err.message || 'College onboarding failed.' });
  }
};

exports.login = async (req, res, next) => {
  try {
    const loginKey = (req.body.loginKey || req.body.email || req.body.studentId || '').trim();
    const password = req.body.password;

    if (!loginKey || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email or Student ID and password.' });
    }

    if (!isSupabaseConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Database service (Supabase) is temporarily unavailable. Please verify your connection configuration.'
      });
    }

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
        branch: user.branch,
        collegeId: user.collegeId
      }
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Login failed.' });
  }
};

exports.getMe = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ success: false, message: 'Database service unavailable.' });
    }

    const user = await authService.findUserById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({
      success: true,
      data: user
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Error fetching user profile.' });
  }
};

exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
};
