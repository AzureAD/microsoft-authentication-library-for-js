"use strict";
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CRYPTO_IMPLEMENTATION = void 0;
var tslib_1 = require("tslib");
var AuthError_1 = require("../error/AuthError");
exports.DEFAULT_CRYPTO_IMPLEMENTATION = {
    createNewGuid: function () {
        var notImplErr = "Crypto interface - createNewGuid() has not been implemented";
        throw AuthError_1.AuthError.createUnexpectedError(notImplErr);
    },
    base64Decode: function () {
        var notImplErr = "Crypto interface - base64Decode() has not been implemented";
        throw AuthError_1.AuthError.createUnexpectedError(notImplErr);
    },
    base64Encode: function () {
        var notImplErr = "Crypto interface - base64Encode() has not been implemented";
        throw AuthError_1.AuthError.createUnexpectedError(notImplErr);
    },
    generatePkceCodes: function () {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            var notImplErr;
            return (0, tslib_1.__generator)(this, function (_a) {
                notImplErr = "Crypto interface - generatePkceCodes() has not been implemented";
                throw AuthError_1.AuthError.createUnexpectedError(notImplErr);
            });
        });
    },
    getPublicKeyThumbprint: function () {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            var notImplErr;
            return (0, tslib_1.__generator)(this, function (_a) {
                notImplErr = "Crypto interface - getPublicKeyThumbprint() has not been implemented";
                throw AuthError_1.AuthError.createUnexpectedError(notImplErr);
            });
        });
    },
    removeTokenBindingKey: function () {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            var notImplErr;
            return (0, tslib_1.__generator)(this, function (_a) {
                notImplErr = "Crypto interface - removeTokenBindingKey() has not been implemented";
                throw AuthError_1.AuthError.createUnexpectedError(notImplErr);
            });
        });
    },
    clearKeystore: function () {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            var notImplErr;
            return (0, tslib_1.__generator)(this, function (_a) {
                notImplErr = "Crypto interface - clearKeystore() has not been implemented";
                throw AuthError_1.AuthError.createUnexpectedError(notImplErr);
            });
        });
    },
    signJwt: function () {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            var notImplErr;
            return (0, tslib_1.__generator)(this, function (_a) {
                notImplErr = "Crypto interface - signJwt() has not been implemented";
                throw AuthError_1.AuthError.createUnexpectedError(notImplErr);
            });
        });
    },
    hashString: function () {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            var notImplErr;
            return (0, tslib_1.__generator)(this, function (_a) {
                notImplErr = "Crypto interface - hashString() has not been implemented";
                throw AuthError_1.AuthError.createUnexpectedError(notImplErr);
            });
        });
    }
};
//# sourceMappingURL=ICrypto.js.map