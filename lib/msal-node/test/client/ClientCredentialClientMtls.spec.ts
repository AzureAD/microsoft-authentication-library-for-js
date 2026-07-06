/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Authority,
    AuthorityOptions,
    AuthenticationResult,
    ClientConfiguration,
    Constants,
    Logger,
    MtlsBindingCertificate,
    NetworkResponse,
    ProtocolMode,
    ServerAuthorizationTokenResponse,
    StubPerformanceClient,
} from "@azure/msal-common";
import {
    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
} from "../test_kit/StringConstants.js";
import {
    ClientTestUtils,
    MockStorageClass,
    mockCrypto,
} from "./ClientTestUtils.js";
import { mockNetworkClient } from "../utils/MockNetworkClient.js";
import { CommonClientCredentialRequest } from "../../src/request/CommonClientCredentialRequest.js";
import { ClientCredentialClient } from "../../src/client/ClientCredentialClient.js";
import { HttpClient } from "../../src/network/HttpClient.js";
import {
    computeX5tSha256,
    x5cToPem,
} from "../../src/utils/MtlsCertificateUtils.js";

const TENANT_ID = "3338040d-6c67-4c5b-b112-36a304b66dad";
const TENANTED_AUTHORITY = `https://login.microsoftonline.com/${TENANT_ID}`;

// Vanilla SNI cert (app clientCertificate) — authenticates the client at the TLS layer.
const APP_CERT: MtlsBindingCertificate = {
    x5c: Buffer.from("sni-leaf-cert-der-bytes").toString("base64"),
    privateKey:
        "-----BEGIN PRIVATE KEY-----\nsni-private-key\n-----END PRIVATE KEY-----\n",
};

const MTLS_POP_TOKEN_RESPONSE: ServerAuthorizationTokenResponse = {
    token_type: Constants.AuthenticationScheme.MTLS_POP,
    expires_in: 3599,
    ext_expires_in: 3599,
    access_token: "thisIs.an.mtlsPop.accessT0ken",
};

const MTLS_POP_NETWORK_RESPONSE: NetworkResponse<ServerAuthorizationTokenResponse> =
    {
        headers: {},
        body: MTLS_POP_TOKEN_RESPONSE,
        status: 200,
    };

/**
 * Builds a resolved, tenanted Authority so that `getMtlsTokenEndpoint()` does not reject the
 * request as non-tenanted (the shared test authority is `/common`).
 */
async function resolveTenantedAuthority(): Promise<Authority> {
    const mockStorage = new MockStorageClass(
        TEST_CONFIG.MSAL_CLIENT_ID,
        mockCrypto,
        new Logger({}),
        new StubPerformanceClient()
    );
    const authorityOptions: AuthorityOptions = {
        protocolMode: ProtocolMode.AAD,
        knownAuthorities: [TENANTED_AUTHORITY],
        cloudDiscoveryMetadata: "",
        authorityMetadata: "",
    };
    const authority = new Authority(
        TENANTED_AUTHORITY,
        mockNetworkClient(
            DEFAULT_OPENID_CONFIG_RESPONSE.body,
            CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT
        ),
        mockStorage,
        authorityOptions,
        new Logger({ loggerCallback: (): void => {} }),
        TEST_CONFIG.CORRELATION_ID,
        new StubPerformanceClient()
    );
    await authority.resolveEndpointsAsync();
    return authority;
}

/**
 * Builds a ClientConfiguration wired for mTLS PoP: a tenanted authority and a real HttpClient
 * (required by the mTLS transport fail-fast), with the HttpClient's POST spied to return an
 * `mtls_pop` token response without touching the network.
 */
async function buildMtlsConfig(
    clientCredentials: ClientConfiguration["clientCredentials"]
): Promise<{ config: ClientConfiguration; postSpy: jest.SpyInstance }> {
    const config = await ClientTestUtils.createTestClientConfiguration(
        undefined,
        mockNetworkClient(
            DEFAULT_OPENID_CONFIG_RESPONSE.body,
            CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT
        )
    );

    const httpClient = new HttpClient();
    const postSpy = jest
        .spyOn(httpClient, "sendPostRequestAsync")
        .mockResolvedValue(MTLS_POP_NETWORK_RESPONSE);
    jest.spyOn(httpClient, "sendGetRequestAsync").mockResolvedValue(
        DEFAULT_OPENID_CONFIG_RESPONSE.body as never
    );

    config.authOptions.authority = await resolveTenantedAuthority();
    config.networkInterface = httpClient;
    config.clientCredentials = clientCredentials;

    return { config, postSpy };
}

