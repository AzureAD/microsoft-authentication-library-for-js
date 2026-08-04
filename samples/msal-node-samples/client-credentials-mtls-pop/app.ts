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
const argv = require("./cliArgs").default;
require("dotenv").config();

/**
 * Certificate material (SN/I certificate) used as the client TLS certificate for the mutual-TLS
 * handshake to the token endpoint. This is the same shape as `auth.clientCertificate`.
 */
export type CertificateInfo = {
    thumbprintSha256: string;
    privateKey: string;
    x5c: string;
};

/**
 * Vanilla SN/I -> mTLS Proof-of-Possession.
 *
 * The confidential client is configured with an SN/I certificate (`auth.clientCertificate`). By
 * setting `mtlsProofOfPossession: true` on the request, MSAL presents that certificate as the client
 * TLS certificate in the mutual-TLS handshake to Entra ID (ESTS), which returns a token with
 * `token_type=mtls_pop` cryptographically bound to the certificate. No `client_assertion` is sent -
 * the TLS certificate authenticates the client.
 */
export const getMtlsPopToken = async (
    cca: ConfidentialClientApplication,
    clientCredentialRequestScopes: Array<string>,
    region?: string
): Promise<AuthenticationResult | null> => {
    const clientCredentialRequest = {
        scopes: clientCredentialRequestScopes,
        azureRegion: region, // recommended; falls back to the global mTLS endpoint if omitted
        mtlsProofOfPossession: true, // request an mTLS-bound PoP token
        skipCache: true,
    };

    return cca.acquireTokenByClientCredential(clientCredentialRequest);
};

/**
 * The code below checks if the script is being executed manually or in automation.
 * If the script was executed manually, it will initialize a ConfidentialClientApplication object
 * and execute the sample mTLS Proof-of-Possession client credentials application.
 */
if (argv.$0 === "dist/app.js") {
    (async () => {
        if (
            !process.env.CLIENT_ID ||
            !process.env.TENANT_ID ||
            !process.env.CLIENT_CERTIFICATE_THUMBPRINT_SHA_256 ||
            !process.env.CLIENT_CERTIFICATE_PRIVATE_KEY ||
            !process.env.CLIENT_CERTIFICATE_X5C
        ) {
            throw new Error(
                "Please set the environment variables CLIENT_ID, TENANT_ID, CLIENT_CERTIFICATE_THUMBPRINT_SHA_256, CLIENT_CERTIFICATE_PRIVATE_KEY, and CLIENT_CERTIFICATE_X5C."
            );
        }
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

        const result = await getMtlsPopToken(
            confidentialClientApplication,
            ["https://graph.microsoft.com/.default"],
            argv.r
        );

        console.log("token_type:", result?.tokenType);
        console.log(
            "bindingCertificate.thumbprintSha256:",
            result?.bindingCertificate?.thumbprintSha256
        );
    })();
}

export default getMtlsPopToken;
