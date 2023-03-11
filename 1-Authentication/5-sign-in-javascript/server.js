const express = require('express');
const morgan = require('morgan');
const path = require('path');

const rateLimit = require('express-rate-limit');

const DEFAULT_PORT = process.env.PORT || 3000;

// initialize express.
const app = express();

/**
 * HTTP request handlers should not perform expensive operations such as accessing the file system,
 * executing an operating system command or interacting with a database without limiting the rate at
 * which requests are accepted. Otherwise, the application becomes vulnerable to denial-of-service attacks
 * where an attacker can cause the application to crash or become unresponsive by issuing a large number of
 * requests at the same time. For more information, visit: https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html
 */
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiting middleware to all requests
app.use(limiter);

// Configure morgan module to log all requests.
app.use(morgan('dev'));

// Setup app folders.
app.use(express.static('App'));

// Set up a route for signout.html
app.get('/signout', (req, res) => {
    res.sendFile(path.join(__dirname + '/App/signout.html'));
});

// set up a route for redirect.html
app.get('/redirect', (req, res) => {
    res.sendFile(path.join(__dirname + '/App/redirect.html'));
});

// Set up a route for index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.listen(DEFAULT_PORT, () => {
    console.log(`Sample app listening on port ${DEFAULT_PORT}!`);
});

module.exports = app;
