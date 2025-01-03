var express = require('express');
var router = express.Router();
var path = require('path');

const msalInstance = require('./msal');

const dotenv = require("dotenv");
dotenv.config();

router.use('/lib', express.static(path.join(__dirname, '../node_modules/@azure/msal-browser/lib')));

// Route to automatically redirect the user to login
router.get('/login', (req, res) => {
    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: "https://localhost:3000/auth/server-redirect",
        responseMode: "form_post",
        extraQueryParameters: {
            "nativebroker": "1",
        }
    };

    // Set request state to use hybrid spa or implicit flow 
    if (req.query.hybrid) {
        authCodeUrlParameters.state = "hybrid=true";
        console.log("AuthCodeURL Params", authCodeUrlParameters);
    } else if (req.query.implicit) {
        authCodeUrlParameters.state = "implicit=true"
    }

    // Generate auth code url and redirect the user
    msalInstance.getAuthCodeUrl(authCodeUrlParameters)
        .then((response) => {
            res.redirect(response);
        });
});

// Route to capture auth code that will be posted by AAD
router.post('/server-redirect', (req, res) => {

    console.log("Inside server redirect.");
    const tokenRequest = {
        code: req.body.code,
        scopes: ["user.read"],
        redirectUri: "https://localhost:3000/auth/server-redirect"
    };

    // Check if request is done via hybrid spa or implicit flow
    const useHybrid = req.body.state === "hybrid=true";
    const useImplicit = req.body.state === "implicit=true";

    // Parameters needed for hybrid spa test flight
    tokenRequest.tokenQueryParameters = {
        dc: "ESTS-PUB-WUS2-AZ1-FD000-TEST1",
        hybridspa: "true",
    }

    // If using hybrid spa flow, enable feature flag to get additional auth code
    if (useHybrid) {
        console.log('Hybrid enabled');
        tokenRequest.enableSpaAuthorizationCode = true;
        tokenRequest.tokenBodyParameters = {
            return_spa_code: "1"
        };
    } else {
        console.log('Hybrid disabled');
    }

    const timeLabel = "Time for acquireTokenByCode for CCA";
    console.log("Acquire Token Request for CCA: ", tokenRequest);
    console.time(timeLabel);

    msalInstance.acquireTokenByCode(tokenRequest)
        .then((response) => {
            console.timeEnd(timeLabel);

            const {
                sid, // Session ID claim, used for non-hybrid
                login_hint: loginHint, // New login_hint claim (used instead of sid or email)
                preferred_username: preferredUsername // Email
            } = response.idTokenClaims;

            // Spa auth code that will be redeemed by MSAL.js v2 client-side
            const { code } = response;

            // Attach auth artifacts to session to they can be rendered downstream
            req.session.isAuthenticated = true;
            req.session.code = code;
            req.session.sid = sid;
            req.session.loginHint = loginHint;
            req.session.preferredUsername = preferredUsername;

            // Parameters to set when native broker is enabled for public client app. 
            req.session.account = JSON.stringify(response.account);

            // Redirect user to appropriate redirect page
            if (useImplicit) {
                res.redirect(`/auth/implicit-redirect`);
            } else {
                res.redirect(`/auth/client-redirect`);
            }
        })
        .catch((error) => {
            console.timeEnd(timeLabel);
            res.status(500).send(error.errorMessage);
        });
});

const data = {
    title: 'MSAL Hybrid Sample App',
    clientId: process.env.MSAL_CLIENT_ID,
    authority: process.env.MSAL_AUTHORITY
}

router.get('/client-redirect', function(req, res, next) {
    res.render('client-redirect', {
        ...data,
        ...req.session
    });
});

router.get('/implicit-redirect', function(req, res, next) {
    res.render('implicit-redirect', {
        ...data,
        ...req.session
    });
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        res.render('logout', data);
    })
});

module.exports = router;
