const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messages');
const authMiddleware = require('../middlewares/authMiddleware');

// send message route
router.post('/send', authMiddleware, messageController.sendMessage);

// view messages route
router.get('/view', authMiddleware, messageController.viewMessages);

module.exports = router;