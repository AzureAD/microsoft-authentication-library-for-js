var express = require('express');
var router = express.Router();
var path = require('path');

const msal = require('@azure/msal-node');
const dotenv = require("dotenv");

dotenv.config()

router.use('/lib', express.static(path.join(__dirname, '../node_modules/@azure/msal-browser/lib')));

const config = {
    auth: {
        clientId: process.env.MSAL_CLIENT_ID,
        authority: "https://login.microsoftonline.com/common",
        clientSecret: process.env.MSAL_CLIENT_SECRET
    },
    system: {
        loggerOptions: {
            loggerCallback: (loglevel, message, containsPii) => {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
};

// Create msal application object
const cca = new msal.ConfidentialClientApplication(config);
router.get('/login', (req, res) => {
    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: "http://localhost:3000/auth/redirect",
        responseMode: "form_post"
    };

    // get url to sign user in and consent to scopes needed for application
    cca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
        console.log(response);
        res.redirect(response);
    }).catch((error) => console.log(JSON.stringify(error)));
});

router.post('/redirect', (req, res) => {
    const tokenRequest = {
        code: req.body.code,
        scopes: ["user.read"],
        redirectUri: "http://localhost:3000/auth/redirect",
        tokenQueryParameters: {
            dc: "ESTS-PUB-WUS2-AZ1-FD000-TEST1",
            hybridspa: "true"
        },
        tokenBodyParameters: {
            return_spa_code: "1"
        }
    };

    cca.acquireTokenByCode(tokenRequest).then((response) => {
        console.log("\nResponse: \n:", response);
        res.redirect(`/?sid=${response.idTokenClaims.sid}&code=${response.spaCode}&nonce=${response.idTokenClaims.nonce}`)
    }).catch((error) => {
        console.log(error);
        res.status(500).send(error);
    });
});

const data = {
    title: 'MSAL Hybrid Sample App',
    clientId: process.env.MSAL_CLIENT_ID
}

router.get('/client-redirect', function(req, res, next) {
    res.render('index', data);
});

/** MSAL */

module.exports = router;
