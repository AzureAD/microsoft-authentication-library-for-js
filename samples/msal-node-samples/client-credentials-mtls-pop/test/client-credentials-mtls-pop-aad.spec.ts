import {
    validateCacheLocation,
    NodeCacheTestUtils,
    getCertificateInfo,
    callGraphOverMtls,
    LAB_CERT_NAME,
    LAB_KEY_VAULT_URL,
} from "../../../e2eTestUtils/src";
import {
    AuthenticationResult,
    ConfidentialClientApplication,
    Configuration,
} from "@azure/msal-node";
import { DefaultAzureCredential } from "@azure/identity";
import { getMtlsPopToken, getBearerOverMtlsToken } from "../app";

// Enable SNI (send certificate chain) for cert-based auth in CI
process.env["AZURE_CLIENT_SEND_CERTIFICATE_CHAIN"] = "true";

const TEST_CACHE_LOCATION = `${__dirname}/data/aad.cache.json`;
// ESTS gates mTLS PoP on the resource audience (must be ESTS allow-listed), not the client app.
// Microsoft Graph is allow-listed.
const clientCredentialRequestScopes = ["https://graph.microsoft.com/.default"];
// Region split (mirrors the MSAL .NET/Java mTLS PoP E2E tests): setting azureRegion regionalizes
// the mTLS token endpoint (westus3.mtlsauth.microsoft.com). The westus3 slice intermittently
// downgrades mtls_pop -> Bearer, so — with jest.retryTimes removed — the PoP cell must NOT run
// regionally or it would fail closed on that intermittent downgrade. The PoP cell therefore runs
// GLOBAL (reliably mtls_pop); the deterministic Bearer contrast cell carries the live regional
// (westus3) endpoint coverage.
const REGION = "westus3";
// The generic lab app (shared by the other node samples via AZURE_CLIENT_ID) works for
// Bearer SN/I but is NOT ESTS allow-listed for mTLS PoP — it fails with AADSTS700025.
// Use the SN/I-allow-listed app + MSI-team tenant, matching the MSAL .NET/Java/Python e2e
// config. The LabAuth SN/I cert loaded below is trusted by this app (SN/I matches on
// subject + issuer, not thumbprint), so the cert loading stays unchanged.
const SNI_ALLOWLISTED_CLIENT_ID = "163ffef9-a313-45b4-ab2f-c7e2f5e0e23e";
const SNI_ALLOWLISTED_AUTHORITY =
    "https://login.microsoftonline.com/bea21ebe-8b64-4d06-9f6d-6a889b120a7c";
// mTLS PoP resource call: the mTLS Graph host (mtlstb.graph.microsoft.com) negotiates the
// client-certificate handshake and validates the token's certificate binding; the plain
// graph.microsoft.com host does not. A 200 from this host proves the issued token is bound.
const MTLS_GRAPH_RESOURCE_URL =
    "https://mtlstb.graph.microsoft.com/v1.0/applications?$top=1";

