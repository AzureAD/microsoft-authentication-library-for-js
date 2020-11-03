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
    /**
     * Initialize request objects used by this AuthModule.
     */
    AuthProvider.prototype.setRequestObjects = function () {
        var requestScopes = ['openid', 'profile', 'User.Read'];
        var redirectUri = "msal://redirect";
        this.loginRequest = {
            scopes: requestScopes,
            redirectUri: redirectUri
        };
        this.tokenRequest = {
            scopes: requestScopes,
            redirectUri: redirectUri,
            code: null
        };
    };
    AuthProvider.prototype.login = function (authWindow) {
        return __awaiter(this, void 0, void 0, function () {
            var authCodeUrl, authCode, authResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.clientApplication.getAuthCodeUrl(this.loginRequest)];
                    case 1:
                        authCodeUrl = _a.sent();
                        this.authCodeListener = new CustomFileProtocol_1.CustomFileProtocolListener("msal");
                        this.authCodeListener.start();
                        return [4 /*yield*/, this.listenForAuthCode(authCodeUrl, authWindow)];
                    case 2:
                        authCode = _a.sent();
                        return [4 /*yield*/, this.clientApplication.acquireTokenByCode(__assign(__assign({}, this.tokenRequest), { code: authCode }))];
                    case 3:
                        authResult = _a.sent();
                        return [2 /*return*/, this.handleResponse(authResult)];
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