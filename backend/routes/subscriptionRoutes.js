const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/plans', subscriptionController.getMealPlans);
router.get('/my-subscriptions', protect, subscriptionController.getMySubscriptions);
router.post('/buy', protect, subscriptionController.buySubscription);
router.post('/consume', protect, subscriptionController.consumeSubscriptionMeal);

module.exports = router;
