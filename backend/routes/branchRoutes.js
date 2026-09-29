const express = require('express');
const router = express.Router();
const Branch = require('../models/Branch');

router.get('/', async (req, res, next) => {
  try {
    const branches = await Branch.find({});
    res.json({ success: true, count: branches.length, data: branches });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
