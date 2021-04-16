import { expect } from "chai";
import sinon from "sinon";
import { BrowserStorage } from "../src/cache/BrowserStorage";
import { AuthCache } from "../src/cache/AuthCache";
import { Constants, AuthError } from "../src";
import { TemporaryCacheKeys, PersistentCacheKeys, ErrorCacheKeys } from "../src/utils/Constants";
import { AccessTokenKey } from "../src/cache/AccessTokenKey";
import { AccessTokenValue } from "../src/cache/AccessTokenValue";
import { Account } from "../src/Account";
import { AuthErrorMessage } from "../src/error/AuthError";
import { ClientConfigurationErrorMessage, ClientConfigurationError } from "../src/error/ClientConfigurationError";
import { RequestUtils } from "../src/utils/RequestUtils";
import { TEST_TOKENS } from "./TestConstants";

describe("CacheStorage.ts Class - Local Storage", function () {
    const TEST_KEY = "test_key";
    const TEST_VALUE = "test value";
    const TEST_ACCOUNT_ID = "1234";
    const TEST_STATE = RequestUtils.generateLibraryState(Constants.interactionTypePopup);
    const TEST_STATE2 = RequestUtils.generateLibraryState(Constants.interactionTypeRedirect);
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
            cacheStorage.setItemCookie(`${AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, TEST_STATE)}`, idTokenNonceString);
            expect(document.cookie).to.include(encodeURIComponent(`${AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, TEST_STATE)}`));
            expect(document.cookie).to.include(idTokenNonceString);
            cacheStorage.clearItemCookie(`${AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, TEST_STATE)}`);
        });

        it("tests getItemCookie ", function () {
            let idTokenNonceString = "idTokenNonce";
            cacheStorage.setItemCookie(`${AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, TEST_STATE)}`, idTokenNonceString);
            let retrievedItem = cacheStorage.getItemCookie(`${AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, TEST_STATE)}`);
            expect(retrievedItem).to.include(idTokenNonceString);
            cacheStorage.clearItemCookie(`${AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, TEST_STATE)}`);
        });

        it("setItemCookie and getItemCookie properly escape control characters", () => {
            const cookieName = "cookie|name|\r|";
            const cookieValue = "cookie|value|\n|";
            cacheStorage.setItemCookie(cookieName, cookieValue);
            let storedCookieValue = cacheStorage.getItemCookie(cookieName);
            expect(document.cookie).to.include(encodeURIComponent(cookieName));
            expect(document.cookie).to.include(encodeURIComponent(cookieValue));
            expect(storedCookieValue).to.equal(cookieValue);
            cacheStorage.clearItemCookie(cookieName);
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

        it("resetTempCacheItems removes entries when user state includes resource delimeter", function () {
            const userState = `stateValue1${Constants.resourceDelimiter}stateValue2`
            const testState = `${TEST_STATE}${Constants.resourceDelimiter}${userState}`;

            let acquireTokenAccountKey = AuthCache.generateAcquireTokenAccountKey(TEST_ACCOUNT_ID, testState);
            let authorityKey = AuthCache.generateAuthorityKey(testState);

            msalCacheStorage.setItem(acquireTokenAccountKey, JSON.stringify(ACCOUNT));
            msalCacheStorage.setItem(authorityKey, validAuthority)

            expect(msalCacheStorage.getItem(acquireTokenAccountKey)).to.be.eq(JSON.stringify(ACCOUNT));
            expect(msalCacheStorage.getItem(authorityKey)).to.be.eq(validAuthority);

            msalCacheStorage.resetTempCacheItems(testState);
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
            msalCacheStorage.setItemCookie(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, TEST_STATE), idTokenNonceString);
            msalCacheStorage.setItemCookie(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, TEST_STATE), stateLoginString);
            msalCacheStorage.setItemCookie(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.LOGIN_REQUEST, TEST_STATE), loginRequestString);
            msalCacheStorage.setItemCookie(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_ACQ_TOKEN, TEST_STATE), stateAcquireTokenString);
            msalCacheStorage.clearMsalCookie(TEST_STATE);
            expect(document.cookie).to.be.empty;
        });

        it("resetCacheItems deletes msal related cache items", function () {
            let clientInfoKey = `${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${PersistentCacheKeys.CLIENT_INFO}`;
            let stateLoginKey = `${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN,  TEST_STATE)}`;
            let idTokenKey = `${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${PersistentCacheKeys.IDTOKEN}`;
            let nonceIdTokenKey = `${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, TEST_STATE)}`;
            let renewStatusKey = `${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.RENEW_STATUS, TEST_STATE)}`;

            window.localStorage.setItem(clientInfoKey, "clientInfo");
            window.localStorage.setItem(stateLoginKey, "stateLogin");
            window.localStorage.setItem(idTokenKey, "idToken1");
            window.localStorage.setItem(nonceIdTokenKey, "idTokenNonce");
            window.localStorage.setItem(renewStatusKey, "Completed");

            expect(msalCacheStorage.getItem(PersistentCacheKeys.CLIENT_INFO)).to.be.eq("clientInfo");
            expect(msalCacheStorage.getItem(`${AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, TEST_STATE)}`)).to.be.eq("stateLogin");
            expect(msalCacheStorage.getItem(PersistentCacheKeys.IDTOKEN)).to.be.eq("idToken1");
            expect(msalCacheStorage.getItem(`${AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, TEST_STATE)}`)).to.be.eq("idTokenNonce");
            expect(msalCacheStorage.getItem(`${AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.RENEW_STATUS, TEST_STATE)}`)).to.be.eq("Completed");

            msalCacheStorage.resetCacheItems();

            expect(msalCacheStorage.getItem(PersistentCacheKeys.CLIENT_INFO)).to.be.null;
            expect(msalCacheStorage.getItem(`${AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, TEST_STATE)}`)).to.be.null;
            expect(msalCacheStorage.getItem(PersistentCacheKeys.IDTOKEN)).to.be.null;
            expect(msalCacheStorage.getItem(`${AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, TEST_STATE)}`)).to.be.null;
            expect(msalCacheStorage.getItem(`${AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.RENEW_STATUS, TEST_STATE)}`)).to.be.null;
        });

        it("migrateCacheEntries only migrates entries if id_token aud matches current clientId", function () {
            let idTokenKey = `${Constants.cachePrefix}.${PersistentCacheKeys.IDTOKEN}`;
            let clientInfoKey = `${Constants.cachePrefix}.${PersistentCacheKeys.CLIENT_INFO}`;
            let errorKey = `${Constants.cachePrefix}.${ErrorCacheKeys.ERROR}`;
            let errorDescKey = `${Constants.cachePrefix}.${ErrorCacheKeys.ERROR_DESC}`;

            window.localStorage.setItem(idTokenKey, TEST_TOKENS.IDTOKEN_V2);
            window.localStorage.setItem(clientInfoKey, "clientInfo");
            window.localStorage.setItem(errorKey, "error");
            window.localStorage.setItem(errorDescKey, "error");

            msalCacheStorage = new AuthCache(MSAL_CLIENT_ID,LOCAL_STORAGE, true);

            expect(msalCacheStorage.getItem(idTokenKey)).to.be.eq(TEST_TOKENS.IDTOKEN_V2);
            expect(msalCacheStorage.getItem(clientInfoKey)).to.be.eq("clientInfo");
            expect(msalCacheStorage.getItem(errorKey)).to.be.eq("error");
            expect(msalCacheStorage.getItem(errorDescKey)).to.be.eq("error");

            expect(msalCacheStorage.getItem(PersistentCacheKeys.CLIENT_INFO)).to.be.null;
            expect(msalCacheStorage.getItem(PersistentCacheKeys.IDTOKEN)).to.be.null;
            expect(msalCacheStorage.getItem(ErrorCacheKeys.ERROR)).to.be.null;
            expect(msalCacheStorage.getItem(ErrorCacheKeys.ERROR_DESC)).to.be.null;
        });
    });

    describe("static key generators", function () {

        it("generates acquireToken account key", function () {
            let acquireTokenAccountKey = AuthCache.generateAcquireTokenAccountKey(TEST_ACCOUNT_ID, TEST_STATE);
            const stateId = RequestUtils.parseLibraryState(TEST_STATE).id;
            expect(acquireTokenAccountKey).to.equal(`${TemporaryCacheKeys.ACQUIRE_TOKEN_ACCOUNT}|${TEST_ACCOUNT_ID}|${stateId}`);
        });

        it("generates authority key", function () {
            let authorityKey = AuthCache.generateAuthorityKey(TEST_STATE);
            const stateId = RequestUtils.parseLibraryState(TEST_STATE).id;
            expect(authorityKey).to.equal(`${TemporaryCacheKeys.AUTHORITY}|${stateId}`);
        });
    });

});
