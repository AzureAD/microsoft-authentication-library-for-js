/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/

const express = require('express');
const morgan = require('morgan');
const path = require('path');

//initialize express.
const app = express();

// Initialize variables.
const port = 30662; // process.env.PORT || 30662;

// Configure morgan module to log all requests.
app.use(morgan('dev'));

// Set the front-end folder to serve public assets.
app.use(express.static('JavaScriptSPA'))

// Set up a route for index.html.
app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

// Start the server.
app.listen(port);
console.log('Listening on port ' + port + '...');
