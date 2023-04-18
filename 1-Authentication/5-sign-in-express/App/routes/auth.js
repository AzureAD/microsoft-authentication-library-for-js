const express = require('express');
const authController = require('../controller/authController');
const router = express.Router();

router.get('/signin', authController.signinUser);
router.get('/signout', authController.signoutUser);
router.post('/redirect', authController.handleRedirect);

module.exports = router;
