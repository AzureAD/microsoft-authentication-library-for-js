/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InteractionHandler } from "../../src/interaction_handler/InteractionHandler";
import {
    PkceCodes,
    NetworkRequestOptions,
    LogLevel,
    AccountInfo,
    AuthorityFactory,
    CommonAuthorizationCodeRequest,
    AuthenticationResult,
    AuthorizationCodeClient,
    AuthenticationScheme,
    ProtocolMode,
    Logger,
    Authority,
    ClientConfiguration,
    AuthorizationCodePayload,
    AuthorityOptions,
    CcsCredential,
    CcsCredentialType,
} from "@azure/msal-common";
import { Configuration, buildConfiguration } from "../../src/config/Configuration";
import { TEST_CONFIG, TEST_URIS, TEST_DATA_CLIENT_INFO, TEST_TOKENS, TEST_TOKEN_LIFETIMES, TEST_HASHES, TEST_POP_VALUES, TEST_STATE_VALUES, RANDOM_TEST_GUID, TEST_CRYPTO_VALUES } from "../utils/StringConstants";
import { BrowserAuthError } from "../../src/error/BrowserAuthError";
import sinon from "sinon";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { TestStorageManager } from "../cache/TestStorageManager";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager";
import { TemporaryCacheKeys, BrowserConstants } from "../../src/utils/BrowserConstants";

class TestInteractionHandler extends InteractionHandler {

    constructor(authCodeModule: AuthorizationCodeClient, storageImpl: BrowserCacheManager) {
        super(authCodeModule, storageImpl, testAuthCodeRequest, testBrowserRequestLogger);
    }

    showUI(requestUrl: string): Window {
        throw new Error("Method not implemented.");
    }

    initiateAuthRequest(requestUrl: string): Window | Promise<HTMLIFrameElement> {
        this.authCodeRequest = testAuthCodeRequest;
        //@ts-ignore
        return null;
    }
}

const testAuthCodeRequest: CommonAuthorizationCodeRequest = {
    authenticationScheme: AuthenticationScheme.BEARER,
    authority: "",
    redirectUri: TEST_URIS.TEST_REDIR_URI,
    scopes: ["scope1", "scope2"],
    code: "",
    correlationId: ""
};

const testBrowserRequestLogger: Logger = new Logger({
    loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {},
    piiLoggingEnabled: true
}, "@azure/msal-browser", "test");

const testPkceCodes = {
    challenge: "TestChallenge",
    verifier: "TestVerifier"
} as PkceCodes;

const testNetworkResult = {
    testParam: "testValue"
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
    }
}

let authorityInstance: Authority;
let authConfig: ClientConfiguration;

