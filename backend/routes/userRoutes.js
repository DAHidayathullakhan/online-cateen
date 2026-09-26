const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, authorize('Admin'), userController.getUsers);
router.put('/profile', protect, userController.updateStudentProfile);
router.patch('/:id/role', protect, authorize('Admin'), userController.updateUserRole);

module.exports = router;
