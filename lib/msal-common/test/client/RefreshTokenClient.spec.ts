/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
    TEST_TOKENS,
    TEST_DATA_CLIENT_INFO,
    ID_TOKEN_CLAIMS,
    AUTHENTICATION_RESULT_WITH_FOCI,
    CORS_SIMPLE_REQUEST_HEADERS,
    POP_AUTHENTICATION_RESULT,
    SSH_AUTHENTICATION_RESULT,
    AUTHENTICATION_RESULT_NO_REFRESH_TOKEN,
    AUTHENTICATION_RESULT_WITH_HEADERS,
    CORS_RESPONSE_HEADERS,
    TEST_SSH_VALUES,
    BAD_TOKEN_ERROR_RESPONSE,
} from "../test_kit/StringConstants.js";
import { BaseClient } from "../../src/client/BaseClient.js";
import {
    GrantType,
    Constants,
    CredentialType,
    AuthenticationScheme,
    ThrottlingConstants,
} from "../../src/utils/Constants.js";
import * as AADServerParamKeys from "../../src/constants/AADServerParamKeys.js";
import { ClientTestUtils, MockStorageClass } from "./ClientTestUtils.js";
import { Authority } from "../../src/authority/Authority.js";
import { RefreshTokenClient } from "../../src/client/RefreshTokenClient.js";
import { CommonRefreshTokenRequest } from "../../src/request/CommonRefreshTokenRequest.js";
import { AccountEntity } from "../../src/cache/entities/AccountEntity.js";
import { RefreshTokenEntity } from "../../src/cache/entities/RefreshTokenEntity.js";
import { AuthenticationResult } from "../../src/response/AuthenticationResult.js";
import { AccountInfo } from "../../src/account/AccountInfo.js";
import { CacheManager } from "../../src/cache/CacheManager.js";
import { ClientConfiguration } from "../../src/config/ClientConfiguration.js";
import { CommonSilentFlowRequest } from "../../src/request/CommonSilentFlowRequest.js";
import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../../src/error/ClientAuthError.js";
import {
    ClientConfigurationErrorCodes,
    createClientConfigurationError,
} from "../../src/error/ClientConfigurationError.js";
import { SilentFlowClient } from "../../src/client/SilentFlowClient.js";
import { AppMetadataEntity } from "../../src/cache/entities/AppMetadataEntity.js";
import { CcsCredentialType } from "../../src/account/CcsCredential.js";
import {
    InteractionRequiredAuthError,
    InteractionRequiredAuthErrorCodes,
    createInteractionRequiredAuthError,
} from "../../src/error/InteractionRequiredAuthError.js";
import { StubPerformanceClient } from "../../src/telemetry/performance/StubPerformanceClient.js";
import { ProtocolMode } from "../../src/authority/ProtocolMode.js";
import * as TimeUtils from "../../src/utils/TimeUtils.js";
import { buildAccountFromIdTokenClaims } from "msal-test-utils";
import { generateCredentialKey } from "../../src/cache/utils/CacheHelpers.js";

const testAccountEntity: AccountEntity = new AccountEntity();
testAccountEntity.homeAccountId = `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`;
testAccountEntity.localAccountId = ID_TOKEN_CLAIMS.oid;
testAccountEntity.environment = "login.windows.net";
testAccountEntity.realm = ID_TOKEN_CLAIMS.tid;
testAccountEntity.username = ID_TOKEN_CLAIMS.preferred_username;
testAccountEntity.authorityType = "MSSTS";

const testAppMetadata: AppMetadataEntity = {
    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
    environment: TEST_CONFIG.validAuthorityHost,
    familyId: TEST_CONFIG.THE_FAMILY_ID,
};

const testRefreshTokenEntity: RefreshTokenEntity = {
    homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
    environment: testAccountEntity.environment,
    realm: ID_TOKEN_CLAIMS.tid,
    secret: AUTHENTICATION_RESULT.body.refresh_token,
    credentialType: CredentialType.REFRESH_TOKEN,
};

const testFamilyRefreshTokenEntity: RefreshTokenEntity = {
    homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
    environment: testAccountEntity.environment,
    realm: ID_TOKEN_CLAIMS.tid,
    secret: AUTHENTICATION_RESULT.body.refresh_token,
    credentialType: CredentialType.REFRESH_TOKEN,
    familyId: TEST_CONFIG.THE_FAMILY_ID,
};

