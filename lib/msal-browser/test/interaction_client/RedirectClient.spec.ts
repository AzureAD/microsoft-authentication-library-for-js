/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PublicClientApplication } from "../../src/app/PublicClientApplication.js";
import {
    TEST_CONFIG,
    TEST_URIS,
    TEST_HASHES,
    TEST_TOKENS,
    TEST_DATA_CLIENT_INFO,
    TEST_TOKEN_LIFETIMES,
    RANDOM_TEST_GUID,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_STATE_VALUES,
    DEFAULT_TENANT_DISCOVERY_RESPONSE,
    testLogoutUrl,
    TEST_SSH_VALUES,
    ID_TOKEN_CLAIMS,
    TEST_TOKEN_RESPONSE,
    verifyUrl,
    validEarJWK,
    getTestAuthenticationResult,
    validEarJWE,
    testNavUrl,
} from "../utils/StringConstants.js";
import {
    ServerError,
    AccountInfo,
    TokenClaims,
    CommonAuthorizationCodeRequest,
    CommonAuthorizationUrlRequest,
    AuthorizationCodeClient,
    Logger,
    LogLevel,
    NetworkResponse,
    ServerAuthorizationTokenResponse,
    CommonEndSessionRequest,
    ServerTelemetryManager,
    AccountEntity,
    createClientConfigurationError,
    ClientConfigurationErrorCodes,
    IdTokenEntity,
    InProgressPerformanceEvent,
    StubPerformanceClient,
    ProtocolMode,
    AccountEntityUtils,
    Constants,
    ProtocolUtils,
    updateAccountTenantProfileData,
} from "@azure/msal-common/browser";
import * as BrowserUtils from "../../src/utils/BrowserUtils.js";
import {
    TemporaryCacheKeys,
    ApiId,
    BrowserCacheLocation,
    InteractionType,
} from "../../src/utils/BrowserConstants.js";
import { base64Encode } from "../../src/encode/Base64Encode.js";
import { FetchClient } from "../../src/network/FetchClient.js";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
    BrowserAuthError,
    getDefaultErrorMessage,
} from "../../src/error/BrowserAuthError.js";
import * as AuthorizeProtocol from "../../src/protocol/Authorize.js";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import * as BrowserCrypto from "../../src/crypto/BrowserCrypto.js";
import * as PkceGenerator from "../../src/crypto/PkceGenerator.js";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import { RedirectRequest } from "../../src/request/RedirectRequest.js";
import { NavigationClient } from "../../src/navigation/NavigationClient.js";
import { NavigationOptions } from "../../src/navigation/NavigationOptions.js";
import { RedirectClient } from "../../src/interaction_client/RedirectClient.js";
import { EventHandler } from "../../src/event/EventHandler.js";
import { EventType } from "../../src/event/EventType.js";
import { PlatformAuthInteractionClient } from "../../src/interaction_client/PlatformAuthInteractionClient.js";
import { PlatformAuthExtensionHandler } from "../../src/broker/nativeBroker/PlatformAuthExtensionHandler.js";
import { getDefaultPerformanceClient } from "../utils/TelemetryUtils.js";
import { AuthenticationResult } from "../../src/response/AuthenticationResult.js";
import {
    buildAccountFromIdTokenClaims,
    buildIdToken,
    TestTimeUtils,
} from "msal-test-utils";
import { BrowserPerformanceClient } from "../../src/telemetry/BrowserPerformanceClient.js";
import { version } from "../../src/packageMetadata.js";
import * as CacheKeys from "../../src/cache/CacheKeys.js";

jest.mock("@azure/msal-common/browser", () => ({
    ...jest.requireActual("@azure/msal-common/browser"),
    ProtocolUtils: {
        ...jest.requireActual("@azure/msal-common/browser").ProtocolUtils,
        setRequestState: jest.fn(),
    },
}));

const cacheConfig = {
    cacheLocation: BrowserCacheLocation.SessionStorage,
    cacheRetentionDays: 5,
};

const testRequest: CommonAuthorizationUrlRequest = {
    redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
    scopes: TEST_CONFIG.DEFAULT_SCOPES,
    authority: `${Constants.DEFAULT_AUTHORITY}`,
    correlationId: RANDOM_TEST_GUID,
    authenticationScheme:
        TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
    responseMode: Constants.ResponseMode.FRAGMENT,
    state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
    nonce: ID_TOKEN_CLAIMS.nonce,
};

const loggerOptions = {
    loggerCallback: (
        level: LogLevel,
        message: string,
        containsPii: boolean
    ): void => {
        if (containsPii) {
            console.log(`Log level: ${level} Message: ${message}`);
        }
    },
    piiLoggingEnabled: true,
};

