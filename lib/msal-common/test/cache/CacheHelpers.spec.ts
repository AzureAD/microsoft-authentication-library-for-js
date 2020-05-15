import { expect } from "chai";
import { CacheHelpers } from "../../src/cache/CacheHelpers";
import { TEST_DATA_CLIENT_INFO, RANDOM_TEST_GUID, TEST_TOKENS, TEST_CONFIG, TEST_URIS, TEST_TOKEN_LIFETIMES } from "../utils/StringConstants";
import sinon from "sinon";
import { TemporaryCacheKeys, Constants } from "../../src/utils/Constants";
import { INetworkModule, NetworkRequestOptions } from "../../src/network/INetworkModule";
import { AadAuthority } from "../../src/authority/AadAuthority";
import { IdTokenClaims } from "../../src/account/IdTokenClaims";
import { IdToken } from "../../src/account/IdToken";
import { buildClientInfo, ClientInfo } from "../../src/account/ClientInfo";
import { Account } from "../../src/account/Account";
import { ICrypto, PkceCodes } from "../../src/crypto/ICrypto";
import { ServerCodeRequestParameters } from "../../src/server/ServerCodeRequestParameters";
import { AuthenticationParameters } from "../../src/request/AuthenticationParameters";
import { AccessTokenKey } from "../../src/cache/AccessTokenKey";
import { AccessTokenValue } from "../../src/cache/AccessTokenValue";
import { AccessTokenCacheItem } from "../../src/cache/AccessTokenCacheItem";
import { ICacheStorageAsync } from "../../src";

