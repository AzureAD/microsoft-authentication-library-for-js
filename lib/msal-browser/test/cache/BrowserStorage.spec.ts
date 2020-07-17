import { expect } from "chai";
import sinon from "sinon";
import { BrowserAuthErrorMessage, BrowserAuthError } from "../../src/error/BrowserAuthError";
import { BrowserStorage } from "../../src/cache/BrowserStorage";
import { TEST_CONFIG, TEST_TOKENS, TEST_DATA_CLIENT_INFO, RANDOM_TEST_GUID, TEST_URIS, TEST_STATE_VALUES } from "../utils/StringConstants";
import { CacheOptions } from "../../src/config/Configuration";
import { BrowserConfigurationAuthErrorMessage, BrowserConfigurationAuthError } from "../../src/error/BrowserConfigurationAuthError";
import { CacheManager, Constants, PersistentCacheKeys, AuthorizationCodeRequest, CacheSchemaType } from "@azure/msal-common";
import { BrowserConstants, TemporaryCacheKeys } from "../../src/utils/BrowserConstants";
import { CryptoOps } from "../../src/crypto/CryptoOps";

class TestCacheStorage extends CacheManager {
    setItem(key: string, value: string): void {
        throw new Error("Method not implemented.");
    }
    getItem(key: string): string {
        throw new Error("Method not implemented.");
    }
    removeItem(key: string): boolean {
        throw new Error("Method not implemented.");
    }
    containsKey(key: string): boolean {
        throw new Error("Method not implemented.");
    }
    getKeys(): string[] {
        throw new Error("Method not implemented.");
    }
    clear(): void {
        throw new Error("Method not implemented.");
	}
}