describe("RedirectClient", () => {
    let redirectClient: RedirectClient;
    let browserStorage: BrowserCacheManager;
    let pca: PublicClientApplication;
    let rootMeasurement: InProgressPerformanceEvent;
    let mockSetRequestState: jest.MockedFunction<
        typeof ProtocolUtils.setRequestState
    >;

    beforeEach(async () => {
        pca = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
            telemetry: {
                application: {
                    appName: TEST_CONFIG.applicationName,
                    appVersion: TEST_CONFIG.applicationVersion,
                },
            },
        });

        await pca.initialize();

        //Implementation of PCA was moved to controller.
        pca = (pca as any).controller;

        jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
            RANDOM_TEST_GUID
        );

        jest.spyOn(
            NavigationClient.prototype,
            "navigateExternal"
        ).mockResolvedValue(true);
        jest.spyOn(
            NavigationClient.prototype,
            "navigateInternal"
        ).mockResolvedValue(true);

        // @ts-ignore
        browserStorage = pca.browserStorage;

        redirectClient = new RedirectClient(
            //@ts-ignore
            pca.config,
            browserStorage,
            //@ts-ignore
            pca.browserCrypto,
            //@ts-ignore
            pca.logger,
            //@ts-ignore
            pca.eventHandler,
            //@ts-ignore
            pca.navigationClient,
            //@ts-ignore
            pca.performanceClient,
            //@ts-ignore
            pca.nativeInternalStorage,
            TEST_CONFIG.CORRELATION_ID
        );

        rootMeasurement = new BrowserPerformanceClient(
            pca.getConfiguration()
        ).startMeasurement("test-measurement", "test-correlation-id");

        mockSetRequestState =
            ProtocolUtils.setRequestState as jest.MockedFunction<
                typeof ProtocolUtils.setRequestState
            >;
        mockSetRequestState.mockReturnValue(
            TEST_STATE_VALUES.TEST_STATE_REDIRECT
        );
        // Freeze Date.now() so timestamp comparisons in toEqual don't fail
        // when a 1-second boundary is crossed during async acquireToken calls.
        jest.spyOn(Date, "now").mockReturnValue(Date.now());
    });

    afterEach(() => {
        jest.restoreAllMocks();
        window.location.hash = "";
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    describe("handleRedirectPromise", () => {
        it("sets document.title during processing and restores original title when no title is set", (done) => {
            document.title = "";
            browserStorage.setInteractionInProgress(true);

            redirectClient
                .handleRedirectPromise(
                    testRequest,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    { hash: "" }
                )
                .then(() => {
                    expect(document.title).toBe("");
                    done();
                });
        });

        it("sets document.title during processing and restores original title when user has set a title", (done) => {
            document.title = "My App - Dashboard";
            browserStorage.setInteractionInProgress(true);

            redirectClient
                .handleRedirectPromise(
                    testRequest,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    { hash: "" }
                )
                .then(() => {
                    expect(document.title).toBe("My App - Dashboard");
                    done();
                });
        });

        it("restores URL-based document.title when redirect URI page has no title element", (done) => {
            document.title =
                "https://localhost:3000/redirect#code=authCode123&state=abc";
            browserStorage.setInteractionInProgress(true);

            redirectClient
                .handleRedirectPromise(
                    testRequest,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    { hash: "" }
                )
                .then(() => {
                    // Restores to the URL-based title since that was the original value
                    expect(document.title).toBe(
                        "https://localhost:3000/redirect#code=authCode123&state=abc"
                    );
                    done();
                });
        });

        it("does nothing if no hash is detected", (done) => {
            browserStorage.setInteractionInProgress(true);

            redirectClient
                .handleRedirectPromise(
                    testRequest,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    { hash: "" }
                )
                .then((response) => {
                    expect(response).toBe(null);
                    expect(window.localStorage.length).toEqual(0);
                    expect(window.sessionStorage.length).toEqual(1);
                    expect(
                        window.sessionStorage.getItem(
                            CacheKeys.VERSION_CACHE_KEY
                        )
                    ).toEqual(version); // Validate that the one item in sessionStorage is what we expect
                    done();
                });
        });

        it("cleans temporary cache and return null if no state", (done) => {
            browserStorage.setInteractionInProgress(true);

            redirectClient
                .handleRedirectPromise(
                    testRequest,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    { hash: "#code=ThisIsAnAuthCode" }
                )
                .then((response) => {
                    expect(response).toBe(null);
                    expect(window.localStorage.length).toEqual(0);
                    expect(window.sessionStorage.length).toEqual(1);
                    expect(
                        window.sessionStorage.getItem(
                            CacheKeys.VERSION_CACHE_KEY
                        )
                    ).toEqual(version); // Validate that the one item in sessionStorage is what we expect
                    done();
                });
        });

        it("If response hash is not a Redirect response cleans temporary cache, return null and do not remove hash", (done) => {
            browserStorage.setInteractionInProgress(true);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_POPUP;
            redirectClient
                .handleRedirectPromise(
                    testRequest,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    { hash: "" }
                )
                .then((response) => {
                    expect(response).toBe(null);
                    expect(window.localStorage.length).toEqual(0);
                    expect(window.sessionStorage.length).toEqual(1);
                    expect(
                        window.sessionStorage.getItem(
                            CacheKeys.VERSION_CACHE_KEY
                        )
                    ).toEqual(version); // Validate that the one item in sessionStorage is what we expect
                    expect(window.location.hash).toEqual(
                        TEST_HASHES.TEST_SUCCESS_CODE_HASH_POPUP
                    );
                    done();
                });
        });

        it("return null if state cannot be decoded", (done) => {
            browserStorage.setInteractionInProgress(true);
            redirectClient
                .handleRedirectPromise(
                    testRequest,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    { hash: TEST_HASHES.TEST_SUCCESS_HASH_STATE_NO_META }
                )
                .then((response) => {
                    expect(response).toBe(null);
                    done();
                });
        });

        it("re-throws error thrown by handleResponse when loginRequestUrl == current url", (done) => {
            browserStorage.setInteractionInProgress(true);
            browserStorage.setTemporaryCache(
                TemporaryCacheKeys.ORIGIN_URI,
                window.location.href,
                true
            );

            jest.spyOn(
                RedirectClient.prototype,
                <any>"handleResponse"
            ).mockRejectedValue("Error in handleResponse");
            redirectClient
                .handleRedirectPromise(
                    testRequest,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    { hash: TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT }
                )
                .catch((e) => {
                    expect(e).toEqual("Error in handleResponse");
                    done();
                });
        });

        it("re-throws error thrown by handleResponse after clientside navigation to loginRequestUrl", (done) => {
            jest.spyOn(
                NavigationClient.prototype,
                "navigateInternal"
            ).mockResolvedValue(false); // Client-side navigation

            browserStorage.setInteractionInProgress(true);
            browserStorage.setTemporaryCache(
                TemporaryCacheKeys.ORIGIN_URI,
                window.location.href + "/differentPath",
                true
            );

            jest.spyOn(
                RedirectClient.prototype,
                <any>"handleResponse"
            ).mockRejectedValue("Error in handleResponse");
            redirectClient
                .handleRedirectPromise(
                    testRequest,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    { hash: TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT }
                )
                .catch((e) => {
                    expect(e).toEqual("Error in handleResponse");
                    done();
                });
        });

        it("re-throws error thrown by handleResponse when navigateToLoginRequestUrl is false", (done) => {
            browserStorage.setInteractionInProgress(true);
            browserStorage.setTemporaryCache(
                TemporaryCacheKeys.ORIGIN_URI,
                window.location.href + "/differentPath",
                true
            );

            jest.spyOn(
                RedirectClient.prototype,
                <any>"handleResponse"
            ).mockRejectedValue("Error in handleResponse");
            redirectClient = // @ts-ignore
                redirectClient = new RedirectClient(
                    {
                        // @ts-ignore
                        ...pca.config,
                        auth: {
                            // @ts-ignore
                            ...pca.config.auth,
                        },
                    },
                    browserStorage,
                    //@ts-ignore
                    pca.browserCrypto,
                    //@ts-ignore
                    pca.logger,
                    //@ts-ignore
                    pca.eventHandler,
                    //@ts-ignore
                    pca.navigationClient,
                    //@ts-ignore
                    pca.performanceClient,
                    //@ts-ignore
                    pca.nativeInternalStorage
                );
            redirectClient
                .handleRedirectPromise(
                    testRequest,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    {
                        hash: TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT,
                        navigateToLoginRequestUrl: false,
                    }
                )
                .catch((e) => {
                    expect(e).toEqual("Error in handleResponse");
                    done();
                });
        });

        it("gets hash from cache and processes response", async () => {
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                TEST_URIS.TEST_REDIR_URI
            );
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`,
                TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT
            );
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`,
                TEST_CONFIG.MSAL_CLIENT_ID
            );
            const testTokenReq: CommonAuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_PARAMS}`,
                base64Encode(JSON.stringify(testTokenReq))
            );
            const testServerTokenResponse = {
                headers: {},
                status: 200,
                body: {
                    token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                    scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                    expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                    ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                    access_token: TEST_TOKENS.ACCESS_TOKEN,
                    refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                    id_token: TEST_TOKENS.IDTOKEN_V2,
                    client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                },
            };

            const testAccount: AccountInfo = AccountEntityUtils.getAccountInfo(
                buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS)
            );

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: ID_TOKEN_CLAIMS.oid,
                tenantId: ID_TOKEN_CLAIMS.tid,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testServerTokenResponse.body.id_token,
                idTokenClaims: ID_TOKEN_CLAIMS,
                accessToken: testServerTokenResponse.body.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.body.expires_in
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            jest.spyOn(
                FetchClient.prototype,
                "sendGetRequestAsync"
            ).mockImplementation((url): any => {
                if (url.includes("discovery/instance")) {
                    return DEFAULT_TENANT_DISCOVERY_RESPONSE;
                } else if (url.includes(".well-known/openid-configuration")) {
                    return DEFAULT_OPENID_CONFIG_RESPONSE;
                }
            });
            jest.spyOn(
                FetchClient.prototype,
                "sendPostRequestAsync"
            ).mockResolvedValue(testServerTokenResponse);

            const tokenResponse = await redirectClient.handleRedirectPromise(
                testRequest,
                TEST_CONFIG.TEST_VERIFIER,
                rootMeasurement,
                { hash: "" }
            );
            expect(tokenResponse?.uniqueId).toEqual(testTokenResponse.uniqueId);
            expect(tokenResponse?.tenantId).toEqual(testTokenResponse.tenantId);
            expect(tokenResponse?.scopes).toEqual(testTokenResponse.scopes);
            expect(tokenResponse?.idToken).toEqual(testTokenResponse.idToken);
            expect(tokenResponse?.idTokenClaims).toEqual(
                expect.objectContaining(testTokenResponse.idTokenClaims)
            );
            expect(tokenResponse?.accessToken).toEqual(
                testTokenResponse.accessToken
            );
            expect(
                tokenResponse?.expiresOn &&
                    testTokenResponse.expiresOn &&
                    testTokenResponse.expiresOn.getMilliseconds() >=
                        tokenResponse.expiresOn.getMilliseconds()
            ).toBeTruthy();
        });

        it("gets hash from cache and calls native broker if hash contains accountId", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            });

            await pca.initialize();

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            // @ts-ignore
            const nativeMessageHandler = new PlatformAuthExtensionHandler(
                //@ts-ignore
                pca.logger,
                2000,
                getDefaultPerformanceClient()
            );
            // @ts-ignore
            redirectClient = new RedirectClient(
                //@ts-ignore
                pca.config,
                browserStorage,
                //@ts-ignore
                pca.browserCrypto,
                //@ts-ignore
                pca.logger,
                //@ts-ignore
                pca.eventHandler,
                //@ts-ignore
                pca.navigationClient,
                //@ts-ignore
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage,
                TEST_CONFIG.CORRELATION_ID,
                nativeMessageHandler
            );

            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserCrypto = new CryptoOps(new Logger({}));
            const stateId = ProtocolUtils.parseRequestState(
                browserCrypto.base64Decode,
                stateString
            ).libraryState.id;

            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                TEST_URIS.TEST_REDIR_URI
            );
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`,
                TEST_HASHES.TEST_SUCCESS_NATIVE_ACCOUNT_ID_REDIRECT
            );
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`,
                TEST_CONFIG.MSAL_CLIENT_ID
            );
            const testTokenReq: CommonAuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_PARAMS}`,
                base64Encode(JSON.stringify(testTokenReq))
            );
            const testServerTokenResponse = {
                headers: {},
                status: 200,
                body: {
                    token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                    scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                    expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                    ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                    access_token: TEST_TOKENS.ACCESS_TOKEN,
                    refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                    id_token: TEST_TOKENS.IDTOKEN_V2,
                    client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                },
            };

            const testAccount: AccountInfo = AccountEntityUtils.getAccountInfo(
                buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS, undefined, {
                    nativeAccountId: "test-nativeAccountId",
                })
            );

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: ID_TOKEN_CLAIMS.oid,
                tenantId: ID_TOKEN_CLAIMS.tid,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testServerTokenResponse.body.id_token,
                idTokenClaims: ID_TOKEN_CLAIMS,
                accessToken: testServerTokenResponse.body.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.body.expires_in
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            jest.spyOn(
                FetchClient.prototype,
                "sendGetRequestAsync"
            ).mockImplementation((url): any => {
                if (url.includes("discovery/instance")) {
                    return DEFAULT_TENANT_DISCOVERY_RESPONSE;
                } else if (url.includes(".well-known/openid-configuration")) {
                    return DEFAULT_OPENID_CONFIG_RESPONSE;
                }
            });
            jest.spyOn(
                PlatformAuthInteractionClient.prototype,
                "acquireToken"
            ).mockResolvedValue(testTokenResponse);

            const tokenResponse = await redirectClient.handleRedirectPromise(
                testRequest,
                TEST_CONFIG.TEST_VERIFIER,
                rootMeasurement,
                { hash: "" }
            );
            expect(tokenResponse?.uniqueId).toEqual(testTokenResponse.uniqueId);
            expect(tokenResponse?.tenantId).toEqual(testTokenResponse.tenantId);
            expect(tokenResponse?.scopes).toEqual(testTokenResponse.scopes);
            expect(tokenResponse?.idToken).toEqual(testTokenResponse.idToken);
            expect(tokenResponse?.idTokenClaims).toEqual(
                expect.objectContaining(testTokenResponse.idTokenClaims)
            );
            expect(tokenResponse?.accessToken).toEqual(
                testTokenResponse.accessToken
            );
            expect(
                tokenResponse?.expiresOn &&
                    testTokenResponse.expiresOn &&
                    testTokenResponse.expiresOn.getMilliseconds() >=
                        tokenResponse.expiresOn.getMilliseconds()
            ).toBeTruthy();
        });

        it("gets hash from cache and throws if hash contains accountId but native broker connection is not established", (done) => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            });

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            // @ts-ignore
            redirectClient = new RedirectClient(
                //@ts-ignore
                pca.config,
                browserStorage,
                //@ts-ignore
                pca.browserCrypto,
                //@ts-ignore
                pca.logger,
                //@ts-ignore
                pca.eventHandler,
                //@ts-ignore
                pca.navigationClient,
                //@ts-ignore
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage
            );

            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserCrypto = new CryptoOps(new Logger({}));
            const stateId = ProtocolUtils.parseRequestState(
                browserCrypto.base64Decode,
                stateString
            ).libraryState.id;

            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                TEST_URIS.TEST_REDIR_URI
            );
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`,
                TEST_HASHES.TEST_SUCCESS_NATIVE_ACCOUNT_ID_REDIRECT
            );
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`,
                TEST_CONFIG.MSAL_CLIENT_ID
            );
            const testTokenReq: CommonAuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_PARAMS}`,
                base64Encode(JSON.stringify(testTokenReq))
            );

            redirectClient
                .handleRedirectPromise(
                    testRequest,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    { hash: "" }
                )
                .catch((e) => {
                    expect(e.errorCode).toEqual(
                        BrowserAuthErrorCodes.nativeConnectionNotEstablished
                    );
                    expect(e.errorMessage).toEqual(
                        getDefaultErrorMessage(
                            BrowserAuthErrorCodes.nativeConnectionNotEstablished
                        )
                    );
                    done();
                });
        });

        it("gets hash from cache and processes error", (done) => {
            const testAuthCodeRequest: CommonAuthorizationCodeRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["scope1", "scope2"],
                code: "",
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };

            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserCrypto = new CryptoOps(new Logger({}));
            const stateId = ProtocolUtils.parseRequestState(
                browserCrypto.base64Decode,
                stateString
            ).libraryState.id;

            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_PARAMS}`,
                browserCrypto.base64Encode(JSON.stringify(testAuthCodeRequest))
            );
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                TEST_URIS.TEST_REDIR_URI
            );
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`,
                TEST_HASHES.TEST_ERROR_HASH
            );
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`,
                TEST_CONFIG.MSAL_CLIENT_ID
            );

            redirectClient
                .handleRedirectPromise(
                    testRequest,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    { hash: "" }
                )
                .catch((err) => {
                    expect(err instanceof ServerError).toBeTruthy();
                    done();
                });
        });

        it("processes hash if navigateToLoginRequestUri is false and request origin is the same", async () => {
            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserCrypto = new CryptoOps(new Logger({}));
            const stateId = ProtocolUtils.parseRequestState(
                browserCrypto.base64Decode,
                stateString
            ).libraryState.id;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                TEST_URIS.TEST_REDIR_URI
            );
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`,
                TEST_CONFIG.MSAL_CLIENT_ID
            );

            const testTokenReq: CommonAuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };

            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_PARAMS}`,
                base64Encode(JSON.stringify(testTokenReq))
            );
            const testServerTokenResponse = {
                headers: {},
                status: 200,
                body: {
                    token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                    scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                    expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                    ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                    access_token: TEST_TOKENS.ACCESS_TOKEN,
                    refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                    id_token: TEST_TOKENS.IDTOKEN_V2,
                    client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                },
            };

            const testAccount: AccountInfo = AccountEntityUtils.getAccountInfo(
                buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS)
            );

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: ID_TOKEN_CLAIMS.oid,
                tenantId: ID_TOKEN_CLAIMS.tid,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testServerTokenResponse.body.id_token,
                idTokenClaims: ID_TOKEN_CLAIMS,
                accessToken: testServerTokenResponse.body.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.body.expires_in
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            jest.spyOn(
                FetchClient.prototype,
                "sendGetRequestAsync"
            ).mockImplementation((url): any => {
                if (url.includes("discovery/instance")) {
                    return DEFAULT_TENANT_DISCOVERY_RESPONSE;
                } else if (url.includes(".well-known/openid-configuration")) {
                    return DEFAULT_OPENID_CONFIG_RESPONSE;
                }
            });
            jest.spyOn(
                FetchClient.prototype,
                "sendPostRequestAsync"
            ).mockResolvedValue(testServerTokenResponse);
            let pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            });

            await pca.initialize();

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            // @ts-ignore
            redirectClient = new RedirectClient(
                //@ts-ignore
                pca.config,
                //@ts-ignore
                pca.browserStorage,
                //@ts-ignore
                pca.browserCrypto,
                //@ts-ignore
                pca.logger,
                //@ts-ignore
                pca.eventHandler,
                //@ts-ignore
                pca.navigationClient,
                //@ts-ignore
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage
            );

            const tokenResponse = await redirectClient.handleRedirectPromise(
                testRequest,
                TEST_CONFIG.TEST_VERIFIER,
                rootMeasurement,
                {
                    hash: "",
                    navigateToLoginRequestUrl: false,
                }
            );
            expect(tokenResponse?.uniqueId).toEqual(testTokenResponse.uniqueId);
            expect(tokenResponse?.tenantId).toEqual(testTokenResponse.tenantId);
            expect(tokenResponse?.scopes).toEqual(testTokenResponse.scopes);
            expect(tokenResponse?.idToken).toEqual(testTokenResponse.idToken);
            expect(tokenResponse?.idTokenClaims).toEqual(
                expect.objectContaining(testTokenResponse.idTokenClaims)
            );
            expect(tokenResponse?.accessToken).toEqual(
                testTokenResponse.accessToken
            );
            expect(
                testTokenResponse.expiresOn &&
                    tokenResponse?.expiresOn &&
                    testTokenResponse.expiresOn.getMilliseconds() >=
                        tokenResponse.expiresOn.getMilliseconds()
            ).toBeTruthy();
            expect(window.location.hash).toBe("");
        });

        it("calls custom navigateInternal function then processes hash", async () => {
            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserCrypto = new CryptoOps(new Logger({}));
            const stateId = ProtocolUtils.parseRequestState(
                browserCrypto.base64Decode,
                stateString
            ).libraryState.id;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                TEST_URIS.TEST_ALTERNATE_REDIR_URI
            );
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`,
                TEST_CONFIG.MSAL_CLIENT_ID
            );

            const testTokenReq: CommonAuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };

            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_PARAMS}`,
                base64Encode(JSON.stringify(testTokenReq))
            );
            const testServerTokenResponse: NetworkResponse<ServerAuthorizationTokenResponse> =
                {
                    headers: {},
                    status: 200,
                    body: {
                        token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                        scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                        expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                        ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                        access_token: TEST_TOKENS.ACCESS_TOKEN,
                        refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                        id_token: TEST_TOKENS.IDTOKEN_V2,
                        client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                    },
                };

            const testAccount: AccountInfo = AccountEntityUtils.getAccountInfo(
                buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS)
            );

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: ID_TOKEN_CLAIMS.oid,
                tenantId: ID_TOKEN_CLAIMS.tid,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testServerTokenResponse.body.id_token!,
                idTokenClaims: ID_TOKEN_CLAIMS,
                accessToken: testServerTokenResponse.body.access_token!,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.body.expires_in!
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            jest.spyOn(
                FetchClient.prototype,
                "sendGetRequestAsync"
            ).mockImplementation((url): any => {
                if (url.includes("discovery/instance")) {
                    return DEFAULT_TENANT_DISCOVERY_RESPONSE;
                } else if (url.includes(".well-known/openid-configuration")) {
                    return DEFAULT_OPENID_CONFIG_RESPONSE;
                }
            });
            jest.spyOn(
                FetchClient.prototype,
                "sendPostRequestAsync"
            ).mockResolvedValue(testServerTokenResponse);
            let pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            });

            await pca.initialize();

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            let callbackCalled = false;
            const navigationClient = new NavigationClient();
            navigationClient.navigateInternal = async (
                url: string,
                options: NavigationOptions
            ): Promise<boolean> => {
                callbackCalled = true;
                expect(url).toEqual(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
                expect(options.noHistory).toBeTruthy();
                expect(options.apiId).toEqual(ApiId.handleRedirectPromise);
                return false;
            };
            pca.setNavigationClient(navigationClient);

            // @ts-ignore
            redirectClient = new RedirectClient(
                //@ts-ignore
                pca.config,
                //@ts-ignore
                pca.browserStorage,
                //@ts-ignore
                pca.browserCrypto,
                //@ts-ignore
                pca.logger,
                //@ts-ignore
                pca.eventHandler,
                //@ts-ignore
                pca.navigationClient,
                //@ts-ignore
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage
            );

            const tokenResponse = await redirectClient.handleRedirectPromise(
                testRequest,
                TEST_CONFIG.TEST_VERIFIER,
                rootMeasurement,
                { hash: "" }
            );
            if (!tokenResponse) {
                expect(tokenResponse).not.toBe(null);
                throw new Error("Token Response is null!"); // Throw to resolve Typescript complaints below
            }
            expect(callbackCalled).toBeTruthy();
            expect(tokenResponse.uniqueId).toEqual(testTokenResponse.uniqueId);
            expect(tokenResponse.tenantId).toEqual(testTokenResponse.tenantId);
            expect(tokenResponse.scopes).toEqual(testTokenResponse.scopes);
            expect(tokenResponse.idToken).toEqual(testTokenResponse.idToken);
            expect(tokenResponse.idTokenClaims).toEqual(
                expect.objectContaining(testTokenResponse.idTokenClaims)
            );
            expect(tokenResponse.accessToken).toEqual(
                testTokenResponse.accessToken
            );
            expect(
                testTokenResponse.expiresOn!.getMilliseconds() >=
                    tokenResponse.expiresOn!.getMilliseconds()
            ).toBeTruthy();
            expect(window.location.hash).toBe("");
        });

        it("processes hash if navigateToLoginRequestUri is false and request origin is different", async () => {
            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserCrypto = new CryptoOps(new Logger({}));
            const stateId = ProtocolUtils.parseRequestState(
                browserCrypto.base64Decode,
                stateString
            ).libraryState.id;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                TEST_URIS.TEST_ALTERNATE_REDIR_URI
            );
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`,
                TEST_CONFIG.MSAL_CLIENT_ID
            );

            const testTokenReq: CommonAuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };

            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_PARAMS}`,
                base64Encode(JSON.stringify(testTokenReq))
            );
            const testServerTokenResponse = {
                headers: {},
                status: 200,
                body: {
                    token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                    scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                    expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                    ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                    access_token: TEST_TOKENS.ACCESS_TOKEN,
                    refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                    id_token: TEST_TOKENS.IDTOKEN_V2,
                    client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                },
            };

            const testAccount: AccountInfo = AccountEntityUtils.getAccountInfo(
                buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS)
            );

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: ID_TOKEN_CLAIMS.oid,
                tenantId: ID_TOKEN_CLAIMS.tid,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testServerTokenResponse.body.id_token,
                idTokenClaims: ID_TOKEN_CLAIMS,
                accessToken: testServerTokenResponse.body.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.body.expires_in
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            jest.spyOn(
                FetchClient.prototype,
                "sendGetRequestAsync"
            ).mockImplementation((url): any => {
                if (url.includes("discovery/instance")) {
                    return DEFAULT_TENANT_DISCOVERY_RESPONSE;
                } else if (url.includes(".well-known/openid-configuration")) {
                    return DEFAULT_OPENID_CONFIG_RESPONSE;
                }
            });
            jest.spyOn(
                FetchClient.prototype,
                "sendPostRequestAsync"
            ).mockResolvedValue(testServerTokenResponse);
            let pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            });

            await pca.initialize();

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            // @ts-ignore
            redirectClient = new RedirectClient(
                //@ts-ignore
                pca.config,
                //@ts-ignore
                pca.browserStorage,
                //@ts-ignore
                pca.browserCrypto,
                //@ts-ignore
                pca.logger,
                //@ts-ignore
                pca.eventHandler,
                //@ts-ignore
                pca.navigationClient,
                //@ts-ignore
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage
            );

            const tokenResponse = await redirectClient.handleRedirectPromise(
                testRequest,
                TEST_CONFIG.TEST_VERIFIER,
                rootMeasurement,
                {
                    hash: "",
                    navigateToLoginRequestUrl: false,
                }
            );
            expect(tokenResponse?.uniqueId).toEqual(testTokenResponse.uniqueId);
            expect(tokenResponse?.tenantId).toEqual(testTokenResponse.tenantId);
            expect(tokenResponse?.scopes).toEqual(testTokenResponse.scopes);
            expect(tokenResponse?.idToken).toEqual(testTokenResponse.idToken);
            expect(tokenResponse?.idTokenClaims).toEqual(
                expect.objectContaining(testTokenResponse.idTokenClaims)
            );
            expect(tokenResponse?.accessToken).toEqual(
                testTokenResponse.accessToken
            );
            expect(
                testTokenResponse.expiresOn &&
                    tokenResponse?.expiresOn &&
                    testTokenResponse.expiresOn.getMilliseconds() >=
                        tokenResponse.expiresOn.getMilliseconds()
            ).toBeTruthy();
            expect(window.location.hash).toBe("");
        });

        it("returns null if interaction is not in progress", async () => {
            browserStorage.setInteractionInProgress(false);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                TEST_URIS.TEST_ALTERNATE_REDIR_URI
            );
            expect(
                await redirectClient.handleRedirectPromise(
                    testRequest,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    { hash: "" }
                )
            ).toBe(null);
        });

        it("returns null if interaction is in progress for a different clientId", async () => {
            const browserCrypto = new CryptoOps(new Logger({}));
            const logger = new Logger({});
            const secondInstanceStorage = new BrowserCacheManager(
                "different-client-id",
                cacheConfig,
                browserCrypto,
                logger,
                new StubPerformanceClient(),
                new EventHandler()
            );
            secondInstanceStorage.setInteractionInProgress(true);
            browserStorage.setInteractionInProgress(false);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                TEST_URIS.TEST_ALTERNATE_REDIR_URI
            );
            expect(browserStorage.isInteractionInProgress(true)).toBe(false);
            expect(browserStorage.isInteractionInProgress(false)).toBe(true);
            expect(secondInstanceStorage.isInteractionInProgress(true)).toBe(
                true
            );
            expect(secondInstanceStorage.isInteractionInProgress(false)).toBe(
                true
            );
            expect(
                await redirectClient.handleRedirectPromise(
                    testRequest,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    { hash: "" }
                )
            ).toBe(null);
        });

        it("navigates and caches hash if navigateToLoginRequestUri is true and interaction type is redirect", async () => {
            browserStorage.setInteractionInProgress(true);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                TEST_URIS.TEST_ALTERNATE_REDIR_URI
            );
            jest.spyOn(
                NavigationClient.prototype,
                "navigateInternal"
            ).mockImplementation(
                (
                    urlNavigate: string,
                    options: NavigationOptions
                ): Promise<boolean> => {
                    expect(options.noHistory).toBeTruthy();
                    expect(options.timeout).toBeGreaterThan(0);
                    expect(urlNavigate).toEqual(
                        TEST_URIS.TEST_ALTERNATE_REDIR_URI
                    );
                    return Promise.resolve(true);
                }
            );
            await redirectClient.handleRedirectPromise(
                testRequest,
                TEST_CONFIG.TEST_VERIFIER,
                rootMeasurement,
                { hash: "" }
            );
            expect(
                window.sessionStorage.getItem(
                    `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`
                )
            ).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
        });

        it("navigates and caches hash if navigateToLoginRequestUri is true, the application is loaded in an iframe and allowRedirectInIframe is true", async () => {
            let pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            });

            await pca.initialize();

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            const config = {
                // @ts-ignore
                ...pca.config,
                system: {
                    // @ts-ignore
                    ...pca.config.system,
                    allowRedirectInIframe: true,
                },
            };

            // @ts-ignore
            redirectClient = new RedirectClient(
                config,
                browserStorage,
                // @ts-ignore
                pca.browserCrypto,
                // @ts-ignore
                pca.logger,
                // @ts-ignore
                pca.eventHandler,
                // @ts-ignore
                pca.navigationClient,
                // @ts-ignore
                pca.performanceClient,
                // @ts-ignore
                pca.nativeInternalStorage
            );
            jest.spyOn(BrowserUtils, "isInIframe").mockReturnValue(true);
            browserStorage.setInteractionInProgress(true);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                TEST_URIS.TEST_ALTERNATE_REDIR_URI
            );
            jest.spyOn(
                NavigationClient.prototype,
                "navigateInternal"
            ).mockImplementation(
                (
                    urlNavigate: string,
                    options: NavigationOptions
                ): Promise<boolean> => {
                    expect(options.noHistory).toBeTruthy();
                    expect(options.timeout).toBeGreaterThan(0);
                    expect(urlNavigate).toEqual(
                        TEST_URIS.TEST_ALTERNATE_REDIR_URI
                    );
                    return Promise.resolve(true);
                }
            );
            await redirectClient.handleRedirectPromise(
                testRequest,
                TEST_CONFIG.TEST_VERIFIER,
                rootMeasurement,
                { hash: "" }
            );
            expect(
                window.sessionStorage.getItem(
                    `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`
                )
            ).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
        });

        it("navigates to root and caches hash if navigateToLoginRequestUri is true", (done) => {
            browserStorage.setInteractionInProgress(true);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            jest.spyOn(
                NavigationClient.prototype,
                "navigateInternal"
            ).mockImplementation(
                (
                    urlNavigate: string,
                    options: NavigationOptions
                ): Promise<boolean> => {
                    expect(options.noHistory).toBeTruthy();
                    expect(options.timeout).toBeGreaterThan(0);
                    expect(urlNavigate).toEqual("https://localhost:8081/");
                    expect(
                        window.sessionStorage.getItem(
                            `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`
                        )
                    ).toEqual("https://localhost:8081/");
                    done();
                    return Promise.resolve(true);
                }
            );
            redirectClient.handleRedirectPromise(
                testRequest,
                TEST_CONFIG.TEST_VERIFIER,
                rootMeasurement,
                { hash: "" }
            );
            expect(
                window.sessionStorage.getItem(
                    `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`
                )
            ).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
        });

        it("throws urlParseError if loginRequestUrl is the misconfigured string 'null'", async () => {
            browserStorage.setInteractionInProgress(true);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                "null"
            );
            await expect(
                redirectClient.handleRedirectPromise(
                    testRequest,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    { hash: "" }
                )
            ).rejects.toMatchObject({
                errorCode: ClientConfigurationErrorCodes.urlParseError,
            });
        });

        it("navigates and caches hash if navigateToLoginRequestUri is true and loginRequestUrl contains query string", (done) => {
            browserStorage.setInteractionInProgress(true);
            const loginRequestUrl = window.location.href + "?testQueryString=1";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                loginRequestUrl
            );
            jest.spyOn(
                NavigationClient.prototype,
                "navigateInternal"
            ).mockImplementation(
                (
                    urlNavigate: string,
                    options: NavigationOptions
                ): Promise<boolean> => {
                    expect(options.noHistory).toBeTruthy();
                    expect(options.timeout).toBeGreaterThan(0);
                    expect(urlNavigate).toEqual(loginRequestUrl);
                    done();
                    return Promise.resolve(true);
                }
            );
            redirectClient.handleRedirectPromise(
                testRequest,
                TEST_CONFIG.TEST_VERIFIER,
                rootMeasurement,
                { hash: "" }
            );
            expect(
                window.sessionStorage.getItem(
                    `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`
                )
            ).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
        });

        it("navigates and caches hash if navigateToLoginRequestUri is true and loginRequestUrl contains query string and hash", (done) => {
            browserStorage.setInteractionInProgress(true);
            const loginRequestUrl =
                window.location.href + "?testQueryString=1#testHash";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                loginRequestUrl
            );
            jest.spyOn(
                NavigationClient.prototype,
                "navigateInternal"
            ).mockImplementation(
                (
                    urlNavigate: string,
                    options: NavigationOptions
                ): Promise<boolean> => {
                    expect(options.noHistory).toBeTruthy();
                    expect(options.timeout).toBeGreaterThan(0);
                    expect(urlNavigate).toEqual(loginRequestUrl);
                    done();
                    return Promise.resolve(true);
                }
            );
            redirectClient.handleRedirectPromise(
                testRequest,
                TEST_CONFIG.TEST_VERIFIER,
                rootMeasurement,
                { hash: "" }
            );
            expect(
                window.sessionStorage.getItem(
                    `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`
                )
            ).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
        });

        it("replaces custom hash if navigateToLoginRequestUri is true and loginRequestUrl contains custom hash", () => {
            browserStorage.setInteractionInProgress(true);
            const loginRequestUrl = window.location.href + "#testHash";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                loginRequestUrl
            );
            jest.spyOn(
                RedirectClient.prototype,
                <any>"handleResponse"
            ).mockImplementation((response) => {
                expect(response).toEqual({
                    code: "thisIsATestCode",
                    state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                    client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                });
            });
            redirectClient
                .handleRedirectPromise(
                    testRequest,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    { hash: "" }
                )
                .then(() => {
                    expect(window.location.href).toEqual(loginRequestUrl);
                });
        });

        it("replaces custom hash if navigateToLoginRequestUri is true and loginRequestUrl contains custom hash (passed in)", () => {
            browserStorage.setInteractionInProgress(true);
            const loginRequestUrl = window.location.href + "#testHash";
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                loginRequestUrl
            );
            jest.spyOn(
                RedirectClient.prototype,
                <any>"handleResponse"
            ).mockImplementation((response) => {
                expect(response).toEqual({
                    code: "thisIsATestCode",
                    state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                    client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                });
            });
            redirectClient
                .handleRedirectPromise(
                    testRequest,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    { hash: TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT }
                )
                .then(() => {
                    expect(window.location.href).toEqual(loginRequestUrl);
                });
        });

        it("Does not clear custom hash if response hash is retrieved from temporary cache", () => {
            browserStorage.setInteractionInProgress(true);
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                window.location.href
            );
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`,
                TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT
            );

            window.location.hash = "testHash";
            const clearHashSpy = jest.spyOn(BrowserUtils, "clearHash");

            jest.spyOn(
                RedirectClient.prototype,
                <any>"handleResponse"
            ).mockImplementation((response) => {
                expect(response).toEqual({
                    code: "thisIsATestCode",
                    state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                    client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                });
            });

            redirectClient
                .handleRedirectPromise(
                    testRequest,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    { hash: "" }
                )
                .then(() => {
                    expect(clearHashSpy).not.toHaveBeenCalled();
                    expect(window.location.hash).toEqual("#testHash");
                });
        });

        it("processes hash if navigateToLoginRequestUri is true and loginRequestUrl contains trailing slash", (done) => {
            browserStorage.setInteractionInProgress(true);
            const loginRequestUrl = window.location.href.endsWith("/")
                ? window.location.href.slice(0, -1)
                : window.location.href + "/";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                loginRequestUrl
            );
            jest.spyOn(
                RedirectClient.prototype,
                <any>"handleResponse"
            ).mockImplementation((response) => {
                expect(response).toEqual({
                    code: "thisIsATestCode",
                    client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                    state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                });
                done();
            });
            redirectClient.handleRedirectPromise(
                testRequest,
                TEST_CONFIG.TEST_VERIFIER,
                rootMeasurement,
                { hash: "" }
            );
        });

        it("returns null if inside an iframe", (done) => {
            browserStorage.setInteractionInProgress(true);
            jest.spyOn(BrowserUtils, "isInIframe").mockReturnValue(true);
            const loginRequestUrl = window.location.href + "/testPage";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                loginRequestUrl
            );

            redirectClient
                .handleRedirectPromise(
                    testRequest,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    { hash: "" }
                )
                .then((response) => {
                    expect(response).toBe(null);
                    done();
                });
        });

        it("clears hash if navigateToLoginRequestUri is false and loginRequestUrl contains custom hash", (done) => {
            let pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            });

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            // @ts-ignore
            redirectClient = new RedirectClient(
                // @ts-ignore
                pca.config,
                // @ts-ignore
                pca.browserStorage,
                // @ts-ignore
                pca.browserCrypto,
                // @ts-ignore
                pca.logger,
                // @ts-ignore
                pca.eventHandler,
                // @ts-ignore
                pca.navigationClient,
                // @ts-ignore
                pca.performanceClient,
                // @ts-ignore
                pca.nativeInternalStorage
            );

            browserStorage.setInteractionInProgress(true);
            const loginRequestUrl = window.location.href + "#testHash";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                loginRequestUrl
            );
            jest.spyOn(
                RedirectClient.prototype,
                <any>"handleResponse"
            ).mockImplementation((response) => {
                expect(window.location.href).not.toContain("#testHash");
                expect(response).toEqual({
                    code: "thisIsATestCode",
                    client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                    state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                });
                done();
            });
            redirectClient.handleRedirectPromise(
                testRequest,
                TEST_CONFIG.TEST_VERIFIER,
                rootMeasurement,
                {
                    hash: "",
                    navigateToLoginRequestUrl: false,
                }
            );
        });

        it("mutes no_server_response error when back navigation is detected", async () => {
            // @ts-ignore
            window.performance.getEntriesByType = () => {
                return [{ type: "back_forward" }];
            };

            browserStorage.setInteractionInProgress(true);
            const loginRequestUrl = window.location.href;
            window.location.hash = "";
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                loginRequestUrl
            );
            const res = await redirectClient.handleRedirectPromise(
                testRequest,
                TEST_CONFIG.TEST_VERIFIER,
                rootMeasurement,
                { hash: "" }
            );
            expect(res).toBeNull();
            expect(rootMeasurement.event.errorCode).toBeUndefined();
        });

        it("does not mute no_server_response error when back navigation is not detected", async () => {
            // @ts-ignore
            window.performance.getEntriesByType = () => {
                return [];
            };

            browserStorage.setInteractionInProgress(true);
            const loginRequestUrl = window.location.href;
            window.location.hash = "";
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                loginRequestUrl
            );
            const res = await redirectClient.handleRedirectPromise(
                testRequest,
                TEST_CONFIG.TEST_VERIFIER,
                rootMeasurement,
                { hash: "" }
            );
            expect(res).toBeNull();
            expect(rootMeasurement.event.errorCode).toEqual(
                "no_server_response"
            );
        });
    });

    describe("acquireToken", () => {
        it("throws error when AuthenticationScheme is set to SSH and SSH JWK is omitted from the request", async () => {
            const loginRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["user.read"],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode:
                    TEST_CONFIG.RESPONSE_MODE as Constants.ResponseMode,
                nonce: "",
                authenticationScheme: Constants.AuthenticationScheme.SSH,
            };

            await expect(
                redirectClient.acquireToken(loginRequest)
            ).rejects.toThrow(
                createClientConfigurationError(
                    ClientConfigurationErrorCodes.missingSshJwk
                )
            );
        });

        it("throws error when AuthenticationScheme is set to SSH and SSH KID is omitted from the request", async () => {
            const request: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["user.read"],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode:
                    TEST_CONFIG.RESPONSE_MODE as Constants.ResponseMode,
                nonce: "",
                authenticationScheme: Constants.AuthenticationScheme.SSH,
                sshJwk: TEST_SSH_VALUES.SSH_JWK,
            };

            await expect(redirectClient.acquireToken(request)).rejects.toThrow(
                createClientConfigurationError(
                    ClientConfigurationErrorCodes.missingSshKid
                )
            );
        });

        it("throws urlParseError when redirectStartPage is a malformed URL", async () => {
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            const loginRequest: RedirectRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["user.read"],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                nonce: "",
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
                redirectStartPage: "not-a-valid-url",
            };

            await expect(
                redirectClient.acquireToken(loginRequest)
            ).rejects.toMatchObject({
                errorCode: ClientConfigurationErrorCodes.urlParseError,
            });
            // Malformed value should never be persisted to the cache
            expect(
                window.sessionStorage.getItem(
                    `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`
                )
            ).toBeNull();
        });

        it("caches a well-formed redirectStartPage without throwing", (done) => {
            const validRedirectStartPage = "https://localhost:8081/home";
            jest.spyOn(
                RedirectClient.prototype,
                "initiateAuthRequest"
            ).mockImplementation((): Promise<void> => {
                expect(
                    window.sessionStorage.getItem(
                        `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`
                    )
                ).toEqual(validRedirectStartPage);
                done();
                return Promise.resolve();
            });
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            const loginRequest: RedirectRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["user.read"],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                nonce: "",
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
                redirectStartPage: validRedirectStartPage,
            };

            redirectClient.acquireToken(loginRequest);
        });

        it("navigates to created login url", (done) => {
            jest.spyOn(
                RedirectClient.prototype,
                "initiateAuthRequest"
            ).mockImplementation(async (navigateUrl): Promise<void> => {
                try {
                    verifyUrl(navigateUrl, ["user.read"]);
                    return Promise.resolve(done());
                } catch (err) {
                    Promise.reject(err);
                }
            });
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            const loginRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["user.read"],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode:
                    TEST_CONFIG.RESPONSE_MODE as Constants.ResponseMode,
                nonce: "",
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };

            redirectClient.acquireToken(loginRequest);
        });

        it("Temporary cache is cleared when 'pageshow' event is fired", (done) => {
            let bfCacheCallback: (event: object) => any;
            jest.spyOn(window, "addEventListener").mockImplementation(
                (eventName, callback) => {
                    expect(eventName).toEqual("pageshow");
                    // @ts-ignore
                    bfCacheCallback = callback;
                }
            );
            const emptyRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode:
                    TEST_CONFIG.RESPONSE_MODE as Constants.ResponseMode,
                nonce: "",
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };

            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });

            const eventSpy = jest
                .spyOn(EventHandler.prototype, "emitEvent")
                .mockImplementation();

            const testLogger = new Logger(loggerOptions);
            const browserCrypto = new CryptoOps(new Logger({}));
            const browserStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                testLogger,
                new StubPerformanceClient(),
                new EventHandler()
            );

            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation(
                (
                    urlNavigate: string,
                    options: NavigationOptions
                ): Promise<boolean> => {
                    expect(browserStorage.isInteractionInProgress()).toBe(true);
                    bfCacheCallback({ persisted: true });
                    expect(eventSpy).toHaveBeenCalledWith(
                        EventType.RESTORE_FROM_BFCACHE,
                        TEST_CONFIG.CORRELATION_ID,
                        InteractionType.Redirect
                    );
                    expect(browserStorage.isInteractionInProgress()).toBe(
                        false
                    );
                    done();
                    return Promise.resolve(true);
                }
            );
            browserStorage.setInteractionInProgress(true); // This happens in PCA so need to set manually here
            redirectClient.acquireToken(emptyRequest);
        });

        it("Caches token request correctly", async () => {
            const tokenRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [],
                correlationId: RANDOM_TEST_GUID,
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                responseMode:
                    TEST_CONFIG.RESPONSE_MODE as Constants.ResponseMode,
                nonce: "",
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };

            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });

            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation(
                (
                    urlNavigate: string,
                    options: NavigationOptions
                ): Promise<boolean> => {
                    expect(options.noHistory).toBeFalsy();
                    expect(urlNavigate).not.toBe("");
                    return Promise.resolve(true);
                }
            );

            const browserCrypto = new CryptoOps(new Logger({}));
            const testLogger = new Logger(loggerOptions);
            const browserStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                testLogger,
                new StubPerformanceClient(),
                new EventHandler()
            );
            await redirectClient.acquireToken(tokenRequest);
            const [cachedRequest, codeVerifier] =
                browserStorage.getCachedRequest(TEST_CONFIG.CORRELATION_ID);
            expect(cachedRequest.scopes).toEqual([]);
            expect(codeVerifier).toEqual(TEST_CONFIG.TEST_VERIFIER);
            expect(cachedRequest.authority).toEqual(
                `${Constants.DEFAULT_AUTHORITY}`
            );
            expect(cachedRequest.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(cachedRequest.authenticationScheme).toEqual(
                TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme
            );
        });

        it("navigates to created login url", (done) => {
            jest.spyOn(
                RedirectClient.prototype,
                "initiateAuthRequest"
            ).mockImplementation((navigateUrl): Promise<void> => {
                verifyUrl(navigateUrl, ["user.read"]);
                return Promise.resolve(done());
            });
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            const loginRequest: RedirectRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["user.read", "openid", "profile"],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                nonce: "",
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };
            redirectClient.acquireToken(loginRequest);
        });

        it("passes onRedirectNavigate callback from config", (done) => {
            const onRedirectNavigate = (url: string) => {
                verifyUrl(url, ["user.read"]);
                done();
            };

            let pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    onRedirectNavigate: onRedirectNavigate,
                },
                telemetry: {
                    application: {
                        appName: TEST_CONFIG.applicationName,
                        appVersion: TEST_CONFIG.applicationVersion,
                    },
                },
            });

            pca.initialize().then(() => {
                pca = (pca as any).controller;
                let redirectClient = new RedirectClient(
                    //@ts-ignore
                    pca.config,
                    //@ts-ignore
                    pca.browserStorage,
                    //@ts-ignore
                    pca.browserCrypto,
                    //@ts-ignore
                    pca.logger,
                    //@ts-ignore
                    pca.eventHandler,
                    //@ts-ignore
                    pca.navigationClient,
                    //@ts-ignore
                    pca.performanceClient,
                    //@ts-ignore
                    pca.nativeInternalStorage,
                    TEST_CONFIG.CORRELATION_ID
                );

                let initiateAuthRequestSpy = jest.spyOn(
                    RedirectClient.prototype,
                    "initiateAuthRequest"
                );
                jest.spyOn(
                    PkceGenerator,
                    "generatePkceCodes"
                ).mockResolvedValue({
                    challenge: TEST_CONFIG.TEST_CHALLENGE,
                    verifier: TEST_CONFIG.TEST_VERIFIER,
                });
                const loginRequest: RedirectRequest = {
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: ["user.read", "openid", "profile"],
                    state: TEST_STATE_VALUES.USER_STATE,
                };
                redirectClient.acquireToken(loginRequest).then(() => {
                    expect(initiateAuthRequestSpy).toHaveBeenCalled();
                });
            });
        });

        it("executes authorize request as GET when httpMethod is set to GET", async () => {
            const loginRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["user.read"],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode:
                    TEST_CONFIG.RESPONSE_MODE as Constants.ResponseMode,
                nonce: "",
                httpMethod: Constants.HttpMethod.GET,
            };

            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });

            const getFlowSpy = jest
                .spyOn(AuthorizeProtocol, "getAuthCodeRequestUrl")
                .mockImplementation(() => {
                    return Promise.resolve(testNavUrl);
                });

            await redirectClient.acquireToken(loginRequest);
            expect(getFlowSpy).toHaveBeenCalled();
        });

        it("executes authorize request as GET when httpMethod is not explicitly set", async () => {
            const loginRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["user.read"],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode:
                    TEST_CONFIG.RESPONSE_MODE as Constants.ResponseMode,
                nonce: "",
            };

            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });

            const getFlowSpy = jest
                .spyOn(AuthorizeProtocol, "getAuthCodeRequestUrl")
                .mockImplementation(() => {
                    return Promise.resolve(testNavUrl);
                });

            await redirectClient.acquireToken(loginRequest);
            expect(getFlowSpy).toHaveBeenCalled();
        });

        it("executes authorize request as POST when httpMethod is set to POST", async () => {
            const loginRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["user.read"],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode:
                    TEST_CONFIG.RESPONSE_MODE as Constants.ResponseMode,
                nonce: "",
                httpMethod: Constants.HttpMethod.POST,
            };

            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });

            const postFlowSpy = jest
                .spyOn(RedirectClient.prototype, "executeCodeFlowWithPost")
                .mockImplementation(() => {
                    return Promise.resolve();
                });

            await redirectClient.acquireToken(loginRequest);
            expect(postFlowSpy).toHaveBeenCalled();
        });

        describe("storeInCache tests", () => {
            beforeEach(() => {
                jest.spyOn(
                    FetchClient.prototype,
                    "sendPostRequestAsync"
                ).mockResolvedValue(TEST_TOKEN_RESPONSE);
                jest.spyOn(
                    PkceGenerator,
                    "generatePkceCodes"
                ).mockResolvedValue({
                    challenge: TEST_CONFIG.TEST_CHALLENGE,
                    verifier: TEST_CONFIG.TEST_VERIFIER,
                });
            });

            it("does not store idToken if storeInCache.idToken = false", async () => {
                browserStorage.setInteractionInProgress(true);
                const request: CommonAuthorizationUrlRequest = {
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    storeInCache: {
                        idToken: false,
                    },
                    nonce: ID_TOKEN_CLAIMS.nonce, // Ensures nonce matches the mocked idToken
                    responseMode: Constants.ResponseMode.FRAGMENT,
                    state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                    correlationId: RANDOM_TEST_GUID,
                    authority: TEST_CONFIG.validAuthority,
                };
                await redirectClient.acquireToken(request);

                const tokenResp = await redirectClient.handleRedirectPromise(
                    request,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    { hash: TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT }
                );
                if (!tokenResp) {
                    throw "Response should not be null!";
                }

                // Response should still contain acquired tokens
                expect(tokenResp.idToken).toEqual(
                    TEST_TOKEN_RESPONSE.body.id_token
                );
                expect(tokenResp.accessToken).toEqual(
                    TEST_TOKEN_RESPONSE.body.access_token
                );

                // Cache should not contain tokens which were turned off
                const tokenKeys = browserStorage.getTokenKeys();
                expect(tokenKeys.idToken).toHaveLength(0);
                expect(tokenKeys.accessToken).toHaveLength(1);
                expect(tokenKeys.refreshToken).toHaveLength(1);
            });

            it("does not store accessToken if storeInCache.accessToken = false", async () => {
                browserStorage.setInteractionInProgress(true);
                const request: CommonAuthorizationUrlRequest = {
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    storeInCache: {
                        accessToken: false,
                    },
                    nonce: ID_TOKEN_CLAIMS.nonce, // Ensures nonce matches the mocked idToken
                    responseMode: Constants.ResponseMode.FRAGMENT,
                    state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                    correlationId: RANDOM_TEST_GUID,
                    authority: TEST_CONFIG.validAuthority,
                };
                await redirectClient.acquireToken(request);

                const tokenResp = await redirectClient.handleRedirectPromise(
                    request,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    { hash: TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT }
                );
                if (!tokenResp) {
                    throw "Response should not be null!";
                }

                // Response should still contain acquired tokens
                expect(tokenResp.idToken).toEqual(
                    TEST_TOKEN_RESPONSE.body.id_token
                );
                expect(tokenResp.accessToken).toEqual(
                    TEST_TOKEN_RESPONSE.body.access_token
                );

                // Cache should not contain tokens which were turned off
                const tokenKeys = browserStorage.getTokenKeys();
                expect(tokenKeys.idToken).toHaveLength(1);
                expect(tokenKeys.accessToken).toHaveLength(0);
                expect(tokenKeys.refreshToken).toHaveLength(1);
            });

            it("does not store refreshToken if storeInCache.refreshToken = false", async () => {
                browserStorage.setInteractionInProgress(true);
                const request: CommonAuthorizationUrlRequest = {
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    storeInCache: {
                        refreshToken: false,
                    },
                    nonce: ID_TOKEN_CLAIMS.nonce, // Ensures nonce matches the mocked idToken
                    responseMode: Constants.ResponseMode.FRAGMENT,
                    state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                    correlationId: RANDOM_TEST_GUID,
                    authority: TEST_CONFIG.validAuthority,
                };
                await redirectClient.acquireToken(request);

                const tokenResp = await redirectClient.handleRedirectPromise(
                    request,
                    TEST_CONFIG.TEST_VERIFIER,
                    rootMeasurement,
                    { hash: TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT }
                );
                if (!tokenResp) {
                    throw "Response should not be null!";
                }

                // Response should still contain acquired tokens
                expect(tokenResp.idToken).toEqual(
                    TEST_TOKEN_RESPONSE.body.id_token
                );
                expect(tokenResp.accessToken).toEqual(
                    TEST_TOKEN_RESPONSE.body.access_token
                );

                // Cache should not contain tokens which were turned off
                const tokenKeys = browserStorage.getTokenKeys();
                expect(tokenKeys.idToken).toHaveLength(1);
                expect(tokenKeys.accessToken).toHaveLength(1);
                expect(tokenKeys.refreshToken).toHaveLength(0);
            });
        });
    });

    describe("logout", () => {
        it("passes logoutUri from authModule to window nav util", (done) => {
            const logoutUriSpy = jest
                .spyOn(AuthorizationCodeClient.prototype, "getLogoutUri")
                .mockReturnValue(testLogoutUrl);
            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation(
                (
                    urlNavigate: string,
                    options: NavigationOptions
                ): Promise<boolean> => {
                    expect(logoutUriSpy).toHaveBeenCalledWith(
                        expect.objectContaining({
                            correlationId: RANDOM_TEST_GUID,
                            postLogoutRedirectUri: TEST_URIS.TEST_REDIR_URI,
                        })
                    );
                    // State is now always set for logout flows
                    expect(logoutUriSpy.mock.calls[0][0].state).toBeTruthy();
                    expect(urlNavigate).toEqual(testLogoutUrl);
                    expect(options.noHistory).toBeFalsy();
                    done();
                    return Promise.resolve(true);
                }
            );
            redirectClient.logout();
        });

        it("includes postLogoutRedirectUri if one is passed", (done) => {
            const postLogoutRedirectUri = "https://localhost:8000/logout";
            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation(
                (
                    urlNavigate: string,
                    options: NavigationOptions
                ): Promise<boolean> => {
                    expect(urlNavigate).toContain(
                        `post_logout_redirect_uri=${encodeURIComponent(
                            postLogoutRedirectUri
                        )}`
                    );
                    done();
                    return Promise.resolve(true);
                }
            );
            redirectClient.logout({
                postLogoutRedirectUri,
            });
        });

        it("includes postLogoutRedirectUri if one is configured", (done) => {
            const postLogoutRedirectUri = "https://localhost:8000/logout";
            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation(
                (
                    urlNavigate: string,
                    options: NavigationOptions
                ): Promise<boolean> => {
                    expect(urlNavigate).toContain(
                        `post_logout_redirect_uri=${encodeURIComponent(
                            postLogoutRedirectUri
                        )}`
                    );
                    done();
                    return Promise.resolve(true);
                }
            );

            let pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    postLogoutRedirectUri,
                },
            });

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            // @ts-ignore
            redirectClient = new RedirectClient(
                // @ts-ignore
                pca.config,
                // @ts-ignore
                pca.browserStorage,
                // @ts-ignore
                pca.browserCrypto,
                // @ts-ignore
                pca.logger,
                // @ts-ignore
                pca.eventHandler,
                // @ts-ignore
                pca.navigationClient,
                // @ts-ignore
                pca.performanceClient,
                // @ts-ignore
                pca.nativeInternalStorage
            );

            pca.initialize().then(() => redirectClient.logout());
        });

        it("does not include postLogoutRedirectUri if null is configured", (done) => {
            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation(
                (
                    urlNavigate: string,
                    options: NavigationOptions
                ): Promise<boolean> => {
                    expect(urlNavigate).not.toContain(
                        `post_logout_redirect_uri`
                    );
                    done();
                    return Promise.resolve(true);
                }
            );

            let pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    postLogoutRedirectUri: null,
                },
            });

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            // @ts-ignore
            redirectClient = new RedirectClient(
                // @ts-ignore
                pca.config,
                // @ts-ignore
                pca.browserStorage,
                // @ts-ignore
                pca.browserCrypto,
                // @ts-ignore
                pca.logger,
                // @ts-ignore
                pca.eventHandler,
                // @ts-ignore
                pca.navigationClient,
                // @ts-ignore
                pca.performanceClient
            );

            pca.initialize().then(() => redirectClient.logout());
        });

        it("does not include postLogoutRedirectUri if null is set on request", (done) => {
            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation(
                (
                    urlNavigate: string,
                    options: NavigationOptions
                ): Promise<boolean> => {
                    expect(urlNavigate).not.toContain(
                        "post_logout_redirect_uri"
                    );
                    done();
                    return Promise.resolve(true);
                }
            );
            redirectClient.logout({
                postLogoutRedirectUri: null,
            });
        });

        it("includes postLogoutRedirectUri as current page if none is set on request", (done) => {
            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation(
                (
                    urlNavigate: string,
                    options: NavigationOptions
                ): Promise<boolean> => {
                    expect(urlNavigate).toContain(
                        `post_logout_redirect_uri=${encodeURIComponent(
                            "https://localhost:8081/index.html"
                        )}`
                    );
                    done();
                    return Promise.resolve(true);
                }
            );
            redirectClient.logout();
        });

        it("includes logoutHint if it is set on request", (done) => {
            const logoutHint = "test@user.com";
            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation(
                (
                    urlNavigate: string,
                    options: NavigationOptions
                ): Promise<boolean> => {
                    expect(urlNavigate).toContain(
                        `logout_hint=${encodeURIComponent(logoutHint)}`
                    );
                    done();
                    return Promise.resolve(true);
                }
            );
            redirectClient.logout({ logoutHint: logoutHint });
        });

        it("includes logoutHint from ID token claims if account is passed in and logoutHint is not", (done) => {
            const logoutHint = "test@user.com";
            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                login_hint: logoutHint,
            };

            const testAccountInfo: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                loginHint: testIdTokenClaims.login_hint,
                idTokenClaims: testIdTokenClaims,
            };

            const testAccount: AccountEntity = {
                homeAccountId: testAccountInfo.homeAccountId,
                localAccountId: testAccountInfo.localAccountId,
                environment: testAccountInfo.environment,
                realm: testAccountInfo.tenantId,
                username: testAccountInfo.username,
                name: testAccountInfo.name,
                authorityType: "MSSTS",
                clientInfo: TEST_DATA_CLIENT_INFO.TEST_CLIENT_INFO_B64ENCODED,
                lastUpdatedAt: Date.now().toString(),
            };

            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation(
                (
                    urlNavigate: string,
                    options: NavigationOptions
                ): Promise<boolean> => {
                    expect(urlNavigate).toContain(
                        `logout_hint=${encodeURIComponent(logoutHint)}`
                    );
                    done();
                    return Promise.resolve(true);
                }
            );
            browserStorage
                .setAccount(testAccount, TEST_CONFIG.CORRELATION_ID, true, 0)
                .then(() =>
                    redirectClient.logout({ account: testAccountInfo })
                );
        });

        it("gets logouthint from account loginhint first before checking idtokenclaims", (done) => {
            const logoutHint = "accountloginhint@user.com";
            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };

            const testAccountInfo: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                loginHint: logoutHint,
                idTokenClaims: testIdTokenClaims,
            };

            const testAccount: AccountEntity = {
                homeAccountId: testAccountInfo.homeAccountId,
                localAccountId: testAccountInfo.localAccountId,
                environment: testAccountInfo.environment,
                realm: testAccountInfo.tenantId,
                username: testAccountInfo.username,
                name: testAccountInfo.name,
                authorityType: "MSSTS",
                clientInfo: TEST_DATA_CLIENT_INFO.TEST_CLIENT_INFO_B64ENCODED,
                lastUpdatedAt: Date.now().toString(),
            };

            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation(
                (
                    urlNavigate: string,
                    options: NavigationOptions
                ): Promise<boolean> => {
                    expect(urlNavigate).toContain(
                        `logout_hint=${encodeURIComponent(logoutHint)}`
                    );
                    done();
                    return Promise.resolve(true);
                }
            );
            browserStorage
                .setAccount(testAccount, TEST_CONFIG.CORRELATION_ID, true, 0)
                .then(() =>
                    redirectClient.logout({ account: testAccountInfo })
                );
        });

        it("falls back to idTokenClaims login_hint when account loginHint is not available", (done) => {
            const idTokenLoginHint = "idtoken@user.com";
            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                login_hint: idTokenLoginHint,
            };

            const testAccountInfo: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                idTokenClaims: testIdTokenClaims,
            };

            const testAccount: AccountEntity = {
                homeAccountId: testAccountInfo.homeAccountId,
                localAccountId: testAccountInfo.localAccountId,
                environment: testAccountInfo.environment,
                realm: testAccountInfo.tenantId,
                username: testAccountInfo.username,
                name: testAccountInfo.name,
                authorityType: "MSSTS",
                clientInfo: TEST_DATA_CLIENT_INFO.TEST_CLIENT_INFO_B64ENCODED,
                lastUpdatedAt: Date.now().toString(),
            };

            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation(
                (
                    urlNavigate: string,
                    options: NavigationOptions
                ): Promise<boolean> => {
                    expect(urlNavigate).toContain(
                        `logout_hint=${encodeURIComponent(idTokenLoginHint)}`
                    );
                    done();
                    return Promise.resolve(true);
                }
            );
            browserStorage
                .setAccount(testAccount, TEST_CONFIG.CORRELATION_ID, true, 0)
                .then(() =>
                    redirectClient.logout({ account: testAccountInfo })
                );
        });

        it("logoutHint attribute takes precedence over ID Token Claims from provided account when setting logout_hint", (done) => {
            const logoutHint = "test@user.com";
            const loginHint = "anothertest@user.com";
            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                login_hint: loginHint,
            };

            const testAccountInfo: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                loginHint: testIdTokenClaims.login_hint,
                idTokenClaims: testIdTokenClaims,
            };

            const testAccount: AccountEntity = {
                homeAccountId: testAccountInfo.homeAccountId,
                localAccountId: testAccountInfo.localAccountId,
                environment: testAccountInfo.environment,
                realm: testAccountInfo.tenantId,
                username: testAccountInfo.username,
                name: testAccountInfo.name,
                authorityType: "MSSTS",
                clientInfo: TEST_DATA_CLIENT_INFO.TEST_CLIENT_INFO_B64ENCODED,
                lastUpdatedAt: Date.now().toString(),
            };

            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation(
                (
                    urlNavigate: string,
                    options: NavigationOptions
                ): Promise<boolean> => {
                    expect(urlNavigate).toContain(
                        `logout_hint=${encodeURIComponent(logoutHint)}`
                    );
                    expect(urlNavigate).not.toContain(
                        `logout_hint=${encodeURIComponent(loginHint)}`
                    );
                    done();
                    return Promise.resolve(true);
                }
            );
            browserStorage
                .setAccount(testAccount, TEST_CONFIG.CORRELATION_ID, true, 0)
                .then(() =>
                    redirectClient.logout({
                        account: testAccountInfo,
                        logoutHint: logoutHint,
                    })
                );
        });

        it("errors thrown are cached for telemetry and logout failure event is raised", (done) => {
            // Enable server telemetry so cacheFailedRequest writes to storage
            //@ts-ignore
            redirectClient.config.system.serverTelemetryEnabled = true;
            const testError = createBrowserAuthError(
                BrowserAuthErrorCodes.emptyNavigateUri
            );
            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation((): Promise<boolean> => {
                return Promise.reject(testError);
            });
            const eventSpy = jest.spyOn(EventHandler.prototype, "emitEvent");
            const telemetrySpy = jest.spyOn(
                ServerTelemetryManager.prototype,
                "cacheFailedRequest"
            );
            redirectClient.logout().catch((e) => {
                expect(e).toMatchObject(testError);
                expect(telemetrySpy).toHaveBeenCalledWith(testError);
                expect(eventSpy).toHaveBeenCalledWith(
                    EventType.LOGOUT_FAILURE,
                    TEST_CONFIG.CORRELATION_ID,
                    InteractionType.Redirect,
                    null,
                    testError
                );
                done();
            });
        });

        it("unexpected non-msal error does not add correlationId", (done) => {
            const testError = {
                errorCode: "Unexpected error",
                errorDesc: "Unexpected error",
            };
            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation((): Promise<boolean> => {
                return Promise.reject(testError);
            });
            redirectClient.logout().catch((e) => {
                expect(e).toMatchObject(testError);
                expect(e).not.toHaveProperty("correlationId");
                done();
            });
        });

        it("clears active account entry from the cache", async () => {
            const testAccountEntity =
                buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);
            const testAccountInfo: AccountInfo = updateAccountTenantProfileData(
                AccountEntityUtils.getAccountInfo(testAccountEntity),
                undefined,
                ID_TOKEN_CLAIMS,
                TEST_TOKENS.IDTOKEN_V2
            );
            const testIdToken: IdTokenEntity = buildIdToken(
                ID_TOKEN_CLAIMS,
                TEST_TOKENS.IDTOKEN_V2,
                { clientId: TEST_CONFIG.MSAL_CLIENT_ID }
            );

            const validatedLogoutRequest: CommonEndSessionRequest = {
                correlationId: RANDOM_TEST_GUID,
                postLogoutRedirectUri: TEST_URIS.TEST_REDIR_URI,
                account: testAccountInfo,
            };

            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation(
                (
                    urlNavigate: string,
                    options: NavigationOptions
                ): Promise<boolean> => {
                    return Promise.resolve(true);
                }
            );

            await browserStorage.setAccount(
                testAccountEntity,
                TEST_CONFIG.CORRELATION_ID,
                true,
                0
            );
            await browserStorage.setIdTokenCredential(
                testIdToken,
                TEST_CONFIG.CORRELATION_ID,
                true
            );

            pca.setActiveAccount(testAccountInfo);
            expect(pca.getActiveAccount()).toStrictEqual(testAccountInfo);

            await redirectClient.logout(validatedLogoutRequest).then(() => {
                expect(pca.getActiveAccount()).toBe(null);
                expect(pca.getAllAccounts().length).toBe(0);
            });
        });

        describe("onRedirectNavigate tests", () => {
            let pca2: PublicClientApplication,
                pca3: PublicClientApplication,
                redirectClient2: RedirectClient,
                redirectClient3: RedirectClient,
                browserStorage2: BrowserCacheManager,
                browserStorage3: BrowserCacheManager;
            beforeEach(async () => {
                const onRedirectNavigateFalse = (url: string) => {
                    expect(url).toEqual(testLogoutUrl);
                    return false;
                };
                pca2 = new PublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        onRedirectNavigate: onRedirectNavigateFalse,
                    },
                    telemetry: {
                        application: {
                            appName: TEST_CONFIG.applicationName,
                            appVersion: TEST_CONFIG.applicationVersion,
                        },
                    },
                });

                await pca2.initialize();
                pca2 = (pca2 as any).controller;
                // @ts-ignore
                redirectClient2 = new RedirectClient(
                    //@ts-ignore
                    pca2.config,
                    //@ts-ignore
                    pca2.browserStorage,
                    //@ts-ignore
                    pca2.browserCrypto,
                    //@ts-ignore
                    pca2.logger,
                    //@ts-ignore
                    pca2.eventHandler,
                    //@ts-ignore
                    pca2.navigationClient,
                    //@ts-ignore
                    pca2.performanceClient,
                    //@ts-ignore
                    pca2.nativeInternalStorage
                );

                // @ts-ignore
                browserStorage2 = pca2.browserStorage;

                const onRedirectNavigateTrue = (url: string) => {
                    expect(url).toEqual(testLogoutUrl);
                    return true;
                };
                pca3 = new PublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        onRedirectNavigate: onRedirectNavigateTrue,
                    },
                    telemetry: {
                        application: {
                            appName: TEST_CONFIG.applicationName,
                            appVersion: TEST_CONFIG.applicationVersion,
                        },
                    },
                });

                await pca3.initialize();
                pca3 = (pca3 as any).controller;
                // @ts-ignore
                redirectClient3 = new RedirectClient(
                    //@ts-ignore
                    pca3.config,
                    //@ts-ignore
                    pca3.browserStorage,
                    //@ts-ignore
                    pca3.browserCrypto,
                    //@ts-ignore
                    pca3.logger,
                    //@ts-ignore
                    pca3.eventHandler,
                    //@ts-ignore
                    pca3.navigationClient,
                    //@ts-ignore
                    pca3.performanceClient,
                    //@ts-ignore
                    pca3.nativeInternalStorage
                );

                // @ts-ignore
                browserStorage3 = pca3.browserStorage;
            });

            it("doesnt navigate if onRedirectNavigate returns false", (done) => {
                const logoutUriSpy = jest
                    .spyOn(AuthorizationCodeClient.prototype, "getLogoutUri")
                    .mockReturnValue(testLogoutUrl);

                jest.spyOn(
                    NavigationClient.prototype,
                    "navigateExternal"
                ).mockImplementation(
                    (
                        urlNavigate: string,
                        options: NavigationOptions
                    ): Promise<boolean> => {
                        done(
                            "Navigation should not happen if onRedirectNavigate returns false"
                        );
                        return Promise.reject();
                    }
                );

                browserStorage2.setInteractionInProgress(true);

                redirectClient2
                    .logout({ correlationId: RANDOM_TEST_GUID })
                    .then(() => {
                        expect(
                            browserStorage2.getInteractionInProgress()
                        ).toBeFalsy();

                        const validatedLogoutRequest: CommonEndSessionRequest =
                            {
                                correlationId: RANDOM_TEST_GUID,
                                postLogoutRedirectUri: TEST_URIS.TEST_REDIR_URI,
                            };
                        expect(logoutUriSpy).toHaveBeenCalledWith(
                            expect.objectContaining(validatedLogoutRequest)
                        );
                        done();
                    });
            });

            it("doesnt navigate if onRedirectNavigate returns false (specific account)", (done) => {
                const testAccountInfo: AccountInfo = {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                    environment: "login.windows.net",
                    tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                    username: "AbeLi@microsoft.com",
                    loginHint: "loginHint",
                };

                const testAccount: AccountEntity = {
                    homeAccountId: testAccountInfo.homeAccountId,
                    localAccountId: testAccountInfo.localAccountId,
                    environment: testAccountInfo.environment,
                    realm: testAccountInfo.tenantId,
                    username: testAccountInfo.username,
                    name: testAccountInfo.name,
                    authorityType: "MSSTS",
                    clientInfo:
                        TEST_DATA_CLIENT_INFO.TEST_CLIENT_INFO_B64ENCODED,
                    lastUpdatedAt: Date.now().toString(),
                };

                const logoutUriSpy = jest
                    .spyOn(AuthorizationCodeClient.prototype, "getLogoutUri")
                    .mockReturnValue(testLogoutUrl);

                jest.spyOn(
                    NavigationClient.prototype,
                    "navigateExternal"
                ).mockImplementation(
                    (
                        urlNavigate: string,
                        options: NavigationOptions
                    ): Promise<boolean> => {
                        done(
                            "Navigation should not happen if onRedirectNavigate returns false"
                        );
                        return Promise.reject();
                    }
                );

                browserStorage2.setInteractionInProgress(true);
                browserStorage2
                    .setAccount(
                        testAccount,
                        TEST_CONFIG.CORRELATION_ID,
                        true,
                        0
                    )
                    .then(() =>
                        redirectClient2
                            .logout({
                                account: testAccountInfo,
                                correlationId: RANDOM_TEST_GUID,
                            })
                            .then(() => {
                                expect(
                                    browserStorage2.getInteractionInProgress()
                                ).toBeFalsy();

                                const validatedLogoutRequest: CommonEndSessionRequest =
                                    {
                                        correlationId: RANDOM_TEST_GUID,
                                        postLogoutRedirectUri:
                                            TEST_URIS.TEST_REDIR_URI,
                                    };
                                expect(logoutUriSpy).toHaveBeenCalledWith(
                                    expect.objectContaining(
                                        validatedLogoutRequest
                                    )
                                );
                                done();
                            })
                    );
            });

            it("does navigate if onRedirectNavigate returns true", (done) => {
                const logoutUriSpy = jest
                    .spyOn(AuthorizationCodeClient.prototype, "getLogoutUri")
                    .mockReturnValue(testLogoutUrl);

                jest.spyOn(
                    NavigationClient.prototype,
                    "navigateExternal"
                ).mockImplementation(
                    (
                        urlNavigate: string,
                        options: NavigationOptions
                    ): Promise<boolean> => {
                        expect(
                            browserStorage.getInteractionInProgress()
                        ).toBeTruthy();
                        expect(urlNavigate).toEqual(testLogoutUrl);
                        return Promise.resolve(true);
                    }
                );

                browserStorage3.setInteractionInProgress(true);

                redirectClient
                    .logout({ correlationId: RANDOM_TEST_GUID })
                    .then(() => {
                        expect(
                            browserStorage3.getInteractionInProgress()
                        ).toBeTruthy();
                        browserStorage3.setInteractionInProgress(false);

                        const validatedLogoutRequest: CommonEndSessionRequest =
                            {
                                correlationId: RANDOM_TEST_GUID,
                                postLogoutRedirectUri: TEST_URIS.TEST_REDIR_URI,
                            };
                        expect(logoutUriSpy).toHaveBeenCalledWith(
                            expect.objectContaining(validatedLogoutRequest)
                        );
                        done();
                    });
            });

            it("does navigate if onRedirectNavigate returns true (specific account)", (done) => {
                const testAccountInfo: AccountInfo = {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                    environment: "login.windows.net",
                    tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                    username: "AbeLi@microsoft.com",
                    loginHint: "loginHint",
                };

                const testAccount: AccountEntity = {
                    homeAccountId: testAccountInfo.homeAccountId,
                    localAccountId: testAccountInfo.localAccountId,
                    environment: testAccountInfo.environment,
                    realm: testAccountInfo.tenantId,
                    username: testAccountInfo.username,
                    name: testAccountInfo.name,
                    authorityType: "MSSTS",
                    clientInfo:
                        TEST_DATA_CLIENT_INFO.TEST_CLIENT_INFO_B64ENCODED,
                    lastUpdatedAt: Date.now().toString(),
                };

                const logoutUriSpy = jest
                    .spyOn(AuthorizationCodeClient.prototype, "getLogoutUri")
                    .mockReturnValue(testLogoutUrl);

                jest.spyOn(
                    NavigationClient.prototype,
                    "navigateExternal"
                ).mockImplementation(
                    (
                        urlNavigate: string,
                        options: NavigationOptions
                    ): Promise<boolean> => {
                        expect(urlNavigate).toEqual(testLogoutUrl);
                        return Promise.resolve(true);
                    }
                );

                browserStorage3.setInteractionInProgress(true);
                browserStorage3
                    .setAccount(
                        testAccount,
                        TEST_CONFIG.CORRELATION_ID,
                        true,
                        0
                    )
                    .then(() =>
                        redirectClient3
                            .logout({
                                account: testAccountInfo,
                                correlationId: RANDOM_TEST_GUID,
                            })
                            .then(() => {
                                expect(
                                    browserStorage3.getInteractionInProgress()
                                ).toBeTruthy();
                                browserStorage3.setInteractionInProgress(false);

                                const validatedLogoutRequest: CommonEndSessionRequest =
                                    {
                                        correlationId: RANDOM_TEST_GUID,
                                        postLogoutRedirectUri:
                                            TEST_URIS.TEST_REDIR_URI,
                                    };
                                expect(logoutUriSpy).toHaveBeenCalledWith(
                                    expect.objectContaining(
                                        validatedLogoutRequest
                                    )
                                );
                                done();
                            })
                    );
            });
        });
    });

    describe("initiateAuthRequest()", () => {
        it("throws error if requestUrl is empty", (done) => {
            redirectClient.initiateAuthRequest("").catch((e) => {
                expect(e).toBeInstanceOf(BrowserAuthError);
                expect(e.errorCode).toEqual(
                    BrowserAuthErrorCodes.emptyNavigateUri
                );
                done();
            });
        });

        it("navigates browser window to given window location", (done) => {
            const navigationClient = new NavigationClient();
            navigationClient.navigateExternal = (
                requestUrl: string,
                options: NavigationOptions
            ): Promise<boolean> => {
                expect(requestUrl).toEqual(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
                expect(options.timeout).toEqual(30000);
                done();
                return Promise.resolve(true);
            };

            //@ts-ignore
            redirectClient.navigationClient = navigationClient;

            redirectClient.initiateAuthRequest(
                TEST_URIS.TEST_ALTERNATE_REDIR_URI
            );
        });

        it("doesnt navigate if onRedirectNavigate returns false", (done) => {
            const onRedirectNavigate = (url: string) => {
                expect(url).toEqual(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
                done();
                return false;
            };

            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    onRedirectNavigate: onRedirectNavigate,
                },
                telemetry: {
                    application: {
                        appName: TEST_CONFIG.applicationName,
                        appVersion: TEST_CONFIG.applicationVersion,
                    },
                },
            });

            pca.initialize().then(() => {
                pca = (pca as any).controller;
                // @ts-ignore
                redirectClient = new RedirectClient(
                    //@ts-ignore
                    pca.config,
                    //@ts-ignore
                    pca.browserStorage,
                    //@ts-ignore
                    pca.browserCrypto,
                    //@ts-ignore
                    pca.logger,
                    //@ts-ignore
                    pca.eventHandler,
                    //@ts-ignore
                    pca.navigationClient,
                    //@ts-ignore
                    pca.performanceClient,
                    //@ts-ignore
                    pca.nativeInternalStorage
                );
                const navigationClient = new NavigationClient();
                navigationClient.navigateExternal = (
                    urlNavigate: string,
                    options: NavigationOptions
                ): Promise<boolean> => {
                    done(
                        "Navigatation should not happen if onRedirectNavigate returns false"
                    );
                    return Promise.reject();
                };

                redirectClient.initiateAuthRequest(
                    TEST_URIS.TEST_ALTERNATE_REDIR_URI
                );
            });
        });

        it("navigates if onRedirectNavigate doesnt return false", (done) => {
            const onRedirectNavigate = (url: string) => {
                expect(url).toEqual(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
            };

            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    onRedirectNavigate: onRedirectNavigate,
                },
                telemetry: {
                    application: {
                        appName: TEST_CONFIG.applicationName,
                        appVersion: TEST_CONFIG.applicationVersion,
                    },
                },
            });

            pca.initialize().then(() => {
                pca = (pca as any).controller;
                // @ts-ignore
                redirectClient = new RedirectClient(
                    //@ts-ignore
                    pca.config,
                    //@ts-ignore
                    pca.browserStorage,
                    //@ts-ignore
                    pca.browserCrypto,
                    //@ts-ignore
                    pca.logger,
                    //@ts-ignore
                    pca.eventHandler,
                    //@ts-ignore
                    pca.navigationClient,
                    //@ts-ignore
                    pca.performanceClient,
                    //@ts-ignore
                    pca.nativeInternalStorage
                );
                const navigationClient = new NavigationClient();
                navigationClient.navigateExternal = (
                    requestUrl,
                    options
                ): Promise<boolean> => {
                    expect(requestUrl).toEqual(
                        TEST_URIS.TEST_ALTERNATE_REDIR_URI
                    );
                    done();
                    return Promise.resolve(true);
                };

                //@ts-ignore
                redirectClient.navigationClient = navigationClient;

                redirectClient.initiateAuthRequest(
                    TEST_URIS.TEST_ALTERNATE_REDIR_URI
                );
            });
        });
    });

    describe("EAR Flow Tests", () => {
        beforeEach(async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    protocolMode: ProtocolMode.EAR,
                    redirectNavigationTimeout: 1000,
                },
            });
            await pca.initialize();

            jest.spyOn(BrowserCrypto, "generateEarKey").mockResolvedValue(
                validEarJWK
            );
        });

        it("Invokes EAR flow when protocolMode is set to EAR", (done) => {
            const validRequest: RedirectRequest = {
                authority: TEST_CONFIG.validAuthority,
                scopes: ["openid", "profile", "offline_access"],
                correlationId: TEST_CONFIG.CORRELATION_ID,
                redirectUri: window.location.href,
                state: TEST_STATE_VALUES.USER_STATE,
                nonce: ID_TOKEN_CLAIMS.nonce,
            };
            jest.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(
                () => {
                    // Supress navigation
                    pca.handleRedirectPromise({
                        hash: `#ear_jwe=${validEarJWE}&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}`,
                    }).then((result) => {
                        expect(result).toEqual(getTestAuthenticationResult());
                        done();
                    });
                }
            );

            pca.acquireTokenRedirect(validRequest).catch(() => {});
        });

        it("EAR flow falls back to Auth Code if service returns code instead of ear_jwe", (done) => {
            const validRequest: RedirectRequest = {
                authority: TEST_CONFIG.validAuthority,
                scopes: ["openid", "profile", "offline_access"],
                correlationId: TEST_CONFIG.CORRELATION_ID,
                redirectUri: window.location.href,
                state: TEST_STATE_VALUES.USER_STATE,
                nonce: ID_TOKEN_CLAIMS.nonce,
            };
            jest.spyOn(ProtocolUtils, "setRequestState").mockReturnValue(
                TEST_STATE_VALUES.TEST_STATE_REDIRECT
            );
            jest.spyOn(
                AuthorizeProtocol,
                "handleResponseCode"
            ).mockResolvedValue(getTestAuthenticationResult());
            jest.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(
                () => {
                    // Supress navigation
                    pca.handleRedirectPromise({
                        hash: `#code=validCode&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}`,
                    }).then((result) => {
                        expect(result).toEqual(getTestAuthenticationResult());
                        done();
                    });
                }
            );

            pca.acquireTokenRedirect(validRequest).catch(() => {});
        });

        it("Throws a timeout error if the form post failed to redirect within the alloted time", async () => {
            const validRequest: RedirectRequest = {
                scopes: ["openid", "profile", "offline_access"],
            };
            const earFormSpy = jest
                .spyOn(HTMLFormElement.prototype, "submit")
                .mockImplementation(() => {
                    // Supress navigation
                });

            await expect(
                pca.acquireTokenRedirect(validRequest)
            ).rejects.toEqual(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.timedOut,
                    "failed_to_redirect"
                )
            );
            expect(earFormSpy).toHaveBeenCalled();
        });
    });
});
