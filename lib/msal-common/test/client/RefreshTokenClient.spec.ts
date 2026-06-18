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
    RANDOM_TEST_GUID,
} from "../test_kit/StringConstants.js";
import * as Constants from "../../src/utils/Constants.js";
import * as AADServerParamKeys from "../../src/constants/AADServerParamKeys.js";
import {
    ClientTestUtils,
    generateCredentialKey,
    MockStorageClass,
} from "./ClientTestUtils.js";
import { Authority } from "../../src/authority/Authority.js";
import { RefreshTokenClient } from "../../src/client/RefreshTokenClient.js";
import { CommonRefreshTokenRequest } from "../../src/request/CommonRefreshTokenRequest.js";
import { AccountEntity } from "../../src/cache/entities/AccountEntity.js";
import { RefreshTokenEntity } from "../../src/cache/entities/RefreshTokenEntity.js";
import { AuthenticationResult } from "../../src/response/AuthenticationResult.js";
import {
    AccountInfo,
    updateAccountTenantProfileData,
} from "../../src/account/AccountInfo.js";
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
import { MockPerformanceClient } from "../telemetry/PerformanceClient.spec.js";
import * as AccountEntityUtils from "../../src/cache/utils/AccountEntityUtils.js";
import * as TokenProtocol from "../../src/protocol/Token.js";

const testAccountEntity: AccountEntity = {
    homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
    localAccountId: ID_TOKEN_CLAIMS.oid,
    environment: "login.windows.net",
    realm: ID_TOKEN_CLAIMS.tid,
    username: ID_TOKEN_CLAIMS.preferred_username,
    authorityType: "MSSTS",
    lastUpdatedAt: Date.now().toString(),
};

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
    credentialType: Constants.CredentialType.REFRESH_TOKEN,
    lastUpdatedAt: Date.now().toString(),
};

