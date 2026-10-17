const { collegeService } = require('../services/supabaseService');

exports.getColleges = async (req, res, next) => {
  try {
    const colleges = await collegeService.getColleges();
    res.json({ success: true, count: colleges.length, data: colleges });
  } catch (err) {
    next(err);
  }
};

exports.getCollegeById = async (req, res, next) => {
  try {
    const college = await collegeService.getCollegeById(req.params.id);
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found.' });
    }
    res.json({ success: true, data: college });
  } catch (err) {
    next(err);
  }
};

exports.registerCollege = async (req, res, next) => {
  try {
    const { name, code, email, phone, address, logoUrl, adminName, adminPassword } = req.body;
    if (!name || !code || !email || !adminName || !adminPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide college name, code, email, administrator name, and password.'
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

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.updateSchedule = async (req, res, next) => {
  try {
    const result = await collegeService.updateSchedule(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.getCollegeMenu = async (req, res, next) => {
  try {
    const { category } = req.query;
    const items = await collegeService.getCollegeMenu(req.params.id, category);
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

exports.createCollegeMenuItem = async (req, res, next) => {
  try {
    const { name, price, category } = req.body;
    if (!name || price === undefined || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide dish name, price (INR), and category.'
      });
    }
    const item = await collegeService.createCollegeMenuItem(req.params.id, req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

exports.updateCollegeMenuItem = async (req, res, next) => {
  try {
    const item = await collegeService.updateCollegeMenuItem(req.params.itemId, req.body);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

exports.deleteCollegeMenuItem = async (req, res, next) => {
  try {
    const result = await collegeService.deleteCollegeMenuItem(req.params.itemId);
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
};

exports.getCollegeOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const orders = await collegeService.getCollegeOrders(req.params.id, status);
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    next(err);
  }
};

exports.updateCollegeOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Please provide target status.' });
    }
    const updated = await collegeService.updateCollegeOrderStatus(req.params.orderId, status);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

exports.getCollegeAnalytics = async (req, res, next) => {
  try {
    const analytics = await collegeService.getCollegeAnalytics(req.params.id);
    res.json({ success: true, data: analytics });
  } catch (err) {
    next(err);
  }
};
