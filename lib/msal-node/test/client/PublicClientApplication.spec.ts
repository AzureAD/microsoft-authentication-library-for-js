/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ID_TOKEN_CLAIMS,
    mockNativeAccountInfo,
    mockAuthenticationResult,
    mockNativeAuthenticationResult,
    TEST_CONSTANTS,
    TEST_DATA_CLIENT_INFO,
    mockAccountInfo,
    DEFAULT_OPENID_CONFIG_RESPONSE,
} from "../utils/TestConstants.js";
import {
    AuthorizationCodeClient,
    RefreshTokenClient,
    SilentFlowClient,
    Logger,
    LogLevel,
    AccountInfo,
    AuthorizeResponse,
    InteractionRequiredAuthError,
    AccountEntity,
    AuthToken,
    CacheHelpers,
    AuthorityFactory,
    ProtocolMode,
    AADServerParamKeys,
    TokenCacheContext,
    Authority,
    IdTokenEntity,
    AccessTokenEntity,
    TimeUtils,
    Constants as CommonConstants,
    RefreshTokenEntity,
    CacheManager,
    CommonSilentFlowRequest,
    AccountEntityUtils,
    ClientConfigurationErrorCodes,
} from "@azure/msal-common/node";
import {
    Configuration,
    InteractiveRequest,
    PublicClientApplication,
    DeviceCodeRequest,
    AuthorizationCodeRequest,
    RefreshTokenRequest,
    AuthorizationUrlRequest,
    SilentFlowRequest,
} from "../../src/index.js";
import http from "http";

import { setupServerTelemetryManagerMock } from "./test-fixtures.js";
import { getMsalCommonAutoMock, MSALCommonModule } from "../utils/MockUtils.js";

import { version, name } from "../../src/packageMetadata.js";
import { MockNativeBrokerPlugin } from "../utils/MockNativeBrokerPlugin.js";
import { SignOutRequest } from "../../src/request/SignOutRequest.js";
import { LoopbackClient } from "../../src/network/LoopbackClient.js";
import {
    createClientAuthError,
    ClientAuthErrorCodes,
} from "@azure/msal-common/node";
import {
    AUTHENTICATION_RESULT,
    DEVICE_CODE_RESPONSE,
    TEST_CONFIG,
    TEST_TOKENS,
} from "../test_kit/StringConstants.js";
import { HttpClient } from "../../src/network/HttpClient.js";
import { MockStorageClass } from "./ClientTestUtils.js";
import { Constants } from "../../src/utils/Constants.js";
import { NodeStorage } from "../../src/cache/NodeStorage.js";
import { TokenCache } from "../../src/index.js";
import { buildAccountFromIdTokenClaims } from "msal-test-utils";
import * as AuthorizeProtocol from "../../src/protocol/Authorize.js";
import { StubPerformanceClient } from "@azure/msal-common";
import { DeviceCodeClient } from "../../src/client/DeviceCodeClient.js";
import { CryptoProvider } from "../../src/crypto/CryptoProvider.js";

const msalCommon: MSALCommonModule = jest.requireActual(
    "@azure/msal-common/node"
);

jest.mock("../../src/client/DeviceCodeClient");
jest.mock("../../src/client/ClientCredentialClient");
jest.mock("../../src/client/OnBehalfOfClient");
jest.mock("../../src/client/UsernamePasswordClient");

const testAccountEntity: AccountEntity =
    buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);

function createTestAccount(): AccountInfo {
    return {
        ...AccountEntityUtils.getAccountInfo(testAccountEntity),
        idTokenClaims: ID_TOKEN_CLAIMS,
        idToken: TEST_TOKENS.IDTOKEN_V2,
    };
}

function createAuthenticationResultWithoutNonce() {
    const { nonce: _nonce, ...claimsWithoutNonce } = ID_TOKEN_CLAIMS;
    const idToken = [
        Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url"),
        Buffer.from(JSON.stringify(claimsWithoutNonce)).toString("base64url"),
        "signature",
    ].join(".");

    return {
        ...AUTHENTICATION_RESULT,
        body: {
            ...AUTHENTICATION_RESULT.body,
            id_token: idToken,
        },
    };
}

function createTestIdToken(): IdTokenEntity {
    return {
        homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
        environment: testAccountEntity.environment,
        realm: ID_TOKEN_CLAIMS.tid,
        secret: AUTHENTICATION_RESULT.body.id_token,
        credentialType: CommonConstants.CredentialType.ID_TOKEN,
        lastUpdatedAt: Date.now().toString(),
    };
}

