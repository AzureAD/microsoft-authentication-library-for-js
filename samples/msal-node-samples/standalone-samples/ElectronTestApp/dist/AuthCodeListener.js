"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthCodeListener = void 0;
/**
 * AuthCodeListener is the base class from which
 * special CustomFileProtocol and HttpAuthCode inherit
 * their structure and members.
 */
var AuthCodeListener = /** @class */ (function () {
    /**
     * Constructor
     * @param hostName - A string that represents the host name that should be listened on (i.e. 'msal' or '127.0.0.1')
     */
    function AuthCodeListener(hostName) {
        this.hostName = hostName;
    }
    Object.defineProperty(AuthCodeListener.prototype, "host", {
        get: function () {
            return this.hostName;
        },
        enumerable: false,
        configurable: true
    });
    return AuthCodeListener;
}());
exports.AuthCodeListener = AuthCodeListener;
//# sourceMappingURL=AuthCodeListener.js.map