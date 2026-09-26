const express = require('express');
const router = express.Router();
const ingredientController = require('../controllers/ingredientController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, authorize('Admin', 'Kitchen Staff', 'Branch Manager'), ingredientController.getIngredients);
router.post('/', protect, authorize('Admin', 'Kitchen Staff', 'Branch Manager'), ingredientController.createOrUpdateIngredient);
router.get('/predictions', protect, authorize('Admin', 'Branch Manager', 'Kitchen Staff'), ingredientController.getPredictions);

module.exports = router;
