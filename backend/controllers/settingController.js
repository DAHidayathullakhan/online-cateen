const { SystemSetting } = require('../models/MiscModels');
const { logAudit } = require('../utils/auditLogger');

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await SystemSetting.find();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

exports.updateSetting = async (req, res, next) => {
  try {
    const { key, value, description } = req.body;
    const setting = await SystemSetting.findOneAndUpdate(
      { key },
      { value, description },
      { upsert: true, new: true }
    );
    await logAudit({ user: req.user, action: 'UPDATE_SYSTEM_SETTING', target: 'SystemSetting', targetId: key, req });
    res.json({ success: true, data: setting });
  } catch (err) {
    next(err);
  }
};
