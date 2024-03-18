const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubs');
const authMiddleware = require('../middlewares/authMiddleware');
const timeMiddleware = require('../middlewares/timeMiddleware');

// create new club route
router.post('/create', authMiddleware, clubController.newClub);

// fetch all clubs route
router.get('/view', authMiddleware, clubController.showAllClubs);

// fetch club details route
router.get('/details', authMiddleware, clubController.fetchClubInfo);

// send message inside club chatroom route
router.post('/messages/send', authMiddleware, roleMiddleware, clubController.sendMessage);

// view messages inside club chatroom route
router.get('/messages/view', authMiddleware, timeMiddleware, clubController.viewMessages);

// create chatroom inside club route
router.post('/chatrooms/create', authMiddleware, clubController.newChatroomGroup);

// view chatrooms inside club route
router.get('/chatrooms/view', authMiddleware, timeMiddleware, clubController.showChatroomGroups);

// search chatroom inside club route
router.get('/chatrooms/search', authMiddleware, timeMiddleware, clubController.searchChatroomGroups);

module.exports = router;