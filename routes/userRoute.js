const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');

router.post('/signup/student', userController.verifyStudent);
router.post('/signup/student/auth', userController.addStudent);

router.post('/signup/faculty', userController.verifyFaculty);
router.post('/signup/faculty/auth', userController.addFaculty);

router.post('/login', userController.loginUser);

// TODO: should all errors be handled by a middleware?

module.exports = router;