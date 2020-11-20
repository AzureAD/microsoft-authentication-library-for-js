"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomFileProtocolListener = void 0;
var AuthCodeListener_1 = require("./AuthCodeListener");
var electron_1 = require("electron");
var path = require("path");
var url = require("url");
/**
 * CustomFileProtocolListener can be instantiated in order
 * to register and unregister a custom file protocol on which
 * MSAL can listen for Auth Code reponses.
 */
var CustomFileProtocolListener = /** @class */ (function (_super) {
    __extends(CustomFileProtocolListener, _super);
    function CustomFileProtocolListener(hostName) {
        return _super.call(this, hostName) || this;
    }
    /**
     * Registers a custom file protocol on which the library will
     * listen for Auth Code response.
     */
    CustomFileProtocolListener.prototype.start = function () {
        electron_1.protocol.registerFileProtocol(this.host, function (req, callback) {
            var requestUrl = url.parse(req.url, true);
            callback(path.normalize(__dirname + "/" + requestUrl.path));
        });
    };
    /**
     * Unregisters a custom file protocol to stop listening for
     * Auth Code response.
     */
    CustomFileProtocolListener.prototype.close = function () {
        electron_1.protocol.unregisterProtocol(this.host);
    };
    return CustomFileProtocolListener;
}(AuthCodeListener_1.AuthCodeListener));
exports.CustomFileProtocolListener = CustomFileProtocolListener;
//# sourceMappingURL=CustomFileProtocol.js.map