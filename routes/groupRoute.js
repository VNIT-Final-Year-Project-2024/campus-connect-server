const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groups');
const authMiddleware = require('../middlewares/authMiddleware');

// create group route
router.post('/create', authMiddleware, groupController.newGroup);

// view user groups route
router.get('/view/users', authMiddleware, groupController.showUserGroups);

// view chatroom groups route
router.get('/view/chatrooms', authMiddleware, groupController.showChatroomGroups);

module.exports = router;