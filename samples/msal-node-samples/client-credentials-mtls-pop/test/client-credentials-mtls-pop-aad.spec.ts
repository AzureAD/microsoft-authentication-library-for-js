import {
    RETRY_TIMES,
    validateCacheLocation,
    NodeCacheTestUtils,
    getCertificateInfo,
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
// The generic lab app (shared by the other node samples via AZURE_CLIENT_ID) works for
// Bearer SN/I but is NOT ESTS allow-listed for mTLS PoP — it fails with AADSTS700025.
// Use the SN/I-allow-listed app + MSI-team tenant, matching the MSAL .NET/Java/Python e2e
// config. The LabAuth SN/I cert loaded below is trusted by this app (SN/I matches on
// subject + issuer, not thumbprint), so the cert loading stays unchanged.
const SNI_ALLOWLISTED_CLIENT_ID = "163ffef9-a313-45b4-ab2f-c7e2f5e0e23e";
const SNI_ALLOWLISTED_AUTHORITY =
    "https://login.microsoftonline.com/bea21ebe-8b64-4d06-9f6d-6a889b120a7c";

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
                clientId: SNI_ALLOWLISTED_CLIENT_ID,
                authority: SNI_ALLOWLISTED_AUTHORITY,
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
