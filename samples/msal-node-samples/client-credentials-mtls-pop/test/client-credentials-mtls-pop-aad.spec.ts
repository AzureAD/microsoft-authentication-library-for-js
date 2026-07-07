import {
    RETRY_TIMES,
    validateCacheLocation,
    NodeCacheTestUtils,
    getCertificateInfo,
    ENV_VARIABLES,
    LAB_CERT_NAME,
    LAB_KEY_VAULT_URL,
} from "../../../e2eTestUtils/src";
import {
    AuthenticationResult,
    ConfidentialClientApplication,
    Configuration,
} from "@azure/msal-node";
import { DefaultAzureCredential } from "@azure/identity";
import { getMtlsPopToken } from "../app";

// Enable SNI (send certificate chain) for cert-based auth in CI
process.env["AZURE_CLIENT_SEND_CERTIFICATE_CHAIN"] = "true";

const TEST_CACHE_LOCATION = `${__dirname}/data/aad.cache.json`;
// ESTS gates mTLS PoP on the resource audience (must be ESTS allow-listed), not the client app.
// Microsoft Graph is allow-listed.
const clientCredentialRequestScopes = ["https://graph.microsoft.com/.default"];
// mTLS PoP requires a tenanted authority; the region is recommended but optional.
const REGION = "westus3";

describe("Client Credentials mTLS Proof-of-Possession AAD Prod Tests", () => {
    jest.retryTimes(RETRY_TIMES);
    jest.setTimeout(90000);

    let thumbprint: string;
    let privateKey: string;
    let x5c: string;
    let config: Configuration;
    beforeAll(async () => {
        await validateCacheLocation(TEST_CACHE_LOCATION);

        const credentials = new DefaultAzureCredential();
        [thumbprint, privateKey, x5c] = await getCertificateInfo(
            credentials,
            LAB_KEY_VAULT_URL,
            LAB_CERT_NAME
        );

        config = {
            auth: {
                clientId: process.env[ENV_VARIABLES.CLIENT_ID] as string,
                authority: `https://login.microsoftonline.com/${
                    process.env[ENV_VARIABLES.TENANT]
                }`,
                clientCertificate: {
                    thumbprintSha256: thumbprint,
                    privateKey: privateKey,
                    x5c: x5c,
                },
            },
        };
    });

    describe("Acquire mTLS PoP Token", () => {
        let confidentialClientApplication: ConfidentialClientApplication;

        beforeAll(async () => {
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        afterEach(async () => {
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        it("acquires an mTLS-bound PoP token with the SN/I certificate as the TLS client cert", async () => {
            confidentialClientApplication = new ConfidentialClientApplication(
                config
            );

            const authenticationResult: AuthenticationResult | null =
                await getMtlsPopToken(
                    confidentialClientApplication,
                    clientCredentialRequestScopes,
                    REGION
                );

            expect(authenticationResult?.accessToken).toBeTruthy();
            // The returned token is an mTLS-bound Proof-of-Possession token.
            expect(authenticationResult?.tokenType).toBe("mtls_pop");
            // The token is bound to the SN/I certificate presented on the TLS handshake; the
            // surfaced thumbprint is the certificate's x5t#S256 (base64url), derived from the x5c.
            expect(
                authenticationResult?.bindingCertificate?.thumbprintSha256
            ).toBeTruthy();
            expect(authenticationResult?.bindingCertificate?.x5c).toBeTruthy();
        });
    });
});
