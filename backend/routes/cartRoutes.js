const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.post('/calculate', cartController.calculateCart);

module.exports = router;
