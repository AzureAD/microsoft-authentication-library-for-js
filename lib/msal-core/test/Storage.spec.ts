import { expect } from "chai";
import sinon from "sinon";
import { Storage } from "../src/Storage";
import { Constants } from "../src";
import { CacheKeys } from "../src/Constants";
import { AccessTokenKey } from "../src/AccessTokenKey";
import { AccessTokenValue } from "../src/AccessTokenValue";
import { Account } from "../src/Account";

describe("Storage", function () {
    let TEST_KEY = "test_key";
    let TEST_VALUE = "test value";
    let TEST_ACCOUNT_ID = "1234";
    let TEST_STATE = "state5678";
    let cacheStorage : Storage;
    let accessTokenKey : AccessTokenKey;
    let accessTokenValue : AccessTokenValue;
    let account : Account;

    let setTestCacheItems = function () {
        accessTokenKey = {
            authority: "validAuthority",
            clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
            scopes: "S1",
            homeAccountIdentifier: "1234"
        };
        accessTokenValue = {
            accessToken: "accessToken1",
            idToken: "idToken",
            expiresIn: "150000000000000",
            homeAccountIdentifier: ""
        };
        account = {
            accountIdentifier: "1234",
            environment: "js",
            homeAccountIdentifier: "1234",
            idToken: "idToken",
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
            sinon.restore();
        });

        it("parses the cache location correctly", function (done) {
            cacheStorage = new Storage("localStorage");
            sinon.stub(window.localStorage, "setItem").callsFake(function (key, value) {
                expect(key).to.be.eq(TEST_KEY);
                expect(value).to.be.eq(TEST_VALUE);
            });
            cacheStorage.setItem(TEST_KEY, TEST_VALUE);
            
            sinon.stub(cacheStorage, <any>"cacheLocation").value("sessionStorage");
            sinon.stub(window.sessionStorage, "setItem").callsFake(function (key, value) {
                expect(key).to.be.eq(TEST_KEY);
                expect(value).to.be.eq(TEST_VALUE);
                done();
            });
            cacheStorage.setItem(TEST_KEY, TEST_VALUE);
        });

        it("throws error if cache location is not supported", function () {
            // Cannot test with current tooling - will need to take a look
            // Possibly wrapple as an option here? https://github.com/mroderick/wrapple
        });

        it("uses previous storage instance if one already exists", function () {
            let oldCacheStorage = new Storage(Constants.cacheLocationLocal);
            cacheStorage = new Storage(Constants.cacheLocationSession);
            expect(cacheStorage).to.deep.eq(oldCacheStorage);
        });

    });

    describe("localStorage access functions", function () {

        beforeEach(function () {
            cacheStorage = new Storage("localStorage");
            setTestCacheItems();
        });

        afterEach(function () {
            cacheStorage = null;
        });

        it("tests setItem works", function () {
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            expect(window.localStorage.getItem(JSON.stringify(accessTokenKey))).to.be.eq(JSON.stringify(accessTokenValue));
        });

        it("tests getItem works", function () {
            window.localStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            expect(cacheStorage.getItem(JSON.stringify(accessTokenKey))).to.be.eq(JSON.stringify(accessTokenValue));
        });

        it("tests removeItem works", function () {
            window.localStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            cacheStorage.removeItem(JSON.stringify(accessTokenKey));
            expect(window.localStorage.getItem(JSON.stringify(accessTokenKey))).to.be.null;
        });

        it("tests clear works", function () {
            let clearSpy = sinon.spy(window.localStorage, "clear");
            window.localStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            cacheStorage.clear();
            expect(clearSpy.calledOnce).to.be.true;
        });

        it("tests setItemCookie works", function () {
            let idTokenNonceString = "idTokenNonce";
            cacheStorage.setItemCookie(Constants.nonceIdToken, idTokenNonceString);
            expect(document.cookie).to.include(Constants.nonceIdToken);
            expect(document.cookie).to.include(idTokenNonceString);
        });

        it("tests getItemCookie ", function () {
            let idTokenNonceString = "idTokenNonce";
            cacheStorage.setItemCookie(Constants.nonceIdToken, idTokenNonceString);
            let retrievedItem = cacheStorage.getItemCookie(Constants.nonceIdToken);
            expect(retrievedItem).to.include(idTokenNonceString);
        });

        it("tests clearCookie", function () {
            let idTokenNonceString = "idTokenNonce";
            let stateLoginString = "stateLogin";
            let loginRequestString = "loginRequest";
            let stateAcquireTokenString = "stateAcquireToken";
            cacheStorage.setItemCookie(Constants.nonceIdToken, idTokenNonceString);
            cacheStorage.setItemCookie(Constants.stateLogin, stateLoginString);
            cacheStorage.setItemCookie(Constants.loginRequest, loginRequestString);
            cacheStorage.setItemCookie(Constants.stateAcquireToken, stateAcquireTokenString);
            cacheStorage.clearCookie();
            expect(document.cookie).to.be.empty;
        });
    });

    describe("static key generators", function () {

        it("generates acquireToken account key", function () {
            let acquireTokenAccountKey = Storage.generateAcquireTokenAccountKey(TEST_ACCOUNT_ID, TEST_STATE);
            expect(acquireTokenAccountKey).to.include(TEST_ACCOUNT_ID);
            expect(acquireTokenAccountKey).to.include(TEST_STATE);
            expect(acquireTokenAccountKey).to.include(CacheKeys.ACQUIRE_TOKEN_USER);
        });

        it("generates authority key", function () {
            let authorityKey = Storage.generateAuthorityKey(TEST_STATE);
            expect(authorityKey).to.include(TEST_STATE);
            expect(authorityKey).to.include(CacheKeys.AUTHORITY);
        });
    });

});