describe("BrowserStorage() tests", () => {

    let cacheConfig: CacheOptions;
    let windowRef: Window & typeof globalThis;
    beforeEach(() => {
        cacheConfig = {
            cacheLocation: BrowserConstants.CACHE_LOCATION_SESSION,
            storeAuthStateInCookie: false
        };
        windowRef = window;
    });

    afterEach(() => {
        sinon.restore();
        window = windowRef;
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    describe("Constructor", () => {

        it("Throws an error if window object is null", () => {
            window = null;
            expect(() => new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig)).to.throw(BrowserAuthErrorMessage.noWindowObjectError.desc);
            expect(() => new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig)).to.throw(BrowserAuthError);
        });

        it("Throws an error if cache location string does not match localStorage or sessionStorage", () => {
            cacheConfig.cacheLocation = "notALocation";
            expect(() => new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig)).to.throw(BrowserConfigurationAuthErrorMessage.storageNotSupportedError.desc);
            expect(() => new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig)).to.throw(BrowserConfigurationAuthError);
        });

        it("Throws an error if storage is not supported", () => {
            sinon.stub(window, "sessionStorage").value(null);
            expect(() => new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig)).to.throw(BrowserConfigurationAuthErrorMessage.storageNotSupportedError.desc);
            expect(() => new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig)).to.throw(BrowserConfigurationAuthError);
            sinon.stub(window, "localStorage").value(null);
            cacheConfig.cacheLocation = BrowserConstants.CACHE_LOCATION_LOCAL;
            expect(() => new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig)).to.throw(BrowserConfigurationAuthErrorMessage.storageNotSupportedError.desc);
            expect(() => new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig)).to.throw(BrowserConfigurationAuthError);
        });

        it("Creates a BrowserStorage object that implements the ICacheStorage interface", () => {
            const browserStorage = new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig);
            expect(browserStorage.setItem).to.be.not.null;
            expect(browserStorage.getItem).to.be.not.null;
            expect(browserStorage.removeItem).to.be.not.null;
            expect(browserStorage.containsKey).to.be.not.null;
            expect(browserStorage.getKeys).to.be.not.null;
            expect(browserStorage.clear).to.be.not.null;
        });

        it("Migrates cache entries from the old cache format", () => {
            const idTokenKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.ID_TOKEN}`;
            const clientInfoKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.CLIENT_INFO}`;
            const errorKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.ERROR}`;
            const errorDescKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.ERROR_DESC}`;
            const errorKeyVal = "error_code";
            const errorDescVal = "error occurred";
            window.sessionStorage.setItem(idTokenKey, TEST_TOKENS.IDTOKEN_V2);
            window.sessionStorage.setItem(clientInfoKey, TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO);
            window.sessionStorage.setItem(errorKey, errorKeyVal);
            window.sessionStorage.setItem(errorDescKey, errorDescVal);

            const browserStorage = new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig);
            expect(window.sessionStorage.getItem(idTokenKey)).to.be.eq(TEST_TOKENS.IDTOKEN_V2);
            expect(window.sessionStorage.getItem(clientInfoKey)).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO);
            expect(window.sessionStorage.getItem(errorKey)).to.be.eq(errorKeyVal);
            expect(window.sessionStorage.getItem(errorDescKey)).to.be.eq(errorDescVal);
            expect(browserStorage.getItem(browserStorage.generateCacheKey(PersistentCacheKeys.ID_TOKEN), CacheSchemaType.TEMPORARY)).to.be.eq(TEST_TOKENS.IDTOKEN_V2);
            expect(browserStorage.getItem(browserStorage.generateCacheKey(PersistentCacheKeys.CLIENT_INFO), CacheSchemaType.TEMPORARY)).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO);
            expect(browserStorage.getItem(browserStorage.generateCacheKey(PersistentCacheKeys.ERROR), CacheSchemaType.TEMPORARY)).to.be.eq(errorKeyVal);
			expect(browserStorage.getItem(browserStorage.generateCacheKey(PersistentCacheKeys.ERROR_DESC), CacheSchemaType.TEMPORARY)).to.be.eq(errorDescVal);
		});
    });

    describe("Interface functions", () => {

        let browserSessionStorage: BrowserStorage;
        let browserLocalStorage: BrowserStorage;
        let cacheVal: string;
        let msalCacheKey: string;
        beforeEach(() => {
            browserSessionStorage = new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig);
            cacheConfig.cacheLocation = BrowserConstants.CACHE_LOCATION_LOCAL;
            browserLocalStorage = new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig);
            cacheVal = "cacheVal";
            msalCacheKey = browserSessionStorage.generateCacheKey("cacheKey");
        });

        afterEach(() => {
            browserSessionStorage.clear();
            browserLocalStorage.clear();
        });

        it("setItem()", () => {
            browserSessionStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            browserLocalStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            expect(window.sessionStorage.getItem(msalCacheKey)).to.be.eq(cacheVal);
            expect(window.localStorage.getItem(msalCacheKey)).to.be.eq(cacheVal);
        });

        it("setItem() throws error if type passed in is not one of CacheSchemaType types", () => {
            expect(() => browserSessionStorage.setItem(msalCacheKey, cacheVal, "OTHER_TYPE")).to.throw(BrowserAuthError);
            expect(() => browserSessionStorage.setItem(msalCacheKey, cacheVal, "OTHER_TYPE")).to.throw(BrowserAuthErrorMessage.invalidCacheType.desc);
            expect(() => browserLocalStorage.setItem(msalCacheKey, cacheVal, "OTHER_TYPE")).to.throw(BrowserAuthError);
            expect(() => browserLocalStorage.setItem(msalCacheKey, cacheVal, "OTHER_TYPE")).to.throw(BrowserAuthErrorMessage.invalidCacheType.desc);
        });

        it("getItem()", () => {
            window.sessionStorage.setItem(msalCacheKey, cacheVal);
            window.localStorage.setItem(msalCacheKey, cacheVal);
            expect(browserSessionStorage.getItem(msalCacheKey, CacheSchemaType.TEMPORARY)).to.be.eq(cacheVal);
            expect(browserLocalStorage.getItem(msalCacheKey, CacheSchemaType.TEMPORARY)).to.be.eq(cacheVal);
        });

        it("getItem() throws error if type passed in is not one of CacheSchemaType types", () => {
            window.sessionStorage.setItem(msalCacheKey, cacheVal);
            window.localStorage.setItem(msalCacheKey, cacheVal);
            expect(() => browserSessionStorage.getItem(msalCacheKey, "OTHER_TYPE")).to.throw(BrowserAuthError);
            expect(() => browserSessionStorage.getItem(msalCacheKey, "OTHER_TYPE")).to.throw(BrowserAuthErrorMessage.invalidCacheType.desc);
            expect(() => browserLocalStorage.getItem(msalCacheKey, "OTHER_TYPE")).to.throw(BrowserAuthError);
            expect(() => browserLocalStorage.getItem(msalCacheKey, "OTHER_TYPE")).to.throw(BrowserAuthErrorMessage.invalidCacheType.desc);
        });

        it("removeItem()", () => {
            browserSessionStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            browserLocalStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            browserSessionStorage.removeItem(msalCacheKey);
            browserLocalStorage.removeItem(msalCacheKey);
            expect(window.sessionStorage.getItem(msalCacheKey)).to.be.null;
            expect(window.localStorage.getItem(msalCacheKey)).to.be.null;
        });

        it("containsKey()", () => {
            browserSessionStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            browserLocalStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            expect(browserSessionStorage.containsKey(msalCacheKey)).to.be.true;
            expect(browserLocalStorage.containsKey(msalCacheKey)).to.be.true;
        });

        it("getKeys()", () => {
            browserSessionStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            browserLocalStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            expect(browserSessionStorage.getKeys()).to.be.deep.eq([msalCacheKey]);
            expect(browserLocalStorage.getKeys()).to.be.deep.eq([msalCacheKey]);
        });

        it("clear()", () => {
            browserSessionStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            browserLocalStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            browserSessionStorage.clear();
            browserLocalStorage.clear();
            expect(browserSessionStorage.getKeys()).to.be.empty;
            expect(browserLocalStorage.getKeys()).to.be.empty;
        });
    });

    describe("Interface functions with storeAuthStateInCookie=true", () => {

        let browserSessionStorage: BrowserStorage;
        let browserLocalStorage: BrowserStorage;
        let cacheVal: string;
        let msalCacheKey: string;
        beforeEach(() => {
            cacheConfig.storeAuthStateInCookie = true;
            browserSessionStorage = new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig);
            cacheConfig.cacheLocation = BrowserConstants.CACHE_LOCATION_LOCAL;
            browserLocalStorage = new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig);
            cacheVal = "cacheVal";
            msalCacheKey = browserSessionStorage.generateCacheKey("cacheKey");
        });

        afterEach(() => {
            browserSessionStorage.clear();
            browserLocalStorage.clear();
        });

        it("setItem()", () => {
            browserSessionStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            expect(window.sessionStorage.getItem(msalCacheKey)).to.be.eq(cacheVal);
            expect(document.cookie).to.be.eq(`${msalCacheKey}=${cacheVal}`);
            browserSessionStorage.clearItemCookie(msalCacheKey);
            browserLocalStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            expect(window.localStorage.getItem(msalCacheKey)).to.be.eq(cacheVal);
            expect(document.cookie).to.be.eq(`${msalCacheKey}=${cacheVal}`);
            browserLocalStorage.clearItemCookie(msalCacheKey);
        });

        it("getItem()", () => {
            const getCookieSpy = sinon.spy(BrowserStorage.prototype, "getItemCookie");
            window.sessionStorage.setItem(msalCacheKey, cacheVal);
            window.localStorage.setItem(msalCacheKey, cacheVal);
            browserSessionStorage.setItemCookie(msalCacheKey, cacheVal);
            expect(browserSessionStorage.getItem(msalCacheKey, CacheSchemaType.TEMPORARY)).to.be.eq(cacheVal);
            expect(getCookieSpy.returned(cacheVal)).to.be.true;
            expect(getCookieSpy.calledOnce).to.be.true;
            expect(browserLocalStorage.getItem(msalCacheKey, CacheSchemaType.TEMPORARY)).to.be.eq(cacheVal);
            expect(getCookieSpy.returned(cacheVal)).to.be.true;
            expect(getCookieSpy.calledTwice).to.be.true;
        });

        it("removeItem()", () => {
            const clearCookieSpy = sinon.spy(BrowserStorage.prototype, "clearItemCookie");
            browserSessionStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            browserSessionStorage.removeItem(msalCacheKey);
            expect(window.sessionStorage.getItem(msalCacheKey)).to.be.null;
            expect(document.cookie).to.be.empty;
            expect(clearCookieSpy.calledOnce).to.be.true;
            browserLocalStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            browserLocalStorage.removeItem(msalCacheKey);
            expect(window.localStorage.getItem(msalCacheKey)).to.be.null;
            expect(document.cookie).to.be.empty;
            expect(clearCookieSpy.calledTwice).to.be.true;
        });

        it("clear()", () => {
            browserSessionStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            browserSessionStorage.clear();
            expect(browserSessionStorage.getKeys()).to.be.empty;
            expect(document.cookie).to.be.empty;
            browserLocalStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            browserLocalStorage.clear();
            expect(browserLocalStorage.getKeys()).to.be.empty;
            expect(document.cookie).to.be.empty;
        });

        it("setItem() with item that contains ==", () => {
            msalCacheKey = `${Constants.CACHE_PREFIX}.${TEST_STATE_VALUES.ENCODED_LIB_STATE}`;
            browserSessionStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            expect(window.sessionStorage.getItem(msalCacheKey)).to.be.eq(cacheVal);
            expect(document.cookie).to.be.eq(`${encodeURIComponent(msalCacheKey)}=${cacheVal}`);
            browserSessionStorage.clearItemCookie(msalCacheKey);
            browserLocalStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            expect(window.localStorage.getItem(msalCacheKey)).to.be.eq(cacheVal);
            expect(document.cookie).to.be.eq(`${encodeURIComponent(msalCacheKey)}=${cacheVal}`);
            browserLocalStorage.clearItemCookie(msalCacheKey);
        });

        it("getItem() with item that contains ==", () => {
            msalCacheKey = `${Constants.CACHE_PREFIX}.${TEST_STATE_VALUES.ENCODED_LIB_STATE}`;
            const getCookieSpy = sinon.spy(BrowserStorage.prototype, "getItemCookie");
            window.sessionStorage.setItem(msalCacheKey, cacheVal);
            window.localStorage.setItem(msalCacheKey, cacheVal);
            browserSessionStorage.setItemCookie(msalCacheKey, cacheVal);
            expect(browserSessionStorage.getItem(msalCacheKey, CacheSchemaType.TEMPORARY)).to.be.eq(cacheVal);
            expect(getCookieSpy.returned(cacheVal)).to.be.true;
            expect(getCookieSpy.calledOnce).to.be.true;
            expect(browserLocalStorage.getItem(msalCacheKey, CacheSchemaType.TEMPORARY)).to.be.eq(cacheVal);
            expect(getCookieSpy.returned(cacheVal)).to.be.true;
            expect(getCookieSpy.calledTwice).to.be.true;
        });

        it("removeItem() with item that contains ==", () => {
            msalCacheKey = `${Constants.CACHE_PREFIX}.${TEST_STATE_VALUES.ENCODED_LIB_STATE}`;
            const clearCookieSpy = sinon.spy(BrowserStorage.prototype, "clearItemCookie");
            browserSessionStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            browserSessionStorage.removeItem(msalCacheKey);
            expect(window.sessionStorage.getItem(msalCacheKey)).to.be.null;
            expect(document.cookie).to.be.empty;
            expect(clearCookieSpy.calledOnce).to.be.true;
            browserLocalStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            browserLocalStorage.removeItem(msalCacheKey);
            expect(window.localStorage.getItem(msalCacheKey)).to.be.null;
            expect(document.cookie).to.be.empty;
            expect(clearCookieSpy.calledTwice).to.be.true;
        });

        it("clear() with item that contains ==", () => {
            msalCacheKey = `${Constants.CACHE_PREFIX}.${TEST_STATE_VALUES.ENCODED_LIB_STATE}`;
            browserSessionStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            browserSessionStorage.clear();
            expect(browserSessionStorage.getKeys()).to.be.empty;
            expect(document.cookie).to.be.empty;
            browserLocalStorage.setItem(msalCacheKey, cacheVal, CacheSchemaType.TEMPORARY);
            browserLocalStorage.clear();
            expect(browserLocalStorage.getKeys()).to.be.empty;
            expect(document.cookie).to.be.empty;
        });
    });

    describe("Cookie operations", () => {

        let browserSessionStorage: BrowserStorage;
        let browserLocalStorage: BrowserStorage;
        let cacheVal: string;
        let msalCacheKey: string;
        beforeEach(() => {
            browserSessionStorage = new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig);
            cacheConfig.cacheLocation = BrowserConstants.CACHE_LOCATION_LOCAL;
            browserLocalStorage = new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig);
            cacheVal = "cacheVal";
            msalCacheKey = browserSessionStorage.generateCacheKey("cacheKey");
        });

        it("setItemCookie()", () => {
            browserSessionStorage.setItemCookie(msalCacheKey, cacheVal);
            expect(document.cookie).to.be.eq(`${msalCacheKey}=${cacheVal}`);
            browserSessionStorage.clearItemCookie(msalCacheKey);
            browserLocalStorage.setItemCookie(msalCacheKey, cacheVal);
            expect(document.cookie).to.be.eq(`${msalCacheKey}=${cacheVal}`);
        });

        it("getItemCookie()", () => {
            browserSessionStorage.setItemCookie(msalCacheKey, cacheVal);
            expect(browserSessionStorage.getItemCookie(msalCacheKey)).to.be.eq(cacheVal);
            expect(browserLocalStorage.getItemCookie(msalCacheKey)).to.be.eq(cacheVal);
        });

        it("clearItemCookie()", () => {
            browserSessionStorage.setItemCookie(msalCacheKey, cacheVal);
            browserSessionStorage.clearItemCookie(msalCacheKey);
            expect(document.cookie).to.be.empty;

            browserLocalStorage.setItemCookie(msalCacheKey, cacheVal);
            browserSessionStorage.clearItemCookie(msalCacheKey);
            expect(document.cookie).to.be.empty;
        });

        it("clearMsalCookie()", () => {
            const nonceKey = `${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.NONCE_IDTOKEN}|${RANDOM_TEST_GUID}`;
            const stateKey = `${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}`;
            const originUriKey = `${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`;
            browserSessionStorage.setItemCookie(nonceKey, "thisIsANonce");
            browserSessionStorage.setItemCookie(stateKey, RANDOM_TEST_GUID);
            browserSessionStorage.setItemCookie(originUriKey, "https://contoso.com");
            browserSessionStorage.clearMsalCookie(RANDOM_TEST_GUID);
            expect(document.cookie).to.be.empty;
            browserSessionStorage.setItemCookie(nonceKey, "thisIsANonce");
            browserSessionStorage.setItemCookie(stateKey, RANDOM_TEST_GUID);
            browserSessionStorage.setItemCookie(originUriKey, "https://contoso.com");
            browserSessionStorage.clearMsalCookie(RANDOM_TEST_GUID);
            expect(document.cookie).to.be.empty;
        });

        it("getCookieExpirationTime()", () => {
            const COOKIE_LIFE_MULTIPLIER = 24 * 60 * 60 * 1000;
            const currentTime = new Date().getTime();
            sinon.stub(Date.prototype, "getTime").returns(currentTime);
            const cookieLifeDays = 1;
            const expectedDate = new Date(currentTime + (cookieLifeDays * COOKIE_LIFE_MULTIPLIER));
            expect(browserLocalStorage.getCookieExpirationTime(cookieLifeDays)).to.be.eq(expectedDate.toUTCString());
        });
	});

	describe("Helpers", () => {

		it("generateAuthorityKey() creates a valid cache key for authority strings", () => {
			const browserStorage = new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig);
            const authorityKey = browserStorage.generateAuthorityKey(RANDOM_TEST_GUID);
            expect(authorityKey).to.be.eq(`${TemporaryCacheKeys.AUTHORITY}${Constants.RESOURCE_DELIM}${RANDOM_TEST_GUID}`);
        });

        it("generateNonceKey() create a valid cache key for nonce strings", () => {
			const browserStorage = new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig);
            const nonceKey = browserStorage.generateNonceKey(RANDOM_TEST_GUID);
            expect(nonceKey).to.be.eq(`${TemporaryCacheKeys.NONCE_IDTOKEN}${Constants.RESOURCE_DELIM}${RANDOM_TEST_GUID}`);
		});

		it("updateCacheEntries() correctly updates the authority, state and nonce in the cache", () => {
			const authorityCacheSpy = sinon.spy(BrowserStorage.prototype, "setAuthorityCache");
			const browserStorage = new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig);
			const testNonce = "testNonce";
            browserStorage.updateCacheEntries(RANDOM_TEST_GUID, testNonce, `${Constants.DEFAULT_AUTHORITY}/`);

            expect(authorityCacheSpy.calledOnce).to.be.true;
            const nonceKey = browserStorage.generateNonceKey(RANDOM_TEST_GUID);
            const authorityKey = browserStorage.generateAuthorityKey(RANDOM_TEST_GUID);

            expect(window.sessionStorage[`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}`]).to.be.eq(RANDOM_TEST_GUID);
            expect(window.sessionStorage[`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${nonceKey}`]).to.be.eq(testNonce);
            expect(window.sessionStorage[`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${authorityKey}`]).to.be.eq(`${Constants.DEFAULT_AUTHORITY}/`);
        });

        it("resetTempCacheItems() resets all temporary cache items with the given state", () => {
			const browserStorage = new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig);
            browserStorage.updateCacheEntries(RANDOM_TEST_GUID, "nonce", `${TEST_URIS.DEFAULT_INSTANCE}/`);
            browserStorage.setItem(TemporaryCacheKeys.REQUEST_PARAMS, "TestRequestParams", CacheSchemaType.TEMPORARY);
            browserStorage.setItem(TemporaryCacheKeys.ORIGIN_URI, TEST_URIS.TEST_REDIR_URI, CacheSchemaType.TEMPORARY);

            browserStorage.resetRequestCache(RANDOM_TEST_GUID);
            const nonceKey = browserStorage.generateNonceKey(RANDOM_TEST_GUID);
            const authorityKey = browserStorage.generateAuthorityKey(RANDOM_TEST_GUID);
            expect(window.sessionStorage[`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${nonceKey}`]).to.be.undefined;
            expect(window.sessionStorage[`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${authorityKey}`]).to.be.undefined;
            expect(window.sessionStorage[`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}`]).to.be.undefined;
            expect(window.sessionStorage[`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_PARAMS}`]).to.be.undefined;
            expect(window.sessionStorage[`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`]).to.be.undefined;
		});

		it("Successfully retrieves and decodes response from cache", async () => {
			const browserStorage = new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig);
			const cryptoObj = new CryptoOps();
            const tokenRequest: AuthorizationCodeRequest = {
				redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}`,
				scopes: [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE],
				code: "thisIsAnAuthCode",
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: `${RANDOM_TEST_GUID}`
			};

			browserStorage.setItem(browserStorage.generateCacheKey(TemporaryCacheKeys.REQUEST_PARAMS), cryptoObj.base64Encode(JSON.stringify(tokenRequest)), CacheSchemaType.TEMPORARY);

			const cachedRequest = browserStorage.getCachedRequest(RANDOM_TEST_GUID, cryptoObj);
			expect(cachedRequest).to.be.deep.eq(tokenRequest);

			// expect(() => browserStorage.getCachedRequest(RANDOM_TEST_GUID, cryptoObj)).to.throw(BrowserAuthErrorMessage.tokenRequestCacheError.desc);
		});

		it("Throws error if request cannot be retrieved from cache", async () => {
			const browserStorage = new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig);
			const cryptoObj = new CryptoOps();
            const tokenRequest: AuthorizationCodeRequest = {
				redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}`,
				scopes: [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE],
				code: "thisIsAnAuthCode",
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: `${RANDOM_TEST_GUID}`
			};

			// browserStorage.setItem(TemporaryCacheKeys.REQUEST_PARAMS, cryptoObj.base64Encode(JSON.stringify(tokenRequest)));

			expect(() => browserStorage.getCachedRequest(RANDOM_TEST_GUID, cryptoObj)).to.throw(BrowserAuthErrorMessage.tokenRequestCacheError.desc);
		});

		it("Throws error if cached request cannot be parsed correctly", async () => {
			const browserStorage = new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig);
			const cryptoObj = new CryptoOps();
			const tokenRequest: AuthorizationCodeRequest = {
				redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}`,
				scopes: [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE],
				code: "thisIsAnAuthCode",
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: `${RANDOM_TEST_GUID}`
			};
			const stringifiedRequest = JSON.stringify(tokenRequest);
			browserStorage.setItem(browserStorage.generateCacheKey(TemporaryCacheKeys.REQUEST_PARAMS), stringifiedRequest.substring(0, stringifiedRequest.length / 2), CacheSchemaType.TEMPORARY);
			expect(() => browserStorage.getCachedRequest(RANDOM_TEST_GUID, cryptoObj)).to.throw(BrowserAuthErrorMessage.tokenRequestCacheError.desc);
		});

		it("Uses authority from cache if not present in cached request", async () => {
			const browserStorage = new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig);
			// Set up cache
			const browserCrypto = new CryptoOps();
			const authorityKey = browserStorage.generateAuthorityKey(RANDOM_TEST_GUID);
			const alternateAuthority = `${TEST_URIS.ALTERNATE_INSTANCE}/common/`;
			browserStorage.setItem(browserStorage.generateCacheKey(authorityKey), alternateAuthority, CacheSchemaType.TEMPORARY);

			const cachedRequest: AuthorizationCodeRequest = {
				redirectUri: TEST_URIS.TEST_REDIR_URI,
				code: "thisIsACode",
				codeVerifier: TEST_CONFIG.TEST_VERIFIER,
				correlationId: RANDOM_TEST_GUID,
				scopes: [TEST_CONFIG.MSAL_CLIENT_ID],
			};
			const stringifiedRequest = browserCrypto.base64Encode(JSON.stringify(cachedRequest));
			browserStorage.setItem(browserStorage.generateCacheKey(TemporaryCacheKeys.REQUEST_PARAMS), stringifiedRequest, CacheSchemaType.TEMPORARY);

			// Perform test
			const tokenRequest = browserStorage.getCachedRequest(RANDOM_TEST_GUID, browserCrypto);
			expect(tokenRequest.authority).to.be.eq(alternateAuthority);
        });
        
        it("getClientId returns a clientId", () => {
            const browserStorage = new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig);
            const clientId = browserStorage.getClientId();
            expect(clientId).to.deep.eq(TEST_CONFIG.MSAL_CLIENT_ID);
        });
	});
});