const testFamilyRefreshTokenEntity: RefreshTokenEntity = {
    homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
    environment: testAccountEntity.environment,
    realm: ID_TOKEN_CLAIMS.tid,
    secret: AUTHENTICATION_RESULT.body.refresh_token,
    credentialType: Constants.CredentialType.REFRESH_TOKEN,
    familyId: TEST_CONFIG.THE_FAMILY_ID,
    lastUpdatedAt: Date.now().toString(),
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
                TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
        };

        beforeEach(async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            config = await ClientTestUtils.createTestClientConfiguration();
        });

        it("throws dpopNotEnabled before the token network request for DPoP refresh token requests", async () => {
            const executePostToTokenEndpointSpy = jest
                .spyOn(TokenProtocol, "executePostToTokenEndpoint")
                .mockResolvedValue(AUTHENTICATION_RESULT);
            const clientAssertionSpy = jest
                .fn()
                .mockResolvedValue("signed-client-assertion");
            if (!config.clientCredentials) {
                throw new Error(
                    "configuration clientCredentials not initialized correctly."
                );
            }
            config.clientCredentials.clientAssertion = {
                assertion: clientAssertionSpy,
                assertionType:
                    "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            };
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            const dpopRefreshTokenRequest: CommonRefreshTokenRequest = {
                ...refreshTokenRequest,
                authenticationScheme: Constants.AuthenticationScheme.DPOP,
            };

            await expect(
                client.acquireToken(dpopRefreshTokenRequest, 0)
            ).rejects.toMatchObject(createClientAuthError("dpop_not_enabled"));
            expect(clientAssertionSpy).not.toHaveBeenCalled();
            expect(executePostToTokenEndpointSpy).not.toHaveBeenCalled();
        });

        it("Adds correlationId to the /token query string", (done) => {
            jest.spyOn(
                TokenProtocol,
                "executePostToTokenEndpoint"
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
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
                extraQueryParameters: {
                    testParam: "testValue",
                },
            };

            client.acquireToken(refreshTokenRequest, 0).catch((e) => {
                // Catch errors thrown after the function call this test is testing
            });
        });

        it("Adds extraQueryParameters to the /token request", (done) => {
            jest.spyOn(
                TokenProtocol,
                "executePostToTokenEndpoint"
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
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
                extraQueryParameters: {
                    testParam: "testValue",
                },
            };

            client.acquireToken(refreshTokenRequest, 0).catch((e) => {
                // Catch errors thrown after the function call this test is testing
            });
        });

        it("Adds extraParameters to the /token request", (done) => {
            jest.spyOn(
                TokenProtocol,
                "executePostToTokenEndpoint"
                // @ts-expect-error
            ).mockImplementation((url: string, body: string) => {
                expect(body).toContain("testParam=testValue");
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
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
                extraParameters: {
                    testParam: "testValue",
                },
            };

            client.acquireToken(refreshTokenRequest, 0).catch((error) => {
                // Catch errors thrown after the function call this test is testing
            });
        });

        it("Adds both extraQueryParameters and extraParameters to the /token request", (done) => {
            jest.spyOn(
                TokenProtocol,
                "executePostToTokenEndpoint"
                // @ts-expect-error
            ).mockImplementation((url: string, body: string) => {
                try {
                    // Verify extraQueryParameters are in the URL
                    expect(
                        url.includes(
                            "/token?queryParam1=queryValue1&queryParam2=queryValue2"
                        )
                    ).toBe(true);
                    // Verify extraParameters are in the body
                    expect(body).toContain("bodyParam1=bodyValue1");
                    expect(body).toContain("bodyParam2=bodyValue2");
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
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
                extraQueryParameters: {
                    queryParam1: "queryValue1",
                    queryParam2: "queryValue2",
                },
                extraParameters: {
                    bodyParam1: "bodyValue1",
                    bodyParam2: "bodyValue2",
                },
            };

            client.acquireToken(refreshTokenRequest, 0).catch((error) => {
                // Catch errors thrown after the function call this test is testing
            });
        });

        it("Does not overwrite extraQueryParameters with extraParameters when they have the same parameter name", (done) => {
            jest.spyOn(
                TokenProtocol,
                "executePostToTokenEndpoint"
                // @ts-expect-error
            ).mockImplementation((url: string, body: string) => {
                try {
                    // Verify extraQueryParameters value is in the URL (not overwritten)
                    expect(url.includes("sharedParam=queryValue")).toBe(true);
                    expect(url.includes("sharedParam=bodyValue")).toBe(false);
                    // Verify extraParameters value is in the body
                    expect(body).toContain("sharedParam=bodyValue");
                    // Verify the body doesn't contain the query value
                    expect(body.includes("sharedParam=queryValue")).toBe(false);
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
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
                extraQueryParameters: {
                    sharedParam: "queryValue",
                    uniqueQueryParam: "uniqueQueryValue",
                },
                extraParameters: {
                    sharedParam: "bodyValue",
                    uniqueBodyParam: "uniqueBodyValue",
                },
            };

            client.acquireToken(refreshTokenRequest, 0).catch((error) => {
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
                TokenProtocol,
                "executePostToTokenEndpoint"
            ).mockResolvedValue(AUTHENTICATION_RESULT);

            await client.acquireToken(refreshTokenRequest, 0);
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
            await client.acquireToken(refreshTokenRequest, 0).then(() => {
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
            await client.acquireToken(refreshTokenRequest, 0).then(() => {
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

        const testAccount: AccountInfo = updateAccountTenantProfileData(
            AccountEntityUtils.getAccountInfo(
                buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS)
            ),
            undefined,
            ID_TOKEN_CLAIMS,
            TEST_TOKENS.IDTOKEN_V2
        );

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
                TEST_CONFIG.CORRELATION_ID,
                true,
                0
            );
            await config.storageInterface!.setRefreshTokenCredential(
                testRefreshTokenEntity,
                TEST_CONFIG.CORRELATION_ID,
                true
            );
            await config.storageInterface!.setRefreshTokenCredential(
                testFamilyRefreshTokenEntity,
                TEST_CONFIG.CORRELATION_ID,
                true
            );
            config.storageInterface!.setAppMetadata(
                testAppMetadata,
                RANDOM_TEST_GUID
            );
            client = new RefreshTokenClient(config, stubPerformanceClient);
        });

        it("Does not add headers that do not qualify for a simple request", (done) => {
            // For more information about this test see: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
            jest.spyOn(
                TokenProtocol,
                "executePostToTokenEndpoint"
            ).mockImplementation(
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
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };

            client.acquireToken(refreshTokenRequest, 0);
        });

        it("acquires a token", async () => {
            jest.spyOn(
                TokenProtocol,
                "executePostToTokenEndpoint"
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
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };

            const authResult: AuthenticationResult = await client.acquireToken(
                refreshTokenRequest,
                0
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
                    `${AADServerParamKeys.GRANT_TYPE}=${Constants.GrantType.REFRESH_TOKEN_GRANT}`
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
                    `${
                        AADServerParamKeys.X_MS_LIB_CAPABILITY
                    }=${encodeURIComponent(
                        Constants.X_MS_LIB_CAPABILITY_VALUE
                    )}`
                )
            ).toBe(true);
        });

        it("Adds extraQueryParameters to the /token request", (done) => {
            jest.spyOn(
                TokenProtocol,
                "executePostToTokenEndpoint"
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
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
                extraQueryParameters: {
                    testParam1: "testValue1",
                    testParam2: "",
                    testParam3: "testValue3",
                },
            };

            client.acquireToken(refreshTokenRequest, 0).catch((error) => {
                // Catch errors thrown after the function call this test is testing
            });
        });

        it("Adds extraParameters to the /token request", (done) => {
            jest.spyOn(
                TokenProtocol,
                "executePostToTokenEndpoint"
                // @ts-expect-error
            ).mockImplementation((url: string, body: string) => {
                expect(body).toContain("testParam=testValue");
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
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
                extraParameters: {
                    testParam: "testValue",
                },
            };

            client.acquireToken(refreshTokenRequest, 0).catch((error) => {
                // Catch errors thrown after the function call this test is testing
            });
        });

        it("Adds both extraQueryParameters and extraParameters to the /token request", (done) => {
            jest.spyOn(
                TokenProtocol,
                "executePostToTokenEndpoint"
                // @ts-expect-error
            ).mockImplementation((url: string, body: string) => {
                try {
                    // Verify extraQueryParameters are in the URL
                    expect(
                        url.includes(
                            "/token?queryParam1=queryValue1&queryParam2=queryValue2"
                        )
                    ).toBe(true);
                    // Verify extraParameters are in the body
                    expect(body).toContain("bodyParam1=bodyValue1");
                    expect(body).toContain("bodyParam2=bodyValue2");
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
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
                extraQueryParameters: {
                    queryParam1: "queryValue1",
                    queryParam2: "queryValue2",
                },
                extraParameters: {
                    bodyParam1: "bodyValue1",
                    bodyParam2: "bodyValue2",
                },
            };

            client.acquireToken(refreshTokenRequest, 0).catch((error) => {
                // Catch errors thrown after the function call this test is testing
            });
        });

        it("Does not overwrite extraQueryParameters with extraParameters when they have the same parameter name", (done) => {
            jest.spyOn(
                TokenProtocol,
                "executePostToTokenEndpoint"
                // @ts-expect-error
            ).mockImplementation((url: string, body: string) => {
                try {
                    // Verify extraQueryParameters value is in the URL (not overwritten)
                    expect(url.includes("sharedParam=queryValue")).toBe(true);
                    expect(url.includes("sharedParam=bodyValue")).toBe(false);
                    // Verify extraParameters value is in the body
                    expect(body).toContain("sharedParam=bodyValue");
                    // Verify the body doesn't contain the query value
                    expect(body.includes("sharedParam=queryValue")).toBe(false);
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
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
                extraQueryParameters: {
                    sharedParam: "queryValue",
                    uniqueQueryParam: "uniqueQueryValue",
                },
                extraParameters: {
                    sharedParam: "bodyValue",
                    uniqueBodyParam: "uniqueBodyValue",
                },
            };

            client.acquireToken(refreshTokenRequest, 0).catch((error) => {
                // Catch errors thrown after the function call this test is testing
            });
        });

        it("acquireTokenByRefreshToken refreshes a token", async () => {
            jest.spyOn(
                TokenProtocol,
                "executePostToTokenEndpoint"
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
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
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

            await client.acquireTokenByRefreshToken(silentFlowRequest, 0);
            expect(refreshTokenClientSpy).toHaveBeenCalledWith(
                expectedRefreshRequest,
                0
            );
        });

        it("acquireTokenByRefreshToken refreshes a POP token", async () => {
            jest.spyOn(
                TokenProtocol,
                "executePostToTokenEndpoint"
            ).mockResolvedValue(POP_AUTHENTICATION_RESULT);
            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
                authenticationScheme: Constants.AuthenticationScheme.POP,
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

            await client.acquireTokenByRefreshToken(silentFlowRequest, 0);
            expect(refreshTokenClientSpy).toHaveBeenCalled();
            expect(refreshTokenClientSpy).toHaveBeenCalledWith(
                expectedRefreshRequest,
                0
            );
        });

        it("acquireTokenByRefreshToken refreshes an SSH Cert", async () => {
            jest.spyOn(
                TokenProtocol,
                "executePostToTokenEndpoint"
            ).mockResolvedValue(SSH_AUTHENTICATION_RESULT);
            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
                authenticationScheme: Constants.AuthenticationScheme.SSH,
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

            await client.acquireTokenByRefreshToken(silentFlowRequest, 0);
            expect(refreshTokenClientSpy).toHaveBeenCalledWith(
                expectedRefreshRequest,
                0
            );
        });

        it("does not add claims if none are provided", async () => {
            jest.spyOn(
                TokenProtocol,
                "executePostToTokenEndpoint"
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
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };

            const authResult: AuthenticationResult = await client.acquireToken(
                refreshTokenRequest,
                0
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
                    `${AADServerParamKeys.GRANT_TYPE}=${Constants.GrantType.REFRESH_TOKEN_GRANT}`
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
                    `${
                        AADServerParamKeys.X_MS_LIB_CAPABILITY
                    }=${encodeURIComponent(
                        Constants.X_MS_LIB_CAPABILITY_VALUE
                    )}`
                )
            ).toBe(true);
        });

        it("does not add claims if empty object is provided", async () => {
            jest.spyOn(
                TokenProtocol,
                "executePostToTokenEndpoint"
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
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };

            const authResult: AuthenticationResult = await client.acquireToken(
                refreshTokenRequest,
                0
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
                    `${AADServerParamKeys.GRANT_TYPE}=${Constants.GrantType.REFRESH_TOKEN_GRANT}`
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
                    `${
                        AADServerParamKeys.X_MS_LIB_CAPABILITY
                    }=${encodeURIComponent(
                        Constants.X_MS_LIB_CAPABILITY_VALUE
                    )}`
                )
            ).toBe(true);
        });

        it("includes the requestId in the result when received in server response", async () => {
            jest.spyOn(
                TokenProtocol,
                "executePostToTokenEndpoint"
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
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };

            const authResult: AuthenticationResult = await client.acquireToken(
                refreshTokenRequest,
                0
            );

            expect(authResult.requestId).toBeTruthy;
            expect(authResult.requestId).toEqual(
                CORS_RESPONSE_HEADERS.xMsRequestId
            );
        });

        it("does not include the requestId in the result when none in server response", async () => {
            jest.spyOn(
                TokenProtocol,
                "executePostToTokenEndpoint"
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
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };

            const authResult: AuthenticationResult = await client.acquireToken(
                refreshTokenRequest,
                0
            );

            expect(authResult.requestId).toBeFalsy;
            expect(authResult.requestId).toEqual("");
        });

        it("includes the http version in Refresh token client(AT) measurement when received in server response", async () => {
            const addFieldsSpy = jest.spyOn(stubPerformanceClient, "addFields");
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
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
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };
            await client.acquireToken(refreshTokenRequest, 0);

            expect(addFieldsSpy).toHaveBeenCalledWith(
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
            const addFieldsSpy = jest.spyOn(stubPerformanceClient, "addFields");
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
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
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };
            await client.acquireToken(refreshTokenRequest, 0);

            expect(addFieldsSpy).toHaveBeenCalledWith(
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

        const testAccount: AccountInfo = updateAccountTenantProfileData(
            AccountEntityUtils.getAccountInfo(
                buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS)
            ),
            undefined,
            ID_TOKEN_CLAIMS,
            TEST_TOKENS.IDTOKEN_V2
        );

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
                TokenProtocol,
                "executePostToTokenEndpoint"
            ).mockResolvedValue(AUTHENTICATION_RESULT_WITH_FOCI);
            jest.spyOn(
                CacheManager.prototype,
                "getRefreshToken"
            ).mockReturnValue(testFamilyRefreshTokenEntity);

            config = await ClientTestUtils.createTestClientConfiguration();
            await config.storageInterface!.setAccount(
                testAccountEntity,
                TEST_CONFIG.CORRELATION_ID,
                true,
                0
            );
            await config.storageInterface!.setRefreshTokenCredential(
                testRefreshTokenEntity,
                TEST_CONFIG.CORRELATION_ID,
                true
            );
            await config.storageInterface!.setRefreshTokenCredential(
                testFamilyRefreshTokenEntity,
                TEST_CONFIG.CORRELATION_ID,
                true
            );
            config.storageInterface!.setAppMetadata(
                testAppMetadata,
                RANDOM_TEST_GUID
            );
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
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };

            const authResult: AuthenticationResult = await client.acquireToken(
                refreshTokenRequest,
                0
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
                    `${AADServerParamKeys.GRANT_TYPE}=${Constants.GrantType.REFRESH_TOKEN_GRANT}`
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
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
                ccsCredential: {
                    credential: testAccount.homeAccountId,
                    type: CcsCredentialType.HOME_ACCOUNT_ID,
                },
            };
            const refreshTokenClientSpy = jest.spyOn(
                RefreshTokenClient.prototype,
                "acquireToken"
            );

            await client.acquireTokenByRefreshToken(silentFlowRequest, 0);
            expect(refreshTokenClientSpy).toHaveBeenCalledWith(
                expectedRefreshRequest,
                0
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
                client.acquireTokenByRefreshToken(
                    {
                        scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                        // @ts-ignore
                        account: null,
                        authority: TEST_CONFIG.validAuthority,
                        correlationId: TEST_CONFIG.CORRELATION_ID,
                        forceRefresh: false,
                    },
                    0
                )
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
                client.acquireTokenByRefreshToken(null, 0)
            ).rejects.toMatchObject(
                createClientConfigurationError(
                    ClientConfigurationErrorCodes.tokenRequestEmpty
                )
            );

            await expect(
                //@ts-ignore
                client.acquireTokenByRefreshToken(undefined, 0)
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
                loginHint: "testLoginHint",
            };
            const testScope2 = "scope2";
            const testAccountEntity: AccountEntity = {
                homeAccountId:
                    TEST_DATA_CLIENT_INFO.TEST_ENCODED_HOME_ACCOUNT_ID,
                localAccountId: ID_TOKEN_CLAIMS.oid,
                environment: "login.windows.net",
                realm: "testTenantId",
                username: "username@contoso.com",
                authorityType: "MSSTS",
                lastUpdatedAt: Date.now().toString(),
            };
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
                client.acquireCachedToken(tokenRequest)
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.tokenRefreshRequired)
            );
        });

        it("Throws error if cached RT is expired", async () => {
            const testScope2 = "scope2";
            const tokenRequest: CommonSilentFlowRequest = {
                scopes: [testScope2],
                account: AccountEntityUtils.getAccountInfo(testAccountEntity),
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const rtExpiresOn = TimeUtils.nowSeconds() - 48 * 60 * 60;
            await config.storageInterface!.setRefreshTokenCredential(
                {
                    ...testRefreshTokenEntity,
                    expiresOn: rtExpiresOn.toString(), // Set expiration to yesterday
                },
                TEST_CONFIG.CORRELATION_ID,
                true
            );
            const mockPerfClient = new MockPerformanceClient();
            const client = new RefreshTokenClient(config, mockPerfClient);
            const rootMeasurement = mockPerfClient.startMeasurement(
                "test-measurement",
                TEST_CONFIG.CORRELATION_ID
            );
            let resEvents;
            mockPerfClient.addPerformanceCallback((events) => {
                resEvents = events;
            });
            await expect(
                client.acquireTokenByRefreshToken(tokenRequest, 0)
            ).rejects.toMatchObject(
                createInteractionRequiredAuthError(
                    InteractionRequiredAuthErrorCodes.refreshTokenExpired
                )
            );
            rootMeasurement.end({ success: false });
            // @ts-ignore
            expect(resEvents[0].cacheRtExpiresOnSeconds).toEqual(rtExpiresOn);
            // @ts-ignore
            expect(resEvents[0].rtOffsetSeconds).toEqual(300);
        });

        it("Throws error if cached RT expiration is within provided offset", async () => {
            const testScope2 = "scope2";
            const tokenRequest: CommonSilentFlowRequest = {
                scopes: [testScope2],
                account: AccountEntityUtils.getAccountInfo(testAccountEntity),
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
                TEST_CONFIG.CORRELATION_ID,
                true
            );
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );
            await expect(
                client.acquireTokenByRefreshToken(tokenRequest, 0)
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
                TEST_CONFIG.CORRELATION_ID,
                true,
                0
            );
            const rtExpiresOn = TimeUtils.nowSeconds() + 60 * 60;
            const rtEntity = {
                ...testRefreshTokenEntity,
                expiresOn: rtExpiresOn.toString(),
            };
            await config.storageInterface!.setRefreshTokenCredential(
                rtEntity,
                TEST_CONFIG.CORRELATION_ID,
                true
            );
            config.storageInterface!.setAppMetadata(
                testAppMetadata,
                RANDOM_TEST_GUID
            );
            const mockPerfClient = new MockPerformanceClient();
            const rootMeasurement = mockPerfClient.startMeasurement(
                "test-measurement",
                TEST_CONFIG.CORRELATION_ID
            );
            let resEvents;
            mockPerfClient.addPerformanceCallback((events) => {
                resEvents = events;
            });
            const client = new RefreshTokenClient(config, mockPerfClient);
            const testAccount: AccountInfo = updateAccountTenantProfileData(
                AccountEntityUtils.getAccountInfo(
                    buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS)
                ),
                undefined,
                ID_TOKEN_CLAIMS
            );
            jest.spyOn(
                TokenProtocol,
                "executePostToTokenEndpoint"
            ).mockResolvedValue(BAD_TOKEN_ERROR_RESPONSE);

            const serverResponse = BAD_TOKEN_ERROR_RESPONSE.body;
            const invalidGrantAuthError = new InteractionRequiredAuthError(
                serverResponse.error,
                serverResponse.error_description,
                serverResponse.suberror,
                serverResponse.timestamp || "",
                serverResponse.trace_id || "",
                serverResponse.correlation_id || "",
                // @ts-ignore
                serverResponse.claims || ""
            );

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            const badRefreshTokenKey = generateCredentialKey(rtEntity);

            expect(
                config.storageInterface!.getRefreshTokenCredential(
                    badRefreshTokenKey,
                    RANDOM_TEST_GUID
                )
            ).toBe(rtEntity);

            await expect(
                client.acquireTokenByRefreshToken(silentFlowRequest, 0)
            ).rejects.toMatchObject(invalidGrantAuthError);

            expect(
                config.storageInterface!.getRefreshTokenCredential(
                    badRefreshTokenKey,
                    RANDOM_TEST_GUID
                )
            ).toBe(null);

            rootMeasurement.end({ success: false });
            // @ts-ignore
            expect(resEvents[0].cacheRtExpiresOnSeconds).toEqual(rtExpiresOn);
            // @ts-ignore
            expect(resEvents[0].rtOffsetSeconds).toEqual(300);
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
                TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
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
                await client.acquireToken(refreshTokenRequest, 0);
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
                await client.acquireToken(refreshTokenRequest, 0);
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
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );

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
            expect(queryString).toContain(
                `brk_redirect_uri=${encodeURIComponent("https://localhost")}`
            );
        });

        it("broker params take precedence over extra params", async () => {
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );

            const queryString =
                // @ts-ignore
                await client.createTokenRequestBody({
                    scopes: ["User.Read"],
                    redirectUri: "localhost",
                    embeddedClientId: "child_client_id_1",
                    extraParameters: {
                        client_id: "child_client_id_2",
                        brk_client_id: "broker_client_id_2",
                        brk_redirect_uri: "broker_redirect_uri_2",
                    },
                });

            expect(queryString).toContain(`client_id=child_client_id_1`);
            expect(queryString).toContain(
                `brk_client_id=${config.authOptions.clientId}`
            );
            expect(queryString).toContain(
                `brk_redirect_uri=${encodeURIComponent("https://localhost")}`
            );
        });

        it("includes clientCapabilities from config when BROKER_CLIENT_ID is present but skipBrokerClaims is not set", async () => {
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            // Add clientCapabilities to the config
            config.authOptions.clientCapabilities = ["CP1", "CP2"];
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );

            const queryString =
                // @ts-ignore
                await client.createTokenRequestBody({
                    scopes: ["User.Read"],
                    redirectUri: "localhost",
                    embeddedClientId: "child_client_id_1",
                    claims: JSON.stringify({ userinfo: { given_name: null } }),
                });

            // Verify embeddedClientId is used as client_id and brk_client_id (BROKER_CLIENT_ID) is present
            expect(queryString).toContain(`client_id=child_client_id_1`);
            expect(queryString).toContain(
                `brk_client_id=${config.authOptions.clientId}`
            );

            // Verify claims are present and DO include access_token.xms_cc (clientCapabilities)
            // because skipBrokerClaims is not set, BROKER_CLIENT_ID alone does not skip capabilities
            const claimsMatch = queryString.match(/claims=([^&]+)/);
            expect(claimsMatch).not.toBeNull();
            const parsedClaims = JSON.parse(
                decodeURIComponent(claimsMatch![1])
            );
            expect(parsedClaims.userinfo).toBeDefined();
            expect(parsedClaims.access_token?.xms_cc?.values).toEqual([
                "CP1",
                "CP2",
            ]);
        });

        it("includes clientCapabilities from config when BROKER_CLIENT_ID is NOT present", async () => {
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            // Add clientCapabilities to the config
            config.authOptions.clientCapabilities = ["CP1", "CP2"];
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );

            const queryString =
                // @ts-ignore
                await client.createTokenRequestBody({
                    scopes: ["User.Read"],
                    redirectUri: "localhost",
                    claims: JSON.stringify({ userinfo: { given_name: null } }),
                });

            // Verify standard client_id is used (from config)
            expect(queryString).toContain(
                `client_id=${config.authOptions.clientId}`
            );
            // Verify brk_client_id (BROKER_CLIENT_ID) is NOT present
            expect(queryString).not.toContain(`brk_client_id=`);

            // Verify claims are present and DO include access_token.xms_cc (clientCapabilities)
            const claimsMatch = queryString.match(/claims=([^&]+)/);
            expect(claimsMatch).not.toBeNull();
            const parsedClaims = JSON.parse(
                decodeURIComponent(claimsMatch![1])
            );
            expect(parsedClaims.userinfo).toBeDefined();
            expect(parsedClaims.access_token?.xms_cc?.values).toEqual([
                "CP1",
                "CP2",
            ]);
        });

        it("includes clientCapabilities from config when skipBrokerClaims is true but BROKER_CLIENT_ID is NOT present", async () => {
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            // Add clientCapabilities to the config
            config.authOptions.clientCapabilities = ["CP1", "CP2"];
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );

            const queryString =
                // @ts-ignore
                await client.createTokenRequestBody({
                    scopes: ["User.Read"],
                    redirectUri: "localhost",
                    claims: JSON.stringify({ userinfo: { given_name: null } }),
                    skipBrokerClaims: true,
                });

            // Verify standard client_id is used (from config)
            expect(queryString).toContain(
                `client_id=${config.authOptions.clientId}`
            );
            // Verify brk_client_id is NOT present (not a brokered flow)
            expect(queryString).not.toContain(`brk_client_id=`);

            // Verify claims are present and DO include access_token.xms_cc (clientCapabilities)
            // because BROKER_CLIENT_ID is not present, skipBrokerClaims alone does not skip capabilities
            const claimsMatch = queryString.match(/claims=([^&]+)/);
            expect(claimsMatch).not.toBeNull();
            const parsedClaims = JSON.parse(
                decodeURIComponent(claimsMatch![1])
            );
            expect(parsedClaims.userinfo).toBeDefined();
            expect(parsedClaims.access_token?.xms_cc?.values).toEqual([
                "CP1",
                "CP2",
            ]);
        });

        it("ignores clientCapabilities from config when both skipBrokerClaims is true and BROKER_CLIENT_ID is present", async () => {
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            // Add clientCapabilities to the config
            config.authOptions.clientCapabilities = ["CP1", "CP2"];
            const client = new RefreshTokenClient(
                config,
                stubPerformanceClient
            );

            const queryString =
                // @ts-ignore
                await client.createTokenRequestBody({
                    scopes: ["User.Read"],
                    redirectUri: "localhost",
                    embeddedClientId: "child_client_id_1",
                    claims: JSON.stringify({ userinfo: { given_name: null } }),
                    skipBrokerClaims: true,
                });

            // Verify embeddedClientId is used as client_id and brk_client_id (BROKER_CLIENT_ID) is present
            expect(queryString).toContain(`client_id=child_client_id_1`);
            expect(queryString).toContain(
                `brk_client_id=${config.authOptions.clientId}`
            );

            // Verify claims are present but do NOT include access_token.xms_cc (clientCapabilities)
            // because both skipBrokerClaims is true AND BROKER_CLIENT_ID is present
            const claimsMatch = queryString.match(/claims=([^&]+)/);
            expect(claimsMatch).not.toBeNull();
            const parsedClaims = JSON.parse(
                decodeURIComponent(claimsMatch![1])
            );
            expect(parsedClaims.userinfo).toBeDefined();
            expect(parsedClaims.access_token?.xms_cc).toBeUndefined();
        });
    });
});
