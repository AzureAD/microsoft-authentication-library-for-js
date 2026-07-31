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
import { x5cToPem } from "../../src/utils/MtlsCertificateUtils.js";

const TENANT_ID = "3338040d-6c67-4c5b-b112-36a304b66dad";
const TENANTED_AUTHORITY = `https://login.microsoftonline.com/${TENANT_ID}`;

// Vanilla SNI cert (app clientCertificate) — authenticates the client at the TLS layer.
const APP_CERT: MtlsBindingCertificate = {
    x5c: Buffer.from("sni-leaf-cert-der-bytes").toString("base64"),
    privateKey:
        "-----BEGIN PRIVATE KEY-----\nsni-private-key\n-----END PRIVATE KEY-----\n",
};

// A private_key_jwt client assertion built by the app from the certificate (carries x5c on its header).
const CLIENT_ASSERTION = {
    assertion: "MOCK.CLIENT.ASSERTION",
    assertionType: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
};

const BEARER_TOKEN_RESPONSE: ServerAuthorizationTokenResponse = {
    token_type: Constants.AuthenticationScheme.BEARER,
    scope: TEST_CONFIG.DEFAULT_GRAPH_SCOPE.join(" "),
    expires_in: 3599,
    ext_expires_in: 3599,
    access_token: "thisIs.an.bearerOverMtls.accessT0ken",
};

const BEARER_NETWORK_RESPONSE: NetworkResponse<ServerAuthorizationTokenResponse> =
    {
        headers: {},
        body: BEARER_TOKEN_RESPONSE,
        status: 200,
    };

