"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MsalConfig = (function () {
    function MsalConfig() {
        this.authority = "https://login.microsoftonline.com/common";
        this.validateAuthority = true;
        this.cacheLocation = "sessionStorage";
        this.loadFrameTimeout = 6000;
        this.navigateToLoginRequestUrl = true;
    }
    return MsalConfig;
}());
exports.MsalConfig = MsalConfig;