describe("CacheHelpers.ts Tests", () => {

    let store = {};
    describe("Constructors", () => {

        beforeEach(() => {
            store = {};
        });

        it("Creates a CacheHelpers class instance", () => {
            const cacheStorage: ICacheStorageAsync = {
                async setItem(key: string, value: string): Promise<void> {
                    store[key] = value;
                },
                async getItem(key: string): Promise<string> {
                    return store[key];
                },
                async removeItem(key: string): Promise<void> {
                    delete store[key];
                },
                async containsKey(key: string): Promise<boolean> {
                    return !!store[key];
                },
                async getKeys(): Promise<Array<string>> {
                    return Object.keys(store);
                },
                async clear(): Promise<void> {
                    store = {};
                },
                getCache() { return null },
                setCache() { return null; }
            };

            const cacheHelpers = new CacheHelpers(cacheStorage);
            expect(cacheHelpers instanceof CacheHelpers).to.be.true;
        });
    });

    describe("Generator functions", () => {

        let cacheHelpers: CacheHelpers;
        beforeEach(() => {
            const cacheStorage: ICacheStorageAsync = {
                async setItem(key: string, value: string): Promise<void> {
                    store[key] = value;
                },
                async getItem(key: string): Promise<string> {
                    return store[key];
                },
                async removeItem(key: string): Promise<void> {
                    delete store[key];
                },
                async containsKey(key: string): Promise<boolean> {
                    return !!store[key];
                },
                async getKeys(): Promise<Array<string>> {
                    return Object.keys(store);
                },
                async clear(): Promise<void> {
                    store = {};
                },
                getCache() { return null },
                setCache() { return null; }
            };

            cacheHelpers = new CacheHelpers(cacheStorage);
        });

        afterEach(() => {
            store = {};
        });

        it("generateAcquireTokenAccountKey() creates a valid cache key for account object", () => {
            const accountKey = cacheHelpers.generateAcquireTokenAccountKey(TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID);
            expect(accountKey).to.be.eq(`${TemporaryCacheKeys.ACQUIRE_TOKEN_ACCOUNT}${Constants.RESOURCE_DELIM}${TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID}`);
        });

        it("generateAuthorityKey() creates a valid cache key for authority strings", () => {
            const authorityKey = cacheHelpers.generateAuthorityKey(RANDOM_TEST_GUID);
            expect(authorityKey).to.be.eq(`${TemporaryCacheKeys.AUTHORITY}${Constants.RESOURCE_DELIM}${RANDOM_TEST_GUID}`);
        });

        it("generateNonceKey() create a valid cache key for nonce strings", () => {
            const nonceKey = cacheHelpers.generateNonceKey(RANDOM_TEST_GUID);
            expect(nonceKey).to.be.eq(`${TemporaryCacheKeys.NONCE_IDTOKEN}${Constants.RESOURCE_DELIM}${RANDOM_TEST_GUID}`);
        });
    });

    describe("Cache Setters", () => {

        let cacheHelpers: CacheHelpers;
        let cryptoInterface: ICrypto;
        let idToken: IdToken;
        let clientInfo: ClientInfo;
        beforeEach(() => {
            const cacheStorage: ICacheStorageAsync = {
                async setItem(key: string, value: string): Promise<void> {
                    store[key] = value;
                },
                async getItem(key: string): Promise<string> {
                    return store[key];
                },
                async removeItem(key: string): Promise<void> {
                    delete store[key];
                },
                async containsKey(key: string): Promise<boolean> {
                    return !!store[key];
                },
                async getKeys(): Promise<Array<string>> {
                    return Object.keys(store);
                },
                async clear(): Promise<void> {
                    store = {};
                },
                getCache() { return null },
                setCache() { return null; }
            };

            cacheHelpers = new CacheHelpers(cacheStorage);

            const idTokenClaims: IdTokenClaims = {
                "ver": "2.0",
                "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": "1536361411",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "sid": "test_session_id",
                "nonce": "123523"
            };
            cryptoInterface = {
                createNewGuid(): string {
                    return RANDOM_TEST_GUID;
                },
                base64Decode(input: string): string {
                    switch (input) {
                        case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                            return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                        default:
                            return input;
                    }
                },
                base64Encode(input: string): string {
                    switch (input) {
                        case "123-test-uid":
                            return "MTIzLXRlc3QtdWlk";
                        case "456-test-utid":
                            return "NDU2LXRlc3QtdXRpZA==";
                        default:
                            return input;
                    }
                },
                async generatePkceCodes(): Promise<PkceCodes> {
                    return {
                        challenge: TEST_CONFIG.TEST_CHALLENGE,
                        verifier: TEST_CONFIG.TEST_VERIFIER
                    }
                }
            };
            sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
            idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);
            clientInfo = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, cryptoInterface);
        });

        afterEach(() => {
            store = {};
            sinon.restore();
        });

        it("setAccountCache() calls generateAcquireTokenAccountKey and sets cache with account", () => {
            const testAccount = Account.createAccount(idToken, clientInfo, cryptoInterface)
            const accountKeySpy = sinon.spy(CacheHelpers.prototype, "generateAcquireTokenAccountKey");
            cacheHelpers.setAccountCache(testAccount);

            expect(accountKeySpy.calledOnce).to.be.true;
            const accountKey = `${TemporaryCacheKeys.ACQUIRE_TOKEN_ACCOUNT}${Constants.RESOURCE_DELIM}${testAccount.homeAccountIdentifier}`;
            expect(store[accountKey]).to.be.eq(JSON.stringify(testAccount));
        });

        it("setAccountCache() uses Constants.NO_ACCOUNT to set cache in the account", async () => {
            const testAccount = Account.createAccount(idToken, clientInfo, cryptoInterface)
            const accountKeySpy = sinon.spy(CacheHelpers.prototype, "generateAcquireTokenAccountKey");
            testAccount.homeAccountIdentifier = "";
            await cacheHelpers.setAccountCache(testAccount);

            expect(accountKeySpy.calledOnce).to.be.true;
            const accountKey = `${TemporaryCacheKeys.ACQUIRE_TOKEN_ACCOUNT}${Constants.RESOURCE_DELIM}${Constants.NO_ACCOUNT}`;
            expect(store[accountKey]).to.be.eq(JSON.stringify(testAccount));
        });

        it("setAuthorityCache() calls generateAuthorityKey and sets cache with authority", async () => {
            const setAuthorityCacheSpy = sinon.spy(CacheHelpers.prototype, "generateAuthorityKey");
            const networkInterface: INetworkModule = {
                sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                },
                sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                }
            };

            const aadAuthority = new AadAuthority(Constants.DEFAULT_AUTHORITY, networkInterface);
            await cacheHelpers.setAuthorityCache(aadAuthority, RANDOM_TEST_GUID);

            expect(setAuthorityCacheSpy.calledOnce).to.be.true;
            const authorityKey = `${TemporaryCacheKeys.AUTHORITY}${Constants.RESOURCE_DELIM}${RANDOM_TEST_GUID}`;
            expect(store[authorityKey]).to.be.eq(`${Constants.DEFAULT_AUTHORITY}/`);
        });
    });

    describe("State functions", () => {

        let cacheHelpers: CacheHelpers;
        let cryptoInterface: ICrypto;
        let serverAuthParams: ServerCodeRequestParameters;
        let testAccount: Account;
        let cacheStorage: ICacheStorageAsync;
        beforeEach(() => {
            cacheStorage = {
                async setItem(key: string, value: string): Promise<void> {
                    store[key] = value;
                },
                async getItem(key: string): Promise<string> {
                    return store[key];
                },
                async removeItem(key: string): Promise<void> {
                    delete store[key];
                },
                async containsKey(key: string): Promise<boolean> {
                    return !!store[key];
                },
                async getKeys(): Promise<Array<string>> {
                    return Object.keys(store);
                },
                async clear(): Promise<void> {
                    store = {};
                },
                getCache() { return null },
                setCache() { return null; }
            };

            cacheHelpers = new CacheHelpers(cacheStorage);
            const networkInterface: INetworkModule = {
                sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                },
                sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                }
            };

            cryptoInterface = {
                createNewGuid(): string {
                    return RANDOM_TEST_GUID;
                },
                base64Decode(input: string): string {
                    switch (input) {
                        case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                            return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                        default:
                            return input;
                    }
                },
                base64Encode(input: string): string {
                    switch (input) {
                        case "123-test-uid":
                            return "MTIzLXRlc3QtdWlk";
                        case "456-test-utid":
                            return "NDU2LXRlc3QtdXRpZA==";
                        default:
                            return input;
                    }
                },
                async generatePkceCodes(): Promise<PkceCodes> {
                    return {
                        challenge: TEST_CONFIG.TEST_CHALLENGE,
                        verifier: TEST_CONFIG.TEST_VERIFIER
                    }
                }
            };
            const idTokenClaims: IdTokenClaims = {
                "ver": "2.0",
                "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": "1536361411",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "sid": "test_session_id",
                "nonce": "123523"
            };
            sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
            const idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);
            const clientInfo = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, cryptoInterface);
            testAccount = Account.createAccount(idToken, clientInfo, cryptoInterface)

            const request: AuthenticationParameters = {};
            const aadAuthority = new AadAuthority(Constants.DEFAULT_AUTHORITY, networkInterface);
            serverAuthParams = new ServerCodeRequestParameters(
                aadAuthority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                request,
                null,
                TEST_URIS.TEST_REDIR_URI,
                cryptoInterface,
                true
            );
        });

        afterEach(() => {
            store = {};
            sinon.restore();
        });

        it("updateCacheEntries() correctly updates the account, authority and state in the cache", async () => {
            const authorityCacheSpy = sinon.spy(CacheHelpers.prototype, "setAuthorityCache");
            const accountCacheSpy = sinon.spy(CacheHelpers.prototype, "setAccountCache");
            await cacheHelpers.updateCacheEntries(serverAuthParams, testAccount);

            expect(accountCacheSpy.calledOnce).to.be.true;
            expect(authorityCacheSpy.calledOnce).to.be.true;
            const accountKey = cacheHelpers.generateAcquireTokenAccountKey(testAccount.homeAccountIdentifier);
            const nonceKey = cacheHelpers.generateNonceKey(RANDOM_TEST_GUID);
            const authorityKey = cacheHelpers.generateAuthorityKey(RANDOM_TEST_GUID);

            expect(store[accountKey]).to.be.eq(JSON.stringify(testAccount));
            expect(store[TemporaryCacheKeys.REQUEST_STATE]).to.be.eq(RANDOM_TEST_GUID);
            expect(store[nonceKey]).to.be.eq(RANDOM_TEST_GUID);
            expect(store[authorityKey]).to.be.eq(`${Constants.DEFAULT_AUTHORITY}/`);
        });

        it("updateCacheEntries() does not set account if account is given as null/empty", async() => {
            const authorityCacheSpy = sinon.spy(CacheHelpers.prototype, "setAuthorityCache");
            const accountCacheSpy = sinon.spy(CacheHelpers.prototype, "setAccountCache");
            await cacheHelpers.updateCacheEntries(serverAuthParams, null);

            expect(accountCacheSpy.calledOnce).to.be.false;
            expect(authorityCacheSpy.calledOnce).to.be.true;
            const accountKey = cacheHelpers.generateAcquireTokenAccountKey(testAccount.homeAccountIdentifier);
            const nonceKey = cacheHelpers.generateNonceKey(RANDOM_TEST_GUID);
            const authorityKey = cacheHelpers.generateAuthorityKey(RANDOM_TEST_GUID);

            expect(store[accountKey]).to.be.undefined;
            expect(store[TemporaryCacheKeys.REQUEST_STATE]).to.be.eq(RANDOM_TEST_GUID);
            expect(store[nonceKey]).to.be.eq(RANDOM_TEST_GUID);
            expect(store[authorityKey]).to.be.eq(`${Constants.DEFAULT_AUTHORITY}/`);
        });

        it("resetTempCacheItems() resets all temporary cache items with the given state", async() => {
            await cacheHelpers.updateCacheEntries(serverAuthParams, testAccount);
            await cacheStorage.setItem(TemporaryCacheKeys.REQUEST_PARAMS, "TestRequestParams");
            await cacheStorage.setItem(TemporaryCacheKeys.ORIGIN_URI, TEST_URIS.TEST_REDIR_URI);

            await cacheHelpers.resetTempCacheItems(RANDOM_TEST_GUID);
            const accountKey = cacheHelpers.generateAcquireTokenAccountKey(testAccount.homeAccountIdentifier);
            const nonceKey = cacheHelpers.generateNonceKey(RANDOM_TEST_GUID);
            const authorityKey = cacheHelpers.generateAuthorityKey(RANDOM_TEST_GUID);
            expect(store[accountKey]).to.be.eq(JSON.stringify(testAccount));
            expect(store[nonceKey]).to.be.undefined;
            expect(store[authorityKey]).to.be.undefined;
            expect(store[TemporaryCacheKeys.REQUEST_STATE]).to.be.undefined;
            expect(store[TemporaryCacheKeys.REQUEST_PARAMS]).to.be.undefined;
            expect(store[TemporaryCacheKeys.ORIGIN_URI]).to.be.undefined;
        });
    });

    describe("Token handling functions", () => {

        let cacheHelpers: CacheHelpers;
        let cryptoInterface: ICrypto;
        let cacheStorage: ICacheStorageAsync;
        let scopeString: string;
        let testResource: string;
        let testResource2: string;
        let testHomeAccId2: string;
        beforeEach(async () => {
            cryptoInterface = {
                createNewGuid(): string {
                    return RANDOM_TEST_GUID;
                },
                base64Decode(input: string): string {
                    return input;
                },
                base64Encode(input: string): string {
                    switch (input) {
                        case "123-test-uid":
                            return "MTIzLXRlc3QtdWlk";
                        case "456-test-utid":
                            return "NDU2LXRlc3QtdXRpZA==";
                        default:
                            return input;
                    }
                },
                async generatePkceCodes(): Promise<PkceCodes> {
                    return {
                        challenge: TEST_CONFIG.TEST_CHALLENGE,
                        verifier: TEST_CONFIG.TEST_VERIFIER
                    }
                }
            };
            scopeString = TEST_CONFIG.DEFAULT_SCOPES.join(" ");
            testResource = "https://login.contoso.com/endpt";
            testResource2 = "https://login.contoso.com/endpt2";
            cacheStorage = {
                async setItem(key: string, value: string): Promise<void> {
                    store[key] = value;
                },
                async getItem(key: string): Promise<string> {
                    return store[key];
                },
                async removeItem(key: string): Promise<void> {
                    delete store[key];
                },
                async containsKey(key: string): Promise<boolean> {
                    return !!store[key];
                },
                async getKeys(): Promise<Array<string>> {
                    return Object.keys(store);
                },
                async clear(): Promise<void> {
                    store = {};
                },
                getCache() { return null; },
                setCache() { return null; }
            };

            cacheHelpers = new CacheHelpers(cacheStorage);
            const atKey = new AccessTokenKey(Constants.DEFAULT_AUTHORITY, TEST_CONFIG.MSAL_CLIENT_ID, scopeString, testResource, TEST_DATA_CLIENT_INFO.TEST_UID, TEST_DATA_CLIENT_INFO.TEST_UTID, cryptoInterface);
            const atValue1: AccessTokenValue = {
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                idToken: TEST_TOKENS.IDTOKEN_V2,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                tokenType: TEST_CONFIG.TOKEN_TYPE_BEARER,
                expiresOnSec: `${TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP}`,
                extExpiresOnSec: `${TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN}`
            };
            await cacheStorage.setItem(JSON.stringify(atKey), JSON.stringify(atValue1));

            const atKey2 = new AccessTokenKey(
                Constants.DEFAULT_AUTHORITY,
                TEST_CONFIG.MSAL_CLIENT_ID,
                scopeString,
                testResource2,
                TEST_DATA_CLIENT_INFO.TEST_UID,
                TEST_DATA_CLIENT_INFO.TEST_UTID,
                cryptoInterface
            );
            const atValue2: AccessTokenValue = {
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                idToken: TEST_TOKENS.IDTOKEN_V1,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                tokenType: TEST_CONFIG.TOKEN_TYPE_BEARER,
                expiresOnSec: `${TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP}`,
                extExpiresOnSec: `${TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN}`
            };
            await cacheStorage.setItem(JSON.stringify(atKey2), JSON.stringify(atValue2));

            testHomeAccId2 = "testHomeAccountId";
            const atKey3: AccessTokenKey = {
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                scopes: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                resource: testResource,
                homeAccountIdentifier: testHomeAccId2
            };
            const atKey4: AccessTokenKey = {
                authority: `${TEST_URIS.ALTERNATE_INSTANCE}/common/`,
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                scopes: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                resource: testResource,
                homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID
            };

            await cacheStorage.setItem(JSON.stringify(atKey3), JSON.stringify(atValue1));
            await cacheStorage.setItem(JSON.stringify(atKey4), JSON.stringify(atValue2));

            const atKey5: AccessTokenKey = {
                authority: `${TEST_URIS.ALTERNATE_INSTANCE}/common/`,
                clientId: RANDOM_TEST_GUID,
                scopes: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                resource: "testResourceUri",
                homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID
            };

            await cacheStorage.setItem(JSON.stringify(atKey5), JSON.stringify(atValue1));
        });

        afterEach(() => {
            store = {};
            sinon.restore();
        });

        it("getAllAccessTokens() correctly gets all access tokens matching the given variables", async () => {
            const atArr1: Array<AccessTokenCacheItem> = await cacheHelpers.getAllAccessTokens(TEST_CONFIG.MSAL_CLIENT_ID, `${Constants.DEFAULT_AUTHORITY}/`);
            const atArr2: Array<AccessTokenCacheItem> = await cacheHelpers.getAllAccessTokens(RANDOM_TEST_GUID, `${Constants.DEFAULT_AUTHORITY}/`);
            const atArr3: Array<AccessTokenCacheItem> = await cacheHelpers.getAllAccessTokens(RANDOM_TEST_GUID, `${TEST_URIS.ALTERNATE_INSTANCE}/common/`);
            const atArr4: Array<AccessTokenCacheItem> = await cacheHelpers.getAllAccessTokens(TEST_CONFIG.MSAL_CLIENT_ID, `${TEST_URIS.ALTERNATE_INSTANCE}/common/`);
            const atArr5: Array<AccessTokenCacheItem> = await cacheHelpers.getAllAccessTokens(TEST_CONFIG.MSAL_CLIENT_ID, `${Constants.DEFAULT_AUTHORITY}/`, testResource);
            const atArr6: Array<AccessTokenCacheItem> = await cacheHelpers.getAllAccessTokens(TEST_CONFIG.MSAL_CLIENT_ID, `${Constants.DEFAULT_AUTHORITY}/`, testResource2);
            const atArr7: Array<AccessTokenCacheItem> = await cacheHelpers.getAllAccessTokens(TEST_CONFIG.MSAL_CLIENT_ID, `${Constants.DEFAULT_AUTHORITY}/`, testResource, TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID);
            const atArr8: Array<AccessTokenCacheItem> = await cacheHelpers.getAllAccessTokens(TEST_CONFIG.MSAL_CLIENT_ID, `${Constants.DEFAULT_AUTHORITY}/`, testResource, testHomeAccId2);

            expect(atArr1.length).to.be.eq(3);
            expect(atArr2.length).to.be.eq(0);
            expect(atArr3.length).to.be.eq(1);
            expect(atArr4.length).to.be.eq(1);
            expect(atArr5.length).to.be.eq(2);
            expect(atArr6.length).to.be.eq(1);
            expect(atArr7.length).to.be.eq(1);
            expect(atArr8.length).to.be.eq(1);
        });

        it("removeAllAccessTokens() correctly removes all access tokens matching client id and authority", async () => {
            expect((await cacheStorage.getKeys()).length).to.be.eq(5);
            await cacheHelpers.removeAllAccessTokens(TEST_CONFIG.MSAL_CLIENT_ID, `${Constants.DEFAULT_AUTHORITY}/`);
            expect((await cacheStorage.getKeys()).length).to.be.eq(2);
        });

        it("removeAllAccessTokens() correctly removes all access tokens matching client id, authority and resource", async () => {
            expect((await cacheStorage.getKeys()).length).to.be.eq(5);
            await  cacheHelpers.removeAllAccessTokens(TEST_CONFIG.MSAL_CLIENT_ID, `${Constants.DEFAULT_AUTHORITY}/`, testResource);
            expect((await cacheStorage.getKeys()).length).to.be.eq(3);
        });

        it("removeAllAccessTokens() correctly removes all access tokens matching client id, authority, resource and home account identifier", async () => {
            expect((await cacheStorage.getKeys()).length).to.be.eq(5);
            await  cacheHelpers.removeAllAccessTokens(TEST_CONFIG.MSAL_CLIENT_ID, `${Constants.DEFAULT_AUTHORITY}/`, testResource, TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID);
            expect((await cacheStorage.getKeys()).length).to.be.eq(4);
        });
    });
});
