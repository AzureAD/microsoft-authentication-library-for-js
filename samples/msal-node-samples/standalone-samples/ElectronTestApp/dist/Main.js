"use strict";
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
var electron_1 = require("electron");
var AuthProvider_1 = require("./AuthProvider");
var path = require("path");
var FetchManager_1 = require("./FetchManager");
var Constants_1 = require("./Constants");
var Main = /** @class */ (function () {
    function Main() {
    }
    Main.main = function () {
        Main.application = electron_1.app;
        Main.application.on('window-all-closed', Main.onWindowAllClosed);
        Main.application.on('ready', Main.onReady);
    };
    Main.loadBaseUI = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Main.mainWindow.loadFile(path.join(__dirname, '../index.html'))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Main.onWindowAllClosed = function () {
        Main.application.quit();
    };
    Main.onClose = function () {
        Main.mainWindow = null;
    };
    Main.onReady = function () {
        Main.createMainWindow();
        Main.mainWindow.loadFile(path.join(__dirname, '../index.html'));
        Main.mainWindow.on('closed', Main.onClose);
        Main.authProvider = new AuthProvider_1.default();
        Main.networkModule = new FetchManager_1.FetchManager();
        Main.registerSubscriptions();
        Main.attemptSSOSilent();
    };
    // Creates main application window
    Main.createMainWindow = function () {
        this.mainWindow = new electron_1.BrowserWindow({
            width: 800,
            height: 800,
            webPreferences: {
                nodeIntegration: true
            },
        });
    };
    Main.publish = function (message, payload) {
        Main.mainWindow.webContents.send(message, payload);
    };
    Main.attemptSSOSilent = function () {
        return __awaiter(this, void 0, void 0, function () {
            var account;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Main.authProvider.loginSilent()];
                    case 1:
                        account = _a.sent();
                        return [4 /*yield*/, Main.loadBaseUI()];
                    case 2:
                        _a.sent();
                        if (account) {
                            console.log("Successful silent account retrieval");
                            Main.publish(Constants_1.IPC_MESSAGES.SHOW_WELCOME_MESSAGE, account);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    Main.login = function () {
        return __awaiter(this, void 0, void 0, function () {
            var account;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Main.authProvider.login(Main.mainWindow)];
                    case 1:
                        account = _a.sent();
                        return [4 /*yield*/, Main.loadBaseUI()];
                    case 2:
                        _a.sent();
                        Main.publish(Constants_1.IPC_MESSAGES.SHOW_WELCOME_MESSAGE, account);
                        return [2 /*return*/];
                }
            });
        });
    };
    Main.getProfile = function () {
        return __awaiter(this, void 0, void 0, function () {
            var token, account, graphResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Main.authProvider.getProfileToken(Main.mainWindow)];
                    case 1:
                        token = _a.sent();
                        account = Main.authProvider.currentAccount;
                        return [4 /*yield*/, Main.loadBaseUI()];
                    case 2:
                        _a.sent();
                        Main.publish(Constants_1.IPC_MESSAGES.SHOW_WELCOME_MESSAGE, account);
                        return [4 /*yield*/, Main.networkModule.callEndpointWithToken(Constants_1.GRAPH_CONFIG.GRAPH_ME_ENDPT, token)];
                    case 3:
                        graphResponse = _a.sent();
                        Main.publish(Constants_1.IPC_MESSAGES.SET_PROFILE, graphResponse);
                        return [2 /*return*/];
                }
            });
        });
    };
    Main.getMail = function () {
        return __awaiter(this, void 0, void 0, function () {
            var token, account, graphResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Main.authProvider.getMailToken(Main.mainWindow)];
                    case 1:
                        token = _a.sent();
                        account = Main.authProvider.currentAccount;
                        return [4 /*yield*/, Main.loadBaseUI()];
                    case 2:
                        _a.sent();
                        Main.publish(Constants_1.IPC_MESSAGES.SHOW_WELCOME_MESSAGE, account);
                        return [4 /*yield*/, Main.networkModule.callEndpointWithToken(Constants_1.GRAPH_CONFIG.GRAPH_MAIL_ENDPT, token)];
                    case 3:
                        graphResponse = _a.sent();
                        Main.publish(Constants_1.IPC_MESSAGES.SET_MAIL, graphResponse);
                        return [2 /*return*/];
                }
            });
        });
    };
    Main.logout = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Main.authProvider.logout()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, Main.loadBaseUI()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Router that maps callbacks/actions to specific messages received from the Renderer
    Main.registerSubscriptions = function () {
        electron_1.ipcMain.on(Constants_1.IPC_MESSAGES.LOGIN, Main.login);
        electron_1.ipcMain.on(Constants_1.IPC_MESSAGES.GET_PROFILE, Main.getProfile);
        electron_1.ipcMain.on(Constants_1.IPC_MESSAGES.GET_MAIL, Main.getMail);
        electron_1.ipcMain.on(Constants_1.IPC_MESSAGES.LOGOUT, Main.logout);
    };
    return Main;
}());
exports.default = Main;
//# sourceMappingURL=Main.js.map