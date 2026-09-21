/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorizationCodeClient } from "../../src/common/client/AuthorizationCodeClient.js";
import { AuthenticationResult } from "../../src/common/response/AuthenticationResult.js";
import * as CommonConstants from "../../src/common/utils/Constants.js";
import {
    createClientAuthError,
    ClientAuthErrorCodes,
} from "../../src/common/error/ClientAuthError.js";
import { AccountEntity } from "../../src/common/cache/entities/AccountEntity.js";
import {
    AccountInfo,
    buildTenantProfile,
} from "../../src/common/account/AccountInfo.js";
import { TokenClaims } from "../../src/common/account/TokenClaims.js";
import {
    createInteractionRequiredAuthError,
    InteractionRequiredAuthErrorCodes,
} from "../../src/common/error/InteractionRequiredAuthError.js";
import { ClientAssertion } from "../../src/common/account/ClientCredentials.js";
import * as AccountEntityUtils from "../../src/common/cache/utils/AccountEntityUtils.js";
import { INetworkModule } from "../../src/common/network/INetworkModule.js";
import { Authority } from "../../src/common/authority/Authority.js";
import { CacheManager } from "../../src/common/cache/CacheManager.js";
import { CommonSilentFlowRequest } from "../../src/common/request/CommonSilentFlowRequest.js";
import { AccessTokenEntity } from "../../src/common/cache/entities/AccessTokenEntity.js";
import { IdTokenEntity } from "../../src/common/cache/entities/IdTokenEntity.js";
import { RefreshTokenEntity } from "../../src/common/cache/entities/RefreshTokenEntity.js";
import { ServerTelemetryManager } from "../../src/common/telemetry/server/ServerTelemetryManager.js";
import * as TimeUtils from "../../src/common/utils/TimeUtils.js";
import {
    DEFAULT_OPENID_CONFIG_RESPONSE,
    ID_TOKEN_CLAIMS,
    TEST_CONSTANTS,
    TEST_DATA_CLIENT_INFO,
} from "../utils/TestConstants.js";
import {
    ConfidentialClientApplication,
    OnBehalfOfRequest,
    UsernamePasswordRequest,
    ClientCredentialRequest,
    Configuration,
    AuthorizationCodeRequest,
    RefreshTokenRequest,
    SilentFlowRequest,
    AuthorizationUrlRequest,
    CryptoProvider,
    TokenCache,
} from "../../src/index.js";
import {
    AUTHENTICATION_RESULT,
    CAE_CONSTANTS,
    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT,
    TEST_CONFIG,
    TEST_TOKENS,
} from "../test_kit/StringConstants.js";
import { mockNetworkClient } from "../utils/MockNetworkClient.js";
import {
    ClientTestUtils,
    getClientAssertionCallback,
} from "./ClientTestUtils.js";
import { Constants, MSAL_FORCE_REGION } from "../../src/utils/Constants.js";
import jwt from "jsonwebtoken";
import { NodeAuthError } from "../../src/error/NodeAuthError.js";
import { CommonClientCredentialRequest } from "../../src/request/CommonClientCredentialRequest.js";
import * as NodeClientAuthErrorCodes from "../../src/error/ClientAuthErrorCodes.js";
import { ClientApplication } from "../../src/client/ClientApplication.js";
import { ClientCredentialClient } from "../../src/client/ClientCredentialClient.js";
import { HttpClient } from "../../src/network/HttpClient.js";
import { NodeStorage } from "../../src/cache/NodeStorage.js";

jest.mock("jsonwebtoken");

function createIdToken(idTokenClaims: Record<string, unknown>): string {
    return [
        Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url"),
        Buffer.from(JSON.stringify(idTokenClaims)).toString("base64url"),
        "signature",
    ].join(".");
}

function buildAccountFromIdTokenClaims(
    idTokenClaims: TokenClaims
): AccountEntity {
    const { oid, tid, preferred_username, emails, name, login_hint, upn } =
        idTokenClaims;
    const tenantId = tid || "";
    const homeAccountId = `${oid}.${tid}`;
    const accountInfo: AccountInfo = {
        homeAccountId,
        username: preferred_username || upn || emails?.[0] || "",
        localAccountId: oid || "",
        tenantId,
        environment: "login.windows.net",
        authorityType: "MSSTS",
        name,
        loginHint: login_hint,
        upn,
        tenantProfiles: new Map([
            [
                tenantId,
                buildTenantProfile(
                    homeAccountId,
                    oid || "",
                    tenantId,
                    undefined,
                    idTokenClaims
                ),
            ],
        ]),
    };

    return AccountEntityUtils.createAccountEntityFromAccountInfo(accountInfo);
}

