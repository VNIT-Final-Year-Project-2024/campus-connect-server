const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubs');
const authMiddleware = require('../middlewares/authMiddleware');

// create new club route
router.post('/create', authMiddleware, clubController.newClub);

// fetch all clubs route
router.get('/view', authMiddleware, clubController.showAllClubs);

module.exports = router;