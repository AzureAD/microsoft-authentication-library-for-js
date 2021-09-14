var express = require('express');
var router = express.Router();
var path = require('path');

const msalInstance = require('./msal');

const dotenv = require("dotenv");
dotenv.config();

router.use('/lib', express.static(path.join(__dirname, '../node_modules/@azure/msal-browser/lib')));

router.get('/login', (req, res) => {
    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: "http://localhost:3000/auth/redirect",
        responseMode: "form_post"
    };

    if (req.query.hybrid) {
        authCodeUrlParameters.state = "hybrid=true";
    }

    // get url to sign user in and consent to scopes needed for application
    msalInstance.getAuthCodeUrl(authCodeUrlParameters)
        .then((response) => {
            console.log(response);
            res.redirect(response);
        })
        .catch((error) => console.log(JSON.stringify(error)));
});

router.post('/redirect', (req, res) => {
    const tokenRequest = {
        code: req.body.code,
        scopes: ["user.read"],
        redirectUri: "http://localhost:3000/auth/redirect"
    };

    const useHybrid = req.body.state === "hybrid=true";

    // Parameters needed to spa test flight
    tokenRequest.tokenQueryParameters = {
        dc: "ESTS-PUB-WUS2-AZ1-FD000-TEST1",
        hybridspa: "true"
    }

    if (useHybrid) {
        console.log('Hybrid enabled');
        tokenRequest.returnSpaCode = true
        // tokenRequest.tokenBodyParameters = {
        //     return_spa_code: "1"
        // }
    } else {
        console.log('Hybrid disabled');
    }

    const timeLabel = "Time for acquireTokenByCode";
    console.time(timeLabel)

    msalInstance.acquireTokenByCode(tokenRequest)
        .then((response) => {
            console.timeEnd(timeLabel)
            // console.log("\nResponse: \n:", response);
            if (useHybrid) {
                res.redirect(`/auth/client-redirect?sid=${response.idTokenClaims.sid}&code=${response.spaCode}&nonce=${response.idTokenClaims.nonce}&login-hint=${encodeURIComponent(response.idTokenClaims.preferred_username)}`)
            } else {
                res.redirect(`/auth/client-redirect?sid=${response.idTokenClaims.sid}&login-hint=${encodeURIComponent(response.idTokenClaims.preferred_username)}`)
            }
        })
        .catch((error) => {
            console.timeEnd(timeLabel)
            console.log(error);
            res.status(500).send(error);
        });
});

const data = {
    title: 'MSAL Hybrid Sample App',
    clientId: process.env.MSAL_CLIENT_ID
}

router.get('/client-redirect', function(req, res, next) {
    res.render('client-redirect', data);
});

module.exports = router;
