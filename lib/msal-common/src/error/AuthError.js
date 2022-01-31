"use strict";
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthError = exports.AuthErrorMessage = void 0;
var tslib_1 = require("tslib");
var Constants_1 = require("../utils/Constants");
/**
 * AuthErrorMessage class containing string constants used by error codes and messages.
 */
exports.AuthErrorMessage = {
    unexpectedError: {
        code: "unexpected_error",
        desc: "Unexpected error in authentication."
    }
};
/**
 * General error class thrown by the MSAL.js library.
 */
var AuthError = /** @class */ (function (_super) {
    (0, tslib_1.__extends)(AuthError, _super);
    function AuthError(errorCode, errorMessage, suberror) {
        var _this = this;
        var errorString = errorMessage ? "".concat(errorCode, ": ").concat(errorMessage) : errorCode;
        _this = _super.call(this, errorString) || this;
        Object.setPrototypeOf(_this, AuthError.prototype);
        _this.errorCode = errorCode || Constants_1.Constants.EMPTY_STRING;
        _this.errorMessage = errorMessage || "";
        _this.subError = suberror || "";
        _this.name = "AuthError";
        return _this;
    }
    AuthError.prototype.setCorrelationId = function (correlationId) {
        this.correlationId = correlationId;
    };
    /**
     * Creates an error that is thrown when something unexpected happens in the library.
     * @param errDesc
     */
    AuthError.createUnexpectedError = function (errDesc) {
        return new AuthError(exports.AuthErrorMessage.unexpectedError.code, "".concat(exports.AuthErrorMessage.unexpectedError.desc, ": ").concat(errDesc));
    };
    return AuthError;
}(Error));
exports.AuthError = AuthError;
//# sourceMappingURL=AuthError.js.map