describe("ClientCredentialClient mTLS Proof-of-Possession", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("vanilla SNI cert credential", () => {
        const baseRequest = (): CommonClientCredentialRequest => ({
            authority: TENANTED_AUTHORITY,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            authenticationScheme: Constants.AuthenticationScheme.MTLS_POP,
        });

        it("targets the mTLS token endpoint", async () => {
            const { config, postSpy } = await buildMtlsConfig({
                mtlsBindingCertificate: APP_CERT,
            });
            const client = new ClientCredentialClient(config);

            await client.acquireToken(baseRequest());

            const endpoint = postSpy.mock.calls[0][0] as string;
            expect(endpoint).toContain("mtlsauth.microsoft.com");
            expect(endpoint).toContain(TENANT_ID);
            expect(endpoint).not.toContain("//login.microsoftonline.com");
        });

        it("sends token_type=mtls_pop and omits client credentials from the body", async () => {
            const { config, postSpy } = await buildMtlsConfig({
                mtlsBindingCertificate: APP_CERT,
            });
            const client = new ClientCredentialClient(config);

            await client.acquireToken(baseRequest());

            const body = postSpy.mock.calls[0][1]?.body as string;
            expect(body).toContain(
                `token_type=${encodeURIComponent("mtls_pop")}`
            );
            // The certificate authenticates via TLS: no secret or assertion in the body.
            expect(body).not.toContain("client_secret");
            expect(body).not.toContain("client_assertion");
            expect(body).not.toContain("req_cnf");
        });

        it("presents the configured certificate on the TLS connection", async () => {
            const { config, postSpy } = await buildMtlsConfig({
                mtlsBindingCertificate: APP_CERT,
            });
            const client = new ClientCredentialClient(config);

            await client.acquireToken(baseRequest());

            const mtlsCertificate = postSpy.mock.calls[0][1]?.mtlsCertificate;
            expect(mtlsCertificate).toEqual({
                cert: x5cToPem(APP_CERT.x5c),
                key: APP_CERT.privateKey,
            });
        });

        it("surfaces token type and binding certificate (public material only) on the result", async () => {
            const { config } = await buildMtlsConfig({
                mtlsBindingCertificate: APP_CERT,
            });
            const client = new ClientCredentialClient(config);

            const result = (await client.acquireToken(
                baseRequest()
            )) as AuthenticationResult;

            expect(result.tokenType).toBe("mtls_pop");
            expect(result.bindingCertificate).toEqual({
                x5c: APP_CERT.x5c,
                thumbprintSha256: computeX5tSha256(APP_CERT.x5c),
            });
            // The private key is never returned to the caller.
            expect(JSON.stringify(result.bindingCertificate)).not.toContain(
                "PRIVATE KEY"
            );
        });
    });

    describe("negative cases", () => {
        it("throws when mTLS PoP is requested with a custom (non-HttpClient) network client", async () => {
            const config = await ClientTestUtils.createTestClientConfiguration(
                undefined,
                mockNetworkClient(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body,
                    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT
                )
            );
            config.authOptions.authority = await resolveTenantedAuthority();
            config.clientCredentials = { mtlsBindingCertificate: APP_CERT };
            // networkInterface stays the mock client (not an HttpClient instance).

            const client = new ClientCredentialClient(config);

            await expect(
                client.acquireToken({
                    authority: TENANTED_AUTHORITY,
                    correlationId: TEST_CONFIG.CORRELATION_ID,
                    scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    authenticationScheme:
                        Constants.AuthenticationScheme.MTLS_POP,
                })
            ).rejects.toThrow(/mtls_custom_network_client_unsupported/);
        });

        it("throws when mTLS PoP is requested but no binding certificate is available", async () => {
            const { config } = await buildMtlsConfig({});
            const client = new ClientCredentialClient(config);

            await expect(
                client.acquireToken({
                    authority: TENANTED_AUTHORITY,
                    correlationId: TEST_CONFIG.CORRELATION_ID,
                    scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    authenticationScheme:
                        Constants.AuthenticationScheme.MTLS_POP,
                })
            ).rejects.toThrow(/mtls_binding_certificate_missing/);
        });

        it("throws when the binding certificate is missing its private key", async () => {
            const { config } = await buildMtlsConfig({
                mtlsBindingCertificate: {
                    x5c: APP_CERT.x5c,
                    privateKey: "",
                },
            });
            const client = new ClientCredentialClient(config);

            await expect(
                client.acquireToken({
                    authority: TENANTED_AUTHORITY,
                    correlationId: TEST_CONFIG.CORRELATION_ID,
                    scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    authenticationScheme:
                        Constants.AuthenticationScheme.MTLS_POP,
                })
            ).rejects.toThrow(/mtls_binding_certificate_missing_private_key/);
        });

        it("validates mTLS configuration before any cache lookup (fails fast on cache hits)", async () => {
            const { config } = await buildMtlsConfig({
                mtlsBindingCertificate: APP_CERT,
            });
            /*
             * Reconfigure with a custom (non-HttpClient) network client, which cannot present a
             * client certificate. Even if a matching mtls_pop token were cached, the request must
             * fail fast rather than return an unusable token, so the cache is never consulted.
             */
            config.networkInterface = mockNetworkClient(
                DEFAULT_OPENID_CONFIG_RESPONSE.body,
                CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT
            );
            const client = new ClientCredentialClient(config);
            const cacheSpy = jest.spyOn(
                client,
                "getCachedAuthenticationResult"
            );

            await expect(
                client.acquireToken({
                    authority: TENANTED_AUTHORITY,
                    correlationId: TEST_CONFIG.CORRELATION_ID,
                    scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    authenticationScheme:
                        Constants.AuthenticationScheme.MTLS_POP,
                })
            ).rejects.toThrow(/mtls_custom_network_client_unsupported/);

            expect(cacheSpy).not.toHaveBeenCalled();
        });
    });

    describe("backward compatibility", () => {
        it("does not target the mTLS endpoint or bind a certificate for a default Bearer request", async () => {
            const { config, postSpy } = await buildMtlsConfig({
                mtlsBindingCertificate: APP_CERT,
                clientSecret: TEST_CONFIG.MSAL_CLIENT_SECRET,
            });
            // Default Bearer response for this backward-compatibility path.
            postSpy.mockResolvedValue({
                headers: {},
                status: 200,
                body: CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body,
            });
            const client = new ClientCredentialClient(config);

            const result = (await client.acquireToken({
                authority: TENANTED_AUTHORITY,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                // no authenticationScheme => Bearer
            })) as AuthenticationResult;

            const endpoint = postSpy.mock.calls[0][0] as string;
            expect(endpoint).not.toContain("mtlsauth");
            expect(postSpy.mock.calls[0][1]?.mtlsCertificate).toBeUndefined();
            expect(result.bindingCertificate).toBeUndefined();
        });
    });
});
