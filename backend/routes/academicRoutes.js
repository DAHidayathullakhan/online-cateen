const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/hierarchy', academicController.getAcademicHierarchy);
router.post('/program-type', protect, authorize('Admin'), academicController.createProgramType);
router.post('/course', protect, authorize('Admin'), academicController.createCourse);
router.post('/department', protect, authorize('Admin'), academicController.createDepartment);

module.exports = router;
