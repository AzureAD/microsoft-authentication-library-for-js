'use strict'
/* Directive tells jshint that it, describe are globals defined by jasmine */
/* global it */
/* global describe */
var atobHelper = require('atob');
var confighash = { hash: '#' };
global.window = {};
var MsalModule = require('../dist/msal.js');

describe('Msal', function () {
    var msal, window;
    var mathMock = {
        random: function () {
            return 0.2;
        },
        round: function (val) {
            return 1000;
        }
    };

    var mockFrames = {};

    var documentMock = {
        getElementById: function (frameId) {
            if (!mockFrames[frameId]) {
                mockFrames[frameId] = { src: 'start' };
            }
            return mockFrames[frameId];
        }
    };

    var RESOURCE_DELIMETER = '|';
    var DEFAULT_INSTANCE = "https://login.microsoftonline.com/";
    var TENANT = 'common';

    var storageFake = function () {
        var store = {};

        var accessTokenCacheItem = {
            key: {
                authority: "",
                clientId: "",
                scopes: "",
                userIdentifer: ""
            },
            value: {
                accessToken: "",
                idToken: "",
                expiresIn: "",
                clientInfo: ""
            }
        }

        return {
            getItem: function (key) {
                return store[key];
            },
            setItem: function (key, value) {
                if (typeof value != 'undefined') {
                    store[key] = value;
                }
            },
            removeItem: function (key) {
                if (typeof store[key] != 'undefined') {
                    delete store[key];
                }
            },
            clear: function () {
                store = {};
            },
            storeVerify: function () {
                return store;
            },
            getAllAccessTokens: function (clientId, userIdentifier) {
                var results = [];
                for (var key in store) {
                    if (store.hasOwnProperty(key)) {
                        if (key.match(clientId) && key.match(userIdentifier)) {
                            let value = this.getItem(key);
                            if (value) {
                                accessTokenCacheItem = {};
                                accessTokenCacheItem.key = JSON.parse(key);
                                accessTokenCacheItem.value = JSON.parse(value);
                                results.push(accessTokenCacheItem);
                            }
                        }
                    }
                }
                return results;
            }
        };
    }();

    beforeEach(function () {

        // one item in cache
        storageFake.clear();

        var secondsNow = mathMock.round(0);
        window = {
            location: {
                hash: '#hash',
                href: 'href',
                replace: function (val) {
                },
            },
            parent: {

            },
            localStorage: {},
            sessionStorage: {},

            atob: atobHelper,
            innerWidth: 100,
            innerHeight: 100
        };
        window.localStorage = storageFake;
        window.sessionStorage = storageFake;
        // Init adal 

        global.window = window;
        global.localStorage = storageFake;
        global.sessionStorage = storageFake;
        global.document = documentMock;
        global.Math = mathMock;

        msal = new MsalModule.UserAgentApplication("0813e1d1-ad72-46a9-8665-399bba48c201", null, function (errorDes, token, error) {
        });
        msal._user = null;
        msal._renewStates = [];
        msal._activeRenewals = {};
        msal._cacheStorage = storageFake;
    });

    it('tests getCachedToken when authority is not passed and single accessToken is present in the cache for a set of scopes', function () {
        var accessTokenKey = {
            authority: "https://login.microsoftonline.com/common",
            clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
            scopes: "S1",
            userIdentifer: "1234"
        }
        var accessTokenValue = {
            accessToken: "accessToken",
            idToken: "idToken",
            expiresIn: "1400",
            clientInfo: ""
        }
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        var user = { userIdentifier: "1234" };
        let cacheResult = msal.getCachedToken({ scopes: ['S1'] }, user);
        expect(cacheResult.token).toBe('accessToken');
        expect(cacheResult.errorDesc).toBe(null);
        expect(cacheResult.error).toBe(null);
        storageFake.clear();
    });

    it('tests getCachedToken when authority is not passed and multiple accessTokens are present in the cache for the same set of scopes', function () {
        var accessTokenKey = {
            authority: "authority1",
            clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
            scopes: "S1",
            userIdentifer: "1234"
            
        }
        var accessTokenValue = {
            accessToken: "accessToken",
            idToken: "idToken",
            expiresIn: "1400",
            clientInfo: ""
        }
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        accessTokenKey.scopes = "S1 S2";
        accessTokenKey.authority = "authority2";
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        var user = { userIdentifier: "1234" };
        let cacheResult = msal.getCachedToken({ scopes: ["S1"] }, user);
        expect(cacheResult.errorDesc).toBe("The cache contains multiple tokens satisfying the requirements. Call AcquireToken again providing more requirements like authority");
        expect(cacheResult.token).toBe(null);
        expect(cacheResult.error).toBe("multiple_matching_tokens_detected");
        storageFake.clear();
    });

    it('tests getCachedToken without sending authority when no matching accesstoken is found and multiple authorities exist', function () {
        var accessTokenKey = {
            authority: "authority1",
            clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
            scopes: "S1",
            userIdentifer: "1234"
        }
        var accessTokenValue = {
            accessToken: "accessToken",
            idToken: "idToken",
            expiresIn: "1400",
            clientInfo: ""
        }
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        accessTokenKey.scopes = 'S2';
        accessTokenKey.authority = 'authority2';
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

        var user = { userIdentifier: "1234" };
        let cacheResult = msal.getCachedToken({ scopes: ['S3'] }, user);
        expect(cacheResult.errorDesc).toBe("Multiple authorities found in the cache. Pass authority in the API overload.");
        expect(cacheResult.token).toBe(null);
        expect(cacheResult.error).toBe("multiple_matching_tokens_detected");
        storageFake.clear();
    });

    it('tests getCachedToken when authority is passed and no matching accessToken is found', function () {
        var accessTokenKey = {
            authority: "authority1",
            clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
            scopes: "S1",
            userIdentifer: "1234"
        }
        var accessTokenValue = {
            accessToken: "accessToken",
            idToken: "idToken",
            expiresIn: "1400",
            clientInfo: ""
        }
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        var user = { userIdentifier: "1234" };
        let cacheResult = msal.getCachedToken({ authority:"authority2", scopes: ['S1'] }, user);
        expect(cacheResult).toBe(null);
        storageFake.clear();
    });

    it('tests getCachedToken when authority is passed and single matching accessToken is found', function () {
        var accessTokenKey = {
            authority: "authority1",
            clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
            scopes: "S1",
            userIdentifer: "1234"
        }
        var accessTokenValue = {
            accessToken: "accessToken1",
            idToken: "idToken",
            expiresIn: "1400",
            clientInfo: ""
        }
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        accessTokenKey.authority = "authority2";
        accessTokenValue.accessToken = "accessToken2";
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        var user = { userIdentifier: "1234" };
        let cacheResult1 = msal.getCachedToken({ authority: "authority1", scopes: ['S1'] }, user);
        expect(cacheResult1.errorDesc).toBe(null);
        expect(cacheResult1.token).toBe('accessToken1');
        expect(cacheResult1.error).toBe(null);
        let cacheResult2 = msal.getCachedToken({ authority: "authority2", scopes: ['S1'] }, user);
        expect(cacheResult2.errorDesc).toBe(null);
        expect(cacheResult2.token).toBe('accessToken2');
        expect(cacheResult2.error).toBe(null);
        storageFake.clear();
    });

    it('tests getCachedToken when authority is passed and multiple matching accessTokens are found', function () {
        var accessTokenKey = {
            authority: "authority1",
            clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
            scopes: "S1",
            userIdentifer: "1234"
        }
        var accessTokenValue = {
            accessToken: "accessToken1",
            idToken: "idToken",
            expiresIn: "1400",
            clientInfo: ""
        }
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        accessTokenKey.authority = "authority1";
        accessTokenKey.scopes = "S1 S2";
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        var user = { userIdentifier: "1234" };
        let cacheResult = msal.getCachedToken({ authority: "authority1", scopes: ['S1'] }, user);
        expect(cacheResult.errorDesc).toBe("The cache contains multiple tokens satisfying the requirements.Call AcquireToken again providing more requirements like authority");
        expect(cacheResult.token).toBe(null);
        expect(cacheResult.error).toBe("multiple_matching_tokens_detected");
        storageFake.clear();
    });

    it('tests getCachedToken when authority is passed and single matching accessToken is found which is expired', function () {
        var accessTokenKey = {
            authority: "authority1",
            clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
            scopes: "S1",
            userIdentifer: "1234"
        }
        var accessTokenValue = {
            accessToken: "accessToken1",
            idToken: "idToken",
            expiresIn: "1300",
            clientInfo: ""
        }
        storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        var user = { userIdentifier: "1234" };
        let cacheResult = msal.getCachedToken({ authority: "authority1", scopes: ['S1'] }, user);
        expect(cacheResult).toBe(null);
        expect(storageFake.getItem(JSON.stringify(accessTokenKey))).toBe(undefined);
        storageFake.clear();
    });

});
