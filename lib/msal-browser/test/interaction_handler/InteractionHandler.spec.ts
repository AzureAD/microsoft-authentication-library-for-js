/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InteractionHandler } from "../../src/interaction_handler/InteractionHandler.js";
import {
    PkceCodes,
    NetworkRequestOptions,
    Logger,
    LogLevel,
    LoggerOptions,
    AccountInfo,
    CommonAuthorizationCodeRequest,
    AuthenticationResult,
    AuthorizationCodeClient,
    AuthenticationScheme,
    ProtocolMode,
    Authority,
    ClientConfiguration,
    AuthorizationCodePayload,
    AuthorityOptions,
    CcsCredential,
    CcsCredentialType,
    StubPerformanceClient,
} from "@azure/msal-common/browser";
import {
    Configuration,
    buildConfiguration,
} from "../../src/config/Configuration.js";
import {
    TEST_CONFIG,
    TEST_URIS,
    TEST_DATA_CLIENT_INFO,
    TEST_TOKENS,
    TEST_TOKEN_LIFETIMES,
    TEST_HASHES,
    TEST_POP_VALUES,
    TEST_STATE_VALUES,
    RANDOM_TEST_GUID,
    TEST_CRYPTO_VALUES,
} from "../utils/StringConstants.js";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../../src/error/BrowserAuthError.js";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import { TestStorageManager } from "../cache/TestStorageManager.js";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import {
    TemporaryCacheKeys,
    BrowserConstants,
} from "../../src/utils/BrowserConstants.js";

class TestInteractionHandler extends InteractionHandler {
    constructor(
        authCodeModule: AuthorizationCodeClient,
        storageImpl: BrowserCacheManager
    ) {
        super(
            authCodeModule,
            storageImpl,
            testAuthCodeRequest,
            testBrowserRequestLogger,
            performanceClient
        );
    }

    showUI(requestUrl: string): Window {
        throw new Error("Method not implemented.");
    }

    initiateAuthRequest(
        requestUrl: string
    ): Window | Promise<HTMLIFrameElement> {
        this.authCodeRequest = testAuthCodeRequest;
        //@ts-ignore
        return null;
    }
}

const testAuthCodeRequest: CommonAuthorizationCodeRequest = {
    authenticationScheme: AuthenticationScheme.BEARER,
    authority: TEST_CONFIG.validAuthority,
    redirectUri: TEST_URIS.TEST_REDIR_URI,
    scopes: ["scope1", "scope2"],
    code: "",
    correlationId: "",
};

const testBrowserRequestLogger: Logger = new Logger(
    {
        loggerCallback: (
            level: LogLevel,
            message: string,
            containsPii: boolean
        ): void => {},
        piiLoggingEnabled: true,
    },
    "@azure/msal-browser",
    "test"
);

const testPkceCodes = {
    challenge: "TestChallenge",
    verifier: "TestVerifier",
} as PkceCodes;

const testNetworkResult = {
    testParam: "testValue",
};

const networkInterface = {
    sendGetRequestAsync<T>(): T {
        return {} as T;
    },
    sendPostRequestAsync<T>(): T {
        return {} as T;
    },
};

const cryptoInterface = {
    createNewGuid: (): string => {
        return "newGuid";
    },
    base64Decode: (input: string): string => {
        return "testDecodedString";
    },
    base64Encode: (input: string): string => {
        return "testEncodedString";
    },
    base64UrlEncode(input: string): string {
        return Buffer.from(input, "utf-8").toString("base64url");
    },
    encodeKid(input: string): string {
        return Buffer.from(JSON.stringify({ kid: input }), "utf-8").toString(
            "base64url"
        );
    },
    generatePkceCodes: async (): Promise<PkceCodes> => {
        return testPkceCodes;
    },
    getPublicKeyThumbprint: async (): Promise<string> => {
        return TEST_POP_VALUES.ENCODED_REQ_CNF;
    },
    signJwt: async (): Promise<string> => {
        return "signedJwt";
    },
    removeTokenBindingKey: async (): Promise<boolean> => {
        return Promise.resolve(true);
    },
    clearKeystore: async (): Promise<boolean> => {
        return Promise.resolve(true);
    },
    hashString: async (): Promise<string> => {
        return Promise.resolve(TEST_CRYPTO_VALUES.TEST_SHA256_HASH);
    },
};

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

let authorityInstance: Authority;
let authConfig: ClientConfiguration;

