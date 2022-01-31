"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var NodeCacheTestUtils_1 = require("../../../e2eTestUtils/NodeCacheTestUtils");
var TestUtils_1 = require("../../../e2eTestUtils/TestUtils");
var LabClient_1 = require("../../../e2eTestUtils/LabClient");
var testUtils_1 = require("../../testUtils");
var msal_node_1 = require("../../../../lib/msal-node/");
var AAD_json_1 = (0, tslib_1.__importDefault)(require("../config/AAD.json"));
var TEST_CACHE_LOCATION = "".concat(__dirname, "/data/aad.cache.json");
var getClientCredentialsToken = require("../index");
var cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);
var clientID;
var clientSecret;
var authority;
describe('Client Credentials AAD PPE Tests', function () {
    jest.retryTimes(1);
    jest.setTimeout(90000);
    beforeAll(function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
        var labApiParms, labClient, envResponse;
        var _a;
        return (0, tslib_1.__generator)(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, testUtils_1.validateCacheLocation)(TEST_CACHE_LOCATION)];
                case 1:
                    _b.sent();
                    labApiParms = {
                        appType: "cloud",
                        publicClient: "no",
                        signInAudience: "azureadmyorg"
                    };
                    labClient = new LabClient_1.LabClient();
                    return [4 /*yield*/, labClient.getVarsByCloudEnvironment(labApiParms)];
                case 2:
                    envResponse = _b.sent();
                    return [4 /*yield*/, (0, TestUtils_1.retrieveAppConfiguration)(envResponse[0], labClient, true)];
                case 3:
                    _a = _b.sent(), clientID = _a[0], clientSecret = _a[1], authority = _a[2];
                    // Update the complete config
                    AAD_json_1.default.authOptions.clientId = clientID;
                    AAD_json_1.default.authOptions.clientSecret = clientSecret;
                    AAD_json_1.default.authOptions.authority = authority;
                    return [2 /*return*/];
            }
        });
    }); });
    describe("Acquire Token", function () {
        var confidentialClientApplication;
        var server;
        beforeAll(function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, NodeCacheTestUtils_1.NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        afterEach(function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, NodeCacheTestUtils_1.NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        afterAll(function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!server) return [3 /*break*/, 2];
                        return [4 /*yield*/, server.close()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        }); });
        it("Performs acquire token", function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            var cachedTokens;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        confidentialClientApplication = new msal_node_1.ConfidentialClientApplication({ auth: AAD_json_1.default.authOptions, cache: { cachePlugin: cachePlugin } });
                        return [4 /*yield*/, getClientCredentialsToken(confidentialClientApplication)];
                    case 1:
                        server = _a.sent();
                        return [4 /*yield*/, NodeCacheTestUtils_1.NodeCacheTestUtils.getTokens(TEST_CACHE_LOCATION)];
                    case 2:
                        cachedTokens = _a.sent();
                        expect(cachedTokens.accessTokens.length).toBe(1);
                        return [2 /*return*/];
                }
            });
        }); });
        it("Performs acquire token through regional authorities", function () { return (0, tslib_1.__awaiter)(void 0, void 0, void 0, function () {
            var cachedTokens;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        confidentialClientApplication = new msal_node_1.ConfidentialClientApplication({ auth: AAD_json_1.default.authOptions, cache: { cachePlugin: cachePlugin } });
                        return [4 /*yield*/, getClientCredentialsToken(confidentialClientApplication, { region: "westus2" })];
                    case 1:
                        server = _a.sent();
                        return [4 /*yield*/, NodeCacheTestUtils_1.NodeCacheTestUtils.getTokens(TEST_CACHE_LOCATION)];
                    case 2:
                        cachedTokens = _a.sent();
                        expect(cachedTokens.accessTokens.length).toBe(1);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=client-credentials-aad.spec.js.map