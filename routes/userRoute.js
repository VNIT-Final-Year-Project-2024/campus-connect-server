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

// auth middleware - for protected routes
const authMiddleware = require('../middlewares/authMiddleware');

// user search route
router.get('/search', authMiddleware, userController.searchUser);

// user details route
router.get('/details', authMiddleware, userController.fetchUserInfo);

module.exports = router;