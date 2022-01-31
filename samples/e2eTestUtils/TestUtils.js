"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enterCredentials = exports.setupCredentials = exports.retrieveAppConfiguration = exports.createFolder = exports.Screenshot = void 0;
var tslib_1 = require("tslib");
var fs = (0, tslib_1.__importStar)(require("fs"));
var Screenshot = /** @class */ (function () {
    function Screenshot(foldername) {
        this.folderName = foldername;
        this.screenshotNum = 0;
        createFolder(this.folderName);
    }
    Screenshot.prototype.takeScreenshot = function (page, screenshotName) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, page.screenshot({ path: "".concat(this.folderName, "/").concat(++this.screenshotNum, "_").concat(screenshotName, ".png") })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return Screenshot;
}());
exports.Screenshot = Screenshot;
function createFolder(foldername) {
    if (!fs.existsSync(foldername)) {
        fs.mkdirSync(foldername, { recursive: true });
    }
}
exports.createFolder = createFolder;
function retrieveAppConfiguration(labConfig, labClient, isConfidentialClient) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        var clientID, clientSecret, authority, secretAppName, appClientSecret;
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clientID = "";
                    clientSecret = "";
                    authority = "";
                    if (labConfig.app.appId) {
                        clientID = labConfig.app.appId;
                    }
                    if (labConfig.lab.authority && labConfig.lab.tenantId) {
                        authority = "".concat(labConfig.lab.authority).concat(labConfig.lab.tenantId);
                    }
                    if (!isConfidentialClient) return [3 /*break*/, 2];
                    if (!(labConfig.lab.labName && labConfig.app.appName)) {
                        throw Error("No Labname and/or Appname provided!");
                    }
                    secretAppName = "".concat(labConfig.lab.labName, "-").concat(labConfig.app.appName);
                    // Reformat the secret app name to kebab case from snake case
                    while (secretAppName.includes("_"))
                        secretAppName = secretAppName.replace("_", "-");
                    return [4 /*yield*/, labClient.getSecret(secretAppName)];
                case 1:
                    appClientSecret = _a.sent();
                    clientSecret = appClientSecret.value;
                    if (!clientSecret) {
                        throw Error("Unable to get the client secret");
                    }
                    _a.label = 2;
                case 2: return [2 /*return*/, [clientID, clientSecret, authority]];
            }
        });
    });
}
exports.retrieveAppConfiguration = retrieveAppConfiguration;
function setupCredentials(labConfig, labClient) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        var username, accountPwd, testPwdSecret;
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0:
                    username = "";
                    accountPwd = "";
                    if (labConfig.user.upn) {
                        username = labConfig.user.upn;
                    }
                    if (!labConfig.lab.labName) {
                        throw Error("No Labname provided!");
                    }
                    return [4 /*yield*/, labClient.getSecret(labConfig.lab.labName)];
                case 1:
                    testPwdSecret = _a.sent();
                    accountPwd = testPwdSecret.value;
                    if (!accountPwd) {
                        throw "Unable to get account password!";
                    }
                    return [2 /*return*/, [username, accountPwd]];
            }
        });
    });
}
exports.setupCredentials = setupCredentials;
function enterCredentials(page, screenshot, username, accountPwd) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        var e_1;
        var _this = this;
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 5]);
                    return [4 /*yield*/, page.waitForNavigation({ waitUntil: "networkidle0", timeout: 10000 })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, page.waitForSelector("input#i0116.input.text-box")];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _a.sent();
                    return [4 /*yield*/, screenshot.takeScreenshot(page, "errorPage").catch(function () { })];
                case 4:
                    _a.sent();
                    throw e_1;
                case 5:
                    ;
                    return [4 /*yield*/, page.type("input#i0116.input.text-box", username)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, page.waitForSelector("input#idSIButton9")];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, screenshot.takeScreenshot(page, "loginPage")];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, Promise.all([
                            page.waitForNavigation({ waitUntil: "networkidle0" }),
                            page.click("input#idSIButton9")
                        ]).catch(function (e) { return (0, tslib_1.__awaiter)(_this, void 0, void 0, function () {
                            return (0, tslib_1.__generator)(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, screenshot.takeScreenshot(page, "errorPage").catch(function () { })];
                                    case 1:
                                        _a.sent();
                                        throw e;
                                }
                            });
                        }); })];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, page.waitForSelector("#idA_PWD_ForgotPassword")];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, page.waitForSelector("input#i0118.input.text-box")];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, page.waitForSelector("input#idSIButton9")];
                case 12:
                    _a.sent();
                    return [4 /*yield*/, screenshot.takeScreenshot(page, "pwdInputPage")];
                case 13:
                    _a.sent();
                    return [4 /*yield*/, page.type("input#i0118.input.text-box", accountPwd)];
                case 14:
                    _a.sent();
                    return [4 /*yield*/, Promise.all([
                            page.click("input#idSIButton9"),
                            // Wait either for another navigation to Keep me signed in page or back to redirectUri
                            Promise.race([
                                page.waitForNavigation({ waitUntil: "networkidle0" }),
                                page.waitForResponse(function (response) { return response.url().startsWith("http://localhost"); }, { timeout: 0 })
                            ])
                        ]).catch(function (e) { return (0, tslib_1.__awaiter)(_this, void 0, void 0, function () {
                            return (0, tslib_1.__generator)(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, screenshot.takeScreenshot(page, "errorPage").catch(function () { })];
                                    case 1:
                                        _a.sent();
                                        throw e;
                                }
                            });
                        }); })];
                case 15:
                    _a.sent();
                    if (page.url().startsWith("http://localhost")) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, page.waitForSelector('input#KmsiCheckboxField', { timeout: 1000 })];
                case 16:
                    _a.sent();
                    return [4 /*yield*/, page.waitForSelector("input#idSIButton9")];
                case 17:
                    _a.sent();
                    return [4 /*yield*/, screenshot.takeScreenshot(page, "kmsiPage")];
                case 18:
                    _a.sent();
                    return [4 /*yield*/, Promise.all([
                            page.waitForResponse(function (response) { return response.url().startsWith("http://localhost"); }),
                            page.click('input#idSIButton9')
                        ]).catch(function (e) { return (0, tslib_1.__awaiter)(_this, void 0, void 0, function () {
                            return (0, tslib_1.__generator)(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, screenshot.takeScreenshot(page, "errorPage").catch(function () { })];
                                    case 1:
                                        _a.sent();
                                        throw e;
                                }
                            });
                        }); })];
                case 19:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.enterCredentials = enterCredentials;
//# sourceMappingURL=TestUtils.js.map