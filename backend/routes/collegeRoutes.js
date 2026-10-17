const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public endpoints
router.get('/', collegeController.getColleges);
router.post('/', collegeController.registerCollege);
router.get('/:id', collegeController.getCollegeById);
router.get('/:id/menu', collegeController.getCollegeMenu);

// Admin & College Management endpoints
router.put('/:id/schedule', protect, collegeController.updateSchedule);
router.post('/:id/menu', protect, collegeController.createCollegeMenuItem);
router.put('/:id/menu/:itemId', protect, collegeController.updateCollegeMenuItem);
router.delete('/:id/menu/:itemId', protect, collegeController.deleteCollegeMenuItem);
router.get('/:id/orders', protect, collegeController.getCollegeOrders);
router.put('/:id/orders/:orderId/status', protect, collegeController.updateCollegeOrderStatus);
router.get('/:id/analytics', protect, collegeController.getCollegeAnalytics);

module.exports = router;
