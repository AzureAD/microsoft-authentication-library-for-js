/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/
const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const argv = require('yargs')
    .usage('Usage: $0 -p1 [PORT] -p2 [PORT]')
    .alias('p1', 'port1')
    .alias('p2', 'port2')
    .describe('port1', '(Optional) Brokered App Port Number - default is 30662')
    .describe('port2', '(Optional) Broker App Port Number - default is 30663')
    .strict()
    .argv;

const DEFAULT_BROKERED_PORT = 30662;
const DEFAULT_BROKER_PORT = 30663;

//initialize express.
const brokeredApp = express();
const brokerApp = express();

// Initialize variables.
let port1 = DEFAULT_BROKERED_PORT; // -p1 {PORT} || 30662;
if (argv.p1) {
    port1 = argv.p1;
}
let port2 = DEFAULT_BROKER_PORT; // -p1 {PORT} || 30663;
if (argv.p2) {
    port2 = argv.p2;
}

// Configure morgan module to log all requests.
brokeredApp.use(morgan('dev'));
brokerApp.use(morgan('dev'));

// Set the front-end folder to serve public assets.
brokeredApp.use("/lib", express.static(path.join(__dirname, "../../../lib/msal-browser/lib")));
brokerApp.use("/lib", express.static(path.join(__dirname, "../../../lib/msal-browser/lib")));

brokeredApp.use(express.static('app/brokeredApp'));
brokerApp.use(express.static('app/brokerApp'));

// Set up a route for index.html.
brokeredApp.get('*', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});
brokerApp.get('*', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

// Start the server.
brokeredApp.listen(port1);
brokerApp.listen(port2);
console.log(`BrokeredApp listening on port: ${port1}...`);
console.log(`BrokerApp listening on port: ${port2}...`);
