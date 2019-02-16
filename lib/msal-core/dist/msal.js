/*! msal v0.2.4 2019-02-16 */
'use strict';
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("Msal", [], factory);
	else if(typeof exports === 'object')
		exports["Msal"] = factory();
	else
		root["Msal"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
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
/******/ 	return __webpack_require__(__webpack_require__.s = 11);
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
/**
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
    /**
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
    /**
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
    /**
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
    /**
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
/**
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
/**
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
/**
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


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = __webpack_require__(0);
var ErrorMessage_1 = __webpack_require__(5);
var XHRClient_1 = __webpack_require__(10);
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
/**
 * @hidden
 */
var AuthorityType;
(function (AuthorityType) {
    AuthorityType[AuthorityType["Aad"] = 0] = "Aad";
    AuthorityType[AuthorityType["Adfs"] = 1] = "Adfs";
    AuthorityType[AuthorityType["B2C"] = 2] = "B2C";
})(AuthorityType = exports.AuthorityType || (exports.AuthorityType = {}));
/**
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
        /**
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
        /**
         * // http://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
         */
        get: function () {
            return this.CanonicalAuthority + "v2.0/.well-known/openid-configuration";
        },
        enumerable: true,
        configurable: true
    });
    /**
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
    /**
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
    /**
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


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

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
Object.defineProperty(exports, "__esModule", { value: true });
var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b)
        if (b.hasOwnProperty(p))
            d[p] = b[p]; };
function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
exports.__extends = __extends;
exports.__assign = Object.assign || function __assign(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
    }
    return t;
};
function __rest(s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++)
            if (e.indexOf(p[i]) < 0)
                t[p[i]] = s[p[i]];
    return t;
}
exports.__rest = __rest;
function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
        r = Reflect.decorate(decorators, target, key, desc);
    else
        for (var i = decorators.length - 1; i >= 0; i--)
            if (d = decorators[i])
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
exports.__decorate = __decorate;
function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); };
}
exports.__param = __param;
function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
        return Reflect.metadata(metadataKey, metadataValue);
}
exports.__metadata = __metadata;
function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try {
            step(generator.next(value));
        }
        catch (e) {
            reject(e);
        } }
        function rejected(value) { try {
            step(generator.throw(value));
        }
        catch (e) {
            reject(e);
        } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}
exports.__awaiter = __awaiter;
function __generator(thisArg, body) {
    var _ = { label: 0, sent: function () { if (t[0] & 1)
            throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f)
            throw new TypeError("Generator is already executing.");
        while (_)
            try {
                if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done)
                    return t;
                if (y = 0, t)
                    op = [0, t.value];
                switch (op[0]) {
                    case 0:
                    case 1:
                        t = op;
                        break;
                    case 4:
                        _.label++;
                        return { value: op[1], done: false };
                    case 5:
                        _.label++;
                        y = op[1];
                        op = [0];
                        continue;
                    case 7:
                        op = _.ops.pop();
                        _.trys.pop();
                        continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                            _ = 0;
                            continue;
                        }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                            _.label = op[1];
                            break;
                        }
                        if (op[0] === 6 && _.label < t[1]) {
                            _.label = t[1];
                            t = op;
                            break;
                        }
                        if (t && _.label < t[2]) {
                            _.label = t[2];
                            _.ops.push(op);
                            break;
                        }
                        if (t[2])
                            _.ops.pop();
                        _.trys.pop();
                        continue;
                }
                op = body.call(thisArg, _);
            }
            catch (e) {
                op = [6, e];
                y = 0;
            }
            finally {
                f = t = 0;
            }
        if (op[0] & 5)
            throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
    }
}
exports.__generator = __generator;
function __exportStar(m, exports) {
    for (var p in m)
        if (!exports.hasOwnProperty(p))
            exports[p] = m[p];
}
exports.__exportStar = __exportStar;
function __values(o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m)
        return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length)
                o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
}
exports.__values = __values;
function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
        return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
            ar.push(r.value);
    }
    catch (error) {
        e = { error: error };
    }
    finally {
        try {
            if (r && !r.done && (m = i["return"]))
                m.call(i);
        }
        finally {
            if (e)
                throw e.error;
        }
    }
    return ar;
}
exports.__read = __read;
function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}
exports.__spread = __spread;
function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}
exports.__await = __await;
function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator)
        throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n])
        i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try {
        step(g[n](v));
    }
    catch (e) {
        settle(q[0][3], e);
    } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length)
        resume(q[0][0], q[0][1]); }
}
exports.__asyncGenerator = __asyncGenerator;
function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { if (o[n])
        i[n] = function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; }; }
}
exports.__asyncDelegator = __asyncDelegator;
function __asyncValues(o) {
    if (!Symbol.asyncIterator)
        throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator];
    return m ? m.call(o) : typeof __values === "function" ? __values(o) : o[Symbol.iterator]();
}
exports.__asyncValues = __asyncValues;


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
        /**
         * @hidden
         */
        this._level = LogLevel.Info;
        var _a = options.correlationId, correlationId = _a === void 0 ? "" : _a, _b = options.level, level = _b === void 0 ? LogLevel.Info : _b, _c = options.piiLoggingEnabled, piiLoggingEnabled = _c === void 0 ? false : _c;
        this._localCallback = localCallback;
        this._correlationId = correlationId;
        this._level = level;
        this._piiLoggingEnabled = piiLoggingEnabled;
    }
    /**
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
    /**
     * @hidden
     */
    Logger.prototype.executeCallback = function (level, message, containsPii) {
        if (this._localCallback) {
            this._localCallback(level, message, containsPii);
        }
    };
    /**
     * @hidden
     */
    Logger.prototype.error = function (message) {
        this.logMessage(LogLevel.Error, message, false);
    };
    /**
     * @hidden
     */
    Logger.prototype.errorPii = function (message) {
        this.logMessage(LogLevel.Error, message, true);
    };
    /**
     * @hidden
     */
    Logger.prototype.warning = function (message) {
        this.logMessage(LogLevel.Warning, message, false);
    };
    /**
     * @hidden
     */
    Logger.prototype.warningPii = function (message) {
        this.logMessage(LogLevel.Warning, message, true);
    };
    /**
     * @hidden
     */
    Logger.prototype.info = function (message) {
        this.logMessage(LogLevel.Info, message, false);
    };
    /**
     * @hidden
     */
    Logger.prototype.infoPii = function (message) {
        this.logMessage(LogLevel.Info, message, true);
    };
    /**
     * @hidden
     */
    Logger.prototype.verbose = function (message) {
        this.logMessage(LogLevel.Verbose, message, false);
    };
    /**
     * @hidden
     */
    Logger.prototype.verbosePii = function (message) {
        this.logMessage(LogLevel.Verbose, message, true);
    };
    return Logger;
}());
exports.Logger = Logger;


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
/**
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
var tslib_1 = __webpack_require__(3);
var AccessTokenKey_1 = __webpack_require__(13);
var AccessTokenValue_1 = __webpack_require__(14);
var AuthenticationRequestParameters_1 = __webpack_require__(15);
var ClientInfo_1 = __webpack_require__(16);
var Constants_1 = __webpack_require__(1);
var IdToken_1 = __webpack_require__(17);
var Logger_1 = __webpack_require__(4);
var Storage_1 = __webpack_require__(18);
var RequestInfo_1 = __webpack_require__(7);
var User_1 = __webpack_require__(8);
var Utils_1 = __webpack_require__(0);
var AuthorityFactory_1 = __webpack_require__(20);
/**
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
    /**
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
        /**
         * @hidden
         */
        this._cacheLocations = {
            localStorage: "localStorage",
            sessionStorage: "sessionStorage"
        };
        /**
         * @hidden
         */
        this._clockSkew = 300;
        /**
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
        /**
         * Used to get the cache location
         */
        get: function () {
            return this._cacheLocation;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UserAgentApplication.prototype, "authority", {
        /**
         * Used to get the authority.
         */
        get: function () {
            return this.authorityInstance.CanonicalAuthority;
        },
        /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
     * Configures popup window for login.
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.openPopup = function (urlNavigate, title, popUpWidth, popUpHeight) {
        try {
            /**
             * adding winLeft and winTop to account for dual monitor
             * using screenLeft and screenTop for IE8 and earlier
             */
            var winLeft = window.screenLeft ? window.screenLeft : window.screenX;
            var winTop = window.screenTop ? window.screenTop : window.screenY;
            /**
             * window.innerWidth displays browser window"s height and width excluding toolbars
             * using document.documentElement.clientWidth for IE8 and earlier
             */
            var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
            var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
            var left = ((width / 2) - (popUpWidth / 2)) + winLeft;
            var top = ((height / 2) - (popUpHeight / 2)) + winTop;
            var popupWindow = window.open(urlNavigate, title, "width=" + popUpWidth + ", height=" + popUpHeight + ", top=" + top + ", left=" + left);
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
    /**
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
/**
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
var Utils_1 = __webpack_require__(0);
var User = /** @class */ (function () {
    /**
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
    /**
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
var tslib_1 = __webpack_require__(3);
var Authority_1 = __webpack_require__(2);
var XHRClient_1 = __webpack_require__(10);
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


/***/ }),
/* 10 */
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
/**
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


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(12);


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var UserAgentApplication_1 = __webpack_require__(6);
exports.UserAgentApplication = UserAgentApplication_1.UserAgentApplication;
var Logger_1 = __webpack_require__(4);
exports.Logger = Logger_1.Logger;
var Logger_2 = __webpack_require__(4);
exports.LogLevel = Logger_2.LogLevel;
var User_1 = __webpack_require__(8);
exports.User = User_1.User;
var Constants_1 = __webpack_require__(1);
exports.Constants = Constants_1.Constants;
var RequestInfo_1 = __webpack_require__(7);
exports.TokenResponse = RequestInfo_1.TokenResponse;
var Authority_1 = __webpack_require__(2);
exports.Authority = Authority_1.Authority;
var UserAgentApplication_2 = __webpack_require__(6);
exports.CacheResult = UserAgentApplication_2.CacheResult;


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
/**
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
/**
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
/**
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
/**
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
/**
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
/**
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
/**
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
/**
 * @hidden
 */
var Utils_1 = __webpack_require__(0);
var AadAuthority_1 = __webpack_require__(9);
var B2cAuthority_1 = __webpack_require__(21);
var Authority_1 = __webpack_require__(2);
var ErrorMessage_1 = __webpack_require__(5);
var AuthorityFactory = /** @class */ (function () {
    function AuthorityFactory() {
    }
    /**
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
    /**
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
var AadAuthority_1 = __webpack_require__(9);
var Authority_1 = __webpack_require__(2);
var ErrorMessage_1 = __webpack_require__(5);
var Utils_1 = __webpack_require__(0);
/**
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
    /**
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


/***/ })
/******/ ]);
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9Nc2FsL3dlYnBhY2svdW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbiIsIndlYnBhY2s6Ly9Nc2FsL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL01zYWwvLi9zcmMvVXRpbHMudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9Db25zdGFudHMudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9BdXRob3JpdHkudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL25vZGVfbW9kdWxlcy90c2xpYi90c2xpYi5lczYuanMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9Mb2dnZXIudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9FcnJvck1lc3NhZ2UudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9Vc2VyQWdlbnRBcHBsaWNhdGlvbi50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL1JlcXVlc3RJbmZvLnRzIiwid2VicGFjazovL01zYWwvLi9zcmMvVXNlci50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL0FhZEF1dGhvcml0eS50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL1hIUkNsaWVudC50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL2luZGV4LnRzIiwid2VicGFjazovL01zYWwvLi9zcmMvQWNjZXNzVG9rZW5LZXkudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9BY2Nlc3NUb2tlblZhbHVlLnRzIiwid2VicGFjazovL01zYWwvLi9zcmMvQXV0aGVudGljYXRpb25SZXF1ZXN0UGFyYW1ldGVycy50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL0NsaWVudEluZm8udHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9JZFRva2VuLnRzIiwid2VicGFjazovL01zYWwvLi9zcmMvU3RvcmFnZS50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL0FjY2Vzc1Rva2VuQ2FjaGVJdGVtLnRzIiwid2VicGFjazovL01zYWwvLi9zcmMvQXV0aG9yaXR5RmFjdG9yeS50cyIsIndl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LEVBQUU7NEJBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQzs0QkFBQyxTQUFTO3lCQUFFO3dCQUM1RyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7NEJBQUUsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQUMsTUFBTTt5QkFBRTt3QkFDdEYsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFOzRCQUFFLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7NEJBQUMsTUFBTTt5QkFBRTt3QkFDckUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7NEJBQUUsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7NEJBQUMsTUFBTTt5QkFBRTt3QkFDbkUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7d0JBQ3RCLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7d0JBQUMsU0FBUztpQkFDOUI7Z0JBQ0QsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQzlCO1lBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQUUsRUFB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MkJBQVksQ0FBQyw4QkFBOEIsQ0FBQztRQUFuRCxDQUFtRCxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUNILG1CQUFDO0FBQUQsQ0FBQyxDQW5DaUMsMkJBQVksR0FtQzdDO0FBbkNZLG9DQUFZIiwiZmlsZSI6Im1zYWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShcIk1zYWxcIiwgW10sIGZhY3RvcnkpO1xuXHRlbHNlIGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jylcblx0XHRleHBvcnRzW1wiTXNhbFwiXSA9IGZhY3RvcnkoKTtcblx0ZWxzZVxuXHRcdHJvb3RbXCJNc2FsXCJdID0gZmFjdG9yeSgpO1xufSkod2luZG93LCBmdW5jdGlvbigpIHtcbnJldHVybiAiLCIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gMTEpO1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvblxuICogIEFsbCBSaWdodHMgUmVzZXJ2ZWRcbiAqICBNSVQgTGljZW5zZVxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpc1xuICogc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlICdTb2Z0d2FyZScpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZVxuICogd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LFxuICogbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuICogcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmdcbiAqIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbiAqIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICogRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTXG4gKiBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksXG4gKiBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUXG4gKiBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuICovXG5cbmltcG9ydCB7IElVcmkgfSBmcm9tIFwiLi9JVXJpXCI7XG5pbXBvcnQgeyBVc2VyIH0gZnJvbSBcIi4vVXNlclwiO1xuaW1wb3J0IHtDb25zdGFudHN9IGZyb20gXCIuL0NvbnN0YW50c1wiO1xuXG4vKipcbiAqIEBoaWRkZW5cbiAqL1xuZXhwb3J0IGNsYXNzIFV0aWxzIHtcbiAgc3RhdGljIGNvbXBhcmVPYmplY3RzKHUxOiBVc2VyLCB1MjogVXNlcik6IGJvb2xlYW4ge1xuICAgaWYgKCF1MSB8fCAhdTIpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgaWYgKHUxLnVzZXJJZGVudGlmaWVyICYmIHUyLnVzZXJJZGVudGlmaWVyKSB7XG4gICAgICBpZiAodTEudXNlcklkZW50aWZpZXIgPT09IHUyLnVzZXJJZGVudGlmaWVyKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzdGF0aWMgZXhwaXJlc0luKGV4cGlyZXM6IHN0cmluZyk6IG51bWJlciB7XG4gICAgLy8gaWYgQUFEIGRpZCBub3Qgc2VuZCBcImV4cGlyZXNfaW5cIiBwcm9wZXJ0eSwgdXNlIGRlZmF1bHQgZXhwaXJhdGlvbiBvZiAzNTk5IHNlY29uZHMsIGZvciBzb21lIHJlYXNvbiBBQUQgc2VuZHMgMzU5OSBhcyBcImV4cGlyZXNfaW5cIiB2YWx1ZSBpbnN0ZWFkIG9mIDM2MDBcbiAgICAgaWYgKCFleHBpcmVzKSB7XG4gICAgICAgICBleHBpcmVzID0gXCIzNTk5XCI7XG4gICAgICB9XG4gICAgcmV0dXJuIHRoaXMubm93KCkgKyBwYXJzZUludChleHBpcmVzLCAxMCk7XG4gIH1cblxuICBzdGF0aWMgbm93KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobmV3IERhdGUoKS5nZXRUaW1lKCkgLyAxMDAwLjApO1xuICB9XG5cbiAgc3RhdGljIGlzRW1wdHkoc3RyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gKHR5cGVvZiBzdHIgPT09IFwidW5kZWZpbmVkXCIgfHwgIXN0ciB8fCAwID09PSBzdHIubGVuZ3RoKTtcbiAgfVxuXG4gIHN0YXRpYyBleHRyYWN0SWRUb2tlbihlbmNvZGVkSWRUb2tlbjogc3RyaW5nKTogYW55IHtcbiAgICAvLyBpZCB0b2tlbiB3aWxsIGJlIGRlY29kZWQgdG8gZ2V0IHRoZSB1c2VybmFtZVxuICAgIGNvbnN0IGRlY29kZWRUb2tlbiA9IHRoaXMuZGVjb2RlSnd0KGVuY29kZWRJZFRva2VuKTtcbiAgICBpZiAoIWRlY29kZWRUb2tlbikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBiYXNlNjRJZFRva2VuID0gZGVjb2RlZFRva2VuLkpXU1BheWxvYWQ7XG4gICAgICBjb25zdCBiYXNlNjREZWNvZGVkID0gdGhpcy5iYXNlNjREZWNvZGVTdHJpbmdVcmxTYWZlKGJhc2U2NElkVG9rZW4pO1xuICAgICAgaWYgKCFiYXNlNjREZWNvZGVkKSB7XG4gICAgICAgIC8vdGhpcy5fcmVxdWVzdENvbnRleHQubG9nZ2VyLmluZm8oXCJUaGUgcmV0dXJuZWQgaWRfdG9rZW4gY291bGQgbm90IGJlIGJhc2U2NCB1cmwgc2FmZSBkZWNvZGVkLlwiKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICAvLyBFQ01BIHNjcmlwdCBoYXMgSlNPTiBidWlsdC1pbiBzdXBwb3J0XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShiYXNlNjREZWNvZGVkKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIC8vdGhpcy5fcmVxdWVzdENvbnRleHQubG9nZ2VyLmVycm9yKFwiVGhlIHJldHVybmVkIGlkX3Rva2VuIGNvdWxkIG5vdCBiZSBkZWNvZGVkXCIgKyBlcnIpO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgc3RhdGljIGJhc2U2NEVuY29kZVN0cmluZ1VybFNhZmUoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgLy8gaHRtbDUgc2hvdWxkIHN1cHBvcnQgYXRvYiBmdW5jdGlvbiBmb3IgZGVjb2RpbmdcbiAgICBpZiAod2luZG93LmJ0b2EpIHtcbiAgICAgIHJldHVybiB3aW5kb3cuYnRvYShpbnB1dCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuZW5jb2RlKGlucHV0KTtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgYmFzZTY0RGVjb2RlU3RyaW5nVXJsU2FmZShiYXNlNjRJZFRva2VuOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIC8vIGh0bWw1IHNob3VsZCBzdXBwb3J0IGF0b2IgZnVuY3Rpb24gZm9yIGRlY29kaW5nXG4gICAgYmFzZTY0SWRUb2tlbiA9IGJhc2U2NElkVG9rZW4ucmVwbGFjZSgvLS9nLCBcIitcIikucmVwbGFjZSgvXy9nLCBcIi9cIik7XG4gICAgaWYgKHdpbmRvdy5hdG9iKSB7XG4gICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoZW5jb2RlVVJJQ29tcG9uZW50KHdpbmRvdy5hdG9iKGJhc2U2NElkVG9rZW4pKSk7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChlbmNvZGVVUklDb21wb25lbnQodGhpcy5kZWNvZGUoYmFzZTY0SWRUb2tlbikpKTtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgZW5jb2RlKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGtleVN0cjogc3RyaW5nID0gXCJBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvPVwiO1xuICAgIGxldCBvdXRwdXQgPSBcIlwiO1xuICAgIGxldCBjaHIxOiBudW1iZXIsIGNocjI6IG51bWJlciwgY2hyMzogbnVtYmVyLCBlbmMxOiBudW1iZXIsIGVuYzI6IG51bWJlciwgZW5jMzogbnVtYmVyLCBlbmM0OiBudW1iZXI7XG4gICAgdmFyIGkgPSAwO1xuXG4gICAgaW5wdXQgPSB0aGlzLnV0ZjhFbmNvZGUoaW5wdXQpO1xuXG4gICAgd2hpbGUgKGkgPCBpbnB1dC5sZW5ndGgpIHtcbiAgICAgIGNocjEgPSBpbnB1dC5jaGFyQ29kZUF0KGkrKyk7XG4gICAgICBjaHIyID0gaW5wdXQuY2hhckNvZGVBdChpKyspO1xuICAgICAgY2hyMyA9IGlucHV0LmNoYXJDb2RlQXQoaSsrKTtcblxuICAgICAgZW5jMSA9IGNocjEgPj4gMjtcbiAgICAgIGVuYzIgPSAoKGNocjEgJiAzKSA8PCA0KSB8IChjaHIyID4+IDQpO1xuICAgICAgZW5jMyA9ICgoY2hyMiAmIDE1KSA8PCAyKSB8IChjaHIzID4+IDYpO1xuICAgICAgZW5jNCA9IGNocjMgJiA2MztcblxuICAgICAgaWYgKGlzTmFOKGNocjIpKSB7XG4gICAgICAgIGVuYzMgPSBlbmM0ID0gNjQ7XG4gICAgICB9IGVsc2UgaWYgKGlzTmFOKGNocjMpKSB7XG4gICAgICAgIGVuYzQgPSA2NDtcbiAgICAgIH1cblxuICAgICAgb3V0cHV0ID0gb3V0cHV0ICsga2V5U3RyLmNoYXJBdChlbmMxKSArIGtleVN0ci5jaGFyQXQoZW5jMikgKyBrZXlTdHIuY2hhckF0KGVuYzMpICsga2V5U3RyLmNoYXJBdChlbmM0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0cHV0LnJlcGxhY2UoL1xcKy9nLCBcIi1cIikucmVwbGFjZSgvXFwvL2csIFwiX1wiKS5yZXBsYWNlKC89KyQvLCBcIlwiKTtcbiAgfVxuXG4gIHN0YXRpYyB1dGY4RW5jb2RlKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlucHV0ID0gaW5wdXQucmVwbGFjZSgvXFxyXFxuL2csIFwiXFxuXCIpO1xuICAgIHZhciB1dGZ0ZXh0ID0gXCJcIjtcblxuICAgIGZvciAodmFyIG4gPSAwOyBuIDwgaW5wdXQubGVuZ3RoOyBuKyspIHtcbiAgICAgIHZhciBjID0gaW5wdXQuY2hhckNvZGVBdChuKTtcblxuICAgICAgaWYgKGMgPCAxMjgpIHtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGMpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoKGMgPiAxMjcpICYmIChjIDwgMjA0OCkpIHtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjID4+IDYpIHwgMTkyKTtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjICYgNjMpIHwgMTI4KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKGMgPj4gMTIpIHwgMjI0KTtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCgoYyA+PiA2KSAmIDYzKSB8IDEyOCk7XG4gICAgICAgIHV0ZnRleHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgoYyAmIDYzKSB8IDEyOCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHV0ZnRleHQ7XG4gIH1cblxuICBzdGF0aWMgZGVjb2RlKGJhc2U2NElkVG9rZW46IHN0cmluZyk6IHN0cmluZyB7XG4gICAgdmFyIGNvZGVzID0gXCJBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvPVwiO1xuICAgIGJhc2U2NElkVG9rZW4gPSBTdHJpbmcoYmFzZTY0SWRUb2tlbikucmVwbGFjZSgvPSskLywgXCJcIik7XG4gICAgdmFyIGxlbmd0aCA9IGJhc2U2NElkVG9rZW4ubGVuZ3RoO1xuICAgIGlmIChsZW5ndGggJSA0ID09PSAxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgdG9rZW4gdG8gYmUgZGVjb2RlZCBpcyBub3QgY29ycmVjdGx5IGVuY29kZWQuXCIpO1xuICAgIH1cbiAgICBsZXQgaDE6IG51bWJlciwgaDI6IG51bWJlciwgaDM6IG51bWJlciwgaDQ6IG51bWJlciwgYml0czogbnVtYmVyLCBjMTogbnVtYmVyLCBjMjogbnVtYmVyLCBjMzogbnVtYmVyLCBkZWNvZGVkID0gXCJcIjtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSA0KSB7XG4gICAgICAvL0V2ZXJ5IDQgYmFzZTY0IGVuY29kZWQgY2hhcmFjdGVyIHdpbGwgYmUgY29udmVydGVkIHRvIDMgYnl0ZSBzdHJpbmcsIHdoaWNoIGlzIDI0IGJpdHNcbiAgICAgIC8vIHRoZW4gNiBiaXRzIHBlciBiYXNlNjQgZW5jb2RlZCBjaGFyYWN0ZXJcbiAgICAgIGgxID0gY29kZXMuaW5kZXhPZihiYXNlNjRJZFRva2VuLmNoYXJBdChpKSk7XG4gICAgICBoMiA9IGNvZGVzLmluZGV4T2YoYmFzZTY0SWRUb2tlbi5jaGFyQXQoaSArIDEpKTtcbiAgICAgIGgzID0gY29kZXMuaW5kZXhPZihiYXNlNjRJZFRva2VuLmNoYXJBdChpICsgMikpO1xuICAgICAgaDQgPSBjb2Rlcy5pbmRleE9mKGJhc2U2NElkVG9rZW4uY2hhckF0KGkgKyAzKSk7XG4gICAgICAvLyBGb3IgcGFkZGluZywgaWYgbGFzdCB0d28gYXJlIFwiPVwiXG4gICAgICBpZiAoaSArIDIgPT09IGxlbmd0aCAtIDEpIHtcbiAgICAgICAgYml0cyA9IGgxIDw8IDE4IHwgaDIgPDwgMTIgfCBoMyA8PCA2O1xuICAgICAgICBjMSA9IGJpdHMgPj4gMTYgJiAyNTU7XG4gICAgICAgIGMyID0gYml0cyA+PiA4ICYgMjU1O1xuICAgICAgICBkZWNvZGVkICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYzEsIGMyKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICAvLyBpZiBsYXN0IG9uZSBpcyBcIj1cIlxuICAgICAgZWxzZSBpZiAoaSArIDEgPT09IGxlbmd0aCAtIDEpIHtcbiAgICAgICAgYml0cyA9IGgxIDw8IDE4IHwgaDIgPDwgMTI7XG4gICAgICAgIGMxID0gYml0cyA+PiAxNiAmIDI1NTtcbiAgICAgICAgZGVjb2RlZCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGMxKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBiaXRzID0gaDEgPDwgMTggfCBoMiA8PCAxMiB8IGgzIDw8IDYgfCBoNDtcbiAgICAgIC8vIHRoZW4gY29udmVydCB0byAzIGJ5dGUgY2hhcnNcbiAgICAgIGMxID0gYml0cyA+PiAxNiAmIDI1NTtcbiAgICAgIGMyID0gYml0cyA+PiA4ICYgMjU1O1xuICAgICAgYzMgPSBiaXRzICYgMjU1O1xuICAgICAgZGVjb2RlZCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGMxLCBjMiwgYzMpO1xuICAgIH1cbiAgICByZXR1cm4gZGVjb2RlZDtcbiAgfVxuXG4gIHN0YXRpYyBkZWNvZGVKd3Qoand0VG9rZW46IHN0cmluZyk6IGFueSB7XG4gICAgaWYgKHRoaXMuaXNFbXB0eShqd3RUb2tlbikpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBpZFRva2VuUGFydHNSZWdleCA9IC9eKFteXFwuXFxzXSopXFwuKFteXFwuXFxzXSspXFwuKFteXFwuXFxzXSopJC87XG4gICAgY29uc3QgbWF0Y2hlcyA9IGlkVG9rZW5QYXJ0c1JlZ2V4LmV4ZWMoand0VG9rZW4pO1xuICAgIGlmICghbWF0Y2hlcyB8fCBtYXRjaGVzLmxlbmd0aCA8IDQpIHtcbiAgICAgIC8vdGhpcy5fcmVxdWVzdENvbnRleHQubG9nZ2VyLndhcm4oXCJUaGUgcmV0dXJuZWQgaWRfdG9rZW4gaXMgbm90IHBhcnNlYWJsZS5cIik7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgY3JhY2tlZFRva2VuID0ge1xuICAgICAgaGVhZGVyOiBtYXRjaGVzWzFdLFxuICAgICAgSldTUGF5bG9hZDogbWF0Y2hlc1syXSxcbiAgICAgIEpXU1NpZzogbWF0Y2hlc1szXVxuICAgIH07XG4gICAgcmV0dXJuIGNyYWNrZWRUb2tlbjtcbiAgfVxuXG4gIHN0YXRpYyBkZXNlcmlhbGl6ZShxdWVyeTogc3RyaW5nKTogYW55IHtcbiAgICBsZXQgbWF0Y2g6IEFycmF5PHN0cmluZz47IC8vIFJlZ2V4IGZvciByZXBsYWNpbmcgYWRkaXRpb24gc3ltYm9sIHdpdGggYSBzcGFjZVxuICAgIGNvbnN0IHBsID0gL1xcKy9nO1xuICAgIGNvbnN0IHNlYXJjaCA9IC8oW14mPV0rKT0oW14mXSopL2c7XG4gICAgY29uc3QgZGVjb2RlID0gKHM6IHN0cmluZykgPT4gZGVjb2RlVVJJQ29tcG9uZW50KHMucmVwbGFjZShwbCwgXCIgXCIpKTtcbiAgICBjb25zdCBvYmo6IHt9ID0ge307XG4gICAgbWF0Y2ggPSBzZWFyY2guZXhlYyhxdWVyeSk7XG4gICAgd2hpbGUgKG1hdGNoKSB7XG4gICAgICBvYmpbZGVjb2RlKG1hdGNoWzFdKV0gPSBkZWNvZGUobWF0Y2hbMl0pO1xuICAgICAgbWF0Y2ggPSBzZWFyY2guZXhlYyhxdWVyeSk7XG4gICAgfVxuICAgIHJldHVybiBvYmo7XG4gIH1cblxuICBzdGF0aWMgaXNJbnRlcnNlY3RpbmdTY29wZXMoY2FjaGVkU2NvcGVzOiBBcnJheTxzdHJpbmc+LCBzY29wZXM6IEFycmF5PHN0cmluZz4pOiBib29sZWFuIHtcbiAgICBjYWNoZWRTY29wZXMgPSB0aGlzLmNvbnZlcnRUb0xvd2VyQ2FzZShjYWNoZWRTY29wZXMpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2NvcGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChjYWNoZWRTY29wZXMuaW5kZXhPZihzY29wZXNbaV0udG9Mb3dlckNhc2UoKSkgPiAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgc3RhdGljIGNvbnRhaW5zU2NvcGUoY2FjaGVkU2NvcGVzOiBBcnJheTxzdHJpbmc+LCBzY29wZXM6IEFycmF5PHN0cmluZz4pOiBib29sZWFuIHtcbiAgICBjYWNoZWRTY29wZXMgPSB0aGlzLmNvbnZlcnRUb0xvd2VyQ2FzZShjYWNoZWRTY29wZXMpO1xuICAgIHJldHVybiBzY29wZXMuZXZlcnkoKHZhbHVlOiBhbnkpOiBib29sZWFuID0+IGNhY2hlZFNjb3Blcy5pbmRleE9mKHZhbHVlLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSkgPj0gMCk7XG4gIH1cblxuICBzdGF0aWMgY29udmVydFRvTG93ZXJDYXNlKHNjb3BlczogQXJyYXk8c3RyaW5nPik6IEFycmF5PHN0cmluZz4ge1xuICAgIHJldHVybiBzY29wZXMubWFwKHNjb3BlID0+IHNjb3BlLnRvTG93ZXJDYXNlKCkpO1xuICB9XG5cbiAgc3RhdGljIHJlbW92ZUVsZW1lbnQoc2NvcGVzOiBBcnJheTxzdHJpbmc+LCBzY29wZTogc3RyaW5nKTogQXJyYXk8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHNjb3Blcy5maWx0ZXIodmFsdWUgPT4gdmFsdWUgIT09IHNjb3BlKTtcbiAgfVxuXG4gIHN0YXRpYyBkZWNpbWFsVG9IZXgobnVtOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHZhciBoZXg6IHN0cmluZyA9IG51bS50b1N0cmluZygxNik7XG4gICAgd2hpbGUgKGhleC5sZW5ndGggPCAyKSB7XG4gICAgICBoZXggPSBcIjBcIiArIGhleDtcbiAgICB9XG4gICAgcmV0dXJuIGhleDtcbiAgfVxuXG4gIHN0YXRpYyBnZXRMaWJyYXJ5VmVyc2lvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiBcIjAuMi40XCI7XG4gIH1cblxuICAvKipcbiAgICAqIEdpdmVuIGEgdXJsIGxpa2UgaHR0cHM6Ly9hOmIvY29tbW9uL2Q/ZT1mI2csIGFuZCBhIHRlbmFudElkLCByZXR1cm5zIGh0dHBzOi8vYTpiL3RlbmFudElkL2RcbiAgICAqIEBwYXJhbSBocmVmIFRoZSB1cmxcbiAgICAqIEBwYXJhbSB0ZW5hbnRJZCBUaGUgdGVuYW50IGlkIHRvIHJlcGxhY2VcbiAgICAqL1xuICAgIHN0YXRpYyByZXBsYWNlRmlyc3RQYXRoKHVybDogc3RyaW5nLCB0ZW5hbnRJZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKCF0ZW5hbnRJZCkge1xuICAgICAgICAgICAgcmV0dXJuIHVybDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdXJsT2JqZWN0ID0gdGhpcy5HZXRVcmxDb21wb25lbnRzKHVybCk7XG4gICAgICAgIHZhciBwYXRoQXJyYXkgPSB1cmxPYmplY3QuUGF0aFNlZ21lbnRzO1xuICAgICAgICBpZiAocGF0aEFycmF5Lmxlbmd0aCAhPT0gMCAmJiAocGF0aEFycmF5WzBdID09PSBDb25zdGFudHMuY29tbW9uIHx8IHBhdGhBcnJheVswXSA9PT0gQ29uc3RhbnRzLm9yZ2FuaXphdGlvbnMpKSB7XG4gICAgICAgICAgICBwYXRoQXJyYXlbMF0gPSB0ZW5hbnRJZDtcbiAgICAgICAgICAgIHVybCA9IHVybE9iamVjdC5Qcm90b2NvbCArIFwiLy9cIiArIHVybE9iamVjdC5Ib3N0TmFtZUFuZFBvcnQgKyBcIi9cIiArIHBhdGhBcnJheS5qb2luKFwiL1wiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cblxuICBzdGF0aWMgY3JlYXRlTmV3R3VpZCgpOiBzdHJpbmcge1xuICAgIC8vIFJGQzQxMjI6IFRoZSB2ZXJzaW9uIDQgVVVJRCBpcyBtZWFudCBmb3IgZ2VuZXJhdGluZyBVVUlEcyBmcm9tIHRydWx5LXJhbmRvbSBvclxuICAgIC8vIHBzZXVkby1yYW5kb20gbnVtYmVycy5cbiAgICAvLyBUaGUgYWxnb3JpdGhtIGlzIGFzIGZvbGxvd3M6XG4gICAgLy8gICAgIFNldCB0aGUgdHdvIG1vc3Qgc2lnbmlmaWNhbnQgYml0cyAoYml0cyA2IGFuZCA3KSBvZiB0aGVcbiAgICAvLyAgICAgICAgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZCB0byB6ZXJvIGFuZCBvbmUsIHJlc3BlY3RpdmVseS5cbiAgICAvLyAgICAgU2V0IHRoZSBmb3VyIG1vc3Qgc2lnbmlmaWNhbnQgYml0cyAoYml0cyAxMiB0aHJvdWdoIDE1KSBvZiB0aGVcbiAgICAvLyAgICAgICAgdGltZV9oaV9hbmRfdmVyc2lvbiBmaWVsZCB0byB0aGUgNC1iaXQgdmVyc2lvbiBudW1iZXIgZnJvbVxuICAgIC8vICAgICAgICBTZWN0aW9uIDQuMS4zLiBWZXJzaW9uNFxuICAgIC8vICAgICBTZXQgYWxsIHRoZSBvdGhlciBiaXRzIHRvIHJhbmRvbWx5IChvciBwc2V1ZG8tcmFuZG9tbHkpIGNob3NlblxuICAgIC8vICAgICB2YWx1ZXMuXG4gICAgLy8gVVVJRCAgICAgICAgICAgICAgICAgICA9IHRpbWUtbG93IFwiLVwiIHRpbWUtbWlkIFwiLVwidGltZS1oaWdoLWFuZC12ZXJzaW9uIFwiLVwiY2xvY2stc2VxLXJlc2VydmVkIGFuZCBsb3coMmhleE9jdGV0KVwiLVwiIG5vZGVcbiAgICAvLyB0aW1lLWxvdyAgICAgICAgICAgICAgID0gNGhleE9jdGV0XG4gICAgLy8gdGltZS1taWQgICAgICAgICAgICAgICA9IDJoZXhPY3RldFxuICAgIC8vIHRpbWUtaGlnaC1hbmQtdmVyc2lvbiAgPSAyaGV4T2N0ZXRcbiAgICAvLyBjbG9jay1zZXEtYW5kLXJlc2VydmVkID0gaGV4T2N0ZXQ6XG4gICAgLy8gY2xvY2stc2VxLWxvdyAgICAgICAgICA9IGhleE9jdGV0XG4gICAgLy8gbm9kZSAgICAgICAgICAgICAgICAgICA9IDZoZXhPY3RldFxuICAgIC8vIEZvcm1hdDogeHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4XG4gICAgLy8geSBjb3VsZCBiZSAxMDAwLCAxMDAxLCAxMDEwLCAxMDExIHNpbmNlIG1vc3Qgc2lnbmlmaWNhbnQgdHdvIGJpdHMgbmVlZHMgdG8gYmUgMTBcbiAgICAvLyB5IHZhbHVlcyBhcmUgOCwgOSwgQSwgQlxuXG4gICAgY29uc3QgY3J5cHRvT2JqOiBDcnlwdG8gPSB3aW5kb3cuY3J5cHRvOyAvLyBmb3IgSUUgMTFcbiAgICBpZiAoY3J5cHRvT2JqICYmIGNyeXB0b09iai5nZXRSYW5kb21WYWx1ZXMpIHtcbiAgICAgIGNvbnN0IGJ1ZmZlcjogVWludDhBcnJheSA9IG5ldyBVaW50OEFycmF5KDE2KTtcbiAgICAgIGNyeXB0b09iai5nZXRSYW5kb21WYWx1ZXMoYnVmZmVyKTtcblxuICAgICAgLy9idWZmZXJbNl0gYW5kIGJ1ZmZlcls3XSByZXByZXNlbnRzIHRoZSB0aW1lX2hpX2FuZF92ZXJzaW9uIGZpZWxkLiBXZSB3aWxsIHNldCB0aGUgZm91ciBtb3N0IHNpZ25pZmljYW50IGJpdHMgKDQgdGhyb3VnaCA3KSBvZiBidWZmZXJbNl0gdG8gcmVwcmVzZW50IGRlY2ltYWwgbnVtYmVyIDQgKFVVSUQgdmVyc2lvbiBudW1iZXIpLlxuICAgICAgYnVmZmVyWzZdIHw9IDB4NDA7IC8vYnVmZmVyWzZdIHwgMDEwMDAwMDAgd2lsbCBzZXQgdGhlIDYgYml0IHRvIDEuXG4gICAgICBidWZmZXJbNl0gJj0gMHg0ZjsgLy9idWZmZXJbNl0gJiAwMTAwMTExMSB3aWxsIHNldCB0aGUgNCwgNSwgYW5kIDcgYml0IHRvIDAgc3VjaCB0aGF0IGJpdHMgNC03ID09IDAxMDAgPSBcIjRcIi5cblxuICAgICAgLy9idWZmZXJbOF0gcmVwcmVzZW50cyB0aGUgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZCBmaWVsZC4gV2Ugd2lsbCBzZXQgdGhlIHR3byBtb3N0IHNpZ25pZmljYW50IGJpdHMgKDYgYW5kIDcpIG9mIHRoZSBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkIHRvIHplcm8gYW5kIG9uZSwgcmVzcGVjdGl2ZWx5LlxuICAgICAgYnVmZmVyWzhdIHw9IDB4ODA7IC8vYnVmZmVyWzhdIHwgMTAwMDAwMDAgd2lsbCBzZXQgdGhlIDcgYml0IHRvIDEuXG4gICAgICBidWZmZXJbOF0gJj0gMHhiZjsgLy9idWZmZXJbOF0gJiAxMDExMTExMSB3aWxsIHNldCB0aGUgNiBiaXQgdG8gMC5cblxuICAgICAgcmV0dXJuIFV0aWxzLmRlY2ltYWxUb0hleChidWZmZXJbMF0pICsgVXRpbHMuZGVjaW1hbFRvSGV4KGJ1ZmZlclsxXSlcbiAgICAgICAgKyBVdGlscy5kZWNpbWFsVG9IZXgoYnVmZmVyWzJdKSArIFV0aWxzLmRlY2ltYWxUb0hleChidWZmZXJbM10pXG4gICAgICAgICsgXCItXCIgKyBVdGlscy5kZWNpbWFsVG9IZXgoYnVmZmVyWzRdKSArIFV0aWxzLmRlY2ltYWxUb0hleChidWZmZXJbNV0pXG4gICAgICAgICsgXCItXCIgKyBVdGlscy5kZWNpbWFsVG9IZXgoYnVmZmVyWzZdKSArIFV0aWxzLmRlY2ltYWxUb0hleChidWZmZXJbN10pXG4gICAgICAgICsgXCItXCIgKyBVdGlscy5kZWNpbWFsVG9IZXgoYnVmZmVyWzhdKSArIFV0aWxzLmRlY2ltYWxUb0hleChidWZmZXJbOV0pXG4gICAgICAgICsgXCItXCIgKyBVdGlscy5kZWNpbWFsVG9IZXgoYnVmZmVyWzEwXSkgKyBVdGlscy5kZWNpbWFsVG9IZXgoYnVmZmVyWzExXSlcbiAgICAgICAgKyBVdGlscy5kZWNpbWFsVG9IZXgoYnVmZmVyWzEyXSkgKyBVdGlscy5kZWNpbWFsVG9IZXgoYnVmZmVyWzEzXSlcbiAgICAgICAgKyBVdGlscy5kZWNpbWFsVG9IZXgoYnVmZmVyWzE0XSkgKyBVdGlscy5kZWNpbWFsVG9IZXgoYnVmZmVyWzE1XSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29uc3QgZ3VpZEhvbGRlcjogc3RyaW5nID0gXCJ4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHhcIjtcbiAgICAgIGNvbnN0IGhleDogc3RyaW5nID0gXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XG4gICAgICBsZXQgcjogbnVtYmVyID0gMDtcbiAgICAgIGxldCBndWlkUmVzcG9uc2U6IHN0cmluZyA9IFwiXCI7XG4gICAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgMzY7IGkrKykge1xuICAgICAgICBpZiAoZ3VpZEhvbGRlcltpXSAhPT0gXCItXCIgJiYgZ3VpZEhvbGRlcltpXSAhPT0gXCI0XCIpIHtcbiAgICAgICAgICAvLyBlYWNoIHggYW5kIHkgbmVlZHMgdG8gYmUgcmFuZG9tXG4gICAgICAgICAgciA9IE1hdGgucmFuZG9tKCkgICogMTYgfCAwO1xuICAgICAgICB9XG4gICAgICAgIGlmIChndWlkSG9sZGVyW2ldID09PSBcInhcIikge1xuICAgICAgICAgIGd1aWRSZXNwb25zZSArPSBoZXhbcl07XG4gICAgICAgIH0gZWxzZSBpZiAoZ3VpZEhvbGRlcltpXSA9PT0gXCJ5XCIpIHtcbiAgICAgICAgICAvLyBjbG9jay1zZXEtYW5kLXJlc2VydmVkIGZpcnN0IGhleCBpcyBmaWx0ZXJlZCBhbmQgcmVtYWluaW5nIGhleCB2YWx1ZXMgYXJlIHJhbmRvbVxuICAgICAgICAgIHIgJj0gMHgzOyAvLyBiaXQgYW5kIHdpdGggMDAxMSB0byBzZXQgcG9zIDIgdG8gemVybyA/MD8/XG4gICAgICAgICAgciB8PSAweDg7IC8vIHNldCBwb3MgMyB0byAxIGFzIDE/Pz9cbiAgICAgICAgICBndWlkUmVzcG9uc2UgKz0gaGV4W3JdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGd1aWRSZXNwb25zZSArPSBndWlkSG9sZGVyW2ldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZ3VpZFJlc3BvbnNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQYXJzZXMgb3V0IHRoZSBjb21wb25lbnRzIGZyb20gYSB1cmwgc3RyaW5nLlxuICAgKiBAcmV0dXJucyBBbiBvYmplY3Qgd2l0aCB0aGUgdmFyaW91cyBjb21wb25lbnRzLiBQbGVhc2UgY2FjaGUgdGhpcyB2YWx1ZSBpbnN0ZWQgb2YgY2FsbGluZyB0aGlzIG11bHRpcGxlIHRpbWVzIG9uIHRoZSBzYW1lIHVybC5cbiAgICovXG4gIHN0YXRpYyBHZXRVcmxDb21wb25lbnRzKHVybDogc3RyaW5nKTogSVVyaSB7XG4gICAgaWYgKCF1cmwpIHtcbiAgICAgIHRocm93IFwiVXJsIHJlcXVpcmVkXCI7XG4gICAgfVxuXG4gICAgLy8gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vY3VydGlzei8xMTEzOWIyY2ZjYWVmNGEyNjFlMFxuICAgIHZhciByZWdFeCA9IFJlZ0V4cChcIl4oKFteOi8/I10rKTopPygvLyhbXi8/I10qKSk/KFtePyNdKikoXFxcXD8oW14jXSopKT8oIyguKikpP1wiKTtcblxuICAgIHZhciBtYXRjaCA9IHVybC5tYXRjaChyZWdFeCk7XG5cbiAgICBpZiAoIW1hdGNoIHx8IG1hdGNoLmxlbmd0aCA8IDYpIHtcbiAgICAgIHRocm93IFwiVmFsaWQgdXJsIHJlcXVpcmVkXCI7XG4gICAgfVxuXG4gICAgbGV0IHVybENvbXBvbmVudHMgPSA8SVVyaT57XG4gICAgICBQcm90b2NvbDogbWF0Y2hbMV0sXG4gICAgICBIb3N0TmFtZUFuZFBvcnQ6IG1hdGNoWzRdLFxuICAgICAgQWJzb2x1dGVQYXRoOiBtYXRjaFs1XVxuICAgIH07XG5cbiAgICBsZXQgcGF0aFNlZ21lbnRzID0gdXJsQ29tcG9uZW50cy5BYnNvbHV0ZVBhdGguc3BsaXQoXCIvXCIpO1xuICAgIHBhdGhTZWdtZW50cyA9IHBhdGhTZWdtZW50cy5maWx0ZXIoKHZhbCkgPT4gdmFsICYmIHZhbC5sZW5ndGggPiAwKTsgLy8gcmVtb3ZlIGVtcHR5IGVsZW1lbnRzXG4gICAgdXJsQ29tcG9uZW50cy5QYXRoU2VnbWVudHMgPSBwYXRoU2VnbWVudHM7XG4gICAgcmV0dXJuIHVybENvbXBvbmVudHM7XG4gIH1cblxuICAvKipcbiAgICogR2l2ZW4gYSB1cmwgb3IgcGF0aCwgYXBwZW5kIGEgdHJhaWxpbmcgc2xhc2ggaWYgb25lIGRvZXNudCBleGlzdFxuICAgKi9cbiAgc3RhdGljIENhbm9uaWNhbGl6ZVVyaSh1cmw6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKHVybCkge1xuICAgICAgdXJsID0gdXJsLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxuXG4gICAgaWYgKHVybCAmJiAhVXRpbHMuZW5kc1dpdGgodXJsLCBcIi9cIikpIHtcbiAgICAgIHVybCArPSBcIi9cIjtcbiAgICB9XG5cbiAgICByZXR1cm4gdXJsO1xuICB9XG5cbiAgLyoqXG4gICAgKiBDaGVja3MgdG8gc2VlIGlmIHRoZSB1cmwgZW5kcyB3aXRoIHRoZSBzdWZmaXhcbiAgICAqIFJlcXVpcmVkIGJlY2F1c2Ugd2UgYXJlIGNvbXBpbGluZyBmb3IgZXM1IGluc3RlYWQgb2YgZXM2XG4gICAgKiBAcGFyYW0gdXJsXG4gICAgKiBAcGFyYW0gc3RyXG4gICAgKi9cbiAgc3RhdGljIGVuZHNXaXRoKHVybDogc3RyaW5nLCBzdWZmaXg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmICghdXJsIHx8ICFzdWZmaXgpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdXJsLmluZGV4T2Yoc3VmZml4LCB1cmwubGVuZ3RoIC0gc3VmZml4Lmxlbmd0aCkgIT09IC0xO1xuICB9XG5cbiAgICAgc3RhdGljIGNoZWNrU1NPKGV4dHJhUXVlcnlQYXJhbWV0ZXJzOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuICAhKGV4dHJhUXVlcnlQYXJhbWV0ZXJzICYmICAoKGV4dHJhUXVlcnlQYXJhbWV0ZXJzLmluZGV4T2YoQ29uc3RhbnRzLmxvZ2luX2hpbnQpICE9PSAtMSB8fCAgZXh0cmFRdWVyeVBhcmFtZXRlcnMuaW5kZXhPZihDb25zdGFudHMuc2lkKSAhPT0gLTEgKSkpO1xuICAgIH1cblxuICAgICBzdGF0aWMgY29uc3RydWN0VW5pZmllZENhY2hlRXh0cmFRdWVyeVBhcmFtZXRlcihpZFRva2VuT2JqZWN0OiBhbnksIGV4dHJhUXVlcnlQYXJhbWV0ZXJzPzogc3RyaW5nKSB7XG4gICAgICAgICBpZiAoaWRUb2tlbk9iamVjdCkge1xuICAgICAgICAgICAgIGlmIChpZFRva2VuT2JqZWN0Lmhhc093blByb3BlcnR5KENvbnN0YW50cy51cG4pKSB7XG4gICAgICAgICAgICAgICAgIGV4dHJhUXVlcnlQYXJhbWV0ZXJzID0gdGhpcy51cmxSZW1vdmVRdWVyeVN0cmluZ1BhcmFtZXRlcihleHRyYVF1ZXJ5UGFyYW1ldGVycywgQ29uc3RhbnRzLmxvZ2luX2hpbnQpO1xuICAgICAgICAgICAgICAgICBleHRyYVF1ZXJ5UGFyYW1ldGVycyA9IHRoaXMudXJsUmVtb3ZlUXVlcnlTdHJpbmdQYXJhbWV0ZXIoZXh0cmFRdWVyeVBhcmFtZXRlcnMsIENvbnN0YW50cy5kb21haW5faGludCk7XG4gICAgICAgICAgICAgICAgIGlmIChleHRyYVF1ZXJ5UGFyYW1ldGVycykge1xuICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4dHJhUXVlcnlQYXJhbWV0ZXJzICs9IFwiJlwiICsgQ29uc3RhbnRzLmxvZ2luX2hpbnQgKyBcIj1cIiArIGlkVG9rZW5PYmplY3QudXBuICsgXCImXCIgKyBDb25zdGFudHMuZG9tYWluX2hpbnQgKyBcIj1cIiArIENvbnN0YW50cy5vcmdhbml6YXRpb25zO1xuICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4dHJhUXVlcnlQYXJhbWV0ZXJzID0gXCImXCIgKyBDb25zdGFudHMubG9naW5faGludCArIFwiPVwiICsgaWRUb2tlbk9iamVjdC51cG4gKyBcIiZcIiArIENvbnN0YW50cy5kb21haW5faGludCArIFwiPVwiICsgQ29uc3RhbnRzLm9yZ2FuaXphdGlvbnM7XG4gICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgIGV4dHJhUXVlcnlQYXJhbWV0ZXJzID0gdGhpcy51cmxSZW1vdmVRdWVyeVN0cmluZ1BhcmFtZXRlcihleHRyYVF1ZXJ5UGFyYW1ldGVycywgQ29uc3RhbnRzLmRvbWFpbl9oaW50KTtcbiAgICAgICAgICAgICAgICAgaWYgKGV4dHJhUXVlcnlQYXJhbWV0ZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXh0cmFRdWVyeVBhcmFtZXRlcnMgKz0gXCImXCIgKyBDb25zdGFudHMuZG9tYWluX2hpbnQgKyBcIj1cIiArIENvbnN0YW50cy5vcmdhbml6YXRpb25zO1xuICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4dHJhUXVlcnlQYXJhbWV0ZXJzID0gXCImXCIgKyBDb25zdGFudHMuZG9tYWluX2hpbnQgKyBcIj1cIiArIENvbnN0YW50cy5vcmdhbml6YXRpb25zO1xuICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgfVxuICAgICAgICAgfVxuICAgICAgICAgcmV0dXJuIGV4dHJhUXVlcnlQYXJhbWV0ZXJzO1xuICAgICB9XG5cbiAgICAgc3RhdGljIHVybFJlbW92ZVF1ZXJ5U3RyaW5nUGFyYW1ldGVyKHVybDogc3RyaW5nLCBuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICAgaWYgKHRoaXMuaXNFbXB0eSh1cmwpKSB7XG4gICAgICAgICAgICAgcmV0dXJuIHVybDtcbiAgICAgICAgIH1cblxuICAgICAgICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cChcIihcXFxcJlwiICsgbmFtZSArIFwiPSlbXlxcJl0rXCIpO1xuICAgICAgICAgdXJsID0gdXJsLnJlcGxhY2UocmVnZXgsIFwiXCIpO1xuICAgICAgICAgLy8gbmFtZT12YWx1ZSZcbiAgICAgICAgIHJlZ2V4ID0gbmV3IFJlZ0V4cChcIihcIiArIG5hbWUgKyBcIj0pW15cXCZdKyZcIik7XG4gICAgICAgICB1cmwgPSB1cmwucmVwbGFjZShyZWdleCwgXCJcIik7XG4gICAgICAgICAvLyBuYW1lPXZhbHVlXG4gICAgICAgICByZWdleCA9IG5ldyBSZWdFeHAoXCIoXCIgKyBuYW1lICsgXCI9KVteXFwmXStcIik7XG4gICAgICAgICB1cmwgPSB1cmwucmVwbGFjZShyZWdleCwgXCJcIik7XG4gICAgICAgICByZXR1cm4gdXJsO1xuICAgICB9XG5cbn1cbiIsIi8qXG4gICogQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb25cbiAgKiAgQWxsIFJpZ2h0cyBSZXNlcnZlZFxuICAqICBNSVQgTGljZW5zZVxuICAqXG4gICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZiB0aGlzXG4gICogc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlXG4gICogd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LFxuICAqIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbiAgKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZ1xuICAqIGNvbmRpdGlvbnM6XG4gICpcbiAgKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxuICAqIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICAqXG4gICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbiAgKiBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTXG4gICogT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLFxuICAqIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVRcbiAgKiBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuICAqL1xuXG4vKipcbiAqIEBoaWRkZW5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbnN0YW50cyB7XG4gIHN0YXRpYyBnZXQgZXJyb3JEZXNjcmlwdGlvbigpOiBzdHJpbmcgeyByZXR1cm4gXCJlcnJvcl9kZXNjcmlwdGlvblwiOyB9XG4gIHN0YXRpYyBnZXQgZXJyb3IoKTogc3RyaW5nIHsgcmV0dXJuIFwiZXJyb3JcIjsgfVxuICBzdGF0aWMgZ2V0IHNjb3BlKCk6IHN0cmluZyB7IHJldHVybiBcInNjb3BlXCI7IH1cbiAgc3RhdGljIGdldCBhY3F1aXJlVG9rZW5Vc2VyKCk6IHN0cmluZyB7IHJldHVybiBcIm1zYWwuYWNxdWlyZVRva2VuVXNlclwiOyB9XG4gIHN0YXRpYyBnZXQgY2xpZW50SW5mbygpOiBzdHJpbmcgeyByZXR1cm4gXCJjbGllbnRfaW5mb1wiOyB9XG4gIHN0YXRpYyBnZXQgY2xpZW50SWQoKTogc3RyaW5nIHsgcmV0dXJuIFwiY2xpZW50SWRcIjsgfVxuICBzdGF0aWMgZ2V0IGF1dGhvcml0eSgpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLmF1dGhvcml0eVwiOyB9XG4gIHN0YXRpYyBnZXQgaWRUb2tlbigpOiBzdHJpbmcgeyByZXR1cm4gXCJpZF90b2tlblwiOyB9XG4gIHN0YXRpYyBnZXQgYWNjZXNzVG9rZW4oKTogc3RyaW5nIHsgcmV0dXJuIFwiYWNjZXNzX3Rva2VuXCI7IH1cbiAgc3RhdGljIGdldCBleHBpcmVzSW4oKTogc3RyaW5nIHsgcmV0dXJuIFwiZXhwaXJlc19pblwiOyB9XG4gIHN0YXRpYyBnZXQgc2Vzc2lvblN0YXRlKCk6IHN0cmluZyB7IHJldHVybiBcInNlc3Npb25fc3RhdGVcIjsgfVxuICBzdGF0aWMgZ2V0IG1zYWxDbGllbnRJbmZvKCk6IHN0cmluZyB7IHJldHVybiBcIm1zYWwuY2xpZW50LmluZm9cIjsgfVxuICBzdGF0aWMgZ2V0IG1zYWxFcnJvcigpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLmVycm9yXCI7IH1cbiAgc3RhdGljIGdldCBtc2FsRXJyb3JEZXNjcmlwdGlvbigpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLmVycm9yLmRlc2NyaXB0aW9uXCI7IH1cbiAgc3RhdGljIGdldCBtc2FsU2Vzc2lvblN0YXRlKCk6IHN0cmluZyB7IHJldHVybiBcIm1zYWwuc2Vzc2lvbi5zdGF0ZVwiOyB9XG4gIHN0YXRpYyBnZXQgdG9rZW5LZXlzKCk6IHN0cmluZyB7IHJldHVybiBcIm1zYWwudG9rZW4ua2V5c1wiOyB9XG4gIHN0YXRpYyBnZXQgYWNjZXNzVG9rZW5LZXkoKTogc3RyaW5nIHsgcmV0dXJuIFwibXNhbC5hY2Nlc3MudG9rZW4ua2V5XCI7IH1cbiAgc3RhdGljIGdldCBleHBpcmF0aW9uS2V5KCk6IHN0cmluZyB7IHJldHVybiBcIm1zYWwuZXhwaXJhdGlvbi5rZXlcIjsgfVxuICBzdGF0aWMgZ2V0IHN0YXRlTG9naW4oKTogc3RyaW5nIHsgcmV0dXJuIFwibXNhbC5zdGF0ZS5sb2dpblwiOyB9XG4gIHN0YXRpYyBnZXQgc3RhdGVBY3F1aXJlVG9rZW4oKTogc3RyaW5nIHsgcmV0dXJuIFwibXNhbC5zdGF0ZS5hY3F1aXJlVG9rZW5cIjsgfVxuICBzdGF0aWMgZ2V0IHN0YXRlUmVuZXcoKTogc3RyaW5nIHsgcmV0dXJuIFwibXNhbC5zdGF0ZS5yZW5ld1wiOyB9XG4gIHN0YXRpYyBnZXQgbm9uY2VJZFRva2VuKCk6IHN0cmluZyB7IHJldHVybiBcIm1zYWwubm9uY2UuaWR0b2tlblwiOyB9XG4gIHN0YXRpYyBnZXQgdXNlck5hbWUoKTogc3RyaW5nIHsgcmV0dXJuIFwibXNhbC51c2VybmFtZVwiOyB9XG4gIHN0YXRpYyBnZXQgaWRUb2tlbktleSgpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLmlkdG9rZW5cIjsgfVxuICBzdGF0aWMgZ2V0IGxvZ2luUmVxdWVzdCgpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLmxvZ2luLnJlcXVlc3RcIjsgfVxuICBzdGF0aWMgZ2V0IGxvZ2luRXJyb3IoKTogc3RyaW5nIHsgcmV0dXJuIFwibXNhbC5sb2dpbi5lcnJvclwiOyB9XG4gIHN0YXRpYyBnZXQgcmVuZXdTdGF0dXMoKTogc3RyaW5nIHsgcmV0dXJuIFwibXNhbC50b2tlbi5yZW5ldy5zdGF0dXNcIjsgfVxuICBzdGF0aWMgZ2V0IG1zYWwoKTogc3RyaW5nIHsgcmV0dXJuIFwibXNhbFwiOyB9XG4gIHN0YXRpYyBnZXQgbm9fdXNlcigpOiBzdHJpbmcgeyByZXR1cm4gXCJOT19VU0VSXCI7IH1cbiAgc3RhdGljIGdldCBsb2dpbl9oaW50KCk6IHN0cmluZyB7IHJldHVybiBcImxvZ2luX2hpbnRcIjsgfVxuICBzdGF0aWMgZ2V0IGRvbWFpbl9oaW50KCk6IHN0cmluZyB7IHJldHVybiBcImRvbWFpbl9oaW50XCI7IH1cbiAgc3RhdGljIGdldCBvcmdhbml6YXRpb25zKCk6IHN0cmluZyB7IHJldHVybiBcIm9yZ2FuaXphdGlvbnNcIjsgfVxuICBzdGF0aWMgZ2V0IGNvbnN1bWVycygpOiBzdHJpbmcgeyByZXR1cm4gXCJjb25zdW1lcnNcIjsgfVxuICBzdGF0aWMgZ2V0IGNvbnN1bWVyc1V0aWQoKTogc3RyaW5nIHsgcmV0dXJuIFwiOTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFkXCI7IH1cbiAgc3RhdGljIGdldCBzaWQoKTogc3RyaW5nIHsgcmV0dXJuIFwic2lkXCI7IH1cbiAgc3RhdGljIGdldCB1cG4oKTogc3RyaW5nIHsgcmV0dXJuIFwidXBuXCI7IH1cbiAgc3RhdGljIGdldCBhZGFsSWRUb2tlbigpOiBzdHJpbmcgeyByZXR1cm4gXCJhZGFsLmlkdG9rZW5cIjsgfVxuICBzdGF0aWMgZ2V0IHByb21wdF9zZWxlY3RfYWNjb3VudCgpOiBzdHJpbmcgeyByZXR1cm4gXCImcHJvbXB0PXNlbGVjdF9hY2NvdW50XCI7IH1cbiAgc3RhdGljIGdldCBwcm9tcHRfbm9uZSgpOiBzdHJpbmcgeyByZXR1cm4gXCImcHJvbXB0PW5vbmVcIjsgfVxuICBzdGF0aWMgZ2V0IHByb21wdCgpOiBzdHJpbmcgeyByZXR1cm4gXCJwcm9tcHRcIjsgfVxuICBzdGF0aWMgZ2V0IHJlc3BvbnNlX21vZGVfZnJhZ21lbnQoKTogc3RyaW5nIHsgcmV0dXJuIFwiJnJlc3BvbnNlX21vZGU9ZnJhZ21lbnRcIjsgfVxuICBzdGF0aWMgZ2V0IHJlc291cmNlRGVsaW1ldGVyKCk6IHN0cmluZyB7IHJldHVybiBcInxcIjsgfVxuICBzdGF0aWMgZ2V0IHRva2VuUmVuZXdTdGF0dXNDYW5jZWxsZWQoKTogc3RyaW5nIHsgcmV0dXJuIFwiQ2FuY2VsZWRcIjsgfVxuICBzdGF0aWMgZ2V0IHRva2VuUmVuZXdTdGF0dXNDb21wbGV0ZWQoKTogc3RyaW5nIHsgcmV0dXJuIFwiQ29tcGxldGVkXCI7IH1cbiAgc3RhdGljIGdldCB0b2tlblJlbmV3U3RhdHVzSW5Qcm9ncmVzcygpOiBzdHJpbmcgeyByZXR1cm4gXCJJbiBQcm9ncmVzc1wiOyB9XG4gIHByaXZhdGUgc3RhdGljIF9wb3BVcFdpZHRoOiBudW1iZXIgPSA0ODM7XG4gIHN0YXRpYyBnZXQgcG9wVXBXaWR0aCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fcG9wVXBXaWR0aDsgfVxuICBzdGF0aWMgc2V0IHBvcFVwV2lkdGgod2lkdGg6IG51bWJlcikge1xuICAgIHRoaXMuX3BvcFVwV2lkdGggPSB3aWR0aDtcbiAgfVxuICBwcml2YXRlIHN0YXRpYyBfcG9wVXBIZWlnaHQ6IG51bWJlciA9IDYwMDtcbiAgc3RhdGljIGdldCBwb3BVcEhlaWdodCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fcG9wVXBIZWlnaHQ7IH1cbiAgc3RhdGljIHNldCBwb3BVcEhlaWdodChoZWlnaHQ6IG51bWJlcikge1xuICAgIHRoaXMuX3BvcFVwSGVpZ2h0ID0gaGVpZ2h0O1xuICB9XG4gIHN0YXRpYyBnZXQgbG9naW4oKTogc3RyaW5nIHsgcmV0dXJuIFwiTE9HSU5cIjsgfVxuICBzdGF0aWMgZ2V0IHJlbmV3VG9rZW4oKTogc3RyaW5nIHsgcmV0dXJuIFwiUkVORVdfVE9LRU5cIjsgfVxuICBzdGF0aWMgZ2V0IHVua25vd24oKTogc3RyaW5nIHsgcmV0dXJuIFwiVU5LTk9XTlwiOyB9XG4gIHN0YXRpYyBnZXQgdXJsSGFzaCgpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLnVybEhhc2hcIjsgfVxuICAgIHN0YXRpYyBnZXQgYW5ndWxhckxvZ2luUmVxdWVzdCgpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLmFuZ3VsYXIubG9naW4ucmVxdWVzdFwiOyB9XG4gICAgc3RhdGljIGdldCB1c2VySWRlbnRpZmllcigpOiBzdHJpbmcgeyByZXR1cm4gXCJ1c2VySWRlbnRpZmllclwiOyB9XG4gICAgc3RhdGljIGdldCBjb21tb24oKTogc3RyaW5nIHsgcmV0dXJuIFwiY29tbW9uXCI7IH1cbn1cblxuLyoqXG4gKiBAaGlkZGVuXG4gKi9cbmV4cG9ydCBjbGFzcyBFcnJvckNvZGVzIHtcbiAgc3RhdGljIGdldCBsb2dpblByb2dyZXNzRXJyb3IoKTogc3RyaW5nIHsgcmV0dXJuIFwibG9naW5fcHJvZ3Jlc3NfZXJyb3JcIjsgfVxuICBzdGF0aWMgZ2V0IGFjcXVpcmVUb2tlblByb2dyZXNzRXJyb3IoKTogc3RyaW5nIHsgcmV0dXJuIFwiYWNxdWlyZXRva2VuX3Byb2dyZXNzX2Vycm9yXCI7IH1cbiAgc3RhdGljIGdldCBpbnB1dFNjb3Blc0Vycm9yKCk6IHN0cmluZyB7IHJldHVybiBcImlucHV0X3Njb3Blc19lcnJvclwiOyB9XG4gIHN0YXRpYyBnZXQgZW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IoKTogc3RyaW5nIHsgcmV0dXJuIFwiZW5kcG9pbnRzX3Jlc29sdXRpb25fZXJyb3JcIjsgfVxuICBzdGF0aWMgZ2V0IHBvcFVwV2luZG93RXJyb3IoKTogc3RyaW5nIHsgcmV0dXJuIFwicG9wdXBfd2luZG93X2Vycm9yXCI7IH1cbiAgc3RhdGljIGdldCB1c2VyTG9naW5FcnJvcigpOiBzdHJpbmcgeyByZXR1cm4gXCJ1c2VyX2xvZ2luX2Vycm9yXCI7IH1cbiAgc3RhdGljIGdldCB1c2VyQ2FuY2VsbGVkRXJyb3IoKTogc3RyaW5nIHsgcmV0dXJuIFwidXNlcl9jYW5jZWxsZWRcIjsgfVxufVxuXG4vKipcbiAqIEBoaWRkZW5cbiAqL1xuZXhwb3J0IGNsYXNzIEVycm9yRGVzY3JpcHRpb24ge1xuICBzdGF0aWMgZ2V0IGxvZ2luUHJvZ3Jlc3NFcnJvcigpOiBzdHJpbmcgeyByZXR1cm4gXCJMb2dpbiBpcyBpbiBwcm9ncmVzc1wiOyB9XG4gIHN0YXRpYyBnZXQgYWNxdWlyZVRva2VuUHJvZ3Jlc3NFcnJvcigpOiBzdHJpbmcgeyByZXR1cm4gXCJBY3F1aXJlIHRva2VuIGlzIGluIHByb2dyZXNzXCI7IH1cbiAgc3RhdGljIGdldCBpbnB1dFNjb3Blc0Vycm9yKCk6IHN0cmluZyB7IHJldHVybiBcIkludmFsaWQgdmFsdWUgb2YgaW5wdXQgc2NvcGVzIHByb3ZpZGVkXCI7IH1cbiAgc3RhdGljIGdldCBlbmRwb2ludFJlc29sdXRpb25FcnJvcigpOiBzdHJpbmcgeyByZXR1cm4gXCJFbmRwb2ludHMgY2Fubm90IGJlIHJlc29sdmVkXCI7IH1cbiAgc3RhdGljIGdldCBwb3BVcFdpbmRvd0Vycm9yKCk6IHN0cmluZyB7IHJldHVybiBcIkVycm9yIG9wZW5pbmcgcG9wdXAgd2luZG93LiBUaGlzIGNhbiBoYXBwZW4gaWYgeW91IGFyZSB1c2luZyBJRSBvciBpZiBwb3B1cHMgYXJlIGJsb2NrZWQgaW4gdGhlIGJyb3dzZXIuXCI7IH1cbiAgc3RhdGljIGdldCB1c2VyTG9naW5FcnJvcigpOiBzdHJpbmcgeyByZXR1cm4gXCJVc2VyIGxvZ2luIGlzIHJlcXVpcmVkXCI7IH1cbiAgc3RhdGljIGdldCB1c2VyQ2FuY2VsbGVkRXJyb3IoKTogc3RyaW5nIHsgcmV0dXJuIFwiVXNlciBjbG9zZWQgdGhlIHBvcHVwIHdpbmRvdyBhbmQgY2FuY2VsbGVkIHRoZSBmbG93XCI7IH1cblxufVxuIiwiaW1wb3J0IHsgSVVyaSB9IGZyb20gXCIuL0lVcmlcIjtcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSBcIi4vVXRpbHNcIjtcbmltcG9ydCB7IElUZW5hbnREaXNjb3ZlcnlSZXNwb25zZSB9IGZyb20gXCIuL0lUZW5hbnREaXNjb3ZlcnlSZXNwb25zZVwiO1xuaW1wb3J0IHsgRXJyb3JNZXNzYWdlIH0gZnJvbSBcIi4vRXJyb3JNZXNzYWdlXCI7XG5pbXBvcnQgeyBYaHJDbGllbnQgfSBmcm9tIFwiLi9YSFJDbGllbnRcIjtcblxuLyoqXG4gKiBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvblxuICogIEFsbCBSaWdodHMgUmVzZXJ2ZWRcbiAqICBNSVQgTGljZW5zZVxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpc1xuICogc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlICdTb2Z0d2FyZScpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZVxuICogd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LFxuICogbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuICogcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmdcbiAqIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbiAqIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICogRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTXG4gKiBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksXG4gKiBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUXG4gKiBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuICovXG5cblxuLyoqXG4gKiBAaGlkZGVuXG4gKi9cbmV4cG9ydCBlbnVtIEF1dGhvcml0eVR5cGUge1xuICBBYWQsXG4gIEFkZnMsXG4gIEIyQ1xufVxuXG4vKipcbiAqIEBoaWRkZW5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEF1dGhvcml0eSB7XG4gIGNvbnN0cnVjdG9yKGF1dGhvcml0eTogc3RyaW5nLCB2YWxpZGF0ZUF1dGhvcml0eTogYm9vbGVhbikge1xuICAgIHRoaXMuSXNWYWxpZGF0aW9uRW5hYmxlZCA9IHZhbGlkYXRlQXV0aG9yaXR5O1xuICAgIHRoaXMuQ2Fub25pY2FsQXV0aG9yaXR5ID0gYXV0aG9yaXR5O1xuXG4gICAgdGhpcy52YWxpZGF0ZUFzVXJpKCk7XG4gIH1cblxuICBwdWJsaWMgYWJzdHJhY3QgZ2V0IEF1dGhvcml0eVR5cGUoKTogQXV0aG9yaXR5VHlwZTtcblxuICBwdWJsaWMgSXNWYWxpZGF0aW9uRW5hYmxlZDogYm9vbGVhbjtcblxuICBwdWJsaWMgZ2V0IFRlbmFudCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLkNhbm9uaWNhbEF1dGhvcml0eVVybENvbXBvbmVudHMuUGF0aFNlZ21lbnRzWzBdO1xuICB9XG5cbiAgcHJpdmF0ZSB0ZW5hbnREaXNjb3ZlcnlSZXNwb25zZTogSVRlbmFudERpc2NvdmVyeVJlc3BvbnNlO1xuXG4gIHB1YmxpYyBnZXQgQXV0aG9yaXphdGlvbkVuZHBvaW50KCk6IHN0cmluZyB7XG4gICAgdGhpcy52YWxpZGF0ZVJlc29sdmVkKCk7XG4gICAgcmV0dXJuIHRoaXMudGVuYW50RGlzY292ZXJ5UmVzcG9uc2UuQXV0aG9yaXphdGlvbkVuZHBvaW50LnJlcGxhY2UoXCJ7dGVuYW50fVwiLCB0aGlzLlRlbmFudCk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IEVuZFNlc3Npb25FbmRwb2ludCgpOiBzdHJpbmcge1xuICAgIHRoaXMudmFsaWRhdGVSZXNvbHZlZCgpO1xuICAgIHJldHVybiB0aGlzLnRlbmFudERpc2NvdmVyeVJlc3BvbnNlLkVuZFNlc3Npb25FbmRwb2ludC5yZXBsYWNlKFwie3RlbmFudH1cIiwgdGhpcy5UZW5hbnQpO1xuICB9XG5cbiAgcHVibGljIGdldCBTZWxmU2lnbmVkSnd0QXVkaWVuY2UoKTogc3RyaW5nIHtcbiAgICB0aGlzLnZhbGlkYXRlUmVzb2x2ZWQoKTtcbiAgICByZXR1cm4gdGhpcy50ZW5hbnREaXNjb3ZlcnlSZXNwb25zZS5Jc3N1ZXIucmVwbGFjZShcInt0ZW5hbnR9XCIsIHRoaXMuVGVuYW50KTtcbiAgfVxuXG4gIHByaXZhdGUgdmFsaWRhdGVSZXNvbHZlZCgpIHtcbiAgICBpZiAoIXRoaXMudGVuYW50RGlzY292ZXJ5UmVzcG9uc2UpIHtcbiAgICAgIHRocm93IFwiUGxlYXNlIGNhbGwgUmVzb2x2ZUVuZHBvaW50c0FzeW5jIGZpcnN0XCI7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEEgVVJMIHRoYXQgaXMgdGhlIGF1dGhvcml0eSBzZXQgYnkgdGhlIGRldmVsb3BlclxuICAgKi9cbiAgcHVibGljIGdldCBDYW5vbmljYWxBdXRob3JpdHkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5jYW5vbmljYWxBdXRob3JpdHk7XG4gIH1cblxuICBwdWJsaWMgc2V0IENhbm9uaWNhbEF1dGhvcml0eSh1cmw6IHN0cmluZykge1xuICAgIHRoaXMuY2Fub25pY2FsQXV0aG9yaXR5ID0gVXRpbHMuQ2Fub25pY2FsaXplVXJpKHVybCk7XG4gICAgdGhpcy5jYW5vbmljYWxBdXRob3JpdHlVcmxDb21wb25lbnRzID0gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgY2Fub25pY2FsQXV0aG9yaXR5OiBzdHJpbmc7XG4gIHByaXZhdGUgY2Fub25pY2FsQXV0aG9yaXR5VXJsQ29tcG9uZW50czogSVVyaTtcblxuICBwdWJsaWMgZ2V0IENhbm9uaWNhbEF1dGhvcml0eVVybENvbXBvbmVudHMoKTogSVVyaSB7XG4gICAgaWYgKCF0aGlzLmNhbm9uaWNhbEF1dGhvcml0eVVybENvbXBvbmVudHMpIHtcbiAgICAgIHRoaXMuY2Fub25pY2FsQXV0aG9yaXR5VXJsQ29tcG9uZW50cyA9IFV0aWxzLkdldFVybENvbXBvbmVudHModGhpcy5DYW5vbmljYWxBdXRob3JpdHkpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmNhbm9uaWNhbEF1dGhvcml0eVVybENvbXBvbmVudHM7XG4gIH1cblxuICAvKipcbiAgICogLy8gaHR0cDovL29wZW5pZC5uZXQvc3BlY3Mvb3BlbmlkLWNvbm5lY3QtZGlzY292ZXJ5LTFfMC5odG1sI1Byb3ZpZGVyTWV0YWRhdGFcbiAgICovXG4gIHByb3RlY3RlZCBnZXQgRGVmYXVsdE9wZW5JZENvbmZpZ3VyYXRpb25FbmRwb2ludCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHt0aGlzLkNhbm9uaWNhbEF1dGhvcml0eX12Mi4wLy53ZWxsLWtub3duL29wZW5pZC1jb25maWd1cmF0aW9uYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlbiBhIHN0cmluZywgdmFsaWRhdGUgdGhhdCBpdCBpcyBvZiB0aGUgZm9ybSBodHRwczovL2RvbWFpbi9wYXRoXG4gICAqL1xuICBwcml2YXRlIHZhbGlkYXRlQXNVcmkoKSB7XG4gICAgbGV0IGNvbXBvbmVudHM7XG4gICAgdHJ5IHtcbiAgICAgIGNvbXBvbmVudHMgPSB0aGlzLkNhbm9uaWNhbEF1dGhvcml0eVVybENvbXBvbmVudHM7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgRXJyb3JNZXNzYWdlLmludmFsaWRBdXRob3JpdHlUeXBlO1xuICAgIH1cblxuICAgIGlmICghY29tcG9uZW50cy5Qcm90b2NvbCB8fCBjb21wb25lbnRzLlByb3RvY29sLnRvTG93ZXJDYXNlKCkgIT09IFwiaHR0cHM6XCIpIHtcbiAgICAgIHRocm93IEVycm9yTWVzc2FnZS5hdXRob3JpdHlVcmlJbnNlY3VyZTtcbiAgICB9XG5cbiAgICBpZiAoIWNvbXBvbmVudHMuUGF0aFNlZ21lbnRzIHx8IGNvbXBvbmVudHMuUGF0aFNlZ21lbnRzLmxlbmd0aCA8IDEpIHtcbiAgICAgIHRocm93IEVycm9yTWVzc2FnZS5hdXRob3JpdHlVcmlJbnZhbGlkUGF0aDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbHMgdGhlIE9JREMgZW5kcG9pbnQgYW5kIHJldHVybnMgdGhlIHJlc3BvbnNlXG4gICAqL1xuICBwcml2YXRlIERpc2NvdmVyRW5kcG9pbnRzKG9wZW5JZENvbmZpZ3VyYXRpb25FbmRwb2ludDogc3RyaW5nKTogUHJvbWlzZTxJVGVuYW50RGlzY292ZXJ5UmVzcG9uc2U+IHtcbiAgICBsZXQgY2xpZW50ID0gbmV3IFhockNsaWVudCgpO1xuICAgIHJldHVybiBjbGllbnQuc2VuZFJlcXVlc3RBc3luYyhvcGVuSWRDb25maWd1cmF0aW9uRW5kcG9pbnQsIFwiR0VUXCIsIC8qZW5hYmxlQ2FjaGluZzogKi8gdHJ1ZSlcbiAgICAgICAgLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiA8SVRlbmFudERpc2NvdmVyeVJlc3BvbnNlPntcbiAgICAgICAgICAgICAgICBBdXRob3JpemF0aW9uRW5kcG9pbnQ6IHJlc3BvbnNlLmF1dGhvcml6YXRpb25fZW5kcG9pbnQsXG4gICAgICAgICAgICAgICAgRW5kU2Vzc2lvbkVuZHBvaW50OiByZXNwb25zZS5lbmRfc2Vzc2lvbl9lbmRwb2ludCxcbiAgICAgICAgICAgICAgICBJc3N1ZXI6IHJlc3BvbnNlLmlzc3VlclxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHByb21pc2UuXG4gICAqIENoZWNrcyB0byBzZWUgaWYgdGhlIGF1dGhvcml0eSBpcyBpbiB0aGUgY2FjaGVcbiAgICogRGlzY292ZXIgZW5kcG9pbnRzIHZpYSBvcGVuaWQtY29uZmlndXJhdGlvblxuICAgKiBJZiBzdWNjZXNzZnVsLCBjYWNoZXMgdGhlIGVuZHBvaW50IGZvciBsYXRlciB1c2UgaW4gT0lEQ1xuICAgKi9cbiAgcHVibGljIFJlc29sdmVFbmRwb2ludHNBc3luYygpOiBQcm9taXNlPEF1dGhvcml0eT4ge1xuICAgIGxldCBvcGVuSWRDb25maWd1cmF0aW9uRW5kcG9pbnQgPSBcIlwiO1xuICAgIHJldHVybiB0aGlzLkdldE9wZW5JZENvbmZpZ3VyYXRpb25FbmRwb2ludEFzeW5jKCkudGhlbihvcGVuSWRDb25maWd1cmF0aW9uRW5kcG9pbnRSZXNwb25zZSA9PiB7XG4gICAgICBvcGVuSWRDb25maWd1cmF0aW9uRW5kcG9pbnQgPSBvcGVuSWRDb25maWd1cmF0aW9uRW5kcG9pbnRSZXNwb25zZTtcbiAgICAgIHJldHVybiB0aGlzLkRpc2NvdmVyRW5kcG9pbnRzKG9wZW5JZENvbmZpZ3VyYXRpb25FbmRwb2ludCk7XG4gICAgfSkudGhlbigodGVuYW50RGlzY292ZXJ5UmVzcG9uc2U6IElUZW5hbnREaXNjb3ZlcnlSZXNwb25zZSkgPT4ge1xuICAgICAgdGhpcy50ZW5hbnREaXNjb3ZlcnlSZXNwb25zZSA9IHRlbmFudERpc2NvdmVyeVJlc3BvbnNlO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHByb21pc2Ugd2l0aCB0aGUgVGVuYW50RGlzY292ZXJ5RW5kcG9pbnRcbiAgICovXG4gIHB1YmxpYyBhYnN0cmFjdCBHZXRPcGVuSWRDb25maWd1cmF0aW9uRW5kcG9pbnRBc3luYygpOiBQcm9taXNlPHN0cmluZz47XG59XG4iLCIvKiEgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxyXG50aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxyXG5MaWNlbnNlIGF0IGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxyXG5cclxuVEhJUyBDT0RFIElTIFBST1ZJREVEIE9OIEFOICpBUyBJUyogQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxyXG5LSU5ELCBFSVRIRVIgRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgV0lUSE9VVCBMSU1JVEFUSU9OIEFOWSBJTVBMSUVEXHJcbldBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBUSVRMRSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UsXHJcbk1FUkNIQU5UQUJMSVRZIE9SIE5PTi1JTkZSSU5HRU1FTlQuXHJcblxyXG5TZWUgdGhlIEFwYWNoZSBWZXJzaW9uIDIuMCBMaWNlbnNlIGZvciBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnNcclxuYW5kIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxyXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xyXG4vKiBnbG9iYWwgUmVmbGVjdCwgUHJvbWlzZSAqL1xyXG5cclxudmFyIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcclxuICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcclxuICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZXh0ZW5kcyhkLCBiKSB7XHJcbiAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uIF9fYXNzaWduKHQpIHtcclxuICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xyXG4gICAgICAgIHMgPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKSB0W3BdID0gc1twXTtcclxuICAgIH1cclxuICAgIHJldHVybiB0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZXN0KHMsIGUpIHtcclxuICAgIHZhciB0ID0ge307XHJcbiAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkgJiYgZS5pbmRleE9mKHApIDwgMClcclxuICAgICAgICB0W3BdID0gc1twXTtcclxuICAgIGlmIChzICE9IG51bGwgJiYgdHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgcCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMocyk7IGkgPCBwLmxlbmd0aDsgaSsrKSBpZiAoZS5pbmRleE9mKHBbaV0pIDwgMClcclxuICAgICAgICAgICAgdFtwW2ldXSA9IHNbcFtpXV07XHJcbiAgICByZXR1cm4gdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcclxuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XHJcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xyXG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcclxuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3BhcmFtKHBhcmFtSW5kZXgsIGRlY29yYXRvcikge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIGtleSkgeyBkZWNvcmF0b3IodGFyZ2V0LCBrZXksIHBhcmFtSW5kZXgpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKSB7XHJcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdGVyKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xyXG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxyXG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLnRocm93KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUocmVzdWx0LnZhbHVlKTsgfSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxyXG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19nZW5lcmF0b3IodGhpc0FyZywgYm9keSkge1xyXG4gICAgdmFyIF8gPSB7IGxhYmVsOiAwLCBzZW50OiBmdW5jdGlvbigpIHsgaWYgKHRbMF0gJiAxKSB0aHJvdyB0WzFdOyByZXR1cm4gdFsxXTsgfSwgdHJ5czogW10sIG9wczogW10gfSwgZiwgeSwgdCwgZztcclxuICAgIHJldHVybiBnID0geyBuZXh0OiB2ZXJiKDApLCBcInRocm93XCI6IHZlcmIoMSksIFwicmV0dXJuXCI6IHZlcmIoMikgfSwgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIChnW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0pLCBnO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IHJldHVybiBmdW5jdGlvbiAodikgeyByZXR1cm4gc3RlcChbbiwgdl0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzdGVwKG9wKSB7XHJcbiAgICAgICAgaWYgKGYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJHZW5lcmF0b3IgaXMgYWxyZWFkeSBleGVjdXRpbmcuXCIpO1xyXG4gICAgICAgIHdoaWxlIChfKSB0cnkge1xyXG4gICAgICAgICAgICBpZiAoZiA9IDEsIHkgJiYgKHQgPSB5W29wWzBdICYgMiA/IFwicmV0dXJuXCIgOiBvcFswXSA/IFwidGhyb3dcIiA6IFwibmV4dFwiXSkgJiYgISh0ID0gdC5jYWxsKHksIG9wWzFdKSkuZG9uZSkgcmV0dXJuIHQ7XHJcbiAgICAgICAgICAgIGlmICh5ID0gMCwgdCkgb3AgPSBbMCwgdC52YWx1ZV07XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3BbMF0pIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgMDogY2FzZSAxOiB0ID0gb3A7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA0OiBfLmxhYmVsKys7IHJldHVybiB7IHZhbHVlOiBvcFsxXSwgZG9uZTogZmFsc2UgfTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNTogXy5sYWJlbCsrOyB5ID0gb3BbMV07IG9wID0gWzBdOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNzogb3AgPSBfLm9wcy5wb3AoKTsgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodCA9IF8udHJ5cywgdCA9IHQubGVuZ3RoID4gMCAmJiB0W3QubGVuZ3RoIC0gMV0pICYmIChvcFswXSA9PT0gNiB8fCBvcFswXSA9PT0gMikpIHsgXyA9IDA7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSAzICYmICghdCB8fCAob3BbMV0gPiB0WzBdICYmIG9wWzFdIDwgdFszXSkpKSB7IF8ubGFiZWwgPSBvcFsxXTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDYgJiYgXy5sYWJlbCA8IHRbMV0pIHsgXy5sYWJlbCA9IHRbMV07IHQgPSBvcDsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodCAmJiBfLmxhYmVsIDwgdFsyXSkgeyBfLmxhYmVsID0gdFsyXTsgXy5vcHMucHVzaChvcCk7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRbMl0pIF8ub3BzLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb3AgPSBib2R5LmNhbGwodGhpc0FyZywgXyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkgeyBvcCA9IFs2LCBlXTsgeSA9IDA7IH0gZmluYWxseSB7IGYgPSB0ID0gMDsgfVxyXG4gICAgICAgIGlmIChvcFswXSAmIDUpIHRocm93IG9wWzFdOyByZXR1cm4geyB2YWx1ZTogb3BbMF0gPyBvcFsxXSA6IHZvaWQgMCwgZG9uZTogdHJ1ZSB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHBvcnRTdGFyKG0sIGV4cG9ydHMpIHtcclxuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKCFleHBvcnRzLmhhc093blByb3BlcnR5KHApKSBleHBvcnRzW3BdID0gbVtwXTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fdmFsdWVzKG8pIHtcclxuICAgIHZhciBtID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9bU3ltYm9sLml0ZXJhdG9yXSwgaSA9IDA7XHJcbiAgICBpZiAobSkgcmV0dXJuIG0uY2FsbChvKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgbmV4dDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAobyAmJiBpID49IG8ubGVuZ3RoKSBvID0gdm9pZCAwO1xyXG4gICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogbyAmJiBvW2krK10sIGRvbmU6ICFvIH07XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcmVhZChvLCBuKSB7XHJcbiAgICB2YXIgbSA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvW1N5bWJvbC5pdGVyYXRvcl07XHJcbiAgICBpZiAoIW0pIHJldHVybiBvO1xyXG4gICAgdmFyIGkgPSBtLmNhbGwobyksIHIsIGFyID0gW10sIGU7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHdoaWxlICgobiA9PT0gdm9pZCAwIHx8IG4tLSA+IDApICYmICEociA9IGkubmV4dCgpKS5kb25lKSBhci5wdXNoKHIudmFsdWUpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGVycm9yKSB7IGUgPSB7IGVycm9yOiBlcnJvciB9OyB9XHJcbiAgICBmaW5hbGx5IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAociAmJiAhci5kb25lICYmIChtID0gaVtcInJldHVyblwiXSkpIG0uY2FsbChpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZmluYWxseSB7IGlmIChlKSB0aHJvdyBlLmVycm9yOyB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZCgpIHtcclxuICAgIGZvciAodmFyIGFyID0gW10sIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIGFyID0gYXIuY29uY2F0KF9fcmVhZChhcmd1bWVudHNbaV0pKTtcclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXQodikge1xyXG4gICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBfX2F3YWl0ID8gKHRoaXMudiA9IHYsIHRoaXMpIDogbmV3IF9fYXdhaXQodik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jR2VuZXJhdG9yKHRoaXNBcmcsIF9hcmd1bWVudHMsIGdlbmVyYXRvcikge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBnID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pLCBpLCBxID0gW107XHJcbiAgICByZXR1cm4gaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaWYgKGdbbl0pIGlbbl0gPSBmdW5jdGlvbiAodikgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKGEsIGIpIHsgcS5wdXNoKFtuLCB2LCBhLCBiXSkgPiAxIHx8IHJlc3VtZShuLCB2KTsgfSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHJlc3VtZShuLCB2KSB7IHRyeSB7IHN0ZXAoZ1tuXSh2KSk7IH0gY2F0Y2ggKGUpIHsgc2V0dGxlKHFbMF1bM10sIGUpOyB9IH1cclxuICAgIGZ1bmN0aW9uIHN0ZXAocikgeyByLnZhbHVlIGluc3RhbmNlb2YgX19hd2FpdCA/IFByb21pc2UucmVzb2x2ZShyLnZhbHVlLnYpLnRoZW4oZnVsZmlsbCwgcmVqZWN0KSA6IHNldHRsZShxWzBdWzJdLCByKTsgIH1cclxuICAgIGZ1bmN0aW9uIGZ1bGZpbGwodmFsdWUpIHsgcmVzdW1lKFwibmV4dFwiLCB2YWx1ZSk7IH1cclxuICAgIGZ1bmN0aW9uIHJlamVjdCh2YWx1ZSkgeyByZXN1bWUoXCJ0aHJvd1wiLCB2YWx1ZSk7IH1cclxuICAgIGZ1bmN0aW9uIHNldHRsZShmLCB2KSB7IGlmIChmKHYpLCBxLnNoaWZ0KCksIHEubGVuZ3RoKSByZXN1bWUocVswXVswXSwgcVswXVsxXSk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNEZWxlZ2F0b3Iobykge1xyXG4gICAgdmFyIGksIHA7XHJcbiAgICByZXR1cm4gaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIsIGZ1bmN0aW9uIChlKSB7IHRocm93IGU7IH0pLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuLCBmKSB7IGlmIChvW25dKSBpW25dID0gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIChwID0gIXApID8geyB2YWx1ZTogX19hd2FpdChvW25dKHYpKSwgZG9uZTogbiA9PT0gXCJyZXR1cm5cIiB9IDogZiA/IGYodikgOiB2OyB9OyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jVmFsdWVzKG8pIHtcclxuICAgIGlmICghU3ltYm9sLmFzeW5jSXRlcmF0b3IpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTeW1ib2wuYXN5bmNJdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbiAgICB2YXIgbSA9IG9bU3ltYm9sLmFzeW5jSXRlcmF0b3JdO1xyXG4gICAgcmV0dXJuIG0gPyBtLmNhbGwobykgOiB0eXBlb2YgX192YWx1ZXMgPT09IFwiZnVuY3Rpb25cIiA/IF9fdmFsdWVzKG8pIDogb1tTeW1ib2wuaXRlcmF0b3JdKCk7XHJcbn0iLCIvKipcbiAqIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uXG4gKiAgQWxsIFJpZ2h0cyBSZXNlcnZlZFxuICogIE1JVCBMaWNlbnNlXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZiB0aGlzXG4gKiBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlXG4gKiB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksXG4gKiBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZ1xuICogY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxuICogaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsXG4gKiBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlNcbiAqIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSxcbiAqIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVRcbiAqIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKi9cblxuaW1wb3J0IHsgVXRpbHMgfSBmcm9tIFwiLi9VdGlsc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIElMb2dnZXJDYWxsYmFjayB7XG4gIChsZXZlbDogTG9nTGV2ZWwsIG1lc3NhZ2U6IHN0cmluZywgY29udGFpbnNQaWk6IGJvb2xlYW4pOiB2b2lkO1xufVxuXG5leHBvcnQgZW51bSBMb2dMZXZlbCB7XG4gIEVycm9yLFxuICBXYXJuaW5nLFxuICBJbmZvLFxuICBWZXJib3NlXG59XG5cbmV4cG9ydCBjbGFzcyBMb2dnZXIgey8vIFNpbmdsZXRvbiBDbGFzc1xuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfaW5zdGFuY2U6IExvZ2dlcjtcblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgcHJpdmF0ZSBfY29ycmVsYXRpb25JZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIF9sZXZlbDogTG9nTGV2ZWwgPSBMb2dMZXZlbC5JbmZvO1xuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIF9waWlMb2dnaW5nRW5hYmxlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgcHJpdmF0ZSBfbG9jYWxDYWxsYmFjazogSUxvZ2dlckNhbGxiYWNrO1xuXG4gIGNvbnN0cnVjdG9yKGxvY2FsQ2FsbGJhY2s6IElMb2dnZXJDYWxsYmFjayxcbiAgICAgIG9wdGlvbnM6XG4gICAgICB7XG4gICAgICAgICAgY29ycmVsYXRpb25JZD86IHN0cmluZyxcbiAgICAgICAgICBsZXZlbD86IExvZ0xldmVsLFxuICAgICAgICAgIHBpaUxvZ2dpbmdFbmFibGVkPzogYm9vbGVhbixcbiAgICAgIH0gPSB7fSkge1xuICAgICAgY29uc3Qge1xuICAgICAgICAgIGNvcnJlbGF0aW9uSWQgPSBcIlwiLFxuICAgICAgICAgIGxldmVsID0gTG9nTGV2ZWwuSW5mbyxcbiAgICAgICAgICBwaWlMb2dnaW5nRW5hYmxlZCA9IGZhbHNlXG4gICAgICB9ID0gb3B0aW9ucztcblxuICAgICAgdGhpcy5fbG9jYWxDYWxsYmFjayA9IGxvY2FsQ2FsbGJhY2s7XG4gICAgICB0aGlzLl9jb3JyZWxhdGlvbklkID0gY29ycmVsYXRpb25JZDtcbiAgICAgIHRoaXMuX2xldmVsID0gbGV2ZWw7XG4gICAgICB0aGlzLl9waWlMb2dnaW5nRW5hYmxlZCA9IHBpaUxvZ2dpbmdFbmFibGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHByaXZhdGUgbG9nTWVzc2FnZShsb2dMZXZlbDogTG9nTGV2ZWwsIGxvZ01lc3NhZ2U6IHN0cmluZywgY29udGFpbnNQaWk6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBpZiAoKGxvZ0xldmVsID4gdGhpcy5fbGV2ZWwpIHx8ICghdGhpcy5fcGlpTG9nZ2luZ0VuYWJsZWQgJiYgY29udGFpbnNQaWkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvVVRDU3RyaW5nKCk7XG4gICAgdmFyIGxvZzogc3RyaW5nO1xuICAgIGlmICghVXRpbHMuaXNFbXB0eSh0aGlzLl9jb3JyZWxhdGlvbklkKSkge1xuICAgICAgbG9nID0gdGltZXN0YW1wICsgXCI6XCIgKyB0aGlzLl9jb3JyZWxhdGlvbklkICsgXCItXCIgKyBVdGlscy5nZXRMaWJyYXJ5VmVyc2lvbigpICsgXCItXCIgKyBMb2dMZXZlbFtsb2dMZXZlbF0gKyBcIiBcIiArIGxvZ01lc3NhZ2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbG9nID0gdGltZXN0YW1wICsgXCI6XCIgKyBVdGlscy5nZXRMaWJyYXJ5VmVyc2lvbigpICsgXCItXCIgKyBMb2dMZXZlbFtsb2dMZXZlbF0gKyBcIiBcIiArIGxvZ01lc3NhZ2U7XG4gICAgfVxuICAgIHRoaXMuZXhlY3V0ZUNhbGxiYWNrKGxvZ0xldmVsLCBsb2csIGNvbnRhaW5zUGlpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBleGVjdXRlQ2FsbGJhY2sobGV2ZWw6IExvZ0xldmVsLCBtZXNzYWdlOiBzdHJpbmcsIGNvbnRhaW5zUGlpOiBib29sZWFuKSB7XG4gICAgaWYgKHRoaXMuX2xvY2FsQ2FsbGJhY2spIHtcbiAgICAgIHRoaXMuX2xvY2FsQ2FsbGJhY2sobGV2ZWwsIG1lc3NhZ2UsIGNvbnRhaW5zUGlpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgZXJyb3IobWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5sb2dNZXNzYWdlKExvZ0xldmVsLkVycm9yLCBtZXNzYWdlLCBmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgZXJyb3JQaWkobWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5sb2dNZXNzYWdlKExvZ0xldmVsLkVycm9yLCBtZXNzYWdlLCB0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICB3YXJuaW5nKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMubG9nTWVzc2FnZShMb2dMZXZlbC5XYXJuaW5nLCBtZXNzYWdlLCBmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgd2FybmluZ1BpaShtZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmxvZ01lc3NhZ2UoTG9nTGV2ZWwuV2FybmluZywgbWVzc2FnZSwgdHJ1ZSk7XG4gIH1cblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgaW5mbyhtZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmxvZ01lc3NhZ2UoTG9nTGV2ZWwuSW5mbywgbWVzc2FnZSwgZmFsc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIGluZm9QaWkobWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5sb2dNZXNzYWdlKExvZ0xldmVsLkluZm8sIG1lc3NhZ2UsIHRydWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHZlcmJvc2UobWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5sb2dNZXNzYWdlKExvZ0xldmVsLlZlcmJvc2UsIG1lc3NhZ2UsIGZhbHNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICB2ZXJib3NlUGlpKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMubG9nTWVzc2FnZShMb2dMZXZlbC5WZXJib3NlLCBtZXNzYWdlLCB0cnVlKTtcbiAgfVxufVxuIiwiLypcbiAgKiBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvblxuICAqICBBbGwgUmlnaHRzIFJlc2VydmVkXG4gICogIE1JVCBMaWNlbnNlXG4gICpcbiAgKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXNcbiAgKiBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmVcbiAgKiB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksXG4gICogbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuICAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nXG4gICogY29uZGl0aW9uczpcbiAgKlxuICAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG4gICogaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gICpcbiAgKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICAqIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlNcbiAgKiBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksXG4gICogV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVFxuICAqIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gICovXG5cbi8qKlxuICogQGhpZGRlblxuICovXG5leHBvcnQgY2xhc3MgRXJyb3JNZXNzYWdlIHtcbiAgc3RhdGljIGdldCBhdXRob3JpdHlVcmlJbnZhbGlkUGF0aCgpOiBzdHJpbmcgeyByZXR1cm4gXCJBdXRob3JpdHlVcmlJbnZhbGlkUGF0aFwiOyB9XG4gIHN0YXRpYyBnZXQgYXV0aG9yaXR5VXJpSW5zZWN1cmUoKTogc3RyaW5nIHsgcmV0dXJuIFwiQXV0aG9yaXR5VXJpSW5zZWN1cmVcIjsgfVxuICBzdGF0aWMgZ2V0IGludmFsaWRBdXRob3JpdHlUeXBlKCk6IHN0cmluZyB7IHJldHVybiBcIkludmFsaWRBdXRob3JpdHlUeXBlXCI7IH1cbiAgc3RhdGljIGdldCB1bnN1cHBvcnRlZEF1dGhvcml0eVZhbGlkYXRpb24oKTogc3RyaW5nIHsgcmV0dXJuIFwiVW5zdXBwb3J0ZWRBdXRob3JpdHlWYWxpZGF0aW9uXCI7IH1cbiAgc3RhdGljIGdldCBiMmNBdXRob3JpdHlVcmlJbnZhbGlkUGF0aCgpOiBzdHJpbmcgeyByZXR1cm4gXCJCMmNBdXRob3JpdHlVcmlJbnZhbGlkUGF0aFwiOyB9XG59XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uXG4gKiAgQWxsIFJpZ2h0cyBSZXNlcnZlZFxuICogIE1JVCBMaWNlbnNlXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZiB0aGlzXG4gKiBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlXG4gKiB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksXG4gKiBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZ1xuICogY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxuICogaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsXG4gKiBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlNcbiAqIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSxcbiAqIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVRcbiAqIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKi9cblxuaW1wb3J0IHsgQWNjZXNzVG9rZW5DYWNoZUl0ZW0gfSBmcm9tIFwiLi9BY2Nlc3NUb2tlbkNhY2hlSXRlbVwiO1xuaW1wb3J0IHsgQWNjZXNzVG9rZW5LZXkgfSBmcm9tIFwiLi9BY2Nlc3NUb2tlbktleVwiO1xuaW1wb3J0IHsgQWNjZXNzVG9rZW5WYWx1ZSB9IGZyb20gXCIuL0FjY2Vzc1Rva2VuVmFsdWVcIjtcbmltcG9ydCB7IEF1dGhlbnRpY2F0aW9uUmVxdWVzdFBhcmFtZXRlcnMgfSBmcm9tIFwiLi9BdXRoZW50aWNhdGlvblJlcXVlc3RQYXJhbWV0ZXJzXCI7XG5pbXBvcnQgeyBBdXRob3JpdHkgfSBmcm9tIFwiLi9BdXRob3JpdHlcIjtcbmltcG9ydCB7IENsaWVudEluZm8gfSBmcm9tIFwiLi9DbGllbnRJbmZvXCI7XG5pbXBvcnQgeyBDb25zdGFudHMsIEVycm9yQ29kZXMsIEVycm9yRGVzY3JpcHRpb24gfSBmcm9tIFwiLi9Db25zdGFudHNcIjtcbmltcG9ydCB7IElkVG9rZW4gfSBmcm9tIFwiLi9JZFRva2VuXCI7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiLi9Mb2dnZXJcIjtcbmltcG9ydCB7IFN0b3JhZ2UgfSBmcm9tIFwiLi9TdG9yYWdlXCI7XG5pbXBvcnQgeyBUb2tlblJlc3BvbnNlIH0gZnJvbSBcIi4vUmVxdWVzdEluZm9cIjtcbmltcG9ydCB7IFVzZXIgfSBmcm9tIFwiLi9Vc2VyXCI7XG5pbXBvcnQgeyBVdGlscyB9IGZyb20gXCIuL1V0aWxzXCI7XG5pbXBvcnQgeyBBdXRob3JpdHlGYWN0b3J5IH0gZnJvbSBcIi4vQXV0aG9yaXR5RmFjdG9yeVwiO1xuXG5kZWNsYXJlIGdsb2JhbCB7XG4gICAgaW50ZXJmYWNlIFdpbmRvdyB7XG4gICAgICAgIG1zYWw6IE9iamVjdDtcbiAgICAgICAgQ3VzdG9tRXZlbnQ6IEN1c3RvbUV2ZW50O1xuICAgICAgICBFdmVudDogRXZlbnQ7XG4gICAgICAgIGFjdGl2ZVJlbmV3YWxzOiB7fTtcbiAgICAgICAgcmVuZXdTdGF0ZXM6IEFycmF5PHN0cmluZz47XG4gICAgICAgIGNhbGxCYWNrTWFwcGVkVG9SZW5ld1N0YXRlcyA6IHt9O1xuICAgICAgICBjYWxsQmFja3NNYXBwZWRUb1JlbmV3U3RhdGVzOiB7fTtcbiAgICAgICAgb3BlbmVkV2luZG93czogQXJyYXk8V2luZG93PjtcbiAgICAgICAgcmVxdWVzdFR5cGU6IHN0cmluZztcbiAgICB9XG59XG5cbi8qKlxuICogQGhpZGRlblxuICovXG5sZXQgUmVzcG9uc2VUeXBlcyA9IHtcbiAgaWRfdG9rZW46IFwiaWRfdG9rZW5cIixcbiAgdG9rZW46IFwidG9rZW5cIixcbiAgaWRfdG9rZW5fdG9rZW46IFwiaWRfdG9rZW4gdG9rZW5cIlxufTtcblxuLyoqXG4gKiBAaGlkZGVuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2FjaGVSZXN1bHQge1xuICBlcnJvckRlc2M6IHN0cmluZztcbiAgdG9rZW46IHN0cmluZztcbiAgZXJyb3I6IHN0cmluZztcbn1cblxuLyoqXG4gKiBBIHR5cGUgYWxpYXMgb2YgZm9yIGEgdG9rZW5SZWNlaXZlZENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHBhcmFtIHRva2VuUmVjZWl2ZWRDYWxsYmFjay5lcnJvckRlc2MgZXJyb3IgZGVzY3JpcHRpb24gcmV0dXJuZWQgZnJvbSB0aGUgU1RTIGlmIEFQSSBjYWxsIGZhaWxzLlxuICogQHBhcmFtIHRva2VuUmVjZWl2ZWRDYWxsYmFjay50b2tlbiB0b2tlbiByZXR1cm5lZCBmcm9tIFNUUyBpZiB0b2tlbiByZXF1ZXN0IGlzIHN1Y2Nlc3NmdWwuXG4gKiBAcGFyYW0gdG9rZW5SZWNlaXZlZENhbGxiYWNrLmVycm9yIGVycm9yIGNvZGUgcmV0dXJuZWQgZnJvbSB0aGUgU1RTIGlmIEFQSSBjYWxsIGZhaWxzLlxuICogQHBhcmFtIHRva2VuUmVjZWl2ZWRDYWxsYmFjay50b2tlblR5cGUgdG9rZW5UeXBlIHJldHVybmVkIGZyb20gdGhlIFNUUyBpZiBBUEkgY2FsbCBpcyBzdWNjZXNzZnVsLiBQb3NzaWJsZSB2YWx1ZXMgYXJlOiBpZF90b2tlbiBPUiBhY2Nlc3NfdG9rZW4uXG4gKi9cbmV4cG9ydCB0eXBlIHRva2VuUmVjZWl2ZWRDYWxsYmFjayA9IChlcnJvckRlc2M6IHN0cmluZywgdG9rZW46IHN0cmluZywgZXJyb3I6IHN0cmluZywgdG9rZW5UeXBlOiBzdHJpbmcsIHVzZXJTdGF0ZTogc3RyaW5nICkgPT4gdm9pZDtcbmNvbnN0IHJlc29sdmVUb2tlbk9ubHlJZk91dE9mSWZyYW1lID0gKHRhcmdldDogYW55LCBwcm9wZXJ0eUtleTogc3RyaW5nLCBkZXNjcmlwdG9yOiBQcm9wZXJ0eURlc2NyaXB0b3IpID0+IHtcbiAgY29uc3QgdG9rZW5BY3F1aXNpdGlvbk1ldGhvZCA9IGRlc2NyaXB0b3IudmFsdWU7XG4gIGRlc2NyaXB0b3IudmFsdWUgPSBmdW5jdGlvbiAoLi4uYXJnczogYW55W10pIHtcbiAgICAgIHJldHVybiB0aGlzLmlzSW5JZnJhbWUoKVxuICAgICAgICAgID8gbmV3IFByb21pc2UoKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgOiB0b2tlbkFjcXVpc2l0aW9uTWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9O1xuICByZXR1cm4gZGVzY3JpcHRvcjtcbn07XG5leHBvcnQgY2xhc3MgVXNlckFnZW50QXBwbGljYXRpb24ge1xuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIF9jYWNoZUxvY2F0aW9ucyA9IHtcbiAgICBsb2NhbFN0b3JhZ2U6IFwibG9jYWxTdG9yYWdlXCIsXG4gICAgc2Vzc2lvblN0b3JhZ2U6IFwic2Vzc2lvblN0b3JhZ2VcIlxuICB9O1xuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIF9jYWNoZUxvY2F0aW9uOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gZ2V0IHRoZSBjYWNoZSBsb2NhdGlvblxuICAgKi9cbiAgZ2V0IGNhY2hlTG9jYXRpb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fY2FjaGVMb2NhdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcm90ZWN0ZWQgX2xvZ2dlcjogTG9nZ2VyO1xuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIF9sb2dpbkluUHJvZ3Jlc3M6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHByaXZhdGUgX2FjcXVpcmVUb2tlbkluUHJvZ3Jlc3M6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHByaXZhdGUgX2Nsb2NrU2tldyA9IDMwMDtcblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgcHJvdGVjdGVkIF9jYWNoZVN0b3JhZ2U6IFN0b3JhZ2U7XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHByaXZhdGUgX3Rva2VuUmVjZWl2ZWRDYWxsYmFjazogdG9rZW5SZWNlaXZlZENhbGxiYWNrID0gbnVsbDtcblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgcHJpdmF0ZSBfdXNlcjogVXNlcjtcblxuICAvKipcbiAgICogQ2xpZW50IElEIGFzc2lnbmVkIHRvIHlvdXIgYXBwIGJ5IEF6dXJlIEFjdGl2ZSBEaXJlY3RvcnkuXG4gICAqL1xuICBjbGllbnRJZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcm90ZWN0ZWQgYXV0aG9yaXR5SW5zdGFuY2U6IEF1dGhvcml0eTtcblxuICAvKipcbiAgICogVXNlZCB0byBzZXQgdGhlIGF1dGhvcml0eS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGF1dGhvcml0eSAtIEEgVVJMIGluZGljYXRpbmcgYSBkaXJlY3RvcnkgdGhhdCBNU0FMIGNhbiB1c2UgdG8gb2J0YWluIHRva2Vucy5cbiAgICogLSBJbiBBenVyZSBBRCwgaXQgaXMgb2YgdGhlIGZvcm0gaHR0cHM6Ly8mbHQ7dGVuYW50Jmd0Oy8mbHQ7dGVuYW50Jmd0Oywgd2hlcmUgJmx0O3RlbmFudCZndDsgaXMgdGhlIGRpcmVjdG9yeSBob3N0IChlLmcuIGh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbSkgYW5kICZsdDt0ZW5hbnQmZ3Q7IGlzIGEgaWRlbnRpZmllciB3aXRoaW4gdGhlIGRpcmVjdG9yeSBpdHNlbGYgKGUuZy4gYSBkb21haW4gYXNzb2NpYXRlZCB0byB0aGUgdGVuYW50LCBzdWNoIGFzIGNvbnRvc28ub25taWNyb3NvZnQuY29tLCBvciB0aGUgR1VJRCByZXByZXNlbnRpbmcgdGhlIFRlbmFudElEIHByb3BlcnR5IG9mIHRoZSBkaXJlY3RvcnkpXG4gICAqIC0gSW4gQXp1cmUgQjJDLCBpdCBpcyBvZiB0aGUgZm9ybSBodHRwczovLyZsdDtpbnN0YW5jZSZndDsvdGZwLyZsdDt0ZW5hbnQmZ3Q7Lzxwb2xpY3lOYW1lPi9cbiAgICogLSBEZWZhdWx0IHZhbHVlIGlzOiBcImh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbS9jb21tb25cIlxuICAgKi9cbiAgcHVibGljIHNldCBhdXRob3JpdHkodmFsKSB7XG4gICAgdGhpcy5hdXRob3JpdHlJbnN0YW5jZSA9IEF1dGhvcml0eUZhY3RvcnkuQ3JlYXRlSW5zdGFuY2UodmFsLCB0aGlzLnZhbGlkYXRlQXV0aG9yaXR5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIGdldCB0aGUgYXV0aG9yaXR5LlxuICAgKi9cbiAgcHVibGljIGdldCBhdXRob3JpdHkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5hdXRob3JpdHlJbnN0YW5jZS5DYW5vbmljYWxBdXRob3JpdHk7XG4gIH1cblxuICAvKipcbiAgICogVXNlZCB0byB0dXJuIGF1dGhvcml0eSB2YWxpZGF0aW9uIG9uL29mZi5cbiAgICogV2hlbiBzZXQgdG8gdHJ1ZSAoZGVmYXVsdCksIE1TQUwgd2lsbCBjb21wYXJlIHRoZSBhcHBsaWNhdGlvblwicyBhdXRob3JpdHkgYWdhaW5zdCB3ZWxsLWtub3duIFVSTHMgdGVtcGxhdGVzIHJlcHJlc2VudGluZyB3ZWxsLWZvcm1lZCBhdXRob3JpdGllcy4gSXQgaXMgdXNlZnVsIHdoZW4gdGhlIGF1dGhvcml0eSBpcyBvYnRhaW5lZCBhdCBydW4gdGltZSB0byBwcmV2ZW50IE1TQUwgZnJvbSBkaXNwbGF5aW5nIGF1dGhlbnRpY2F0aW9uIHByb21wdHMgZnJvbSBtYWxpY2lvdXMgcGFnZXMuXG4gICAqL1xuICB2YWxpZGF0ZUF1dGhvcml0eTogYm9vbGVhbjtcblxuICAvKipcbiAgICogVGhlIHJlZGlyZWN0IFVSSSBvZiB0aGUgYXBwbGljYXRpb24sIHRoaXMgc2hvdWxkIGJlIHNhbWUgYXMgdGhlIHZhbHVlIGluIHRoZSBhcHBsaWNhdGlvbiByZWdpc3RyYXRpb24gcG9ydGFsLlxuICAgKiBEZWZhdWx0cyB0byBgd2luZG93LmxvY2F0aW9uLmhyZWZgLlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVkaXJlY3RVcmk6IHN0cmluZyB8ICgoKSA9PiBzdHJpbmcpO1xuXG4gICAgLyoqXG4gICAgICogVXNlIHRvIHNlbmQgdGhlIHN0YXRlIHBhcmFtZXRlciB3aXRoIGF1dGhlbnRpY2F0aW9uIHJlcXVlc3RcbiAgICAgKi9cbiAgICBwcml2YXRlIF9zdGF0ZTogc3RyaW5nO1xuICAvKipcbiAgICogVXNlZCB0byByZWRpcmVjdCB0aGUgdXNlciB0byB0aGlzIGxvY2F0aW9uIGFmdGVyIGxvZ291dC5cbiAgICogRGVmYXVsdHMgdG8gYHdpbmRvdy5sb2NhdGlvbi5ocmVmYC5cbiAgICovXG4gIHByaXZhdGUgX3Bvc3RMb2dvdXRyZWRpcmVjdFVyaTogc3RyaW5nIHwgKCgpID0+IHN0cmluZyk7XG5cbiAgbG9hZEZyYW1lVGltZW91dDogbnVtYmVyO1xuXG4gIHByb3RlY3RlZCBfbmF2aWdhdGVUb0xvZ2luUmVxdWVzdFVybDogYm9vbGVhbjtcblxuICBwcml2YXRlIF9pc0FuZ3VsYXI6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBwcml2YXRlIF9wcm90ZWN0ZWRSZXNvdXJjZU1hcDogTWFwPHN0cmluZywgQXJyYXk8c3RyaW5nPj47XG5cbiAgcHJpdmF0ZSBfdW5wcm90ZWN0ZWRSZXNvdXJjZXM6IEFycmF5PHN0cmluZz47XG5cbiAgcHJpdmF0ZSBzdG9yZUF1dGhTdGF0ZUluQ29va2llOiBib29sZWFuO1xuXG4gIHByaXZhdGUgX3NpbGVudEF1dGhlbnRpY2F0aW9uU3RhdGU6IHN0cmluZztcblxuICBwcml2YXRlIF9zaWxlbnRMb2dpbjogYm9vbGVhbjtcbiAgLyoqXG4gICAqIEluaXRpYWxpemUgYSBVc2VyQWdlbnRBcHBsaWNhdGlvbiB3aXRoIGEgZ2l2ZW4gY2xpZW50SWQgYW5kIGF1dGhvcml0eS5cbiAgICogQGNvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjbGllbnRJZCAtIFRoZSBjbGllbnRJRCBvZiB5b3VyIGFwcGxpY2F0aW9uLCB5b3Ugc2hvdWxkIGdldCB0aGlzIGZyb20gdGhlIGFwcGxpY2F0aW9uIHJlZ2lzdHJhdGlvbiBwb3J0YWwuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhdXRob3JpdHkgLSBBIFVSTCBpbmRpY2F0aW5nIGEgZGlyZWN0b3J5IHRoYXQgTVNBTCBjYW4gdXNlIHRvIG9idGFpbiB0b2tlbnMuXG4gICAqIC0gSW4gQXp1cmUgQUQsIGl0IGlzIG9mIHRoZSBmb3JtIGh0dHBzOi8vJmx0O2luc3RhbmNlPi8mbHQ7dGVuYW50Jmd0OyxcXCB3aGVyZSAmbHQ7aW5zdGFuY2UmZ3Q7IGlzIHRoZSBkaXJlY3RvcnkgaG9zdCAoZS5nLiBodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20pIGFuZCAmbHQ7dGVuYW50Jmd0OyBpcyBhIGlkZW50aWZpZXIgd2l0aGluIHRoZSBkaXJlY3RvcnkgaXRzZWxmIChlLmcuIGEgZG9tYWluIGFzc29jaWF0ZWQgdG8gdGhlIHRlbmFudCwgc3VjaCBhcyBjb250b3NvLm9ubWljcm9zb2Z0LmNvbSwgb3IgdGhlIEdVSUQgcmVwcmVzZW50aW5nIHRoZSBUZW5hbnRJRCBwcm9wZXJ0eSBvZiB0aGUgZGlyZWN0b3J5KVxuICAgKiAtIEluIEF6dXJlIEIyQywgaXQgaXMgb2YgdGhlIGZvcm0gaHR0cHM6Ly8mbHQ7aW5zdGFuY2UmZ3Q7L3RmcC8mbHQ7dGVuYW50SWQmZ3Q7LyZsdDtwb2xpY3lOYW1lJmd0Oy9cbiAgICogLSBEZWZhdWx0IHZhbHVlIGlzOiBcImh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbS9jb21tb25cIlxuICAgKiBAcGFyYW0gX3Rva2VuUmVjZWl2ZWRDYWxsYmFjayAtICBUaGUgZnVuY3Rpb24gdGhhdCB3aWxsIGdldCB0aGUgY2FsbCBiYWNrIG9uY2UgdGhpcyBBUEkgaXMgY29tcGxldGVkIChlaXRoZXIgc3VjY2Vzc2Z1bGx5IG9yIHdpdGggYSBmYWlsdXJlKS5cbiAgICogQHBhcmFtIHtib29sZWFufSB2YWxpZGF0ZUF1dGhvcml0eSAtICBib29sZWFuIHRvIHR1cm4gYXV0aG9yaXR5IHZhbGlkYXRpb24gb24vb2ZmLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgY2xpZW50SWQ6IHN0cmluZyxcbiAgICBhdXRob3JpdHk6IHN0cmluZyB8IG51bGwsXG4gICAgdG9rZW5SZWNlaXZlZENhbGxiYWNrOiB0b2tlblJlY2VpdmVkQ2FsbGJhY2ssXG4gICAgb3B0aW9uczpcbiAgICAgIHtcbiAgICAgICAgdmFsaWRhdGVBdXRob3JpdHk/OiBib29sZWFuLFxuICAgICAgICBjYWNoZUxvY2F0aW9uPzogc3RyaW5nLFxuICAgICAgICByZWRpcmVjdFVyaT86IHN0cmluZyB8ICgoKSA9PiBzdHJpbmcpLFxuICAgICAgICBwb3N0TG9nb3V0UmVkaXJlY3RVcmk/OiBzdHJpbmcgfCAoKCkgPT4gc3RyaW5nKSxcbiAgICAgICAgbG9nZ2VyPzogTG9nZ2VyLFxuICAgICAgICBsb2FkRnJhbWVUaW1lb3V0PzogbnVtYmVyLFxuICAgICAgICBuYXZpZ2F0ZVRvTG9naW5SZXF1ZXN0VXJsPzogYm9vbGVhbixcbiAgICAgICAgc3RhdGU/OiBzdHJpbmcsXG4gICAgICAgIGlzQW5ndWxhcj86IGJvb2xlYW4sXG4gICAgICAgIHVucHJvdGVjdGVkUmVzb3VyY2VzPzogQXJyYXk8c3RyaW5nPlxuICAgICAgICBwcm90ZWN0ZWRSZXNvdXJjZU1hcD86IE1hcDxzdHJpbmcsIEFycmF5PHN0cmluZz4+LFxuICAgICAgICBzdG9yZUF1dGhTdGF0ZUluQ29va2llPzogYm9vbGVhblxuICAgICAgfSA9IHt9KSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgICAgdmFsaWRhdGVBdXRob3JpdHkgPSB0cnVlLFxuICAgICAgICAgIGNhY2hlTG9jYXRpb24gPSBcInNlc3Npb25TdG9yYWdlXCIsXG4gICAgICAgICAgcmVkaXJlY3RVcmkgPSAoKSA9PiB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdChcIj9cIilbMF0uc3BsaXQoXCIjXCIpWzBdLFxuICAgICAgICAgIHBvc3RMb2dvdXRSZWRpcmVjdFVyaSA9ICgpID0+IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KFwiP1wiKVswXS5zcGxpdChcIiNcIilbMF0sXG4gICAgICAgICAgbG9nZ2VyID0gbmV3IExvZ2dlcihudWxsKSxcbiAgICAgICAgICBsb2FkRnJhbWVUaW1lb3V0ID0gNjAwMCxcbiAgICAgICAgICBuYXZpZ2F0ZVRvTG9naW5SZXF1ZXN0VXJsID0gdHJ1ZSxcbiAgICAgICAgICBzdGF0ZSA9IFwiXCIsXG4gICAgICAgICAgaXNBbmd1bGFyID0gZmFsc2UsXG4gICAgICAgICAgdW5wcm90ZWN0ZWRSZXNvdXJjZXMgPSBuZXcgQXJyYXk8c3RyaW5nPigpLFxuICAgICAgICAgIHByb3RlY3RlZFJlc291cmNlTWFwID0gbmV3IE1hcDxzdHJpbmcsIEFycmF5PHN0cmluZz4+KCksXG4gICAgICAgICAgc3RvcmVBdXRoU3RhdGVJbkNvb2tpZSA9IGZhbHNlXG4gICAgICB9ID0gb3B0aW9ucztcblxuICAgIHRoaXMubG9hZEZyYW1lVGltZW91dCA9IGxvYWRGcmFtZVRpbWVvdXQ7XG4gICAgdGhpcy5jbGllbnRJZCA9IGNsaWVudElkO1xuICAgIHRoaXMudmFsaWRhdGVBdXRob3JpdHkgPSB2YWxpZGF0ZUF1dGhvcml0eTtcbiAgICB0aGlzLmF1dGhvcml0eSA9IGF1dGhvcml0eSB8fCBcImh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbS9jb21tb25cIjtcbiAgICB0aGlzLl90b2tlblJlY2VpdmVkQ2FsbGJhY2sgPSB0b2tlblJlY2VpdmVkQ2FsbGJhY2s7XG4gICAgdGhpcy5fcmVkaXJlY3RVcmkgPSByZWRpcmVjdFVyaTtcbiAgICB0aGlzLl9wb3N0TG9nb3V0cmVkaXJlY3RVcmkgPSBwb3N0TG9nb3V0UmVkaXJlY3RVcmk7XG4gICAgdGhpcy5fbG9naW5JblByb2dyZXNzID0gZmFsc2U7XG4gICAgdGhpcy5fYWNxdWlyZVRva2VuSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgIHRoaXMuX2NhY2hlTG9jYXRpb24gPSBjYWNoZUxvY2F0aW9uO1xuICAgIHRoaXMuX25hdmlnYXRlVG9Mb2dpblJlcXVlc3RVcmwgPSBuYXZpZ2F0ZVRvTG9naW5SZXF1ZXN0VXJsO1xuICAgIHRoaXMuX3N0YXRlID0gc3RhdGU7XG4gICAgdGhpcy5faXNBbmd1bGFyID0gaXNBbmd1bGFyO1xuICAgIHRoaXMuX3VucHJvdGVjdGVkUmVzb3VyY2VzID0gdW5wcm90ZWN0ZWRSZXNvdXJjZXM7XG4gICAgdGhpcy5fcHJvdGVjdGVkUmVzb3VyY2VNYXAgPSBwcm90ZWN0ZWRSZXNvdXJjZU1hcDtcbiAgICBpZiAoIXRoaXMuX2NhY2hlTG9jYXRpb25zW2NhY2hlTG9jYXRpb25dKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYWNoZSBMb2NhdGlvbiBpcyBub3QgdmFsaWQuIFByb3ZpZGVkIHZhbHVlOlwiICsgdGhpcy5fY2FjaGVMb2NhdGlvbiArIFwiLlBvc3NpYmxlIHZhbHVlcyBhcmU6IFwiICsgdGhpcy5fY2FjaGVMb2NhdGlvbnMubG9jYWxTdG9yYWdlICsgXCIsIFwiICsgdGhpcy5fY2FjaGVMb2NhdGlvbnMuc2Vzc2lvblN0b3JhZ2UpO1xuICAgIH1cblxuICAgIHRoaXMuX2NhY2hlU3RvcmFnZSA9IG5ldyBTdG9yYWdlKHRoaXMuX2NhY2hlTG9jYXRpb24pOyAvL2NhY2hlIGtleXMgbXNhbFxuICAgIHRoaXMuX2xvZ2dlciA9IGxvZ2dlcjtcbiAgICB0aGlzLnN0b3JlQXV0aFN0YXRlSW5Db29raWUgPSBzdG9yZUF1dGhTdGF0ZUluQ29va2llO1xuICAgIHdpbmRvdy5vcGVuZWRXaW5kb3dzID0gW107XG4gICAgd2luZG93LmFjdGl2ZVJlbmV3YWxzID0ge307XG4gICAgd2luZG93LnJlbmV3U3RhdGVzID0gW107XG4gICAgd2luZG93LmNhbGxCYWNrTWFwcGVkVG9SZW5ld1N0YXRlcyA9IHsgfTtcbiAgICB3aW5kb3cuY2FsbEJhY2tzTWFwcGVkVG9SZW5ld1N0YXRlcyA9IHsgfTtcbiAgICB3aW5kb3cubXNhbCA9IHRoaXM7XG4gICAgdmFyIHVybEhhc2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaDtcbiAgICB2YXIgaXNDYWxsYmFjayA9IHRoaXMuaXNDYWxsYmFjayh1cmxIYXNoKTtcblxuICAgIGlmICghdGhpcy5faXNBbmd1bGFyKSB7XG4gICAgICAgIGlmIChpc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZUF1dGhlbnRpY2F0aW9uUmVzcG9uc2UuY2FsbCh0aGlzLCB1cmxIYXNoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBwZW5kaW5nQ2FsbGJhY2sgPSB0aGlzLl9jYWNoZVN0b3JhZ2UuZ2V0SXRlbShDb25zdGFudHMudXJsSGFzaCk7XG4gICAgICAgICAgICBpZiAocGVuZGluZ0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzQ2FsbEJhY2socGVuZGluZ0NhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIGNhbGwgdGhlIGNvbnN0cnVjdG9yIGNhbGxiYWNrIHdpdGggdGhlIHRva2VuL2Vycm9yXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbaGFzaD13aW5kb3cubG9jYXRpb24uaGFzaF0gLSBIYXNoIGZyYWdtZW50IG9mIFVybC5cbiAgICogQGhpZGRlblxuICAgKi9cbiAgcHJpdmF0ZSBwcm9jZXNzQ2FsbEJhY2soaGFzaDogc3RyaW5nKTogdm9pZCB7XG4gICAgICB0aGlzLl9sb2dnZXIuaW5mbyhcIlByb2Nlc3NpbmcgdGhlIGNhbGxiYWNrIGZyb20gcmVkaXJlY3QgcmVzcG9uc2VcIik7XG4gICAgICBjb25zdCByZXF1ZXN0SW5mbyA9IHRoaXMuZ2V0UmVxdWVzdEluZm8oaGFzaCk7XG4gICAgICB0aGlzLnNhdmVUb2tlbkZyb21IYXNoKHJlcXVlc3RJbmZvKTtcbiAgICAgIGNvbnN0IHRva2VuID0gcmVxdWVzdEluZm8ucGFyYW1ldGVyc1tDb25zdGFudHMuYWNjZXNzVG9rZW5dIHx8IHJlcXVlc3RJbmZvLnBhcmFtZXRlcnNbQ29uc3RhbnRzLmlkVG9rZW5dO1xuICAgICAgY29uc3QgZXJyb3JEZXNjID0gcmVxdWVzdEluZm8ucGFyYW1ldGVyc1tDb25zdGFudHMuZXJyb3JEZXNjcmlwdGlvbl07XG4gICAgICBjb25zdCBlcnJvciA9IHJlcXVlc3RJbmZvLnBhcmFtZXRlcnNbQ29uc3RhbnRzLmVycm9yXTtcbiAgICAgIHZhciB0b2tlblR5cGU6IHN0cmluZztcblxuICAgICAgaWYgKHJlcXVlc3RJbmZvLnBhcmFtZXRlcnNbQ29uc3RhbnRzLmFjY2Vzc1Rva2VuXSkge1xuICAgICAgICAgIHRva2VuVHlwZSA9IENvbnN0YW50cy5hY2Nlc3NUb2tlbjtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAgIHRva2VuVHlwZSA9IENvbnN0YW50cy5pZFRva2VuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9jYWNoZVN0b3JhZ2UucmVtb3ZlSXRlbShDb25zdGFudHMudXJsSGFzaCk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKHRoaXMuX3Rva2VuUmVjZWl2ZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgICB0aGlzLl9jYWNoZVN0b3JhZ2UuY2xlYXJDb29raWUoKTtcbiAgICAgICAgICAgICAgdGhpcy5fdG9rZW5SZWNlaXZlZENhbGxiYWNrLmNhbGwodGhpcywgZXJyb3JEZXNjLCB0b2tlbiwgZXJyb3IsIHRva2VuVHlwZSwgIHRoaXMuZ2V0VXNlclN0YXRlKHRoaXMuX2NhY2hlU3RvcmFnZS5nZXRJdGVtKENvbnN0YW50cy5zdGF0ZUxvZ2luLCB0aGlzLnN0b3JlQXV0aFN0YXRlSW5Db29raWUpKSk7XG4gICAgICAgICAgfVxuXG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICB0aGlzLl9sb2dnZXIuZXJyb3IoXCJFcnJvciBvY2N1cnJlZCBpbiB0b2tlbiByZWNlaXZlZCBjYWxsYmFjayBmdW5jdGlvbjogXCIgKyBlcnIpO1xuICAgICAgfVxuICB9XG5cblxuICAvKipcbiAgICogVXNlZCB0byBnZXQgdGhlIHJlZGlyZWN0IHVyaS4gRXZhbHVhdGVzIHJlZGlyZWN0VXJpIGlmIGl0cyBhIGZ1bmN0aW9uLCBvdGhlcndpc2Ugc2ltcGx5IHJldHVybnMgaXRzIHZhbHVlLlxuICAgKiBAaWdub3JlXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHByaXZhdGUgZ2V0UmVkaXJlY3RVcmkoKTogc3RyaW5nIHtcbiAgICBpZiAodHlwZW9mIHRoaXMuX3JlZGlyZWN0VXJpID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHJldHVybiB0aGlzLl9yZWRpcmVjdFVyaSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fcmVkaXJlY3RVcmk7XG4gIH1cblxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIGdldCB0aGUgcG9zdCBsb2dvdXQgcmVkaXJlY3QgdXJpLiBFdmFsdWF0ZXMgcG9zdExvZ291dHJlZGlyZWN0VXJpIGlmIGl0cyBhIGZ1bmN0aW9uLCBvdGhlcndpc2Ugc2ltcGx5IHJldHVybnMgaXRzIHZhbHVlLlxuICAgKiBAaWdub3JlXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHByaXZhdGUgZ2V0UG9zdExvZ291dFJlZGlyZWN0VXJpKCk6IHN0cmluZyB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLl9wb3N0TG9nb3V0cmVkaXJlY3RVcmkgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgcmV0dXJuIHRoaXMuX3Bvc3RMb2dvdXRyZWRpcmVjdFVyaSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fcG9zdExvZ291dHJlZGlyZWN0VXJpO1xuICB9XG5cblxuICAvKipcbiAgICogSW5pdGlhdGUgdGhlIGxvZ2luIHByb2Nlc3MgYnkgcmVkaXJlY3RpbmcgdGhlIHVzZXIgdG8gdGhlIFNUUyBhdXRob3JpemF0aW9uIGVuZHBvaW50LlxuICAgKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBzY29wZXMgLSBQZXJtaXNzaW9ucyB5b3Ugd2FudCBpbmNsdWRlZCBpbiB0aGUgYWNjZXNzIHRva2VuLiBOb3QgYWxsIHNjb3BlcyBhcmUgZ3VhcmFudGVlZCB0byBiZSBpbmNsdWRlZCBpbiB0aGUgYWNjZXNzIHRva2VuIHJldHVybmVkLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXh0cmFRdWVyeVBhcmFtZXRlcnMgLSBLZXktdmFsdWUgcGFpcnMgdG8gcGFzcyB0byB0aGUgYXV0aGVudGljYXRpb24gc2VydmVyIGR1cmluZyB0aGUgaW50ZXJhY3RpdmUgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICovXG4gIGxvZ2luUmVkaXJlY3Qoc2NvcGVzPzogQXJyYXk8c3RyaW5nPiwgZXh0cmFRdWVyeVBhcmFtZXRlcnM/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICAvKlxuICAgIDEuIENyZWF0ZSBuYXZpZ2F0ZSB1cmxcbiAgICAyLiBzYXZlcyB2YWx1ZSBpbiBjYWNoZVxuICAgIDMuIHJlZGlyZWN0IHVzZXIgdG8gQUFEXG4gICAgICovXG4gICAgaWYgKHRoaXMuX2xvZ2luSW5Qcm9ncmVzcykge1xuICAgICAgaWYgKHRoaXMuX3Rva2VuUmVjZWl2ZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy5fdG9rZW5SZWNlaXZlZENhbGxiYWNrKEVycm9yRGVzY3JpcHRpb24ubG9naW5Qcm9ncmVzc0Vycm9yLCBudWxsLCBFcnJvckNvZGVzLmxvZ2luUHJvZ3Jlc3NFcnJvciwgQ29uc3RhbnRzLmlkVG9rZW4sIHRoaXMuZ2V0VXNlclN0YXRlKHRoaXMuX2NhY2hlU3RvcmFnZS5nZXRJdGVtKENvbnN0YW50cy5zdGF0ZUxvZ2luLCB0aGlzLnN0b3JlQXV0aFN0YXRlSW5Db29raWUpKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc2NvcGVzKSB7XG4gICAgICBjb25zdCBpc1ZhbGlkU2NvcGUgPSB0aGlzLnZhbGlkYXRlSW5wdXRTY29wZShzY29wZXMpO1xuICAgICAgaWYgKGlzVmFsaWRTY29wZSAmJiAhVXRpbHMuaXNFbXB0eShpc1ZhbGlkU2NvcGUpKSB7XG4gICAgICAgICAgaWYgKHRoaXMuX3Rva2VuUmVjZWl2ZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgICB0aGlzLl90b2tlblJlY2VpdmVkQ2FsbGJhY2soRXJyb3JEZXNjcmlwdGlvbi5pbnB1dFNjb3Blc0Vycm9yLCBudWxsLCBFcnJvckNvZGVzLmlucHV0U2NvcGVzRXJyb3IsIENvbnN0YW50cy5pZFRva2VuLCB0aGlzLmdldFVzZXJTdGF0ZSh0aGlzLl9jYWNoZVN0b3JhZ2UuZ2V0SXRlbShDb25zdGFudHMuc3RhdGVMb2dpbiwgdGhpcy5zdG9yZUF1dGhTdGF0ZUluQ29va2llKSkpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc2NvcGVzID0gdGhpcy5maWx0ZXJTY29wZXMoc2NvcGVzKTtcbiAgICB9XG5cbiAgICAgIHZhciBpZFRva2VuT2JqZWN0O1xuICAgICAgaWRUb2tlbk9iamVjdCA9IHRoaXMuZXh0cmFjdEFEQUxJZFRva2VuKCk7XG4gICAgICBpZiAoaWRUb2tlbk9iamVjdCAmJiAhc2NvcGVzKSB7XG4gICAgICAgICAgdGhpcy5fbG9nZ2VyLmluZm8oXCJBREFMJ3MgaWRUb2tlbiBleGlzdHMuIEV4dHJhY3RpbmcgbG9naW4gaW5mb3JtYXRpb24gZnJvbSBBREFMJ3MgaWRUb2tlbiBcIik7XG4gICAgICAgICAgZXh0cmFRdWVyeVBhcmFtZXRlcnMgPSBVdGlscy5jb25zdHJ1Y3RVbmlmaWVkQ2FjaGVFeHRyYVF1ZXJ5UGFyYW1ldGVyKGlkVG9rZW5PYmplY3QsIGV4dHJhUXVlcnlQYXJhbWV0ZXJzKTtcbiAgICAgICAgICB0aGlzLl9zaWxlbnRMb2dpbiA9IHRydWU7XG4gICAgICAgICAgdGhpcy5hY3F1aXJlVG9rZW5TaWxlbnQoW3RoaXMuY2xpZW50SWRdLCB0aGlzLmF1dGhvcml0eSwgdGhpcy5nZXRVc2VyKCksIGV4dHJhUXVlcnlQYXJhbWV0ZXJzKVxuICAgICAgICAgICAgICAudGhlbigoaWRUb2tlbikgPT4ge1xuICAgICAgICAgICAgICAgICAgdGhpcy5fc2lsZW50TG9naW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5pbmZvKFwiVW5pZmllZCBjYWNoZSBjYWxsIGlzIHN1Y2Nlc3NmdWxcIik7XG4gICAgICAgICAgICAgICAgICBpZiAodGhpcy5fdG9rZW5SZWNlaXZlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdG9rZW5SZWNlaXZlZENhbGxiYWNrLmNhbGwodGhpcywgbnVsbCwgaWRUb2tlbiwgbnVsbCwgQ29uc3RhbnRzLmlkVG9rZW4sIHRoaXMuZ2V0VXNlclN0YXRlKHRoaXMuX3NpbGVudEF1dGhlbnRpY2F0aW9uU3RhdGUpKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSwgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICB0aGlzLl9zaWxlbnRMb2dpbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmVycm9yKFwiRXJyb3Igb2NjdXJyZWQgZHVyaW5nIHVuaWZpZWQgY2FjaGUgQVRTXCIpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpblJlZGlyZWN0SGVscGVyKHNjb3BlcywgZXh0cmFRdWVyeVBhcmFtZXRlcnMpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAgIHRoaXMubG9naW5SZWRpcmVjdEhlbHBlcihzY29wZXMsIGV4dHJhUXVlcnlQYXJhbWV0ZXJzKTtcbiAgICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbG9naW5SZWRpcmVjdEhlbHBlcihzY29wZXM/OiBBcnJheTxzdHJpbmc+LCBleHRyYVF1ZXJ5UGFyYW1ldGVycz86IHN0cmluZykge1xuICAgICAgdGhpcy5fbG9naW5JblByb2dyZXNzID0gdHJ1ZTtcbiAgICAgIHRoaXMuYXV0aG9yaXR5SW5zdGFuY2UuUmVzb2x2ZUVuZHBvaW50c0FzeW5jKClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGF1dGhlbnRpY2F0aW9uUmVxdWVzdCA9IG5ldyBBdXRoZW50aWNhdGlvblJlcXVlc3RQYXJhbWV0ZXJzKHRoaXMuYXV0aG9yaXR5SW5zdGFuY2UsIHRoaXMuY2xpZW50SWQsIHNjb3BlcywgUmVzcG9uc2VUeXBlcy5pZF90b2tlbiwgdGhpcy5nZXRSZWRpcmVjdFVyaSgpLCB0aGlzLl9zdGF0ZSk7XG4gICAgICAgICAgICAgIGlmIChleHRyYVF1ZXJ5UGFyYW1ldGVycykge1xuICAgICAgICAgICAgICAgICAgYXV0aGVudGljYXRpb25SZXF1ZXN0LmV4dHJhUXVlcnlQYXJhbWV0ZXJzID0gZXh0cmFRdWVyeVBhcmFtZXRlcnM7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB2YXIgbG9naW5TdGFydFBhZ2UgPSB0aGlzLl9jYWNoZVN0b3JhZ2UuZ2V0SXRlbShDb25zdGFudHMuYW5ndWxhckxvZ2luUmVxdWVzdCk7XG4gICAgICAgICAgICAgIGlmICghbG9naW5TdGFydFBhZ2UgfHwgbG9naW5TdGFydFBhZ2UgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgIGxvZ2luU3RhcnRQYWdlID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMuYW5ndWxhckxvZ2luUmVxdWVzdCwgXCJcIik7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubG9naW5SZXF1ZXN0LCBsb2dpblN0YXJ0UGFnZSwgdGhpcy5zdG9yZUF1dGhTdGF0ZUluQ29va2llKTtcbiAgICAgICAgICAgICAgdGhpcy5fY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLmxvZ2luRXJyb3IsIFwiXCIpO1xuICAgICAgICAgICAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMuc3RhdGVMb2dpbiwgYXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlLCB0aGlzLnN0b3JlQXV0aFN0YXRlSW5Db29raWUpO1xuICAgICAgICAgICAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubm9uY2VJZFRva2VuLCBhdXRoZW50aWNhdGlvblJlcXVlc3Qubm9uY2UsIHRoaXMuc3RvcmVBdXRoU3RhdGVJbkNvb2tpZSk7XG4gICAgICAgICAgICAgIHRoaXMuX2NhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsRXJyb3IsIFwiXCIpO1xuICAgICAgICAgICAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbEVycm9yRGVzY3JpcHRpb24sIFwiXCIpO1xuICAgICAgICAgICAgICBjb25zdCBhdXRob3JpdHlLZXkgPSBDb25zdGFudHMuYXV0aG9yaXR5ICsgQ29uc3RhbnRzLnJlc291cmNlRGVsaW1ldGVyICsgYXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlO1xuICAgICAgICAgICAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShhdXRob3JpdHlLZXksIHRoaXMuYXV0aG9yaXR5LCB0aGlzLnN0b3JlQXV0aFN0YXRlSW5Db29raWUpO1xuICAgICAgICAgICAgICBjb25zdCB1cmxOYXZpZ2F0ZSA9IGF1dGhlbnRpY2F0aW9uUmVxdWVzdC5jcmVhdGVOYXZpZ2F0ZVVybChzY29wZXMpICArIENvbnN0YW50cy5yZXNwb25zZV9tb2RlX2ZyYWdtZW50O1xuICAgICAgICAgICAgICB0aGlzLnByb21wdFVzZXIodXJsTmF2aWdhdGUpO1xuICAgICAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIHRoZSBsb2dpbiBwcm9jZXNzIGJ5IG9wZW5pbmcgYSBwb3B1cCB3aW5kb3cuXG4gICAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IHNjb3BlcyAtIFBlcm1pc3Npb25zIHlvdSB3YW50IGluY2x1ZGVkIGluIHRoZSBhY2Nlc3MgdG9rZW4uIE5vdCBhbGwgc2NvcGVzIGFyZSAgZ3VhcmFudGVlZCB0byBiZSBpbmNsdWRlZCBpbiB0aGUgYWNjZXNzIHRva2VuIHJldHVybmVkLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXh0cmFRdWVyeVBhcmFtZXRlcnMgLSBLZXktdmFsdWUgcGFpcnMgdG8gcGFzcyB0byB0aGUgU1RTIGR1cmluZyB0aGUgaW50ZXJhY3RpdmUgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICogQHJldHVybnMge1Byb21pc2UuPHN0cmluZz59IC0gQSBQcm9taXNlIHRoYXQgaXMgZnVsZmlsbGVkIHdoZW4gdGhpcyBmdW5jdGlvbiBoYXMgY29tcGxldGVkLCBvciByZWplY3RlZCBpZiBhbiBlcnJvciB3YXMgcmFpc2VkLiBSZXR1cm5zIHRoZSB0b2tlbiBvciBlcnJvci5cbiAgICovXG4gIGxvZ2luUG9wdXAoc2NvcGVzID86IEFycmF5PHN0cmluZz4sIGV4dHJhUXVlcnlQYXJhbWV0ZXJzPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAvKlxuICAgIDEuIENyZWF0ZSBuYXZpZ2F0ZSB1cmxcbiAgICAyLiBzYXZlcyB2YWx1ZSBpbiBjYWNoZVxuICAgIDMuIHJlZGlyZWN0IHVzZXIgdG8gQUFEXG4gICAgICovXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgaWYgKHRoaXMuX2xvZ2luSW5Qcm9ncmVzcykge1xuICAgICAgICByZWplY3QoRXJyb3JDb2Rlcy5sb2dpblByb2dyZXNzRXJyb3IgKyBDb25zdGFudHMucmVzb3VyY2VEZWxpbWV0ZXIgKyBFcnJvckRlc2NyaXB0aW9uLmxvZ2luUHJvZ3Jlc3NFcnJvcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHNjb3Blcykge1xuICAgICAgICBjb25zdCBpc1ZhbGlkU2NvcGUgPSB0aGlzLnZhbGlkYXRlSW5wdXRTY29wZShzY29wZXMpO1xuICAgICAgICBpZiAoaXNWYWxpZFNjb3BlICYmICFVdGlscy5pc0VtcHR5KGlzVmFsaWRTY29wZSkpIHtcbiAgICAgICAgICByZWplY3QoRXJyb3JDb2Rlcy5pbnB1dFNjb3Blc0Vycm9yICsgQ29uc3RhbnRzLnJlc291cmNlRGVsaW1ldGVyICsgRXJyb3JEZXNjcmlwdGlvbi5pbnB1dFNjb3Blc0Vycm9yKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzY29wZXMgPSB0aGlzLmZpbHRlclNjb3BlcyhzY29wZXMpO1xuICAgICAgfVxuXG4gICAgICAgIHZhciBpZFRva2VuT2JqZWN0O1xuICAgICAgICBpZFRva2VuT2JqZWN0ID0gdGhpcy5leHRyYWN0QURBTElkVG9rZW4oKTtcbiAgICAgICAgaWYgKGlkVG9rZW5PYmplY3QgJiYgIXNjb3Blcykge1xuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmluZm8oXCJBREFMJ3MgaWRUb2tlbiBleGlzdHMuIEV4dHJhY3RpbmcgbG9naW4gaW5mb3JtYXRpb24gZnJvbSBBREFMJ3MgaWRUb2tlbiBcIik7XG4gICAgICAgICAgICBleHRyYVF1ZXJ5UGFyYW1ldGVycyA9IFV0aWxzLmNvbnN0cnVjdFVuaWZpZWRDYWNoZUV4dHJhUXVlcnlQYXJhbWV0ZXIoaWRUb2tlbk9iamVjdCwgZXh0cmFRdWVyeVBhcmFtZXRlcnMpO1xuICAgICAgICAgICAgdGhpcy5fc2lsZW50TG9naW4gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5hY3F1aXJlVG9rZW5TaWxlbnQoW3RoaXMuY2xpZW50SWRdLCB0aGlzLmF1dGhvcml0eSwgdGhpcy5nZXRVc2VyKCksIGV4dHJhUXVlcnlQYXJhbWV0ZXJzKVxuICAgICAgICAgICAgICAgIC50aGVuKChpZFRva2VuKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3NpbGVudExvZ2luID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5pbmZvKFwiVW5pZmllZCBjYWNoZSBjYWxsIGlzIHN1Y2Nlc3NmdWxcIik7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoaWRUb2tlbik7XG4gICAgICAgICAgICAgICAgfSwgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3NpbGVudExvZ2luID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5lcnJvcihcIkVycm9yIG9jY3VycmVkIGR1cmluZyB1bmlmaWVkIGNhY2hlIEFUU1wiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpblBvcHVwSGVscGVyKHJlc29sdmUsIHJlamVjdCwgc2NvcGVzLCBleHRyYVF1ZXJ5UGFyYW1ldGVycyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sb2dpblBvcHVwSGVscGVyKHJlc29sdmUsIHJlamVjdCwgc2NvcGVzLCBleHRyYVF1ZXJ5UGFyYW1ldGVycyApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgbG9naW5Qb3B1cEhlbHBlciggcmVzb2x2ZTogYW55ICwgcmVqZWN0OiBhbnksIHNjb3BlczogQXJyYXk8c3RyaW5nPiwgZXh0cmFRdWVyeVBhcmFtZXRlcnM/OiBzdHJpbmcpIHtcbiAgICAgIC8vVE9ETyB3aHkgdGhpcyBpcyBuZWVkZWQgb25seSBmb3IgbG9naW5wb3B1cFxuICAgICAgaWYgKCFzY29wZXMpIHtcbiAgICAgICAgICBzY29wZXMgPSBbdGhpcy5jbGllbnRJZF07XG4gICAgICB9XG4gICAgICBjb25zdCBzY29wZSA9IHNjb3Blcy5qb2luKFwiIFwiKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgdmFyIHBvcFVwV2luZG93ID0gdGhpcy5vcGVuV2luZG93KFwiYWJvdXQ6YmxhbmtcIiwgXCJfYmxhbmtcIiwgMSwgdGhpcywgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgIGlmICghcG9wVXBXaW5kb3cpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2xvZ2luSW5Qcm9ncmVzcyA9IHRydWU7XG5cbiAgICAgIHRoaXMuYXV0aG9yaXR5SW5zdGFuY2UuUmVzb2x2ZUVuZHBvaW50c0FzeW5jKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgY29uc3QgYXV0aGVudGljYXRpb25SZXF1ZXN0ID0gbmV3IEF1dGhlbnRpY2F0aW9uUmVxdWVzdFBhcmFtZXRlcnModGhpcy5hdXRob3JpdHlJbnN0YW5jZSwgdGhpcy5jbGllbnRJZCwgc2NvcGVzLCBSZXNwb25zZVR5cGVzLmlkX3Rva2VuLCB0aGlzLmdldFJlZGlyZWN0VXJpKCksIHRoaXMuX3N0YXRlKTtcbiAgICAgICAgICBpZiAoZXh0cmFRdWVyeVBhcmFtZXRlcnMpIHtcbiAgICAgICAgICAgICAgYXV0aGVudGljYXRpb25SZXF1ZXN0LmV4dHJhUXVlcnlQYXJhbWV0ZXJzID0gZXh0cmFRdWVyeVBhcmFtZXRlcnM7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5fY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLmxvZ2luUmVxdWVzdCwgd2luZG93LmxvY2F0aW9uLmhyZWYsIHRoaXMuc3RvcmVBdXRoU3RhdGVJbkNvb2tpZSk7XG4gICAgICAgICAgdGhpcy5fY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLmxvZ2luRXJyb3IsIFwiXCIpO1xuICAgICAgICAgIHRoaXMuX2NhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5ub25jZUlkVG9rZW4sIGF1dGhlbnRpY2F0aW9uUmVxdWVzdC5ub25jZSwgdGhpcy5zdG9yZUF1dGhTdGF0ZUluQ29va2llKTtcbiAgICAgICAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbEVycm9yLCBcIlwiKTtcbiAgICAgICAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbEVycm9yRGVzY3JpcHRpb24sIFwiXCIpO1xuICAgICAgICAgIGNvbnN0IGF1dGhvcml0eUtleSA9IENvbnN0YW50cy5hdXRob3JpdHkgKyBDb25zdGFudHMucmVzb3VyY2VEZWxpbWV0ZXIgKyBhdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGU7XG4gICAgICAgICAgdGhpcy5fY2FjaGVTdG9yYWdlLnNldEl0ZW0oYXV0aG9yaXR5S2V5LCB0aGlzLmF1dGhvcml0eSwgdGhpcy5zdG9yZUF1dGhTdGF0ZUluQ29va2llKTtcbiAgICAgICAgICBjb25zdCB1cmxOYXZpZ2F0ZSA9IGF1dGhlbnRpY2F0aW9uUmVxdWVzdC5jcmVhdGVOYXZpZ2F0ZVVybChzY29wZXMpICArIENvbnN0YW50cy5yZXNwb25zZV9tb2RlX2ZyYWdtZW50O1xuICAgICAgICAgIHdpbmRvdy5yZW5ld1N0YXRlcy5wdXNoKGF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSk7XG4gICAgICAgICAgd2luZG93LnJlcXVlc3RUeXBlID0gQ29uc3RhbnRzLmxvZ2luO1xuICAgICAgICAgIHRoaXMucmVnaXN0ZXJDYWxsYmFjayhhdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGUsIHNjb3BlLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgIGlmIChwb3BVcFdpbmRvdykge1xuICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIuaW5mb1BpaShcIk5hdmlnYXRlZCBQb3B1cCB3aW5kb3cgdG86XCIgKyB1cmxOYXZpZ2F0ZSk7XG4gICAgICAgICAgICAgIHBvcFVwV2luZG93LmxvY2F0aW9uLmhyZWYgPSB1cmxOYXZpZ2F0ZTtcbiAgICAgICAgICB9XG5cbiAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICB0aGlzLl9sb2dnZXIuaW5mbyhFcnJvckNvZGVzLmVuZHBvaW50UmVzb2x1dGlvbkVycm9yICsgXCI6XCIgKyBFcnJvckRlc2NyaXB0aW9uLmVuZHBvaW50UmVzb2x1dGlvbkVycm9yKTtcbiAgICAgICAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbEVycm9yLCBFcnJvckNvZGVzLmVuZHBvaW50UmVzb2x1dGlvbkVycm9yKTtcbiAgICAgICAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbEVycm9yRGVzY3JpcHRpb24sIEVycm9yRGVzY3JpcHRpb24uZW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IpO1xuICAgICAgICAgIGlmIChyZWplY3QpIHtcbiAgICAgICAgICAgICAgcmVqZWN0KEVycm9yQ29kZXMuZW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IgKyBcIjpcIiArIEVycm9yRGVzY3JpcHRpb24uZW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChwb3BVcFdpbmRvdykge1xuICAgICAgICAgICAgICBwb3BVcFdpbmRvdy5jbG9zZSgpO1xuICAgICAgICAgIH1cbiAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICB0aGlzLl9sb2dnZXIud2FybmluZyhcImNvdWxkIG5vdCByZXNvbHZlIGVuZHBvaW50c1wiKTtcbiAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAgKiBVc2VkIHRvIHJlZGlyZWN0IHRoZSBicm93c2VyIHRvIHRoZSBTVFMgYXV0aG9yaXphdGlvbiBlbmRwb2ludFxuICAgICogQHBhcmFtIHtzdHJpbmd9IHVybE5hdmlnYXRlIC0gVVJMIG9mIHRoZSBhdXRob3JpemF0aW9uIGVuZHBvaW50XG4gICAgKiBAaGlkZGVuXG4gICAgKi9cbiAgcHJpdmF0ZSBwcm9tcHRVc2VyKHVybE5hdmlnYXRlOiBzdHJpbmcpIHtcbiAgICAgIGlmICh1cmxOYXZpZ2F0ZSAmJiAhVXRpbHMuaXNFbXB0eSh1cmxOYXZpZ2F0ZSkpIHtcbiAgICAgIHRoaXMuX2xvZ2dlci5pbmZvUGlpKFwiTmF2aWdhdGUgdG86XCIgKyB1cmxOYXZpZ2F0ZSk7XG4gICAgICB3aW5kb3cubG9jYXRpb24ucmVwbGFjZSh1cmxOYXZpZ2F0ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2xvZ2dlci5pbmZvKFwiTmF2aWdhdGUgdXJsIGlzIGVtcHR5XCIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIHNlbmQgdGhlIHVzZXIgdG8gdGhlIHJlZGlyZWN0X3VyaSBhZnRlciBhdXRoZW50aWNhdGlvbiBpcyBjb21wbGV0ZS4gVGhlIHVzZXJcInMgYmVhcmVyIHRva2VuIGlzIGF0dGFjaGVkIHRvIHRoZSBVUkkgZnJhZ21lbnQgYXMgYW4gaWRfdG9rZW4vYWNjZXNzX3Rva2VuIGZpZWxkLlxuICAgKiBUaGlzIGZ1bmN0aW9uIGFsc28gY2xvc2VzIHRoZSBwb3B1cCB3aW5kb3cgYWZ0ZXIgcmVkaXJlY3Rpb24uXG4gICAqIEBoaWRkZW5cbiAgICogQGlnbm9yZVxuICAgKi9cbiAgcHJpdmF0ZSBvcGVuV2luZG93KHVybE5hdmlnYXRlOiBzdHJpbmcsIHRpdGxlOiBzdHJpbmcsIGludGVydmFsOiBudW1iZXIsIGluc3RhbmNlOiB0aGlzLCByZXNvbHZlPzogRnVuY3Rpb24sIHJlamVjdD86IEZ1bmN0aW9uKTogV2luZG93IHtcbiAgICB2YXIgcG9wdXBXaW5kb3cgPSB0aGlzLm9wZW5Qb3B1cCh1cmxOYXZpZ2F0ZSwgdGl0bGUsIENvbnN0YW50cy5wb3BVcFdpZHRoLCBDb25zdGFudHMucG9wVXBIZWlnaHQpO1xuICAgIGlmIChwb3B1cFdpbmRvdyA9PSBudWxsKSB7XG4gICAgICBpbnN0YW5jZS5fbG9naW5JblByb2dyZXNzID0gZmFsc2U7XG4gICAgICBpbnN0YW5jZS5fYWNxdWlyZVRva2VuSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgICAgdGhpcy5fbG9nZ2VyLmluZm8oRXJyb3JDb2Rlcy5wb3BVcFdpbmRvd0Vycm9yICsgXCI6XCIgKyBFcnJvckRlc2NyaXB0aW9uLnBvcFVwV2luZG93RXJyb3IpO1xuICAgICAgdGhpcy5fY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLm1zYWxFcnJvciwgRXJyb3JDb2Rlcy5wb3BVcFdpbmRvd0Vycm9yKTtcbiAgICAgIHRoaXMuX2NhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsRXJyb3JEZXNjcmlwdGlvbiwgRXJyb3JEZXNjcmlwdGlvbi5wb3BVcFdpbmRvd0Vycm9yKTtcbiAgICAgIGlmIChyZWplY3QpIHtcbiAgICAgICAgcmVqZWN0KEVycm9yQ29kZXMucG9wVXBXaW5kb3dFcnJvciArIENvbnN0YW50cy5yZXNvdXJjZURlbGltZXRlciArIEVycm9yRGVzY3JpcHRpb24ucG9wVXBXaW5kb3dFcnJvcik7XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB3aW5kb3cub3BlbmVkV2luZG93cy5wdXNoKHBvcHVwV2luZG93KTtcbiAgICB2YXIgcG9sbFRpbWVyID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGlmIChwb3B1cFdpbmRvdyAmJiBwb3B1cFdpbmRvdy5jbG9zZWQgJiYgaW5zdGFuY2UuX2xvZ2luSW5Qcm9ncmVzcykge1xuICAgICAgICBpZiAocmVqZWN0KSB7XG4gICAgICAgICAgcmVqZWN0KEVycm9yQ29kZXMudXNlckNhbmNlbGxlZEVycm9yICsgQ29uc3RhbnRzLnJlc291cmNlRGVsaW1ldGVyICsgRXJyb3JEZXNjcmlwdGlvbi51c2VyQ2FuY2VsbGVkRXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKHBvbGxUaW1lcik7XG4gICAgICAgIGlmICh0aGlzLl9pc0FuZ3VsYXIpIHtcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0KFwibXNhbDpwb3BVcENsb3NlZFwiLCBFcnJvckNvZGVzLnVzZXJDYW5jZWxsZWRFcnJvciArIENvbnN0YW50cy5yZXNvdXJjZURlbGltZXRlciArIEVycm9yRGVzY3JpcHRpb24udXNlckNhbmNlbGxlZEVycm9yKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpbnN0YW5jZS5fbG9naW5JblByb2dyZXNzID0gZmFsc2U7XG4gICAgICAgIGluc3RhbmNlLl9hY3F1aXJlVG9rZW5JblByb2dyZXNzID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciBwb3BVcFdpbmRvd0xvY2F0aW9uID0gcG9wdXBXaW5kb3cubG9jYXRpb247XG4gICAgICAgIGlmIChwb3BVcFdpbmRvd0xvY2F0aW9uLmhyZWYuaW5kZXhPZih0aGlzLmdldFJlZGlyZWN0VXJpKCkpICE9PSAtMSkge1xuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKHBvbGxUaW1lcik7XG4gICAgICAgICAgaW5zdGFuY2UuX2xvZ2luSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgICAgICAgIGluc3RhbmNlLl9hY3F1aXJlVG9rZW5JblByb2dyZXNzID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy5fbG9nZ2VyLmluZm8oXCJDbG9zaW5nIHBvcHVwIHdpbmRvd1wiKTtcbiAgICAgICAgICBpZiAodGhpcy5faXNBbmd1bGFyKSB7XG4gICAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0KFwibXNhbDpwb3BVcEhhc2hDaGFuZ2VkXCIsIHBvcFVwV2luZG93TG9jYXRpb24uaGFzaCk7XG4gICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgd2luZG93Lm9wZW5lZFdpbmRvd3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgIHdpbmRvdy5vcGVuZWRXaW5kb3dzW2ldLmNsb3NlKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy9Dcm9zcyBEb21haW4gdXJsIGNoZWNrIGVycm9yLiBXaWxsIGJlIHRocm93biB1bnRpbCBBQUQgcmVkaXJlY3RzIHRoZSB1c2VyIGJhY2sgdG8gdGhlIGFwcFwicyByb290IHBhZ2Ugd2l0aCB0aGUgdG9rZW4uIE5vIG5lZWQgdG8gbG9nIG9yIHRocm93IHRoaXMgZXJyb3IgYXMgaXQgd2lsbCBjcmVhdGUgdW5uZWNlc3NhcnkgdHJhZmZpYy5cbiAgICAgIH1cbiAgICB9LFxuICAgICAgaW50ZXJ2YWwpO1xuXG4gICAgcmV0dXJuIHBvcHVwV2luZG93O1xuICB9XG5cbiAgcHJpdmF0ZSBicm9hZGNhc3QoZXZlbnROYW1lOiBzdHJpbmcsIGRhdGE6IHN0cmluZykge1xuICAgICAgdmFyIGV2dCA9IG5ldyBDdXN0b21FdmVudChldmVudE5hbWUsIHsgZGV0YWlsOiBkYXRhIH0pO1xuICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQoZXZ0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIGxvZyBvdXQgdGhlIGN1cnJlbnQgdXNlciwgYW5kIHJlZGlyZWN0IHRoZSB1c2VyIHRvIHRoZSBwb3N0TG9nb3V0UmVkaXJlY3RVcmkuXG4gICAqIERlZmF1bHRzIGJlaGF2aW91ciBpcyB0byByZWRpcmVjdCB0aGUgdXNlciB0byBgd2luZG93LmxvY2F0aW9uLmhyZWZgLlxuICAgKi9cbiAgbG9nb3V0KCk6IHZvaWQge1xuICAgIHRoaXMuY2xlYXJDYWNoZSgpO1xuICAgIHRoaXMuX3VzZXIgPSBudWxsO1xuICAgIGxldCBsb2dvdXQgPSBcIlwiO1xuICAgIGlmICh0aGlzLmdldFBvc3RMb2dvdXRSZWRpcmVjdFVyaSgpKSB7XG4gICAgICBsb2dvdXQgPSBcInBvc3RfbG9nb3V0X3JlZGlyZWN0X3VyaT1cIiArIGVuY29kZVVSSUNvbXBvbmVudCh0aGlzLmdldFBvc3RMb2dvdXRSZWRpcmVjdFVyaSgpKTtcbiAgICB9XG5cbiAgICBjb25zdCB1cmxOYXZpZ2F0ZSA9IHRoaXMuYXV0aG9yaXR5ICsgXCIvb2F1dGgyL3YyLjAvbG9nb3V0P1wiICsgbG9nb3V0O1xuICAgIHRoaXMucHJvbXB0VXNlcih1cmxOYXZpZ2F0ZSk7XG4gIH1cblxuICAvKipcbiAgICogVXNlZCB0byBjb25maWd1cmUgdGhlIHBvcHVwIHdpbmRvdyBmb3IgbG9naW4uXG4gICAqIEBpZ25vcmVcbiAgICogQGhpZGRlblxuICAgKi9cbiAgcHJvdGVjdGVkIGNsZWFyQ2FjaGUoKTogdm9pZCB7XG4gICAgICB3aW5kb3cucmVuZXdTdGF0ZXMgPSBbXTtcbiAgICAgIGNvbnN0IGFjY2Vzc1Rva2VuSXRlbXMgPSB0aGlzLl9jYWNoZVN0b3JhZ2UuZ2V0QWxsQWNjZXNzVG9rZW5zKENvbnN0YW50cy5jbGllbnRJZCwgQ29uc3RhbnRzLnVzZXJJZGVudGlmaWVyKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFjY2Vzc1Rva2VuSXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuX2NhY2hlU3RvcmFnZS5yZW1vdmVJdGVtKEpTT04uc3RyaW5naWZ5KGFjY2Vzc1Rva2VuSXRlbXNbaV0ua2V5KSk7XG4gICAgfVxuICAgIHRoaXMuX2NhY2hlU3RvcmFnZS5yZXNldENhY2hlSXRlbXMoKTtcbiAgICB0aGlzLl9jYWNoZVN0b3JhZ2UuY2xlYXJDb29raWUoKTtcbiAgfVxuXG4gICBwcm90ZWN0ZWQgY2xlYXJDYWNoZUZvclNjb3BlKGFjY2Vzc1Rva2VuOiBzdHJpbmcpIHtcbiAgICAgIGNvbnN0IGFjY2Vzc1Rva2VuSXRlbXMgPSB0aGlzLl9jYWNoZVN0b3JhZ2UuZ2V0QWxsQWNjZXNzVG9rZW5zKENvbnN0YW50cy5jbGllbnRJZCwgQ29uc3RhbnRzLnVzZXJJZGVudGlmaWVyKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWNjZXNzVG9rZW5JdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciB0b2tlbiA9IGFjY2Vzc1Rva2VuSXRlbXNbaV07XG4gICAgICAgICAgaWYgKHRva2VuLnZhbHVlLmFjY2Vzc1Rva2VuID09PSBhY2Nlc3NUb2tlbikge1xuICAgICAgICAgICAgICB0aGlzLl9jYWNoZVN0b3JhZ2UucmVtb3ZlSXRlbShKU09OLnN0cmluZ2lmeSh0b2tlbi5rZXkpKTtcbiAgICAgICAgICB9XG4gICAgICB9XG4gIH1cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgcG9wdXAgd2luZG93IGZvciBsb2dpbi5cbiAgICogQGlnbm9yZVxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIG9wZW5Qb3B1cCh1cmxOYXZpZ2F0ZTogc3RyaW5nLCB0aXRsZTogc3RyaW5nLCBwb3BVcFdpZHRoOiBudW1iZXIsIHBvcFVwSGVpZ2h0OiBudW1iZXIpIHtcbiAgICB0cnkge1xuICAgICAgLyoqXG4gICAgICAgKiBhZGRpbmcgd2luTGVmdCBhbmQgd2luVG9wIHRvIGFjY291bnQgZm9yIGR1YWwgbW9uaXRvclxuICAgICAgICogdXNpbmcgc2NyZWVuTGVmdCBhbmQgc2NyZWVuVG9wIGZvciBJRTggYW5kIGVhcmxpZXJcbiAgICAgICAqL1xuICAgICAgY29uc3Qgd2luTGVmdCA9IHdpbmRvdy5zY3JlZW5MZWZ0ID8gd2luZG93LnNjcmVlbkxlZnQgOiB3aW5kb3cuc2NyZWVuWDtcbiAgICAgIGNvbnN0IHdpblRvcCA9IHdpbmRvdy5zY3JlZW5Ub3AgPyB3aW5kb3cuc2NyZWVuVG9wIDogd2luZG93LnNjcmVlblk7XG4gICAgICAvKipcbiAgICAgICAqIHdpbmRvdy5pbm5lcldpZHRoIGRpc3BsYXlzIGJyb3dzZXIgd2luZG93XCJzIGhlaWdodCBhbmQgd2lkdGggZXhjbHVkaW5nIHRvb2xiYXJzXG4gICAgICAgKiB1c2luZyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGggZm9yIElFOCBhbmQgZWFybGllclxuICAgICAgICovXG4gICAgICBjb25zdCB3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCB8fCBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoO1xuICAgICAgY29uc3QgaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQgfHwgZG9jdW1lbnQuYm9keS5jbGllbnRIZWlnaHQ7XG4gICAgICBjb25zdCBsZWZ0ID0gKCh3aWR0aCAvIDIpIC0gKHBvcFVwV2lkdGggLyAyKSkgKyB3aW5MZWZ0O1xuICAgICAgY29uc3QgdG9wID0gKChoZWlnaHQgLyAyKSAtIChwb3BVcEhlaWdodCAvIDIpKSArIHdpblRvcDtcblxuICAgICAgY29uc3QgcG9wdXBXaW5kb3cgPSB3aW5kb3cub3Blbih1cmxOYXZpZ2F0ZSwgdGl0bGUsIFwid2lkdGg9XCIgKyBwb3BVcFdpZHRoICsgXCIsIGhlaWdodD1cIiArIHBvcFVwSGVpZ2h0ICsgXCIsIHRvcD1cIiArIHRvcCArIFwiLCBsZWZ0PVwiICsgbGVmdCk7XG4gICAgICBpZiAocG9wdXBXaW5kb3cuZm9jdXMpIHtcbiAgICAgICAgcG9wdXBXaW5kb3cuZm9jdXMoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHBvcHVwV2luZG93O1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRoaXMuX2xvZ2dlci5lcnJvcihcImVycm9yIG9wZW5pbmcgcG9wdXAgXCIgKyBlLm1lc3NhZ2UpO1xuICAgICAgdGhpcy5fbG9naW5JblByb2dyZXNzID0gZmFsc2U7XG4gICAgICB0aGlzLl9hY3F1aXJlVG9rZW5JblByb2dyZXNzID0gZmFsc2U7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXNlZCB0byB2YWxpZGF0ZSB0aGUgc2NvcGVzIGlucHV0IHBhcmFtZXRlciByZXF1ZXN0ZWQgIGJ5IHRoZSBkZXZlbG9wZXIuXG4gICAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nPn0gc2NvcGVzIC0gRGV2ZWxvcGVyIHJlcXVlc3RlZCBwZXJtaXNzaW9ucy4gTm90IGFsbCBzY29wZXMgYXJlIGd1YXJhbnRlZWQgdG8gYmUgaW5jbHVkZWQgaW4gdGhlIGFjY2VzcyB0b2tlbiByZXR1cm5lZC5cbiAgICogQGlnbm9yZVxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIHZhbGlkYXRlSW5wdXRTY29wZShzY29wZXM6IEFycmF5PHN0cmluZz4pOiBzdHJpbmcge1xuICAgIGlmICghc2NvcGVzIHx8IHNjb3Blcy5sZW5ndGggPCAxKSB7XG4gICAgICByZXR1cm4gXCJTY29wZXMgY2Fubm90IGJlIHBhc3NlZCBhcyBhbiBlbXB0eSBhcnJheVwiO1xuICAgIH1cblxuICAgIGlmICghQXJyYXkuaXNBcnJheShzY29wZXMpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBUEkgZG9lcyBub3QgYWNjZXB0IG5vbi1hcnJheSBzY29wZXNcIik7XG4gICAgfVxuXG4gICAgaWYgKHNjb3Blcy5pbmRleE9mKHRoaXMuY2xpZW50SWQpID4gLTEpIHtcbiAgICAgIGlmIChzY29wZXMubGVuZ3RoID4gMSkge1xuICAgICAgICByZXR1cm4gXCJDbGllbnRJZCBjYW4gb25seSBiZSBwcm92aWRlZCBhcyBhIHNpbmdsZSBzY29wZVwiO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuXG4gIC8qKlxuICAgICogVXNlZCB0byByZW1vdmUgb3BlbmlkIGFuZCBwcm9maWxlIGZyb20gdGhlIGxpc3Qgb2Ygc2NvcGVzIHBhc3NlZCBieSB0aGUgZGV2ZWxvcGVyLlRoZXNlIHNjb3BlcyBhcmUgYWRkZWQgYnkgZGVmYXVsdFxuICAgICogQGhpZGRlblxuICAgICovXG4gIHByaXZhdGUgZmlsdGVyU2NvcGVzKHNjb3BlczogQXJyYXk8c3RyaW5nPik6IEFycmF5PHN0cmluZz4ge1xuICAgIHNjb3BlcyA9IHNjb3Blcy5maWx0ZXIoZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgIHJldHVybiBlbGVtZW50ICE9PSBcIm9wZW5pZFwiO1xuICAgIH0pO1xuXG4gICAgc2NvcGVzID0gc2NvcGVzLmZpbHRlcihmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgcmV0dXJuIGVsZW1lbnQgIT09IFwicHJvZmlsZVwiO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNjb3BlcztcbiAgfVxuICAvKipcbiAgICogVXNlZCB0byBhZGQgdGhlIGRldmVsb3BlciByZXF1ZXN0ZWQgY2FsbGJhY2sgdG8gdGhlIGFycmF5IG9mIGNhbGxiYWNrcyBmb3IgdGhlIHNwZWNpZmllZCBzY29wZXMuIFRoZSB1cGRhdGVkIGFycmF5IGlzIHN0b3JlZCBvbiB0aGUgd2luZG93IG9iamVjdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2NvcGUgLSBEZXZlbG9wZXIgcmVxdWVzdGVkIHBlcm1pc3Npb25zLiBOb3QgYWxsIHNjb3BlcyBhcmUgZ3VhcmFudGVlZCB0byBiZSBpbmNsdWRlZCBpbiB0aGUgYWNjZXNzIHRva2VuIHJldHVybmVkLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXhwZWN0ZWRTdGF0ZSAtIFVuaXF1ZSBzdGF0ZSBpZGVudGlmaWVyIChndWlkKS5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gcmVzb2x2ZSAtIFRoZSByZXNvbHZlIGZ1bmN0aW9uIG9mIHRoZSBwcm9taXNlIG9iamVjdC5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gcmVqZWN0IC0gVGhlIHJlamVjdCBmdW5jdGlvbiBvZiB0aGUgcHJvbWlzZSBvYmplY3QuXG4gICAqIEBpZ25vcmVcbiAgICogQGhpZGRlblxuICAgKi9cbiAgcHJpdmF0ZSByZWdpc3RlckNhbGxiYWNrKGV4cGVjdGVkU3RhdGU6IHN0cmluZywgc2NvcGU6IHN0cmluZywgcmVzb2x2ZTogRnVuY3Rpb24sIHJlamVjdDogRnVuY3Rpb24pOiB2b2lkIHtcbiAgICB3aW5kb3cuYWN0aXZlUmVuZXdhbHNbc2NvcGVdID0gZXhwZWN0ZWRTdGF0ZTtcbiAgICBpZiAoIXdpbmRvdy5jYWxsQmFja3NNYXBwZWRUb1JlbmV3U3RhdGVzW2V4cGVjdGVkU3RhdGVdKSB7XG4gICAgICAgIHdpbmRvdy5jYWxsQmFja3NNYXBwZWRUb1JlbmV3U3RhdGVzW2V4cGVjdGVkU3RhdGVdID0gW107XG4gICAgfVxuICAgIHdpbmRvdy5jYWxsQmFja3NNYXBwZWRUb1JlbmV3U3RhdGVzW2V4cGVjdGVkU3RhdGVdLnB1c2goeyByZXNvbHZlOiByZXNvbHZlLCByZWplY3Q6IHJlamVjdCB9KTtcbiAgICBpZiAoIXdpbmRvdy5jYWxsQmFja01hcHBlZFRvUmVuZXdTdGF0ZXNbZXhwZWN0ZWRTdGF0ZV0pIHtcbiAgICAgICAgd2luZG93LmNhbGxCYWNrTWFwcGVkVG9SZW5ld1N0YXRlc1tleHBlY3RlZFN0YXRlXSA9XG4gICAgICAgIChlcnJvckRlc2M6IHN0cmluZywgdG9rZW46IHN0cmluZywgZXJyb3I6IHN0cmluZywgdG9rZW5UeXBlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICB3aW5kb3cuYWN0aXZlUmVuZXdhbHNbc2NvcGVdID0gbnVsbDtcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHdpbmRvdy5jYWxsQmFja3NNYXBwZWRUb1JlbmV3U3RhdGVzW2V4cGVjdGVkU3RhdGVdLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBpZiAoZXJyb3JEZXNjIHx8IGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICB3aW5kb3cuY2FsbEJhY2tzTWFwcGVkVG9SZW5ld1N0YXRlc1tleHBlY3RlZFN0YXRlXVtpXS5yZWplY3QoZXJyb3JEZXNjICsgQ29uc3RhbnRzLnJlc291cmNlRGVsaW1ldGVyICsgZXJyb3IpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2UgaWYgKHRva2VuKSB7XG4gICAgICAgICAgICAgICAgICB3aW5kb3cuY2FsbEJhY2tzTWFwcGVkVG9SZW5ld1N0YXRlc1tleHBlY3RlZFN0YXRlXVtpXS5yZXNvbHZlKHRva2VuKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIud2FybmluZyhlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgd2luZG93LmNhbGxCYWNrc01hcHBlZFRvUmVuZXdTdGF0ZXNbZXhwZWN0ZWRTdGF0ZV0gPSBudWxsO1xuICAgICAgICAgIHdpbmRvdy5jYWxsQmFja01hcHBlZFRvUmVuZXdTdGF0ZXNbZXhwZWN0ZWRTdGF0ZV0gPSBudWxsO1xuICAgICAgICB9O1xuICAgIH1cbiAgfVxuXG5cbnByb3RlY3RlZCBnZXRDYWNoZWRUb2tlbkludGVybmFsKHNjb3BlcyA6IEFycmF5PHN0cmluZz4gLCB1c2VyOiBVc2VyKTogQ2FjaGVSZXN1bHQge1xuICAgIGNvbnN0IHVzZXJPYmplY3QgPSB1c2VyID8gdXNlciA6IHRoaXMuZ2V0VXNlcigpO1xuICAgIGlmICghdXNlck9iamVjdCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgbGV0IGF1dGhlbnRpY2F0aW9uUmVxdWVzdDogQXV0aGVudGljYXRpb25SZXF1ZXN0UGFyYW1ldGVycztcbiAgICBsZXQgbmV3QXV0aG9yaXR5ID0gdGhpcy5hdXRob3JpdHlJbnN0YW5jZSA/IHRoaXMuYXV0aG9yaXR5SW5zdGFuY2UgOiBBdXRob3JpdHlGYWN0b3J5LkNyZWF0ZUluc3RhbmNlKHRoaXMuYXV0aG9yaXR5LCB0aGlzLnZhbGlkYXRlQXV0aG9yaXR5KTtcblxuICAgIGlmIChVdGlscy5jb21wYXJlT2JqZWN0cyh1c2VyT2JqZWN0LCB0aGlzLmdldFVzZXIoKSkpIHtcbiAgICAgICAgaWYgKHNjb3Blcy5pbmRleE9mKHRoaXMuY2xpZW50SWQpID4gLTEpIHtcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0aW9uUmVxdWVzdCA9IG5ldyBBdXRoZW50aWNhdGlvblJlcXVlc3RQYXJhbWV0ZXJzKG5ld0F1dGhvcml0eSwgdGhpcy5jbGllbnRJZCwgc2NvcGVzLCBSZXNwb25zZVR5cGVzLmlkX3Rva2VuLCB0aGlzLmdldFJlZGlyZWN0VXJpKCksIHRoaXMuX3N0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0aW9uUmVxdWVzdCA9IG5ldyBBdXRoZW50aWNhdGlvblJlcXVlc3RQYXJhbWV0ZXJzKG5ld0F1dGhvcml0eSwgdGhpcy5jbGllbnRJZCwgc2NvcGVzLCBSZXNwb25zZVR5cGVzLnRva2VuLCB0aGlzLmdldFJlZGlyZWN0VXJpKCksIHRoaXMuX3N0YXRlKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGF1dGhlbnRpY2F0aW9uUmVxdWVzdCA9IG5ldyBBdXRoZW50aWNhdGlvblJlcXVlc3RQYXJhbWV0ZXJzKG5ld0F1dGhvcml0eSwgdGhpcy5jbGllbnRJZCwgc2NvcGVzLCBSZXNwb25zZVR5cGVzLmlkX3Rva2VuX3Rva2VuLCB0aGlzLmdldFJlZGlyZWN0VXJpKCksIHRoaXMuX3N0YXRlKTtcbiAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q2FjaGVkVG9rZW4oYXV0aGVudGljYXRpb25SZXF1ZXN0LCB1c2VyKTtcbn1cblxuICAvKipcbiAgICogVXNlZCB0byBnZXQgdG9rZW4gZm9yIHRoZSBzcGVjaWZpZWQgc2V0IG9mIHNjb3BlcyBmcm9tIHRoZSBjYWNoZVxuICAgKiBAcGFyYW0ge0F1dGhlbnRpY2F0aW9uUmVxdWVzdFBhcmFtZXRlcnN9IGF1dGhlbnRpY2F0aW9uUmVxdWVzdCAtIFJlcXVlc3Qgc2VudCB0byB0aGUgU1RTIHRvIG9idGFpbiBhbiBpZF90b2tlbi9hY2Nlc3NfdG9rZW5cbiAgICogQHBhcmFtIHtVc2VyfSB1c2VyIC0gVXNlciBmb3Igd2hpY2ggdGhlIHNjb3BlcyB3ZXJlIHJlcXVlc3RlZFxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIGdldENhY2hlZFRva2VuKGF1dGhlbnRpY2F0aW9uUmVxdWVzdDogQXV0aGVudGljYXRpb25SZXF1ZXN0UGFyYW1ldGVycywgdXNlcjogVXNlcik6IENhY2hlUmVzdWx0IHtcbiAgICBsZXQgYWNjZXNzVG9rZW5DYWNoZUl0ZW06IEFjY2Vzc1Rva2VuQ2FjaGVJdGVtID0gbnVsbDtcbiAgICBjb25zdCBzY29wZXMgPSBhdXRoZW50aWNhdGlvblJlcXVlc3Quc2NvcGVzO1xuICAgIGNvbnN0IHRva2VuQ2FjaGVJdGVtcyA9IHRoaXMuX2NhY2hlU3RvcmFnZS5nZXRBbGxBY2Nlc3NUb2tlbnModGhpcy5jbGllbnRJZCwgdXNlciA/IHVzZXIudXNlcklkZW50aWZpZXIgOiBudWxsKTsgLy9maWx0ZXIgYnkgY2xpZW50SWQgYW5kIHVzZXJcbiAgICBpZiAodG9rZW5DYWNoZUl0ZW1zLmxlbmd0aCA9PT0gMCkgeyAvLyBObyBtYXRjaCBmb3VuZCBhZnRlciBpbml0aWFsIGZpbHRlcmluZ1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsdGVyZWRJdGVtczogQXJyYXk8QWNjZXNzVG9rZW5DYWNoZUl0ZW0+ID0gW107XG4gICAgLy9pZiBubyBhdXRob3JpdHkgcGFzc2VkXG4gICAgaWYgKCFhdXRoZW50aWNhdGlvblJlcXVlc3QuYXV0aG9yaXR5KSB7XG4gICAgICAvL2ZpbHRlciBieSBzY29wZVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b2tlbkNhY2hlSXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY2FjaGVJdGVtID0gdG9rZW5DYWNoZUl0ZW1zW2ldO1xuICAgICAgICBjb25zdCBjYWNoZWRTY29wZXMgPSBjYWNoZUl0ZW0ua2V5LnNjb3Blcy5zcGxpdChcIiBcIik7XG4gICAgICAgIGlmIChVdGlscy5jb250YWluc1Njb3BlKGNhY2hlZFNjb3Blcywgc2NvcGVzKSkge1xuICAgICAgICAgIGZpbHRlcmVkSXRlbXMucHVzaChjYWNoZUl0ZW0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vaWYgb25seSBvbmUgY2FjaGVkIHRva2VuIGZvdW5kXG4gICAgICBpZiAoZmlsdGVyZWRJdGVtcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgYWNjZXNzVG9rZW5DYWNoZUl0ZW0gPSBmaWx0ZXJlZEl0ZW1zWzBdO1xuXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uUmVxdWVzdC5hdXRob3JpdHlJbnN0YW5jZSA9IEF1dGhvcml0eUZhY3RvcnkuQ3JlYXRlSW5zdGFuY2UoYWNjZXNzVG9rZW5DYWNoZUl0ZW0ua2V5LmF1dGhvcml0eSwgdGhpcy52YWxpZGF0ZUF1dGhvcml0eSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChmaWx0ZXJlZEl0ZW1zLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBlcnJvckRlc2M6IFwiVGhlIGNhY2hlIGNvbnRhaW5zIG11bHRpcGxlIHRva2VucyBzYXRpc2Z5aW5nIHRoZSByZXF1aXJlbWVudHMuIENhbGwgQWNxdWlyZVRva2VuIGFnYWluIHByb3ZpZGluZyBtb3JlIHJlcXVpcmVtZW50cyBsaWtlIGF1dGhvcml0eVwiLFxuICAgICAgICAgIHRva2VuOiBudWxsLFxuICAgICAgICAgIGVycm9yOiBcIm11bHRpcGxlX21hdGNoaW5nX3Rva2Vuc19kZXRlY3RlZFwiXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgLy9ubyBtYXRjaCBmb3VuZC4gY2hlY2sgaWYgdGhlcmUgd2FzIGEgc2luZ2xlIGF1dGhvcml0eSB1c2VkXG4gICAgICAgIGNvbnN0IGF1dGhvcml0eUxpc3QgPSB0aGlzLmdldFVuaXF1ZUF1dGhvcml0eSh0b2tlbkNhY2hlSXRlbXMsIFwiYXV0aG9yaXR5XCIpO1xuICAgICAgICBpZiAoYXV0aG9yaXR5TGlzdC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGVycm9yRGVzYzogXCJNdWx0aXBsZSBhdXRob3JpdGllcyBmb3VuZCBpbiB0aGUgY2FjaGUuIFBhc3MgYXV0aG9yaXR5IGluIHRoZSBBUEkgb3ZlcmxvYWQuXCIsXG4gICAgICAgICAgICB0b2tlbjogbnVsbCxcbiAgICAgICAgICAgIGVycm9yOiBcIm11bHRpcGxlX21hdGNoaW5nX3Rva2Vuc19kZXRlY3RlZFwiXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uUmVxdWVzdC5hdXRob3JpdHlJbnN0YW5jZSA9IEF1dGhvcml0eUZhY3RvcnkuQ3JlYXRlSW5zdGFuY2UoYXV0aG9yaXR5TGlzdFswXSwgdGhpcy52YWxpZGF0ZUF1dGhvcml0eSk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgLy9hdXRob3JpdHkgd2FzIHBhc3NlZCBpbiB0aGUgQVBJLCBmaWx0ZXIgYnkgYXV0aG9yaXR5IGFuZCBzY29wZVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b2tlbkNhY2hlSXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY2FjaGVJdGVtID0gdG9rZW5DYWNoZUl0ZW1zW2ldO1xuICAgICAgICBjb25zdCBjYWNoZWRTY29wZXMgPSBjYWNoZUl0ZW0ua2V5LnNjb3Blcy5zcGxpdChcIiBcIik7XG4gICAgICAgIGlmIChVdGlscy5jb250YWluc1Njb3BlKGNhY2hlZFNjb3Blcywgc2NvcGVzKSAmJiBjYWNoZUl0ZW0ua2V5LmF1dGhvcml0eSA9PT0gYXV0aGVudGljYXRpb25SZXF1ZXN0LmF1dGhvcml0eSkge1xuICAgICAgICAgIGZpbHRlcmVkSXRlbXMucHVzaChjYWNoZUl0ZW0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vbm8gbWF0Y2hcbiAgICAgIGlmIChmaWx0ZXJlZEl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIC8vb25seSBvbmUgY2FjaGVkVG9rZW4gRm91bmRcbiAgICAgIGVsc2UgaWYgKGZpbHRlcmVkSXRlbXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIGFjY2Vzc1Rva2VuQ2FjaGVJdGVtID0gZmlsdGVyZWRJdGVtc1swXTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAvL21vcmUgdGhhbiBvbmUgbWF0Y2ggZm91bmQuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZXJyb3JEZXNjOiBcIlRoZSBjYWNoZSBjb250YWlucyBtdWx0aXBsZSB0b2tlbnMgc2F0aXNmeWluZyB0aGUgcmVxdWlyZW1lbnRzLkNhbGwgQWNxdWlyZVRva2VuIGFnYWluIHByb3ZpZGluZyBtb3JlIHJlcXVpcmVtZW50cyBsaWtlIGF1dGhvcml0eVwiLFxuICAgICAgICAgIHRva2VuOiBudWxsLFxuICAgICAgICAgIGVycm9yOiBcIm11bHRpcGxlX21hdGNoaW5nX3Rva2Vuc19kZXRlY3RlZFwiXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGFjY2Vzc1Rva2VuQ2FjaGVJdGVtICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IGV4cGlyZWQgPSBOdW1iZXIoYWNjZXNzVG9rZW5DYWNoZUl0ZW0udmFsdWUuZXhwaXJlc0luKTtcbiAgICAgIC8vIElmIGV4cGlyYXRpb24gaXMgd2l0aGluIG9mZnNldCwgaXQgd2lsbCBmb3JjZSByZW5ld1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5fY2xvY2tTa2V3IHx8IDMwMDtcbiAgICAgIGlmIChleHBpcmVkICYmIChleHBpcmVkID4gVXRpbHMubm93KCkgKyBvZmZzZXQpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZXJyb3JEZXNjOiBudWxsLFxuICAgICAgICAgIHRva2VuOiBhY2Nlc3NUb2tlbkNhY2hlSXRlbS52YWx1ZS5hY2Nlc3NUb2tlbixcbiAgICAgICAgICBlcnJvcjogbnVsbFxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fY2FjaGVTdG9yYWdlLnJlbW92ZUl0ZW0oSlNPTi5zdHJpbmdpZnkoZmlsdGVyZWRJdGVtc1swXS5rZXkpKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIGZpbHRlciBhbGwgY2FjaGVkIGl0ZW1zIGFuZCByZXR1cm4gYSBsaXN0IG9mIHVuaXF1ZSB1c2VycyBiYXNlZCBvbiB1c2VySWRlbnRpZmllci5cbiAgICogQHBhcmFtIHtBcnJheTxVc2VyPn0gVXNlcnMgLSB1c2VycyBzYXZlZCBpbiB0aGUgY2FjaGUuXG4gICAqL1xuICBnZXRBbGxVc2VycygpOiBBcnJheTxVc2VyPiB7XG4gICAgICBjb25zdCB1c2VyczogQXJyYXk8VXNlcj4gPSBbXTtcbiAgICAgIGNvbnN0IGFjY2Vzc1Rva2VuQ2FjaGVJdGVtcyA9IHRoaXMuX2NhY2hlU3RvcmFnZS5nZXRBbGxBY2Nlc3NUb2tlbnMoQ29uc3RhbnRzLmNsaWVudElkLCBDb25zdGFudHMudXNlcklkZW50aWZpZXIpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWNjZXNzVG9rZW5DYWNoZUl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBpZFRva2VuID0gbmV3IElkVG9rZW4oYWNjZXNzVG9rZW5DYWNoZUl0ZW1zW2ldLnZhbHVlLmlkVG9rZW4pO1xuICAgICAgY29uc3QgY2xpZW50SW5mbyA9IG5ldyBDbGllbnRJbmZvKGFjY2Vzc1Rva2VuQ2FjaGVJdGVtc1tpXS52YWx1ZS5jbGllbnRJbmZvKTtcbiAgICAgIGNvbnN0IHVzZXIgPSBVc2VyLmNyZWF0ZVVzZXIoaWRUb2tlbiwgY2xpZW50SW5mbyk7XG4gICAgICB1c2Vycy5wdXNoKHVzZXIpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmdldFVuaXF1ZVVzZXJzKHVzZXJzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIGZpbHRlciB1c2VycyBiYXNlZCBvbiB1c2VySWRlbnRpZmllclxuICAgKiBAcGFyYW0ge0FycmF5PFVzZXI+fSAgVXNlcnMgLSB1c2VycyBzYXZlZCBpbiB0aGUgY2FjaGVcbiAgICogQGlnbm9yZVxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIGdldFVuaXF1ZVVzZXJzKHVzZXJzOiBBcnJheTxVc2VyPik6IEFycmF5PFVzZXI+IHtcbiAgICBpZiAoIXVzZXJzIHx8IHVzZXJzLmxlbmd0aCA8PSAxKSB7XG4gICAgICByZXR1cm4gdXNlcnM7XG4gICAgfVxuXG4gICAgY29uc3QgZmxhZ3M6IEFycmF5PHN0cmluZz4gPSBbXTtcbiAgICBjb25zdCB1bmlxdWVVc2VyczogQXJyYXk8VXNlcj4gPSBbXTtcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgdXNlcnMubGVuZ3RoOyArK2luZGV4KSB7XG4gICAgICBpZiAodXNlcnNbaW5kZXhdLnVzZXJJZGVudGlmaWVyICYmIGZsYWdzLmluZGV4T2YodXNlcnNbaW5kZXhdLnVzZXJJZGVudGlmaWVyKSA9PT0gLTEpIHtcbiAgICAgICAgZmxhZ3MucHVzaCh1c2Vyc1tpbmRleF0udXNlcklkZW50aWZpZXIpO1xuICAgICAgICB1bmlxdWVVc2Vycy5wdXNoKHVzZXJzW2luZGV4XSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuaXF1ZVVzZXJzO1xuICB9XG5cbiAgLyoqXG4gICogVXNlZCB0byBnZXQgYSB1bmlxdWUgbGlzdCBvZiBhdXRob3JpdHVlcyBmcm9tIHRoZSBjYWNoZVxuICAqIEBwYXJhbSB7QXJyYXk8QWNjZXNzVG9rZW5DYWNoZUl0ZW0+fSAgYWNjZXNzVG9rZW5DYWNoZUl0ZW1zIC0gYWNjZXNzVG9rZW5DYWNoZUl0ZW1zIHNhdmVkIGluIHRoZSBjYWNoZVxuICAqIEBpZ25vcmVcbiAgKiBAaGlkZGVuXG4gICovXG4gIHByaXZhdGUgZ2V0VW5pcXVlQXV0aG9yaXR5KGFjY2Vzc1Rva2VuQ2FjaGVJdGVtczogQXJyYXk8QWNjZXNzVG9rZW5DYWNoZUl0ZW0+LCBwcm9wZXJ0eTogc3RyaW5nKTogQXJyYXk8c3RyaW5nPiB7XG4gICAgY29uc3QgYXV0aG9yaXR5TGlzdDogQXJyYXk8c3RyaW5nPiA9IFtdO1xuICAgIGNvbnN0IGZsYWdzOiBBcnJheTxzdHJpbmc+ID0gW107XG4gICAgYWNjZXNzVG9rZW5DYWNoZUl0ZW1zLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICBpZiAoZWxlbWVudC5rZXkuaGFzT3duUHJvcGVydHkocHJvcGVydHkpICYmIChmbGFncy5pbmRleE9mKGVsZW1lbnQua2V5W3Byb3BlcnR5XSkgPT09IC0xKSkge1xuICAgICAgICBmbGFncy5wdXNoKGVsZW1lbnQua2V5W3Byb3BlcnR5XSk7XG4gICAgICAgIGF1dGhvcml0eUxpc3QucHVzaChlbGVtZW50LmtleVtwcm9wZXJ0eV0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBhdXRob3JpdHlMaXN0O1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgbG9naW5faGludCB0byBhdXRob3JpemF0aW9uIFVSTCB3aGljaCBpcyB1c2VkIHRvIHByZS1maWxsIHRoZSB1c2VybmFtZSBmaWVsZCBvZiBzaWduIGluIHBhZ2UgZm9yIHRoZSB1c2VyIGlmIGtub3duIGFoZWFkIG9mIHRpbWVcbiAgICogZG9tYWluX2hpbnQgY2FuIGJlIG9uZSBvZiB1c2Vycy9vcmdhbmlzYXRpb25zIHdoaWNoIHdoZW4gYWRkZWQgc2tpcHMgdGhlIGVtYWlsIGJhc2VkIGRpc2NvdmVyeSBwcm9jZXNzIG9mIHRoZSB1c2VyXG4gICAqIGRvbWFpbl9yZXEgdXRpZCByZWNlaXZlZCBhcyBwYXJ0IG9mIHRoZSBjbGllbnRJbmZvXG4gICAqIGxvZ2luX3JlcSB1aWQgcmVjZWl2ZWQgYXMgcGFydCBvZiBjbGllbnRJbmZvXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1cmxOYXZpZ2F0ZSAtIEF1dGhlbnRpY2F0aW9uIHJlcXVlc3QgdXJsXG4gICAqIEBwYXJhbSB7VXNlcn0gdXNlciAtIFVzZXIgZm9yIHdoaWNoIHRoZSB0b2tlbiBpcyByZXF1ZXN0ZWRcbiAgICogQGlnbm9yZVxuICAgKiBAaGlkZGVuXG4gICAqL1xuICAgIHByaXZhdGUgYWRkSGludFBhcmFtZXRlcnModXJsTmF2aWdhdGU6IHN0cmluZywgdXNlcjogVXNlcik6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IHVzZXJPYmplY3QgPSB1c2VyID8gdXNlciA6IHRoaXMuZ2V0VXNlcigpO1xuICAgICAgICBpZiAodXNlck9iamVjdCkge1xuICAgICAgICAgICAgY29uc3QgZGVjb2RlZENsaWVudEluZm8gPSB1c2VyT2JqZWN0LnVzZXJJZGVudGlmaWVyLnNwbGl0KFwiLlwiKTtcbiAgICAgICAgICAgIGNvbnN0IHVpZCA9IFV0aWxzLmJhc2U2NERlY29kZVN0cmluZ1VybFNhZmUoZGVjb2RlZENsaWVudEluZm9bMF0pO1xuICAgICAgICAgICAgY29uc3QgdXRpZCA9IFV0aWxzLmJhc2U2NERlY29kZVN0cmluZ1VybFNhZmUoZGVjb2RlZENsaWVudEluZm9bMV0pO1xuXG4gICAgICAgICAgICBpZiAodXNlck9iamVjdC5zaWQgICYmIHVybE5hdmlnYXRlLmluZGV4T2YoQ29uc3RhbnRzLnByb21wdF9ub25lKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMudXJsQ29udGFpbnNRdWVyeVN0cmluZ1BhcmFtZXRlcihDb25zdGFudHMuc2lkLCB1cmxOYXZpZ2F0ZSkgJiYgIXRoaXMudXJsQ29udGFpbnNRdWVyeVN0cmluZ1BhcmFtZXRlcihDb25zdGFudHMubG9naW5faGludCwgdXJsTmF2aWdhdGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHVybE5hdmlnYXRlICs9IFwiJlwiICsgQ29uc3RhbnRzLnNpZCArIFwiPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHVzZXJPYmplY3Quc2lkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMudXJsQ29udGFpbnNRdWVyeVN0cmluZ1BhcmFtZXRlcihDb25zdGFudHMubG9naW5faGludCwgdXJsTmF2aWdhdGUpICYmIHVzZXJPYmplY3QuZGlzcGxheWFibGVJZCAmJiAhVXRpbHMuaXNFbXB0eSh1c2VyT2JqZWN0LmRpc3BsYXlhYmxlSWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHVybE5hdmlnYXRlICs9IFwiJlwiICsgQ29uc3RhbnRzLmxvZ2luX2hpbnQgKyBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudCh1c2VyT2JqZWN0LmRpc3BsYXlhYmxlSWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFVdGlscy5pc0VtcHR5KHVpZCkgJiYgIVV0aWxzLmlzRW1wdHkodXRpZCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMudXJsQ29udGFpbnNRdWVyeVN0cmluZ1BhcmFtZXRlcihcImRvbWFpbl9yZXFcIiwgdXJsTmF2aWdhdGUpICYmICFVdGlscy5pc0VtcHR5KHV0aWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHVybE5hdmlnYXRlICs9IFwiJmRvbWFpbl9yZXE9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodXRpZCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnVybENvbnRhaW5zUXVlcnlTdHJpbmdQYXJhbWV0ZXIoXCJsb2dpbl9yZXFcIiwgdXJsTmF2aWdhdGUpICYmICFVdGlscy5pc0VtcHR5KHVpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsTmF2aWdhdGUgKz0gXCImbG9naW5fcmVxPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHVpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0aGlzLnVybENvbnRhaW5zUXVlcnlTdHJpbmdQYXJhbWV0ZXIoQ29uc3RhbnRzLmRvbWFpbl9oaW50LCB1cmxOYXZpZ2F0ZSkgJiYgIVV0aWxzLmlzRW1wdHkodXRpZCkpIHtcbiAgICAgICAgICAgICAgICBpZiAodXRpZCA9PT0gQ29uc3RhbnRzLmNvbnN1bWVyc1V0aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsTmF2aWdhdGUgKz0gXCImXCIgKyAgQ29uc3RhbnRzLmRvbWFpbl9oaW50ICsgXCI9XCIgKyBlbmNvZGVVUklDb21wb25lbnQoQ29uc3RhbnRzLmNvbnN1bWVycyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsTmF2aWdhdGUgKz0gXCImXCIgKyBDb25zdGFudHMuZG9tYWluX2hpbnQgKyBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudChDb25zdGFudHMub3JnYW5pemF0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdXJsTmF2aWdhdGU7XG4gICAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlIGF1dGhvcml6YXRpb24gZW5kcG9pbnQgVVJMIGNvbnRhaW5zIHF1ZXJ5IHN0cmluZyBwYXJhbWV0ZXJzXG4gICAqIEBpZ25vcmVcbiAgICogQGhpZGRlblxuICAgKi9cbiAgcHJpdmF0ZSB1cmxDb250YWluc1F1ZXJ5U3RyaW5nUGFyYW1ldGVyKG5hbWU6IHN0cmluZywgdXJsOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAvLyByZWdleCB0byBkZXRlY3QgcGF0dGVybiBvZiBhID8gb3IgJiBmb2xsb3dlZCBieSB0aGUgbmFtZSBwYXJhbWV0ZXIgYW5kIGFuIGVxdWFscyBjaGFyYWN0ZXJcbiAgICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAoXCJbXFxcXD8mXVwiICsgbmFtZSArIFwiPVwiKTtcbiAgICByZXR1cm4gcmVnZXgudGVzdCh1cmwpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gb2J0YWluIGFuIGFjY2Vzc190b2tlbiBieSByZWRpcmVjdGluZyB0aGUgdXNlciB0byB0aGUgYXV0aG9yaXphdGlvbiBlbmRwb2ludC5cbiAgICogVG8gcmVuZXcgaWRUb2tlbiwgY2xpZW50SWQgc2hvdWxkIGJlIHBhc3NlZCBhcyB0aGUgb25seSBzY29wZSBpbiB0aGUgc2NvcGVzIGFycmF5LlxuICAgKiBAcGFyYW0ge0FycmF5PHN0cmluZz59IHNjb3BlcyAtIFBlcm1pc3Npb25zIHlvdSB3YW50IGluY2x1ZGVkIGluIHRoZSBhY2Nlc3MgdG9rZW4uIE5vdCBhbGwgc2NvcGVzIGFyZSAgZ3VhcmFudGVlZCB0byBiZSBpbmNsdWRlZCBpbiB0aGUgYWNjZXNzIHRva2VuLiBTY29wZXMgbGlrZSBcIm9wZW5pZFwiIGFuZCBcInByb2ZpbGVcIiBhcmUgc2VudCB3aXRoIGV2ZXJ5IHJlcXVlc3QuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhdXRob3JpdHkgLSBBIFVSTCBpbmRpY2F0aW5nIGEgZGlyZWN0b3J5IHRoYXQgTVNBTCBjYW4gdXNlIHRvIG9idGFpbiB0b2tlbnMuXG4gICAqIC0gSW4gQXp1cmUgQUQsIGl0IGlzIG9mIHRoZSBmb3JtIGh0dHBzOi8ve2luc3RhbmNlfS8mbHQ7dGVuYW50Jmd0Oywgd2hlcmUgJmx0O3RlbmFudCZndDsgaXMgdGhlIGRpcmVjdG9yeSBob3N0IChlLmcuIGh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbSkgYW5kICZsdDt0ZW5hbnQmZ3Q7IGlzIGEgaWRlbnRpZmllciB3aXRoaW4gdGhlIGRpcmVjdG9yeSBpdHNlbGYgKGUuZy4gYSBkb21haW4gYXNzb2NpYXRlZCB0byB0aGUgdGVuYW50LCBzdWNoIGFzIGNvbnRvc28ub25taWNyb3NvZnQuY29tLCBvciB0aGUgR1VJRCByZXByZXNlbnRpbmcgdGhlIFRlbmFudElEIHByb3BlcnR5IG9mIHRoZSBkaXJlY3RvcnkpXG4gICAqIC0gSW4gQXp1cmUgQjJDLCBpdCBpcyBvZiB0aGUgZm9ybSBodHRwczovL3tpbnN0YW5jZX0vdGZwLyZsdDt0ZW5hbnQmZ3Q7Lzxwb2xpY3lOYW1lPlxuICAgKiAtIERlZmF1bHQgdmFsdWUgaXM6IFwiaHR0cHM6Ly9sb2dpbi5taWNyb3NvZnRvbmxpbmUuY29tL2NvbW1vblwiXG4gICAqIEBwYXJhbSB7VXNlcn0gdXNlciAtIFRoZSB1c2VyIGZvciB3aGljaCB0aGUgc2NvcGVzIGFyZSByZXF1ZXN0ZWQuVGhlIGRlZmF1bHQgdXNlciBpcyB0aGUgbG9nZ2VkIGluIHVzZXIuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBleHRyYVF1ZXJ5UGFyYW1ldGVycyAtIEtleS12YWx1ZSBwYWlycyB0byBwYXNzIHRvIHRoZSBTVFMgZHVyaW5nIHRoZSAgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICovXG4gIGFjcXVpcmVUb2tlblJlZGlyZWN0KHNjb3BlczogQXJyYXk8c3RyaW5nPik6IHZvaWQ7XG4gIGFjcXVpcmVUb2tlblJlZGlyZWN0KHNjb3BlczogQXJyYXk8c3RyaW5nPiwgYXV0aG9yaXR5OiBzdHJpbmcpOiB2b2lkO1xuICBhY3F1aXJlVG9rZW5SZWRpcmVjdChzY29wZXM6IEFycmF5PHN0cmluZz4sIGF1dGhvcml0eTogc3RyaW5nLCB1c2VyOiBVc2VyKTogdm9pZDtcbiAgYWNxdWlyZVRva2VuUmVkaXJlY3Qoc2NvcGVzOiBBcnJheTxzdHJpbmc+LCBhdXRob3JpdHk6IHN0cmluZywgdXNlcjogVXNlciwgZXh0cmFRdWVyeVBhcmFtZXRlcnM6IHN0cmluZyk6IHZvaWQ7XG4gIGFjcXVpcmVUb2tlblJlZGlyZWN0KHNjb3BlczogQXJyYXk8c3RyaW5nPiwgYXV0aG9yaXR5Pzogc3RyaW5nLCB1c2VyPzogVXNlciwgZXh0cmFRdWVyeVBhcmFtZXRlcnM/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBpc1ZhbGlkU2NvcGUgPSB0aGlzLnZhbGlkYXRlSW5wdXRTY29wZShzY29wZXMpO1xuICAgIGlmIChpc1ZhbGlkU2NvcGUgJiYgIVV0aWxzLmlzRW1wdHkoaXNWYWxpZFNjb3BlKSkge1xuICAgICAgICBpZiAodGhpcy5fdG9rZW5SZWNlaXZlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLl90b2tlblJlY2VpdmVkQ2FsbGJhY2soRXJyb3JEZXNjcmlwdGlvbi5pbnB1dFNjb3Blc0Vycm9yLCBudWxsLCBFcnJvckNvZGVzLmlucHV0U2NvcGVzRXJyb3IsIENvbnN0YW50cy5hY2Nlc3NUb2tlbiwgdGhpcy5nZXRVc2VyU3RhdGUodGhpcy5fY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLnN0YXRlTG9naW4sIHRoaXMuc3RvcmVBdXRoU3RhdGVJbkNvb2tpZSkpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzY29wZXMpIHtcbiAgICAgIHNjb3BlcyA9IHRoaXMuZmlsdGVyU2NvcGVzKHNjb3Blcyk7XG4gICAgfVxuXG4gICAgY29uc3QgdXNlck9iamVjdCA9IHVzZXIgPyB1c2VyIDogdGhpcy5nZXRVc2VyKCk7XG4gICAgaWYgKHRoaXMuX2FjcXVpcmVUb2tlbkluUHJvZ3Jlc3MpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzY29wZSA9IHNjb3Blcy5qb2luKFwiIFwiKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgaWYgKCF1c2VyT2JqZWN0ICYmICEoZXh0cmFRdWVyeVBhcmFtZXRlcnMgJiYgKGV4dHJhUXVlcnlQYXJhbWV0ZXJzLmluZGV4T2YoQ29uc3RhbnRzLmxvZ2luX2hpbnQpICE9PSAtMSApKSkge1xuICAgICAgICAgIGlmICh0aGlzLl90b2tlblJlY2VpdmVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmluZm8oXCJVc2VyIGxvZ2luIGlzIHJlcXVpcmVkXCIpO1xuICAgICAgICAgICAgICB0aGlzLl90b2tlblJlY2VpdmVkQ2FsbGJhY2soRXJyb3JEZXNjcmlwdGlvbi51c2VyTG9naW5FcnJvciwgbnVsbCwgRXJyb3JDb2Rlcy51c2VyTG9naW5FcnJvciwgQ29uc3RhbnRzLmFjY2Vzc1Rva2VuLCB0aGlzLmdldFVzZXJTdGF0ZSh0aGlzLl9jYWNoZVN0b3JhZ2UuZ2V0SXRlbShDb25zdGFudHMuc3RhdGVMb2dpbiwgdGhpcy5zdG9yZUF1dGhTdGF0ZUluQ29va2llKSkpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgdGhpcy5fYWNxdWlyZVRva2VuSW5Qcm9ncmVzcyA9IHRydWU7XG4gICAgbGV0IGF1dGhlbnRpY2F0aW9uUmVxdWVzdDogQXV0aGVudGljYXRpb25SZXF1ZXN0UGFyYW1ldGVycztcbiAgICBsZXQgYWNxdWlyZVRva2VuQXV0aG9yaXR5ID0gYXV0aG9yaXR5ID8gQXV0aG9yaXR5RmFjdG9yeS5DcmVhdGVJbnN0YW5jZShhdXRob3JpdHksIHRoaXMudmFsaWRhdGVBdXRob3JpdHkpIDogdGhpcy5hdXRob3JpdHlJbnN0YW5jZTtcblxuICAgIGFjcXVpcmVUb2tlbkF1dGhvcml0eS5SZXNvbHZlRW5kcG9pbnRzQXN5bmMoKS50aGVuKCgpID0+IHtcbiAgICAgIGlmIChVdGlscy5jb21wYXJlT2JqZWN0cyh1c2VyT2JqZWN0LCB0aGlzLmdldFVzZXIoKSkpIHtcbiAgICAgICAgICBpZiAoc2NvcGVzLmluZGV4T2YodGhpcy5jbGllbnRJZCkgPiAtMSkge1xuICAgICAgICAgICAgICBhdXRoZW50aWNhdGlvblJlcXVlc3QgPSBuZXcgQXV0aGVudGljYXRpb25SZXF1ZXN0UGFyYW1ldGVycyhhY3F1aXJlVG9rZW5BdXRob3JpdHksIHRoaXMuY2xpZW50SWQsIHNjb3BlcywgUmVzcG9uc2VUeXBlcy5pZF90b2tlbiwgdGhpcy5nZXRSZWRpcmVjdFVyaSgpLCB0aGlzLl9zdGF0ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBhdXRoZW50aWNhdGlvblJlcXVlc3QgPSBuZXcgQXV0aGVudGljYXRpb25SZXF1ZXN0UGFyYW1ldGVycyhhY3F1aXJlVG9rZW5BdXRob3JpdHksIHRoaXMuY2xpZW50SWQsIHNjb3BlcywgUmVzcG9uc2VUeXBlcy50b2tlbiwgdGhpcy5nZXRSZWRpcmVjdFVyaSgpLCB0aGlzLl9zdGF0ZSk7XG4gICAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXV0aGVudGljYXRpb25SZXF1ZXN0ID0gbmV3IEF1dGhlbnRpY2F0aW9uUmVxdWVzdFBhcmFtZXRlcnMoYWNxdWlyZVRva2VuQXV0aG9yaXR5LCB0aGlzLmNsaWVudElkLCBzY29wZXMsIFJlc3BvbnNlVHlwZXMuaWRfdG9rZW5fdG9rZW4sIHRoaXMuZ2V0UmVkaXJlY3RVcmkoKSwgdGhpcy5fc3RhdGUpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubm9uY2VJZFRva2VuLCBhdXRoZW50aWNhdGlvblJlcXVlc3Qubm9uY2UsIHRoaXMuc3RvcmVBdXRoU3RhdGVJbkNvb2tpZSk7XG4gICAgICB2YXIgYWNxdWlyZVRva2VuVXNlcktleTtcbiAgICAgIGlmICh1c2VyT2JqZWN0KSB7XG4gICAgICAgICAgIGFjcXVpcmVUb2tlblVzZXJLZXkgPSBDb25zdGFudHMuYWNxdWlyZVRva2VuVXNlciArIENvbnN0YW50cy5yZXNvdXJjZURlbGltZXRlciArIHVzZXJPYmplY3QudXNlcklkZW50aWZpZXIgKyBDb25zdGFudHMucmVzb3VyY2VEZWxpbWV0ZXIgKyBhdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGU7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgICBhY3F1aXJlVG9rZW5Vc2VyS2V5ID0gQ29uc3RhbnRzLmFjcXVpcmVUb2tlblVzZXIgKyBDb25zdGFudHMucmVzb3VyY2VEZWxpbWV0ZXIgICsgQ29uc3RhbnRzLm5vX3VzZXIgKyBDb25zdGFudHMucmVzb3VyY2VEZWxpbWV0ZXIgKyBhdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGU7XG4gICAgICB9XG5cbiAgICAgICAgdGhpcy5fY2FjaGVTdG9yYWdlLnNldEl0ZW0oYWNxdWlyZVRva2VuVXNlcktleSwgSlNPTi5zdHJpbmdpZnkodXNlck9iamVjdCkpO1xuICAgICAgICBjb25zdCBhdXRob3JpdHlLZXkgPSBDb25zdGFudHMuYXV0aG9yaXR5ICsgQ29uc3RhbnRzLnJlc291cmNlRGVsaW1ldGVyICsgYXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlO1xuICAgICAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShhdXRob3JpdHlLZXksIGFjcXVpcmVUb2tlbkF1dGhvcml0eS5DYW5vbmljYWxBdXRob3JpdHksIHRoaXMuc3RvcmVBdXRoU3RhdGVJbkNvb2tpZSk7XG4gICAgICBpZiAoZXh0cmFRdWVyeVBhcmFtZXRlcnMpIHtcbiAgICAgICAgYXV0aGVudGljYXRpb25SZXF1ZXN0LmV4dHJhUXVlcnlQYXJhbWV0ZXJzID0gZXh0cmFRdWVyeVBhcmFtZXRlcnM7XG4gICAgICB9XG5cbiAgICAgIGxldCB1cmxOYXZpZ2F0ZSA9IGF1dGhlbnRpY2F0aW9uUmVxdWVzdC5jcmVhdGVOYXZpZ2F0ZVVybChzY29wZXMpICAgKyBDb25zdGFudHMucmVzcG9uc2VfbW9kZV9mcmFnbWVudDtcbiAgICAgIHVybE5hdmlnYXRlID0gdGhpcy5hZGRIaW50UGFyYW1ldGVycyh1cmxOYXZpZ2F0ZSwgdXNlck9iamVjdCk7XG4gICAgICBpZiAodXJsTmF2aWdhdGUpIHtcbiAgICAgICAgdGhpcy5fY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLnN0YXRlQWNxdWlyZVRva2VuLCBhdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGUsIHRoaXMuc3RvcmVBdXRoU3RhdGVJbkNvb2tpZSk7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKHVybE5hdmlnYXRlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIGFjcXVpcmUgYW4gYWNjZXNzIHRva2VuIGZvciBhIG5ldyB1c2VyIHVzaW5nIGludGVyYWN0aXZlIGF1dGhlbnRpY2F0aW9uIHZpYSBhIHBvcHVwIFdpbmRvdy5cbiAgICogVG8gcmVxdWVzdCBhbiBpZF90b2tlbiwgcGFzcyB0aGUgY2xpZW50SWQgYXMgdGhlIG9ubHkgc2NvcGUgaW4gdGhlIHNjb3BlcyBhcnJheS5cbiAgICogQHBhcmFtIHtBcnJheTxzdHJpbmc+fSBzY29wZXMgLSBQZXJtaXNzaW9ucyB5b3Ugd2FudCBpbmNsdWRlZCBpbiB0aGUgYWNjZXNzIHRva2VuLiBOb3QgYWxsIHNjb3BlcyBhcmUgIGd1YXJhbnRlZWQgdG8gYmUgaW5jbHVkZWQgaW4gdGhlIGFjY2VzcyB0b2tlbi4gU2NvcGVzIGxpa2UgXCJvcGVuaWRcIiBhbmQgXCJwcm9maWxlXCIgYXJlIHNlbnQgd2l0aCBldmVyeSByZXF1ZXN0LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gYXV0aG9yaXR5IC0gQSBVUkwgaW5kaWNhdGluZyBhIGRpcmVjdG9yeSB0aGF0IE1TQUwgY2FuIHVzZSB0byBvYnRhaW4gdG9rZW5zLlxuICAgKiAtIEluIEF6dXJlIEFELCBpdCBpcyBvZiB0aGUgZm9ybSBodHRwczovLyZsdDt0ZW5hbnQmZ3Q7LyZsdDt0ZW5hbnQmZ3Q7LCB3aGVyZSAmbHQ7dGVuYW50Jmd0OyBpcyB0aGUgZGlyZWN0b3J5IGhvc3QgKGUuZy4gaHR0cHM6Ly9sb2dpbi5taWNyb3NvZnRvbmxpbmUuY29tKSBhbmQgJmx0O3RlbmFudCZndDsgaXMgYSBpZGVudGlmaWVyIHdpdGhpbiB0aGUgZGlyZWN0b3J5IGl0c2VsZiAoZS5nLiBhIGRvbWFpbiBhc3NvY2lhdGVkIHRvIHRoZSB0ZW5hbnQsIHN1Y2ggYXMgY29udG9zby5vbm1pY3Jvc29mdC5jb20sIG9yIHRoZSBHVUlEIHJlcHJlc2VudGluZyB0aGUgVGVuYW50SUQgcHJvcGVydHkgb2YgdGhlIGRpcmVjdG9yeSlcbiAgICogLSBJbiBBenVyZSBCMkMsIGl0IGlzIG9mIHRoZSBmb3JtIGh0dHBzOi8vJmx0O2luc3RhbmNlJmd0Oy90ZnAvJmx0O3RlbmFudCZndDsvPHBvbGljeU5hbWU+L1xuICAgKiAtIERlZmF1bHQgdmFsdWUgaXM6IFwiaHR0cHM6Ly9sb2dpbi5taWNyb3NvZnRvbmxpbmUuY29tL2NvbW1vblwiLlxuICAgKiBAcGFyYW0ge1VzZXJ9IHVzZXIgLSBUaGUgdXNlciBmb3Igd2hpY2ggdGhlIHNjb3BlcyBhcmUgcmVxdWVzdGVkLlRoZSBkZWZhdWx0IHVzZXIgaXMgdGhlIGxvZ2dlZCBpbiB1c2VyLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXh0cmFRdWVyeVBhcmFtZXRlcnMgLSBLZXktdmFsdWUgcGFpcnMgdG8gcGFzcyB0byB0aGUgU1RTIGR1cmluZyB0aGUgIGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlLjxzdHJpbmc+fSAtIEEgUHJvbWlzZSB0aGF0IGlzIGZ1bGZpbGxlZCB3aGVuIHRoaXMgZnVuY3Rpb24gaGFzIGNvbXBsZXRlZCwgb3IgcmVqZWN0ZWQgaWYgYW4gZXJyb3Igd2FzIHJhaXNlZC4gUmV0dXJucyB0aGUgdG9rZW4gb3IgZXJyb3IuXG4gICAqL1xuICBhY3F1aXJlVG9rZW5Qb3B1cChzY29wZXM6IEFycmF5PHN0cmluZz4pOiBQcm9taXNlPHN0cmluZz47XG4gIGFjcXVpcmVUb2tlblBvcHVwKHNjb3BlczogQXJyYXk8c3RyaW5nPiwgYXV0aG9yaXR5OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz47XG4gIGFjcXVpcmVUb2tlblBvcHVwKHNjb3BlczogQXJyYXk8c3RyaW5nPiwgYXV0aG9yaXR5OiBzdHJpbmcsIHVzZXI6IFVzZXIpOiBQcm9taXNlPHN0cmluZz47XG4gIGFjcXVpcmVUb2tlblBvcHVwKHNjb3BlczogQXJyYXk8c3RyaW5nPiwgYXV0aG9yaXR5OiBzdHJpbmcsIHVzZXI6IFVzZXIsIGV4dHJhUXVlcnlQYXJhbWV0ZXJzOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz47XG4gIGFjcXVpcmVUb2tlblBvcHVwKHNjb3BlczogQXJyYXk8c3RyaW5nPiwgYXV0aG9yaXR5Pzogc3RyaW5nLCB1c2VyPzogVXNlciwgZXh0cmFRdWVyeVBhcmFtZXRlcnM/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IGlzVmFsaWRTY29wZSA9IHRoaXMudmFsaWRhdGVJbnB1dFNjb3BlKHNjb3Blcyk7XG4gICAgICBpZiAoaXNWYWxpZFNjb3BlICYmICFVdGlscy5pc0VtcHR5KGlzVmFsaWRTY29wZSkpIHtcbiAgICAgICAgcmVqZWN0KEVycm9yQ29kZXMuaW5wdXRTY29wZXNFcnJvciArIENvbnN0YW50cy5yZXNvdXJjZURlbGltZXRlciArIGlzVmFsaWRTY29wZSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChzY29wZXMpIHtcbiAgICAgICAgc2NvcGVzID0gdGhpcy5maWx0ZXJTY29wZXMoc2NvcGVzKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdXNlck9iamVjdCA9IHVzZXIgPyB1c2VyIDogdGhpcy5nZXRVc2VyKCk7XG4gICAgICBpZiAodGhpcy5fYWNxdWlyZVRva2VuSW5Qcm9ncmVzcykge1xuICAgICAgICByZWplY3QoRXJyb3JDb2Rlcy5hY3F1aXJlVG9rZW5Qcm9ncmVzc0Vycm9yICsgQ29uc3RhbnRzLnJlc291cmNlRGVsaW1ldGVyICsgRXJyb3JEZXNjcmlwdGlvbi5hY3F1aXJlVG9rZW5Qcm9ncmVzc0Vycm9yKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzY29wZSA9IHNjb3Blcy5qb2luKFwiIFwiKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAvL2lmIHVzZXIgaXMgbm90IGN1cnJlbnRseSBsb2dnZWQgaW4gYW5kIG5vIGxvZ2luX2hpbnQgaXMgcGFzc2VkXG4gICAgICAgIGlmICghdXNlck9iamVjdCAmJiAhKGV4dHJhUXVlcnlQYXJhbWV0ZXJzICYmIChleHRyYVF1ZXJ5UGFyYW1ldGVycy5pbmRleE9mKENvbnN0YW50cy5sb2dpbl9oaW50KSAhPT0gLTEpKSkge1xuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmluZm8oXCJVc2VyIGxvZ2luIGlzIHJlcXVpcmVkXCIpO1xuICAgICAgICAgICAgcmVqZWN0KEVycm9yQ29kZXMudXNlckxvZ2luRXJyb3IgKyBDb25zdGFudHMucmVzb3VyY2VEZWxpbWV0ZXIgKyBFcnJvckRlc2NyaXB0aW9uLnVzZXJMb2dpbkVycm9yKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICB0aGlzLl9hY3F1aXJlVG9rZW5JblByb2dyZXNzID0gdHJ1ZTtcbiAgICAgIGxldCBhdXRoZW50aWNhdGlvblJlcXVlc3Q6IEF1dGhlbnRpY2F0aW9uUmVxdWVzdFBhcmFtZXRlcnM7XG4gICAgICBsZXQgYWNxdWlyZVRva2VuQXV0aG9yaXR5ID0gYXV0aG9yaXR5ID8gQXV0aG9yaXR5RmFjdG9yeS5DcmVhdGVJbnN0YW5jZShhdXRob3JpdHksIHRoaXMudmFsaWRhdGVBdXRob3JpdHkpIDogdGhpcy5hdXRob3JpdHlJbnN0YW5jZTtcbiAgICAgIHZhciBwb3BVcFdpbmRvdyA9IHRoaXMub3BlbldpbmRvdyhcImFib3V0OmJsYW5rXCIsIFwiX2JsYW5rXCIsIDEsIHRoaXMsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICBpZiAoIXBvcFVwV2luZG93KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgYWNxdWlyZVRva2VuQXV0aG9yaXR5LlJlc29sdmVFbmRwb2ludHNBc3luYygpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIGlmIChVdGlscy5jb21wYXJlT2JqZWN0cyh1c2VyT2JqZWN0LCB0aGlzLmdldFVzZXIoKSkpIHtcbiAgICAgICAgICBpZiAoc2NvcGVzLmluZGV4T2YodGhpcy5jbGllbnRJZCkgPiAtMSkge1xuICAgICAgICAgICAgYXV0aGVudGljYXRpb25SZXF1ZXN0ID0gbmV3IEF1dGhlbnRpY2F0aW9uUmVxdWVzdFBhcmFtZXRlcnMoYWNxdWlyZVRva2VuQXV0aG9yaXR5LCB0aGlzLmNsaWVudElkLCBzY29wZXMsIFJlc3BvbnNlVHlwZXMuaWRfdG9rZW4sIHRoaXMuZ2V0UmVkaXJlY3RVcmkoKSwgdGhpcy5fc3RhdGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0aW9uUmVxdWVzdCA9IG5ldyBBdXRoZW50aWNhdGlvblJlcXVlc3RQYXJhbWV0ZXJzKGFjcXVpcmVUb2tlbkF1dGhvcml0eSwgdGhpcy5jbGllbnRJZCwgc2NvcGVzLCBSZXNwb25zZVR5cGVzLnRva2VuLCB0aGlzLmdldFJlZGlyZWN0VXJpKCksIHRoaXMuX3N0YXRlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXV0aGVudGljYXRpb25SZXF1ZXN0ID0gbmV3IEF1dGhlbnRpY2F0aW9uUmVxdWVzdFBhcmFtZXRlcnMoYWNxdWlyZVRva2VuQXV0aG9yaXR5LCB0aGlzLmNsaWVudElkLCBzY29wZXMsIFJlc3BvbnNlVHlwZXMuaWRfdG9rZW5fdG9rZW4sIHRoaXMuZ2V0UmVkaXJlY3RVcmkoKSwgdGhpcy5fc3RhdGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLm5vbmNlSWRUb2tlbiwgYXV0aGVudGljYXRpb25SZXF1ZXN0Lm5vbmNlKTtcbiAgICAgICAgYXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlID0gYXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlO1xuICAgICAgICB2YXIgYWNxdWlyZVRva2VuVXNlcktleTtcbiAgICAgICAgaWYgKHVzZXJPYmplY3QpIHtcbiAgICAgICAgICAgIGFjcXVpcmVUb2tlblVzZXJLZXkgPSBDb25zdGFudHMuYWNxdWlyZVRva2VuVXNlciArIENvbnN0YW50cy5yZXNvdXJjZURlbGltZXRlciArIHVzZXJPYmplY3QudXNlcklkZW50aWZpZXIgKyBDb25zdGFudHMucmVzb3VyY2VEZWxpbWV0ZXIgKyBhdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhY3F1aXJlVG9rZW5Vc2VyS2V5ID0gQ29uc3RhbnRzLmFjcXVpcmVUb2tlblVzZXIgKyBDb25zdGFudHMucmVzb3VyY2VEZWxpbWV0ZXIgICsgQ29uc3RhbnRzLm5vX3VzZXIgKyBDb25zdGFudHMucmVzb3VyY2VEZWxpbWV0ZXIgKyBhdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGU7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShhY3F1aXJlVG9rZW5Vc2VyS2V5LCBKU09OLnN0cmluZ2lmeSh1c2VyT2JqZWN0KSk7XG4gICAgICAgIGNvbnN0IGF1dGhvcml0eUtleSA9IENvbnN0YW50cy5hdXRob3JpdHkgKyBDb25zdGFudHMucmVzb3VyY2VEZWxpbWV0ZXIgKyBhdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGU7XG4gICAgICAgIHRoaXMuX2NhY2hlU3RvcmFnZS5zZXRJdGVtKGF1dGhvcml0eUtleSwgYWNxdWlyZVRva2VuQXV0aG9yaXR5LkNhbm9uaWNhbEF1dGhvcml0eSwgdGhpcy5zdG9yZUF1dGhTdGF0ZUluQ29va2llKTtcblxuICAgICAgICBpZiAoZXh0cmFRdWVyeVBhcmFtZXRlcnMpIHtcbiAgICAgICAgICBhdXRoZW50aWNhdGlvblJlcXVlc3QuZXh0cmFRdWVyeVBhcmFtZXRlcnMgPSBleHRyYVF1ZXJ5UGFyYW1ldGVycztcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB1cmxOYXZpZ2F0ZSA9IGF1dGhlbnRpY2F0aW9uUmVxdWVzdC5jcmVhdGVOYXZpZ2F0ZVVybChzY29wZXMpICsgQ29uc3RhbnRzLnJlc3BvbnNlX21vZGVfZnJhZ21lbnQ7XG4gICAgICAgIHVybE5hdmlnYXRlID0gdGhpcy5hZGRIaW50UGFyYW1ldGVycyh1cmxOYXZpZ2F0ZSwgdXNlck9iamVjdCk7XG4gICAgICAgIHdpbmRvdy5yZW5ld1N0YXRlcy5wdXNoKGF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSk7XG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0VHlwZSA9IENvbnN0YW50cy5yZW5ld1Rva2VuO1xuICAgICAgICB0aGlzLnJlZ2lzdGVyQ2FsbGJhY2soYXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlLCBzY29wZSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgaWYgKHBvcFVwV2luZG93KSB7XG4gICAgICAgICAgcG9wVXBXaW5kb3cubG9jYXRpb24uaHJlZiA9IHVybE5hdmlnYXRlO1xuICAgICAgICB9XG5cbiAgICAgIH0sICgpID0+IHtcbiAgICAgICAgdGhpcy5fbG9nZ2VyLmluZm8oRXJyb3JDb2Rlcy5lbmRwb2ludFJlc29sdXRpb25FcnJvciArIFwiOlwiICsgRXJyb3JEZXNjcmlwdGlvbi5lbmRwb2ludFJlc29sdXRpb25FcnJvcik7XG4gICAgICAgIHRoaXMuX2NhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsRXJyb3IsIEVycm9yQ29kZXMuZW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IpO1xuICAgICAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbEVycm9yRGVzY3JpcHRpb24sIEVycm9yRGVzY3JpcHRpb24uZW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IpO1xuICAgICAgICBpZiAocmVqZWN0KSB7XG4gICAgICAgICAgcmVqZWN0KEVycm9yQ29kZXMuZW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IgKyBDb25zdGFudHMucmVzb3VyY2VEZWxpbWV0ZXIgKyBFcnJvckRlc2NyaXB0aW9uLmVuZHBvaW50UmVzb2x1dGlvbkVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocG9wVXBXaW5kb3cpIHtcbiAgICAgICAgICAgIHBvcFVwV2luZG93LmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIud2FybmluZyhcImNvdWxkIG5vdCByZXNvbHZlIGVuZHBvaW50c1wiKTtcbiAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gZ2V0IHRoZSB0b2tlbiBmcm9tIGNhY2hlLlxuICAgKiBNU0FMIHdpbGwgcmV0dXJuIHRoZSBjYWNoZWQgdG9rZW4gaWYgaXQgaXMgbm90IGV4cGlyZWQuXG4gICAqIE9yIGl0IHdpbGwgc2VuZCBhIHJlcXVlc3QgdG8gdGhlIFNUUyB0byBvYnRhaW4gYW4gYWNjZXNzX3Rva2VuIHVzaW5nIGEgaGlkZGVuIGlmcmFtZS4gVG8gcmVuZXcgaWRUb2tlbiwgY2xpZW50SWQgc2hvdWxkIGJlIHBhc3NlZCBhcyB0aGUgb25seSBzY29wZSBpbiB0aGUgc2NvcGVzIGFycmF5LlxuICAgKiBAcGFyYW0ge0FycmF5PHN0cmluZz59IHNjb3BlcyAtIFBlcm1pc3Npb25zIHlvdSB3YW50IGluY2x1ZGVkIGluIHRoZSBhY2Nlc3MgdG9rZW4uIE5vdCBhbGwgc2NvcGVzIGFyZSAgZ3VhcmFudGVlZCB0byBiZSBpbmNsdWRlZCBpbiB0aGUgYWNjZXNzIHRva2VuLiBTY29wZXMgbGlrZSBcIm9wZW5pZFwiIGFuZCBcInByb2ZpbGVcIiBhcmUgc2VudCB3aXRoIGV2ZXJ5IHJlcXVlc3QuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhdXRob3JpdHkgLSBBIFVSTCBpbmRpY2F0aW5nIGEgZGlyZWN0b3J5IHRoYXQgTVNBTCBjYW4gdXNlIHRvIG9idGFpbiB0b2tlbnMuXG4gICAqIC0gSW4gQXp1cmUgQUQsIGl0IGlzIG9mIHRoZSBmb3JtIGh0dHBzOi8vJmx0O3RlbmFudCZndDsvJmx0O3RlbmFudCZndDssIHdoZXJlICZsdDt0ZW5hbnQmZ3Q7IGlzIHRoZSBkaXJlY3RvcnkgaG9zdCAoZS5nLiBodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20pIGFuZCAmbHQ7dGVuYW50Jmd0OyBpcyBhIGlkZW50aWZpZXIgd2l0aGluIHRoZSBkaXJlY3RvcnkgaXRzZWxmIChlLmcuIGEgZG9tYWluIGFzc29jaWF0ZWQgdG8gdGhlIHRlbmFudCwgc3VjaCBhcyBjb250b3NvLm9ubWljcm9zb2Z0LmNvbSwgb3IgdGhlIEdVSUQgcmVwcmVzZW50aW5nIHRoZSBUZW5hbnRJRCBwcm9wZXJ0eSBvZiB0aGUgZGlyZWN0b3J5KVxuICAgKiAtIEluIEF6dXJlIEIyQywgaXQgaXMgb2YgdGhlIGZvcm0gaHR0cHM6Ly8mbHQ7aW5zdGFuY2UmZ3Q7L3RmcC8mbHQ7dGVuYW50Jmd0Oy88cG9saWN5TmFtZT4vXG4gICAqIC0gRGVmYXVsdCB2YWx1ZSBpczogXCJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vY29tbW9uXCJcbiAgICogQHBhcmFtIHtVc2VyfSB1c2VyIC0gVGhlIHVzZXIgZm9yIHdoaWNoIHRoZSBzY29wZXMgYXJlIHJlcXVlc3RlZC5UaGUgZGVmYXVsdCB1c2VyIGlzIHRoZSBsb2dnZWQgaW4gdXNlci5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGV4dHJhUXVlcnlQYXJhbWV0ZXJzIC0gS2V5LXZhbHVlIHBhaXJzIHRvIHBhc3MgdG8gdGhlIFNUUyBkdXJpbmcgdGhlICBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZS48c3RyaW5nPn0gLSBBIFByb21pc2UgdGhhdCBpcyBmdWxmaWxsZWQgd2hlbiB0aGlzIGZ1bmN0aW9uIGhhcyBjb21wbGV0ZWQsIG9yIHJlamVjdGVkIGlmIGFuIGVycm9yIHdhcyByYWlzZWQuIFJlc29sdmVkIHdpdGggdG9rZW4gb3IgcmVqZWN0ZWQgd2l0aCBlcnJvci5cbiAgICovXG4gIEByZXNvbHZlVG9rZW5Pbmx5SWZPdXRPZklmcmFtZVxuICBhY3F1aXJlVG9rZW5TaWxlbnQoc2NvcGVzOiBBcnJheTxzdHJpbmc+LCBhdXRob3JpdHk/OiBzdHJpbmcsIHVzZXI/OiBVc2VyLCBleHRyYVF1ZXJ5UGFyYW1ldGVycz86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgaXNWYWxpZFNjb3BlID0gdGhpcy52YWxpZGF0ZUlucHV0U2NvcGUoc2NvcGVzKTtcbiAgICAgIGlmIChpc1ZhbGlkU2NvcGUgJiYgIVV0aWxzLmlzRW1wdHkoaXNWYWxpZFNjb3BlKSkge1xuICAgICAgICByZWplY3QoRXJyb3JDb2Rlcy5pbnB1dFNjb3Blc0Vycm9yICsgXCJ8XCIgKyBpc1ZhbGlkU2NvcGUpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChzY29wZXMpIHtcbiAgICAgICAgICBzY29wZXMgPSB0aGlzLmZpbHRlclNjb3BlcyhzY29wZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2NvcGUgPSBzY29wZXMuam9pbihcIiBcIikudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgY29uc3QgdXNlck9iamVjdCA9IHVzZXIgPyB1c2VyIDogdGhpcy5nZXRVc2VyKCk7XG4gICAgICAgIGNvbnN0IGFkYWxJZFRva2VuID0gdGhpcy5fY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLmFkYWxJZFRva2VuKTtcbiAgICAgICAgLy9pZiB1c2VyIGlzIG5vdCBjdXJyZW50bHkgbG9nZ2VkIGluIGFuZCBubyBsb2dpbl9oaW50L3NpZCBpcyBwYXNzZWQgYXMgYW4gZXh0cmFRdWVyeVBhcmFtYXRlclxuICAgICAgICAgIGlmICghdXNlck9iamVjdCAmJiBVdGlscy5jaGVja1NTTyhleHRyYVF1ZXJ5UGFyYW1ldGVycykgJiYgVXRpbHMuaXNFbXB0eShhZGFsSWRUb2tlbikgKSB7XG4gICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5pbmZvKFwiVXNlciBsb2dpbiBpcyByZXF1aXJlZFwiKTtcbiAgICAgICAgICAgICAgcmVqZWN0KEVycm9yQ29kZXMudXNlckxvZ2luRXJyb3IgKyBDb25zdGFudHMucmVzb3VyY2VEZWxpbWV0ZXIgKyBFcnJvckRlc2NyaXB0aW9uLnVzZXJMb2dpbkVycm9yKTtcbiAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vaWYgdXNlciBkaWRuJ3QgcGFzc2VzIHRoZSBsb2dpbl9oaW50IGFuZCBhZGFsJ3MgaWR0b2tlbiBpcyBwcmVzZW50IGFuZCBubyB1c2Vyb2JqZWN0LCB1c2UgdGhlIGxvZ2luX2hpbnQgZnJvbSBhZGFsJ3MgaWRUb2tlblxuICAgICAgICAgIGVsc2UgaWYgKCF1c2VyT2JqZWN0ICYmICFVdGlscy5pc0VtcHR5KGFkYWxJZFRva2VuKSkge1xuICAgICAgICAgICAgICBjb25zdCBpZFRva2VuT2JqZWN0ID0gVXRpbHMuZXh0cmFjdElkVG9rZW4oYWRhbElkVG9rZW4pO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkFEQUwncyBpZFRva2VuIGV4aXN0cy4gRXh0cmFjdGluZyBsb2dpbiBpbmZvcm1hdGlvbiBmcm9tIEFEQUwncyBpZFRva2VuIFwiKTtcbiAgICAgICAgICAgICAgZXh0cmFRdWVyeVBhcmFtZXRlcnMgPSBVdGlscy5jb25zdHJ1Y3RVbmlmaWVkQ2FjaGVFeHRyYVF1ZXJ5UGFyYW1ldGVyKGlkVG9rZW5PYmplY3QsIGV4dHJhUXVlcnlQYXJhbWV0ZXJzKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgYXV0aGVudGljYXRpb25SZXF1ZXN0OiBBdXRoZW50aWNhdGlvblJlcXVlc3RQYXJhbWV0ZXJzO1xuICAgICAgICBpZiAoVXRpbHMuY29tcGFyZU9iamVjdHModXNlck9iamVjdCwgdGhpcy5nZXRVc2VyKCkpKSB7XG4gICAgICAgICAgaWYgKHNjb3Blcy5pbmRleE9mKHRoaXMuY2xpZW50SWQpID4gLTEpIHtcbiAgICAgICAgICAgICAgYXV0aGVudGljYXRpb25SZXF1ZXN0ID0gbmV3IEF1dGhlbnRpY2F0aW9uUmVxdWVzdFBhcmFtZXRlcnMoQXV0aG9yaXR5RmFjdG9yeS5DcmVhdGVJbnN0YW5jZShhdXRob3JpdHksIHRoaXMudmFsaWRhdGVBdXRob3JpdHkpLCB0aGlzLmNsaWVudElkLCBzY29wZXMsIFJlc3BvbnNlVHlwZXMuaWRfdG9rZW4sIHRoaXMuZ2V0UmVkaXJlY3RVcmkoKSwgdGhpcy5fc3RhdGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgYXV0aGVudGljYXRpb25SZXF1ZXN0ID0gbmV3IEF1dGhlbnRpY2F0aW9uUmVxdWVzdFBhcmFtZXRlcnMoQXV0aG9yaXR5RmFjdG9yeS5DcmVhdGVJbnN0YW5jZShhdXRob3JpdHksIHRoaXMudmFsaWRhdGVBdXRob3JpdHkpLCB0aGlzLmNsaWVudElkLCBzY29wZXMsIFJlc3BvbnNlVHlwZXMudG9rZW4sIHRoaXMuZ2V0UmVkaXJlY3RVcmkoKSwgdGhpcy5fc3RhdGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChzY29wZXMuaW5kZXhPZih0aGlzLmNsaWVudElkKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgYXV0aGVudGljYXRpb25SZXF1ZXN0ID0gbmV3IEF1dGhlbnRpY2F0aW9uUmVxdWVzdFBhcmFtZXRlcnMoQXV0aG9yaXR5RmFjdG9yeS5DcmVhdGVJbnN0YW5jZShhdXRob3JpdHksIHRoaXMudmFsaWRhdGVBdXRob3JpdHkpLCB0aGlzLmNsaWVudElkLCBzY29wZXMsIFJlc3BvbnNlVHlwZXMuaWRfdG9rZW4sIHRoaXMuZ2V0UmVkaXJlY3RVcmkoKSwgdGhpcy5fc3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgYXV0aGVudGljYXRpb25SZXF1ZXN0ID0gbmV3IEF1dGhlbnRpY2F0aW9uUmVxdWVzdFBhcmFtZXRlcnMoQXV0aG9yaXR5RmFjdG9yeS5DcmVhdGVJbnN0YW5jZShhdXRob3JpdHksIHRoaXMudmFsaWRhdGVBdXRob3JpdHkpLCB0aGlzLmNsaWVudElkLCBzY29wZXMsIFJlc3BvbnNlVHlwZXMuaWRfdG9rZW5fdG9rZW4sIHRoaXMuZ2V0UmVkaXJlY3RVcmkoKSwgdGhpcy5fc3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2FjaGVSZXN1bHQgPSB0aGlzLmdldENhY2hlZFRva2VuKGF1dGhlbnRpY2F0aW9uUmVxdWVzdCwgdXNlck9iamVjdCk7XG4gICAgICAgIGlmIChjYWNoZVJlc3VsdCkge1xuICAgICAgICAgIGlmIChjYWNoZVJlc3VsdC50b2tlbikge1xuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmluZm8oXCJUb2tlbiBpcyBhbHJlYWR5IGluIGNhY2hlIGZvciBzY29wZTpcIiArIHNjb3BlKTtcbiAgICAgICAgICAgIHJlc29sdmUoY2FjaGVSZXN1bHQudG9rZW4pO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKGNhY2hlUmVzdWx0LmVycm9yRGVzYyB8fCBjYWNoZVJlc3VsdC5lcnJvcikge1xuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmluZm9QaWkoY2FjaGVSZXN1bHQuZXJyb3JEZXNjICsgXCI6XCIgKyBjYWNoZVJlc3VsdC5lcnJvcik7XG4gICAgICAgICAgICByZWplY3QoY2FjaGVSZXN1bHQuZXJyb3JEZXNjICsgQ29uc3RhbnRzLnJlc291cmNlRGVsaW1ldGVyICsgY2FjaGVSZXN1bHQuZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLnZlcmJvc2UoXCJUb2tlbiBpcyBub3QgaW4gY2FjaGUgZm9yIHNjb3BlOlwiICsgc2NvcGUpO1xuICAgICAgICAgIH1cblxuICAgICAgICBpZiAoIWF1dGhlbnRpY2F0aW9uUmVxdWVzdC5hdXRob3JpdHlJbnN0YW5jZSkgey8vQ2FjaGUgcmVzdWx0IGNhbiByZXR1cm4gbnVsbCBpZiBjYWNoZSBpcyBlbXB0eS4gSW4gdGhhdCBjYXNlLCBzZXQgYXV0aG9yaXR5IHRvIGRlZmF1bHQgdmFsdWUgaWYgbm8gYXV0aG9yaXR5IGlzIHBhc3NlZCB0byB0aGUgYXBpLlxuICAgICAgICAgICAgYXV0aGVudGljYXRpb25SZXF1ZXN0LmF1dGhvcml0eUluc3RhbmNlID0gYXV0aG9yaXR5ID8gQXV0aG9yaXR5RmFjdG9yeS5DcmVhdGVJbnN0YW5jZShhdXRob3JpdHksIHRoaXMudmFsaWRhdGVBdXRob3JpdHkpIDogdGhpcy5hdXRob3JpdHlJbnN0YW5jZTtcbiAgICAgICAgfVxuICAgICAgICAgIC8vIGNhY2hlIG1pc3NcbiAgICAgICAgICByZXR1cm4gYXV0aGVudGljYXRpb25SZXF1ZXN0LmF1dGhvcml0eUluc3RhbmNlLlJlc29sdmVFbmRwb2ludHNBc3luYygpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgLy8gcmVmcmVzaCBhdHRlcHQgd2l0aCBpZnJhbWVcbiAgICAgICAgICAgIC8vQWxyZWFkeSByZW5ld2luZyBmb3IgdGhpcyBzY29wZSwgY2FsbGJhY2sgd2hlbiB3ZSBnZXQgdGhlIHRva2VuLlxuICAgICAgICAgICAgICBpZiAod2luZG93LmFjdGl2ZVJlbmV3YWxzW3Njb3BlXSkge1xuICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIudmVyYm9zZShcIlJlbmV3IHRva2VuIGZvciBzY29wZTogXCIgKyBzY29wZSArIFwiIGlzIGluIHByb2dyZXNzLiBSZWdpc3RlcmluZyBjYWxsYmFja1wiKTtcbiAgICAgICAgICAgICAgLy9BY3RpdmUgcmVuZXdhbHMgY29udGFpbnMgdGhlIHN0YXRlIGZvciBlYWNoIHJlbmV3YWwuXG4gICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJDYWxsYmFjayh3aW5kb3cuYWN0aXZlUmVuZXdhbHNbc2NvcGVdLCBzY29wZSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBpZiAoc2NvcGVzICYmIHNjb3Blcy5pbmRleE9mKHRoaXMuY2xpZW50SWQpID4gLTEgJiYgc2NvcGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIC8vIEFwcCB1c2VzIGlkVG9rZW4gdG8gc2VuZCB0byBhcGkgZW5kcG9pbnRzXG4gICAgICAgICAgICAgICAgLy8gRGVmYXVsdCBzY29wZSBpcyB0cmFja2VkIGFzIGNsaWVudElkIHRvIHN0b3JlIHRoaXMgdG9rZW5cbiAgICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIudmVyYm9zZShcInJlbmV3aW5nIGlkVG9rZW5cIik7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5ld0lkVG9rZW4oc2NvcGVzLCByZXNvbHZlLCByZWplY3QsIHVzZXJPYmplY3QsIGF1dGhlbnRpY2F0aW9uUmVxdWVzdCwgZXh0cmFRdWVyeVBhcmFtZXRlcnMpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci52ZXJib3NlKFwicmVuZXdpbmcgYWNjZXNzdG9rZW5cIik7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5ld1Rva2VuKHNjb3BlcywgcmVzb2x2ZSwgcmVqZWN0LCB1c2VyT2JqZWN0LCBhdXRoZW50aWNhdGlvblJlcXVlc3QsIGV4dHJhUXVlcnlQYXJhbWV0ZXJzKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2xvZ2dlci53YXJuaW5nKFwiY291bGQgbm90IHJlc29sdmUgZW5kcG9pbnRzXCIpO1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICAgcHJpdmF0ZSBleHRyYWN0QURBTElkVG9rZW4oKTogYW55IHtcbiAgICAgICAgY29uc3QgYWRhbElkVG9rZW4gPSB0aGlzLl9jYWNoZVN0b3JhZ2UuZ2V0SXRlbShDb25zdGFudHMuYWRhbElkVG9rZW4pO1xuICAgICAgICBpZiAoIVV0aWxzLmlzRW1wdHkoYWRhbElkVG9rZW4pKSB7XG4gICAgICAgICAgICByZXR1cm4gVXRpbHMuZXh0cmFjdElkVG9rZW4oYWRhbElkVG9rZW4pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAvKipcbiAgICogQ2FsbGluZyBfbG9hZEZyYW1lIGJ1dCB3aXRoIGEgdGltZW91dCB0byBzaWduYWwgZmFpbHVyZSBpbiBsb2FkZnJhbWVTdGF0dXMuIENhbGxiYWNrcyBhcmUgbGVmdC5cbiAgICogcmVnaXN0ZXJlZCB3aGVuIG5ldHdvcmsgZXJyb3JzIG9jY3VyIGFuZCBzdWJzZXF1ZW50IHRva2VuIHJlcXVlc3RzIGZvciBzYW1lIHJlc291cmNlIGFyZSByZWdpc3RlcmVkIHRvIHRoZSBwZW5kaW5nIHJlcXVlc3QuXG4gICAqIEBpZ25vcmVcbiAgICogQGhpZGRlblxuICAgKi9cbiAgcHJpdmF0ZSBsb2FkSWZyYW1lVGltZW91dCh1cmxOYXZpZ2F0ZTogc3RyaW5nLCBmcmFtZU5hbWU6IHN0cmluZywgc2NvcGU6IHN0cmluZyk6IHZvaWQge1xuICAgIC8vc2V0IGlmcmFtZSBzZXNzaW9uIHRvIHBlbmRpbmdcbiAgICAgIGNvbnN0IGV4cGVjdGVkU3RhdGUgPSB3aW5kb3cuYWN0aXZlUmVuZXdhbHNbc2NvcGVdO1xuICAgICAgdGhpcy5fbG9nZ2VyLnZlcmJvc2UoXCJTZXQgbG9hZGluZyBzdGF0ZSB0byBwZW5kaW5nIGZvcjogXCIgKyBzY29wZSArIFwiOlwiICsgZXhwZWN0ZWRTdGF0ZSk7XG4gICAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMucmVuZXdTdGF0dXMgKyBleHBlY3RlZFN0YXRlLCBDb25zdGFudHMudG9rZW5SZW5ld1N0YXR1c0luUHJvZ3Jlc3MpO1xuICAgIHRoaXMubG9hZEZyYW1lKHVybE5hdmlnYXRlLCBmcmFtZU5hbWUpO1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuX2NhY2hlU3RvcmFnZS5nZXRJdGVtKENvbnN0YW50cy5yZW5ld1N0YXR1cyArIGV4cGVjdGVkU3RhdGUpID09PSBDb25zdGFudHMudG9rZW5SZW5ld1N0YXR1c0luUHJvZ3Jlc3MpIHtcbiAgICAgICAgICAvLyBmYWlsIHRoZSBpZnJhbWUgc2Vzc2lvbiBpZiBpdFwicyBpbiBwZW5kaW5nIHN0YXRlXG4gICAgICAgICAgdGhpcy5fbG9nZ2VyLnZlcmJvc2UoXCJMb2FkaW5nIGZyYW1lIGhhcyB0aW1lZCBvdXQgYWZ0ZXI6IFwiICsgKHRoaXMubG9hZEZyYW1lVGltZW91dCAvIDEwMDApICsgXCIgc2Vjb25kcyBmb3Igc2NvcGUgXCIgKyBzY29wZSArIFwiOlwiICsgZXhwZWN0ZWRTdGF0ZSk7XG4gICAgICAgICAgaWYgKGV4cGVjdGVkU3RhdGUgJiYgd2luZG93LmNhbGxCYWNrTWFwcGVkVG9SZW5ld1N0YXRlc1tleHBlY3RlZFN0YXRlXSkge1xuICAgICAgICAgICAgICB3aW5kb3cuY2FsbEJhY2tNYXBwZWRUb1JlbmV3U3RhdGVzW2V4cGVjdGVkU3RhdGVdKFwiVG9rZW4gcmVuZXdhbCBvcGVyYXRpb24gZmFpbGVkIGR1ZSB0byB0aW1lb3V0XCIsIG51bGwsIFwiVG9rZW4gUmVuZXdhbCBGYWlsZWRcIiwgQ29uc3RhbnRzLmFjY2Vzc1Rva2VuKTtcbiAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5fY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLnJlbmV3U3RhdHVzICsgZXhwZWN0ZWRTdGF0ZSwgQ29uc3RhbnRzLnRva2VuUmVuZXdTdGF0dXNDYW5jZWxsZWQpO1xuICAgICAgfVxuICAgIH0sIHRoaXMubG9hZEZyYW1lVGltZW91dCk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgaWZyYW1lIHdpdGggYXV0aG9yaXphdGlvbiBlbmRwb2ludCBVUkxcbiAgICogQGlnbm9yZVxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIGxvYWRGcmFtZSh1cmxOYXZpZ2F0ZTogc3RyaW5nLCBmcmFtZU5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIC8vIFRoaXMgdHJpY2sgb3ZlcmNvbWVzIGlmcmFtZSBuYXZpZ2F0aW9uIGluIElFXG4gICAgLy8gSUUgZG9lcyBub3QgbG9hZCB0aGUgcGFnZSBjb25zaXN0ZW50bHkgaW4gaWZyYW1lXG4gICAgdGhpcy5fbG9nZ2VyLmluZm8oXCJMb2FkRnJhbWU6IFwiICsgZnJhbWVOYW1lKTtcbiAgICB2YXIgZnJhbWVDaGVjayA9IGZyYW1lTmFtZTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHZhciBmcmFtZUhhbmRsZSA9IHRoaXMuYWRkQWRhbEZyYW1lKGZyYW1lQ2hlY2spO1xuICAgICAgaWYgKGZyYW1lSGFuZGxlLnNyYyA9PT0gXCJcIiB8fCBmcmFtZUhhbmRsZS5zcmMgPT09IFwiYWJvdXQ6YmxhbmtcIikge1xuICAgICAgICAgIGZyYW1lSGFuZGxlLnNyYyA9IHVybE5hdmlnYXRlO1xuICAgICAgICAgIHRoaXMuX2xvZ2dlci5pbmZvUGlpKFwiRnJhbWUgTmFtZSA6IFwiICsgZnJhbWVOYW1lICsgXCIgTmF2aWdhdGVkIHRvOiBcIiArIHVybE5hdmlnYXRlKTtcbiAgICAgIH1cbiAgICB9LFxuICAgICAgNTAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBoaWRkZW4gaWZyYW1lIGZvciBzaWxlbnQgdG9rZW4gcmVuZXdhbC5cbiAgICogQGlnbm9yZVxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIGFkZEFkYWxGcmFtZShpZnJhbWVJZDogc3RyaW5nKTogSFRNTElGcmFtZUVsZW1lbnQge1xuICAgIGlmICh0eXBlb2YgaWZyYW1lSWQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuX2xvZ2dlci5pbmZvKFwiQWRkIG1zYWwgZnJhbWUgdG8gZG9jdW1lbnQ6XCIgKyBpZnJhbWVJZCk7XG4gICAgbGV0IGFkYWxGcmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlmcmFtZUlkKSBhcyBIVE1MSUZyYW1lRWxlbWVudDtcbiAgICBpZiAoIWFkYWxGcmFtZSkge1xuICAgICAgaWYgKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJiZcbiAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICYmXG4gICAgICAgICh3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiTVNJRSA1LjBcIikgPT09IC0xKSkge1xuICAgICAgICBjb25zdCBpZnIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaWZyYW1lXCIpO1xuICAgICAgICBpZnIuc2V0QXR0cmlidXRlKFwiaWRcIiwgaWZyYW1lSWQpO1xuICAgICAgICBpZnIuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgICAgIGlmci5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgICAgaWZyLnN0eWxlLndpZHRoID0gaWZyLnN0eWxlLmhlaWdodCA9IFwiMFwiO1xuICAgICAgICBpZnIuc3R5bGUuYm9yZGVyID0gXCIwXCI7XG4gICAgICAgIGFkYWxGcmFtZSA9IChkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJvZHlcIilbMF0uYXBwZW5kQ2hpbGQoaWZyKSBhcyBIVE1MSUZyYW1lRWxlbWVudCk7XG4gICAgICB9IGVsc2UgaWYgKGRvY3VtZW50LmJvZHkgJiYgZG9jdW1lbnQuYm9keS5pbnNlcnRBZGphY2VudEhUTUwpIHtcbiAgICAgICAgICBkb2N1bWVudC5ib2R5Lmluc2VydEFkamFjZW50SFRNTChcImJlZm9yZWVuZFwiLCBcIjxpZnJhbWUgbmFtZT0nXCIgKyBpZnJhbWVJZCArIFwiJyBpZD0nXCIgKyBpZnJhbWVJZCArIFwiJyBzdHlsZT0nZGlzcGxheTpub25lJz48L2lmcmFtZT5cIik7XG4gICAgICB9XG5cbiAgICAgIGlmICh3aW5kb3cuZnJhbWVzICYmIHdpbmRvdy5mcmFtZXNbaWZyYW1lSWRdKSB7XG4gICAgICAgIGFkYWxGcmFtZSA9IHdpbmRvdy5mcmFtZXNbaWZyYW1lSWRdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBhZGFsRnJhbWU7XG4gIH1cblxuICAvKipcbiAgICogQWNxdWlyZXMgYWNjZXNzIHRva2VuIHVzaW5nIGEgaGlkZGVuIGlmcmFtZS5cbiAgICogQGlnbm9yZVxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIHJlbmV3VG9rZW4oc2NvcGVzOiBBcnJheTxzdHJpbmc+LCByZXNvbHZlOiBGdW5jdGlvbiwgcmVqZWN0OiBGdW5jdGlvbiwgdXNlcjogVXNlciwgYXV0aGVudGljYXRpb25SZXF1ZXN0OiBBdXRoZW50aWNhdGlvblJlcXVlc3RQYXJhbWV0ZXJzLCBleHRyYVF1ZXJ5UGFyYW1ldGVycz86IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IHNjb3BlID0gc2NvcGVzLmpvaW4oXCIgXCIpLnRvTG93ZXJDYXNlKCk7XG4gICAgdGhpcy5fbG9nZ2VyLnZlcmJvc2UoXCJyZW5ld1Rva2VuIGlzIGNhbGxlZCBmb3Igc2NvcGU6XCIgKyBzY29wZSk7XG4gICAgY29uc3QgZnJhbWVIYW5kbGUgPSB0aGlzLmFkZEFkYWxGcmFtZShcIm1zYWxSZW5ld0ZyYW1lXCIgKyBzY29wZSk7XG4gICAgaWYgKGV4dHJhUXVlcnlQYXJhbWV0ZXJzKSB7XG4gICAgICBhdXRoZW50aWNhdGlvblJlcXVlc3QuZXh0cmFRdWVyeVBhcmFtZXRlcnMgPSBleHRyYVF1ZXJ5UGFyYW1ldGVycztcbiAgICB9XG5cbiAgICB2YXIgYWNxdWlyZVRva2VuVXNlcktleTtcbiAgICBpZiAodXNlcikge1xuICAgICAgICBhY3F1aXJlVG9rZW5Vc2VyS2V5ID0gQ29uc3RhbnRzLmFjcXVpcmVUb2tlblVzZXIgKyBDb25zdGFudHMucmVzb3VyY2VEZWxpbWV0ZXIgKyB1c2VyLnVzZXJJZGVudGlmaWVyICsgQ29uc3RhbnRzLnJlc291cmNlRGVsaW1ldGVyICsgYXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgYWNxdWlyZVRva2VuVXNlcktleSA9IENvbnN0YW50cy5hY3F1aXJlVG9rZW5Vc2VyICsgQ29uc3RhbnRzLnJlc291cmNlRGVsaW1ldGVyICArIENvbnN0YW50cy5ub191c2VyICsgQ29uc3RhbnRzLnJlc291cmNlRGVsaW1ldGVyICsgYXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlO1xuICAgIH1cblxuICAgIHRoaXMuX2NhY2hlU3RvcmFnZS5zZXRJdGVtKGFjcXVpcmVUb2tlblVzZXJLZXksIEpTT04uc3RyaW5naWZ5KHVzZXIpKTtcbiAgICBjb25zdCBhdXRob3JpdHlLZXkgPSBDb25zdGFudHMuYXV0aG9yaXR5ICsgQ29uc3RhbnRzLnJlc291cmNlRGVsaW1ldGVyICsgYXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlO1xuICAgIHRoaXMuX2NhY2hlU3RvcmFnZS5zZXRJdGVtKGF1dGhvcml0eUtleSwgYXV0aGVudGljYXRpb25SZXF1ZXN0LmF1dGhvcml0eSk7XG4gICAgLy8gcmVuZXcgaGFwcGVucyBpbiBpZnJhbWUsIHNvIGl0IGtlZXBzIGphdmFzY3JpcHQgY29udGV4dFxuICAgIHRoaXMuX2NhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5ub25jZUlkVG9rZW4sIGF1dGhlbnRpY2F0aW9uUmVxdWVzdC5ub25jZSk7XG4gICAgdGhpcy5fbG9nZ2VyLnZlcmJvc2UoXCJSZW5ldyB0b2tlbiBFeHBlY3RlZCBzdGF0ZTogXCIgKyBhdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGUpO1xuICAgIGxldCB1cmxOYXZpZ2F0ZSA9IFV0aWxzLnVybFJlbW92ZVF1ZXJ5U3RyaW5nUGFyYW1ldGVyKGF1dGhlbnRpY2F0aW9uUmVxdWVzdC5jcmVhdGVOYXZpZ2F0ZVVybChzY29wZXMpLCBDb25zdGFudHMucHJvbXB0KSArIENvbnN0YW50cy5wcm9tcHRfbm9uZTtcbiAgICB1cmxOYXZpZ2F0ZSA9IHRoaXMuYWRkSGludFBhcmFtZXRlcnModXJsTmF2aWdhdGUsIHVzZXIpO1xuICAgIHdpbmRvdy5yZW5ld1N0YXRlcy5wdXNoKGF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSk7XG4gICAgd2luZG93LnJlcXVlc3RUeXBlID0gQ29uc3RhbnRzLnJlbmV3VG9rZW47XG4gICAgdGhpcy5yZWdpc3RlckNhbGxiYWNrKGF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSwgc2NvcGUsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgdGhpcy5fbG9nZ2VyLmluZm9QaWkoXCJOYXZpZ2F0ZSB0bzpcIiArIHVybE5hdmlnYXRlKTtcbiAgICBmcmFtZUhhbmRsZS5zcmMgPSBcImFib3V0OmJsYW5rXCI7XG4gICAgdGhpcy5sb2FkSWZyYW1lVGltZW91dCh1cmxOYXZpZ2F0ZSwgXCJtc2FsUmVuZXdGcmFtZVwiICsgc2NvcGUsIHNjb3BlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5ld3MgaWR0b2tlbiBmb3IgYXBwXCJzIG93biBiYWNrZW5kIHdoZW4gY2xpZW50SWQgaXMgcGFzc2VkIGFzIGEgc2luZ2xlIHNjb3BlIGluIHRoZSBzY29wZXMgYXJyYXkuXG4gICAqIEBpZ25vcmVcbiAgICogQGhpZGRlblxuICAgKi9cbiAgcHJpdmF0ZSByZW5ld0lkVG9rZW4oc2NvcGVzOiBBcnJheTxzdHJpbmc+LCByZXNvbHZlOiBGdW5jdGlvbiwgcmVqZWN0OiBGdW5jdGlvbiwgdXNlcjogVXNlciwgYXV0aGVudGljYXRpb25SZXF1ZXN0OiBBdXRoZW50aWNhdGlvblJlcXVlc3RQYXJhbWV0ZXJzLCBleHRyYVF1ZXJ5UGFyYW1ldGVycz86IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IHNjb3BlID0gc2NvcGVzLmpvaW4oXCIgXCIpLnRvTG93ZXJDYXNlKCk7XG4gICAgdGhpcy5fbG9nZ2VyLmluZm8oXCJyZW5ld2lkVG9rZW4gaXMgY2FsbGVkXCIpO1xuICAgIGNvbnN0IGZyYW1lSGFuZGxlID0gdGhpcy5hZGRBZGFsRnJhbWUoXCJtc2FsSWRUb2tlbkZyYW1lXCIpO1xuICAgIGlmIChleHRyYVF1ZXJ5UGFyYW1ldGVycykge1xuICAgICAgYXV0aGVudGljYXRpb25SZXF1ZXN0LmV4dHJhUXVlcnlQYXJhbWV0ZXJzID0gZXh0cmFRdWVyeVBhcmFtZXRlcnM7XG4gICAgfVxuXG4gICAgdmFyIGFjcXVpcmVUb2tlblVzZXJLZXk7XG4gICAgaWYgKHVzZXIpIHtcbiAgICAgICAgYWNxdWlyZVRva2VuVXNlcktleSA9IENvbnN0YW50cy5hY3F1aXJlVG9rZW5Vc2VyICsgQ29uc3RhbnRzLnJlc291cmNlRGVsaW1ldGVyICsgdXNlci51c2VySWRlbnRpZmllciArIENvbnN0YW50cy5yZXNvdXJjZURlbGltZXRlciArIGF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGFjcXVpcmVUb2tlblVzZXJLZXkgPSBDb25zdGFudHMuYWNxdWlyZVRva2VuVXNlciArIENvbnN0YW50cy5yZXNvdXJjZURlbGltZXRlciArIENvbnN0YW50cy5ub191c2VyICsgQ29uc3RhbnRzLnJlc291cmNlRGVsaW1ldGVyICsgYXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlO1xuICAgIH1cbiAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShhY3F1aXJlVG9rZW5Vc2VyS2V5LCBKU09OLnN0cmluZ2lmeSh1c2VyKSk7XG4gICAgY29uc3QgYXV0aG9yaXR5S2V5ID0gQ29uc3RhbnRzLmF1dGhvcml0eSArIENvbnN0YW50cy5yZXNvdXJjZURlbGltZXRlciArIGF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZTtcbiAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShhdXRob3JpdHlLZXksIGF1dGhlbnRpY2F0aW9uUmVxdWVzdC5hdXRob3JpdHkpO1xuICAgIHRoaXMuX2NhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5ub25jZUlkVG9rZW4sIGF1dGhlbnRpY2F0aW9uUmVxdWVzdC5ub25jZSk7XG4gICAgdGhpcy5fbG9nZ2VyLnZlcmJvc2UoXCJSZW5ldyBJZHRva2VuIEV4cGVjdGVkIHN0YXRlOiBcIiArIGF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSk7XG4gICAgbGV0IHVybE5hdmlnYXRlID0gVXRpbHMudXJsUmVtb3ZlUXVlcnlTdHJpbmdQYXJhbWV0ZXIoYXV0aGVudGljYXRpb25SZXF1ZXN0LmNyZWF0ZU5hdmlnYXRlVXJsKHNjb3BlcyksIENvbnN0YW50cy5wcm9tcHQpICsgQ29uc3RhbnRzLnByb21wdF9ub25lO1xuICAgIHVybE5hdmlnYXRlID0gdGhpcy5hZGRIaW50UGFyYW1ldGVycyh1cmxOYXZpZ2F0ZSwgdXNlcik7XG4gICAgaWYgKHRoaXMuX3NpbGVudExvZ2luKSB7XG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0VHlwZSA9IENvbnN0YW50cy5sb2dpbjtcbiAgICAgICAgdGhpcy5fc2lsZW50QXV0aGVudGljYXRpb25TdGF0ZSA9IGF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB3aW5kb3cucmVxdWVzdFR5cGUgPSBDb25zdGFudHMucmVuZXdUb2tlbjtcbiAgICAgICAgd2luZG93LnJlbmV3U3RhdGVzLnB1c2goYXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlKTtcbiAgICB9XG5cbiAgICB0aGlzLnJlZ2lzdGVyQ2FsbGJhY2soYXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlLCB0aGlzLmNsaWVudElkLCByZXNvbHZlLCByZWplY3QpO1xuICAgIHRoaXMuX2xvZ2dlci5pbmZvUGlpKFwiTmF2aWdhdGUgdG86XCIgKyB1cmxOYXZpZ2F0ZSk7XG4gICAgZnJhbWVIYW5kbGUuc3JjID0gXCJhYm91dDpibGFua1wiO1xuICAgIHRoaXMubG9hZElmcmFtZVRpbWVvdXQodXJsTmF2aWdhdGUsIFwibXNhbElkVG9rZW5GcmFtZVwiLCB0aGlzLmNsaWVudElkKTtcbiAgfVxuXG4gIC8qKlxuICAgICogUmV0dXJucyB0aGUgc2lnbmVkIGluIHVzZXIgKHJlY2VpdmVkIGZyb20gYSB1c2VyIG9iamVjdCBjcmVhdGVkIGF0IHRoZSB0aW1lIG9mIGxvZ2luKSBvciBudWxsLlxuICAgICovXG4gIGdldFVzZXIoKTogVXNlciB7XG4gICAgLy8gaWRUb2tlbiBpcyBmaXJzdCBjYWxsXG4gICAgaWYgKHRoaXMuX3VzZXIpIHtcbiAgICAgIHJldHVybiB0aGlzLl91c2VyO1xuICAgIH1cblxuICAgIC8vIGZyYW1lIGlzIHVzZWQgdG8gZ2V0IGlkVG9rZW5cbiAgICBjb25zdCByYXdJZFRva2VuID0gdGhpcy5fY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLmlkVG9rZW5LZXkpO1xuICAgIGNvbnN0IHJhd0NsaWVudEluZm8gPSB0aGlzLl9jYWNoZVN0b3JhZ2UuZ2V0SXRlbShDb25zdGFudHMubXNhbENsaWVudEluZm8pO1xuICAgIGlmICghVXRpbHMuaXNFbXB0eShyYXdJZFRva2VuKSAmJiAhVXRpbHMuaXNFbXB0eShyYXdDbGllbnRJbmZvKSkge1xuICAgICAgY29uc3QgaWRUb2tlbiA9IG5ldyBJZFRva2VuKHJhd0lkVG9rZW4pO1xuICAgICAgY29uc3QgY2xpZW50SW5mbyA9IG5ldyBDbGllbnRJbmZvKHJhd0NsaWVudEluZm8pO1xuICAgICAgdGhpcy5fdXNlciA9IFVzZXIuY3JlYXRlVXNlcihpZFRva2VuLCBjbGllbnRJbmZvKTtcbiAgICAgIHJldHVybiB0aGlzLl91c2VyO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIG11c3QgYmUgY2FsbGVkIGZvciBwcm9jZXNzaW5nIHRoZSByZXNwb25zZSByZWNlaXZlZCBmcm9tIHRoZSBTVFMuIEl0IGV4dHJhY3RzIHRoZSBoYXNoLCBwcm9jZXNzZXMgdGhlIHRva2VuIG9yIGVycm9yIGluZm9ybWF0aW9uIGFuZCBzYXZlcyBpdCBpbiB0aGUgY2FjaGUuIEl0IHRoZW5cbiAgICogY2FsbHMgdGhlIHJlZ2lzdGVyZWQgY2FsbGJhY2tzIGluIGNhc2Ugb2YgcmVkaXJlY3Qgb3IgcmVzb2x2ZXMgdGhlIHByb21pc2VzIHdpdGggdGhlIHJlc3VsdC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtoYXNoPXdpbmRvdy5sb2NhdGlvbi5oYXNoXSAtIEhhc2ggZnJhZ21lbnQgb2YgVXJsLlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIGhhbmRsZUF1dGhlbnRpY2F0aW9uUmVzcG9uc2UoaGFzaDogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKGhhc2ggPT0gbnVsbCkge1xuICAgICAgaGFzaCA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoO1xuICAgIH1cblxuICAgIHZhciBzZWxmID0gbnVsbDtcbiAgICB2YXIgaXNQb3B1cDogYm9vbGVhbiA9IGZhbHNlO1xuICAgIHZhciBpc1dpbmRvd09wZW5lck1zYWwgPSBmYWxzZTtcblxuICAgIHRyeSB7XG4gICAgICAgIGlzV2luZG93T3BlbmVyTXNhbCA9IHdpbmRvdy5vcGVuZXIgJiYgd2luZG93Lm9wZW5lci5tc2FsICYmIHdpbmRvdy5vcGVuZXIubXNhbCAhPT0gd2luZG93Lm1zYWw7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIC8vIGVyciA9IFNlY3VyaXR5RXJyb3I6IEJsb2NrZWQgYSBmcmFtZSB3aXRoIG9yaWdpbiBcIlt1cmxdXCIgZnJvbSBhY2Nlc3NpbmcgYSBjcm9zcy1vcmlnaW4gZnJhbWUuXG4gICAgICAgIGlzV2luZG93T3BlbmVyTXNhbCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChpc1dpbmRvd09wZW5lck1zYWwpIHtcbiAgICAgICAgc2VsZiA9IHdpbmRvdy5vcGVuZXIubXNhbDtcbiAgICAgICAgaXNQb3B1cCA9IHRydWU7XG4gICAgfVxuICAgIGVsc2UgaWYgKHdpbmRvdy5wYXJlbnQgJiYgd2luZG93LnBhcmVudC5tc2FsKSB7XG4gICAgICBzZWxmID0gd2luZG93LnBhcmVudC5tc2FsO1xuICAgIH1cblxuICAgIGNvbnN0IHJlcXVlc3RJbmZvID0gc2VsZi5nZXRSZXF1ZXN0SW5mbyhoYXNoKTsgLy9pZih3aW5kb3cucGFyZW50IT09d2luZG93KSwgYnkgdXNpbmcgc2VsZiwgd2luZG93LnBhcmVudCBiZWNvbWVzIGVxdWFsIHRvIHdpbmRvdyBpbiBnZXRSZXF1ZXN0SW5mbyBtZXRob2Qgc3BlY2lmaWNhbGx5XG4gICAgbGV0IHRva2VuOiBzdHJpbmcgPSBudWxsLCB0b2tlblJlY2VpdmVkQ2FsbGJhY2s6IChlcnJvckRlc2M6IHN0cmluZywgdG9rZW46IHN0cmluZywgZXJyb3I6IHN0cmluZywgdG9rZW5UeXBlOiBzdHJpbmcpID0+IHZvaWQgPSBudWxsLCB0b2tlblR5cGU6IHN0cmluZywgc2F2ZVRva2VuOiBib29sZWFuID0gdHJ1ZTtcbiAgICBzZWxmLl9sb2dnZXIuaW5mbyhcIlJldHVybmVkIGZyb20gcmVkaXJlY3QgdXJsXCIpO1xuICAgIGlmICh3aW5kb3cucGFyZW50ICE9PSB3aW5kb3cgJiYgd2luZG93LnBhcmVudC5tc2FsKSB7XG4gICAgICAgIHRva2VuUmVjZWl2ZWRDYWxsYmFjayA9IHdpbmRvdy5wYXJlbnQuY2FsbEJhY2tNYXBwZWRUb1JlbmV3U3RhdGVzW3JlcXVlc3RJbmZvLnN0YXRlUmVzcG9uc2VdO1xuICAgIH1cbiAgICBlbHNlIGlmIChpc1dpbmRvd09wZW5lck1zYWwpIHtcbiAgICAgICAgdG9rZW5SZWNlaXZlZENhbGxiYWNrID0gd2luZG93Lm9wZW5lci5jYWxsQmFja01hcHBlZFRvUmVuZXdTdGF0ZXNbcmVxdWVzdEluZm8uc3RhdGVSZXNwb25zZV07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAoc2VsZi5fbmF2aWdhdGVUb0xvZ2luUmVxdWVzdFVybCkge1xuICAgICAgICAgICAgdG9rZW5SZWNlaXZlZENhbGxiYWNrID0gbnVsbDtcbiAgICAgICAgICAgIHNlbGYuX2NhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy51cmxIYXNoLCBoYXNoKTtcbiAgICAgICAgICAgIHNhdmVUb2tlbiA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKHdpbmRvdy5wYXJlbnQgPT09IHdpbmRvdyAmJiAhaXNQb3B1cCkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gc2VsZi5fY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLmxvZ2luUmVxdWVzdCwgdGhpcy5zdG9yZUF1dGhTdGF0ZUluQ29va2llKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRva2VuUmVjZWl2ZWRDYWxsYmFjayA9IHNlbGYuX3Rva2VuUmVjZWl2ZWRDYWxsYmFjaztcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gXCJcIjtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgc2VsZi5zYXZlVG9rZW5Gcm9tSGFzaChyZXF1ZXN0SW5mbyk7XG5cbiAgICBpZiAoKHJlcXVlc3RJbmZvLnJlcXVlc3RUeXBlID09PSBDb25zdGFudHMucmVuZXdUb2tlbikgJiYgd2luZG93LnBhcmVudCkge1xuICAgICAgICBpZiAod2luZG93LnBhcmVudCAhPT0gd2luZG93KSB7XG4gICAgICAgICAgICBzZWxmLl9sb2dnZXIudmVyYm9zZShcIldpbmRvdyBpcyBpbiBpZnJhbWUsIGFjcXVpcmluZyB0b2tlbiBzaWxlbnRseVwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYuX2xvZ2dlci52ZXJib3NlKFwiYWNxdWlyaW5nIHRva2VuIGludGVyYWN0aXZlIGluIHByb2dyZXNzXCIpO1xuICAgICAgICB9XG5cbiAgICB0b2tlbiA9IHJlcXVlc3RJbmZvLnBhcmFtZXRlcnNbQ29uc3RhbnRzLmFjY2Vzc1Rva2VuXSB8fCByZXF1ZXN0SW5mby5wYXJhbWV0ZXJzW0NvbnN0YW50cy5pZFRva2VuXTtcbiAgICB0b2tlblR5cGUgPSBDb25zdGFudHMuYWNjZXNzVG9rZW47XG4gICAgfSBlbHNlIGlmIChyZXF1ZXN0SW5mby5yZXF1ZXN0VHlwZSA9PT0gQ29uc3RhbnRzLmxvZ2luKSB7XG4gICAgdG9rZW4gPSByZXF1ZXN0SW5mby5wYXJhbWV0ZXJzW0NvbnN0YW50cy5pZFRva2VuXTtcbiAgICB0b2tlblR5cGUgPSBDb25zdGFudHMuaWRUb2tlbjtcbiAgICB9XG5cbiAgICB2YXIgZXJyb3JEZXNjID0gcmVxdWVzdEluZm8ucGFyYW1ldGVyc1tDb25zdGFudHMuZXJyb3JEZXNjcmlwdGlvbl07XG4gICAgdmFyIGVycm9yID0gcmVxdWVzdEluZm8ucGFyYW1ldGVyc1tDb25zdGFudHMuZXJyb3JdO1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0b2tlblJlY2VpdmVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIC8vV2Ugc2hvdWxkIG9ubHkgc2VuZCB0aGUgc3RhZSBiYWNrIHRvIHRoZSBkZXZlbG9wZXIgaWYgaXQgbWF0Y2hlcyB3aXRoIHdoYXQgd2UgcmVjZWl2ZWQgZnJvbSB0aGUgc2VydmVyXG4gICAgICAgICAgICBpZiAocmVxdWVzdEluZm8uc3RhdGVNYXRjaCkge1xuICAgICAgICAgICAgICAgIHRva2VuUmVjZWl2ZWRDYWxsYmFjay5jYWxsKHNlbGYsIGVycm9yRGVzYywgdG9rZW4sIGVycm9yLCB0b2tlblR5cGUsIHRoaXMuZ2V0VXNlclN0YXRlKHJlcXVlc3RJbmZvLnN0YXRlUmVzcG9uc2UpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRva2VuUmVjZWl2ZWRDYWxsYmFjay5jYWxsKHNlbGYsIGVycm9yRGVzYywgdG9rZW4sIGVycm9yLCB0b2tlblR5cGUsIG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgc2VsZi5fbG9nZ2VyLmVycm9yKFwiRXJyb3Igb2NjdXJyZWQgaW4gdG9rZW4gcmVjZWl2ZWQgY2FsbGJhY2sgZnVuY3Rpb246IFwiICsgZXJyKTtcbiAgICB9XG4gICAgaWYgKGlzV2luZG93T3BlbmVyTXNhbCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdpbmRvdy5vcGVuZXIub3BlbmVkV2luZG93cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgd2luZG93Lm9wZW5lci5vcGVuZWRXaW5kb3dzW2ldLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBtZXRob2QgbXVzdCBiZSBjYWxsZWQgZm9yIHByb2Nlc3NpbmcgdGhlIHJlc3BvbnNlIHJlY2VpdmVkIGZyb20gQUFELiBJdCBleHRyYWN0cyB0aGUgaGFzaCwgcHJvY2Vzc2VzIHRoZSB0b2tlbiBvciBlcnJvciwgc2F2ZXMgaXQgaW4gdGhlIGNhY2hlIGFuZCBjYWxscyB0aGUgcmVnaXN0ZXJlZCBjYWxsYmFja3Mgd2l0aCB0aGUgcmVzdWx0LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gYXV0aG9yaXR5IGF1dGhvcml0eSByZWNlaXZlZCBpbiB0aGUgcmVkaXJlY3QgcmVzcG9uc2UgZnJvbSBBQUQuXG4gICAqIEBwYXJhbSB7VG9rZW5SZXNwb25zZX0gcmVxdWVzdEluZm8gYW4gb2JqZWN0IGNyZWF0ZWQgZnJvbSB0aGUgcmVkaXJlY3QgcmVzcG9uc2UgZnJvbSBBQUQgY29tcHJpc2luZyBvZiB0aGUga2V5cyAtIHBhcmFtZXRlcnMsIHJlcXVlc3RUeXBlLCBzdGF0ZU1hdGNoLCBzdGF0ZVJlc3BvbnNlIGFuZCB2YWxpZC5cbiAgICogQHBhcmFtIHtVc2VyfSB1c2VyIHVzZXIgb2JqZWN0IGZvciB3aGljaCBzY29wZXMgYXJlIGNvbnNlbnRlZCBmb3IuIFRoZSBkZWZhdWx0IHVzZXIgaXMgdGhlIGxvZ2dlZCBpbiB1c2VyLlxuICAgKiBAcGFyYW0ge0NsaWVudEluZm99IGNsaWVudEluZm8gY2xpZW50SW5mbyByZWNlaXZlZCBhcyBwYXJ0IG9mIHRoZSByZXNwb25zZSBjb21wcmlzaW5nIG9mIGZpZWxkcyB1aWQgYW5kIHV0aWQuXG4gICAqIEBwYXJhbSB7SWRUb2tlbn0gaWRUb2tlbiBpZFRva2VuIHJlY2VpdmVkIGFzIHBhcnQgb2YgdGhlIHJlc3BvbnNlLlxuICAgKiBAaWdub3JlXG4gICAqIEBwcml2YXRlXG4gICAqIEBoaWRkZW5cbiAgICovXG4gICAvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xuICBwcml2YXRlIHNhdmVBY2Nlc3NUb2tlbihhdXRob3JpdHk6IHN0cmluZywgdG9rZW5SZXNwb25zZTogVG9rZW5SZXNwb25zZSwgdXNlcjogVXNlciwgY2xpZW50SW5mbzogc3RyaW5nLCBpZFRva2VuOiBJZFRva2VuKTogdm9pZCB7XG4gICAgbGV0IHNjb3BlOiBzdHJpbmc7XG4gICAgbGV0IGNsaWVudE9iajogQ2xpZW50SW5mbyA9IG5ldyBDbGllbnRJbmZvKGNsaWVudEluZm8pO1xuICAgIGlmICh0b2tlblJlc3BvbnNlLnBhcmFtZXRlcnMuaGFzT3duUHJvcGVydHkoXCJzY29wZVwiKSkge1xuICAgICAgc2NvcGUgPSB0b2tlblJlc3BvbnNlLnBhcmFtZXRlcnNbXCJzY29wZVwiXTtcbiAgICAgIGNvbnN0IGNvbnNlbnRlZFNjb3BlcyA9IHNjb3BlLnNwbGl0KFwiIFwiKTtcbiAgICAgIGNvbnN0IGFjY2Vzc1Rva2VuQ2FjaGVJdGVtcyA9XG4gICAgICAgIHRoaXMuX2NhY2hlU3RvcmFnZS5nZXRBbGxBY2Nlc3NUb2tlbnModGhpcy5jbGllbnRJZCwgYXV0aG9yaXR5KTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWNjZXNzVG9rZW5DYWNoZUl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGFjY2Vzc1Rva2VuQ2FjaGVJdGVtID0gYWNjZXNzVG9rZW5DYWNoZUl0ZW1zW2ldO1xuICAgICAgICBpZiAoYWNjZXNzVG9rZW5DYWNoZUl0ZW0ua2V5LnVzZXJJZGVudGlmaWVyID09PSB1c2VyLnVzZXJJZGVudGlmaWVyKSB7XG4gICAgICAgICAgY29uc3QgY2FjaGVkU2NvcGVzID0gYWNjZXNzVG9rZW5DYWNoZUl0ZW0ua2V5LnNjb3Blcy5zcGxpdChcIiBcIik7XG4gICAgICAgICAgaWYgKFV0aWxzLmlzSW50ZXJzZWN0aW5nU2NvcGVzKGNhY2hlZFNjb3BlcywgY29uc2VudGVkU2NvcGVzKSkge1xuICAgICAgICAgICAgICB0aGlzLl9jYWNoZVN0b3JhZ2UucmVtb3ZlSXRlbShKU09OLnN0cmluZ2lmeShhY2Nlc3NUb2tlbkNhY2hlSXRlbS5rZXkpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IGFjY2Vzc1Rva2VuS2V5ID0gbmV3IEFjY2Vzc1Rva2VuS2V5KGF1dGhvcml0eSwgdGhpcy5jbGllbnRJZCwgc2NvcGUsIGNsaWVudE9iai51aWQsIGNsaWVudE9iai51dGlkKTtcbiAgICAgIGNvbnN0IGFjY2Vzc1Rva2VuVmFsdWUgPSBuZXcgQWNjZXNzVG9rZW5WYWx1ZSh0b2tlblJlc3BvbnNlLnBhcmFtZXRlcnNbQ29uc3RhbnRzLmFjY2Vzc1Rva2VuXSwgaWRUb2tlbi5yYXdJZFRva2VuLCBVdGlscy5leHBpcmVzSW4odG9rZW5SZXNwb25zZS5wYXJhbWV0ZXJzW0NvbnN0YW50cy5leHBpcmVzSW5dKS50b1N0cmluZygpLCBjbGllbnRJbmZvKTtcbiAgICAgIHRoaXMuX2NhY2hlU3RvcmFnZS5zZXRJdGVtKEpTT04uc3RyaW5naWZ5KGFjY2Vzc1Rva2VuS2V5KSwgSlNPTi5zdHJpbmdpZnkoYWNjZXNzVG9rZW5WYWx1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzY29wZSA9IHRoaXMuY2xpZW50SWQ7XG4gICAgICBjb25zdCBhY2Nlc3NUb2tlbktleSA9IG5ldyBBY2Nlc3NUb2tlbktleShhdXRob3JpdHksIHRoaXMuY2xpZW50SWQsIHNjb3BlLCBjbGllbnRPYmoudWlkLCBjbGllbnRPYmoudXRpZCk7XG4gICAgICBjb25zdCBhY2Nlc3NUb2tlblZhbHVlID0gbmV3IEFjY2Vzc1Rva2VuVmFsdWUodG9rZW5SZXNwb25zZS5wYXJhbWV0ZXJzW0NvbnN0YW50cy5pZFRva2VuXSwgdG9rZW5SZXNwb25zZS5wYXJhbWV0ZXJzW0NvbnN0YW50cy5pZFRva2VuXSwgaWRUb2tlbi5leHBpcmF0aW9uLCBjbGllbnRJbmZvKTtcbiAgICAgIHRoaXMuX2NhY2hlU3RvcmFnZS5zZXRJdGVtKEpTT04uc3RyaW5naWZ5KGFjY2Vzc1Rva2VuS2V5KSwgSlNPTi5zdHJpbmdpZnkoYWNjZXNzVG9rZW5WYWx1ZSkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTYXZlcyB0b2tlbiBvciBlcnJvciByZWNlaXZlZCBpbiB0aGUgcmVzcG9uc2UgZnJvbSBBQUQgaW4gdGhlIGNhY2hlLiBJbiBjYXNlIG9mIGlkX3Rva2VuLCBpdCBhbHNvIGNyZWF0ZXMgdGhlIHVzZXIgb2JqZWN0LlxuICAgKiBAaWdub3JlXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHByb3RlY3RlZCBzYXZlVG9rZW5Gcm9tSGFzaCh0b2tlblJlc3BvbnNlOiBUb2tlblJlc3BvbnNlKTogdm9pZCB7XG4gICAgdGhpcy5fbG9nZ2VyLmluZm8oXCJTdGF0ZSBzdGF0dXM6XCIgKyB0b2tlblJlc3BvbnNlLnN0YXRlTWF0Y2ggKyBcIjsgUmVxdWVzdCB0eXBlOlwiICsgdG9rZW5SZXNwb25zZS5yZXF1ZXN0VHlwZSk7XG4gICAgdGhpcy5fY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLm1zYWxFcnJvciwgXCJcIik7XG4gICAgdGhpcy5fY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLm1zYWxFcnJvckRlc2NyaXB0aW9uLCBcIlwiKTtcbiAgICAgIHZhciBzY29wZTogc3RyaW5nID0gXCJcIjtcbiAgICAgIHZhciBhdXRob3JpdHlLZXk6IHN0cmluZyA9IFwiXCI7XG4gICAgICB2YXIgYWNxdWlyZVRva2VuVXNlcktleTogc3RyaW5nID0gXCJcIjtcbiAgICBpZiAodG9rZW5SZXNwb25zZS5wYXJhbWV0ZXJzLmhhc093blByb3BlcnR5KFwic2NvcGVcIikpIHtcbiAgICAgIHNjb3BlID0gdG9rZW5SZXNwb25zZS5wYXJhbWV0ZXJzW1wic2NvcGVcIl0udG9Mb3dlckNhc2UoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBzY29wZSA9IHRoaXMuY2xpZW50SWQ7XG4gICAgfVxuXG4gICAgLy8gUmVjb3JkIGVycm9yXG4gICAgaWYgKHRva2VuUmVzcG9uc2UucGFyYW1ldGVycy5oYXNPd25Qcm9wZXJ0eShDb25zdGFudHMuZXJyb3JEZXNjcmlwdGlvbikgfHwgdG9rZW5SZXNwb25zZS5wYXJhbWV0ZXJzLmhhc093blByb3BlcnR5KENvbnN0YW50cy5lcnJvcikpIHtcbiAgICAgIHRoaXMuX2xvZ2dlci5pbmZvUGlpKFwiRXJyb3IgOlwiICsgdG9rZW5SZXNwb25zZS5wYXJhbWV0ZXJzW0NvbnN0YW50cy5lcnJvcl0gKyBcIjsgRXJyb3IgZGVzY3JpcHRpb246XCIgKyB0b2tlblJlc3BvbnNlLnBhcmFtZXRlcnNbQ29uc3RhbnRzLmVycm9yRGVzY3JpcHRpb25dKTtcbiAgICAgIHRoaXMuX2NhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsRXJyb3IsIHRva2VuUmVzcG9uc2UucGFyYW1ldGVyc1tcImVycm9yXCJdKTtcbiAgICAgIHRoaXMuX2NhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsRXJyb3JEZXNjcmlwdGlvbiwgdG9rZW5SZXNwb25zZS5wYXJhbWV0ZXJzW0NvbnN0YW50cy5lcnJvckRlc2NyaXB0aW9uXSk7XG4gICAgICBpZiAodG9rZW5SZXNwb25zZS5yZXF1ZXN0VHlwZSA9PT0gQ29uc3RhbnRzLmxvZ2luKSB7XG4gICAgICAgIHRoaXMuX2xvZ2luSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubG9naW5FcnJvciwgdG9rZW5SZXNwb25zZS5wYXJhbWV0ZXJzW0NvbnN0YW50cy5lcnJvckRlc2NyaXB0aW9uXSArIFwiOlwiICsgdG9rZW5SZXNwb25zZS5wYXJhbWV0ZXJzW0NvbnN0YW50cy5lcnJvcl0pO1xuICAgICAgICBhdXRob3JpdHlLZXkgPSBDb25zdGFudHMuYXV0aG9yaXR5ICsgQ29uc3RhbnRzLnJlc291cmNlRGVsaW1ldGVyICsgdG9rZW5SZXNwb25zZS5zdGF0ZVJlc3BvbnNlO1xuICAgICAgfVxuXG4gICAgICBpZiAodG9rZW5SZXNwb25zZS5yZXF1ZXN0VHlwZSA9PT0gQ29uc3RhbnRzLnJlbmV3VG9rZW4pIHtcbiAgICAgICAgICB0aGlzLl9hY3F1aXJlVG9rZW5JblByb2dyZXNzID0gZmFsc2U7XG4gICAgICAgICAgYXV0aG9yaXR5S2V5ID0gQ29uc3RhbnRzLmF1dGhvcml0eSArIENvbnN0YW50cy5yZXNvdXJjZURlbGltZXRlciArIHRva2VuUmVzcG9uc2Uuc3RhdGVSZXNwb25zZTtcbiAgICAgICAgICB2YXIgdXNlcktleSA9IHRoaXMuZ2V0VXNlcigpICE9PSBudWxsID8gdGhpcy5nZXRVc2VyKCkudXNlcklkZW50aWZpZXIgOiBcIlwiO1xuICAgICAgICAgIGFjcXVpcmVUb2tlblVzZXJLZXkgPSBDb25zdGFudHMuYWNxdWlyZVRva2VuVXNlciArIENvbnN0YW50cy5yZXNvdXJjZURlbGltZXRlciArIHVzZXJLZXkgKyBDb25zdGFudHMucmVzb3VyY2VEZWxpbWV0ZXIgKyB0b2tlblJlc3BvbnNlLnN0YXRlUmVzcG9uc2U7XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSXQgbXVzdCB2ZXJpZnkgdGhlIHN0YXRlIGZyb20gcmVkaXJlY3RcbiAgICAgIGlmICh0b2tlblJlc3BvbnNlLnN0YXRlTWF0Y2gpIHtcbiAgICAgICAgLy8gcmVjb3JkIHRva2VucyB0byBzdG9yYWdlIGlmIGV4aXN0c1xuICAgICAgICB0aGlzLl9sb2dnZXIuaW5mbyhcIlN0YXRlIGlzIHJpZ2h0XCIpO1xuICAgICAgICBpZiAodG9rZW5SZXNwb25zZS5wYXJhbWV0ZXJzLmhhc093blByb3BlcnR5KENvbnN0YW50cy5zZXNzaW9uU3RhdGUpKSB7XG4gICAgICAgICAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbFNlc3Npb25TdGF0ZSwgdG9rZW5SZXNwb25zZS5wYXJhbWV0ZXJzW0NvbnN0YW50cy5zZXNzaW9uU3RhdGVdKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaWRUb2tlbjogSWRUb2tlbjtcbiAgICAgICAgdmFyIGNsaWVudEluZm86IHN0cmluZyA9IFwiXCI7XG4gICAgICAgIGlmICh0b2tlblJlc3BvbnNlLnBhcmFtZXRlcnMuaGFzT3duUHJvcGVydHkoQ29uc3RhbnRzLmFjY2Vzc1Rva2VuKSkge1xuICAgICAgICAgIHRoaXMuX2xvZ2dlci5pbmZvKFwiRnJhZ21lbnQgaGFzIGFjY2VzcyB0b2tlblwiKTtcbiAgICAgICAgICB0aGlzLl9hY3F1aXJlVG9rZW5JblByb2dyZXNzID0gZmFsc2U7XG4gICAgICAgICAgbGV0IHVzZXI6IFVzZXI7XG4gICAgICAgICAgaWYgKHRva2VuUmVzcG9uc2UucGFyYW1ldGVycy5oYXNPd25Qcm9wZXJ0eShDb25zdGFudHMuaWRUb2tlbikpIHtcbiAgICAgICAgICAgIGlkVG9rZW4gPSBuZXcgSWRUb2tlbih0b2tlblJlc3BvbnNlLnBhcmFtZXRlcnNbQ29uc3RhbnRzLmlkVG9rZW5dKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWRUb2tlbiA9IG5ldyBJZFRva2VuKHRoaXMuX2NhY2hlU3RvcmFnZS5nZXRJdGVtKENvbnN0YW50cy5pZFRva2VuS2V5KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgICBhdXRob3JpdHlLZXkgPSBDb25zdGFudHMuYXV0aG9yaXR5ICsgQ29uc3RhbnRzLnJlc291cmNlRGVsaW1ldGVyICsgdG9rZW5SZXNwb25zZS5zdGF0ZVJlc3BvbnNlO1xuICAgICAgICAgICAgbGV0IGF1dGhvcml0eTogc3RyaW5nID0gdGhpcy5fY2FjaGVTdG9yYWdlLmdldEl0ZW0oYXV0aG9yaXR5S2V5LCB0aGlzLnN0b3JlQXV0aFN0YXRlSW5Db29raWUpO1xuICAgICAgICAgICAgaWYgKCFVdGlscy5pc0VtcHR5KGF1dGhvcml0eSkpIHtcbiAgICAgICAgICAgICAgICBhdXRob3JpdHkgPSBVdGlscy5yZXBsYWNlRmlyc3RQYXRoKGF1dGhvcml0eSwgaWRUb2tlbi50ZW5hbnRJZCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRva2VuUmVzcG9uc2UucGFyYW1ldGVycy5oYXNPd25Qcm9wZXJ0eShDb25zdGFudHMuY2xpZW50SW5mbykpIHtcbiAgICAgICAgICAgIGNsaWVudEluZm8gPSB0b2tlblJlc3BvbnNlLnBhcmFtZXRlcnNbQ29uc3RhbnRzLmNsaWVudEluZm9dO1xuICAgICAgICAgICAgdXNlciA9IFVzZXIuY3JlYXRlVXNlcihpZFRva2VuLCBuZXcgQ2xpZW50SW5mbyhjbGllbnRJbmZvKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2xvZ2dlci53YXJuaW5nKFwiQ2xpZW50SW5mbyBub3QgcmVjZWl2ZWQgaW4gdGhlIHJlc3BvbnNlIGZyb20gQUFEXCIpO1xuICAgICAgICAgICAgdXNlciA9IFVzZXIuY3JlYXRlVXNlcihpZFRva2VuLCBuZXcgQ2xpZW50SW5mbyhjbGllbnRJbmZvKSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYWNxdWlyZVRva2VuVXNlcktleSA9IENvbnN0YW50cy5hY3F1aXJlVG9rZW5Vc2VyICsgQ29uc3RhbnRzLnJlc291cmNlRGVsaW1ldGVyICsgdXNlci51c2VySWRlbnRpZmllciArIENvbnN0YW50cy5yZXNvdXJjZURlbGltZXRlciArIHRva2VuUmVzcG9uc2Uuc3RhdGVSZXNwb25zZTtcbiAgICAgICAgICAgIHZhciBhY3F1aXJlVG9rZW5Vc2VyS2V5X25vdXNlciA9IENvbnN0YW50cy5hY3F1aXJlVG9rZW5Vc2VyICsgQ29uc3RhbnRzLnJlc291cmNlRGVsaW1ldGVyICsgQ29uc3RhbnRzLm5vX3VzZXIgKyBDb25zdGFudHMucmVzb3VyY2VEZWxpbWV0ZXIgKyB0b2tlblJlc3BvbnNlLnN0YXRlUmVzcG9uc2U7XG4gICAgICAgICAgICBsZXQgY2FjaGVkVXNlcjogc3RyaW5nID0gdGhpcy5fY2FjaGVTdG9yYWdlLmdldEl0ZW0oYWNxdWlyZVRva2VuVXNlcktleSk7XG4gICAgICAgICAgICBsZXQgYWNxdWlyZVRva2VuVXNlcjogVXNlcjtcbiAgICAgICAgICAgIGlmICghVXRpbHMuaXNFbXB0eShjYWNoZWRVc2VyKSkge1xuICAgICAgICAgICAgICAgIGFjcXVpcmVUb2tlblVzZXIgPSBKU09OLnBhcnNlKGNhY2hlZFVzZXIpO1xuICAgICAgICAgICAgaWYgKHVzZXIgJiYgYWNxdWlyZVRva2VuVXNlciAmJiBVdGlscy5jb21wYXJlT2JqZWN0cyh1c2VyLCBhY3F1aXJlVG9rZW5Vc2VyKSkge1xuICAgICAgICAgICAgICB0aGlzLnNhdmVBY2Nlc3NUb2tlbihhdXRob3JpdHksIHRva2VuUmVzcG9uc2UsIHVzZXIsIGNsaWVudEluZm8sIGlkVG9rZW4pO1xuICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIuaW5mbyhcbiAgICAgICAgICAgICAgICBcIlRoZSB1c2VyIG9iamVjdCByZWNlaXZlZCBpbiB0aGUgcmVzcG9uc2UgaXMgdGhlIHNhbWUgYXMgdGhlIG9uZSBwYXNzZWQgaW4gdGhlIGFjcXVpcmVUb2tlbiByZXF1ZXN0XCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLndhcm5pbmcoXG4gICAgICAgICAgICAgICAgXCJUaGUgdXNlciBvYmplY3QgY3JlYXRlZCBmcm9tIHRoZSByZXNwb25zZSBpcyBub3QgdGhlIHNhbWUgYXMgdGhlIG9uZSBwYXNzZWQgaW4gdGhlIGFjcXVpcmVUb2tlbiByZXF1ZXN0XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoIVV0aWxzLmlzRW1wdHkodGhpcy5fY2FjaGVTdG9yYWdlLmdldEl0ZW0oYWNxdWlyZVRva2VuVXNlcktleV9ub3VzZXIpKSkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlQWNjZXNzVG9rZW4oYXV0aG9yaXR5LCB0b2tlblJlc3BvbnNlLCB1c2VyLCBjbGllbnRJbmZvLCBpZFRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodG9rZW5SZXNwb25zZS5wYXJhbWV0ZXJzLmhhc093blByb3BlcnR5KENvbnN0YW50cy5pZFRva2VuKSkge1xuICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLmluZm8oXCJGcmFnbWVudCBoYXMgaWQgdG9rZW5cIik7XG4gICAgICAgICAgICB0aGlzLl9sb2dpbkluUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICAgICAgICAgIGlkVG9rZW4gPSBuZXcgSWRUb2tlbih0b2tlblJlc3BvbnNlLnBhcmFtZXRlcnNbQ29uc3RhbnRzLmlkVG9rZW5dKTtcbiAgICAgICAgICAgIGlmICh0b2tlblJlc3BvbnNlLnBhcmFtZXRlcnMuaGFzT3duUHJvcGVydHkoQ29uc3RhbnRzLmNsaWVudEluZm8pKSB7XG4gICAgICAgICAgICAgIGNsaWVudEluZm8gPSB0b2tlblJlc3BvbnNlLnBhcmFtZXRlcnNbQ29uc3RhbnRzLmNsaWVudEluZm9dO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5fbG9nZ2VyLndhcm5pbmcoXCJDbGllbnRJbmZvIG5vdCByZWNlaXZlZCBpbiB0aGUgcmVzcG9uc2UgZnJvbSBBQURcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF1dGhvcml0eUtleSA9IENvbnN0YW50cy5hdXRob3JpdHkgKyBDb25zdGFudHMucmVzb3VyY2VEZWxpbWV0ZXIgKyB0b2tlblJlc3BvbnNlLnN0YXRlUmVzcG9uc2U7XG4gICAgICAgICAgICBsZXQgYXV0aG9yaXR5OiBzdHJpbmcgPSB0aGlzLl9jYWNoZVN0b3JhZ2UuZ2V0SXRlbShhdXRob3JpdHlLZXksIHRoaXMuc3RvcmVBdXRoU3RhdGVJbkNvb2tpZSk7XG4gICAgICAgICAgICBpZiAoIVV0aWxzLmlzRW1wdHkoYXV0aG9yaXR5KSkge1xuICAgICAgICAgICAgICBhdXRob3JpdHkgPSBVdGlscy5yZXBsYWNlRmlyc3RQYXRoKGF1dGhvcml0eSwgaWRUb2tlbi50ZW5hbnRJZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX3VzZXIgPSBVc2VyLmNyZWF0ZVVzZXIoaWRUb2tlbiwgbmV3IENsaWVudEluZm8oY2xpZW50SW5mbykpO1xuICAgICAgICAgICAgaWYgKGlkVG9rZW4gJiYgaWRUb2tlbi5ub25jZSkge1xuICAgICAgICAgICAgICBpZiAoaWRUb2tlbi5ub25jZSAhPT0gdGhpcy5fY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLm5vbmNlSWRUb2tlbiwgdGhpcy5zdG9yZUF1dGhTdGF0ZUluQ29va2llKSkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5fdXNlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubG9naW5FcnJvciwgXCJOb25jZSBNaXNtYXRjaC4gRXhwZWN0ZWQgTm9uY2U6IFwiICsgdGhpcy5fY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLm5vbmNlSWRUb2tlbiwgdGhpcy5zdG9yZUF1dGhTdGF0ZUluQ29va2llKSArIFwiLFwiICsgXCJBY3R1YWwgTm9uY2U6IFwiICsgaWRUb2tlbi5ub25jZSk7XG4gICAgICAgICAgICAgICAgICB0aGlzLl9sb2dnZXIuZXJyb3IoXCJOb25jZSBNaXNtYXRjaC5FeHBlY3RlZCBOb25jZTogXCIgKyB0aGlzLl9jYWNoZVN0b3JhZ2UuZ2V0SXRlbShDb25zdGFudHMubm9uY2VJZFRva2VuLCB0aGlzLnN0b3JlQXV0aFN0YXRlSW5Db29raWUpICsgXCIsXCIgKyBcIkFjdHVhbCBOb25jZTogXCIgKyBpZFRva2VuLm5vbmNlKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMuaWRUb2tlbktleSwgdG9rZW5SZXNwb25zZS5wYXJhbWV0ZXJzW0NvbnN0YW50cy5pZFRva2VuXSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLm1zYWxDbGllbnRJbmZvLCBjbGllbnRJbmZvKTtcblxuICAgICAgICAgICAgICAgIC8vIFNhdmUgaWRUb2tlbiBhcyBhY2Nlc3MgdG9rZW4gZm9yIGFwcCBpdHNlbGZcbiAgICAgICAgICAgICAgICB0aGlzLnNhdmVBY2Nlc3NUb2tlbihhdXRob3JpdHksIHRva2VuUmVzcG9uc2UsIHRoaXMuX3VzZXIsIGNsaWVudEluZm8sIGlkVG9rZW4pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBhdXRob3JpdHlLZXkgPSB0b2tlblJlc3BvbnNlLnN0YXRlUmVzcG9uc2U7XG4gICAgICAgICAgICAgIGFjcXVpcmVUb2tlblVzZXJLZXkgPSB0b2tlblJlc3BvbnNlLnN0YXRlUmVzcG9uc2U7XG4gICAgICAgICAgICAgIHRoaXMuX2xvZ2dlci5lcnJvcihcIkludmFsaWQgaWRfdG9rZW4gcmVjZWl2ZWQgaW4gdGhlIHJlc3BvbnNlXCIpO1xuICAgICAgICAgICAgICB0b2tlblJlc3BvbnNlLnBhcmFtZXRlcnNbXCJlcnJvclwiXSA9IFwiaW52YWxpZCBpZFRva2VuXCI7XG4gICAgICAgICAgICAgIHRva2VuUmVzcG9uc2UucGFyYW1ldGVyc1tcImVycm9yX2Rlc2NyaXB0aW9uXCJdID0gXCJJbnZhbGlkIGlkVG9rZW4uIGlkVG9rZW46IFwiICsgdG9rZW5SZXNwb25zZS5wYXJhbWV0ZXJzW0NvbnN0YW50cy5pZFRva2VuXTtcbiAgICAgICAgICAgICAgdGhpcy5fY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLm1zYWxFcnJvciwgXCJpbnZhbGlkIGlkVG9rZW5cIik7XG4gICAgICAgICAgICAgIHRoaXMuX2NhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsRXJyb3JEZXNjcmlwdGlvbiwgXCJJbnZhbGlkIGlkVG9rZW4uIGlkVG9rZW46IFwiICsgdG9rZW5SZXNwb25zZS5wYXJhbWV0ZXJzW0NvbnN0YW50cy5pZFRva2VuXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF1dGhvcml0eUtleSA9IHRva2VuUmVzcG9uc2Uuc3RhdGVSZXNwb25zZTtcbiAgICAgICAgYWNxdWlyZVRva2VuVXNlcktleSA9IHRva2VuUmVzcG9uc2Uuc3RhdGVSZXNwb25zZTtcbiAgICAgICAgdGhpcy5fbG9nZ2VyLmVycm9yKFwiU3RhdGUgTWlzbWF0Y2guRXhwZWN0ZWQgU3RhdGU6IFwiICsgdGhpcy5fY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLnN0YXRlTG9naW4sIHRoaXMuc3RvcmVBdXRoU3RhdGVJbkNvb2tpZSkgKyBcIixcIiArIFwiQWN0dWFsIFN0YXRlOiBcIiArIHRva2VuUmVzcG9uc2Uuc3RhdGVSZXNwb25zZSk7XG4gICAgICAgIHRva2VuUmVzcG9uc2UucGFyYW1ldGVyc1tcImVycm9yXCJdID0gXCJJbnZhbGlkX3N0YXRlXCI7XG4gICAgICAgIHRva2VuUmVzcG9uc2UucGFyYW1ldGVyc1tcImVycm9yX2Rlc2NyaXB0aW9uXCJdID0gXCJJbnZhbGlkX3N0YXRlLiBzdGF0ZTogXCIgKyB0b2tlblJlc3BvbnNlLnN0YXRlUmVzcG9uc2U7XG4gICAgICAgIHRoaXMuX2NhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsRXJyb3IsIFwiSW52YWxpZF9zdGF0ZVwiKTtcbiAgICAgICAgdGhpcy5fY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLm1zYWxFcnJvckRlc2NyaXB0aW9uLCBcIkludmFsaWRfc3RhdGUuIHN0YXRlOiBcIiArIHRva2VuUmVzcG9uc2Uuc3RhdGVSZXNwb25zZSk7XG4gICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLl9jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMucmVuZXdTdGF0dXMgKyB0b2tlblJlc3BvbnNlLnN0YXRlUmVzcG9uc2UsIENvbnN0YW50cy50b2tlblJlbmV3U3RhdHVzQ29tcGxldGVkKTtcbiAgICAgIHRoaXMuX2NhY2hlU3RvcmFnZS5yZW1vdmVBY3F1aXJlVG9rZW5FbnRyaWVzKGF1dGhvcml0eUtleSwgYWNxdWlyZVRva2VuVXNlcktleSk7XG4gICAgICAvL3RoaXMgaXMgcmVxdWlyZWQgaWYgbmF2aWdhdGVUb0xvZ2luUmVxdWVzdFVybD1mYWxzZVxuICAgICAgaWYgKHRoaXMuc3RvcmVBdXRoU3RhdGVJbkNvb2tpZSkge1xuICAgICAgICAgIHRoaXMuX2NhY2hlU3RvcmFnZS5zZXRJdGVtQ29va2llKGF1dGhvcml0eUtleSwgXCJcIiwgLTEpO1xuICAgICAgICAgIHRoaXMuX2NhY2hlU3RvcmFnZS5jbGVhckNvb2tpZSgpO1xuICAgICAgfVxuICB9XG4gIC8qIHRzbGludDplbmFibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSByZWRpcmVjdCByZXNwb25zZSBpcyByZWNlaXZlZCBmcm9tIHRoZSBTVFMuIEluIGNhc2Ugb2YgcmVkaXJlY3QsIHRoZSB1cmwgZnJhZ21lbnQgaGFzIGVpdGhlciBpZF90b2tlbiwgYWNjZXNzX3Rva2VuIG9yIGVycm9yLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gaGFzaCAtIEhhc2ggcGFzc2VkIGZyb20gcmVkaXJlY3QgcGFnZS5cbiAgICogQHJldHVybnMge0Jvb2xlYW59IC0gdHJ1ZSBpZiByZXNwb25zZSBjb250YWlucyBpZF90b2tlbiwgYWNjZXNzX3Rva2VuIG9yIGVycm9yLCBmYWxzZSBvdGhlcndpc2UuXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIGlzQ2FsbGJhY2soaGFzaDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaGFzaCA9IHRoaXMuZ2V0SGFzaChoYXNoKTtcbiAgICBjb25zdCBwYXJhbWV0ZXJzID0gVXRpbHMuZGVzZXJpYWxpemUoaGFzaCk7XG4gICAgcmV0dXJuIChcbiAgICAgIHBhcmFtZXRlcnMuaGFzT3duUHJvcGVydHkoQ29uc3RhbnRzLmVycm9yRGVzY3JpcHRpb24pIHx8XG4gICAgICBwYXJhbWV0ZXJzLmhhc093blByb3BlcnR5KENvbnN0YW50cy5lcnJvcikgfHxcbiAgICAgIHBhcmFtZXRlcnMuaGFzT3duUHJvcGVydHkoQ29uc3RhbnRzLmFjY2Vzc1Rva2VuKSB8fFxuICAgICAgcGFyYW1ldGVycy5oYXNPd25Qcm9wZXJ0eShDb25zdGFudHMuaWRUb2tlbilcblxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYW5jaG9yIHBhcnQoIykgb2YgdGhlIFVSTFxuICAgKiBAaWdub3JlXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHByaXZhdGUgZ2V0SGFzaChoYXNoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmIChoYXNoLmluZGV4T2YoXCIjL1wiKSA+IC0xKSB7XG4gICAgICBoYXNoID0gaGFzaC5zdWJzdHJpbmcoaGFzaC5pbmRleE9mKFwiIy9cIikgKyAyKTtcbiAgICB9IGVsc2UgaWYgKGhhc2guaW5kZXhPZihcIiNcIikgPiAtMSkge1xuICAgICAgaGFzaCA9IGhhc2guc3Vic3RyaW5nKDEpO1xuICAgIH1cblxuICAgIHJldHVybiBoYXNoO1xuICB9XG5cbiAgLyoqXG4gICAgKiBDcmVhdGVzIGEgcmVxdWVzdEluZm8gb2JqZWN0IGZyb20gdGhlIFVSTCBmcmFnbWVudCBhbmQgcmV0dXJucyBpdC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBoYXNoICAtICBIYXNoIHBhc3NlZCBmcm9tIHJlZGlyZWN0IHBhZ2VcbiAgICAqIEByZXR1cm5zIHtUb2tlblJlc3BvbnNlfSBhbiBvYmplY3QgY3JlYXRlZCBmcm9tIHRoZSByZWRpcmVjdCByZXNwb25zZSBmcm9tIEFBRCBjb21wcmlzaW5nIG9mIHRoZSBrZXlzIC0gcGFyYW1ldGVycywgcmVxdWVzdFR5cGUsIHN0YXRlTWF0Y2gsIHN0YXRlUmVzcG9uc2UgYW5kIHZhbGlkLlxuICAgICogQGlnbm9yZVxuICAgICogQGhpZGRlblxuICAgICovXG4gIHByb3RlY3RlZCBnZXRSZXF1ZXN0SW5mbyhoYXNoOiBzdHJpbmcpOiBUb2tlblJlc3BvbnNlIHtcbiAgICBoYXNoID0gdGhpcy5nZXRIYXNoKGhhc2gpO1xuICAgIGNvbnN0IHBhcmFtZXRlcnMgPSBVdGlscy5kZXNlcmlhbGl6ZShoYXNoKTtcbiAgICBjb25zdCB0b2tlblJlc3BvbnNlID0gbmV3IFRva2VuUmVzcG9uc2UoKTtcbiAgICBpZiAocGFyYW1ldGVycykge1xuICAgICAgdG9rZW5SZXNwb25zZS5wYXJhbWV0ZXJzID0gcGFyYW1ldGVycztcbiAgICAgIGlmIChwYXJhbWV0ZXJzLmhhc093blByb3BlcnR5KENvbnN0YW50cy5lcnJvckRlc2NyaXB0aW9uKSB8fFxuICAgICAgICBwYXJhbWV0ZXJzLmhhc093blByb3BlcnR5KENvbnN0YW50cy5lcnJvcikgfHxcbiAgICAgICAgcGFyYW1ldGVycy5oYXNPd25Qcm9wZXJ0eShDb25zdGFudHMuYWNjZXNzVG9rZW4pIHx8XG4gICAgICAgIHBhcmFtZXRlcnMuaGFzT3duUHJvcGVydHkoQ29uc3RhbnRzLmlkVG9rZW4pKSB7XG4gICAgICAgIHRva2VuUmVzcG9uc2UudmFsaWQgPSB0cnVlO1xuICAgICAgICAvLyB3aGljaCBjYWxsXG4gICAgICAgIGxldCBzdGF0ZVJlc3BvbnNlOiBzdHJpbmc7XG4gICAgICAgIGlmIChwYXJhbWV0ZXJzLmhhc093blByb3BlcnR5KFwic3RhdGVcIikpIHtcbiAgICAgICAgICAgIHN0YXRlUmVzcG9uc2UgPSBwYXJhbWV0ZXJzLnN0YXRlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRva2VuUmVzcG9uc2U7XG4gICAgICAgIH1cblxuICAgICAgICB0b2tlblJlc3BvbnNlLnN0YXRlUmVzcG9uc2UgPSBzdGF0ZVJlc3BvbnNlO1xuICAgICAgICAvLyBhc3luYyBjYWxscyBjYW4gZmlyZSBpZnJhbWUgYW5kIGxvZ2luIHJlcXVlc3QgYXQgdGhlIHNhbWUgdGltZSBpZiBkZXZlbG9wZXIgZG9lcyBub3QgdXNlIHRoZSBBUEkgYXMgZXhwZWN0ZWRcbiAgICAgICAgLy8gaW5jb21pbmcgY2FsbGJhY2sgbmVlZHMgdG8gYmUgbG9va2VkIHVwIHRvIGZpbmQgdGhlIHJlcXVlc3QgdHlwZVxuICAgICAgICBpZiAoc3RhdGVSZXNwb25zZSA9PT0gdGhpcy5fY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLnN0YXRlTG9naW4sIHRoaXMuc3RvcmVBdXRoU3RhdGVJbkNvb2tpZSkgfHwgc3RhdGVSZXNwb25zZSA9PT0gdGhpcy5fc2lsZW50QXV0aGVudGljYXRpb25TdGF0ZSkgeyAvLyBsb2dpblJlZGlyZWN0XG4gICAgICAgICAgICB0b2tlblJlc3BvbnNlLnJlcXVlc3RUeXBlID0gQ29uc3RhbnRzLmxvZ2luO1xuICAgICAgICAgICAgdG9rZW5SZXNwb25zZS5zdGF0ZU1hdGNoID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybiB0b2tlblJlc3BvbnNlO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlUmVzcG9uc2UgPT09IHRoaXMuX2NhY2hlU3RvcmFnZS5nZXRJdGVtKENvbnN0YW50cy5zdGF0ZUFjcXVpcmVUb2tlbiwgdGhpcy5zdG9yZUF1dGhTdGF0ZUluQ29va2llKSkgeyAvL2FjcXVpcmVUb2tlblJlZGlyZWN0XG4gICAgICAgICAgICB0b2tlblJlc3BvbnNlLnJlcXVlc3RUeXBlID0gQ29uc3RhbnRzLnJlbmV3VG9rZW47XG4gICAgICAgICAgICB0b2tlblJlc3BvbnNlLnN0YXRlTWF0Y2ggPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuIHRva2VuUmVzcG9uc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBleHRlcm5hbCBhcGkgcmVxdWVzdHMgbWF5IGhhdmUgbWFueSByZW5ld3Rva2VuIHJlcXVlc3RzIGZvciBkaWZmZXJlbnQgcmVzb3VyY2VcbiAgICAgICAgaWYgKCF0b2tlblJlc3BvbnNlLnN0YXRlTWF0Y2gpIHtcbiAgICAgICAgICB0b2tlblJlc3BvbnNlLnJlcXVlc3RUeXBlID0gd2luZG93LnJlcXVlc3RUeXBlO1xuICAgICAgICAgIGNvbnN0IHN0YXRlc0luUGFyZW50Q29udGV4dCA9IHdpbmRvdy5yZW5ld1N0YXRlcztcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0YXRlc0luUGFyZW50Q29udGV4dC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHN0YXRlc0luUGFyZW50Q29udGV4dFtpXSA9PT0gdG9rZW5SZXNwb25zZS5zdGF0ZVJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgIHRva2VuUmVzcG9uc2Uuc3RhdGVNYXRjaCA9IHRydWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdG9rZW5SZXNwb25zZTtcbiAgfVxuXG4gIC8qKlxuICAgICogRXh0cmFjdHMgc2NvcGUgdmFsdWUgZnJvbSB0aGUgc3RhdGUgc2VudCB3aXRoIHRoZSBhdXRoZW50aWNhdGlvbiByZXF1ZXN0LlxuICAgICogQHJldHVybnMge3N0cmluZ30gc2NvcGUuXG4gICAgKiBAaWdub3JlXG4gICAgKiBAaGlkZGVuXG4gICAgKi9cbiAgcHJpdmF0ZSBnZXRTY29wZUZyb21TdGF0ZShzdGF0ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoc3RhdGUpIHtcbiAgICAgIGNvbnN0IHNwbGl0SW5kZXggPSBzdGF0ZS5pbmRleE9mKFwifFwiKTtcbiAgICAgIGlmIChzcGxpdEluZGV4ID4gLTEgJiYgc3BsaXRJbmRleCArIDEgPCBzdGF0ZS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLnN1YnN0cmluZyhzcGxpdEluZGV4ICsgMSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBcIlwiO1xuICB9XG5cbiAgICAvKipcbiAgICAqIEV4dHJhY3RzIHN0YXRlIHZhbHVlIGZyb20gdGhlIHVzZXJTdGF0ZSBzZW50IHdpdGggdGhlIGF1dGhlbnRpY2F0aW9uIHJlcXVlc3QuXG4gICAgKiBAcmV0dXJucyB7c3RyaW5nfSBzY29wZS5cbiAgICAqIEBpZ25vcmVcbiAgICAqIEBoaWRkZW5cbiAgICAqL1xuICAgIGdldFVzZXJTdGF0ZSAoc3RhdGU6IHN0cmluZykge1xuICAgICAgICBpZiAoc3RhdGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHNwbGl0SW5kZXggPSBzdGF0ZS5pbmRleE9mKFwifFwiKTtcbiAgICAgICAgICAgIGlmIChzcGxpdEluZGV4ID4gLTEgJiYgc3BsaXRJbmRleCArIDEgPCBzdGF0ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGUuc3Vic3RyaW5nKHNwbGl0SW5kZXggKyAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG5cblxuICAvKipcbiAgICAqIFJldHVybnMgd2hldGhlciBjdXJyZW50IHdpbmRvdyBpcyBpbiBpZnJhbSBmb3IgdG9rZW4gcmVuZXdhbFxuICAgICogQGlnbm9yZVxuICAgICogQGhpZGRlblxuICAgICovXG4gIHByaXZhdGUgaXNJbklmcmFtZSgpIHtcbiAgICAgIHJldHVybiB3aW5kb3cucGFyZW50ICE9PSB3aW5kb3c7XG4gIH1cblxuICBsb2dpbkluUHJvZ3Jlc3MoKTogYm9vbGVhbiB7XG4gICAgICB2YXIgcGVuZGluZ0NhbGxiYWNrID0gdGhpcy5fY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLnVybEhhc2gpO1xuICAgICAgaWYgKHBlbmRpbmdDYWxsYmFjaykge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX2xvZ2luSW5Qcm9ncmVzcztcbiAgfVxuXG4gcHJpdmF0ZSBnZXRIb3N0RnJvbVVyaSh1cmk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAvLyByZW1vdmUgaHR0cDovLyBvciBodHRwczovLyBmcm9tIHVyaVxuICAgICAgdmFyIGV4dHJhY3RlZFVyaSA9IFN0cmluZyh1cmkpLnJlcGxhY2UoL14oaHR0cHM/OilcXC9cXC8vLCBcIlwiKTtcbiAgICAgIGV4dHJhY3RlZFVyaSA9IGV4dHJhY3RlZFVyaS5zcGxpdChcIi9cIilbMF07XG4gICAgICByZXR1cm4gZXh0cmFjdGVkVXJpO1xuIH1cblxuICBwcm90ZWN0ZWQgZ2V0U2NvcGVzRm9yRW5kcG9pbnQoZW5kcG9pbnQ6IHN0cmluZykgOiBBcnJheTxzdHJpbmc+IHtcbiAgICAgIC8vIGlmIHVzZXIgc3BlY2lmaWVkIGxpc3Qgb2YgdW5wcm90ZWN0ZWRSZXNvdXJjZXMsIG5vIG5lZWQgdG8gc2VuZCB0b2tlbiB0byB0aGVzZSBlbmRwb2ludHMsIHJldHVybiBudWxsLlxuICAgICAgaWYgKHRoaXMuX3VucHJvdGVjdGVkUmVzb3VyY2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX3VucHJvdGVjdGVkUmVzb3VyY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIGlmIChlbmRwb2ludC5pbmRleE9mKHRoaXMuX3VucHJvdGVjdGVkUmVzb3VyY2VzW2ldKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX3Byb3RlY3RlZFJlc291cmNlTWFwLnNpemUgPiAwKSB7XG4gICAgICAgICAgZm9yIChsZXQga2V5IG9mIEFycmF5LmZyb20odGhpcy5fcHJvdGVjdGVkUmVzb3VyY2VNYXAua2V5cygpKSkge1xuICAgICAgICAgICAgICAvLyBjb25maWdFbmRwb2ludCBpcyBsaWtlIC9hcGkvVG9kbyByZXF1ZXN0ZWQgZW5kcG9pbnQgY2FuIGJlIC9hcGkvVG9kby8xXG4gICAgICAgICAgICAgIGlmIChlbmRwb2ludC5pbmRleE9mKGtleSkgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3Byb3RlY3RlZFJlc291cmNlTWFwLmdldChrZXkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBkZWZhdWx0IHJlc291cmNlIHdpbGwgYmUgY2xpZW50aWQgaWYgbm90aGluZyBzcGVjaWZpZWRcbiAgICAgIC8vIEFwcCB3aWxsIHVzZSBpZHRva2VuIGZvciBjYWxscyB0byBpdHNlbGZcbiAgICAgIC8vIGNoZWNrIGlmIGl0J3Mgc3RhcmluZyBmcm9tIGh0dHAgb3IgaHR0cHMsIG5lZWRzIHRvIG1hdGNoIHdpdGggYXBwIGhvc3RcbiAgICAgIGlmIChlbmRwb2ludC5pbmRleE9mKFwiaHR0cDovL1wiKSA+IC0xIHx8IGVuZHBvaW50LmluZGV4T2YoXCJodHRwczovL1wiKSA+IC0xKSB7XG4gICAgICAgICAgaWYgKHRoaXMuZ2V0SG9zdEZyb21VcmkoZW5kcG9pbnQpID09PSB0aGlzLmdldEhvc3RGcm9tVXJpKHRoaXMuZ2V0UmVkaXJlY3RVcmkoKSkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG5ldyBBcnJheTxzdHJpbmc+KHRoaXMuY2xpZW50SWQpO1xuICAgICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAvLyBpbiBhbmd1bGFyIGxldmVsLCB0aGUgdXJsIGZvciAkaHR0cCBpbnRlcmNlcHRvciBjYWxsIGNvdWxkIGJlIHJlbGF0aXZlIHVybCxcbiAgICAgIC8vIGlmIGl0J3MgcmVsYXRpdmUgY2FsbCwgd2UnbGwgdHJlYXQgaXQgYXMgYXBwIGJhY2tlbmQgY2FsbC5cbiAgICAgICAgICByZXR1cm4gbmV3IEFycmF5PHN0cmluZz4odGhpcy5jbGllbnRJZCk7XG4gICAgICB9XG5cbiAgICAgIC8vIGlmIG5vdCB0aGUgYXBwJ3Mgb3duIGJhY2tlbmQgb3Igbm90IGEgZG9tYWluIGxpc3RlZCBpbiB0aGUgZW5kcG9pbnRzIHN0cnVjdHVyZVxuICAgICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvL1RoZXNlIEFQSVMgYXJlIGV4cG9zZWQgZm9yIG1zYWxBbmd1bGFyIHdyYXBwZXIgb25seVxuICAgIHByb3RlY3RlZCBzZXRsb2dpbkluUHJvZ3Jlc3MobG9naW5JblByb2dyZXNzIDogYm9vbGVhbikge1xuICAgICAgICB0aGlzLl9sb2dpbkluUHJvZ3Jlc3MgPSBsb2dpbkluUHJvZ3Jlc3M7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGdldEFjcXVpcmVUb2tlbkluUHJvZ3Jlc3MoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hY3F1aXJlVG9rZW5JblByb2dyZXNzO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBzZXRBY3F1aXJlVG9rZW5JblByb2dyZXNzKGFjcXVpcmVUb2tlbkluUHJvZ3Jlc3MgOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMuX2FjcXVpcmVUb2tlbkluUHJvZ3Jlc3MgPSBhY3F1aXJlVG9rZW5JblByb2dyZXNzO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBnZXRMb2dnZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9sb2dnZXI7XG4gICAgfVxufVxuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvblxuICogIEFsbCBSaWdodHMgUmVzZXJ2ZWRcbiAqICBNSVQgTGljZW5zZVxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpc1xuICogc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlICdTb2Z0d2FyZScpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZVxuICogd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LFxuICogbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuICogcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmdcbiAqIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbiAqIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICogRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTXG4gKiBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksXG4gKiBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUXG4gKiBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogQGhpZGRlblxuICovXG5leHBvcnQgY2xhc3MgVG9rZW5SZXNwb25zZSB7XG4gIHZhbGlkOiBib29sZWFuO1xuICBwYXJhbWV0ZXJzOiBPYmplY3Q7XG4gIHN0YXRlTWF0Y2g6IGJvb2xlYW47XG4gIHN0YXRlUmVzcG9uc2U6IHN0cmluZztcbiAgcmVxdWVzdFR5cGU6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnZhbGlkID0gZmFsc2U7XG4gICAgdGhpcy5wYXJhbWV0ZXJzID0ge307XG4gICAgdGhpcy5zdGF0ZU1hdGNoID0gZmFsc2U7XG4gICAgdGhpcy5zdGF0ZVJlc3BvbnNlID0gXCJcIjtcbiAgICB0aGlzLnJlcXVlc3RUeXBlID0gXCJ1bmtub3duXCI7XG4gIH1cbn1cbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb25cbiAqICBBbGwgUmlnaHRzIFJlc2VydmVkXG4gKiAgTUlUIExpY2Vuc2VcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXNcbiAqIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmVcbiAqIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSxcbiAqIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbiAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nXG4gKiBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG4gKiBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbiAqIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SU1xuICogT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLFxuICogV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVFxuICogT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG5pbXBvcnQgeyBDbGllbnRJbmZvIH0gZnJvbSBcIi4vQ2xpZW50SW5mb1wiO1xuaW1wb3J0IHsgSWRUb2tlbiB9IGZyb20gXCIuL0lkVG9rZW5cIjtcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSBcIi4vVXRpbHNcIjtcblxuZXhwb3J0IGNsYXNzIFVzZXIge1xuXG4gICAgZGlzcGxheWFibGVJZDogc3RyaW5nO1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBpZGVudGl0eVByb3ZpZGVyOiBzdHJpbmc7XG4gICAgdXNlcklkZW50aWZpZXI6IHN0cmluZztcbiAgICBpZFRva2VuOiBPYmplY3Q7XG4gICAgc2lkOiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBAaGlkZGVuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZGlzcGxheWFibGVJZDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIGlkZW50aXR5UHJvdmlkZXI6IHN0cmluZywgdXNlcklkZW50aWZpZXI6IHN0cmluZywgaWRUb2tlbjogT2JqZWN0LCBzaWQ6IHN0cmluZykge1xuICAgICAgICB0aGlzLmRpc3BsYXlhYmxlSWQgPSBkaXNwbGF5YWJsZUlkO1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmlkZW50aXR5UHJvdmlkZXIgPSBpZGVudGl0eVByb3ZpZGVyO1xuICAgICAgICB0aGlzLnVzZXJJZGVudGlmaWVyID0gdXNlcklkZW50aWZpZXI7XG4gICAgICAgIHRoaXMuaWRUb2tlbiA9IGlkVG9rZW47XG4gICAgICAgIHRoaXMuc2lkID0gc2lkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBoaWRkZW5cbiAgICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlVXNlcihpZFRva2VuOiBJZFRva2VuLCBjbGllbnRJbmZvOiBDbGllbnRJbmZvKTogVXNlciB7XG4gICAgICAgIGxldCB1aWQ6IHN0cmluZztcbiAgICAgICAgbGV0IHV0aWQ6IHN0cmluZztcbiAgICAgICAgaWYgKCFjbGllbnRJbmZvKSB7XG4gICAgICAgICAgICB1aWQgPSBcIlwiO1xuICAgICAgICAgICAgdXRpZCA9IFwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB1aWQgPSBjbGllbnRJbmZvLnVpZDtcbiAgICAgICAgICAgIHV0aWQgPSBjbGllbnRJbmZvLnV0aWQ7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1c2VySWRlbnRpZmllciA9IFV0aWxzLmJhc2U2NEVuY29kZVN0cmluZ1VybFNhZmUodWlkKSArIFwiLlwiICsgVXRpbHMuYmFzZTY0RW5jb2RlU3RyaW5nVXJsU2FmZSh1dGlkKTtcbiAgICAgICAgcmV0dXJuIG5ldyBVc2VyKGlkVG9rZW4ucHJlZmVycmVkTmFtZSwgaWRUb2tlbi5uYW1lLCBpZFRva2VuLmlzc3VlciwgdXNlcklkZW50aWZpZXIsIGlkVG9rZW4uZGVjb2RlZElkVG9rZW4sIGlkVG9rZW4uc2lkKTtcbiAgICB9XG59XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uXG4gKiAgQWxsIFJpZ2h0cyBSZXNlcnZlZFxuICogIE1JVCBMaWNlbnNlXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZiB0aGlzXG4gKiBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlXG4gKiB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksXG4gKiBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZ1xuICogY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxuICogaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsXG4gKiBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlNcbiAqIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSxcbiAqIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVRcbiAqIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKi9cblxuaW1wb3J0IHsgQXV0aG9yaXR5LCBBdXRob3JpdHlUeXBlIH0gZnJvbSBcIi4vQXV0aG9yaXR5XCI7XG5pbXBvcnQgeyBYaHJDbGllbnQgfSBmcm9tIFwiLi9YSFJDbGllbnRcIjtcblxuLyoqXG4gKiBAaGlkZGVuXG4gKi9cbmV4cG9ydCBjbGFzcyBBYWRBdXRob3JpdHkgZXh0ZW5kcyBBdXRob3JpdHkge1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBBYWRJbnN0YW5jZURpc2NvdmVyeUVuZHBvaW50OiBzdHJpbmcgPSBcImh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbS9jb21tb24vZGlzY292ZXJ5L2luc3RhbmNlXCI7XG5cbiAgcHJpdmF0ZSBnZXQgQWFkSW5zdGFuY2VEaXNjb3ZlcnlFbmRwb2ludFVybCgpOiBzdHJpbmcge1xuICAgICAgcmV0dXJuIGAke0FhZEF1dGhvcml0eS5BYWRJbnN0YW5jZURpc2NvdmVyeUVuZHBvaW50fT9hcGktdmVyc2lvbj0xLjAmYXV0aG9yaXphdGlvbl9lbmRwb2ludD0ke3RoaXMuQ2Fub25pY2FsQXV0aG9yaXR5fW9hdXRoMi92Mi4wL2F1dGhvcml6ZWA7XG4gIH1cblxuICBwdWJsaWMgY29uc3RydWN0b3IoYXV0aG9yaXR5OiBzdHJpbmcsIHZhbGlkYXRlQXV0aG9yaXR5OiBib29sZWFuKSB7XG4gICAgc3VwZXIoYXV0aG9yaXR5LCB2YWxpZGF0ZUF1dGhvcml0eSk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IEF1dGhvcml0eVR5cGUoKTogQXV0aG9yaXR5VHlwZSB7XG4gICAgcmV0dXJuIEF1dGhvcml0eVR5cGUuQWFkO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgVHJ1c3RlZEhvc3RMaXN0OiBhbnkgPSB7XG4gICAgXCJsb2dpbi53aW5kb3dzLm5ldFwiOiBcImxvZ2luLndpbmRvd3MubmV0XCIsXG4gICAgXCJsb2dpbi5jaGluYWNsb3VkYXBpLmNuXCI6IFwibG9naW4uY2hpbmFjbG91ZGFwaS5jblwiLFxuICAgIFwibG9naW4uY2xvdWRnb3ZhcGkudXNcIjogXCJsb2dpbi5jbG91ZGdvdmFwaS51c1wiLFxuICAgIFwibG9naW4ubWljcm9zb2Z0b25saW5lLmNvbVwiOiBcImxvZ2luLm1pY3Jvc29mdG9ubGluZS5jb21cIixcbiAgICBcImxvZ2luLm1pY3Jvc29mdG9ubGluZS5kZVwiOiBcImxvZ2luLm1pY3Jvc29mdG9ubGluZS5kZVwiLFxuICAgIFwibG9naW4ubWljcm9zb2Z0b25saW5lLnVzXCI6IFwibG9naW4ubWljcm9zb2Z0b25saW5lLnVzXCJcbiAgfTtcblxuICAvKipcbiAgICogUmV0dXJucyBhIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgdG8gdGhlIE9JREMgZW5kcG9pbnRcbiAgICogT25seSByZXNwb25kcyB3aXRoIHRoZSBlbmRwb2ludFxuICAgKi9cbiAgcHVibGljIEdldE9wZW5JZENvbmZpZ3VyYXRpb25FbmRwb2ludEFzeW5jKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICB2YXIgcmVzdWx0UHJvbWlzZTogUHJvbWlzZTxzdHJpbmc+ID0gbmV3IFByb21pc2U8c3RyaW5nPigocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgcmVzb2x2ZSh0aGlzLkRlZmF1bHRPcGVuSWRDb25maWd1cmF0aW9uRW5kcG9pbnQpKTtcblxuICAgIGlmICghdGhpcy5Jc1ZhbGlkYXRpb25FbmFibGVkKSB7XG4gICAgICByZXR1cm4gcmVzdWx0UHJvbWlzZTtcbiAgICB9XG5cbiAgICBsZXQgaG9zdDogc3RyaW5nID0gdGhpcy5DYW5vbmljYWxBdXRob3JpdHlVcmxDb21wb25lbnRzLkhvc3ROYW1lQW5kUG9ydDtcbiAgICBpZiAodGhpcy5Jc0luVHJ1c3RlZEhvc3RMaXN0KGhvc3QpKSB7XG4gICAgICByZXR1cm4gcmVzdWx0UHJvbWlzZTtcbiAgICB9XG5cbiAgICBsZXQgY2xpZW50OiBYaHJDbGllbnQgPSBuZXcgWGhyQ2xpZW50KCk7XG5cbiAgICByZXR1cm4gY2xpZW50LnNlbmRSZXF1ZXN0QXN5bmModGhpcy5BYWRJbnN0YW5jZURpc2NvdmVyeUVuZHBvaW50VXJsLCBcIkdFVFwiLCB0cnVlKVxuICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgIHJldHVybiByZXNwb25zZS50ZW5hbnRfZGlzY292ZXJ5X2VuZHBvaW50O1xuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRvIHNlZSBpZiB0aGUgaG9zdCBpcyBpbiBhIGxpc3Qgb2YgdHJ1c3RlZCBob3N0c1xuICAgKiBAcGFyYW0ge3N0cmluZ30gVGhlIGhvc3QgdG8gbG9vayB1cFxuICAgKi9cbiAgcHVibGljIElzSW5UcnVzdGVkSG9zdExpc3QoaG9zdDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIEFhZEF1dGhvcml0eS5UcnVzdGVkSG9zdExpc3RbaG9zdC50b0xvd2VyQ2FzZSgpXTtcbiAgfVxufVxuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvblxuICogIEFsbCBSaWdodHMgUmVzZXJ2ZWRcbiAqICBNSVQgTGljZW5zZVxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpc1xuICogc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlICdTb2Z0d2FyZScpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZVxuICogd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LFxuICogbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuICogcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmdcbiAqIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbiAqIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICogRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTXG4gKiBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksXG4gKiBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUXG4gKiBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogWEhSIGNsaWVudCBmb3IgSlNPTiBlbmRwb2ludHNcbiAqIGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL2FzeW5jLXByb21pc2VcbiAqIEBoaWRkZW5cbiAqL1xuZXhwb3J0IGNsYXNzIFhockNsaWVudCB7XG4gIHB1YmxpYyBzZW5kUmVxdWVzdEFzeW5jKHVybDogc3RyaW5nLCBtZXRob2Q6IHN0cmluZywgZW5hYmxlQ2FjaGluZz86IGJvb2xlYW4pOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgIHhoci5vcGVuKG1ldGhvZCwgdXJsLCAvKmFzeW5jOiAqLyB0cnVlKTtcbiAgICAgIGlmIChlbmFibGVDYWNoaW5nKSB7XG4gICAgICAgIC8vIFRPRE86IChzaGl2YikgZW5zdXJlIHRoYXQgdGhpcyBjYW4gYmUgY2FjaGVkXG4gICAgICAgIC8vIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ2FjaGUtQ29udHJvbFwiLCBcIlB1YmxpY1wiKTtcbiAgICAgIH1cblxuICAgICAgeGhyLm9ubG9hZCA9IChldikgPT4ge1xuICAgICAgICAgIGlmICh4aHIuc3RhdHVzIDwgMjAwIHx8IHhoci5zdGF0dXMgPj0gMzAwKSB7XG4gICAgICAgICAgICAgIHJlamVjdCh0aGlzLmhhbmRsZUVycm9yKHhoci5yZXNwb25zZVRleHQpKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICB2YXIganNvblJlc3BvbnNlID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgIHJlamVjdCh0aGlzLmhhbmRsZUVycm9yKHhoci5yZXNwb25zZVRleHQpKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXNvbHZlKGpzb25SZXNwb25zZSk7XG4gICAgICB9O1xuXG4gICAgICB4aHIub25lcnJvciA9IChldikgPT4ge1xuICAgICAgICByZWplY3QoeGhyLnN0YXR1cyk7XG4gICAgICB9O1xuXG4gICAgICBpZiAobWV0aG9kID09PSBcIkdFVFwiKSB7XG4gICAgICAgIHhoci5zZW5kKCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdGhyb3cgXCJub3QgaW1wbGVtZW50ZWRcIjtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByb3RlY3RlZCBoYW5kbGVFcnJvcihyZXNwb25zZVRleHQ6IHN0cmluZyk6IGFueSB7XG4gICAgdmFyIGpzb25SZXNwb25zZTtcbiAgICB0cnkge1xuICAgICAganNvblJlc3BvbnNlID0gSlNPTi5wYXJzZShyZXNwb25zZVRleHQpO1xuICAgICAgaWYgKGpzb25SZXNwb25zZS5lcnJvcikge1xuICAgICAgICAgIHJldHVybiBqc29uUmVzcG9uc2UuZXJyb3I7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IHJlc3BvbnNlVGV4dDtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gcmVzcG9uc2VUZXh0O1xuICAgIH1cbiAgfVxufVxuIiwiZXhwb3J0IHsgVXNlckFnZW50QXBwbGljYXRpb24gfSBmcm9tIFwiLi9Vc2VyQWdlbnRBcHBsaWNhdGlvblwiO1xuZXhwb3J0IHsgTG9nZ2VyIH0gZnJvbSBcIi4vTG9nZ2VyXCI7XG5leHBvcnQgeyBMb2dMZXZlbCB9IGZyb20gXCIuL0xvZ2dlclwiO1xuZXhwb3J0IHsgVXNlciB9IGZyb20gXCIuL1VzZXJcIjtcbmV4cG9ydCB7IENvbnN0YW50cyB9IGZyb20gXCIuL0NvbnN0YW50c1wiO1xuZXhwb3J0IHsgVG9rZW5SZXNwb25zZX0gZnJvbSBcIi4vUmVxdWVzdEluZm9cIjtcbmV4cG9ydCB7QXV0aG9yaXR5fSBmcm9tIFwiLi9BdXRob3JpdHlcIjtcbmV4cG9ydCB7Q2FjaGVSZXN1bHR9IGZyb20gXCIuL1VzZXJBZ2VudEFwcGxpY2F0aW9uXCI7XG5cbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvblxuICogIEFsbCBSaWdodHMgUmVzZXJ2ZWRcbiAqICBNSVQgTGljZW5zZVxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpc1xuICogc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlXG4gKiB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksXG4gKiBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZ1xuICogY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxuICogaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbiAqIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SU1xuICogT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLFxuICogV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVFxuICogT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG5pbXBvcnQgeyBVdGlscyB9IGZyb20gXCIuL1V0aWxzXCI7XG5cbi8qKlxuICogQGhpZGRlblxuICovXG5leHBvcnQgY2xhc3MgQWNjZXNzVG9rZW5LZXkge1xuXG4gIGF1dGhvcml0eTogc3RyaW5nO1xuICBjbGllbnRJZDogc3RyaW5nO1xuICB1c2VySWRlbnRpZmllcjogc3RyaW5nO1xuICBzY29wZXM6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihhdXRob3JpdHk6IHN0cmluZywgY2xpZW50SWQ6IHN0cmluZywgc2NvcGVzOiBzdHJpbmcsIHVpZDogc3RyaW5nLCB1dGlkOiBzdHJpbmcpIHtcbiAgICB0aGlzLmF1dGhvcml0eSA9IGF1dGhvcml0eTtcbiAgICB0aGlzLmNsaWVudElkID0gY2xpZW50SWQ7XG4gICAgdGhpcy5zY29wZXMgPSBzY29wZXM7XG4gICAgdGhpcy51c2VySWRlbnRpZmllciA9IFV0aWxzLmJhc2U2NEVuY29kZVN0cmluZ1VybFNhZmUodWlkKSArIFwiLlwiICsgVXRpbHMuYmFzZTY0RW5jb2RlU3RyaW5nVXJsU2FmZSh1dGlkKTtcbiAgfVxufVxuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvblxuICogIEFsbCBSaWdodHMgUmVzZXJ2ZWRcbiAqICBNSVQgTGljZW5zZVxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpc1xuICogc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlICdTb2Z0d2FyZScpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZVxuICogd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LFxuICogbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuICogcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmdcbiAqIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbiAqIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICogRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTXG4gKiBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksXG4gKiBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUXG4gKiBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogQGhpZGRlblxuICovXG5leHBvcnQgY2xhc3MgQWNjZXNzVG9rZW5WYWx1ZSB7XG5cbiAgYWNjZXNzVG9rZW46IHN0cmluZztcbiAgaWRUb2tlbjogc3RyaW5nO1xuICBleHBpcmVzSW46IHN0cmluZztcbiAgY2xpZW50SW5mbzogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKGFjY2Vzc1Rva2VuOiBzdHJpbmcsIGlkVG9rZW46IHN0cmluZywgZXhwaXJlc0luOiBzdHJpbmcsIGNsaWVudEluZm86IHN0cmluZykge1xuICAgIHRoaXMuYWNjZXNzVG9rZW4gPSBhY2Nlc3NUb2tlbjtcbiAgICB0aGlzLmlkVG9rZW4gPSBpZFRva2VuO1xuICAgIHRoaXMuZXhwaXJlc0luID0gZXhwaXJlc0luO1xuICAgIHRoaXMuY2xpZW50SW5mbyA9IGNsaWVudEluZm87XG4gIH1cbn1cbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb25cbiAqICBBbGwgUmlnaHRzIFJlc2VydmVkXG4gKiAgTUlUIExpY2Vuc2VcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXNcbiAqIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmVcbiAqIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSxcbiAqIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbiAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nXG4gKiBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG4gKiBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbiAqIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SU1xuICogT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLFxuICogV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVFxuICogT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG5pbXBvcnQgeyBBdXRob3JpdHkgfSBmcm9tIFwiLi9BdXRob3JpdHlcIjtcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSBcIi4vVXRpbHNcIjtcbmltcG9ydCB7IENvbnN0YW50cyB9IGZyb20gXCIuL0NvbnN0YW50c1wiO1xuXG4vKipcbiAqIEBoaWRkZW5cbiAqL1xuZXhwb3J0IGNsYXNzIEF1dGhlbnRpY2F0aW9uUmVxdWVzdFBhcmFtZXRlcnMge1xuICBhdXRob3JpdHlJbnN0YW5jZTogQXV0aG9yaXR5O1xuICBjbGllbnRJZDogc3RyaW5nO1xuICBub25jZTogc3RyaW5nO1xuICBzdGF0ZTogc3RyaW5nO1xuICBjb3JyZWxhdGlvbklkOiBzdHJpbmc7XG4gIHhDbGllbnRWZXI6IHN0cmluZztcbiAgeENsaWVudFNrdTogc3RyaW5nO1xuICBzY29wZXM6IEFycmF5PHN0cmluZz47XG4gIHJlc3BvbnNlVHlwZTogc3RyaW5nO1xuICBwcm9tcHRWYWx1ZTogc3RyaW5nO1xuICBleHRyYVF1ZXJ5UGFyYW1ldGVyczogc3RyaW5nO1xuICBsb2dpbkhpbnQ6IHN0cmluZztcbiAgZG9tYWluSGludDogc3RyaW5nO1xuICByZWRpcmVjdFVyaTogc3RyaW5nO1xuICAgIHB1YmxpYyBnZXQgYXV0aG9yaXR5KCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLmF1dGhvcml0eUluc3RhbmNlID8gdGhpcy5hdXRob3JpdHlJbnN0YW5jZS5DYW5vbmljYWxBdXRob3JpdHkgOiBudWxsO1xuICB9XG5cbiAgY29uc3RydWN0b3IoYXV0aG9yaXR5OiBBdXRob3JpdHksIGNsaWVudElkOiBzdHJpbmcsIHNjb3BlOiBBcnJheTxzdHJpbmc+LCByZXNwb25zZVR5cGU6IHN0cmluZywgcmVkaXJlY3RVcmk6IHN0cmluZywgc3RhdGU6IHN0cmluZyApIHtcbiAgICB0aGlzLmF1dGhvcml0eUluc3RhbmNlID0gYXV0aG9yaXR5O1xuICAgIHRoaXMuY2xpZW50SWQgPSBjbGllbnRJZDtcbiAgICB0aGlzLnNjb3BlcyA9IHNjb3BlO1xuICAgIHRoaXMucmVzcG9uc2VUeXBlID0gcmVzcG9uc2VUeXBlO1xuICAgIHRoaXMucmVkaXJlY3RVcmkgPSByZWRpcmVjdFVyaTtcbiAgICAvLyByYW5kb21seSBnZW5lcmF0ZWQgdmFsdWVzXG4gICAgdGhpcy5jb3JyZWxhdGlvbklkID0gVXRpbHMuY3JlYXRlTmV3R3VpZCgpO1xuICAgIHRoaXMuc3RhdGUgPSBzdGF0ZSAmJiAhVXRpbHMuaXNFbXB0eShzdGF0ZSkgPyAgVXRpbHMuY3JlYXRlTmV3R3VpZCgpICsgXCJ8XCIgKyBzdGF0ZSAgIDogVXRpbHMuY3JlYXRlTmV3R3VpZCgpO1xuICAgIHRoaXMubm9uY2UgPSBVdGlscy5jcmVhdGVOZXdHdWlkKCk7XG4gICAgLy8gdGVsZW1ldHJ5IGluZm9ybWF0aW9uXG4gICAgdGhpcy54Q2xpZW50U2t1ID0gXCJNU0FMLkpTXCI7XG4gICAgdGhpcy54Q2xpZW50VmVyID0gVXRpbHMuZ2V0TGlicmFyeVZlcnNpb24oKTtcbiAgfVxuXG4gICAgY3JlYXRlTmF2aWdhdGVVcmwoc2NvcGVzOiBBcnJheTxzdHJpbmc+KTogc3RyaW5nIHtcbiAgICAgICAgdmFyIHN0ciA9IHRoaXMuY3JlYXRlTmF2aWdhdGlvblVybFN0cmluZyhzY29wZXMpO1xuICAgICAgICBsZXQgYXV0aEVuZHBvaW50OiBzdHJpbmcgPSB0aGlzLmF1dGhvcml0eUluc3RhbmNlLkF1dGhvcml6YXRpb25FbmRwb2ludDtcbiAgICAgICAgLy8gaWYgdGhlIGVuZHBvaW50IGFscmVhZHkgaGFzIHF1ZXJ5cGFyYW1zLCBsZXRzIGFkZCB0byBpdCwgb3RoZXJ3aXNlIGFkZCB0aGUgZmlyc3Qgb25lXG4gICAgICAgIGlmIChhdXRoRW5kcG9pbnQuaW5kZXhPZihcIj9cIikgPCAwKSB7XG4gICAgICAgICAgICBhdXRoRW5kcG9pbnQgKz0gXCI/XCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhdXRoRW5kcG9pbnQgKz0gXCImXCI7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlcXVlc3RVcmw6IHN0cmluZyA9IGAke2F1dGhFbmRwb2ludH0ke3N0ci5qb2luKFwiJlwiKX1gO1xuICAgICAgICByZXR1cm4gcmVxdWVzdFVybDtcbiAgICB9XG5cbiAgICBjcmVhdGVOYXZpZ2F0aW9uVXJsU3RyaW5nKHNjb3BlczogQXJyYXk8c3RyaW5nPik6IEFycmF5PHN0cmluZz4ge1xuICAgICAgICBpZiAoIXNjb3Blcykge1xuICAgICAgICAgICAgc2NvcGVzID0gW3RoaXMuY2xpZW50SWRdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNjb3Blcy5pbmRleE9mKHRoaXMuY2xpZW50SWQpID09PSAtMSkge1xuICAgICAgICAgICAgc2NvcGVzLnB1c2godGhpcy5jbGllbnRJZCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzdHI6IEFycmF5PHN0cmluZz4gPSBbXTtcbiAgICAgICAgc3RyLnB1c2goXCJyZXNwb25zZV90eXBlPVwiICsgdGhpcy5yZXNwb25zZVR5cGUpO1xuICAgICAgICB0aGlzLnRyYW5zbGF0ZWNsaWVudElkVXNlZEluU2NvcGUoc2NvcGVzKTtcbiAgICAgICAgc3RyLnB1c2goXCJzY29wZT1cIiArIGVuY29kZVVSSUNvbXBvbmVudCh0aGlzLnBhcnNlU2NvcGUoc2NvcGVzKSkpO1xuICAgICAgICBzdHIucHVzaChcImNsaWVudF9pZD1cIiArIGVuY29kZVVSSUNvbXBvbmVudCh0aGlzLmNsaWVudElkKSk7XG4gICAgICAgIHN0ci5wdXNoKFwicmVkaXJlY3RfdXJpPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMucmVkaXJlY3RVcmkpKTtcbiAgICAgICAgc3RyLnB1c2goXCJzdGF0ZT1cIiArIGVuY29kZVVSSUNvbXBvbmVudCh0aGlzLnN0YXRlKSk7XG4gICAgICAgIHN0ci5wdXNoKFwibm9uY2U9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodGhpcy5ub25jZSkpO1xuICAgICAgICBzdHIucHVzaChcImNsaWVudF9pbmZvPTFcIik7XG4gICAgICAgIHN0ci5wdXNoKGB4LWNsaWVudC1TS1U9JHt0aGlzLnhDbGllbnRTa3V9YCk7XG4gICAgICAgIHN0ci5wdXNoKGB4LWNsaWVudC1WZXI9JHt0aGlzLnhDbGllbnRWZXJ9YCk7XG5cbiAgICAgICAgaWYgKHRoaXMuZXh0cmFRdWVyeVBhcmFtZXRlcnMpIHtcbiAgICAgICAgICAgIHN0ci5wdXNoKHRoaXMuZXh0cmFRdWVyeVBhcmFtZXRlcnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RyLnB1c2goXCJjbGllbnQtcmVxdWVzdC1pZD1cIiArIGVuY29kZVVSSUNvbXBvbmVudCh0aGlzLmNvcnJlbGF0aW9uSWQpKTtcblxuICAgICAgICByZXR1cm4gc3RyO1xuICAgIH1cblxuICB0cmFuc2xhdGVjbGllbnRJZFVzZWRJblNjb3BlKHNjb3BlczogQXJyYXk8c3RyaW5nPik6IHZvaWQge1xuICAgIGNvbnN0IGNsaWVudElkSW5kZXg6IG51bWJlciA9IHNjb3Blcy5pbmRleE9mKHRoaXMuY2xpZW50SWQpO1xuICAgIGlmIChjbGllbnRJZEluZGV4ID49IDApIHtcbiAgICAgIHNjb3Blcy5zcGxpY2UoY2xpZW50SWRJbmRleCwgMSk7XG4gICAgICBpZiAoc2NvcGVzLmluZGV4T2YoXCJvcGVuaWRcIikgPT09IC0xKSB7XG4gICAgICAgIHNjb3Blcy5wdXNoKFwib3BlbmlkXCIpO1xuICAgICAgfVxuICAgICAgaWYgKHNjb3Blcy5pbmRleE9mKFwicHJvZmlsZVwiKSA9PT0gLTEpIHtcbiAgICAgICAgc2NvcGVzLnB1c2goXCJwcm9maWxlXCIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHBhcnNlU2NvcGUoc2NvcGVzOiBBcnJheTxzdHJpbmc+KTogc3RyaW5nIHtcbiAgICBsZXQgc2NvcGVMaXN0OiBzdHJpbmcgPSBcIlwiO1xuICAgIGlmIChzY29wZXMpIHtcbiAgICAgICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHNjb3Blcy5sZW5ndGg7ICsraSkge1xuICAgICAgICBzY29wZUxpc3QgKz0gKGkgIT09IHNjb3Blcy5sZW5ndGggLSAxKSA/IHNjb3Blc1tpXSArIFwiIFwiIDogc2NvcGVzW2ldO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzY29wZUxpc3Q7XG4gIH1cbn1cbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb25cbiAqICBBbGwgUmlnaHRzIFJlc2VydmVkXG4gKiAgTUlUIExpY2Vuc2VcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXNcbiAqIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmVcbiAqIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSxcbiAqIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbiAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nXG4gKiBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG4gKiBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbiAqIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SU1xuICogT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLFxuICogV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVFxuICogT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG5pbXBvcnQgeyBVdGlscyB9IGZyb20gXCIuL1V0aWxzXCI7XG5cbi8qKlxuICogQGhpZGRlblxuICovXG5leHBvcnQgY2xhc3MgQ2xpZW50SW5mbyB7XG5cbiAgcHJpdmF0ZSBfdWlkOiBzdHJpbmc7XG4gIGdldCB1aWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fdWlkID8gdGhpcy5fdWlkIDogXCJcIjtcbiAgfVxuXG4gIHNldCB1aWQodWlkOiBzdHJpbmcpIHtcbiAgICB0aGlzLl91aWQgPSB1aWQ7XG4gIH1cblxuICBwcml2YXRlIF91dGlkOiBzdHJpbmc7XG4gIGdldCB1dGlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX3V0aWQgPyB0aGlzLl91dGlkIDogXCJcIjtcbiAgfVxuXG4gIHNldCB1dGlkKHV0aWQ6IHN0cmluZykge1xuICAgIHRoaXMuX3V0aWQgPSB1dGlkO1xuICB9XG5cbiAgY29uc3RydWN0b3IocmF3Q2xpZW50SW5mbzogc3RyaW5nKSB7XG4gICAgaWYgKCFyYXdDbGllbnRJbmZvIHx8IFV0aWxzLmlzRW1wdHkocmF3Q2xpZW50SW5mbykpIHtcbiAgICAgIHRoaXMudWlkID0gXCJcIjtcbiAgICAgIHRoaXMudXRpZCA9IFwiXCI7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRlY29kZWRDbGllbnRJbmZvOiBzdHJpbmcgPSBVdGlscy5iYXNlNjREZWNvZGVTdHJpbmdVcmxTYWZlKHJhd0NsaWVudEluZm8pO1xuICAgICAgY29uc3QgY2xpZW50SW5mbzogQ2xpZW50SW5mbyA9IDxDbGllbnRJbmZvPkpTT04ucGFyc2UoZGVjb2RlZENsaWVudEluZm8pO1xuICAgICAgaWYgKGNsaWVudEluZm8pIHtcbiAgICAgICAgaWYgKGNsaWVudEluZm8uaGFzT3duUHJvcGVydHkoXCJ1aWRcIikpIHtcbiAgICAgICAgICB0aGlzLnVpZCA9IGNsaWVudEluZm8udWlkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNsaWVudEluZm8uaGFzT3duUHJvcGVydHkoXCJ1dGlkXCIpKSB7XG4gICAgICAgICAgdGhpcy51dGlkID0gY2xpZW50SW5mby51dGlkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGUpO1xuICAgIH1cbiAgfVxufVxuIiwiLypcbiAgKiBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvblxuICAqICBBbGwgUmlnaHRzIFJlc2VydmVkXG4gICogIE1JVCBMaWNlbnNlXG4gICpcbiAgKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXNcbiAgKiBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmVcbiAgKiB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksXG4gICogbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuICAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nXG4gICogY29uZGl0aW9uczpcbiAgKlxuICAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG4gICogaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gICpcbiAgKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICAqIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlNcbiAgKiBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksXG4gICogV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVFxuICAqIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gICovXG5cbmltcG9ydCB7IFV0aWxzIH0gZnJvbSBcIi4vVXRpbHNcIjtcblxuLyoqXG4gKiBAaGlkZGVuXG4gKi9cbmV4cG9ydCBjbGFzcyBJZFRva2VuIHtcblxuICBpc3N1ZXI6IHN0cmluZztcbiAgb2JqZWN0SWQ6IHN0cmluZztcbiAgc3ViamVjdDogc3RyaW5nO1xuICB0ZW5hbnRJZDogc3RyaW5nO1xuICB2ZXJzaW9uOiBzdHJpbmc7XG4gIHByZWZlcnJlZE5hbWU6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBob21lT2JqZWN0SWQ6IHN0cmluZztcbiAgbm9uY2U6IHN0cmluZztcbiAgZXhwaXJhdGlvbjogc3RyaW5nO1xuICByYXdJZFRva2VuOiBzdHJpbmc7XG4gIGRlY29kZWRJZFRva2VuOiBPYmplY3Q7XG4gIHNpZDogc3RyaW5nO1xuICAvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xuICBjb25zdHJ1Y3RvcihyYXdJZFRva2VuOiBzdHJpbmcpIHtcbiAgICBpZiAoVXRpbHMuaXNFbXB0eShyYXdJZFRva2VuKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwibnVsbCBvciBlbXB0eSByYXcgaWR0b2tlblwiKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMucmF3SWRUb2tlbiA9IHJhd0lkVG9rZW47XG4gICAgICB0aGlzLmRlY29kZWRJZFRva2VuID0gVXRpbHMuZXh0cmFjdElkVG9rZW4ocmF3SWRUb2tlbik7XG4gICAgICBpZiAodGhpcy5kZWNvZGVkSWRUb2tlbikge1xuICAgICAgICBpZiAodGhpcy5kZWNvZGVkSWRUb2tlbi5oYXNPd25Qcm9wZXJ0eShcImlzc1wiKSkge1xuICAgICAgICAgIHRoaXMuaXNzdWVyID0gdGhpcy5kZWNvZGVkSWRUb2tlbltcImlzc1wiXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRlY29kZWRJZFRva2VuLmhhc093blByb3BlcnR5KFwib2lkXCIpKSB7XG4gICAgICAgICAgICB0aGlzLm9iamVjdElkID0gdGhpcy5kZWNvZGVkSWRUb2tlbltcIm9pZFwiXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRlY29kZWRJZFRva2VuLmhhc093blByb3BlcnR5KFwic3ViXCIpKSB7XG4gICAgICAgICAgdGhpcy5zdWJqZWN0ID0gdGhpcy5kZWNvZGVkSWRUb2tlbltcInN1YlwiXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRlY29kZWRJZFRva2VuLmhhc093blByb3BlcnR5KFwidGlkXCIpKSB7XG4gICAgICAgICAgdGhpcy50ZW5hbnRJZCA9IHRoaXMuZGVjb2RlZElkVG9rZW5bXCJ0aWRcIl07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5kZWNvZGVkSWRUb2tlbi5oYXNPd25Qcm9wZXJ0eShcInZlclwiKSkge1xuICAgICAgICAgIHRoaXMudmVyc2lvbiA9IHRoaXMuZGVjb2RlZElkVG9rZW5bXCJ2ZXJcIl07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5kZWNvZGVkSWRUb2tlbi5oYXNPd25Qcm9wZXJ0eShcInByZWZlcnJlZF91c2VybmFtZVwiKSkge1xuICAgICAgICAgIHRoaXMucHJlZmVycmVkTmFtZSA9IHRoaXMuZGVjb2RlZElkVG9rZW5bXCJwcmVmZXJyZWRfdXNlcm5hbWVcIl07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5kZWNvZGVkSWRUb2tlbi5oYXNPd25Qcm9wZXJ0eShcIm5hbWVcIikpIHtcbiAgICAgICAgICB0aGlzLm5hbWUgPSB0aGlzLmRlY29kZWRJZFRva2VuW1wibmFtZVwiXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRlY29kZWRJZFRva2VuLmhhc093blByb3BlcnR5KFwibm9uY2VcIikpIHtcbiAgICAgICAgICB0aGlzLm5vbmNlID0gdGhpcy5kZWNvZGVkSWRUb2tlbltcIm5vbmNlXCJdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZGVjb2RlZElkVG9rZW4uaGFzT3duUHJvcGVydHkoXCJleHBcIikpIHtcbiAgICAgICAgICB0aGlzLmV4cGlyYXRpb24gPSB0aGlzLmRlY29kZWRJZFRva2VuW1wiZXhwXCJdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZGVjb2RlZElkVG9rZW4uaGFzT3duUHJvcGVydHkoXCJob21lX29pZFwiKSkge1xuICAgICAgICAgICAgdGhpcy5ob21lT2JqZWN0SWQgPSB0aGlzLmRlY29kZWRJZFRva2VuW1wiaG9tZV9vaWRcIl07XG4gICAgICAgIH1cblxuICAgICAgICAgIGlmICh0aGlzLmRlY29kZWRJZFRva2VuLmhhc093blByb3BlcnR5KFwic2lkXCIpKSB7XG4gICAgICAgICAgICAgIHRoaXMuc2lkID0gdGhpcy5kZWNvZGVkSWRUb2tlbltcInNpZFwiXTtcbiAgICAgICAgICB9XG4gICAgICAvKiB0c2xpbnQ6ZW5hYmxlOm5vLXN0cmluZy1saXRlcmFsICovXG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIHBhcnNlIHRoZSByZXR1cm5lZCBpZCB0b2tlblwiKTtcbiAgICB9XG4gIH1cblxufVxuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvblxuICogIEFsbCBSaWdodHMgUmVzZXJ2ZWRcbiAqICBNSVQgTGljZW5zZVxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpc1xuICogc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlICdTb2Z0d2FyZScpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZVxuICogd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LFxuICogbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuICogcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmdcbiAqIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbiAqIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICogRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTXG4gKiBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksXG4gKiBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUXG4gKiBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuICovXG5cbmltcG9ydCB7IENvbnN0YW50cyB9IGZyb20gXCIuL0NvbnN0YW50c1wiO1xuaW1wb3J0IHsgQWNjZXNzVG9rZW5DYWNoZUl0ZW0gfSBmcm9tIFwiLi9BY2Nlc3NUb2tlbkNhY2hlSXRlbVwiO1xuXG4vKipcbiAqIEBoaWRkZW5cbiAqL1xuZXhwb3J0IGNsYXNzIFN0b3JhZ2Ugey8vIFNpbmdsZXRvblxuXG4gIHByaXZhdGUgc3RhdGljIF9pbnN0YW5jZTogU3RvcmFnZTtcbiAgcHJpdmF0ZSBfbG9jYWxTdG9yYWdlU3VwcG9ydGVkOiBib29sZWFuO1xuICBwcml2YXRlIF9zZXNzaW9uU3RvcmFnZVN1cHBvcnRlZDogYm9vbGVhbjtcbiAgcHJpdmF0ZSBfY2FjaGVMb2NhdGlvbjogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKGNhY2hlTG9jYXRpb246IHN0cmluZykge1xuICAgIGlmIChTdG9yYWdlLl9pbnN0YW5jZSkge1xuICAgICAgcmV0dXJuIFN0b3JhZ2UuX2luc3RhbmNlO1xuICAgIH1cblxuICAgIHRoaXMuX2NhY2hlTG9jYXRpb24gPSBjYWNoZUxvY2F0aW9uO1xuICAgIHRoaXMuX2xvY2FsU3RvcmFnZVN1cHBvcnRlZCA9IHR5cGVvZiB3aW5kb3dbdGhpcy5fY2FjaGVMb2NhdGlvbl0gIT09IFwidW5kZWZpbmVkXCIgJiYgd2luZG93W3RoaXMuX2NhY2hlTG9jYXRpb25dICE9IG51bGw7XG4gICAgdGhpcy5fc2Vzc2lvblN0b3JhZ2VTdXBwb3J0ZWQgPSB0eXBlb2Ygd2luZG93W2NhY2hlTG9jYXRpb25dICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvd1tjYWNoZUxvY2F0aW9uXSAhPSBudWxsO1xuICAgIFN0b3JhZ2UuX2luc3RhbmNlID0gdGhpcztcbiAgICBpZiAoIXRoaXMuX2xvY2FsU3RvcmFnZVN1cHBvcnRlZCAmJiAhdGhpcy5fc2Vzc2lvblN0b3JhZ2VTdXBwb3J0ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImxvY2FsU3RvcmFnZSBhbmQgc2Vzc2lvblN0b3JhZ2Ugbm90IHN1cHBvcnRlZFwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gU3RvcmFnZS5faW5zdGFuY2U7XG4gIH1cblxuICAgIC8vIGFkZCB2YWx1ZSB0byBzdG9yYWdlXG4gICAgc2V0SXRlbShrZXk6IHN0cmluZywgdmFsdWU6IHN0cmluZywgZW5hYmxlQ29va2llU3RvcmFnZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAgICAgaWYgKHdpbmRvd1t0aGlzLl9jYWNoZUxvY2F0aW9uXSkge1xuICAgICAgICAgICAgd2luZG93W3RoaXMuX2NhY2hlTG9jYXRpb25dLnNldEl0ZW0oa2V5LCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVuYWJsZUNvb2tpZVN0b3JhZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0SXRlbUNvb2tpZShrZXksIHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGdldCBvbmUgaXRlbSBieSBrZXkgZnJvbSBzdG9yYWdlXG4gICAgZ2V0SXRlbShrZXk6IHN0cmluZywgZW5hYmxlQ29va2llU3RvcmFnZT86IGJvb2xlYW4pOiBzdHJpbmcge1xuICAgICAgICBpZiAoZW5hYmxlQ29va2llU3RvcmFnZSAmJiB0aGlzLmdldEl0ZW1Db29raWUoa2V5KSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0SXRlbUNvb2tpZShrZXkpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh3aW5kb3dbdGhpcy5fY2FjaGVMb2NhdGlvbl0pIHtcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3dbdGhpcy5fY2FjaGVMb2NhdGlvbl0uZ2V0SXRlbShrZXkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIHJlbW92ZSB2YWx1ZSBmcm9tIHN0b3JhZ2VcbiAgICByZW1vdmVJdGVtKGtleTogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGlmICh3aW5kb3dbdGhpcy5fY2FjaGVMb2NhdGlvbl0pIHtcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3dbdGhpcy5fY2FjaGVMb2NhdGlvbl0ucmVtb3ZlSXRlbShrZXkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gY2xlYXIgc3RvcmFnZSAocmVtb3ZlIGFsbCBpdGVtcyBmcm9tIGl0KVxuICAgIGNsZWFyKCk6IHZvaWQge1xuICAgICAgICBpZiAod2luZG93W3RoaXMuX2NhY2hlTG9jYXRpb25dKSB7XG4gICAgICAgICAgICByZXR1cm4gd2luZG93W3RoaXMuX2NhY2hlTG9jYXRpb25dLmNsZWFyKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRBbGxBY2Nlc3NUb2tlbnMoY2xpZW50SWQ6IHN0cmluZywgdXNlcklkZW50aWZpZXI6IHN0cmluZyk6IEFycmF5PEFjY2Vzc1Rva2VuQ2FjaGVJdGVtPiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdHM6IEFycmF5PEFjY2Vzc1Rva2VuQ2FjaGVJdGVtPiA9IFtdO1xuICAgICAgICBsZXQgYWNjZXNzVG9rZW5DYWNoZUl0ZW06IEFjY2Vzc1Rva2VuQ2FjaGVJdGVtO1xuICAgICAgICBjb25zdCBzdG9yYWdlID0gd2luZG93W3RoaXMuX2NhY2hlTG9jYXRpb25dO1xuICAgICAgICBpZiAoc3RvcmFnZSkge1xuICAgICAgICAgICAgbGV0IGtleTogc3RyaW5nO1xuICAgICAgICAgICAgZm9yIChrZXkgaW4gc3RvcmFnZSkge1xuICAgICAgICAgICAgICAgIGlmIChzdG9yYWdlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleS5tYXRjaChjbGllbnRJZCkgJiYga2V5Lm1hdGNoKHVzZXJJZGVudGlmaWVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gdGhpcy5nZXRJdGVtKGtleSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY2Nlc3NUb2tlbkNhY2hlSXRlbSA9IG5ldyBBY2Nlc3NUb2tlbkNhY2hlSXRlbShKU09OLnBhcnNlKGtleSksIEpTT04ucGFyc2UodmFsdWUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goYWNjZXNzVG9rZW5DYWNoZUl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuXG4gICAgcmVtb3ZlQWNxdWlyZVRva2VuRW50cmllcyhhdXRob3JpdHlLZXk6IHN0cmluZywgYWNxdWlyZVRva2VuVXNlcktleTogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHN0b3JhZ2UgPSB3aW5kb3dbdGhpcy5fY2FjaGVMb2NhdGlvbl07XG4gICAgICAgIGlmIChzdG9yYWdlKSB7XG4gICAgICAgICAgICBsZXQga2V5OiBzdHJpbmc7XG4gICAgICAgICAgICBmb3IgKGtleSBpbiBzdG9yYWdlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0b3JhZ2UuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoKGF1dGhvcml0eUtleSAhPT0gXCJcIiAmJiBrZXkuaW5kZXhPZihhdXRob3JpdHlLZXkpID4gLTEpIHx8IChhY3F1aXJlVG9rZW5Vc2VyS2V5ICE9PSBcIlwiICYmIGtleS5pbmRleE9mKGFjcXVpcmVUb2tlblVzZXJLZXkpID4gLTEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUl0ZW0oa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlc2V0Q2FjaGVJdGVtcygpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgc3RvcmFnZSA9IHdpbmRvd1t0aGlzLl9jYWNoZUxvY2F0aW9uXTtcbiAgICAgICAgaWYgKHN0b3JhZ2UpIHtcbiAgICAgICAgICAgIGxldCBrZXk6IHN0cmluZztcbiAgICAgICAgICAgIGZvciAoa2V5IGluIHN0b3JhZ2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RvcmFnZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkuaW5kZXhPZihDb25zdGFudHMubXNhbCkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEl0ZW0oa2V5LCBcIlwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5LmluZGV4T2YoQ29uc3RhbnRzLnJlbmV3U3RhdHVzKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlSXRlbShrZXkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0SXRlbUNvb2tpZShjTmFtZTogc3RyaW5nLCBjVmFsdWU6IHN0cmluZywgZXhwaXJlcz86IG51bWJlcik6IHZvaWQge1xuICAgICAgICB2YXIgY29va2llU3RyID0gY05hbWUgKyBcIj1cIiArIGNWYWx1ZSArIFwiO1wiO1xuICAgICAgICBpZiAoZXhwaXJlcykge1xuICAgICAgICAgICAgdmFyIGV4cGlyZVRpbWUgPSB0aGlzLnNldEV4cGlyYXRpb25Db29raWUoZXhwaXJlcyk7XG4gICAgICAgICAgICBjb29raWVTdHIgKz0gXCJleHBpcmVzPVwiICsgZXhwaXJlVGltZSArIFwiO1wiO1xuICAgICAgICB9XG5cbiAgICAgICAgZG9jdW1lbnQuY29va2llID0gY29va2llU3RyO1xuICAgIH1cblxuICAgIGdldEl0ZW1Db29raWUoY05hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHZhciBuYW1lID0gY05hbWUgKyBcIj1cIjtcbiAgICAgICAgdmFyIGNhID0gZG9jdW1lbnQuY29va2llLnNwbGl0KFwiO1wiKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGMgPSBjYVtpXTtcbiAgICAgICAgICAgIHdoaWxlIChjLmNoYXJBdCgwKSA9PT0gXCIgXCIpIHtcbiAgICAgICAgICAgICAgICBjID0gYy5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYy5pbmRleE9mKG5hbWUpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGMuc3Vic3RyaW5nKG5hbWUubGVuZ3RoLCBjLmxlbmd0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuXG4gICAgc2V0RXhwaXJhdGlvbkNvb2tpZShjb29raWVMaWZlOiBudW1iZXIpOiBzdHJpbmcge1xuICAgICAgICB2YXIgdG9kYXkgPSBuZXcgRGF0ZSgpO1xuICAgICAgICB2YXIgZXhwciA9IG5ldyBEYXRlKHRvZGF5LmdldFRpbWUoKSArIGNvb2tpZUxpZmUgKiAyNCAqIDYwICogNjAgKiAxMDAwKTtcbiAgICAgICAgcmV0dXJuIGV4cHIudG9VVENTdHJpbmcoKTtcbiAgICB9XG5cbiAgICBjbGVhckNvb2tpZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5zZXRJdGVtQ29va2llKENvbnN0YW50cy5ub25jZUlkVG9rZW4sIFwiXCIsIC0xKTtcbiAgICAgICAgdGhpcy5zZXRJdGVtQ29va2llKENvbnN0YW50cy5zdGF0ZUxvZ2luLCBcIlwiLCAtMSk7XG4gICAgICAgIHRoaXMuc2V0SXRlbUNvb2tpZShDb25zdGFudHMubG9naW5SZXF1ZXN0LCBcIlwiLCAtMSk7XG4gICAgICAgIHRoaXMuc2V0SXRlbUNvb2tpZShDb25zdGFudHMuc3RhdGVBY3F1aXJlVG9rZW4sIFwiXCIsIC0xKTtcbiAgICB9XG59XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uXG4gKiAgQWxsIFJpZ2h0cyBSZXNlcnZlZFxuICogIE1JVCBMaWNlbnNlXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZiB0aGlzXG4gKiBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlXG4gKiB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksXG4gKiBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZ1xuICogY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxuICogaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsXG4gKiBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlNcbiAqIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSxcbiAqIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVRcbiAqIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKi9cblxuaW1wb3J0IHsgQWNjZXNzVG9rZW5LZXkgfSBmcm9tIFwiLi9BY2Nlc3NUb2tlbktleVwiO1xuaW1wb3J0IHsgQWNjZXNzVG9rZW5WYWx1ZSB9IGZyb20gXCIuL0FjY2Vzc1Rva2VuVmFsdWVcIjtcblxuLyoqXG4gKiBAaGlkZGVuXG4gKi9cbmV4cG9ydCBjbGFzcyBBY2Nlc3NUb2tlbkNhY2hlSXRlbSB7XG5cbiAga2V5OiBBY2Nlc3NUb2tlbktleTtcbiAgdmFsdWU6IEFjY2Vzc1Rva2VuVmFsdWU7XG5cbiAgY29uc3RydWN0b3Ioa2V5OiBBY2Nlc3NUb2tlbktleSwgdmFsdWU6IEFjY2Vzc1Rva2VuVmFsdWUpIHtcbiAgICB0aGlzLmtleSA9IGtleTtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gIH1cbn1cbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb25cbiAqICBBbGwgUmlnaHRzIFJlc2VydmVkXG4gKiAgTUlUIExpY2Vuc2VcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXNcbiAqIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmVcbiAqIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSxcbiAqIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbiAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nXG4gKiBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG4gKiBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbiAqIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SU1xuICogT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLFxuICogV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVFxuICogT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4vKipcbiAqIEBoaWRkZW5cbiAqL1xuaW1wb3J0IHsgVXRpbHMgfSBmcm9tIFwiLi9VdGlsc1wiO1xuaW1wb3J0IHsgQWFkQXV0aG9yaXR5IH0gZnJvbSBcIi4vQWFkQXV0aG9yaXR5XCI7XG5pbXBvcnQgeyBCMmNBdXRob3JpdHkgfSBmcm9tIFwiLi9CMmNBdXRob3JpdHlcIjtcbmltcG9ydCB7IEF1dGhvcml0eSwgQXV0aG9yaXR5VHlwZSB9IGZyb20gXCIuL0F1dGhvcml0eVwiO1xuaW1wb3J0IHsgRXJyb3JNZXNzYWdlIH0gZnJvbSBcIi4vRXJyb3JNZXNzYWdlXCI7XG5cbmV4cG9ydCBjbGFzcyBBdXRob3JpdHlGYWN0b3J5IHtcbiAgICAvKipcbiAgICAqIFBhcnNlIHRoZSB1cmwgYW5kIGRldGVybWluZSB0aGUgdHlwZSBvZiBhdXRob3JpdHlcbiAgICAqL1xuICAgIHByaXZhdGUgc3RhdGljIERldGVjdEF1dGhvcml0eUZyb21VcmwoYXV0aG9yaXR5VXJsOiBzdHJpbmcpOiBBdXRob3JpdHlUeXBlIHtcbiAgICAgICAgYXV0aG9yaXR5VXJsID0gVXRpbHMuQ2Fub25pY2FsaXplVXJpKGF1dGhvcml0eVVybCk7XG4gICAgICAgIGxldCBjb21wb25lbnRzID0gVXRpbHMuR2V0VXJsQ29tcG9uZW50cyhhdXRob3JpdHlVcmwpO1xuICAgICAgICBsZXQgcGF0aFNlZ21lbnRzID0gY29tcG9uZW50cy5QYXRoU2VnbWVudHM7XG4gICAgICAgIHN3aXRjaCAocGF0aFNlZ21lbnRzWzBdKSB7XG4gICAgICAgICAgICBjYXNlIFwidGZwXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhvcml0eVR5cGUuQjJDO1xuICAgICAgICAgICAgY2FzZSBcImFkZnNcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aG9yaXR5VHlwZS5BZGZzO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aG9yaXR5VHlwZS5BYWQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAqIENyZWF0ZSBhbiBhdXRob3JpdHkgb2JqZWN0IG9mIHRoZSBjb3JyZWN0IHR5cGUgYmFzZWQgb24gdGhlIHVybFxuICAgICogUGVyZm9ybXMgYmFzaWMgYXV0aG9yaXR5IHZhbGlkYXRpb24gLSBjaGVja3MgdG8gc2VlIGlmIHRoZSBhdXRob3JpdHkgaXMgb2YgYSB2YWxpZCB0eXBlIChlZyBhYWQsIGIyYylcbiAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgQ3JlYXRlSW5zdGFuY2UoYXV0aG9yaXR5VXJsOiBzdHJpbmcsIHZhbGlkYXRlQXV0aG9yaXR5OiBib29sZWFuKTogQXV0aG9yaXR5IHtcbiAgICAgICAgaWYgKFV0aWxzLmlzRW1wdHkoYXV0aG9yaXR5VXJsKSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHR5cGUgPSBBdXRob3JpdHlGYWN0b3J5LkRldGVjdEF1dGhvcml0eUZyb21VcmwoYXV0aG9yaXR5VXJsKTtcbiAgICAgICAgLy8gRGVwZW5kaW5nIG9uIGFib3ZlIGRldGVjdGlvbiwgY3JlYXRlIHRoZSByaWdodCB0eXBlLlxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgQXV0aG9yaXR5VHlwZS5CMkM6XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBCMmNBdXRob3JpdHkoYXV0aG9yaXR5VXJsLCB2YWxpZGF0ZUF1dGhvcml0eSk7XG4gICAgICAgICAgICBjYXNlIEF1dGhvcml0eVR5cGUuQWFkOlxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQWFkQXV0aG9yaXR5KGF1dGhvcml0eVVybCwgdmFsaWRhdGVBdXRob3JpdHkpO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvck1lc3NhZ2UuaW52YWxpZEF1dGhvcml0eVR5cGU7XG4gICAgICAgIH1cbiAgICB9XG5cbn1cbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb25cbiAqICBBbGwgUmlnaHRzIFJlc2VydmVkXG4gKiAgTUlUIExpY2Vuc2VcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXNcbiAqIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmVcbiAqIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSxcbiAqIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbiAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nXG4gKiBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG4gKiBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbiAqIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SU1xuICogT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLFxuICogV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVFxuICogT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG5pbXBvcnQgeyBBYWRBdXRob3JpdHkgfSBmcm9tIFwiLi9BYWRBdXRob3JpdHlcIjtcbmltcG9ydCB7IEF1dGhvcml0eSwgQXV0aG9yaXR5VHlwZSB9IGZyb20gXCIuL0F1dGhvcml0eVwiO1xuaW1wb3J0IHsgRXJyb3JNZXNzYWdlIH0gZnJvbSBcIi4vRXJyb3JNZXNzYWdlXCI7XG5pbXBvcnQgeyBVdGlscyB9IGZyb20gXCIuL1V0aWxzXCI7XG5cbi8qKlxuICogQGhpZGRlblxuICovXG5leHBvcnQgY2xhc3MgQjJjQXV0aG9yaXR5IGV4dGVuZHMgQWFkQXV0aG9yaXR5IHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGF1dGhvcml0eTogc3RyaW5nLCB2YWxpZGF0ZUF1dGhvcml0eTogYm9vbGVhbikge1xuICAgIHN1cGVyKGF1dGhvcml0eSwgdmFsaWRhdGVBdXRob3JpdHkpO1xuICAgIGxldCB1cmxDb21wb25lbnRzID0gVXRpbHMuR2V0VXJsQ29tcG9uZW50cyhhdXRob3JpdHkpO1xuXG4gICAgbGV0IHBhdGhTZWdtZW50cyA9IHVybENvbXBvbmVudHMuUGF0aFNlZ21lbnRzO1xuICAgIGlmIChwYXRoU2VnbWVudHMubGVuZ3RoIDwgMykge1xuICAgICAgICB0aHJvdyBFcnJvck1lc3NhZ2UuYjJjQXV0aG9yaXR5VXJpSW52YWxpZFBhdGg7XG4gICAgfVxuXG4gICAgdGhpcy5DYW5vbmljYWxBdXRob3JpdHkgPSBgaHR0cHM6Ly8ke3VybENvbXBvbmVudHMuSG9zdE5hbWVBbmRQb3J0fS8ke3BhdGhTZWdtZW50c1swXX0vJHtwYXRoU2VnbWVudHNbMV19LyR7cGF0aFNlZ21lbnRzWzJdfS9gO1xuICB9XG5cbiAgcHVibGljIGdldCBBdXRob3JpdHlUeXBlKCk6IEF1dGhvcml0eVR5cGUge1xuICAgIHJldHVybiBBdXRob3JpdHlUeXBlLkIyQztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcHJvbWlzZSB3aXRoIHRoZSBUZW5hbnREaXNjb3ZlcnlFbmRwb2ludFxuICAgKi9cbiAgcHVibGljIEdldE9wZW5JZENvbmZpZ3VyYXRpb25FbmRwb2ludEFzeW5jKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdmFyIHJlc3VsdFByb21pc2UgPSBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgICByZXNvbHZlKHRoaXMuRGVmYXVsdE9wZW5JZENvbmZpZ3VyYXRpb25FbmRwb2ludCkpO1xuXG4gICAgaWYgKCF0aGlzLklzVmFsaWRhdGlvbkVuYWJsZWQpIHtcbiAgICAgIHJldHVybiByZXN1bHRQcm9taXNlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLklzSW5UcnVzdGVkSG9zdExpc3QodGhpcy5DYW5vbmljYWxBdXRob3JpdHlVcmxDb21wb25lbnRzLkhvc3ROYW1lQW5kUG9ydCkpIHtcbiAgICAgIHJldHVybiByZXN1bHRQcm9taXNlO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgICByZWplY3QoRXJyb3JNZXNzYWdlLnVuc3VwcG9ydGVkQXV0aG9yaXR5VmFsaWRhdGlvbikpO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6IiJ9