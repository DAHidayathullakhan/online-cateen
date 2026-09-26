const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', branchController.getBranches);
router.get('/:id', branchController.getBranchById);
router.post('/', protect, authorize('Admin'), branchController.createBranch);
router.patch('/:id/toggle-closure', protect, authorize('Admin', 'Branch Manager'), branchController.toggleEmergencyClosure);

module.exports = router;
