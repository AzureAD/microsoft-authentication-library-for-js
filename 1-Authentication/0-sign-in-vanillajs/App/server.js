const express = require('express');
const morgan = require('morgan');
const path = require('path');

const DEFAULT_PORT = process.env.PORT || 3000;

// initialize express.
const app = express();

// Configure morgan module to log all requests.
app.use(morgan('dev'));

// serve public assets.
app.use(express.static('public'));

// serve msal-browser module
app.use(express.static(path.join(__dirname, "node_modules/@azure/msal-browser/lib")));

// set up a route for signout.html
app.get('/signout', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/signout.html'));
});

// set up a route for redirect.html
app.get('/redirect', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/redirect.html'));
});

// set up a route for index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.listen(DEFAULT_PORT, () => {
    console.log(`Sample app listening on port ${DEFAULT_PORT}!`);
});

module.exports = app;
