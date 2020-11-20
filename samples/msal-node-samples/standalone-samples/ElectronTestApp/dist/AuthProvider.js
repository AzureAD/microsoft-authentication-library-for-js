"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var msal_node_1 = require("@azure/msal-node");
var CachePlugin_1 = require("./CachePlugin");
var CustomFileProtocol_1 = require("./CustomFileProtocol");
var MSAL_CONFIG = {
    auth: {
        clientId: "89e61572-2f96-47ba-b571-9d8c8f96b69d",
        authority: "https://login.microsoftonline.com/5d97b14d-c396-4aee-b524-c86d33e9b660",
    },
    cache: {
        cachePlugin: CachePlugin_1.cachePlugin
    },
    system: {
        loggerOptions: {
            loggerCallback: function (loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal_node_1.LogLevel.Verbose,
        }
    }
};
var AuthProvider = /** @class */ (function () {
    function AuthProvider() {
        this.clientApplication = new msal_node_1.PublicClientApplication(MSAL_CONFIG);
        this.account = null;
        this.setRequestObjects();
    }
    Object.defineProperty(AuthProvider.prototype, "currentAccount", {
        get: function () {
            return this.account;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Initialize request objects used by this AuthModule.
     */
    AuthProvider.prototype.setRequestObjects = function () {
        var requestScopes = ['openid', 'profile', 'User.Read'];
        var redirectUri = "msal://redirect";
        var baseSilentRequest = {
            account: null,
            forceRefresh: false
        };
        this.authCodeUrlParams = {
            scopes: requestScopes,
            redirectUri: redirectUri
        };
        this.authCodeRequest = {
            scopes: requestScopes,
            redirectUri: redirectUri,
            code: null
        };
        this.silentProfileRequest = __assign(__assign({}, baseSilentRequest), { scopes: ["User.Read"] });
        this.silentMailRequest = __assign(__assign({}, baseSilentRequest), { scopes: ["Mail.Read"] });
    };
    AuthProvider.prototype.getProfileToken = function (authWindow) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getToken(authWindow, this.silentProfileRequest)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    AuthProvider.prototype.getMailToken = function (authWindow) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getToken(authWindow, this.silentMailRequest)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    AuthProvider.prototype.getToken = function (authWindow, request) {
        return __awaiter(this, void 0, void 0, function () {
            var authResponse, account, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.account;
                        if (_a) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getAccount()];
                    case 1:
                        _a = (_b.sent());
                        _b.label = 2;
                    case 2:
                        account = _a;
                        if (!account) return [3 /*break*/, 4];
                        request.account = account;
                        return [4 /*yield*/, this.getTokenSilent(authWindow, request)];
                    case 3:
                        authResponse = _b.sent();
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, this.getTokenInteractive(authWindow, request)];
                    case 5:
                        authResponse = _b.sent();
                        _b.label = 6;
                    case 6: return [2 /*return*/, authResponse.accessToken || null];
                }
            });
        });
    };
    AuthProvider.prototype.getTokenSilent = function (authWindow, tokenRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 4]);
                        return [4 /*yield*/, this.clientApplication.acquireTokenSilent(tokenRequest)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_1 = _a.sent();
                        console.log("Silent token acquisition failed, acquiring token using redirect");
                        return [4 /*yield*/, this.getTokenInteractive(authWindow, tokenRequest)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AuthProvider.prototype.getTokenInteractive = function (authWindow, tokenRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var authCodeUrlParams, authCodeUrl, authCode, authResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        authCodeUrlParams = __assign(__assign({}, this.authCodeUrlParams), { scopes: tokenRequest.scopes });
                        return [4 /*yield*/, this.clientApplication.getAuthCodeUrl(authCodeUrlParams)];
                    case 1:
                        authCodeUrl = _a.sent();
                        this.authCodeListener = new CustomFileProtocol_1.CustomFileProtocolListener("msal");
                        this.authCodeListener.start();
                        return [4 /*yield*/, this.listenForAuthCode(authCodeUrl, authWindow)];
                    case 2:
                        authCode = _a.sent();
                        return [4 /*yield*/, this.clientApplication.acquireTokenByCode(__assign(__assign({}, this.authCodeRequest), { scopes: tokenRequest.scopes, code: authCode }))];
                    case 3:
                        authResult = _a.sent();
                        return [2 /*return*/, authResult];
                }
            });
        });
    };
    AuthProvider.prototype.login = function (authWindow) {
        return __awaiter(this, void 0, void 0, function () {
            var authResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getTokenInteractive(authWindow, this.authCodeUrlParams)];
                    case 1:
                        authResult = _a.sent();
                        return [2 /*return*/, this.handleResponse(authResult)];
                }
            });
        });
    };
    AuthProvider.prototype.loginSilent = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.account;
                        if (_a) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getAccount()];
                    case 1:
                        _a = (_b.sent());
                        _b.label = 2;
                    case 2: return [2 /*return*/, _a];
                }
            });
        });
    };
    AuthProvider.prototype.logout = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.account) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.clientApplication.getTokenCache().removeAccount(this.account)];
                    case 1:
                        _a.sent();
                        this.account = null;
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    AuthProvider.prototype.listenForAuthCode = function (navigateUrl, authWindow) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                authWindow.loadURL(navigateUrl);
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        authWindow.webContents.on('will-redirect', function (event, responseUrl) {
                            try {
                                var parsedUrl = new URL(responseUrl);
                                var authCode = parsedUrl.searchParams.get('code');
                                resolve(authCode);
                            }
                            catch (err) {
                                reject(err);
                            }
                        });
                    })];
            });
        });
    };
    /**
 * Handles the response from a popup or redirect. If response is null, will check if we have any accounts and attempt to sign in.
 * @param response
 */
    AuthProvider.prototype.handleResponse = function (response) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(response !== null)) return [3 /*break*/, 1];
                        this.account = response.account;
                        return [3 /*break*/, 3];
                    case 1:
                        _a = this;
                        return [4 /*yield*/, this.getAccount()];
                    case 2:
                        _a.account = _b.sent();
                        _b.label = 3;
                    case 3: return [2 /*return*/, this.account];
                }
            });
        });
    };
    /**
     * Calls getAllAccounts and determines the correct account to sign into, currently defaults to first account found in cache.
     * TODO: Add account chooser code
     *
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
     */
    AuthProvider.prototype.getAccount = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cache, currentAccounts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cache = this.clientApplication.getTokenCache();
                        return [4 /*yield*/, cache.getAllAccounts()];
                    case 1:
                        currentAccounts = _a.sent();
                        if (currentAccounts === null) {
                            console.log("No accounts detected");
                            return [2 /*return*/, null];
                        }
                        if (currentAccounts.length > 1) {
                            // Add choose account code here
                            console.log("Multiple accounts detected, need to add choose account code.");
                            return [2 /*return*/, currentAccounts[0]];
                        }
                        else if (currentAccounts.length === 1) {
                            return [2 /*return*/, currentAccounts[0]];
                        }
                        else {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return AuthProvider;
}());
exports.default = AuthProvider;
//# sourceMappingURL=AuthProvider.js.map