const MTLS_POP_NETWORK_RESPONSE: NetworkResponse<ServerAuthorizationTokenResponse> =
    {
        headers: {},
        body: {
            token_type: Constants.AuthenticationScheme.MTLS_POP,
            expires_in: 3599,
            ext_expires_in: 3599,
            access_token: "thisIs.an.mtlsPop.accessT0ken",
        },
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
 * Builds a ClientConfiguration wired for Bearer-over-mTLS: a tenanted authority and a real HttpClient
 * (so the mtls agent option is honored), with the HttpClient's POST spied to return the given token
 * response without touching the network.
 */
async function buildConfig(
    clientCredentials: ClientConfiguration["clientCredentials"],
    tokenResponse: NetworkResponse<ServerAuthorizationTokenResponse> = BEARER_NETWORK_RESPONSE
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
        .mockResolvedValue(tokenResponse);
    jest.spyOn(httpClient, "sendGetRequestAsync").mockResolvedValue(
        DEFAULT_OPENID_CONFIG_RESPONSE.body as never
    );

    config.authOptions.authority = await resolveTenantedAuthority();
    config.networkInterface = httpClient;
    config.clientCredentials = clientCredentials;

    return { config, postSpy };
}

describe("ClientCredentialClient Bearer-over-mTLS (sendCertificateOverMtls)", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const baseRequest = (): CommonClientCredentialRequest => ({
        authority: TENANTED_AUTHORITY,
        correlationId: TEST_CONFIG.CORRELATION_ID,
        scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
        skipCache: false,
    });

    describe("flag set with a certificate credential", () => {
        const credentials = () => ({
            mtlsBindingCertificate: APP_CERT,
            clientAssertion: CLIENT_ASSERTION,
            sendCertificateOverMtls: true,
        });

        it("targets the mTLS token endpoint", async () => {
            const { config, postSpy } = await buildConfig(credentials());
            const client = new ClientCredentialClient(config);

            await client.acquireToken(baseRequest());

            const endpoint = postSpy.mock.calls[0][0] as string;
            expect(endpoint).toContain("mtlsauth.microsoft.com");
            expect(endpoint).toContain(TENANT_ID);
            expect(endpoint).not.toContain("//login.microsoftonline.com");
        });

        it("keeps a plain Bearer token: client_assertion in the body, no req_cnf and no token_type=mtls_pop", async () => {
            const { config, postSpy } = await buildConfig(credentials());
            const client = new ClientCredentialClient(config);

            await client.acquireToken(baseRequest());

            const body = postSpy.mock.calls[0][1]?.body as string;
            expect(body).toContain("client_assertion=");
            expect(body).toContain("client_assertion_type=");
            expect(body).not.toContain("req_cnf");
            expect(body).not.toContain(
                `token_type=${encodeURIComponent("mtls_pop")}`
            );
        });

        it("presents the configured certificate on the TLS connection", async () => {
            const { config, postSpy } = await buildConfig(credentials());
            const client = new ClientCredentialClient(config);

            await client.acquireToken(baseRequest());

            const mtlsCertificate = postSpy.mock.calls[0][1]?.mtlsCertificate;
            expect(mtlsCertificate).toEqual({
                cert: x5cToPem(APP_CERT.x5c),
                key: APP_CERT.privateKey,
            });
        });

        it("returns a Bearer token that is not certificate-bound", async () => {
            const { config } = await buildConfig(credentials());
            const client = new ClientCredentialClient(config);

            const result = (await client.acquireToken(
                baseRequest()
            )) as AuthenticationResult;

            expect(result.tokenType).toBe("Bearer");
            expect(result.bindingCertificate).toBeUndefined();
        });

        it("serves the second acquisition from the plain Bearer cache without a second network call", async () => {
            const { config, postSpy } = await buildConfig(credentials());
            const client = new ClientCredentialClient(config);

            const first = (await client.acquireToken(
                baseRequest()
            )) as AuthenticationResult;
            const second = (await client.acquireToken(
                baseRequest()
            )) as AuthenticationResult;

            expect(postSpy).toHaveBeenCalledTimes(1);
            expect(second.fromCache).toBe(true);
            expect(second.accessToken).toEqual(first.accessToken);
            expect(second.tokenType).toBe(
                Constants.AuthenticationScheme.BEARER
            );

            // Note #3: the Bearer-over-mTLS token must be cached under the PLAIN Bearer key (credentialType
            // "AccessToken"), NOT the scheme-fenced "accesstoken_with_authscheme" key that mtls_pop uses -
            // that is what lets an ordinary Bearer lookup (the 2nd call above) find it.
            const accessTokenKey = config.storageInterface
                ?.getKeys()
                .find((key) => key.indexOf("accesstoken") >= 0);
            expect(accessTokenKey).toBeDefined();
            expect(accessTokenKey).not.toContain("accesstoken_with_authscheme");

            // And it must be keyed under the CANONICAL authority environment (login.*/preferred_cache),
            // never the physical mtlsauth.* POST host - so a 2nd lookup needs no region/instance metadata.
            const cachedToken =
                config.storageInterface?.getAccessTokenCredential(
                    accessTokenKey!,
                    TEST_CONFIG.CORRELATION_ID
                );
            expect(cachedToken?.credentialType).toBe("AccessToken");
            expect(cachedToken?.tokenType).toBe(
                Constants.AuthenticationScheme.BEARER
            );
            expect(cachedToken?.environment).toContain("login");
            expect(cachedToken?.environment).not.toContain("mtlsauth");
            expect(accessTokenKey).not.toContain("mtlsauth");
        });
    });

    describe("precedence and negative cases", () => {
        it("lets a per-request mtls_pop opt-in win over the app-level flag", async () => {
            const { config, postSpy } = await buildConfig(
                {
                    mtlsBindingCertificate: APP_CERT,
                    clientAssertion: CLIENT_ASSERTION,
                    sendCertificateOverMtls: true,
                },
                MTLS_POP_NETWORK_RESPONSE
            );
            const client = new ClientCredentialClient(config);

            const result = (await client.acquireToken({
                ...baseRequest(),
                authenticationScheme: Constants.AuthenticationScheme.MTLS_POP,
            })) as AuthenticationResult;

            const body = postSpy.mock.calls[0][1]?.body as string;
            // mTLS PoP path ran: bound token_type in the body, and the token is bound.
            expect(body).toContain(
                `token_type=${encodeURIComponent("mtls_pop")}`
            );
            expect(result.tokenType).toBe("mtls_pop");
        });

        it("does not route to the mTLS endpoint when the flag is unset", async () => {
            const { config, postSpy } = await buildConfig({
                mtlsBindingCertificate: APP_CERT,
                clientAssertion: CLIENT_ASSERTION,
            });
            const client = new ClientCredentialClient(config);

            await client.acquireToken(baseRequest());

            const endpoint = postSpy.mock.calls[0][0] as string;
            expect(endpoint).toContain("login.microsoftonline.com");
            expect(endpoint).not.toContain("mtlsauth.microsoft.com");
            expect(postSpy.mock.calls[0][1]?.mtlsCertificate).toBeUndefined();
        });
    });
});
