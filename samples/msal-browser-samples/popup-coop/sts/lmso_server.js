/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/
const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const argv = require("yargs")
    .usage("Usage: $0 -p [PORT] -https")
    .alias("p", "port")
    .alias("h", "https")
    .describe("port", "(Optional) Port Number - default is 30663")
    .describe("https", "(Optional) Serve over https")
    .strict()
    .argv;


const DEFAULT_PORT = 30663;
const APP_DIR = __dirname;

//initialize express.
const app = express();

// Initialize variables.
let port = DEFAULT_PORT; // -p {PORT} || 30663;
if (argv.p) {
    port = argv.p;
}

let logHttpRequests = true;

// Set the front-end folder to serve public assets.
// app.use("/lib", express.static(path.join(__dirname, "../../../../lib/msal-browser/lib")));


app.use(express.static('../sts/', {
    setHeaders: (res) => {
        //res.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
        res.set('cross-origin-opener-policy-report-only', 'same-origin; report-to="coop-endpoint"');
        res.set('reporting-endpoints', 'coop-endpoint="https://idux.azurewebsites.net/api/coopReport"');
    }
}));

//Serve popup.html with COOP header set to 'same-origin'
app.get('/popup', function (req, res) {
    //res.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.set('cross-origin-opener-policy-report-only', 'same-origin; report-to="coop-endpoint"');
    res.set('reporting-endpoints', 'coop-endpoint="https://idux.azurewebsites.net/api/coopReport"');
    res.sendFile(path.join(APP_DIR + '/popup.html'));
});

// Set up a route for index.html.
app.get('*', function (req, res) {
    //res.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.set('cross-origin-opener-policy-report-only', 'same-origin; report-to="coop-endpoint"');
    res.set('reporting-endpoints', 'coop-endpoint="https://idux.azurewebsites.net/api/coopReport"');
    res.sendFile(path.join(APP_DIR + '/sts_index.html'));
});

if (logHttpRequests) {
    // Configure morgan module to log all requests.
    app.use(morgan('dev'));
}

// Start the server.
if (argv.https) {
    const https = require('https');

    /**
     * Secrets should never be hardcoded. The dotenv npm package can be used to store secrets or certificates
     * in a .env file (located in project's root directory) that should be included in .gitignore to prevent
     * accidental uploads of the secrets.
     * 
     * Certificates can also be read-in from files via NodeJS's fs module. However, they should never be
     * stored in the project's directory. Production apps should fetch certificates from
     * Azure KeyVault (https://azure.microsoft.com/products/key-vault), or other secure key vaults.
     * 
     * Please see "Certificates and Secrets" (https://learn.microsoft.com/azure/active-directory/develop/security-best-practices-for-app-registration#certificates-and-secrets)
     * for more information.
     */
    const privateKey = fs.readFileSync('./../key.pem', 'utf8');
    const certificate = fs.readFileSync('./../cert.pem', 'utf8');
    const credentials = { key: privateKey, cert: certificate };
    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(port);
} else {
    app.listen(port);
}
console.log(`Listening on port ${port}...`);