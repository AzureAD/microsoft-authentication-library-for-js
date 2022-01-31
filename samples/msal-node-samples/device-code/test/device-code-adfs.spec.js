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
var msal_node_1 = require("../../../../lib/msal-node");
// Set test cache name/location
var TEST_CACHE_LOCATION = "".concat(__dirname, "/data/adfs.cache.json");
// Get flow-specific routes from sample application
var getTokenDeviceCode = require("../index");
// Build cachePlugin
var cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);
// Load scenario configuration
var config = require("../config/ADFS.json");
describe('Device Code ADFS PPE Tests', function () {
    jest.setTimeout(45000);
    jest.retryTimes(1);
    var browser;
    var context;
    var page;
    var publicClientApplication;
    var clientConfig;
    var username;
    var accountPwd;
    var screenshotFolder = "".concat(testUtils_1.SCREENSHOT_BASE_FOLDER_NAME, "/device-code/adfs");
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
        beforeAll(function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            return (0, tslib_1.__generator)(this, function (_a) {
                clientConfig = { auth: config.authOptions, cache: { cachePlugin: cachePlugin } };
                publicClientApplication = new msal_node_1.PublicClientApplication(clientConfig);
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
        it("Performs acquire token with Device Code flow", function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            var screenshot, deviceCodeCallback, cachedTokens;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        screenshot = new TestUtils_1.Screenshot("".concat(screenshotFolder, "/BaseCase"));
                        deviceCodeCallback = function (deviceCodeResponse) { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
                            var userCode, verificationUri;
                            return (0, tslib_1.__generator)(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        userCode = deviceCodeResponse.userCode, verificationUri = deviceCodeResponse.verificationUri;
                                        return [4 /*yield*/, (0, testUtils_1.enterDeviceCode)(page, screenshot, userCode, verificationUri)];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, (0, testUtils_1.enterCredentialsADFSWithConsent)(page, screenshot, username, accountPwd)];
                                    case 2:
                                        _a.sent();
                                        return [4 /*yield*/, page.waitForSelector("#message")];
                                    case 3:
                                        _a.sent();
                                        return [4 /*yield*/, screenshot.takeScreenshot(page, "SuccessfulDeviceCodeMessage")];
                                    case 4:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); };
                        return [4 /*yield*/, getTokenDeviceCode(config, publicClientApplication, { deviceCodeCallback: deviceCodeCallback })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, NodeCacheTestUtils_1.NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000)];
                    case 2:
                        cachedTokens = _a.sent();
                        expect(cachedTokens.accessTokens.length).toBe(1);
                        expect(cachedTokens.idTokens.length).toBe(1);
                        expect(cachedTokens.refreshTokens.length).toBe(1);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=device-code-adfs.spec.js.map