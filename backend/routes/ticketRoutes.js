const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, ticketController.createTicket);
router.get('/', protect, ticketController.getTickets);
router.post('/:id/reply', protect, ticketController.replyTicket);

module.exports = router;