function createAuthCodeNetworkClient(
    idTokenClaims: Record<string, unknown>
): INetworkModule {
    return mockNetworkClient(DEFAULT_OPENID_CONFIG_RESPONSE.body, {
        ...CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT,
        body: {
            ...CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body,
            id_token: createIdToken(idTokenClaims),
        },
    });
}

const refreshTestAccountEntity: AccountEntity =
    buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);

function createRefreshTestAccount(): AccountInfo {
    return {
        ...AccountEntityUtils.getAccountInfo(refreshTestAccountEntity),
        idTokenClaims: ID_TOKEN_CLAIMS,
        idToken: TEST_TOKENS.IDTOKEN_V2,
    };
}

function createRefreshTestIdToken(): IdTokenEntity {
    return {
        homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
        environment: refreshTestAccountEntity.environment,
        realm: ID_TOKEN_CLAIMS.tid,
        secret: AUTHENTICATION_RESULT.body.id_token,
        credentialType: CommonConstants.CredentialType.ID_TOKEN,
        lastUpdatedAt: Date.now().toString(),
    };
}

function createRefreshTestAccessToken(): AccessTokenEntity {
    const cachedAt = `${TimeUtils.nowSeconds()}`;
    return {
        homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
        environment: refreshTestAccountEntity.environment,
        realm: ID_TOKEN_CLAIMS.tid,
        secret: AUTHENTICATION_RESULT.body.access_token,
        target:
            TEST_CONFIG.DEFAULT_SCOPES.join(" ") +
            " " +
            TEST_CONFIG.DEFAULT_GRAPH_SCOPE.join(" "),
        credentialType: CommonConstants.CredentialType.ACCESS_TOKEN,
        cachedAt,
        expiresOn: (
            Number(cachedAt) + AUTHENTICATION_RESULT.body.expires_in
        ).toString(),
        refreshOn: `${Number(cachedAt) - 1}`,
        tokenType: CommonConstants.AuthenticationScheme.BEARER,
        lastUpdatedAt: Date.now().toString(),
    };
}

function createRefreshTestRefreshToken(): RefreshTokenEntity {
    return {
        homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
        environment: refreshTestAccountEntity.environment,
        realm: ID_TOKEN_CLAIMS.tid,
        secret: AUTHENTICATION_RESULT.body.refresh_token,
        credentialType: CommonConstants.CredentialType.REFRESH_TOKEN,
        lastUpdatedAt: Date.now().toString(),
    };
}