describe("InteractionHandler.ts Unit Tests", () => {
    let authCodeModule: AuthorizationCodeClient;
    let browserStorage: BrowserCacheManager;
    const cryptoOpts = new CryptoOps(testBrowserRequestLogger);

    beforeEach(async () => {
        const appConfig: Configuration = {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        };
        const configObj = buildConfiguration(appConfig, true);
        const authorityOptions: AuthorityOptions = {
            protocolMode: ProtocolMode.AAD,
            knownAuthorities: [configObj.auth.authority],
            cloudDiscoveryMetadata: "",
            authorityMetadata: "",
        };
        const loggerOptions: LoggerOptions = {
            loggerCallback: (): void => {},
            piiLoggingEnabled: true,
        };
        const logger: Logger = new Logger(loggerOptions);
        browserStorage = new BrowserCacheManager(
            TEST_CONFIG.MSAL_CLIENT_ID,
            configObj.cache,
            cryptoOpts,
            logger,
            new StubPerformanceClient()
        );
        authorityInstance = new Authority(
            configObj.auth.authority,
            networkInterface,
            browserStorage,
            authorityOptions,
            logger,
            TEST_CONFIG.CORRELATION_ID
        );
        await authorityInstance.resolveEndpointsAsync();
        authConfig = {
            authOptions: {
                ...configObj.auth,
                authority: authorityInstance,
            },
            systemOptions: {
                tokenRenewalOffsetSeconds:
                    configObj.system.tokenRenewalOffsetSeconds,
            },
            cryptoInterface: cryptoInterface,
            storageInterface: new TestStorageManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cryptoInterface,
                logger
            ),
            networkInterface: {
                sendGetRequestAsync: async (
                    url: string,
                    options?: NetworkRequestOptions
                ): Promise<any> => {
                    return testNetworkResult;
                },
                sendPostRequestAsync: async (
                    url: string,
                    options?: NetworkRequestOptions
                ): Promise<any> => {
                    return testNetworkResult;
                },
            },
            loggerOptions: loggerOptions,
        };
        authCodeModule = new AuthorizationCodeClient(authConfig);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("Constructor", () => {
        const interactionHandler = new TestInteractionHandler(
            authCodeModule,
            browserStorage
        );

        expect(interactionHandler).toBeInstanceOf(TestInteractionHandler);
        expect(interactionHandler).toBeInstanceOf(InteractionHandler);
    });

    describe("handleCodeResponseFromServer()", () => {
        it("successfully handle code from server response", async () => {
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: "1536361411",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            const testCodeResponse: AuthorizationCodePayload = {
                code: "authcode",
                nonce: idTokenClaims.nonce,
                state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                environment: "login.windows.net",
                tenantId: idTokenClaims.tid,
                username: idTokenClaims.preferred_username,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_LOCAL_ACCOUNT_ID,
            };
            const testCcsCred: CcsCredential = {
                credential: idTokenClaims.preferred_username || "",
                type: CcsCredentialType.UPN,
            };
            const testTokenResponse: AuthenticationResult = {
                authority: authorityInstance.canonicalAuthority,
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                idToken: TEST_TOKENS.IDTOKEN_V2,
                fromCache: false,
                scopes: ["scope1", "scope2"],
                account: testAccount,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(
                    Date.now() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN * 1000
                ),
                idTokenClaims: idTokenClaims,
                tenantId: idTokenClaims.tid,
                uniqueId: idTokenClaims.oid,
                state: "testState",
                tokenType: AuthenticationScheme.BEARER,
            };
            testAuthCodeRequest.ccsCredential = testCcsCred;
            browserStorage.setTemporaryCache(
                browserStorage.generateStateKey(
                    TEST_STATE_VALUES.TEST_STATE_REDIRECT
                ),
                TEST_STATE_VALUES.TEST_STATE_REDIRECT
            );
            browserStorage.setTemporaryCache(
                browserStorage.generateNonceKey(
                    TEST_STATE_VALUES.TEST_STATE_REDIRECT
                ),
                idTokenClaims.nonce
            );
            browserStorage.setTemporaryCache(
                TemporaryCacheKeys.CCS_CREDENTIAL,
                CcsCredentialType.UPN
            );
            const acquireTokenSpy = jest
                .spyOn(AuthorizationCodeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const interactionHandler = new TestInteractionHandler(
                authCodeModule,
                browserStorage
            );
            await interactionHandler.initiateAuthRequest("testNavUrl");

            const tokenResponse =
                await interactionHandler.handleCodeResponseFromServer(
                    testCodeResponse,
                    {
                        authority: TEST_CONFIG.validAuthority,
                        scopes: ["User.Read"],
                        correlationId: TEST_CONFIG.CORRELATION_ID,
                        redirectUri: "/",
                        responseMode: "fragment",
                        nonce: TEST_CONFIG.CORRELATION_ID,
                        state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                    }
                );

            expect(tokenResponse).toEqual(testTokenResponse);
            expect(acquireTokenSpy).toHaveBeenCalledWith(
                testAuthCodeRequest,
                testCodeResponse
            );
            expect(acquireTokenSpy).not.toThrow();
        });
    });

    describe("handleCodeResponse()", () => {
        // TODO: Need to improve these tests
        it("successfully uses a new authority if cloud_instance_host_name is different", async () => {
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: "1536361411",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            const testCodeResponse: AuthorizationCodePayload = {
                code: "authcode",
                nonce: idTokenClaims.nonce,
                state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                cloud_instance_host_name: "login.windows.net",
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                environment: "login.windows.net",
                tenantId: idTokenClaims.tid,
                username: idTokenClaims.preferred_username,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_LOCAL_ACCOUNT_ID,
            };
            const testTokenResponse: AuthenticationResult = {
                authority: authorityInstance.canonicalAuthority,
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                idToken: TEST_TOKENS.IDTOKEN_V2,
                fromCache: false,
                scopes: ["scope1", "scope2"],
                account: testAccount,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(
                    Date.now() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN * 1000
                ),
                idTokenClaims: idTokenClaims,
                tenantId: idTokenClaims.tid,
                uniqueId: idTokenClaims.oid,
                state: "testState",
                tokenType: AuthenticationScheme.BEARER,
            };
            browserStorage.setTemporaryCache(
                browserStorage.generateStateKey(
                    TEST_STATE_VALUES.TEST_STATE_REDIRECT
                ),
                TEST_STATE_VALUES.TEST_STATE_REDIRECT
            );
            browserStorage.setTemporaryCache(
                browserStorage.generateNonceKey(
                    TEST_STATE_VALUES.TEST_STATE_REDIRECT
                ),
                idTokenClaims.nonce
            );
            jest.spyOn(
                AuthorizationCodeClient.prototype,
                "handleFragmentResponse"
            ).mockReturnValue(testCodeResponse);
            const updateAuthoritySpy = jest.spyOn(
                AuthorizationCodeClient.prototype,
                "updateAuthority"
            );
            const acquireTokenSpy = jest
                .spyOn(AuthorizationCodeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const interactionHandler = new TestInteractionHandler(
                authCodeModule,
                browserStorage
            );
            await interactionHandler.initiateAuthRequest("testNavUrl");
            const tokenResponse = await interactionHandler.handleCodeResponse(
                {
                    code: "authCode",
                    state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                },
                {
                    authority: TEST_CONFIG.validAuthority,
                    scopes: ["User.Read"],
                    correlationId: TEST_CONFIG.CORRELATION_ID,
                    redirectUri: "/",
                    responseMode: "fragment",
                    nonce: TEST_CONFIG.CORRELATION_ID,
                    state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                }
            );
            expect(updateAuthoritySpy).toHaveBeenCalledWith(
                testCodeResponse.cloud_instance_host_name,
                TEST_CONFIG.CORRELATION_ID
            );
            expect(tokenResponse).toEqual(testTokenResponse);
            expect(acquireTokenSpy).toHaveBeenCalledWith(
                testAuthCodeRequest,
                testCodeResponse
            );
            expect(acquireTokenSpy).not.toThrow();
        });

        it("successfully adds login_hint as CCS credential to auth code request", async () => {
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: "1536361411",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            const testCodeResponse: AuthorizationCodePayload = {
                code: "authcode",
                nonce: idTokenClaims.nonce,
                state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                environment: "login.windows.net",
                tenantId: idTokenClaims.tid,
                username: idTokenClaims.preferred_username,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_LOCAL_ACCOUNT_ID,
            };
            const testCcsCred: CcsCredential = {
                credential: idTokenClaims.preferred_username || "",
                type: CcsCredentialType.UPN,
            };
            const testTokenResponse: AuthenticationResult = {
                authority: authorityInstance.canonicalAuthority,
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                idToken: TEST_TOKENS.IDTOKEN_V2,
                fromCache: false,
                scopes: ["scope1", "scope2"],
                account: testAccount,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(
                    Date.now() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN * 1000
                ),
                idTokenClaims: idTokenClaims,
                tenantId: idTokenClaims.tid,
                uniqueId: idTokenClaims.oid,
                state: "testState",
                tokenType: AuthenticationScheme.BEARER,
            };
            testAuthCodeRequest.ccsCredential = testCcsCred;
            browserStorage.setTemporaryCache(
                browserStorage.generateStateKey(
                    TEST_STATE_VALUES.TEST_STATE_REDIRECT
                ),
                TEST_STATE_VALUES.TEST_STATE_REDIRECT
            );
            browserStorage.setTemporaryCache(
                browserStorage.generateNonceKey(
                    TEST_STATE_VALUES.TEST_STATE_REDIRECT
                ),
                idTokenClaims.nonce
            );
            browserStorage.setTemporaryCache(
                TemporaryCacheKeys.CCS_CREDENTIAL,
                CcsCredentialType.UPN
            );
            jest.spyOn(
                AuthorizationCodeClient.prototype,
                "handleFragmentResponse"
            ).mockReturnValue(testCodeResponse);
            const acquireTokenSpy = jest
                .spyOn(AuthorizationCodeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const interactionHandler = new TestInteractionHandler(
                authCodeModule,
                browserStorage
            );
            await interactionHandler.initiateAuthRequest("testNavUrl");
            const tokenResponse = await interactionHandler.handleCodeResponse(
                {
                    code: "authCode",
                    state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                },
                {
                    authority: TEST_CONFIG.validAuthority,
                    scopes: ["User.Read"],
                    correlationId: TEST_CONFIG.CORRELATION_ID,
                    redirectUri: "/",
                    responseMode: "fragment",
                    nonce: TEST_CONFIG.CORRELATION_ID,
                    state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                }
            );
            expect(tokenResponse).toEqual(testTokenResponse);
            expect(acquireTokenSpy).toHaveBeenCalledWith(
                testAuthCodeRequest,
                testCodeResponse
            );
            expect(acquireTokenSpy).not.toThrow();
        });
    });
});
