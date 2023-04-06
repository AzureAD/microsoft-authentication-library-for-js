/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require('express');
const router = express.Router();
const { getToken } = require('./auth');
const { protectedResources } = require('../authConfig');
const todolistController = require('../controller/todolistController');

// custom middleware to check auth state
function isAuthenticated(req, res, next) {
    if (!req.session.isAuthenticated) {
        return res.redirect('/auth/signin'); // redirect to sign-in route
    }

    next();
}

router.get(
    '/id',
    isAuthenticated, // check if user is authenticated
    async function (req, res, next) {
        const claims = {
            name: req.session.account.idTokenClaims.name,
            preferred_username: req.session.account.idTokenClaims.preferred_username,
            oid: req.session.account.idTokenClaims.oid,
            sub: req.session.account.idTokenClaims.sub,
        };
        res.render('id', {
            claims: claims,
            isAuthenticated: req.session.isAuthenticated,
        });
    }
);

module.exports = router;