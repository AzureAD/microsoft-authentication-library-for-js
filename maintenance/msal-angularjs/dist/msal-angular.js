/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 10);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Constants_1 = __webpack_require__(1);
/*
 * @hidden
 */
var Utils = /** @class */ (function () {
    function Utils() {
    }
    Utils.compareObjects = function (u1, u2) {
        if (!u1 || !u2) {
            return false;
        }
        if (u1.userIdentifier && u2.userIdentifier) {
            if (u1.userIdentifier === u2.userIdentifier) {
                return true;
            }
        }
        return false;
    };
    Utils.expiresIn = function (expires) {
        // if AAD did not send "expires_in" property, use default expiration of 3599 seconds, for some reason AAD sends 3599 as "expires_in" value instead of 3600
        if (!expires) {
            expires = "3599";
        }
        return this.now() + parseInt(expires, 10);
    };
    Utils.now = function () {
        return Math.round(new Date().getTime() / 1000.0);
    };
    Utils.isEmpty = function (str) {
        return (typeof str === "undefined" || !str || 0 === str.length);
    };
    Utils.extractIdToken = function (encodedIdToken) {
        // id token will be decoded to get the username
        var decodedToken = this.decodeJwt(encodedIdToken);
        if (!decodedToken) {
            return null;
        }
        try {
            var base64IdToken = decodedToken.JWSPayload;
            var base64Decoded = this.base64DecodeStringUrlSafe(base64IdToken);
            if (!base64Decoded) {
                //this._requestContext.logger.info("The returned id_token could not be base64 url safe decoded.");
                return null;
            }
            // ECMA script has JSON built-in support
            return JSON.parse(base64Decoded);
        }
        catch (err) {
            //this._requestContext.logger.error("The returned id_token could not be decoded" + err);
        }
        return null;
    };
    Utils.base64EncodeStringUrlSafe = function (input) {
        // html5 should support atob function for decoding
        if (window.btoa) {
            return window.btoa(input);
        }
        else {
            return this.encode(input);
        }
    };
    Utils.base64DecodeStringUrlSafe = function (base64IdToken) {
        // html5 should support atob function for decoding
        base64IdToken = base64IdToken.replace(/-/g, "+").replace(/_/g, "/");
        if (window.atob) {
            return decodeURIComponent(encodeURIComponent(window.atob(base64IdToken))); // jshint ignore:line
        }
        else {
            return decodeURIComponent(encodeURIComponent(this.decode(base64IdToken)));
        }
    };
    Utils.encode = function (input) {
        var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        input = this.utf8Encode(input);
        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            }
            else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
        }
        return output.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    };
    Utils.utf8Encode = function (input) {
        input = input.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < input.length; n++) {
            var c = input.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    };
    Utils.decode = function (base64IdToken) {
        var codes = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        base64IdToken = String(base64IdToken).replace(/=+$/, "");
        var length = base64IdToken.length;
        if (length % 4 === 1) {
            throw new Error("The token to be decoded is not correctly encoded.");
        }
        var h1, h2, h3, h4, bits, c1, c2, c3, decoded = "";
        for (var i = 0; i < length; i += 4) {
            //Every 4 base64 encoded character will be converted to 3 byte string, which is 24 bits
            // then 6 bits per base64 encoded character
            h1 = codes.indexOf(base64IdToken.charAt(i));
            h2 = codes.indexOf(base64IdToken.charAt(i + 1));
            h3 = codes.indexOf(base64IdToken.charAt(i + 2));
            h4 = codes.indexOf(base64IdToken.charAt(i + 3));
            // For padding, if last two are "="
            if (i + 2 === length - 1) {
                bits = h1 << 18 | h2 << 12 | h3 << 6;
                c1 = bits >> 16 & 255;
                c2 = bits >> 8 & 255;
                decoded += String.fromCharCode(c1, c2);
                break;
            }
            // if last one is "="
            else if (i + 1 === length - 1) {
                bits = h1 << 18 | h2 << 12;
                c1 = bits >> 16 & 255;
                decoded += String.fromCharCode(c1);
                break;
            }
            bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;
            // then convert to 3 byte chars
            c1 = bits >> 16 & 255;
            c2 = bits >> 8 & 255;
            c3 = bits & 255;
            decoded += String.fromCharCode(c1, c2, c3);
        }
        return decoded;
    };
    Utils.decodeJwt = function (jwtToken) {
        if (this.isEmpty(jwtToken)) {
            return null;
        }
        var idTokenPartsRegex = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/;
        var matches = idTokenPartsRegex.exec(jwtToken);
        if (!matches || matches.length < 4) {
            //this._requestContext.logger.warn("The returned id_token is not parseable.");
            return null;
        }
        var crackedToken = {
            header: matches[1],
            JWSPayload: matches[2],
            JWSSig: matches[3]
        };
        return crackedToken;
    };
    Utils.deserialize = function (query) {
        var match; // Regex for replacing addition symbol with a space
        var pl = /\+/g;
        var search = /([^&=]+)=([^&]*)/g;
        var decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };
        var obj = {};
        match = search.exec(query);
        while (match) {
            obj[decode(match[1])] = decode(match[2]);
            match = search.exec(query);
        }
        return obj;
    };
    Utils.isIntersectingScopes = function (cachedScopes, scopes) {
        cachedScopes = this.convertToLowerCase(cachedScopes);
        for (var i = 0; i < scopes.length; i++) {
            if (cachedScopes.indexOf(scopes[i].toLowerCase()) > -1) {
                return true;
            }
        }
        return false;
    };
    Utils.containsScope = function (cachedScopes, scopes) {
        cachedScopes = this.convertToLowerCase(cachedScopes);
        return scopes.every(function (value) { return cachedScopes.indexOf(value.toString().toLowerCase()) >= 0; });
    };
    Utils.convertToLowerCase = function (scopes) {
        return scopes.map(function (scope) { return scope.toLowerCase(); });
    };
    Utils.removeElement = function (scopes, scope) {
        return scopes.filter(function (value) { return value !== scope; });
    };
    Utils.decimalToHex = function (num) {
        var hex = num.toString(16);
        while (hex.length < 2) {
            hex = "0" + hex;
        }
        return hex;
    };
    Utils.getLibraryVersion = function () {
        return "0.2.4";
    };
    /*
      * Given a url like https://a:b/common/d?e=f#g, and a tenantId, returns https://a:b/tenantId/d
      * @param href The url
      * @param tenantId The tenant id to replace
      */
    Utils.replaceFirstPath = function (url, tenantId) {
        if (!tenantId) {
            return url;
        }
        var urlObject = this.GetUrlComponents(url);
        var pathArray = urlObject.PathSegments;
        if (pathArray.length !== 0 && (pathArray[0] === Constants_1.Constants.common || pathArray[0] === Constants_1.Constants.organizations)) {
            pathArray[0] = tenantId;
            url = urlObject.Protocol + "//" + urlObject.HostNameAndPort + "/" + pathArray.join("/");
        }
        return url;
    };
    Utils.createNewGuid = function () {
        // RFC4122: The version 4 UUID is meant for generating UUIDs from truly-random or
        // pseudo-random numbers.
        // The algorithm is as follows:
        //     Set the two most significant bits (bits 6 and 7) of the
        //        clock_seq_hi_and_reserved to zero and one, respectively.
        //     Set the four most significant bits (bits 12 through 15) of the
        //        time_hi_and_version field to the 4-bit version number from
        //        Section 4.1.3. Version4
        //     Set all the other bits to randomly (or pseudo-randomly) chosen
        //     values.
        // UUID                   = time-low "-" time-mid "-"time-high-and-version "-"clock-seq-reserved and low(2hexOctet)"-" node
        // time-low               = 4hexOctet
        // time-mid               = 2hexOctet
        // time-high-and-version  = 2hexOctet
        // clock-seq-and-reserved = hexOctet:
        // clock-seq-low          = hexOctet
        // node                   = 6hexOctet
        // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        // y could be 1000, 1001, 1010, 1011 since most significant two bits needs to be 10
        // y values are 8, 9, A, B
        var cryptoObj = window.crypto; // for IE 11
        if (cryptoObj && cryptoObj.getRandomValues) {
            var buffer = new Uint8Array(16);
            cryptoObj.getRandomValues(buffer);
            //buffer[6] and buffer[7] represents the time_hi_and_version field. We will set the four most significant bits (4 through 7) of buffer[6] to represent decimal number 4 (UUID version number).
            buffer[6] |= 0x40; //buffer[6] | 01000000 will set the 6 bit to 1.
            buffer[6] &= 0x4f; //buffer[6] & 01001111 will set the 4, 5, and 7 bit to 0 such that bits 4-7 == 0100 = "4".
            //buffer[8] represents the clock_seq_hi_and_reserved field. We will set the two most significant bits (6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively.
            buffer[8] |= 0x80; //buffer[8] | 10000000 will set the 7 bit to 1.
            buffer[8] &= 0xbf; //buffer[8] & 10111111 will set the 6 bit to 0.
            return Utils.decimalToHex(buffer[0]) + Utils.decimalToHex(buffer[1])
                + Utils.decimalToHex(buffer[2]) + Utils.decimalToHex(buffer[3])
                + "-" + Utils.decimalToHex(buffer[4]) + Utils.decimalToHex(buffer[5])
                + "-" + Utils.decimalToHex(buffer[6]) + Utils.decimalToHex(buffer[7])
                + "-" + Utils.decimalToHex(buffer[8]) + Utils.decimalToHex(buffer[9])
                + "-" + Utils.decimalToHex(buffer[10]) + Utils.decimalToHex(buffer[11])
                + Utils.decimalToHex(buffer[12]) + Utils.decimalToHex(buffer[13])
                + Utils.decimalToHex(buffer[14]) + Utils.decimalToHex(buffer[15]);
        }
        else {
            var guidHolder = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
            var hex = "0123456789abcdef";
            var r = 0;
            var guidResponse = "";
            for (var i = 0; i < 36; i++) {
                if (guidHolder[i] !== "-" && guidHolder[i] !== "4") {
                    // each x and y needs to be random
                    r = Math.random() * 16 | 0;
                }
                if (guidHolder[i] === "x") {
                    guidResponse += hex[r];
                }
                else if (guidHolder[i] === "y") {
                    // clock-seq-and-reserved first hex is filtered and remaining hex values are random
                    r &= 0x3; // bit and with 0011 to set pos 2 to zero ?0??
                    r |= 0x8; // set pos 3 to 1 as 1???
                    guidResponse += hex[r];
                }
                else {
                    guidResponse += guidHolder[i];
                }
            }
            return guidResponse;
        }
    };
    /*
     * Parses out the components from a url string.
     * @returns An object with the various components. Please cache this value insted of calling this multiple times on the same url.
     */
    Utils.GetUrlComponents = function (url) {
        if (!url) {
            throw "Url required";
        }
        // https://gist.github.com/curtisz/11139b2cfcaef4a261e0
        var regEx = RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
        var match = url.match(regEx);
        if (!match || match.length < 6) {
            throw "Valid url required";
        }
        var urlComponents = {
            Protocol: match[1],
            HostNameAndPort: match[4],
            AbsolutePath: match[5]
        };
        var pathSegments = urlComponents.AbsolutePath.split("/");
        pathSegments = pathSegments.filter(function (val) { return val && val.length > 0; }); // remove empty elements
        urlComponents.PathSegments = pathSegments;
        return urlComponents;
    };
    /*
     * Given a url or path, append a trailing slash if one doesnt exist
     */
    Utils.CanonicalizeUri = function (url) {
        if (url) {
            url = url.toLowerCase();
        }
        if (url && !Utils.endsWith(url, "/")) {
            url += "/";
        }
        return url;
    };
    /*
      * Checks to see if the url ends with the suffix
      * Required because we are compiling for es5 instead of es6
      * @param url
      * @param str
      */
    Utils.endsWith = function (url, suffix) {
        if (!url || !suffix) {
            return false;
        }
        return url.indexOf(suffix, url.length - suffix.length) !== -1;
    };
    Utils.checkSSO = function (extraQueryParameters) {
        return !(extraQueryParameters && ((extraQueryParameters.indexOf(Constants_1.Constants.login_hint) !== -1 || extraQueryParameters.indexOf(Constants_1.Constants.sid) !== -1)));
    };
    Utils.constructUnifiedCacheExtraQueryParameter = function (idTokenObject, extraQueryParameters) {
        if (idTokenObject) {
            if (idTokenObject.hasOwnProperty(Constants_1.Constants.upn)) {
                extraQueryParameters = this.urlRemoveQueryStringParameter(extraQueryParameters, Constants_1.Constants.login_hint);
                extraQueryParameters = this.urlRemoveQueryStringParameter(extraQueryParameters, Constants_1.Constants.domain_hint);
                if (extraQueryParameters) {
                    return extraQueryParameters += "&" + Constants_1.Constants.login_hint + "=" + idTokenObject.upn + "&" + Constants_1.Constants.domain_hint + "=" + Constants_1.Constants.organizations;
                }
                else {
                    return extraQueryParameters = "&" + Constants_1.Constants.login_hint + "=" + idTokenObject.upn + "&" + Constants_1.Constants.domain_hint + "=" + Constants_1.Constants.organizations;
                }
            }
            else {
                extraQueryParameters = this.urlRemoveQueryStringParameter(extraQueryParameters, Constants_1.Constants.domain_hint);
                if (extraQueryParameters) {
                    return extraQueryParameters += "&" + Constants_1.Constants.domain_hint + "=" + Constants_1.Constants.organizations;
                }
                else {
                    return extraQueryParameters = "&" + Constants_1.Constants.domain_hint + "=" + Constants_1.Constants.organizations;
                }
            }
        }
        return extraQueryParameters;
    };
    Utils.urlRemoveQueryStringParameter = function (url, name) {
        if (this.isEmpty(url)) {
            return url;
        }
        var regex = new RegExp("(\\&" + name + "=)[^\&]+");
        url = url.replace(regex, "");
        // name=value&
        regex = new RegExp("(" + name + "=)[^\&]+&");
        url = url.replace(regex, "");
        // name=value
        regex = new RegExp("(" + name + "=)[^\&]+");
        url = url.replace(regex, "");
        return url;
    };
    return Utils;
}());
exports.Utils = Utils;
//# sourceMappingURL=Utils.js.map

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*
  * Copyright (c) Microsoft Corporation
  *  All Rights Reserved
  *  MIT License
  *
  * Permission is hereby granted, free of charge, to any person obtaining a copy of this
  * software and associated documentation files (the "Software"), to deal in the Software
  * without restriction, including without limitation the rights to use, copy, modify,
  * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
  * permit persons to whom the Software is furnished to do so, subject to the following
  * conditions:
  *
  * The above copyright notice and this permission notice shall be
  * included in all copies or substantial portions of the Software.
  *
  * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
  * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
  * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  */
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * @hidden
 */
