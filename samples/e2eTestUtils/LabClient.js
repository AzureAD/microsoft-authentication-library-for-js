"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabClient = void 0;
var tslib_1 = require("tslib");
var identity_1 = require("@azure/identity");
var axios_1 = (0, tslib_1.__importDefault)(require("axios"));
var Constants_1 = require("./Constants");
var dotenv = (0, tslib_1.__importStar)(require("dotenv"));
dotenv.config({
    path: "../../.env"
});
var LabClient = /** @class */ (function () {
    function LabClient() {
        var tenant = process.env[Constants_1.ENV_VARIABLES.TENANT];
        var clientId = process.env[Constants_1.ENV_VARIABLES.CLIENT_ID];
        var client_secret = process.env[Constants_1.ENV_VARIABLES.SECRET];
        this.currentToken = null;
        if (!tenant || !clientId || !client_secret) {
            throw "Environment variables not set!";
        }
        this.credentials = new identity_1.ClientSecretCredential(tenant, clientId, client_secret);
    }
    LabClient.prototype.getCurrentToken = function () {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            var _a;
            return (0, tslib_1.__generator)(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.currentToken) {
                            if (this.currentToken.expiresOnTimestamp <= new Date().getTime()) {
                                return [2 /*return*/, this.currentToken.token];
                            }
                        }
                        _a = this;
                        return [4 /*yield*/, this.credentials.getToken(Constants_1.LAB_SCOPE)];
                    case 1:
                        _a.currentToken = _b.sent();
                        if (!this.currentToken || !this.currentToken.token) {
                            throw "Unable to retrieve access token from lab API";
                        }
                        return [2 /*return*/, this.currentToken.token];
                }
            });
        });
    };
    LabClient.prototype.requestLabApi = function (endpoint, accessToken) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            var response, e_1;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, axios_1.default)("".concat(Constants_1.LAB_API_ENDPOINT).concat(endpoint), {
                                headers: {
                                    "Authorization": "Bearer ".concat(accessToken)
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 2:
                        e_1 = _a.sent();
                        console.error(e_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/, null];
                }
            });
        });
    };
    LabClient.prototype.getVarsByCloudEnvironment = function (labApiParams) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            var accessToken, apiParams, apiUrl;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCurrentToken()];
                    case 1:
                        accessToken = _a.sent();
                        apiParams = [];
                        if (labApiParams.azureEnvironment) {
                            apiParams.push("".concat(Constants_1.ParamKeys.AZURE_ENVIRONMENT, "=").concat(labApiParams.azureEnvironment));
                        }
                        if (labApiParams.userType) {
                            apiParams.push("".concat(Constants_1.ParamKeys.USER_TYPE, "=").concat(labApiParams.userType));
                        }
                        if (labApiParams.federationProvider) {
                            apiParams.push("".concat(Constants_1.ParamKeys.FEDERATION_PROVIDER, "=").concat(labApiParams.federationProvider));
                        }
                        if (labApiParams.b2cProvider) {
                            apiParams.push("".concat(Constants_1.ParamKeys.B2C_PROVIDER, "=").concat(labApiParams.b2cProvider));
                        }
                        if (labApiParams.homeDomain) {
                            apiParams.push("".concat(Constants_1.ParamKeys.HOME_DOMAIN, "=").concat(labApiParams.homeDomain));
                        }
                        if (labApiParams.appType) {
                            apiParams.push("".concat(Constants_1.ParamKeys.APP_TYPE, "=").concat(labApiParams.appType));
                        }
                        if (labApiParams.signInAudience) {
                            apiParams.push("".concat(Constants_1.ParamKeys.SIGN_IN_AUDIENCE, "=").concat(labApiParams.signInAudience));
                        }
                        if (labApiParams.publicClient) {
                            apiParams.push("".concat(Constants_1.ParamKeys.PUBLIC_CLIENT, "=").concat(labApiParams.publicClient));
                        }
                        if (apiParams.length <= 0) {
                            throw "Must provide at least one param to getVarsByCloudEnvironment";
                        }
                        apiUrl = "/Config?" + apiParams.join("&");
                        return [4 /*yield*/, this.requestLabApi(apiUrl, accessToken)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    LabClient.prototype.getSecret = function (secretName) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            var accessToken;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCurrentToken()];
                    case 1:
                        accessToken = _a.sent();
                        return [4 /*yield*/, this.requestLabApi("/LabSecret?&Secret=".concat(secretName), accessToken)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return LabClient;
}());
exports.LabClient = LabClient;
//# sourceMappingURL=LabClient.js.map