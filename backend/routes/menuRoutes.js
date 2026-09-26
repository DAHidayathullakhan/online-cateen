const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', menuController.getMenuItems);
router.get('/favorites', protect, menuController.getStudentFavorites);
router.get('/:id', menuController.getMenuItemById);
router.post('/', protect, authorize('Admin', 'Canteen Operator', 'Branch Manager'), menuController.createMenuItem);
router.put('/:id', protect, authorize('Admin', 'Canteen Operator', 'Branch Manager'), menuController.updateMenuItem);
router.delete('/:id', protect, authorize('Admin', 'Canteen Operator', 'Branch Manager'), menuController.deleteMenuItem);
router.post('/favorites/:id', protect, menuController.toggleFavorite);

module.exports = router;
