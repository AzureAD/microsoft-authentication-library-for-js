/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationScheme, AccountInfo, PromptValue, AuthenticationResult, AccountEntity, IdTokenEntity, AccessTokenEntity, CredentialType, TimeUtils, CacheManager} from "@azure/msal-common";
import sinon from "sinon";
import { NativeMessageHandler } from "../../src/broker/nativeBroker/NativeMessageHandler";
import { ApiId } from "../../src/utils/BrowserConstants";
import { NativeInteractionClient } from "../../src/interaction_client/NativeInteractionClient";
import { PublicClientApplication } from "../../src/app/PublicClientApplication";
import { ID_TOKEN_CLAIMS, RANDOM_TEST_GUID, TEST_CONFIG, TEST_DATA_CLIENT_INFO, TEST_TOKENS } from "../utils/StringConstants";
import { NavigationClient } from "../../src/navigation/NavigationClient";
import { BrowserAuthErrorMessage } from "../../src/error/BrowserAuthError";
import { NativeAuthError, NativeAuthErrorMessage } from "../../src/error/NativeAuthError";
import { SilentCacheClient } from "../../src/interaction_client/SilentCacheClient";
import { NativeExtensionRequestBody } from "../../src/broker/nativeBroker/NativeRequest";

const networkInterface = {
    sendGetRequestAsync<T>(): T {
        return {} as T;
    },
    sendPostRequestAsync<T>(): T {
        return {} as T;
    },
};

const testAccountEntity: AccountEntity = new AccountEntity();
testAccountEntity.homeAccountId = `${ID_TOKEN_CLAIMS.oid}.${ID_TOKEN_CLAIMS.tid}`;
testAccountEntity.localAccountId = ID_TOKEN_CLAIMS.oid;
testAccountEntity.environment = "login.microsoftonline.com";
testAccountEntity.realm = ID_TOKEN_CLAIMS.tid;
testAccountEntity.username = ID_TOKEN_CLAIMS.preferred_username;
testAccountEntity.name = ID_TOKEN_CLAIMS.name;
testAccountEntity.authorityType = "MSSTS";
testAccountEntity.nativeAccountId = "nativeAccountId";

const testAccountInfo: AccountInfo = testAccountEntity.getAccountInfo();

const testIdToken: IdTokenEntity = new IdTokenEntity();
testIdToken.homeAccountId = `${ID_TOKEN_CLAIMS.oid}.${ID_TOKEN_CLAIMS.tid}`;
testIdToken.clientId = TEST_CONFIG.MSAL_CLIENT_ID;
testIdToken.environment = testAccountEntity.environment;
testIdToken.realm = ID_TOKEN_CLAIMS.tid;
testIdToken.secret = TEST_TOKENS.IDTOKEN_V2;
testIdToken.credentialType = CredentialType.ID_TOKEN;

const testAccessTokenEntity: AccessTokenEntity = new AccessTokenEntity();
testAccessTokenEntity.homeAccountId = `${ID_TOKEN_CLAIMS.oid}.${ID_TOKEN_CLAIMS.tid}`;
testAccessTokenEntity.clientId = TEST_CONFIG.MSAL_CLIENT_ID;
testAccessTokenEntity.environment = testAccountEntity.environment;
testAccessTokenEntity.realm = ID_TOKEN_CLAIMS.tid;
testAccessTokenEntity.secret = TEST_TOKENS.ACCESS_TOKEN;
testAccessTokenEntity.target = TEST_CONFIG.DEFAULT_SCOPES.join(" ");
testAccessTokenEntity.credentialType = CredentialType.ACCESS_TOKEN;
testAccessTokenEntity.expiresOn = `${TimeUtils.nowSeconds() + TEST_CONFIG.TOKEN_EXPIRY}`;
testAccessTokenEntity.cachedAt = `${TimeUtils.nowSeconds()}`;
testAccessTokenEntity.tokenType = AuthenticationScheme.BEARER;

