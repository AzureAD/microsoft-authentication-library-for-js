/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require('express');
const authController = require('../controller/authController');
const router = express.Router();

router.get('/signin', authController.signIn);
router.get('/signout', authController.signOut);
router.post('/redirect', authController.handleRedirect);

module.exports = router;
