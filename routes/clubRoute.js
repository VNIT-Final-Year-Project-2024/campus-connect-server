const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubs');
const authMiddleware = require('../middlewares/authMiddleware');
const timeMiddleware = require('../middlewares/timeMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// fetch club details route
router.get('/details', authMiddleware, roleMiddleware, clubController.fetchChatroomInfo);

// send message inside club chatroom route
router.post('/messages/send', authMiddleware, roleMiddleware, clubController.sendMessage);

// view messages inside club chatroom route
router.get('/messages/view', authMiddleware, roleMiddleware, timeMiddleware, clubController.viewMessages);

// create chatroom inside club route
router.post('/chatrooms/create', authMiddleware, roleMiddleware, clubController.newChatroomGroup);

// view chatrooms inside club route
router.get('/chatrooms/view', authMiddleware, roleMiddleware, timeMiddleware, clubController.showChatroomGroups);

// search chatroom inside club route
router.get('/chatrooms/search', authMiddleware, roleMiddleware, timeMiddleware, clubController.searchChatroomGroups);

// fetch details for chatroom inside club route
router.get('/chatrooms/details', authMiddleware, roleMiddleware, clubController.fetchChatroomInfo);

module.exports = router;