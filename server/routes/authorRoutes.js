const express = require('express');
const router = express.Router();
const { getMyBooks, getAuthorStats } = require('../controllers/authorController');
const { verifyToken, requireAuthorOrAdmin } = require('../middleware/auth');

router.use(verifyToken);
router.use(requireAuthorOrAdmin);

router.get('/books', getMyBooks);
router.get('/stats', getAuthorStats);

module.exports = router;
