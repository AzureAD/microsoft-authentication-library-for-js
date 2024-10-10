/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationScheme,
    AccountInfo,
    PromptValue,
    AuthenticationResult,
    AccountEntity,
    IdTokenEntity,
    AccessTokenEntity,
    CredentialType,
    TimeUtils,
    CacheManager,
    Logger,
    CacheRecord,
    AADServerParamKeys,
    IPerformanceClient,
    InProgressPerformanceEvent,
    PerformanceEvents,
} from "@azure/msal-common";
import { NativeMessageHandler } from "../../src/broker/nativeBroker/NativeMessageHandler.js";
import { ApiId } from "../../src/utils/BrowserConstants.js";
import { NativeInteractionClient } from "../../src/interaction_client/NativeInteractionClient.js";
import { PublicClientApplication } from "../../src/app/PublicClientApplication.js";
import {
    ID_TOKEN_CLAIMS,
    RANDOM_TEST_GUID,
    TEST_CONFIG,
    TEST_DATA_CLIENT_INFO,
    TEST_TOKENS,
} from "../utils/StringConstants.js";
import { NavigationClient } from "../../src/navigation/NavigationClient.js";
import { BrowserAuthErrorMessage } from "../../src/error/BrowserAuthError.js";
import {
    NativeAuthError,
    NativeAuthErrorCodes,
    NativeAuthErrorMessages,
} from "../../src/error/NativeAuthError.js";
import { NativeExtensionRequestBody } from "../../src/broker/nativeBroker/NativeRequest.js";
import { getDefaultPerformanceClient } from "../utils/TelemetryUtils.js";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import {
    BrowserPerformanceClient,
    IPublicClientApplication,
} from "../../src/index.js";
import { buildAccountFromIdTokenClaims, buildIdToken } from "msal-test-utils";
import { version } from "../../src/packageMetadata.js";
import { BrowserConstants } from "../../src/utils/BrowserConstants.js";
import * as NativeStatusCodes from "../../src/broker/nativeBroker/NativeStatusCodes.js";

const MOCK_WAM_RESPONSE = {
    access_token: TEST_TOKENS.ACCESS_TOKEN,
    id_token: TEST_TOKENS.IDTOKEN_V2,
    scope: "User.Read",
    expires_in: 3600,
    client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
    account: {
        id: "nativeAccountId",
    },
    properties: {},
};

const testAccountEntity: AccountEntity = buildAccountFromIdTokenClaims(
    ID_TOKEN_CLAIMS,
    undefined,
    {
        nativeAccountId: MOCK_WAM_RESPONSE.account.id,
    }
);

const TEST_ACCOUNT_INFO: AccountInfo = {
    ...testAccountEntity.getAccountInfo(),
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
    credentialType: CredentialType.ACCESS_TOKEN,
    tokenType: AuthenticationScheme.BEARER,
    expiresOn: `${TimeUtils.nowSeconds() + TEST_CONFIG.TOKEN_EXPIRY}`,
    cachedAt: `${TimeUtils.nowSeconds()}`,
};

