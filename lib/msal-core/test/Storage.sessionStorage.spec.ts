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

describe("CacheStorage.ts Class - Session Storage", function () {
    const TEST_KEY = "test_key";
    const TEST_VALUE = "test value";
    const TEST_ACCOUNT_ID = "1234";
    const TEST_STATE = RequestUtils.generateLibraryState(Constants.interactionTypePopup);
    const TEST_STATE2 = RequestUtils.generateLibraryState(Constants.interactionTypeRedirect);
    const SESSION_STORAGE = "sessionStorage";
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
            cacheStorage = new BrowserStorage(SESSION_STORAGE);
            cacheStorage.setItem(TEST_KEY, TEST_VALUE);
            expect(window.sessionStorage.getItem(TEST_KEY)).to.be.eq(TEST_VALUE);
        });

        it("throws error if cache location is not supported", function () {
            sinon.stub(window, SESSION_STORAGE).value(null);
            let authErr;
            try {
                cacheStorage = new BrowserStorage(SESSION_STORAGE);
            } catch (e) {
                authErr = e;
            }
            expect(authErr instanceof ClientConfigurationError).to.be.true;
            expect(authErr instanceof Error).to.be.true;
            expect(authErr.errorCode).to.equal(ClientConfigurationErrorMessage.storageNotSupported.code);
            expect(authErr.errorMessage).to.include(ClientConfigurationErrorMessage.storageNotSupported.desc);
            expect(authErr.message).to.include(ClientConfigurationErrorMessage.storageNotSupported.desc);
            expect(authErr.errorMessage).to.include(SESSION_STORAGE);
            expect(authErr.message).to.include(SESSION_STORAGE);
            expect(authErr.name).to.equal("ClientConfigurationError");
            expect(authErr.stack).to.include("Storage.sessionStorage.spec.ts");
            sinon.restore();
        });

        it("throws error if window object does not exist", function () {
            let authErr;
            const oldWindow = window;
            window = null;
            try {
                cacheStorage = new BrowserStorage(SESSION_STORAGE);
            } catch (e) {
                authErr = e;
            }
            expect(authErr instanceof AuthError).to.be.true;
            expect(authErr instanceof Error).to.be.true;
            expect(authErr.errorCode).to.equal(AuthErrorMessage.noWindowObjectError.code);
            expect(authErr.errorMessage).to.include(AuthErrorMessage.noWindowObjectError.desc);
            expect(authErr.message).to.include(AuthErrorMessage.noWindowObjectError.desc);
            expect(authErr.name).to.equal("AuthError");
            expect(authErr.stack).to.include("Storage.sessionStorage.spec.ts");
            window = oldWindow;
        })
    });

    describe("sessionStorage access functions", function () {

        beforeEach(function () {
            cacheStorage = new BrowserStorage(SESSION_STORAGE);
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
            expect(window.sessionStorage.getItem(JSON.stringify(ACCESS_TOKEN_KEY))).to.be.eq(JSON.stringify(ACCESS_TOKEN_VALUE));
        });

        it("tests getItem works", function () {
            window.sessionStorage.setItem(JSON.stringify(ACCESS_TOKEN_KEY), JSON.stringify(ACCESS_TOKEN_VALUE));
            expect(cacheStorage.getItem(JSON.stringify(ACCESS_TOKEN_KEY))).to.be.eq(JSON.stringify(ACCESS_TOKEN_VALUE));
        });

        it("tests removeItem works", function () {
            window.sessionStorage.setItem(JSON.stringify(ACCESS_TOKEN_KEY), JSON.stringify(ACCESS_TOKEN_VALUE));
            cacheStorage.removeItem(JSON.stringify(ACCESS_TOKEN_KEY));
            expect(window.sessionStorage.getItem(JSON.stringify(ACCESS_TOKEN_KEY))).to.be.null;
        });

        it("tests clear works", function () {
            window.sessionStorage.setItem(JSON.stringify(ACCESS_TOKEN_KEY), JSON.stringify(ACCESS_TOKEN_VALUE));
            expect(window.sessionStorage.length).to.be.eq(1);
            cacheStorage.clear();
            expect(window.sessionStorage.length).to.be.eq(0);
        });

        it("tests setItemCookie works", function () {
            let idTokenNonceString = "idTokenNonce";
            cacheStorage.setItemCookie(`${TemporaryCacheKeys.NONCE_IDTOKEN}|RANDOM_GUID`, idTokenNonceString);
            expect(document.cookie).to.include(encodeURIComponent(`${TemporaryCacheKeys.NONCE_IDTOKEN}|RANDOM_GUID`));
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
            msalCacheStorage = new AuthCache(MSAL_CLIENT_ID,SESSION_STORAGE, true);
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

            window.sessionStorage.setItem(JSON.stringify(ACCESS_TOKEN_KEY), JSON.stringify(at1));
            ACCESS_TOKEN_KEY.clientId = "1813e1d1-ad72-46a9-8665-399bba48c201";
            at2.accessToken = "accessToken2";
            window.sessionStorage.setItem(JSON.stringify(ACCESS_TOKEN_KEY), JSON.stringify(at2));

            ACCESS_TOKEN_KEY.homeAccountIdentifier = "4567";
            at3.accessToken = "accessToken3";
            window.sessionStorage.setItem(JSON.stringify(ACCESS_TOKEN_KEY), JSON.stringify(at3));

            ACCESS_TOKEN_KEY.scopes = "S2";
            at4.accessToken = "accessToken4";
            window.sessionStorage.setItem(JSON.stringify(ACCESS_TOKEN_KEY), JSON.stringify(at4));

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

        it("resetTempCacheItems removes any acquireToken or authorityKey entries in the cache", function () {
            let acquireTokenAccountKey = AuthCache.generateAcquireTokenAccountKey(TEST_ACCOUNT_ID, TEST_STATE);
            let authorityKey = AuthCache.generateAuthorityKey(TEST_STATE);

            window.sessionStorage.setItem(`${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${acquireTokenAccountKey}`, JSON.stringify(ACCOUNT));
            window.sessionStorage.setItem(`${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${authorityKey}`, validAuthority);

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
            window.sessionStorage.setItem(`${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${acquireTokenAccountKey}`, JSON.stringify(ACCOUNT));
            window.sessionStorage.setItem(`${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${authorityKey}`, validAuthority);
            window.sessionStorage.setItem(`${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${acquireTokenAccountKey2}`, JSON.stringify(ACCOUNT));
            window.sessionStorage.setItem(`${Constants.cachePrefix}.${MSAL_CLIENT_ID}.${authorityKey2}`, validAuthority);

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

            window.sessionStorage.setItem(clientInfoKey, "clientInfo");
            window.sessionStorage.setItem(stateLoginKey, "stateLogin");
            window.sessionStorage.setItem(idTokenKey, "idToken1");
            window.sessionStorage.setItem(nonceIdTokenKey, "idTokenNonce");
            window.sessionStorage.setItem(renewStatusKey, "Completed");

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

            window.sessionStorage.setItem(idTokenKey, TEST_TOKENS.IDTOKEN_V2);
            window.sessionStorage.setItem(clientInfoKey, "clientInfo");
            window.sessionStorage.setItem(errorKey, "error");
            window.sessionStorage.setItem(errorDescKey, "error");

            msalCacheStorage = new AuthCache(MSAL_CLIENT_ID,SESSION_STORAGE, true);

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
});
