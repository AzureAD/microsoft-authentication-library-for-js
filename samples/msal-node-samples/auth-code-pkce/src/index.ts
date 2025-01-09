/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import express from "express";
import session from "express-session";
import {
    PublicClientApplication,
    AuthorizationCodeRequest,
    LogLevel,
    CryptoProvider,
    AuthorizationUrlRequest,
    Configuration,
} from "@azure/msal-node";
import { RequestWithPKCE } from "./types";
import "dotenv/config";

const SERVER_PORT = process.env.PORT || 3000;

// Before running the sample, you will need to replace the values in the config.
const config: Configuration = {
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: "https://login.microsoftonline.com/ENTER_TENANT_ID",
    },
    system: {
        loggerOptions: {
            loggerCallback(
                loglevel: LogLevel,
                message: string,
                containsPii: boolean
            ) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Verbose,
        },
    },
};

// Create msal application object
const pca = new PublicClientApplication(config);

// Create Express App and Routes
const app = express();

/**
 * Using express-session middleware. Be sure to familiarize yourself with available options
 * and set them as desired. Visit: https://www.npmjs.com/package/express-session
 */
const sessionConfig = {
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set this to true on production
    },
};

if (app.get("env") === "production") {
    app.set("trust proxy", 1); // trust first proxy e.g. App Service
    sessionConfig.cookie.secure = true; // serve secure cookies
}

app.use(session(sessionConfig));

app.get("/", (req: RequestWithPKCE, res) => {
    /**
     * Proof Key for Code Exchange (PKCE) Setup
     *
     * MSAL enables PKCE in the Authorization Code Grant Flow by including the codeChallenge and codeChallengeMethod parameters
     * in the request passed into getAuthCodeUrl() API, as well as the codeVerifier parameter in the
     * second leg (acquireTokenByCode() API).
     *
     * MSAL Node provides PKCE Generation tools through the CryptoProvider class, which exposes
     * the generatePkceCodes() asynchronous API. As illustrated in the example below, the verifier
     * and challenge values should be generated previous to the authorization flow initiation.
     *
     * For details on PKCE code generation logic, consult the
     * PKCE specification https://tools.ietf.org/html/rfc7636#section-4
     */

    // Initialize CryptoProvider instance
    const cryptoProvider = new CryptoProvider();
    // Generate PKCE Codes before starting the authorization flow
    cryptoProvider.generatePkceCodes().then(({ verifier, challenge }) => {
        // create session object if does not exist
        if (!req.session.pkceCodes) {
            req.session.pkceCodes = {
                challengeMethod: "S256",
            };
        }

        // Set generated PKCE Codes as session vars
        req.session.pkceCodes.verifier = verifier;
        req.session.pkceCodes.challenge = challenge;

        // Add PKCE code challenge and challenge method to authCodeUrl request objectgit st
        const authCodeUrlParameters: AuthorizationUrlRequest = {
            scopes: ["user.read"],
            redirectUri: "http://localhost:3000/redirect",
            codeChallenge: req.session.pkceCodes.challenge, // PKCE Code Challenge
            codeChallengeMethod: req.session.pkceCodes.challengeMethod, // PKCE Code Challenge Method
        };

        // Get url to sign user in and consent to scopes needed for applicatio
        pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
            res.redirect(response);
        });
    });
});

app.get("/redirect", (req: RequestWithPKCE, res) => {
    // Add PKCE code verifier to token request object
    const tokenRequest: AuthorizationCodeRequest = {
        code: req.query.code as string,
        scopes: ["user.read"],
        redirectUri: "http://localhost:3000/redirect",
        codeVerifier: req.session.pkceCodes.verifier, // PKCE Code Verifier
        clientInfo: req.query.client_info as string,
    };

    pca.acquireTokenByCode(tokenRequest)
        .then(() => {
            res.sendStatus(200);
        })
        .catch((error) => {
            res.status(500).send(error.errorMessage);
        });
});

app.listen(SERVER_PORT, () =>
    console.log(
        `Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`
    )
);
