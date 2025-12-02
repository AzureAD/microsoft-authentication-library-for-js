/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/
const express = require('express');
const cors = require('cors');
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

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for requests from localhost:30662
app.use(cors({
    origin: 'https://localhost:30662',
    credentials: true
}));

// Initialize variables.
let port = DEFAULT_PORT; // -p {PORT} || 30663;
if (argv.p) {
    port = argv.p;
}

let logHttpRequests = true;


app.use(express.static(__dirname, {
    setHeaders: (res) => {
        res.set('Cross-Origin-Opener-Policy', 'same-origin');
    }
}));

// OAuth2 authorization endpoint - serve the login page
app.get('/:tenantId/oauth2/v2.0/authorize', function (req, res) {
    res.set('Cross-Origin-Opener-Policy', 'same-origin');
    res.sendFile(path.join(APP_DIR + '/sts_index.html'));
});

// OAuth2 token endpoint - exchange auth code for tokens
app.post('/:tenantId/oauth2/v2.0/token', function (req, res) {
    console.log('[STS TOKEN] Token request received');
    console.log('[STS TOKEN] Body:', req.body);
    
    const { code, grant_type, client_id } = req.body;
    
    if (grant_type !== 'authorization_code') {
        return res.status(400).json({ error: 'unsupported_grant_type' });
    }
    
    // Decode the auth code to verify it
    try {
        const authCodeData = JSON.parse(atob(code));
        console.log('[STS TOKEN] Auth code data:', authCodeData);
        
        // Generate mock tokens
        const idTokenPayload = {
            aud: client_id,
            iss: `https://localhost:30663/${req.params.tenantId}/v2.0`,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
            sub: "test-subject-id",
            name: "Test User",
            preferred_username: "test@example.com",
            tid: req.params.tenantId,
            nonce: authCodeData.nonce,  // Include nonce from auth code
            ver: "2.0"
        };
        
        console.log('[STS TOKEN] ID Token payload:', idTokenPayload);
        
        // Create simple JWT-like structure (header.payload.signature)
        const header = btoa(JSON.stringify({ typ: "JWT", alg: "RS256" }));
        const payload = btoa(JSON.stringify(idTokenPayload));
        const signature = btoa("mock_signature");
        const id_token = `${header}.${payload}.${signature}`;
        
        const tokenResponse = {
            token_type: "Bearer",
            scope: "openid profile offline_access",
            expires_in: 3600,
            ext_expires_in: 3600,
            access_token: btoa(JSON.stringify({ token: "mock_access_token", timestamp: Date.now() })),
            refresh_token: btoa(JSON.stringify({ token: "mock_refresh_token", timestamp: Date.now() })),
            id_token: id_token,
            client_info: btoa(JSON.stringify({ uid: "test-uid", utid: req.params.tenantId }))
        };
        
        console.log('[STS TOKEN] Returning token response');
        res.json(tokenResponse);
        
    } catch (error) {
        console.error('[STS TOKEN] Error:', error);
        res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid authorization code' });
    }
});

// Set up a route for index.html (catch-all at the end).
app.get('*', function (req, res) {
    res.set('Cross-Origin-Opener-Policy', 'same-origin');
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
    const privateKey = fs.readFileSync(path.join(__dirname, '../key.pem'), 'utf8');
    const certificate = fs.readFileSync(path.join(__dirname, '../cert.pem'), 'utf8');
    const credentials = { key: privateKey, cert: certificate };
    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(port);
} else {
    app.listen(port);
}
console.log(`Listening on port ${port}...`);