describe("InteractionHandler.ts Unit Tests", () => {

    let authCodeModule: AuthorizationCodeClient;
    let browserStorage: BrowserCacheManager;
    const cryptoOpts = new CryptoOps(testBrowserRequestLogger);

    beforeEach(() => {
        const appConfig: Configuration = {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        };
        const configObj = buildConfiguration(appConfig, true);
        const authorityOptions: AuthorityOptions = {
            protocolMode: ProtocolMode.AAD,
            knownAuthorities: [configObj.auth.authority],
            cloudDiscoveryMetadata: "",
            authorityMetadata: ""
        }
        authorityInstance = AuthorityFactory.createInstance(configObj.auth.authority, networkInterface, browserStorage, authorityOptions);
        authConfig = {
            authOptions: {
                ...configObj.auth,
                authority: authorityInstance,
            },
            systemOptions: {
                tokenRenewalOffsetSeconds: configObj.system.tokenRenewalOffsetSeconds
            },
            cryptoInterface: cryptoInterface,
            storageInterface: new TestStorageManager(TEST_CONFIG.MSAL_CLIENT_ID, cryptoInterface),
            networkInterface: {
                sendGetRequestAsync: async (url: string, options?: NetworkRequestOptions): Promise<any> => {
                    return testNetworkResult;
                },
                sendPostRequestAsync: async (url: string, options?: NetworkRequestOptions): Promise<any> => {
                    return testNetworkResult;
                }
            },
            loggerOptions: {
                loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {},
                piiLoggingEnabled: true
            }
        };
        authCodeModule = new AuthorizationCodeClient(authConfig);
        const logger = new Logger(authConfig.loggerOptions!);
        browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, configObj.cache, cryptoOpts, logger);
    });

    afterEach(() => {
        sinon.restore();
    });

    it("Constructor", () => {
        const interactionHandler = new TestInteractionHandler(authCodeModule, browserStorage);

        expect(interactionHandler).toBeInstanceOf(TestInteractionHandler);
        expect(interactionHandler).toBeInstanceOf(InteractionHandler);
    });

    describe("handleCodeResponseFromServer()", () => {
        it("successfully handle code from server response", async () => {
            const idTokenClaims = {
                "ver": "2.0",
                "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": "1536361411",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "nonce": "123523"
            };
            const testCodeResponse: AuthorizationCodePayload = {
                code: "authcode",
                nonce: idTokenClaims.nonce,
                state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                cloud_instance_host_name: "contoso.com"
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                environment: "login.windows.net",
                tenantId: idTokenClaims.tid,
                username: idTokenClaims.preferred_username,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_LOCAL_ACCOUNT_ID
            };
            const testCcsCred: CcsCredential = {
                credential: idTokenClaims.preferred_username || "",
                type: CcsCredentialType.UPN
            };
            const testTokenResponse: AuthenticationResult = {
                authority: authorityInstance.canonicalAuthority,
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                idToken: TEST_TOKENS.IDTOKEN_V2,
                fromCache: false,
                scopes: ["scope1", "scope2"],
                account: testAccount,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(Date.now() + (TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN * 1000)),
                idTokenClaims: idTokenClaims,
                tenantId: idTokenClaims.tid,
                uniqueId: idTokenClaims.oid,
                state: "testState",
                tokenType: AuthenticationScheme.BEARER
            };
            testAuthCodeRequest.ccsCredential = testCcsCred;
            browserStorage.setTemporaryCache(browserStorage.generateStateKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT), TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            browserStorage.setTemporaryCache(browserStorage.generateNonceKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT), idTokenClaims.nonce);
            browserStorage.setTemporaryCache(TemporaryCacheKeys.CCS_CREDENTIAL, JSON.stringify(CcsCredentialType));
            
            sinon.stub(Authority.prototype, "isAlias").returns(false);
            const authorityOptions: AuthorityOptions = {
                protocolMode: ProtocolMode.AAD,
                knownAuthorities: ["www.contoso.com"],
                cloudDiscoveryMetadata: "",
                authorityMetadata: ""
            }
            const authority = new Authority("https://www.contoso.com/common/", networkInterface, browserStorage, authorityOptions);
            sinon.stub(AuthorityFactory, "createDiscoveredInstance").resolves(authority);
            sinon.stub(Authority.prototype, "discoveryComplete").returns(true);
            const updateAuthoritySpy = sinon.spy(AuthorizationCodeClient.prototype, "updateAuthority");
            const acquireTokenSpy = sinon.stub(AuthorizationCodeClient.prototype, "acquireToken").resolves(testTokenResponse);
            const interactionHandler = new TestInteractionHandler(authCodeModule, browserStorage);
            await interactionHandler.initiateAuthRequest("testNavUrl");

            const tokenResponse = await interactionHandler.handleCodeResponseFromServer(testCodeResponse, TEST_STATE_VALUES.TEST_STATE_REDIRECT, authorityInstance, authConfig.networkInterface!);

            expect(updateAuthoritySpy.calledWith(authority)).toBe(true);
            expect(tokenResponse).toEqual(testTokenResponse);
            expect(acquireTokenSpy.calledWith(testAuthCodeRequest, testCodeResponse)).toBe(true);
            expect(acquireTokenSpy.threw()).toBe(false);
        });
    });

    describe("handleCodeResponseFromHash()", () => {

        it("throws error if given location hash is empty", async () => {
            const interactionHandler = new TestInteractionHandler(authCodeModule, browserStorage);
            expect(interactionHandler.handleCodeResponseFromHash("", "", authorityInstance, authConfig.networkInterface!)).rejects.toMatchObject(BrowserAuthError.createEmptyHashError(""));
            //@ts-ignore
            expect(interactionHandler.handleCodeResponseFromHash(null, "", authorityInstance, authConfig.networkInterface)).rejects.toMatchObject(BrowserAuthError.createEmptyHashError(null));
        });
        
        // TODO: Need to improve these tests
        it("successfully uses a new authority if cloud_instance_host_name is different", async () => {
            const idTokenClaims = {
                "ver": "2.0",
                "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": "1536361411",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "nonce": "123523"
            };
            const testCodeResponse: AuthorizationCodePayload = {
                code: "authcode",
                nonce: idTokenClaims.nonce,
                state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                cloud_instance_host_name: "contoso.com"
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                environment: "login.windows.net",
                tenantId: idTokenClaims.tid,
                username: idTokenClaims.preferred_username,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_LOCAL_ACCOUNT_ID
            };
            const testTokenResponse: AuthenticationResult = {
                authority: authorityInstance.canonicalAuthority,
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                idToken: TEST_TOKENS.IDTOKEN_V2,
                fromCache: false,
                scopes: ["scope1", "scope2"],
                account: testAccount,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(Date.now() + (TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN * 1000)),
                idTokenClaims: idTokenClaims,
                tenantId: idTokenClaims.tid,
                uniqueId: idTokenClaims.oid,
                state: "testState",
                tokenType: AuthenticationScheme.BEARER
            };
            browserStorage.setTemporaryCache(browserStorage.generateStateKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT), TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            browserStorage.setTemporaryCache(browserStorage.generateNonceKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT), idTokenClaims.nonce);
            sinon.stub(AuthorizationCodeClient.prototype, "handleFragmentResponse").returns(testCodeResponse);
            sinon.stub(Authority.prototype, "isAlias").returns(false);
            const authorityOptions: AuthorityOptions = {
                protocolMode: ProtocolMode.AAD,
                knownAuthorities: ["www.contoso.com"],
                cloudDiscoveryMetadata: "",
                authorityMetadata: ""
            }
            const authority = new Authority("https://www.contoso.com/common/", networkInterface, browserStorage, authorityOptions);
            sinon.stub(AuthorityFactory, "createDiscoveredInstance").resolves(authority);
            sinon.stub(Authority.prototype, "discoveryComplete").returns(true);
            const updateAuthoritySpy = sinon.spy(AuthorizationCodeClient.prototype, "updateAuthority");
            const acquireTokenSpy = sinon.stub(AuthorizationCodeClient.prototype, "acquireToken").resolves(testTokenResponse);
            const interactionHandler = new TestInteractionHandler(authCodeModule, browserStorage);
            await interactionHandler.initiateAuthRequest("testNavUrl");
            const tokenResponse = await interactionHandler.handleCodeResponseFromHash(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT, TEST_STATE_VALUES.TEST_STATE_REDIRECT, authorityInstance, authConfig.networkInterface!);
            expect(updateAuthoritySpy.calledWith(authority)).toBe(true);
            expect(tokenResponse).toEqual(testTokenResponse);
            expect(acquireTokenSpy.calledWith(testAuthCodeRequest, testCodeResponse)).toBe(true);
            expect(acquireTokenSpy.threw()).toBe(false);
        });

        it("successfully adds login_hint as CCS credential to auth code request", async () => {
            const idTokenClaims = {
                "ver": "2.0",
                "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": "1536361411",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "nonce": "123523"
            };
            const testCodeResponse: AuthorizationCodePayload = {
                code: "authcode",
                nonce: idTokenClaims.nonce,
                state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                cloud_instance_host_name: "contoso.com"
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                environment: "login.windows.net",
                tenantId: idTokenClaims.tid,
                username: idTokenClaims.preferred_username,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_LOCAL_ACCOUNT_ID
            };
            const testCcsCred: CcsCredential = {
                credential: idTokenClaims.preferred_username || "",
                type: CcsCredentialType.UPN
            };
            const testTokenResponse: AuthenticationResult = {
                authority: authorityInstance.canonicalAuthority,
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                idToken: TEST_TOKENS.IDTOKEN_V2,
                fromCache: false,
                scopes: ["scope1", "scope2"],
                account: testAccount,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(Date.now() + (TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN * 1000)),
                idTokenClaims: idTokenClaims,
                tenantId: idTokenClaims.tid,
                uniqueId: idTokenClaims.oid,
                state: "testState",
                tokenType: AuthenticationScheme.BEARER
            };
            testAuthCodeRequest.ccsCredential = testCcsCred;
            browserStorage.setTemporaryCache(browserStorage.generateStateKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT), TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            browserStorage.setTemporaryCache(browserStorage.generateNonceKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT), idTokenClaims.nonce);
            browserStorage.setTemporaryCache(TemporaryCacheKeys.CCS_CREDENTIAL, JSON.stringify(CcsCredentialType));
            sinon.stub(AuthorizationCodeClient.prototype, "handleFragmentResponse").returns(testCodeResponse);
            sinon.stub(Authority.prototype, "isAlias").returns(false);
            const authorityOptions: AuthorityOptions = {
                protocolMode: ProtocolMode.AAD,
                knownAuthorities: ["www.contoso.com"],
                cloudDiscoveryMetadata: "",
                authorityMetadata: ""
            }
            const authority = new Authority("https://www.contoso.com/common/", networkInterface, browserStorage, authorityOptions);
            sinon.stub(AuthorityFactory, "createDiscoveredInstance").resolves(authority);
            sinon.stub(Authority.prototype, "discoveryComplete").returns(true);
            const updateAuthoritySpy = sinon.spy(AuthorizationCodeClient.prototype, "updateAuthority");
            const acquireTokenSpy = sinon.stub(AuthorizationCodeClient.prototype, "acquireToken").resolves(testTokenResponse);
            const interactionHandler = new TestInteractionHandler(authCodeModule, browserStorage);
            await interactionHandler.initiateAuthRequest("testNavUrl");
            const tokenResponse = await interactionHandler.handleCodeResponseFromHash(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT, TEST_STATE_VALUES.TEST_STATE_REDIRECT, authorityInstance, authConfig.networkInterface!);
            expect(updateAuthoritySpy.calledWith(authority)).toBe(true);
            expect(tokenResponse).toEqual(testTokenResponse);
            expect(acquireTokenSpy.calledWith(testAuthCodeRequest, testCodeResponse)).toBe(true);
            expect(acquireTokenSpy.threw()).toBe(false);
        });
    });
});