describe("Client Credentials mTLS Proof-of-Possession AAD Prod Tests", () => {
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

    // Credential_X509_Output_Pop: the SN/I (X509) certificate credential yields an mTLS-bound
    // Proof-of-Possession token that is usable against a resource over mutual TLS. Runs on the
    // GLOBAL mTLS endpoint (no azureRegion), which reliably returns mtls_pop.
    describe("Credential_X509_Output_Pop", () => {
        beforeAll(async () => {
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        afterEach(async () => {
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        it("acquires an mTLS-bound PoP token and uses it to call a resource over mutual TLS (HTTP 200)", async () => {
            const confidentialClientApplication: ConfidentialClientApplication =
                new ConfidentialClientApplication(config);

            const authenticationResult: AuthenticationResult | null =
                await getMtlsPopToken(
                    confidentialClientApplication,
                    clientCredentialRequestScopes
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

            // Prove the token is genuinely certificate-bound by calling a resource over mutual TLS:
            // present the same SN/I certificate on the handshake and send the token with the
            // "mtls_pop" scheme. A 200 confirms the binding; a 401/403 would be a regression.
            const resourceResponse = await callGraphOverMtls(
                MTLS_GRAPH_RESOURCE_URL,
                authenticationResult!.accessToken,
                x5c,
                privateKey
            );

            expect(resourceResponse.status).toBe(200);
        });
    });

    // Credential_X509_Output_Bearer: the same SN/I (X509) certificate credential, without
    // mtlsProofOfPossession, yields an ordinary (non-bound) Bearer token — the contrast case.
    // Runs REGIONAL (azureRegion=westus3): Bearer is deterministic on that slice, so this cell
    // retains the live regional-endpoint E2E coverage the global PoP cell no longer exercises.
    describe("Credential_X509_Output_Bearer", () => {
        beforeAll(async () => {
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        afterEach(async () => {
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        it("acquires a non-bound Bearer token with the SN/I certificate (client assertion) as a contrast to mTLS PoP", async () => {
            const confidentialClientApplication: ConfidentialClientApplication =
                new ConfidentialClientApplication(config);

            const authenticationResult: AuthenticationResult | null =
                await confidentialClientApplication.acquireTokenByClientCredential(
                    {
                        scopes: clientCredentialRequestScopes,
                        azureRegion: REGION,
                        skipCache: true,
                    }
                );

            expect(authenticationResult?.accessToken).toBeTruthy();
            // Without mtlsProofOfPossession the certificate signs a client assertion and the issued
            // token is a plain Bearer token — not certificate-bound.
            expect(authenticationResult?.tokenType).not.toBe("mtls_pop");
            expect(authenticationResult?.bindingCertificate).toBeFalsy();
        });
    });

    // Credential_X509_SendCertificateOverMtls_Output_Bearer: the SN/I (X509) certificate is
    // presented on the TLS handshake via the app-level auth.clientCertificate.sendCertificateOverMtls
    // flag, so MSAL routes to the mTLS token endpoint (mtlsauth.microsoft.com) - but because the
    // request is NOT mtls_pop, Entra returns a plain (non-bound) Bearer token. This is the distinct
    // Bearer-over-mTLS path: cert ON the handshake -> Bearer from the mTLS endpoint. Contrast with
    // Credential_X509_Output_Bearer (cert signs a client_assertion to the REGULAR endpoint; cert
    // never on the handshake) and Credential_X509_Output_Pop (bound token, token_type=mtls_pop).
    // Runs GLOBAL (no azureRegion) for determinism, and the second acquire (skipCache=false)
    // exercises the plain-Bearer cache hit from cache.
    // The AT caches under the original login.* environment (only the token ENDPOINT is
    // rewritten to mtlsauth.* via getMtlsTokenEndpoint(), never the authority), so the 2nd call
    // resolves metadata against login.* and cannot hit the .NET-style mtlsauth.* discovery trap.
    describe("Credential_X509_SendCertificateOverMtls_Output_Bearer", () => {
        let bearerOverMtlsConfig: Configuration;
        beforeAll(async () => {
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
            bearerOverMtlsConfig = {
                auth: {
                    ...config.auth,
                    clientCertificate: {
                        ...config.auth.clientCertificate,
                        // App-level opt-in: present the certificate on the mTLS handshake and route
                        // to the mTLS endpoint, but keep a plain Bearer token (not mtls_pop-bound).
                        sendCertificateOverMtls: true,
                    },
                },
            };
        });

        afterEach(async () => {
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        it("presents the certificate on the mTLS handshake and receives a plain Bearer token, then serves the second call from cache", async () => {
            const confidentialClientApplication: ConfidentialClientApplication =
                new ConfidentialClientApplication(bearerOverMtlsConfig);

            const authenticationResult: AuthenticationResult | null =
                await getBearerOverMtlsToken(
                    confidentialClientApplication,
                    clientCredentialRequestScopes
                );

            expect(authenticationResult?.accessToken).toBeTruthy();
            // The certificate authenticates the transport; the issued token is a plain Bearer, NOT
            // certificate-bound - the whole point of Bearer-over-mTLS (contrast with the PoP cell).
            expect(authenticationResult?.tokenType).not.toBe("mtls_pop");
            expect(authenticationResult?.bindingCertificate).toBeFalsy();
            expect(authenticationResult?.fromCache).toBe(false);

            // Second acquire without skipCache: the plain Bearer entry is cached under the standard
            // (non-thumbprint-fenced) access-token key, so an ordinary Bearer lookup must serve it
            // from cache without crashing on region/instance metadata: the entry is
            // keyed under the canonical login.* environment (only the token endpoint was mtlsauth.*),
            // so the ordinary lookup resolves against login.* and never the rewritten host.
            const cachedResult: AuthenticationResult | null =
                await getBearerOverMtlsToken(
                    confidentialClientApplication,
                    clientCredentialRequestScopes,
                    undefined,
                    false
                );

            expect(cachedResult?.accessToken).toEqual(
                authenticationResult?.accessToken
            );
            expect(cachedResult?.fromCache).toBe(true);

            // Env-lock tripwire (parity with Java/Go/Python): the certificate only rewrote the token
            // ENDPOINT to mtlsauth.*; the AT must be cached under the canonical login.* environment,
            // never the mtlsauth.* host - so a mis-cache under the rewritten host fails instantly.
            const cachedTokens = await NodeCacheTestUtils.getTokens(
                TEST_CACHE_LOCATION
            );
            expect(cachedTokens.accessTokens).toHaveLength(1);
            const cachedAccessToken = cachedTokens.accessTokens[0];
            expect(cachedAccessToken.credentialType).toBe("AccessToken");
            expect(cachedAccessToken.environment).toContain("login");
            expect(cachedAccessToken.environment).not.toContain("mtlsauth");
        });
    });
});
