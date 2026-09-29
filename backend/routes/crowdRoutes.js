const express = require('express');
const router = express.Router();
const crowdController = require('../controllers/crowdController');

// Public or student route for live queue & crowd status
router.get('/status', crowdController.getCrowdStatus);

module.exports = router;
