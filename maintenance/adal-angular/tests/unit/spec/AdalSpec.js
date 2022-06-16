//----------------------------------------------------------------------
// Copyright (c) Microsoft Open Technologies, Inc.
// All Rights Reserved
// Apache License 2.0
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//----------------------------------------------------------------------
'use strict'
/* Directive tells jshint that it, describe are globals defined by jasmine */
/* global it */
/* global describe */
var atobHelper = require('atob');
var confighash = { hash: '#' };
global.window = {};
var AdalModule = require('../../../lib/adal.js');

describe('Adal', function () {
    var adal, window;
    global.Logging = global.window.Logging;
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

    var angularMock = {};
    var conf = { 
        loginResource: 'defaultResource', 
        tenant: 'testtenant', 
        clientId: 'e9a5a8b6-8af7-4719-9821-0deef255f68e', navigateToLoginRequestUrl: true,
        cacheLocation: 'sessionStorage'
    };
    var testPage = 'this is a song';
    var STORAGE_PREFIX = 'adal';
    var STORAGE_ACCESS_TOKEN_KEY = STORAGE_PREFIX + '.access.token.key';
    var STORAGE_EXPIRATION_KEY = STORAGE_PREFIX + '.expiration.key';
    var STORAGE_TOKEN_KEYS = STORAGE_PREFIX + '.token.keys';
    var RESOURCE1 = 'token.resource1';
    var SECONDS_TO_EXPIRE = 3600;
    var DEFAULT_INSTANCE = "https://login.microsoftonline.com/";
    var IDTOKEN_MOCK = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjVUa0d0S1JrZ2FpZXpFWTJFc0xDMmdPTGpBNCJ9.eyJhdWQiOiJlOWE1YThiNi04YWY3LTQ3MTktOTgyMS0wZGVlZjI1NWY2OGUiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLXBwZS5uZXQvNTJkNGIwNzItOTQ3MC00OWZiLTg3MjEtYmMzYTFjOTkxMmExLyIsImlhdCI6MTQxMTk1OTAwMCwibmJmIjoxNDExOTU5MDAwLCJleHAiOjE0MTE5NjI5MDAsInZlciI6IjEuMCIsInRpZCI6IjUyZDRiMDcyLTk0NzAtNDlmYi04NzIxLWJjM2ExYzk5MTJhMSIsImFtciI6WyJwd2QiXSwib2lkIjoiZmEzYzVmYTctN2Q5OC00Zjk3LWJmYzQtZGJkM2E0YTAyNDMxIiwidXBuIjoidXNlckBvYXV0aGltcGxpY2l0LmNjc2N0cC5uZXQiLCJ1bmlxdWVfbmFtZSI6InVzZXJAb2F1dGhpbXBsaWNpdC5jY3NjdHAubmV0Iiwic3ViIjoiWTdUbXhFY09IUzI0NGFHa3RjbWpicnNrdk5tU1I4WHo5XzZmbVc2NXloZyIsImZhbWlseV9uYW1lIjoiYSIsImdpdmVuX25hbWUiOiJ1c2VyIiwibm9uY2UiOiI4MGZmYTkwYS1jYjc0LTRkMGYtYTRhYy1hZTFmOTNlMzJmZTAiLCJwd2RfZXhwIjoiNTc3OTkxMCIsInB3ZF91cmwiOiJodHRwczovL3BvcnRhbC5taWNyb3NvZnRvbmxpbmUuY29tL0NoYW5nZVBhc3N3b3JkLmFzcHgifQ.WHsl8TH1rQ3dQbRkV0TS6GBVAxzNOpG3nGG6mpEBCwAOCbyW6qRsSoo4qq8I5IGyerDf2cvcS-zzatHEROpRC9dcpwkRm6ta5dFZuouFyZ_QiYVKSMwfzEC_FI-6p7eT8gY6FbV51bp-Ah_WKJqEmaXv-lqjIpgsMGeWDgZRlB9cPODXosBq-PEk0q27Be-_A-KefQacJuWTX2eEhECLyuAu-ETVJb7s19jQrs_LJXz_ISib4DdTKPa7XTBDJlVGdCI18ctB67XwGmGi8MevkeKqFI8dkykTxeJ0MXMmEQbE6Fw-gxmP7uJYbZ61Jqwsw24zMDMeXatk2VWMBPCuhA';
    var STATE = '33333333-3333-4333-b333-333333333333';
    var SESSION_STATE = '451c6916-27cf-4eae-81cd-accf96126398';
    var VALID_URLFRAGMENT = 'id_token=' + IDTOKEN_MOCK + '' + '&state=' + STATE + '&session_state=' + SESSION_STATE;
    var INVALID_URLFRAGMENT = 'id_token' + IDTOKEN_MOCK + '' + '&state=' + STATE + '&session_state=' + SESSION_STATE;
    var storageFake = function () {
        var store = {};
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
            }
        };
    }();

    beforeEach(function () {

        // one item in cache
        storageFake.clear();
        storageFake.setItem(STORAGE_ACCESS_TOKEN_KEY + RESOURCE1, 'access_token_in_cache' + RESOURCE1);
        var secondsNow = mathMock.round(0);
        storageFake.setItem(STORAGE_EXPIRATION_KEY + RESOURCE1, secondsNow + SECONDS_TO_EXPIRE); // seconds to expire

        // add key
        storageFake.setItem(STORAGE_TOKEN_KEYS, RESOURCE1 + '|');

        window = {
            location: {
                hash: '#hash',
                href: 'href',
                replace: function (val) {
                }
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
        global.angular = angularMock;

        AdalModule.prototype._singletonInstance = null;
        adal = new AdalModule(conf);
        adal._user = null;
        window.renewStates = [];
        adal._activeRenewals = {};
        adal.CONSTANTS.LOADFRAME_TIMEOUT = 800;
    });

    it('gets specific resource for defined endpoint mapping', function () {
        adal.config.endpoints = { 'a': 'resource for a' };
        expect(adal.getResourceForEndpoint('a')).toBe('resource for a');
        expect(adal.getResourceForEndpoint('b')).toBe(adal.config.loginResource);
    });

    it('gets default resource for empty endpoint mapping', function () {
        adal.config.endpoints = null;
        expect(adal.getResourceForEndpoint('a')).toBe('defaultResource');
        expect(adal.getResourceForEndpoint('b')).toBe('defaultResource');
    });

    it('gets null resource for annonymous endpoints', function () {
        adal.config.anonymousEndpoints = ['app/views'];
        expect(adal.getResourceForEndpoint('app/views')).toBe(null);
        expect(adal.getResourceForEndpoint('app/views/abc')).toBe(null);
        expect(adal.getResourceForEndpoint('default/app/views/abc')).toBe(null);
        expect(adal.getResourceForEndpoint('app/home')).toBe('defaultResource');

        adal.config.endpoints = { 'abc': 'resourceABC' };
        expect(adal.getResourceForEndpoint('abc')).toBe('resourceABC');
        adal.config.anonymousEndpoints = ['abc'];
        expect(adal.getResourceForEndpoint('abc')).toBe(null);
    });

    it('says token expired', function () {
        adal.config.expireOffsetSeconds = SECONDS_TO_EXPIRE - 100;
        expect(adal.getCachedToken(RESOURCE1)).toEqual('access_token_in_cache' + RESOURCE1);

        adal.config.expireOffsetSeconds = SECONDS_TO_EXPIRE;
        expect(adal.getCachedToken(RESOURCE1)).toBe(null);

        adal.config.expireOffsetSeconds = SECONDS_TO_EXPIRE + 1;
        expect(adal.getCachedToken(RESOURCE1)).toBe(null);
    });

    it('navigates user to login by default', function () {
        storageFake.setItem(adal.CONSTANTS.STORAGE.USERNAME, 'test user');
        adal.config.displayCall = null;
        adal.config.clientId = 'client';
        adal.config.redirectUri = 'contoso_site';
        spyOn(adal, 'promptUser');
        adal.login();
        expect(adal.promptUser).toHaveBeenCalledWith(DEFAULT_INSTANCE + conf.tenant + '/oauth2/authorize?response_type=id_token&client_id=client&redirect_uri=contoso_site&state=33333333-3333-4333-b333-333333333333'
            + '&client-request-id=33333333-3333-4333-b333-333333333333' + adal._addLibMetadata() + '&nonce=33333333-3333-4333-b333-333333333333');
        expect(adal.config.state).toBe('33333333-3333-4333-b333-333333333333');
    });

    it('sets loginprogress to true for login', function () {
        storageFake.setItem(adal.CONSTANTS.STORAGE.USERNAME, 'test user');
        adal.config.displayCall = null;
        adal.config.clientId = 'client';
        adal.config.redirectUri = 'contoso_site';
        adal.login();
        expect(adal.loginInProgress()).toBe(true);
    });

    it('calls displaycall if given for login', function () {
        storageFake.setItem(adal.CONSTANTS.STORAGE.USERNAME, 'test user');
        adal._loginInProgress = false;
        adal.config.clientId = 'client';
        adal.config.redirectUri = 'contoso_site';
        var urlToGo = '';
        var displayCallback = function (url) {
            urlToGo = url;
        };
        adal.config.displayCall = displayCallback;
        spyOn(adal.config, 'displayCall');
        adal.login();
        expect(adal.config.displayCall).toHaveBeenCalledWith(DEFAULT_INSTANCE + conf.tenant + '/oauth2/authorize?response_type=id_token&client_id=client&redirect_uri=contoso_site&state=33333333-3333-4333-b333-333333333333'
            + '&client-request-id=33333333-3333-4333-b333-333333333333'
            + adal._addLibMetadata()
            + '&nonce=33333333-3333-4333-b333-333333333333'
        );
        expect(adal.config.state).toBe('33333333-3333-4333-b333-333333333333');
    });

    it('returns from cache for auto renewable if not expired', function () {
        adal.config.expireOffsetSeconds = SECONDS_TO_EXPIRE - 100;
        var errDesc = '', token = '', err = '';
        var callback = function (valErrDesc, valToken, valErr) {
            errDesc = valErrDesc;
            token = valToken;
            err = valErr;
        };
        adal.acquireToken(RESOURCE1, callback);
        expect(token).toBe('access_token_in_cache' + RESOURCE1);
        expect(errDesc).toBe(null);
        expect(err).toBe(null);
    });

    it('returns error for acquireToken without resource', function () {
        adal.config.expireOffsetSeconds = SECONDS_TO_EXPIRE - 100;
        var errDesc = '', token = '', err = '';
        var callback = function (valErrDesc, valToken, valErr) {
            errDesc = valErrDesc;
            token = valToken;
            err = valErr;
        };
        adal.acquireToken(null, callback);
        expect(errDesc).toBe('resource is required');
        expect(token).toBe(null);
        expect(err).toBe('resource is required');
    });

    it('attempts to renew if token expired and renew is allowed', function () {
        adal.config.redirectUri = 'contoso_site';
        adal.config.clientId = 'client';
        adal.config.expireOffsetSeconds = SECONDS_TO_EXPIRE + 100;
        var errDesc = '', token = '', err = '';
        var callback = function (valErrDesc, valToken, valErr) {
            errDesc = valErrDesc;
            token = valToken;
            err = valErr;
        };
        adal._user = { profile: { 'upn': 'test@testuser.com' }, userName: 'test@domain.com' };
        adal.acquireToken(RESOURCE1, callback);
        expect(adal.callback).toBe(null);
        expect(adal._renewStates.length).toBe(1);
        // Wait for initial timeout load
        console.log('Waiting for initial timeout');
        waitsFor(function () {
            return mockFrames['adalRenewFrame' + RESOURCE1].src !== 'about:blank';
        }, 'iframe src not updated', 2000);

        runs(function () {
            expect(mockFrames['adalRenewFrame' + RESOURCE1].src).toBe(DEFAULT_INSTANCE + conf.tenant + '/oauth2/authorize?response_type=token&client_id=client&resource=' + RESOURCE1 + '&redirect_uri=contoso_site&state=33333333-3333-4333-b333-333333333333%7Ctoken.resource1'
                + '&client-request-id=33333333-3333-4333-b333-333333333333' + adal._addLibMetadata() + '&prompt=none&login_hint=test%40testuser.com&domain_hint=testuser.com');
        });

    });

    //Necessary for integration with Angular when multiple http calls are queued.
    it('allows multiple callers to be notified when the token is renewed. Also checks if all registered acquireToken callbacks are called in the case when one of the callbacks throws an error', function () {
        adal.config.redirectUri = 'contoso_site';
        adal.config.clientId = 'client';
        adal.config.expireOffsetSeconds = SECONDS_TO_EXPIRE + 100;
        var errDesc = '', token = '', err = '';
        var errDesc2 = '', token2 = '', err2 = '';
        var callback = function (valErrDesc, valToken, valErr) {
            errDesc = valErrDesc;
            token = valToken;
            err = valErr;
        };
        var callback2 = function (valErrDesc, valToken, valErr) {
            errDesc2 = valErrDesc;
            token2 = valToken;
            err2 = valErr;
        };
        adal._user = { profile: { 'upn': 'test@testuser.com' }, userName: 'test@domain.com' };
        adal.acquireToken(RESOURCE1, callback);
        //Simulate second acquire i.e. second service call from Angular.
        adal.acquireToken(RESOURCE1, callback2);
        expect(adal._renewStates.length).toBe(1);
        // Wait for initial timeout load
        console.log('Waiting for initial timeout');
        waitsFor(function () {
            return mockFrames['adalRenewFrame' + RESOURCE1].src !== 'about:blank';
        }, 'iframe src not updated', 2000);

        runs(function () {
            expect(mockFrames['adalRenewFrame' + RESOURCE1].src).toBe(DEFAULT_INSTANCE + conf.tenant + '/oauth2/authorize?response_type=token&client_id=client&resource=' + RESOURCE1 + '&redirect_uri=contoso_site&state=33333333-3333-4333-b333-333333333333%7Ctoken.resource1'
                + '&client-request-id=33333333-3333-4333-b333-333333333333' + adal._addLibMetadata() + '&prompt=none&login_hint=test%40testuser.com&domain_hint=testuser.com');
        });

        //Simulate callback from the frame.
        //adal.callback(null, '33333333-3333-4333-b333-333333333333');
        adal._callBackMappedToRenewStates[adal.config.state](null, '33333333-3333-4333-b333-333333333333', null);
        //Both callbacks should have been provided with the token.
        expect(token).toBe('33333333-3333-4333-b333-333333333333', 'First callback should be called');
        expect(errDesc).toBe(null);
        expect(err).toBe(null);
        expect(token2).toBe('33333333-3333-4333-b333-333333333333', 'Second callback should be called');
        expect(errDesc2).toBe(null);
        expect(err2).toBe(null);
    });

    it('check guid masking', function () {
        // masking is required for ver4 guid at begining hex  after version block
        // 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        mathMock.random = function () {
            return 0.1;
        };
        // 1->0001 after masked with & 0011 | 1000  1001
        expect(adal._guid()).toBe('11111111-1111-4111-9111-111111111111');
        mathMock.random = function () {
            return 0.3;
        };
        // 4->0100 after masked with & 0011 | 1000  1000
        expect(adal._guid()).toBe('44444444-4444-4444-8444-444444444444');
        mathMock.random = function () {
            return 0.99;
        };
        // 15->1111 after masked with & 0011 | 1000  1011
        expect(adal._guid()).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');

        mathMock.random = function () {
            return 0.9;
        };
        // 14->1110 after masked with & 0011 | 1000  1010
        expect(adal._guid()).toBe('eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee');
        mathMock.random = function () {
            return 0.2;
        };
        // 3->0011 after masked with & 0011 | 1000  1011
        expect(adal._guid()).toBe('33333333-3333-4333-b333-333333333333');
    });

    it('prompts user if url is given', function () {
        storageFake.setItem(adal.CONSTANTS.STORAGE.USERNAME, 'test user');
        spyOn(window.location, 'replace');
        adal.promptUser();
        expect(window.location.replace).not.toHaveBeenCalled();
        adal.promptUser('test');
        expect(window.location.replace).toHaveBeenCalled();
    });

    it('clears cache', function () {
        // Keys are stored for each resource to map tokens for resource
        storageFake.setItem(adal.CONSTANTS.STORAGE.TOKEN_KEYS, 'key1|key2|' + RESOURCE1 + '|');
        storageFake.setItem(adal.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + 'key1', 'value1');
        storageFake.setItem(adal.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + 'key2', 'value2');
        storageFake.setItem(adal.CONSTANTS.STORAGE.SESSION_STATE, 'session_state');
        storageFake.setItem(adal.CONSTANTS.STORAGE.STATE_LOGIN, 'state login');
        storageFake.setItem(adal.CONSTANTS.STORAGE.ERROR, 'error');
        storageFake.setItem(adal.CONSTANTS.STORAGE.ERROR_DESCRIPTION, 'error description');
        adal.clearCache();
        var store = storageFake.storeVerify();
        for (var prop in store) {
            expect((store[prop] === '' || store[prop] == 0 || !store[prop])).toBe(true);
        }
    });

    it('clears cache for a resource', function () {
        // Keys are stored for each resource to map tokens for resource
        storageFake.setItem(adal.CONSTANTS.STORAGE.TOKEN_KEYS, 'key1|' + RESOURCE1 + '|');
        storageFake.setItem(adal.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + 'key1', 'value1');
        storageFake.setItem(adal.CONSTANTS.STORAGE.EXPIRATION_KEY + 'key1', 3);
        storageFake.setItem(adal.CONSTANTS.STORAGE.STATE_RENEW, 'state renew');
        storageFake.setItem(adal.CONSTANTS.STORAGE.ERROR, 'error');
        storageFake.setItem(adal.CONSTANTS.STORAGE.ERROR_DESCRIPTION, 'error description');
        adal.clearCacheForResource(RESOURCE1);
        var store = storageFake.storeVerify();
        for (var prop in store) {
            if (prop == adal.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + RESOURCE1 ||
                prop == adal.CONSTANTS.STORAGE.EXPIRATION_KEY + RESOURCE1) {
                expect((store[prop] === '' || store[prop] == 0 || !store[prop])).toBe(true);
            }
        }
        var item = adal.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + 'key1';
        expect((store[item] === '' || store[item] == 0 || !store[item])).toBe(false);
    });

    it('clears cache before logout', function () {
        adal.config.clientId = 'client';
        adal.config.redirectUri = 'contoso_site';
        spyOn(adal, 'clearCache');
        spyOn(adal, 'promptUser');
        adal.logOut();
        expect(adal.clearCache).toHaveBeenCalled();
        expect(adal.promptUser).toHaveBeenCalled();
    });

    it('has logout redirect if given', function () {
        storageFake.setItem(adal.CONSTANTS.STORAGE.USERNAME, 'test user');
        adal.config.displayCall = null;
        adal.config.clientId = 'client';
        adal.config.tenant = 'testtenant'
        adal.config.postLogoutRedirectUri = 'https://contoso.com/logout';
        spyOn(adal, 'promptUser');
        adal.logOut();
        expect(adal.promptUser).toHaveBeenCalledWith(DEFAULT_INSTANCE + adal.config.tenant + '/oauth2/logout?post_logout_redirect_uri=https%3A%2F%2Fcontoso.com%2Flogout');
    });

    it('uses common for tenant if not given at logout redirect', function () {
        storageFake.setItem(adal.CONSTANTS.STORAGE.USERNAME, 'test user');
        adal.config.displayCall = null;
        adal.config.clientId = 'client';
        delete adal.config.tenant;
        adal.config.postLogoutRedirectUri = 'https://contoso.com/logout';
        spyOn(adal, 'promptUser');
        adal.logOut();
        expect(adal.promptUser).toHaveBeenCalledWith(DEFAULT_INSTANCE + 'common/oauth2/logout?post_logout_redirect_uri=https%3A%2F%2Fcontoso.com%2Flogout');
    });

    it('uses logout uri if given', function () {
        storageFake.setItem(adal.CONSTANTS.STORAGE.USERNAME, 'test user');
        adal.config.displayCall = null;
        adal.config.clientId = 'client';
        adal.config.logOutUri = 'https://login.microsoftonline.com/adfs/ls/?wa=wsignout1.0'
        spyOn(adal, 'promptUser');
        adal.logOut();
        expect(adal.promptUser).toHaveBeenCalledWith('https://login.microsoftonline.com/adfs/ls/?wa=wsignout1.0');
    })

    it('is callback if has error or access token or idtoken', function () {
        expect(adal.isCallback('not a callback')).toBe(false);
        expect(adal.isCallback('#error_description=someting_wrong')).toBe(true);
        expect(adal.isCallback('#/error_description=someting_wrong')).toBe(true);
        expect(adal.isCallback('#access_token=token123')).toBe(true);
        expect(adal.isCallback('#id_token=idtoken234')).toBe(true);
    });

    it('gets login error if any recorded', function () {
        storageFake.setItem(adal.CONSTANTS.STORAGE.LOGIN_ERROR, '');
        expect(adal.getLoginError()).toBe('');
        storageFake.setItem(adal.CONSTANTS.STORAGE.LOGIN_ERROR, 'err');
        expect(adal.getLoginError()).toBe('err');
    });

    it('gets request info from hash', function () {
        var requestInfo = adal.getRequestInfo('invalid');
        expect(requestInfo.valid).toBe(false);
        requestInfo = adal.getRequestInfo('#error_description=someting_wrong');
        expect(requestInfo.valid).toBe(true);
        expect(requestInfo.stateResponse).toBe('');

        requestInfo = adal.getRequestInfo('#error_description=someting_wrong&state=1232');
        expect(requestInfo.valid).toBe(true);
        expect(requestInfo.stateResponse).toBe('1232');
        expect(requestInfo.stateMatch).toBe(false);

        checkStateType(adal.CONSTANTS.STORAGE.STATE_LOGIN, '1234', adal.REQUEST_TYPE.LOGIN);
    });

    var checkStateType = function (state, stateExpected, requestType) {
        storageFake.setItem(state, stateExpected);
        adal._renewStates.push(stateExpected);
        var requestInfo = adal.getRequestInfo('#error_description=someting_wrong&state=' + stateExpected);
        expect(requestInfo.valid).toBe(true);
        expect(requestInfo.stateResponse).toBe(stateExpected);
        expect(requestInfo.stateMatch).toBe(true);
        expect(requestInfo.requestType).toBe(requestType);
        storageFake.setItem(state, '');
    }

    it('saves errors token from callback', function () {
        var requestInfo = {
            valid: false,
            parameters: { 'error_description': 'error description', 'error': 'invalid' },
            stateMatch: false,
            stateResponse: '',
            requestType: adal.REQUEST_TYPE.UNKNOWN
        };
        adal.saveTokenFromHash(requestInfo);

        expect(storageFake.getItem(adal.CONSTANTS.STORAGE.ERROR)).toBe('invalid');
        expect(storageFake.getItem(adal.CONSTANTS.STORAGE.ERROR_DESCRIPTION)).toBe('error description');
    });

    it('saves token if state matches', function () {
        var requestInfo = {
            valid: true,
            parameters: { 'access_token': 'token123', 'state': '123' },
            stateMatch: true,
            stateResponse: '123|loginResource1',
            requestType: adal.REQUEST_TYPE.RENEW_TOKEN
        };
        adal.saveTokenFromHash(requestInfo);

        expect(storageFake.getItem(adal.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + 'loginResource1')).toBe('token123');
    });

    it('saves expiry if state matches', function () {
        var requestInfo = {
            valid: true,
            parameters: { 'access_token': 'token123', 'state': '123', 'expires_in': 3589 },
            stateMatch: true,
            stateResponse: '123|loginResource1',
            requestType: adal.REQUEST_TYPE.RENEW_TOKEN
        };
        adal.saveTokenFromHash(requestInfo);
        expect(storageFake.getItem(adal.CONSTANTS.STORAGE.EXPIRATION_KEY + 'loginResource1')).toBe(mathMock.round(1) + 3589);
    });

    it('does not save user for invalid nonce in idtoken', function () {
        var requestInfo = {
            valid: true,
            parameters: {
                'id_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjVUa0d0S1JrZ2FpZXpFWTJFc0xDMmdPTGpBNCJ9.eyJhdWQiOiJlOWE1YThiNi04YWY3LTQ3MTktOTgyMS0wZGVlZjI1NWY2OGUiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLXBwZS5uZXQvNTJkNGIwNzItOTQ3MC00OWZiLTg3MjEtYmMzYTFjOTkxMmExLyIsImlhdCI6MTQxMTk2MDkwMiwibmJmIjoxNDExOTYwOTAyLCJleHAiOjE0MTE5NjQ4MDIsInZlciI6IjEuMCIsInRpZCI6IjUyZDRiMDcyLTk0NzAtNDlmYi04NzIxLWJjM2ExYzk5MTJhMSIsImFtciI6WyJwd2QiXSwib2lkIjoiZmEzYzVmYTctN2Q5OC00Zjk3LWJmYzQtZGJkM2E0YTAyNDMxIiwidXBuIjoidXNlckBvYXV0aGltcGxpY2l0LmNjc2N0cC5uZXQiLCJ1bmlxdWVfbmFtZSI6InVzZXJAb2F1dGhpbXBsaWNpdC5jY3NjdHAubmV0Iiwic3ViIjoiWTdUbXhFY09IUzI0NGFHa3RjbWpicnNrdk5tU1I4WHo5XzZmbVc2NXloZyIsImZhbWlseV9uYW1lIjoiYSIsImdpdmVuX25hbWUiOiJ1c2VyIiwibm9uY2UiOiIxOWU2N2IyNC1jZDk5LTQ1YjYtYTU4OC04NDBlM2Y4ZjJhNzAiLCJwd2RfZXhwIjoiNTc3ODAwOCIsInB3ZF91cmwiOiJodHRwczovL3BvcnRhbC5taWNyb3NvZnRvbmxpbmUuY29tL0NoYW5nZVBhc3N3b3JkLmFzcHgifQ.GzbTwMXhjs4uJFogd1B46C_gKX6uZ4BfgJIpzFS-n-HRXEWeKdZWboRC_-C4UnEy6G9kR6vNFq7zi3DY1P8uf1lUavdOFUE27xNY1McN1Vjm6HKxKNYOLU549-wIb6SSfGVycdyskdJfplf5VRasMGclwHlY0l9bBCTaPunjhfcg-mQmGKND-aO0B54EGhdGs740NiLMCh6kNXbp1WAv7V6Yn408qZEIsOQoPO0dW-wO54DTqpbLtqiwae0pk0hDxXWczaUPxR_wcz0f3TgF42iTp-j5bXTf2GOP1VPZtN9PtdjcjDIfZ6ihAVZCEDB_Y9czHv7et0IvB1bzRWP6bQ',
                'state': '123'
            },
            stateMatch: true,
            stateResponse: '123',
            requestType: adal.REQUEST_TYPE.ID_TOKEN
        };
        adal.config.clientId = conf.clientId;
        adal._user = null;
        adal.saveTokenFromHash(requestInfo);
        expect(adal.getCachedUser()).toBe(null);
    });


    it('saves null for username if idtoken is invalid', function () {
        var requestInfo = {
            valid: true,
            parameters: {
                'id_token': 'invalid',
                'state': '123'
            },
            stateMatch: true,
            stateResponse: '123',
            requestType: adal.REQUEST_TYPE.ID_TOKEN
        };
        adal.config.loginResource = 'loginResource1';
        adal.saveTokenFromHash(requestInfo);

        expect(storageFake.getItem(adal.CONSTANTS.STORAGE.USERNAME)).toBeUndefined();
    });

    it('saves null for username if idtoken is invalid', function () {
        var requestInfo = {
            valid: true,
            parameters: {
                'id_token': 'invalid',
                'state': '123'
            },
            stateMatch: true,
            stateResponse: '123',
            requestType: adal.REQUEST_TYPE.ID_TOKEN
        };
        adal.config.loginResource = 'loginResource1';
        adal.saveTokenFromHash(requestInfo);

        expect(storageFake.getItem(adal.CONSTANTS.STORAGE.USERNAME)).toBeUndefined();
    });

    it('test decode with no padding', function () {
        expect(adal._decode('ZGVjb2RlIHRlc3Rz')).toBe('decode tests');
    });

    it('test decode with one = padding', function () {
        expect(adal._decode('ZWNvZGUgdGVzdHM=')).toBe('ecode tests');
    });

    it('test decode with two == padding', function () {
        expect(adal._decode('Y29kZSB0ZXN0cw==')).toBe('code tests');
    })

    it('test decode throw error', function () {
        try {
            adal._decode('YW55I');
        } catch (e) {
            expect(e.message).toBe('The token to be decoded is not correctly encoded.');
        }
    });

    it('test get resource for endpoint from app backend', function () {
        adal.config.redirectUri = 'https://host.com/page';
        expect(adal.getResourceForEndpoint('https://host.com')).toBe(adal.config.loginResource);
        expect(adal.getResourceForEndpoint('https://host.com/a/b')).toBe(adal.config.loginResource);
        expect(adal.getResourceForEndpoint('https://host.com/page/')).toBe(adal.config.loginResource);
        expect(adal.getResourceForEndpoint('https://notapp.com/page/')).toBe(null);
        expect(adal.getResourceForEndpoint('/api/todo')).toBe(adal.config.loginResource);
    });

    it('test host extraction', function () {
        expect(adal._getHostFromUri('https://a.com/b/c')).toBe('a.com');
        expect(adal._getHostFromUri('http://a.com')).toBe('a.com');
        expect(adal._getHostFromUri('a.com/b/c')).toBe('a.com');
        expect(adal._getHostFromUri('http://a.com/')).toBe('a.com');
        expect(adal._getHostFromUri('http://localhost:8080')).toBe('localhost:8080');
    });

    it('test decode jwt', function () {
        expect(adal._decodeJwt('')).toBe(null);
        expect(adal._decodeJwt(null)).toBe(null);
    })

    it('saves error if state mismatch', function () {
        var requestInfo = {
            valid: true,
            parameters: { 'access_token': 'token123', 'state': '123' },
            stateMatch: false,
            stateResponse: '64532',
            requestType: adal.REQUEST_TYPE.UNKNOWN
        };
        adal.config.loginResource = 'loginResource1';
        adal.saveTokenFromHash(requestInfo);

        expect(storageFake.getItem(adal.CONSTANTS.STORAGE.ERROR_DESCRIPTION)).toBe('Invalid_state. state: ' + requestInfo.stateResponse);
    });

    it('checks if Logging is defined on window', function () {
        Logging.level = 2;
        Logging.log = function (message) {
            window.logMessage = message;
        }
        adal.promptUser();
        expect(window.logMessage).toContain("Navigate url is empty");
        expect(Logging.level).toEqual(2);
    });

    it('tests the load frame timeout method', function () {
        adal._loadFrameTimeout('urlnavigation', 'frameName', RESOURCE1);
        expect(storageFake.getItem(adal.CONSTANTS.STORAGE.RENEW_STATUS + RESOURCE1)).toBe(adal.CONSTANTS.TOKEN_RENEW_STATUS_IN_PROGRESS);

        // timeout interval passed
        waitsFor(function () {
            return storageFake.getItem(adal.CONSTANTS.STORAGE.RENEW_STATUS + RESOURCE1) === adal.CONSTANTS.TOKEN_RENEW_STATUS_CANCELED;
        }, 'token renew status not updated', 1000);

        runs(function () {
            expect(storageFake.getItem(adal.CONSTANTS.STORAGE.RENEW_STATUS + RESOURCE1)).toBe(adal.CONSTANTS.TOKEN_RENEW_STATUS_CANCELED);

            adal._loadFrameTimeout('urlnavigation', 'frameName', RESOURCE1);
            expect(storageFake.getItem(adal.CONSTANTS.STORAGE.RENEW_STATUS + RESOURCE1)).toBe(adal.CONSTANTS.TOKEN_RENEW_STATUS_IN_PROGRESS);
            var requestInfo = {
                valid: true,
                parameters: { 'access_token': 'token123', 'state': '123', 'expires_in': '23' },
                stateMatch: true,
                stateResponse: '64532|' + RESOURCE1,
                requestType: adal.REQUEST_TYPE.RENEW_TOKEN
            };
            adal.saveTokenFromHash(requestInfo);
            expect(storageFake.getItem(adal.CONSTANTS.STORAGE.RENEW_STATUS + RESOURCE1)).toBe(adal.CONSTANTS.TOKEN_RENEW_STATUS_COMPLETED);
        });
    });

    it('tests that callbacks are called when renewal token request was canceled', function () {
        adal.config.expireOffsetSeconds = SECONDS_TO_EXPIRE + 100;
        var errDesc = '', token = '', err = '';
        var callback = function (valErrDesc, valToken, valErr) {
            errDesc = valErrDesc;
            token = valToken;
            err = valErr;
        };
        adal._user = { userName: 'test@testuser.com' };
        adal.acquireToken(RESOURCE1, callback);
        waitsFor(function () {
            return storageFake.getItem(adal.CONSTANTS.STORAGE.RENEW_STATUS + RESOURCE1) === adal.CONSTANTS.TOKEN_RENEW_STATUS_CANCELED;
        }, 'token renew status not updated', 1000);
        runs(function () {
            adal._callBackMappedToRenewStates[adal.config.state]('Token renewal operation failed due to timeout', null, 'Token Renewal Failed');
            expect(storageFake.getItem(adal.CONSTANTS.STORAGE.RENEW_STATUS + RESOURCE1)).toBe(adal.CONSTANTS.TOKEN_RENEW_STATUS_CANCELED);
            expect(errDesc).toBe('Token renewal operation failed due to timeout');
            expect(token).toBe(null);
            expect(err).toBe('Token Renewal Failed');

        });
    });

    it('attempts to renewidToken if token expired and renew is allowed', function () {
        adal.config.redirectUri = 'contoso_site';
        adal.config.clientId = 'client';
        adal.config.expireOffsetSeconds = SECONDS_TO_EXPIRE + 100;
        adal.config.tenant = 'testtenant';
        var errDesc = '', token = '', err = '';
        var callback = function (valErrDesc, valToken, valErr) {
            errDesc = valErrDesc;
            token = valToken;
            err = valErr;
        };
        adal._user = { profile: { 'upn': 'test@testuser.com' }, userName: 'test@domain.com' };
        adal.acquireToken(adal.config.clientId, callback);
        expect(storageFake.getItem(adal.CONSTANTS.STORAGE.NONCE_IDTOKEN)).toBe('33333333-3333-4333-b333-333333333333');
        expect(adal.config.state).toBe('33333333-3333-4333-b333-333333333333' + '|' + 'client');
        expect(adal._renewStates.length).toBe(1);
        // Wait for initial timeout load
        console.log('Waiting for initial timeout');
        waitsFor(function () {
            return mockFrames['adalIdTokenFrame'].src !== 'about:blank';
        }, 'iframe src not updated', 2000);

        runs(function () {
            expect(mockFrames['adalIdTokenFrame'].src).toBe(DEFAULT_INSTANCE + conf.tenant + '/oauth2/authorize?response_type=id_token&client_id=' + adal.config.clientId + '&redirect_uri=contoso_site&state=33333333-3333-4333-b333-333333333333%7Cclient'
                + '&client-request-id=33333333-3333-4333-b333-333333333333' + adal._addLibMetadata() + '&prompt=none&login_hint=test%40testuser.com&domain_hint=testuser.com' + '&nonce=33333333-3333-4333-b333-333333333333');
        });
    });

    it('tests handleWindowCallback function for RENEW_TOKEN', function () {
        window.location.hash = '#/id_token=' + IDTOKEN_MOCK;
        var _getRequestInfo = adal.getRequestInfo;
        adal.getRequestInfo = function (hash) {
            return {
                valid: true,
                parameters: { 'error_description': 'error description', 'error': 'invalid', 'id_token': IDTOKEN_MOCK, 'session_state': '61ae5247-eaf8-4496-a667-32b0acbad7a0', 'state': '19537a2a-e9e7-489d-ae7d-3eefab9e4137' },
                stateMatch: true,
                stateResponse: '19537a2a-e9e7-489d-ae7d-3eefab9e4137',
                requestType: adal.REQUEST_TYPE.RENEW_TOKEN
            };
        };
        var errDesc = '', token = '', err = '';
        var callback = function (valErrDesc, valToken, valErr) {
            errDesc = valErrDesc;
            token = valToken;
            err = valErr;
        };
        window.parent = {};
        adal._callBackMappedToRenewStates = {};
        adal._callBackMappedToRenewStates[adal.getRequestInfo().stateResponse] = callback;
        window.parent._adalInstance = adal;
        adal.handleWindowCallback();
        expect(errDesc).toBe('error description');
        expect(err).toBe('invalid');
        expect(token).toBe(IDTOKEN_MOCK);
        adal.getRequestInfo = _getRequestInfo;

    });

    it('tests handleWindowCallback function for LOGIN_REQUEST', function () {
        window.location = {};
        window.location.hash = '#/id_token=' + IDTOKEN_MOCK;
        window.location.href = 'www.test.com' + '#/id_token=' + IDTOKEN_MOCK;
        var _getRequestInfo = adal.getRequestInfo;
        adal.getRequestInfo = function () {
            return {
                valid: true,
                parameters: { 'error_description': 'error description', 'error': 'invalid', 'id_token': IDTOKEN_MOCK, 'session_state': '61ae5247-eaf8-4496-a667-32b0acbad7a0', 'state': '19537a2a-e9e7-489d-ae7d-3eefab9e4137' },
                stateMatch: true,
                stateResponse: '19537a2a-e9e7-489d-ae7d-3eefab9e4137',
                requestType: adal.REQUEST_TYPE.LOGIN,
            };
        };
        storageFake.setItem(adal.CONSTANTS.STORAGE.LOGIN_REQUEST, "www.test.com");
        window.parent = {};
        window.parent._adalInstance = adal;
        window.parent = window;
        window.oauth2Callback = {};
        adal.handleWindowCallback();
        expect(window.location.href).toBe('www.test.com');
        adal.getRequestInfo = _getRequestInfo;

    });

    it('use the same correlationId for each request sent to AAD if set by user', function () {
        adal.config.correlationId = '33333333-3333-4333-b333-333333333333';
        adal.config.redirectUri = 'contoso_site';
        adal.config.clientId = 'client';
        adal.config.expireOffsetSeconds = SECONDS_TO_EXPIRE + 100;
        var callback = function () {
        };
        window.renewStates = [];
        adal._user = { profile: { 'upn': 'test@testuser.com' }, userName: 'test@domain.com' };
        spyOn(adal, '_loadFrameTimeout');
        adal.acquireToken(RESOURCE1, callback);
        expect(adal._loadFrameTimeout).toHaveBeenCalledWith(DEFAULT_INSTANCE + conf.tenant + '/oauth2/authorize?response_type=token&client_id=client&resource=' + RESOURCE1 + '&redirect_uri=contoso_site&state=33333333-3333-4333-b333-333333333333%7Ctoken.resource1'
            + '&client-request-id=33333333-3333-4333-b333-333333333333' + adal._addLibMetadata() + '&prompt=none&login_hint=test%40testuser.com&domain_hint=testuser.com', 'adalRenewFrametoken.resource1', 'token.resource1');

        adal._activeRenewals = {};
        adal._user = { profile: { 'sub': 'test@testuser.com' }, userName: 'test@domain.com' };
        adal.acquireToken(RESOURCE1, callback);
        expect(adal._loadFrameTimeout).toHaveBeenCalledWith(DEFAULT_INSTANCE + conf.tenant + '/oauth2/authorize?response_type=token&client_id=client&resource=' + RESOURCE1 + '&redirect_uri=contoso_site&state=33333333-3333-4333-b333-333333333333%7Ctoken.resource1'
            + '&client-request-id=33333333-3333-4333-b333-333333333333' + adal._addLibMetadata() + '&prompt=none', 'adalRenewFrametoken.resource1', 'token.resource1');
    });

    it('generates new correlationId for each request sent to AAD if not set by user', function () {
        adal.config.correlationId = null;
        adal.config.redirectUri = 'contoso_site';
        adal.config.clientId = 'client';
        adal.config.expireOffsetSeconds = SECONDS_TO_EXPIRE + 100;
        var callback = function () {
        };
        window.renewStates = [];
        adal._user = { profile: { 'upn': 'test@testuser.com' }, userName: 'test@domain.com' };
        mathMock.random = function () {
            return 0.1;
        };
        spyOn(adal, '_loadFrameTimeout');
        adal.acquireToken(RESOURCE1, callback);
        expect(adal._loadFrameTimeout).toHaveBeenCalledWith(DEFAULT_INSTANCE + conf.tenant + '/oauth2/authorize?response_type=token&client_id=client&resource=' + RESOURCE1 + '&redirect_uri=contoso_site&state=11111111-1111-4111-9111-111111111111%7Ctoken.resource1'
            + '&client-request-id=11111111-1111-4111-9111-111111111111' + adal._addLibMetadata() + '&prompt=none&login_hint=test%40testuser.com&domain_hint=testuser.com', 'adalRenewFrametoken.resource1', 'token.resource1');

        mathMock.random = function () {
            return 0.3;
        };
        adal._activeRenewals = {};
        adal._user = { profile: { 'sub': 'test@testuser.com' }, userName: 'test@domain.com' };
        adal.acquireToken(RESOURCE1, callback);
        expect(adal._loadFrameTimeout).toHaveBeenCalledWith(DEFAULT_INSTANCE + conf.tenant + '/oauth2/authorize?response_type=token&client_id=client&resource=' + RESOURCE1 + '&redirect_uri=contoso_site&state=44444444-4444-4444-8444-444444444444%7Ctoken.resource1'
            + '&client-request-id=44444444-4444-4444-8444-444444444444' + adal._addLibMetadata() + '&prompt=none', 'adalRenewFrametoken.resource1', 'token.resource1');

    });

    it('checks the deserialize method for extracting idToken', function () {
        var obj = adal._deserialize(VALID_URLFRAGMENT);
        expect(obj.id_token).toBe(IDTOKEN_MOCK);
        expect(obj.state).toBe(STATE);
        expect(obj.session_state).toBe(SESSION_STATE);

        obj = adal._deserialize(INVALID_URLFRAGMENT);
        expect(obj.id_token).toBeUndefined;
        expect(obj.state).toBe(STATE);
        expect(obj.session_state).toBe(SESSION_STATE);
        expect(obj['id_token' + IDTOKEN_MOCK]).toBeUndefined;
        var deserialize = adal._deserialize;//save initial state of function

        adal._deserialize = function (query) {
            var match,
                pl = /\+/g,  // Regex for replacing addition symbol with a space
                search = /([^&=]+)=?([^&]*)/g,
                decode = function (s) {
                    return decodeURIComponent(s.replace(pl, ' '));
                },
                obj = {};
            match = search.exec(query);
            while (match) {
                obj[decode(match[1])] = decode(match[2]);
                match = search.exec(query);
            }

            return obj;
        }
        obj = adal._deserialize(INVALID_URLFRAGMENT);
        expect(obj['id_token' + IDTOKEN_MOCK]).toBe('');//This additional property is parsed because of ? operator in regex
        expect(obj.id_token).toBeUndefined;
        expect(obj.state).toBe(STATE);
        expect(obj.session_state).toBe(SESSION_STATE);
        adal._deserialize = deserialize;//reassign state to original function
    });

    it('tests if callback is called after login, if popup window is null', function () {
        adal.popUp = true;
        adal.config.clientId = 'client';
        adal.config.redirectUri = 'contoso_site';
        var errDesc = '', token = '', err = '';
        var callback = function (valErrDesc, valToken, valErr) {
            errDesc = valErrDesc;
            token = valToken;
            err = valErr;
        };
        window.open = function () {
            return null;
        }
        adal.callback = callback;
        adal.login();
        expect(errDesc).toBe('Popup Window is null. This can happen if you are using IE');
        expect(err).toBe('Error opening popup');
        expect(token).toBe(null);
        expect(adal.loginInProgress()).toBe(false);
        adal.popUp = false;
    });

    it('tests login functionality in case of popup window', function () {
        var timercallback;
        window.clearInterval = function () {
        };
        window.setInterval = function (method, timer) {
            timercallback = method;
        };
        adal.popUp = true;
        adal.config.clientId = 'client';
        adal.config.redirectUri = 'contoso_site';
        var popupWindow;
        window.open = function () {
            popupWindow = {
                location: {
                    hash: VALID_URLFRAGMENT,
                    href: 'hrefcontoso_site'
                },
                closed: false,
                close: function () {
                    this.closed = true;
                }
            };
            return popupWindow;
        };
        var errDesc = '', token = '', err = '';
        var callback = function (valErrDesc, valToken, valErr) {
            errDesc = valErrDesc;
            token = valToken;
            err = valErr;
        };
        adal.callback = callback;
        mathMock.random = function () {
            return 0.2;
        };
        adal.login();
        window.parent = window;
        adal._renewStates = ['33333333-3333-4333-b333-333333333333'];
        waitsFor(function () {
            timercallback();
            storageFake.setItem(adal.CONSTANTS.STORAGE.LOGIN_REQUEST, 'home page');
            window.parent = {};
            window.parent._adalInstance = adal;
            return popupWindow.closed == true;
        }, 'error closing popup window', 2000);

        runs(function () {
            expect(adal.loginInProgress()).toBe(false);
            expect(token).toBe(IDTOKEN_MOCK);
            expect(err).toBe('invalid id_token');
            expect(errDesc).toBe('Invalid id_token. id_token: ' + IDTOKEN_MOCK);
            expect(window.location.href).not.toBe('home page');
        });
        adal.popUp = false;
    });

    it('ensures that adal.callback is not overridden in calls to getUser', function () {
        var _callback = adal.callback;
        adal.callback = null;
        var err = '';
        var user = {};
        var callback = function (valErr, valResult) {
            err = valErr;
            user = valResult;
        };
        adal._user = { profile: { 'upn': 'test@testuser.com' }, userName: 'test@domain.com' };
        adal.getUser(callback);
        expect(user).toBe(adal._user);
        expect(adal.callback).toBe(null);
        adal.callback = _callback;
    });

    it('tests _guid function if window.crypto is defined in the browser', function () {
        var buffer = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        window.msCrypto = null;
        window.crypto = {
            getRandomValues: function (_buffer) {
                for (var i = 0; i < _buffer.length; i++) {
                    _buffer[i] = buffer[i];
                }
            }
        };
        expect(adal._guid()).toBe('00010203-0405-4607-8809-0a0b0c0d0e0f');
        window.crypto = null;
    });

    it('tests if error parameter is passed to acquireToken callback', function () {
        var errorHash = '#error=interaction_required&error_description=some_description&state=someState';
        var errDesc = '', token = '', err = '';
        var callback = function (valErrDesc, valToken, valErr) {
            errDesc = valErrDesc;
            token = valToken;
            err = valErr;
        }
        window.parent = {};
        adal._callBackMappedToRenewStates = {};
        adal._callBackMappedToRenewStates["someState"] = callback;
        adal._renewStates = ['someState'];
        window.parent._adalInstance = adal;
        adal.handleWindowCallback(errorHash);
        expect(err).toBe('interaction_required');
        expect(token).toBe(undefined);
        expect(errDesc).toBe('some_description');
    });

    it('tests if error is logged and code flow is completed when there is a failure in the user defined callback function in case of login', function () {
        window.location = {};
        window.location.href = 'www.test.com' + '#/id_token=' + IDTOKEN_MOCK;
        window.location.hash = '#/id_token=' + IDTOKEN_MOCK;

        var _getRequestInfo = adal.getRequestInfo;
        Logging.level = 0;
        Logging.log = function (message) {
            window.logMessage = message;
        }
        adal.getRequestInfo = function () {
            return {
                valid: true,
                parameters: { 'id_token': IDTOKEN_MOCK, 'session_state': '61ae5247-eaf8-4496-a667-32b0acbad7a0', 'state': '19537a2a-e9e7-489d-ae7d-3eefab9e4137' },
                stateMatch: true,
                stateResponse: '19537a2a-e9e7-489d-ae7d-3eefab9e4137',
                requestType: adal.REQUEST_TYPE.LOGIN,
            };
        };
        var callback = function () {
            throw new Error("Error in callback function");
        }
        adal.callback = callback;
        window.parent = {};
        window.parent._adalInstance = adal;
        window.parent = window;
        storageFake.setItem(adal.CONSTANTS.STORAGE.LOGIN_REQUEST, 'www.test.com');
        var _saveTokenFromHash = adal.saveTokenFromHash;
        adal.saveTokenFromHash = function (requestInfo) {
            return;
        }
        adal.handleWindowCallback();
        expect(window.logMessage).toContain("Error occurred in user defined callback function");
        expect(window.location.href).toBe('www.test.com');
        adal.getRequestInfo = _getRequestInfo;
        Logging.level = 2;
        adal.saveTokenFromHash = _saveTokenFromHash;

    });

    it('tests default value for expires_in', function () {
        var requestInfo = {
            valid: true,
            parameters: { 'access_token': 'token123', 'state': '123' },
            stateMatch: true,
            stateResponse: '123|loginResource1',
            requestType: adal.REQUEST_TYPE.RENEW_TOKEN
        };
        adal.saveTokenFromHash(requestInfo);
        expect(storageFake.getItem(adal.CONSTANTS.STORAGE.EXPIRATION_KEY + 'loginResource1')).toBe(mathMock.round(1) + 3599);
    });

    it('tests default value of redirect uri', function () {
        global.window = {
            location: {
                hash: '#/hash',
                href: 'https://www.testurl.com/#/hash?q1=p1'
            }
        };
        AdalModule.prototype._singletonInstance = null;
        var localConfig = { clientId: 'e9a5a8b6-8af7-4719-9821-0deef255f68e' };
        var localAdal = new AdalModule.inject(localConfig);
        expect(localAdal.config.redirectUri).toBe('https://www.testurl.com/');
    })

    it('tests if LOADFRAME_TIMEOUT is configurable', function () {
        AdalModule.prototype._singletonInstance = null;
        var localConfig = { clientId: 'e9a5a8b6-8af7-4719-9821-0deef255f68e' };
        var localAdal = new AdalModule.inject(localConfig);
        expect(localAdal.CONSTANTS.LOADFRAME_TIMEOUT).toBe(6000);
        localConfig.loadFrameTimeout = 10000;
        AdalModule.prototype._singletonInstance = null;
        var localAdal = new AdalModule.inject(localConfig);
        expect(localAdal.CONSTANTS.LOADFRAME_TIMEOUT).toBe(10000);
    })

    it('removes the prompt query parameter user provided', function() {
        var url = 'https://login.onmicrosoft.com?prompt=none&client_id=12345&response_type=id_token';
        var newUrl = adal._urlRemoveQueryStringParameter(url, 'prompt');
        expect(newUrl).toBe('https://login.onmicrosoft.com?client_id=12345&response_type=id_token');

        url = 'https://login.onmicrosoft.com?client_id=12345&prompt=none&response_type=id_token';
        newUrl = adal._urlRemoveQueryStringParameter(url, 'prompt');
        expect(newUrl).toBe('https://login.onmicrosoft.com?client_id=12345&response_type=id_token');

        url = 'https://login.onmicrosoft.com?client_id=12345&response_type=id_token&prompt=none';
        newUrl = adal._urlRemoveQueryStringParameter(url, 'prompt');
        expect(newUrl).toBe('https://login.onmicrosoft.com?client_id=12345&response_type=id_token');
    })
  
    it('to add sid=<sid value> instead of login_hint=<upn value> if sid is present in the id_token response received from the server ', function () {
        //If you don�t use prompt=none, then if the session does not exist, there will be a failure.
        //If sid is sent alongside domain or login hints, there will be a failure since request is ambiguous.
        //If sid is sent with a prompt value other than none or attempt_none, there will be a failure since the request is ambiguous.
        var url = 'https://login.onmicrosoft.com&prompt=none'; // add sid if prompt=none and user.profile has sid
        adal._user = { 
            profile: {
                sid: '123',
                upn:'123@xxx.onmicrosoft.com'
            }
        }
        var newUrl = adal._addHintParameters(url);
        expect(newUrl).toBe('https://login.onmicrosoft.com&prompt=none' + '&sid=' + encodeURIComponent(adal._user.profile.sid));

        var url = 'https://login.onmicrosoft.com'; //  if prompt!==none, do not add sid
        adal._user.profile = {
                sid: '123',
                upn: '123@xxx.onmicrosoft.com'
        }
        var newUrl = adal._addHintParameters(url);
        expect(newUrl).toBe('https://login.onmicrosoft.com' + '&login_hint=' + encodeURIComponent(adal._user.profile.upn) + '&domain_hint=' + encodeURIComponent(adal._user.profile.upn.split('@')[1]));
        adal._user = null;
    })
  
    it('checks Logger to see if pii messages are logged when piiLogging is disabled by the developer', function () {
        Logging.level = 2;//error, warning, info, verbose
        Logging.log = function (message) {
            window.logMessage = message;
        }
        adal.promptUser("https://login.microsoftonline.com/common/oauth2/v2.0/authorize?response_type=token&state=9ff87e68-76a6-4537-9b2a-9313da6c576b&nonce=d503ae2c-51fc-447b-8b44-a0aed28033b8");

        expect(window.logMessage).toEqual(null);
        expect(Logging.level).toEqual(2);

        Logging.piiLoggingEnabled = true;
        adal.promptUser("https://login.microsoftonline.com/common/oauth2/v2.0/authorize?response_type=token&state=9ff87e68-76a6-4537-9b2a-9313da6c576b&nonce=d503ae2c-51fc-447b-8b44-a0aed28033b8");

        expect(window.logMessage).toContain("https://login.microsoftonline.com/common/oauth2/v2.0/authorize?response_type=token&state=9ff87e68-76a6-4537-9b2a-9313da6c576b&nonce=d503ae2c-51fc-447b-8b44-a0aed28033b8");
        expect(Logging.level).toEqual(2);
        Logging.piiLoggingEnabled = false;
    })

    it("_matchNonce verifies nonce", () => {
        adal._saveItem(adal.CONSTANTS.STORAGE.NONCE_IDTOKEN, "nonce", true);

        const matches = adal._matchNonce({
            profile: {
                nonce: "nonce"
            }
        });

        expect(matches).toBe(true);
    });

    it("_matchNonce reject bad nonce", () => {
        adal._saveItem(adal.CONSTANTS.STORAGE.NONCE_IDTOKEN, "", true);

        const matches = adal._matchNonce({
            profile: {
                nonce: "nonce"
            }
        });

        expect(matches).toBe(false);
    });

    it("_matchNonce reject nonce with delimiter", () => {
        adal._saveItem(adal.CONSTANTS.STORAGE.NONCE_IDTOKEN, "nonce", true);

        const matches = adal._matchNonce({
            profile: {
                nonce: ""
            }
        });

        expect(matches).toBe(false);
    });

    it("_matchState verifies state (login)", () => {
        adal._saveItem(adal.CONSTANTS.STORAGE.STATE_LOGIN, "state", true);

        const matches = adal._matchState({
            stateResponse: "state"
        });

        expect(matches).toBe(true);
    });

    it("_matchState rejects bad state (login)", () => {
        adal._saveItem(adal.CONSTANTS.STORAGE.STATE_LOGIN, "state2", true);

        const matches = adal._matchState({
            stateResponse: "state"
        });

        expect(matches).toBe(false);
    });

    it("_matchState rejects state with delimiter (login)", () => {
        adal.config.cacheLocation = "localStorage";
        adal._saveItem(adal.CONSTANTS.STORAGE.STATE_LOGIN, "state", true);

        const matches = adal._matchState({
            stateResponse: ""
        });

        expect(matches).toBe(false);
        adal.config.cacheLocation = "sessionStorage";
    });

    it("_matchState verifies state (renew)", () => {
        adal._saveItem(adal.CONSTANTS.STORAGE.STATE_RENEW, "state", true);

        const matches = adal._matchState({
            stateResponse: "state"
        });

        expect(matches).toBe(true);
    });

    it("_matchState rejects bad state (renew)", () => {
        adal._saveItem(adal.CONSTANTS.STORAGE.STATE_RENEW, "state2", true);

        const matches = adal._matchState({
            stateResponse: "state"
        });

        expect(matches).toBe(false);
    });

    it("_matchState rejects state with delimiter (renew)", () => {
        adal.config.cacheLocation = "localStorage";
        adal._saveItem(adal.CONSTANTS.STORAGE.STATE_RENEW, "state", true);

        const matches = adal._matchState({
            stateResponse: ""
        });

        expect(matches).toBe(false);
        adal.config.cacheLocation = "sessionStorage";
    });
});