describe("NativeInteractionClient Tests", () => {
    globalThis.MessageChannel = require("worker_threads").MessageChannel; // jsdom does not include an implementation for MessageChannel

    const pca = new PublicClientApplication({
        auth: {
            clientId: TEST_CONFIG.MSAL_CLIENT_ID
        }
    });
    const wamProvider = new NativeMessageHandler(pca.getLogger(), 2000);
    // @ts-ignore
    const nativeInteractionClient = new NativeInteractionClient(pca.config, pca.browserStorage, pca.browserCrypto, pca.getLogger(), pca.eventHandler, pca.navigationClient, ApiId.acquireTokenRedirect, pca.performanceClient, wamProvider, "nativeAccountId", pca.nativeInternalStorage, RANDOM_TEST_GUID);
    let postMessageSpy: sinon.SinonSpy;
    let mcPort: MessagePort;

    beforeEach(() => {
        postMessageSpy = sinon.spy(window, "postMessage");
        sinon.stub(MessageEvent.prototype, "source").get(() => window); // source property not set by jsdom window messaging APIs
    });

    afterEach(() => {
        mcPort && mcPort.close();
        sinon.restore();
        sessionStorage.clear();
        localStorage.clear();
    });

    describe("acquireTokensFromInternalCache Tests", () => {

        const response: AuthenticationResult = {
            authority: TEST_CONFIG.validAuthority,
            uniqueId: testAccountInfo.localAccountId,
            tenantId: testAccountInfo.tenantId,
            scopes: TEST_CONFIG.DEFAULT_SCOPES,
            account: testAccountInfo,
            idToken: TEST_TOKENS.IDTOKEN_V2,
            accessToken: TEST_TOKENS.ACCESS_TOKEN,
            idTokenClaims: ID_TOKEN_CLAIMS,
            fromCache: true,
            correlationId: RANDOM_TEST_GUID,
            expiresOn: new Date(Number(testAccessTokenEntity.expiresOn) * 1000),
            tokenType: AuthenticationScheme.BEARER
        };

        sinon.stub(CacheManager.prototype, "readAccountFromCacheWithNativeAccountId").returns(testAccountEntity);
        sinon.stub(SilentCacheClient.prototype, "acquireToken").callsFake(() => { return Promise.resolve(response); });

        it("Tokens found in cache", async () => {
            const response = await nativeInteractionClient.acquireToken({ scopes: TEST_CONFIG.DEFAULT_SCOPES });
            expect(response.accessToken).toEqual(testAccessTokenEntity.secret);
            expect(response.idToken).toEqual(testIdToken.secret);
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toEqual(TEST_CONFIG.DEFAULT_SCOPES);
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(testAccountEntity.getAccountInfo());
            expect(response.tokenType).toEqual(AuthenticationScheme.BEARER);
        });
    });

    describe("acquireToken Tests", () => {
        it("acquires token successfully", async () => {
            const mockWamResponse = {
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
                scope: "User.Read",
                expires_in: 3600,
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                account: {
                    id: "nativeAccountId"
                },
                properties: {}
            };

            const testAccount: AccountInfo = {
                homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
                localAccountId: ID_TOKEN_CLAIMS.oid,
                environment: "login.windows.net",
                tenantId: ID_TOKEN_CLAIMS.tid,
                username: ID_TOKEN_CLAIMS.preferred_username,
                name: ID_TOKEN_CLAIMS.name,
                idTokenClaims: ID_TOKEN_CLAIMS,
                nativeAccountId: mockWamResponse.account.id
            };
            sinon.stub(NativeMessageHandler.prototype, "sendMessage").callsFake((): Promise<object> => {
                return Promise.resolve(mockWamResponse);
            });
            const response = await nativeInteractionClient.acquireToken({scopes: ["User.Read"]});
            expect(response.accessToken).toEqual(mockWamResponse.access_token);
            expect(response.idToken).toEqual(mockWamResponse.id_token);
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toContain(mockWamResponse.scope);
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(testAccount);
            expect(response.tokenType).toEqual(AuthenticationScheme.BEARER);
        });

        it("throws if prompt: select_account", (done) => {
            nativeInteractionClient.acquireToken({
                scopes: ["User.Read"],
                prompt: PromptValue.SELECT_ACCOUNT
            }).catch (e => {
                expect(e.errorCode).toBe(BrowserAuthErrorMessage.nativePromptNotSupported.code);
                expect(e.errorMessage).toBe(BrowserAuthErrorMessage.nativePromptNotSupported.desc);
                done();
            });
        });

        it("throws if prompt: create", (done) => {
            nativeInteractionClient.acquireToken({
                scopes: ["User.Read"],
                prompt: PromptValue.CREATE
            }).catch (e => {
                expect(e.errorCode).toBe(BrowserAuthErrorMessage.nativePromptNotSupported.code);
                expect(e.errorMessage).toBe(BrowserAuthErrorMessage.nativePromptNotSupported.desc);
                done();
            });
        });

        it("prompt: none succeeds", async () => {
            const mockWamResponse = {
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
                scope: "User.Read",
                expires_in: 3600,
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                account: {
                    id: "nativeAccountId"
                },
                properties: {}
            };

            const testAccount: AccountInfo = {
                homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
                localAccountId: ID_TOKEN_CLAIMS.oid,
                environment: "login.windows.net",
                tenantId: ID_TOKEN_CLAIMS.tid,
                username: ID_TOKEN_CLAIMS.preferred_username,
                name: ID_TOKEN_CLAIMS.name,
                idTokenClaims: ID_TOKEN_CLAIMS,
                nativeAccountId: mockWamResponse.account.id
            };
            sinon.stub(NativeMessageHandler.prototype, "sendMessage").callsFake((): Promise<object> => {
                return Promise.resolve(mockWamResponse);
            });
            const response = await nativeInteractionClient.acquireToken({
                scopes: ["User.Read"],
                prompt: PromptValue.NONE
            });
            expect(response.accessToken).toEqual(mockWamResponse.access_token);
            expect(response.idToken).toEqual(mockWamResponse.id_token);
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toContain(mockWamResponse.scope);
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(testAccount);
            expect(response.tokenType).toEqual(AuthenticationScheme.BEARER);
        });

        it("prompt: consent succeeds", async () => {
            const mockWamResponse = {
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
                scope: "User.Read",
                expires_in: 3600,
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                account: {
                    id: "nativeAccountId"
                },
                properties: {}
            };

            const testAccount: AccountInfo = {
                homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
                localAccountId: ID_TOKEN_CLAIMS.oid,
                environment: "login.windows.net",
                tenantId: ID_TOKEN_CLAIMS.tid,
                username: ID_TOKEN_CLAIMS.preferred_username,
                name: ID_TOKEN_CLAIMS.name,
                idTokenClaims: ID_TOKEN_CLAIMS,
                nativeAccountId: mockWamResponse.account.id
            };
            sinon.stub(NativeMessageHandler.prototype, "sendMessage").callsFake((): Promise<object> => {
                return Promise.resolve(mockWamResponse);
            });
            const response = await nativeInteractionClient.acquireToken({
                scopes: ["User.Read"],
                prompt: PromptValue.CONSENT
            });
            expect(response.accessToken).toEqual(mockWamResponse.access_token);
            expect(response.idToken).toEqual(mockWamResponse.id_token);
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toContain(mockWamResponse.scope);
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(testAccount);
            expect(response.tokenType).toEqual(AuthenticationScheme.BEARER);
        });

        it("prompt: login succeeds", async () => {
            const mockWamResponse = {
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
                scope: "User.Read",
                expires_in: 3600,
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                account: {
                    id: "nativeAccountId"
                },
                properties: {}
            };

            const testAccount: AccountInfo = {
                homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
                localAccountId: ID_TOKEN_CLAIMS.oid,
                environment: "login.windows.net",
                tenantId: ID_TOKEN_CLAIMS.tid,
                username: ID_TOKEN_CLAIMS.preferred_username,
                name: ID_TOKEN_CLAIMS.name,
                idTokenClaims: ID_TOKEN_CLAIMS,
                nativeAccountId: mockWamResponse.account.id
            };
            sinon.stub(NativeMessageHandler.prototype, "sendMessage").callsFake((): Promise<object> => {
                return Promise.resolve(mockWamResponse);
            });
            const response = await nativeInteractionClient.acquireToken({
                scopes: ["User.Read"],
                prompt: PromptValue.LOGIN
            });
            expect(response.accessToken).toEqual(mockWamResponse.access_token);
            expect(response.idToken).toEqual(mockWamResponse.id_token);
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toContain(mockWamResponse.scope);
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(testAccount);
            expect(response.tokenType).toEqual(AuthenticationScheme.BEARER);
        });

        it("throws on account switch", (done) => {
            const mockWamResponse = {
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
                scope: "User.Read",
                expires_in: 3600,
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                account: {
                    id: "different-nativeAccountId"
                },
                properties: {}
            };

            sinon.stub(NativeMessageHandler.prototype, "sendMessage").callsFake((): Promise<object> => {
                return Promise.resolve(mockWamResponse);
            });
            nativeInteractionClient.acquireToken({
                scopes: ["User.Read"]
            }).catch (e => {
                expect(e.errorCode).toBe(NativeAuthErrorMessage.userSwitch.code);
                expect(e.errorMessage).toBe(NativeAuthErrorMessage.userSwitch.desc);
                done();
            });
        });

        it("ssoSilent overwrites prompt to be 'none' and succeeds", async () => {
            const mockWamResponse = {
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
                scope: "User.Read",
                expires_in: 3600,
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                account: {
                    id: "nativeAccountId"
                },
                properties: {}
            };

            const testAccount: AccountInfo = {
                homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
                localAccountId: ID_TOKEN_CLAIMS.oid,
                environment: "login.windows.net",
                tenantId: ID_TOKEN_CLAIMS.tid,
                username: ID_TOKEN_CLAIMS.preferred_username,
                name: ID_TOKEN_CLAIMS.name,
                idTokenClaims: ID_TOKEN_CLAIMS,
                nativeAccountId: mockWamResponse.account.id
            };
            sinon.stub(NativeMessageHandler.prototype, "sendMessage").callsFake((nativeRequest): Promise<object> => {
                expect(nativeRequest.request && nativeRequest.request.prompt).toBe(PromptValue.NONE);
                return Promise.resolve(mockWamResponse);
            });
            // @ts-ignore
            const nativeInteractionClient = new NativeInteractionClient(pca.config, pca.browserStorage, pca.browserCrypto, pca.getLogger(), pca.eventHandler, pca.navigationClient, ApiId.ssoSilent, pca.performanceClient, wamProvider, "nativeAccountId", pca.nativeInternalStorage, RANDOM_TEST_GUID);
            const response = await nativeInteractionClient.acquireToken({
                scopes: ["User.Read"],
                prompt: PromptValue.SELECT_ACCOUNT
            });
            expect(response.accessToken).toEqual(mockWamResponse.access_token);
            expect(response.idToken).toEqual(mockWamResponse.id_token);
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toContain(mockWamResponse.scope);
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(testAccount);
            expect(response.tokenType).toEqual(AuthenticationScheme.BEARER);
        });

        it("acquireTokenSilent overwrites prompt to be 'none' and succeeds", async () => {
            const mockWamResponse = {
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
                scope: "User.Read",
                expires_in: 3600,
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                account: {
                    id: "nativeAccountId"
                },
                properties: {}
            };

            const testAccount: AccountInfo = {
                homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
                localAccountId: ID_TOKEN_CLAIMS.oid,
                environment: "login.windows.net",
                tenantId: ID_TOKEN_CLAIMS.tid,
                username: ID_TOKEN_CLAIMS.preferred_username,
                name: ID_TOKEN_CLAIMS.name,
                idTokenClaims: ID_TOKEN_CLAIMS,
                nativeAccountId: mockWamResponse.account.id
            };
            sinon.stub(NativeMessageHandler.prototype, "sendMessage").callsFake((nativeRequest): Promise<object> => {
                expect(nativeRequest.request && nativeRequest.request.prompt).toBe(PromptValue.NONE);
                return Promise.resolve(mockWamResponse);
            });
            // @ts-ignore
            const nativeInteractionClient = new NativeInteractionClient(pca.config, pca.browserStorage, pca.browserCrypto, pca.getLogger(), pca.eventHandler, pca.navigationClient, ApiId.acquireTokenSilent_silentFlow, pca.performanceClient, wamProvider, "nativeAccountId", pca.nativeInternalStorage, RANDOM_TEST_GUID);
            const response = await nativeInteractionClient.acquireToken({
                scopes: ["User.Read"],
                prompt: PromptValue.SELECT_ACCOUNT
            });
            expect(response.accessToken).toEqual(mockWamResponse.access_token);
            expect(response.idToken).toEqual(mockWamResponse.id_token);
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toContain(mockWamResponse.scope);
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(testAccount);
            expect(response.tokenType).toEqual(AuthenticationScheme.BEARER);
        });
    });

    describe("acquireTokenRedirect tests", () => {
        it("acquires token successfully then redirects to start page", (done) => {
            const mockWamResponse = {
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
                scope: "User.Read",
                expires_in: 3600,
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                account: {
                    id: "nativeAccountId"
                },
                properties: {}
            };

            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((url: string) => {
                expect(url).toBe(window.location.href);
                done();
                return Promise.resolve(true);
            });
            sinon.stub(NativeMessageHandler.prototype, "sendMessage").callsFake((): Promise<object> => {
                return Promise.resolve(mockWamResponse);
            });
            nativeInteractionClient.acquireTokenRedirect({scopes: ["User.Read"]});
        });

        it("throws if native token acquisition fails with fatal error", (done) => {
            sinon.stub(NativeMessageHandler.prototype, "sendMessage").callsFake((): Promise<object> => {
                return Promise.reject(new NativeAuthError("ContentError", "problem getting response from extension"));
            });
            nativeInteractionClient.acquireTokenRedirect({scopes: ["User.Read"]}).catch((e) => {
                expect(e.errorCode).toBe("ContentError");
                done();
            });
        });
    });

    describe("handleRedirectPromise tests", () => {
        it("successfully returns response from native broker", async () => {
            const mockWamResponse = {
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
                scope: "User.Read",
                expires_in: 3600,
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                account: {
                    id: "nativeAccountId"
                },
                properties: {}
            };

            const testAccount: AccountInfo = {
                homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
                localAccountId: ID_TOKEN_CLAIMS.oid,
                environment: "login.windows.net",
                tenantId: ID_TOKEN_CLAIMS.tid,
                username: ID_TOKEN_CLAIMS.preferred_username,
                name: ID_TOKEN_CLAIMS.name,
                idTokenClaims: ID_TOKEN_CLAIMS,
                nativeAccountId: mockWamResponse.account.id
            };

            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((url: string) => {
                expect(url).toBe(window.location.href);
                return Promise.resolve(true);
            });
            sinon.stub(NativeMessageHandler.prototype, "sendMessage").callsFake((): Promise<object> => {
                return Promise.resolve(mockWamResponse);
            });
            // @ts-ignore
            pca.browserStorage.setInteractionInProgress(true);
            await nativeInteractionClient.acquireTokenRedirect({scopes: ["User.Read"]});
            const response = await nativeInteractionClient.handleRedirectPromise();
            expect(response).not.toBe(null);

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: mockWamResponse.scope.split(" "),
                idToken: mockWamResponse.id_token,
                idTokenClaims: ID_TOKEN_CLAIMS,
                accessToken: mockWamResponse.access_token,
                fromCache: false,
                state: undefined,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: response && response.expiresOn, // Steal the expires on from the response as this is variable
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
                fromNativeBroker: true
            };
            expect(response).toEqual(testTokenResponse);
        });

        it("If request includes a prompt value it is ignored on the 2nd call to native broker", async () => {
            // The user should not be prompted twice, prompt value should only be used on the first call to the native broker (before returning to the redirect uri). Native broker calls from handleRedirectPromise should ignore the prompt.
            const mockWamResponse = {
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
                scope: "User.Read",
                expires_in: 3600,
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                account: {
                    id: "nativeAccountId"
                },
                properties: {}
            };

            const testAccount: AccountInfo = {
                homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
                localAccountId: ID_TOKEN_CLAIMS.oid,
                environment: "login.windows.net",
                tenantId: ID_TOKEN_CLAIMS.tid,
                username: ID_TOKEN_CLAIMS.preferred_username,
                name: ID_TOKEN_CLAIMS.name,
                idTokenClaims: ID_TOKEN_CLAIMS,
                nativeAccountId: mockWamResponse.account.id
            };

            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((url: string) => {
                expect(url).toBe(window.location.href);
                return Promise.resolve(true);
            });
            sinon.stub(NativeMessageHandler.prototype, "sendMessage").callsFake((messageBody: NativeExtensionRequestBody): Promise<object> => {
                expect(messageBody.request && messageBody.request.prompt).toBe(undefined);
                return Promise.resolve(mockWamResponse);
            });
            // @ts-ignore
            pca.browserStorage.setInteractionInProgress(true);
            await nativeInteractionClient.acquireTokenRedirect({scopes: ["User.Read"], prompt: "login"});
            const response = await nativeInteractionClient.handleRedirectPromise();
            expect(response).not.toBe(null);

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: mockWamResponse.scope.split(" "),
                idToken: mockWamResponse.id_token,
                idTokenClaims: ID_TOKEN_CLAIMS,
                accessToken: mockWamResponse.access_token,
                fromCache: false,
                state: undefined,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: response && response.expiresOn, // Steal the expires on from the response as this is variable
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
                fromNativeBroker: true
            };
            expect(response).toEqual(testTokenResponse);
        });

        it("clears interaction in progress if native broker call fails", (done) => {
            const mockWamResponse = {
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
                scope: "User.Read",
                expires_in: 3600,
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                account: {
                    id: "nativeAccountId"
                },
                properties: {}
            };

            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((url: string) => {
                expect(url).toBe(window.location.href);
                return Promise.resolve(true);
            });
            let firstTime = true;
            sinon.stub(NativeMessageHandler.prototype, "sendMessage").callsFake((): Promise<object> => {
                if (firstTime) {
                    firstTime = false;
                    return Promise.resolve(mockWamResponse); // The acquireTokenRedirect call should succeed
                }
                return Promise.reject(new NativeAuthError("ContentError", "extension call failed")); // handleRedirectPromise call should fail
            });
            // @ts-ignore
            pca.browserStorage.setInteractionInProgress(true);
            nativeInteractionClient.acquireTokenRedirect({ scopes: ["User.Read"] }).then(() => {
                // @ts-ignore
                const inProgress = pca.browserStorage.getInteractionInProgress();
                expect(inProgress).toBeTruthy();
                nativeInteractionClient.handleRedirectPromise().catch((e) => {
                    expect(e.errorCode).toBe("ContentError");
                    // @ts-ignore
                    const isInProgress = pca.browserStorage.getInteractionInProgress();
                    expect(isInProgress).toBeFalsy();
                    done();
                });
            });
        });

        it("returns null if interaction is not in progress", async () => {
            const mockWamResponse = {
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
                scope: "User.Read",
                expires_in: 3600,
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                account: {
                    id: "nativeAccountId"
                },
                properties: {}
            };

            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((url: string) => {
                expect(url).toBe(window.location.href);
                return Promise.resolve(true);
            });
            sinon.stub(NativeMessageHandler.prototype, "sendMessage").callsFake((): Promise<object> => {
                return Promise.resolve(mockWamResponse);
            });
            await nativeInteractionClient.acquireTokenRedirect({scopes: ["User.Read"]});
            const response = await nativeInteractionClient.handleRedirectPromise();
            expect(response).toBe(null);
        });

        it("returns null if native request is not cached", async () => {
            // @ts-ignore
            pca.browserStorage.setInteractionInProgress(true);
            const response = await nativeInteractionClient.handleRedirectPromise();
            expect(response).toBe(null);
        });
    });

});