describe("NativeInteractionClient Tests", () => {
    globalThis.MessageChannel = require("worker_threads").MessageChannel; // jsdom does not include an implementation for MessageChannel

    let pca: PublicClientApplication;
    let nativeInteractionClient: NativeInteractionClient;

    let browserCacheManager: BrowserCacheManager;
    let internalStorage: BrowserCacheManager;

    let wamProvider: NativeMessageHandler;
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

        wamProvider = new NativeMessageHandler(
            pca.getLogger(),
            2000,
            getDefaultPerformanceClient()
        );

        nativeInteractionClient = new NativeInteractionClient(
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
                CacheManager.prototype,
                "readAccountFromCache"
            ).mockReturnValue(testAccountEntity);
        });

        it("Tokens found in cache", async () => {
            const response = await nativeInteractionClient.acquireToken({
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
            expect(response.tokenType).toEqual(AuthenticationScheme.BEARER);
        });
    });

    describe("acquireToken Tests", () => {
        it("acquires token successfully", async () => {
            jest.spyOn(
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<object> => {
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            const response = await nativeInteractionClient.acquireToken({
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
            expect(response.tokenType).toEqual(AuthenticationScheme.BEARER);
        });

        it("throws if prompt: select_account", (done) => {
            nativeInteractionClient
                .acquireToken({
                    scopes: ["User.Read"],
                    prompt: PromptValue.SELECT_ACCOUNT,
                })
                .catch((e) => {
                    expect(e.errorCode).toBe(
                        BrowserAuthErrorMessage.nativePromptNotSupported.code
                    );
                    expect(e.errorMessage).toBe(
                        BrowserAuthErrorMessage.nativePromptNotSupported.desc
                    );
                    done();
                });
        });

        it("throws if prompt: create", (done) => {
            nativeInteractionClient
                .acquireToken({
                    scopes: ["User.Read"],
                    prompt: PromptValue.CREATE,
                })
                .catch((e) => {
                    expect(e.errorCode).toBe(
                        BrowserAuthErrorMessage.nativePromptNotSupported.code
                    );
                    expect(e.errorMessage).toBe(
                        BrowserAuthErrorMessage.nativePromptNotSupported.desc
                    );
                    done();
                });
        });

        it("prompt: none succeeds", async () => {
            jest.spyOn(
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<object> => {
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            const response = await nativeInteractionClient.acquireToken({
                scopes: ["User.Read"],
                prompt: PromptValue.NONE,
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
            expect(response.tokenType).toEqual(AuthenticationScheme.BEARER);
        });

        it("prompt: consent succeeds", async () => {
            jest.spyOn(
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<object> => {
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            const response = await nativeInteractionClient.acquireToken({
                scopes: ["User.Read"],
                prompt: PromptValue.CONSENT,
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
            expect(response.tokenType).toEqual(AuthenticationScheme.BEARER);
        });

        it("prompt: login succeeds", async () => {
            jest.spyOn(
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<object> => {
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            const response = await nativeInteractionClient.acquireToken({
                scopes: ["User.Read"],
                prompt: PromptValue.LOGIN,
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
            expect(response.tokenType).toEqual(AuthenticationScheme.BEARER);
        });

        it("does not throw account switch error when homeaccountid is same", (done) => {
            const mockWamResponse = {
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
                scope: "User.Read",
                expires_in: 3600,
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                account: {
                    id: "different-nativeAccountId",
                },
                properties: {},
            };

            jest.spyOn(
                CacheManager.prototype,
                "getAccountInfoFilteredBy"
            ).mockReturnValue(TEST_ACCOUNT_INFO);

            jest.spyOn(
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<object> => {
                return Promise.resolve(mockWamResponse);
            });
            nativeInteractionClient
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
                        NativeAuthErrorMessages[NativeAuthErrorCodes.userSwitch]
                    );
                    done();
                });
            done();
        });

        it("throws error on user switch", (done) => {
            const raw_client_info =
                "eyJ1aWQiOiAiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiwgInV0aWQiOiI3MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcifQ==";

            const mockWamResponse = {
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2_ALT,
                scope: "User.Read",
                expires_in: 3600,
                client_info: raw_client_info,
                account: {
                    id: "different-nativeAccountId",
                },
                properties: {},
            };

            jest.spyOn(
                CacheManager.prototype,
                "getAccountInfoFilteredBy"
            ).mockReturnValue(TEST_ACCOUNT_INFO);

            jest.spyOn(
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<object> => {
                return Promise.resolve(mockWamResponse);
            });
            nativeInteractionClient
                .acquireToken({
                    scopes: ["User.Read"],
                })
                .catch((e) => {
                    expect(e.errorCode).toBe(NativeAuthErrorCodes.userSwitch);
                    expect(e.errorMessage).toBe(
                        NativeAuthErrorMessages[NativeAuthErrorCodes.userSwitch]
                    );
                    done();
                });
        });

        it("ssoSilent overwrites prompt to be 'none' and succeeds", async () => {
            jest.spyOn(
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation((nativeRequest): Promise<object> => {
                expect(
                    nativeRequest.request && nativeRequest.request.prompt
                ).toBe(PromptValue.NONE);
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            // @ts-ignore
            const nativeInteractionClient = new NativeInteractionClient(
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
            const response = await nativeInteractionClient.acquireToken({
                scopes: ["User.Read"],
                prompt: PromptValue.SELECT_ACCOUNT,
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
            expect(response.tokenType).toEqual(AuthenticationScheme.BEARER);
        });

        it("acquireTokenSilent overwrites prompt to be 'none' and succeeds", async () => {
            jest.spyOn(
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation((nativeRequest): Promise<object> => {
                expect(
                    nativeRequest.request && nativeRequest.request.prompt
                ).toBe(PromptValue.NONE);
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            // @ts-ignore
            const nativeInteractionClient = new NativeInteractionClient(
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
            const response = await nativeInteractionClient.acquireToken({
                scopes: ["User.Read"],
                prompt: PromptValue.SELECT_ACCOUNT,
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
            expect(response.tokenType).toEqual(AuthenticationScheme.BEARER);
        });

        it("adds MSAL.js SKU to request extra query parameters", async () => {
            jest.spyOn(
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation((message): Promise<object> => {
                expect(
                    message.request?.extraParameters!["x-client-xtra-sku"]
                ).toEqual(`${BrowserConstants.MSAL_SKU}|${version},|,|,|`);
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            await nativeInteractionClient.acquireToken({
                scopes: ["User.Read"],
            });
        });

        it("adds MSAL.js and Chrome extension SKUs to request extra query parameters", async () => {
            jest.spyOn(
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation((message): Promise<object> => {
                expect(
                    message.request?.extraParameters!["x-client-xtra-sku"]
                ).toEqual(
                    `${BrowserConstants.MSAL_SKU}|${version},|,chrome|1.0.2,|`
                );
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });

            jest.spyOn(
                NativeMessageHandler.prototype,
                "getExtensionId"
            ).mockReturnValue("ppnbnpeolgkicgegkbkbjmhlideopiji");
            jest.spyOn(
                NativeMessageHandler.prototype,
                "getExtensionVersion"
            ).mockReturnValue("1.0.2");

            nativeInteractionClient = new NativeInteractionClient(
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

            await nativeInteractionClient.acquireToken({
                scopes: ["User.Read"],
            });
        });

        it("adds MSAL.js and unknown extension SKUs to request extra query parameters", async () => {
            jest.spyOn(
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation((message): Promise<object> => {
                expect(
                    message.request?.extraParameters!["x-client-xtra-sku"]
                ).toEqual(
                    `${BrowserConstants.MSAL_SKU}|${version},|,unknown|2.3.4,|`
                );
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });

            jest.spyOn(
                NativeMessageHandler.prototype,
                "getExtensionId"
            ).mockReturnValue("random_extension_id");
            jest.spyOn(
                NativeMessageHandler.prototype,
                "getExtensionVersion"
            ).mockReturnValue("2.3.4");

            nativeInteractionClient = new NativeInteractionClient(
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

            await nativeInteractionClient.acquireToken({
                scopes: ["User.Read"],
            });
        });

        it("does not set native broker error to server telemetry", async () => {
            jest.spyOn(
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation((message): Promise<object> => {
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });

            await nativeInteractionClient.acquireToken({
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
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation((message): Promise<object> => {
                return Promise.reject(
                    new NativeAuthError("test_native_error_code")
                );
            });
            try {
                await nativeInteractionClient.acquireToken({
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
                .spyOn(NativeMessageHandler.prototype, "sendMessage")
                .mockImplementation();
            sendMessageStub
                .mockImplementationOnce((message): Promise<object> => {
                    return Promise.reject(
                        new NativeAuthError(
                            "test_native_error_code",
                            "test_error_desc",
                            { status: NativeStatusCodes.PERSISTENT_ERROR }
                        )
                    );
                })
                .mockImplementationOnce((message): Promise<object> => {
                    return Promise.resolve(MOCK_WAM_RESPONSE);
                });

            try {
                await nativeInteractionClient.acquireToken({
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

            await nativeInteractionClient.acquireToken({
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
                    NativeMessageHandler.prototype,
                    "sendMessage"
                ).mockResolvedValue(MOCK_WAM_RESPONSE);
            });

            it("does not store idToken if storeInCache.idToken = false", async () => {
                const response = await nativeInteractionClient.acquireToken({
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
                const response = await nativeInteractionClient.acquireToken({
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
                const response = await nativeInteractionClient.acquireToken({
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
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<object> => {
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            nativeInteractionClient.acquireTokenRedirect(
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
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<object> => {
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].success).toBe(true);
                expect(events[0].name).toBe(perfMeasurement.event.name);
                pca.removePerformanceCallback(callbackId);
                done();
            });
            nativeInteractionClient.acquireTokenRedirect(
                {
                    scopes: ["User.Read"],
                },
                perfMeasurement
            );
        });

        it("throws if native token acquisition fails with fatal error", (done) => {
            jest.spyOn(
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<object> => {
                return Promise.reject(
                    new NativeAuthError(
                        "ContentError",
                        "problem getting response from extension"
                    )
                );
            });
            nativeInteractionClient
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
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation((message): Promise<object> => {
                expect(
                    message.request?.extraParameters!["x-client-xtra-sku"]
                ).toEqual(`${BrowserConstants.MSAL_SKU}|${version},|,|,|`);
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            nativeInteractionClient.acquireTokenRedirect(
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
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation((message): Promise<object> => {
                return Promise.reject(
                    new NativeAuthError("test_native_error_code")
                );
            });
            nativeInteractionClient.acquireTokenRedirect(
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
                NativeMessageHandler.prototype,
                "sendMessage"
            );
            sendMessageStub
                .mockImplementationOnce((message): Promise<object> => {
                    return Promise.reject(
                        new NativeAuthError(
                            "test_native_error_code",
                            "test_error_desc",
                            { status: NativeStatusCodes.PERSISTENT_ERROR }
                        )
                    );
                })
                .mockImplementationOnce((message): Promise<object> => {
                    return Promise.resolve(MOCK_WAM_RESPONSE);
                })
                .mockImplementationOnce((message): Promise<object> => {
                    return Promise.resolve(MOCK_WAM_RESPONSE);
                });

            try {
                await nativeInteractionClient.acquireTokenRedirect(
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

            await nativeInteractionClient.acquireTokenRedirect(
                {
                    scopes: ["User.Read"],
                },
                perfMeasurement
            );
            // @ts-ignore
            pca.browserStorage.setInteractionInProgress(true);
            await nativeInteractionClient.handleRedirectPromise();

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
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<object> => {
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            // @ts-ignore
            pca.browserStorage.setInteractionInProgress(true);
            await nativeInteractionClient.acquireTokenRedirect(
                {
                    scopes: ["User.Read"],
                },
                perfMeasurement
            );
            const response =
                await nativeInteractionClient.handleRedirectPromise();
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
                state: undefined,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: response && response.expiresOn, // Steal the expires on from the response as this is variable
                account: TEST_ACCOUNT_INFO,
                tokenType: AuthenticationScheme.BEARER,
                fromNativeBroker: true,
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
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation(
                (messageBody: NativeExtensionRequestBody): Promise<object> => {
                    expect(
                        messageBody.request && messageBody.request.prompt
                    ).toBe(undefined);
                    return Promise.resolve(MOCK_WAM_RESPONSE);
                }
            );
            // @ts-ignore
            pca.browserStorage.setInteractionInProgress(true);
            await nativeInteractionClient.acquireTokenRedirect(
                {
                    scopes: ["User.Read"],
                    prompt: "login",
                },
                perfMeasurement
            );
            const response =
                await nativeInteractionClient.handleRedirectPromise();
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
                state: undefined,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: response && response.expiresOn, // Steal the expires on from the response as this is variable
                account: TEST_ACCOUNT_INFO,
                tokenType: AuthenticationScheme.BEARER,
                fromNativeBroker: true,
            };
            expect(response).toEqual(testTokenResponse);
        });

        it("clears interaction in progress if native broker call fails", (done) => {
            //here

            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation((url: string) => {
                expect(url).toBe(window.location.href);
                return Promise.resolve(true);
            });
            let firstTime = true;
            jest.spyOn(
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<object> => {
                if (firstTime) {
                    firstTime = false;
                    return Promise.resolve(MOCK_WAM_RESPONSE); // The acquireTokenRedirect call should succeed
                }
                return Promise.reject(
                    new NativeAuthError("ContentError", "extension call failed")
                ); // handleRedirectPromise call should fail
            });
            // @ts-ignore
            pca.browserStorage.setInteractionInProgress(true);
            nativeInteractionClient
                .acquireTokenRedirect(
                    { scopes: ["User.Read"] },
                    perfMeasurement
                )
                .then(() => {
                    const inProgress =
                        // @ts-ignore
                        pca.browserStorage.getInteractionInProgress();
                    expect(inProgress).toBeTruthy();
                    nativeInteractionClient
                        .handleRedirectPromise()
                        .catch((e) => {
                            expect(e.errorCode).toBe("ContentError");
                            const isInProgress =
                                // @ts-ignore
                                pca.browserStorage.getInteractionInProgress();
                            expect(isInProgress).toBeFalsy();
                            done();
                        });
                });
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
                NativeMessageHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<object> => {
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });
            await nativeInteractionClient.acquireTokenRedirect(
                {
                    scopes: ["User.Read"],
                },
                perfMeasurement
            );
            const response =
                await nativeInteractionClient.handleRedirectPromise();
            expect(response).toBe(null);
        });

        it("returns null if native request is not cached", async () => {
            // @ts-ignore
            pca.browserStorage.setInteractionInProgress(true);
            const response =
                await nativeInteractionClient.handleRedirectPromise();
            expect(response).toBe(null);
        });
    });

    describe("initializeNativeRequest tests", () => {
        it("pick up default params", async () => {
            const nativeRequest =
                // @ts-ignore
                await nativeInteractionClient.initializeNativeRequest({
                    scopes: ["User.Read"],
                    prompt: PromptValue.LOGIN,
                });

            expect(nativeRequest.clientId).toEqual(TEST_CONFIG.MSAL_CLIENT_ID);
            expect(nativeRequest.redirectUri).toContain("localhost");
        });

        it("pick up broker extra query parameters", async () => {
            const nativeRequest =
                // @ts-ignore
                await nativeInteractionClient.initializeNativeRequest({
                    scopes: ["User.Read"],
                    prompt: PromptValue.LOGIN,
                    redirectUri: "localhost",
                    extraQueryParameters: {
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
    });
});
