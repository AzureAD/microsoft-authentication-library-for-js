/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/

var express = require('express');
var app = express();
var morgan = require('morgan');
var path = require('path');

// Initialize variables.
var port = 1530; // process.env.PORT || 8080;

// Configure morgan module to log all requests.
app.use(morgan('dev'));

// Set the front-end folder to serve public assets.
app.use("/dist", express.static(path.join(__dirname, "../../dist")));
app.use('/adal', express.static(__dirname + '/adal'));
app.use("/lib", express.static(path.join(__dirname, "../../../../../../azure-activedirectory-library-for-js/lib")));
app.use("/bower_components", express.static(path.join(__dirname, 'bower_components')));

// Set up our one route to the index.html file.
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/ADAL_OLD.html', function (req, res) {
    res.sendFile(path.join(__dirname + '/ADAL_OLD.html'));
});

app.get('/MSAL_OLD.html', function (req, res) {
    res.sendFile(path.join(__dirname + '/MSAL_OLD.html'));
});

app.get('/msal_apiChanges.html', function (req, res) {
    res.sendFile(path.join(__dirname + '/msal_apiChanges.html'));
});

app.get('/MSAL_UnifiedCache_SSO.html', function (req, res) {
    res.sendFile(path.join(__dirname + '/MSAL_UnifiedCache_SSO.html'));
});

app.get('/MSAL_UnifiedCache_loginPopup.html', function (req, res) {
    res.sendFile(path.join(__dirname + '/MSAL_UnifiedCache_loginPopup.html'));
});


app.get('/MSAL_UnifiedCache_loginRedirect.html', function (req, res) {
    res.sendFile(path.join(__dirname + '/MSAL_UnifiedCache_loginRedirect.html'));
});




// Start the server.
app.listen(port);
console.log('Listening on port ' + port + '...');
