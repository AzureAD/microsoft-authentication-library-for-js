"use strict";
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var TestUtils_1 = require("../../../e2eTestUtils/TestUtils");
var NodeCacheTestUtils_1 = require("../../../e2eTestUtils/NodeCacheTestUtils");
var LabClient_1 = require("../../../e2eTestUtils/LabClient");
var Constants_1 = require("../../../e2eTestUtils/Constants");
var testUtils_1 = require("../../testUtils");
var dist_1 = require("../../../../lib/msal-node/dist");
// Set test cache name/location
var TEST_CACHE_LOCATION = "".concat(__dirname, "/data/adfs.cache.json");
// Get flow-specific routes from sample application
var getTokenSilent = require("../index");
// Build cachePlugin
var cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);
// Load scenario configuration
var config = require("../config/ADFS.json");
describe("Silent Flow ADFS 2019 Tests", function () {
    jest.retryTimes(1);
    jest.setTimeout(45000);
    var browser;
    var context;
    var page;
    var port;
    var homeRoute;
    var publicClientApplication;
    var msalTokenCache;
    var server;
    var username;
    var accountPwd;
    var screenshotFolder = "".concat(testUtils_1.SCREENSHOT_BASE_FOLDER_NAME, "/silent-flow/adfs");
    beforeAll(function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
        var labApiParms, labClient, envResponse;
        var _a;
        return (0, tslib_1.__generator)(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, testUtils_1.validateCacheLocation)(TEST_CACHE_LOCATION)];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, global.__BROWSER__];
                case 2:
                    // @ts-ignore
                    browser = _b.sent();
                    port = 3003;
                    homeRoute = "".concat(testUtils_1.SAMPLE_HOME_URL, ":").concat(port);
                    (0, TestUtils_1.createFolder)(testUtils_1.SCREENSHOT_BASE_FOLDER_NAME);
                    labApiParms = {
                        azureEnvironment: Constants_1.AzureEnvironments.CLOUD,
                        appType: Constants_1.AppTypes.CLOUD,
                        federationProvider: Constants_1.FederationProviders.ADFS2019,
                        userType: Constants_1.UserTypes.FEDERATED
                    };
                    labClient = new LabClient_1.LabClient();
                    return [4 /*yield*/, labClient.getVarsByCloudEnvironment(labApiParms)];
                case 3:
                    envResponse = _b.sent();
                    return [4 /*yield*/, (0, TestUtils_1.setupCredentials)(envResponse[0], labClient)];
                case 4:
                    _a = _b.sent(), username = _a[0], accountPwd = _a[1];
                    publicClientApplication = new dist_1.PublicClientApplication({ auth: config.authOptions, cache: { cachePlugin: cachePlugin } });
                    msalTokenCache = publicClientApplication.getTokenCache();
                    server = getTokenSilent(config, publicClientApplication, port, msalTokenCache);
                    return [4 /*yield*/, NodeCacheTestUtils_1.NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION)];
                case 5:
                    _b.sent();
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
                    if (server) {
                        server.close();
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    describe("Acquire Token", function () {
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
                        return [4 /*yield*/, page.goto(homeRoute)];
                    case 3:
                        _a.sent();
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
        it("Performs acquire token with Auth Code flow", function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            var screenshot, cachedTokens;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        screenshot = new TestUtils_1.Screenshot("".concat(screenshotFolder, "/AcquireTokenAuthCode"));
                        return [4 /*yield*/, (0, testUtils_1.clickSignIn)(page, screenshot)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, (0, testUtils_1.enterCredentialsADFS)(page, screenshot, username, accountPwd)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, page.waitForSelector("#acquireTokenSilent")];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, page.click("#acquireTokenSilent")];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, NodeCacheTestUtils_1.NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000)];
                    case 5:
                        cachedTokens = _a.sent();
                        expect(cachedTokens.accessTokens.length).toBe(1);
                        expect(cachedTokens.idTokens.length).toBe(1);
                        expect(cachedTokens.refreshTokens.length).toBe(1);
                        return [2 /*return*/];
                }
            });
        }); });
        it("Performs acquire token silent", function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            var screenshot;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        screenshot = new TestUtils_1.Screenshot("".concat(screenshotFolder, "/AcquireTokenSilent"));
                        return [4 /*yield*/, (0, testUtils_1.clickSignIn)(page, screenshot)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, (0, testUtils_1.enterCredentialsADFS)(page, screenshot, username, accountPwd)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, page.waitForSelector("#acquireTokenSilent")];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, page.click("#acquireTokenSilent")];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, page.waitForSelector("#graph-called-successfully")];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, screenshot.takeScreenshot(page, "acquireTokenSilentGotTokens")];
                    case 6:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("Refreshes an expired access token", function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            var screenshot, tokens, originalAccessToken, expiredAccessToken, refreshedAccessToken, htmlBody;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        screenshot = new TestUtils_1.Screenshot("".concat(screenshotFolder, "/RefreshExpiredToken"));
                        return [4 /*yield*/, (0, testUtils_1.clickSignIn)(page, screenshot)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, (0, testUtils_1.enterCredentialsADFS)(page, screenshot, username, accountPwd)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, page.waitForSelector("#acquireTokenSilent")];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, NodeCacheTestUtils_1.NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000)];
                    case 4:
                        tokens = _a.sent();
                        originalAccessToken = tokens.accessTokens[0];
                        return [4 /*yield*/, NodeCacheTestUtils_1.NodeCacheTestUtils.expireAccessTokens(TEST_CACHE_LOCATION)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, NodeCacheTestUtils_1.NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000)];
                    case 6:
                        tokens = _a.sent();
                        expiredAccessToken = tokens.accessTokens[0];
                        return [4 /*yield*/, page.click("#acquireTokenSilent")];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, page.waitForSelector("#".concat(testUtils_1.SUCCESSFUL_GRAPH_CALL_ID))];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, NodeCacheTestUtils_1.NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000)];
                    case 9:
                        tokens = _a.sent();
                        refreshedAccessToken = tokens.accessTokens[0];
                        return [4 /*yield*/, screenshot.takeScreenshot(page, "acquireTokenSilentGotTokens")];
                    case 10:
                        _a.sent();
                        return [4 /*yield*/, page.evaluate(function () { return document.body.innerHTML; })];
                    case 11:
                        htmlBody = _a.sent();
                        expect(htmlBody).toContain(testUtils_1.SUCCESSFUL_GRAPH_CALL_ID);
                        expect(Number(originalAccessToken.expiresOn)).toBeGreaterThan(0);
                        expect(Number(expiredAccessToken.expiresOn)).toBe(0);
                        expect(Number(refreshedAccessToken.expiresOn)).toBeGreaterThan(0);
                        expect(refreshedAccessToken.secret).not.toEqual(originalAccessToken.secret);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe("Get All Accounts", function () {
        describe("Authenticated", function () {
            beforeEach(function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
                return (0, tslib_1.__generator)(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, browser.createIncognitoBrowserContext()];
                        case 1:
                            context = _a.sent();
                            return [4 /*yield*/, context.newPage()];
                        case 2:
                            page = _a.sent();
                            return [4 /*yield*/, page.goto(homeRoute)];
                        case 3:
                            _a.sent();
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
            it("Gets all accounts", function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
                var screenshot, accounts, htmlBody;
                return (0, tslib_1.__generator)(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            screenshot = new TestUtils_1.Screenshot("".concat(screenshotFolder, "/GetAllAccounts"));
                            return [4 /*yield*/, (0, testUtils_1.clickSignIn)(page, screenshot)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, (0, testUtils_1.enterCredentialsADFS)(page, screenshot, username, accountPwd)];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, page.waitForSelector("#getAllAccounts")];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, page.click("#getAllAccounts")];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, page.waitForSelector("#".concat(testUtils_1.SUCCESSFUL_GET_ALL_ACCOUNTS_ID))];
                        case 5:
                            _a.sent();
                            return [4 /*yield*/, screenshot.takeScreenshot(page, "gotAllAccounts")];
                        case 6:
                            _a.sent();
                            return [4 /*yield*/, page.evaluate(function () { return JSON.parse(document.getElementById("nav-tabContent").children[0].innerHTML); })];
                        case 7:
                            accounts = _a.sent();
                            return [4 /*yield*/, page.evaluate(function () { return document.body.innerHTML; })];
                        case 8:
                            htmlBody = _a.sent();
                            expect(htmlBody).toContain(testUtils_1.SUCCESSFUL_GET_ALL_ACCOUNTS_ID);
                            expect(htmlBody).not.toContain("No accounts found in the cache.");
                            expect(htmlBody).not.toContain("Failed to get accounts from cache.");
                            expect(accounts.length).toBe(1);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe("Unauthenticated", function () {
            beforeEach(function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
                return (0, tslib_1.__generator)(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, browser.createIncognitoBrowserContext()];
                        case 1:
                            context = _a.sent();
                            return [4 /*yield*/, context.newPage()];
                        case 2:
                            page = _a.sent();
                            return [4 /*yield*/, page.goto(homeRoute)];
                        case 3:
                            _a.sent();
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
            it("Returns empty account array", function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
                var screenshot, accounts, htmlBody;
                return (0, tslib_1.__generator)(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            screenshot = new TestUtils_1.Screenshot("".concat(screenshotFolder, "/NoCachedAccounts"));
                            return [4 /*yield*/, page.goto("".concat(homeRoute, "/allAccounts"))];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, page.waitForSelector("#getAllAccounts")];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, page.click("#getAllAccounts")];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, screenshot.takeScreenshot(page, "gotAllAccounts")];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, page.evaluate(function () { return JSON.parse(document.getElementById("nav-tabContent").children[0].innerHTML); })];
                        case 5:
                            accounts = _a.sent();
                            return [4 /*yield*/, page.evaluate(function () { return document.body.innerHTML; })];
                        case 6:
                            htmlBody = _a.sent();
                            expect(htmlBody).toContain("No accounts found in the cache.");
                            expect(htmlBody).not.toContain("Failed to get accounts from cache.");
                            expect(accounts.length).toBe(0);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
});
//# sourceMappingURL=silent-flow-adfs.spec.js.map