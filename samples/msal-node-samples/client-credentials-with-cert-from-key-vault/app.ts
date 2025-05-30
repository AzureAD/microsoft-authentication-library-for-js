/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationResult,
    ConfidentialClientApplication,
    Configuration,
    LogLevel,
} from "@azure/msal-node";
import argv from "./cliArgs.js";
import * as dotenv from "dotenv";

dotenv.config();

const getClientCredentialsToken = async (
    cca: ConfidentialClientApplication,
    clientCredentialRequestScopes: Array<string>,
    region?: string
): Promise<AuthenticationResult | null> => {
    // With client credentials flows permissions need to be granted in the portal by a tenant administrator.
    // The scope is always in the format "<resource>/.default"
    const clientCredentialRequest = {
        scopes: clientCredentialRequestScopes,
        azureRegion: region, // (optional) specify the region you will deploy your application to here (e.g. "westus2")
        skipCache: true, // (optional) this skips the cache and forces MSAL to get a new token from Azure AD
    };

    try {
        const response: AuthenticationResult | null =
            await cca.acquireTokenByClientCredential(clientCredentialRequest);
        return response;
    } catch (error) {
        throw error.errorMessage;
    }
};

/**
 * The code below checks if the script is being executed manually or in automation.
 * If the script was executed manually, it will initialize a ConfidentialClientApplication object
 * and execute the sample client credentials application.
 */
if (argv.$0 === "dist/app.js") {
    (async () => {
        const clientConfig: Configuration = {
            auth: {
                clientId: process.env.CLIENT_ID,
                authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
                clientCertificate: {
                    thumbprintSha256:
                        process.env.CLIENT_CERTIFICATE_THUMBPRINT_SHA_256,
                    privateKey: process.env.CLIENT_CERTIFICATE_PRIVATE_KEY,
                    x5c: process.env.CLIENT_CERTIFICATE_X5C,
                },
            },
            system: {
                loggerOptions: {
                    loggerCallback(loglevel, message, containsPii) {
                        console.log(message);
                    },
                    piiLoggingEnabled: false,
                    logLevel: LogLevel.Verbose,
                },
            },
        };

        const confidentialClientApplication: ConfidentialClientApplication =
            new ConfidentialClientApplication(clientConfig);

        await getClientCredentialsToken(
            confidentialClientApplication,
            ["https://graph.microsoft.com/.default"],
            argv.r
        );
    })();
}

export default getClientCredentialsToken;
