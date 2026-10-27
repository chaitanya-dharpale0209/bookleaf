const express = require('express');
const router = express.Router();
const {
  createTicket,
  getAuthorTickets,
  getAllTickets,
  getTicketById,
  addMessage,
  updateTicket,
  addInternalNote,
  regenerateAiDraft
} = require('../controllers/ticketController');
const { verifyToken, requireAdmin, requireAuthorOrAdmin } = require('../middleware/auth');

// All ticket routes require authentication
router.use(verifyToken);

// Author endpoints
router.post('/', requireAuthorOrAdmin, createTicket);
router.get('/my-tickets', requireAuthorOrAdmin, getAuthorTickets);

// Admin endpoints
router.get('/', requireAdmin, getAllTickets);
router.patch('/:id', requireAdmin, updateTicket);
router.post('/:id/notes', requireAdmin, addInternalNote);
router.post('/:id/regenerate-ai', requireAdmin, regenerateAiDraft);

// Shared endpoints (Author & Admin with individual access controls inside controller)
router.get('/:id', getTicketById);
router.post('/:id/messages', addMessage);

module.exports = router;
