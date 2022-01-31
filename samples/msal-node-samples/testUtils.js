"use strict";
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTimeoutError = exports.validateCacheLocation = exports.enterDeviceCode = exports.enterCredentialsADFS = exports.clickSignIn = exports.approveConsent = exports.enterCredentialsADFSWithConsent = exports.approveRemoteConnect = exports.enterCredentials = exports.SUCCESSFUL_GET_ALL_ACCOUNTS_ID = exports.SUCCESSFUL_GRAPH_CALL_ID = exports.SAMPLE_HOME_URL = exports.SCREENSHOT_BASE_FOLDER_NAME = void 0;
var tslib_1 = require("tslib");
var fs_1 = (0, tslib_1.__importDefault)(require("fs"));
// Constants
exports.SCREENSHOT_BASE_FOLDER_NAME = "".concat(__dirname, "/screenshots");
exports.SAMPLE_HOME_URL = "http://localhost";
exports.SUCCESSFUL_GRAPH_CALL_ID = "graph-called-successfully";
exports.SUCCESSFUL_GET_ALL_ACCOUNTS_ID = "accounts-retrieved-successfully";
function enterCredentials(page, screenshot, username, accountPwd) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        var e_1;
        var _this = this;
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        page.waitForNavigation({ waitUntil: ["load", "domcontentloaded", "networkidle0"] }).catch(function () { }),
                        page.waitForSelector("#i0116"),
                        page.waitForSelector("#idSIButton9")
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
                case 1:
                    _a.sent();
                    return [4 /*yield*/, screenshot.takeScreenshot(page, "loginPage")];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, page.type("#i0116", username)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, screenshot.takeScreenshot(page, "loginPageUsernameFilled")];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, Promise.all([
                            page.waitForNavigation({ waitUntil: ["load", "domcontentloaded", "networkidle0"] }),
                            page.click("#idSIButton9")
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
                case 5:
                    _a.sent();
                    return [4 /*yield*/, page.waitForSelector("#idA_PWD_ForgotPassword")];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, page.waitForSelector("#i0118")];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, page.waitForSelector("#idSIButton9")];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, screenshot.takeScreenshot(page, "pwdInputPage")];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, page.type("#i0118", accountPwd)];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, screenshot.takeScreenshot(page, "loginPagePasswordFilled")];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, Promise.all([
                            page.click("#idSIButton9"),
                            // Wait either for another navigation to Keep me signed in page or back to redirectUri
                            Promise.race([
                                page.waitForNavigation({ waitUntil: ["load", "domcontentloaded", "networkidle0"] }),
                                page.waitForResponse(function (response) { return response.url().startsWith(exports.SAMPLE_HOME_URL); }, { timeout: 0 })
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
                case 12:
                    _a.sent();
                    if (page.url().startsWith(exports.SAMPLE_HOME_URL)) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, screenshot.takeScreenshot(page, "passwordSubmitted")];
                case 13:
                    _a.sent();
                    _a.label = 14;
                case 14:
                    _a.trys.push([14, 18, , 19]);
                    return [4 /*yield*/, page.waitForSelector('#idSIButton9', { timeout: 1000 })];
                case 15:
                    _a.sent();
                    return [4 /*yield*/, screenshot.takeScreenshot(page, "kmsiPage")];
                case 16:
                    _a.sent();
                    return [4 /*yield*/, Promise.all([
                            page.waitForNavigation({ waitUntil: ["load", "domcontentloaded", "networkidle0"] }),
                            page.click("#idSIButton9")
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
                case 17:
                    _a.sent();
                    return [3 /*break*/, 19];
                case 18:
                    e_1 = _a.sent();
                    return [2 /*return*/];
                case 19: return [2 /*return*/];
            }
        });
    });
}
exports.enterCredentials = enterCredentials;
function approveRemoteConnect(page, screenshot) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        var e_2;
        var _this = this;
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, page.waitForSelector("#remoteConnectDescription")];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, page.waitForSelector("#remoteConnectSubmit")];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, screenshot.takeScreenshot(page, "remoteConnectPage")];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, Promise.all([
                            page.waitForNavigation({ waitUntil: ["load", "domcontentloaded", "networkidle0"] }),
                            page.click("#remoteConnectSubmit")
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
                case 4:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    e_2 = _a.sent();
                    return [2 /*return*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.approveRemoteConnect = approveRemoteConnect;
function enterCredentialsADFSWithConsent(page, screenshot, username, accountPwd) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, enterCredentialsADFS(page, screenshot, username, accountPwd)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, approveConsent(page, screenshot)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.enterCredentialsADFSWithConsent = enterCredentialsADFSWithConsent;
function approveConsent(page, screenshot) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        var _this = this;
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.waitForSelector("#idSIButton9")];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, Promise.all([
                            page.waitForNavigation({ waitUntil: ["load", "domcontentloaded", "networkidle0"] }),
                            page.click("#idSIButton9")
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
                case 2:
                    _a.sent();
                    return [4 /*yield*/, screenshot.takeScreenshot(page, 'consentApproved')];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.approveConsent = approveConsent;
function clickSignIn(page, screenshot) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        var _this = this;
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.waitForSelector("#SignIn")];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, screenshot.takeScreenshot(page, "samplePageInit")];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, Promise.all([
                            page.waitForNavigation({ waitUntil: ["load", "domcontentloaded", "networkidle0"] }),
                            page.click("#SignIn")
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
                case 3:
                    _a.sent();
                    return [4 /*yield*/, screenshot.takeScreenshot(page, "signInClicked")];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.clickSignIn = clickSignIn;
function enterCredentialsADFS(page, screenshot, username, accountPwd) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        var _this = this;
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        page.waitForNavigation({ waitUntil: ["load", "domcontentloaded", "networkidle0"] }).catch(function () { }),
                        page.waitForSelector("#i0116"),
                        page.waitForSelector("#idSIButton9")
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
                case 1:
                    _a.sent();
                    return [4 /*yield*/, screenshot.takeScreenshot(page, "loginPageADFS")];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, page.type("#i0116", username)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, screenshot.takeScreenshot(page, "usernameEntered")];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, Promise.all([
                            page.waitForNavigation({ waitUntil: ["load", "domcontentloaded", "networkidle0"] }),
                            page.click("#idSIButton9")
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
                case 5:
                    _a.sent();
                    return [4 /*yield*/, page.waitForSelector("#passwordInput")];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, page.waitForSelector("#submitButton")];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, page.type("#passwordInput", accountPwd)];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, screenshot.takeScreenshot(page, "passwordEntered")];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, Promise.all([
                            page.waitForNavigation({ waitUntil: ["load", "domcontentloaded", "networkidle0"] }),
                            page.click("#submitButton")
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
                case 10:
                    _a.sent();
                    return [4 /*yield*/, screenshot.takeScreenshot(page, "pwdSubmitted")];
                case 11:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.enterCredentialsADFS = enterCredentialsADFS;
function enterDeviceCode(page, screenshot, code, deviceCodeUrl) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        var _this = this;
        return (0, tslib_1.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.goto(deviceCodeUrl, { waitUntil: ["load", "domcontentloaded", "networkidle0"] })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, page.waitForSelector("#otc")];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, page.waitForSelector("#idSIButton9")];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, screenshot.takeScreenshot(page, 'deviceCodePage')];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, page.type("#otc", code)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, Promise.all([
                            page.waitForNavigation({ waitUntil: ["load", "domcontentloaded", "networkidle0"] }),
                            page.click("#idSIButton9")
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
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.enterDeviceCode = enterDeviceCode;
function validateCacheLocation(cacheLocation) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
        return (0, tslib_1.__generator)(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    fs_1.default.readFile(cacheLocation, "utf-8", function (err, data) {
                        if (err || data === "") {
                            fs_1.default.writeFile(cacheLocation, "{}", function (error) {
                                if (error) {
                                    console.log("Error writing to cache file: ", error);
                                    reject();
                                }
                                else {
                                    resolve();
                                }
                            });
                        }
                        else {
                            resolve();
                        }
                    });
                })];
        });
    });
}
exports.validateCacheLocation = validateCacheLocation;
function checkTimeoutError(output) {
    var timeoutErrorRegex = /user_timeout_reached/;
    return timeoutErrorRegex.test(output);
}
exports.checkTimeoutError = checkTimeoutError;
//# sourceMappingURL=testUtils.js.map