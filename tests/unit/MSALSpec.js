'use strict'

/* Directive tells jshint that it, describe are globals defined by jasmine */
/* global it */
/* global describe */

var atobHelper = require('atob');
var confighash = { hash: '#' };
global.window = {};
var MsalModule = require('../../lib/msaljs.js');
var setModule = require('../../lib/set.js');

describe('MSAL', function () {
    var msal;
    global.Logging = global.window.Logging;
    var window = {
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
    var clientId = 'e9a5a8b6-8af7-4719-9821-0deef255f68e';
    var testPage = 'this is a song';
    var STORAGE_PREFIX = 'msal';
    var STORAGE_ACCESS_TOKEN_KEY = STORAGE_PREFIX + '.access.token.key';
    var STORAGE_EXPIRATION_KEY = STORAGE_PREFIX + '.expiration.key';
    var STORAGE_TOKEN_KEYS = STORAGE_PREFIX + '.token.keys';
    var RESOURCE1 = 'token.resource1';
    var SECONDS_TO_EXPIRE = 3600;
    var DEFAULT_INSTANCE = "https://login.microsoftonline.com/";
    var STATE = '33333333-3333-4333-b333-333333333333';
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

        window.localStorage = storageFake;
        window.sessionStorage = storageFake;
        // Init msal 

        global.window = window;
        global.localStorage = storageFake;
        global.sessionStorage = storageFake;
        global.document = documentMock;
        global.Math = mathMock;
        global.angular = angularMock;

        console.log(MsalModule);
        console.log(setModule);

        console.log(MsalModule.ClientApplication);
        msal = new MsalModule.ClientApplication(clientId);
        msal._renewStates = [];
        msal._activeRenewals = {};
        msal.CONSTANTS.LOADFRAME_TIMEOUT = 800;
    });

    it('tests the constructor for ClientApplication class', function () {
    });
});
