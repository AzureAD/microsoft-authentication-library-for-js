/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccountInfo,
    AuthenticationResult,
    AccountEntity,
    IdTokenEntity,
    AccessTokenEntity,
    TimeUtils,
    CacheManager,
    IPerformanceClient,
    InProgressPerformanceEvent,
    AccountEntityUtils,
    Constants,
} from "@azure/msal-common";
import { PlatformAuthExtensionHandler } from "../../src/broker/nativeBroker/PlatformAuthExtensionHandler.js";
import { ApiId } from "../../src/utils/BrowserConstants.js";
import { PlatformAuthInteractionClient } from "../../src/interaction_client/PlatformAuthInteractionClient.js";
import { PublicClientApplication } from "../../src/app/PublicClientApplication.js";
import {
    ID_TOKEN_CLAIMS,
    RANDOM_TEST_GUID,
    TEST_CONFIG,
    TEST_DATA_CLIENT_INFO,
    TEST_TOKENS,
} from "../utils/StringConstants.js";
import { NavigationClient } from "../../src/navigation/NavigationClient.js";
import {
    BrowserAuthErrorCodes,
    getDefaultErrorMessage,
} from "../../src/error/BrowserAuthError.js";
import {
    NativeAuthError,
    NativeAuthErrorCodes,
} from "../../src/error/NativeAuthError.js";
import { PlatformAuthRequest } from "../../src/broker/nativeBroker/PlatformAuthRequest.js";
import { getDefaultPerformanceClient } from "../utils/TelemetryUtils.js";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import { BrowserPerformanceClient } from "../../src/index.js";
import { buildAccountFromIdTokenClaims, buildIdToken } from "msal-test-utils";
import { version } from "../../src/packageMetadata.js";
import { BrowserConstants } from "../../src/utils/BrowserConstants.js";
import * as NativeStatusCodes from "../../src/broker/nativeBroker/NativeStatusCodes.js";
import { PlatformAuthResponse } from "../../src/broker/nativeBroker/PlatformAuthResponse.js";
import { PlatformAuthDOMHandler } from "../../src/broker/nativeBroker/PlatformAuthDOMHandler.js";

const MOCK_WAM_RESPONSE: PlatformAuthResponse = {
    access_token: TEST_TOKENS.ACCESS_TOKEN,
    id_token: TEST_TOKENS.IDTOKEN_V2,
    scope: "User.Read",
    expires_in: 3600,
    client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
    account: {
        id: "nativeAccountId",
        properties: {},
        userName: "test_username",
    },
    properties: {},
    state: "",
};

const MOCK_WAM_RESPONSE_STRING_EXPIRES_IN: PlatformAuthResponse = {
    access_token: TEST_TOKENS.ACCESS_TOKEN,
    id_token: TEST_TOKENS.IDTOKEN_V2,
    scope: "User.Read",
    expires_in: 3600,
    client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
    account: {
        id: "nativeAccountId",
        properties: {},
        userName: "test_username",
    },
    properties: {},
    state: "",
};

const testAccountEntity: AccountEntity = buildAccountFromIdTokenClaims(
    ID_TOKEN_CLAIMS,
    undefined,
    {
        nativeAccountId: MOCK_WAM_RESPONSE.account.id,
    }
);

const TEST_ACCOUNT_INFO: AccountInfo = {
    ...AccountEntityUtils.getAccountInfo(testAccountEntity),
    idTokenClaims: ID_TOKEN_CLAIMS,
    idToken: TEST_TOKENS.IDTOKEN_V2,
};

const TEST_ID_TOKEN: IdTokenEntity = buildIdToken(
    ID_TOKEN_CLAIMS,
    TEST_TOKENS.IDTOKEN_V2
);

const testAccessTokenEntity: AccessTokenEntity = {
    homeAccountId: `${ID_TOKEN_CLAIMS.oid}.${ID_TOKEN_CLAIMS.tid}`,
    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
    environment: testAccountEntity.environment,
    realm: ID_TOKEN_CLAIMS.tid,
    secret: TEST_TOKENS.ACCESS_TOKEN,
    target: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
    credentialType: Constants.CredentialType.ACCESS_TOKEN,
    tokenType: Constants.AuthenticationScheme.BEARER,
    expiresOn: `${TimeUtils.nowSeconds() + TEST_CONFIG.TOKEN_EXPIRY}`,
    cachedAt: `${TimeUtils.nowSeconds()}`,
    lastUpdatedAt: Date.now().toString(),
};

