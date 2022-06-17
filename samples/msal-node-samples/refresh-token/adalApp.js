// Import dependencies
var express = require('express');
var session = require('express-session');
var crypto = require('crypto');
var { v4: uuid } = require('uuid');
var adal = require('adal-node');

const config = require('./config/customConfig.json');

var DiskCache = require('./adalCustomCache');
var diskCache = new DiskCache(config.cacheLocation);

// Authentication parameters
var clientId = config.clientId;
var clientSecret = config.clientSecret;
var tenant = config.tenantInfo;
var authorityUrl = config.authority + '/' + tenant;
var redirectUri = config.redirectUri;
var resource = config.resource;

// Configure logging
adal.Logging.setLoggingOptions({
    log: function (level, message, error) {
        console.log(message);
    },
    level: adal.Logging.LOGGING_LEVEL.VERBOSE,
    loggingWithPII: false
});

// Auth code request URL template
var templateAuthzUrl = authorityUrl + '/oauth2/authorize?response_mode=form_post&response_type=id_token%20code&client_id='
    + clientId + '&redirect_uri=' + redirectUri
    + '&state=<state>&nonce=<nonce>&resource=' + resource;

// Initialize express
var app = express();
app.use(express.urlencoded({ extended: false }));

/**
 * Using express-session middleware for persistent user session. Be sure to
 * familiarize yourself with available options. Visit: https://www.npmjs.com/package/express-session
 */
app.use(session({
    secret: clientSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set this to true on production
    }
}));

app.get('/', function (req, res) {

    // Create a random string to use against XSRF
    crypto.randomBytes(48, function (ex, buf) {
        req.session.state = buf.toString('base64')
            .replace(/\//g, '_')
            .replace(/\+/g, '-');

        // Construct auth code request URL
        var authorizationUrl = templateAuthzUrl
            .replace('<state>', req.session.state)
            .replace('<nonce>', uuid());

        res.redirect(authorizationUrl);
    });
});

app.post('/redirect', function (req, res, next) {
    // Compare state parameter against XSRF
    if (req.session.state !== req.body.state) {
        res.send('error: state does not match');
    }

    var idTokenClaims = getIdTokenClaims(req.body.id_token);

    // Initialize an AuthenticationContext object
    var authenticationContext = new adal.AuthenticationContext(authorityUrl, true, diskCache);

    // Exchange auth code for tokens
    authenticationContext.acquireTokenWithAuthorizationCode(
        req.body.code,
        redirectUri,
        resource,
        clientId,
        clientSecret,
        function (err, response) {
            if (err) return next(err);

            // cache the response
            const userCache = {
                ...response,
                idToken: req.body.id_token,
                oid: idTokenClaims.oid,
                tid: idTokenClaims.tid,
                upn: idTokenClaims.upn,
            }

            authenticationContext.cache.add([userCache], (err, result) => {
                if (err) return next(err);
                console.log(result);
            });

            // create a cookie and store the upn as userId, which will be picked up later on by the MSAL app
            res.cookie('userId', userCache.oid, { maxAge: 900000, httpOnly: true }).send(response);
        }
    );
});

app.listen(3000, function () {
    console.log(`listening on port 3000!`);
});

const getIdTokenClaims = function (rawIdToken) {
    var idTokenPartsRegex = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/;
    var matches = idTokenPartsRegex.exec(rawIdToken);
    return JSON.parse(Buffer.from(matches[2], 'base64').toString());;
};