describe("RefreshTokenClient unit tests", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    let stubPerformanceClient: StubPerformanceClient;
    beforeEach(async () => {
        stubPerformanceClient = new StubPerformanceClient();
    });

    describe("Constructor", () => {
        it("creates a RefreshTokenClient", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            expect(client).not.toBeNull();
            expect(client instanceof RefreshTokenClient).toBe(true);
            expect(client instanceof BaseClient).toBe(true);
        });
    });

    describe("executeTokenRequest", () => {
        let config: ClientConfiguration;

        const refreshTokenRequest: CommonRefreshTokenRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_TOKENS.REFRESH_TOKEN,
            claims: TEST_CONFIG.CLAIMS,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            authenticationScheme:
                TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
        };

        beforeEach(async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            config = await ClientTestUtils.createTestClientConfiguration();
        });

        it("Adds correlationId to the /token query string", (done) => {
            jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"executePostToTokenEndpoint"
                // @ts-expect-error
            ).mockImplementation((url: string) => {
                try {
                    expect(url).toContain(
                        `client-request-id=${TEST_CONFIG.CORRELATION_ID}`
                    );
                    done();
                } catch (error) {
                    done(error);
                }
            });

            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            const refreshTokenRequest: CommonRefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                claims: TEST_CONFIG.CLAIMS,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
                tokenQueryParameters: {
                    testParam: "testValue",
                },
            };

            client.acquireToken(refreshTokenRequest).catch((e) => {
                // Catch errors thrown after the function call this test is testing
            });
        });

        it("Adds tokenQueryParameters to the /token request", (done) => {
            jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"executePostToTokenEndpoint"
                // @ts-expect-error
            ).mockImplementation((url: string) => {
                expect(url.includes("/token?testParam=testValue")).toBe(true);
                done();
            });

            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            const refreshTokenRequest: CommonRefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                claims: TEST_CONFIG.CLAIMS,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
                tokenQueryParameters: {
                    testParam: "testValue",
                },
            };

            client.acquireToken(refreshTokenRequest).catch((e) => {
                // Catch errors thrown after the function call this test is testing
            });
        });

        it("Adds tokenBodyParameters to the /token request", (done) => {
            jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"executePostToTokenEndpoint"
                // @ts-expect-error
            ).mockImplementation((url: string, body: string) => {
                expect(body).toContain("testParam=testValue");
                done();
            });

            const client = new RefreshTokenClient(config);

            const refreshTokenRequest: CommonRefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                claims: TEST_CONFIG.CLAIMS,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
                tokenBodyParameters: {
                    testParam: "testValue",
                },
            };

            client.acquireToken(refreshTokenRequest).catch((error) => {
                // Catch errors thrown after the function call this test is testing
            });
        });

        it("Checks whether performance telemetry startMeasurement method is called", async () => {
            const spy = jest.spyOn(stubPerformanceClient, "startMeasurement");

            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(AUTHENTICATION_RESULT);

            await client.acquireToken(refreshTokenRequest);
            expect(spy).toHaveBeenCalled();
        });

        it("Checks whether performance telemetry add method is called", async () => {
            const spy: any = jest.spyOn(stubPerformanceClient, "addFields");

            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            jest.spyOn(
                // @ts-ignore
                client.networkClient,
                "sendPostRequestAsync"
            ).mockResolvedValue({ ...AUTHENTICATION_RESULT, headers: {} });

            let refreshTokenSize;
            await client.acquireToken(refreshTokenRequest).then(() => {
                expect(spy).toHaveBeenCalled();
                for (let i = 0; i < spy.mock.calls.length; i++) {
                    const arg = spy.mock.calls[i][0];
                    if (typeof arg.refreshTokenSize !== "undefined") {
                        refreshTokenSize = arg.refreshTokenSize;
                        break;
                    }
                }
            });

            expect(refreshTokenSize).toBe(19);
        });

        it("Checks whether performance telemetry add method is called- no rt", async () => {
            const spy: any = jest.spyOn(stubPerformanceClient, "addFields");

            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            jest.spyOn(
                // @ts-ignore
                client.networkClient,
                "sendPostRequestAsync"
            ).mockResolvedValue({
                ...AUTHENTICATION_RESULT_NO_REFRESH_TOKEN,
                headers: { ...AUTHENTICATION_RESULT_WITH_HEADERS.headers },
            });

            let refreshTokenSize;
            await client.acquireToken(refreshTokenRequest).then(() => {
                expect(spy).toHaveBeenCalled();
                for (let i = 0; i < spy.mock.calls.length; i++) {
                    const arg = spy.mock.calls[i][0];
                    if (typeof arg.refreshTokenSize !== "undefined") {
                        refreshTokenSize = arg.refreshTokenSize;
                        break;
                    }
                }
            });

            expect(refreshTokenSize).toBe(0);
        });
    });

    describe("acquireToken APIs", () => {
        let config: ClientConfiguration;
        let client: RefreshTokenClient;

        const testAccount: AccountInfo =
            buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS).getAccountInfo();
        testAccount.idTokenClaims = ID_TOKEN_CLAIMS;
        testAccount.idToken = TEST_TOKENS.IDTOKEN_V2;

        beforeEach(async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                Authority.prototype,
                "getPreferredCache"
            ).mockReturnValue("login.windows.net");
            AUTHENTICATION_RESULT.body.client_info =
                TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO;
            jest.spyOn(
                CacheManager.prototype,
                "getRefreshToken"
            ).mockReturnValue(testRefreshTokenEntity);

            config = await ClientTestUtils.createTestClientConfiguration();
            await config.storageInterface!.setAccount(
                testAccountEntity,
                TEST_CONFIG.CORRELATION_ID
            );
            await config.storageInterface!.setRefreshTokenCredential(
                testRefreshTokenEntity,
                TEST_CONFIG.CORRELATION_ID
            );
            await config.storageInterface!.setRefreshTokenCredential(
                testFamilyRefreshTokenEntity,
                TEST_CONFIG.CORRELATION_ID
            );
            config.storageInterface!.setAppMetadata(testAppMetadata);
            client = new RefreshTokenClient(config, stubPerformanceClient);
        });

        it("Does not add headers that do not qualify for a simple request", (done) => {
            // For more information about this test see: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
            jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockImplementation(
                // @ts-expect-error
                (
                    tokenEndpoint: string,
                    queryString: string,
                    headers: Record<string, string>
                ) => {
                    const headerNames = Object.keys(headers);
                    headerNames.forEach((name) => {
                        expect(
                            CORS_SIMPLE_REQUEST_HEADERS.includes(
                                name.toLowerCase()
                            )
                        ).toBe(true);
                    });

                    done();
                    return Promise.resolve(AUTHENTICATION_RESULT);
                }
            );

            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            const refreshTokenRequest: CommonRefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                claims: TEST_CONFIG.CLAIMS,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
            };

            client.acquireToken(refreshTokenRequest);
        });

        it("acquires a token", async () => {
            jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(AUTHENTICATION_RESULT);
            const createTokenRequestBodySpy = jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"createTokenRequestBody"
            );
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            const refreshTokenRequest: CommonRefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                claims: TEST_CONFIG.CLAIMS,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
            };

            const authResult: AuthenticationResult = await client.acquireToken(
                refreshTokenRequest
            );
            const expectedScopes = [
                Constants.OPENID_SCOPE,
                Constants.PROFILE_SCOPE,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0],
                "email",
            ];

            expect(authResult.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(authResult.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(authResult.scopes).toEqual(expectedScopes);
            expect(authResult.account).toMatchObject(testAccount);
            expect(authResult.idToken).toEqual(
                AUTHENTICATION_RESULT.body.id_token
            );
            expect(authResult.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(authResult.accessToken).toEqual(
                AUTHENTICATION_RESULT.body.access_token
            );
            expect(authResult.state).toHaveLength(0);
            expect(createTokenRequestBodySpy).toHaveBeenCalledWith(
                refreshTokenRequest
            );

            const result = (await createTokenRequestBodySpy.mock.results[0]
                .value) as string;
            expect(
                result.includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`)
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.REFRESH_TOKEN}=${TEST_TOKENS.REFRESH_TOKEN}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.GRANT_TYPE}=${GrantType.REFRESH_TOKEN_GRANT}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.CLAIMS}=${encodeURIComponent(
                        TEST_CONFIG.CLAIMS
                    )}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`
                )
            ).toBe(true);
        });

        it("Adds tokenQueryParameters to the /token request", (done) => {
            jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"executePostToTokenEndpoint"
                // @ts-expect-error
            ).mockImplementation((url: string) => {
                try {
                    expect(
                        url.includes(
                            "/token?testParam1=testValue1&testParam3=testValue3"
                        )
                    ).toBeTruthy();
                    expect(!url.includes("/token?testParam2=")).toBeTruthy();
                    done();
                } catch (error) {
                    done(error);
                }
            });

            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            const refreshTokenRequest: CommonRefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                claims: TEST_CONFIG.CLAIMS,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
                tokenQueryParameters: {
                    testParam1: "testValue1",
                    testParam2: "",
                    testParam3: "testValue3",
                },
            };

            client.acquireToken(refreshTokenRequest).catch((error) => {
                // Catch errors thrown after the function call this test is testing
            });
        });

        it("acquireTokenByRefreshToken refreshes a token", async () => {
            jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(AUTHENTICATION_RESULT);
            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            const expectedRefreshRequest: CommonRefreshTokenRequest = {
                ...silentFlowRequest,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
                refreshToken: testRefreshTokenEntity.secret,
                ccsCredential: {
                    credential: testAccount.homeAccountId,
                    type: CcsCredentialType.HOME_ACCOUNT_ID,
                },
            };
            const refreshTokenClientSpy = jest.spyOn(
                RefreshTokenClient.prototype,
                "acquireToken"
            );

            await client.acquireTokenByRefreshToken(silentFlowRequest);
            expect(refreshTokenClientSpy).toHaveBeenCalledWith(
                expectedRefreshRequest
            );
        });

        it("acquireTokenByRefreshToken refreshes a POP token", async () => {
            jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(POP_AUTHENTICATION_RESULT);
            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
                authenticationScheme: AuthenticationScheme.POP,
            };

            const expectedRefreshRequest: CommonRefreshTokenRequest = {
                ...silentFlowRequest,
                refreshToken: testRefreshTokenEntity.secret,
                ccsCredential: {
                    credential: testAccount.homeAccountId,
                    type: CcsCredentialType.HOME_ACCOUNT_ID,
                },
            };
            const refreshTokenClientSpy = jest.spyOn(
                RefreshTokenClient.prototype,
                "acquireToken"
            );

            await client.acquireTokenByRefreshToken(silentFlowRequest);
            expect(refreshTokenClientSpy).toHaveBeenCalled();
            expect(refreshTokenClientSpy).toHaveBeenCalledWith(
                expectedRefreshRequest
            );
        });

        it("acquireTokenByRefreshToken refreshes an SSH Cert", async () => {
            jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(SSH_AUTHENTICATION_RESULT);
            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
                authenticationScheme: AuthenticationScheme.SSH,
                sshJwk: TEST_SSH_VALUES.SSH_JWK,
            };

            const expectedRefreshRequest: CommonRefreshTokenRequest = {
                ...silentFlowRequest,
                refreshToken: testRefreshTokenEntity.secret,
                ccsCredential: {
                    credential: testAccount.homeAccountId,
                    type: CcsCredentialType.HOME_ACCOUNT_ID,
                },
            };
            const refreshTokenClientSpy = jest.spyOn(
                RefreshTokenClient.prototype,
                "acquireToken"
            );

            await client.acquireTokenByRefreshToken(silentFlowRequest);
            expect(refreshTokenClientSpy).toHaveBeenCalledWith(
                expectedRefreshRequest
            );
        });

        it("does not add claims if none are provided", async () => {
            jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(AUTHENTICATION_RESULT);
            const createTokenRequestBodySpy = jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"createTokenRequestBody"
            );
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            const refreshTokenRequest: CommonRefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
            };

            const authResult: AuthenticationResult = await client.acquireToken(
                refreshTokenRequest
            );
            const expectedScopes = [
                Constants.OPENID_SCOPE,
                Constants.PROFILE_SCOPE,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0],
                "email",
            ];

            expect(authResult.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(authResult.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(authResult.scopes).toEqual(expectedScopes);
            expect(authResult.account).toEqual(testAccount);
            expect(authResult.idToken).toEqual(
                AUTHENTICATION_RESULT.body.id_token
            );
            expect(authResult.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(authResult.accessToken).toEqual(
                AUTHENTICATION_RESULT.body.access_token
            );
            expect(authResult.state).toBe("");
            expect(createTokenRequestBodySpy).toHaveBeenCalledWith(
                refreshTokenRequest
            );

            const result = (await createTokenRequestBodySpy.mock.results[0]
                .value) as string;
            expect(
                result.includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`)
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.REFRESH_TOKEN}=${TEST_TOKENS.REFRESH_TOKEN}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.GRANT_TYPE}=${GrantType.REFRESH_TOKEN_GRANT}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.CLAIMS}=${encodeURIComponent(
                        TEST_CONFIG.CLAIMS
                    )}`
                )
            ).toBe(false);
            expect(
                result.includes(
                    `${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`
                )
            ).toBe(true);
        });

        it("does not add claims if empty object is provided", async () => {
            jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(AUTHENTICATION_RESULT);
            const createTokenRequestBodySpy = jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"createTokenRequestBody"
            );
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            const refreshTokenRequest: CommonRefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                authority: TEST_CONFIG.validAuthority,
                claims: "{}",
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
            };

            const authResult: AuthenticationResult = await client.acquireToken(
                refreshTokenRequest
            );
            const expectedScopes = [
                Constants.OPENID_SCOPE,
                Constants.PROFILE_SCOPE,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0],
                "email",
            ];

            expect(authResult.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(authResult.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(authResult.scopes).toEqual(expectedScopes);
            expect(authResult.account).toEqual(testAccount);
            expect(authResult.idToken).toEqual(
                AUTHENTICATION_RESULT.body.id_token
            );
            expect(authResult.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(authResult.accessToken).toEqual(
                AUTHENTICATION_RESULT.body.access_token
            );
            expect(authResult.state).toBe("");
            expect(createTokenRequestBodySpy).toHaveBeenCalledWith(
                refreshTokenRequest
            );

            const result = (await createTokenRequestBodySpy.mock.results[0]
                .value) as string;
            expect(
                result.includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`)
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.REFRESH_TOKEN}=${TEST_TOKENS.REFRESH_TOKEN}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.GRANT_TYPE}=${GrantType.REFRESH_TOKEN_GRANT}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.CLAIMS}=${encodeURIComponent(
                        TEST_CONFIG.CLAIMS
                    )}`
                )
            ).toBe(false);
            expect(
                result.includes(
                    `${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`
                )
            ).toBe(true);
        });

        it("includes the requestId in the result when received in server response", async () => {
            jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(AUTHENTICATION_RESULT_WITH_HEADERS);
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            const refreshTokenRequest: CommonRefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                claims: TEST_CONFIG.CLAIMS,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
            };

            const authResult: AuthenticationResult = await client.acquireToken(
                refreshTokenRequest
            );

            expect(authResult.requestId).toBeTruthy;
            expect(authResult.requestId).toEqual(
                CORS_RESPONSE_HEADERS.xMsRequestId
            );
        });

        it("does not include the requestId in the result when none in server response", async () => {
            jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(AUTHENTICATION_RESULT);
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            const refreshTokenRequest: CommonRefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                claims: TEST_CONFIG.CLAIMS,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
            };

            const authResult: AuthenticationResult = await client.acquireToken(
                refreshTokenRequest
            );

            expect(authResult.requestId).toBeFalsy;
            expect(authResult.requestId).toEqual("");
        });

        it("includes the http version in Refresh token client(AT) measurement when received in server response", async () => {
            const performanceClient = {
                startMeasurement: jest.fn(),
                endMeasurement: jest.fn(),
                discardMeasurements: jest.fn(),
                removePerformanceCallback: jest.fn(),
                addPerformanceCallback: jest.fn(),
                emitEvents: jest.fn(),
                startPerformanceMeasurement: jest.fn(),
                generateId: jest.fn(),
                calculateQueuedTime: jest.fn(),
                addQueueMeasurement: jest.fn(),
                setPreQueueTime: jest.fn(),
                addFields: jest.fn(),
                incrementFields: jest.fn(),
            };
            const client = new RefreshTokenClient(config, performanceClient);
            jest.spyOn(
                // @ts-ignore
                client.networkClient,
                "sendPostRequestAsync"
            ).mockResolvedValue(AUTHENTICATION_RESULT_WITH_HEADERS);
            const refreshTokenRequest: CommonRefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                claims: TEST_CONFIG.CLAIMS,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
            };
            await client.acquireToken(refreshTokenRequest);

            expect(performanceClient.addFields).toHaveBeenCalledWith(
                {
                    httpVerToken: "xMsHttpVer",
                    refreshTokenSize:
                        AUTHENTICATION_RESULT_WITH_HEADERS.body.refresh_token
                            .length,
                    requestId: "xMsRequestId",
                },
                TEST_CONFIG.CORRELATION_ID
            );
        });

        it("does not add http version to the measurement when not received in server response", async () => {
            const performanceClient = {
                startMeasurement: jest.fn(),
                endMeasurement: jest.fn(),
                discardMeasurements: jest.fn(),
                removePerformanceCallback: jest.fn(),
                addPerformanceCallback: jest.fn(),
                emitEvents: jest.fn(),
                startPerformanceMeasurement: jest.fn(),
                generateId: jest.fn(),
                calculateQueuedTime: jest.fn(),
                addQueueMeasurement: jest.fn(),
                setPreQueueTime: jest.fn(),
                addFields: jest.fn(),
                incrementFields: jest.fn(),
            };
            const client = new RefreshTokenClient(config, performanceClient);
            jest.spyOn(
                // @ts-ignore
                client.networkClient,
                "sendPostRequestAsync"
            ).mockResolvedValue({ ...AUTHENTICATION_RESULT, headers: {} });
            const refreshTokenRequest: CommonRefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                claims: TEST_CONFIG.CLAIMS,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
            };
            await client.acquireToken(refreshTokenRequest);

            expect(performanceClient.addFields).toHaveBeenCalledWith(
                {
                    httpVerToken: "",
                    refreshTokenSize:
                        AUTHENTICATION_RESULT.body.refresh_token.length,
                    requestId: "",
                },
                TEST_CONFIG.CORRELATION_ID
            );
        });
    });

    describe("acquireToken APIs with FOCI enabled", () => {
        let config: ClientConfiguration;
        let client: RefreshTokenClient;

        const testAccount: AccountInfo =
            buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS).getAccountInfo();
        testAccount.idTokenClaims = ID_TOKEN_CLAIMS;
        testAccount.idToken = TEST_TOKENS.IDTOKEN_V2;

        beforeEach(async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                Authority.prototype,
                "getPreferredCache"
            ).mockReturnValue("login.windows.net");
            AUTHENTICATION_RESULT_WITH_FOCI.body.client_info =
                TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO;
            jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(AUTHENTICATION_RESULT_WITH_FOCI);
            jest.spyOn(
                CacheManager.prototype,
                "getRefreshToken"
            ).mockReturnValue(testFamilyRefreshTokenEntity);

            config = await ClientTestUtils.createTestClientConfiguration();
            await config.storageInterface!.setAccount(
                testAccountEntity,
                TEST_CONFIG.CORRELATION_ID
            );
            await config.storageInterface!.setRefreshTokenCredential(
                testRefreshTokenEntity,
                TEST_CONFIG.CORRELATION_ID
            );
            await config.storageInterface!.setRefreshTokenCredential(
                testFamilyRefreshTokenEntity,
                TEST_CONFIG.CORRELATION_ID
            );
            config.storageInterface!.setAppMetadata(testAppMetadata);
            client = new RefreshTokenClient(config, stubPerformanceClient);
        });

        it("acquires a token (FOCI)", async () => {
            const createTokenRequestBodySpy = jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"createTokenRequestBody"
            );
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            const refreshTokenRequest: CommonRefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                claims: TEST_CONFIG.CLAIMS,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
            };

            const authResult: AuthenticationResult = await client.acquireToken(
                refreshTokenRequest
            );
            const expectedScopes = [
                Constants.OPENID_SCOPE,
                Constants.PROFILE_SCOPE,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0],
                "email",
            ];
            expect(authResult.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(authResult.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(authResult.scopes).toEqual(expectedScopes);
            expect(authResult.account).toEqual(testAccount);
            expect(authResult.idToken).toEqual(
                AUTHENTICATION_RESULT_WITH_FOCI.body.id_token
            );
            expect(authResult.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(authResult.accessToken).toEqual(
                AUTHENTICATION_RESULT_WITH_FOCI.body.access_token
            );
            expect(authResult.familyId).toEqual(
                AUTHENTICATION_RESULT_WITH_FOCI.body.foci
            );
            expect(authResult.state).toHaveLength(0);

            expect(createTokenRequestBodySpy).toHaveBeenCalledWith(
                refreshTokenRequest
            );

            const result = (await createTokenRequestBodySpy.mock.results[0]
                .value) as string;
            expect(
                result.includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`)
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.REFRESH_TOKEN}=${TEST_TOKENS.REFRESH_TOKEN}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.GRANT_TYPE}=${GrantType.REFRESH_TOKEN_GRANT}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`
                )
            ).toBe(true);
            expect(
                result.includes(
                    `${AADServerParamKeys.CLAIMS}=${encodeURIComponent(
                        TEST_CONFIG.CLAIMS
                    )}`
                )
            ).toBe(true);
        });

        it("acquireTokenByRefreshToken refreshes a token (FOCI)", async () => {
            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            const expectedRefreshRequest: CommonRefreshTokenRequest = {
                ...silentFlowRequest,
                refreshToken: testRefreshTokenEntity.secret,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
                ccsCredential: {
                    credential: testAccount.homeAccountId,
                    type: CcsCredentialType.HOME_ACCOUNT_ID,
                },
            };
            const refreshTokenClientSpy = jest.spyOn(
                RefreshTokenClient.prototype,
                "acquireToken"
            );

            await client.acquireTokenByRefreshToken(silentFlowRequest);
            expect(refreshTokenClientSpy).toHaveBeenCalledWith(
                expectedRefreshRequest
            );
        });
    });

    describe("Error cases", () => {
        it("Throws error if account is not included in request object", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            await expect(
                client.acquireTokenByRefreshToken({
                    scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    // @ts-ignore
                    account: null,
                    authority: TEST_CONFIG.validAuthority,
                    correlationId: TEST_CONFIG.CORRELATION_ID,
                    forceRefresh: false,
                })
            ).rejects.toMatchObject(
                createClientAuthError(
                    ClientAuthErrorCodes.noAccountInSilentRequest
                )
            );
        });

        it("Throws error if request object is null or undefined", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );

            await expect(
                //@ts-ignore
                client.acquireTokenByRefreshToken(null)
            ).rejects.toMatchObject(
                createClientConfigurationError(
                    ClientConfigurationErrorCodes.tokenRequestEmpty
                )
            );

            await expect(
                //@ts-ignore
                client.acquireTokenByRefreshToken(undefined)
            ).rejects.toMatchObject(
                createClientConfigurationError(
                    ClientConfigurationErrorCodes.tokenRequestEmpty
                )
            );
        });

        it("Throws error if it does not find token in cache", async () => {
            const testAccount: AccountInfo = {
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_LOCAL_ACCOUNT_ID,
                homeAccountId:
                    TEST_DATA_CLIENT_INFO.TEST_ENCODED_HOME_ACCOUNT_ID,
                environment: "login.windows.net",
                tenantId: "testTenantId",
                username: "testname@contoso.com",
            };
            const testScope2 = "scope2";
            const testAccountEntity: AccountEntity = new AccountEntity();
            testAccountEntity.homeAccountId =
                TEST_DATA_CLIENT_INFO.TEST_ENCODED_HOME_ACCOUNT_ID;
            testAccountEntity.localAccountId = ID_TOKEN_CLAIMS.oid;
            testAccountEntity.environment = "login.windows.net";
            testAccountEntity.realm = "testTenantId";
            testAccountEntity.username = "username@contoso.com";
            testAccountEntity.authorityType = "MSSTS";
            jest.spyOn(
                MockStorageClass.prototype,
                "getAccount"
            ).mockReturnValue(testAccountEntity);
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const tokenRequest: CommonSilentFlowRequest = {
                scopes: [testScope2],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config, stubPerformanceClient);
            await expect(
                client.acquireToken(tokenRequest)
            ).rejects.toMatchObject(
                createInteractionRequiredAuthError(
                    InteractionRequiredAuthErrorCodes.noTokensFound
                )
            );
        });

        it("Throws error if cached RT is expired", async () => {
            const testScope2 = "scope2";
            const tokenRequest: CommonSilentFlowRequest = {
                scopes: [testScope2],
                account: testAccountEntity.getAccountInfo(),
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            await config.storageInterface!.setRefreshTokenCredential(
                {
                    ...testRefreshTokenEntity,
                    expiresOn: (
                        TimeUtils.nowSeconds() -
                        48 * 60 * 60
                    ).toString(), // Set expiration to yesterday
                },
                TEST_CONFIG.CORRELATION_ID
            );
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            await expect(
                client.acquireTokenByRefreshToken(tokenRequest)
            ).rejects.toMatchObject(
                createInteractionRequiredAuthError(
                    InteractionRequiredAuthErrorCodes.refreshTokenExpired
                )
            );
        });

        it("Throws error if cached RT expiration is within provided offset", async () => {
            const testScope2 = "scope2";
            const tokenRequest: CommonSilentFlowRequest = {
                scopes: [testScope2],
                account: testAccountEntity.getAccountInfo(),
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
                refreshTokenExpirationOffsetSeconds: 60 * 60, // 1 hour
            };
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            await config.storageInterface!.setRefreshTokenCredential(
                {
                    ...testRefreshTokenEntity,
                    expiresOn: (TimeUtils.nowSeconds() + 30 * 60).toString(), // Set expiration to 30 minutes from now
                },
                TEST_CONFIG.CORRELATION_ID
            );
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            await expect(
                client.acquireTokenByRefreshToken(tokenRequest)
            ).rejects.toMatchObject(
                createInteractionRequiredAuthError(
                    InteractionRequiredAuthErrorCodes.refreshTokenExpired
                )
            );
        });

        it("Removes refresh token if server returns invalid_grant with bad_token suberror", async () => {
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            await config.storageInterface!.setAccount(
                testAccountEntity,
                TEST_CONFIG.CORRELATION_ID
            );
            await config.storageInterface!.setRefreshTokenCredential(
                testRefreshTokenEntity,
                TEST_CONFIG.CORRELATION_ID
            );
            config.storageInterface!.setAppMetadata(testAppMetadata);
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            const testAccount: AccountInfo =
                buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS).getAccountInfo();
            testAccount.idTokenClaims = ID_TOKEN_CLAIMS;
            jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(BAD_TOKEN_ERROR_RESPONSE);

            const serverResponse = BAD_TOKEN_ERROR_RESPONSE.body;
            const invalidGrantAuthError = new InteractionRequiredAuthError(
                serverResponse.error,
                serverResponse.error_description,
                serverResponse.suberror,
                serverResponse.timestamp || Constants.EMPTY_STRING,
                serverResponse.trace_id || Constants.EMPTY_STRING,
                serverResponse.correlation_id || Constants.EMPTY_STRING,
                // @ts-ignore
                serverResponse.claims || Constants.EMPTY_STRING
            );

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            const badRefreshTokenKey = generateCredentialKey(
                testRefreshTokenEntity
            );

            expect(
                config.storageInterface!.getRefreshTokenCredential(
                    badRefreshTokenKey
                )
            ).toBe(testRefreshTokenEntity);

            await expect(
                client.acquireTokenByRefreshToken(silentFlowRequest)
            ).rejects.toMatchObject(invalidGrantAuthError);

            expect(
                config.storageInterface!.getRefreshTokenCredential(
                    badRefreshTokenKey
                )
            ).toBe(null);
        });
    });
    describe("Telemetry protocol mode tests", () => {
        const refreshTokenRequest: CommonRefreshTokenRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_TOKENS.REFRESH_TOKEN,
            claims: TEST_CONFIG.CLAIMS,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            authenticationScheme:
                TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
        };
        it("Adds telemetry headers to token request in AAD protocol mode", async () => {
            const createTokenRequestBodySpy = jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"createTokenRequestBody"
            );
            const config = await ClientTestUtils.createTestClientConfiguration(
                true
            );
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            try {
                await client.acquireToken(refreshTokenRequest);
            } catch {}
            expect(createTokenRequestBodySpy).toHaveBeenCalledWith(
                refreshTokenRequest
            );

            const returnVal = (await createTokenRequestBodySpy.mock.results[0]
                .value) as string;
            expect(
                returnVal.includes(`${AADServerParamKeys.X_CLIENT_CURR_TELEM}`)
            ).toBe(true);
            expect(
                returnVal.includes(`${AADServerParamKeys.X_CLIENT_LAST_TELEM}`)
            ).toBe(true);
        });
        it("Does not add telemetry headers to token request in OIDC protocol mode", async () => {
            const createTokenRequestBodySpy = jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"createTokenRequestBody"
            );
            const config = await ClientTestUtils.createTestClientConfiguration(
                true,
                ProtocolMode.OIDC
            );
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            try {
                await client.acquireToken(refreshTokenRequest);
            } catch {}
            expect(createTokenRequestBodySpy).toHaveBeenCalledWith(
                refreshTokenRequest
            );

            const returnVal = (await createTokenRequestBodySpy.mock.results[0]
                .value) as string;
            expect(
                returnVal.includes(`${AADServerParamKeys.X_CLIENT_CURR_TELEM}`)
            ).toBe(false);
            expect(
                returnVal.includes(`${AADServerParamKeys.X_CLIENT_LAST_TELEM}`)
            ).toBe(false);
        });
    });

    describe("createTokenRequestBody tests", () => {
        it("pick up broker params", async () => {
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new RefreshTokenClient(config);

            const queryString =
                // @ts-ignore
                await client.createTokenRequestBody({
                    scopes: ["User.Read"],
                    redirectUri: "localhost",
                    embeddedClientId: "child_client_id_1",
                });

            expect(queryString).toContain(`client_id=child_client_id_1`);
            expect(queryString).toContain(
                `brk_client_id=${config.authOptions.clientId}`
            );
            expect(queryString).toContain(`brk_redirect_uri=https://localhost`);
        });

        it("broker params take precedence over token body params", async () => {
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new RefreshTokenClient(config);

            const queryString =
                // @ts-ignore
                await client.createTokenRequestBody({
                    scopes: ["User.Read"],
                    redirectUri: "localhost",
                    embeddedClientId: "child_client_id_1",
                    tokenBodyParameters: {
                        client_id: "child_client_id_2",
                        brk_client_id: "broker_client_id_2",
                        brk_redirect_uri: "broker_redirect_uri_2",
                    },
                });

            expect(queryString).toContain(`client_id=child_client_id_1`);
            expect(queryString).toContain(
                `brk_client_id=${config.authOptions.clientId}`
            );
            expect(queryString).toContain(`brk_redirect_uri=https://localhost`);
        });
    });
});