describe("PlatformAuthInteractionClient Tests", () => {
    let pca: PublicClientApplication;
    let platformAuthInteractionClient: PlatformAuthInteractionClient;
    let platformAuthDOMHandler: PlatformAuthDOMHandler;

    let browserCacheManager: BrowserCacheManager;
    let internalStorage: BrowserCacheManager;

    let wamProvider: PlatformAuthExtensionHandler;
    let postMessageSpy: jest.SpyInstance;
    let mcPort: MessagePort;
    let perfClient: IPerformanceClient;
    let perfMeasurement: InProgressPerformanceEvent;

    beforeEach(async () => {
        pca = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
            telemetry: {
                client: new BrowserPerformanceClient({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    },
                }),
                application: {
                    appName: TEST_CONFIG.applicationName,
                    appVersion: TEST_CONFIG.applicationVersion,
                },
            },
        });

        await pca.initialize();

        //Implementation of PCA was moved to controller.
        pca = (pca as any).controller;
        // @ts-ignore
        perfClient = pca.performanceClient;

        //@ts-ignore
        browserCacheManager = pca.browserStorage;
        //@ts-ignore
        internalStorage = pca.nativeInternalStorage;

        wamProvider = new PlatformAuthExtensionHandler(
            pca.getLogger(),
            2000,
            getDefaultPerformanceClient()
        );

        platformAuthInteractionClient = new PlatformAuthInteractionClient(
            // @ts-ignore
            pca.config,
            // @ts-ignore
            pca.browserStorage,
            // @ts-ignore
            pca.browserCrypto,
            pca.getLogger(),
            // @ts-ignore
            pca.eventHandler,
            // @ts-ignore
            pca.navigationClient,
            ApiId.acquireTokenRedirect,
            perfClient,
            wamProvider,
            "nativeAccountId",
            // @ts-ignore
            pca.nativeInternalStorage,
            RANDOM_TEST_GUID
        );

        postMessageSpy = jest.spyOn(window, "postMessage");
        jest.spyOn(MessageEvent.prototype, "source", "get").mockReturnValue(
            window
        ); // source property not set by jsdom window messaging APIs
        perfMeasurement = perfClient.startMeasurement(
            "test-measurement",
            "test-correlation-id"
        );
    });

    afterEach(() => {
        mcPort && mcPort.close();
        jest.restoreAllMocks();
        sessionStorage.clear();
        localStorage.clear();
    });

    describe("acquireTokensFromInternalCache Tests", () => {
        beforeEach(() => {
            jest.spyOn(
                CacheManager.prototype,
                "getBaseAccountInfo"
            ).mockReturnValue(TEST_ACCOUNT_INFO);

            jest.spyOn(
                CacheManager.prototype,
                "getAccessToken"
            ).mockReturnValue(testAccessTokenEntity);
            jest.spyOn(CacheManager.prototype, "getIdToken").mockReturnValue(
                TEST_ID_TOKEN
            );
            jest.spyOn(
                CacheManager.prototype,
                "readAppMetadataFromCache"
            ).mockReturnValue(null);
            jest.spyOn(
                BrowserCacheManager.prototype,
                "getAccount"
            ).mockReturnValue(testAccountEntity);
        });

        it("Tokens found in cache", async () => {
            const response = await platformAuthInteractionClient.acquireToken({
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
            });
            expect(response.accessToken).toEqual(testAccessTokenEntity.secret);
            expect(response.idToken).toEqual(TEST_ID_TOKEN.secret);
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toEqual(TEST_CONFIG.DEFAULT_SCOPES);
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(TEST_ACCOUNT_INFO);
            expect(response.tokenType).toEqual(
                Constants.AuthenticationScheme.BEARER
            );
        });
    });

    describe("acquireToken Tests", () => {
        it("Extension: acquires token successfully", async () => {
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<PlatformAuthResponse> => {
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            const response = await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
            });
            expect(response.accessToken).toEqual(
                MOCK_WAM_RESPONSE.access_token
            );
            expect(response.idToken).toEqual(MOCK_WAM_RESPONSE.id_token);
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toContain(MOCK_WAM_RESPONSE.scope);
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(TEST_ACCOUNT_INFO);
            expect(response.tokenType).toEqual(
                Constants.AuthenticationScheme.BEARER
            );
        });

        it("Extension: token request contains user input extra params", async () => {
            const sendMessageSpy = jest
                .spyOn(PlatformAuthExtensionHandler.prototype, "sendMessage")
                .mockImplementation((): Promise<PlatformAuthResponse> => {
                    return Promise.resolve(MOCK_WAM_RESPONSE);
                });
            const response = await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
                extraParameters: {
                    testEP1: "testEP1",
                    testEP2: "testEP2",
                },
            });

            expect(sendMessageSpy).toHaveProperty(
                "mock.calls[0][0].extraParameters",
                {
                    telemetry: "MATS",
                    testEP1: "testEP1",
                    testEP2: "testEP2",
                    "x-client-xtra-sku": `${BrowserConstants.MSAL_SKU}|${version},|,|,|`,
                }
            );

            expect(response.accessToken).toEqual(
                MOCK_WAM_RESPONSE.access_token
            );
            expect(response.idToken).toEqual(MOCK_WAM_RESPONSE.id_token);
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toContain(MOCK_WAM_RESPONSE.scope);
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(TEST_ACCOUNT_INFO);
            expect(response.tokenType).toEqual(
                Constants.AuthenticationScheme.BEARER
            );
        });

        it("DOM API: acquires token successfully", async () => {
            platformAuthDOMHandler = new PlatformAuthDOMHandler(
                pca.getLogger(),
                getDefaultPerformanceClient(),
                "test-correlation-id"
            );

            const testInterctionClient = new PlatformAuthInteractionClient(
                // @ts-ignore
                pca.config,
                // @ts-ignore
                pca.browserStorage,
                // @ts-ignore
                pca.browserCrypto,
                pca.getLogger(),
                // @ts-ignore
                pca.eventHandler,
                // @ts-ignore
                pca.navigationClient,
                ApiId.acquireTokenRedirect,
                perfClient,
                platformAuthDOMHandler,
                "nativeAccountId",
                // @ts-ignore
                pca.nativeInternalStorage,
                RANDOM_TEST_GUID
            );

            const sendMessageSpy = jest
                .spyOn(PlatformAuthDOMHandler.prototype, "sendMessage")
                .mockImplementation((): Promise<PlatformAuthResponse> => {
                    return Promise.resolve(MOCK_WAM_RESPONSE);
                });
            const response = await testInterctionClient.acquireToken({
                scopes: ["User.Read"],
                extraParameters: {
                    testEP1: "testEP1",
                    testEP2: "testEP2",
                },
            });

            expect(sendMessageSpy).toHaveProperty(
                "mock.calls[0][0].extraParameters",
                {
                    telemetry: "MATS",
                    testEP1: "testEP1",
                    testEP2: "testEP2",
                    "x-client-xtra-sku": `${BrowserConstants.MSAL_SKU}|${version},|,|,|`,
                }
            );
            expect(response.accessToken).toEqual(
                MOCK_WAM_RESPONSE.access_token
            );
            expect(response.idToken).toEqual(MOCK_WAM_RESPONSE.id_token);
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toContain(MOCK_WAM_RESPONSE.scope);
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(TEST_ACCOUNT_INFO);
            expect(response.tokenType).toEqual(
                Constants.AuthenticationScheme.BEARER
            );
        });

        it("Extension: token request contains user input extra params", async () => {
            const sendMessageSpy = jest
                .spyOn(PlatformAuthExtensionHandler.prototype, "sendMessage")
                .mockImplementation((): Promise<PlatformAuthResponse> => {
                    return Promise.resolve(MOCK_WAM_RESPONSE);
                });
            const response = await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
                extraParameters: {
                    testEP1: "testEP1",
                    testEP2: "testEP2",
                },
            });

            expect(sendMessageSpy).toHaveProperty(
                "mock.calls[0][0].extraParameters",
                {
                    telemetry: "MATS",
                    testEP1: "testEP1",
                    testEP2: "testEP2",
                    "x-client-xtra-sku": `${BrowserConstants.MSAL_SKU}|${version},|,|,|`,
                }
            );

            expect(response.accessToken).toEqual(
                MOCK_WAM_RESPONSE.access_token
            );
            expect(response.idToken).toEqual(MOCK_WAM_RESPONSE.id_token);
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toContain(MOCK_WAM_RESPONSE.scope);
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(TEST_ACCOUNT_INFO);
            expect(response.tokenType).toEqual(
                Constants.AuthenticationScheme.BEARER
            );
        });

        it("DOM API: acquires token successfully", async () => {
            platformAuthDOMHandler = new PlatformAuthDOMHandler(
                pca.getLogger(),
                getDefaultPerformanceClient(),
                "test-correlation-id"
            );

            const testInterctionClient = new PlatformAuthInteractionClient(
                // @ts-ignore
                pca.config,
                // @ts-ignore
                pca.browserStorage,
                // @ts-ignore
                pca.browserCrypto,
                pca.getLogger(),
                // @ts-ignore
                pca.eventHandler,
                // @ts-ignore
                pca.navigationClient,
                ApiId.acquireTokenRedirect,
                perfClient,
                platformAuthDOMHandler,
                "nativeAccountId",
                // @ts-ignore
                pca.nativeInternalStorage,
                RANDOM_TEST_GUID
            );

            const sendMessageSpy = jest
                .spyOn(PlatformAuthDOMHandler.prototype, "sendMessage")
                .mockImplementation((): Promise<PlatformAuthResponse> => {
                    return Promise.resolve(MOCK_WAM_RESPONSE);
                });
            const response = await testInterctionClient.acquireToken({
                scopes: ["User.Read"],
                extraParameters: {
                    testEP1: "testEP1",
                    testEP2: "testEP2",
                },
            });

            expect(sendMessageSpy).toHaveProperty(
                "mock.calls[0][0].extraParameters",
                {
                    telemetry: "MATS",
                    testEP1: "testEP1",
                    testEP2: "testEP2",
                    "x-client-xtra-sku": `${BrowserConstants.MSAL_SKU}|${version},|,|,|`,
                }
            );
            expect(response.accessToken).toEqual(
                MOCK_WAM_RESPONSE.access_token
            );
            expect(response.idToken).toEqual(MOCK_WAM_RESPONSE.id_token);
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toContain(MOCK_WAM_RESPONSE.scope);
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(TEST_ACCOUNT_INFO);
            expect(response.tokenType).toEqual(
                Constants.AuthenticationScheme.BEARER
            );
        });

        it("Extension: token request contains user input extra params", async () => {
            const sendMessageSpy = jest
                .spyOn(PlatformAuthExtensionHandler.prototype, "sendMessage")
                .mockImplementation((): Promise<PlatformAuthResponse> => {
                    return Promise.resolve(MOCK_WAM_RESPONSE);
                });
            const response = await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
                extraParameters: {
                    testEP1: "testEP1",
                    testEP2: "testEP2",
                },
            });

            expect(sendMessageSpy).toHaveProperty(
                "mock.calls[0][0].extraParameters",
                {
                    telemetry: "MATS",
                    testEP1: "testEP1",
                    testEP2: "testEP2",
                    "x-client-xtra-sku": `${BrowserConstants.MSAL_SKU}|${version},|,|,|`,
                }
            );

            expect(response.accessToken).toEqual(
                MOCK_WAM_RESPONSE.access_token
            );
            expect(response.idToken).toEqual(MOCK_WAM_RESPONSE.id_token);
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toContain(MOCK_WAM_RESPONSE.scope);
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(TEST_ACCOUNT_INFO);
            expect(response.tokenType).toEqual(
                Constants.AuthenticationScheme.BEARER
            );
        });

        it("DOM API: acquires token successfully", async () => {
            platformAuthDOMHandler = new PlatformAuthDOMHandler(
                pca.getLogger(),
                getDefaultPerformanceClient(),
                "test-correlation-id"
            );

            const testInterctionClient = new PlatformAuthInteractionClient(
                // @ts-ignore
                pca.config,
                // @ts-ignore
                pca.browserStorage,
                // @ts-ignore
                pca.browserCrypto,
                pca.getLogger(),
                // @ts-ignore
                pca.eventHandler,
                // @ts-ignore
                pca.navigationClient,
                ApiId.acquireTokenRedirect,
                perfClient,
                platformAuthDOMHandler,
                "nativeAccountId",
                // @ts-ignore
                pca.nativeInternalStorage,
                RANDOM_TEST_GUID
            );

            const sendMessageSpy = jest
                .spyOn(PlatformAuthDOMHandler.prototype, "sendMessage")
                .mockImplementation((): Promise<PlatformAuthResponse> => {
                    return Promise.resolve(MOCK_WAM_RESPONSE);
                });
            const response = await testInterctionClient.acquireToken({
                scopes: ["User.Read"],
                extraParameters: {
                    testEP1: "testEP1",
                    testEP2: "testEP2",
                },
            });

            expect(sendMessageSpy).toHaveProperty(
                "mock.calls[0][0].extraParameters",
                {
                    telemetry: "MATS",
                    testEP1: "testEP1",
                    testEP2: "testEP2",
                    "x-client-xtra-sku": `${BrowserConstants.MSAL_SKU}|${version},|,|,|`,
                }
            );
            expect(response.accessToken).toEqual(
                MOCK_WAM_RESPONSE.access_token
            );
            expect(response.idToken).toEqual(MOCK_WAM_RESPONSE.id_token);
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toContain(MOCK_WAM_RESPONSE.scope);
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(TEST_ACCOUNT_INFO);
            expect(response.tokenType).toEqual(
                Constants.AuthenticationScheme.BEARER
            );
        });

        it("acquires token successfully with string expires_in", async () => {
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<PlatformAuthResponse> => {
                return Promise.resolve(MOCK_WAM_RESPONSE_STRING_EXPIRES_IN);
            });
            const response = await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
            });
            expect(response.accessToken).toEqual(
                MOCK_WAM_RESPONSE.access_token
            );
            expect(response.idToken).toEqual(
                MOCK_WAM_RESPONSE_STRING_EXPIRES_IN.id_token
            );
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toContain(
                MOCK_WAM_RESPONSE_STRING_EXPIRES_IN.scope
            );
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(TEST_ACCOUNT_INFO);
            expect(response.tokenType).toEqual(
                Constants.AuthenticationScheme.BEARER
            );
            expect(response.expiresOn).toBeDefined();
        });

        it("throws if prompt: select_account", (done) => {
            platformAuthInteractionClient
                .acquireToken({
                    scopes: ["User.Read"],
                    prompt: Constants.PromptValue.SELECT_ACCOUNT,
                })
                .catch((e) => {
                    expect(e.errorCode).toBe(
                        BrowserAuthErrorCodes.nativePromptNotSupported
                    );
                    expect(e.errorMessage).toBe(
                        getDefaultErrorMessage(
                            BrowserAuthErrorCodes.nativePromptNotSupported
                        )
                    );
                    done();
                });
        });

        it("throws if prompt: create", (done) => {
            platformAuthInteractionClient
                .acquireToken({
                    scopes: ["User.Read"],
                    prompt: Constants.PromptValue.CREATE,
                })
                .catch((e) => {
                    expect(e.errorCode).toBe(
                        BrowserAuthErrorCodes.nativePromptNotSupported
                    );
                    expect(e.errorMessage).toBe(
                        getDefaultErrorMessage(
                            BrowserAuthErrorCodes.nativePromptNotSupported
                        )
                    );
                    done();
                });
        });

        it("prompt: none succeeds", async () => {
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<PlatformAuthResponse> => {
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            const response = await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
                prompt: Constants.PromptValue.NONE,
            });
            expect(response.accessToken).toEqual(
                MOCK_WAM_RESPONSE.access_token
            );
            expect(response.idToken).toEqual(MOCK_WAM_RESPONSE.id_token);
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toContain(MOCK_WAM_RESPONSE.scope);
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(TEST_ACCOUNT_INFO);
            expect(response.tokenType).toEqual(
                Constants.AuthenticationScheme.BEARER
            );
        });

        it("prompt: consent succeeds", async () => {
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<PlatformAuthResponse> => {
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            const response = await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
                prompt: Constants.PromptValue.CONSENT,
            });
            expect(response.accessToken).toEqual(
                MOCK_WAM_RESPONSE.access_token
            );
            expect(response.idToken).toEqual(MOCK_WAM_RESPONSE.id_token);
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toContain(MOCK_WAM_RESPONSE.scope);
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(TEST_ACCOUNT_INFO);
            expect(response.tokenType).toEqual(
                Constants.AuthenticationScheme.BEARER
            );
        });

        it("prompt: login succeeds", async () => {
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<PlatformAuthResponse> => {
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            const response = await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
                prompt: Constants.PromptValue.LOGIN,
            });
            expect(response.accessToken).toEqual(
                MOCK_WAM_RESPONSE.access_token
            );
            expect(response.idToken).toEqual(MOCK_WAM_RESPONSE.id_token);
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toContain(MOCK_WAM_RESPONSE.scope);
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(TEST_ACCOUNT_INFO);
            expect(response.tokenType).toEqual(
                Constants.AuthenticationScheme.BEARER
            );
        });

        it("does not throw account switch error when homeaccountid is same", (done) => {
            const raw_client_info =
                "eyJ1aWQiOiAiMDAwMDAwMDAtMDAwMC0wMDAwLTY2ZjMtMzMzMmVjYTdlYTgxIiwgInV0aWQiOiIzMzM4MDQwZC02YzY3LTRjNWItYjExMi0zNmEzMDRiNjZkYWQifQ==";

            const mockWamResponse: PlatformAuthResponse = {
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2_ALT,
                scope: "User.Read",
                expires_in: 3600,
                client_info: raw_client_info,
                account: {
                    id: "different-nativeAccountId",
                    properties: {},
                    userName: "test_username",
                },
                properties: {},
                state: "",
            };

            jest.spyOn(
                CacheManager.prototype,
                "getAccountInfoFilteredBy"
            ).mockReturnValue(TEST_ACCOUNT_INFO);

            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<PlatformAuthResponse> => {
                return Promise.resolve(mockWamResponse);
            });
            platformAuthInteractionClient
                .acquireToken({
                    scopes: ["User.Read"],
                })
                .catch((e) => {
                    console.error(
                        "User switch error should not have been thrown."
                    );
                    expect(e.errorCode).not.toBe(
                        NativeAuthErrorCodes.userSwitch
                    );
                    expect(e.errorMessage).not.toBe(
                        getDefaultErrorMessage(NativeAuthErrorCodes.userSwitch)
                    );
                    done();
                });
            done();
        });

        it("throws error on user switch", (done) => {
            const raw_client_info =
                "eyJ1aWQiOiAiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiwgInV0aWQiOiI3MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcifQ==";

            const mockWamResponse: PlatformAuthResponse = {
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2_ALT,
                scope: "User.Read",
                expires_in: 3600,
                client_info: raw_client_info,
                account: {
                    id: "different-nativeAccountId",
                    properties: {},
                    userName: "test_username",
                },
                properties: {},
                state: "",
            };

            jest.spyOn(
                CacheManager.prototype,
                "getAccountInfoFilteredBy"
            ).mockReturnValue(TEST_ACCOUNT_INFO);

            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<PlatformAuthResponse> => {
                return Promise.resolve(mockWamResponse);
            });
            platformAuthInteractionClient
                .acquireToken({
                    scopes: ["User.Read"],
                })
                .catch((e) => {
                    expect(e.errorCode).toBe(NativeAuthErrorCodes.userSwitch);
                    expect(e.errorMessage).toBe(
                        getDefaultErrorMessage(NativeAuthErrorCodes.userSwitch)
                    );
                    done();
                });
        });

        it("does not throw error on user switch for double brokering", (done) => {
            const raw_client_info =
                "eyJ1aWQiOiAiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiwgInV0aWQiOiI3MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcifQ==";

            const mockWamResponse: PlatformAuthResponse = {
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2_ALT,
                scope: "User.Read",
                expires_in: 3600,
                client_info: raw_client_info,
                account: {
                    id: "different-nativeAccountId",
                    properties: {},
                    userName: "test_username",
                },
                properties: {},
                state: "",
            };

            jest.spyOn(
                CacheManager.prototype,
                "getAccountInfoFilteredBy"
            ).mockReturnValue(TEST_ACCOUNT_INFO);

            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<PlatformAuthResponse> => {
                return Promise.resolve(mockWamResponse);
            });

            platformAuthInteractionClient
                .acquireToken({
                    scopes: ["User.Read"],
                    redirectUri: "localhost",
                    extraParameters: {
                        brk_client_id: "broker_client_id",
                        brk_redirect_uri: "https://broker_redirect_uri.com",
                        client_id: "parent_client_id",
                    },
                })
                .catch((e) => {
                    console.error(
                        "User switch error should not have been thrown."
                    );
                    expect(e.errorCode).not.toBe(
                        NativeAuthErrorCodes.userSwitch
                    );
                    expect(e.errorMessage).not.toBe(
                        getDefaultErrorMessage(NativeAuthErrorCodes.userSwitch)
                    );
                    done();
                });
            done();
        });

        it("ssoSilent overwrites prompt to be 'none' and succeeds", async () => {
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation(
                (nativeRequest): Promise<PlatformAuthResponse> => {
                    expect(nativeRequest && nativeRequest.prompt).toBe(
                        Constants.PromptValue.NONE
                    );
                    return Promise.resolve(MOCK_WAM_RESPONSE);
                }
            );
            // @ts-ignore
            const platformAuthInteractionClient =
                new PlatformAuthInteractionClient(
                    // @ts-ignore
                    pca.config,
                    // @ts-ignore
                    pca.browserStorage,
                    // @ts-ignore
                    pca.browserCrypto,
                    // @ts-ignore
                    pca.getLogger(),
                    // @ts-ignore
                    pca.eventHandler,
                    // @ts-ignore
                    pca.navigationClient,
                    ApiId.ssoSilent,
                    // @ts-ignore
                    pca.performanceClient,
                    wamProvider,
                    "nativeAccountId",
                    // @ts-ignore
                    pca.nativeInternalStorage,
                    RANDOM_TEST_GUID
                );
            const response = await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
                prompt: Constants.PromptValue.SELECT_ACCOUNT,
            });
            expect(response.accessToken).toEqual(
                MOCK_WAM_RESPONSE.access_token
            );
            expect(response.idToken).toEqual(MOCK_WAM_RESPONSE.id_token);
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toContain(MOCK_WAM_RESPONSE.scope);
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(TEST_ACCOUNT_INFO);
            expect(response.tokenType).toEqual(
                Constants.AuthenticationScheme.BEARER
            );
        });

        it("acquireTokenSilent overwrites prompt to be 'none' and succeeds", async () => {
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation(
                (nativeRequest): Promise<PlatformAuthResponse> => {
                    expect(nativeRequest && nativeRequest.prompt).toBe(
                        Constants.PromptValue.NONE
                    );
                    return Promise.resolve(MOCK_WAM_RESPONSE);
                }
            );
            // @ts-ignore
            const platformAuthInteractionClient =
                new PlatformAuthInteractionClient(
                    // @ts-ignore
                    pca.config,
                    // @ts-ignore
                    pca.browserStorage,
                    // @ts-ignore
                    pca.browserCrypto,
                    // @ts-ignore
                    pca.getLogger(),
                    // @ts-ignore
                    pca.eventHandler,
                    // @ts-ignore
                    pca.navigationClient,
                    ApiId.acquireTokenSilent_silentFlow,
                    // @ts-ignore
                    pca.performanceClient,
                    wamProvider,
                    "nativeAccountId",
                    // @ts-ignore
                    pca.nativeInternalStorage,
                    RANDOM_TEST_GUID
                );
            const response = await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
                prompt: Constants.PromptValue.SELECT_ACCOUNT,
            });
            expect(response.accessToken).toEqual(
                MOCK_WAM_RESPONSE.access_token
            );
            expect(response.idToken).toEqual(MOCK_WAM_RESPONSE.id_token);
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toContain(MOCK_WAM_RESPONSE.scope);
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(TEST_ACCOUNT_INFO);
            expect(response.tokenType).toEqual(
                Constants.AuthenticationScheme.BEARER
            );
        });

        it("adds MSAL.js SKU to request extra query parameters", async () => {
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((request): Promise<PlatformAuthResponse> => {
                expect(request?.extraParameters!["x-client-xtra-sku"]).toEqual(
                    `${BrowserConstants.MSAL_SKU}|${version},|,|,|`
                );
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
            });
        });

        it("adds MSAL.js and Chrome extension SKUs to request extra query parameters", async () => {
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((request): Promise<PlatformAuthResponse> => {
                expect(request.extraParameters!["x-client-xtra-sku"]).toEqual(
                    `${BrowserConstants.MSAL_SKU}|${version},|,chrome|1.0.2,|`
                );
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });

            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "getExtensionId"
            ).mockReturnValue("ppnbnpeolgkicgegkbkbjmhlideopiji");
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "getExtensionVersion"
            ).mockReturnValue("1.0.2");

            platformAuthInteractionClient = new PlatformAuthInteractionClient(
                // @ts-ignore
                pca.config,
                // @ts-ignore
                pca.browserStorage,
                // @ts-ignore
                pca.browserCrypto,
                pca.getLogger(),
                // @ts-ignore
                pca.eventHandler,
                // @ts-ignore
                pca.navigationClient,
                ApiId.acquireTokenRedirect,
                perfClient,
                wamProvider,
                "nativeAccountId",
                // @ts-ignore
                pca.nativeInternalStorage,
                RANDOM_TEST_GUID
            );

            await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
            });
        });

        it("adds MSAL.js and unknown extension SKUs to request extra query parameters", async () => {
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((request): Promise<PlatformAuthResponse> => {
                expect(request.extraParameters!["x-client-xtra-sku"]).toEqual(
                    `${BrowserConstants.MSAL_SKU}|${version},|,unknown|2.3.4,|`
                );
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });

            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "getExtensionId"
            ).mockReturnValue("random_extension_id");
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "getExtensionVersion"
            ).mockReturnValue("2.3.4");

            platformAuthInteractionClient = new PlatformAuthInteractionClient(
                // @ts-ignore
                pca.config,
                // @ts-ignore
                pca.browserStorage,
                // @ts-ignore
                pca.browserCrypto,
                pca.getLogger(),
                // @ts-ignore
                pca.eventHandler,
                // @ts-ignore
                pca.navigationClient,
                ApiId.acquireTokenRedirect,
                perfClient,
                wamProvider,
                "nativeAccountId",
                // @ts-ignore
                pca.nativeInternalStorage,
                RANDOM_TEST_GUID
            );

            await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
            });
        });

        it("does not set native broker error to server telemetry", async () => {
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((message): Promise<PlatformAuthResponse> => {
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });

            await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
            });
            expect(
                JSON.parse(
                    window.sessionStorage.getItem(
                        `server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`
                    ) || ""
                )
            ).toEqual({
                cacheHits: 0,
                errors: [],
                failedRequests: [],
            });
        });

        it("sets native broker error to server telemetry", async () => {
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((message): Promise<PlatformAuthResponse> => {
                return Promise.reject(
                    new NativeAuthError("test_native_error_code")
                );
            });
            try {
                await platformAuthInteractionClient.acquireToken({
                    scopes: ["User.Read"],
                });
            } catch (e) {}
            expect(
                JSON.parse(
                    window.sessionStorage.getItem(
                        `server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`
                    ) || ""
                )
            ).toEqual({
                cacheHits: 0,
                errors: [],
                failedRequests: [],
                nativeBrokerErrorCode: "test_native_error_code",
            });
        });

        it("resets native broker error in server telemetry", async () => {
            const sendMessageStub = jest
                .spyOn(PlatformAuthExtensionHandler.prototype, "sendMessage")
                .mockImplementation();
            sendMessageStub
                .mockImplementationOnce(
                    (message): Promise<PlatformAuthResponse> => {
                        return Promise.reject(
                            new NativeAuthError(
                                "test_native_error_code",
                                "test_error_desc",
                                { status: NativeStatusCodes.PERSISTENT_ERROR }
                            )
                        );
                    }
                )
                .mockImplementationOnce(
                    (message): Promise<PlatformAuthResponse> => {
                        return Promise.resolve(MOCK_WAM_RESPONSE);
                    }
                );

            try {
                await platformAuthInteractionClient.acquireToken({
                    scopes: ["User.Read"],
                });
            } catch (e) {}
            expect(
                JSON.parse(
                    window.sessionStorage.getItem(
                        `server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`
                    ) || ""
                )
            ).toEqual({
                cacheHits: 0,
                errors: [],
                failedRequests: [],
                nativeBrokerErrorCode: "test_native_error_code",
            });

            await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
            });
            expect(
                JSON.parse(
                    window.sessionStorage.getItem(
                        `server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`
                    ) || ""
                )
            ).toEqual({
                cacheHits: 0,
                errors: [],
                failedRequests: [],
            });
        });

        describe("storeInCache tests", () => {
            //here

            beforeEach(() => {
                jest.spyOn(
                    PlatformAuthExtensionHandler.prototype,
                    "sendMessage"
                ).mockResolvedValue(MOCK_WAM_RESPONSE);
            });

            it("does not store idToken if storeInCache.idToken = false", async () => {
                const response =
                    await platformAuthInteractionClient.acquireToken({
                        scopes: ["User.Read"],
                        storeInCache: {
                            idToken: false,
                        },
                    });
                expect(response.accessToken).toEqual(
                    MOCK_WAM_RESPONSE.access_token
                );
                expect(response.idToken).toEqual(MOCK_WAM_RESPONSE.id_token);

                // Browser Storage should not contain tokens
                const tokenKeys = browserCacheManager.getTokenKeys();
                expect(tokenKeys.idToken).toHaveLength(0);
                expect(tokenKeys.accessToken).toHaveLength(0);
                expect(tokenKeys.refreshToken).toHaveLength(0);

                // Cache should not contain tokens which were turned off
                const internalTokenKeys = internalStorage.getTokenKeys();
                expect(internalTokenKeys.idToken).toHaveLength(0);
                expect(internalTokenKeys.accessToken).toHaveLength(1);
                expect(internalTokenKeys.refreshToken).toHaveLength(0); // RT will never be returned by WAM
            });

            it("does not store accessToken if storeInCache.accessToken = false", async () => {
                const response =
                    await platformAuthInteractionClient.acquireToken({
                        scopes: ["User.Read"],
                        storeInCache: {
                            accessToken: false,
                        },
                    });
                expect(response.accessToken).toEqual(
                    MOCK_WAM_RESPONSE.access_token
                );
                expect(response.idToken).toEqual(MOCK_WAM_RESPONSE.id_token);

                // Cache should not contain tokens which were turned off
                const tokenKeys = browserCacheManager.getTokenKeys();
                expect(tokenKeys.idToken).toHaveLength(0);
                expect(tokenKeys.accessToken).toHaveLength(0);
                expect(tokenKeys.refreshToken).toHaveLength(0);

                // Cache should not contain tokens which were turned off
                const internalTokenKeys = internalStorage.getTokenKeys();
                expect(internalTokenKeys.idToken).toHaveLength(1);
                expect(internalTokenKeys.accessToken).toHaveLength(0);
                expect(internalTokenKeys.refreshToken).toHaveLength(0); // RT will never be returned by WAM
            });

            it("does not store refreshToken if storeInCache.refreshToken = false", async () => {
                const response =
                    await platformAuthInteractionClient.acquireToken({
                        scopes: ["User.Read"],
                        storeInCache: {
                            refreshToken: false,
                        },
                    });
                expect(response.accessToken).toEqual(
                    MOCK_WAM_RESPONSE.access_token
                );
                expect(response.idToken).toEqual(MOCK_WAM_RESPONSE.id_token);

                // Browser Storage should not contain tokens
                const tokenKeys = browserCacheManager.getTokenKeys();
                expect(tokenKeys.idToken).toHaveLength(0);
                expect(tokenKeys.accessToken).toHaveLength(0);
                expect(tokenKeys.refreshToken).toHaveLength(0);

                // Cache should not contain tokens which were turned off
                const internalTokenKeys = internalStorage.getTokenKeys();
                expect(internalTokenKeys.idToken).toHaveLength(1);
                expect(internalTokenKeys.accessToken).toHaveLength(1);
                expect(internalTokenKeys.refreshToken).toHaveLength(0); // RT will never be returned by WAM
            });
        });

        it("includes resource in AuthenticationResult when provided in request", async () => {
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<PlatformAuthResponse> => {
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            const response = await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
                resource: "https://graph.microsoft.com",
            });
            expect(response.resource).toEqual("https://graph.microsoft.com");
        });
    });

    describe("acquireTokenRedirect tests", () => {
        it("acquires token successfully then redirects to start page", (done) => {
            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation((url: string) => {
                expect(url).toBe(window.location.href);
                done();
                return Promise.resolve(true);
            });
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<PlatformAuthResponse> => {
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            platformAuthInteractionClient.acquireTokenRedirect(
                {
                    scopes: ["User.Read"],
                },
                perfMeasurement
            );
        });

        it("emits successful pre-redirect telemetry event", (done) => {
            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation((url: string) => {
                expect(url).toBe(window.location.href);
                return Promise.resolve(true);
            });
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<PlatformAuthResponse> => {
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].success).toBe(true);
                expect(events[0].name).toBe(perfMeasurement.event.name);
                pca.removePerformanceCallback(callbackId);
                done();
            });
            platformAuthInteractionClient.acquireTokenRedirect(
                {
                    scopes: ["User.Read"],
                },
                perfMeasurement
            );
        });

        it("throws if native token acquisition fails with fatal error", (done) => {
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<PlatformAuthResponse> => {
                return Promise.reject(
                    new NativeAuthError(
                        "ContentError",
                        "problem getting response from extension"
                    )
                );
            });
            platformAuthInteractionClient
                .acquireTokenRedirect(
                    { scopes: ["User.Read"] },
                    perfMeasurement
                )
                .catch((e) => {
                    expect(e.errorCode).toBe("ContentError");
                    done();
                });
        });

        it("adds MSAL.js SKU to request extra query parameters", (done) => {
            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation((url: string) => {
                expect(url).toBe(window.location.href);
                done();
                return Promise.resolve(true);
            });
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((request): Promise<PlatformAuthResponse> => {
                expect(request.extraParameters!["x-client-xtra-sku"]).toEqual(
                    `${BrowserConstants.MSAL_SKU}|${version},|,|,|`
                );
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            platformAuthInteractionClient.acquireTokenRedirect(
                {
                    scopes: ["User.Read"],
                },
                perfMeasurement
            );
        });

        it("sets native broker error to server telemetry", (done) => {
            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation((url: string) => {
                expect(url).toBe(window.location.href);
                expect(
                    JSON.parse(
                        window.sessionStorage.getItem(
                            `server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`
                        ) || ""
                    )
                ).toHaveProperty(
                    "nativeBrokerErrorCode",
                    "test_native_error_code"
                );
                done();
                return Promise.resolve(true);
            });
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((message): Promise<PlatformAuthResponse> => {
                return Promise.reject(
                    new NativeAuthError("test_native_error_code")
                );
            });
            platformAuthInteractionClient.acquireTokenRedirect(
                {
                    scopes: ["User.Read"],
                },
                perfMeasurement
            );
        });

        it("resets native broker error in server telemetry", async () => {
            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation((url: string) => {
                return Promise.resolve(true);
            });
            const sendMessageStub = jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            );
            sendMessageStub
                .mockImplementationOnce(
                    (message): Promise<PlatformAuthResponse> => {
                        return Promise.reject(
                            new NativeAuthError(
                                "test_native_error_code",
                                "test_error_desc",
                                { status: NativeStatusCodes.PERSISTENT_ERROR }
                            )
                        );
                    }
                )
                .mockImplementationOnce(
                    (message): Promise<PlatformAuthResponse> => {
                        return Promise.resolve(MOCK_WAM_RESPONSE);
                    }
                )
                .mockImplementationOnce(
                    (message): Promise<PlatformAuthResponse> => {
                        return Promise.resolve(MOCK_WAM_RESPONSE);
                    }
                );

            try {
                await platformAuthInteractionClient.acquireTokenRedirect(
                    {
                        scopes: ["User.Read"],
                    },
                    perfMeasurement
                );
            } catch (e) {}

            expect(
                JSON.parse(
                    window.sessionStorage.getItem(
                        `server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`
                    ) || ""
                )
            ).toEqual({
                cacheHits: 0,
                errors: [],
                failedRequests: [],
                nativeBrokerErrorCode: "test_native_error_code",
            });

            await platformAuthInteractionClient.acquireTokenRedirect(
                {
                    scopes: ["User.Read"],
                },
                perfMeasurement
            );
            // @ts-ignore
            pca.browserStorage.setInteractionInProgress(true);
            await platformAuthInteractionClient.handleRedirectPromise();

            expect(
                JSON.parse(
                    window.sessionStorage.getItem(
                        `server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`
                    ) || ""
                )
            ).toEqual({
                cacheHits: 0,
                errors: [],
                failedRequests: [],
            });
        });
    });

    describe("handleRedirectPromise tests", () => {
        it("successfully returns response from native broker", async () => {
            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation((url: string) => {
                expect(url).toBe(window.location.href);
                return Promise.resolve(true);
            });
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<PlatformAuthResponse> => {
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            // @ts-ignore
            pca.browserStorage.setInteractionInProgress(true);
            await platformAuthInteractionClient.acquireTokenRedirect(
                {
                    scopes: ["User.Read"],
                },
                perfMeasurement
            );
            const response =
                await platformAuthInteractionClient.handleRedirectPromise();
            expect(response).not.toBe(null);

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: TEST_ACCOUNT_INFO.localAccountId,
                tenantId: TEST_ACCOUNT_INFO.tenantId,
                scopes: MOCK_WAM_RESPONSE.scope.split(" "),
                idToken: MOCK_WAM_RESPONSE.id_token,
                idTokenClaims: ID_TOKEN_CLAIMS,
                accessToken: MOCK_WAM_RESPONSE.access_token,
                fromCache: false,
                state: "",
                correlationId: RANDOM_TEST_GUID,
                expiresOn: response && response.expiresOn, // Steal the expires on from the response as this is variable
                account: TEST_ACCOUNT_INFO,
                tokenType: Constants.AuthenticationScheme.BEARER,
                fromPlatformBroker: true,
            };
            expect(response).toEqual(testTokenResponse);
        });

        it("If request includes a prompt value it is ignored on the 2nd call to native broker", async () => {
            // The user should not be prompted twice, prompt value should only be used on the first call to the native broker (before returning to the redirect uri). Native broker calls from handleRedirectPromise should ignore the prompt.
            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation((url: string) => {
                expect(url).toBe(window.location.href);
                return Promise.resolve(true);
            });
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation(
                (
                    request: PlatformAuthRequest
                ): Promise<PlatformAuthResponse> => {
                    expect(request && request.prompt).toBe(undefined);
                    return Promise.resolve(MOCK_WAM_RESPONSE);
                }
            );
            // @ts-ignore
            pca.browserStorage.setInteractionInProgress(true);
            await platformAuthInteractionClient.acquireTokenRedirect(
                {
                    scopes: ["User.Read"],
                    prompt: "login",
                },
                perfMeasurement
            );
            const response =
                await platformAuthInteractionClient.handleRedirectPromise();
            expect(response).not.toBe(null);

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: TEST_ACCOUNT_INFO.localAccountId,
                tenantId: TEST_ACCOUNT_INFO.tenantId,
                scopes: MOCK_WAM_RESPONSE.scope.split(" "),
                idToken: MOCK_WAM_RESPONSE.id_token,
                idTokenClaims: ID_TOKEN_CLAIMS,
                accessToken: MOCK_WAM_RESPONSE.access_token,
                fromCache: false,
                state: "",
                correlationId: RANDOM_TEST_GUID,
                expiresOn: response && response.expiresOn, // Steal the expires on from the response as this is variable
                account: TEST_ACCOUNT_INFO,
                tokenType: Constants.AuthenticationScheme.BEARER,
                fromPlatformBroker: true,
            };
            expect(response).toEqual(testTokenResponse);
        });

        it("returns null if interaction is not in progress", async () => {
            //here

            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation((url: string) => {
                expect(url).toBe(window.location.href);
                return Promise.resolve(true);
            });
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<PlatformAuthResponse> => {
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            await platformAuthInteractionClient.acquireTokenRedirect(
                {
                    scopes: ["User.Read"],
                },
                perfMeasurement
            );
            const response =
                await platformAuthInteractionClient.handleRedirectPromise();
            expect(response).toBe(null);
        });

        it("returns null if native request is not cached", async () => {
            // @ts-ignore
            pca.browserStorage.setInteractionInProgress(true);
            const response =
                await platformAuthInteractionClient.handleRedirectPromise();
            expect(response).toBe(null);
        });
    });

    describe("initializeNativeRequest tests", () => {
        it("pick up default params", async () => {
            const nativeRequest =
                // @ts-ignore
                await platformAuthInteractionClient.initializeNativeRequest({
                    scopes: ["User.Read"],
                    prompt: Constants.PromptValue.LOGIN,
                });

            expect(nativeRequest.clientId).toEqual(TEST_CONFIG.MSAL_CLIENT_ID);
            expect(nativeRequest.redirectUri).toContain("localhost");
        });

        it("pick up broker extra query parameters", async () => {
            const nativeRequest =
                // @ts-ignore
                await platformAuthInteractionClient.initializeNativeRequest({
                    scopes: ["User.Read"],
                    prompt: Constants.PromptValue.LOGIN,
                    redirectUri: "localhost",
                    extraParameters: {
                        brk_client_id: "broker_client_id",
                        brk_redirect_uri: "https://broker_redirect_uri.com",
                        client_id: "parent_client_id",
                    },
                });

            expect(nativeRequest.clientId).toEqual(TEST_CONFIG.MSAL_CLIENT_ID);
            expect(nativeRequest.extraParameters!["child_client_id"]).toEqual(
                "parent_client_id"
            );
            expect(
                nativeRequest.extraParameters!["child_redirect_uri"]
            ).toEqual("localhost");
            expect(nativeRequest.redirectUri).toEqual(
                "https://broker_redirect_uri.com"
            );
        });

        it("pick up user input extra parameters", async () => {
            const nativeRequest =
                // @ts-ignore
                await platformAuthInteractionClient.initializeNativeRequest({
                    scopes: ["User.Read"],
                    prompt: Constants.PromptValue.LOGIN,
                    redirectUri: "localhost",
                    extraParameters: {
                        userEQP1: "customUserParam1",
                        userEQP2: "customUserParam2",
                    },
                });

            expect(nativeRequest.clientId).toEqual(TEST_CONFIG.MSAL_CLIENT_ID);
            expect(nativeRequest.extraParameters!["userEQP1"]).toEqual(
                "customUserParam1"
            );
            expect(nativeRequest.extraParameters!["userEQP2"]).toEqual(
                "customUserParam2"
            );
            expect(nativeRequest.redirectUri).toEqual("localhost");
        });

        it("includes resource in native request when provided", async () => {
            const nativeRequest =
                // @ts-ignore
                await platformAuthInteractionClient.initializeNativeRequest({
                    scopes: ["User.Read"],
                    resource: "https://graph.microsoft.com",
                });

            expect(nativeRequest.resource).toEqual(
                "https://graph.microsoft.com"
            );
        });

        it("merges client capabilities with empty claims", async () => {
            const pcaWithClientCapabilities = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    clientCapabilities: ["CP1", "CP2", "CP3"],
                },
            });
            await pcaWithClientCapabilities.initialize();
            const platformAuthClientWithCapabilities =
                new PlatformAuthInteractionClient(
                    // @ts-ignore
                    (pcaWithClientCapabilities as any).controller.config,
                    // @ts-ignore
                    (
                        pcaWithClientCapabilities as any
                    ).controller.browserStorage,
                    // @ts-ignore
                    (pcaWithClientCapabilities as any).controller.browserCrypto,
                    // @ts-ignore
                    (pcaWithClientCapabilities as any).controller.logger,
                    // @ts-ignore
                    (pcaWithClientCapabilities as any).controller.eventHandler,
                    (
                        pcaWithClientCapabilities as any
                    ).controller.navigationClient,
                    ApiId.acquireTokenSilent_silentFlow,
                    // @ts-ignore
                    (
                        pcaWithClientCapabilities as any
                    ).controller.performanceClient,
                    wamProvider,
                    "nativeAccountId",
                    (
                        pcaWithClientCapabilities as any
                    ).controller.nativeInternalStorage,
                    "correlationId"
                );

            const nativeRequest =
                // @ts-ignore
                await platformAuthClientWithCapabilities.initializeNativeRequest(
                    {
                        scopes: ["User.Read"],
                    }
                );

            expect(nativeRequest.claims).toBeDefined();
            const parsedClaims = JSON.parse(nativeRequest.claims || "");
            expect(parsedClaims.access_token).toBeDefined();
            expect(parsedClaims.access_token.xms_cc).toBeDefined();
            expect(parsedClaims.access_token.xms_cc.values).toEqual([
                "CP1",
                "CP2",
                "CP3",
            ]);
        });

        it("merges client capabilities with existing claims", async () => {
            const pcaWithClientCapabilities = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    clientCapabilities: ["CP1", "CP2", "CP3"],
                },
            });
            await pcaWithClientCapabilities.initialize();
            const platformAuthClientWithCapabilities =
                new PlatformAuthInteractionClient(
                    // @ts-ignore
                    (pcaWithClientCapabilities as any).controller.config,
                    // @ts-ignore
                    (
                        pcaWithClientCapabilities as any
                    ).controller.browserStorage,
                    // @ts-ignore
                    (pcaWithClientCapabilities as any).controller.browserCrypto,
                    // @ts-ignore
                    (pcaWithClientCapabilities as any).controller.logger,
                    // @ts-ignore
                    (pcaWithClientCapabilities as any).controller.eventHandler,
                    (
                        pcaWithClientCapabilities as any
                    ).controller.navigationClient,
                    ApiId.acquireTokenPopup,
                    // @ts-ignore
                    (
                        pcaWithClientCapabilities as any
                    ).controller.performanceClient,
                    platformAuthDOMHandler,
                    "nativeAccountId",
                    (
                        pcaWithClientCapabilities as any
                    ).controller.nativeInternalStorage,
                    "correlationId"
                );

            const existingClaims = JSON.stringify({
                userinfo: {
                    given_name: { essential: true },
                },
            });

            const nativeRequest =
                // @ts-ignore
                await platformAuthClientWithCapabilities.initializeNativeRequest(
                    {
                        scopes: ["User.Read"],
                        claims: existingClaims,
                    }
                );

            expect(nativeRequest.claims).toBeDefined();
            const parsedClaims = JSON.parse(nativeRequest.claims || "");

            // Verify existing claims are preserved
            expect(parsedClaims.userinfo).toBeDefined();
            expect(parsedClaims.userinfo.given_name).toEqual({
                essential: true,
            });

            // Verify client capabilities are added
            expect(parsedClaims.access_token).toBeDefined();
            expect(parsedClaims.access_token.xms_cc).toBeDefined();
            expect(parsedClaims.access_token.xms_cc.values).toEqual([
                "CP1",
                "CP2",
                "CP3",
            ]);
        });

        it("merges client capabilities with existing access_token claims", async () => {
            const pcaWithClientCapabilities = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    clientCapabilities: ["CP1", "CP2", "CP3"],
                },
            });
            await pcaWithClientCapabilities.initialize();
            const platformAuthClientWithCapabilities =
                new PlatformAuthInteractionClient(
                    // @ts-ignore
                    (pcaWithClientCapabilities as any).controller.config,
                    // @ts-ignore
                    (
                        pcaWithClientCapabilities as any
                    ).controller.browserStorage,
                    // @ts-ignore
                    (pcaWithClientCapabilities as any).controller.browserCrypto,
                    // @ts-ignore
                    (pcaWithClientCapabilities as any).controller.logger,
                    // @ts-ignore
                    (pcaWithClientCapabilities as any).controller.eventHandler,
                    (
                        pcaWithClientCapabilities as any
                    ).controller.navigationClient,
                    ApiId.acquireTokenRedirect,
                    // @ts-ignore
                    (
                        pcaWithClientCapabilities as any
                    ).controller.performanceClient,
                    wamProvider,
                    "nativeAccountId",
                    (
                        pcaWithClientCapabilities as any
                    ).controller.nativeInternalStorage,
                    "correlationId"
                );

            const existingClaims = JSON.stringify({
                access_token: {
                    custom_claim: "custom_value",
                },
            });

            const nativeRequest =
                // @ts-ignore
                await platformAuthClientWithCapabilities.initializeNativeRequest(
                    {
                        scopes: ["User.Read"],
                        claims: existingClaims,
                    }
                );

            expect(nativeRequest.claims).toBeDefined();
            const parsedClaims = JSON.parse(nativeRequest.claims || "");

            // Verify existing access_token claims are preserved
            expect(parsedClaims.access_token.custom_claim).toEqual(
                "custom_value"
            );

            // Verify client capabilities are added
            expect(parsedClaims.access_token.xms_cc).toBeDefined();
            expect(parsedClaims.access_token.xms_cc.values).toEqual([
                "CP1",
                "CP2",
                "CP3",
            ]);
        });

        it("does not modify claims when no client capabilities are configured", async () => {
            const existingClaims = JSON.stringify({
                userinfo: {
                    given_name: { essential: true },
                },
            });

            const nativeRequest =
                // @ts-ignore
                await platformAuthInteractionClient.initializeNativeRequest({
                    scopes: ["User.Read"],
                    claims: existingClaims,
                });

            expect(nativeRequest.claims).toEqual(existingClaims);
            const parsedClaims = JSON.parse(nativeRequest.claims || "");
            expect(parsedClaims.access_token).toBeUndefined();
        });

        it("returns undefined claims when no claims or client capabilities are provided", async () => {
            const nativeRequest =
                // @ts-ignore
                await platformAuthInteractionClient.initializeNativeRequest({
                    scopes: ["User.Read"],
                });

            expect(nativeRequest.claims).toBeUndefined();
        });

        it("does not add xms_cc when client capabilities array is empty", async () => {
            const pcaWithEmptyCapabilities = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    clientCapabilities: [],
                },
            });
            await pcaWithEmptyCapabilities.initialize();
            const platformAuthClientWithEmptyCapabilities =
                new PlatformAuthInteractionClient(
                    // @ts-ignore
                    (pcaWithEmptyCapabilities as any).controller.config,
                    // @ts-ignore
                    (pcaWithEmptyCapabilities as any).controller.browserStorage,
                    // @ts-ignore
                    (pcaWithEmptyCapabilities as any).controller.browserCrypto,
                    // @ts-ignore
                    (pcaWithEmptyCapabilities as any).controller.logger,
                    // @ts-ignore
                    (pcaWithEmptyCapabilities as any).controller.eventHandler,
                    (
                        pcaWithEmptyCapabilities as any
                    ).controller.navigationClient,
                    ApiId.acquireTokenRedirect,
                    // @ts-ignore
                    (
                        pcaWithEmptyCapabilities as any
                    ).controller.performanceClient,
                    wamProvider,
                    "nativeAccountId",
                    (
                        pcaWithEmptyCapabilities as any
                    ).controller.nativeInternalStorage,
                    "correlationId"
                );

            const existingClaims = JSON.stringify({
                userinfo: {
                    given_name: { essential: true },
                },
            });

            const nativeRequest =
                // @ts-ignore
                await platformAuthClientWithEmptyCapabilities.initializeNativeRequest(
                    {
                        scopes: ["User.Read"],
                        claims: existingClaims,
                    }
                );

            expect(nativeRequest.claims).toEqual(existingClaims);
            const parsedClaims = JSON.parse(nativeRequest.claims || "");
            expect(parsedClaims.access_token).toBeUndefined();
        });
    });
});
