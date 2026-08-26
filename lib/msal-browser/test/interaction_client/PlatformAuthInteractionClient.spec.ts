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
    AuthError,
} from "@azure/msal-common";
import { PlatformAuthExtensionHandler } from "../../src/broker/nativeBroker/PlatformAuthExtensionHandler.js";
import { ApiId, CacheLookupPolicy } from "../../src/utils/BrowserConstants.js";
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
    createNativeAuthError,
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
import { updateAccountTenantProfileData } from "@azure/msal-common/browser";
import * as BrowserCrypto from "../../src/crypto/BrowserCrypto.js";
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

const TEST_ACCOUNT_INFO: AccountInfo = updateAccountTenantProfileData(
    AccountEntityUtils.getAccountInfo(testAccountEntity),
    undefined,
    ID_TOKEN_CLAIMS,
    TEST_TOKENS.IDTOKEN_V2
);

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
    let mcPort: MessagePort | undefined;
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
        // Freeze Date.now() so timestamp comparisons in toEqual don't fail
        // when a 1-second boundary is crossed during async acquireToken calls.
        jest.spyOn(Date, "now").mockReturnValue(Date.now());
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

        it("clears stale account credentials while preserving the requested caller-owned DPoP partition", async () => {
            const accountKeyPrefix = `${testAccountEntity.homeAccountId}-${testAccountEntity.environment}`;
            const idTokenKey = `${accountKeyPrefix}-id-token`;
            const preservedDpopKey = `${accountKeyPrefix}-preserved-dpop`;
            const staleDpopKey = `${accountKeyPrefix}-stale-dpop`;
            const staleBearerKey = `${accountKeyPrefix}-stale-bearer`;
            const refreshTokenKey = `${accountKeyPrefix}-refresh-token`;
            jest.spyOn(browserCacheManager, "getTokenKeys").mockReturnValue({
                idToken: [idTokenKey],
                accessToken: [preservedDpopKey, staleDpopKey, staleBearerKey],
                refreshToken: [refreshTokenKey],
            });
            jest.spyOn(
                browserCacheManager,
                "getAccessTokenCredential"
            ).mockImplementation((key) => {
                if (key === preservedDpopKey || key === staleDpopKey) {
                    return {
                        ...testAccessTokenEntity,
                        credentialType:
                            Constants.CredentialType
                                .ACCESS_TOKEN_WITH_AUTH_SCHEME,
                        tokenType: Constants.AuthenticationScheme.DPOP,
                        keyId:
                            key === preservedDpopKey
                                ? "caller-dpop-key"
                                : "stale-caller-dpop-key",
                        tokenBindingKeyOwnedByMsal: false,
                    };
                }
                return testAccessTokenEntity;
            });
            const removeAccountContextSpy = jest.spyOn(
                browserCacheManager,
                "removeAccountContext"
            );
            const removeIdTokenSpy = jest.spyOn(
                browserCacheManager,
                "removeIdToken"
            );
            const removeAccessTokenSpy = jest.spyOn(
                browserCacheManager,
                "removeAccessToken"
            );
            const removeRefreshTokenSpy = jest.spyOn(
                browserCacheManager,
                "removeRefreshToken"
            );

            await platformAuthInteractionClient.cacheAccount(
                testAccountEntity,
                false,
                true,
                "caller-dpop-key"
            );

            expect(removeAccountContextSpy).not.toHaveBeenCalled();
            expect(removeIdTokenSpy).toHaveBeenCalledWith(
                idTokenKey,
                RANDOM_TEST_GUID
            );
            expect(removeAccessTokenSpy).toHaveBeenCalledTimes(2);
            expect(removeAccessTokenSpy).toHaveBeenCalledWith(
                staleDpopKey,
                RANDOM_TEST_GUID
            );
            expect(removeAccessTokenSpy).toHaveBeenCalledWith(
                staleBearerKey,
                RANDOM_TEST_GUID
            );
            expect(removeRefreshTokenSpy).toHaveBeenCalledWith(
                refreshTokenKey,
                RANDOM_TEST_GUID
            );
        });

        it("Extension: returns an L3 broker DPoP proof without caching or locally signing it", async () => {
            const cacheLookupSpy = jest.spyOn(
                platformAuthInteractionClient as unknown as {
                    acquireTokensFromCache(
                        nativeAccountId: string,
                        request: PlatformAuthRequest
                    ): Promise<AuthenticationResult>;
                },
                "acquireTokensFromCache"
            );
            const resetKeySpy = jest.spyOn(
                platformAuthInteractionClient as unknown as {
                    resetGeneratedDpopRequestKey(
                        request: PlatformAuthRequest
                    ): Promise<void>;
                },
                "resetGeneratedDpopRequestKey"
            );
            jest.spyOn(
                // @ts-ignore
                platformAuthInteractionClient.tokenBindingKeyManager,
                "provisionTokenBindingKey"
            ).mockResolvedValue("local-dpop-key");
            jest.spyOn(
                // @ts-ignore
                platformAuthInteractionClient.tokenBindingKeyManager,
                "getTokenBindingPublicKeyJwk"
            ).mockResolvedValue({
                kty: "EC",
                crv: "P-256",
                x: "test-x",
                y: "test-y",
            });
            jest.spyOn(
                // @ts-ignore
                platformAuthInteractionClient.tokenBindingKeyManager,
                "removeTokenBindingKey"
            ).mockResolvedValue();
            let brokerRequest: PlatformAuthRequest | undefined;
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((request) => {
                brokerRequest = { ...request };
                return Promise.resolve({
                    ...MOCK_WAM_RESPONSE,
                    token_type: Constants.AuthenticationScheme.DPOP,
                    DPoP: "test-dpop-proof",
                    attested_chosen: true,
                });
            });
            const saveCacheRecordSpy = jest.spyOn(
                internalStorage,
                "saveCacheRecord"
            );
            const removeAccountContextSpy = jest.spyOn(
                browserCacheManager,
                "removeAccountContext"
            );
            const signSpy = jest.spyOn(
                // @ts-ignore
                platformAuthInteractionClient.browserCrypto,
                "signTokenBindingJwt"
            );

            const response = await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
                authenticationScheme: Constants.AuthenticationScheme.DPOP,
                resourceRequestMethod: "POST",
                resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
            });

            expect(brokerRequest).toEqual(
                expect.objectContaining({
                    tokenType: Constants.AuthenticationScheme.DPOP,
                    reqCnf: expect.any(String),
                    keyId: expect.any(String),
                    preferBinding: "attested",
                    resourceRequestMethod: "POST",
                    resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
                })
            );
            expect(response.accessToken).toBe(MOCK_WAM_RESPONSE.access_token);
            expect(response.dpopProof).toBe("test-dpop-proof");
            expect(response.tokenType).toBe(
                Constants.AuthenticationScheme.DPOP
            );
            expect(signSpy).not.toHaveBeenCalled();
            expect(saveCacheRecordSpy).not.toHaveBeenCalled();
            expect(removeAccountContextSpy).not.toHaveBeenCalled();
            expect(cacheLookupSpy).not.toHaveBeenCalled();
            expect(resetKeySpy).toHaveBeenCalled();
        });

        it("Extension: returns a cache miss without scanning DPoP partitions when an access-token-only request has no key", async () => {
            const cacheLookupSpy = jest.spyOn(
                platformAuthInteractionClient as unknown as {
                    acquireTokensFromCache(
                        nativeAccountId: string,
                        request: PlatformAuthRequest
                    ): Promise<AuthenticationResult>;
                },
                "acquireTokensFromCache"
            );
            const sendMessageSpy = jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            );

            await expect(
                platformAuthInteractionClient.acquireToken(
                    {
                        scopes: ["User.Read"],
                        authenticationScheme:
                            Constants.AuthenticationScheme.DPOP,
                        resourceRequestMethod: "POST",
                        resourceRequestUri:
                            "https://graph.microsoft.com/v1.0/me",
                    },
                    CacheLookupPolicy.AccessToken
                )
            ).rejects.toMatchObject({
                errorCode: "token_refresh_required",
            });

            expect(cacheLookupSpy).not.toHaveBeenCalled();
            expect(sendMessageSpy).not.toHaveBeenCalled();
        });

        it("Extension: locally signs an L1 DPoP fallback and removes the generated key without caching", async () => {
            const keyManager =
                // @ts-ignore
                platformAuthInteractionClient.tokenBindingKeyManager;
            jest.spyOn(
                keyManager,
                "provisionTokenBindingKey"
            ).mockResolvedValue("local-dpop-key");
            jest.spyOn(
                keyManager,
                "getTokenBindingPublicKeyJwk"
            ).mockResolvedValue({
                kty: "EC",
                crv: "P-256",
                x: "test-x",
                y: "test-y",
            });
            jest.spyOn(
                // @ts-ignore
                platformAuthInteractionClient.browserCrypto,
                "hashString"
            ).mockResolvedValue("test-ath");
            const signSpy = jest
                .spyOn(
                    // @ts-ignore
                    platformAuthInteractionClient.browserCrypto,
                    "signTokenBindingJwt"
                )
                .mockResolvedValue("local-dpop-proof");
            const sendMessageSpy = jest
                .spyOn(PlatformAuthExtensionHandler.prototype, "sendMessage")
                .mockResolvedValue({
                    ...MOCK_WAM_RESPONSE,
                    token_type: Constants.AuthenticationScheme.DPOP,
                    attested_chosen: false,
                });
            const saveCacheRecordSpy = jest.spyOn(
                internalStorage,
                "saveCacheRecord"
            );
            const removeKeySpy = jest
                .spyOn(keyManager, "removeTokenBindingKey")
                .mockResolvedValue();
            const removeAccountContextSpy = jest.spyOn(
                browserCacheManager,
                "removeAccountContext"
            );

            const response = await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
                authenticationScheme: Constants.AuthenticationScheme.DPOP,
                resourceRequestMethod: "POST",
                resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
            });

            expect(response.accessToken).toBe(MOCK_WAM_RESPONSE.access_token);
            expect(response.dpopProof).toBe("local-dpop-proof");
            expect(response.tokenType).toBe(
                Constants.AuthenticationScheme.DPOP
            );
            expect(signSpy).toHaveBeenCalledTimes(1);
            expect(saveCacheRecordSpy).not.toHaveBeenCalled();
            expect(removeAccountContextSpy).not.toHaveBeenCalled();
            expect(removeKeySpy).toHaveBeenCalledWith(
                "local-dpop-key",
                RANDOM_TEST_GUID
            );
        });

        it("Extension: removes a generated L1 DPoP key when access token caching is disabled", async () => {
            const resetKeySpy = jest.spyOn(
                platformAuthInteractionClient as unknown as {
                    resetGeneratedDpopRequestKey(
                        request: PlatformAuthRequest
                    ): Promise<void>;
                },
                "resetGeneratedDpopRequestKey"
            );
            const keyManager = (
                platformAuthInteractionClient as unknown as {
                    tokenBindingKeyManager: {
                        provisionTokenBindingKey(): Promise<string>;
                        getTokenBindingPublicKeyJwk(): Promise<JsonWebKey>;
                        removeTokenBindingKey(): Promise<void>;
                    };
                }
            ).tokenBindingKeyManager;
            jest.spyOn(
                keyManager,
                "provisionTokenBindingKey"
            ).mockResolvedValue("uncached-dpop-key");
            jest.spyOn(
                keyManager,
                "getTokenBindingPublicKeyJwk"
            ).mockResolvedValue({
                kty: "EC",
                crv: "P-256",
                x: "test-x",
                y: "test-y",
            });
            const removeKeySpy = jest
                .spyOn(keyManager, "removeTokenBindingKey")
                .mockResolvedValue();
            jest.spyOn(
                (
                    platformAuthInteractionClient as unknown as {
                        browserCrypto: {
                            hashString(value: string): Promise<string>;
                        };
                    }
                ).browserCrypto,
                "hashString"
            ).mockResolvedValue("test-ath");
            jest.spyOn(
                (
                    platformAuthInteractionClient as unknown as {
                        browserCrypto: {
                            signTokenBindingJwt(): Promise<string>;
                        };
                    }
                ).browserCrypto,
                "signTokenBindingJwt"
            ).mockResolvedValue("local-dpop-proof");
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockResolvedValue({
                ...MOCK_WAM_RESPONSE,
                token_type: Constants.AuthenticationScheme.DPOP,
                attested_chosen: false,
            });

            await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
                authenticationScheme: Constants.AuthenticationScheme.DPOP,
                resourceRequestMethod: "POST",
                resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
                storeInCache: {
                    accessToken: false,
                },
            });

            expect(removeKeySpy).toHaveBeenCalledWith(
                "uncached-dpop-key",
                RANDOM_TEST_GUID
            );
            expect(resetKeySpy).toHaveBeenCalled();
            expect(internalStorage.getTokenKeys().accessToken).toHaveLength(0);
        });

        it("Extension: defers failed generated-key cleanup without changing the request outcome", async () => {
            const clientInternals =
                platformAuthInteractionClient as unknown as {
                    resetGeneratedDpopRequestKey(
                        request: PlatformAuthRequest
                    ): Promise<void>;
                    prepareDpopBrokerRequest(
                        request: PlatformAuthRequest
                    ): Promise<void>;
                    tokenBindingKeyManager: {
                        provisionTokenBindingKey(): Promise<string>;
                        getTokenBindingPublicKeyJwk(): Promise<JsonWebKey>;
                        removeTokenBindingKey(): Promise<void>;
                    };
                };
            const request = {
                tokenType: Constants.AuthenticationScheme.DPOP,
            } as PlatformAuthRequest;
            jest.spyOn(
                clientInternals.tokenBindingKeyManager,
                "provisionTokenBindingKey"
            ).mockResolvedValue("retry-cleanup-dpop-key");
            jest.spyOn(
                clientInternals.tokenBindingKeyManager,
                "getTokenBindingPublicKeyJwk"
            ).mockResolvedValue({
                kty: "EC",
                crv: "P-256",
                x: "test-x",
                y: "test-y",
            });
            const removeKeySpy = jest
                .spyOn(
                    clientInternals.tokenBindingKeyManager,
                    "removeTokenBindingKey"
                )
                .mockRejectedValueOnce(new Error("temporary failure"))
                .mockResolvedValueOnce();

            await clientInternals.prepareDpopBrokerRequest(request);
            await expect(
                clientInternals.resetGeneratedDpopRequestKey(request)
            ).resolves.toBeUndefined();
            expect(request.keyId).toBeUndefined();
            expect(request.reqCnf).toBeUndefined();

            const nextClient = new PlatformAuthInteractionClient(
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
                RANDOM_TEST_GUID,
                clientInternals.tokenBindingKeyManager
            );
            await (
                nextClient as unknown as {
                    prepareDpopBrokerRequest(
                        request: PlatformAuthRequest
                    ): Promise<void>;
                }
            ).prepareDpopBrokerRequest({
                tokenType: Constants.AuthenticationScheme.BEARER,
            } as PlatformAuthRequest);
            expect(removeKeySpy).toHaveBeenCalledTimes(2);
        });

        it("Extension: isolates generated-key cleanup by key-manager instance", async () => {
            const firstClient = platformAuthInteractionClient as unknown as {
                prepareDpopBrokerRequest(
                    request: PlatformAuthRequest
                ): Promise<void>;
                resetGeneratedDpopRequestKey(
                    request: PlatformAuthRequest
                ): Promise<void>;
                tokenBindingKeyManager: {
                    provisionTokenBindingKey(): Promise<string>;
                    getTokenBindingPublicKeyJwk(): Promise<JsonWebKey>;
                    removeTokenBindingKey(): Promise<void>;
                };
            };
            jest.spyOn(
                firstClient.tokenBindingKeyManager,
                "provisionTokenBindingKey"
            ).mockResolvedValue("shared-opaque-key-id");
            jest.spyOn(
                firstClient.tokenBindingKeyManager,
                "getTokenBindingPublicKeyJwk"
            ).mockResolvedValue({
                kty: "EC",
                crv: "P-256",
                x: "test-x",
                y: "test-y",
            });
            jest.spyOn(
                firstClient.tokenBindingKeyManager,
                "removeTokenBindingKey"
            ).mockRejectedValue(new Error("temporary failure"));
            const firstRequest = {
                tokenType: Constants.AuthenticationScheme.DPOP,
            } as PlatformAuthRequest;
            await firstClient.prepareDpopBrokerRequest(firstRequest);
            await expect(
                firstClient.resetGeneratedDpopRequestKey(firstRequest)
            ).resolves.toBeUndefined();

            const secondKeyManager = {
                provisionTokenBindingKey: jest
                    .fn()
                    .mockResolvedValue("shared-opaque-key-id"),
                getTokenBindingPublicKeyJwk: jest.fn().mockResolvedValue({
                    kty: "EC",
                    crv: "P-256",
                    x: "other-x",
                    y: "other-y",
                }),
                removeTokenBindingKey: jest.fn().mockResolvedValue(undefined),
            };
            const secondClient = new PlatformAuthInteractionClient(
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
                RANDOM_TEST_GUID,
                secondKeyManager
            );

            await (
                secondClient as unknown as {
                    prepareDpopBrokerRequest(
                        request: PlatformAuthRequest
                    ): Promise<void>;
                }
            ).prepareDpopBrokerRequest({
                tokenType: Constants.AuthenticationScheme.BEARER,
            } as PlatformAuthRequest);

            expect(
                secondKeyManager.removeTokenBindingKey
            ).not.toHaveBeenCalled();
        });

        it("Extension: defers generated-key cleanup while another request uses the same key", async () => {
            const clientInternals =
                platformAuthInteractionClient as unknown as {
                    prepareDpopBrokerRequest(
                        request: PlatformAuthRequest
                    ): Promise<void>;
                    resetGeneratedDpopRequestKey(
                        request: PlatformAuthRequest
                    ): Promise<void>;
                    tokenBindingKeyManager: {
                        provisionTokenBindingKey(): Promise<string>;
                        getTokenBindingPublicKeyJwk(): Promise<JsonWebKey>;
                        removeTokenBindingKey(): Promise<void>;
                    };
                };
            jest.spyOn(
                clientInternals.tokenBindingKeyManager,
                "provisionTokenBindingKey"
            ).mockResolvedValue("concurrent-shared-key");
            jest.spyOn(
                clientInternals.tokenBindingKeyManager,
                "getTokenBindingPublicKeyJwk"
            ).mockResolvedValue({
                kty: "EC",
                crv: "P-256",
                x: "test-x",
                y: "test-y",
            });
            const removeKeySpy = jest
                .spyOn(
                    clientInternals.tokenBindingKeyManager,
                    "removeTokenBindingKey"
                )
                .mockResolvedValue();
            const firstRequest = {
                tokenType: Constants.AuthenticationScheme.DPOP,
            } as PlatformAuthRequest;
            const secondRequest = {
                tokenType: Constants.AuthenticationScheme.DPOP,
            } as PlatformAuthRequest;

            await clientInternals.prepareDpopBrokerRequest(firstRequest);
            await clientInternals.prepareDpopBrokerRequest(secondRequest);
            await clientInternals.resetGeneratedDpopRequestKey(firstRequest);
            expect(removeKeySpy).not.toHaveBeenCalled();

            await clientInternals.resetGeneratedDpopRequestKey(secondRequest);
            expect(removeKeySpy).toHaveBeenCalledTimes(1);
            expect(removeKeySpy).toHaveBeenCalledWith(
                "concurrent-shared-key",
                RANDOM_TEST_GUID
            );
        });

        it.each([
            {
                name: "L3 outcome with an empty proof",
                response: {
                    token_type: Constants.AuthenticationScheme.DPOP,
                    DPoP: " ",
                    attested_chosen: true,
                },
            },
            {
                name: "L3 outcome without affirmative attestation",
                response: {
                    token_type: Constants.AuthenticationScheme.DPOP,
                    DPoP: "test-dpop-proof",
                },
            },
            {
                name: "L3 outcome with rejected attestation",
                response: {
                    token_type: Constants.AuthenticationScheme.DPOP,
                    DPoP: "unexpected-proof",
                    attested_chosen: false,
                },
            },
            {
                name: "unknown DPoP token type",
                response: { token_type: "unknown" },
            },
            {
                name: "L1 outcome without an explicit attestation decision",
                response: {
                    token_type: Constants.AuthenticationScheme.DPOP,
                },
            },
            {
                name: "attested L1 fallback",
                response: {
                    token_type: Constants.AuthenticationScheme.DPOP,
                    attested_chosen: true,
                },
            },
            {
                name: "non-string proof",
                response: {
                    token_type: Constants.AuthenticationScheme.DPOP,
                    DPoP: 1 as unknown as string,
                    attested_chosen: true,
                },
            },
            {
                name: "non-string token type",
                response: {
                    token_type: true as unknown as string,
                },
            },
            {
                name: "non-boolean attestation",
                response: {
                    token_type: Constants.AuthenticationScheme.DPOP,
                    attested_chosen: "true" as unknown as boolean,
                },
            },
            {
                name: "non-string binding key identifier",
                response: {
                    token_type: Constants.AuthenticationScheme.DPOP,
                    token_binding_key_id: 1 as unknown as string,
                },
            },
        ])(
            "Extension: rejects malformed $name without mutating cache",
            async ({ response }) => {
                jest.spyOn(
                    // @ts-ignore
                    platformAuthInteractionClient.tokenBindingKeyManager,
                    "provisionTokenBindingKey"
                ).mockResolvedValue("local-dpop-key");
                jest.spyOn(
                    // @ts-ignore
                    platformAuthInteractionClient.tokenBindingKeyManager,
                    "getTokenBindingPublicKeyJwk"
                ).mockResolvedValue({
                    kty: "EC",
                    crv: "P-256",
                    x: "test-x",
                    y: "test-y",
                });
                const sendMessageSpy = jest
                    .spyOn(
                        PlatformAuthExtensionHandler.prototype,
                        "sendMessage"
                    )
                    .mockResolvedValue({
                        ...MOCK_WAM_RESPONSE,
                        ...response,
                    });
                const saveCacheRecordSpy = jest.spyOn(
                    internalStorage,
                    "saveCacheRecord"
                );
                const setAccountSpy = jest.spyOn(
                    browserCacheManager,
                    "setAccount"
                );

                await expect(
                    platformAuthInteractionClient.acquireToken({
                        scopes: ["User.Read"],
                        authenticationScheme:
                            Constants.AuthenticationScheme.DPOP,
                        resourceRequestMethod: "POST",
                        resourceRequestUri:
                            "https://graph.microsoft.com/v1.0/me",
                    })
                ).rejects.toMatchObject({
                    errorCode: "unexpected_error",
                });

                expect(saveCacheRecordSpy).not.toHaveBeenCalled();
                expect(setAccountSpy).not.toHaveBeenCalled();
            }
        );

        it.each([
            {
                name: "broker proof",
                response: { DPoP: "unexpected-proof" },
            },
            {
                name: "token type",
                response: {
                    token_type: Constants.AuthenticationScheme.DPOP,
                },
            },
            {
                name: "attested binding indicator",
                response: { attested_chosen: true },
            },
            {
                name: "token binding key indicator",
                response: {
                    token_binding_key_id: "unexpected-token-binding-key",
                },
            },
        ])(
            "Extension: rejects cross-scheme DPoP $name on a Bearer request",
            async ({ response }) => {
                jest.spyOn(
                    PlatformAuthExtensionHandler.prototype,
                    "sendMessage"
                ).mockResolvedValue({
                    ...MOCK_WAM_RESPONSE,
                    ...response,
                });
                const saveCacheRecordSpy = jest.spyOn(
                    internalStorage,
                    "saveCacheRecord"
                );
                const setAccountSpy = jest.spyOn(
                    browserCacheManager,
                    "setAccount"
                );

                await expect(
                    platformAuthInteractionClient.acquireToken({
                        scopes: ["User.Read"],
                    })
                ).rejects.toMatchObject({
                    errorCode: "unexpected_error",
                });

                expect(saveCacheRecordSpy).not.toHaveBeenCalled();
                expect(setAccountSpy).not.toHaveBeenCalled();
            }
        );

        it.each([
            {
                name: "Bearer",
                authenticationScheme: Constants.AuthenticationScheme.BEARER,
                tokenType: "Bearer",
            },
            {
                name: "POP",
                authenticationScheme: Constants.AuthenticationScheme.POP,
                tokenType: "pop",
            },
        ])(
            "Extension: preserves normal $name responses with a non-DPoP token_type",
            async ({ authenticationScheme, tokenType }) => {
                expect(() =>
                    // @ts-ignore
                    platformAuthInteractionClient.validateDpopBrokerOutcome(
                        {
                            ...MOCK_WAM_RESPONSE,
                            token_type: tokenType,
                        },
                        {
                            tokenType: authenticationScheme,
                        } as PlatformAuthRequest
                    )
                ).not.toThrow();
            }
        );

        it("Extension: accepts a supplied DPoP key only when the configured key manager resolves it", async () => {
            const keyManager =
                // @ts-ignore
                platformAuthInteractionClient.tokenBindingKeyManager;
            const provisionSpy = jest.spyOn(
                keyManager,
                "provisionTokenBindingKey"
            );
            const getPublicKeySpy = jest
                .spyOn(keyManager, "getTokenBindingPublicKeyJwk")
                .mockResolvedValue({
                    kty: "EC",
                    crv: "P-256",
                    x: "test-x",
                    y: "test-y",
                });
            const removeKeySpy = jest.spyOn(
                keyManager,
                "removeTokenBindingKey"
            );
            jest.spyOn(
                // @ts-ignore
                platformAuthInteractionClient.browserCrypto,
                "hashString"
            ).mockResolvedValue("test-ath");
            jest.spyOn(
                // @ts-ignore
                platformAuthInteractionClient.browserCrypto,
                "signTokenBindingJwt"
            ).mockResolvedValue("local-dpop-proof");
            const sendMessageSpy = jest
                .spyOn(PlatformAuthExtensionHandler.prototype, "sendMessage")
                .mockResolvedValue({
                    ...MOCK_WAM_RESPONSE,
                    token_type: Constants.AuthenticationScheme.DPOP,
                    DPoP: "broker-dpop-proof",
                    attested_chosen: true,
                });

            const response = await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
                authenticationScheme: Constants.AuthenticationScheme.DPOP,
                popKid: "existing-msal-key",
                resourceRequestMethod: "POST",
                resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
            });

            expect(provisionSpy).not.toHaveBeenCalled();
            expect(getPublicKeySpy).toHaveBeenCalledWith(
                "existing-msal-key",
                RANDOM_TEST_GUID
            );
            const expectedJkt = await BrowserCrypto.computeJwkThumbprint(
                {
                    kty: "EC",
                    crv: "P-256",
                    x: "test-x",
                    y: "test-y",
                },
                RANDOM_TEST_GUID
            );
            expect(
                JSON.parse(
                    // @ts-ignore
                    platformAuthInteractionClient.browserCrypto.base64Decode(
                        sendMessageSpy.mock.calls[0][0].reqCnf as string
                    )
                )
            ).toEqual({ jkt: expectedJkt });
            expect(expectedJkt).not.toBe("existing-msal-key");
            expect(response.dpopProof).toBe("broker-dpop-proof");
            expect(removeKeySpy).not.toHaveBeenCalled();
        });

        it("Extension: marks a cached caller-supplied DPoP key as caller-owned", async () => {
            const saveCacheRecordSpy = jest.spyOn(
                internalStorage,
                "saveCacheRecord"
            );
            const clientInternals =
                platformAuthInteractionClient as unknown as {
                    prepareDpopBrokerRequest(
                        request: PlatformAuthRequest
                    ): Promise<void>;
                    tokenBindingKeyManager: {
                        provisionTokenBindingKey(): Promise<string>;
                        getTokenBindingPublicKeyJwk(): Promise<JsonWebKey>;
                    };
                };
            jest.spyOn(
                clientInternals.tokenBindingKeyManager,
                "provisionTokenBindingKey"
            ).mockResolvedValue("caller-dpop-key");
            jest.spyOn(
                clientInternals.tokenBindingKeyManager,
                "getTokenBindingPublicKeyJwk"
            ).mockResolvedValue({
                kty: "EC",
                crv: "P-256",
                x: "test-x",
                y: "test-y",
            });
            await clientInternals.prepareDpopBrokerRequest({
                tokenType: Constants.AuthenticationScheme.DPOP,
            } as PlatformAuthRequest);

            await platformAuthInteractionClient.cacheNativeTokens(
                {
                    ...MOCK_WAM_RESPONSE,
                    token_type: Constants.AuthenticationScheme.DPOP,
                    attested_chosen: false,
                },
                {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    correlationId: RANDOM_TEST_GUID,
                    scope: "User.Read",
                    tokenType: Constants.AuthenticationScheme.DPOP,
                    keyId: "caller-dpop-key",
                } as PlatformAuthRequest,
                TEST_ACCOUNT_INFO.homeAccountId,
                ID_TOKEN_CLAIMS,
                TEST_ACCOUNT_INFO.tenantId,
                TimeUtils.nowSeconds(),
                testAccountEntity.environment
            );

            expect(saveCacheRecordSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    accessToken: expect.objectContaining({
                        keyId: "caller-dpop-key",
                        tokenBindingKeyOwnedByMsal: false,
                    }),
                }),
                RANDOM_TEST_GUID,
                false,
                ApiId.acquireTokenRedirect,
                undefined
            );
        });

        it("Extension: preserves DPoP key binding and resource context in cache requests", () => {
            const createSilentCacheRequest = (
                platformAuthInteractionClient as unknown as {
                    createSilentCacheRequest(
                        request: PlatformAuthRequest,
                        account: AccountInfo
                    ): {
                        dpopJkt?: string;
                        resourceRequestMethod?: string;
                        resourceRequestUri?: string;
                    };
                }
            ).createSilentCacheRequest.bind(platformAuthInteractionClient);

            const cacheRequest = createSilentCacheRequest(
                {
                    authority: TEST_CONFIG.validAuthority,
                    correlationId: RANDOM_TEST_GUID,
                    scope: "User.Read",
                    tokenType: Constants.AuthenticationScheme.DPOP,
                    keyId: "caller-dpop-key",
                    resourceRequestMethod: "POST",
                    resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
                } as PlatformAuthRequest,
                TEST_ACCOUNT_INFO
            );

            expect(cacheRequest).toEqual(
                expect.objectContaining({
                    dpopJkt: "caller-dpop-key",
                    resourceRequestMethod: "POST",
                    resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
                })
            );
        });

        it("Extension: rejects an unresolved supplied DPoP key before broker IPC", async () => {
            const keyManager =
                // @ts-ignore
                platformAuthInteractionClient.tokenBindingKeyManager;
            jest.spyOn(
                keyManager,
                "getTokenBindingPublicKeyJwk"
            ).mockRejectedValue(new Error("key not found"));
            const sendMessageSpy = jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            );

            await expect(
                platformAuthInteractionClient.acquireToken({
                    scopes: ["User.Read"],
                    authenticationScheme: Constants.AuthenticationScheme.DPOP,
                    popKid: "external-key",
                    resourceRequestMethod: "POST",
                    resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
                })
            ).rejects.toThrow("key not found");

            expect(sendMessageSpy).not.toHaveBeenCalled();
        });

        it.each([
            {
                resourceRequestMethod: undefined,
                resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
            },
            {
                resourceRequestMethod: "POST",
                resourceRequestUri: undefined,
            },
            {
                resourceRequestMethod: "POST",
                resourceRequestUri: "http://graph.microsoft.com/v1.0/me",
            },
        ])(
            "Extension: rejects invalid DPoP resource context before broker IPC",
            async ({ resourceRequestMethod, resourceRequestUri }) => {
                const sendMessageSpy = jest.spyOn(
                    PlatformAuthExtensionHandler.prototype,
                    "sendMessage"
                );

                await expect(
                    platformAuthInteractionClient.acquireToken({
                        scopes: ["User.Read"],
                        authenticationScheme:
                            Constants.AuthenticationScheme.DPOP,
                        resourceRequestMethod,
                        resourceRequestUri,
                    })
                ).rejects.toBeInstanceOf(AuthError);

                expect(sendMessageSpy).not.toHaveBeenCalled();
            }
        );

        it("Extension: surfaces the broker DPoP proof in the authentication result", async () => {
            jest.spyOn(
                // @ts-ignore
                platformAuthInteractionClient.tokenBindingKeyManager,
                "provisionTokenBindingKey"
            ).mockResolvedValue("local-dpop-key");
            jest.spyOn(
                // @ts-ignore
                platformAuthInteractionClient.tokenBindingKeyManager,
                "getTokenBindingPublicKeyJwk"
            ).mockResolvedValue({
                kty: "EC",
                crv: "P-256",
                x: "test-x",
                y: "test-y",
            });
            jest.spyOn(
                // @ts-ignore
                platformAuthInteractionClient.tokenBindingKeyManager,
                "removeTokenBindingKey"
            ).mockResolvedValue();
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockResolvedValue({
                ...MOCK_WAM_RESPONSE,
                token_type: Constants.AuthenticationScheme.DPOP,
                DPoP: "test-dpop-proof",
                attested_chosen: true,
            });

            const response = await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
                authenticationScheme: Constants.AuthenticationScheme.DPOP,
                resourceRequestMethod: "POST",
                resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
            });

            expect(response.dpopProof).toBe("test-dpop-proof");
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
            // Enable server telemetry so telemetry data is written to storage
            //@ts-ignore
            platformAuthInteractionClient.config.system.serverTelemetryEnabled =
                true;
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
            // Enable server telemetry so telemetry data is written to storage
            //@ts-ignore
            platformAuthInteractionClient.config.system.serverTelemetryEnabled =
                true;
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((message): Promise<PlatformAuthResponse> => {
                return Promise.reject(
                    new NativeAuthError("test_native_error_code", "")
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
            // Enable server telemetry so telemetry data is written to storage
            //@ts-ignore
            platformAuthInteractionClient.config.system.serverTelemetryEnabled =
                true;
            const sendMessageStub = jest
                .spyOn(PlatformAuthExtensionHandler.prototype, "sendMessage")
                .mockImplementation();
            sendMessageStub
                .mockImplementationOnce(
                    (message): Promise<PlatformAuthResponse> => {
                        return Promise.reject(
                            new NativeAuthError(
                                "test_native_error_code",
                                "",
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
                const tokenKeys = internalStorage.getTokenKeys();
                expect(tokenKeys.idToken).toHaveLength(0);
                expect(tokenKeys.accessToken).toHaveLength(0);
                expect(tokenKeys.refreshToken).toHaveLength(0);

                // Cache should not contain tokens which were turned off
                const internalTokenKeys = browserCacheManager.getTokenKeys();
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
                expect(tokenKeys.idToken).toHaveLength(1);
                expect(tokenKeys.accessToken).toHaveLength(0);
                expect(tokenKeys.refreshToken).toHaveLength(0);

                // Cache should not contain tokens which were turned off
                const internalTokenKeys = internalStorage.getTokenKeys();
                expect(internalTokenKeys.idToken).toHaveLength(0);
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

        it("does not mask a successful redirect response when generated-key cleanup fails", async () => {
            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockResolvedValue(true);
            const keyManager = (
                platformAuthInteractionClient as unknown as {
                    tokenBindingKeyManager: {
                        provisionTokenBindingKey(): Promise<string>;
                        getTokenBindingPublicKeyJwk(): Promise<JsonWebKey>;
                        removeTokenBindingKey(): Promise<void>;
                    };
                }
            ).tokenBindingKeyManager;
            jest.spyOn(
                keyManager,
                "provisionTokenBindingKey"
            ).mockResolvedValue("phase-one-dpop-key");
            jest.spyOn(
                keyManager,
                "getTokenBindingPublicKeyJwk"
            ).mockResolvedValue({
                kty: "EC",
                crv: "P-256",
                x: "test-x",
                y: "test-y",
            });
            const removeKeySpy = jest
                .spyOn(keyManager, "removeTokenBindingKey")
                .mockRejectedValueOnce(new Error("temporary cleanup failure"))
                .mockResolvedValue();
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockResolvedValue({
                ...MOCK_WAM_RESPONSE,
                token_type: Constants.AuthenticationScheme.DPOP,
                DPoP: "broker-dpop-proof",
                attested_chosen: true,
            });

            await platformAuthInteractionClient.acquireTokenRedirect(
                {
                    scopes: ["User.Read"],
                    authenticationScheme: Constants.AuthenticationScheme.DPOP,
                    resourceRequestMethod: "POST",
                    resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
                },
                perfMeasurement
            );

            const cachedRequest = browserCacheManager.getCachedNativeRequest();
            expect(cachedRequest?.keyId).toBeUndefined();
            expect(cachedRequest?.reqCnf).toBeUndefined();
            expect(cachedRequest?.resourceRequestMethod).toBe("POST");
            expect(cachedRequest?.resourceRequestUri).toBe(
                "https://graph.microsoft.com/v1.0/me"
            );
            expect(removeKeySpy).toHaveBeenCalledWith(
                "phase-one-dpop-key",
                RANDOM_TEST_GUID
            );
        });

        it("persists a caller-supplied DPoP key across redirect", async () => {
            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockResolvedValue(true);
            const keyManager = (
                platformAuthInteractionClient as unknown as {
                    tokenBindingKeyManager: {
                        getTokenBindingPublicKeyJwk(): Promise<JsonWebKey>;
                        removeTokenBindingKey(): Promise<void>;
                    };
                }
            ).tokenBindingKeyManager;
            jest.spyOn(
                keyManager,
                "getTokenBindingPublicKeyJwk"
            ).mockResolvedValue({
                kty: "EC",
                crv: "P-256",
                x: "test-x",
                y: "test-y",
            });
            const removeKeySpy = jest.spyOn(
                keyManager,
                "removeTokenBindingKey"
            );
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockResolvedValue({
                ...MOCK_WAM_RESPONSE,
                token_type: Constants.AuthenticationScheme.DPOP,
                DPoP: "broker-dpop-proof",
                attested_chosen: true,
            });

            await platformAuthInteractionClient.acquireTokenRedirect(
                {
                    scopes: ["User.Read"],
                    authenticationScheme: Constants.AuthenticationScheme.DPOP,
                    popKid: "caller-dpop-key",
                    resourceRequestMethod: "POST",
                    resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
                },
                perfMeasurement
            );

            const cachedRequest = browserCacheManager.getCachedNativeRequest();
            expect(cachedRequest?.keyId).toBe("caller-dpop-key");
            expect(cachedRequest?.reqCnf).toEqual(expect.any(String));
            expect(removeKeySpy).not.toHaveBeenCalled();
        });

        it("removes a generated DPoP key when redirect request preparation fails", async () => {
            const keyManager = (
                platformAuthInteractionClient as unknown as {
                    tokenBindingKeyManager: {
                        provisionTokenBindingKey(): Promise<string>;
                        getTokenBindingPublicKeyJwk(): Promise<JsonWebKey>;
                        removeTokenBindingKey(): Promise<void>;
                    };
                }
            ).tokenBindingKeyManager;
            jest.spyOn(
                keyManager,
                "provisionTokenBindingKey"
            ).mockResolvedValue("failed-prepare-dpop-key");
            jest.spyOn(
                keyManager,
                "getTokenBindingPublicKeyJwk"
            ).mockRejectedValue(new Error("public key unavailable"));
            const removeKeySpy = jest
                .spyOn(keyManager, "removeTokenBindingKey")
                .mockResolvedValue();
            const sendMessageSpy = jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            );

            await expect(
                platformAuthInteractionClient.acquireTokenRedirect(
                    {
                        scopes: ["User.Read"],
                        authenticationScheme:
                            Constants.AuthenticationScheme.DPOP,
                        resourceRequestMethod: "POST",
                        resourceRequestUri:
                            "https://graph.microsoft.com/v1.0/me",
                    },
                    perfMeasurement
                )
            ).rejects.toThrow("public key unavailable");

            expect(removeKeySpy).toHaveBeenCalledWith(
                "failed-prepare-dpop-key",
                RANDOM_TEST_GUID
            );
            expect(sendMessageSpy).not.toHaveBeenCalled();
        });

        it("continues DPoP redirect after a non-fatal native error without caching the generated key", async () => {
            const navigateSpy = jest
                .spyOn(NavigationClient.prototype, "navigateExternal")
                .mockResolvedValue(true);
            const keyManager = (
                platformAuthInteractionClient as unknown as {
                    tokenBindingKeyManager: {
                        provisionTokenBindingKey(): Promise<string>;
                        getTokenBindingPublicKeyJwk(): Promise<JsonWebKey>;
                        removeTokenBindingKey(): Promise<void>;
                    };
                }
            ).tokenBindingKeyManager;
            jest.spyOn(
                keyManager,
                "provisionTokenBindingKey"
            ).mockResolvedValue("non-fatal-dpop-key");
            jest.spyOn(
                keyManager,
                "getTokenBindingPublicKeyJwk"
            ).mockResolvedValue({
                kty: "EC",
                crv: "P-256",
                x: "test-x",
                y: "test-y",
            });
            const removeKeySpy = jest
                .spyOn(keyManager, "removeTokenBindingKey")
                .mockResolvedValue();
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockRejectedValue(
                new NativeAuthError("test_native_error_code", "")
            );

            await platformAuthInteractionClient.acquireTokenRedirect(
                {
                    scopes: ["User.Read"],
                    authenticationScheme: Constants.AuthenticationScheme.DPOP,
                    resourceRequestMethod: "POST",
                    resourceRequestUri:
                        "https://graph.microsoft.com/v1.0/me?secret=value#part",
                },
                perfMeasurement
            );

            expect(navigateSpy).toHaveBeenCalled();
            expect(removeKeySpy).toHaveBeenCalledWith(
                "non-fatal-dpop-key",
                RANDOM_TEST_GUID
            );
            const cachedRequest = browserCacheManager.getCachedNativeRequest();
            expect(cachedRequest?.keyId).toBeUndefined();
            expect(cachedRequest?.reqCnf).toBeUndefined();
            expect(cachedRequest?.resourceRequestUri).toBe(
                "https://graph.microsoft.com/v1.0/me"
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
                        "",
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
            // Enable server telemetry so telemetry data is written to storage
            //@ts-ignore
            platformAuthInteractionClient.config.system.serverTelemetryEnabled =
                true;
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
                    new NativeAuthError("test_native_error_code", "")
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
            // Enable server telemetry so telemetry data is written to storage
            //@ts-ignore
            platformAuthInteractionClient.config.system.serverTelemetryEnabled =
                true;
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
                                "",
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

        it("navigates to redirectStartPage when provided and navigateToLoginRequestUrl is true", (done) => {
            const redirectStartPage = "https://localhost:3000/startPage";
            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation((url: string) => {
                expect(url).toBe(redirectStartPage);
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
                    redirectStartPage: redirectStartPage,
                },
                perfMeasurement
            );
        });

        it("navigates to window.location.href when redirectStartPage is not provided and navigateToLoginRequestUrl is true", (done) => {
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

        it("retrieves and applies storeInCache directive persisted across the redirect", async () => {
            // storeInCache is not a broker-contract field, so it is persisted alongside the
            // cached native request and must be read back in handleRedirectPromise. This test
            // proves the directive survives the redirect round-trip (cache write -> read).
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
            ).mockResolvedValue(MOCK_WAM_RESPONSE);
            // @ts-ignore
            pca.browserStorage.setInteractionInProgress(true);
            await platformAuthInteractionClient.acquireTokenRedirect(
                {
                    scopes: ["User.Read"],
                    storeInCache: {
                        idToken: false,
                    },
                },
                perfMeasurement
            );

            const response =
                await platformAuthInteractionClient.handleRedirectPromise();
            expect(response).not.toBe(null);
            // The response still surfaces the idToken to the caller...
            expect(response!.idToken).toEqual(MOCK_WAM_RESPONSE.id_token);
            expect(response!.accessToken).toEqual(
                MOCK_WAM_RESPONSE.access_token
            );

            // ...but the storeInCache directive (idToken: false) was honored, so the
            // idToken was NOT written to the cache while the accessToken was.
            const internalTokenKeys = internalStorage.getTokenKeys();
            expect(internalTokenKeys.idToken).toHaveLength(0);
            expect(internalTokenKeys.accessToken).toHaveLength(1);
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

    describe("initializePlatformRequest tests", () => {
        it("pick up default params", async () => {
            const nativeRequest =
                // @ts-ignore
                await platformAuthInteractionClient.initializePlatformRequest({
                    scopes: ["User.Read"],
                    prompt: Constants.PromptValue.LOGIN,
                });

            expect(nativeRequest.clientId).toEqual(TEST_CONFIG.MSAL_CLIENT_ID);
            expect(nativeRequest.redirectUri).toContain("localhost");
        });

        it("pick up broker extra query parameters", async () => {
            const nativeRequest =
                // @ts-ignore
                await platformAuthInteractionClient.initializePlatformRequest({
                    scopes: ["User.Read"],
                    prompt: Constants.PromptValue.LOGIN,
                    redirectUri: "localhost",
                    resource: "https://graph.microsoft.com",
                    extraParameters: {
                        brk_client_id: "broker_client_id",
                        brk_redirect_uri: "https://broker_redirect_uri.com",
                        client_id: "parent_client_id",
                        userEQP: "customUserParam",
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
            // Translated brk_* / client_id keys are stripped from extraParameters
            expect(nativeRequest.extraParameters).not.toHaveProperty(
                "brk_client_id"
            );
            expect(nativeRequest.extraParameters).not.toHaveProperty(
                "brk_redirect_uri"
            );
            expect(nativeRequest.extraParameters).not.toHaveProperty(
                "client_id"
            );
            // Other extraParameters (resource, developer-supplied params) are preserved
            expect(nativeRequest.extraParameters!["resource"]).toEqual(
                "https://graph.microsoft.com"
            );
            expect(nativeRequest.extraParameters!["userEQP"]).toEqual(
                "customUserParam"
            );
        });

        it("pick up user input extra parameters", async () => {
            const nativeRequest =
                // @ts-ignore
                await platformAuthInteractionClient.initializePlatformRequest({
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

        it("preserves proof context as canonical params for PoP broker requests", async () => {
            const nativeRequest =
                // @ts-ignore
                await platformAuthInteractionClient.initializePlatformRequest({
                    scopes: ["User.Read"],
                    authenticationScheme: Constants.AuthenticationScheme.POP,
                    popKid: "test-pop-kid",
                    resourceRequestMethod: "POST",
                    resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
                    extraParameters: {
                        userEQP: "customUserParam",
                    },
                });
            expect(nativeRequest).not.toHaveProperty("preferBinding");
            expect(nativeRequest.reqCnf).toEqual(expect.any(String));
            expect(nativeRequest).not.toHaveProperty("extraParametersNoCache");
            expect(nativeRequest.extraParameters?.userEQP).toBe(
                "customUserParam"
            );
            expect(nativeRequest.resourceRequestMethod).toBe("POST");
            expect(nativeRequest.resourceRequestUri).toBe(
                "https://graph.microsoft.com/v1.0/me"
            );
            expect(nativeRequest).not.toHaveProperty("dpopNonce");
        });

        it("preserves proof context as canonical params for DPoP broker requests", async () => {
            const nativeRequest =
                // @ts-ignore
                await platformAuthInteractionClient.initializePlatformRequest({
                    scopes: ["User.Read"],
                    authenticationScheme: Constants.AuthenticationScheme.DPOP,
                    resourceRequestMethod: "post",
                    resourceRequestUri:
                        "https://graph.microsoft.com:443/v1.0/me?secret=value#part",
                });

            expect(nativeRequest).not.toHaveProperty("extraParametersNoCache");
            expect(nativeRequest.tokenType).toBe(
                Constants.AuthenticationScheme.DPOP
            );
            expect(nativeRequest.preferBinding).toBe("attested");
            expect(nativeRequest.resourceRequestMethod).toBe("POST");
            expect(nativeRequest.resourceRequestUri).toBe(
                "https://graph.microsoft.com/v1.0/me"
            );
        });

        it("preserves proof context as original params for DOM requests", async () => {
            const domPlatformAuthInteractionClient =
                new PlatformAuthInteractionClient(
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
                    new PlatformAuthDOMHandler(
                        pca.getLogger(),
                        getDefaultPerformanceClient(),
                        RANDOM_TEST_GUID
                    ),
                    "nativeAccountId",
                    // @ts-ignore
                    pca.nativeInternalStorage,
                    RANDOM_TEST_GUID
                );

            const nativeRequest =
                // @ts-ignore
                await domPlatformAuthInteractionClient.initializePlatformRequest(
                    {
                        scopes: ["User.Read"],
                        authenticationScheme:
                            Constants.AuthenticationScheme.DPOP,
                        resourceRequestMethod: "POST",
                        resourceRequestUri:
                            "https://graph.microsoft.com/v1.0/me",
                    }
                );

            expect(nativeRequest).not.toHaveProperty("extraParametersNoCache");
            expect(nativeRequest.resourceRequestMethod).toBe("POST");
            expect(nativeRequest.resourceRequestUri).toBe(
                "https://graph.microsoft.com/v1.0/me"
            );
        });

        it("does not map proof context to no-cache extra params for bearer extension requests", async () => {
            const nativeRequest =
                // @ts-ignore
                await platformAuthInteractionClient.initializePlatformRequest({
                    scopes: ["User.Read"],
                    authenticationScheme: Constants.AuthenticationScheme.BEARER,
                    resourceRequestMethod: "POST",
                    resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
                });

            expect(nativeRequest).not.toHaveProperty("extraParametersNoCache");
            expect(nativeRequest.resourceRequestMethod).toBe(undefined);
            expect(nativeRequest.resourceRequestUri).toBe(undefined);
        });

        it("forwards resource via extraParameters when provided", async () => {
            const nativeRequest =
                // @ts-ignore
                await platformAuthInteractionClient.initializePlatformRequest({
                    scopes: ["User.Read"],
                    resource: "https://graph.microsoft.com",
                });

            // resource is not a top-level broker-contract param; it is forwarded via
            // extraParameters so it reaches ESTS on both the extension and DOM paths
            expect(nativeRequest).not.toHaveProperty("resource");
            expect(nativeRequest.extraParameters?.resource).toEqual(
                "https://graph.microsoft.com"
            );
        });

        it("preserves resource and developer extraParameters when embeddedClientId is set", async () => {
            const nativeRequest =
                // @ts-ignore
                await platformAuthInteractionClient.initializePlatformRequest({
                    scopes: ["User.Read"],
                    redirectUri: "localhost",
                    resource: "https://graph.microsoft.com",
                    embeddedClientId: "embedded-client-id",
                    extraParameters: {
                        userEQP: "customUserParam",
                    },
                });

            // Child fields are set from embeddedClientId
            expect(nativeRequest.extraParameters!["child_client_id"]).toEqual(
                "embedded-client-id"
            );
            expect(
                nativeRequest.extraParameters!["child_redirect_uri"]
            ).toEqual("localhost");
            // embeddedClientId is not a broker-contract param and must not sit on the request
            expect(nativeRequest).not.toHaveProperty("embeddedClientId");
            // resource and developer-supplied extraParameters survive the embedded path
            expect(nativeRequest.extraParameters!["resource"]).toEqual(
                "https://graph.microsoft.com"
            );
            expect(nativeRequest.extraParameters!["userEQP"]).toEqual(
                "customUserParam"
            );
        });

        it("forwards broker-contract params and drops non-contract SDK/ESTS fields", async () => {
            // Cast to any so non-contract SDK/ESTS-only fields can be supplied without type errors
            const requestWithExtraFields: any = {
                scopes: ["User.Read"],
                // Broker-contract MSAL JS acquire-token params
                loginHint: "user@contoso.com",
                nonce: "test-nonce",
                state: "test-state",
                prompt: Constants.PromptValue.LOGIN,
                // Non-contract SDK/ESTS-only fields that must NOT reach the broker
                azureCloudOptions: { azureCloudInstance: 1 },
                maxAge: 3600,
                sshJwk: "test-ssh-jwk",
                sshKid: "test-ssh-kid",
                scenarioId: "test-scenario",
                skipBrokerClaims: true,
                extraQueryParameters: { eqp: "value" },
                sid: "test-sid",
                domainHint: "contoso.com",
                // Client-side cache directive, consumed internally and passed to
                // cacheNativeTokens as a param rather than sent to the broker
                storeInCache: { idToken: false },
            };
            const nativeRequest =
                // @ts-ignore
                await platformAuthInteractionClient.initializePlatformRequest(
                    requestWithExtraFields
                );

            // Contract params are forwarded
            expect(nativeRequest.loginHint).toEqual("user@contoso.com");
            expect(nativeRequest.nonce).toEqual("test-nonce");
            expect(nativeRequest.state).toEqual("test-state");
            expect(nativeRequest.prompt).toEqual(Constants.PromptValue.LOGIN);

            // Non-contract fields are not present on the request sent to the broker
            [
                "azureCloudOptions",
                "maxAge",
                "sshJwk",
                "sshKid",
                "scenarioId",
                "skipBrokerClaims",
                "extraQueryParameters",
                "sid",
                "domainHint",
                "storeInCache",
                "embeddedClientId",
            ].forEach((field) => {
                expect(nativeRequest).not.toHaveProperty(field);
            });
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
                await platformAuthClientWithCapabilities.initializePlatformRequest(
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
                await platformAuthClientWithCapabilities.initializePlatformRequest(
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
                await platformAuthClientWithCapabilities.initializePlatformRequest(
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
                await platformAuthInteractionClient.initializePlatformRequest({
                    scopes: ["User.Read"],
                    claims: existingClaims,
                });

            const parsedClaims = JSON.parse(nativeRequest.claims || "");
            expect(parsedClaims.userinfo).toEqual({
                given_name: { essential: true },
            });
            expect(parsedClaims.id_token).toEqual({
                signin_state: { essential: false },
                login_hint: { essential: false },
                tenant_region_sub_scope: { essential: false },
            });
            expect(parsedClaims.access_token).toBeUndefined();
        });

        it("returns default idToken claims when no claims or client capabilities are provided", async () => {
            const nativeRequest =
                // @ts-ignore
                await platformAuthInteractionClient.initializePlatformRequest({
                    scopes: ["User.Read"],
                });

            const parsedClaims = JSON.parse(nativeRequest.claims || "{}");
            expect(parsedClaims.id_token).toEqual({
                signin_state: { essential: false },
                login_hint: { essential: false },
                tenant_region_sub_scope: { essential: false },
            });
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
                await platformAuthClientWithEmptyCapabilities.initializePlatformRequest(
                    {
                        scopes: ["User.Read"],
                        claims: existingClaims,
                    }
                );

            const parsedClaims = JSON.parse(nativeRequest.claims || "");
            expect(parsedClaims.userinfo).toEqual({
                given_name: { essential: true },
            });
            expect(parsedClaims.id_token).toEqual({
                signin_state: { essential: false },
                login_hint: { essential: false },
                tenant_region_sub_scope: { essential: false },
            });
            expect(parsedClaims.access_token).toBeUndefined();
        });

        it("excludes broker's client capabilities when skipBrokerClaims=true and embeddedClientId is present", async () => {
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
                await platformAuthClientWithCapabilities.initializePlatformRequest(
                    {
                        scopes: ["User.Read"],
                        claims: existingClaims,
                        skipBrokerClaims: true,
                        embeddedClientId: "embedded-client-id",
                    }
                );

            const parsedClaims = JSON.parse(nativeRequest.claims || "");
            // Verify existing claims are preserved
            expect(parsedClaims.userinfo).toBeDefined();
            expect(parsedClaims.userinfo.given_name).toEqual({
                essential: true,
            });
            // Verify default idToken claims are added
            expect(parsedClaims.id_token).toEqual({
                signin_state: { essential: false },
                login_hint: { essential: false },
                tenant_region_sub_scope: { essential: false },
            });
            // Verify broker's client capabilities are NOT added
            expect(parsedClaims.access_token).toBeUndefined();
        });

        it("includes broker's client capabilities when skipBrokerClaims=true but embeddedClientId is not present", async () => {
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
                await platformAuthClientWithCapabilities.initializePlatformRequest(
                    {
                        scopes: ["User.Read"],
                        claims: existingClaims,
                        skipBrokerClaims: true,
                        // embeddedClientId is not provided
                    }
                );

            expect(nativeRequest.claims).toBeDefined();
            const parsedClaims = JSON.parse(nativeRequest.claims || "");

            // Verify existing claims are preserved
            expect(parsedClaims.userinfo).toBeDefined();
            expect(parsedClaims.userinfo.given_name).toEqual({
                essential: true,
            });

            // Verify client capabilities are added (since embeddedClientId is not present)
            expect(parsedClaims.access_token).toBeDefined();
            expect(parsedClaims.access_token.xms_cc).toBeDefined();
            expect(parsedClaims.access_token.xms_cc.values).toEqual([
                "CP1",
                "CP2",
                "CP3",
            ]);
        });

        it("includes broker's client capabilities when skipBrokerClaims is false regardless of embeddedClientId", async () => {
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
                await platformAuthClientWithCapabilities.initializePlatformRequest(
                    {
                        scopes: ["User.Read"],
                        claims: existingClaims,
                        skipBrokerClaims: false,
                        embeddedClientId: "embedded-client-id",
                    }
                );

            expect(nativeRequest.claims).toBeDefined();
            const parsedClaims = JSON.parse(nativeRequest.claims || "");

            // Verify existing claims are preserved
            expect(parsedClaims.userinfo).toBeDefined();
            expect(parsedClaims.userinfo.given_name).toEqual({
                essential: true,
            });

            // Verify client capabilities are added (since skipBrokerClaims is false)
            expect(parsedClaims.access_token).toBeDefined();
            expect(parsedClaims.access_token.xms_cc).toBeDefined();
            expect(parsedClaims.access_token.xms_cc.values).toEqual([
                "CP1",
                "CP2",
                "CP3",
            ]);
        });

        it("omits attributeTokens when not provided", async () => {
            const nativeRequest =
                // @ts-ignore
                await platformAuthInteractionClient.initializePlatformRequest({
                    scopes: ["User.Read"],
                });

            expect(nativeRequest.attributeTokens).toBeUndefined();
        });

        it("omits attributeTokens when explicitly empty", async () => {
            const nativeRequest =
                // @ts-ignore
                await platformAuthInteractionClient.initializePlatformRequest({
                    scopes: ["User.Read"],
                    attributeTokens: [],
                });

            expect(nativeRequest.attributeTokens).toBeUndefined();
        });

        it("serializes sorted, space-joined attributeTokens string", async () => {
            const nativeRequest =
                // @ts-ignore
                await platformAuthInteractionClient.initializePlatformRequest({
                    scopes: ["User.Read"],
                    attributeTokens: ["zeta", "alpha", "mike"],
                });

            expect(nativeRequest.attributeTokens).toBe("alpha mike zeta");
        });

        it("emits hasAttributeTokens telemetry for absent and present attributeTokens", async () => {
            const addFieldsSpy = jest.spyOn(perfClient, "addFields");

            // @ts-ignore
            await platformAuthInteractionClient.initializePlatformRequest({
                scopes: ["User.Read"],
            });

            expect(addFieldsSpy).toHaveBeenCalledWith(
                { hasAttributeTokens: false },
                expect.any(String)
            );

            addFieldsSpy.mockClear();

            // @ts-ignore
            await platformAuthInteractionClient.initializePlatformRequest({
                scopes: ["User.Read"],
                attributeTokens: ["zeta", "alpha", "mike"],
            });

            expect(addFieldsSpy).toHaveBeenCalledWith(
                { hasAttributeTokens: true },
                expect.any(String)
            );
        });
    });

    describe("Performance Event Validation", () => {
        let performanceSpy: jest.SpyInstance;
        let startMeasurementSpy: jest.SpyInstance;

        beforeEach(() => {
            // Create mock measurement with spies
            const mockMeasurement = {
                add: jest.fn(),
                end: jest.fn(),
                increment: jest.fn(),
                discard: jest.fn(),
            };

            // Spy on performance client methods
            startMeasurementSpy = jest
                .spyOn(perfClient, "startMeasurement")
                .mockReturnValue(mockMeasurement as any);
            performanceSpy = jest.spyOn(perfClient, "addFields");
        });

        afterEach(() => {
            performanceSpy.mockRestore();
            startMeasurementSpy.mockRestore();
        });

        it("should use synchronized correlationId in performance measurements", async () => {
            const customCorrelationId = "custom-correlation-123";

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
                customCorrelationId
            );

            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<PlatformAuthResponse> => {
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });

            await platformAuthInteractionClient.acquireToken({
                scopes: ["User.Read"],
                correlationId: customCorrelationId,
            });

            // Should use the synchronized correlationId, which should be the customCorrelationId
            // since synchronizeCorrelationId should update this.correlationId
            expect(startMeasurementSpy).toHaveBeenCalledWith(
                expect.any(String),
                customCorrelationId
            );
        });

        it("should emit success=false and errorCode for failed acquireToken", async () => {
            // Mock sendMessage to succeed but handleNativeResponse to fail
            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<PlatformAuthResponse> => {
                return Promise.resolve(MOCK_WAM_RESPONSE);
            });

            // Mock handleNativeResponse to throw an error
            const authError = new AuthError("test_error", "Test error message");
            jest.spyOn(
                platformAuthInteractionClient as any,
                "handleNativeResponse"
            ).mockRejectedValue(authError);

            try {
                await platformAuthInteractionClient.acquireToken({
                    scopes: ["User.Read"],
                });
            } catch (error) {
                // Expected to throw
            }

            // Get the mock measurement object that was returned
            const mockMeasurement = startMeasurementSpy.mock.results[0].value;

            // Check that measurement.end was called with success: false and the
            // error object (perf client derives errorCode/subErrorCode from it)
            expect(mockMeasurement.end).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                }),
                authError
            );
        });

        it("should emit success=false and errorCode when sendMessage fails", async () => {
            // Test that measurement.end is now called when sendMessage fails (bug fix)
            const nativeError = createNativeAuthError(
                "ContentError",
                "problem getting response from extension"
            );

            jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                "sendMessage"
            ).mockImplementation((): Promise<PlatformAuthResponse> => {
                return Promise.reject(nativeError);
            });

            try {
                await platformAuthInteractionClient.acquireToken({
                    scopes: ["User.Read"],
                });
            } catch (error) {
                // Expected to throw
                expect(error).toBe(nativeError);
            }

            // Get the mock measurement object that was returned
            const mockMeasurement = startMeasurementSpy.mock.results[0].value;

            // After the fix, measurement.end should now be called when sendMessage
            // fails, passing the error object as the second argument
            expect(mockMeasurement.end).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                }),
                nativeError
            );
        });

        describe("brokerErrorName/brokerErrorCode telemetry", () => {
            it("acquireToken records brokerErrorName/brokerErrorCode when the broker rejects with a NativeAuthError", async () => {
                // Broker dispatch (sendMessage) rejects with a NativeAuthError
                const brokerError = new NativeAuthError(
                    "OSError",
                    RANDOM_TEST_GUID,
                    "there is an OSError",
                    { error: -2147186943 }
                );
                jest.spyOn(
                    PlatformAuthExtensionHandler.prototype,
                    "sendMessage"
                ).mockRejectedValue(brokerError);

                await expect(
                    platformAuthInteractionClient.acquireToken({
                        scopes: ["User.Read"],
                        correlationId: RANDOM_TEST_GUID,
                    })
                ).rejects.toBe(brokerError);

                // NativeAuthError is an AuthError, so its name/errorCode land on the root event
                expect(performanceSpy).toHaveBeenCalledWith(
                    {
                        isNativeBroker: true,
                        brokerErrorName: "NativeAuthError",
                        brokerErrorCode: "OSError",
                    },
                    RANDOM_TEST_GUID
                );
            });

            it("acquireToken records brokerErrorName/brokerErrorCode when handleNativeResponse rejects with an AuthError", async () => {
                jest.spyOn(
                    PlatformAuthExtensionHandler.prototype,
                    "sendMessage"
                ).mockResolvedValue(MOCK_WAM_RESPONSE);

                const authError = new AuthError(
                    "broker_response_error",
                    "Broker response could not be handled"
                );
                jest.spyOn(
                    platformAuthInteractionClient as any,
                    "handleNativeResponse"
                ).mockRejectedValue(authError);

                await expect(
                    platformAuthInteractionClient.acquireToken({
                        scopes: ["User.Read"],
                        correlationId: RANDOM_TEST_GUID,
                    })
                ).rejects.toBe(authError);

                expect(performanceSpy).toHaveBeenCalledWith(
                    {
                        isNativeBroker: true,
                        brokerErrorName: "AuthError",
                        brokerErrorCode: "broker_response_error",
                    },
                    RANDOM_TEST_GUID
                );
            });

            it("acquireToken does not record broker error fields when the broker rejects with a non-AuthError", async () => {
                jest.spyOn(
                    PlatformAuthExtensionHandler.prototype,
                    "sendMessage"
                ).mockResolvedValue(MOCK_WAM_RESPONSE);

                const plainError = new Error("unexpected failure");
                jest.spyOn(
                    platformAuthInteractionClient as any,
                    "handleNativeResponse"
                ).mockRejectedValue(plainError);

                await expect(
                    platformAuthInteractionClient.acquireToken({
                        scopes: ["User.Read"],
                        correlationId: RANDOM_TEST_GUID,
                    })
                ).rejects.toBe(plainError);

                // Non-AuthError errors carry no broker name/code, so nothing is recorded
                expect(performanceSpy).not.toHaveBeenCalledWith(
                    expect.objectContaining({
                        brokerErrorName: expect.anything(),
                    }),
                    expect.anything()
                );
            });

            it("acquireTokenRedirect records brokerErrorName/brokerErrorCode on a fatal broker error", async () => {
                const fatalError = new NativeAuthError(
                    "OSError",
                    RANDOM_TEST_GUID,
                    "there is an OSError",
                    { error: -2147186943 }
                );
                jest.spyOn(
                    PlatformAuthExtensionHandler.prototype,
                    "sendMessage"
                ).mockRejectedValue(fatalError);

                await expect(
                    platformAuthInteractionClient.acquireTokenRedirect(
                        { scopes: ["User.Read"] },
                        perfMeasurement
                    )
                ).rejects.toBe(fatalError);

                expect(performanceSpy).toHaveBeenCalledWith(
                    {
                        isNativeBroker: true,
                        brokerErrorName: "NativeAuthError",
                        brokerErrorCode: "OSError",
                    },
                    RANDOM_TEST_GUID
                );
            });

            it("handleRedirectPromise records brokerErrorName/brokerErrorCode when the broker rejects with a NativeAuthError", async () => {
                // @ts-ignore
                pca.browserStorage.setInteractionInProgress(true);
                // @ts-ignore
                pca.browserStorage.setTemporaryCache(
                    "request.native",
                    JSON.stringify({
                        scopes: ["User.Read"],
                        correlationId: RANDOM_TEST_GUID,
                    }),
                    true
                );

                const brokerError = new NativeAuthError(
                    "OSError",
                    RANDOM_TEST_GUID,
                    "there is an OSError",
                    { error: -2147186943 }
                );
                jest.spyOn(
                    PlatformAuthExtensionHandler.prototype,
                    "sendMessage"
                ).mockRejectedValue(brokerError);

                await expect(
                    platformAuthInteractionClient.handleRedirectPromise()
                ).rejects.toBe(brokerError);

                expect(performanceSpy).toHaveBeenCalledWith(
                    {
                        isNativeBroker: true,
                        brokerErrorName: "NativeAuthError",
                        brokerErrorCode: "OSError",
                    },
                    RANDOM_TEST_GUID
                );
            });
        });
    });
});
