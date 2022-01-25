"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var TestUtils_1 = require("../../../e2eTestUtils/TestUtils");
var NodeCacheTestUtils_1 = require("../../../e2eTestUtils/NodeCacheTestUtils");
var LabClient_1 = require("../../../e2eTestUtils/LabClient");
var Constants_1 = require("../../../e2eTestUtils/Constants");
var testUtils_1 = require("../../testUtils");
var msal_node_1 = require("../../../../lib/msal-node/");
var TEST_CACHE_LOCATION = "".concat(__dirname, "/data/adfs.cache.json");
var getTokenAuthCode = require("../index");
var cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);
var config = require("../config/ADFS.json");
var username;
var accountPwd;
describe('Auth Code ADFS PPE Tests', function () {
    jest.retryTimes(1);
    jest.setTimeout(45000);
    var browser;
    var context;
    var page;
    var port;
    var homeRoute;
    var screenshotFolder = "".concat(testUtils_1.SCREENSHOT_BASE_FOLDER_NAME, "/auth-code/adfs");
    beforeAll(function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
        var labApiParms, labClient, envResponse;
        var _a;
        return (0, tslib_1.__generator)(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, global.__BROWSER__];
                case 1:
                    // @ts-ignore
                    browser = _b.sent();
                    // @ts-ignore
                    port = 3001;
                    homeRoute = "http://localhost:".concat(port);
                    (0, TestUtils_1.createFolder)(screenshotFolder);
                    labApiParms = {
                        azureEnvironment: Constants_1.AzureEnvironments.CLOUD,
                        appType: Constants_1.AppTypes.CLOUD,
                        federationProvider: Constants_1.FederationProviders.ADFS2019,
                        userType: Constants_1.UserTypes.FEDERATED
                    };
                    labClient = new LabClient_1.LabClient();
                    return [4 /*yield*/, labClient.getVarsByCloudEnvironment(labApiParms)];
                case 2:
                    envResponse = _b.sent();
                    return [4 /*yield*/, (0, TestUtils_1.setupCredentials)(envResponse[0], labClient)];
                case 3:
                    _a = _b.sent(), username = _a[0], accountPwd = _a[1];
                    return [2 /*return*/];
            }
        });
    }); });
    afterAll(function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, browser.close()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    describe("Acquire Token", function () {
        var publicClientApplication;
        var server;
        beforeAll(function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        publicClientApplication = new msal_node_1.PublicClientApplication({ auth: config.authOptions, cache: { cachePlugin: cachePlugin } });
                        server = getTokenAuthCode(config, publicClientApplication, port);
                        return [4 /*yield*/, NodeCacheTestUtils_1.NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        afterAll(function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            return (0, tslib_1.__generator)(this, function (_a) {
                if (server) {
                    server.close();
                }
                return [2 /*return*/];
            });
        }); });
        beforeEach(function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, browser.createIncognitoBrowserContext()];
                    case 1:
                        context = _a.sent();
                        return [4 /*yield*/, context.newPage()];
                    case 2:
                        page = _a.sent();
                        page.setDefaultTimeout(5000);
                        return [2 /*return*/];
                }
            });
        }); });
        afterEach(function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, page.close()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, context.close()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, NodeCacheTestUtils_1.NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("Performs acquire token", function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            var screenshot, cachedTokens;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        screenshot = new TestUtils_1.Screenshot("".concat(screenshotFolder, "/BaseCase"));
                        return [4 /*yield*/, page.goto(homeRoute)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, (0, testUtils_1.enterCredentialsADFS)(page, screenshot, username, accountPwd)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, page.waitForFunction("window.location.href.startsWith(\"".concat(testUtils_1.SAMPLE_HOME_URL, "\")"))];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, NodeCacheTestUtils_1.NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000)];
                    case 4:
                        cachedTokens = _a.sent();
                        expect(cachedTokens.accessTokens.length).toBe(1);
                        expect(cachedTokens.idTokens.length).toBe(1);
                        expect(cachedTokens.refreshTokens.length).toBe(1);
                        return [2 /*return*/];
                }
            });
        }); });
        it("Performs acquire token with prompt = 'login'", function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            var screenshot, cachedTokens;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        screenshot = new TestUtils_1.Screenshot("".concat(screenshotFolder, "/PromptLogin"));
                        return [4 /*yield*/, page.goto("".concat(homeRoute, "/?prompt=login"))];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, (0, testUtils_1.enterCredentialsADFS)(page, screenshot, username, accountPwd)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, page.waitForFunction("window.location.href.startsWith(\"".concat(testUtils_1.SAMPLE_HOME_URL, "\")"))];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, NodeCacheTestUtils_1.NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000)];
                    case 4:
                        cachedTokens = _a.sent();
                        expect(cachedTokens.accessTokens.length).toBe(1);
                        expect(cachedTokens.idTokens.length).toBe(1);
                        expect(cachedTokens.refreshTokens.length).toBe(1);
                        return [2 /*return*/];
                }
            });
        }); });
        it("Performs acquire token with prompt = 'consent'", function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            var screenshot, cachedTokens;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        screenshot = new TestUtils_1.Screenshot("".concat(screenshotFolder, "/PromptConsent"));
                        return [4 /*yield*/, page.goto("".concat(homeRoute, "/?prompt=consent"))];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, (0, testUtils_1.enterCredentialsADFSWithConsent)(page, screenshot, username, accountPwd)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, page.waitForFunction("window.location.href.startsWith(\"".concat(testUtils_1.SAMPLE_HOME_URL, "\")"))];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, NodeCacheTestUtils_1.NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000)];
                    case 4:
                        cachedTokens = _a.sent();
                        expect(cachedTokens.accessTokens.length).toBe(1);
                        expect(cachedTokens.idTokens.length).toBe(1);
                        expect(cachedTokens.refreshTokens.length).toBe(1);
                        return [2 /*return*/];
                }
            });
        }); });
        it("Performs acquire token with prompt = 'none'", function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            var screenshot, cachedTokens;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        screenshot = new TestUtils_1.Screenshot("".concat(screenshotFolder, "/PromptNone"));
                        // First login
                        return [4 /*yield*/, page.goto("".concat(homeRoute, "/?prompt=login"))];
                    case 1:
                        // First login
                        _a.sent();
                        return [4 /*yield*/, (0, testUtils_1.enterCredentialsADFS)(page, screenshot, username, accountPwd)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, page.waitForFunction("window.location.href.startsWith(\"".concat(testUtils_1.SAMPLE_HOME_URL, "\")"))];
                    case 3:
                        _a.sent();
                        // Reset the cache
                        return [4 /*yield*/, NodeCacheTestUtils_1.NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION)];
                    case 4:
                        // Reset the cache
                        _a.sent();
                        return [4 /*yield*/, page.goto("".concat(homeRoute, "/?prompt=none"), { waitUntil: "networkidle0" })];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, NodeCacheTestUtils_1.NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000)];
                    case 6:
                        cachedTokens = _a.sent();
                        expect(cachedTokens.accessTokens.length).toBe(1);
                        expect(cachedTokens.idTokens.length).toBe(1);
                        expect(cachedTokens.refreshTokens.length).toBe(1);
                        return [2 /*return*/];
                }
            });
        }); });
        it("Performs acquire token with state", function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            var screenshot, STATE_VALUE, url, cachedTokens;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        screenshot = new TestUtils_1.Screenshot("".concat(screenshotFolder, "/WithState"));
                        STATE_VALUE = "value_on_state";
                        return [4 /*yield*/, page.goto("".concat(homeRoute, "/?prompt=login&state=").concat(STATE_VALUE))];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, (0, testUtils_1.enterCredentialsADFS)(page, screenshot, username, accountPwd)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, page.waitForFunction("window.location.href.startsWith(\"".concat(testUtils_1.SAMPLE_HOME_URL, "\")"))];
                    case 3:
                        _a.sent();
                        url = page.url();
                        expect(url.includes("state=".concat(STATE_VALUE))).toBe(true);
                        return [4 /*yield*/, NodeCacheTestUtils_1.NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000)];
                    case 4:
                        cachedTokens = _a.sent();
                        expect(cachedTokens.accessTokens.length).toBe(1);
                        expect(cachedTokens.idTokens.length).toBe(1);
                        expect(cachedTokens.refreshTokens.length).toBe(1);
                        return [2 /*return*/];
                }
            });
        }); });
        it("Performs acquire token with login hint", function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            var USERNAME, emailInput, email;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        USERNAME = "test@domain.abc";
                        return [4 /*yield*/, page.goto("".concat(homeRoute, "/?prompt=login&loginHint=").concat(USERNAME), { waitUntil: "networkidle0" })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, page.waitForSelector("#i0116")];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, page.$("#i0116")];
                    case 3:
                        emailInput = _a.sent();
                        return [4 /*yield*/, page.evaluate(function (element) { return element.value; }, emailInput)];
                    case 4:
                        email = _a.sent();
                        expect(email).toBe(USERNAME);
                        return [2 /*return*/];
                }
            });
        }); });
        // NOTE: This test runs successfully only when we are running in headless mode
        it.skip("Performs acquire token with domain hint", function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            var DOMAIN, MS_LOGIN_URL, url;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        DOMAIN = "microsoft.com";
                        MS_LOGIN_URL = "msft.sts.microsoft.com";
                        return [4 /*yield*/, page.goto("".concat(homeRoute, "/?domainHint=").concat(DOMAIN))];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, page.waitForNavigation({ waitUntil: 'networkidle2' })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, page.url()];
                    case 3:
                        url = _a.sent();
                        console.log(url);
                        expect(url.includes(MS_LOGIN_URL)).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=auth-code-adfs.spec.js.map