function createTestAccessToken(): AccessTokenEntity {
    const cachedAt = `${TimeUtils.nowSeconds()}`;
    return {
        homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
        environment: testAccountEntity.environment,
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

function createTestRefreshToken(): RefreshTokenEntity {
    return {
        homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
        environment: testAccountEntity.environment,
        realm: ID_TOKEN_CLAIMS.tid,
        secret: AUTHENTICATION_RESULT.body.refresh_token,
        credentialType: CommonConstants.CredentialType.REFRESH_TOKEN,
        lastUpdatedAt: Date.now().toString(),
    };
}

describe("PublicClientApplication", () => {
    // @ts-ignore
    const mockTelemetryManager: msalCommon.ServerTelemetryManager =
        setupServerTelemetryManagerMock();

    let appConfig: Configuration = {
        auth: {
            clientId: TEST_CONSTANTS.CLIENT_ID,
            authority: TEST_CONSTANTS.DEFAULT_AUTHORITY,
        },
    };

    let testAppConfig: Configuration = {
        auth: {
            clientId: TEST_CONSTANTS.CLIENT_ID,
            authority: TEST_CONSTANTS.AUTHORITY,
        },

        system: {
            loggerOptions: void 0,
        },
    };

    beforeEach(() => {
        mockTelemetryManager;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("exports a class", () => {
        const authApp = new PublicClientApplication(appConfig);
        expect(authApp).toBeInstanceOf(PublicClientApplication);
    });

    test("acquireTokenByDeviceCode", async () => {
        const request: DeviceCodeRequest = {
            deviceCodeCallback: (response) => {
                console.log(response);
            },
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
        };

        const fakeAuthResult = mockAuthenticationResult;
        jest.spyOn(
            DeviceCodeClient.prototype,
            "acquireToken"
        ).mockImplementation(() => Promise.resolve(fakeAuthResult));

        const authApp = new PublicClientApplication(appConfig);
        const result = await authApp.acquireTokenByDeviceCode(request);
        expect(result).toEqual(fakeAuthResult);
    });

    test("acquireTokenByCode", async () => {
        const request: AuthorizationCodeRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
        };

        const MockAuthorizationCodeClient =
            getMsalCommonAutoMock().AuthorizationCodeClient;

        jest.spyOn(msalCommon, "AuthorizationCodeClient").mockImplementation(
            (config) =>
                new MockAuthorizationCodeClient(
                    config,
                    new StubPerformanceClient()
                )
        );

        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenByCode(request);

        expect(AuthorizationCodeClient).toHaveBeenCalledTimes(1);
    });

    test("acquireTokenByCode forwards request nonce in auth code payload", async () => {
        const nonce = new CryptoProvider().createNewGuid();
        const request: AuthorizationCodeRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
            nonce,
        };

        const MockAuthorizationCodeClient =
            getMsalCommonAutoMock().AuthorizationCodeClient;
        const acquireTokenSpy = jest.spyOn(
            MockAuthorizationCodeClient.prototype,
            "acquireToken"
        );

        jest.spyOn(msalCommon, "AuthorizationCodeClient").mockImplementation(
            (config) =>
                new MockAuthorizationCodeClient(
                    config,
                    new StubPerformanceClient()
                )
        );

        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenByCode(request);

        expect(AuthorizationCodeClient).toHaveBeenCalledTimes(1);
        expect(acquireTokenSpy.mock.calls[0][2]).toEqual({
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
            nonce,
        });
    });

    test("acquireTokenByCode with request nonce does not enable payload state validation", async () => {
        const nonce = new CryptoProvider().createNewGuid();
        const request: AuthorizationCodeRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
            nonce,
            state: "request-state",
        };
        const MockAuthorizationCodeClient =
            getMsalCommonAutoMock().AuthorizationCodeClient;
        const acquireTokenSpy = jest.spyOn(
            MockAuthorizationCodeClient.prototype,
            "acquireToken"
        );

        jest.spyOn(msalCommon, "AuthorizationCodeClient").mockImplementation(
            (config) =>
                new MockAuthorizationCodeClient(
                    config,
                    new StubPerformanceClient()
                )
        );

        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenByCode(request);

        expect(acquireTokenSpy.mock.calls[0][2]).toEqual({
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
            nonce,
        });
    });

    test("acquireTokenByCode preserves legacy nonce payload", async () => {
        const request: AuthorizationCodeRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
        };
        const authCodePayLoad = {
            nonce: new CryptoProvider().createNewGuid(),
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
        };
        const MockAuthorizationCodeClient =
            getMsalCommonAutoMock().AuthorizationCodeClient;
        const acquireTokenSpy = jest.spyOn(
            MockAuthorizationCodeClient.prototype,
            "acquireToken"
        );

        jest.spyOn(msalCommon, "AuthorizationCodeClient").mockImplementation(
            (config) =>
                new MockAuthorizationCodeClient(
                    config,
                    new StubPerformanceClient()
                )
        );

        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenByCode(request, authCodePayLoad);

        expect(acquireTokenSpy.mock.calls[0][2]).toEqual(authCodePayLoad);
    });

    test("acquireTokenByCode request nonce takes precedence and preserves payload metadata", async () => {
        const nonce = new CryptoProvider().createNewGuid();
        const request: AuthorizationCodeRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
            nonce,
        };
        const authCodePayLoad = {
            nonce: "legacy-nonce",
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
            client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
        };
        const MockAuthorizationCodeClient =
            getMsalCommonAutoMock().AuthorizationCodeClient;
        const acquireTokenSpy = jest.spyOn(
            MockAuthorizationCodeClient.prototype,
            "acquireToken"
        );

        jest.spyOn(msalCommon, "AuthorizationCodeClient").mockImplementation(
            (config) =>
                new MockAuthorizationCodeClient(
                    config,
                    new StubPerformanceClient()
                )
        );

        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenByCode(request, authCodePayLoad);

        expect(acquireTokenSpy.mock.calls[0][2]).toEqual({
            ...authCodePayLoad,
            nonce,
        });
    });

    test("acquireTokenByCode with state validation", async () => {
        const request: AuthorizationCodeRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
        };

        const cryptoProvider = new CryptoProvider();
        const authCodePayLoad = {
            nonce: cryptoProvider.createNewGuid(),
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
            state: cryptoProvider.createNewGuid(),
        };

        const MockAuthorizationCodeClient =
            getMsalCommonAutoMock().AuthorizationCodeClient;

        jest.spyOn(msalCommon, "AuthorizationCodeClient").mockImplementation(
            (config) =>
                new MockAuthorizationCodeClient(
                    config,
                    new StubPerformanceClient()
                )
        );

        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenByCode(request, authCodePayLoad);

        expect(AuthorizationCodeClient).toHaveBeenCalledTimes(1);
    });

    test("acquireTokenByRefreshToken", async () => {
        const request: RefreshTokenRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
        };

        const mockRefreshTokenClient =
            getMsalCommonAutoMock().RefreshTokenClient;
        jest.spyOn(msalCommon, "RefreshTokenClient").mockImplementation(
            (config) =>
                new mockRefreshTokenClient(config, new StubPerformanceClient())
        );

        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenByRefreshToken(request);
        expect(RefreshTokenClient).toHaveBeenCalledTimes(1);
    });

    describe("acquireTokenSilent tests", () => {
        test("acquireTokenSilent succeeds", async () => {
            const request: SilentFlowRequest = {
                account: mockAccountInfo,
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            };

            const silentFlowClient = getMsalCommonAutoMock().SilentFlowClient;
            jest.spyOn(msalCommon, "SilentFlowClient").mockImplementation(
                (config) =>
                    new silentFlowClient(config, new StubPerformanceClient())
            );
            jest.spyOn(
                silentFlowClient.prototype,
                "acquireCachedToken"
            ).mockResolvedValue([
                mockAuthenticationResult,
                CommonConstants.CacheOutcome.NOT_APPLICABLE,
            ]);

            const authApp = new PublicClientApplication(appConfig);
            await authApp.acquireTokenSilent(request);
            expect(SilentFlowClient).toHaveBeenCalledTimes(1);
        });

        test("acquireTokenSilent calls into NativeBrokerPlugin and returns result", async () => {
            const authApp = new PublicClientApplication({
                ...appConfig,
                broker: {
                    nativeBrokerPlugin: new MockNativeBrokerPlugin(),
                },
            });

            const request: SilentFlowRequest = {
                account: mockNativeAccountInfo,
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            };
            const brokerSpy = jest.spyOn(
                MockNativeBrokerPlugin.prototype,
                "acquireTokenSilent"
            );
            const response = await authApp.acquireTokenSilent(request);
            expect(brokerSpy).toHaveBeenCalled();
            expect(response.idToken).toEqual(
                mockNativeAuthenticationResult.idToken
            );
            expect(response.accessToken).toEqual(
                mockNativeAuthenticationResult.accessToken
            );
            expect(response.account).toEqual(
                mockNativeAuthenticationResult.account
            );
        });

        test("acquireTokenSilent sends extra telemetry to NativeBrokerPlugin", async () => {
            const authApp = new PublicClientApplication({
                ...appConfig,
                broker: {
                    nativeBrokerPlugin: new MockNativeBrokerPlugin(),
                },
            });

            const request: SilentFlowRequest = {
                account: mockNativeAccountInfo,
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            };
            const brokerSpy: jest.SpyInstance<unknown, [...unknown[]]> =
                jest.spyOn(
                    MockNativeBrokerPlugin.prototype,
                    "acquireTokenSilent"
                );
            await authApp.acquireTokenSilent(request);
            const nativeRequest = brokerSpy.mock.calls[0][0];
            expect(nativeRequest).toHaveProperty("extraParameters");
            // @ts-ignore
            expect(nativeRequest.extraParameters).toHaveProperty(
                AADServerParamKeys.X_CLIENT_EXTRA_SKU,
                `${Constants.MSAL_SKU}|${version},|,|,|`
            );
        });

        test("acquireTokenSilent calls into NativeBrokerPlugin and throws", (done) => {
            const authApp = new PublicClientApplication({
                ...appConfig,
                broker: {
                    nativeBrokerPlugin: new MockNativeBrokerPlugin(),
                },
            });

            const request: SilentFlowRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                account: mockNativeAccountInfo,
            };

            const testError = new InteractionRequiredAuthError(
                "interaction_required",
                ""
            );
            const brokerSpy = jest
                .spyOn(MockNativeBrokerPlugin.prototype, "acquireTokenSilent")
                .mockImplementation(() => {
                    return Promise.reject(testError);
                });
            authApp.acquireTokenSilent(request).catch((e) => {
                expect(brokerSpy).toHaveBeenCalled();
                expect(e).toBe(testError);
                done();
            });
        });

        test("acquireTokenSilent calls overwriteCache if persistence exists", async () => {
            const beforeCacheAccess = jest
                .fn()
                .mockImplementation((cacheContext: TokenCacheContext) => {
                    //@ts-ignore
                    cacheContext.cache.cacheSnapshot = "{}";
                });
            const afterCacheAccess = jest
                .fn()
                .mockImplementation((cacheContext: TokenCacheContext) => {
                    //@ts-ignore
                    cacheContext.cache.cacheSnapshot = "{}";
                });

            const authApp = new PublicClientApplication({
                ...appConfig,
                cache: { cachePlugin: { beforeCacheAccess, afterCacheAccess } },
            });

            const silentFlowClient = getMsalCommonAutoMock().SilentFlowClient;
            jest.spyOn(msalCommon, "SilentFlowClient").mockImplementation(
                (config) =>
                    new silentFlowClient(config, new StubPerformanceClient())
            );

            let acquireCachedTokenSpy = jest
                .spyOn(silentFlowClient.prototype, "acquireCachedToken")
                .mockResolvedValue([
                    mockAuthenticationResult,
                    CommonConstants.CacheOutcome.NOT_APPLICABLE,
                ]);

            let cacheSpy = jest.spyOn(TokenCache.prototype, "overwriteCache");

            const request: SilentFlowRequest = {
                account: mockAccountInfo,
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            };

            const response = await authApp.acquireTokenSilent(request);
            expect(response).toEqual(mockAuthenticationResult);
            expect(acquireCachedTokenSpy).toHaveBeenCalled();
            expect(cacheSpy).toHaveBeenCalled();
        });

        it("acquireTokenSilent refreshes token if refreshOn time has passed", async () => {
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
                createTestIdToken()
            );
            jest.spyOn(
                CacheManager.prototype,
                "getAccessToken"
            ).mockReturnValue(createTestAccessToken());
            jest.spyOn(
                CacheManager.prototype,
                "getRefreshToken"
            ).mockReturnValue(createTestRefreshToken());
            jest.spyOn(NodeStorage.prototype, "getAccount").mockReturnValue(
                testAccountEntity
            );
            jest.spyOn(
                CacheManager.prototype,
                "getAllAccounts"
            ).mockReturnValue([createTestAccount()]);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: createTestAccount(),
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            const appConfiguration: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    authority: TEST_CONSTANTS.DEFAULT_AUTHORITY,
                },
            };
            const authApp = new PublicClientApplication(appConfiguration);
            //@ts-ignore
            if (!authApp.storage) {
                fail("authApp.storage is undefined");
            }

            // The cached token returned from acquireCachedToken below is mocked, which means it won't exist in the cache at this point
            //@ts-ignore
            const accessTokenKey: string | undefined = authApp.storage
                .getKeys()
                .find((value) => value.indexOf("accesstoken") >= 0);
            expect(accessTokenKey).toBeUndefined();

            // Acquire a token (from the cache). The refresh_in value is expired, so there will be an asynchronous network request
            // to refresh the token. That result will be stored in the cache.
            await authApp.acquireTokenSilent(silentFlowRequest);

            /**
             * @param cache config.storageInterface
             * @returns AccessTokenEntity - the access token in the cache
             */
            const waitUntilAccessTokenInCacheThenReturnIt = async (
                cache: NodeStorage
            ): Promise<AccessTokenEntity | null> => {
                let counter: number = 0;
                return await new Promise((resolve) => {
                    const interval = setInterval(() => {
                        // look for the access token's key in the cache
                        const accessTokenKey = cache
                            .getKeys()
                            .find((value) => value.indexOf("accesstoken") >= 0);
                        // if the access token's key is in the cache
                        if (accessTokenKey) {
                            // use it to get the access token (from the cache)
                            const accessTokenFromCache: AccessTokenEntity | null =
                                cache.getAccessTokenCredential(accessTokenKey);
                            // return it and clear the interval
                            resolve(accessTokenFromCache);
                            clearInterval(interval);
                            // otherwise, if the access token's key is NOT in the cache (yet)
                        } else {
                            counter++;
                            // exit the interval so that this test doesn't time out
                            if (counter === 400) {
                                clearInterval(interval);
                                resolve(null);
                            }
                        }
                    }, 1); // wait 1 millisecond
                });
            };
            const accessTokenFromCache: AccessTokenEntity | null =
                await waitUntilAccessTokenInCacheThenReturnIt(
                    //@ts-ignore
                    authApp.storage
                );

            expect(accessTokenFromCache?.clientId).toEqual(
                createTestAccessToken().clientId
            );
        });

        it("Adds extraQueryParameters to the /token request", (done) => {
            AUTHENTICATION_RESULT.body.client_info =
                TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
            jest.spyOn(HttpClient.prototype, "sendPostRequestAsync")
                // @ts-expect-error
                .mockImplementation((url: string) => {
                    try {
                        expect(
                            url.includes(
                                "/token?testParam1=testValue1&testParam3=testValue3"
                            )
                        ).toBeTruthy();
                        expect(
                            !url.includes("/token?testParam2=")
                        ).toBeTruthy();
                        done();
                        return AUTHENTICATION_RESULT;
                    } catch (error) {
                        done(error);
                        return error;
                    }
                });
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const accessToken = createTestAccessToken();
            jest.spyOn(CacheManager.prototype, "getIdToken").mockReturnValue(
                createTestIdToken()
            );
            jest.spyOn(
                CacheManager.prototype,
                "getAccessToken"
            ).mockReturnValue(accessToken);
            jest.spyOn(
                CacheManager.prototype,
                "getRefreshToken"
            ).mockReturnValue(createTestRefreshToken());
            jest.spyOn(
                MockStorageClass.prototype,
                "getAccount"
            ).mockReturnValue(testAccountEntity);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: createTestAccount(),
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
                extraQueryParameters: {
                    testParam1: "testValue1",
                    testParam2: "",
                    testParam3: "testValue3",
                },
            };

            const authApp = new PublicClientApplication(appConfig);
            authApp.acquireTokenSilent(silentFlowRequest).catch(() => {
                // Catch errors thrown after the function call this test is testing
            });
        });

        test("acquireTokenSilent throws error when redirectUri is provided", async () => {
            const authApp = new PublicClientApplication(appConfig);
            const request: SilentFlowRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                account: createTestAccount(),
                redirectUri: "http://localhost:3000/redirect",
            };

            await expect(authApp.acquireTokenSilent(request)).rejects.toThrow(
                "RedirectUri is not supported in this scenario"
            );
        });

        test("acquireTokenSilent resets redirectUri when broker fallback occurs", async () => {
            // Create a broker plugin with broker unavailable
            const mockBrokerPlugin = new MockNativeBrokerPlugin();
            mockBrokerPlugin.isBrokerAvailable = false;

            const authApp = new PublicClientApplication({
                ...appConfig,
                broker: {
                    nativeBrokerPlugin: mockBrokerPlugin,
                },
            });

            const silentFlowClient = getMsalCommonAutoMock().SilentFlowClient;
            jest.spyOn(msalCommon, "SilentFlowClient").mockImplementation(
                (config) =>
                    new silentFlowClient(config, new StubPerformanceClient())
            );
            jest.spyOn(
                silentFlowClient.prototype,
                "acquireCachedToken"
            ).mockResolvedValue([
                mockAuthenticationResult,
                CommonConstants.CacheOutcome.NOT_APPLICABLE,
            ]);

            const request: SilentFlowRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                account: createTestAccount(),
                redirectUri: "http://localhost:3000/redirect",
            };

            // This should not throw and should reset redirectUri to empty string and continue with the request
            const response = await authApp.acquireTokenSilent(request);

            expect(response).toEqual(mockAuthenticationResult);
            expect(request.redirectUri).toBe("");
        });
    });

    describe("acquireTokenInteractive tests", () => {
        // Causing pipeline to hang, needs to be fixed
        test.skip("acquireTokenInteractive succeeds", async () => {
            const authApp = new PublicClientApplication(appConfig);

            let redirectUri: string;

            const openBrowser = (url: string) => {
                expect(
                    url.startsWith("https://login.microsoftonline.com")
                ).toBe(true);
                http.get(
                    `${redirectUri}?code=${TEST_CONSTANTS.AUTHORIZATION_CODE}`
                );
                return Promise.resolve();
            };
            const request: InteractiveRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                openBrowser: openBrowser,
            };

            const MockAuthorizationCodeClient =
                getMsalCommonAutoMock().AuthorizationCodeClient;
            jest.spyOn(
                msalCommon,
                "AuthorizationCodeClient"
            ).mockImplementation(
                (config) =>
                    new MockAuthorizationCodeClient(
                        config,
                        new StubPerformanceClient()
                    )
            );

            jest.spyOn(
                AuthorizeProtocol,
                "getAuthCodeRequestUrl"
            ).mockImplementation((_config, _authority, req, _logger) => {
                redirectUri = req.redirectUri;
                return TEST_CONSTANTS.AUTH_CODE_URL;
            });

            jest.spyOn(
                MockAuthorizationCodeClient.prototype,
                "acquireToken"
            ).mockImplementation((tokenRequest) => {
                expect(tokenRequest.scopes).toEqual([
                    ...TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONSTANTS.DEFAULT_OIDC_SCOPES,
                ]);
                return Promise.resolve(mockAuthenticationResult);
            });

            const response = await authApp.acquireTokenInteractive(request);
            expect(response.idToken).toEqual(mockAuthenticationResult.idToken);
            expect(response.accessToken).toEqual(
                mockAuthenticationResult.accessToken
            );
            expect(response.account).toEqual(mockAuthenticationResult.account);
        });

        // Causing pipeline to hang, needs to be fixed
        test.skip("acquireTokenInteractive - getting redirectUri waits for server to start", async () => {
            const authApp = new PublicClientApplication(appConfig);

            let redirectUri: string;

            // mock listener to wait 2 seconds before starting server
            let originalListen = LoopbackClient.prototype.listenForAuthCode;
            const listenerSpy = jest.spyOn(
                LoopbackClient.prototype,
                "listenForAuthCode"
            );
            listenerSpy.mockImplementation(() => {
                return new Promise<void>((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, 2000);
                }).then(
                    () => originalListen.call(listenerSpy.mock.instances[0]) // call original function and pass in the 'this' context
                );
            });

            const openBrowser = (url: string) => {
                expect(
                    url.startsWith("https://login.microsoftonline.com")
                ).toBe(true);
                http.get(
                    `${redirectUri}?code=${TEST_CONSTANTS.AUTHORIZATION_CODE}`
                );
                return Promise.resolve();
            };
            const request: InteractiveRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                openBrowser: openBrowser,
            };

            const MockAuthorizationCodeClient =
                getMsalCommonAutoMock().AuthorizationCodeClient;
            jest.spyOn(
                msalCommon,
                "AuthorizationCodeClient"
            ).mockImplementation(
                (config) =>
                    new MockAuthorizationCodeClient(
                        config,
                        new StubPerformanceClient()
                    )
            );

            jest.spyOn(
                AuthorizeProtocol,
                "getAuthCodeRequestUrl"
            ).mockImplementation((_config, _authority, req, _logger) => {
                redirectUri = req.redirectUri;
                return TEST_CONSTANTS.AUTH_CODE_URL;
            });

            jest.spyOn(
                MockAuthorizationCodeClient.prototype,
                "acquireToken"
            ).mockImplementation((tokenRequest) => {
                expect(tokenRequest.scopes).toEqual([
                    ...TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONSTANTS.DEFAULT_OIDC_SCOPES,
                ]);
                return Promise.resolve(mockAuthenticationResult);
            });

            const response = await authApp.acquireTokenInteractive(request);
            expect(response.idToken).toEqual(mockAuthenticationResult.idToken);
            expect(response.accessToken).toEqual(
                mockAuthenticationResult.accessToken
            );
            expect(response.account).toEqual(mockAuthenticationResult.account);
        });

        test("acquireTokenInteractive - defaults responseMode to form_post when omitted", async () => {
            const authApp = new PublicClientApplication(appConfig);

            const openBrowser = (url: string) => {
                expect(
                    url.startsWith("https://login.microsoftonline.com")
                ).toBe(true);
                return Promise.resolve();
            };

            const testServerCodeResponse: AuthorizeResponse = {
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                client_info: TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO,
                state: "123",
            };

            jest.spyOn(
                LoopbackClient.prototype,
                "listenForAuthCode"
            ).mockResolvedValue(testServerCodeResponse);
            jest.spyOn(
                LoopbackClient.prototype,
                "getRedirectUri"
            ).mockReturnValue(TEST_CONSTANTS.REDIRECT_URI);
            jest.spyOn(
                LoopbackClient.prototype,
                "closeServer"
            ).mockImplementation(() => {});

            const request: InteractiveRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                openBrowser: openBrowser,
            };

            const MockAuthorizationCodeClient =
                getMsalCommonAutoMock().AuthorizationCodeClient;
            jest.spyOn(
                msalCommon,
                "AuthorizationCodeClient"
            ).mockImplementation(
                (config) =>
                    new MockAuthorizationCodeClient(
                        config,
                        new StubPerformanceClient()
                    )
            );

            const getAuthCodeUrlSpy = jest
                .spyOn(AuthorizeProtocol, "getAuthCodeRequestUrl")
                .mockImplementation((_config, _authority, req, _logger) => {
                    expect(req.responseMode).toEqual(
                        CommonConstants.ResponseMode.FORM_POST
                    );
                    return TEST_CONSTANTS.AUTH_CODE_URL;
                });

            jest.spyOn(
                MockAuthorizationCodeClient.prototype,
                "acquireToken"
            ).mockResolvedValue(mockAuthenticationResult);

            const response = await authApp.acquireTokenInteractive(request);
            expect(response.accessToken).toEqual(
                mockAuthenticationResult.accessToken
            );
            expect(getAuthCodeUrlSpy).toHaveBeenCalledTimes(1);
        });

        test("acquireTokenInteractive - honors explicit responseMode of query", async () => {
            const authApp = new PublicClientApplication(appConfig);

            const openBrowser = (url: string) => {
                expect(
                    url.startsWith("https://login.microsoftonline.com")
                ).toBe(true);
                return Promise.resolve();
            };

            const testServerCodeResponse: AuthorizeResponse = {
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                client_info: TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO,
                state: "123",
            };

            jest.spyOn(
                LoopbackClient.prototype,
                "listenForAuthCode"
            ).mockResolvedValue(testServerCodeResponse);
            jest.spyOn(
                LoopbackClient.prototype,
                "getRedirectUri"
            ).mockReturnValue(TEST_CONSTANTS.REDIRECT_URI);
            jest.spyOn(
                LoopbackClient.prototype,
                "closeServer"
            ).mockImplementation(() => {});

            const request: InteractiveRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                openBrowser: openBrowser,
                responseMode: CommonConstants.ResponseMode.QUERY,
            };

            const MockAuthorizationCodeClient =
                getMsalCommonAutoMock().AuthorizationCodeClient;
            jest.spyOn(
                msalCommon,
                "AuthorizationCodeClient"
            ).mockImplementation(
                (config) =>
                    new MockAuthorizationCodeClient(
                        config,
                        new StubPerformanceClient()
                    )
            );

            const getAuthCodeUrlSpy = jest
                .spyOn(AuthorizeProtocol, "getAuthCodeRequestUrl")
                .mockImplementation((_config, _authority, req, _logger) => {
                    expect(req.responseMode).toEqual(
                        CommonConstants.ResponseMode.QUERY
                    );
                    return TEST_CONSTANTS.AUTH_CODE_URL;
                });

            jest.spyOn(
                MockAuthorizationCodeClient.prototype,
                "acquireToken"
            ).mockResolvedValue(mockAuthenticationResult);

            const response = await authApp.acquireTokenInteractive(request);
            expect(response.accessToken).toEqual(
                mockAuthenticationResult.accessToken
            );
            expect(getAuthCodeUrlSpy).toHaveBeenCalledTimes(1);
        });

        test("acquireTokenInteractive - honors explicit responseMode of form_post", async () => {
            const authApp = new PublicClientApplication(appConfig);

            const openBrowser = (url: string) => {
                expect(
                    url.startsWith("https://login.microsoftonline.com")
                ).toBe(true);
                return Promise.resolve();
            };

            const testServerCodeResponse: AuthorizeResponse = {
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                client_info: TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO,
                state: "123",
            };

            jest.spyOn(
                LoopbackClient.prototype,
                "listenForAuthCode"
            ).mockResolvedValue(testServerCodeResponse);
            jest.spyOn(
                LoopbackClient.prototype,
                "getRedirectUri"
            ).mockReturnValue(TEST_CONSTANTS.REDIRECT_URI);
            jest.spyOn(
                LoopbackClient.prototype,
                "closeServer"
            ).mockImplementation(() => {});

            const request: InteractiveRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                openBrowser: openBrowser,
                responseMode: CommonConstants.ResponseMode.FORM_POST,
            };

            const MockAuthorizationCodeClient =
                getMsalCommonAutoMock().AuthorizationCodeClient;
            jest.spyOn(
                msalCommon,
                "AuthorizationCodeClient"
            ).mockImplementation(
                (config) =>
                    new MockAuthorizationCodeClient(
                        config,
                        new StubPerformanceClient()
                    )
            );

            const getAuthCodeUrlSpy = jest
                .spyOn(AuthorizeProtocol, "getAuthCodeRequestUrl")
                .mockImplementation((_config, _authority, req, _logger) => {
                    expect(req.responseMode).toEqual(
                        CommonConstants.ResponseMode.FORM_POST
                    );
                    return TEST_CONSTANTS.AUTH_CODE_URL;
                });

            jest.spyOn(
                MockAuthorizationCodeClient.prototype,
                "acquireToken"
            ).mockResolvedValue(mockAuthenticationResult);

            const response = await authApp.acquireTokenInteractive(request);
            expect(response.accessToken).toEqual(
                mockAuthenticationResult.accessToken
            );
            expect(getAuthCodeUrlSpy).toHaveBeenCalledTimes(1);
        });

        test("acquireTokenInteractive - calls into NativeBrokerPlugin and returns result", async () => {
            const authApp = new PublicClientApplication({
                ...appConfig,
                broker: {
                    nativeBrokerPlugin: new MockNativeBrokerPlugin(),
                },
            });

            const openBrowser = (url: string) => {
                expect(
                    url.startsWith("https://login.microsoftonline.com")
                ).toBe(true);
                return Promise.resolve();
            };

            const request: InteractiveRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                openBrowser,
            };
            const brokerSpy = jest.spyOn(
                MockNativeBrokerPlugin.prototype,
                "acquireTokenInteractive"
            );
            const response = await authApp.acquireTokenInteractive(request);
            expect(brokerSpy).toHaveBeenCalled();
            expect(response.idToken).toEqual(
                mockNativeAuthenticationResult.idToken
            );
            expect(response.accessToken).toEqual(
                mockNativeAuthenticationResult.accessToken
            );
            expect(response.account).toEqual(
                mockNativeAuthenticationResult.account
            );
        });

        test("acquireTokenInteractive - calls into NativeBrokerPlugin and throws", (done) => {
            const authApp = new PublicClientApplication({
                ...appConfig,
                broker: {
                    nativeBrokerPlugin: new MockNativeBrokerPlugin(),
                },
            });

            const openBrowser = (url: string) => {
                expect(
                    url.startsWith("https://login.microsoftonline.com")
                ).toBe(true);
                return Promise.resolve();
            };

            const request: InteractiveRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                openBrowser,
            };

            const testError = createClientAuthError(
                ClientAuthErrorCodes.userCanceled,
                ""
            );
            const brokerSpy = jest
                .spyOn(
                    MockNativeBrokerPlugin.prototype,
                    "acquireTokenInteractive"
                )
                .mockImplementation(() => {
                    return Promise.reject(testError);
                });
            authApp.acquireTokenInteractive(request).catch((e) => {
                expect(brokerSpy).toHaveBeenCalled();
                expect(e).toBe(testError);
                done();
            });
        });

        test("acquireTokenInteractive - loopback server is closed on error", (done) => {
            const authApp = new PublicClientApplication(appConfig);

            const openBrowser = (url: string) => {
                expect(
                    url.startsWith("https://login.microsoftonline.com")
                ).toBe(true);
                return Promise.reject("Browser open error");
            };

            const testServerCodeResponse: AuthorizeResponse = {
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                client_info: TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO,
                state: "123",
            };

            jest.spyOn(
                LoopbackClient.prototype,
                "listenForAuthCode"
            ).mockImplementation(() => {
                return new Promise<AuthorizeResponse>((resolve) => {
                    resolve(testServerCodeResponse);
                });
            });
            jest.spyOn(
                LoopbackClient.prototype,
                "getRedirectUri"
            ).mockImplementation(() => TEST_CONSTANTS.REDIRECT_URI);
            const mockCloseServer = jest.spyOn(
                LoopbackClient.prototype,
                "closeServer"
            );

            const request: InteractiveRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                openBrowser: openBrowser,
            };

            const MockAuthorizationCodeClient =
                getMsalCommonAutoMock().AuthorizationCodeClient;
            jest.spyOn(
                msalCommon,
                "AuthorizationCodeClient"
            ).mockImplementation(
                (config) =>
                    new MockAuthorizationCodeClient(
                        config,
                        new StubPerformanceClient()
                    )
            );

            jest.spyOn(
                AuthorizeProtocol,
                "getAuthCodeRequestUrl"
            ).mockImplementation((_config, _authority, req, _logger) => {
                expect(req.redirectUri).toEqual(TEST_CONSTANTS.REDIRECT_URI);
                return TEST_CONSTANTS.AUTH_CODE_URL;
            });

            authApp.acquireTokenInteractive(request).catch((e) => {
                expect(e).toBe("Browser open error");
                expect(mockCloseServer).toHaveBeenCalledTimes(1);
                done();
            });
        });

        test("acquireTokenInteractive - authCode listener rejections are handled", (done) => {
            const authApp = new PublicClientApplication(appConfig);

            const openBrowser = (url: string) => {
                expect(
                    url.startsWith("https://login.microsoftonline.com")
                ).toBe(true);
                return Promise.resolve();
            };

            // mock listener to wait 2 seconds then throw
            let originalListen = LoopbackClient.prototype.listenForAuthCode;
            const listenerSpy = jest.spyOn(
                LoopbackClient.prototype,
                "listenForAuthCode"
            );
            listenerSpy.mockImplementation(async () => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject("listener error");
                    }, 2000);
                    originalListen
                        .call(listenerSpy.mock.instances[0]) // call original function and pass in the 'this' context
                        .then((result) => resolve(result)); // This should never be called because the server will never be hit
                });
            });

            jest.spyOn(
                LoopbackClient.prototype,
                "getRedirectUri"
            ).mockImplementation(() => TEST_CONSTANTS.REDIRECT_URI);
            const mockCloseServer = jest.spyOn(
                LoopbackClient.prototype,
                "closeServer"
            );

            const request: InteractiveRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                openBrowser: openBrowser,
            };

            const MockAuthorizationCodeClient =
                getMsalCommonAutoMock().AuthorizationCodeClient;
            jest.spyOn(
                msalCommon,
                "AuthorizationCodeClient"
            ).mockImplementation(
                (config) =>
                    new MockAuthorizationCodeClient(
                        config,
                        new StubPerformanceClient()
                    )
            );

            jest.spyOn(
                AuthorizeProtocol,
                "getAuthCodeRequestUrl"
            ).mockImplementation((_config, _authority, req, _logger) => {
                expect(req.redirectUri).toEqual(TEST_CONSTANTS.REDIRECT_URI);
                return TEST_CONSTANTS.AUTH_CODE_URL;
            });

            authApp.acquireTokenInteractive(request).catch((e) => {
                expect(e).toBe("listener error");
                expect(mockCloseServer).toHaveBeenCalled();
                done();
            });
        });

        test("acquireTokenInteractive throws error when redirectUri is provided", async () => {
            const authApp = new PublicClientApplication(appConfig);
            const request: InteractiveRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                redirectUri: "http://localhost:3000/redirect",
                openBrowser: jest.fn(),
            };

            await expect(
                authApp.acquireTokenInteractive(request)
            ).rejects.toThrow("RedirectUri is not supported in this scenario");
        });

        test("acquireTokenInteractive throws invalid_response_mode for fragment responseMode", async () => {
            const authApp = new PublicClientApplication(appConfig);
            const request: InteractiveRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                openBrowser: jest.fn(),
                responseMode: CommonConstants.ResponseMode.FRAGMENT,
            };

            await expect(
                authApp.acquireTokenInteractive(request)
            ).rejects.toMatchObject({
                errorCode: ClientConfigurationErrorCodes.invalidResponseMode,
            });
        });

        test("acquireTokenInteractive throws invalid_response_mode for an unrecognized responseMode", async () => {
            const authApp = new PublicClientApplication(appConfig);
            const request: InteractiveRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                openBrowser: jest.fn(),
                responseMode:
                    "unsupported_mode" as InteractiveRequest["responseMode"],
            };

            await expect(
                authApp.acquireTokenInteractive(request)
            ).rejects.toMatchObject({
                errorCode: ClientConfigurationErrorCodes.invalidResponseMode,
            });
        });

        test("acquireTokenInteractive resets redirectUri when broker fallback occurs", async () => {
            // Create a broker plugin with broker unavailable to simulate fallback scenario
            const mockBrokerPlugin = new MockNativeBrokerPlugin();
            mockBrokerPlugin.isBrokerAvailable = false;

            const authApp = new PublicClientApplication({
                ...appConfig,
                broker: {
                    nativeBrokerPlugin: mockBrokerPlugin,
                },
            });

            const request: InteractiveRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                redirectUri: "http://localhost:3000/redirect",
                openBrowser: jest.fn(),
            };

            jest.spyOn(
                LoopbackClient.prototype,
                "listenForAuthCode"
            ).mockResolvedValue({
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
            });

            jest.spyOn(
                LoopbackClient.prototype,
                "getRedirectUri"
            ).mockReturnValue(TEST_CONSTANTS.REDIRECT_URI);

            jest.spyOn(authApp, "acquireTokenByCode").mockResolvedValue(
                mockAuthenticationResult
            );

            jest.spyOn(authApp, "getAuthCodeUrl").mockResolvedValue(
                TEST_CONSTANTS.AUTH_CODE_URL
            );

            // This should not throw and should reset redirectUri to empty string
            const response = await authApp.acquireTokenInteractive(request);

            expect(response).toEqual(mockAuthenticationResult);
            expect(request.redirectUri).toBe("");
        });
    });

    describe("signOut tests", () => {
        test("signOut clears account from local cache", async () => {
            const authApp = new PublicClientApplication({
                ...appConfig,
            });

            const cryptoProvider = new CryptoProvider();
            const accountEntity: AccountEntity =
                AccountEntityUtils.createAccountEntity(
                    {
                        homeAccountId: mockAccountInfo.homeAccountId,
                        idTokenClaims: AuthToken.extractTokenClaims(
                            mockAuthenticationResult.idToken,
                            cryptoProvider.base64Decode,
                            ""
                        ),
                    },
                    await AuthorityFactory.createDiscoveredInstance(
                        TEST_CONFIG.validAuthority,
                        new HttpClient(),
                        new MockStorageClass(
                            TEST_CONFIG.MSAL_CLIENT_ID,
                            cryptoProvider,
                            new Logger({}),
                            new StubPerformanceClient()
                        ),
                        {
                            protocolMode: ProtocolMode.AAD,
                            knownAuthorities: [],
                            cloudDiscoveryMetadata: "",
                            authorityMetadata: "",
                        },
                        new Logger({}),
                        TEST_CONFIG.CORRELATION_ID,
                        new StubPerformanceClient()
                    ),
                    ""
                );

            // @ts-ignore
            await authApp.storage.setAccount(accountEntity);

            const idTokenEntity = CacheHelpers.createIdTokenEntity(
                mockAccountInfo.homeAccountId,
                mockAccountInfo.environment,
                mockAuthenticationResult.idToken,
                TEST_CONSTANTS.CLIENT_ID,
                ID_TOKEN_CLAIMS.tid
            );

            // @ts-ignore
            await authApp.storage.setIdTokenCredential(idTokenEntity);

            const accountsBefore = await authApp.getAllAccounts();
            expect(accountsBefore.length).toBe(1);

            await authApp.signOut({ account: mockAccountInfo });
            const accountsAfter = await authApp.getAllAccounts();
            expect(accountsAfter.length).toBe(0);
        });

        test("signOut calls NativeBrokerPlugin and resolves", async () => {
            const authApp = new PublicClientApplication({
                ...appConfig,
                broker: {
                    nativeBrokerPlugin: new MockNativeBrokerPlugin(),
                },
            });

            const request: SignOutRequest = {
                account: mockNativeAccountInfo,
            };
            const brokerSpy = jest.spyOn(
                MockNativeBrokerPlugin.prototype,
                "signOut"
            );
            await authApp.signOut(request);
            expect(brokerSpy).toHaveBeenCalled();
        });

        test("signOut calls NativeBrokerPlugin and rejects with error thrown", (done) => {
            const authApp = new PublicClientApplication({
                ...appConfig,
                broker: {
                    nativeBrokerPlugin: new MockNativeBrokerPlugin(),
                },
            });

            const request: SignOutRequest = {
                account: mockNativeAccountInfo,
            };
            const testError = createClientAuthError(
                ClientAuthErrorCodes.noAccountFound,
                ""
            );
            const brokerSpy = jest
                .spyOn(MockNativeBrokerPlugin.prototype, "signOut")
                .mockImplementation(() => {
                    return Promise.reject(testError);
                });
            authApp.signOut(request).catch((e) => {
                expect(brokerSpy).toHaveBeenCalled();
                expect(e).toBe(testError);
                done();
            });
        });
    });

    describe("getAllAccounts tests", () => {
        test("getAllAccounts returns an array of accounts found in the cache", async () => {
            const authApp = new PublicClientApplication({
                ...appConfig,
            });

            const accountEntity: AccountEntity =
                AccountEntityUtils.createAccountEntityFromAccountInfo(
                    mockAccountInfo
                );

            // @ts-ignore
            await authApp.storage.setAccount(accountEntity);

            const idTokenEntity = CacheHelpers.createIdTokenEntity(
                mockAccountInfo.homeAccountId,
                mockAccountInfo.environment,
                mockAuthenticationResult.idToken,
                TEST_CONSTANTS.CLIENT_ID,
                ID_TOKEN_CLAIMS.tid
            );

            // @ts-ignore
            await authApp.storage.setIdTokenCredential(idTokenEntity);

            const accounts = await authApp.getAllAccounts();
            expect(accounts).toStrictEqual([mockAccountInfo]);
        });

        test("getAllAccounts calls NativeBrokerPlugin and resolves", async () => {
            const authApp = new PublicClientApplication({
                ...appConfig,
                broker: {
                    nativeBrokerPlugin: new MockNativeBrokerPlugin(),
                },
            });

            const brokerSpy = jest.spyOn(
                MockNativeBrokerPlugin.prototype,
                "getAllAccounts"
            );
            const accounts = await authApp.getAllAccounts();
            expect(brokerSpy).toHaveBeenCalled();
            expect(accounts).toStrictEqual([mockNativeAccountInfo]);
        });

        test("getAllAccounts calls NativeBrokerPlugin and rejects with error thrown", (done) => {
            const authApp = new PublicClientApplication({
                ...appConfig,
                broker: {
                    nativeBrokerPlugin: new MockNativeBrokerPlugin(),
                },
            });

            const testError = createClientAuthError(
                ClientAuthErrorCodes.noAccountFound,
                ""
            );
            const brokerSpy = jest
                .spyOn(MockNativeBrokerPlugin.prototype, "getAllAccounts")
                .mockImplementation(() => {
                    return Promise.reject(testError);
                });
            authApp.getAllAccounts().catch((e) => {
                expect(brokerSpy).toHaveBeenCalled();
                expect(e).toBe(testError);
                done();
            });
        });
    });

    test("create AuthorizationCode URL", async () => {
        const request: AuthorizationUrlRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
        };

        const authApp = new PublicClientApplication(appConfig);
        const url = await authApp.getAuthCodeUrl(request);
        expect(
            url.startsWith(
                DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace(
                    "{tenant}",
                    "common"
                )
            )
        ).toBe(true);
        expect(url).toContain(appConfig.auth.clientId);
        expect(url).toContain(encodeURIComponent(request.redirectUri));
        expect(url).toContain(encodeURIComponent(request.scopes.join(" ")));
    });

    test("acquireToken default authority", async () => {
        // No authority set in app configuration or request, should default to common authority
        const config: Configuration = {
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
            },
        };

        const request: RefreshTokenRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
        };

        const mockRefreshTokenClient =
            getMsalCommonAutoMock().RefreshTokenClient;
        jest.spyOn(msalCommon, "RefreshTokenClient").mockImplementation(
            (config) => {
                expect(config.authOptions.authority.canonicalAuthority).toEqual(
                    TEST_CONSTANTS.DEFAULT_AUTHORITY
                );
                return new mockRefreshTokenClient(
                    config,
                    new StubPerformanceClient()
                );
            }
        );

        const authApp = new PublicClientApplication(config);
        await authApp.acquireTokenByRefreshToken(request);
        expect(RefreshTokenClient).toHaveBeenCalledTimes(1);
    });

    test("authority overridden by acquire token request parameters", async () => {
        // Authority set on client app, but should be overridden by authority passed in request
        const request: RefreshTokenRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
            authority: TEST_CONSTANTS.ALTERNATE_AUTHORITY,
        };

        const mockRefreshTokenClient =
            getMsalCommonAutoMock().RefreshTokenClient;
        jest.spyOn(msalCommon, "RefreshTokenClient").mockImplementation(
            (config) => {
                expect(config.authOptions.authority.canonicalAuthority).toEqual(
                    TEST_CONSTANTS.ALTERNATE_AUTHORITY
                );
                return new mockRefreshTokenClient(
                    config,
                    new StubPerformanceClient()
                );
            }
        );

        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenByRefreshToken(request);
        expect(RefreshTokenClient).toHaveBeenCalledTimes(1);
    });

    test("acquireToken when azureCloudOptions are set", async () => {
        // No authority set in app configuration or request, should default to common authority
        const config: Configuration = {
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
                azureCloudOptions: {
                    azureCloudInstance:
                        msalCommon.AzureCloudInstance.AzureUsGovernment,
                    tenant: "",
                },
            },
        };

        const request: RefreshTokenRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
        };

        const mockRefreshTokenClient =
            getMsalCommonAutoMock().RefreshTokenClient;
        jest.spyOn(msalCommon, "RefreshTokenClient").mockImplementation(
            (config) => {
                expect(config.authOptions.authority.canonicalAuthority).toEqual(
                    TEST_CONSTANTS.USGOV_AUTHORITY
                );
                return new mockRefreshTokenClient(
                    config,
                    new StubPerformanceClient()
                );
            }
        );

        const authApp = new PublicClientApplication(config);
        await authApp.acquireTokenByRefreshToken(request);
        expect(RefreshTokenClient).toHaveBeenCalledTimes(1);
    });

    test("acquireToken when azureCloudOptions and authority are set", async () => {
        // No authority set in app configuration or request, should default to common authority
        const config: Configuration = {
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
                authority: TEST_CONSTANTS.ALTERNATE_AUTHORITY,
                azureCloudOptions: {
                    azureCloudInstance:
                        msalCommon.AzureCloudInstance.AzureUsGovernment,
                    tenant: "",
                },
            },
        };

        const request: RefreshTokenRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
        };

        const mockRefreshTokenClient =
            getMsalCommonAutoMock().RefreshTokenClient;
        jest.spyOn(msalCommon, "RefreshTokenClient").mockImplementation(
            (config) => {
                expect(config.authOptions.authority.canonicalAuthority).toEqual(
                    TEST_CONSTANTS.USGOV_AUTHORITY
                );
                return new mockRefreshTokenClient(
                    config,
                    new StubPerformanceClient()
                );
            }
        );

        const authApp = new PublicClientApplication(config);
        await authApp.acquireTokenByRefreshToken(request);
        expect(RefreshTokenClient).toHaveBeenCalledTimes(1);
    });

    test("getLogger and setLogger", async () => {
        const authApp = new PublicClientApplication(appConfig);
        const logger = new Logger(
            {
                loggerCallback: (level, message, containsPii) => {
                    expect(message).toContain("Message");
                    expect(message).toContain(LogLevel.Info.toString());

                    expect(level).toEqual(LogLevel.Info);
                    expect(containsPii).toEqual(false);
                },
                piiLoggingEnabled: false,
            },
            name,
            version
        );

        authApp.setLogger(logger);

        expect(authApp.getLogger()).toEqual(logger);

        authApp.getLogger().info("Message", "");
    });

    test("logger undefined", async () => {
        const authApp = new PublicClientApplication(testAppConfig);

        expect(authApp.getLogger()).toBeDefined();
        expect(authApp.getLogger().info("Test logger", "")).toEqual(undefined);
    });

    test("should throw an error if state is not provided", async () => {
        const cryptoProvider = new CryptoProvider();
        const request: AuthorizationCodeRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
            correlationId: "test-correlationId",
            state: "",
        };

        const authCodePayLoad = {
            nonce: cryptoProvider.createNewGuid(),
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
            state: cryptoProvider.createNewGuid(),
        };

        const MockAuthorizationCodeClient =
            getMsalCommonAutoMock().AuthorizationCodeClient;

        jest.spyOn(msalCommon, "AuthorizationCodeClient").mockImplementation(
            (config) =>
                new MockAuthorizationCodeClient(
                    config,
                    new StubPerformanceClient()
                )
        );

        const mockInfo = jest.fn();
        jest.mock("@azure/msal-common", () => {
            return {
                getLogger: () => ({
                    info: mockInfo,
                }),
            };
        });

        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenByCode(request, authCodePayLoad);

        try {
            await authApp.acquireTokenByCode(request, authCodePayLoad);
        } catch (e) {
            expect(mockInfo).toBeCalledWith("acquireTokenByCode called");
            expect(mockInfo).toHaveBeenCalledWith(
                "acquireTokenByCode - validating state"
            );
            expect(authApp.acquireTokenByCode).toThrow(
                "State not found. Please verify that the request originated from msal."
            );
        }
    });

    test("should throw error when state and cachedSate don't match", async () => {
        const cryptoProvider = new CryptoProvider();
        const request: AuthorizationCodeRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
            correlationId: "test-correlationId",
            state: cryptoProvider.createNewGuid(),
        };

        const authCodePayLoad = {
            nonce: cryptoProvider.createNewGuid(),
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
            state: "ed09b151-1b68-4c2c-8e95-y8dcfffffggh",
        };

        const MockAuthorizationCodeClient =
            getMsalCommonAutoMock().AuthorizationCodeClient;

        jest.spyOn(msalCommon, "AuthorizationCodeClient").mockImplementation(
            (config) =>
                new MockAuthorizationCodeClient(
                    config,
                    new StubPerformanceClient()
                )
        );

        const mockInfo = jest.fn();
        jest.mock("@azure/msal-common", () => {
            return {
                getLogger: () => ({
                    info: mockInfo,
                }),
            };
        });

        const authApp = new PublicClientApplication(appConfig);

        await expect(
            authApp.acquireTokenByCode(request, authCodePayLoad)
        ).rejects.toMatchObject(
            createClientAuthError(ClientAuthErrorCodes.stateMismatch, "")
        );
    });
});

