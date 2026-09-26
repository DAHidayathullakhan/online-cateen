const { Holiday } = require('../models/SupplyChainModels');
const { SystemSetting } = require('../models/MiscModels');
const { logAudit } = require('../utils/auditLogger');

exports.getHolidays = async (req, res, next) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    const examSetting = await SystemSetting.findOne({ key: 'EXAM_MODE' });

    res.json({
      success: true,
      examMode: examSetting ? Boolean(examSetting.value) : false,
      count: holidays.length,
      data: holidays
    });
  } catch (err) {
    next(err);
  }
};

exports.addHoliday = async (req, res, next) => {
  try {
    const { date, title, type, isOrderingDisabled } = req.body;
    const holiday = await Holiday.create({ date, title, type, isOrderingDisabled });
    await logAudit({ user: req.user, action: 'ADD_HOLIDAY_CALENDAR', target: 'Holiday', targetId: holiday._id, req });
    res.status(201).json({ success: true, data: holiday });
  } catch (err) {
    next(err);
  }
};

exports.toggleExamMode = async (req, res, next) => {
  try {
    const { isExamMode } = req.body;
    const setting = await SystemSetting.findOneAndUpdate(
      { key: 'EXAM_MODE' },
      { value: Boolean(isExamMode), description: 'Exam-Time Mode System Switch' },
      { upsert: true, new: true }
    );
    await logAudit({ user: req.user, action: 'TOGGLE_EXAM_MODE', target: 'SystemSetting', targetId: 'EXAM_MODE', req });
    res.json({ success: true, message: `Exam-time mode is now ${setting.value ? 'ENABLED' : 'DISABLED'}!`, data: setting });
  } catch (err) {
    next(err);
  }
};
