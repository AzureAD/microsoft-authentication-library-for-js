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
 * Federated Identity Credential (FIC) over mTLS Proof-of-Possession - two-leg, S2S (app-only).
 *
 * Leg 1: the SN/I certificate is presented as the client TLS certificate to obtain an mTLS-PoP
 *        federated assertion for the exchange audience (caller-supplied, e.g.
 *        `api://AzureADTokenExchange/.default`). The result's `bindingCertificate` identifies the
 *        certificate the assertion is bound to.
 * Leg 2: Leg 1's token is used as the `client_assertion` credential; Leg 1's binding certificate is
 *        presented as the client TLS certificate (decoupled from the credential) to obtain the final
 *        mTLS-PoP token for the target resource.
 *
 * MSAL provides the two primitives (`mtlsProofOfPossession` and `tokenBindingCertificate`); the
 * developer orchestrates the two calls, as shown here.
 */
export const acquireFicMtlsPopToken = async (params: {
    tenantId: string;
    /** App registration whose SN/I certificate acquires the federated assertion (Leg 1). */
    leg1ClientId: string;
    /** App registration that exchanges the assertion for the final resource token (Leg 2). */
    leg2ClientId: string;
    /** The SN/I certificate material used as the TLS client certificate. */
    cert: CertificateInfo;
    /** Exchange audience for Leg 1, e.g. ["api://AzureADTokenExchange/.default"]. */
    exchangeScopes: Array<string>;
    /** Final resource scopes for Leg 2, e.g. ["https://graph.microsoft.com/.default"]. */
    resourceScopes: Array<string>;
    region?: string;
}): Promise<{
    leg1: AuthenticationResult;
    leg2: AuthenticationResult;
}> => {
    const authority = `https://login.microsoftonline.com/${params.tenantId}`;

    // ---- Leg 1: SN/I cert -> mTLS-PoP federated assertion ----
    const leg1Cca = new ConfidentialClientApplication({
        auth: {
            clientId: params.leg1ClientId,
            authority,
            clientCertificate: params.cert,
        },
    });

    const leg1 = await leg1Cca.acquireTokenByClientCredential({
        scopes: params.exchangeScopes,
        azureRegion: params.region,
        mtlsProofOfPossession: true,
        skipCache: true,
    });

    if (!leg1 || !leg1.bindingCertificate) {
        throw new Error(
            "FIC Leg 1 did not return an mTLS-bound token with a binding certificate."
        );
    }

    // ---- Leg 2: Leg 1 assertion as credential + Leg 1 binding cert on TLS ----
    const leg2Cca = new ConfidentialClientApplication({
        auth: {
            clientId: params.leg2ClientId,
            authority,
            // The Leg 1 token becomes the client assertion (credential) for Leg 2.
            clientAssertion: leg1.accessToken,
        },
    });

    const leg2 = await leg2Cca.acquireTokenByClientCredential({
        scopes: params.resourceScopes,
        azureRegion: params.region,
        mtlsProofOfPossession: true,
        // The credential is the assertion; the binding cert is supplied separately for the TLS layer.
        // The developer already holds the private key for Leg 1's binding certificate (the SN/I cert).
        tokenBindingCertificate: {
            privateKey: params.cert.privateKey,
            x5c: leg1.bindingCertificate.x5c,
        },
        skipCache: true,
    });

    if (!leg2) {
        throw new Error("FIC Leg 2 did not return a token.");
    }

    return { leg1, leg2 };
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