var Constants = /** @class */ (function () {
    function Constants() {
    }
    Object.defineProperty(Constants, "errorDescription", {
        get: function () { return "error_description"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "error", {
        get: function () { return "error"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "scope", {
        get: function () { return "scope"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "acquireTokenUser", {
        get: function () { return "msal.acquireTokenUser"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "clientInfo", {
        get: function () { return "client_info"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "clientId", {
        get: function () { return "clientId"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "authority", {
        get: function () { return "msal.authority"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "idToken", {
        get: function () { return "id_token"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "accessToken", {
        get: function () { return "access_token"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "expiresIn", {
        get: function () { return "expires_in"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "sessionState", {
        get: function () { return "session_state"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "msalClientInfo", {
        get: function () { return "msal.client.info"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "msalError", {
        get: function () { return "msal.error"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "msalErrorDescription", {
        get: function () { return "msal.error.description"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "msalSessionState", {
        get: function () { return "msal.session.state"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "tokenKeys", {
        get: function () { return "msal.token.keys"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "accessTokenKey", {
        get: function () { return "msal.access.token.key"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "expirationKey", {
        get: function () { return "msal.expiration.key"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "stateLogin", {
        get: function () { return "msal.state.login"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "stateAcquireToken", {
        get: function () { return "msal.state.acquireToken"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "stateRenew", {
        get: function () { return "msal.state.renew"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "nonceIdToken", {
        get: function () { return "msal.nonce.idtoken"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "userName", {
        get: function () { return "msal.username"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "idTokenKey", {
        get: function () { return "msal.idtoken"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "loginRequest", {
        get: function () { return "msal.login.request"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "loginError", {
        get: function () { return "msal.login.error"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "renewStatus", {
        get: function () { return "msal.token.renew.status"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "msal", {
        get: function () { return "msal"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "no_user", {
        get: function () { return "NO_USER"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "login_hint", {
        get: function () { return "login_hint"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "domain_hint", {
        get: function () { return "domain_hint"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "organizations", {
        get: function () { return "organizations"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "consumers", {
        get: function () { return "consumers"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "consumersUtid", {
        get: function () { return "9188040d-6c67-4c5b-b112-36a304b66dad"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "sid", {
        get: function () { return "sid"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "upn", {
        get: function () { return "upn"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "adalIdToken", {
        get: function () { return "adal.idtoken"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "prompt_select_account", {
        get: function () { return "&prompt=select_account"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "prompt_none", {
        get: function () { return "&prompt=none"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "prompt", {
        get: function () { return "prompt"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "response_mode_fragment", {
        get: function () { return "&response_mode=fragment"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "resourceDelimeter", {
        get: function () { return "|"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "tokenRenewStatusCancelled", {
        get: function () { return "Canceled"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "tokenRenewStatusCompleted", {
        get: function () { return "Completed"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "tokenRenewStatusInProgress", {
        get: function () { return "In Progress"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "popUpWidth", {
        get: function () { return this._popUpWidth; },
        set: function (width) {
            this._popUpWidth = width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "popUpHeight", {
        get: function () { return this._popUpHeight; },
        set: function (height) {
            this._popUpHeight = height;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "login", {
        get: function () { return "LOGIN"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "renewToken", {
        get: function () { return "RENEW_TOKEN"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "unknown", {
        get: function () { return "UNKNOWN"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "urlHash", {
        get: function () { return "msal.urlHash"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "angularLoginRequest", {
        get: function () { return "msal.angular.login.request"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "userIdentifier", {
        get: function () { return "userIdentifier"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "common", {
        get: function () { return "common"; },
        enumerable: true,
        configurable: true
    });
    Constants._popUpWidth = 483;
    Constants._popUpHeight = 600;
    return Constants;
}());
exports.Constants = Constants;
/*
 * @hidden
 */
var ErrorCodes = /** @class */ (function () {
    function ErrorCodes() {
    }
    Object.defineProperty(ErrorCodes, "loginProgressError", {
        get: function () { return "login_progress_error"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ErrorCodes, "acquireTokenProgressError", {
        get: function () { return "acquiretoken_progress_error"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ErrorCodes, "inputScopesError", {
        get: function () { return "input_scopes_error"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ErrorCodes, "endpointResolutionError", {
        get: function () { return "endpoints_resolution_error"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ErrorCodes, "popUpWindowError", {
        get: function () { return "popup_window_error"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ErrorCodes, "userLoginError", {
        get: function () { return "user_login_error"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ErrorCodes, "userCancelledError", {
        get: function () { return "user_cancelled"; },
        enumerable: true,
        configurable: true
    });
    return ErrorCodes;
}());
exports.ErrorCodes = ErrorCodes;
/*
 * @hidden
 */
var ErrorDescription = /** @class */ (function () {
    function ErrorDescription() {
    }
    Object.defineProperty(ErrorDescription, "loginProgressError", {
        get: function () { return "Login is in progress"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ErrorDescription, "acquireTokenProgressError", {
        get: function () { return "Acquire token is in progress"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ErrorDescription, "inputScopesError", {
        get: function () { return "Invalid value of input scopes provided"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ErrorDescription, "endpointResolutionError", {
        get: function () { return "Endpoints cannot be resolved"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ErrorDescription, "popUpWindowError", {
        get: function () { return "Error opening popup window. This can happen if you are using IE or if popups are blocked in the browser."; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ErrorDescription, "userLoginError", {
        get: function () { return "User login is required"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ErrorDescription, "userCancelledError", {
        get: function () { return "User closed the popup window and cancelled the flow"; },
        enumerable: true,
        configurable: true
    });
    return ErrorDescription;
}());
exports.ErrorDescription = ErrorDescription;
//# sourceMappingURL=Constants.js.map

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = __webpack_require__(0);
var ErrorMessage_1 = __webpack_require__(5);
var XHRClient_1 = __webpack_require__(9);
/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/*
 * @hidden
 */
var AuthorityType;
(function (AuthorityType) {
    AuthorityType[AuthorityType["Aad"] = 0] = "Aad";
    AuthorityType[AuthorityType["Adfs"] = 1] = "Adfs";
    AuthorityType[AuthorityType["B2C"] = 2] = "B2C";
})(AuthorityType = exports.AuthorityType || (exports.AuthorityType = {}));
/*
 * @hidden
 */
var Authority = /** @class */ (function () {
    function Authority(authority, validateAuthority) {
        this.IsValidationEnabled = validateAuthority;
        this.CanonicalAuthority = authority;
        this.validateAsUri();
    }
    Object.defineProperty(Authority.prototype, "Tenant", {
        get: function () {
            return this.CanonicalAuthorityUrlComponents.PathSegments[0];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Authority.prototype, "AuthorizationEndpoint", {
        get: function () {
            this.validateResolved();
            return this.tenantDiscoveryResponse.AuthorizationEndpoint.replace("{tenant}", this.Tenant);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Authority.prototype, "EndSessionEndpoint", {
        get: function () {
            this.validateResolved();
            return this.tenantDiscoveryResponse.EndSessionEndpoint.replace("{tenant}", this.Tenant);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Authority.prototype, "SelfSignedJwtAudience", {
        get: function () {
            this.validateResolved();
            return this.tenantDiscoveryResponse.Issuer.replace("{tenant}", this.Tenant);
        },
        enumerable: true,
        configurable: true
    });
    Authority.prototype.validateResolved = function () {
        if (!this.tenantDiscoveryResponse) {
            throw "Please call ResolveEndpointsAsync first";
        }
    };
    Object.defineProperty(Authority.prototype, "CanonicalAuthority", {
        /*
         * A URL that is the authority set by the developer
         */
        get: function () {
            return this.canonicalAuthority;
        },
        set: function (url) {
            this.canonicalAuthority = Utils_1.Utils.CanonicalizeUri(url);
            this.canonicalAuthorityUrlComponents = null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Authority.prototype, "CanonicalAuthorityUrlComponents", {
        get: function () {
            if (!this.canonicalAuthorityUrlComponents) {
                this.canonicalAuthorityUrlComponents = Utils_1.Utils.GetUrlComponents(this.CanonicalAuthority);
            }
            return this.canonicalAuthorityUrlComponents;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Authority.prototype, "DefaultOpenIdConfigurationEndpoint", {
        /*
         * // http://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
         */
        get: function () {
            return this.CanonicalAuthority + "v2.0/.well-known/openid-configuration";
        },
        enumerable: true,
        configurable: true
    });
    /*
     * Given a string, validate that it is of the form https://domain/path
     */
    Authority.prototype.validateAsUri = function () {
        var components;
        try {
            components = this.CanonicalAuthorityUrlComponents;
        }
        catch (e) {
            throw ErrorMessage_1.ErrorMessage.invalidAuthorityType;
        }
        if (!components.Protocol || components.Protocol.toLowerCase() !== "https:") {
            throw ErrorMessage_1.ErrorMessage.authorityUriInsecure;
        }
        if (!components.PathSegments || components.PathSegments.length < 1) {
            throw ErrorMessage_1.ErrorMessage.authorityUriInvalidPath;
        }
    };
    /*
     * Calls the OIDC endpoint and returns the response
     */
    Authority.prototype.DiscoverEndpoints = function (openIdConfigurationEndpoint) {
        var client = new XHRClient_1.XhrClient();
        return client.sendRequestAsync(openIdConfigurationEndpoint, "GET", /*enableCaching: */ true)
            .then(function (response) {
            return {
                AuthorizationEndpoint: response.authorization_endpoint,
                EndSessionEndpoint: response.end_session_endpoint,
                Issuer: response.issuer
            };
        });
    };
    /*
     * Returns a promise.
     * Checks to see if the authority is in the cache
     * Discover endpoints via openid-configuration
     * If successful, caches the endpoint for later use in OIDC
     */
    Authority.prototype.ResolveEndpointsAsync = function () {
        var _this = this;
        var openIdConfigurationEndpoint = "";
        return this.GetOpenIdConfigurationEndpointAsync().then(function (openIdConfigurationEndpointResponse) {
            openIdConfigurationEndpoint = openIdConfigurationEndpointResponse;
            return _this.DiscoverEndpoints(openIdConfigurationEndpoint);
        }).then(function (tenantDiscoveryResponse) {
            _this.tenantDiscoveryResponse = tenantDiscoveryResponse;
            return _this;
        });
    };
    return Authority;
}());
exports.Authority = Authority;
//# sourceMappingURL=Authority.js.map

/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__extends", function() { return __extends; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__assign", function() { return __assign; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__rest", function() { return __rest; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__decorate", function() { return __decorate; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__param", function() { return __param; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__metadata", function() { return __metadata; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__awaiter", function() { return __awaiter; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__generator", function() { return __generator; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__exportStar", function() { return __exportStar; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__values", function() { return __values; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__read", function() { return __read; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__spread", function() { return __spread; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__await", function() { return __await; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__asyncGenerator", function() { return __asyncGenerator; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__asyncDelegator", function() { return __asyncDelegator; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__asyncValues", function() { return __asyncValues; });
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = Object.assign || function __assign(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
}

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
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
}

function __exportStar(m, exports) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}

function __values(o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);  }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { if (o[n]) i[n] = function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; }; }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator];
    return m ? m.call(o) : typeof __values === "function" ? __values(o) : o[Symbol.iterator]();
}

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = __webpack_require__(0);
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Error"] = 0] = "Error";
    LogLevel[LogLevel["Warning"] = 1] = "Warning";
    LogLevel[LogLevel["Info"] = 2] = "Info";
    LogLevel[LogLevel["Verbose"] = 3] = "Verbose";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
var Logger = /** @class */ (function () {
    function Logger(localCallback, options) {
        if (options === void 0) { options = {}; }
        /*
         * @hidden
         */
        this._level = LogLevel.Info;
        var _a = options.correlationId, correlationId = _a === void 0 ? "" : _a, _b = options.level, level = _b === void 0 ? LogLevel.Info : _b, _c = options.piiLoggingEnabled, piiLoggingEnabled = _c === void 0 ? false : _c;
        this._localCallback = localCallback;
        this._correlationId = correlationId;
        this._level = level;
        this._piiLoggingEnabled = piiLoggingEnabled;
    }
    /*
     * @hidden
     */
    Logger.prototype.logMessage = function (logLevel, logMessage, containsPii) {
        if ((logLevel > this._level) || (!this._piiLoggingEnabled && containsPii)) {
            return;
        }
        var timestamp = new Date().toUTCString();
        var log;
        if (!Utils_1.Utils.isEmpty(this._correlationId)) {
            log = timestamp + ":" + this._correlationId + "-" + Utils_1.Utils.getLibraryVersion() + "-" + LogLevel[logLevel] + " " + logMessage;
        }
        else {
            log = timestamp + ":" + Utils_1.Utils.getLibraryVersion() + "-" + LogLevel[logLevel] + " " + logMessage;
        }
        this.executeCallback(logLevel, log, containsPii);
    };
    /*
     * @hidden
     */
    Logger.prototype.executeCallback = function (level, message, containsPii) {
        if (this._localCallback) {
            this._localCallback(level, message, containsPii);
        }
    };
    /*
     * @hidden
     */
    Logger.prototype.error = function (message) {
        this.logMessage(LogLevel.Error, message, false);
    };
    /*
     * @hidden
     */
    Logger.prototype.errorPii = function (message) {
        this.logMessage(LogLevel.Error, message, true);
    };
    /*
     * @hidden
     */
    Logger.prototype.warning = function (message) {
        this.logMessage(LogLevel.Warning, message, false);
    };
    /*
     * @hidden
     */
    Logger.prototype.warningPii = function (message) {
        this.logMessage(LogLevel.Warning, message, true);
    };
    /*
     * @hidden
     */
    Logger.prototype.info = function (message) {
        this.logMessage(LogLevel.Info, message, false);
    };
    /*
     * @hidden
     */
    Logger.prototype.infoPii = function (message) {
        this.logMessage(LogLevel.Info, message, true);
    };
    /*
     * @hidden
     */
    Logger.prototype.verbose = function (message) {
        this.logMessage(LogLevel.Verbose, message, false);
    };
    /*
     * @hidden
     */
    Logger.prototype.verbosePii = function (message) {
        this.logMessage(LogLevel.Verbose, message, true);
    };
    return Logger;
}());
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*
  * Copyright (c) Microsoft Corporation
  *  All Rights Reserved
  *  MIT License
  *
  * Permission is hereby granted, free of charge, to any person obtaining a copy of this
  * software and associated documentation files (the "Software"), to deal in the Software
  * without restriction, including without limitation the rights to use, copy, modify,
  * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
  * permit persons to whom the Software is furnished to do so, subject to the following
  * conditions:
  *
  * The above copyright notice and this permission notice shall be
  * included in all copies or substantial portions of the Software.
  *
  * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
  * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
  * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  */
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * @hidden
 */
var ErrorMessage = /** @class */ (function () {
    function ErrorMessage() {
    }
    Object.defineProperty(ErrorMessage, "authorityUriInvalidPath", {
        get: function () { return "AuthorityUriInvalidPath"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ErrorMessage, "authorityUriInsecure", {
        get: function () { return "AuthorityUriInsecure"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ErrorMessage, "invalidAuthorityType", {
        get: function () { return "InvalidAuthorityType"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ErrorMessage, "unsupportedAuthorityValidation", {
        get: function () { return "UnsupportedAuthorityValidation"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ErrorMessage, "b2cAuthorityUriInvalidPath", {
        get: function () { return "B2cAuthorityUriInvalidPath"; },
        enumerable: true,
        configurable: true
    });
    return ErrorMessage;
}());
exports.ErrorMessage = ErrorMessage;
//# sourceMappingURL=ErrorMessage.js.map

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * @hidden
 */
var TokenResponse = /** @class */ (function () {
    function TokenResponse() {
        this.valid = false;
        this.parameters = {};
        this.stateMatch = false;
        this.stateResponse = "";
        this.requestType = "unknown";
    }
    return TokenResponse;
}());
exports.TokenResponse = TokenResponse;
//# sourceMappingURL=RequestInfo.js.map

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = __webpack_require__(0);
var User = /** @class */ (function () {
    /*
     * @hidden
     */
    function User(displayableId, name, identityProvider, userIdentifier, idToken, sid) {
        this.displayableId = displayableId;
        this.name = name;
        this.identityProvider = identityProvider;
        this.userIdentifier = userIdentifier;
        this.idToken = idToken;
        this.sid = sid;
    }
    /*
     * @hidden
     */
    User.createUser = function (idToken, clientInfo) {
        var uid;
        var utid;
        if (!clientInfo) {
            uid = "";
            utid = "";
        }
        else {
            uid = clientInfo.uid;
            utid = clientInfo.utid;
        }
        var userIdentifier = Utils_1.Utils.base64EncodeStringUrlSafe(uid) + "." + Utils_1.Utils.base64EncodeStringUrlSafe(utid);
        return new User(idToken.preferredName, idToken.name, idToken.issuer, userIdentifier, idToken.decodedIdToken, idToken.sid);
    };
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(3);
var Authority_1 = __webpack_require__(2);
var XHRClient_1 = __webpack_require__(9);
/**
 * @hidden
 */
var AadAuthority = /** @class */ (function (_super) {
    tslib_1.__extends(AadAuthority, _super);
    function AadAuthority(authority, validateAuthority) {
        return _super.call(this, authority, validateAuthority) || this;
    }
    Object.defineProperty(AadAuthority.prototype, "AadInstanceDiscoveryEndpointUrl", {
        get: function () {
            return AadAuthority.AadInstanceDiscoveryEndpoint + "?api-version=1.0&authorization_endpoint=" + this.CanonicalAuthority + "oauth2/v2.0/authorize";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AadAuthority.prototype, "AuthorityType", {
        get: function () {
            return Authority_1.AuthorityType.Aad;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Returns a promise which resolves to the OIDC endpoint
     * Only responds with the endpoint
     */
    AadAuthority.prototype.GetOpenIdConfigurationEndpointAsync = function () {
        var _this = this;
        var resultPromise = new Promise(function (resolve, reject) {
            return resolve(_this.DefaultOpenIdConfigurationEndpoint);
        });
        if (!this.IsValidationEnabled) {
            return resultPromise;
        }
        var host = this.CanonicalAuthorityUrlComponents.HostNameAndPort;
        if (this.IsInTrustedHostList(host)) {
            return resultPromise;
        }
        var client = new XHRClient_1.XhrClient();
        return client.sendRequestAsync(this.AadInstanceDiscoveryEndpointUrl, "GET", true)
            .then(function (response) {
            return response.tenant_discovery_endpoint;
        });
    };
    /**
     * Checks to see if the host is in a list of trusted hosts
     * @param {string} The host to look up
     */
    AadAuthority.prototype.IsInTrustedHostList = function (host) {
        return AadAuthority.TrustedHostList[host.toLowerCase()];
    };
    AadAuthority.AadInstanceDiscoveryEndpoint = "https://login.microsoftonline.com/common/discovery/instance";
    AadAuthority.TrustedHostList = {
        "login.windows.net": "login.windows.net",
        "login.chinacloudapi.cn": "login.chinacloudapi.cn",
        "login.cloudgovapi.us": "login.cloudgovapi.us",
        "login.microsoftonline.com": "login.microsoftonline.com",
        "login.microsoftonline.de": "login.microsoftonline.de",
        "login.microsoftonline.us": "login.microsoftonline.us"
    };
    return AadAuthority;
}(Authority_1.Authority));
exports.AadAuthority = AadAuthority;
//# sourceMappingURL=AadAuthority.js.map

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * XHR client for JSON endpoints
 * https://www.npmjs.com/package/async-promise
 * @hidden
 */
var XhrClient = /** @class */ (function () {
    function XhrClient() {
    }
    XhrClient.prototype.sendRequestAsync = function (url, method, enableCaching) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url, /*async: */ true);
            if (enableCaching) {
                // TODO: (shivb) ensure that this can be cached
                // xhr.setRequestHeader("Cache-Control", "Public");
            }
            xhr.onload = function (ev) {
                if (xhr.status < 200 || xhr.status >= 300) {
                    reject(_this.handleError(xhr.responseText));
                }
                try {
                    var jsonResponse = JSON.parse(xhr.responseText);
                }
                catch (e) {
                    reject(_this.handleError(xhr.responseText));
                }
                resolve(jsonResponse);
            };
            xhr.onerror = function (ev) {
                reject(xhr.status);
            };
            if (method === "GET") {
                xhr.send();
            }
            else {
                throw "not implemented";
            }
        });
    };
    XhrClient.prototype.handleError = function (responseText) {
        var jsonResponse;
        try {
            jsonResponse = JSON.parse(responseText);
            if (jsonResponse.error) {
                return jsonResponse.error;
            }
            else {
                throw responseText;
            }
        }
        catch (e) {
            return responseText;
        }
    };
    return XhrClient;
}());
exports.XhrClient = XhrClient;
//# sourceMappingURL=XHRClient.js.map

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/* eslint-disable @typescript-eslint/no-var-requires, no-var, import/no-commonjs */

(function () {
    // ============= Angular modules- Start =============
    "use strict";
    if (angular) {
        const Msal = __webpack_require__(11);
        const MsalModule = angular.module("MsalAngular", []);
        
        MsalModule.provider("msalAuthenticationService", function () {
            let _msal = null;
            let _constants = null;
            const _oauthData = { isAuthenticated: false, userName: "", loginError: "", idToken: {} };

            const updateDataFromCache = function (scopes) {
                // only cache lookup here to not interrupt with events
                const cacheResult = _msal.getCachedToken({ scopes: scopes }, _msal.getUser());
                _oauthData.isAuthenticated = cacheResult != null && cacheResult.token !== null && cacheResult.token.length > 0;
                const user = _msal.getUser();
                if (user) {
                    _oauthData.userName = user.name;
                    _oauthData.idToken = user.idToken;
                }

                if (cacheResult && cacheResult.error) {
                    _oauthData.loginError = cacheResult.error;
                }
            };

            this.init = function (configOptions, httpProvider) {
                if (configOptions) {
                    if (!configOptions.optionalParams) {
                        configOptions.optionalParams = {};
                    }

                    configOptions.optionalParams.isAngular = true;

                    if (httpProvider && httpProvider.interceptors) {
                        httpProvider.interceptors.push("ProtectedResourceInterceptor");
                    }

                    // create instance with given config
                    _msal = new Msal.UserAgentApplication(configOptions.clientID, configOptions.authority, configOptions.tokenReceivedCallback, configOptions.optionalParams);
                    if (configOptions.routeProtectionConfig) {
                        _msal.routeProtectionConfig = configOptions.routeProtectionConfig;
                    }
                    else {
                        _msal.routeProtectionConfig = {};
                    }

                    _msal.loginScopes = [_msal.clientId];
                    _constants = Msal.Constants;

                } else {
                    throw new Error("You must set configOptions, when calling init");
                }
                // loginResource is used to set authenticated status
                updateDataFromCache(_msal.loginScopes);
            };

            /*
             * special function that exposes methods in Angular controller
             * $rootScope, $window, $q, $location, $timeout are injected by Angular
             */
            this.$get = ["$rootScope", "$window", "$q", "$location", "$timeout", "$injector", function ($rootScope, $window, $q, $location, $timeout, $injector) {

                const locationChangeHandler = function (event, newUrl, oldUrl) {
                    _msal._logger.info("Location change event from " + oldUrl + " to " + newUrl);
                    if ($location.$$html5) {
                        var hash = $location.hash();
                    }
                    else {
                        var hash = "#" + $location.path();
                    }

                    processHash(hash, event, $window);

                    $timeout(function () {
                        updateDataFromCache(_msal.loginScopes);
                        $rootScope.userInfo = _oauthData;
                    }, 1);
                };

                var processHash = function (hash, event, $window) {

                    if (_msal.isCallback(hash)) {
                        let isPopup = false;
                        let requestInfo = null;
                        let callback = null;
                        // callback can come from popupWindow, iframe or mainWindow
                        if ($window.openedWindows.length > 0 && $window.openedWindows[$window.openedWindows.length - 1].opener
                            && $window.openedWindows[$window.openedWindows.length - 1].opener.msal)
                        {
                            const mainWindow = $window.openedWindows[$window.openedWindows.length - 1].opener;
                            _msal = mainWindow.msal;
                            isPopup = true;
                            requestInfo = _msal.getRequestInfo(hash);
                            if (mainWindow.callBackMappedToRenewStates[requestInfo.stateResponse]) {
                                callback = mainWindow.callBackMappedToRenewStates[requestInfo.stateResponse];
                            }
                        }

                        else if ($window.parent && $window.parent.msal) {
                            _msal = $window.parent.msal;
                            requestInfo = _msal.getRequestInfo(hash);
                            if ($window.parent !== $window && $window.parent.callBackMappedToRenewStates[requestInfo.stateResponse]) {
                                callback = $window.parent.callBackMappedToRenewStates[requestInfo.stateResponse];
                            }
                            else {
                                callback = _msal._tokenReceivedCallback;
                            }
                        }

                        _msal._logger.verbose("Processing the hash: " + hash);
                        _msal.saveTokenFromHash(requestInfo);
                        // Return to callback if it is sent from iframe
                        const token = requestInfo.parameters["access_token"] || requestInfo.parameters["id_token"];
                        const error = requestInfo.parameters["error"];
                        const errorDescription = requestInfo.parameters["error_description"];
                        let tokenType = null;

                        if (requestInfo.stateMatch) {
                            if (requestInfo.requestType === "RENEW_TOKEN") {
                                tokenType = _constants.accessToken;
                                _msal._renewActive = false;

                                /*
                                 * Call within the same context without full page redirect keeps the callback
                                 * id_token or access_token can be renewed
                                 */
                                if ($window.parent === $window && !$window.parent.callBackMappedToRenewStates[requestInfo.stateResponse]) {
                                    if (token) {
                                        $rootScope.$broadcast("msal:acquireTokenSuccess", token);
                                    }
                                    else if (error && errorDescription) {
                                        $rootScope.$broadcast("msal:acquireTokenFailure", errorDescription, error);
                                    }
                                }

                            } else if (requestInfo.requestType === "LOGIN") {
                                tokenType = _constants.idToken;
                                updateDataFromCache(_msal.loginScopes);

                                if (_oauthData.userName) {
                                    $timeout(function () {
                                        // id_token is added as token for the app
                                        updateDataFromCache(_msal.loginScopes);
                                        $rootScope.userInfo = _oauthData;
                                    }, 1);

                                    $rootScope.$broadcast("msal:loginSuccess", token);
                                } else {
                                    $rootScope.$broadcast("msal:loginFailure", errorDescription || _msal._cacheStorage.getItem(_constants.msalErrorDescription), error || _msal._cacheStorage.getItem(_constants.msalError));
                                }

                            }

                            if (callback && typeof callback === "function") {
                                _msal._cacheStorage.clearCookie();
                                callback(errorDescription, token, error, tokenType);
                            }

                            // since this is a token renewal request in iFrame, we don't need to proceed with the location change.
                            if ($window.parent !== $window) {// in iframe
                                if (event && event.preventDefault) {
                                    event.preventDefault();
                                }

                                return;
                            }

                            // redirect to login start page
                            if ($window.parent === $window && !isPopup) {
                                if (_msal._navigateToLoginRequestUrl) {
                                    const loginStartPage = _msal._cacheStorage.getItem(_constants.loginRequest);
                                    if (typeof loginStartPage !== "undefined" && loginStartPage && loginStartPage.length !== 0) {
                                        // prevent the current location change and redirect the user back to the login start page
                                        _msal._logger.verbose("Redirecting to start page: " + loginStartPage);
                                        if (!$location.$$html5 && loginStartPage.indexOf("#") > -1) {
                                            $location.url(loginStartPage.substring(loginStartPage.indexOf("#") + 1));
                                        }

                                        $window.location.href = loginStartPage;
                                    }
                                }
                                else {
                                    // resetting the hash to null
                                    if ($location.$$html5) {
                                        $location.hash("");
                                    }
                                    else {
                                        $location.path("");
                                    }
                                }
                            }
                        }
                        else {
                            // state did not match, broadcast an error
                            $rootScope.$broadcast("msal:stateMismatch", errorDescription, error);
                        }
                    } else {
                        /*
                         * No callback. App resumes after closing or moving to new page.
                         * Check token and username
                         */
                        updateDataFromCache(_msal.loginScopes);
                        if (!_oauthData.isAuthenticated && _oauthData.userName && !_msal._renewActive) {
                            // id_token is expired or not present
                            const self = $injector.get("msalAuthenticationService");
                            self.acquireTokenSilent(_msal.loginScopes).then(function (token) {
                                if (token) {
                                    _oauthData.isAuthenticated = true;
                                }
                            }, function (error) {
                                const errorParts = error.split("|");
                                $rootScope.$broadcast("msal:loginFailure", errorParts[0], errorParts[1]);
                            });
                        }
                    }

                };

                const loginHandler = function (loginStartPage, routeProtectionConfig) {
                    if (loginStartPage !== null) {
                        _msal._cacheStorage.setItem(_constants.angularLoginRequest, loginStartPage);
                    }

                    _msal._logger.info("Start login at:" + loginStartPage !== null ? loginStartPage : window.location.href);
                    $rootScope.$broadcast("msal:loginRedirect");
                    if (routeProtectionConfig.popUp) {
                        _msal.loginPopup(routeProtectionConfig.consentScopes, routeProtectionConfig.extraQueryParameters);
                    }
                    else {
                        _msal.loginRedirect(routeProtectionConfig.consentScopes, routeProtectionConfig.extraQueryParameters);
                    }

                };

                function isUnprotectedResource(url) {
                    if (_msal && _msal._unprotectedResources) {
                        for (let i = 0; i < _msal._unprotectedResources.length; i++) {
                            if (url.indexOf(_msal._unprotectedResources[i]) > -1) {
                                return true;
                            }
                        }
                    }
                    return false;
                }

                function getStates(toState) {
                    let state = null;
                    const states = [];
                    if (toState.hasOwnProperty("parent")) {
                        state = toState;
                        while (state) {
                            states.unshift(state);
                            state = $injector.get("$state").get(state.parent);
                        }
                    }
                    else {
                        const stateNames = toState.name.split(".");
                        for (let i = 0, stateName = stateNames[0]; i < stateNames.length; i++) {
                            state = $injector.get("$state").get(stateName);
                            if (state) {
                                states.push(state);
                            }
                            stateName += "." + stateNames[i + 1];
                        }
                    }
                    return states;
                }

                const routeChangeHandler = function (e, nextRoute) {
                    if (nextRoute && nextRoute.$$route) {
                        const requireLogin = _msal.routeProtectionConfig.requireLogin || nextRoute.$$route.requireLogin;
                        if (requireLogin) {
                            if (!_oauthData.isAuthenticated) {
                                if (!_msal._renewActive && !_msal.loginInProgress()) {
                                    _msal._logger.info("Route change event for:" + $location.$$url);
                                    loginHandler(null, _msal.routeProtectionConfig);
                                }
                            }
                        }
                        else {
                            let nextRouteUrl;
                            if (typeof nextRoute.$$route.templateUrl === "function") {
                                nextRouteUrl = nextRoute.$$route.templateUrl(nextRoute.params);
                            } else {
                                nextRouteUrl = nextRoute.$$route.templateUrl;
                            }
                            if (nextRouteUrl && !isUnprotectedResource(nextRouteUrl)) {
                                _msal._unprotectedResources.push(nextRouteUrl);
                            }
                        }
                    }
                };

                const stateChangeHandler = function (e, toState, toParams) {
                    if (toState) {
                        const states = getStates(toState);
                        let state = null;
                        for (let i = 0; i < states.length; i++) {
                            state = states[i];
                            const requireLogin = _msal.routeProtectionConfig.requireLogin || state.requireLogin;
                            if (requireLogin) {
                                if (!_oauthData.isAuthenticated) {
                                    if (!_msal._renewActive && !_msal.getUser()) {
                                        _msal._logger.info("State change event for:" + $location.$$url);
                                        const $state = $injector.get("$state");
                                        const loginStartPage = $state.href(toState, toParams, { absolute: true });
                                        loginHandler(loginStartPage, _msal.routeProtectionConfig);
                                    }
                                }
                            }
                            else if (state.templateUrl) {
                                var nextStateUrl;
                                if (typeof state.templateUrl === "function") {
                                    nextStateUrl = state.templateUrl(toParams);
                                }
                                else {
                                    nextStateUrl = state.templateUrl;
                                }
                                if (nextStateUrl && !isUnprotectedResource(nextStateUrl)) {
                                    _msal._unprotectedResources.push(nextStateUrl);
                                }
                            }
                        }
                    }
                };

                const stateChangeErrorHandler = function (event, toState, toParams, fromState, fromParams, error) {
                    _msal._logger.verbose("State change error occured. Error: " + typeof (error) === "string" ? error : JSON.stringify(error));
                    /*
                     * msal interceptor sets the error on config.data property. If it is set, it means state change is rejected by msal,
                     * in which case set the defaultPrevented to true to avoid url update as that sometimesleads to infinte loop.
                     */
                    if (error && error.data) {
                        _msal._logger.info("Setting defaultPrevented to true if state change error occured because msal rejected a request. Error: " + error.data);
                        if (event)
                            event.preventDefault();
                    }
                };

                if ($injector.has("$transitions")) {
                    const $transitions = $injector.get("$transitions");

                    function onStartStateChangeHandler(transition) {
                        stateChangeHandler(null, transition.to(), transition.params("to"), transition.from(), transition.params("from"));
                    }

                    function onErrorStateChangeHandler(transition) {
                        stateChangeErrorHandler(null, transition.to(), transition.params("to"), transition.from(), transition.params("from"), transition.error());
                    }

                    $transitions.onStart({}, onStartStateChangeHandler);
                    $transitions.onError({}, onErrorStateChangeHandler);
                }

                // Route change event tracking to receive fragment and also auto renew tokens
                $rootScope.$on("$routeChangeStart", routeChangeHandler);

                $rootScope.$on("$stateChangeStart", stateChangeHandler);

                $rootScope.$on("$locationChangeStart", locationChangeHandler);

                $rootScope.$on("$stateChangeError", stateChangeErrorHandler);

                // Event to track hash change of 
                $window.addEventListener("msal:popUpHashChanged", function (e) {
                    processHash(e.detail, null, $window);
                });

                $window.addEventListener("msal:popUpClosed", function (e) {
                    const errorParts = e.detail.split("|");

                    if (_msal._loginInProgress) {
                        $rootScope.$broadcast("msal:loginFailure", errorParts[0], errorParts[1]);
                        _msal._loginInProgress = false;
                    }
                    else if (_msal._acquireTokenInProgress) {
                        $rootScope.$broadcast("msal:acquireTokenFailure", errorParts[0], errorParts[1]);
                        _msal._acquireTokenInProgress = false;
                    }
                });

                updateDataFromCache(_msal.loginScopes);
                $rootScope.userInfo = _oauthData;

                return {
                    // public methods will be here that are accessible from Controller
                    loginRedirect: function (scopes, extraQueryParameters) {
                        _msal.loginRedirect(scopes, extraQueryParameters);
                    },

                    loginPopup: function (scopes, extraQueryParameters) {
                        const deferred = $q.defer();
                        _msal.loginPopup(scopes, extraQueryParameters).then(function (token) {
                            $rootScope.$broadcast("msal:loginSuccess", token);
                            deferred.resolve(token);
                        }, function (error) {
                            const errorParts = error.split("|");
                            $rootScope.$broadcast("msal:loginFailure", errorParts[0], errorParts[1]);
                            deferred.reject(error);
                        });
                        return deferred.promise;
                    },

                    clearCacheForScope: function (accessToken) {
                        _msal.clearCacheForScope(accessToken);
                    },

                    getAllUsers: function () {
                        return _msal.getAllUsers();
                    },

                    acquireTokenRedirect: function (scopes, authority, user, extraQueryParameters) {
                        const acquireTokenStartPage = _msal._cacheStorage.getItem(_constants.loginRequest);
                        if (window.location.href !== acquireTokenStartPage)
                            _msal._cacheStorage.setItem(_constants.loginRequest, window.location.href);
                        _msal.acquireTokenRedirect(scopes, authority, user, extraQueryParameters);
                    },

                    acquireTokenPopup: function (scopes, authority, user, extraQueryParameters) {
                        const deferred = $q.defer();
                        _msal.acquireTokenPopup(scopes, authority, user, extraQueryParameters).then(function (token) {
                            _msal._renewActive = false;
                            $rootScope.$broadcast("msal:acquireTokenSuccess", token);
                            deferred.resolve(token);
                        }, function (error) {
                            const errorParts = error.split("|");
                            _msal._renewActive = false;
                            $rootScope.$broadcast("msal:acquireTokenFailure", errorParts[0], errorParts[1]);
                            deferred.reject(error);
                        });
                        return deferred.promise;
                    },

                    acquireTokenSilent: function (scopes, authority, user, extraQueryParameters) {
                        const deferred = $q.defer();
                        _msal.acquireTokenSilent(scopes, authority, user, extraQueryParameters).then(function (token) {
                            _msal._renewActive = false;
                            $rootScope.$broadcast("msal:acquireTokenSuccess", token);
                            deferred.resolve(token);
                        }, function (error) {
                            const errorParts = error.split("|");
                            _msal._renewActive = false;
                            $rootScope.$broadcast("msal:acquireTokenFailure", errorParts[0], errorParts[1]);
                            deferred.reject(error);
                        });
                        return deferred.promise;
                    },

                    getUser: function () {
                        return _msal.getUser();
                    },

                    isCallback: function (hash) {
                        return _msal.isCallback(hash);
                    },

                    loginInProgress: function () {
                        return _msal.loginInProgress();
                    },

                    logout: function () {
                        _msal.logout();
                    },

                    userInfo: _oauthData,

                    _getCachedToken: function (scopes) {
                        return _msal.getCachedToken({ scopes: scopes }, _msal.getUser());
                    },

                    _getScopesForEndpoint: function (endpoint) {
                        return _msal.getScopesForEndpoint(endpoint);
                    },

                    _info: function (message) {
                        _msal._logger.info(message);
                    },

                    _verbose: function (message) {
                        _msal._logger.verbose(message);
                    },
                };
            }];
        });

        // Interceptor for http if needed
        MsalModule.factory("ProtectedResourceInterceptor", ["msalAuthenticationService", "$q", "$rootScope", "$templateCache", "$injector", function (authService, $q, $rootScope, $templateCache) {

            return {
                request: function (config) {
                    if (config) {

                        config.headers = config.headers || {};
                        // if the request can be served via templateCache, no need to token
                        if ($templateCache.get(config.url)) return config;
                        const scopes = authService._getScopesForEndpoint(config.url);
                        const routeProtectionConfig = window.msal.routeProtectionConfig;
                        authService._verbose("Url: " + config.url + " maps to scopes: " + scopes);
                        if (scopes === null) {
                            return config;
                        }

                        const cacheResult = authService._getCachedToken(scopes, authService.getUser());
                        if (cacheResult && cacheResult.token) {
                            authService._info("Token is available for this url " + config.url);
                            // check endpoint mapping if provided
                            config.headers.Authorization = "Bearer " + cacheResult.token;
                            return config;
                        }
                        else {
                            // Cancel request if login is starting
                            if (authService.loginInProgress()) {
                                if (routeProtectionConfig && routeProtectionConfig.popUp) {
                                    authService._info("Url: " + config.url + " will be loaded after login is successful");
                                    var delayedRequest = $q.defer();
                                    $rootScope.$on("msal:loginSuccess", function (event, token) {
                                        if (token) {
                                            authService._info("Login completed, sending request for " + config.url);
                                            config.headers.Authorization = "Bearer " + token;
                                            delayedRequest.resolve(config);
                                        }
                                    });
                                    $rootScope.$on("msal:loginFailure", function (event, error) {
                                        if (error) {
                                            config.data = error;
                                            delayedRequest.reject(config);
                                        }
                                    });
                                    return delayedRequest.promise;
                                }
                                else {
                                    authService._info("login is in progress.");
                                    config.data = "login in progress, cancelling the request for " + config.url;
                                    return $q.reject(config);
                                }
                            }
                            else {
                                // delayed request to return after iframe completes
                                var delayedRequest = $q.defer();
                                authService.acquireTokenSilent(scopes).then(function (token) {
                                    authService._verbose("Token is available");
                                    config.headers.Authorization = "Bearer " + token;
                                    delayedRequest.resolve(config);
                                }, function (error) {
                                    config.data = error;
                                    delayedRequest.reject(config);
                                });

                                return delayedRequest.promise;
                            }
                        }
                    }
                },
                responseError: function (rejection) {
                    authService._info("Getting error in the response: " + JSON.stringify(rejection));
                    if (rejection) {
                        if (rejection.status === 401) {
                            const scopes = authService._getScopesForEndpoint(rejection.config.url);
                            const cacheResult = authService._getCachedToken(scopes, authService.getUser());
                            if (cacheResult && cacheResult.token) {
                                authService.clearCacheForScope(cacheResult.token);
                            }
                            $rootScope.$broadcast("msal:notAuthorized", rejection, scopes);
                        }
                        else {
                            $rootScope.$broadcast("msal:errorResponse", rejection);
                        }

                        return $q.reject(rejection);
                    }
                }
            };
        }]);
    } else {
        console.error("Angular.JS is not included");
    }
	
    if ( true && module.exports) {
        module.exports = "MsalAngular";
    }
	
}());


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var UserAgentApplication_1 = __webpack_require__(12);
exports.UserAgentApplication = UserAgentApplication_1.UserAgentApplication;
var Logger_1 = __webpack_require__(4);
exports.Logger = Logger_1.Logger;
var Logger_2 = __webpack_require__(4);
exports.LogLevel = Logger_2.LogLevel;
var User_1 = __webpack_require__(7);
exports.User = User_1.User;
var Constants_1 = __webpack_require__(1);
exports.Constants = Constants_1.Constants;
var RequestInfo_1 = __webpack_require__(6);
exports.TokenResponse = RequestInfo_1.TokenResponse;
var Authority_1 = __webpack_require__(2);
exports.Authority = Authority_1.Authority;
//# sourceMappingURL=index.js.map

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(3);
var AccessTokenKey_1 = __webpack_require__(13);
var AccessTokenValue_1 = __webpack_require__(14);
var AuthenticationRequestParameters_1 = __webpack_require__(15);
var ClientInfo_1 = __webpack_require__(16);
var Constants_1 = __webpack_require__(1);
var IdToken_1 = __webpack_require__(17);
var Logger_1 = __webpack_require__(4);
var Storage_1 = __webpack_require__(18);
var RequestInfo_1 = __webpack_require__(6);
var User_1 = __webpack_require__(7);
var Utils_1 = __webpack_require__(0);
var AuthorityFactory_1 = __webpack_require__(20);
/*
 * @hidden
 */
var ResponseTypes = {
    id_token: "id_token",
    token: "token",
    id_token_token: "id_token token"
};
var resolveTokenOnlyIfOutOfIframe = function (target, propertyKey, descriptor) {
    var tokenAcquisitionMethod = descriptor.value;
    descriptor.value = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return this.isInIframe()
            ? new Promise(function () {
                return;
            })
            : tokenAcquisitionMethod.apply(this, args);
    };
    return descriptor;
};
var UserAgentApplication = /** @class */ (function () {
    /*
     * Initialize a UserAgentApplication with a given clientId and authority.
     * @constructor
     * @param {string} clientId - The clientID of your application, you should get this from the application registration portal.
     * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
     * - In Azure AD, it is of the form https://&lt;instance>/&lt;tenant&gt;,\ where &lt;instance&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
     * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenantId&gt;/&lt;policyName&gt;/
     * - Default value is: "https://login.microsoftonline.com/common"
     * @param _tokenReceivedCallback -  The function that will get the call back once this API is completed (either successfully or with a failure).
     * @param {boolean} validateAuthority -  boolean to turn authority validation on/off.
     */
    function UserAgentApplication(clientId, authority, tokenReceivedCallback, options) {
        if (options === void 0) { options = {}; }
        /*
         * @hidden
         */
        this._cacheLocations = {
            localStorage: "localStorage",
            sessionStorage: "sessionStorage"
        };
        /*
         * @hidden
         */
        this._clockSkew = 300;
        /*
         * @hidden
         */
        this._tokenReceivedCallback = null;
        this._isAngular = false;
        var _a = options.validateAuthority, validateAuthority = _a === void 0 ? true : _a, _b = options.cacheLocation, cacheLocation = _b === void 0 ? "sessionStorage" : _b, _c = options.redirectUri, redirectUri = _c === void 0 ? function () { return window.location.href.split("?")[0].split("#")[0]; } : _c, _d = options.postLogoutRedirectUri, postLogoutRedirectUri = _d === void 0 ? function () { return window.location.href.split("?")[0].split("#")[0]; } : _d, _e = options.logger, logger = _e === void 0 ? new Logger_1.Logger(null) : _e, _f = options.loadFrameTimeout, loadFrameTimeout = _f === void 0 ? 6000 : _f, _g = options.navigateToLoginRequestUrl, navigateToLoginRequestUrl = _g === void 0 ? true : _g, _h = options.state, state = _h === void 0 ? "" : _h, _j = options.isAngular, isAngular = _j === void 0 ? false : _j, _k = options.unprotectedResources, unprotectedResources = _k === void 0 ? new Array() : _k, _l = options.protectedResourceMap, protectedResourceMap = _l === void 0 ? new Map() : _l, _m = options.storeAuthStateInCookie, storeAuthStateInCookie = _m === void 0 ? false : _m;
        this.loadFrameTimeout = loadFrameTimeout;
        this.clientId = clientId;
        this.validateAuthority = validateAuthority;
        this.authority = authority || "https://login.microsoftonline.com/common";
        this._tokenReceivedCallback = tokenReceivedCallback;
        this._redirectUri = redirectUri;
        this._postLogoutredirectUri = postLogoutRedirectUri;
        this._loginInProgress = false;
        this._acquireTokenInProgress = false;
        this._cacheLocation = cacheLocation;
        this._navigateToLoginRequestUrl = navigateToLoginRequestUrl;
        this._state = state;
        this._isAngular = isAngular;
        this._unprotectedResources = unprotectedResources;
        this._protectedResourceMap = protectedResourceMap;
        if (!this._cacheLocations[cacheLocation]) {
            throw new Error("Cache Location is not valid. Provided value:" + this._cacheLocation + ".Possible values are: " + this._cacheLocations.localStorage + ", " + this._cacheLocations.sessionStorage);
        }
        this._cacheStorage = new Storage_1.Storage(this._cacheLocation); //cache keys msal
        this._logger = logger;
        this.storeAuthStateInCookie = storeAuthStateInCookie;
        window.openedWindows = [];
        window.activeRenewals = {};
        window.renewStates = [];
        window.callBackMappedToRenewStates = {};
        window.callBacksMappedToRenewStates = {};
        window.msal = this;
        var urlHash = window.location.hash;
        var isCallback = this.isCallback(urlHash);
        if (!this._isAngular) {
            if (isCallback) {
                this.handleAuthenticationResponse.call(this, urlHash);
            }
            else {
                var pendingCallback = this._cacheStorage.getItem(Constants_1.Constants.urlHash);
                if (pendingCallback) {
                    this.processCallBack(pendingCallback);
                }
            }
        }
    }
    Object.defineProperty(UserAgentApplication.prototype, "cacheLocation", {
        /*
         * Used to get the cache location
         */
        get: function () {
            return this._cacheLocation;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UserAgentApplication.prototype, "authority", {
        /*
         * Used to get the authority.
         */
        get: function () {
            return this.authorityInstance.CanonicalAuthority;
        },
        /*
         * Used to set the authority.
         * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
         * - In Azure AD, it is of the form https://&lt;tenant&gt;/&lt;tenant&gt;, where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
         * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/<policyName>/
         * - Default value is: "https://login.microsoftonline.com/common"
         */
        set: function (val) {
            this.authorityInstance = AuthorityFactory_1.AuthorityFactory.CreateInstance(val, this.validateAuthority);
        },
        enumerable: true,
        configurable: true
    });
    /*
     * Used to call the constructor callback with the token/error
     * @param {string} [hash=window.location.hash] - Hash fragment of Url.
     * @hidden
     */
    UserAgentApplication.prototype.processCallBack = function (hash) {
        this._logger.info("Processing the callback from redirect response");
        var requestInfo = this.getRequestInfo(hash);
        this.saveTokenFromHash(requestInfo);
        var token = requestInfo.parameters[Constants_1.Constants.accessToken] || requestInfo.parameters[Constants_1.Constants.idToken];
        var errorDesc = requestInfo.parameters[Constants_1.Constants.errorDescription];
        var error = requestInfo.parameters[Constants_1.Constants.error];
        var tokenType;
        if (requestInfo.parameters[Constants_1.Constants.accessToken]) {
            tokenType = Constants_1.Constants.accessToken;
        }
        else {
            tokenType = Constants_1.Constants.idToken;
        }
        this._cacheStorage.removeItem(Constants_1.Constants.urlHash);
        try {
            if (this._tokenReceivedCallback) {
                this._cacheStorage.clearCookie();
                this._tokenReceivedCallback.call(this, errorDesc, token, error, tokenType, this.getUserState(this._cacheStorage.getItem(Constants_1.Constants.stateLogin, this.storeAuthStateInCookie)));
            }
        }
        catch (err) {
            this._logger.error("Error occurred in token received callback function: " + err);
        }
    };
    /*
     * Used to get the redirect uri. Evaluates redirectUri if its a function, otherwise simply returns its value.
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.getRedirectUri = function () {
        if (typeof this._redirectUri === "function") {
            return this._redirectUri();
        }
        return this._redirectUri;
    };
    /*
     * Used to get the post logout redirect uri. Evaluates postLogoutredirectUri if its a function, otherwise simply returns its value.
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.getPostLogoutRedirectUri = function () {
        if (typeof this._postLogoutredirectUri === "function") {
            return this._postLogoutredirectUri();
        }
        return this._postLogoutredirectUri;
    };
    /*
     * Initiate the login process by redirecting the user to the STS authorization endpoint.
     * @param {Array.<string>} scopes - Permissions you want included in the access token. Not all scopes are guaranteed to be included in the access token returned.
     * @param {string} extraQueryParameters - Key-value pairs to pass to the authentication server during the interactive authentication flow.
     */
    UserAgentApplication.prototype.loginRedirect = function (scopes, extraQueryParameters) {
        var _this = this;
        /*
        1. Create navigate url
        2. saves value in cache
        3. redirect user to AAD
         */
        if (this._loginInProgress) {
            if (this._tokenReceivedCallback) {
                this._tokenReceivedCallback(Constants_1.ErrorDescription.loginProgressError, null, Constants_1.ErrorCodes.loginProgressError, Constants_1.Constants.idToken, this.getUserState(this._cacheStorage.getItem(Constants_1.Constants.stateLogin, this.storeAuthStateInCookie)));
                return;
            }
        }
        if (scopes) {
            var isValidScope = this.validateInputScope(scopes);
            if (isValidScope && !Utils_1.Utils.isEmpty(isValidScope)) {
                if (this._tokenReceivedCallback) {
                    this._tokenReceivedCallback(Constants_1.ErrorDescription.inputScopesError, null, Constants_1.ErrorCodes.inputScopesError, Constants_1.Constants.idToken, this.getUserState(this._cacheStorage.getItem(Constants_1.Constants.stateLogin, this.storeAuthStateInCookie)));
                    return;
                }
            }
            scopes = this.filterScopes(scopes);
        }
        var idTokenObject;
        idTokenObject = this.extractADALIdToken();
        if (idTokenObject && !scopes) {
            this._logger.info("ADAL's idToken exists. Extracting login information from ADAL's idToken ");
            extraQueryParameters = Utils_1.Utils.constructUnifiedCacheExtraQueryParameter(idTokenObject, extraQueryParameters);
            this._silentLogin = true;
            this.acquireTokenSilent([this.clientId], this.authority, this.getUser(), extraQueryParameters)
                .then(function (idToken) {
                _this._silentLogin = false;
                _this._logger.info("Unified cache call is successful");
                if (_this._tokenReceivedCallback) {
                    _this._tokenReceivedCallback.call(_this, null, idToken, null, Constants_1.Constants.idToken, _this.getUserState(_this._silentAuthenticationState));
                }
            }, function (error) {
                _this._silentLogin = false;
                _this._logger.error("Error occurred during unified cache ATS");
                _this.loginRedirectHelper(scopes, extraQueryParameters);
            });
        }
        else {
            this.loginRedirectHelper(scopes, extraQueryParameters);
        }
    };
    UserAgentApplication.prototype.loginRedirectHelper = function (scopes, extraQueryParameters) {
        var _this = this;
        this._loginInProgress = true;
        this.authorityInstance.ResolveEndpointsAsync()
            .then(function () {
            var authenticationRequest = new AuthenticationRequestParameters_1.AuthenticationRequestParameters(_this.authorityInstance, _this.clientId, scopes, ResponseTypes.id_token, _this.getRedirectUri(), _this._state);
            if (extraQueryParameters) {
                authenticationRequest.extraQueryParameters = extraQueryParameters;
            }
            var loginStartPage = _this._cacheStorage.getItem(Constants_1.Constants.angularLoginRequest);
            if (!loginStartPage || loginStartPage === "") {
                loginStartPage = window.location.href;
            }
            else {
                _this._cacheStorage.setItem(Constants_1.Constants.angularLoginRequest, "");
            }
            _this._cacheStorage.setItem(Constants_1.Constants.loginRequest, loginStartPage, _this.storeAuthStateInCookie);
            _this._cacheStorage.setItem(Constants_1.Constants.loginError, "");
            _this._cacheStorage.setItem(Constants_1.Constants.stateLogin, authenticationRequest.state, _this.storeAuthStateInCookie);
            _this._cacheStorage.setItem(Constants_1.Constants.nonceIdToken, authenticationRequest.nonce, _this.storeAuthStateInCookie);
            _this._cacheStorage.setItem(Constants_1.Constants.msalError, "");
            _this._cacheStorage.setItem(Constants_1.Constants.msalErrorDescription, "");
            var authorityKey = Constants_1.Constants.authority + Constants_1.Constants.resourceDelimeter + authenticationRequest.state;
            _this._cacheStorage.setItem(authorityKey, _this.authority, _this.storeAuthStateInCookie);
            var urlNavigate = authenticationRequest.createNavigateUrl(scopes) + Constants_1.Constants.response_mode_fragment;
            _this.promptUser(urlNavigate);
        });
    };
    /*
     * Initiate the login process by opening a popup window.
     * @param {Array.<string>} scopes - Permissions you want included in the access token. Not all scopes are  guaranteed to be included in the access token returned.
     * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the interactive authentication flow.
     * @returns {Promise.<string>} - A Promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the token or error.
     */
    UserAgentApplication.prototype.loginPopup = function (scopes, extraQueryParameters) {
        var _this = this;
        /*
        1. Create navigate url
        2. saves value in cache
        3. redirect user to AAD
         */
        return new Promise(function (resolve, reject) {
            if (_this._loginInProgress) {
                reject(Constants_1.ErrorCodes.loginProgressError + Constants_1.Constants.resourceDelimeter + Constants_1.ErrorDescription.loginProgressError);
                return;
            }
            if (scopes) {
                var isValidScope = _this.validateInputScope(scopes);
                if (isValidScope && !Utils_1.Utils.isEmpty(isValidScope)) {
                    reject(Constants_1.ErrorCodes.inputScopesError + Constants_1.Constants.resourceDelimeter + Constants_1.ErrorDescription.inputScopesError);
                    return;
                }
                scopes = _this.filterScopes(scopes);
            }
            var idTokenObject;
            idTokenObject = _this.extractADALIdToken();
            if (idTokenObject && !scopes) {
                _this._logger.info("ADAL's idToken exists. Extracting login information from ADAL's idToken ");
                extraQueryParameters = Utils_1.Utils.constructUnifiedCacheExtraQueryParameter(idTokenObject, extraQueryParameters);
                _this._silentLogin = true;
                _this.acquireTokenSilent([_this.clientId], _this.authority, _this.getUser(), extraQueryParameters)
                    .then(function (idToken) {
                    _this._silentLogin = false;
                    _this._logger.info("Unified cache call is successful");
                    resolve(idToken);
                }, function (error) {
                    _this._silentLogin = false;
                    _this._logger.error("Error occurred during unified cache ATS");
                    _this.loginPopupHelper(resolve, reject, scopes, extraQueryParameters);
                });
            }
            else {
                _this.loginPopupHelper(resolve, reject, scopes, extraQueryParameters);
            }
        });
    };
    UserAgentApplication.prototype.loginPopupHelper = function (resolve, reject, scopes, extraQueryParameters) {
        var _this = this;
        //TODO why this is needed only for loginpopup
        if (!scopes) {
            scopes = [this.clientId];
        }
        var scope = scopes.join(" ").toLowerCase();
        var popUpWindow = this.openWindow("about:blank", "_blank", 1, this, resolve, reject);
        if (!popUpWindow) {
            return;
        }
        this._loginInProgress = true;
        this.authorityInstance.ResolveEndpointsAsync().then(function () {
            var authenticationRequest = new AuthenticationRequestParameters_1.AuthenticationRequestParameters(_this.authorityInstance, _this.clientId, scopes, ResponseTypes.id_token, _this.getRedirectUri(), _this._state);
            if (extraQueryParameters) {
                authenticationRequest.extraQueryParameters = extraQueryParameters;
            }
            _this._cacheStorage.setItem(Constants_1.Constants.loginRequest, window.location.href, _this.storeAuthStateInCookie);
            _this._cacheStorage.setItem(Constants_1.Constants.loginError, "");
            _this._cacheStorage.setItem(Constants_1.Constants.nonceIdToken, authenticationRequest.nonce, _this.storeAuthStateInCookie);
            _this._cacheStorage.setItem(Constants_1.Constants.msalError, "");
            _this._cacheStorage.setItem(Constants_1.Constants.msalErrorDescription, "");
            var authorityKey = Constants_1.Constants.authority + Constants_1.Constants.resourceDelimeter + authenticationRequest.state;
            _this._cacheStorage.setItem(authorityKey, _this.authority, _this.storeAuthStateInCookie);
            var urlNavigate = authenticationRequest.createNavigateUrl(scopes) + Constants_1.Constants.response_mode_fragment;
            window.renewStates.push(authenticationRequest.state);
            window.requestType = Constants_1.Constants.login;
            _this.registerCallback(authenticationRequest.state, scope, resolve, reject);
            if (popUpWindow) {
                _this._logger.infoPii("Navigated Popup window to:" + urlNavigate);
                popUpWindow.location.href = urlNavigate;
            }
        }, function () {
            _this._logger.info(Constants_1.ErrorCodes.endpointResolutionError + ":" + Constants_1.ErrorDescription.endpointResolutionError);
            _this._cacheStorage.setItem(Constants_1.Constants.msalError, Constants_1.ErrorCodes.endpointResolutionError);
            _this._cacheStorage.setItem(Constants_1.Constants.msalErrorDescription, Constants_1.ErrorDescription.endpointResolutionError);
            if (reject) {
                reject(Constants_1.ErrorCodes.endpointResolutionError + ":" + Constants_1.ErrorDescription.endpointResolutionError);
            }
            if (popUpWindow) {
                popUpWindow.close();
            }
        }).catch(function (err) {
            _this._logger.warning("could not resolve endpoints");
            reject(err);
        });
    };
    /*
      * Used to redirect the browser to the STS authorization endpoint
      * @param {string} urlNavigate - URL of the authorization endpoint
      * @hidden
      */
    UserAgentApplication.prototype.promptUser = function (urlNavigate) {
        if (urlNavigate && !Utils_1.Utils.isEmpty(urlNavigate)) {
            this._logger.infoPii("Navigate to:" + urlNavigate);
            window.location.replace(urlNavigate);
        }
        else {
            this._logger.info("Navigate url is empty");
        }
    };
    /*
     * Used to send the user to the redirect_uri after authentication is complete. The user"s bearer token is attached to the URI fragment as an id_token/access_token field.
     * This function also closes the popup window after redirection.
     * @hidden
     * @ignore
     */
    UserAgentApplication.prototype.openWindow = function (urlNavigate, title, interval, instance, resolve, reject) {
        var _this = this;
        var popupWindow = this.openPopup(urlNavigate, title, Constants_1.Constants.popUpWidth, Constants_1.Constants.popUpHeight);
        if (popupWindow == null) {
            instance._loginInProgress = false;
            instance._acquireTokenInProgress = false;
            this._logger.info(Constants_1.ErrorCodes.popUpWindowError + ":" + Constants_1.ErrorDescription.popUpWindowError);
            this._cacheStorage.setItem(Constants_1.Constants.msalError, Constants_1.ErrorCodes.popUpWindowError);
            this._cacheStorage.setItem(Constants_1.Constants.msalErrorDescription, Constants_1.ErrorDescription.popUpWindowError);
            if (reject) {
                reject(Constants_1.ErrorCodes.popUpWindowError + Constants_1.Constants.resourceDelimeter + Constants_1.ErrorDescription.popUpWindowError);
            }
            return null;
        }
        window.openedWindows.push(popupWindow);
        var pollTimer = window.setInterval(function () {
            if (popupWindow && popupWindow.closed && instance._loginInProgress) {
                if (reject) {
                    reject(Constants_1.ErrorCodes.userCancelledError + Constants_1.Constants.resourceDelimeter + Constants_1.ErrorDescription.userCancelledError);
                }
                window.clearInterval(pollTimer);
                if (_this._isAngular) {
                    _this.broadcast("msal:popUpClosed", Constants_1.ErrorCodes.userCancelledError + Constants_1.Constants.resourceDelimeter + Constants_1.ErrorDescription.userCancelledError);
                    return;
                }
                instance._loginInProgress = false;
                instance._acquireTokenInProgress = false;
            }
            try {
                var popUpWindowLocation = popupWindow.location;
                if (popUpWindowLocation.href.indexOf(_this.getRedirectUri()) !== -1) {
                    window.clearInterval(pollTimer);
                    instance._loginInProgress = false;
                    instance._acquireTokenInProgress = false;
                    _this._logger.info("Closing popup window");
                    if (_this._isAngular) {
                        _this.broadcast("msal:popUpHashChanged", popUpWindowLocation.hash);
                        for (var i = 0; i < window.openedWindows.length; i++) {
                            window.openedWindows[i].close();
                        }
                    }
                }
            }
            catch (e) {
                //Cross Domain url check error. Will be thrown until AAD redirects the user back to the app"s root page with the token. No need to log or throw this error as it will create unnecessary traffic.
            }
        }, interval);
        return popupWindow;
    };
    UserAgentApplication.prototype.broadcast = function (eventName, data) {
        var evt = new CustomEvent(eventName, { detail: data });
        window.dispatchEvent(evt);
    };
    /*
     * Used to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Defaults behaviour is to redirect the user to `window.location.href`.
     */
    UserAgentApplication.prototype.logout = function () {
        this.clearCache();
        this._user = null;
        var logout = "";
        if (this.getPostLogoutRedirectUri()) {
            logout = "post_logout_redirect_uri=" + encodeURIComponent(this.getPostLogoutRedirectUri());
        }
        var urlNavigate = this.authority + "/oauth2/v2.0/logout?" + logout;
        this.promptUser(urlNavigate);
    };
    /*
     * Used to configure the popup window for login.
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.clearCache = function () {
        window.renewStates = [];
        var accessTokenItems = this._cacheStorage.getAllAccessTokens(Constants_1.Constants.clientId, Constants_1.Constants.userIdentifier);
        for (var i = 0; i < accessTokenItems.length; i++) {
            this._cacheStorage.removeItem(JSON.stringify(accessTokenItems[i].key));
        }
        this._cacheStorage.resetCacheItems();
        this._cacheStorage.clearCookie();
    };
    UserAgentApplication.prototype.clearCacheForScope = function (accessToken) {
        var accessTokenItems = this._cacheStorage.getAllAccessTokens(Constants_1.Constants.clientId, Constants_1.Constants.userIdentifier);
        for (var i = 0; i < accessTokenItems.length; i++) {
            var token = accessTokenItems[i];
            if (token.value.accessToken === accessToken) {
                this._cacheStorage.removeItem(JSON.stringify(token.key));
            }
        }
    };
    /*
     * Configures popup window for login.
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.openPopup = function (urlNavigate, title, popUpWidth, popUpHeight) {
        try {
            /*
             * adding winLeft and winTop to account for dual monitor
             * using screenLeft and screenTop for IE8 and earlier
             */
            var winLeft = window.screenLeft ? window.screenLeft : window.screenX;
            var winTop = window.screenTop ? window.screenTop : window.screenY;
            /*
             * window.innerWidth displays browser window"s height and width excluding toolbars
             * using document.documentElement.clientWidth for IE8 and earlier
             */
            var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
            var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
            var left = ((width / 2) - (popUpWidth / 2)) + winLeft;
            var top_1 = ((height / 2) - (popUpHeight / 2)) + winTop;
            var popupWindow = window.open(urlNavigate, title, "width=" + popUpWidth + ", height=" + popUpHeight + ", top=" + top_1 + ", left=" + left);
            if (popupWindow.focus) {
                popupWindow.focus();
            }
            return popupWindow;
        }
        catch (e) {
            this._logger.error("error opening popup " + e.message);
            this._loginInProgress = false;
            this._acquireTokenInProgress = false;
            return null;
        }
    };
    /*
     * Used to validate the scopes input parameter requested  by the developer.
     * @param {Array<string>} scopes - Developer requested permissions. Not all scopes are guaranteed to be included in the access token returned.
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.validateInputScope = function (scopes) {
        if (!scopes || scopes.length < 1) {
            return "Scopes cannot be passed as an empty array";
        }
        if (!Array.isArray(scopes)) {
            throw new Error("API does not accept non-array scopes");
        }
        if (scopes.indexOf(this.clientId) > -1) {
            if (scopes.length > 1) {
                return "ClientId can only be provided as a single scope";
            }
        }
        return "";
    };
    /*
      * Used to remove openid and profile from the list of scopes passed by the developer.These scopes are added by default
      * @hidden
      */
    UserAgentApplication.prototype.filterScopes = function (scopes) {
        scopes = scopes.filter(function (element) {
            return element !== "openid";
        });
        scopes = scopes.filter(function (element) {
            return element !== "profile";
        });
        return scopes;
    };
    /*
     * Used to add the developer requested callback to the array of callbacks for the specified scopes. The updated array is stored on the window object
     * @param {string} scope - Developer requested permissions. Not all scopes are guaranteed to be included in the access token returned.
     * @param {string} expectedState - Unique state identifier (guid).
     * @param {Function} resolve - The resolve function of the promise object.
     * @param {Function} reject - The reject function of the promise object.
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.registerCallback = function (expectedState, scope, resolve, reject) {
        var _this = this;
        window.activeRenewals[scope] = expectedState;
        if (!window.callBacksMappedToRenewStates[expectedState]) {
            window.callBacksMappedToRenewStates[expectedState] = [];
        }
        window.callBacksMappedToRenewStates[expectedState].push({ resolve: resolve, reject: reject });
        if (!window.callBackMappedToRenewStates[expectedState]) {
            window.callBackMappedToRenewStates[expectedState] =
                function (errorDesc, token, error, tokenType) {
                    window.activeRenewals[scope] = null;
                    for (var i = 0; i < window.callBacksMappedToRenewStates[expectedState].length; ++i) {
                        try {
                            if (errorDesc || error) {
                                window.callBacksMappedToRenewStates[expectedState][i].reject(errorDesc + Constants_1.Constants.resourceDelimeter + error);
                            }
                            else if (token) {
                                window.callBacksMappedToRenewStates[expectedState][i].resolve(token);
                            }
                        }
                        catch (e) {
                            _this._logger.warning(e);
                        }
                    }
                    window.callBacksMappedToRenewStates[expectedState] = null;
                    window.callBackMappedToRenewStates[expectedState] = null;
                };
        }
    };
    UserAgentApplication.prototype.getCachedTokenInternal = function (scopes, user) {
        var userObject = user ? user : this.getUser();
        if (!userObject) {
            return null;
        }
        var authenticationRequest;
        var newAuthority = this.authorityInstance ? this.authorityInstance : AuthorityFactory_1.AuthorityFactory.CreateInstance(this.authority, this.validateAuthority);
        if (Utils_1.Utils.compareObjects(userObject, this.getUser())) {
            if (scopes.indexOf(this.clientId) > -1) {
                authenticationRequest = new AuthenticationRequestParameters_1.AuthenticationRequestParameters(newAuthority, this.clientId, scopes, ResponseTypes.id_token, this.getRedirectUri(), this._state);
            }
            else {
                authenticationRequest = new AuthenticationRequestParameters_1.AuthenticationRequestParameters(newAuthority, this.clientId, scopes, ResponseTypes.token, this.getRedirectUri(), this._state);
            }
        }
        else {
            authenticationRequest = new AuthenticationRequestParameters_1.AuthenticationRequestParameters(newAuthority, this.clientId, scopes, ResponseTypes.id_token_token, this.getRedirectUri(), this._state);
        }
        return this.getCachedToken(authenticationRequest, user);
    };
    /*
     * Used to get token for the specified set of scopes from the cache
     * @param {AuthenticationRequestParameters} authenticationRequest - Request sent to the STS to obtain an id_token/access_token
     * @param {User} user - User for which the scopes were requested
     * @hidden
     */
    UserAgentApplication.prototype.getCachedToken = function (authenticationRequest, user) {
        var accessTokenCacheItem = null;
        var scopes = authenticationRequest.scopes;
        var tokenCacheItems = this._cacheStorage.getAllAccessTokens(this.clientId, user ? user.userIdentifier : null); //filter by clientId and user
        if (tokenCacheItems.length === 0) { // No match found after initial filtering
            return null;
        }
        var filteredItems = [];
        //if no authority passed
        if (!authenticationRequest.authority) {
            //filter by scope
            for (var i = 0; i < tokenCacheItems.length; i++) {
                var cacheItem = tokenCacheItems[i];
                var cachedScopes = cacheItem.key.scopes.split(" ");
                if (Utils_1.Utils.containsScope(cachedScopes, scopes)) {
                    filteredItems.push(cacheItem);
                }
            }
            //if only one cached token found
            if (filteredItems.length === 1) {
                accessTokenCacheItem = filteredItems[0];
                authenticationRequest.authorityInstance = AuthorityFactory_1.AuthorityFactory.CreateInstance(accessTokenCacheItem.key.authority, this.validateAuthority);
            }
            else if (filteredItems.length > 1) {
                return {
                    errorDesc: "The cache contains multiple tokens satisfying the requirements. Call AcquireToken again providing more requirements like authority",
                    token: null,
                    error: "multiple_matching_tokens_detected"
                };
            }
            else {
                //no match found. check if there was a single authority used
                var authorityList = this.getUniqueAuthority(tokenCacheItems, "authority");
                if (authorityList.length > 1) {
                    return {
                        errorDesc: "Multiple authorities found in the cache. Pass authority in the API overload.",
                        token: null,
                        error: "multiple_matching_tokens_detected"
                    };
                }
                authenticationRequest.authorityInstance = AuthorityFactory_1.AuthorityFactory.CreateInstance(authorityList[0], this.validateAuthority);
            }
        }
        else {
            //authority was passed in the API, filter by authority and scope
            for (var i = 0; i < tokenCacheItems.length; i++) {
                var cacheItem = tokenCacheItems[i];
                var cachedScopes = cacheItem.key.scopes.split(" ");
                if (Utils_1.Utils.containsScope(cachedScopes, scopes) && cacheItem.key.authority === authenticationRequest.authority) {
                    filteredItems.push(cacheItem);
                }
            }
            //no match
            if (filteredItems.length === 0) {
                return null;
            }
            //only one cachedToken Found
            else if (filteredItems.length === 1) {
                accessTokenCacheItem = filteredItems[0];
            }
            else {
                //more than one match found.
                return {
                    errorDesc: "The cache contains multiple tokens satisfying the requirements.Call AcquireToken again providing more requirements like authority",
                    token: null,
                    error: "multiple_matching_tokens_detected"
                };
            }
        }
        if (accessTokenCacheItem != null) {
            var expired = Number(accessTokenCacheItem.value.expiresIn);
            // If expiration is within offset, it will force renew
            var offset = this._clockSkew || 300;
            if (expired && (expired > Utils_1.Utils.now() + offset)) {
                return {
                    errorDesc: null,
                    token: accessTokenCacheItem.value.accessToken,
                    error: null
                };
            }
            else {
                this._cacheStorage.removeItem(JSON.stringify(filteredItems[0].key));
                return null;
            }
        }
        else {
            return null;
        }
    };
    /*
     * Used to filter all cached items and return a list of unique users based on userIdentifier.
     * @param {Array<User>} Users - users saved in the cache.
     */
    UserAgentApplication.prototype.getAllUsers = function () {
        var users = [];
        var accessTokenCacheItems = this._cacheStorage.getAllAccessTokens(Constants_1.Constants.clientId, Constants_1.Constants.userIdentifier);
        for (var i = 0; i < accessTokenCacheItems.length; i++) {
            var idToken = new IdToken_1.IdToken(accessTokenCacheItems[i].value.idToken);
            var clientInfo = new ClientInfo_1.ClientInfo(accessTokenCacheItems[i].value.clientInfo);
            var user = User_1.User.createUser(idToken, clientInfo);
            users.push(user);
        }
        return this.getUniqueUsers(users);
    };
    /*
     * Used to filter users based on userIdentifier
     * @param {Array<User>}  Users - users saved in the cache
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.getUniqueUsers = function (users) {
        if (!users || users.length <= 1) {
            return users;
        }
        var flags = [];
        var uniqueUsers = [];
        for (var index = 0; index < users.length; ++index) {
            if (users[index].userIdentifier && flags.indexOf(users[index].userIdentifier) === -1) {
                flags.push(users[index].userIdentifier);
                uniqueUsers.push(users[index]);
            }
        }
        return uniqueUsers;
    };
    /*
    * Used to get a unique list of authoritues from the cache
    * @param {Array<AccessTokenCacheItem>}  accessTokenCacheItems - accessTokenCacheItems saved in the cache
    * @ignore
    * @hidden
    */
    UserAgentApplication.prototype.getUniqueAuthority = function (accessTokenCacheItems, property) {
        var authorityList = [];
        var flags = [];
        accessTokenCacheItems.forEach(function (element) {
            if (element.key.hasOwnProperty(property) && (flags.indexOf(element.key[property]) === -1)) {
                flags.push(element.key[property]);
                authorityList.push(element.key[property]);
            }
        });
        return authorityList;
    };
    /*
     * Adds login_hint to authorization URL which is used to pre-fill the username field of sign in page for the user if known ahead of time
     * domain_hint can be one of users/organisations which when added skips the email based discovery process of the user
     * domain_req utid received as part of the clientInfo
     * login_req uid received as part of clientInfo
     * @param {string} urlNavigate - Authentication request url
     * @param {User} user - User for which the token is requested
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.addHintParameters = function (urlNavigate, user) {
        var userObject = user ? user : this.getUser();
        if (userObject) {
            var decodedClientInfo = userObject.userIdentifier.split(".");
            var uid = Utils_1.Utils.base64DecodeStringUrlSafe(decodedClientInfo[0]);
            var utid = Utils_1.Utils.base64DecodeStringUrlSafe(decodedClientInfo[1]);
            if (userObject.sid && urlNavigate.indexOf(Constants_1.Constants.prompt_none) !== -1) {
                if (!this.urlContainsQueryStringParameter(Constants_1.Constants.sid, urlNavigate) && !this.urlContainsQueryStringParameter(Constants_1.Constants.login_hint, urlNavigate)) {
                    urlNavigate += "&" + Constants_1.Constants.sid + "=" + encodeURIComponent(userObject.sid);
                }
            }
            else {
                if (!this.urlContainsQueryStringParameter(Constants_1.Constants.login_hint, urlNavigate) && userObject.displayableId && !Utils_1.Utils.isEmpty(userObject.displayableId)) {
                    urlNavigate += "&" + Constants_1.Constants.login_hint + "=" + encodeURIComponent(userObject.displayableId);
                }
            }
            if (!Utils_1.Utils.isEmpty(uid) && !Utils_1.Utils.isEmpty(utid)) {
                if (!this.urlContainsQueryStringParameter("domain_req", urlNavigate) && !Utils_1.Utils.isEmpty(utid)) {
                    urlNavigate += "&domain_req=" + encodeURIComponent(utid);
                }
                if (!this.urlContainsQueryStringParameter("login_req", urlNavigate) && !Utils_1.Utils.isEmpty(uid)) {
                    urlNavigate += "&login_req=" + encodeURIComponent(uid);
                }
            }
            if (!this.urlContainsQueryStringParameter(Constants_1.Constants.domain_hint, urlNavigate) && !Utils_1.Utils.isEmpty(utid)) {
                if (utid === Constants_1.Constants.consumersUtid) {
                    urlNavigate += "&" + Constants_1.Constants.domain_hint + "=" + encodeURIComponent(Constants_1.Constants.consumers);
                }
                else {
                    urlNavigate += "&" + Constants_1.Constants.domain_hint + "=" + encodeURIComponent(Constants_1.Constants.organizations);
                }
            }
        }
        return urlNavigate;
    };
    /*
     * Checks if the authorization endpoint URL contains query string parameters
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.urlContainsQueryStringParameter = function (name, url) {
        // regex to detect pattern of a ? or & followed by the name parameter and an equals character
        var regex = new RegExp("[\\?&]" + name + "=");
        return regex.test(url);
    };
    UserAgentApplication.prototype.acquireTokenRedirect = function (scopes, authority, user, extraQueryParameters) {
        var _this = this;
        var isValidScope = this.validateInputScope(scopes);
        if (isValidScope && !Utils_1.Utils.isEmpty(isValidScope)) {
            if (this._tokenReceivedCallback) {
                this._tokenReceivedCallback(Constants_1.ErrorDescription.inputScopesError, null, Constants_1.ErrorCodes.inputScopesError, Constants_1.Constants.accessToken, this.getUserState(this._cacheStorage.getItem(Constants_1.Constants.stateLogin, this.storeAuthStateInCookie)));
                return;
            }
        }
        if (scopes) {
            scopes = this.filterScopes(scopes);
        }
        var userObject = user ? user : this.getUser();
        if (this._acquireTokenInProgress) {
            return;
        }
        var scope = scopes.join(" ").toLowerCase();
        if (!userObject && !(extraQueryParameters && (extraQueryParameters.indexOf(Constants_1.Constants.login_hint) !== -1))) {
            if (this._tokenReceivedCallback) {
                this._logger.info("User login is required");
                this._tokenReceivedCallback(Constants_1.ErrorDescription.userLoginError, null, Constants_1.ErrorCodes.userLoginError, Constants_1.Constants.accessToken, this.getUserState(this._cacheStorage.getItem(Constants_1.Constants.stateLogin, this.storeAuthStateInCookie)));
                return;
            }
        }
        this._acquireTokenInProgress = true;
        var authenticationRequest;
        var acquireTokenAuthority = authority ? AuthorityFactory_1.AuthorityFactory.CreateInstance(authority, this.validateAuthority) : this.authorityInstance;
        acquireTokenAuthority.ResolveEndpointsAsync().then(function () {
            if (Utils_1.Utils.compareObjects(userObject, _this.getUser())) {
                if (scopes.indexOf(_this.clientId) > -1) {
                    authenticationRequest = new AuthenticationRequestParameters_1.AuthenticationRequestParameters(acquireTokenAuthority, _this.clientId, scopes, ResponseTypes.id_token, _this.getRedirectUri(), _this._state);
                }
                else {
                    authenticationRequest = new AuthenticationRequestParameters_1.AuthenticationRequestParameters(acquireTokenAuthority, _this.clientId, scopes, ResponseTypes.token, _this.getRedirectUri(), _this._state);
                }
            }
            else {
                authenticationRequest = new AuthenticationRequestParameters_1.AuthenticationRequestParameters(acquireTokenAuthority, _this.clientId, scopes, ResponseTypes.id_token_token, _this.getRedirectUri(), _this._state);
            }
            _this._cacheStorage.setItem(Constants_1.Constants.nonceIdToken, authenticationRequest.nonce, _this.storeAuthStateInCookie);
            var acquireTokenUserKey;
            if (userObject) {
                acquireTokenUserKey = Constants_1.Constants.acquireTokenUser + Constants_1.Constants.resourceDelimeter + userObject.userIdentifier + Constants_1.Constants.resourceDelimeter + authenticationRequest.state;
            }
            else {
                acquireTokenUserKey = Constants_1.Constants.acquireTokenUser + Constants_1.Constants.resourceDelimeter + Constants_1.Constants.no_user + Constants_1.Constants.resourceDelimeter + authenticationRequest.state;
            }
            _this._cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(userObject));
            var authorityKey = Constants_1.Constants.authority + Constants_1.Constants.resourceDelimeter + authenticationRequest.state;
            _this._cacheStorage.setItem(authorityKey, acquireTokenAuthority.CanonicalAuthority, _this.storeAuthStateInCookie);
            if (extraQueryParameters) {
                authenticationRequest.extraQueryParameters = extraQueryParameters;
            }
            var urlNavigate = authenticationRequest.createNavigateUrl(scopes) + Constants_1.Constants.response_mode_fragment;
            urlNavigate = _this.addHintParameters(urlNavigate, userObject);
            if (urlNavigate) {
                _this._cacheStorage.setItem(Constants_1.Constants.stateAcquireToken, authenticationRequest.state, _this.storeAuthStateInCookie);
                window.location.replace(urlNavigate);
            }
        });
    };
    UserAgentApplication.prototype.acquireTokenPopup = function (scopes, authority, user, extraQueryParameters) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var isValidScope = _this.validateInputScope(scopes);
            if (isValidScope && !Utils_1.Utils.isEmpty(isValidScope)) {
                reject(Constants_1.ErrorCodes.inputScopesError + Constants_1.Constants.resourceDelimeter + isValidScope);
            }
            if (scopes) {
                scopes = _this.filterScopes(scopes);
            }
            var userObject = user ? user : _this.getUser();
            if (_this._acquireTokenInProgress) {
                reject(Constants_1.ErrorCodes.acquireTokenProgressError + Constants_1.Constants.resourceDelimeter + Constants_1.ErrorDescription.acquireTokenProgressError);
                return;
            }
            var scope = scopes.join(" ").toLowerCase();
            //if user is not currently logged in and no login_hint is passed
            if (!userObject && !(extraQueryParameters && (extraQueryParameters.indexOf(Constants_1.Constants.login_hint) !== -1))) {
                _this._logger.info("User login is required");
                reject(Constants_1.ErrorCodes.userLoginError + Constants_1.Constants.resourceDelimeter + Constants_1.ErrorDescription.userLoginError);
                return;
            }
            _this._acquireTokenInProgress = true;
            var authenticationRequest;
            var acquireTokenAuthority = authority ? AuthorityFactory_1.AuthorityFactory.CreateInstance(authority, _this.validateAuthority) : _this.authorityInstance;
            var popUpWindow = _this.openWindow("about:blank", "_blank", 1, _this, resolve, reject);
            if (!popUpWindow) {
                return;
            }
            acquireTokenAuthority.ResolveEndpointsAsync().then(function () {
                if (Utils_1.Utils.compareObjects(userObject, _this.getUser())) {
                    if (scopes.indexOf(_this.clientId) > -1) {
                        authenticationRequest = new AuthenticationRequestParameters_1.AuthenticationRequestParameters(acquireTokenAuthority, _this.clientId, scopes, ResponseTypes.id_token, _this.getRedirectUri(), _this._state);
                    }
                    else {
                        authenticationRequest = new AuthenticationRequestParameters_1.AuthenticationRequestParameters(acquireTokenAuthority, _this.clientId, scopes, ResponseTypes.token, _this.getRedirectUri(), _this._state);
                    }
                }
                else {
                    authenticationRequest = new AuthenticationRequestParameters_1.AuthenticationRequestParameters(acquireTokenAuthority, _this.clientId, scopes, ResponseTypes.id_token_token, _this.getRedirectUri(), _this._state);
                }
                _this._cacheStorage.setItem(Constants_1.Constants.nonceIdToken, authenticationRequest.nonce);
                authenticationRequest.state = authenticationRequest.state;
                var acquireTokenUserKey;
                if (userObject) {
                    acquireTokenUserKey = Constants_1.Constants.acquireTokenUser + Constants_1.Constants.resourceDelimeter + userObject.userIdentifier + Constants_1.Constants.resourceDelimeter + authenticationRequest.state;
                }
                else {
                    acquireTokenUserKey = Constants_1.Constants.acquireTokenUser + Constants_1.Constants.resourceDelimeter + Constants_1.Constants.no_user + Constants_1.Constants.resourceDelimeter + authenticationRequest.state;
                }
                _this._cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(userObject));
                var authorityKey = Constants_1.Constants.authority + Constants_1.Constants.resourceDelimeter + authenticationRequest.state;
                _this._cacheStorage.setItem(authorityKey, acquireTokenAuthority.CanonicalAuthority, _this.storeAuthStateInCookie);
                if (extraQueryParameters) {
                    authenticationRequest.extraQueryParameters = extraQueryParameters;
                }
                var urlNavigate = authenticationRequest.createNavigateUrl(scopes) + Constants_1.Constants.response_mode_fragment;
                urlNavigate = _this.addHintParameters(urlNavigate, userObject);
                window.renewStates.push(authenticationRequest.state);
                window.requestType = Constants_1.Constants.renewToken;
                _this.registerCallback(authenticationRequest.state, scope, resolve, reject);
                if (popUpWindow) {
                    popUpWindow.location.href = urlNavigate;
                }
            }, function () {
                _this._logger.info(Constants_1.ErrorCodes.endpointResolutionError + ":" + Constants_1.ErrorDescription.endpointResolutionError);
                _this._cacheStorage.setItem(Constants_1.Constants.msalError, Constants_1.ErrorCodes.endpointResolutionError);
                _this._cacheStorage.setItem(Constants_1.Constants.msalErrorDescription, Constants_1.ErrorDescription.endpointResolutionError);
                if (reject) {
                    reject(Constants_1.ErrorCodes.endpointResolutionError + Constants_1.Constants.resourceDelimeter + Constants_1.ErrorDescription.endpointResolutionError);
                }
                if (popUpWindow) {
                    popUpWindow.close();
                }
            }).catch(function (err) {
                _this._logger.warning("could not resolve endpoints");
                reject(err);
            });
        });
    };
    /*
     * Used to get the token from cache.
     * MSAL will return the cached token if it is not expired.
     * Or it will send a request to the STS to obtain an access_token using a hidden iframe. To renew idToken, clientId should be passed as the only scope in the scopes array.
     * @param {Array<string>} scopes - Permissions you want included in the access token. Not all scopes are  guaranteed to be included in the access token. Scopes like "openid" and "profile" are sent with every request.
     * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
     * - In Azure AD, it is of the form https://&lt;tenant&gt;/&lt;tenant&gt;, where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
     * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/<policyName>/
     * - Default value is: "https://login.microsoftonline.com/common"
     * @param {User} user - The user for which the scopes are requested.The default user is the logged in user.
     * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the  authentication flow.
     * @returns {Promise.<string>} - A Promise that is fulfilled when this function has completed, or rejected if an error was raised. Resolved with token or rejected with error.
     */
    UserAgentApplication.prototype.acquireTokenSilent = function (scopes, authority, user, extraQueryParameters) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var isValidScope = _this.validateInputScope(scopes);
            if (isValidScope && !Utils_1.Utils.isEmpty(isValidScope)) {
                reject(Constants_1.ErrorCodes.inputScopesError + "|" + isValidScope);
                return null;
            }
            else {
                if (scopes) {
                    scopes = _this.filterScopes(scopes);
                }
                var scope_1 = scopes.join(" ").toLowerCase();
                var userObject_1 = user ? user : _this.getUser();
                var adalIdToken = _this._cacheStorage.getItem(Constants_1.Constants.adalIdToken);
                //if user is not currently logged in and no login_hint/sid is passed as an extraQueryParamater
                if (!userObject_1 && Utils_1.Utils.checkSSO(extraQueryParameters) && Utils_1.Utils.isEmpty(adalIdToken)) {
                    _this._logger.info("User login is required");
                    reject(Constants_1.ErrorCodes.userLoginError + Constants_1.Constants.resourceDelimeter + Constants_1.ErrorDescription.userLoginError);
                    return null;
                }
                //if user didn't passes the login_hint and adal's idtoken is present and no userobject, use the login_hint from adal's idToken
                else if (!userObject_1 && !Utils_1.Utils.isEmpty(adalIdToken)) {
                    var idTokenObject = Utils_1.Utils.extractIdToken(adalIdToken);
                    console.log("ADAL's idToken exists. Extracting login information from ADAL's idToken ");
                    extraQueryParameters = Utils_1.Utils.constructUnifiedCacheExtraQueryParameter(idTokenObject, extraQueryParameters);
                }
                var authenticationRequest_1;
                if (Utils_1.Utils.compareObjects(userObject_1, _this.getUser())) {
                    if (scopes.indexOf(_this.clientId) > -1) {
                        authenticationRequest_1 = new AuthenticationRequestParameters_1.AuthenticationRequestParameters(AuthorityFactory_1.AuthorityFactory.CreateInstance(authority, _this.validateAuthority), _this.clientId, scopes, ResponseTypes.id_token, _this.getRedirectUri(), _this._state);
                    }
                    else {
                        authenticationRequest_1 = new AuthenticationRequestParameters_1.AuthenticationRequestParameters(AuthorityFactory_1.AuthorityFactory.CreateInstance(authority, _this.validateAuthority), _this.clientId, scopes, ResponseTypes.token, _this.getRedirectUri(), _this._state);
                    }
                }
                else {
                    if (scopes.indexOf(_this.clientId) > -1) {
                        authenticationRequest_1 = new AuthenticationRequestParameters_1.AuthenticationRequestParameters(AuthorityFactory_1.AuthorityFactory.CreateInstance(authority, _this.validateAuthority), _this.clientId, scopes, ResponseTypes.id_token, _this.getRedirectUri(), _this._state);
                    }
                    else {
                        authenticationRequest_1 = new AuthenticationRequestParameters_1.AuthenticationRequestParameters(AuthorityFactory_1.AuthorityFactory.CreateInstance(authority, _this.validateAuthority), _this.clientId, scopes, ResponseTypes.id_token_token, _this.getRedirectUri(), _this._state);
                    }
                }
                var cacheResult = _this.getCachedToken(authenticationRequest_1, userObject_1);
                if (cacheResult) {
                    if (cacheResult.token) {
                        _this._logger.info("Token is already in cache for scope:" + scope_1);
                        resolve(cacheResult.token);
                        return null;
                    }
                    else if (cacheResult.errorDesc || cacheResult.error) {
                        _this._logger.infoPii(cacheResult.errorDesc + ":" + cacheResult.error);
                        reject(cacheResult.errorDesc + Constants_1.Constants.resourceDelimeter + cacheResult.error);
                        return null;
                    }
                }
                else {
                    _this._logger.verbose("Token is not in cache for scope:" + scope_1);
                }
                if (!authenticationRequest_1.authorityInstance) { //Cache result can return null if cache is empty. In that case, set authority to default value if no authority is passed to the api.
                    authenticationRequest_1.authorityInstance = authority ? AuthorityFactory_1.AuthorityFactory.CreateInstance(authority, _this.validateAuthority) : _this.authorityInstance;
                }
                // cache miss
                return authenticationRequest_1.authorityInstance.ResolveEndpointsAsync()
                    .then(function () {
                    // refresh attept with iframe
                    //Already renewing for this scope, callback when we get the token.
                    if (window.activeRenewals[scope_1]) {
                        _this._logger.verbose("Renew token for scope: " + scope_1 + " is in progress. Registering callback");
                        //Active renewals contains the state for each renewal.
                        _this.registerCallback(window.activeRenewals[scope_1], scope_1, resolve, reject);
                    }
                    else {
                        if (scopes && scopes.indexOf(_this.clientId) > -1 && scopes.length === 1) {
                            // App uses idToken to send to api endpoints
                            // Default scope is tracked as clientId to store this token
                            _this._logger.verbose("renewing idToken");
                            _this.renewIdToken(scopes, resolve, reject, userObject_1, authenticationRequest_1, extraQueryParameters);
                        }
                        else {
                            _this._logger.verbose("renewing accesstoken");
                            _this.renewToken(scopes, resolve, reject, userObject_1, authenticationRequest_1, extraQueryParameters);
                        }
                    }
                }).catch(function (err) {
                    _this._logger.warning("could not resolve endpoints");
                    reject(err);
                    return null;
                });
            }
        });
    };
    UserAgentApplication.prototype.extractADALIdToken = function () {
        var adalIdToken = this._cacheStorage.getItem(Constants_1.Constants.adalIdToken);
        if (!Utils_1.Utils.isEmpty(adalIdToken)) {
            return Utils_1.Utils.extractIdToken(adalIdToken);
        }
        return null;
    };
    /*
     * Calling _loadFrame but with a timeout to signal failure in loadframeStatus. Callbacks are left.
     * registered when network errors occur and subsequent token requests for same resource are registered to the pending request.
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.loadIframeTimeout = function (urlNavigate, frameName, scope) {
        var _this = this;
        //set iframe session to pending
        var expectedState = window.activeRenewals[scope];
        this._logger.verbose("Set loading state to pending for: " + scope + ":" + expectedState);
        this._cacheStorage.setItem(Constants_1.Constants.renewStatus + expectedState, Constants_1.Constants.tokenRenewStatusInProgress);
        this.loadFrame(urlNavigate, frameName);
        setTimeout(function () {
            if (_this._cacheStorage.getItem(Constants_1.Constants.renewStatus + expectedState) === Constants_1.Constants.tokenRenewStatusInProgress) {
                // fail the iframe session if it"s in pending state
                _this._logger.verbose("Loading frame has timed out after: " + (_this.loadFrameTimeout / 1000) + " seconds for scope " + scope + ":" + expectedState);
                if (expectedState && window.callBackMappedToRenewStates[expectedState]) {
                    window.callBackMappedToRenewStates[expectedState]("Token renewal operation failed due to timeout", null, "Token Renewal Failed", Constants_1.Constants.accessToken);
                }
                _this._cacheStorage.setItem(Constants_1.Constants.renewStatus + expectedState, Constants_1.Constants.tokenRenewStatusCancelled);
            }
        }, this.loadFrameTimeout);
    };
    /*
     * Loads iframe with authorization endpoint URL
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.loadFrame = function (urlNavigate, frameName) {
        var _this = this;
        // This trick overcomes iframe navigation in IE
        // IE does not load the page consistently in iframe
        this._logger.info("LoadFrame: " + frameName);
        var frameCheck = frameName;
        setTimeout(function () {
            var frameHandle = _this.addAdalFrame(frameCheck);
            if (frameHandle.src === "" || frameHandle.src === "about:blank") {
                frameHandle.src = urlNavigate;
                _this._logger.infoPii("Frame Name : " + frameName + " Navigated to: " + urlNavigate);
            }
        }, 500);
    };
    /*
     * Adds the hidden iframe for silent token renewal.
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.addAdalFrame = function (iframeId) {
        if (typeof iframeId === "undefined") {
            return null;
        }
        this._logger.info("Add msal frame to document:" + iframeId);
        var adalFrame = document.getElementById(iframeId);
        if (!adalFrame) {
            if (document.createElement &&
                document.documentElement &&
                (window.navigator.userAgent.indexOf("MSIE 5.0") === -1)) {
                var ifr = document.createElement("iframe");
                ifr.setAttribute("id", iframeId);
                ifr.style.visibility = "hidden";
                ifr.style.position = "absolute";
                ifr.style.width = ifr.style.height = "0";
                ifr.style.border = "0";
                adalFrame = document.getElementsByTagName("body")[0].appendChild(ifr);
            }
            else if (document.body && document.body.insertAdjacentHTML) {
                document.body.insertAdjacentHTML("beforeend", "<iframe name='" + iframeId + "' id='" + iframeId + "' style='display:none'></iframe>");
            }
            if (window.frames && window.frames[iframeId]) {
                adalFrame = window.frames[iframeId];
            }
        }
        return adalFrame;
    };
    /*
     * Acquires access token using a hidden iframe.
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.renewToken = function (scopes, resolve, reject, user, authenticationRequest, extraQueryParameters) {
        var scope = scopes.join(" ").toLowerCase();
        this._logger.verbose("renewToken is called for scope:" + scope);
        var frameHandle = this.addAdalFrame("msalRenewFrame" + scope);
        if (extraQueryParameters) {
            authenticationRequest.extraQueryParameters = extraQueryParameters;
        }
        var acquireTokenUserKey;
        if (user) {
            acquireTokenUserKey = Constants_1.Constants.acquireTokenUser + Constants_1.Constants.resourceDelimeter + user.userIdentifier + Constants_1.Constants.resourceDelimeter + authenticationRequest.state;
        }
        else {
            acquireTokenUserKey = Constants_1.Constants.acquireTokenUser + Constants_1.Constants.resourceDelimeter + Constants_1.Constants.no_user + Constants_1.Constants.resourceDelimeter + authenticationRequest.state;
        }
        this._cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(user));
        var authorityKey = Constants_1.Constants.authority + Constants_1.Constants.resourceDelimeter + authenticationRequest.state;
        this._cacheStorage.setItem(authorityKey, authenticationRequest.authority);
        // renew happens in iframe, so it keeps javascript context
        this._cacheStorage.setItem(Constants_1.Constants.nonceIdToken, authenticationRequest.nonce);
        this._logger.verbose("Renew token Expected state: " + authenticationRequest.state);
        var urlNavigate = Utils_1.Utils.urlRemoveQueryStringParameter(authenticationRequest.createNavigateUrl(scopes), Constants_1.Constants.prompt) + Constants_1.Constants.prompt_none;
        urlNavigate = this.addHintParameters(urlNavigate, user);
        window.renewStates.push(authenticationRequest.state);
        window.requestType = Constants_1.Constants.renewToken;
        this.registerCallback(authenticationRequest.state, scope, resolve, reject);
        this._logger.infoPii("Navigate to:" + urlNavigate);
        frameHandle.src = "about:blank";
        this.loadIframeTimeout(urlNavigate, "msalRenewFrame" + scope, scope);
    };
    /*
     * Renews idtoken for app"s own backend when clientId is passed as a single scope in the scopes array.
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.renewIdToken = function (scopes, resolve, reject, user, authenticationRequest, extraQueryParameters) {
        var scope = scopes.join(" ").toLowerCase();
        this._logger.info("renewidToken is called");
        var frameHandle = this.addAdalFrame("msalIdTokenFrame");
        if (extraQueryParameters) {
            authenticationRequest.extraQueryParameters = extraQueryParameters;
        }
        var acquireTokenUserKey;
        if (user) {
            acquireTokenUserKey = Constants_1.Constants.acquireTokenUser + Constants_1.Constants.resourceDelimeter + user.userIdentifier + Constants_1.Constants.resourceDelimeter + authenticationRequest.state;
        }
        else {
            acquireTokenUserKey = Constants_1.Constants.acquireTokenUser + Constants_1.Constants.resourceDelimeter + Constants_1.Constants.no_user + Constants_1.Constants.resourceDelimeter + authenticationRequest.state;
        }
        this._cacheStorage.setItem(acquireTokenUserKey, JSON.stringify(user));
        var authorityKey = Constants_1.Constants.authority + Constants_1.Constants.resourceDelimeter + authenticationRequest.state;
        this._cacheStorage.setItem(authorityKey, authenticationRequest.authority);
        this._cacheStorage.setItem(Constants_1.Constants.nonceIdToken, authenticationRequest.nonce);
        this._logger.verbose("Renew Idtoken Expected state: " + authenticationRequest.state);
        var urlNavigate = Utils_1.Utils.urlRemoveQueryStringParameter(authenticationRequest.createNavigateUrl(scopes), Constants_1.Constants.prompt) + Constants_1.Constants.prompt_none;
        urlNavigate = this.addHintParameters(urlNavigate, user);
        if (this._silentLogin) {
            window.requestType = Constants_1.Constants.login;
            this._silentAuthenticationState = authenticationRequest.state;
        }
        else {
            window.requestType = Constants_1.Constants.renewToken;
            window.renewStates.push(authenticationRequest.state);
        }
        this.registerCallback(authenticationRequest.state, this.clientId, resolve, reject);
        this._logger.infoPii("Navigate to:" + urlNavigate);
        frameHandle.src = "about:blank";
        this.loadIframeTimeout(urlNavigate, "msalIdTokenFrame", this.clientId);
    };
    /*
      * Returns the signed in user (received from a user object created at the time of login) or null.
      */
    UserAgentApplication.prototype.getUser = function () {
        // idToken is first call
        if (this._user) {
            return this._user;
        }
        // frame is used to get idToken
        var rawIdToken = this._cacheStorage.getItem(Constants_1.Constants.idTokenKey);
        var rawClientInfo = this._cacheStorage.getItem(Constants_1.Constants.msalClientInfo);
        if (!Utils_1.Utils.isEmpty(rawIdToken) && !Utils_1.Utils.isEmpty(rawClientInfo)) {
            var idToken = new IdToken_1.IdToken(rawIdToken);
            var clientInfo = new ClientInfo_1.ClientInfo(rawClientInfo);
            this._user = User_1.User.createUser(idToken, clientInfo);
            return this._user;
        }
        return null;
    };
    /*
     * This method must be called for processing the response received from the STS. It extracts the hash, processes the token or error information and saves it in the cache. It then
     * calls the registered callbacks in case of redirect or resolves the promises with the result.
     * @param {string} [hash=window.location.hash] - Hash fragment of Url.
     * @hidden
     */
    UserAgentApplication.prototype.handleAuthenticationResponse = function (hash) {
        if (hash == null) {
            hash = window.location.hash;
        }
        var self = null;
        var isPopup = false;
        var isWindowOpenerMsal = false;
        try {
            isWindowOpenerMsal = window.opener && window.opener.msal && window.opener.msal !== window.msal;
        }
        catch (err) {
            // err = SecurityError: Blocked a frame with origin "[url]" from accessing a cross-origin frame.
            isWindowOpenerMsal = false;
        }
        if (isWindowOpenerMsal) {
            self = window.opener.msal;
            isPopup = true;
        }
        else if (window.parent && window.parent.msal) {
            self = window.parent.msal;
        }
        var requestInfo = self.getRequestInfo(hash); //if(window.parent!==window), by using self, window.parent becomes equal to window in getRequestInfo method specifically
        var token = null, tokenReceivedCallback = null, tokenType, saveToken = true;
        self._logger.info("Returned from redirect url");
        if (window.parent !== window && window.parent.msal) {
            tokenReceivedCallback = window.parent.callBackMappedToRenewStates[requestInfo.stateResponse];
        }
        else if (isWindowOpenerMsal) {
            tokenReceivedCallback = window.opener.callBackMappedToRenewStates[requestInfo.stateResponse];
        }
        else {
            if (self._navigateToLoginRequestUrl) {
                tokenReceivedCallback = null;
                self._cacheStorage.setItem(Constants_1.Constants.urlHash, hash);
                saveToken = false;
                if (window.parent === window && !isPopup) {
                    window.location.href = self._cacheStorage.getItem(Constants_1.Constants.loginRequest, this.storeAuthStateInCookie);
                }
                return;
            }
            else {
                tokenReceivedCallback = self._tokenReceivedCallback;
                window.location.hash = "";
            }
        }
        self.saveTokenFromHash(requestInfo);
        if ((requestInfo.requestType === Constants_1.Constants.renewToken) && window.parent) {
            if (window.parent !== window) {
                self._logger.verbose("Window is in iframe, acquiring token silently");
            }
            else {
                self._logger.verbose("acquiring token interactive in progress");
            }
            token = requestInfo.parameters[Constants_1.Constants.accessToken] || requestInfo.parameters[Constants_1.Constants.idToken];
            tokenType = Constants_1.Constants.accessToken;
        }
        else if (requestInfo.requestType === Constants_1.Constants.login) {
            token = requestInfo.parameters[Constants_1.Constants.idToken];
            tokenType = Constants_1.Constants.idToken;
        }
        var errorDesc = requestInfo.parameters[Constants_1.Constants.errorDescription];
        var error = requestInfo.parameters[Constants_1.Constants.error];
        try {
            if (tokenReceivedCallback) {
                //We should only send the stae back to the developer if it matches with what we received from the server
                if (requestInfo.stateMatch) {
                    tokenReceivedCallback.call(self, errorDesc, token, error, tokenType, this.getUserState(requestInfo.stateResponse));
                }
                else {
                    tokenReceivedCallback.call(self, errorDesc, token, error, tokenType, null);
                }
            }
        }
        catch (err) {
            self._logger.error("Error occurred in token received callback function: " + err);
        }
        if (isWindowOpenerMsal) {
            for (var i = 0; i < window.opener.openedWindows.length; i++) {
                window.opener.openedWindows[i].close();
            }
        }
    };
    /*
     * This method must be called for processing the response received from AAD. It extracts the hash, processes the token or error, saves it in the cache and calls the registered callbacks with the result.
     * @param {string} authority authority received in the redirect response from AAD.
     * @param {TokenResponse} requestInfo an object created from the redirect response from AAD comprising of the keys - parameters, requestType, stateMatch, stateResponse and valid.
     * @param {User} user user object for which scopes are consented for. The default user is the logged in user.
     * @param {ClientInfo} clientInfo clientInfo received as part of the response comprising of fields uid and utid.
     * @param {IdToken} idToken idToken received as part of the response.
     * @ignore
     * @private
     * @hidden
     */
    /* tslint:disable:no-string-literal */
    UserAgentApplication.prototype.saveAccessToken = function (authority, tokenResponse, user, clientInfo, idToken) {
        var scope;
        var clientObj = new ClientInfo_1.ClientInfo(clientInfo);
        if (tokenResponse.parameters.hasOwnProperty("scope")) {
            scope = tokenResponse.parameters["scope"];
            var consentedScopes = scope.split(" ");
            var accessTokenCacheItems = this._cacheStorage.getAllAccessTokens(this.clientId, authority);
            for (var i = 0; i < accessTokenCacheItems.length; i++) {
                var accessTokenCacheItem = accessTokenCacheItems[i];
                if (accessTokenCacheItem.key.userIdentifier === user.userIdentifier) {
                    var cachedScopes = accessTokenCacheItem.key.scopes.split(" ");
                    if (Utils_1.Utils.isIntersectingScopes(cachedScopes, consentedScopes)) {
                        this._cacheStorage.removeItem(JSON.stringify(accessTokenCacheItem.key));
                    }
                }
            }
            var accessTokenKey = new AccessTokenKey_1.AccessTokenKey(authority, this.clientId, scope, clientObj.uid, clientObj.utid);
            var accessTokenValue = new AccessTokenValue_1.AccessTokenValue(tokenResponse.parameters[Constants_1.Constants.accessToken], idToken.rawIdToken, Utils_1.Utils.expiresIn(tokenResponse.parameters[Constants_1.Constants.expiresIn]).toString(), clientInfo);
            this._cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        }
        else {
            scope = this.clientId;
            var accessTokenKey = new AccessTokenKey_1.AccessTokenKey(authority, this.clientId, scope, clientObj.uid, clientObj.utid);
            var accessTokenValue = new AccessTokenValue_1.AccessTokenValue(tokenResponse.parameters[Constants_1.Constants.idToken], tokenResponse.parameters[Constants_1.Constants.idToken], idToken.expiration, clientInfo);
            this._cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
        }
    };
    /*
     * Saves token or error received in the response from AAD in the cache. In case of id_token, it also creates the user object.
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.saveTokenFromHash = function (tokenResponse) {
        this._logger.info("State status:" + tokenResponse.stateMatch + "; Request type:" + tokenResponse.requestType);
        this._cacheStorage.setItem(Constants_1.Constants.msalError, "");
        this._cacheStorage.setItem(Constants_1.Constants.msalErrorDescription, "");
        var scope = "";
        var authorityKey = "";
        var acquireTokenUserKey = "";
        if (tokenResponse.parameters.hasOwnProperty("scope")) {
            scope = tokenResponse.parameters["scope"].toLowerCase();
        }
        else {
            scope = this.clientId;
        }
        // Record error
        if (tokenResponse.parameters.hasOwnProperty(Constants_1.Constants.errorDescription) || tokenResponse.parameters.hasOwnProperty(Constants_1.Constants.error)) {
            this._logger.infoPii("Error :" + tokenResponse.parameters[Constants_1.Constants.error] + "; Error description:" + tokenResponse.parameters[Constants_1.Constants.errorDescription]);
            this._cacheStorage.setItem(Constants_1.Constants.msalError, tokenResponse.parameters["error"]);
            this._cacheStorage.setItem(Constants_1.Constants.msalErrorDescription, tokenResponse.parameters[Constants_1.Constants.errorDescription]);
            if (tokenResponse.requestType === Constants_1.Constants.login) {
                this._loginInProgress = false;
                this._cacheStorage.setItem(Constants_1.Constants.loginError, tokenResponse.parameters[Constants_1.Constants.errorDescription] + ":" + tokenResponse.parameters[Constants_1.Constants.error]);
                authorityKey = Constants_1.Constants.authority + Constants_1.Constants.resourceDelimeter + tokenResponse.stateResponse;
            }
            if (tokenResponse.requestType === Constants_1.Constants.renewToken) {
                this._acquireTokenInProgress = false;
                authorityKey = Constants_1.Constants.authority + Constants_1.Constants.resourceDelimeter + tokenResponse.stateResponse;
                var userKey = this.getUser() !== null ? this.getUser().userIdentifier : "";
                acquireTokenUserKey = Constants_1.Constants.acquireTokenUser + Constants_1.Constants.resourceDelimeter + userKey + Constants_1.Constants.resourceDelimeter + tokenResponse.stateResponse;
            }
        }
        else {
            // It must verify the state from redirect
            if (tokenResponse.stateMatch) {
                // record tokens to storage if exists
                this._logger.info("State is right");
                if (tokenResponse.parameters.hasOwnProperty(Constants_1.Constants.sessionState)) {
                    this._cacheStorage.setItem(Constants_1.Constants.msalSessionState, tokenResponse.parameters[Constants_1.Constants.sessionState]);
                }
                var idToken;
                var clientInfo = "";
                if (tokenResponse.parameters.hasOwnProperty(Constants_1.Constants.accessToken)) {
                    this._logger.info("Fragment has access token");
                    this._acquireTokenInProgress = false;
                    var user = void 0;
                    if (tokenResponse.parameters.hasOwnProperty(Constants_1.Constants.idToken)) {
                        idToken = new IdToken_1.IdToken(tokenResponse.parameters[Constants_1.Constants.idToken]);
                    }
                    else {
                        idToken = new IdToken_1.IdToken(this._cacheStorage.getItem(Constants_1.Constants.idTokenKey));
                    }
                    authorityKey = Constants_1.Constants.authority + Constants_1.Constants.resourceDelimeter + tokenResponse.stateResponse;
                    var authority = this._cacheStorage.getItem(authorityKey, this.storeAuthStateInCookie);
                    if (!Utils_1.Utils.isEmpty(authority)) {
                        authority = Utils_1.Utils.replaceFirstPath(authority, idToken.tenantId);
                    }
                    if (tokenResponse.parameters.hasOwnProperty(Constants_1.Constants.clientInfo)) {
                        clientInfo = tokenResponse.parameters[Constants_1.Constants.clientInfo];
                        user = User_1.User.createUser(idToken, new ClientInfo_1.ClientInfo(clientInfo));
                    }
                    else {
                        this._logger.warning("ClientInfo not received in the response from AAD");
                        user = User_1.User.createUser(idToken, new ClientInfo_1.ClientInfo(clientInfo));
                    }
                    acquireTokenUserKey = Constants_1.Constants.acquireTokenUser + Constants_1.Constants.resourceDelimeter + user.userIdentifier + Constants_1.Constants.resourceDelimeter + tokenResponse.stateResponse;
                    var acquireTokenUserKey_nouser = Constants_1.Constants.acquireTokenUser + Constants_1.Constants.resourceDelimeter + Constants_1.Constants.no_user + Constants_1.Constants.resourceDelimeter + tokenResponse.stateResponse;
                    var cachedUser = this._cacheStorage.getItem(acquireTokenUserKey);
                    var acquireTokenUser = void 0;
                    if (!Utils_1.Utils.isEmpty(cachedUser)) {
                        acquireTokenUser = JSON.parse(cachedUser);
                        if (user && acquireTokenUser && Utils_1.Utils.compareObjects(user, acquireTokenUser)) {
                            this.saveAccessToken(authority, tokenResponse, user, clientInfo, idToken);
                            this._logger.info("The user object received in the response is the same as the one passed in the acquireToken request");
                        }
                        else {
                            this._logger.warning("The user object created from the response is not the same as the one passed in the acquireToken request");
                        }
                    }
                    else if (!Utils_1.Utils.isEmpty(this._cacheStorage.getItem(acquireTokenUserKey_nouser))) {
                        this.saveAccessToken(authority, tokenResponse, user, clientInfo, idToken);
                    }
                }
                if (tokenResponse.parameters.hasOwnProperty(Constants_1.Constants.idToken)) {
                    this._logger.info("Fragment has id token");
                    this._loginInProgress = false;
                    idToken = new IdToken_1.IdToken(tokenResponse.parameters[Constants_1.Constants.idToken]);
                    if (tokenResponse.parameters.hasOwnProperty(Constants_1.Constants.clientInfo)) {
                        clientInfo = tokenResponse.parameters[Constants_1.Constants.clientInfo];
                    }
                    else {
                        this._logger.warning("ClientInfo not received in the response from AAD");
                    }
                    authorityKey = Constants_1.Constants.authority + Constants_1.Constants.resourceDelimeter + tokenResponse.stateResponse;
                    var authority = this._cacheStorage.getItem(authorityKey, this.storeAuthStateInCookie);
                    if (!Utils_1.Utils.isEmpty(authority)) {
                        authority = Utils_1.Utils.replaceFirstPath(authority, idToken.tenantId);
                    }
                    this._user = User_1.User.createUser(idToken, new ClientInfo_1.ClientInfo(clientInfo));
                    if (idToken && idToken.nonce) {
                        if (idToken.nonce !== this._cacheStorage.getItem(Constants_1.Constants.nonceIdToken, this.storeAuthStateInCookie)) {
                            this._user = null;
                            this._cacheStorage.setItem(Constants_1.Constants.loginError, "Nonce Mismatch. Expected Nonce: " + this._cacheStorage.getItem(Constants_1.Constants.nonceIdToken, this.storeAuthStateInCookie) + "," + "Actual Nonce: " + idToken.nonce);
                            this._logger.error("Nonce Mismatch.Expected Nonce: " + this._cacheStorage.getItem(Constants_1.Constants.nonceIdToken, this.storeAuthStateInCookie) + "," + "Actual Nonce: " + idToken.nonce);
                        }
                        else {
                            this._cacheStorage.setItem(Constants_1.Constants.idTokenKey, tokenResponse.parameters[Constants_1.Constants.idToken]);
                            this._cacheStorage.setItem(Constants_1.Constants.msalClientInfo, clientInfo);
                            // Save idToken as access token for app itself
                            this.saveAccessToken(authority, tokenResponse, this._user, clientInfo, idToken);
                        }
                    }
                    else {
                        authorityKey = tokenResponse.stateResponse;
                        acquireTokenUserKey = tokenResponse.stateResponse;
                        this._logger.error("Invalid id_token received in the response");
                        tokenResponse.parameters["error"] = "invalid idToken";
                        tokenResponse.parameters["error_description"] = "Invalid idToken. idToken: " + tokenResponse.parameters[Constants_1.Constants.idToken];
                        this._cacheStorage.setItem(Constants_1.Constants.msalError, "invalid idToken");
                        this._cacheStorage.setItem(Constants_1.Constants.msalErrorDescription, "Invalid idToken. idToken: " + tokenResponse.parameters[Constants_1.Constants.idToken]);
                    }
                }
            }
            else {
                authorityKey = tokenResponse.stateResponse;
                acquireTokenUserKey = tokenResponse.stateResponse;
                this._logger.error("State Mismatch.Expected State: " + this._cacheStorage.getItem(Constants_1.Constants.stateLogin, this.storeAuthStateInCookie) + "," + "Actual State: " + tokenResponse.stateResponse);
                tokenResponse.parameters["error"] = "Invalid_state";
                tokenResponse.parameters["error_description"] = "Invalid_state. state: " + tokenResponse.stateResponse;
                this._cacheStorage.setItem(Constants_1.Constants.msalError, "Invalid_state");
                this._cacheStorage.setItem(Constants_1.Constants.msalErrorDescription, "Invalid_state. state: " + tokenResponse.stateResponse);
            }
        }
        this._cacheStorage.setItem(Constants_1.Constants.renewStatus + tokenResponse.stateResponse, Constants_1.Constants.tokenRenewStatusCompleted);
        this._cacheStorage.removeAcquireTokenEntries(authorityKey, acquireTokenUserKey);
        //this is required if navigateToLoginRequestUrl=false
        if (this.storeAuthStateInCookie) {
            this._cacheStorage.setItemCookie(authorityKey, "", -1);
            this._cacheStorage.clearCookie();
        }
    };
    /* tslint:enable:no-string-literal */
    /*
     * Checks if the redirect response is received from the STS. In case of redirect, the url fragment has either id_token, access_token or error.
     * @param {string} hash - Hash passed from redirect page.
     * @returns {Boolean} - true if response contains id_token, access_token or error, false otherwise.
     * @hidden
     */
    UserAgentApplication.prototype.isCallback = function (hash) {
        hash = this.getHash(hash);
        var parameters = Utils_1.Utils.deserialize(hash);
        return (parameters.hasOwnProperty(Constants_1.Constants.errorDescription) ||
            parameters.hasOwnProperty(Constants_1.Constants.error) ||
            parameters.hasOwnProperty(Constants_1.Constants.accessToken) ||
            parameters.hasOwnProperty(Constants_1.Constants.idToken));
    };
    /*
     * Returns the anchor part(#) of the URL
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.getHash = function (hash) {
        if (hash.indexOf("#/") > -1) {
            hash = hash.substring(hash.indexOf("#/") + 2);
        }
        else if (hash.indexOf("#") > -1) {
            hash = hash.substring(1);
        }
        return hash;
    };
    /*
      * Creates a requestInfo object from the URL fragment and returns it.
      * @param {string} hash  -  Hash passed from redirect page
      * @returns {TokenResponse} an object created from the redirect response from AAD comprising of the keys - parameters, requestType, stateMatch, stateResponse and valid.
      * @ignore
      * @hidden
      */
    UserAgentApplication.prototype.getRequestInfo = function (hash) {
        hash = this.getHash(hash);
        var parameters = Utils_1.Utils.deserialize(hash);
        var tokenResponse = new RequestInfo_1.TokenResponse();
        if (parameters) {
            tokenResponse.parameters = parameters;
            if (parameters.hasOwnProperty(Constants_1.Constants.errorDescription) ||
                parameters.hasOwnProperty(Constants_1.Constants.error) ||
                parameters.hasOwnProperty(Constants_1.Constants.accessToken) ||
                parameters.hasOwnProperty(Constants_1.Constants.idToken)) {
                tokenResponse.valid = true;
                // which call
                var stateResponse = void 0;
                if (parameters.hasOwnProperty("state")) {
                    stateResponse = parameters.state;
                }
                else {
                    return tokenResponse;
                }
                tokenResponse.stateResponse = stateResponse;
                // async calls can fire iframe and login request at the same time if developer does not use the API as expected
                // incoming callback needs to be looked up to find the request type
                if (stateResponse === this._cacheStorage.getItem(Constants_1.Constants.stateLogin, this.storeAuthStateInCookie) || stateResponse === this._silentAuthenticationState) { // loginRedirect
                    tokenResponse.requestType = Constants_1.Constants.login;
                    tokenResponse.stateMatch = true;
                    return tokenResponse;
                }
                else if (stateResponse === this._cacheStorage.getItem(Constants_1.Constants.stateAcquireToken, this.storeAuthStateInCookie)) { //acquireTokenRedirect
                    tokenResponse.requestType = Constants_1.Constants.renewToken;
                    tokenResponse.stateMatch = true;
                    return tokenResponse;
                }
                // external api requests may have many renewtoken requests for different resource
                if (!tokenResponse.stateMatch) {
                    tokenResponse.requestType = window.requestType;
                    var statesInParentContext = window.renewStates;
                    for (var i = 0; i < statesInParentContext.length; i++) {
                        if (statesInParentContext[i] === tokenResponse.stateResponse) {
                            tokenResponse.stateMatch = true;
                            break;
                        }
                    }
                }
            }
        }
        return tokenResponse;
    };
    /*
      * Extracts scope value from the state sent with the authentication request.
      * @returns {string} scope.
      * @ignore
      * @hidden
      */
    UserAgentApplication.prototype.getScopeFromState = function (state) {
        if (state) {
            var splitIndex = state.indexOf("|");
            if (splitIndex > -1 && splitIndex + 1 < state.length) {
                return state.substring(splitIndex + 1);
            }
        }
        return "";
    };
    /*
    * Extracts state value from the userState sent with the authentication request.
    * @returns {string} scope.
    * @ignore
    * @hidden
    */
    UserAgentApplication.prototype.getUserState = function (state) {
        if (state) {
            var splitIndex = state.indexOf("|");
            if (splitIndex > -1 && splitIndex + 1 < state.length) {
                return state.substring(splitIndex + 1);
            }
        }
        return "";
    };
    /*
      * Returns whether current window is in ifram for token renewal
      * @ignore
      * @hidden
      */
    UserAgentApplication.prototype.isInIframe = function () {
        return window.parent !== window;
    };
    UserAgentApplication.prototype.loginInProgress = function () {
        var pendingCallback = this._cacheStorage.getItem(Constants_1.Constants.urlHash);
        if (pendingCallback) {
            return true;
        }
        return this._loginInProgress;
    };
    UserAgentApplication.prototype.getHostFromUri = function (uri) {
        // remove http:// or https:// from uri
        var extractedUri = String(uri).replace(/^(https?:)\/\//, "");
        extractedUri = extractedUri.split("/")[0];
        return extractedUri;
    };
    UserAgentApplication.prototype.getScopesForEndpoint = function (endpoint) {
        // if user specified list of unprotectedResources, no need to send token to these endpoints, return null.
        if (this._unprotectedResources.length > 0) {
            for (var i = 0; i < this._unprotectedResources.length; i++) {
                if (endpoint.indexOf(this._unprotectedResources[i]) > -1) {
                    return null;
                }
            }
        }
        if (this._protectedResourceMap.size > 0) {
            for (var _i = 0, _a = Array.from(this._protectedResourceMap.keys()); _i < _a.length; _i++) {
                var key = _a[_i];
                // configEndpoint is like /api/Todo requested endpoint can be /api/Todo/1
                if (endpoint.indexOf(key) > -1) {
                    return this._protectedResourceMap.get(key);
                }
            }
        }
        // default resource will be clientid if nothing specified
        // App will use idtoken for calls to itself
        // check if it's staring from http or https, needs to match with app host
        if (endpoint.indexOf("http://") > -1 || endpoint.indexOf("https://") > -1) {
            if (this.getHostFromUri(endpoint) === this.getHostFromUri(this.getRedirectUri())) {
                return new Array(this.clientId);
            }
        }
        else {
            // in angular level, the url for $http interceptor call could be relative url,
            // if it's relative call, we'll treat it as app backend call.
            return new Array(this.clientId);
        }
        // if not the app's own backend or not a domain listed in the endpoints structure
        return null;
    };
    //These APIS are exposed for msalAngular wrapper only
    UserAgentApplication.prototype.setloginInProgress = function (loginInProgress) {
        this._loginInProgress = loginInProgress;
    };
    UserAgentApplication.prototype.getAcquireTokenInProgress = function () {
        return this._acquireTokenInProgress;
    };
    UserAgentApplication.prototype.setAcquireTokenInProgress = function (acquireTokenInProgress) {
        this._acquireTokenInProgress = acquireTokenInProgress;
    };
    UserAgentApplication.prototype.getLogger = function () {
        return this._logger;
    };
    tslib_1.__decorate([
        resolveTokenOnlyIfOutOfIframe
    ], UserAgentApplication.prototype, "acquireTokenSilent", null);
    return UserAgentApplication;
}());
exports.UserAgentApplication = UserAgentApplication;
//# sourceMappingURL=UserAgentApplication.js.map

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = __webpack_require__(0);
/*
 * @hidden
 */
var AccessTokenKey = /** @class */ (function () {
    function AccessTokenKey(authority, clientId, scopes, uid, utid) {
        this.authority = authority;
        this.clientId = clientId;
        this.scopes = scopes;
        this.userIdentifier = Utils_1.Utils.base64EncodeStringUrlSafe(uid) + "." + Utils_1.Utils.base64EncodeStringUrlSafe(utid);
    }
    return AccessTokenKey;
}());
exports.AccessTokenKey = AccessTokenKey;
//# sourceMappingURL=AccessTokenKey.js.map

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * @hidden
 */
var AccessTokenValue = /** @class */ (function () {
    function AccessTokenValue(accessToken, idToken, expiresIn, clientInfo) {
        this.accessToken = accessToken;
        this.idToken = idToken;
        this.expiresIn = expiresIn;
        this.clientInfo = clientInfo;
    }
    return AccessTokenValue;
}());
exports.AccessTokenValue = AccessTokenValue;
//# sourceMappingURL=AccessTokenValue.js.map

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = __webpack_require__(0);
/*
 * @hidden
 */
var AuthenticationRequestParameters = /** @class */ (function () {
    function AuthenticationRequestParameters(authority, clientId, scope, responseType, redirectUri, state) {
        this.authorityInstance = authority;
        this.clientId = clientId;
        this.scopes = scope;
        this.responseType = responseType;
        this.redirectUri = redirectUri;
        // randomly generated values
        this.correlationId = Utils_1.Utils.createNewGuid();
        this.state = state && !Utils_1.Utils.isEmpty(state) ? Utils_1.Utils.createNewGuid() + "|" + state : Utils_1.Utils.createNewGuid();
        this.nonce = Utils_1.Utils.createNewGuid();
        // telemetry information
        this.xClientSku = "MSAL.JS";
        this.xClientVer = Utils_1.Utils.getLibraryVersion();
    }
    Object.defineProperty(AuthenticationRequestParameters.prototype, "authority", {
        get: function () {
            return this.authorityInstance ? this.authorityInstance.CanonicalAuthority : null;
        },
        enumerable: true,
        configurable: true
    });
    AuthenticationRequestParameters.prototype.createNavigateUrl = function (scopes) {
        var str = this.createNavigationUrlString(scopes);
        var authEndpoint = this.authorityInstance.AuthorizationEndpoint;
        // if the endpoint already has queryparams, lets add to it, otherwise add the first one
        if (authEndpoint.indexOf("?") < 0) {
            authEndpoint += "?";
        }
        else {
            authEndpoint += "&";
        }
        var requestUrl = "" + authEndpoint + str.join("&");
        return requestUrl;
    };
    AuthenticationRequestParameters.prototype.createNavigationUrlString = function (scopes) {
        if (!scopes) {
            scopes = [this.clientId];
        }
        if (scopes.indexOf(this.clientId) === -1) {
            scopes.push(this.clientId);
        }
        var str = [];
        str.push("response_type=" + this.responseType);
        this.translateclientIdUsedInScope(scopes);
        str.push("scope=" + encodeURIComponent(this.parseScope(scopes)));
        str.push("client_id=" + encodeURIComponent(this.clientId));
        str.push("redirect_uri=" + encodeURIComponent(this.redirectUri));
        str.push("state=" + encodeURIComponent(this.state));
        str.push("nonce=" + encodeURIComponent(this.nonce));
        str.push("client_info=1");
        str.push("x-client-SKU=" + this.xClientSku);
        str.push("x-client-Ver=" + this.xClientVer);
        if (this.extraQueryParameters) {
            str.push(this.extraQueryParameters);
        }
        str.push("client-request-id=" + encodeURIComponent(this.correlationId));
        return str;
    };
    AuthenticationRequestParameters.prototype.translateclientIdUsedInScope = function (scopes) {
        var clientIdIndex = scopes.indexOf(this.clientId);
        if (clientIdIndex >= 0) {
            scopes.splice(clientIdIndex, 1);
            if (scopes.indexOf("openid") === -1) {
                scopes.push("openid");
            }
            if (scopes.indexOf("profile") === -1) {
                scopes.push("profile");
            }
        }
    };
    AuthenticationRequestParameters.prototype.parseScope = function (scopes) {
        var scopeList = "";
        if (scopes) {
            for (var i = 0; i < scopes.length; ++i) {
                scopeList += (i !== scopes.length - 1) ? scopes[i] + " " : scopes[i];
            }
        }
        return scopeList;
    };
    return AuthenticationRequestParameters;
}());
exports.AuthenticationRequestParameters = AuthenticationRequestParameters;
//# sourceMappingURL=AuthenticationRequestParameters.js.map

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = __webpack_require__(0);
/*
 * @hidden
 */
var ClientInfo = /** @class */ (function () {
    function ClientInfo(rawClientInfo) {
        if (!rawClientInfo || Utils_1.Utils.isEmpty(rawClientInfo)) {
            this.uid = "";
            this.utid = "";
            return;
        }
        try {
            var decodedClientInfo = Utils_1.Utils.base64DecodeStringUrlSafe(rawClientInfo);
            var clientInfo = JSON.parse(decodedClientInfo);
            if (clientInfo) {
                if (clientInfo.hasOwnProperty("uid")) {
                    this.uid = clientInfo.uid;
                }
                if (clientInfo.hasOwnProperty("utid")) {
                    this.utid = clientInfo.utid;
                }
            }
        }
        catch (e) {
            throw new Error(e);
        }
    }
    Object.defineProperty(ClientInfo.prototype, "uid", {
        get: function () {
            return this._uid ? this._uid : "";
        },
        set: function (uid) {
            this._uid = uid;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ClientInfo.prototype, "utid", {
        get: function () {
            return this._utid ? this._utid : "";
        },
        set: function (utid) {
            this._utid = utid;
        },
        enumerable: true,
        configurable: true
    });
    return ClientInfo;
}());
exports.ClientInfo = ClientInfo;
//# sourceMappingURL=ClientInfo.js.map

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*
  * Copyright (c) Microsoft Corporation
  *  All Rights Reserved
  *  MIT License
  *
  * Permission is hereby granted, free of charge, to any person obtaining a copy of this
  * software and associated documentation files (the "Software"), to deal in the Software
  * without restriction, including without limitation the rights to use, copy, modify,
  * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
  * permit persons to whom the Software is furnished to do so, subject to the following
  * conditions:
  *
  * The above copyright notice and this permission notice shall be
  * included in all copies or substantial portions of the Software.
  *
  * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
  * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
  * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  */
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = __webpack_require__(0);
/*
 * @hidden
 */
var IdToken = /** @class */ (function () {
    /* tslint:disable:no-string-literal */
    function IdToken(rawIdToken) {
        if (Utils_1.Utils.isEmpty(rawIdToken)) {
            throw new Error("null or empty raw idtoken");
        }
        try {
            this.rawIdToken = rawIdToken;
            this.decodedIdToken = Utils_1.Utils.extractIdToken(rawIdToken);
            if (this.decodedIdToken) {
                if (this.decodedIdToken.hasOwnProperty("iss")) {
                    this.issuer = this.decodedIdToken["iss"];
                }
                if (this.decodedIdToken.hasOwnProperty("oid")) {
                    this.objectId = this.decodedIdToken["oid"];
                }
                if (this.decodedIdToken.hasOwnProperty("sub")) {
                    this.subject = this.decodedIdToken["sub"];
                }
                if (this.decodedIdToken.hasOwnProperty("tid")) {
                    this.tenantId = this.decodedIdToken["tid"];
                }
                if (this.decodedIdToken.hasOwnProperty("ver")) {
                    this.version = this.decodedIdToken["ver"];
                }
                if (this.decodedIdToken.hasOwnProperty("preferred_username")) {
                    this.preferredName = this.decodedIdToken["preferred_username"];
                }
                if (this.decodedIdToken.hasOwnProperty("name")) {
                    this.name = this.decodedIdToken["name"];
                }
                if (this.decodedIdToken.hasOwnProperty("nonce")) {
                    this.nonce = this.decodedIdToken["nonce"];
                }
                if (this.decodedIdToken.hasOwnProperty("exp")) {
                    this.expiration = this.decodedIdToken["exp"];
                }
                if (this.decodedIdToken.hasOwnProperty("home_oid")) {
                    this.homeObjectId = this.decodedIdToken["home_oid"];
                }
                if (this.decodedIdToken.hasOwnProperty("sid")) {
                    this.sid = this.decodedIdToken["sid"];
                }
                /* tslint:enable:no-string-literal */
            }
        }
        catch (e) {
            throw new Error("Failed to parse the returned id token");
        }
    }
    return IdToken;
}());
exports.IdToken = IdToken;
//# sourceMappingURL=IdToken.js.map

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Constants_1 = __webpack_require__(1);
var AccessTokenCacheItem_1 = __webpack_require__(19);
/*
 * @hidden
 */
var Storage = /** @class */ (function () {
    function Storage(cacheLocation) {
        if (Storage._instance) {
            return Storage._instance;
        }
        this._cacheLocation = cacheLocation;
        this._localStorageSupported = typeof window[this._cacheLocation] !== "undefined" && window[this._cacheLocation] != null;
        this._sessionStorageSupported = typeof window[cacheLocation] !== "undefined" && window[cacheLocation] != null;
        Storage._instance = this;
        if (!this._localStorageSupported && !this._sessionStorageSupported) {
            throw new Error("localStorage and sessionStorage not supported");
        }
        return Storage._instance;
    }
    // add value to storage
    Storage.prototype.setItem = function (key, value, enableCookieStorage) {
        if (window[this._cacheLocation]) {
            window[this._cacheLocation].setItem(key, value);
        }
        if (enableCookieStorage) {
            this.setItemCookie(key, value);
        }
    };
    // get one item by key from storage
    Storage.prototype.getItem = function (key, enableCookieStorage) {
        if (enableCookieStorage && this.getItemCookie(key)) {
            return this.getItemCookie(key);
        }
        if (window[this._cacheLocation]) {
            return window[this._cacheLocation].getItem(key);
        }
        return null;
    };
    // remove value from storage
    Storage.prototype.removeItem = function (key) {
        if (window[this._cacheLocation]) {
            return window[this._cacheLocation].removeItem(key);
        }
    };
    // clear storage (remove all items from it)
    Storage.prototype.clear = function () {
        if (window[this._cacheLocation]) {
            return window[this._cacheLocation].clear();
        }
    };
    Storage.prototype.getAllAccessTokens = function (clientId, userIdentifier) {
        var results = [];
        var accessTokenCacheItem;
        var storage = window[this._cacheLocation];
        if (storage) {
            var key = void 0;
            for (key in storage) {
                if (storage.hasOwnProperty(key)) {
                    if (key.match(clientId) && key.match(userIdentifier)) {
                        var value = this.getItem(key);
                        if (value) {
                            accessTokenCacheItem = new AccessTokenCacheItem_1.AccessTokenCacheItem(JSON.parse(key), JSON.parse(value));
                            results.push(accessTokenCacheItem);
                        }
                    }
                }
            }
        }
        return results;
    };
    Storage.prototype.removeAcquireTokenEntries = function (authorityKey, acquireTokenUserKey) {
        var storage = window[this._cacheLocation];
        if (storage) {
            var key = void 0;
            for (key in storage) {
                if (storage.hasOwnProperty(key)) {
                    if ((authorityKey !== "" && key.indexOf(authorityKey) > -1) || (acquireTokenUserKey !== "" && key.indexOf(acquireTokenUserKey) > -1)) {
                        this.removeItem(key);
                    }
                }
            }
        }
    };
    Storage.prototype.resetCacheItems = function () {
        var storage = window[this._cacheLocation];
        if (storage) {
            var key = void 0;
            for (key in storage) {
                if (storage.hasOwnProperty(key)) {
                    if (key.indexOf(Constants_1.Constants.msal) !== -1) {
                        this.setItem(key, "");
                    }
                    if (key.indexOf(Constants_1.Constants.renewStatus) !== -1) {
                        this.removeItem(key);
                    }
                }
            }
        }
    };
    Storage.prototype.setItemCookie = function (cName, cValue, expires) {
        var cookieStr = cName + "=" + cValue + ";";
        if (expires) {
            var expireTime = this.setExpirationCookie(expires);
            cookieStr += "expires=" + expireTime + ";";
        }
        document.cookie = cookieStr;
    };
    Storage.prototype.getItemCookie = function (cName) {
        var name = cName + "=";
        var ca = document.cookie.split(";");
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === " ") {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    };
    Storage.prototype.setExpirationCookie = function (cookieLife) {
        var today = new Date();
        var expr = new Date(today.getTime() + cookieLife * 24 * 60 * 60 * 1000);
        return expr.toUTCString();
    };
    Storage.prototype.clearCookie = function () {
        this.setItemCookie(Constants_1.Constants.nonceIdToken, "", -1);
        this.setItemCookie(Constants_1.Constants.stateLogin, "", -1);
        this.setItemCookie(Constants_1.Constants.loginRequest, "", -1);
        this.setItemCookie(Constants_1.Constants.stateAcquireToken, "", -1);
    };
    return Storage;
}());
exports.Storage = Storage;
//# sourceMappingURL=Storage.js.map

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * @hidden
 */
var AccessTokenCacheItem = /** @class */ (function () {
    function AccessTokenCacheItem(key, value) {
        this.key = key;
        this.value = value;
    }
    return AccessTokenCacheItem;
}());
exports.AccessTokenCacheItem = AccessTokenCacheItem;
//# sourceMappingURL=AccessTokenCacheItem.js.map

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * @hidden
 */
var Utils_1 = __webpack_require__(0);
var AadAuthority_1 = __webpack_require__(8);
var B2cAuthority_1 = __webpack_require__(21);
var Authority_1 = __webpack_require__(2);
var ErrorMessage_1 = __webpack_require__(5);
var AuthorityFactory = /** @class */ (function () {
    function AuthorityFactory() {
    }
    /*
    * Parse the url and determine the type of authority
    */
    AuthorityFactory.DetectAuthorityFromUrl = function (authorityUrl) {
        authorityUrl = Utils_1.Utils.CanonicalizeUri(authorityUrl);
        var components = Utils_1.Utils.GetUrlComponents(authorityUrl);
        var pathSegments = components.PathSegments;
        switch (pathSegments[0]) {
            case "tfp":
                return Authority_1.AuthorityType.B2C;
            case "adfs":
                return Authority_1.AuthorityType.Adfs;
            default:
                return Authority_1.AuthorityType.Aad;
        }
    };
    /*
    * Create an authority object of the correct type based on the url
    * Performs basic authority validation - checks to see if the authority is of a valid type (eg aad, b2c)
    */
    AuthorityFactory.CreateInstance = function (authorityUrl, validateAuthority) {
        if (Utils_1.Utils.isEmpty(authorityUrl)) {
            return null;
        }
        var type = AuthorityFactory.DetectAuthorityFromUrl(authorityUrl);
        // Depending on above detection, create the right type.
        switch (type) {
            case Authority_1.AuthorityType.B2C:
                return new B2cAuthority_1.B2cAuthority(authorityUrl, validateAuthority);
            case Authority_1.AuthorityType.Aad:
                return new AadAuthority_1.AadAuthority(authorityUrl, validateAuthority);
            default:
                throw ErrorMessage_1.ErrorMessage.invalidAuthorityType;
        }
    };
    return AuthorityFactory;
}());
exports.AuthorityFactory = AuthorityFactory;
//# sourceMappingURL=AuthorityFactory.js.map

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(3);
var AadAuthority_1 = __webpack_require__(8);
var Authority_1 = __webpack_require__(2);
var ErrorMessage_1 = __webpack_require__(5);
var Utils_1 = __webpack_require__(0);
/*
 * @hidden
 */
var B2cAuthority = /** @class */ (function (_super) {
    tslib_1.__extends(B2cAuthority, _super);
    function B2cAuthority(authority, validateAuthority) {
        var _this = _super.call(this, authority, validateAuthority) || this;
        var urlComponents = Utils_1.Utils.GetUrlComponents(authority);
        var pathSegments = urlComponents.PathSegments;
        if (pathSegments.length < 3) {
            throw ErrorMessage_1.ErrorMessage.b2cAuthorityUriInvalidPath;
        }
        _this.CanonicalAuthority = "https://" + urlComponents.HostNameAndPort + "/" + pathSegments[0] + "/" + pathSegments[1] + "/" + pathSegments[2] + "/";
        return _this;
    }
    Object.defineProperty(B2cAuthority.prototype, "AuthorityType", {
        get: function () {
            return Authority_1.AuthorityType.B2C;
        },
        enumerable: true,
        configurable: true
    });
    /*
     * Returns a promise with the TenantDiscoveryEndpoint
     */
    B2cAuthority.prototype.GetOpenIdConfigurationEndpointAsync = function () {
        var _this = this;
        var resultPromise = new Promise(function (resolve, reject) {
            return resolve(_this.DefaultOpenIdConfigurationEndpoint);
        });
        if (!this.IsValidationEnabled) {
            return resultPromise;
        }
        if (this.IsInTrustedHostList(this.CanonicalAuthorityUrlComponents.HostNameAndPort)) {
            return resultPromise;
        }
        return new Promise(function (resolve, reject) {
            return reject(ErrorMessage_1.ErrorMessage.unsupportedAuthorityValidation);
        });
    };
    return B2cAuthority;
}(AadAuthority_1.AadAuthority));
exports.B2cAuthority = B2cAuthority;
//# sourceMappingURL=B2cAuthority.js.map

/***/ })
/******/ ]);