const express = require('express');
const authController = require('../controller/authController');
const router = express.Router();

router.get('/signin', authController.signIn);
router.get('/signout', authController.signOut);
router.post('/redirect', authController.handleRedirect);

module.exports = router;
