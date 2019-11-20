import { expect } from "chai";
import sinon from "sinon";
import { BrowserStorage } from "../src/cache/BrowserStorage";
import { AuthCache } from "../src/cache/AuthCache";
import { Constants, AuthError } from "../src";
import { TemporaryCacheKeys, PersistentCacheKeys } from "../src/utils/Constants";
import { AccessTokenKey } from "../src/cache/AccessTokenKey";
import { AccessTokenValue } from "../src/cache/AccessTokenValue";
import { Account } from "../src/Account";
import { AuthErrorMessage } from "../src/error/AuthError";
import { ClientConfigurationErrorMessage, ClientConfigurationError } from "../src/error/ClientConfigurationError";

describe("CacheStorage.ts Class - Local Storage", function () {
    const TEST_KEY = "test_key";
    const TEST_VALUE = "test value";
    const TEST_ACCOUNT_ID = "1234";
    const TEST_STATE = "state5678";
    const TEST_STATE2 = "state9012";
    const LOCAL_STORAGE = "localStorage";
    let cacheStorage : BrowserStorage;
    let ACCESS_TOKEN_KEY : AccessTokenKey;
    let ACCESS_TOKEN_VALUE : AccessTokenValue;
    let ACCOUNT : Account;
    const DEFAULT_INSTANCE = "https://login.microsoftonline.com/";
    const TENANT = 'common';
    const MSAL_CLIENT_ID = "0813e1d1-ad72-46a9-8665-399bba48c201";
    const validAuthority = DEFAULT_INSTANCE + TENANT;

    let setTestCacheItems = function () {
        ACCESS_TOKEN_KEY = {
            authority: validAuthority,
            clientId: MSAL_CLIENT_ID,
            scopes: "S1",
            homeAccountIdentifier: "1234"
        };
        ACCESS_TOKEN_VALUE = {
            accessToken: "accessToken1",
            idToken: "idToken",
            expiresIn: "150000000000000",
            homeAccountIdentifier: ""
        };
        ACCOUNT = {
            accountIdentifier: TEST_ACCOUNT_ID,
            environment: "js",
            homeAccountIdentifier: "1234",
            idToken: {},
            idTokenClaims: {},
            name: "Test Account",
            sid: "123451435",
            userName: "TestAccount"
        };
    };

    describe("class constructor", function () {

        beforeEach(function () {

        });

        afterEach(function () {
            cacheStorage = null;
        });

        it("parses the cache location correctly", function () {
            cacheStorage = new BrowserStorage(LOCAL_STORAGE);
            cacheStorage.setItem(TEST_KEY, TEST_VALUE);
            expect(window.localStorage.getItem(TEST_KEY)).to.be.eq(TEST_VALUE);
        });

        it("throws error if cache location is not supported", function () {
            sinon.stub(window, LOCAL_STORAGE).value(null);
            console.log(window.localStorage);
            let authErr;
            try {
                cacheStorage = new BrowserStorage(LOCAL_STORAGE);
            } catch (e) {
                authErr = e;
            }
            expect(authErr instanceof ClientConfigurationError).to.be.true;
            expect(authErr instanceof Error).to.be.true;
            expect(authErr.errorCode).to.equal(ClientConfigurationErrorMessage.storageNotSupported.code);
            expect(authErr.errorMessage).to.include(ClientConfigurationErrorMessage.storageNotSupported.desc);
            expect(authErr.message).to.include(ClientConfigurationErrorMessage.storageNotSupported.desc);
            expect(authErr.errorMessage).to.include(LOCAL_STORAGE);
            expect(authErr.message).to.include(LOCAL_STORAGE);
            expect(authErr.name).to.equal("ClientConfigurationError");
            expect(authErr.stack).to.include("Storage.localStorage.spec.ts");
            sinon.restore();
        });

        it("throws error if window object does not exist", function () {
            let authErr;
            const oldWindow = window;
            window = null;
            try {
                cacheStorage = new BrowserStorage(LOCAL_STORAGE);
            } catch (e) {
                authErr = e;
            }
            expect(authErr instanceof AuthError).to.be.true;
            expect(authErr instanceof Error).to.be.true;
            expect(authErr.errorCode).to.equal(AuthErrorMessage.noWindowObjectError.code);
            expect(authErr.errorMessage).to.include(AuthErrorMessage.noWindowObjectError.desc);
            expect(authErr.message).to.include(AuthErrorMessage.noWindowObjectError.desc);
            expect(authErr.name).to.equal("AuthError");
            expect(authErr.stack).to.include("Storage.localStorage.spec.ts");
            window = oldWindow;
        })
    });

    describe("localStorage access functions", function () {

        beforeEach(function () {
            cacheStorage = new BrowserStorage(LOCAL_STORAGE);
            setTestCacheItems();
            document.cookie = "";
        });

        afterEach(function () {
            cacheStorage.clear();
            cacheStorage = null;
            sinon.restore();
        });

        it("tests setItem works", function () {
            cacheStorage.setItem(JSON.stringify(ACCESS_TOKEN_KEY), JSON.stringify(ACCESS_TOKEN_VALUE));
            expect(window.localStorage.getItem(JSON.stringify(ACCESS_TOKEN_KEY))).to.be.eq(JSON.stringify(ACCESS_TOKEN_VALUE));
        });

        it("tests getItem works", function () {
            window.localStorage.setItem(JSON.stringify(ACCESS_TOKEN_KEY), JSON.stringify(ACCESS_TOKEN_VALUE));
            expect(cacheStorage.getItem(JSON.stringify(ACCESS_TOKEN_KEY))).to.be.eq(JSON.stringify(ACCESS_TOKEN_VALUE));
        });

        it("tests removeItem works", function () {
            window.localStorage.setItem(JSON.stringify(ACCESS_TOKEN_KEY), JSON.stringify(ACCESS_TOKEN_VALUE));
            cacheStorage.removeItem(JSON.stringify(ACCESS_TOKEN_KEY));
            expect(window.localStorage.getItem(JSON.stringify(ACCESS_TOKEN_KEY))).to.be.null;
        });

        it("tests clear works", function () {
            window.localStorage.setItem(JSON.stringify(ACCESS_TOKEN_KEY), JSON.stringify(ACCESS_TOKEN_VALUE));
            expect(window.localStorage.length).to.be.eq(1);
            cacheStorage.clear();
            expect(window.localStorage.length).to.be.eq(0);
        });

        it("tests setItemCookie works", function () {
            let idTokenNonceString = "idTokenNonce";
            cacheStorage.setItemCookie(`${TemporaryCacheKeys.NONCE_IDTOKEN}|RANDOM_GUID`, idTokenNonceString);
            expect(document.cookie).to.include(`${TemporaryCacheKeys.NONCE_IDTOKEN}|RANDOM_GUID`);
            expect(document.cookie).to.include(idTokenNonceString);
            cacheStorage.clearItemCookie(`${TemporaryCacheKeys.NONCE_IDTOKEN}|RANDOM_GUID`);
        });

        it("tests getItemCookie ", function () {
            let idTokenNonceString = "idTokenNonce";
            cacheStorage.setItemCookie(`${TemporaryCacheKeys.NONCE_IDTOKEN}|RANDOM_GUID`, idTokenNonceString);
            let retrievedItem = cacheStorage.getItemCookie(`${TemporaryCacheKeys.NONCE_IDTOKEN}|RANDOM_GUID`);
            expect(retrievedItem).to.include(idTokenNonceString);
            cacheStorage.clearItemCookie(`${TemporaryCacheKeys.NONCE_IDTOKEN}|RANDOM_GUID`);
        });

        it("tests getCookieExpirationTime", function () {
            // 86400000 ms = 1 day
            let nextDayUTC = new Date(Date.now() + 86400000);
            let actualNextDayUTC = cacheStorage.getCookieExpirationTime(1);
            let dayAfterUTC = new Date(nextDayUTC.getTime() + 86400000);
            let actualDayAfterUTC = cacheStorage.getCookieExpirationTime(2);

            expect(actualNextDayUTC).to.be.eq(nextDayUTC.toUTCString());
            expect(actualDayAfterUTC).to.be.eq(dayAfterUTC.toUTCString());
        });
    });

    describe("MSAL Cache Item Management", function () {

        let msalCacheStorage: AuthCache;

        beforeEach(function () {
            msalCacheStorage = new AuthCache(MSAL_CLIENT_ID,LOCAL_STORAGE, true);
            setTestCacheItems();
            document.cookie = "";
        });

        afterEach(function () {
            msalCacheStorage.clear();
        });

        it("getAllAccessTokens returns all accessTokens in cache", function () {
            let at1 = JSON.parse(JSON.stringify(ACCESS_TOKEN_VALUE)),
            at2 = JSON.parse(JSON.stringify(ACCESS_TOKEN_VALUE)),
            at3 = JSON.parse(JSON.stringify(ACCESS_TOKEN_VALUE)),
            at4 = JSON.parse(JSON.stringify(ACCESS_TOKEN_VALUE));

            window.localStorage.setItem(JSON.stringify(ACCESS_TOKEN_KEY), JSON.stringify(at1));
            ACCESS_TOKEN_KEY.clientId = "1813e1d1-ad72-46a9-8665-399bba48c201";
            at2.accessToken = "accessToken2";
            window.localStorage.setItem(JSON.stringify(ACCESS_TOKEN_KEY), JSON.stringify(at2));

            ACCESS_TOKEN_KEY.homeAccountIdentifier = "4567";
            at3.accessToken = "accessToken3";
            window.localStorage.setItem(JSON.stringify(ACCESS_TOKEN_KEY), JSON.stringify(at3));

            ACCESS_TOKEN_KEY.scopes = "S2";
            at4.accessToken = "accessToken4";
            window.localStorage.setItem(JSON.stringify(ACCESS_TOKEN_KEY), JSON.stringify(at4));

            let res1 = msalCacheStorage.getAllAccessTokens(MSAL_CLIENT_ID, "1234");
            let res2 = msalCacheStorage.getAllAccessTokens("1813e1d1-ad72-46a9-8665-399bba48c201", "1234");
            let res3 = msalCacheStorage.getAllAccessTokens("1813e1d1-ad72-46a9-8665-399bba48c201", "4567");

            expect(res1).to.be.length(1);
            expect(res2).to.be.length(1);
            expect(res3).to.be.length(2);

            expect(JSON.stringify(res1[0].value)).to.be.eq(msalCacheStorage.getItem(JSON.stringify(res1[0].key)));
            expect(JSON.stringify(res2[0].value)).to.be.eq(msalCacheStorage.getItem(JSON.stringify(res2[0].key)));
            expect(JSON.stringify(res3[0].value)).to.be.eq(msalCacheStorage.getItem(JSON.stringify(res3[0].key)));
            expect(JSON.stringify(res3[1].value)).to.be.eq(msalCacheStorage.getItem(JSON.stringify(res3[1].key)));
        });

        it("resetTempCacheItems removes acquireToken or authorityKey entries in the cache", function () {
            let acquireTokenAccountKey = AuthCache.generateAcquireTokenAccountKey(TEST_ACCOUNT_ID, TEST_STATE);
            let authorityKey = AuthCache.generateAuthorityKey(TEST_STATE);

            window.localStorage.setItem(`${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${acquireTokenAccountKey}`, JSON.stringify(ACCOUNT));
            window.localStorage.setItem(`${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${authorityKey}`, validAuthority);

            expect(msalCacheStorage.getItem(acquireTokenAccountKey)).to.be.eq(JSON.stringify(ACCOUNT));
            expect(msalCacheStorage.getItem(authorityKey)).to.be.eq(validAuthority);

            msalCacheStorage.resetTempCacheItems(TEST_STATE);

            expect(msalCacheStorage.getItem(acquireTokenAccountKey)).to.be.null;
            expect(msalCacheStorage.getItem(authorityKey)).to.be.null;
        });

        it("resetTempCacheItems removes specific acquireToken or authorityKey entries in the cache", function () {
            let acquireTokenAccountKey = AuthCache.generateAcquireTokenAccountKey(TEST_ACCOUNT_ID, TEST_STATE);
            let authorityKey = AuthCache.generateAuthorityKey(TEST_STATE);

            let acquireTokenAccountKey2 = AuthCache.generateAcquireTokenAccountKey(TEST_ACCOUNT_ID, TEST_STATE2);
            let authorityKey2 = AuthCache.generateAuthorityKey(TEST_STATE2);
            window.localStorage.setItem(`${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${acquireTokenAccountKey}`, JSON.stringify(ACCOUNT));
            window.localStorage.setItem(`${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${authorityKey}`, validAuthority);
            window.localStorage.setItem(`${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${acquireTokenAccountKey2}`, JSON.stringify(ACCOUNT));
            window.localStorage.setItem(`${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${authorityKey2}`, validAuthority);

            expect(msalCacheStorage.getItem(acquireTokenAccountKey)).to.be.eq(JSON.stringify(ACCOUNT));
            expect(msalCacheStorage.getItem(authorityKey)).to.be.eq(validAuthority);
            expect(msalCacheStorage.getItem(acquireTokenAccountKey2)).to.be.eq(JSON.stringify(ACCOUNT));
            expect(msalCacheStorage.getItem(authorityKey2)).to.be.eq(validAuthority);

            msalCacheStorage.resetTempCacheItems(TEST_STATE);

            expect(msalCacheStorage.getItem(acquireTokenAccountKey)).to.be.null;
            expect(msalCacheStorage.getItem(authorityKey)).to.be.null;
            expect(msalCacheStorage.getItem(acquireTokenAccountKey2)).to.be.eq(JSON.stringify(ACCOUNT));
            expect(msalCacheStorage.getItem(authorityKey2)).to.be.eq(validAuthority);

            msalCacheStorage.resetTempCacheItems(TEST_STATE2);

            expect(msalCacheStorage.getItem(acquireTokenAccountKey2)).to.be.null;
            expect(msalCacheStorage.getItem(authorityKey2)).to.be.null;
        });

        it("tests clearCookie", function () {
            let idTokenNonceString = "idTokenNonce";
            let stateLoginString = "stateLogin";
            let loginRequestString = "loginRequest";
            let stateAcquireTokenString = "stateAcquireToken";
            msalCacheStorage.setItemCookie(`${TemporaryCacheKeys.NONCE_IDTOKEN}|RANDOM_GUID`, idTokenNonceString);
            msalCacheStorage.setItemCookie(`${TemporaryCacheKeys.STATE_LOGIN}|RANDOM_GUID`, stateLoginString);
            msalCacheStorage.setItemCookie(`${TemporaryCacheKeys.LOGIN_REQUEST}|RANDOM_GUID`, loginRequestString);
            msalCacheStorage.setItemCookie(`${TemporaryCacheKeys.STATE_ACQ_TOKEN}|RANDOM_GUID`, stateAcquireTokenString);
            msalCacheStorage.clearMsalCookie("RANDOM_GUID");
            expect(document.cookie).to.be.empty;
        });

        it("resetCacheItems deletes msal related cache items", function () {
            let clientInfoKey = `${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${PersistentCacheKeys.CLIENT_INFO}`;
            let stateLoginKey = `${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${TemporaryCacheKeys.STATE_LOGIN}|RANDOM_GUID`;
            let idTokenKey = `${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${PersistentCacheKeys.IDTOKEN}`;
            let nonceIdTokenKey = `${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${TemporaryCacheKeys.NONCE_IDTOKEN}|RANDOM_GUID`;
            let renewStatusKey = `${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${TemporaryCacheKeys.RENEW_STATUS}|RANDOM_GUID`;

            window.localStorage.setItem(clientInfoKey, "clientInfo");
            window.localStorage.setItem(stateLoginKey, "stateLogin");
            window.localStorage.setItem(idTokenKey, "idToken1");
            window.localStorage.setItem(nonceIdTokenKey, "idTokenNonce");
            window.localStorage.setItem(renewStatusKey, "Completed");

            expect(msalCacheStorage.getItem(PersistentCacheKeys.CLIENT_INFO)).to.be.eq("clientInfo");
            expect(msalCacheStorage.getItem(`${TemporaryCacheKeys.STATE_LOGIN}|RANDOM_GUID`)).to.be.eq("stateLogin");
            expect(msalCacheStorage.getItem(PersistentCacheKeys.IDTOKEN)).to.be.eq("idToken1");
            expect(msalCacheStorage.getItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|RANDOM_GUID`)).to.be.eq("idTokenNonce");
            expect(msalCacheStorage.getItem(`${TemporaryCacheKeys.RENEW_STATUS}|RANDOM_GUID`)).to.be.eq("Completed");

            msalCacheStorage.resetCacheItems();

            expect(msalCacheStorage.getItem(PersistentCacheKeys.CLIENT_INFO)).to.be.null;
            expect(msalCacheStorage.getItem(`${TemporaryCacheKeys.STATE_LOGIN}|RANDOM_GUID`)).to.be.null;
            expect(msalCacheStorage.getItem(PersistentCacheKeys.IDTOKEN)).to.be.null;
            expect(msalCacheStorage.getItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|RANDOM_GUID`)).to.be.null;
            expect(msalCacheStorage.getItem(`${TemporaryCacheKeys.RENEW_STATUS}|RANDOM_GUID`)).to.be.null;
        });

        it.skip("tests that resetCacheItems only deletes instance-specific cache items");
    });

    describe("static key generators", function () {

        it("generates acquireToken account key", function () {
            let acquireTokenAccountKey = AuthCache.generateAcquireTokenAccountKey(TEST_ACCOUNT_ID, TEST_STATE);
            expect(acquireTokenAccountKey).to.include(TEST_ACCOUNT_ID);
            expect(acquireTokenAccountKey).to.include(TEST_STATE);
            expect(acquireTokenAccountKey).to.include(`${TemporaryCacheKeys.ACQUIRE_TOKEN_ACCOUNT}|${TEST_ACCOUNT_ID}|${TEST_STATE}`);
        });

        it("generates authority key", function () {
            let authorityKey = AuthCache.generateAuthorityKey(TEST_STATE);
            expect(authorityKey).to.include(TEST_STATE);
            expect(authorityKey).to.include(`${TemporaryCacheKeys.AUTHORITY}|${TEST_STATE}`);
        });
    });

});
