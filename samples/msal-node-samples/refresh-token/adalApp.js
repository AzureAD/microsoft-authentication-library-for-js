// Import dependencies
var express = require('express');
var session = require('express-session');
var crypto = require('crypto');
var adal = require('adal-node');

var config = require('./config/customConfig.json');

var DiskCache = require('./adalCustomCache');
var diskCache = new DiskCache(config.adalCacheLocation);

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
var templateAuthzUrl = authorityUrl + '/oauth2/authorize?response_type=code&client_id='
    + clientId + '&redirect_uri=' + redirectUri
    + '&state=<state>&resource=' + resource;

// Initialize express
var app = express();

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
            .replace('<state>', req.session.state);

        res.redirect(authorizationUrl);
    });
});

app.get('/redirect', function (req, res, next) {
    // Compare state parameter against XSRF
    if (req.session.state !== req.query.state) {
        res.send('error: state does not match');
    }

    // Initialize an AuthenticationContext object
    var authenticationContext = new adal.AuthenticationContext(authorityUrl, true, diskCache);

    // Exchange auth code for tokens
    authenticationContext.acquireTokenWithAuthorizationCode(
        req.query.code,
        redirectUri,
        resource,
        clientId,
        clientSecret,
        function (error, response) {
            if (error) return next(error);

            // cache the response
            authenticationContext.cache.add([response], function (error, result) {
                if (error) return next(error);
                console.log(result);
            });

            // create a cookie and store the userId (oid), which will be picked up later on by the MSAL app
            res.cookie('userId', response.userId, { maxAge: 900000, httpOnly: true }).send(response);
        }
    );
});

app.listen(3000, function () {
    console.log('listening on port 3000!');
});