describe("ConfidentialClientApplication", () => {
    beforeAll(() => {
        jest.spyOn(jwt, <any>"sign").mockReturnValue("fake_jwt_string");
    });

    const networkClient: INetworkModule = mockNetworkClient(
        DEFAULT_OPENID_CONFIG_RESPONSE.body,
        CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT
    );

    let config: Configuration;
    beforeEach(async () => {
        config =
            await ClientTestUtils.createTestConfidentialClientConfiguration(
                undefined,
                networkClient
            );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("exports a class", () => {
        const client: ConfidentialClientApplication =
            new ConfidentialClientApplication(config);
        expect(client).toBeInstanceOf(ConfidentialClientApplication);
    });

    test("optional NodeAuthOptions values that are passed in as undefined will not break the application", () => {
        let client: ConfidentialClientApplication;

        // clientCertificate is already set, by default
        config.auth.clientSecret = undefined;
        client = new ConfidentialClientApplication(config);
        expect(client).toBeInstanceOf(ConfidentialClientApplication);

        config.auth.clientSecret = "secret";
        config.auth.clientCertificate = undefined;
        client = new ConfidentialClientApplication(config);
        expect(client).toBeInstanceOf(ConfidentialClientApplication);

        // clientSecret defined above
        config.auth.clientAssertion = undefined;
        client = new ConfidentialClientApplication(config);
        expect(client).toBeInstanceOf(ConfidentialClientApplication);
    });

    describe("auth code flow", () => {
        test("acquireTokenByAuthorizationCode", async () => {
            const acquireTokenByCodeSpy: jest.SpyInstance = jest.spyOn(
                ClientApplication.prototype,
                <any>"acquireTokenByCode"
            );
            const { nonce: _nonce, ...claimsWithoutNonce } = ID_TOKEN_CLAIMS;
            const configWithoutNonce =
                await ClientTestUtils.createTestConfidentialClientConfiguration(
                    undefined,
                    createAuthCodeNetworkClient(claimsWithoutNonce)
                );

            const request: AuthorizationCodeRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                redirectUri: TEST_CONSTANTS.REDIRECT_URI,
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
            };

            const client: ConfidentialClientApplication =
                new ConfidentialClientApplication(configWithoutNonce);

            const authResult = (await client.acquireTokenByCode(
                request
            )) as AuthenticationResult;
            expect(authResult.accessToken).toEqual(
                CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
            );
            expect(acquireTokenByCodeSpy).toHaveBeenCalledTimes(1);
        });

        test("acquireTokenByCode validates matching state", async () => {
            const state = new CryptoProvider().createNewGuid();
            const request: AuthorizationCodeRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                redirectUri: TEST_CONSTANTS.REDIRECT_URI,
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                state,
            };
            const authCodePayload = {
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                state,
            };
            const client = new ConfidentialClientApplication(config);

            await expect(
                client.acquireTokenByCode(request, authCodePayload)
            ).resolves.toEqual(
                expect.objectContaining({
                    accessToken:
                        CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body
                            .access_token,
                })
            );
        });

        test("acquireTokenByCode rejects mismatched state", async () => {
            const request: AuthorizationCodeRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                redirectUri: TEST_CONSTANTS.REDIRECT_URI,
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                state: new CryptoProvider().createNewGuid(),
            };
            const authCodePayload = {
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                state: new CryptoProvider().createNewGuid(),
            };
            const client = new ConfidentialClientApplication(config);

            await expect(
                client.acquireTokenByCode(request, authCodePayload)
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.stateMismatch, "")
            );
        });

        test("acquireTokenByCode rejects missing callback state", async () => {
            const request: AuthorizationCodeRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                redirectUri: TEST_CONSTANTS.REDIRECT_URI,
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                state: new CryptoProvider().createNewGuid(),
            };
            const client = new ConfidentialClientApplication(config);

            await expect(
                client.acquireTokenByCode(request, {
                    code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                })
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.stateMismatch, "")
            );
        });

        test("creates an authorization code URL", async () => {
            const request: AuthorizationUrlRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                redirectUri: TEST_CONSTANTS.REDIRECT_URI,
            };
            const client = new ConfidentialClientApplication(config);

            const url = await client.getAuthCodeUrl(request);

            expect(url).toContain(config.auth.clientId);
            expect(url).toContain(encodeURIComponent(request.redirectUri));
            expect(url).toContain(encodeURIComponent(request.scopes.join(" ")));
        });

        test.each([undefined, ""])(
            "acquireTokenByCode rejects ID Token nonce when request nonce is %p",
            async (nonce) => {
                const configWithNonce =
                    await ClientTestUtils.createTestConfidentialClientConfiguration(
                        undefined,
                        createAuthCodeNetworkClient(ID_TOKEN_CLAIMS)
                    );
                const request: AuthorizationCodeRequest = {
                    scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                    redirectUri: TEST_CONSTANTS.REDIRECT_URI,
                    code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                    nonce,
                };
                const client = new ConfidentialClientApplication(
                    configWithNonce
                );

                await expect(
                    client.acquireTokenByCode(request)
                ).rejects.toMatchObject({
                    errorCode: ClientAuthErrorCodes.nonceMismatch,
                });
            }
        );

        test("acquireTokenByAuthorizationCode validates matching request nonce", async () => {
            const matchingConfig =
                await ClientTestUtils.createTestConfidentialClientConfiguration(
                    undefined,
                    createAuthCodeNetworkClient(ID_TOKEN_CLAIMS)
                );
            const request: AuthorizationCodeRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                redirectUri: TEST_CONSTANTS.REDIRECT_URI,
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                nonce: ID_TOKEN_CLAIMS.nonce,
            };
            const client = new ConfidentialClientApplication(matchingConfig);

            const authResult = await client.acquireTokenByCode(request);

            expect(authResult.accessToken).toEqual(
                CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
            );
        });

        test("acquireTokenByAuthorizationCode rejects mismatched request nonce", async () => {
            const mismatchedConfig =
                await ClientTestUtils.createTestConfidentialClientConfiguration(
                    undefined,
                    createAuthCodeNetworkClient(ID_TOKEN_CLAIMS)
                );
            const request: AuthorizationCodeRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                redirectUri: TEST_CONSTANTS.REDIRECT_URI,
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                nonce: "different-nonce",
            };
            const client = new ConfidentialClientApplication(mismatchedConfig);

            await expect(
                client.acquireTokenByCode(request)
            ).rejects.toMatchObject({
                errorCode: ClientAuthErrorCodes.nonceMismatch,
            });
        });

        test("acquireTokenByAuthorizationCode rejects missing ID Token nonce when request nonce is provided", async () => {
            const { nonce: _nonce, ...claimsWithoutNonce } = ID_TOKEN_CLAIMS;
            const configWithoutNonce =
                await ClientTestUtils.createTestConfidentialClientConfiguration(
                    undefined,
                    createAuthCodeNetworkClient(claimsWithoutNonce)
                );
            const request: AuthorizationCodeRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                redirectUri: TEST_CONSTANTS.REDIRECT_URI,
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                nonce: ID_TOKEN_CLAIMS.nonce,
            };
            const client = new ConfidentialClientApplication(
                configWithoutNonce
            );

            await expect(
                client.acquireTokenByCode(request)
            ).rejects.toMatchObject({
                errorCode: ClientAuthErrorCodes.nonceMismatch,
            });
        });

        describe("CAE, claims and client capabilities", () => {
            let createTokenRequestBodySpy: jest.SpyInstance;
            let client: ConfidentialClientApplication;
            let authorizationCodeRequest: AuthorizationCodeRequest;
            beforeEach(async () => {
                createTokenRequestBodySpy = jest.spyOn(
                    AuthorizationCodeClient.prototype,
                    <any>"createTokenRequestBody"
                );

                const config: Configuration =
                    await ClientTestUtils.createTestConfidentialClientConfiguration(
                        CAE_CONSTANTS.CLIENT_CAPABILITIES,
                        mockNetworkClient(
                            {}, // not needed
                            CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT
                        )
                    );
                client = new ConfidentialClientApplication(config);

                authorizationCodeRequest = {
                    scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                    redirectUri: TEST_CONSTANTS.REDIRECT_URI,
                    code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                };
            });

            it.each([
                [CAE_CONSTANTS.EMPTY_CLAIMS, CAE_CONSTANTS.MERGED_EMPTY_CLAIMS],
                [
                    CAE_CONSTANTS.CLAIMS_WITH_ADDITIONAL_CLAIMS,
                    CAE_CONSTANTS.MERGED_CLAIMS_WITH_ADDITIONAL_CLAIMS,
                ],
                [
                    CAE_CONSTANTS.CLAIMS_WITH_ADDITIONAL_KEY,
                    CAE_CONSTANTS.MERGED_CLAIMS_WITH_ADDITIONAL_KEY,
                ],
                [
                    CAE_CONSTANTS.CLAIM_WITH_ADDITIONAL_KEY_AND_ACCESS_KEY,
                    CAE_CONSTANTS.MERGED_CLAIM_WITH_ADDITIONAL_KEY_AND_ACCESS_KEY,
                ],
            ])(
                "Validates that claims and client capabilities are correctly merged",
                async (claims, mergedClaims) => {
                    // acquire a token with a client that has client capabilities, but no claims in the request
                    // verify that it comes from the IDP
                    const authResult = (await client.acquireTokenByCode(
                        authorizationCodeRequest
                    )) as AuthenticationResult;
                    expect(authResult.accessToken).toEqual(
                        CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body
                            .access_token
                    );
                    expect(authResult.fromCache).toBe(false);

                    // verify that the client capabilities have been merged with the (empty) claims
                    const returnVal: string = (await createTokenRequestBodySpy
                        .mock.results[0].value) as string;
                    expect(
                        decodeURIComponent(
                            returnVal
                                .split("&")
                                .filter((key: string) =>
                                    key.includes("claims=")
                                )[0]
                                .split("claims=")[1]
                        )
                    ).toEqual(CAE_CONSTANTS.MERGED_EMPTY_CLAIMS);

                    // skip cache lookup verification because acquireTokenByCode does not pull elements from the cache

                    // acquire a token with a client that has client capabilities, and has claims in the request
                    // verify that it comes from the IDP
                    authorizationCodeRequest.claims = claims;
                    const authResult2 = (await client.acquireTokenByCode(
                        authorizationCodeRequest
                    )) as AuthenticationResult;
                    expect(authResult2.accessToken).toEqual(
                        CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body
                            .access_token
                    );
                    expect(authResult2.fromCache).toBe(false);

                    // verify that the client capabilities have been merged with the claims
                    const returnVal2: string = (await createTokenRequestBodySpy
                        .mock.results[1].value) as string;
                    expect(
                        decodeURIComponent(
                            returnVal2
                                .split("&")
                                .filter((key: string) =>
                                    key.includes("claims=")
                                )[0]
                                .split("claims=")[1]
                        )
                    ).toEqual(mergedClaims);
                }
            );
        });
    });

    test("acquireTokenBySilentFlow", async () => {
        const acquireTokenSilentSpy: jest.SpyInstance = jest.spyOn(
            ClientApplication.prototype,
            <any>"acquireTokenSilent"
        );

        const testAccountEntity: AccountEntity =
            buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);

        const testAccount: AccountInfo = {
            ...AccountEntityUtils.getAccountInfo(testAccountEntity),
            idTokenClaims: ID_TOKEN_CLAIMS,
            idToken: TEST_TOKENS.IDTOKEN_V2,
        };

        const request: SilentFlowRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            account: testAccount,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            forceRefresh: false,
        };

        const client: ConfidentialClientApplication =
            new ConfidentialClientApplication(config);
        const overwriteCacheSpy = jest.spyOn(
            TokenCache.prototype,
            "overwriteCache"
        );

        await expect(client.acquireTokenSilent(request)).rejects.toMatchObject(
            createInteractionRequiredAuthError(
                InteractionRequiredAuthErrorCodes.noTokensFound,
                ""
            )
        );
        expect(overwriteCacheSpy).toHaveBeenCalledTimes(1);
        expect(acquireTokenSilentSpy).toHaveBeenCalledTimes(1);
    });

    test("preserves failure telemetry when account is missing", async () => {
        const requestError = createClientAuthError(
            ClientAuthErrorCodes.noAccountInSilentRequest,
            TEST_CONFIG.CORRELATION_ID
        );
        jest.spyOn(
            ClientApplication.prototype,
            <any>"acquireCachedTokenSilent"
        ).mockRejectedValue(requestError);
        const cacheFailedRequestSpy = jest
            .spyOn(ServerTelemetryManager.prototype, "cacheFailedRequest")
            .mockImplementation();
        const client = new ConfidentialClientApplication(config);
        const request = {
            account: undefined,
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            correlationId: TEST_CONFIG.CORRELATION_ID,
        } as unknown as SilentFlowRequest;

        await expect(client.acquireTokenSilent(request)).rejects.toMatchObject({
            errorCode: ClientAuthErrorCodes.noAccountInSilentRequest,
            correlationId: TEST_CONFIG.CORRELATION_ID,
        });
        expect(cacheFailedRequestSpy).toHaveBeenCalledWith(requestError);
    });

    test("acquireTokenSilent refreshes when refreshOn has passed", async () => {
        jest.spyOn(
            Authority.prototype,
            <any>"getEndpointMetadataFromNetwork"
        ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        AUTHENTICATION_RESULT.body.client_info =
            TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO;
        jest.spyOn(
            HttpClient.prototype,
            "sendPostRequestAsync"
        ).mockResolvedValue(AUTHENTICATION_RESULT);
        jest.spyOn(CacheManager.prototype, "getIdToken").mockReturnValue(
            createRefreshTestIdToken()
        );
        jest.spyOn(CacheManager.prototype, "getAccessToken").mockReturnValue(
            createRefreshTestAccessToken()
        );
        jest.spyOn(CacheManager.prototype, "getRefreshToken").mockReturnValue(
            createRefreshTestRefreshToken()
        );
        jest.spyOn(NodeStorage.prototype, "getAccount").mockReturnValue(
            refreshTestAccountEntity
        );
        jest.spyOn(CacheManager.prototype, "getAllAccounts").mockReturnValue([
            createRefreshTestAccount(),
        ]);

        const request: CommonSilentFlowRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            account: createRefreshTestAccount(),
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            forceRefresh: false,
        };
        const client = new ConfidentialClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                clientSecret: TEST_CONFIG.MSAL_CLIENT_SECRET,
                authority: TEST_CONSTANTS.DEFAULT_AUTHORITY,
            },
        });

        await client.acquireTokenSilent(request);

        const waitForRefreshedAccessToken = async (
            cache: NodeStorage
        ): Promise<AccessTokenEntity | null> => {
            for (let attempt = 0; attempt < 400; attempt++) {
                const accessTokenKey = cache
                    .getKeys()
                    .find((value) => value.includes("accesstoken"));
                if (accessTokenKey) {
                    return cache.getAccessTokenCredential(accessTokenKey);
                }
                await new Promise((resolve) => setTimeout(resolve, 1));
            }
            return null;
        };

        const refreshedAccessToken = await waitForRefreshedAccessToken(
            // @ts-expect-error Test verifies the internal cache side effect.
            client.storage
        );
        expect(refreshedAccessToken?.clientId).toEqual(
            createRefreshTestAccessToken().clientId
        );
    });

    test("coalesces equivalent concurrent silent requests", async () => {
        let releaseRequest: (result: AuthenticationResult) => void = () => {};
        const requestGate = new Promise<AuthenticationResult>((resolve) => {
            releaseRequest = resolve;
        });
        const acquireTokenSilentAsyncSpy = jest
            .spyOn(ClientApplication.prototype, <any>"acquireTokenSilentAsync")
            .mockReturnValue(requestGate);
        const testAccountEntity: AccountEntity =
            buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);
        const testAccount: AccountInfo = {
            ...AccountEntityUtils.getAccountInfo(testAccountEntity),
            idTokenClaims: ID_TOKEN_CLAIMS,
            idToken: TEST_TOKENS.IDTOKEN_V2,
        };
        const client = new ConfidentialClientApplication(config);
        const request: SilentFlowRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            account: testAccount,
            authority: TEST_CONFIG.validAuthority,
        };

        const firstRequest = client.acquireTokenSilent({
            ...request,
            correlationId: "first-correlation-id",
        });
        const secondRequest = client.acquireTokenSilent({
            ...request,
            correlationId: "second-correlation-id",
        });

        await new Promise<void>((resolve) => setImmediate(resolve));
        expect(acquireTokenSilentAsyncSpy).toHaveBeenCalledTimes(1);

        releaseRequest({ correlationId: "" } as AuthenticationResult);
        await expect(
            Promise.all([firstRequest, secondRequest])
        ).resolves.toEqual([
            { correlationId: "first-correlation-id" },
            { correlationId: "second-correlation-id" },
        ]);
    });

    test("does not coalesce silent requests with different redirect URIs", async () => {
        let releaseRequest: (result: AuthenticationResult) => void = () => {};
        const requestGate = new Promise<AuthenticationResult>((resolve) => {
            releaseRequest = resolve;
        });
        const acquireTokenSilentAsyncSpy = jest
            .spyOn(ClientApplication.prototype, <any>"acquireTokenSilentAsync")
            .mockReturnValue(requestGate);
        const testAccountEntity: AccountEntity =
            buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);
        const testAccount: AccountInfo = {
            ...AccountEntityUtils.getAccountInfo(testAccountEntity),
            idTokenClaims: ID_TOKEN_CLAIMS,
            idToken: TEST_TOKENS.IDTOKEN_V2,
        };
        const client = new ConfidentialClientApplication(config);
        const request: SilentFlowRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            account: testAccount,
            authority: TEST_CONFIG.validAuthority,
        };

        const firstRequest = client.acquireTokenSilent({
            ...request,
            redirectUri: "http://localhost:3000/first",
        });
        const secondRequest = client.acquireTokenSilent({
            ...request,
            redirectUri: "http://localhost:3000/second",
        });

        await new Promise<void>((resolve) => setImmediate(resolve));
        expect(acquireTokenSilentAsyncSpy).toHaveBeenCalledTimes(2);

        releaseRequest({ correlationId: "" } as AuthenticationResult);
        await Promise.all([firstRequest, secondRequest]);
    });

    test("acquireTokenByRefreshToken", async () => {
        const acquireTokenByRefreshTokenSpy: jest.SpyInstance = jest.spyOn(
            ClientApplication.prototype,
            <any>"acquireTokenByRefreshToken"
        );

        const request: RefreshTokenRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
        };

        const client: ConfidentialClientApplication =
            new ConfidentialClientApplication(config);

        const authResult = (await client.acquireTokenByRefreshToken(
            request
        )) as AuthenticationResult;
        expect(authResult.accessToken).toEqual(
            CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
        );
        expect(acquireTokenByRefreshTokenSpy).toHaveBeenCalledTimes(1);
    });

    describe("client credential flow", () => {
        test("acquireTokenByClientCredential", async () => {
            const acquireTokenByClientCredentialSpy: jest.SpyInstance =
                jest.spyOn(
                    ConfidentialClientApplication.prototype,
                    <any>"acquireTokenByClientCredential"
                );

            const request: ClientCredentialRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                skipCache: false,
            };

            const client: ConfidentialClientApplication =
                new ConfidentialClientApplication(config);

            const authResult = (await client.acquireTokenByClientCredential(
                request
            )) as AuthenticationResult;
            expect(authResult.accessToken).toEqual(
                CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
            );
            expect(acquireTokenByClientCredentialSpy).toHaveBeenCalledTimes(1);
        });

        describe("clientAssertion is used to acquire a token after being provided in the request", () => {
            beforeEach(() => {
                jest.spyOn(
                    ClientCredentialClient.prototype,
                    "acquireToken"
                ).mockImplementation(
                    (request: CommonClientCredentialRequest) => {
                        expect(request.clientAssertion).not.toBe(undefined);
                        expect(request.clientAssertion?.assertion).toBe(
                            TEST_CONFIG.TEST_REQUEST_ASSERTION
                        );
                        expect(request.clientAssertion?.assertionType).toBe(
                            Constants.JWT_BEARER_ASSERTION_TYPE
                        );
                        return Promise.resolve(null);
                    }
                );
            });

            it.each([
                TEST_CONFIG.TEST_REQUEST_ASSERTION,
                getClientAssertionCallback(TEST_CONFIG.TEST_REQUEST_ASSERTION),
            ])(
                "acquireTokenByClientCredential with client assertion",
                async (clientAssertion) => {
                    const request: ClientCredentialRequest = {
                        scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                        skipCache: false,
                        clientAssertion: clientAssertion,
                    };

                    const client: ConfidentialClientApplication =
                        new ConfidentialClientApplication(config);
                    await client.acquireTokenByClientCredential(request);
                }
            );
        });

        describe("region is determined correctly", () => {
            const checkRegion = (
                endpointFromSpy: string,
                expectedRegion: string
            ) => {
                const endpoint: string = endpointFromSpy;
                const regionMatch: Array<string> | null = endpoint.match(
                    "https://(.*).login.microsoft.com/tenantid/oauth2/v2.0/token/"
                );
                expect(regionMatch && regionMatch.length).toEqual(2);
                expect(regionMatch && regionMatch[1]).toEqual(expectedRegion);
            };

            let acquireTokenByClientCredentialSpy: jest.SpyInstance;
            let createAuthoritySpy: jest.SpyInstance;
            let sendPostRequestAsyncSpy: jest.SpyInstance;
            let client: ConfidentialClientApplication;
            let request: ClientCredentialRequest;
            beforeEach(() => {
                acquireTokenByClientCredentialSpy = jest.spyOn(
                    ConfidentialClientApplication.prototype,
                    <any>"acquireTokenByClientCredential"
                );

                createAuthoritySpy = jest.spyOn(
                    ConfidentialClientApplication.prototype,
                    <any>"createAuthority"
                );

                sendPostRequestAsyncSpy = jest.spyOn(
                    networkClient,
                    <any>"sendPostRequestAsync"
                );

                client = new ConfidentialClientApplication(config);

                request = {
                    scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                    skipCache: false,
                };

                process.env[MSAL_FORCE_REGION] = "eastus";
            });

            afterEach(() => {
                delete process.env[MSAL_FORCE_REGION];
            });

            test("region is not passed in through the request, the MSAL_FORCE_REGION environment variable is used", async () => {
                const authResult = (await client.acquireTokenByClientCredential(
                    request
                )) as AuthenticationResult;
                expect(authResult.accessToken).toEqual(
                    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
                );
                expect(acquireTokenByClientCredentialSpy).toHaveBeenCalledTimes(
                    1
                );
                expect(createAuthoritySpy.mock.lastCall[2].azureRegion).toEqual(
                    process.env[MSAL_FORCE_REGION]
                );

                checkRegion(
                    sendPostRequestAsyncSpy.mock.lastCall[0],
                    process.env[MSAL_FORCE_REGION] as string
                );
            });

            test("region is passed in through the request, the MSAL_FORCE_REGION environment variable is not used", async () => {
                const region = "westus";

                const authResult = (await client.acquireTokenByClientCredential(
                    { ...request, azureRegion: region }
                )) as AuthenticationResult;
                expect(authResult.accessToken).toEqual(
                    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
                );
                expect(acquireTokenByClientCredentialSpy).toHaveBeenCalledTimes(
                    1
                );
                expect(createAuthoritySpy.mock.lastCall[2].azureRegion).toEqual(
                    region
                );

                checkRegion(sendPostRequestAsyncSpy.mock.lastCall[0], region);
            });

            test('region is not passed in through the request, the MSAL_FORCE_REGION environment variable is set to "DisableMsalForceRegion"', async () => {
                const authResult = (await client.acquireTokenByClientCredential(
                    { ...request, azureRegion: "DisableMsalForceRegion" }
                )) as AuthenticationResult;
                expect(authResult.accessToken).toEqual(
                    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
                );
                expect(acquireTokenByClientCredentialSpy).toHaveBeenCalledTimes(
                    1
                );
                expect(
                    createAuthoritySpy.mock.lastCall[2].azureRegion
                ).toBeUndefined();

                const endpoint: string =
                    sendPostRequestAsyncSpy.mock.lastCall[0];
                const regionMatch: Array<string> | null = endpoint.match(
                    "https://(.*).login.microsoft.com/tenantid/oauth2/v2.0/token/"
                );
                expect(regionMatch).toBeNull();
            });
        });

        test("acquireTokenByClientCredential request does not contain OIDC scopes", async () => {
            const request: ClientCredentialRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                skipCache: false,
            };

            jest.spyOn(
                ClientCredentialClient.prototype,
                "acquireToken"
            ).mockImplementation((request: CommonClientCredentialRequest) => {
                CommonConstants.OIDC_DEFAULT_SCOPES.forEach((scope: string) => {
                    expect(request.scopes).not.toContain(scope);
                });
                return Promise.resolve(null);
            });

            const client: ConfidentialClientApplication =
                new ConfidentialClientApplication(config);

            // this request will fail because ClientCredentialClient's acquireToken is mocked
            // so that the scopes can be examined
            await client.acquireTokenByClientCredential(request);
        });

        test('acquireTokenByClientCredential throws missingTenantIdError if "common", ""organization", or "consumers" was provided as the tenant id', async () => {
            const request: ClientCredentialRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                skipCache: false,
            };

            config.auth.authority = TEST_CONSTANTS.DEFAULT_AUTHORITY; // contains "common"
            const client: ConfidentialClientApplication =
                new ConfidentialClientApplication(config);

            await expect(
                client.acquireTokenByClientCredential(request)
            ).rejects.toMatchObject(
                createClientAuthError(
                    NodeClientAuthErrorCodes.missingTenantIdError,
                    ""
                )
            );
        });

        test("ensures that developer-provided certificate can be provided with a SHA-256 thumbprint, and is attached to client assertion", async () => {
            const getClientAssertionSpy: jest.SpyInstance = jest.spyOn(
                ClientApplication.prototype,
                <any>"getClientAssertion"
            );

            const client: ConfidentialClientApplication =
                new ConfidentialClientApplication(config);

            const request: ClientCredentialRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                skipCache: false,
            };

            const authResult = (await client.acquireTokenByClientCredential(
                request
            )) as AuthenticationResult;
            expect(authResult.accessToken).toEqual(
                CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
            );

            const clientAssertion: ClientAssertion = await getClientAssertionSpy
                .mock.results[0].value;
            expect(clientAssertion.assertion.length).toBeGreaterThan(1);
            expect(clientAssertion.assertionType).toBe(
                Constants.JWT_BEARER_ASSERTION_TYPE
            );
        });

        test("ensures that developer-provided certificate can be provided with a SHA-1 thumbprint", async () => {
            delete config.auth.clientCertificate?.thumbprintSha256;

            const client: ConfidentialClientApplication =
                new ConfidentialClientApplication(config);

            const request: ClientCredentialRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                skipCache: false,
            };

            const authResult = (await client.acquireTokenByClientCredential(
                request
            )) as AuthenticationResult;
            expect(authResult.accessToken).toEqual(
                CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
            );
        });

        test("ensures that developer-provided certificate must be provided with a SHA-1 or SHA-2 thumbprint", async () => {
            delete config.auth.clientCertificate?.thumbprint;
            delete config.auth.clientCertificate?.thumbprintSha256;

            expect(() => {
                new ConfidentialClientApplication(config);
            }).toThrow(NodeAuthError.createStateNotFoundError());
        });
    });

    test("acquireTokenOnBehalfOf", async () => {
        const acquireTokenOnBehalfOfSpy: jest.SpyInstance = jest.spyOn(
            ConfidentialClientApplication.prototype,
            <any>"acquireTokenOnBehalfOf"
        );

        const request: OnBehalfOfRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            oboAssertion: TEST_CONSTANTS.ACCESS_TOKEN,
        };

        const client: ConfidentialClientApplication =
            new ConfidentialClientApplication(config);

        const authResult = (await client.acquireTokenOnBehalfOf(
            request
        )) as AuthenticationResult;
        expect(authResult.accessToken).toEqual(
            CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
        );
        expect(acquireTokenOnBehalfOfSpy).toHaveBeenCalledTimes(1);
    });

    test("acquireTokenByUsernamePassword", async () => {
        const acquireTokenByUsernamePasswordSpy: jest.SpyInstance = jest.spyOn(
            ClientApplication.prototype,
            <any>"acquireTokenByUsernamePassword"
        );

        const request: UsernamePasswordRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            username: TEST_CONSTANTS.USERNAME,
            password: TEST_CONSTANTS.PASSWORD,
        };

        const client: ConfidentialClientApplication =
            new ConfidentialClientApplication(config);

        const authResult = (await client.acquireTokenByUsernamePassword(
            request
        )) as AuthenticationResult;
        expect(authResult.accessToken).toEqual(
            CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
        );
        expect(acquireTokenByUsernamePasswordSpy).toHaveBeenCalledTimes(1);
    });
});
