const { LostFoundItem } = require('../models/SupportModels');

exports.getLostFoundItems = async (req, res, next) => {
  try {
    const items = await LostFoundItem.find().sort({ createdAt: -1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

exports.reportLostFoundItem = async (req, res, next) => {
  try {
    const { title, category, description, location, date, contactMethod } = req.body;
    const item = await LostFoundItem.create({
      title,
      category,
      description,
      location,
      date: date || new Date().toISOString().split('T')[0],
      contactMethod,
      reportedBy: req.user.id
    });
    res.status(201).json({ success: true, message: 'Lost/Found item reported.', data: item });
  } catch (err) {
    next(err);
  }
};