describe("MCP flow tests", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const mcpConfig: Configuration = {
        auth: {
            clientId: TEST_CONSTANTS.CLIENT_ID,
            authority: TEST_CONSTANTS.DEFAULT_AUTHORITY,
            isMcp: true,
        },
    };

    const makeAccessTokenEntity = (resource?: string): AccessTokenEntity => ({
        ...createTestAccessToken(),
        ...(resource !== undefined ? { resource } : {}),
    });

    describe("acquireTokenSilent", () => {
        test("throws resource_parameter_required when isMcp is true and no resource provided", async () => {
            const request: SilentFlowRequest = {
                account: mockAccountInfo,
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            };
            const authApp = new PublicClientApplication(mcpConfig);
            await expect(
                authApp.acquireTokenSilent(request)
            ).rejects.toMatchObject({
                errorCode: "resource_parameter_required",
            });
        });

        test("throws misplaced_resource_parameter when isMcp is true and resource is in both request and extraParameters", async () => {
            const request: SilentFlowRequest = {
                account: mockAccountInfo,
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                resource: "https://resource.example.com",
                extraParameters: { resource: "https://resource.example.com" },
            };
            const authApp = new PublicClientApplication(mcpConfig);
            await expect(
                authApp.acquireTokenSilent(request)
            ).rejects.toMatchObject({
                errorCode: "misplaced_resource_parameter",
            });
        });

        test("throws misplaced_resource_parameter when isMcp is true and resource is in both request and extraQueryParameters", async () => {
            const request: SilentFlowRequest = {
                account: mockAccountInfo,
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                resource: "https://resource.example.com",
                extraQueryParameters: {
                    resource: "https://resource.example.com",
                },
            };
            const authApp = new PublicClientApplication(mcpConfig);
            await expect(
                authApp.acquireTokenSilent(request)
            ).rejects.toMatchObject({
                errorCode: "misplaced_resource_parameter",
            });
        });

        test("succeeds when isMcp is true and resource is provided", async () => {
            const request: SilentFlowRequest = {
                account: mockAccountInfo,
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                resource: "https://resource.example.com",
            };
            const silentFlowClient = getMsalCommonAutoMock().SilentFlowClient;
            jest.spyOn(msalCommon, "SilentFlowClient").mockImplementation(
                (config) =>
                    new silentFlowClient(config, new StubPerformanceClient())
            );
            // We test the functionality of acquireCachedToken later in this file
            jest.spyOn(
                silentFlowClient.prototype,
                "acquireCachedToken"
            ).mockResolvedValue([
                mockAuthenticationResult,
                CommonConstants.CacheOutcome.NOT_APPLICABLE,
            ]);
            const authApp = new PublicClientApplication(mcpConfig);
            await expect(
                authApp.acquireTokenSilent(request)
            ).resolves.toBeDefined();
        });

        test("returns cached token when resource in access token matches resource in request", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(CacheManager.prototype, "getIdToken").mockReturnValue(
                createTestIdToken()
            );
            jest.spyOn(
                CacheManager.prototype,
                "getAccessToken"
            ).mockReturnValue(
                makeAccessTokenEntity("https://resource.example.com")
            );
            jest.spyOn(
                CacheManager.prototype,
                "getRefreshToken"
            ).mockReturnValue(createTestRefreshToken());
            jest.spyOn(NodeStorage.prototype, "getAccount").mockReturnValue(
                testAccountEntity
            );
            jest.spyOn(
                CacheManager.prototype,
                "getAllAccounts"
            ).mockReturnValue([createTestAccount()]);

            const request: SilentFlowRequest = {
                account: createTestAccount(),
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                resource: "https://resource.example.com",
            };
            const authApp = new PublicClientApplication(mcpConfig);
            const result = await authApp.acquireTokenSilent(request);
            expect(result.accessToken).toEqual(
                AUTHENTICATION_RESULT.body.access_token
            );
        });

        test("falls back when cached token resource does not match request resource", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            AUTHENTICATION_RESULT.body.client_info =
                TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO;
            const sendPostSpy = jest
                .spyOn(HttpClient.prototype, "sendPostRequestAsync")
                .mockResolvedValue(AUTHENTICATION_RESULT);
            jest.spyOn(CacheManager.prototype, "getIdToken").mockReturnValue(
                createTestIdToken()
            );
            jest.spyOn(
                CacheManager.prototype,
                "getAccessToken"
            ).mockReturnValue(
                makeAccessTokenEntity("https://other-resource.example.com")
            );
            jest.spyOn(
                CacheManager.prototype,
                "getRefreshToken"
            ).mockReturnValue(createTestRefreshToken());
            jest.spyOn(NodeStorage.prototype, "getAccount").mockReturnValue(
                testAccountEntity
            );
            jest.spyOn(
                CacheManager.prototype,
                "getAllAccounts"
            ).mockReturnValue([createTestAccount()]);

            const request: SilentFlowRequest = {
                account: createTestAccount(),
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                resource: "https://resource.example.com",
            };
            const authApp = new PublicClientApplication(mcpConfig);
            const result = await authApp.acquireTokenSilent(request);
            expect(sendPostSpy).toHaveBeenCalledTimes(1);
            expect(result.accessToken).toEqual(
                AUTHENTICATION_RESULT.body.access_token
            );
        });
    });

    describe("acquireTokenByDeviceCode", () => {
        test("throws resource_parameter_required when isMcp is true and no resource provided", async () => {
            const request: DeviceCodeRequest = {
                deviceCodeCallback: () => {},
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            };
            const authApp = new PublicClientApplication(mcpConfig);
            await expect(
                authApp.acquireTokenByDeviceCode(request)
            ).rejects.toMatchObject({
                errorCode: "resource_parameter_required",
            });
        });

        test("throws misplaced_resource_parameter when isMcp is true and resource is in both request and extraParameters", async () => {
            const request: DeviceCodeRequest = {
                deviceCodeCallback: () => {},
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                resource: "https://resource.example.com",
                extraParameters: { resource: "https://resource.example.com" },
            };
            const authApp = new PublicClientApplication(mcpConfig);
            await expect(
                authApp.acquireTokenByDeviceCode(request)
            ).rejects.toMatchObject({
                errorCode: "misplaced_resource_parameter",
            });
        });

        test("throws misplaced_resource_parameter when isMcp is true and resource is in both request and extraQueryParameters", async () => {
            const request: DeviceCodeRequest = {
                deviceCodeCallback: () => {},
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                resource: "https://resource.example.com",
                extraQueryParameters: {
                    resource: "https://resource.example.com",
                },
            };
            const authApp = new PublicClientApplication(mcpConfig);
            await expect(
                authApp.acquireTokenByDeviceCode(request)
            ).rejects.toMatchObject({
                errorCode: "misplaced_resource_parameter",
            });
        });

        test("succeeds when isMcp is true and resource is provided", async () => {
            jest.spyOn(
                DeviceCodeClient.prototype,
                "acquireToken"
            ).mockResolvedValue(mockAuthenticationResult);
            const request: DeviceCodeRequest = {
                deviceCodeCallback: () => {},
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                resource: "https://resource.example.com",
            };
            const authApp = new PublicClientApplication(mcpConfig);
            await expect(
                authApp.acquireTokenByDeviceCode(request)
            ).resolves.toEqual(mockAuthenticationResult);
        });

        test("stores resource in cached access token", async () => {
            const { DeviceCodeClient: RealDeviceCodeClient } =
                jest.requireActual("../../src/client/DeviceCodeClient.js");
            (DeviceCodeClient as unknown as jest.Mock).mockImplementation(
                (config: any) => new RealDeviceCodeClient(config)
            );

            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            AUTHENTICATION_RESULT.body.client_info =
                TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO;
            jest.spyOn(HttpClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce({
                    headers: {},
                    body: {
                        user_code: DEVICE_CODE_RESPONSE.userCode,
                        device_code: DEVICE_CODE_RESPONSE.deviceCode,
                        verification_uri: DEVICE_CODE_RESPONSE.verificationUri,
                        expires_in: DEVICE_CODE_RESPONSE.expiresIn,
                        interval: DEVICE_CODE_RESPONSE.interval,
                        message: DEVICE_CODE_RESPONSE.message,
                    },
                    status: 200,
                })
                .mockResolvedValueOnce(AUTHENTICATION_RESULT);
            const saveCacheRecordSpy = jest.spyOn(
                CacheManager.prototype,
                "saveCacheRecord"
            );

            const request: DeviceCodeRequest = {
                deviceCodeCallback: () => {},
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                resource: "https://resource.example.com",
            };
            const authApp = new PublicClientApplication(mcpConfig);
            await authApp.acquireTokenByDeviceCode(request);

            expect(saveCacheRecordSpy).toHaveBeenCalled();
            const cacheRecord = saveCacheRecordSpy.mock.calls[0][0];
            expect(cacheRecord.accessToken?.resource).toBe(
                "https://resource.example.com"
            );
        });
    });

    describe("acquireTokenInteractive", () => {
        test("throws resource_parameter_required when isMcp is true and no resource provided", async () => {
            const request: InteractiveRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                redirectUri: TEST_CONSTANTS.REDIRECT_URI,
                openBrowser: async () => {},
            };
            const authApp = new PublicClientApplication(mcpConfig);
            await expect(
                authApp.acquireTokenInteractive(request)
            ).rejects.toMatchObject({
                errorCode: "resource_parameter_required",
            });
        });

        test("throws misplaced_resource_parameter when isMcp is true and resource is in both request and extraParameters", async () => {
            const request: InteractiveRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                redirectUri: TEST_CONSTANTS.REDIRECT_URI,
                openBrowser: async () => {},
                resource: "https://resource.example.com",
                extraParameters: { resource: "https://resource.example.com" },
            };
            const authApp = new PublicClientApplication(mcpConfig);
            await expect(
                authApp.acquireTokenInteractive(request)
            ).rejects.toMatchObject({
                errorCode: "misplaced_resource_parameter",
            });
        });

        test("throws misplaced_resource_parameter when isMcp is true and resource is in both request and extraQueryParameters", async () => {
            const request: InteractiveRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                redirectUri: TEST_CONSTANTS.REDIRECT_URI,
                openBrowser: async () => {},
                resource: "https://resource.example.com",
                extraQueryParameters: {
                    resource: "https://resource.example.com",
                },
            };
            const authApp = new PublicClientApplication(mcpConfig);
            await expect(
                authApp.acquireTokenInteractive(request)
            ).rejects.toMatchObject({
                errorCode: "misplaced_resource_parameter",
            });
        });

        test("succeeds when isMcp is true and resource is provided", async () => {
            const testServerCodeResponse: AuthorizeResponse = {
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                client_info: TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO,
                state: "123",
            };
            jest.spyOn(
                LoopbackClient.prototype,
                "listenForAuthCode"
            ).mockResolvedValue(testServerCodeResponse);
            jest.spyOn(
                LoopbackClient.prototype,
                "getRedirectUri"
            ).mockReturnValue(TEST_CONSTANTS.REDIRECT_URI);
            jest.spyOn(
                LoopbackClient.prototype,
                "closeServer"
            ).mockImplementation(() => {});
            const request: InteractiveRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                openBrowser: async () => {},
                resource: "https://resource.example.com",
            };
            const MockAuthorizationCodeClient =
                getMsalCommonAutoMock().AuthorizationCodeClient;
            jest.spyOn(
                msalCommon,
                "AuthorizationCodeClient"
            ).mockImplementation(
                (config) =>
                    new MockAuthorizationCodeClient(
                        config,
                        new StubPerformanceClient()
                    )
            );
            jest.spyOn(
                AuthorizeProtocol,
                "getAuthCodeRequestUrl"
            ).mockReturnValue(TEST_CONSTANTS.AUTH_CODE_URL);
            jest.spyOn(
                MockAuthorizationCodeClient.prototype,
                "acquireToken"
            ).mockResolvedValue(mockAuthenticationResult);

            const authApp = new PublicClientApplication(mcpConfig);
            const result = await authApp.acquireTokenInteractive(request);
            expect(result.accessToken).toEqual(
                mockAuthenticationResult.accessToken
            );
            expect(result.idToken).toEqual(mockAuthenticationResult.idToken);
            expect(result.account).toEqual(mockAuthenticationResult.account);
        });

        test("stores resource in cached access token", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            AUTHENTICATION_RESULT.body.client_info =
                TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO;
            jest.spyOn(
                HttpClient.prototype,
                "sendPostRequestAsync"
            ).mockResolvedValue(createAuthenticationResultWithoutNonce());
            const saveCacheRecordSpy = jest.spyOn(
                CacheManager.prototype,
                "saveCacheRecord"
            );
            const testServerCodeResponse: AuthorizeResponse = {
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                client_info: TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO,
                state: "123",
            };
            jest.spyOn(
                LoopbackClient.prototype,
                "listenForAuthCode"
            ).mockResolvedValue(testServerCodeResponse);
            jest.spyOn(
                LoopbackClient.prototype,
                "getRedirectUri"
            ).mockReturnValue(TEST_CONSTANTS.REDIRECT_URI);
            jest.spyOn(
                LoopbackClient.prototype,
                "closeServer"
            ).mockImplementation(() => {});
            const request: InteractiveRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                openBrowser: async () => {},
                resource: "https://resource.example.com",
            };
            jest.spyOn(
                AuthorizeProtocol,
                "getAuthCodeRequestUrl"
            ).mockReturnValue(TEST_CONSTANTS.AUTH_CODE_URL);

            const authApp = new PublicClientApplication(mcpConfig);
            await authApp.acquireTokenInteractive(request);

            expect(saveCacheRecordSpy).toHaveBeenCalled();
            const cacheRecord = saveCacheRecordSpy.mock.calls[0][0];
            expect(cacheRecord.accessToken?.resource).toBe(
                "https://resource.example.com"
            );
        });
    });

    describe("acquireTokenByCode", () => {
        test("throws resource_parameter_required when isMcp is true and no resource provided", async () => {
            const request: AuthorizationCodeRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                redirectUri: TEST_CONSTANTS.REDIRECT_URI,
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
            };
            const authApp = new PublicClientApplication(mcpConfig);
            await expect(
                authApp.acquireTokenByCode(request)
            ).rejects.toMatchObject({
                errorCode: "resource_parameter_required",
            });
        });

        test("throws misplaced_resource_parameter when isMcp is true and resource is in both request and extraParameters", async () => {
            const request: AuthorizationCodeRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                redirectUri: TEST_CONSTANTS.REDIRECT_URI,
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                resource: "https://resource.example.com",
                extraParameters: { resource: "https://resource.example.com" },
            };
            const authApp = new PublicClientApplication(mcpConfig);
            await expect(
                authApp.acquireTokenByCode(request)
            ).rejects.toMatchObject({
                errorCode: "misplaced_resource_parameter",
            });
        });

        test("throws misplaced_resource_parameter when isMcp is true and resource is in both request and extraQueryParameters", async () => {
            const request: AuthorizationCodeRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                redirectUri: TEST_CONSTANTS.REDIRECT_URI,
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                resource: "https://resource.example.com",
                extraQueryParameters: {
                    resource: "https://resource.example.com",
                },
            };
            const authApp = new PublicClientApplication(mcpConfig);
            await expect(
                authApp.acquireTokenByCode(request)
            ).rejects.toMatchObject({
                errorCode: "misplaced_resource_parameter",
            });
        });

        test("succeeds when isMcp is true and resource is provided", async () => {
            const request: AuthorizationCodeRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                redirectUri: TEST_CONSTANTS.REDIRECT_URI,
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                resource: "https://resource.example.com",
            };
            const mockAuthCodeClient =
                getMsalCommonAutoMock().AuthorizationCodeClient;
            jest.spyOn(
                msalCommon,
                "AuthorizationCodeClient"
            ).mockImplementation(
                (config) =>
                    new mockAuthCodeClient(config, new StubPerformanceClient())
            );
            jest.spyOn(
                mockAuthCodeClient.prototype,
                "acquireToken"
            ).mockResolvedValue(mockAuthenticationResult);
            const authApp = new PublicClientApplication(mcpConfig);
            const result = await authApp.acquireTokenByCode(request);
            expect(result).toEqual(mockAuthenticationResult);
        });

        test("stores resource in cached access token", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            AUTHENTICATION_RESULT.body.client_info =
                TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO;
            jest.spyOn(
                HttpClient.prototype,
                "sendPostRequestAsync"
            ).mockResolvedValue(createAuthenticationResultWithoutNonce());
            const saveCacheRecordSpy = jest.spyOn(
                CacheManager.prototype,
                "saveCacheRecord"
            );

            const request: AuthorizationCodeRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                redirectUri: TEST_CONSTANTS.REDIRECT_URI,
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                resource: "https://resource.example.com",
            };
            const authApp = new PublicClientApplication(mcpConfig);
            await authApp.acquireTokenByCode(request);

            expect(saveCacheRecordSpy).toHaveBeenCalled();
            const cacheRecord = saveCacheRecordSpy.mock.calls[0][0];
            expect(cacheRecord.accessToken?.resource).toBe(
                "https://resource.example.com"
            );
        });
    });

    describe("acquireTokenByRefreshToken", () => {
        test("throws resource_parameter_required when isMcp is true and no resource provided", async () => {
            const request: RefreshTokenRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
            };
            const authApp = new PublicClientApplication(mcpConfig);
            await expect(
                authApp.acquireTokenByRefreshToken(request)
            ).rejects.toMatchObject({
                errorCode: "resource_parameter_required",
            });
        });

        test("throws misplaced_resource_parameter when isMcp is true and resource is in both request and extraParameters", async () => {
            const request: RefreshTokenRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
                resource: "https://resource.example.com",
                extraParameters: { resource: "https://resource.example.com" },
            };
            const authApp = new PublicClientApplication(mcpConfig);
            await expect(
                authApp.acquireTokenByRefreshToken(request)
            ).rejects.toMatchObject({
                errorCode: "misplaced_resource_parameter",
            });
        });

        test("throws misplaced_resource_parameter when isMcp is true and resource is in both request and extraQueryParameters", async () => {
            const request: RefreshTokenRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
                resource: "https://resource.example.com",
                extraQueryParameters: {
                    resource: "https://resource.example.com",
                },
            };
            const authApp = new PublicClientApplication(mcpConfig);
            await expect(
                authApp.acquireTokenByRefreshToken(request)
            ).rejects.toMatchObject({
                errorCode: "misplaced_resource_parameter",
            });
        });

        test("succeeds when isMcp is true and resource is provided", async () => {
            const request: RefreshTokenRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
                resource: "https://resource.example.com",
            };
            const mockRefreshTokenClient =
                getMsalCommonAutoMock().RefreshTokenClient;
            jest.spyOn(msalCommon, "RefreshTokenClient").mockImplementation(
                (config) =>
                    new mockRefreshTokenClient(
                        config,
                        new StubPerformanceClient()
                    )
            );
            jest.spyOn(
                mockRefreshTokenClient.prototype,
                "acquireToken"
            ).mockResolvedValue(mockAuthenticationResult);
            const authApp = new PublicClientApplication(mcpConfig);
            const result = await authApp.acquireTokenByRefreshToken(request);
            expect(result).toEqual(mockAuthenticationResult);
        });

        test("stores resource in cached access token", async () => {
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
            jest.spyOn(
                CacheManager.prototype,
                "getAllAccounts"
            ).mockReturnValue([createTestAccount()]);
            const saveCacheRecordSpy = jest.spyOn(
                CacheManager.prototype,
                "saveCacheRecord"
            );

            const request: RefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
                resource: "https://resource.example.com",
            };
            const authApp = new PublicClientApplication(mcpConfig);
            await authApp.acquireTokenByRefreshToken(request);

            expect(saveCacheRecordSpy).toHaveBeenCalled();
            const cacheRecord = saveCacheRecordSpy.mock.calls[0][0];
            expect(cacheRecord.accessToken?.resource).toBe(
                "https://resource.example.com"
            );
        });
    });
});
