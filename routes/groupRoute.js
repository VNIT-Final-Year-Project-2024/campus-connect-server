const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groups');
const authMiddleware = require('../middlewares/authMiddleware');
const timeMiddleware = require('../middlewares/timeMiddleware');

// create user group route
router.post('/create/user', authMiddleware, groupController.newUserGroup);

// create chatroom group route
router.post('/create/chatroom', authMiddleware, groupController.newChatroomGroup);

// view user groups route
router.get('/view/users', authMiddleware, timeMiddleware, groupController.showUserGroups);

// view chatroom groups route
router.get('/view/chatrooms', authMiddleware, timeMiddleware, groupController.showChatroomGroups);

// search chatroom groups route
router.get('/search/users', authMiddleware, timeMiddleware, groupController.searchUserGroups);

// search chatroom groups route
router.get('/search/chatrooms', authMiddleware, timeMiddleware, groupController.searchChatroomGroups);

// fetch chatroom details route
router.get('/details', authMiddleware, groupController.fetchChatroomInfo);

module.exports = router;