const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');

// student signup routes
router.post('/signup/student', userController.verifyStudent);
router.post('/signup/student/auth', userController.addStudent);

// faculty signup routes
router.post('/signup/faculty', userController.verifyFaculty);
router.post('/signup/faculty/auth', userController.addFaculty);

// user login route
router.post('/login', userController.loginUser);

const authMiddleware = require('../middlewares/authMiddleware');
// user search route
router.get('/search', authMiddleware, userController.searchUser);

// TODO: should all errors be handled by a middleware?

module.exports = router;