/*! msal v1.0.0-preview.1 2019-04-22 */
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
/******/ 	return __webpack_require__(__webpack_require__.s = 15);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var Constants_1 = __webpack_require__(2);
var Constants_2 = __webpack_require__(2);
/**
 * @hidden
 */
var Utils = /** @class */ (function () {
    function Utils() {
    }
    //#region General Util
    /**
     * Utils function to compare two Account objects - used to check if the same user account is logged in
     *
     * @param a1: Account object
     * @param a2: Account object
     */
    Utils.compareAccounts = function (a1, a2) {
        if (!a1 || !a2) {
            return false;
        }
        if (a1.homeAccountIdentifier && a2.homeAccountIdentifier) {
            if (a1.homeAccountIdentifier === a2.homeAccountIdentifier) {
                return true;
            }
        }
        return false;
    };
    /**
     * Decimal to Hex
     *
     * @param num
     */
    Utils.decimalToHex = function (num) {
        var hex = num.toString(16);
        while (hex.length < 2) {
            hex = "0" + hex;
        }
        return hex;
    };
    /**
     * MSAL JS Library Version
     */
    Utils.getLibraryVersion = function () {
        return Constants_2.Library.version;
    };
    /**
     * Creates a new random GUID - used to populate state?
     * @returns string (GUID)
     */
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
    //#endregion
    //#region Time
    /**
     * Returns time in seconds for expiration based on string value passed in.
     *
     * @param expires
     */
    Utils.expiresIn = function (expires) {
        // if AAD did not send "expires_in" property, use default expiration of 3599 seconds, for some reason AAD sends 3599 as "expires_in" value instead of 3600
        if (!expires) {
            expires = "3599";
        }
        return this.now() + parseInt(expires, 10);
    };
    /**
     * return the current time in Unix time. Date.getTime() returns in milliseconds.
     */
    Utils.now = function () {
        return Math.round(new Date().getTime() / 1000.0);
    };
    //#endregion
    //#region String Ops
    /**
     * Check if a string is empty
     *
     * @param str
     */
    Utils.isEmpty = function (str) {
        return (typeof str === "undefined" || !str || 0 === str.length);
    };
    //#endregion
    //#region Token Processing (Extract to TokenProcessing.ts)
    /**
     * decode a JWT
     *
     * @param jwtToken
     */
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
    /**
     * Extract IdToken by decoding the RAWIdToken
     *
     * @param encodedIdToken
     */
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
    //#endregion
    //#region Encode and Decode
    /**
     * encoding string to base64 - platform specific check
     *
     * @param input
     */
    Utils.base64EncodeStringUrlSafe = function (input) {
        // html5 should support atob function for decoding
        if (window.btoa) {
            return window.btoa(input);
        }
        else {
            return this.encode(input);
        }
    };
    /**
     * decoding base64 token - platform specific check
     *
     * @param base64IdToken
     */
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
    /**
     * base64 encode a string
     *
     * @param input
     */
    // TODO: Rename to specify type of encoding
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
    /**
     * utf8 encode a string
     *
     * @param input
     */
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
    /**
     * decode a base64 token string
     *
     * @param base64IdToken
     */
    // TODO: Rename to specify type of encoding
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
    /**
     * deserialize a string
     *
     * @param query
     */
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
    //#endregion
    //#region Scopes (extract to Scopes.ts)
    /**
     * Check if there are dup scopes in a given request
     *
     * @param cachedScopes
     * @param scopes
     */
    // TODO: Rename this, intersecting scopes isn't a great name for duplicate checker
    Utils.isIntersectingScopes = function (cachedScopes, scopes) {
        cachedScopes = this.convertToLowerCase(cachedScopes);
        for (var i = 0; i < scopes.length; i++) {
            if (cachedScopes.indexOf(scopes[i].toLowerCase()) > -1) {
                return true;
            }
        }
        return false;
    };
    /**
     * Check if a given scope is present in the request
     *
     * @param cachedScopes
     * @param scopes
     */
    Utils.containsScope = function (cachedScopes, scopes) {
        cachedScopes = this.convertToLowerCase(cachedScopes);
        return scopes.every(function (value) { return cachedScopes.indexOf(value.toString().toLowerCase()) >= 0; });
    };
    /**
     * toLower
     *
     * @param scopes
     */
    // TODO: Rename this, too generic name for a function that only deals with scopes
    Utils.convertToLowerCase = function (scopes) {
        return scopes.map(function (scope) { return scope.toLowerCase(); });
    };
    /**
     * remove one element from a scope array
     *
     * @param scopes
     * @param scope
     */
    // TODO: Rename this, too generic name for a function that only deals with scopes
    Utils.removeElement = function (scopes, scope) {
        return scopes.filter(function (value) { return value !== scope; });
    };
    //#endregion
    //#region URL Processing (Extract to UrlProcessing.ts?)
    Utils.getDefaultRedirectUri = function () {
        return window.location.href.split("?")[0].split("#")[0];
    };
    /**
     * Given a url like https://a:b/common/d?e=f#g, and a tenantId, returns https://a:b/tenantId/d
     * @param href The url
     * @param tenantId The tenant id to replace
     */
    Utils.replaceTenantPath = function (url, tenantId) {
        if (!tenantId) {
            return url;
        }
        var urlObject = this.GetUrlComponents(url);
        var pathArray = urlObject.PathSegments;
        if (pathArray.length !== 0 && (pathArray[0] === Constants_1.Constants.common || pathArray[0] === Constants_1.SSOTypes.ORGANIZATIONS)) {
            pathArray[0] = tenantId;
            url = urlObject.Protocol + "//" + urlObject.HostNameAndPort + "/" + pathArray.join("/");
        }
        return url;
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
     *
     * @param url
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
    // TODO: Rename this, not clear what it is supposed to do
    Utils.endsWith = function (url, suffix) {
        if (!url || !suffix) {
            return false;
        }
        return url.indexOf(suffix, url.length - suffix.length) !== -1;
    };
    /**
     * Utils function to remove the login_hint and domain_hint from the i/p extraQueryParameters
     * @param url
     * @param name
     */
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
    //#endregion
    //#region ExtraQueryParameters Processing (Extract?)
    /**
     * Constructs extraQueryParameters to be sent to the server for the AuthenticationParameters set by the developer
     * in any login() or acquireToken() calls
     * @param idTokenObject
     * @param extraQueryParameters
     * @param sid
     * @param loginHint
     */
    //TODO: check how this behaves when domain_hint only is sent in extraparameters and idToken has no upn.
    Utils.constructUnifiedCacheQueryParameter = function (request, idTokenObject) {
        // preference order: account > sid > login_hint
        var ssoType;
        var ssoData;
        var ssoParam = {};
        var serverReqParam = {};
        // if account info is passed, account.sid > account.login_hint
        if (request) {
            if (request.account) {
                var account = request.account;
                if (account.sid) {
                    ssoType = Constants_1.SSOTypes.SID;
                    ssoData = account.sid;
                }
                else if (account.userName) {
                    ssoType = Constants_1.SSOTypes.LOGIN_HINT;
                    ssoData = account.userName;
                }
            }
            // sid from request
            else if (request.sid) {
                ssoType = Constants_1.SSOTypes.SID;
                ssoData = request.sid;
            }
            // loginHint from request
            else if (request.loginHint) {
                ssoType = Constants_1.SSOTypes.LOGIN_HINT;
                ssoData = request.loginHint;
            }
        }
        // adalIdToken retrieved from cache
        else if (idTokenObject) {
            if (idTokenObject.hasOwnProperty(Constants_1.Constants.upn)) {
                ssoType = Constants_1.SSOTypes.ID_TOKEN;
                ssoData = idTokenObject.upn;
            }
            else {
                ssoType = Constants_1.SSOTypes.ORGANIZATIONS;
                ssoData = null;
            }
        }
        serverReqParam = this.addSSOParameter(ssoType, ssoData, ssoParam);
        // add the HomeAccountIdentifier info/ domain_hint
        if (request && request.account && request.account.homeAccountIdentifier) {
            serverReqParam = this.addSSOParameter(Constants_1.SSOTypes.HOMEACCOUNT_ID, request.account.homeAccountIdentifier, ssoParam);
        }
        return serverReqParam;
    };
    /**
     * Add SID to extraQueryParameters
     * @param sid
     */
    // TODO: Can optimize this later, make ssoParam optional
    Utils.addSSOParameter = function (ssoType, ssoData, ssoParam) {
        switch (ssoType) {
            case Constants_1.SSOTypes.SID: {
                ssoParam[Constants_1.SSOTypes.SID] = ssoData;
                break;
            }
            case Constants_1.SSOTypes.ID_TOKEN: {
                ssoParam[Constants_1.SSOTypes.LOGIN_HINT] = ssoData;
                ssoParam[Constants_1.SSOTypes.DOMAIN_HINT] = Constants_1.SSOTypes.ORGANIZATIONS;
                break;
            }
            case Constants_1.SSOTypes.LOGIN_HINT: {
                ssoParam[Constants_1.SSOTypes.LOGIN_HINT] = ssoData;
                break;
            }
            case Constants_1.SSOTypes.ORGANIZATIONS: {
                ssoParam[Constants_1.SSOTypes.DOMAIN_HINT] = Constants_1.SSOTypes.ORGANIZATIONS;
                break;
            }
            case Constants_1.SSOTypes.CONSUMERS: {
                ssoParam[Constants_1.SSOTypes.DOMAIN_HINT] = Constants_1.SSOTypes.CONSUMERS;
                break;
            }
            case Constants_1.SSOTypes.HOMEACCOUNT_ID: {
                var homeAccountId = ssoData.split(".");
                var uid = Utils.base64DecodeStringUrlSafe(homeAccountId[0]);
                var utid = Utils.base64DecodeStringUrlSafe(homeAccountId[1]);
                // TODO: domain_req and login_req are not needed according to eSTS team
                ssoParam[Constants_1.SSOTypes.LOGIN_REQ] = uid;
                ssoParam[Constants_1.SSOTypes.DOMAIN_REQ] = utid;
                if (utid === Constants_1.Constants.consumersUtid) {
                    ssoParam[Constants_1.SSOTypes.DOMAIN_HINT] = Constants_1.SSOTypes.CONSUMERS;
                }
                else {
                    ssoParam[Constants_1.SSOTypes.DOMAIN_HINT] = Constants_1.SSOTypes.ORGANIZATIONS;
                }
                break;
            }
            case Constants_1.SSOTypes.LOGIN_REQ: {
                ssoParam[Constants_1.SSOTypes.LOGIN_REQ] = ssoData;
                break;
            }
            case Constants_1.SSOTypes.DOMAIN_REQ: {
                ssoParam[Constants_1.SSOTypes.DOMAIN_REQ] = ssoData;
                break;
            }
        }
        return ssoParam;
    };
    /**
     * Utility to generate a QueryParameterString from a Key-Value mapping of extraQueryParameters passed
     * @param extraQueryParameters
     */
    Utils.generateQueryParametersString = function (queryParameters) {
        var paramsString = null;
        if (queryParameters) {
            Object.keys(queryParameters).forEach(function (key) {
                if (paramsString == null) {
                    paramsString = key + "=" + encodeURIComponent(queryParameters[key]);
                }
                else {
                    paramsString += "&" + key + "=" + encodeURIComponent(queryParameters[key]);
                }
            });
        }
        return paramsString;
    };
    /**
     * Check to see if there are SSO params set in the Request
     * @param request
     */
    Utils.isSSOParam = function (request) {
        return request && (request.account || request.sid || request.loginHint);
    };
    //#endregion
    //#region Response Helpers
    Utils.setResponseIdToken = function (originalResponse, idToken) {
        var response = tslib_1.__assign({}, originalResponse);
        response.idToken = idToken;
        if (response.idToken.objectId) {
            response.uniqueId = response.idToken.objectId;
        }
        else {
            response.uniqueId = response.idToken.subject;
        }
        response.tenantId = response.idToken.tenantId;
        return response;
    };
    return Utils;
}());
exports.Utils = Utils;


/***/ }),
/* 1 */
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
var extendStatics = function (d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b)
            if (b.hasOwnProperty(p))
                d[p] = b[p]; };
    return extendStatics(d, b);
};
function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
exports.__extends = __extends;
exports.__assign = function () {
    exports.__assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s)
                if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
        }
        return t;
    };
    return exports.__assign.apply(this, arguments);
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
            step(generator["throw"](value));
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
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
                    return t;
                if (y = 0, t)
                    op = [op[0] & 2, t.value];
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
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
}
exports.__asyncDelegator = __asyncDelegator;
function __asyncValues(o) {
    if (!Symbol.asyncIterator)
        throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function (v) { resolve({ value: v, done: d }); }, reject); }
}
exports.__asyncValues = __asyncValues;
function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) {
        Object.defineProperty(cooked, "raw", { value: raw });
    }
    else {
        cooked.raw = raw;
    }
    return cooked;
}
exports.__makeTemplateObject = __makeTemplateObject;
;
function __importStar(mod) {
    if (mod && mod.__esModule)
        return mod;
    var result = {};
    if (mod != null)
        for (var k in mod)
            if (Object.hasOwnProperty.call(mod, k))
                result[k] = mod[k];
    result.default = mod;
    return result;
}
exports.__importStar = __importStar;
function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
}
exports.__importDefault = __importDefault;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
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
    Object.defineProperty(Constants, "idToken", {
        get: function () { return "id_token"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "adalIdToken", {
        get: function () { return "adal.idtoken"; },
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
    Object.defineProperty(Constants, "msal", {
        get: function () { return "msal"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "no_account", {
        get: function () { return "NO_ACCOUNT"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "consumersUtid", {
        get: function () { return "9188040d-6c67-4c5b-b112-36a304b66dad"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "upn", {
        get: function () { return "upn"; },
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
    Object.defineProperty(Constants, "resourceDelimiter", {
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
    Object.defineProperty(Constants, "homeAccountIdentifier", {
        get: function () { return "homeAccountIdentifier"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "common", {
        get: function () { return "common"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "openidScope", {
        get: function () { return "openid"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "profileScope", {
        get: function () { return "profile"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "cacheLocationLocal", {
        get: function () { return "localStorage"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Constants, "cacheLocationSession", {
        get: function () { return "sessionStorage"; },
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
/**
 * @hidden
 */
exports.CacheKeys = {
    AUTHORITY: "msal_authority",
    ACQUIRE_TOKEN_USER: "msal.acquireTokenUser"
};
/**
 * @hidden
 */
exports.SSOTypes = {
    ACCOUNT: "account",
    SID: "sid",
    LOGIN_HINT: "login_hint",
    ID_TOKEN: "id_token",
    DOMAIN_HINT: "domain_hint",
    ORGANIZATIONS: "organizations",
    CONSUMERS: "consumers",
    ACCOUNT_ID: "accountIdentifier",
    HOMEACCOUNT_ID: "homeAccountIdentifier",
    LOGIN_REQ: "login_req",
    DOMAIN_REQ: "domain_req"
};
/**
 * we considered making this "enum" in the request instead of string, however it looks like the allowed list of
 * prompt values kept changing over past couple of years. There are some undocumented prompt values for some
 * internal partners too, hence the choice of generic "string" type instead of the "enum"
 * @hidden
 */
exports.PromptState = {
    LOGIN: "login",
    SELECT_ACCOUNT: "select_account",
    CONSENT: "consent",
    NONE: "none",
};
exports.Library = {
    version: "1.0.0-preview.1"
};


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var Constants_1 = __webpack_require__(2);
var ClientAuthError_1 = __webpack_require__(6);
exports.ClientConfigurationErrorMessage = {
    invalidCacheLocation: {
        code: "invalid_cache_location",
        desc: "The cache contains multiple tokens satisfying the requirements. " +
            "Call AcquireToken again providing more requirements like authority."
    },
    noRedirectCallbacksSet: {
        code: "no_redirect_callbacks",
        desc: "No redirect callbacks have been set. Please call setRedirectCallbacks() with the appropriate function arguments before continuing. " +
            "More information is available here: https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/-basics."
    },
    invalidCallbackObject: {
        code: "invalid_callback_object",
        desc: "The object passed for the callback was invalid. " +
            "More information is available here: https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/-basics."
    },
    scopesRequired: {
        code: "scopes_required",
        desc: "Scopes are required to obtain an access token."
    },
    emptyScopes: {
        code: "empty_input_scopes_error",
        desc: "Scopes cannot be passed as empty array."
    },
    nonArrayScopes: {
        code: "nonarray_input_scopes_error",
        desc: "Scopes cannot be passed as non-array."
    },
    clientScope: {
        code: "clientid_input_scopes_error",
        desc: "Client ID can only be provided as a single scope."
    },
    invalidPrompt: {
        code: "invalid_prompt_value",
        desc: "Supported prompt values are 'login', 'select_account', 'consent' and 'none'",
    },
    invalidAuthorityType: {
        code: "invalid_authority_type",
        desc: "The given authority is not a valid type of authority supported by MSAL. Please see here for valid authorities: <insert URL here>."
    },
    authorityUriInsecure: {
        code: "authority_uri_insecure",
        desc: "Authority URIs must use https."
    },
    authorityUriInvalidPath: {
        code: "authority_uri_invalid_path",
        desc: "Given authority URI is invalid."
    },
    unsupportedAuthorityValidation: {
        code: "unsupported_authority_validation",
        desc: "The authority validation is not supported for this authority type."
    },
    b2cAuthorityUriInvalidPath: {
        code: "b2c_authority_uri_invalid_path",
        desc: "The given URI for the B2C authority is invalid."
    },
};
/**
 * Error thrown when there is an error in configuration of the .js library.
 */
var ClientConfigurationError = /** @class */ (function (_super) {
    tslib_1.__extends(ClientConfigurationError, _super);
    function ClientConfigurationError(errorCode, errorMessage) {
        var _this = _super.call(this, errorCode, errorMessage) || this;
        _this.name = "ClientConfigurationError";
        Object.setPrototypeOf(_this, ClientConfigurationError.prototype);
        return _this;
    }
    ClientConfigurationError.createInvalidCacheLocationConfigError = function (givenCacheLocation) {
        return new ClientConfigurationError(exports.ClientConfigurationErrorMessage.invalidCacheLocation.code, exports.ClientConfigurationErrorMessage.invalidCacheLocation.desc + " Provided value: " + givenCacheLocation + ". Possible values are: " + Constants_1.Constants.cacheLocationLocal + ", " + Constants_1.Constants.cacheLocationSession + ".");
    };
    ClientConfigurationError.createRedirectCallbacksNotSetError = function () {
        return new ClientConfigurationError(exports.ClientConfigurationErrorMessage.noRedirectCallbacksSet.code, exports.ClientConfigurationErrorMessage.noRedirectCallbacksSet.desc);
    };
    ClientConfigurationError.createInvalidCallbackObjectError = function (callbackType, callbackObject) {
        return new ClientConfigurationError(exports.ClientConfigurationErrorMessage.invalidCallbackObject.code, exports.ClientConfigurationErrorMessage.invalidCallbackObject.desc + " Given value for " + callbackType + " callback function: " + callbackObject);
    };
    ClientConfigurationError.createEmptyScopesArrayError = function (scopesValue) {
        return new ClientConfigurationError(exports.ClientConfigurationErrorMessage.emptyScopes.code, exports.ClientConfigurationErrorMessage.emptyScopes.desc + " Given value: " + scopesValue + ".");
    };
    ClientConfigurationError.createScopesNonArrayError = function (scopesValue) {
        return new ClientConfigurationError(exports.ClientConfigurationErrorMessage.nonArrayScopes.code, exports.ClientConfigurationErrorMessage.nonArrayScopes.desc + " Given value: " + scopesValue + ".");
    };
    ClientConfigurationError.createClientIdSingleScopeError = function (scopesValue) {
        return new ClientConfigurationError(exports.ClientConfigurationErrorMessage.clientScope.code, exports.ClientConfigurationErrorMessage.clientScope.desc + " Given value: " + scopesValue + ".");
    };
    ClientConfigurationError.createScopesRequiredError = function (scopesValue) {
        return new ClientConfigurationError(exports.ClientConfigurationErrorMessage.scopesRequired.code, exports.ClientConfigurationErrorMessage.scopesRequired.desc + " Given value: " + scopesValue);
    };
    ClientConfigurationError.createInvalidPromptError = function (promptValue) {
        return new ClientConfigurationError(exports.ClientConfigurationErrorMessage.invalidPrompt.code, exports.ClientConfigurationErrorMessage.invalidPrompt.desc + " Given value: " + promptValue);
    };
    return ClientConfigurationError;
}(ClientAuthError_1.ClientAuthError));
exports.ClientConfigurationError = ClientConfigurationError;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = __webpack_require__(0);
var ClientConfigurationError_1 = __webpack_require__(3);
var XHRClient_1 = __webpack_require__(12);
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
            throw ClientConfigurationError_1.ClientConfigurationErrorMessage.invalidAuthorityType;
        }
        if (!components.Protocol || components.Protocol.toLowerCase() !== "https:") {
            throw ClientConfigurationError_1.ClientConfigurationErrorMessage.authorityUriInsecure;
        }
        if (!components.PathSegments || components.PathSegments.length < 1) {
            throw ClientConfigurationError_1.ClientConfigurationErrorMessage.authorityUriInvalidPath;
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
    Authority.prototype.resolveEndpointsAsync = function () {
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
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
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
    tslib_1.__extends(AuthError, _super);
    function AuthError(errorCode, errorMessage) {
        var _this = _super.call(this, errorMessage) || this;
        Object.setPrototypeOf(_this, AuthError.prototype);
        _this.errorCode = errorCode;
        _this.errorMessage = errorMessage;
        _this.name = "AuthError";
        return _this;
    }
    AuthError.createUnexpectedError = function (errDesc) {
        return new AuthError(exports.AuthErrorMessage.unexpectedError.code, exports.AuthErrorMessage.unexpectedError.desc + ": " + errDesc);
    };
    return AuthError;
}(Error));
exports.AuthError = AuthError;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var AuthError_1 = __webpack_require__(5);
var Utils_1 = __webpack_require__(0);
exports.ClientAuthErrorMessage = {
    multipleMatchingTokens: {
        code: "multiple_matching_tokens",
        desc: "The cache contains multiple tokens satisfying the requirements. " +
            "Call AcquireToken again providing more requirements like authority."
    },
    multipleCacheAuthorities: {
        code: "multiple_authorities",
        desc: "Multiple authorities found in the cache. Pass authority in the API overload."
    },
    endpointResolutionError: {
        code: "endpoints_resolution_error",
        desc: "Error: could not resolve endpoints. Please check network and try again."
    },
    popUpWindowError: {
        code: "popup_window_error",
        desc: "Error opening popup window. This can happen if you are using IE or if popups are blocked in the browser."
    },
    tokenRenewalError: {
        code: "token_renewal_error",
        desc: "Token renewal operation failed due to timeout."
    },
    invalidIdToken: {
        code: "invalid_id_token",
        desc: "Invalid ID token."
    },
    invalidStateError: {
        code: "invalid_state_error",
        desc: "Invalid state."
    },
    nonceMismatchError: {
        code: "nonce_mismatch_error",
        desc: "Nonce is not matching, Nonce received: "
    },
    loginProgressError: {
        code: "login_progress_error",
        desc: "Login_In_Progress: Error during login call - login is already in progress."
    },
    acquireTokenProgressError: {
        code: "acquiretoken_progress_error",
        desc: "AcquireToken_In_Progress: Error during login call - login is already in progress."
    },
    userCancelledError: {
        code: "user_cancelled",
        desc: "User cancelled the flow."
    },
    callbackError: {
        code: "callback_error",
        desc: "Error occurred in token received callback function."
    },
    userLoginRequiredError: {
        code: "user_login_error",
        desc: "User login is required."
    },
    userDoesNotExistError: {
        code: "user_non_existent",
        desc: "User object does not exist. Please call a login API."
    }
};
/**
 * Error thrown when there is an error in the client code running on the browser.
 */
var ClientAuthError = /** @class */ (function (_super) {
    tslib_1.__extends(ClientAuthError, _super);
    function ClientAuthError(errorCode, errorMessage) {
        var _this = _super.call(this, errorCode, errorMessage) || this;
        _this.name = "ClientAuthError";
        Object.setPrototypeOf(_this, ClientAuthError.prototype);
        return _this;
    }
    ClientAuthError.createEndpointResolutionError = function (errDetail) {
        var errorMessage = exports.ClientAuthErrorMessage.endpointResolutionError.desc;
        if (errDetail && !Utils_1.Utils.isEmpty(errDetail)) {
            errorMessage += " Details: " + errDetail;
        }
        return new ClientAuthError(exports.ClientAuthErrorMessage.endpointResolutionError.code, errorMessage);
    };
    ClientAuthError.createMultipleMatchingTokensInCacheError = function (scope) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.multipleMatchingTokens.code, "Cache error for scope " + scope + ": " + exports.ClientAuthErrorMessage.multipleMatchingTokens.desc + ".");
    };
    ClientAuthError.createMultipleAuthoritiesInCacheError = function (scope) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.multipleCacheAuthorities.code, "Cache error for scope " + scope + ": " + exports.ClientAuthErrorMessage.multipleCacheAuthorities.desc + ".");
    };
    ClientAuthError.createPopupWindowError = function (errDetail) {
        var errorMessage = exports.ClientAuthErrorMessage.popUpWindowError.desc;
        if (errDetail && !Utils_1.Utils.isEmpty(errDetail)) {
            errorMessage += " Details: " + errDetail;
        }
        return new ClientAuthError(exports.ClientAuthErrorMessage.popUpWindowError.code, errorMessage);
    };
    ClientAuthError.createTokenRenewalTimeoutError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.tokenRenewalError.code, exports.ClientAuthErrorMessage.tokenRenewalError.desc);
    };
    ClientAuthError.createInvalidIdTokenError = function (idToken) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.invalidIdToken.code, exports.ClientAuthErrorMessage.invalidIdToken.desc + " Given token: " + idToken);
    };
    //TODO: Is this not a security flaw to send the user the state expected??
    ClientAuthError.createInvalidStateError = function (invalidState, actualState) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.invalidStateError.code, exports.ClientAuthErrorMessage.invalidStateError.desc + " " + invalidState + ", state expected : " + actualState + ".");
    };
    //TODO: Is this not a security flaw to send the user the Nonce expected??
    ClientAuthError.createNonceMismatchError = function (invalidNonce, actualNonce) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.nonceMismatchError.code, exports.ClientAuthErrorMessage.nonceMismatchError.desc + " " + invalidNonce + ", nonce expected : " + actualNonce + ".");
    };
    ClientAuthError.createLoginInProgressError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.loginProgressError.code, exports.ClientAuthErrorMessage.loginProgressError.desc);
    };
    ClientAuthError.createAcquireTokenInProgressError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.acquireTokenProgressError.code, exports.ClientAuthErrorMessage.acquireTokenProgressError.desc);
    };
    ClientAuthError.createUserCancelledError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.userCancelledError.code, exports.ClientAuthErrorMessage.userCancelledError.desc);
    };
    ClientAuthError.createErrorInCallbackFunction = function (errorDesc) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.callbackError.code, exports.ClientAuthErrorMessage.callbackError.desc + " " + errorDesc + ".");
    };
    ClientAuthError.createUserLoginRequiredError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.userLoginRequiredError.code, exports.ClientAuthErrorMessage.userLoginRequiredError.desc);
    };
    ClientAuthError.createUserDoesNotExistError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.userDoesNotExistError.code, exports.ClientAuthErrorMessage.userDoesNotExistError.desc);
    };
    return ClientAuthError;
}(AuthError_1.AuthError));
exports.ClientAuthError = ClientAuthError;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
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
        this.level = LogLevel.Info;
        var _a = options.correlationId, correlationId = _a === void 0 ? "" : _a, _b = options.level, level = _b === void 0 ? LogLevel.Info : _b, _c = options.piiLoggingEnabled, piiLoggingEnabled = _c === void 0 ? false : _c;
        this.localCallback = localCallback;
        this.correlationId = correlationId;
        this.level = level;
        this.piiLoggingEnabled = piiLoggingEnabled;
    }
    /**
     * @hidden
     */
    Logger.prototype.logMessage = function (logLevel, logMessage, containsPii) {
        if ((logLevel > this.level) || (!this.piiLoggingEnabled && containsPii)) {
            return;
        }
        var timestamp = new Date().toUTCString();
        var log;
        if (!Utils_1.Utils.isEmpty(this.correlationId)) {
            log = timestamp + ":" + this.correlationId + "-" + Utils_1.Utils.getLibraryVersion() + "-" + LogLevel[logLevel] + " " + logMessage;
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
        if (this.localCallback) {
            this.localCallback(level, message, containsPii);
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
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var AuthError_1 = __webpack_require__(5);
exports.ServerErrorMessage = {
    serverUnavailable: {
        code: "server_unavailable",
        desc: "Server is temporarily unavailable."
    },
    unknownServerError: {
        code: "unknown_server_error"
    },
};
/**
 * Error thrown when there is an error with the server code, for example, unavailability.
 */
var ServerError = /** @class */ (function (_super) {
    tslib_1.__extends(ServerError, _super);
    function ServerError(errorCode, errorMessage) {
        var _this = _super.call(this, errorCode, errorMessage) || this;
        _this.name = "ServerError";
        Object.setPrototypeOf(_this, ServerError.prototype);
        return _this;
    }
    ServerError.createServerUnavailableError = function () {
        return new ServerError(exports.ServerErrorMessage.serverUnavailable.code, exports.ServerErrorMessage.serverUnavailable.desc);
    };
    ServerError.createUnknownServerError = function (errorDesc) {
        return new ServerError(exports.ServerErrorMessage.unknownServerError.code, errorDesc);
    };
    return ServerError;
}(AuthError_1.AuthError));
exports.ServerError = ServerError;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var AccessTokenKey_1 = __webpack_require__(17);
var AccessTokenValue_1 = __webpack_require__(18);
var ServerRequestParameters_1 = __webpack_require__(19);
var ClientInfo_1 = __webpack_require__(20);
var Constants_1 = __webpack_require__(2);
var IdToken_1 = __webpack_require__(21);
var Storage_1 = __webpack_require__(22);
var Account_1 = __webpack_require__(10);
var Utils_1 = __webpack_require__(0);
var AuthorityFactory_1 = __webpack_require__(24);
var Configuration_1 = __webpack_require__(13);
var ClientConfigurationError_1 = __webpack_require__(3);
var AuthError_1 = __webpack_require__(5);
var ClientAuthError_1 = __webpack_require__(6);
var ServerError_1 = __webpack_require__(8);
var InteractionRequiredAuthError_1 = __webpack_require__(14);
// default authority
/**
 * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
 * - In Azure AD, it is of the form https://&lt;tenant&gt;/&lt;tenant&gt;, where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
 * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/<policyName>/
 * - Default value is: "https://login.microsoftonline.com/common"
 */
var DEFAULT_AUTHORITY = "https://login.microsoftonline.com/common";
/**
 * response_type from OpenIDConnect
 * References: https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html & https://tools.ietf.org/html/rfc6749#section-4.2.1
 * Since we support only implicit flow in this library, we restrict the response_type support to only 'token' and 'id_token'
 *
 * @hidden
 */
var ResponseTypes = {
    id_token: "id_token",
    token: "token",
    id_token_token: "id_token token"
};
/**
 * A wrapper to handle the token response/error within the iFrame always
 *
 * @param target
 * @param propertyKey
 * @param descriptor
 */
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
/**
 * UserAgentApplication class - Object Instance that the developer would need to make login/acquireToken calls
 */
var UserAgentApplication = /** @class */ (function () {
    /**
     * Initialize a UserAgentApplication with a given clientId and authority.
     * @constructor
     *
     * @param {string} clientId - The clientID of your application, you should get this from the application registration portal.
     * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
     * - In Azure AD, it is of the form https://&lt;instance>/&lt;tenant&gt;,\ where &lt;instance&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
     * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenantId&gt;/&lt;policyName&gt;/
     * - Default value is: "https://login.microsoftonline.com/common"
     * @param _tokenReceivedCallback -  The function that will get the call back once this API is completed (either successfully or with a failure).
     * @param {boolean} validateAuthority -  boolean to turn authority validation on/off.
     */
    function UserAgentApplication(configuration) {
        // callbacks for token/error
        this.tokenReceivedCallback = null;
        this.errorReceivedCallback = null;
        // Set the Configuration
        this.config = Configuration_1.buildConfiguration(configuration);
        // Set the callback boolean
        this.redirectCallbacksSet = false;
        this.logger = this.config.system.logger;
        this.clientId = this.config.auth.clientId;
        this.inCookie = this.config.cache.storeAuthStateInCookie;
        // if no authority is passed, set the default: "https://login.microsoftonline.com/common"
        this.authority = this.config.auth.authority || DEFAULT_AUTHORITY;
        // track login and acquireToken in progress
        this.loginInProgress = false;
        this.acquireTokenInProgress = false;
        // cache keys msal - typescript throws an error if any value other than "localStorage" or "sessionStorage" is passed
        try {
            this.cacheStorage = new Storage_1.Storage(this.config.cache.cacheLocation);
        }
        catch (e) {
            throw ClientConfigurationError_1.ClientConfigurationError.createInvalidCacheLocationConfigError(this.config.cache.cacheLocation);
        }
        // Initialize window handling code
        window.openedWindows = [];
        window.activeRenewals = {};
        window.renewStates = [];
        window.callbackMappedToRenewStates = {};
        window.promiseMappedToRenewStates = {};
        window.msal = this;
        var urlHash = window.location.hash;
        var isCallback = this.isCallback(urlHash);
        // On the server 302 - Redirect, handle this
        if (!this.config.framework.isAngular) {
            if (isCallback) {
                this.handleAuthenticationResponse(urlHash);
            }
        }
    }
    Object.defineProperty(UserAgentApplication.prototype, "authority", {
        // retrieve the authority instance
        get: function () {
            return this.authorityInstance.CanonicalAuthority;
        },
        // If the developer passes an authority, create an instance
        set: function (val) {
            this.authorityInstance = AuthorityFactory_1.AuthorityFactory.CreateInstance(val, this.config.auth.validateAuthority);
        },
        enumerable: true,
        configurable: true
    });
    UserAgentApplication.prototype.getAuthorityInstance = function () {
        return this.authorityInstance;
    };
    //#region Redirect Callbacks
    /**
     * Sets the callback functions for the redirect flow to send back the success or error object.
     * @param {tokenReceivedCallback} successCallback - Callback which contains the AuthResponse object, containing data from the server.
     * @param {errorReceivedCallback} errorCallback - Callback which contains a AuthError object, containing error data from either the server
     * or the library, depending on the origin of the error.
     */
    UserAgentApplication.prototype.handleRedirectCallbacks = function (successCallback, errorCallback) {
        if (!successCallback) {
            this.redirectCallbacksSet = false;
            throw ClientConfigurationError_1.ClientConfigurationError.createInvalidCallbackObjectError("successCallback", successCallback);
        }
        else if (!errorCallback) {
            this.redirectCallbacksSet = false;
            throw ClientConfigurationError_1.ClientConfigurationError.createInvalidCallbackObjectError("errorCallback", errorCallback);
        }
        // Set callbacks
        this.tokenReceivedCallback = successCallback;
        this.errorReceivedCallback = errorCallback;
        this.redirectCallbacksSet = true;
        // On the server 302 - Redirect, handle this
        // TODO: rename pendingCallback to cachedHash
        if (!this.config.framework.isAngular) {
            var pendingCallback = this.cacheStorage.getItem(Constants_1.Constants.urlHash);
            if (pendingCallback) {
                this.processCallBack(pendingCallback, null);
            }
        }
    };
    //#endregion
    //#region Redirect Flow
    /**
     * Initiate the login process by redirecting the user to the STS authorization endpoint.
     * @param {Array.<string>} scopes - Permissions you want included in the access token. Not all scopes are guaranteed to be included in the access token returned.
     * @param {string} extraQueryParameters - Key-value pairs to pass to the authentication server during the interactive authentication flow.
     */
    UserAgentApplication.prototype.loginRedirect = function (request) {
        var _this = this;
        // Throw error if callbacks are not set before redirect
        if (!this.redirectCallbacksSet) {
            throw ClientConfigurationError_1.ClientConfigurationError.createRedirectCallbacksNotSetError();
        }
        // Creates navigate url; saves value in cache; redirect user to AAD
        if (this.loginInProgress) {
            this.errorReceivedCallback(ClientAuthError_1.ClientAuthError.createLoginInProgressError(), this.getAccountState(this.silentAuthenticationState));
            return;
        }
        // if extraScopesToConsent is passed, append them to the login request
        var scopes = this.appendScopes(request);
        // Validate and filter scopes (the validate function will throw if validation fails)
        this.validateInputScope(scopes, false);
        var account = this.getAccount();
        // defer queryParameters generation to Helper if developer passes account/sid/login_hint
        if (Utils_1.Utils.isSSOParam(request)) {
            // if account is not provided, we pass null
            this.loginRedirectHelper(account, request, scopes);
        }
        // else handle the library data
        else {
            // extract ADAL id_token if exists
            var adalIdToken = this.extractADALIdToken();
            // silent login if ADAL id_token is retrieved successfully - SSO
            if (adalIdToken && !scopes) {
                this.logger.info("ADAL's idToken exists. Extracting login information from ADAL's idToken ");
                var tokenRequest = this.buildIDTokenRequest(request);
                this.silentLogin = true;
                this.acquireTokenSilent(tokenRequest).then(function (response) {
                    _this.silentLogin = false;
                    _this.logger.info("Unified cache call is successful");
                    if (_this.tokenReceivedCallback) {
                        _this.tokenReceivedCallback(response);
                    }
                }, function (error) {
                    _this.silentLogin = false;
                    _this.logger.error("Error occurred during unified cache ATS");
                    // call the loginRedirectHelper later with no user account context
                    _this.loginRedirectHelper(null, request, scopes);
                });
            }
            // else proceed to login
            else {
                // call the loginRedirectHelper later with no user account context
                this.loginRedirectHelper(null, request, scopes);
            }
        }
    };
    /**
     * Helper function to loginRedirect
     *
     * @hidden
     * @param scopes
     * @param extraQueryParameters
     */
    UserAgentApplication.prototype.loginRedirectHelper = function (account, request, scopes) {
        var _this = this;
        // Track login in progress
        this.loginInProgress = true;
        this.authorityInstance.resolveEndpointsAsync().then(function () {
            // create the Request to be sent to the Server
            var serverAuthenticationRequest = new ServerRequestParameters_1.ServerRequestParameters(_this.authorityInstance, _this.clientId, scopes, ResponseTypes.id_token, _this.getRedirectUri(), _this.config.auth.state);
            // populate QueryParameters (sid/login_hint/domain_hint) and any other extraQueryParameters set by the developer
            serverAuthenticationRequest = _this.populateQueryParams(account, request, serverAuthenticationRequest);
            // if the user sets the login start page - angular only??
            var loginStartPage = _this.cacheStorage.getItem(Constants_1.Constants.angularLoginRequest);
            if (!loginStartPage || loginStartPage === "") {
                loginStartPage = window.location.href;
            }
            else {
                _this.cacheStorage.setItem(Constants_1.Constants.angularLoginRequest, "");
            }
            // Cache the state, nonce, and login request data
            _this.cacheStorage.setItem(Constants_1.Constants.loginRequest, loginStartPage, _this.inCookie);
            _this.cacheStorage.setItem(Constants_1.Constants.loginError, "");
            _this.cacheStorage.setItem(Constants_1.Constants.stateLogin, serverAuthenticationRequest.state, _this.inCookie);
            _this.cacheStorage.setItem(Constants_1.Constants.nonceIdToken, serverAuthenticationRequest.nonce, _this.inCookie);
            _this.cacheStorage.setItem(Constants_1.Constants.msalError, "");
            _this.cacheStorage.setItem(Constants_1.Constants.msalErrorDescription, "");
            // Cache authorityKey
            _this.setAuthorityCache(serverAuthenticationRequest.state, _this.authority);
            // build URL to navigate to proceed with the login
            var urlNavigate = serverAuthenticationRequest.createNavigateUrl(scopes) + Constants_1.Constants.response_mode_fragment;
            // Redirect user to login URL
            _this.promptUser(urlNavigate);
        });
    };
    /**
     * Used to obtain an access_token by redirecting the user to the authorization endpoint.
     * To renew idToken, clientId should be passed as the only scope in the scopes array.
     * @param {Array<string>} scopes - Permissions you want included in the access token. Not all scopes are  guaranteed to be included in the access token. Scopes like "openid" and "profile" are sent with every request.
     * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
     * - In Azure AD, it is of the form https://{instance}/&lt;tenant&gt;, where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
     * - In Azure B2C, it is of the form https://{instance}/tfp/&lt;tenant&gt;/<policyName>
     * - Default value is: "https://login.microsoftonline.com/common"
     * @param {Account} account - The account for which the scopes are requested.The default account is the logged in account.
     * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the  authentication flow.
     */
    UserAgentApplication.prototype.acquireTokenRedirect = function (request) {
        var _this = this;
        // Throw error if callbacks are not set before redirect
        if (!this.redirectCallbacksSet) {
            throw ClientConfigurationError_1.ClientConfigurationError.createRedirectCallbacksNotSetError();
        }
        // Validate and filter scopes (the validate function will throw if validation fails)
        this.validateInputScope(request.scopes, true);
        // Get the account object if a session exists
        var account = request.account || this.getAccount();
        // If already in progress, do not proceed
        if (this.acquireTokenInProgress) {
            this.errorReceivedCallback(ClientAuthError_1.ClientAuthError.createAcquireTokenInProgressError(), this.getAccountState(this.silentAuthenticationState));
            return;
        }
        // If no session exists, prompt the user to login.
        var scope = request.scopes.join(" ").toLowerCase();
        if (!account && !(request.sid || request.loginHint)) {
            this.logger.info("User login is required");
            throw ClientAuthError_1.ClientAuthError.createUserLoginRequiredError();
        }
        var serverAuthenticationRequest;
        var acquireTokenAuthority = request.authority ? AuthorityFactory_1.AuthorityFactory.CreateInstance(request.authority, this.config.auth.validateAuthority) : this.authorityInstance;
        // Track the acquireToken progress
        this.acquireTokenInProgress = true;
        acquireTokenAuthority.resolveEndpointsAsync().then(function () {
            // On Fulfillment
            var responseType = _this.getTokenType(account, request.scopes, false);
            serverAuthenticationRequest = new ServerRequestParameters_1.ServerRequestParameters(acquireTokenAuthority, _this.clientId, request.scopes, responseType, _this.getRedirectUri(), _this.config.auth.state);
            // Cache nonce
            _this.cacheStorage.setItem(Constants_1.Constants.nonceIdToken, serverAuthenticationRequest.nonce, _this.inCookie);
            // Cache account and authority
            _this.setAccountCache(account, serverAuthenticationRequest.state);
            _this.setAuthorityCache(serverAuthenticationRequest.state, acquireTokenAuthority.CanonicalAuthority);
            // populate QueryParameters (sid/login_hint/domain_hint) and any other extraQueryParameters set by the developer
            serverAuthenticationRequest = _this.populateQueryParams(account, request, serverAuthenticationRequest);
            // Construct urlNavigate
            var urlNavigate = serverAuthenticationRequest.createNavigateUrl(request.scopes) + Constants_1.Constants.response_mode_fragment;
            // set state in cache and redirect to urlNavigate
            if (urlNavigate) {
                _this.cacheStorage.setItem(Constants_1.Constants.stateAcquireToken, serverAuthenticationRequest.state, _this.inCookie);
                window.location.replace(urlNavigate);
            }
        });
    };
    /**
     * Checks if the redirect response is received from the STS. In case of redirect, the url fragment has either id_token, access_token or error.
     * @param {string} hash - Hash passed from redirect page.
     * @returns {Boolean} - true if response contains id_token, access_token or error, false otherwise.
     * @hidden
     */
    // TODO - rename this, the name is confusing
    UserAgentApplication.prototype.isCallback = function (hash) {
        hash = this.getHash(hash);
        var parameters = Utils_1.Utils.deserialize(hash);
        return (parameters.hasOwnProperty(Constants_1.Constants.errorDescription) ||
            parameters.hasOwnProperty(Constants_1.Constants.error) ||
            parameters.hasOwnProperty(Constants_1.Constants.accessToken) ||
            parameters.hasOwnProperty(Constants_1.Constants.idToken));
    };
    //#endregion
    //#region Popup Flow
    /**
     * Initiate the login process by opening a popup window.
     * @param {Array.<string>} scopes - Permissions you want included in the access token. Not all scopes are  guaranteed to be included in the access token returned.
     * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the interactive authentication flow.
     * @returns {Promise.<string>} - A Promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the token or error.
     */
    UserAgentApplication.prototype.loginPopup = function (request) {
        var _this = this;
        // Creates navigate url; saves value in cache; redirect user to AAD
        return new Promise(function (resolve, reject) {
            // Fail if login is already in progress
            if (_this.loginInProgress) {
                return reject(ClientAuthError_1.ClientAuthError.createLoginInProgressError());
            }
            // if extraScopesToConsent is passed, append them to the login request
            var scopes = _this.appendScopes(request);
            // Validate and filter scopes (the validate function will throw if validation fails)
            _this.validateInputScope(scopes, false);
            var account = _this.getAccount();
            // add the prompt parameter to the 'extraQueryParameters' if passed
            if (Utils_1.Utils.isSSOParam(request)) {
                // if account is not provided, we pass null
                _this.loginPopupHelper(account, request, resolve, reject, scopes);
            }
            // else handle the library data
            else {
                // Extract ADAL id_token if it exists
                var adalIdToken = _this.extractADALIdToken();
                // silent login if ADAL id_token is retrieved successfully - SSO
                if (adalIdToken && !scopes) {
                    _this.logger.info("ADAL's idToken exists. Extracting login information from ADAL's idToken ");
                    var tokenRequest = _this.buildIDTokenRequest(request);
                    _this.silentLogin = true;
                    _this.acquireTokenSilent(tokenRequest)
                        .then(function (response) {
                        _this.silentLogin = false;
                        _this.logger.info("Unified cache call is successful");
                        resolve(response);
                    }, function (error) {
                        _this.silentLogin = false;
                        _this.logger.error("Error occurred during unified cache ATS");
                        _this.loginPopupHelper(null, request, resolve, reject, scopes);
                    });
                }
                // else proceed with login
                else {
                    _this.loginPopupHelper(null, request, resolve, reject, scopes);
                }
            }
        });
    };
    /**
     * Helper function to loginPopup
     *
     * @hidden
     * @param resolve
     * @param reject
     * @param scopes
     * @param extraQueryParameters
     */
    UserAgentApplication.prototype.loginPopupHelper = function (account, request, resolve, reject, scopes) {
        var _this = this;
        if (!scopes) {
            scopes = [this.clientId];
        }
        var scope = scopes.join(" ").toLowerCase();
        // Generate a popup window
        var popUpWindow = this.openWindow("about:blank", "_blank", 1, this, resolve, reject);
        if (!popUpWindow) {
            // We pass reject in openWindow, we reject there during an error
            return;
        }
        // Track login progress
        this.loginInProgress = true;
        // Resolve endpoint
        this.authorityInstance.resolveEndpointsAsync().then(function () {
            var serverAuthenticationRequest = new ServerRequestParameters_1.ServerRequestParameters(_this.authorityInstance, _this.clientId, scopes, ResponseTypes.id_token, _this.getRedirectUri(), _this.config.auth.state);
            // populate QueryParameters (sid/login_hint/domain_hint) and any other extraQueryParameters set by the developer;
            serverAuthenticationRequest = _this.populateQueryParams(account, request, serverAuthenticationRequest);
            // Cache the state, nonce, and login request data
            _this.cacheStorage.setItem(Constants_1.Constants.loginRequest, window.location.href, _this.inCookie);
            _this.cacheStorage.setItem(Constants_1.Constants.loginError, "");
            _this.cacheStorage.setItem(Constants_1.Constants.nonceIdToken, serverAuthenticationRequest.nonce, _this.inCookie);
            _this.cacheStorage.setItem(Constants_1.Constants.msalError, "");
            _this.cacheStorage.setItem(Constants_1.Constants.msalErrorDescription, "");
            // cache authorityKey
            _this.setAuthorityCache(serverAuthenticationRequest.state, _this.authority);
            // Build the URL to navigate to in the popup window
            var urlNavigate = serverAuthenticationRequest.createNavigateUrl(scopes) + Constants_1.Constants.response_mode_fragment;
            window.renewStates.push(serverAuthenticationRequest.state);
            window.requestType = Constants_1.Constants.login;
            // Register callback to capture results from server
            _this.registerCallback(serverAuthenticationRequest.state, scope, resolve, reject);
            // Navigate url in popupWindow
            if (popUpWindow) {
                _this.logger.infoPii("Navigated Popup window to:" + urlNavigate);
                popUpWindow.location.href = urlNavigate;
            }
        }, function () {
            // Endpoint resolution failure error
            _this.logger.info(Constants_1.ErrorCodes.endpointResolutionError + ":" + Constants_1.ErrorDescription.endpointResolutionError);
            _this.cacheStorage.setItem(Constants_1.Constants.msalError, Constants_1.ErrorCodes.endpointResolutionError);
            _this.cacheStorage.setItem(Constants_1.Constants.msalErrorDescription, Constants_1.ErrorDescription.endpointResolutionError);
            // What is this? Is this the reject that is passed in?? -- REDO this in the subsequent refactor, passing reject is confusing
            if (reject) {
                reject(ClientAuthError_1.ClientAuthError.createEndpointResolutionError());
            }
            // Close the popup window
            if (popUpWindow) {
                popUpWindow.close();
            }
        }).catch(function (err) {
            // All catch - when is this executed? Possibly when error is thrown, but not if previous function rejects instead of throwing
            _this.logger.warning("could not resolve endpoints");
            reject(ClientAuthError_1.ClientAuthError.createEndpointResolutionError(err.toString));
        });
    };
    /**
     * Used to acquire an access token for a new user using interactive authentication via a popup Window.
     * To request an id_token, pass the clientId as the only scope in the scopes array.
     * @param {Array<string>} scopes - Permissions you want included in the access token. Not all scopes are  guaranteed to be included in the access token. Scopes like "openid" and "profile" are sent with every request.
     * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
     * - In Azure AD, it is of the form https://&lt;tenant&gt;/&lt;tenant&gt;, where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
     * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/<policyName>/
     * - Default value is: "https://login.microsoftonline.com/common".
     * @param {Account} account - The account for which the scopes are requested.The default account is the logged in account.
     * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the  authentication flow.
     * @returns {Promise.<string>} - A Promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the token or error.
     */
    UserAgentApplication.prototype.acquireTokenPopup = function (request) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // Validate and filter scopes (the validate function will throw if validation fails)
            _this.validateInputScope(request.scopes, true);
            var scope = request.scopes.join(" ").toLowerCase();
            // Get the account object if a session exists
            var account = request.account || _this.getAccount();
            // If already in progress, throw an error and reject the request
            if (_this.acquireTokenInProgress) {
                return reject(ClientAuthError_1.ClientAuthError.createAcquireTokenInProgressError());
            }
            // If no session exists, prompt the user to login.
            if (!account && !!(request.sid || request.loginHint)) {
                _this.logger.info("User login is required");
                return reject(ClientAuthError_1.ClientAuthError.createUserLoginRequiredError());
            }
            // track the acquireToken progress
            _this.acquireTokenInProgress = true;
            var serverAuthenticationRequest;
            var acquireTokenAuthority = request.authority ? AuthorityFactory_1.AuthorityFactory.CreateInstance(request.authority, _this.config.auth.validateAuthority) : _this.authorityInstance;
            // Open the popup window
            var popUpWindow = _this.openWindow("about:blank", "_blank", 1, _this, resolve, reject);
            if (!popUpWindow) {
                // We pass reject to openWindow, so we are rejecting there.
                return;
            }
            acquireTokenAuthority.resolveEndpointsAsync().then(function () {
                // On fullfillment
                var responseType = _this.getTokenType(account, request.scopes, false);
                serverAuthenticationRequest = new ServerRequestParameters_1.ServerRequestParameters(acquireTokenAuthority, _this.clientId, request.scopes, responseType, _this.getRedirectUri(), _this.config.auth.state);
                // populate QueryParameters (sid/login_hint/domain_hint) and any other extraQueryParameters set by the developer
                serverAuthenticationRequest = _this.populateQueryParams(account, request, serverAuthenticationRequest);
                // Cache nonce
                _this.cacheStorage.setItem(Constants_1.Constants.nonceIdToken, serverAuthenticationRequest.nonce, _this.inCookie);
                serverAuthenticationRequest.state = serverAuthenticationRequest.state;
                // Cache account and authority
                _this.setAccountCache(account, serverAuthenticationRequest.state);
                _this.setAuthorityCache(serverAuthenticationRequest.state, acquireTokenAuthority.CanonicalAuthority);
                // Construct the urlNavigate
                var urlNavigate = serverAuthenticationRequest.createNavigateUrl(request.scopes) + Constants_1.Constants.response_mode_fragment;
                window.renewStates.push(serverAuthenticationRequest.state);
                window.requestType = Constants_1.Constants.renewToken;
                _this.registerCallback(serverAuthenticationRequest.state, scope, resolve, reject);
                // open popup window to urlNavigate
                if (popUpWindow) {
                    popUpWindow.location.href = urlNavigate;
                }
            }, function () {
                // On rejection
                _this.logger.info(Constants_1.ErrorCodes.endpointResolutionError + ":" + Constants_1.ErrorDescription.endpointResolutionError);
                _this.cacheStorage.setItem(Constants_1.Constants.msalError, Constants_1.ErrorCodes.endpointResolutionError);
                _this.cacheStorage.setItem(Constants_1.Constants.msalErrorDescription, Constants_1.ErrorDescription.endpointResolutionError);
                if (reject) {
                    reject(ClientAuthError_1.ClientAuthError.createEndpointResolutionError());
                }
                if (popUpWindow) {
                    popUpWindow.close();
                }
            }).catch(function (err) {
                _this.logger.warning("could not resolve endpoints");
                reject(ClientAuthError_1.ClientAuthError.createEndpointResolutionError(err.toString()));
            });
        });
    };
    /**
     * Used to send the user to the redirect_uri after authentication is complete. The user's bearer token is attached to the URI fragment as an id_token/access_token field.
     * This function also closes the popup window after redirection.
     *
     * @param urlNavigate
     * @param title
     * @param interval
     * @param instance
     * @param resolve
     * @param reject
     * @hidden
     * @ignore
     */
    UserAgentApplication.prototype.openWindow = function (urlNavigate, title, interval, instance, resolve, reject) {
        var _this = this;
        // Generate a popup window
        var popupWindow;
        try {
            popupWindow = this.openPopup(urlNavigate, title, Constants_1.Constants.popUpWidth, Constants_1.Constants.popUpHeight);
        }
        catch (e) {
            instance.loginInProgress = false;
            instance.acquireTokenInProgress = false;
            this.logger.info(Constants_1.ErrorCodes.popUpWindowError + ":" + Constants_1.ErrorDescription.popUpWindowError);
            this.cacheStorage.setItem(Constants_1.Constants.msalError, Constants_1.ErrorCodes.popUpWindowError);
            this.cacheStorage.setItem(Constants_1.Constants.msalErrorDescription, Constants_1.ErrorDescription.popUpWindowError);
            if (reject) {
                reject(ClientAuthError_1.ClientAuthError.createPopupWindowError());
            }
            return null;
        }
        // Push popup window handle onto stack for tracking
        window.openedWindows.push(popupWindow);
        var pollTimer = window.setInterval(function () {
            // If popup closed or login in progress, cancel login
            if (popupWindow && popupWindow.closed && instance.loginInProgress) {
                if (reject) {
                    reject(ClientAuthError_1.ClientAuthError.createUserCancelledError());
                }
                window.clearInterval(pollTimer);
                if (_this.config.framework.isAngular) {
                    _this.broadcast("msal:popUpClosed", Constants_1.ErrorCodes.userCancelledError + Constants_1.Constants.resourceDelimiter + Constants_1.ErrorDescription.userCancelledError);
                    return;
                }
                instance.loginInProgress = false;
                instance.acquireTokenInProgress = false;
            }
            try {
                var popUpWindowLocation = popupWindow.location;
                // If the popup hash changes, close the popup window
                if (popUpWindowLocation.href.indexOf(_this.getRedirectUri()) !== -1) {
                    window.clearInterval(pollTimer);
                    instance.loginInProgress = false;
                    instance.acquireTokenInProgress = false;
                    _this.logger.info("Closing popup window");
                    // TODO: Check how this can be extracted for any framework specific code?
                    if (_this.config.framework.isAngular) {
                        _this.broadcast("msal:popUpHashChanged", popUpWindowLocation.hash);
                        for (var i = 0; i < window.openedWindows.length; i++) {
                            window.openedWindows[i].close();
                        }
                    }
                }
            }
            catch (e) {
                // Cross Domain url check error.
                // Will be thrown until AAD redirects the user back to the app"s root page with the token.
                // No need to log or throw this error as it will create unnecessary traffic.
            }
        }, interval);
        return popupWindow;
    };
    /**
     * Configures popup window for login.
     *
     * @param urlNavigate
     * @param title
     * @param popUpWidth
     * @param popUpHeight
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
            // open the window
            var popupWindow = window.open(urlNavigate, title, "width=" + popUpWidth + ", height=" + popUpHeight + ", top=" + top + ", left=" + left);
            if (!popupWindow) {
                throw ClientAuthError_1.ClientAuthError.createPopupWindowError();
            }
            if (popupWindow.focus) {
                popupWindow.focus();
            }
            return popupWindow;
        }
        catch (e) {
            this.logger.error("error opening popup " + e.message);
            this.loginInProgress = false;
            this.acquireTokenInProgress = false;
            throw ClientAuthError_1.ClientAuthError.createPopupWindowError(e.toString());
        }
    };
    //#endregion
    //#region Silent Flow
    /**
     * Used to get the token from cache.
     * MSAL will return the cached token if it is not expired.
     * Or it will send a request to the STS to obtain an access_token using a hidden iframe. To renew idToken, clientId should be passed as the only scope in the scopes array.
     * @param {Array<string>} scopes - Permissions you want included in the access token. Not all scopes are  guaranteed to be included in the access token. Scopes like "openid" and "profile" are sent with every request.
     * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
     * - In Azure AD, it is of the form https://&lt;tenant&gt;/&lt;tenant&gt;, where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
     * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/<policyName>/
     * - Default value is: "https://login.microsoftonline.com/common"
     * @param {Account} account - The user account for which the scopes are requested.The default account is the logged in account.
     * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the  authentication flow.
     * @returns {Promise.<string>} - A Promise that is fulfilled when this function has completed, or rejected if an error was raised. Resolved with token or rejected with error.
     */
    UserAgentApplication.prototype.acquireTokenSilent = function (request) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // Validate and filter scopes (the validate function will throw if validation fails)
            _this.validateInputScope(request.scopes, true);
            var scope = request.scopes.join(" ").toLowerCase();
            // if the developer passes an account give him the priority
            var account = request.account || _this.getAccount();
            // extract if there is an adalIdToken stashed in the cache
            var adalIdToken = _this.cacheStorage.getItem(Constants_1.Constants.adalIdToken);
            //if there is no account logged in and no login_hint/sid is passed in the request
            if (!account && !!(request.sid || request.loginHint) && Utils_1.Utils.isEmpty(adalIdToken)) {
                _this.logger.info("User login is required");
                return reject(ClientAuthError_1.ClientAuthError.createUserLoginRequiredError());
            }
            var responseType = _this.getTokenType(account, request.scopes, true);
            var serverAuthenticationRequest = new ServerRequestParameters_1.ServerRequestParameters(AuthorityFactory_1.AuthorityFactory.CreateInstance(request.authority, _this.config.auth.validateAuthority), _this.clientId, request.scopes, responseType, _this.getRedirectUri(), _this.config.auth.state);
            // populate QueryParameters (sid/login_hint/domain_hint) and any other extraQueryParameters set by the developer
            if (Utils_1.Utils.isSSOParam(request) || account) {
                serverAuthenticationRequest = _this.populateQueryParams(account, request, serverAuthenticationRequest);
            }
            //if user didn't pass login_hint/sid and adal's idtoken is present, extract the login_hint from the adalIdToken
            else if (!account && !Utils_1.Utils.isEmpty(adalIdToken)) {
                // if adalIdToken exists, extract the SSO info from the same
                var adalIdTokenObject = Utils_1.Utils.extractIdToken(adalIdToken);
                _this.logger.verbose("ADAL's idToken exists. Extracting login information from ADAL's idToken ");
                serverAuthenticationRequest = _this.populateQueryParams(account, null, serverAuthenticationRequest, adalIdTokenObject);
            }
            var authErr;
            var cacheResultResponse;
            try {
                cacheResultResponse = _this.getCachedToken(serverAuthenticationRequest, account);
            }
            catch (e) {
                authErr = e;
            }
            // resolve/reject based on cacheResult
            if (cacheResultResponse) {
                _this.logger.info("Token is already in cache for scope:" + scope);
                resolve(cacheResultResponse);
                return null;
            }
            else if (authErr) {
                _this.logger.infoPii(authErr.errorCode + ":" + authErr.errorMessage);
                reject(authErr);
                return null;
            }
            // else proceed with login
            else {
                _this.logger.verbose("Token is not in cache for scope:" + scope);
                // Cache result can return null if cache is empty. In that case, set authority to default value if no authority is passed to the api.
                if (!serverAuthenticationRequest.authorityInstance) {
                    serverAuthenticationRequest.authorityInstance = request.authority ? AuthorityFactory_1.AuthorityFactory.CreateInstance(request.authority, _this.config.auth.validateAuthority) : _this.authorityInstance;
                }
                // cache miss
                return serverAuthenticationRequest.authorityInstance.resolveEndpointsAsync()
                    .then(function () {
                    // refresh attempt with iframe
                    // Already renewing for this scope, callback when we get the token.
                    if (window.activeRenewals[scope]) {
                        _this.logger.verbose("Renew token for scope: " + scope + " is in progress. Registering callback");
                        // Active renewals contains the state for each renewal.
                        _this.registerCallback(window.activeRenewals[scope], scope, resolve, reject);
                    }
                    else {
                        if (request.scopes && request.scopes.indexOf(_this.clientId) > -1 && request.scopes.length === 1) {
                            // App uses idToken to send to api endpoints
                            // Default scope is tracked as clientId to store this token
                            _this.logger.verbose("renewing idToken");
                            _this.renewIdToken(request.scopes, resolve, reject, account, serverAuthenticationRequest);
                        }
                        else {
                            // renew access token
                            _this.logger.verbose("renewing accesstoken");
                            _this.renewToken(request.scopes, resolve, reject, account, serverAuthenticationRequest);
                        }
                    }
                }).catch(function (err) {
                    _this.logger.warning("could not resolve endpoints");
                    reject(ClientAuthError_1.ClientAuthError.createEndpointResolutionError(err.toString()));
                    return null;
                });
            }
        });
    };
    /**
     * Returns whether current window is in ifram for token renewal
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.isInIframe = function () {
        return window.parent !== window;
    };
    /**
     * Returns whether parent window exists and has msal
     */
    UserAgentApplication.prototype.parentIsMsal = function () {
        return window.parent !== window && window.parent.msal;
    };
    UserAgentApplication.prototype.isInteractionRequired = function (errorString) {
        if (errorString.indexOf("interaction_required") !== -1 ||
            errorString.indexOf("consent_required") !== -1 ||
            errorString.indexOf("login_required") !== -1) {
            return true;
        }
        return false;
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
        this.logger.verbose("Set loading state to pending for: " + scope + ":" + expectedState);
        this.cacheStorage.setItem(Constants_1.Constants.renewStatus + expectedState, Constants_1.Constants.tokenRenewStatusInProgress);
        this.loadFrame(urlNavigate, frameName);
        setTimeout(function () {
            if (_this.cacheStorage.getItem(Constants_1.Constants.renewStatus + expectedState) === Constants_1.Constants.tokenRenewStatusInProgress) {
                // fail the iframe session if it"s in pending state
                _this.logger.verbose("Loading frame has timed out after: " + (_this.config.system.loadFrameTimeout / 1000) + " seconds for scope " + scope + ":" + expectedState);
                // Error after timeout
                if (expectedState && window.callbackMappedToRenewStates[expectedState]) {
                    window.callbackMappedToRenewStates[expectedState](null, ClientAuthError_1.ClientAuthError.createTokenRenewalTimeoutError());
                }
                _this.cacheStorage.setItem(Constants_1.Constants.renewStatus + expectedState, Constants_1.Constants.tokenRenewStatusCancelled);
            }
        }, this.config.system.loadFrameTimeout);
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
        this.logger.info("LoadFrame: " + frameName);
        var frameCheck = frameName;
        setTimeout(function () {
            var frameHandle = _this.addHiddenIFrame(frameCheck);
            if (frameHandle.src === "" || frameHandle.src === "about:blank") {
                frameHandle.src = urlNavigate;
                _this.logger.infoPii("Frame Name : " + frameName + " Navigated to: " + urlNavigate);
            }
        }, 500);
    };
    /**
     * Adds the hidden iframe for silent token renewal.
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.addHiddenIFrame = function (iframeId) {
        if (typeof iframeId === "undefined") {
            return null;
        }
        this.logger.info("Add msal frame to document:" + iframeId);
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
    //#endregion
    //#region General Helpers
    /**
     * Adds login_hint to authorization URL which is used to pre-fill the username field of sign in page for the user if known ahead of time
     * domain_hint can be one of users/organizations which when added skips the email based discovery process of the user
     * domain_req utid received as part of the clientInfo
     * login_req uid received as part of clientInfo
     * Also does a sanity check for extraQueryParameters passed by the user to ensure no repeat queryParameters
     *
     * @param {string} urlNavigate - Authentication request url
     * @param {Account} account - Account for which the token is requested
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.addHintParameters = function (accountObj, qParams, serverReqParams) {
        var account = accountObj || this.getAccount();
        // This is a final check for all queryParams added so far; preference order: sid > login_hint
        // sid cannot be passed along with login_hint, hence we check both are not populated yet in queryParameters so far
        if (account) {
            // sid
            if (account.sid && serverReqParams.promptValue === Constants_1.PromptState.NONE) {
                if (!qParams[Constants_1.SSOTypes.SID] && !qParams[Constants_1.SSOTypes.LOGIN_HINT]) {
                    qParams = Utils_1.Utils.addSSOParameter(Constants_1.SSOTypes.SID, account.sid, qParams);
                }
            }
            // login_hint
            else {
                // login_hint is account.userName
                if (!qParams[Constants_1.SSOTypes.LOGIN_HINT] && account.userName && !Utils_1.Utils.isEmpty(account.userName)) {
                    qParams = Utils_1.Utils.addSSOParameter(Constants_1.SSOTypes.LOGIN_HINT, account.userName, qParams);
                }
            }
            if (!qParams[Constants_1.SSOTypes.DOMAIN_REQ] && !qParams[Constants_1.SSOTypes.LOGIN_REQ]) {
                qParams = Utils_1.Utils.addSSOParameter(Constants_1.SSOTypes.HOMEACCOUNT_ID, account.homeAccountIdentifier, qParams);
            }
        }
        return qParams;
    };
    /**
     * Used to redirect the browser to the STS authorization endpoint
     * @param {string} urlNavigate - URL of the authorization endpoint
     * @hidden
     */
    UserAgentApplication.prototype.promptUser = function (urlNavigate) {
        // Navigate if valid URL
        if (urlNavigate && !Utils_1.Utils.isEmpty(urlNavigate)) {
            this.logger.infoPii("Navigate to:" + urlNavigate);
            window.location.replace(urlNavigate);
        }
        else {
            this.logger.info("Navigate url is empty");
            throw AuthError_1.AuthError.createUnexpectedError("Navigate url is empty");
        }
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
        // track active renewals
        window.activeRenewals[scope] = expectedState;
        // initialize callbacks mapped array
        if (!window.promiseMappedToRenewStates[expectedState]) {
            window.promiseMappedToRenewStates[expectedState] = [];
        }
        // indexing on the current state, push the callback params to callbacks mapped
        window.promiseMappedToRenewStates[expectedState].push({ resolve: resolve, reject: reject });
        // Store the server esponse in the current window??
        if (!window.callbackMappedToRenewStates[expectedState]) {
            window.callbackMappedToRenewStates[expectedState] =
                function (response, error) {
                    // reset active renewals
                    window.activeRenewals[scope] = null;
                    // for all promiseMappedtoRenewStates for a given 'state' - call the reject/resolve with error/token respectively
                    for (var i = 0; i < window.promiseMappedToRenewStates[expectedState].length; ++i) {
                        try {
                            if (error) {
                                window.promiseMappedToRenewStates[expectedState][i].reject(error);
                            }
                            else if (response) {
                                window.promiseMappedToRenewStates[expectedState][i].resolve(response);
                            }
                            else {
                                throw AuthError_1.AuthError.createUnexpectedError("Error and response are both null");
                            }
                        }
                        catch (e) {
                            _this.logger.warning(e);
                        }
                    }
                    // reset
                    window.promiseMappedToRenewStates[expectedState] = null;
                    window.callbackMappedToRenewStates[expectedState] = null;
                };
        }
    };
    //#endregion
    //#region Logout
    /**
     * Used to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Defaults behaviour is to redirect the user to `window.location.href`.
     */
    UserAgentApplication.prototype.logout = function () {
        this.clearCache();
        this.account = null;
        var logout = "";
        if (this.getPostLogoutRedirectUri()) {
            logout = "post_logout_redirect_uri=" + encodeURIComponent(this.getPostLogoutRedirectUri());
        }
        var urlNavigate = this.authority + "/oauth2/v2.0/logout?" + logout;
        this.promptUser(urlNavigate);
    };
    /**
     * Clear all access tokens in the cache.
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.clearCache = function () {
        window.renewStates = [];
        var accessTokenItems = this.cacheStorage.getAllAccessTokens(Constants_1.Constants.clientId, Constants_1.Constants.homeAccountIdentifier);
        for (var i = 0; i < accessTokenItems.length; i++) {
            this.cacheStorage.removeItem(JSON.stringify(accessTokenItems[i].key));
        }
        this.cacheStorage.resetCacheItems();
        this.cacheStorage.clearCookie();
    };
    /**
     * Clear a given access token from the cache.
     *
     * @param accessToken
     */
    UserAgentApplication.prototype.clearCacheForScope = function (accessToken) {
        var accessTokenItems = this.cacheStorage.getAllAccessTokens(Constants_1.Constants.clientId, Constants_1.Constants.homeAccountIdentifier);
        for (var i = 0; i < accessTokenItems.length; i++) {
            var token = accessTokenItems[i];
            if (token.value.accessToken === accessToken) {
                this.cacheStorage.removeItem(JSON.stringify(token.key));
            }
        }
    };
    //#endregion
    //#region Response
    /**
     * Used to call the constructor callback with the token/error
     * @param {string} [hash=window.location.hash] - Hash fragment of Url.
     * @hidden
     */
    UserAgentApplication.prototype.processCallBack = function (hash, stateInfo, parentCallback) {
        this.logger.info("Processing the callback from redirect response");
        // get the state info from the hash
        if (!stateInfo) {
            stateInfo = this.getResponseState(hash);
        }
        var response;
        var authErr;
        // Save the token info from the hash
        try {
            response = this.saveTokenFromHash(hash, stateInfo);
        }
        catch (err) {
            authErr = err;
        }
        // remove hash from the cache
        this.cacheStorage.removeItem(Constants_1.Constants.urlHash);
        try {
            // Clear the cookie in the hash
            this.cacheStorage.clearCookie();
            var accountState = this.getAccountState(this.cacheStorage.getItem(Constants_1.Constants.stateLogin, this.inCookie));
            if (response) {
                if ((stateInfo.requestType === Constants_1.Constants.renewToken) || response.accessToken) {
                    if (window.parent !== window) {
                        this.logger.verbose("Window is in iframe, acquiring token silently");
                    }
                    else {
                        this.logger.verbose("acquiring token interactive in progress");
                    }
                    response.tokenType = Constants_1.Constants.accessToken;
                }
                else if (stateInfo.requestType === Constants_1.Constants.login) {
                    response.tokenType = Constants_1.Constants.idToken;
                }
                if (!parentCallback) {
                    this.tokenReceivedCallback(response);
                    return;
                }
            }
            else if (!parentCallback) {
                this.errorReceivedCallback(authErr, accountState);
                return;
            }
            parentCallback(response, authErr);
        }
        catch (err) {
            this.logger.error("Error occurred in token received callback function: " + err);
            throw ClientAuthError_1.ClientAuthError.createErrorInCallbackFunction(err.toString());
        }
    };
    /**
     * This method must be called for processing the response received from the STS. It extracts the hash, processes the token or error information and saves it in the cache. It then
     * calls the registered callbacks in case of redirect or resolves the promises with the result.
     * @param {string} [hash=window.location.hash] - Hash fragment of Url.
     * @hidden
     */
    UserAgentApplication.prototype.handleAuthenticationResponse = function (hash) {
        // retrieve the hash
        if (hash == null) {
            hash = window.location.hash;
        }
        var self = null;
        var isPopup = false;
        var isWindowOpenerMsal = false;
        // Check if the current window opened the iFrame/popup
        try {
            isWindowOpenerMsal = window.opener && window.opener.msal && window.opener.msal !== window.msal;
        }
        catch (err) {
            // err = SecurityError: Blocked a frame with origin "[url]" from accessing a cross-origin frame.
            isWindowOpenerMsal = false;
        }
        // Set the self to the window that created the popup/iframe
        if (isWindowOpenerMsal) {
            self = window.opener.msal;
            isPopup = true;
        }
        else if (window.parent && window.parent.msal) {
            self = window.parent.msal;
        }
        // if (window.parent !== window), by using self, window.parent becomes equal to window in getResponseState method specifically
        var stateInfo = self.getResponseState(hash);
        var tokenResponseCallback = null;
        self.logger.info("Returned from redirect url");
        // If parent window is the msal instance which opened the current window (iframe)
        if (this.parentIsMsal()) {
            tokenResponseCallback = window.parent.callbackMappedToRenewStates[stateInfo.state];
        }
        // Current window is window opener (popup)
        else if (isWindowOpenerMsal) {
            tokenResponseCallback = window.opener.callbackMappedToRenewStates[stateInfo.state];
        }
        // Redirect cases
        else {
            tokenResponseCallback = null;
            // if set to navigate to loginRequest page post login
            if (self.config.auth.navigateToLoginRequestUrl) {
                self.cacheStorage.setItem(Constants_1.Constants.urlHash, hash);
                if (window.parent === window && !isPopup) {
                    window.location.href = self.cacheStorage.getItem(Constants_1.Constants.loginRequest, self.inCookie);
                }
                return;
            }
            else {
                window.location.hash = "";
            }
            if (!this.redirectCallbacksSet) {
                // We reached this point too early, return and come back later
                return;
            }
        }
        self.processCallBack(hash, stateInfo, tokenResponseCallback);
        // If current window is opener, close all windows
        if (isWindowOpenerMsal) {
            for (var i = 0; i < window.opener.openedWindows.length; i++) {
                window.opener.openedWindows[i].close();
            }
        }
    };
    /**
     * Returns deserialized portion of URL hash
     * @param hash
     */
    UserAgentApplication.prototype.deserializeHash = function (hash) {
        hash = this.getHash(hash);
        return Utils_1.Utils.deserialize(hash);
    };
    /**
     * Creates a stateInfo object from the URL fragment and returns it.
     * @param {string} hash  -  Hash passed from redirect page
     * @returns {TokenResponse} an object created from the redirect response from AAD comprising of the keys - parameters, requestType, stateMatch, stateResponse and valid.
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.getResponseState = function (hash) {
        var parameters = this.deserializeHash(hash);
        var stateResponse;
        if (!parameters) {
            throw AuthError_1.AuthError.createUnexpectedError("Hash was not parsed correctly.");
        }
        if (parameters.hasOwnProperty("state")) {
            stateResponse = {
                requestType: Constants_1.Constants.unknown,
                state: parameters.state,
                stateMatch: false
            };
        }
        else {
            throw AuthError_1.AuthError.createUnexpectedError("Hash does not contain state.");
        }
        // async calls can fire iframe and login request at the same time if developer does not use the API as expected
        // incoming callback needs to be looked up to find the request type
        // loginRedirect
        if (stateResponse.state === this.cacheStorage.getItem(Constants_1.Constants.stateLogin, this.inCookie) || stateResponse.state === this.silentAuthenticationState) { // loginRedirect
            stateResponse.requestType = Constants_1.Constants.login;
            stateResponse.stateMatch = true;
            return stateResponse;
        }
        // acquireTokenRedirect
        else if (stateResponse.state === this.cacheStorage.getItem(Constants_1.Constants.stateAcquireToken, this.inCookie)) { //acquireTokenRedirect
            stateResponse.requestType = Constants_1.Constants.renewToken;
            stateResponse.stateMatch = true;
            return stateResponse;
        }
        // external api requests may have many renewtoken requests for different resource
        if (!stateResponse.stateMatch) {
            stateResponse.requestType = window.requestType;
            var statesInParentContext = window.renewStates;
            for (var i = 0; i < statesInParentContext.length; i++) {
                if (statesInParentContext[i] === stateResponse.state) {
                    stateResponse.stateMatch = true;
                    break;
                }
            }
        }
        return stateResponse;
    };
    //#endregion
    //#region Token Processing (Extract to TokenProcessing.ts)
    /**
     * Used to get token for the specified set of scopes from the cache
     * @param {AuthenticationRequestParameters} authenticationRequest - Request sent to the STS to obtain an id_token/access_token
     * @param {Account} account - Account for which the scopes were requested
     * @hidden
     */
    UserAgentApplication.prototype.getCachedToken = function (serverAuthenticationRequest, account) {
        var accessTokenCacheItem = null;
        var scopes = serverAuthenticationRequest.scopes;
        // filter by clientId and account
        var tokenCacheItems = this.cacheStorage.getAllAccessTokens(this.clientId, account ? account.homeAccountIdentifier : null);
        // No match found after initial filtering
        if (tokenCacheItems.length === 0) {
            return null;
        }
        var filteredItems = [];
        // if no authority passed
        if (!serverAuthenticationRequest.authority) {
            // filter by scope
            for (var i = 0; i < tokenCacheItems.length; i++) {
                var cacheItem = tokenCacheItems[i];
                var cachedScopes = cacheItem.key.scopes.split(" ");
                if (Utils_1.Utils.containsScope(cachedScopes, scopes)) {
                    filteredItems.push(cacheItem);
                }
            }
            // if only one cached token found
            if (filteredItems.length === 1) {
                accessTokenCacheItem = filteredItems[0];
                serverAuthenticationRequest.authorityInstance = AuthorityFactory_1.AuthorityFactory.CreateInstance(accessTokenCacheItem.key.authority, this.config.auth.validateAuthority);
            }
            // if more than one cached token is found
            else if (filteredItems.length > 1) {
                throw ClientAuthError_1.ClientAuthError.createMultipleMatchingTokensInCacheError(scopes.toString());
            }
            // if no match found, check if there was a single authority used
            else {
                var authorityList = this.getUniqueAuthority(tokenCacheItems, "authority");
                if (authorityList.length > 1) {
                    throw ClientAuthError_1.ClientAuthError.createMultipleAuthoritiesInCacheError(scopes.toString());
                }
                serverAuthenticationRequest.authorityInstance = AuthorityFactory_1.AuthorityFactory.CreateInstance(authorityList[0], this.config.auth.validateAuthority);
            }
        }
        // if an authority is passed in the API
        else {
            // filter by authority and scope
            for (var i = 0; i < tokenCacheItems.length; i++) {
                var cacheItem = tokenCacheItems[i];
                var cachedScopes = cacheItem.key.scopes.split(" ");
                if (Utils_1.Utils.containsScope(cachedScopes, scopes) && cacheItem.key.authority === serverAuthenticationRequest.authority) {
                    filteredItems.push(cacheItem);
                }
            }
            // no match
            if (filteredItems.length === 0) {
                return null;
            }
            // if only one cachedToken Found
            else if (filteredItems.length === 1) {
                accessTokenCacheItem = filteredItems[0];
            }
            else {
                // if more than cached token is found
                throw ClientAuthError_1.ClientAuthError.createMultipleMatchingTokensInCacheError(scopes.toString());
            }
        }
        if (accessTokenCacheItem != null) {
            var expired = Number(accessTokenCacheItem.value.expiresIn);
            // If expiration is within offset, it will force renew
            var offset = this.config.system.tokenRenewalOffsetSeconds || 300;
            if (expired && (expired > Utils_1.Utils.now() + offset)) {
                var idToken = new IdToken_1.IdToken(accessTokenCacheItem.value.idToken);
                if (!account) {
                    account = this.getAccount();
                    if (!account) {
                        throw AuthError_1.AuthError.createUnexpectedError("Account should not be null here.");
                    }
                }
                var aState = this.getAccountState(this.cacheStorage.getItem(Constants_1.Constants.stateLogin, this.inCookie));
                var response = {
                    uniqueId: "",
                    tenantId: "",
                    tokenType: (accessTokenCacheItem.value.idToken === accessTokenCacheItem.value.accessToken) ? Constants_1.Constants.idToken : Constants_1.Constants.accessToken,
                    idToken: idToken,
                    accessToken: accessTokenCacheItem.value.accessToken,
                    scopes: serverAuthenticationRequest.scopes,
                    expiresOn: new Date(expired * 1000),
                    account: account,
                    accountState: aState,
                };
                Utils_1.Utils.setResponseIdToken(response, idToken);
                return response;
            }
            else {
                this.cacheStorage.removeItem(JSON.stringify(filteredItems[0].key));
                return null;
            }
        }
        else {
            return null;
        }
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
     * Check if ADAL id_token exists and return if exists.
     *
     * @hidden
     */
    UserAgentApplication.prototype.extractADALIdToken = function () {
        var adalIdToken = this.cacheStorage.getItem(Constants_1.Constants.adalIdToken);
        if (!Utils_1.Utils.isEmpty(adalIdToken)) {
            return Utils_1.Utils.extractIdToken(adalIdToken);
        }
        return null;
    };
    /**
     * Acquires access token using a hidden iframe.
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.renewToken = function (scopes, resolve, reject, account, serverAuthenticationRequest) {
        var scope = scopes.join(" ").toLowerCase();
        this.logger.verbose("renewToken is called for scope:" + scope);
        var frameHandle = this.addHiddenIFrame("msalRenewFrame" + scope);
        // Cache account and authority
        this.setAccountCache(account, serverAuthenticationRequest.state);
        this.setAuthorityCache(serverAuthenticationRequest.state, serverAuthenticationRequest.authority);
        // renew happens in iframe, so it keeps javascript context
        this.cacheStorage.setItem(Constants_1.Constants.nonceIdToken, serverAuthenticationRequest.nonce, this.inCookie);
        this.logger.verbose("Renew token Expected state: " + serverAuthenticationRequest.state);
        // Build urlNavigate with "prompt=none" and navigate to URL in hidden iFrame
        var urlNavigate = Utils_1.Utils.urlRemoveQueryStringParameter(serverAuthenticationRequest.createNavigateUrl(scopes), Constants_1.Constants.prompt) + Constants_1.Constants.prompt_none;
        window.renewStates.push(serverAuthenticationRequest.state);
        window.requestType = Constants_1.Constants.renewToken;
        this.registerCallback(serverAuthenticationRequest.state, scope, resolve, reject);
        this.logger.infoPii("Navigate to:" + urlNavigate);
        frameHandle.src = "about:blank";
        this.loadIframeTimeout(urlNavigate, "msalRenewFrame" + scope, scope);
    };
    /**
     * Renews idtoken for app"s own backend when clientId is passed as a single scope in the scopes array.
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.renewIdToken = function (scopes, resolve, reject, account, serverAuthenticationRequest) {
        this.logger.info("renewidToken is called");
        var frameHandle = this.addHiddenIFrame("msalIdTokenFrame");
        // Cache account and authority
        this.setAccountCache(account, serverAuthenticationRequest.state);
        this.setAuthorityCache(serverAuthenticationRequest.state, serverAuthenticationRequest.authority);
        // Cache nonce
        this.cacheStorage.setItem(Constants_1.Constants.nonceIdToken, serverAuthenticationRequest.nonce, this.inCookie);
        this.logger.verbose("Renew Idtoken Expected state: " + serverAuthenticationRequest.state);
        // Build urlNavigate with "prompt=none" and navigate to URL in hidden iFrame
        var urlNavigate = Utils_1.Utils.urlRemoveQueryStringParameter(serverAuthenticationRequest.createNavigateUrl(scopes), Constants_1.Constants.prompt) + Constants_1.Constants.prompt_none;
        if (this.silentLogin) {
            window.requestType = Constants_1.Constants.login;
            this.silentAuthenticationState = serverAuthenticationRequest.state;
        }
        else {
            window.requestType = Constants_1.Constants.renewToken;
            window.renewStates.push(serverAuthenticationRequest.state);
        }
        // note: scope here is clientId
        this.registerCallback(serverAuthenticationRequest.state, this.clientId, resolve, reject);
        this.logger.infoPii("Navigate to:" + urlNavigate);
        frameHandle.src = "about:blank";
        this.loadIframeTimeout(urlNavigate, "msalIdTokenFrame", this.clientId);
    };
    /**
     * This method must be called for processing the response received from AAD. It extracts the hash, processes the token or error, saves it in the cache and calls the registered callbacks with the result.
     * @param {string} authority authority received in the redirect response from AAD.
     * @param {TokenResponse} requestInfo an object created from the redirect response from AAD comprising of the keys - parameters, requestType, stateMatch, stateResponse and valid.
     * @param {Account} account account object for which scopes are consented for. The default account is the logged in account.
     * @param {ClientInfo} clientInfo clientInfo received as part of the response comprising of fields uid and utid.
     * @param {IdToken} idToken idToken received as part of the response.
     * @ignore
     * @private
     * @hidden
     */
    /* tslint:disable:no-string-literal */
    UserAgentApplication.prototype.saveAccessToken = function (response, authority, parameters, clientInfo) {
        var scope;
        var accessTokenResponse = tslib_1.__assign({}, response);
        var clientObj = new ClientInfo_1.ClientInfo(clientInfo);
        // if the response contains "scope"
        if (parameters.hasOwnProperty("scope")) {
            // read the scopes
            scope = parameters["scope"];
            var consentedScopes = scope.split(" ");
            // retrieve all access tokens from the cache, remove the dup scores
            var accessTokenCacheItems = this.cacheStorage.getAllAccessTokens(this.clientId, authority);
            for (var i = 0; i < accessTokenCacheItems.length; i++) {
                var accessTokenCacheItem = accessTokenCacheItems[i];
                if (accessTokenCacheItem.key.homeAccountIdentifier === response.account.homeAccountIdentifier) {
                    var cachedScopes = accessTokenCacheItem.key.scopes.split(" ");
                    if (Utils_1.Utils.isIntersectingScopes(cachedScopes, consentedScopes)) {
                        this.cacheStorage.removeItem(JSON.stringify(accessTokenCacheItem.key));
                    }
                }
            }
            // Generate and cache accessTokenKey and accessTokenValue
            var expiresIn = Utils_1.Utils.expiresIn(parameters[Constants_1.Constants.expiresIn]).toString();
            var accessTokenKey = new AccessTokenKey_1.AccessTokenKey(authority, this.clientId, scope, clientObj.uid, clientObj.utid);
            var accessTokenValue = new AccessTokenValue_1.AccessTokenValue(parameters[Constants_1.Constants.accessToken], response.idToken.rawIdToken, expiresIn, clientInfo);
            this.cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            accessTokenResponse.accessToken = parameters[Constants_1.Constants.accessToken];
            accessTokenResponse.scopes = consentedScopes;
            var exp = Number(expiresIn);
            if (exp) {
                accessTokenResponse.expiresOn = new Date((Utils_1.Utils.now() + exp) * 1000);
            }
            else {
                this.logger.error("Could not parse expiresIn parameter. Given value: " + expiresIn);
            }
        }
        // if the response does not contain "scope" - scope is usually client_id and the token will be id_token
        else {
            scope = this.clientId;
            // Generate and cache accessTokenKey and accessTokenValue
            var accessTokenKey = new AccessTokenKey_1.AccessTokenKey(authority, this.clientId, scope, clientObj.uid, clientObj.utid);
            var accessTokenValue = new AccessTokenValue_1.AccessTokenValue(parameters[Constants_1.Constants.idToken], parameters[Constants_1.Constants.idToken], response.idToken.expiration, clientInfo);
            this.cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            accessTokenResponse.scopes = [scope];
            accessTokenResponse.accessToken = parameters[Constants_1.Constants.idToken];
            var exp = Number(response.idToken.expiration);
            if (exp) {
                accessTokenResponse.expiresOn = new Date(exp * 1000);
            }
            else {
                this.logger.error("Could not parse expiresIn parameter");
            }
        }
        return accessTokenResponse;
    };
    /**
     * Saves token or error received in the response from AAD in the cache. In case of id_token, it also creates the account object.
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.saveTokenFromHash = function (hash, stateInfo) {
        this.logger.info("State status:" + stateInfo.stateMatch + "; Request type:" + stateInfo.requestType);
        this.cacheStorage.setItem(Constants_1.Constants.msalError, "");
        this.cacheStorage.setItem(Constants_1.Constants.msalErrorDescription, "");
        var response = {
            uniqueId: "",
            tenantId: "",
            tokenType: "",
            idToken: null,
            accessToken: null,
            scopes: [],
            expiresOn: null,
            account: null,
            accountState: "",
        };
        var error;
        var hashParams = this.deserializeHash(hash);
        var authorityKey = "";
        var acquireTokenAccountKey = "";
        // If server returns an error
        if (hashParams.hasOwnProperty(Constants_1.Constants.errorDescription) || hashParams.hasOwnProperty(Constants_1.Constants.error)) {
            this.logger.infoPii("Error :" + hashParams[Constants_1.Constants.error] + "; Error description:" + hashParams[Constants_1.Constants.errorDescription]);
            this.cacheStorage.setItem(Constants_1.Constants.msalError, hashParams[Constants_1.Constants.error]);
            this.cacheStorage.setItem(Constants_1.Constants.msalErrorDescription, hashParams[Constants_1.Constants.errorDescription]);
            // login
            if (stateInfo.requestType === Constants_1.Constants.login) {
                this.loginInProgress = false;
                this.cacheStorage.setItem(Constants_1.Constants.loginError, hashParams[Constants_1.Constants.errorDescription] + ":" + hashParams[Constants_1.Constants.error]);
                authorityKey = Storage_1.Storage.generateAuthorityKey(stateInfo.state);
            }
            // acquireToken
            if (stateInfo.requestType === Constants_1.Constants.renewToken) {
                this.acquireTokenInProgress = false;
                authorityKey = Storage_1.Storage.generateAuthorityKey(stateInfo.state);
                var account = this.getAccount();
                var accountId = account ? this.getAccountId(account) : "";
                acquireTokenAccountKey = Storage_1.Storage.generateAcquireTokenAccountKey(accountId, stateInfo.state);
            }
            if (this.isInteractionRequired(hashParams[Constants_1.Constants.errorDescription])) {
                error = new InteractionRequiredAuthError_1.InteractionRequiredAuthError(hashParams[Constants_1.Constants.error], hashParams[Constants_1.Constants.errorDescription]);
            }
            else {
                error = new ServerError_1.ServerError(hashParams[Constants_1.Constants.error], hashParams[Constants_1.Constants.errorDescription]);
            }
        }
        // If the server returns "Success"
        else {
            // Verify the state from redirect and record tokens to storage if exists
            if (stateInfo.stateMatch) {
                this.logger.info("State is right");
                if (hashParams.hasOwnProperty(Constants_1.Constants.sessionState)) {
                    this.cacheStorage.setItem(Constants_1.Constants.msalSessionState, hashParams[Constants_1.Constants.sessionState]);
                }
                response.accountState = stateInfo.state;
                var clientInfo = "";
                // Process access_token
                if (hashParams.hasOwnProperty(Constants_1.Constants.accessToken)) {
                    this.logger.info("Fragment has access token");
                    this.acquireTokenInProgress = false;
                    // retrieve the id_token from response if present :
                    if (hashParams.hasOwnProperty(Constants_1.Constants.idToken)) {
                        response.idToken = new IdToken_1.IdToken(hashParams[Constants_1.Constants.idToken]);
                    }
                    else {
                        response = Utils_1.Utils.setResponseIdToken(response, new IdToken_1.IdToken(this.cacheStorage.getItem(Constants_1.Constants.idTokenKey)));
                    }
                    // retrieve the authority from cache and replace with tenantID
                    var authorityKey_1 = Storage_1.Storage.generateAuthorityKey(stateInfo.state);
                    var authority = this.cacheStorage.getItem(authorityKey_1, this.inCookie);
                    if (!Utils_1.Utils.isEmpty(authority)) {
                        authority = Utils_1.Utils.replaceTenantPath(authority, response.tenantId);
                    }
                    // retrieve client_info - if it is not found, generate the uid and utid from idToken
                    if (hashParams.hasOwnProperty(Constants_1.Constants.clientInfo)) {
                        clientInfo = hashParams[Constants_1.Constants.clientInfo];
                    }
                    else {
                        this.logger.warning("ClientInfo not received in the response from AAD");
                    }
                    response.account = Account_1.Account.createAccount(response.idToken, new ClientInfo_1.ClientInfo(clientInfo));
                    var accountKey = this.getAccountId(response.account);
                    acquireTokenAccountKey = Storage_1.Storage.generateAcquireTokenAccountKey(accountKey, stateInfo.state);
                    var acquireTokenAccountKey_noaccount = Storage_1.Storage.generateAcquireTokenAccountKey(Constants_1.Constants.no_account, stateInfo.state);
                    var cachedAccount = this.cacheStorage.getItem(acquireTokenAccountKey);
                    var acquireTokenAccount = void 0;
                    // Check with the account in the Cache
                    if (!Utils_1.Utils.isEmpty(cachedAccount)) {
                        acquireTokenAccount = JSON.parse(cachedAccount);
                        if (response.account && acquireTokenAccount && Utils_1.Utils.compareAccounts(response.account, acquireTokenAccount)) {
                            response = this.saveAccessToken(response, authority, hashParams, clientInfo);
                            this.logger.info("The user object received in the response is the same as the one passed in the acquireToken request");
                        }
                        else {
                            this.logger.warning("The account object created from the response is not the same as the one passed in the acquireToken request");
                        }
                    }
                    else if (!Utils_1.Utils.isEmpty(this.cacheStorage.getItem(acquireTokenAccountKey_noaccount))) {
                        response = this.saveAccessToken(response, authority, hashParams, clientInfo);
                    }
                }
                // Process id_token
                if (hashParams.hasOwnProperty(Constants_1.Constants.idToken)) {
                    this.logger.info("Fragment has id token");
                    // login no longer in progress
                    this.loginInProgress = false;
                    response = Utils_1.Utils.setResponseIdToken(response, new IdToken_1.IdToken(hashParams[Constants_1.Constants.idToken]));
                    if (hashParams.hasOwnProperty(Constants_1.Constants.clientInfo)) {
                        clientInfo = hashParams[Constants_1.Constants.clientInfo];
                    }
                    else {
                        this.logger.warning("ClientInfo not received in the response from AAD");
                    }
                    authorityKey = Storage_1.Storage.generateAuthorityKey(stateInfo.state);
                    var authority = this.cacheStorage.getItem(authorityKey, this.inCookie);
                    if (!Utils_1.Utils.isEmpty(authority)) {
                        authority = Utils_1.Utils.replaceTenantPath(authority, response.idToken.tenantId);
                    }
                    this.account = Account_1.Account.createAccount(response.idToken, new ClientInfo_1.ClientInfo(clientInfo));
                    response.account = this.account;
                    if (response.idToken && response.idToken.nonce) {
                        // check nonce integrity if idToken has nonce - throw an error if not matched
                        if (response.idToken.nonce !== this.cacheStorage.getItem(Constants_1.Constants.nonceIdToken, this.inCookie)) {
                            this.account = null;
                            this.cacheStorage.setItem(Constants_1.Constants.loginError, "Nonce Mismatch. Expected Nonce: " + this.cacheStorage.getItem(Constants_1.Constants.nonceIdToken, this.inCookie) + "," + "Actual Nonce: " + response.idToken.nonce);
                            this.logger.error("Nonce Mismatch.Expected Nonce: " + this.cacheStorage.getItem(Constants_1.Constants.nonceIdToken, this.inCookie) + "," + "Actual Nonce: " + response.idToken.nonce);
                            error = ClientAuthError_1.ClientAuthError.createNonceMismatchError(this.cacheStorage.getItem(Constants_1.Constants.nonceIdToken, this.inCookie), response.idToken.nonce);
                        }
                        // Save the token
                        else {
                            this.cacheStorage.setItem(Constants_1.Constants.idTokenKey, hashParams[Constants_1.Constants.idToken]);
                            this.cacheStorage.setItem(Constants_1.Constants.msalClientInfo, clientInfo);
                            // Save idToken as access token for app itself
                            this.saveAccessToken(response, authority, hashParams, clientInfo);
                        }
                    }
                    else {
                        authorityKey = stateInfo.state;
                        acquireTokenAccountKey = stateInfo.state;
                        this.logger.error("Invalid id_token received in the response");
                        error = ClientAuthError_1.ClientAuthError.createInvalidIdTokenError(response.idToken);
                        this.cacheStorage.setItem(Constants_1.Constants.msalError, error.errorCode);
                        this.cacheStorage.setItem(Constants_1.Constants.msalErrorDescription, error.errorMessage);
                    }
                }
            }
            // State mismatch - unexpected/invalid state
            else {
                authorityKey = stateInfo.state;
                acquireTokenAccountKey = stateInfo.state;
                var expectedState = this.cacheStorage.getItem(Constants_1.Constants.stateLogin, this.inCookie);
                this.logger.error("State Mismatch.Expected State: " + expectedState + "," + "Actual State: " + stateInfo.state);
                error = ClientAuthError_1.ClientAuthError.createInvalidStateError(stateInfo.state, expectedState);
                this.cacheStorage.setItem(Constants_1.Constants.msalError, error.errorCode);
                this.cacheStorage.setItem(Constants_1.Constants.msalErrorDescription, error.errorMessage);
            }
        }
        this.cacheStorage.setItem(Constants_1.Constants.renewStatus + stateInfo.state, Constants_1.Constants.tokenRenewStatusCompleted);
        this.cacheStorage.removeAcquireTokenEntries(authorityKey, acquireTokenAccountKey);
        // this is required if navigateToLoginRequestUrl=false
        if (this.inCookie) {
            this.cacheStorage.setItemCookie(authorityKey, "", -1);
            this.cacheStorage.clearCookie();
        }
        if (error) {
            throw error;
        }
        return response;
    };
    /* tslint:enable:no-string-literal */
    //#endregion
    //#region Account
    /**
     * Returns the signed in account (received from an account object created at the time of login) or null.
     */
    UserAgentApplication.prototype.getAccount = function () {
        // if a session already exists, get the account from the session
        if (this.account) {
            return this.account;
        }
        // frame is used to get idToken and populate the account for the given session
        var rawIdToken = this.cacheStorage.getItem(Constants_1.Constants.idTokenKey);
        var rawClientInfo = this.cacheStorage.getItem(Constants_1.Constants.msalClientInfo);
        if (!Utils_1.Utils.isEmpty(rawIdToken) && !Utils_1.Utils.isEmpty(rawClientInfo)) {
            var idToken = new IdToken_1.IdToken(rawIdToken);
            var clientInfo = new ClientInfo_1.ClientInfo(rawClientInfo);
            this.account = Account_1.Account.createAccount(idToken, clientInfo);
            return this.account;
        }
        // if login not yet done, return null
        return null;
    };
    /**
     * Extracts state value from the accountState sent with the authentication request.
     * @returns {string} scope.
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.getAccountState = function (state) {
        if (state) {
            var splitIndex = state.indexOf("|");
            if (splitIndex > -1 && splitIndex + 1 < state.length) {
                return state.substring(splitIndex + 1);
            }
        }
        return "";
    };
    /**
     * Used to filter all cached items and return a list of unique accounts based on homeAccountIdentifier.
     * @param {Array<Account>} Accounts - accounts saved in the cache.
     */
    UserAgentApplication.prototype.getAllAccounts = function () {
        var accounts = [];
        var accessTokenCacheItems = this.cacheStorage.getAllAccessTokens(Constants_1.Constants.clientId, Constants_1.Constants.homeAccountIdentifier);
        for (var i = 0; i < accessTokenCacheItems.length; i++) {
            var idToken = new IdToken_1.IdToken(accessTokenCacheItems[i].value.idToken);
            var clientInfo = new ClientInfo_1.ClientInfo(accessTokenCacheItems[i].value.homeAccountIdentifier);
            var account = Account_1.Account.createAccount(idToken, clientInfo);
            accounts.push(account);
        }
        return this.getUniqueAccounts(accounts);
    };
    /**
     * Used to filter accounts based on homeAccountIdentifier
     * @param {Array<Account>}  Accounts - accounts saved in the cache
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.getUniqueAccounts = function (accounts) {
        if (!accounts || accounts.length <= 1) {
            return accounts;
        }
        var flags = [];
        var uniqueAccounts = [];
        for (var index = 0; index < accounts.length; ++index) {
            if (accounts[index].homeAccountIdentifier && flags.indexOf(accounts[index].homeAccountIdentifier) === -1) {
                flags.push(accounts[index].homeAccountIdentifier);
                uniqueAccounts.push(accounts[index]);
            }
        }
        return uniqueAccounts;
    };
    //#endregion
    //#region Scopes (Extract to Scopes.ts)
    // Note: "this" dependency in this section is minimal.
    // If pCacheStorage is separated from the class object, or passed as a fn param, scopesUtils.ts can be created
    /**
     * Used to validate the scopes input parameter requested  by the developer.
     * @param {Array<string>} scopes - Developer requested permissions. Not all scopes are guaranteed to be included in the access token returned.
     * @param {boolean} scopesRequired - Boolean indicating whether the scopes array is required or not
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.validateInputScope = function (scopes, scopesRequired) {
        if (!scopes) {
            if (scopesRequired) {
                throw ClientConfigurationError_1.ClientConfigurationError.createScopesRequiredError(scopes);
            }
            else {
                return;
            }
        }
        // Check that scopes is an array object (also throws error if scopes == null)
        if (!Array.isArray(scopes)) {
            throw ClientConfigurationError_1.ClientConfigurationError.createScopesNonArrayError(scopes);
        }
        // Check that scopes is not an empty array
        if (scopes.length < 1) {
            throw ClientConfigurationError_1.ClientConfigurationError.createEmptyScopesArrayError(scopes.toString());
        }
        // Check that clientId is passed as single scope
        if (scopes.indexOf(this.clientId) > -1) {
            if (scopes.length > 1) {
                throw ClientConfigurationError_1.ClientConfigurationError.createClientIdSingleScopeError(scopes.toString());
            }
        }
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
     * Appends extraScopesToConsent if passed
     * @param request
     */
    UserAgentApplication.prototype.appendScopes = function (request) {
        var scopes;
        if (request && request.scopes) {
            if (request.extraScopesToConsent) {
                scopes = request.scopes.concat(request.extraScopesToConsent);
            }
            else {
                scopes = request.scopes;
            }
        }
        return scopes;
    };
    //#endregion
    //#region Angular
    /**
    * Broadcast messages - Used only for Angular?  *
    * @param eventName
    * @param data
    */
    UserAgentApplication.prototype.broadcast = function (eventName, data) {
        var evt = new CustomEvent(eventName, { detail: data });
        window.dispatchEvent(evt);
    };
    /**
     * Helper function to retrieve the cached token
     *
     * @param scopes
     * @param account
     */
    UserAgentApplication.prototype.getCachedTokenInternal = function (scopes, account) {
        // Get the current session's account object
        var accountObject = account || this.getAccount();
        if (!accountObject) {
            return null;
        }
        // Construct AuthenticationRequest based on response type
        var newAuthority = this.authorityInstance ? this.authorityInstance : AuthorityFactory_1.AuthorityFactory.CreateInstance(this.authority, this.config.auth.validateAuthority);
        var responseType = this.getTokenType(accountObject, scopes, true);
        var serverAuthenticationRequest = new ServerRequestParameters_1.ServerRequestParameters(newAuthority, this.clientId, scopes, responseType, this.getRedirectUri(), this.config.auth.state);
        // get cached token
        return this.getCachedToken(serverAuthenticationRequest, account);
    };
    /**
     * Get scopes for the Endpoint - Used in Angular to track protected and unprotected resources without interaction from the developer app
     *
     * @param endpoint
     */
    UserAgentApplication.prototype.getScopesForEndpoint = function (endpoint) {
        // if user specified list of unprotectedResources, no need to send token to these endpoints, return null.
        if (this.config.framework.unprotectedResources.length > 0) {
            for (var i = 0; i < this.config.framework.unprotectedResources.length; i++) {
                if (endpoint.indexOf(this.config.framework.unprotectedResources[i]) > -1) {
                    return null;
                }
            }
        }
        // process all protected resources and send the matched one
        if (this.config.framework.protectedResourceMap.size > 0) {
            for (var _i = 0, _a = Array.from(this.config.framework.protectedResourceMap.keys()); _i < _a.length; _i++) {
                var key = _a[_i];
                // configEndpoint is like /api/Todo requested endpoint can be /api/Todo/1
                if (endpoint.indexOf(key) > -1) {
                    return this.config.framework.protectedResourceMap.get(key);
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
    /**
     * tracks if login is in progress
     */
    UserAgentApplication.prototype.getLoginInProgress = function () {
        var pendingCallback = this.cacheStorage.getItem(Constants_1.Constants.urlHash);
        if (pendingCallback) {
            return true;
        }
        return this.loginInProgress;
    };
    /**
     * @param loginInProgress
     */
    UserAgentApplication.prototype.setloginInProgress = function (loginInProgress) {
        this.loginInProgress = loginInProgress;
    };
    /**
     * returns the status of acquireTokenInProgress
     */
    UserAgentApplication.prototype.getAcquireTokenInProgress = function () {
        return this.acquireTokenInProgress;
    };
    /**
     * @param acquireTokenInProgress
     */
    UserAgentApplication.prototype.setAcquireTokenInProgress = function (acquireTokenInProgress) {
        this.acquireTokenInProgress = acquireTokenInProgress;
    };
    /**
     * returns the logger handle
     */
    UserAgentApplication.prototype.getLogger = function () {
        return this.config.system.logger;
    };
    //#endregion
    //#region Getters and Setters
    /**
     * Used to get the redirect uri. Evaluates redirectUri if its a function, otherwise simply returns its value.
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.getRedirectUri = function () {
        if (typeof this.config.auth.redirectUri === "function") {
            return this.config.auth.redirectUri();
        }
        return this.config.auth.redirectUri;
    };
    /**
     * Used to get the post logout redirect uri. Evaluates postLogoutredirectUri if its a function, otherwise simply returns its value.
     * @ignore
     * @hidden
     */
    UserAgentApplication.prototype.getPostLogoutRedirectUri = function () {
        if (typeof this.config.auth.postLogoutRedirectUri === "function") {
            return this.config.auth.postLogoutRedirectUri();
        }
        return this.config.auth.postLogoutRedirectUri;
    };
    //#endregion
    //#region String Util (Should be extracted to Utils.ts)
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
     * extract URI from the host
     *
     * @param uri
     * @hidden
     */
    UserAgentApplication.prototype.getHostFromUri = function (uri) {
        // remove http:// or https:// from uri
        var extractedUri = String(uri).replace(/^(https?:)\/\//, "");
        extractedUri = extractedUri.split("/")[0];
        return extractedUri;
    };
    /**
     * Utils function to create the Authentication
     * @param userObject
     * @param scopes
     * @param silentCall
     */
    UserAgentApplication.prototype.getTokenType = function (accountObject, scopes, silentCall) {
        // if account is passed and matches the account object/or set to getAccount() from cache
        // if client-id is passed as scope, get id_token else token/id_token_token (in case no session exists)
        var tokenType;
        // acquireTokenSilent
        if (silentCall) {
            if (Utils_1.Utils.compareAccounts(accountObject, this.getAccount())) {
                tokenType = (scopes.indexOf(this.config.auth.clientId) > -1) ? ResponseTypes.id_token : ResponseTypes.token;
            }
            else {
                tokenType = (scopes.indexOf(this.config.auth.clientId) > -1) ? ResponseTypes.id_token : ResponseTypes.id_token_token;
            }
            return tokenType;
        }
        // all other cases
        else {
            if (!Utils_1.Utils.compareAccounts(accountObject, this.getAccount())) {
                tokenType = ResponseTypes.id_token_token;
            }
            else {
                tokenType = (scopes.indexOf(this.clientId) > -1) ? ResponseTypes.id_token : ResponseTypes.token;
            }
            return tokenType;
        }
    };
    /**
     * Sets the cachekeys for and stores the account information in cache
     * @param account
     * @param state
     */
    UserAgentApplication.prototype.setAccountCache = function (account, state) {
        // Cache acquireTokenAccountKey
        var accountId = account ? this.getAccountId(account) : Constants_1.Constants.no_account;
        var acquireTokenAccountKey = Storage_1.Storage.generateAcquireTokenAccountKey(accountId, state);
        this.cacheStorage.setItem(acquireTokenAccountKey, JSON.stringify(account));
    };
    /**
     * Sets the cacheKey for and stores the authority information in cache
     * @param state
     * @param authority
     */
    UserAgentApplication.prototype.setAuthorityCache = function (state, authority) {
        // Cache authorityKey
        var authorityKey = Storage_1.Storage.generateAuthorityKey(state);
        this.cacheStorage.setItem(authorityKey, authority, this.inCookie);
    };
    /**
     * Returns the unique identifier for the logged in account
     * @param account
     */
    UserAgentApplication.prototype.getAccountId = function (account) {
        return "" + account.accountIdentifier + Constants_1.Constants.resourceDelimiter + ("" + account.homeAccountIdentifier);
    };
    /**
     * Construct 'tokenRequest' from the available data in adalIdToken
     * @param extraQueryParameters
     */
    UserAgentApplication.prototype.buildIDTokenRequest = function (request) {
        var tokenRequest = {
            scopes: [this.clientId],
            authority: this.authority,
            account: this.getAccount(),
            extraQueryParameters: request.extraQueryParameters
        };
        return tokenRequest;
    };
    /**
     * Utility to populate QueryParameters and ExtraQueryParameters to ServerRequestParamerers
     * @param request
     * @param serverAuthenticationRequest
     */
    UserAgentApplication.prototype.populateQueryParams = function (account, request, serverAuthenticationRequest, adalIdTokenObject) {
        var queryParameters = {};
        if (request) {
            // add the prompt parameter to serverRequestParameters if passed
            if (request.prompt) {
                this.validatePromptParameter(request.prompt);
                serverAuthenticationRequest.promptValue = request.prompt;
            }
            // if the developer provides one of these, give preference to developer choice
            if (Utils_1.Utils.isSSOParam(request)) {
                queryParameters = Utils_1.Utils.constructUnifiedCacheQueryParameter(request, null);
            }
        }
        if (adalIdTokenObject) {
            queryParameters = Utils_1.Utils.constructUnifiedCacheQueryParameter(null, adalIdTokenObject);
        }
        // adds sid/login_hint if not populated; populates domain_req, login_req and domain_hint
        this.logger.verbose("Calling addHint parameters");
        queryParameters = this.addHintParameters(account, queryParameters, serverAuthenticationRequest);
        // sanity check for developer passed extraQueryParameters
        var eQParams;
        if (request) {
            eQParams = this.removeSSOParamsFromEQParams(request.extraQueryParameters);
        }
        // Populate the extraQueryParameters to be sent to the server
        serverAuthenticationRequest.queryParameters = Utils_1.Utils.generateQueryParametersString(queryParameters);
        serverAuthenticationRequest.extraQueryParameters = Utils_1.Utils.generateQueryParametersString(eQParams);
        return serverAuthenticationRequest;
    };
    /**
     * Utility to test if valid prompt value is passed in the request
     * @param request
     */
    UserAgentApplication.prototype.validatePromptParameter = function (prompt) {
        if (!([Constants_1.PromptState.LOGIN, Constants_1.PromptState.SELECT_ACCOUNT, Constants_1.PromptState.CONSENT, Constants_1.PromptState.NONE].indexOf(prompt) >= 0)) {
            throw ClientConfigurationError_1.ClientConfigurationError.createInvalidPromptError(prompt);
        }
    };
    /**
     * Remove sid and login_hint if passed as extraQueryParameters
     * @param eQParams
     */
    UserAgentApplication.prototype.removeSSOParamsFromEQParams = function (eQParams) {
        if (eQParams) {
            delete eQParams[Constants_1.SSOTypes.SID];
            delete eQParams[Constants_1.SSOTypes.LOGIN_HINT];
        }
        return eQParams;
    };
    tslib_1.__decorate([
        resolveTokenOnlyIfOutOfIframe
    ], UserAgentApplication.prototype, "acquireTokenSilent", null);
    return UserAgentApplication;
}());
exports.UserAgentApplication = UserAgentApplication;


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
var Utils_1 = __webpack_require__(0);
/**
 * accountIdentifier       combination of idToken.uid and idToken.utid
 * homeAccountIdentifier   combination of clientInfo.uid and clientInfo.utid
 * userName                idToken.preferred_username
 * name                    idToken.name
 * idToken                 idToken
 * sid                     idToken.sid - session identifier
 * environment             idtoken.issuer (the authority that issues the token)
 */
var Account = /** @class */ (function () {
    /**
     * Creates an Account Object
     * @praram accountIdentifier
     * @param homeAccountIdentifier
     * @param userName
     * @param name
     * @param idToken
     * @param sid
     * @param environment
     */
    function Account(accountIdentifier, homeAccountIdentifier, userName, name, idToken, sid, environment) {
        this.accountIdentifier = accountIdentifier;
        this.homeAccountIdentifier = homeAccountIdentifier;
        this.userName = userName;
        this.name = name;
        this.idToken = idToken;
        this.sid = sid;
        this.environment = environment;
    }
    /**
     * @hidden
     * @param idToken
     * @param clientInfo
     */
    Account.createAccount = function (idToken, clientInfo) {
        // create accountIdentifier
        var accountIdentifier = idToken.objectId || idToken.subject;
        // create homeAccountIdentifier
        var uid = clientInfo ? clientInfo.uid : "";
        var utid = clientInfo ? clientInfo.utid : "";
        var homeAccountIdentifier = Utils_1.Utils.base64EncodeStringUrlSafe(uid) + "." + Utils_1.Utils.base64EncodeStringUrlSafe(utid);
        return new Account(accountIdentifier, homeAccountIdentifier, idToken.preferredName, idToken.name, idToken.decodedIdToken, idToken.sid, idToken.issuer);
    };
    return Account;
}());
exports.Account = Account;


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var Authority_1 = __webpack_require__(4);
var XHRClient_1 = __webpack_require__(12);
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
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
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
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var Logger_1 = __webpack_require__(7);
var Utils_1 = __webpack_require__(0);
/**
 * Defaults for the Configuration Options
 */
var FRAME_TIMEOUT = 6000;
var OFFSET = 300;
var DEFAULT_AUTH_OPTIONS = {
    clientId: "",
    authority: null,
    validateAuthority: true,
    redirectUri: function () { return Utils_1.Utils.getDefaultRedirectUri(); },
    postLogoutRedirectUri: function () { return Utils_1.Utils.getDefaultRedirectUri(); },
    state: "",
    navigateToLoginRequestUrl: true
};
var DEFAULT_CACHE_OPTIONS = {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false
};
var DEFAULT_SYSTEM_OPTIONS = {
    logger: new Logger_1.Logger(null),
    loadFrameTimeout: FRAME_TIMEOUT,
    tokenRenewalOffsetSeconds: OFFSET
};
var DEFAULT_FRAMEWORK_OPTIONS = {
    isAngular: false,
    unprotectedResources: new Array(),
    protectedResourceMap: new Map()
};
/**
 * Function to set the default options when not explicitly set
 *
 * @param TAuthOptions
 * @param TCacheOptions
 * @param TSystemOptions
 * @param TFrameworkOptions
 *
 * @returns TConfiguration object
 */
// destructure with default settings
function buildConfiguration(_a) {
    var auth = _a.auth, _b = _a.cache, cache = _b === void 0 ? {} : _b, _c = _a.system, system = _c === void 0 ? {} : _c, _d = _a.framework, framework = _d === void 0 ? {} : _d;
    var overlayedConfig = {
        auth: tslib_1.__assign({}, DEFAULT_AUTH_OPTIONS, auth),
        cache: tslib_1.__assign({}, DEFAULT_CACHE_OPTIONS, cache),
        system: tslib_1.__assign({}, DEFAULT_SYSTEM_OPTIONS, system),
        framework: tslib_1.__assign({}, DEFAULT_FRAMEWORK_OPTIONS, framework)
    };
    return overlayedConfig;
}
exports.buildConfiguration = buildConfiguration;


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var ServerError_1 = __webpack_require__(8);
exports.InteractionRequiredAuthErrorMessage = {
    loginRequired: {
        code: "login_required"
    },
    interactionRequired: {
        code: "interaction_required"
    },
    consentRequired: {
        code: "consent_required"
    },
};
/**
 * Error thrown when the user is required to perform an interactive token request.
 */
var InteractionRequiredAuthError = /** @class */ (function (_super) {
    tslib_1.__extends(InteractionRequiredAuthError, _super);
    function InteractionRequiredAuthError(errorCode, errorMessage) {
        var _this = _super.call(this, errorCode, errorMessage) || this;
        _this.name = "InteractionRequiredAuthError";
        Object.setPrototypeOf(_this, InteractionRequiredAuthError.prototype);
        return _this;
    }
    InteractionRequiredAuthError.createLoginRequiredAuthError = function (errorDesc) {
        return new InteractionRequiredAuthError(exports.InteractionRequiredAuthErrorMessage.loginRequired.code, errorDesc);
    };
    InteractionRequiredAuthError.createInteractionRequiredAuthError = function (errorDesc) {
        return new InteractionRequiredAuthError(exports.InteractionRequiredAuthErrorMessage.interactionRequired.code, errorDesc);
    };
    InteractionRequiredAuthError.createConsentRequiredAuthError = function (errorDesc) {
        return new InteractionRequiredAuthError(exports.InteractionRequiredAuthErrorMessage.consentRequired.code, errorDesc);
    };
    return InteractionRequiredAuthError;
}(ServerError_1.ServerError));
exports.InteractionRequiredAuthError = InteractionRequiredAuthError;


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(16);


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var UserAgentApplication_1 = __webpack_require__(9);
exports.UserAgentApplication = UserAgentApplication_1.UserAgentApplication;
var Logger_1 = __webpack_require__(7);
exports.Logger = Logger_1.Logger;
var Logger_2 = __webpack_require__(7);
exports.LogLevel = Logger_2.LogLevel;
var Account_1 = __webpack_require__(10);
exports.Account = Account_1.Account;
var Constants_1 = __webpack_require__(2);
exports.Constants = Constants_1.Constants;
var Authority_1 = __webpack_require__(4);
exports.Authority = Authority_1.Authority;
var UserAgentApplication_2 = __webpack_require__(9);
exports.CacheResult = UserAgentApplication_2.CacheResult;
var Configuration_1 = __webpack_require__(13);
exports.CacheLocation = Configuration_1.CacheLocation;
exports.Configuration = Configuration_1.Configuration;
var AuthenticationParameters_1 = __webpack_require__(26);
exports.AuthenticationParameters = AuthenticationParameters_1.AuthenticationParameters;
var AuthResponse_1 = __webpack_require__(27);
exports.AuthResponse = AuthResponse_1.AuthResponse;
// Errors
var AuthError_1 = __webpack_require__(5);
exports.AuthError = AuthError_1.AuthError;
var ClientAuthError_1 = __webpack_require__(6);
exports.ClientAuthError = ClientAuthError_1.ClientAuthError;
var ServerError_1 = __webpack_require__(8);
exports.ServerError = ServerError_1.ServerError;
var ClientConfigurationError_1 = __webpack_require__(3);
exports.ClientConfigurationError = ClientConfigurationError_1.ClientConfigurationError;
var InteractionRequiredAuthError_1 = __webpack_require__(14);
exports.InteractionRequiredAuthError = InteractionRequiredAuthError_1.InteractionRequiredAuthError;


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = __webpack_require__(0);
/**
 * @hidden
 */
var AccessTokenKey = /** @class */ (function () {
    function AccessTokenKey(authority, clientId, scopes, uid, utid) {
        // TODO: Canonicalize authority URI
        this.authority = authority;
        this.clientId = clientId;
        this.scopes = scopes;
        this.homeAccountIdentifier = Utils_1.Utils.base64EncodeStringUrlSafe(uid) + "." + Utils_1.Utils.base64EncodeStringUrlSafe(utid);
    }
    return AccessTokenKey;
}());
exports.AccessTokenKey = AccessTokenKey;


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @hidden
 */
var AccessTokenValue = /** @class */ (function () {
    function AccessTokenValue(accessToken, idToken, expiresIn, homeAccountIdentifier) {
        this.accessToken = accessToken;
        this.idToken = idToken;
        this.expiresIn = expiresIn;
        this.homeAccountIdentifier = homeAccountIdentifier;
    }
    return AccessTokenValue;
}());
exports.AccessTokenValue = AccessTokenValue;


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = __webpack_require__(0);
/**
 * Nonce: OIDC Nonce definition: https://openid.net/specs/openid-connect-core-1_0.html#IDToken
 * State: OAuth Spec: https://tools.ietf.org/html/rfc6749#section-10.12
 * @hidden
 */
var ServerRequestParameters = /** @class */ (function () {
    /**
     * Constructor
     * @param authority
     * @param clientId
     * @param scope
     * @param responseType
     * @param redirectUri
     * @param state
     */
    function ServerRequestParameters(authority, clientId, scope, responseType, redirectUri, state) {
        this.authorityInstance = authority;
        this.clientId = clientId;
        this.scopes = scope;
        this.nonce = Utils_1.Utils.createNewGuid();
        this.state = state && !Utils_1.Utils.isEmpty(state) ? Utils_1.Utils.createNewGuid() + "|" + state : Utils_1.Utils.createNewGuid();
        // TODO: Change this to user passed vs generated with the new PR
        this.correlationId = Utils_1.Utils.createNewGuid();
        // telemetry information
        this.xClientSku = "MSAL.JS";
        this.xClientVer = Utils_1.Utils.getLibraryVersion();
        this.responseType = responseType;
        this.redirectUri = redirectUri;
    }
    Object.defineProperty(ServerRequestParameters.prototype, "authority", {
        get: function () {
            return this.authorityInstance ? this.authorityInstance.CanonicalAuthority : null;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * generates the URL with QueryString Parameters
     * @param scopes
     */
    ServerRequestParameters.prototype.createNavigateUrl = function (scopes) {
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
    /**
     * Generate the array of all QueryStringParams to be sent to the server
     * @param scopes
     */
    ServerRequestParameters.prototype.createNavigationUrlString = function (scopes) {
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
        if (this.promptValue) {
            str.push("prompt=" + encodeURI(this.promptValue));
        }
        if (this.queryParameters) {
            str.push(this.queryParameters);
        }
        if (this.extraQueryParameters) {
            str.push(this.extraQueryParameters);
        }
        str.push("client-request-id=" + encodeURIComponent(this.correlationId));
        return str;
    };
    /**
     * append the required scopes: https://openid.net/specs/openid-connect-basic-1_0.html#Scopes
     * @param scopes
     */
    ServerRequestParameters.prototype.translateclientIdUsedInScope = function (scopes) {
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
    /**
     * Parse the scopes into a formatted scopeList
     * @param scopes
     */
    ServerRequestParameters.prototype.parseScope = function (scopes) {
        var scopeList = "";
        if (scopes) {
            for (var i = 0; i < scopes.length; ++i) {
                scopeList += (i !== scopes.length - 1) ? scopes[i] + " " : scopes[i];
            }
        }
        return scopeList;
    };
    return ServerRequestParameters;
}());
exports.ServerRequestParameters = ServerRequestParameters;


/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
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
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
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
            // TODO: This error here won't really every be thrown, since extractIdToken() returns null if the decodeJwt() fails.
            // Need to add better error handling here to account for being unable to decode jwts.
            throw new Error("Failed to parse the returned id token");
        }
    }
    return IdToken;
}());
exports.IdToken = IdToken;


/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
var Constants_1 = __webpack_require__(2);
var AccessTokenCacheItem_1 = __webpack_require__(23);
var Constants_2 = __webpack_require__(2);
/**
 * @hidden
 */
var Storage = /** @class */ (function () {
    function Storage(cacheLocation) {
        if (Storage.instance) {
            return Storage.instance;
        }
        this.cacheLocation = cacheLocation;
        this.localStorageSupported = typeof window[this.cacheLocation] !== "undefined" && window[this.cacheLocation] != null;
        this.sessionStorageSupported = typeof window[cacheLocation] !== "undefined" && window[cacheLocation] != null;
        Storage.instance = this;
        if (!this.localStorageSupported && !this.sessionStorageSupported) {
            throw new Error("localStorage and sessionStorage not supported");
        }
        return Storage.instance;
    }
    // add value to storage
    Storage.prototype.setItem = function (key, value, enableCookieStorage) {
        if (window[this.cacheLocation]) {
            window[this.cacheLocation].setItem(key, value);
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
        if (window[this.cacheLocation]) {
            return window[this.cacheLocation].getItem(key);
        }
        return null;
    };
    // remove value from storage
    Storage.prototype.removeItem = function (key) {
        if (window[this.cacheLocation]) {
            return window[this.cacheLocation].removeItem(key);
        }
    };
    // clear storage (remove all items from it)
    Storage.prototype.clear = function () {
        if (window[this.cacheLocation]) {
            return window[this.cacheLocation].clear();
        }
    };
    Storage.prototype.getAllAccessTokens = function (clientId, homeAccountIdentifier) {
        var results = [];
        var accessTokenCacheItem;
        var storage = window[this.cacheLocation];
        if (storage) {
            var key = void 0;
            for (key in storage) {
                if (storage.hasOwnProperty(key)) {
                    if (key.match(clientId) && key.match(homeAccountIdentifier)) {
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
    Storage.prototype.removeAcquireTokenEntries = function (authorityKey, acquireTokenAccountKey) {
        var storage = window[this.cacheLocation];
        if (storage) {
            var key = void 0;
            for (key in storage) {
                if (storage.hasOwnProperty(key)) {
                    if ((authorityKey !== "" && key.indexOf(authorityKey) > -1) || (acquireTokenAccountKey !== "" && key.indexOf(acquireTokenAccountKey) > -1)) {
                        this.removeItem(key);
                    }
                }
            }
        }
    };
    Storage.prototype.resetCacheItems = function () {
        var storage = window[this.cacheLocation];
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
    /**
     * Create acquireTokenAccountKey to cache account object
     * @param accountId
     * @param state
     */
    Storage.generateAcquireTokenAccountKey = function (accountId, state) {
        return Constants_2.CacheKeys.ACQUIRE_TOKEN_USER + Constants_1.Constants.resourceDelimiter +
            ("" + accountId) + Constants_1.Constants.resourceDelimiter + ("" + state);
    };
    /**
     * Create authorityKey to cache authority
     * @param state
     */
    Storage.generateAuthorityKey = function (state) {
        return Constants_2.CacheKeys.AUTHORITY + Constants_1.Constants.resourceDelimiter + ("" + state);
    };
    return Storage;
}());
exports.Storage = Storage;


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
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
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @hidden
 */
var Utils_1 = __webpack_require__(0);
var AadAuthority_1 = __webpack_require__(11);
var B2cAuthority_1 = __webpack_require__(25);
var Authority_1 = __webpack_require__(4);
var ClientConfigurationError_1 = __webpack_require__(3);
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
                throw ClientConfigurationError_1.ClientConfigurationErrorMessage.invalidAuthorityType;
        }
    };
    return AuthorityFactory;
}());
exports.AuthorityFactory = AuthorityFactory;


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var AadAuthority_1 = __webpack_require__(11);
var Authority_1 = __webpack_require__(4);
var ClientConfigurationError_1 = __webpack_require__(3);
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
            throw ClientConfigurationError_1.ClientConfigurationErrorMessage.b2cAuthorityUriInvalidPath;
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
            return reject(ClientConfigurationError_1.ClientConfigurationErrorMessage.unsupportedAuthorityValidation);
        });
    };
    return B2cAuthority;
}(AadAuthority_1.AadAuthority));
exports.B2cAuthority = B2cAuthority;


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });


/***/ })
/******/ ]);
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9Nc2FsL3dlYnBhY2svdW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbiIsIndlYnBhY2s6Ly9Nc2FsL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL01zYWwvLi9zcmMvVXRpbHMudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL25vZGVfbW9kdWxlcy90c2xpYi90c2xpYi5lczYuanMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9Db25zdGFudHMudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9lcnJvci9DbGllbnRDb25maWd1cmF0aW9uRXJyb3IudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9BdXRob3JpdHkudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9lcnJvci9BdXRoRXJyb3IudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9lcnJvci9DbGllbnRBdXRoRXJyb3IudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9Mb2dnZXIudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9lcnJvci9TZXJ2ZXJFcnJvci50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL1VzZXJBZ2VudEFwcGxpY2F0aW9uLnRzIiwid2VicGFjazovL01zYWwvLi9zcmMvQWNjb3VudC50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL0FhZEF1dGhvcml0eS50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL1hIUkNsaWVudC50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL0NvbmZpZ3VyYXRpb24udHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9lcnJvci9JbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yLnRzIiwid2VicGFjazovL01zYWwvLi9zcmMvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9BY2Nlc3NUb2tlbktleS50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL0FjY2Vzc1Rva2VuVmFsdWUudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9TZXJ2ZXJSZXF1ZXN0UGFyYW1ldGVycy50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL0NsaWVudEluZm8udHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9JZFRva2VuLnRzIiwid2VicGFjazovL01zYWwvLi9zcmMvU3RvcmFnZS50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL0FjY2Vzc1Rva2VuQ2FjaGVJdGVtLnRzIiwid2VicGFjazovL01zYWwvLi9zcmMvQXV0aG9yaXR5RmFjdG9yeS50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL0IyY0F1dGhvcml0eS50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL0F1dGhlbnRpY2F0aW9uUGFyYW1ldGVycy50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL0F1dGhSZXNwb25zZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxPO0FDVkE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxrREFBMEMsZ0NBQWdDO0FBQzFFO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0VBQXdELGtCQUFrQjtBQUMxRTtBQUNBLHlEQUFpRCxjQUFjO0FBQy9EOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpREFBeUMsaUNBQWlDO0FBQzFFLHdIQUFnSCxtQkFBbUIsRUFBRTtBQUNySTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOzs7QUFHQTtBQUNB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RSxDQUFDO3dCQUFDLFNBQVM7b0JBQ2pEO3dCQUNJLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7NEJBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQzs0QkFBQyxTQUFTO3lCQUFFO3dCQUM1RyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7NEJBQUUsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQUMsTUFBTTt5QkFBRTt3QkFDdEYsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFOzRCQUFFLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7NEJBQUMsTUFBTTt5QkFBRTt3QkFDckUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7NEJBQUUsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7NEJBQUMs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QyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxHQUFHLGNBQWMsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3RILFNBQVMsSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUksU0FBUyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJO1FBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQUU7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FBRSxDQUFDLENBQUM7SUFDbEYsU0FBUyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLFlBQVksT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEgsU0FBUyxPQUFP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LENBQUMsQ0FBQyxTQUFJLFlBQVksQ0FBQyxDQUFDLENBQUMsTUFBRyxDQUFDOztJQUNqSSxDQUFDO0lBRUQsc0JBQVcsdUNBQWE7YUFBeEI7WUFDRSxPQUFPLHlCQUFhLENBQUMsR0FBRyxDQUFDO1FBQzNCLENBQUM7OztPQUFBO0lBRUQ7O09BRUc7SUFDSSwwREFBbUMsR0FBMUM7UUFBQSxpQkFjQztRQWJDLElBQU0sYUFBYSxHQUFHLElBQUksT0FBTyxDQUFTLFVBQUMsT0FBTyxFQUFFLE1BQU07WUFDeEQsY0FBTyxDQUFDLEtBQUksQ0FBQyxrQ0FBa0MsQ0FBQztRQUFoRCxDQUFnRCxDQUFDLENBQUM7UUFFcEQsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtZQUM3QixPQUFPLGFBQWEsQ0FBQztTQUN0QjtRQUVELElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxlQUFlLENBQUMsRUFBRTtZQUNsRixPQUFPLGFBQWEsQ0FBQztTQUN0QjtRQUVELE9BQU8sSUFBSSxPQUFPLENBQVMsVUFBQyxPQUFPLEVBQUUsTUFBTTtZQUN6QyxhQUFNLENBQUMsMERBQStCLENBQUMsOEJBQThCLENBQUM7UUFBdEUsQ0FBc0UsQ0FBQyxDQUFDO0lBQzVFLENBQUM7SUFDSCxtQkFBQztBQUFELENBQUMsQ0FuQ2lDLDJCQUFZLEdBbUM3QztBQW5DWSxvQ0FBWTs7Ozs7Ozs7O0FDWHpCLDREQUE0RDtBQUM1RCxrQ0FBa0M7Ozs7Ozs7Ozs7QUNEbEMsNERBQTREO0FBQzVELGtDQUFrQyIsImZpbGUiOiJtc2FsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIHdlYnBhY2tVbml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKVxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHRlbHNlIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcblx0XHRkZWZpbmUoXCJNc2FsXCIsIFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcIk1zYWxcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wiTXNhbFwiXSA9IGZhY3RvcnkoKTtcbn0pKHdpbmRvdywgZnVuY3Rpb24oKSB7XG5yZXR1cm4gIiwiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IDE1KTtcbiIsIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuXG5pbXBvcnQgeyBJVXJpIH0gZnJvbSBcIi4vSVVyaVwiO1xuaW1wb3J0IHsgQWNjb3VudCB9IGZyb20gXCIuL0FjY291bnRcIjtcbmltcG9ydCB7Q29uc3RhbnRzLCBTU09UeXBlcywgUHJvbXB0U3RhdGV9IGZyb20gXCIuL0NvbnN0YW50c1wiO1xuaW1wb3J0IHsgQXV0aGVudGljYXRpb25QYXJhbWV0ZXJzLCBRUERpY3QgfSBmcm9tIFwiLi9BdXRoZW50aWNhdGlvblBhcmFtZXRlcnNcIjtcbmltcG9ydCB7IEF1dGhSZXNwb25zZSB9IGZyb20gXCIuL0F1dGhSZXNwb25zZVwiO1xuaW1wb3J0IHsgSWRUb2tlbiB9IGZyb20gXCIuL0lkVG9rZW5cIjtcbmltcG9ydCB7IExpYnJhcnkgfSBmcm9tIFwiLi9Db25zdGFudHNcIjtcblxuLyoqXG4gKiBAaGlkZGVuXG4gKi9cbmV4cG9ydCBjbGFzcyBVdGlscyB7XG5cbiAgLy8jcmVnaW9uIEdlbmVyYWwgVXRpbFxuXG4gIC8qKlxuICAgKiBVdGlscyBmdW5jdGlvbiB0byBjb21wYXJlIHR3byBBY2NvdW50IG9iamVjdHMgLSB1c2VkIHRvIGNoZWNrIGlmIHRoZSBzYW1lIHVzZXIgYWNjb3VudCBpcyBsb2dnZWQgaW5cbiAgICpcbiAgICogQHBhcmFtIGExOiBBY2NvdW50IG9iamVjdFxuICAgKiBAcGFyYW0gYTI6IEFjY291bnQgb2JqZWN0XG4gICAqL1xuICBzdGF0aWMgY29tcGFyZUFjY291bnRzKGExOiBBY2NvdW50LCBhMjogQWNjb3VudCk6IGJvb2xlYW4ge1xuICAgaWYgKCFhMSB8fCAhYTIpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgaWYgKGExLmhvbWVBY2NvdW50SWRlbnRpZmllciAmJiBhMi5ob21lQWNjb3VudElkZW50aWZpZXIpIHtcbiAgICAgIGlmIChhMS5ob21lQWNjb3VudElkZW50aWZpZXIgPT09IGEyLmhvbWVBY2NvdW50SWRlbnRpZmllcikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIERlY2ltYWwgdG8gSGV4XG4gICAqXG4gICAqIEBwYXJhbSBudW1cbiAgICovXG4gIHN0YXRpYyBkZWNpbWFsVG9IZXgobnVtOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHZhciBoZXg6IHN0cmluZyA9IG51bS50b1N0cmluZygxNik7XG4gICAgd2hpbGUgKGhleC5sZW5ndGggPCAyKSB7XG4gICAgICBoZXggPSBcIjBcIiArIGhleDtcbiAgICB9XG4gICAgcmV0dXJuIGhleDtcbiAgfVxuXG4gIC8qKlxuICAgKiBNU0FMIEpTIExpYnJhcnkgVmVyc2lvblxuICAgKi9cbiAgc3RhdGljIGdldExpYnJhcnlWZXJzaW9uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIExpYnJhcnkudmVyc2lvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHJhbmRvbSBHVUlEIC0gdXNlZCB0byBwb3B1bGF0ZSBzdGF0ZT9cbiAgICogQHJldHVybnMgc3RyaW5nIChHVUlEKVxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZU5ld0d1aWQoKTogc3RyaW5nIHtcbiAgICAvLyBSRkM0MTIyOiBUaGUgdmVyc2lvbiA0IFVVSUQgaXMgbWVhbnQgZm9yIGdlbmVyYXRpbmcgVVVJRHMgZnJvbSB0cnVseS1yYW5kb20gb3JcbiAgICAvLyBwc2V1ZG8tcmFuZG9tIG51bWJlcnMuXG4gICAgLy8gVGhlIGFsZ29yaXRobSBpcyBhcyBmb2xsb3dzOlxuICAgIC8vICAgICBTZXQgdGhlIHR3byBtb3N0IHNpZ25pZmljYW50IGJpdHMgKGJpdHMgNiBhbmQgNykgb2YgdGhlXG4gICAgLy8gICAgICAgIGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWQgdG8gemVybyBhbmQgb25lLCByZXNwZWN0aXZlbHkuXG4gICAgLy8gICAgIFNldCB0aGUgZm91ciBtb3N0IHNpZ25pZmljYW50IGJpdHMgKGJpdHMgMTIgdGhyb3VnaCAxNSkgb2YgdGhlXG4gICAgLy8gICAgICAgIHRpbWVfaGlfYW5kX3ZlcnNpb24gZmllbGQgdG8gdGhlIDQtYml0IHZlcnNpb24gbnVtYmVyIGZyb21cbiAgICAvLyAgICAgICAgU2VjdGlvbiA0LjEuMy4gVmVyc2lvbjRcbiAgICAvLyAgICAgU2V0IGFsbCB0aGUgb3RoZXIgYml0cyB0byByYW5kb21seSAob3IgcHNldWRvLXJhbmRvbWx5KSBjaG9zZW5cbiAgICAvLyAgICAgdmFsdWVzLlxuICAgIC8vIFVVSUQgICAgICAgICAgICAgICAgICAgPSB0aW1lLWxvdyBcIi1cIiB0aW1lLW1pZCBcIi1cInRpbWUtaGlnaC1hbmQtdmVyc2lvbiBcIi1cImNsb2NrLXNlcS1yZXNlcnZlZCBhbmQgbG93KDJoZXhPY3RldClcIi1cIiBub2RlXG4gICAgLy8gdGltZS1sb3cgICAgICAgICAgICAgICA9IDRoZXhPY3RldFxuICAgIC8vIHRpbWUtbWlkICAgICAgICAgICAgICAgPSAyaGV4T2N0ZXRcbiAgICAvLyB0aW1lLWhpZ2gtYW5kLXZlcnNpb24gID0gMmhleE9jdGV0XG4gICAgLy8gY2xvY2stc2VxLWFuZC1yZXNlcnZlZCA9IGhleE9jdGV0OlxuICAgIC8vIGNsb2NrLXNlcS1sb3cgICAgICAgICAgPSBoZXhPY3RldFxuICAgIC8vIG5vZGUgICAgICAgICAgICAgICAgICAgPSA2aGV4T2N0ZXRcbiAgICAvLyBGb3JtYXQ6IHh4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eFxuICAgIC8vIHkgY291bGQgYmUgMTAwMCwgMTAwMSwgMTAxMCwgMTAxMSBzaW5jZSBtb3N0IHNpZ25pZmljYW50IHR3byBiaXRzIG5lZWRzIHRvIGJlIDEwXG4gICAgLy8geSB2YWx1ZXMgYXJlIDgsIDksIEEsIEJcblxuICAgIGNvbnN0IGNyeXB0b09iajogQ3J5cHRvID0gd2luZG93LmNyeXB0bzsgLy8gZm9yIElFIDExXG4gICAgaWYgKGNyeXB0b09iaiAmJiBjcnlwdG9PYmouZ2V0UmFuZG9tVmFsdWVzKSB7XG4gICAgICBjb25zdCBidWZmZXI6IFVpbnQ4QXJyYXkgPSBuZXcgVWludDhBcnJheSgxNik7XG4gICAgICBjcnlwdG9PYmouZ2V0UmFuZG9tVmFsdWVzKGJ1ZmZlcik7XG5cbiAgICAgIC8vYnVmZmVyWzZdIGFuZCBidWZmZXJbN10gcmVwcmVzZW50cyB0aGUgdGltZV9oaV9hbmRfdmVyc2lvbiBmaWVsZC4gV2Ugd2lsbCBzZXQgdGhlIGZvdXIgbW9zdCBzaWduaWZpY2FudCBiaXRzICg0IHRocm91Z2ggNykgb2YgYnVmZmVyWzZdIHRvIHJlcHJlc2VudCBkZWNpbWFsIG51bWJlciA0IChVVUlEIHZlcnNpb24gbnVtYmVyKS5cbiAgICAgIGJ1ZmZlcls2XSB8PSAweDQwOyAvL2J1ZmZlcls2XSB8IDAxMDAwMDAwIHdpbGwgc2V0IHRoZSA2IGJpdCB0byAxLlxuICAgICAgYnVmZmVyWzZdICY9IDB4NGY7IC8vYnVmZmVyWzZdICYgMDEwMDExMTEgd2lsbCBzZXQgdGhlIDQsIDUsIGFuZCA3IGJpdCB0byAwIHN1Y2ggdGhhdCBiaXRzIDQtNyA9PSAwMTAwID0gXCI0XCIuXG5cbiAgICAgIC8vYnVmZmVyWzhdIHJlcHJlc2VudHMgdGhlIGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWQgZmllbGQuIFdlIHdpbGwgc2V0IHRoZSB0d28gbW9zdCBzaWduaWZpY2FudCBiaXRzICg2IGFuZCA3KSBvZiB0aGUgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZCB0byB6ZXJvIGFuZCBvbmUsIHJlc3BlY3RpdmVseS5cbiAgICAgIGJ1ZmZlcls4XSB8PSAweDgwOyAvL2J1ZmZlcls4XSB8IDEwMDAwMDAwIHdpbGwgc2V0IHRoZSA3IGJpdCB0byAxLlxuICAgICAgYnVmZmVyWzhdICY9IDB4YmY7IC8vYnVmZmVyWzhdICYgMTAxMTExMTEgd2lsbCBzZXQgdGhlIDYgYml0IHRvIDAuXG5cbiAgICAgIHJldHVybiBVdGlscy5kZWNpbWFsVG9IZXgoYnVmZmVyWzBdKSArIFV0aWxzLmRlY2ltYWxUb0hleChidWZmZXJbMV0pXG4gICAgICAgICsgVXRpbHMuZGVjaW1hbFRvSGV4KGJ1ZmZlclsyXSkgKyBVdGlscy5kZWNpbWFsVG9IZXgoYnVmZmVyWzNdKVxuICAgICAgICArIFwiLVwiICsgVXRpbHMuZGVjaW1hbFRvSGV4KGJ1ZmZlcls0XSkgKyBVdGlscy5kZWNpbWFsVG9IZXgoYnVmZmVyWzVdKVxuICAgICAgICArIFwiLVwiICsgVXRpbHMuZGVjaW1hbFRvSGV4KGJ1ZmZlcls2XSkgKyBVdGlscy5kZWNpbWFsVG9IZXgoYnVmZmVyWzddKVxuICAgICAgICArIFwiLVwiICsgVXRpbHMuZGVjaW1hbFRvSGV4KGJ1ZmZlcls4XSkgKyBVdGlscy5kZWNpbWFsVG9IZXgoYnVmZmVyWzldKVxuICAgICAgICArIFwiLVwiICsgVXRpbHMuZGVjaW1hbFRvSGV4KGJ1ZmZlclsxMF0pICsgVXRpbHMuZGVjaW1hbFRvSGV4KGJ1ZmZlclsxMV0pXG4gICAgICAgICsgVXRpbHMuZGVjaW1hbFRvSGV4KGJ1ZmZlclsxMl0pICsgVXRpbHMuZGVjaW1hbFRvSGV4KGJ1ZmZlclsxM10pXG4gICAgICAgICsgVXRpbHMuZGVjaW1hbFRvSGV4KGJ1ZmZlclsxNF0pICsgVXRpbHMuZGVjaW1hbFRvSGV4KGJ1ZmZlclsxNV0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbnN0IGd1aWRIb2xkZXI6IHN0cmluZyA9IFwieHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4XCI7XG4gICAgICBjb25zdCBoZXg6IHN0cmluZyA9IFwiMDEyMzQ1Njc4OWFiY2RlZlwiO1xuICAgICAgbGV0IHI6IG51bWJlciA9IDA7XG4gICAgICBsZXQgZ3VpZFJlc3BvbnNlOiBzdHJpbmcgPSBcIlwiO1xuICAgICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IDM2OyBpKyspIHtcbiAgICAgICAgaWYgKGd1aWRIb2xkZXJbaV0gIT09IFwiLVwiICYmIGd1aWRIb2xkZXJbaV0gIT09IFwiNFwiKSB7XG4gICAgICAgICAgLy8gZWFjaCB4IGFuZCB5IG5lZWRzIHRvIGJlIHJhbmRvbVxuICAgICAgICAgIHIgPSBNYXRoLnJhbmRvbSgpICAqIDE2IHwgMDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZ3VpZEhvbGRlcltpXSA9PT0gXCJ4XCIpIHtcbiAgICAgICAgICBndWlkUmVzcG9uc2UgKz0gaGV4W3JdO1xuICAgICAgICB9IGVsc2UgaWYgKGd1aWRIb2xkZXJbaV0gPT09IFwieVwiKSB7XG4gICAgICAgICAgLy8gY2xvY2stc2VxLWFuZC1yZXNlcnZlZCBmaXJzdCBoZXggaXMgZmlsdGVyZWQgYW5kIHJlbWFpbmluZyBoZXggdmFsdWVzIGFyZSByYW5kb21cbiAgICAgICAgICByICY9IDB4MzsgLy8gYml0IGFuZCB3aXRoIDAwMTEgdG8gc2V0IHBvcyAyIHRvIHplcm8gPzA/P1xuICAgICAgICAgIHIgfD0gMHg4OyAvLyBzZXQgcG9zIDMgdG8gMSBhcyAxPz8/XG4gICAgICAgICAgZ3VpZFJlc3BvbnNlICs9IGhleFtyXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBndWlkUmVzcG9uc2UgKz0gZ3VpZEhvbGRlcltpXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGd1aWRSZXNwb25zZTtcbiAgICB9XG4gIH1cblxuICAvLyNlbmRyZWdpb25cblxuICAvLyNyZWdpb24gVGltZVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRpbWUgaW4gc2Vjb25kcyBmb3IgZXhwaXJhdGlvbiBiYXNlZCBvbiBzdHJpbmcgdmFsdWUgcGFzc2VkIGluLlxuICAgKlxuICAgKiBAcGFyYW0gZXhwaXJlc1xuICAgKi9cbiAgc3RhdGljIGV4cGlyZXNJbihleHBpcmVzOiBzdHJpbmcpOiBudW1iZXIge1xuICAgIC8vIGlmIEFBRCBkaWQgbm90IHNlbmQgXCJleHBpcmVzX2luXCIgcHJvcGVydHksIHVzZSBkZWZhdWx0IGV4cGlyYXRpb24gb2YgMzU5OSBzZWNvbmRzLCBmb3Igc29tZSByZWFzb24gQUFEIHNlbmRzIDM1OTkgYXMgXCJleHBpcmVzX2luXCIgdmFsdWUgaW5zdGVhZCBvZiAzNjAwXG4gICAgIGlmICghZXhwaXJlcykge1xuICAgICAgICAgZXhwaXJlcyA9IFwiMzU5OVwiO1xuICAgICAgfVxuICAgIHJldHVybiB0aGlzLm5vdygpICsgcGFyc2VJbnQoZXhwaXJlcywgMTApO1xuICB9XG5cbiAgLyoqXG4gICAqIHJldHVybiB0aGUgY3VycmVudCB0aW1lIGluIFVuaXggdGltZS4gRGF0ZS5nZXRUaW1lKCkgcmV0dXJucyBpbiBtaWxsaXNlY29uZHMuXG4gICAqL1xuICBzdGF0aWMgbm93KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobmV3IERhdGUoKS5nZXRUaW1lKCkgLyAxMDAwLjApO1xuICB9XG5cbiAgLy8jZW5kcmVnaW9uXG5cbiAgLy8jcmVnaW9uIFN0cmluZyBPcHNcblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSBzdHJpbmcgaXMgZW1wdHlcbiAgICpcbiAgICogQHBhcmFtIHN0clxuICAgKi9cbiAgc3RhdGljIGlzRW1wdHkoc3RyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gKHR5cGVvZiBzdHIgPT09IFwidW5kZWZpbmVkXCIgfHwgIXN0ciB8fCAwID09PSBzdHIubGVuZ3RoKTtcbiAgfVxuXG4gIC8vI2VuZHJlZ2lvblxuXG4gIC8vI3JlZ2lvbiBUb2tlbiBQcm9jZXNzaW5nIChFeHRyYWN0IHRvIFRva2VuUHJvY2Vzc2luZy50cylcblxuICAvKipcbiAgICogZGVjb2RlIGEgSldUXG4gICAqXG4gICAqIEBwYXJhbSBqd3RUb2tlblxuICAgKi9cbiAgc3RhdGljIGRlY29kZUp3dChqd3RUb2tlbjogc3RyaW5nKTogYW55IHtcbiAgICBpZiAodGhpcy5pc0VtcHR5KGp3dFRva2VuKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGlkVG9rZW5QYXJ0c1JlZ2V4ID0gL14oW15cXC5cXHNdKilcXC4oW15cXC5cXHNdKylcXC4oW15cXC5cXHNdKikkLztcbiAgICBjb25zdCBtYXRjaGVzID0gaWRUb2tlblBhcnRzUmVnZXguZXhlYyhqd3RUb2tlbik7XG4gICAgaWYgKCFtYXRjaGVzIHx8IG1hdGNoZXMubGVuZ3RoIDwgNCkge1xuICAgICAgLy90aGlzLl9yZXF1ZXN0Q29udGV4dC5sb2dnZXIud2FybihcIlRoZSByZXR1cm5lZCBpZF90b2tlbiBpcyBub3QgcGFyc2VhYmxlLlwiKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBjcmFja2VkVG9rZW4gPSB7XG4gICAgICBoZWFkZXI6IG1hdGNoZXNbMV0sXG4gICAgICBKV1NQYXlsb2FkOiBtYXRjaGVzWzJdLFxuICAgICAgSldTU2lnOiBtYXRjaGVzWzNdXG4gICAgfTtcbiAgICByZXR1cm4gY3JhY2tlZFRva2VuO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4dHJhY3QgSWRUb2tlbiBieSBkZWNvZGluZyB0aGUgUkFXSWRUb2tlblxuICAgKlxuICAgKiBAcGFyYW0gZW5jb2RlZElkVG9rZW5cbiAgICovXG4gIHN0YXRpYyBleHRyYWN0SWRUb2tlbihlbmNvZGVkSWRUb2tlbjogc3RyaW5nKTogYW55IHtcbiAgICAvLyBpZCB0b2tlbiB3aWxsIGJlIGRlY29kZWQgdG8gZ2V0IHRoZSB1c2VybmFtZVxuICAgIGNvbnN0IGRlY29kZWRUb2tlbiA9IHRoaXMuZGVjb2RlSnd0KGVuY29kZWRJZFRva2VuKTtcbiAgICBpZiAoIWRlY29kZWRUb2tlbikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBiYXNlNjRJZFRva2VuID0gZGVjb2RlZFRva2VuLkpXU1BheWxvYWQ7XG4gICAgICBjb25zdCBiYXNlNjREZWNvZGVkID0gdGhpcy5iYXNlNjREZWNvZGVTdHJpbmdVcmxTYWZlKGJhc2U2NElkVG9rZW4pO1xuICAgICAgaWYgKCFiYXNlNjREZWNvZGVkKSB7XG4gICAgICAgIC8vdGhpcy5fcmVxdWVzdENvbnRleHQubG9nZ2VyLmluZm8oXCJUaGUgcmV0dXJuZWQgaWRfdG9rZW4gY291bGQgbm90IGJlIGJhc2U2NCB1cmwgc2FmZSBkZWNvZGVkLlwiKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICAvLyBFQ01BIHNjcmlwdCBoYXMgSlNPTiBidWlsdC1pbiBzdXBwb3J0XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShiYXNlNjREZWNvZGVkKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIC8vdGhpcy5fcmVxdWVzdENvbnRleHQubG9nZ2VyLmVycm9yKFwiVGhlIHJldHVybmVkIGlkX3Rva2VuIGNvdWxkIG5vdCBiZSBkZWNvZGVkXCIgKyBlcnIpO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8jZW5kcmVnaW9uXG5cbiAgLy8jcmVnaW9uIEVuY29kZSBhbmQgRGVjb2RlXG5cbiAgLyoqXG4gICAqIGVuY29kaW5nIHN0cmluZyB0byBiYXNlNjQgLSBwbGF0Zm9ybSBzcGVjaWZpYyBjaGVja1xuICAgKlxuICAgKiBAcGFyYW0gaW5wdXRcbiAgICovXG4gIHN0YXRpYyBiYXNlNjRFbmNvZGVTdHJpbmdVcmxTYWZlKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIC8vIGh0bWw1IHNob3VsZCBzdXBwb3J0IGF0b2IgZnVuY3Rpb24gZm9yIGRlY29kaW5nXG4gICAgaWYgKHdpbmRvdy5idG9hKSB7XG4gICAgICByZXR1cm4gd2luZG93LmJ0b2EoaW5wdXQpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLmVuY29kZShpbnB1dCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIGRlY29kaW5nIGJhc2U2NCB0b2tlbiAtIHBsYXRmb3JtIHNwZWNpZmljIGNoZWNrXG4gICAqXG4gICAqIEBwYXJhbSBiYXNlNjRJZFRva2VuXG4gICAqL1xuICBzdGF0aWMgYmFzZTY0RGVjb2RlU3RyaW5nVXJsU2FmZShiYXNlNjRJZFRva2VuOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIC8vIGh0bWw1IHNob3VsZCBzdXBwb3J0IGF0b2IgZnVuY3Rpb24gZm9yIGRlY29kaW5nXG4gICAgYmFzZTY0SWRUb2tlbiA9IGJhc2U2NElkVG9rZW4ucmVwbGFjZSgvLS9nLCBcIitcIikucmVwbGFjZSgvXy9nLCBcIi9cIik7XG4gICAgaWYgKHdpbmRvdy5hdG9iKSB7XG4gICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoZW5jb2RlVVJJQ29tcG9uZW50KHdpbmRvdy5hdG9iKGJhc2U2NElkVG9rZW4pKSk7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChlbmNvZGVVUklDb21wb25lbnQodGhpcy5kZWNvZGUoYmFzZTY0SWRUb2tlbikpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogYmFzZTY0IGVuY29kZSBhIHN0cmluZ1xuICAgKlxuICAgKiBAcGFyYW0gaW5wdXRcbiAgICovXG4gIC8vIFRPRE86IFJlbmFtZSB0byBzcGVjaWZ5IHR5cGUgb2YgZW5jb2RpbmdcbiAgc3RhdGljIGVuY29kZShpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBrZXlTdHI6IHN0cmluZyA9IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLz1cIjtcbiAgICBsZXQgb3V0cHV0ID0gXCJcIjtcbiAgICBsZXQgY2hyMTogbnVtYmVyLCBjaHIyOiBudW1iZXIsIGNocjM6IG51bWJlciwgZW5jMTogbnVtYmVyLCBlbmMyOiBudW1iZXIsIGVuYzM6IG51bWJlciwgZW5jNDogbnVtYmVyO1xuICAgIHZhciBpID0gMDtcblxuICAgIGlucHV0ID0gdGhpcy51dGY4RW5jb2RlKGlucHV0KTtcblxuICAgIHdoaWxlIChpIDwgaW5wdXQubGVuZ3RoKSB7XG4gICAgICBjaHIxID0gaW5wdXQuY2hhckNvZGVBdChpKyspO1xuICAgICAgY2hyMiA9IGlucHV0LmNoYXJDb2RlQXQoaSsrKTtcbiAgICAgIGNocjMgPSBpbnB1dC5jaGFyQ29kZUF0KGkrKyk7XG5cbiAgICAgIGVuYzEgPSBjaHIxID4+IDI7XG4gICAgICBlbmMyID0gKChjaHIxICYgMykgPDwgNCkgfCAoY2hyMiA+PiA0KTtcbiAgICAgIGVuYzMgPSAoKGNocjIgJiAxNSkgPDwgMikgfCAoY2hyMyA+PiA2KTtcbiAgICAgIGVuYzQgPSBjaHIzICYgNjM7XG5cbiAgICAgIGlmIChpc05hTihjaHIyKSkge1xuICAgICAgICBlbmMzID0gZW5jNCA9IDY0O1xuICAgICAgfSBlbHNlIGlmIChpc05hTihjaHIzKSkge1xuICAgICAgICBlbmM0ID0gNjQ7XG4gICAgICB9XG5cbiAgICAgIG91dHB1dCA9IG91dHB1dCArIGtleVN0ci5jaGFyQXQoZW5jMSkgKyBrZXlTdHIuY2hhckF0KGVuYzIpICsga2V5U3RyLmNoYXJBdChlbmMzKSArIGtleVN0ci5jaGFyQXQoZW5jNCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dC5yZXBsYWNlKC9cXCsvZywgXCItXCIpLnJlcGxhY2UoL1xcLy9nLCBcIl9cIikucmVwbGFjZSgvPSskLywgXCJcIik7XG4gIH1cblxuICAvKipcbiAgICogdXRmOCBlbmNvZGUgYSBzdHJpbmdcbiAgICpcbiAgICogQHBhcmFtIGlucHV0XG4gICAqL1xuICBzdGF0aWMgdXRmOEVuY29kZShpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpbnB1dCA9IGlucHV0LnJlcGxhY2UoL1xcclxcbi9nLCBcIlxcblwiKTtcbiAgICB2YXIgdXRmdGV4dCA9IFwiXCI7XG5cbiAgICBmb3IgKHZhciBuID0gMDsgbiA8IGlucHV0Lmxlbmd0aDsgbisrKSB7XG4gICAgICB2YXIgYyA9IGlucHV0LmNoYXJDb2RlQXQobik7XG5cbiAgICAgIGlmIChjIDwgMTI4KSB7XG4gICAgICAgIHV0ZnRleHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKChjID4gMTI3KSAmJiAoYyA8IDIwNDgpKSB7XG4gICAgICAgIHV0ZnRleHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgoYyA+PiA2KSB8IDE5Mik7XG4gICAgICAgIHV0ZnRleHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgoYyAmIDYzKSB8IDEyOCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjID4+IDEyKSB8IDIyNCk7XG4gICAgICAgIHV0ZnRleHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgoKGMgPj4gNikgJiA2MykgfCAxMjgpO1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKGMgJiA2MykgfCAxMjgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB1dGZ0ZXh0O1xuICB9XG5cbiAgLyoqXG4gICAqIGRlY29kZSBhIGJhc2U2NCB0b2tlbiBzdHJpbmdcbiAgICpcbiAgICogQHBhcmFtIGJhc2U2NElkVG9rZW5cbiAgICovXG4gIC8vIFRPRE86IFJlbmFtZSB0byBzcGVjaWZ5IHR5cGUgb2YgZW5jb2RpbmdcbiAgc3RhdGljIGRlY29kZShiYXNlNjRJZFRva2VuOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHZhciBjb2RlcyA9IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLz1cIjtcbiAgICBiYXNlNjRJZFRva2VuID0gU3RyaW5nKGJhc2U2NElkVG9rZW4pLnJlcGxhY2UoLz0rJC8sIFwiXCIpO1xuICAgIHZhciBsZW5ndGggPSBiYXNlNjRJZFRva2VuLmxlbmd0aDtcbiAgICBpZiAobGVuZ3RoICUgNCA9PT0gMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIHRva2VuIHRvIGJlIGRlY29kZWQgaXMgbm90IGNvcnJlY3RseSBlbmNvZGVkLlwiKTtcbiAgICB9XG4gICAgbGV0IGgxOiBudW1iZXIsIGgyOiBudW1iZXIsIGgzOiBudW1iZXIsIGg0OiBudW1iZXIsIGJpdHM6IG51bWJlciwgYzE6IG51bWJlciwgYzI6IG51bWJlciwgYzM6IG51bWJlciwgZGVjb2RlZCA9IFwiXCI7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gNCkge1xuICAgICAgLy9FdmVyeSA0IGJhc2U2NCBlbmNvZGVkIGNoYXJhY3RlciB3aWxsIGJlIGNvbnZlcnRlZCB0byAzIGJ5dGUgc3RyaW5nLCB3aGljaCBpcyAyNCBiaXRzXG4gICAgICAvLyB0aGVuIDYgYml0cyBwZXIgYmFzZTY0IGVuY29kZWQgY2hhcmFjdGVyXG4gICAgICBoMSA9IGNvZGVzLmluZGV4T2YoYmFzZTY0SWRUb2tlbi5jaGFyQXQoaSkpO1xuICAgICAgaDIgPSBjb2Rlcy5pbmRleE9mKGJhc2U2NElkVG9rZW4uY2hhckF0KGkgKyAxKSk7XG4gICAgICBoMyA9IGNvZGVzLmluZGV4T2YoYmFzZTY0SWRUb2tlbi5jaGFyQXQoaSArIDIpKTtcbiAgICAgIGg0ID0gY29kZXMuaW5kZXhPZihiYXNlNjRJZFRva2VuLmNoYXJBdChpICsgMykpO1xuICAgICAgLy8gRm9yIHBhZGRpbmcsIGlmIGxhc3QgdHdvIGFyZSBcIj1cIlxuICAgICAgaWYgKGkgKyAyID09PSBsZW5ndGggLSAxKSB7XG4gICAgICAgIGJpdHMgPSBoMSA8PCAxOCB8IGgyIDw8IDEyIHwgaDMgPDwgNjtcbiAgICAgICAgYzEgPSBiaXRzID4+IDE2ICYgMjU1O1xuICAgICAgICBjMiA9IGJpdHMgPj4gOCAmIDI1NTtcbiAgICAgICAgZGVjb2RlZCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGMxLCBjMik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgLy8gaWYgbGFzdCBvbmUgaXMgXCI9XCJcbiAgICAgIGVsc2UgaWYgKGkgKyAxID09PSBsZW5ndGggLSAxKSB7XG4gICAgICAgIGJpdHMgPSBoMSA8PCAxOCB8IGgyIDw8IDEyO1xuICAgICAgICBjMSA9IGJpdHMgPj4gMTYgJiAyNTU7XG4gICAgICAgIGRlY29kZWQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjMSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgYml0cyA9IGgxIDw8IDE4IHwgaDIgPDwgMTIgfCBoMyA8PCA2IHwgaDQ7XG4gICAgICAvLyB0aGVuIGNvbnZlcnQgdG8gMyBieXRlIGNoYXJzXG4gICAgICBjMSA9IGJpdHMgPj4gMTYgJiAyNTU7XG4gICAgICBjMiA9IGJpdHMgPj4gOCAmIDI1NTtcbiAgICAgIGMzID0gYml0cyAmIDI1NTtcbiAgICAgIGRlY29kZWQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjMSwgYzIsIGMzKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlY29kZWQ7XG4gIH1cblxuICAvKipcbiAgICogZGVzZXJpYWxpemUgYSBzdHJpbmdcbiAgICpcbiAgICogQHBhcmFtIHF1ZXJ5XG4gICAqL1xuICBzdGF0aWMgZGVzZXJpYWxpemUocXVlcnk6IHN0cmluZyk6IGFueSB7XG4gICAgbGV0IG1hdGNoOiBBcnJheTxzdHJpbmc+OyAvLyBSZWdleCBmb3IgcmVwbGFjaW5nIGFkZGl0aW9uIHN5bWJvbCB3aXRoIGEgc3BhY2VcbiAgICBjb25zdCBwbCA9IC9cXCsvZztcbiAgICBjb25zdCBzZWFyY2ggPSAvKFteJj1dKyk9KFteJl0qKS9nO1xuICAgIGNvbnN0IGRlY29kZSA9IChzOiBzdHJpbmcpID0+IGRlY29kZVVSSUNvbXBvbmVudChzLnJlcGxhY2UocGwsIFwiIFwiKSk7XG4gICAgY29uc3Qgb2JqOiB7fSA9IHt9O1xuICAgIG1hdGNoID0gc2VhcmNoLmV4ZWMocXVlcnkpO1xuICAgIHdoaWxlIChtYXRjaCkge1xuICAgICAgb2JqW2RlY29kZShtYXRjaFsxXSldID0gZGVjb2RlKG1hdGNoWzJdKTtcbiAgICAgIG1hdGNoID0gc2VhcmNoLmV4ZWMocXVlcnkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqO1xuICB9XG5cbiAgLy8jZW5kcmVnaW9uXG5cbiAgLy8jcmVnaW9uIFNjb3BlcyAoZXh0cmFjdCB0byBTY29wZXMudHMpXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHRoZXJlIGFyZSBkdXAgc2NvcGVzIGluIGEgZ2l2ZW4gcmVxdWVzdFxuICAgKlxuICAgKiBAcGFyYW0gY2FjaGVkU2NvcGVzXG4gICAqIEBwYXJhbSBzY29wZXNcbiAgICovXG4gIC8vIFRPRE86IFJlbmFtZSB0aGlzLCBpbnRlcnNlY3Rpbmcgc2NvcGVzIGlzbid0IGEgZ3JlYXQgbmFtZSBmb3IgZHVwbGljYXRlIGNoZWNrZXJcbiAgc3RhdGljIGlzSW50ZXJzZWN0aW5nU2NvcGVzKGNhY2hlZFNjb3BlczogQXJyYXk8c3RyaW5nPiwgc2NvcGVzOiBBcnJheTxzdHJpbmc+KTogYm9vbGVhbiB7XG4gICAgY2FjaGVkU2NvcGVzID0gdGhpcy5jb252ZXJ0VG9Mb3dlckNhc2UoY2FjaGVkU2NvcGVzKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNjb3Blcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoY2FjaGVkU2NvcGVzLmluZGV4T2Yoc2NvcGVzW2ldLnRvTG93ZXJDYXNlKCkpID4gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhIGdpdmVuIHNjb3BlIGlzIHByZXNlbnQgaW4gdGhlIHJlcXVlc3RcbiAgICpcbiAgICogQHBhcmFtIGNhY2hlZFNjb3Blc1xuICAgKiBAcGFyYW0gc2NvcGVzXG4gICAqL1xuICBzdGF0aWMgY29udGFpbnNTY29wZShjYWNoZWRTY29wZXM6IEFycmF5PHN0cmluZz4sIHNjb3BlczogQXJyYXk8c3RyaW5nPik6IGJvb2xlYW4ge1xuICAgIGNhY2hlZFNjb3BlcyA9IHRoaXMuY29udmVydFRvTG93ZXJDYXNlKGNhY2hlZFNjb3Blcyk7XG4gICAgcmV0dXJuIHNjb3Blcy5ldmVyeSgodmFsdWU6IGFueSk6IGJvb2xlYW4gPT4gY2FjaGVkU2NvcGVzLmluZGV4T2YodmFsdWUudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpKSA+PSAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiB0b0xvd2VyXG4gICAqXG4gICAqIEBwYXJhbSBzY29wZXNcbiAgICovXG4gIC8vIFRPRE86IFJlbmFtZSB0aGlzLCB0b28gZ2VuZXJpYyBuYW1lIGZvciBhIGZ1bmN0aW9uIHRoYXQgb25seSBkZWFscyB3aXRoIHNjb3Blc1xuICBzdGF0aWMgY29udmVydFRvTG93ZXJDYXNlKHNjb3BlczogQXJyYXk8c3RyaW5nPik6IEFycmF5PHN0cmluZz4ge1xuICAgIHJldHVybiBzY29wZXMubWFwKHNjb3BlID0+IHNjb3BlLnRvTG93ZXJDYXNlKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIHJlbW92ZSBvbmUgZWxlbWVudCBmcm9tIGEgc2NvcGUgYXJyYXlcbiAgICpcbiAgICogQHBhcmFtIHNjb3Blc1xuICAgKiBAcGFyYW0gc2NvcGVcbiAgICovXG4gIC8vIFRPRE86IFJlbmFtZSB0aGlzLCB0b28gZ2VuZXJpYyBuYW1lIGZvciBhIGZ1bmN0aW9uIHRoYXQgb25seSBkZWFscyB3aXRoIHNjb3Blc1xuICBzdGF0aWMgcmVtb3ZlRWxlbWVudChzY29wZXM6IEFycmF5PHN0cmluZz4sIHNjb3BlOiBzdHJpbmcpOiBBcnJheTxzdHJpbmc+IHtcbiAgICByZXR1cm4gc2NvcGVzLmZpbHRlcih2YWx1ZSA9PiB2YWx1ZSAhPT0gc2NvcGUpO1xuICB9XG5cbiAgLy8jZW5kcmVnaW9uXG5cbiAgLy8jcmVnaW9uIFVSTCBQcm9jZXNzaW5nIChFeHRyYWN0IHRvIFVybFByb2Nlc3NpbmcudHM/KVxuXG4gIHN0YXRpYyBnZXREZWZhdWx0UmVkaXJlY3RVcmkoKTogc3RyaW5nIHtcbiAgICAgIHJldHVybiB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdChcIj9cIilbMF0uc3BsaXQoXCIjXCIpWzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdpdmVuIGEgdXJsIGxpa2UgaHR0cHM6Ly9hOmIvY29tbW9uL2Q/ZT1mI2csIGFuZCBhIHRlbmFudElkLCByZXR1cm5zIGh0dHBzOi8vYTpiL3RlbmFudElkL2RcbiAgICogQHBhcmFtIGhyZWYgVGhlIHVybFxuICAgKiBAcGFyYW0gdGVuYW50SWQgVGhlIHRlbmFudCBpZCB0byByZXBsYWNlXG4gICAqL1xuICBzdGF0aWMgcmVwbGFjZVRlbmFudFBhdGgodXJsOiBzdHJpbmcsIHRlbmFudElkOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgaWYgKCF0ZW5hbnRJZCkge1xuICAgICAgICAgIHJldHVybiB1cmw7XG4gICAgICB9XG4gICAgICB2YXIgdXJsT2JqZWN0ID0gdGhpcy5HZXRVcmxDb21wb25lbnRzKHVybCk7XG4gICAgICB2YXIgcGF0aEFycmF5ID0gdXJsT2JqZWN0LlBhdGhTZWdtZW50cztcbiAgICAgIGlmIChwYXRoQXJyYXkubGVuZ3RoICE9PSAwICYmIChwYXRoQXJyYXlbMF0gPT09IENvbnN0YW50cy5jb21tb24gfHwgcGF0aEFycmF5WzBdID09PSBTU09UeXBlcy5PUkdBTklaQVRJT05TKSkge1xuICAgICAgICAgIHBhdGhBcnJheVswXSA9IHRlbmFudElkO1xuICAgICAgICAgIHVybCA9IHVybE9iamVjdC5Qcm90b2NvbCArIFwiLy9cIiArIHVybE9iamVjdC5Ib3N0TmFtZUFuZFBvcnQgKyBcIi9cIiArIHBhdGhBcnJheS5qb2luKFwiL1wiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB1cmw7XG4gIH1cblxuICAvKipcbiAgICogUGFyc2VzIG91dCB0aGUgY29tcG9uZW50cyBmcm9tIGEgdXJsIHN0cmluZy5cbiAgICogQHJldHVybnMgQW4gb2JqZWN0IHdpdGggdGhlIHZhcmlvdXMgY29tcG9uZW50cy4gUGxlYXNlIGNhY2hlIHRoaXMgdmFsdWUgaW5zdGVkIG9mIGNhbGxpbmcgdGhpcyBtdWx0aXBsZSB0aW1lcyBvbiB0aGUgc2FtZSB1cmwuXG4gICAqL1xuICBzdGF0aWMgR2V0VXJsQ29tcG9uZW50cyh1cmw6IHN0cmluZyk6IElVcmkge1xuICAgIGlmICghdXJsKSB7XG4gICAgICB0aHJvdyBcIlVybCByZXF1aXJlZFwiO1xuICAgIH1cblxuICAgIC8vIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL2N1cnRpc3ovMTExMzliMmNmY2FlZjRhMjYxZTBcbiAgICB2YXIgcmVnRXggPSBSZWdFeHAoXCJeKChbXjovPyNdKyk6KT8oLy8oW14vPyNdKikpPyhbXj8jXSopKFxcXFw/KFteI10qKSk/KCMoLiopKT9cIik7XG5cbiAgICB2YXIgbWF0Y2ggPSB1cmwubWF0Y2gocmVnRXgpO1xuXG4gICAgaWYgKCFtYXRjaCB8fCBtYXRjaC5sZW5ndGggPCA2KSB7XG4gICAgICB0aHJvdyBcIlZhbGlkIHVybCByZXF1aXJlZFwiO1xuICAgIH1cblxuICAgIGxldCB1cmxDb21wb25lbnRzID0gPElVcmk+e1xuICAgICAgUHJvdG9jb2w6IG1hdGNoWzFdLFxuICAgICAgSG9zdE5hbWVBbmRQb3J0OiBtYXRjaFs0XSxcbiAgICAgIEFic29sdXRlUGF0aDogbWF0Y2hbNV1cbiAgICB9O1xuXG4gICAgbGV0IHBhdGhTZWdtZW50cyA9IHVybENvbXBvbmVudHMuQWJzb2x1dGVQYXRoLnNwbGl0KFwiL1wiKTtcbiAgICBwYXRoU2VnbWVudHMgPSBwYXRoU2VnbWVudHMuZmlsdGVyKCh2YWwpID0+IHZhbCAmJiB2YWwubGVuZ3RoID4gMCk7IC8vIHJlbW92ZSBlbXB0eSBlbGVtZW50c1xuICAgIHVybENvbXBvbmVudHMuUGF0aFNlZ21lbnRzID0gcGF0aFNlZ21lbnRzO1xuICAgIHJldHVybiB1cmxDb21wb25lbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdpdmVuIGEgdXJsIG9yIHBhdGgsIGFwcGVuZCBhIHRyYWlsaW5nIHNsYXNoIGlmIG9uZSBkb2VzbnQgZXhpc3RcbiAgICpcbiAgICogQHBhcmFtIHVybFxuICAgKi9cbiAgc3RhdGljIENhbm9uaWNhbGl6ZVVyaSh1cmw6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKHVybCkge1xuICAgICAgdXJsID0gdXJsLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxuXG4gICAgaWYgKHVybCAmJiAhVXRpbHMuZW5kc1dpdGgodXJsLCBcIi9cIikpIHtcbiAgICAgIHVybCArPSBcIi9cIjtcbiAgICB9XG5cbiAgICByZXR1cm4gdXJsO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB0byBzZWUgaWYgdGhlIHVybCBlbmRzIHdpdGggdGhlIHN1ZmZpeFxuICAgKiBSZXF1aXJlZCBiZWNhdXNlIHdlIGFyZSBjb21waWxpbmcgZm9yIGVzNSBpbnN0ZWFkIG9mIGVzNlxuICAgKiBAcGFyYW0gdXJsXG4gICAqIEBwYXJhbSBzdHJcbiAgICovXG4gIC8vIFRPRE86IFJlbmFtZSB0aGlzLCBub3QgY2xlYXIgd2hhdCBpdCBpcyBzdXBwb3NlZCB0byBkb1xuICBzdGF0aWMgZW5kc1dpdGgodXJsOiBzdHJpbmcsIHN1ZmZpeDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKCF1cmwgfHwgIXN1ZmZpeCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB1cmwuaW5kZXhPZihzdWZmaXgsIHVybC5sZW5ndGggLSBzdWZmaXgubGVuZ3RoKSAhPT0gLTE7XG4gIH1cblxuICAvKipcbiAgICogVXRpbHMgZnVuY3Rpb24gdG8gcmVtb3ZlIHRoZSBsb2dpbl9oaW50IGFuZCBkb21haW5faGludCBmcm9tIHRoZSBpL3AgZXh0cmFRdWVyeVBhcmFtZXRlcnNcbiAgICogQHBhcmFtIHVybFxuICAgKiBAcGFyYW0gbmFtZVxuICAgKi9cbiAgc3RhdGljIHVybFJlbW92ZVF1ZXJ5U3RyaW5nUGFyYW1ldGVyKHVybDogc3RyaW5nLCBuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLmlzRW1wdHkodXJsKSkge1xuICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG5cbiAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKFwiKFxcXFwmXCIgKyBuYW1lICsgXCI9KVteXFwmXStcIik7XG4gICAgdXJsID0gdXJsLnJlcGxhY2UocmVnZXgsIFwiXCIpO1xuICAgIC8vIG5hbWU9dmFsdWUmXG4gICAgcmVnZXggPSBuZXcgUmVnRXhwKFwiKFwiICsgbmFtZSArIFwiPSlbXlxcJl0rJlwiKTtcbiAgICB1cmwgPSB1cmwucmVwbGFjZShyZWdleCwgXCJcIik7XG4gICAgLy8gbmFtZT12YWx1ZVxuICAgIHJlZ2V4ID0gbmV3IFJlZ0V4cChcIihcIiArIG5hbWUgKyBcIj0pW15cXCZdK1wiKTtcbiAgICB1cmwgPSB1cmwucmVwbGFjZShyZWdleCwgXCJcIik7XG4gICAgcmV0dXJuIHVybDtcbiAgfVxuXG4gIC8vI2VuZHJlZ2lvblxuXG4gIC8vI3JlZ2lvbiBFeHRyYVF1ZXJ5UGFyYW1ldGVycyBQcm9jZXNzaW5nIChFeHRyYWN0PylcblxuICAvKipcbiAgICogQ29uc3RydWN0cyBleHRyYVF1ZXJ5UGFyYW1ldGVycyB0byBiZSBzZW50IHRvIHRoZSBzZXJ2ZXIgZm9yIHRoZSBBdXRoZW50aWNhdGlvblBhcmFtZXRlcnMgc2V0IGJ5IHRoZSBkZXZlbG9wZXJcbiAgICogaW4gYW55IGxvZ2luKCkgb3IgYWNxdWlyZVRva2VuKCkgY2FsbHNcbiAgICogQHBhcmFtIGlkVG9rZW5PYmplY3RcbiAgICogQHBhcmFtIGV4dHJhUXVlcnlQYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBzaWRcbiAgICogQHBhcmFtIGxvZ2luSGludFxuICAgKi9cbiAgLy9UT0RPOiBjaGVjayBob3cgdGhpcyBiZWhhdmVzIHdoZW4gZG9tYWluX2hpbnQgb25seSBpcyBzZW50IGluIGV4dHJhcGFyYW1ldGVycyBhbmQgaWRUb2tlbiBoYXMgbm8gdXBuLlxuICBzdGF0aWMgY29uc3RydWN0VW5pZmllZENhY2hlUXVlcnlQYXJhbWV0ZXIocmVxdWVzdDogQXV0aGVudGljYXRpb25QYXJhbWV0ZXJzLCBpZFRva2VuT2JqZWN0OiBhbnkpOiBRUERpY3Qge1xuXG4gICAgLy8gcHJlZmVyZW5jZSBvcmRlcjogYWNjb3VudCA+IHNpZCA+IGxvZ2luX2hpbnRcbiAgICBsZXQgc3NvVHlwZTtcbiAgICBsZXQgc3NvRGF0YTtcbiAgICBsZXQgc3NvUGFyYW06IFFQRGljdCA9IHt9O1xuICAgIGxldCBzZXJ2ZXJSZXFQYXJhbTogUVBEaWN0ID0ge307XG4gICAgLy8gaWYgYWNjb3VudCBpbmZvIGlzIHBhc3NlZCwgYWNjb3VudC5zaWQgPiBhY2NvdW50LmxvZ2luX2hpbnRcbiAgICBpZiAocmVxdWVzdCkge1xuICAgICAgaWYgKHJlcXVlc3QuYWNjb3VudCkge1xuICAgICAgICBjb25zdCBhY2NvdW50OiBBY2NvdW50ID0gcmVxdWVzdC5hY2NvdW50O1xuICAgICAgICBpZiAoYWNjb3VudC5zaWQpIHtcbiAgICAgICAgICBzc29UeXBlID0gU1NPVHlwZXMuU0lEO1xuICAgICAgICAgIHNzb0RhdGEgPSBhY2NvdW50LnNpZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChhY2NvdW50LnVzZXJOYW1lKSB7XG4gICAgICAgICAgc3NvVHlwZSA9IFNTT1R5cGVzLkxPR0lOX0hJTlQ7XG4gICAgICAgICAgc3NvRGF0YSA9IGFjY291bnQudXNlck5hbWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIHNpZCBmcm9tIHJlcXVlc3RcbiAgICAgIGVsc2UgaWYgKHJlcXVlc3Quc2lkKSB7XG4gICAgICAgIHNzb1R5cGUgPSBTU09UeXBlcy5TSUQ7XG4gICAgICAgIHNzb0RhdGEgPSByZXF1ZXN0LnNpZDtcbiAgICAgIH1cbiAgICAgIC8vIGxvZ2luSGludCBmcm9tIHJlcXVlc3RcbiAgICAgIGVsc2UgaWYgKHJlcXVlc3QubG9naW5IaW50KSB7XG4gICAgICAgIHNzb1R5cGUgPSBTU09UeXBlcy5MT0dJTl9ISU5UO1xuICAgICAgICBzc29EYXRhID0gcmVxdWVzdC5sb2dpbkhpbnQ7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIGFkYWxJZFRva2VuIHJldHJpZXZlZCBmcm9tIGNhY2hlXG4gICAgZWxzZSBpZiAoaWRUb2tlbk9iamVjdCkge1xuICAgICAgaWYgKGlkVG9rZW5PYmplY3QuaGFzT3duUHJvcGVydHkoQ29uc3RhbnRzLnVwbikpIHtcbiAgICAgICAgc3NvVHlwZSA9IFNTT1R5cGVzLklEX1RPS0VOO1xuICAgICAgICBzc29EYXRhID0gaWRUb2tlbk9iamVjdC51cG47XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgc3NvVHlwZSA9IFNTT1R5cGVzLk9SR0FOSVpBVElPTlM7XG4gICAgICAgIHNzb0RhdGEgPSBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHNlcnZlclJlcVBhcmFtID0gdGhpcy5hZGRTU09QYXJhbWV0ZXIoc3NvVHlwZSwgc3NvRGF0YSwgc3NvUGFyYW0pO1xuXG4gICAgLy8gYWRkIHRoZSBIb21lQWNjb3VudElkZW50aWZpZXIgaW5mby8gZG9tYWluX2hpbnRcbiAgICBpZiAocmVxdWVzdCAmJiByZXF1ZXN0LmFjY291bnQgJiYgcmVxdWVzdC5hY2NvdW50LmhvbWVBY2NvdW50SWRlbnRpZmllcikge1xuICAgICAgICBzZXJ2ZXJSZXFQYXJhbSA9IHRoaXMuYWRkU1NPUGFyYW1ldGVyKFNTT1R5cGVzLkhPTUVBQ0NPVU5UX0lELCByZXF1ZXN0LmFjY291bnQuaG9tZUFjY291bnRJZGVudGlmaWVyLCBzc29QYXJhbSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlcnZlclJlcVBhcmFtO1xuICB9XG5cblxuICAvKipcbiAgICogQWRkIFNJRCB0byBleHRyYVF1ZXJ5UGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gc2lkXG4gICAqL1xuICAvLyBUT0RPOiBDYW4gb3B0aW1pemUgdGhpcyBsYXRlciwgbWFrZSBzc29QYXJhbSBvcHRpb25hbFxuICBzdGF0aWMgYWRkU1NPUGFyYW1ldGVyKHNzb1R5cGU6IHN0cmluZywgc3NvRGF0YTogc3RyaW5nLCBzc29QYXJhbTogUVBEaWN0KTogUVBEaWN0IHtcblxuICAgIHN3aXRjaCAoc3NvVHlwZSkge1xuICAgICAgY2FzZSBTU09UeXBlcy5TSUQ6IHtcbiAgICAgICAgc3NvUGFyYW1bU1NPVHlwZXMuU0lEXSA9IHNzb0RhdGE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBTU09UeXBlcy5JRF9UT0tFTjoge1xuICAgICAgICBzc29QYXJhbVtTU09UeXBlcy5MT0dJTl9ISU5UXSA9IHNzb0RhdGE7XG4gICAgICAgIHNzb1BhcmFtW1NTT1R5cGVzLkRPTUFJTl9ISU5UXSA9IFNTT1R5cGVzLk9SR0FOSVpBVElPTlM7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBTU09UeXBlcy5MT0dJTl9ISU5UOiB7XG4gICAgICAgIHNzb1BhcmFtW1NTT1R5cGVzLkxPR0lOX0hJTlRdID0gc3NvRGF0YTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFNTT1R5cGVzLk9SR0FOSVpBVElPTlM6IHtcbiAgICAgICAgc3NvUGFyYW1bU1NPVHlwZXMuRE9NQUlOX0hJTlRdID0gU1NPVHlwZXMuT1JHQU5JWkFUSU9OUztcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFNTT1R5cGVzLkNPTlNVTUVSUzoge1xuICAgICAgICBzc29QYXJhbVtTU09UeXBlcy5ET01BSU5fSElOVF0gPSBTU09UeXBlcy5DT05TVU1FUlM7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBTU09UeXBlcy5IT01FQUNDT1VOVF9JRDoge1xuICAgICAgICBsZXQgaG9tZUFjY291bnRJZCA9IHNzb0RhdGEuc3BsaXQoXCIuXCIpO1xuICAgICAgICBjb25zdCB1aWQgPSBVdGlscy5iYXNlNjREZWNvZGVTdHJpbmdVcmxTYWZlKGhvbWVBY2NvdW50SWRbMF0pO1xuICAgICAgICBjb25zdCB1dGlkID0gVXRpbHMuYmFzZTY0RGVjb2RlU3RyaW5nVXJsU2FmZShob21lQWNjb3VudElkWzFdKTtcblxuICAgICAgICAvLyBUT0RPOiBkb21haW5fcmVxIGFuZCBsb2dpbl9yZXEgYXJlIG5vdCBuZWVkZWQgYWNjb3JkaW5nIHRvIGVTVFMgdGVhbVxuICAgICAgICBzc29QYXJhbVtTU09UeXBlcy5MT0dJTl9SRVFdID0gdWlkO1xuICAgICAgICBzc29QYXJhbVtTU09UeXBlcy5ET01BSU5fUkVRXSA9IHV0aWQ7XG5cbiAgICAgICAgaWYgKHV0aWQgPT09IENvbnN0YW50cy5jb25zdW1lcnNVdGlkKSB7XG4gICAgICAgICAgICBzc29QYXJhbVtTU09UeXBlcy5ET01BSU5fSElOVF0gPSBTU09UeXBlcy5DT05TVU1FUlM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzc29QYXJhbVtTU09UeXBlcy5ET01BSU5fSElOVF0gPSBTU09UeXBlcy5PUkdBTklaQVRJT05TO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBTU09UeXBlcy5MT0dJTl9SRVE6IHtcbiAgICAgICAgc3NvUGFyYW1bU1NPVHlwZXMuTE9HSU5fUkVRXSA9IHNzb0RhdGE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBTU09UeXBlcy5ET01BSU5fUkVROiB7XG4gICAgICAgIHNzb1BhcmFtW1NTT1R5cGVzLkRPTUFJTl9SRVFdID0gc3NvRGF0YTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNzb1BhcmFtO1xuICB9XG5cbiAgLyoqXG4gICAqIFV0aWxpdHkgdG8gZ2VuZXJhdGUgYSBRdWVyeVBhcmFtZXRlclN0cmluZyBmcm9tIGEgS2V5LVZhbHVlIG1hcHBpbmcgb2YgZXh0cmFRdWVyeVBhcmFtZXRlcnMgcGFzc2VkXG4gICAqIEBwYXJhbSBleHRyYVF1ZXJ5UGFyYW1ldGVyc1xuICAgKi9cbiAgc3RhdGljIGdlbmVyYXRlUXVlcnlQYXJhbWV0ZXJzU3RyaW5nKHF1ZXJ5UGFyYW1ldGVyczogUVBEaWN0KTogc3RyaW5nIHtcbiAgICBsZXQgcGFyYW1zU3RyaW5nOiBzdHJpbmcgPSBudWxsO1xuXG4gICAgaWYgKHF1ZXJ5UGFyYW1ldGVycykge1xuICAgICAgT2JqZWN0LmtleXMocXVlcnlQYXJhbWV0ZXJzKS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgICBpZiAocGFyYW1zU3RyaW5nID09IG51bGwpIHtcbiAgICAgICAgICBwYXJhbXNTdHJpbmcgPSBgJHtrZXl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5UGFyYW1ldGVyc1trZXldKX1gO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHBhcmFtc1N0cmluZyArPSBgJiR7a2V5fT0ke2VuY29kZVVSSUNvbXBvbmVudChxdWVyeVBhcmFtZXRlcnNba2V5XSl9YDtcbiAgICAgICAgfVxuICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFyYW1zU3RyaW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIHRvIHNlZSBpZiB0aGVyZSBhcmUgU1NPIHBhcmFtcyBzZXQgaW4gdGhlIFJlcXVlc3RcbiAgICogQHBhcmFtIHJlcXVlc3RcbiAgICovXG4gIHN0YXRpYyBpc1NTT1BhcmFtKHJlcXVlc3Q6IEF1dGhlbnRpY2F0aW9uUGFyYW1ldGVycykge1xuICAgICAgcmV0dXJuIHJlcXVlc3QgJiYgKHJlcXVlc3QuYWNjb3VudCB8fCByZXF1ZXN0LnNpZCB8fCByZXF1ZXN0LmxvZ2luSGludCk7XG4gIH1cblxuICAvLyNlbmRyZWdpb25cblxuICAvLyNyZWdpb24gUmVzcG9uc2UgSGVscGVyc1xuXG4gIHN0YXRpYyBzZXRSZXNwb25zZUlkVG9rZW4ob3JpZ2luYWxSZXNwb25zZTogQXV0aFJlc3BvbnNlLCBpZFRva2VuOiBJZFRva2VuKSA6IEF1dGhSZXNwb25zZSB7XG4gICAgdmFyIHJlc3BvbnNlID0geyAuLi5vcmlnaW5hbFJlc3BvbnNlIH07XG4gICAgcmVzcG9uc2UuaWRUb2tlbiA9IGlkVG9rZW47XG4gICAgaWYgKHJlc3BvbnNlLmlkVG9rZW4ub2JqZWN0SWQpIHtcbiAgICAgIHJlc3BvbnNlLnVuaXF1ZUlkID0gcmVzcG9uc2UuaWRUb2tlbi5vYmplY3RJZDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzcG9uc2UudW5pcXVlSWQgPSByZXNwb25zZS5pZFRva2VuLnN1YmplY3Q7XG4gICAgfVxuICAgIHJlc3BvbnNlLnRlbmFudElkID0gcmVzcG9uc2UuaWRUb2tlbi50ZW5hbnRJZDtcbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH1cblxuICAvLyNlbmRyZWdpb25cblxufVxuIiwiLyohICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbkNvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcclxudGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcclxuTGljZW5zZSBhdCBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcclxuXHJcblRISVMgQ09ERSBJUyBQUk9WSURFRCBPTiBBTiAqQVMgSVMqIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcclxuS0lORCwgRUlUSEVSIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIFdJVEhPVVQgTElNSVRBVElPTiBBTlkgSU1QTElFRFxyXG5XQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgVElUTEUsIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLFxyXG5NRVJDSEFOVEFCTElUWSBPUiBOT04tSU5GUklOR0VNRU5ULlxyXG5cclxuU2VlIHRoZSBBcGFjaGUgVmVyc2lvbiAyLjAgTGljZW5zZSBmb3Igc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zXHJcbmFuZCBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cclxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi9cclxuLyogZ2xvYmFsIFJlZmxlY3QsIFByb21pc2UgKi9cclxuXHJcbnZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24oZCwgYikge1xyXG4gICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxyXG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcclxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcclxuICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZXh0ZW5kcyhkLCBiKSB7XHJcbiAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19hc3NpZ24gPSBmdW5jdGlvbigpIHtcclxuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiBfX2Fzc2lnbih0KSB7XHJcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSkgdFtwXSA9IHNbcF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3Jlc3QocywgZSkge1xyXG4gICAgdmFyIHQgPSB7fTtcclxuICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSAmJiBlLmluZGV4T2YocCkgPCAwKVxyXG4gICAgICAgIHRbcF0gPSBzW3BdO1xyXG4gICAgaWYgKHMgIT0gbnVsbCAmJiB0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBwID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzKTsgaSA8IHAubGVuZ3RoOyBpKyspIGlmIChlLmluZGV4T2YocFtpXSkgPCAwKVxyXG4gICAgICAgICAgICB0W3BbaV1dID0gc1twW2ldXTtcclxuICAgIHJldHVybiB0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xyXG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XHJcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xyXG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcGFyYW0ocGFyYW1JbmRleCwgZGVjb3JhdG9yKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fbWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpIHtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0ZXIodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XHJcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHJlc3VsdC52YWx1ZSk7IH0pLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cclxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZ2VuZXJhdG9yKHRoaXNBcmcsIGJvZHkpIHtcclxuICAgIHZhciBfID0geyBsYWJlbDogMCwgc2VudDogZnVuY3Rpb24oKSB7IGlmICh0WzBdICYgMSkgdGhyb3cgdFsxXTsgcmV0dXJuIHRbMV07IH0sIHRyeXM6IFtdLCBvcHM6IFtdIH0sIGYsIHksIHQsIGc7XHJcbiAgICByZXR1cm4gZyA9IHsgbmV4dDogdmVyYigwKSwgXCJ0aHJvd1wiOiB2ZXJiKDEpLCBcInJldHVyblwiOiB2ZXJiKDIpIH0sIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiAoZ1tTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KSwgZztcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHN0ZXAoW24sIHZdKTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc3RlcChvcCkge1xyXG4gICAgICAgIGlmIChmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiR2VuZXJhdG9yIGlzIGFscmVhZHkgZXhlY3V0aW5nLlwiKTtcclxuICAgICAgICB3aGlsZSAoXykgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKGYgPSAxLCB5ICYmICh0ID0gb3BbMF0gJiAyID8geVtcInJldHVyblwiXSA6IG9wWzBdID8geVtcInRocm93XCJdIHx8ICgodCA9IHlbXCJyZXR1cm5cIl0pICYmIHQuY2FsbCh5KSwgMCkgOiB5Lm5leHQpICYmICEodCA9IHQuY2FsbCh5LCBvcFsxXSkpLmRvbmUpIHJldHVybiB0O1xyXG4gICAgICAgICAgICBpZiAoeSA9IDAsIHQpIG9wID0gW29wWzBdICYgMiwgdC52YWx1ZV07XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3BbMF0pIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgMDogY2FzZSAxOiB0ID0gb3A7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA0OiBfLmxhYmVsKys7IHJldHVybiB7IHZhbHVlOiBvcFsxXSwgZG9uZTogZmFsc2UgfTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNTogXy5sYWJlbCsrOyB5ID0gb3BbMV07IG9wID0gWzBdOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNzogb3AgPSBfLm9wcy5wb3AoKTsgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodCA9IF8udHJ5cywgdCA9IHQubGVuZ3RoID4gMCAmJiB0W3QubGVuZ3RoIC0gMV0pICYmIChvcFswXSA9PT0gNiB8fCBvcFswXSA9PT0gMikpIHsgXyA9IDA7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSAzICYmICghdCB8fCAob3BbMV0gPiB0WzBdICYmIG9wWzFdIDwgdFszXSkpKSB7IF8ubGFiZWwgPSBvcFsxXTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDYgJiYgXy5sYWJlbCA8IHRbMV0pIHsgXy5sYWJlbCA9IHRbMV07IHQgPSBvcDsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodCAmJiBfLmxhYmVsIDwgdFsyXSkgeyBfLmxhYmVsID0gdFsyXTsgXy5vcHMucHVzaChvcCk7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRbMl0pIF8ub3BzLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb3AgPSBib2R5LmNhbGwodGhpc0FyZywgXyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkgeyBvcCA9IFs2LCBlXTsgeSA9IDA7IH0gZmluYWxseSB7IGYgPSB0ID0gMDsgfVxyXG4gICAgICAgIGlmIChvcFswXSAmIDUpIHRocm93IG9wWzFdOyByZXR1cm4geyB2YWx1ZTogb3BbMF0gPyBvcFsxXSA6IHZvaWQgMCwgZG9uZTogdHJ1ZSB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHBvcnRTdGFyKG0sIGV4cG9ydHMpIHtcclxuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKCFleHBvcnRzLmhhc093blByb3BlcnR5KHApKSBleHBvcnRzW3BdID0gbVtwXTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fdmFsdWVzKG8pIHtcclxuICAgIHZhciBtID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9bU3ltYm9sLml0ZXJhdG9yXSwgaSA9IDA7XHJcbiAgICBpZiAobSkgcmV0dXJuIG0uY2FsbChvKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgbmV4dDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAobyAmJiBpID49IG8ubGVuZ3RoKSBvID0gdm9pZCAwO1xyXG4gICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogbyAmJiBvW2krK10sIGRvbmU6ICFvIH07XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcmVhZChvLCBuKSB7XHJcbiAgICB2YXIgbSA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvW1N5bWJvbC5pdGVyYXRvcl07XHJcbiAgICBpZiAoIW0pIHJldHVybiBvO1xyXG4gICAgdmFyIGkgPSBtLmNhbGwobyksIHIsIGFyID0gW10sIGU7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHdoaWxlICgobiA9PT0gdm9pZCAwIHx8IG4tLSA+IDApICYmICEociA9IGkubmV4dCgpKS5kb25lKSBhci5wdXNoKHIudmFsdWUpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGVycm9yKSB7IGUgPSB7IGVycm9yOiBlcnJvciB9OyB9XHJcbiAgICBmaW5hbGx5IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAociAmJiAhci5kb25lICYmIChtID0gaVtcInJldHVyblwiXSkpIG0uY2FsbChpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZmluYWxseSB7IGlmIChlKSB0aHJvdyBlLmVycm9yOyB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZCgpIHtcclxuICAgIGZvciAodmFyIGFyID0gW10sIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIGFyID0gYXIuY29uY2F0KF9fcmVhZChhcmd1bWVudHNbaV0pKTtcclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXQodikge1xyXG4gICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBfX2F3YWl0ID8gKHRoaXMudiA9IHYsIHRoaXMpIDogbmV3IF9fYXdhaXQodik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jR2VuZXJhdG9yKHRoaXNBcmcsIF9hcmd1bWVudHMsIGdlbmVyYXRvcikge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBnID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pLCBpLCBxID0gW107XHJcbiAgICByZXR1cm4gaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaWYgKGdbbl0pIGlbbl0gPSBmdW5jdGlvbiAodikgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKGEsIGIpIHsgcS5wdXNoKFtuLCB2LCBhLCBiXSkgPiAxIHx8IHJlc3VtZShuLCB2KTsgfSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHJlc3VtZShuLCB2KSB7IHRyeSB7IHN0ZXAoZ1tuXSh2KSk7IH0gY2F0Y2ggKGUpIHsgc2V0dGxlKHFbMF1bM10sIGUpOyB9IH1cclxuICAgIGZ1bmN0aW9uIHN0ZXAocikgeyByLnZhbHVlIGluc3RhbmNlb2YgX19hd2FpdCA/IFByb21pc2UucmVzb2x2ZShyLnZhbHVlLnYpLnRoZW4oZnVsZmlsbCwgcmVqZWN0KSA6IHNldHRsZShxWzBdWzJdLCByKTsgfVxyXG4gICAgZnVuY3Rpb24gZnVsZmlsbCh2YWx1ZSkgeyByZXN1bWUoXCJuZXh0XCIsIHZhbHVlKTsgfVxyXG4gICAgZnVuY3Rpb24gcmVqZWN0KHZhbHVlKSB7IHJlc3VtZShcInRocm93XCIsIHZhbHVlKTsgfVxyXG4gICAgZnVuY3Rpb24gc2V0dGxlKGYsIHYpIHsgaWYgKGYodiksIHEuc2hpZnQoKSwgcS5sZW5ndGgpIHJlc3VtZShxWzBdWzBdLCBxWzBdWzFdKTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hc3luY0RlbGVnYXRvcihvKSB7XHJcbiAgICB2YXIgaSwgcDtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiwgZnVuY3Rpb24gKGUpIHsgdGhyb3cgZTsgfSksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4sIGYpIHsgaVtuXSA9IG9bbl0gPyBmdW5jdGlvbiAodikgeyByZXR1cm4gKHAgPSAhcCkgPyB7IHZhbHVlOiBfX2F3YWl0KG9bbl0odikpLCBkb25lOiBuID09PSBcInJldHVyblwiIH0gOiBmID8gZih2KSA6IHY7IH0gOiBmOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jVmFsdWVzKG8pIHtcclxuICAgIGlmICghU3ltYm9sLmFzeW5jSXRlcmF0b3IpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTeW1ib2wuYXN5bmNJdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbiAgICB2YXIgbSA9IG9bU3ltYm9sLmFzeW5jSXRlcmF0b3JdLCBpO1xyXG4gICAgcmV0dXJuIG0gPyBtLmNhbGwobykgOiAobyA9IHR5cGVvZiBfX3ZhbHVlcyA9PT0gXCJmdW5jdGlvblwiID8gX192YWx1ZXMobykgOiBvW1N5bWJvbC5pdGVyYXRvcl0oKSwgaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGkpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IGlbbl0gPSBvW25dICYmIGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7IHYgPSBvW25dKHYpLCBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCB2LmRvbmUsIHYudmFsdWUpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc2V0dGxlKHJlc29sdmUsIHJlamVjdCwgZCwgdikgeyBQcm9taXNlLnJlc29sdmUodikudGhlbihmdW5jdGlvbih2KSB7IHJlc29sdmUoeyB2YWx1ZTogdiwgZG9uZTogZCB9KTsgfSwgcmVqZWN0KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19tYWtlVGVtcGxhdGVPYmplY3QoY29va2VkLCByYXcpIHtcclxuICAgIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydHkpIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNvb2tlZCwgXCJyYXdcIiwgeyB2YWx1ZTogcmF3IH0pOyB9IGVsc2UgeyBjb29rZWQucmF3ID0gcmF3OyB9XHJcbiAgICByZXR1cm4gY29va2VkO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0U3Rhcihtb2QpIHtcclxuICAgIGlmIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpIHJldHVybiBtb2Q7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZiAobW9kICE9IG51bGwpIGZvciAodmFyIGsgaW4gbW9kKSBpZiAoT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwobW9kLCBrKSkgcmVzdWx0W2tdID0gbW9kW2tdO1xyXG4gICAgcmVzdWx0LmRlZmF1bHQgPSBtb2Q7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19pbXBvcnREZWZhdWx0KG1vZCkge1xyXG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBkZWZhdWx0OiBtb2QgfTtcclxufVxyXG4iLCIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cblxuLyoqXG4gKiBAaGlkZGVuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb25zdGFudHMge1xuICBzdGF0aWMgZ2V0IGVycm9yRGVzY3JpcHRpb24oKTogc3RyaW5nIHsgcmV0dXJuIFwiZXJyb3JfZGVzY3JpcHRpb25cIjsgfVxuICBzdGF0aWMgZ2V0IGVycm9yKCk6IHN0cmluZyB7IHJldHVybiBcImVycm9yXCI7IH1cblxuICBzdGF0aWMgZ2V0IHNjb3BlKCk6IHN0cmluZyB7IHJldHVybiBcInNjb3BlXCI7IH1cbiAgc3RhdGljIGdldCBjbGllbnRJbmZvKCk6IHN0cmluZyB7IHJldHVybiBcImNsaWVudF9pbmZvXCI7IH1cbiAgc3RhdGljIGdldCBjbGllbnRJZCgpOiBzdHJpbmcgeyByZXR1cm4gXCJjbGllbnRJZFwiOyB9XG5cbiAgc3RhdGljIGdldCBpZFRva2VuKCk6IHN0cmluZyB7IHJldHVybiBcImlkX3Rva2VuXCI7IH1cbiAgc3RhdGljIGdldCBhZGFsSWRUb2tlbigpOiBzdHJpbmcgeyByZXR1cm4gXCJhZGFsLmlkdG9rZW5cIjsgfVxuICBzdGF0aWMgZ2V0IGFjY2Vzc1Rva2VuKCk6IHN0cmluZyB7IHJldHVybiBcImFjY2Vzc190b2tlblwiOyB9XG4gIHN0YXRpYyBnZXQgZXhwaXJlc0luKCk6IHN0cmluZyB7IHJldHVybiBcImV4cGlyZXNfaW5cIjsgfVxuICBzdGF0aWMgZ2V0IHNlc3Npb25TdGF0ZSgpOiBzdHJpbmcgeyByZXR1cm4gXCJzZXNzaW9uX3N0YXRlXCI7IH1cblxuICBzdGF0aWMgZ2V0IG1zYWxDbGllbnRJbmZvKCk6IHN0cmluZyB7IHJldHVybiBcIm1zYWwuY2xpZW50LmluZm9cIjsgfVxuICBzdGF0aWMgZ2V0IG1zYWxFcnJvcigpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLmVycm9yXCI7IH1cbiAgc3RhdGljIGdldCBtc2FsRXJyb3JEZXNjcmlwdGlvbigpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLmVycm9yLmRlc2NyaXB0aW9uXCI7IH1cblxuICBzdGF0aWMgZ2V0IG1zYWxTZXNzaW9uU3RhdGUoKTogc3RyaW5nIHsgcmV0dXJuIFwibXNhbC5zZXNzaW9uLnN0YXRlXCI7IH1cbiAgc3RhdGljIGdldCB0b2tlbktleXMoKTogc3RyaW5nIHsgcmV0dXJuIFwibXNhbC50b2tlbi5rZXlzXCI7IH1cbiAgc3RhdGljIGdldCBhY2Nlc3NUb2tlbktleSgpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLmFjY2Vzcy50b2tlbi5rZXlcIjsgfVxuICBzdGF0aWMgZ2V0IGV4cGlyYXRpb25LZXkoKTogc3RyaW5nIHsgcmV0dXJuIFwibXNhbC5leHBpcmF0aW9uLmtleVwiOyB9XG4gIHN0YXRpYyBnZXQgc3RhdGVMb2dpbigpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLnN0YXRlLmxvZ2luXCI7IH1cbiAgc3RhdGljIGdldCBzdGF0ZUFjcXVpcmVUb2tlbigpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLnN0YXRlLmFjcXVpcmVUb2tlblwiOyB9XG4gIHN0YXRpYyBnZXQgc3RhdGVSZW5ldygpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLnN0YXRlLnJlbmV3XCI7IH1cbiAgc3RhdGljIGdldCBub25jZUlkVG9rZW4oKTogc3RyaW5nIHsgcmV0dXJuIFwibXNhbC5ub25jZS5pZHRva2VuXCI7IH1cbiAgc3RhdGljIGdldCB1c2VyTmFtZSgpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLnVzZXJuYW1lXCI7IH1cbiAgc3RhdGljIGdldCBpZFRva2VuS2V5KCk6IHN0cmluZyB7IHJldHVybiBcIm1zYWwuaWR0b2tlblwiOyB9XG4gIHN0YXRpYyBnZXQgbG9naW5SZXF1ZXN0KCk6IHN0cmluZyB7IHJldHVybiBcIm1zYWwubG9naW4ucmVxdWVzdFwiOyB9XG4gIHN0YXRpYyBnZXQgbG9naW5FcnJvcigpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLmxvZ2luLmVycm9yXCI7IH1cbiAgc3RhdGljIGdldCByZW5ld1N0YXR1cygpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLnRva2VuLnJlbmV3LnN0YXR1c1wiOyB9XG4gIHN0YXRpYyBnZXQgdXJsSGFzaCgpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLnVybEhhc2hcIjsgfVxuICBzdGF0aWMgZ2V0IGFuZ3VsYXJMb2dpblJlcXVlc3QoKTogc3RyaW5nIHsgcmV0dXJuIFwibXNhbC5hbmd1bGFyLmxvZ2luLnJlcXVlc3RcIjsgfVxuICBzdGF0aWMgZ2V0IG1zYWwoKTogc3RyaW5nIHsgcmV0dXJuIFwibXNhbFwiOyB9XG5cbiAgc3RhdGljIGdldCBub19hY2NvdW50KCk6IHN0cmluZyB7IHJldHVybiBcIk5PX0FDQ09VTlRcIjsgfVxuICBzdGF0aWMgZ2V0IGNvbnN1bWVyc1V0aWQoKTogc3RyaW5nIHsgcmV0dXJuIFwiOTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFkXCI7IH1cbiAgc3RhdGljIGdldCB1cG4oKTogc3RyaW5nIHsgcmV0dXJuIFwidXBuXCI7IH1cblxuICBzdGF0aWMgZ2V0IHByb21wdF9zZWxlY3RfYWNjb3VudCgpOiBzdHJpbmcgeyByZXR1cm4gXCImcHJvbXB0PXNlbGVjdF9hY2NvdW50XCI7IH1cbiAgc3RhdGljIGdldCBwcm9tcHRfbm9uZSgpOiBzdHJpbmcgeyByZXR1cm4gXCImcHJvbXB0PW5vbmVcIjsgfVxuICBzdGF0aWMgZ2V0IHByb21wdCgpOiBzdHJpbmcgeyByZXR1cm4gXCJwcm9tcHRcIjsgfVxuXG4gIHN0YXRpYyBnZXQgcmVzcG9uc2VfbW9kZV9mcmFnbWVudCgpOiBzdHJpbmcgeyByZXR1cm4gXCImcmVzcG9uc2VfbW9kZT1mcmFnbWVudFwiOyB9XG4gIHN0YXRpYyBnZXQgcmVzb3VyY2VEZWxpbWl0ZXIoKTogc3RyaW5nIHsgcmV0dXJuIFwifFwiOyB9XG5cbiAgc3RhdGljIGdldCB0b2tlblJlbmV3U3RhdHVzQ2FuY2VsbGVkKCk6IHN0cmluZyB7IHJldHVybiBcIkNhbmNlbGVkXCI7IH1cbiAgc3RhdGljIGdldCB0b2tlblJlbmV3U3RhdHVzQ29tcGxldGVkKCk6IHN0cmluZyB7IHJldHVybiBcIkNvbXBsZXRlZFwiOyB9XG4gIHN0YXRpYyBnZXQgdG9rZW5SZW5ld1N0YXR1c0luUHJvZ3Jlc3MoKTogc3RyaW5nIHsgcmV0dXJuIFwiSW4gUHJvZ3Jlc3NcIjsgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9wb3BVcFdpZHRoOiBudW1iZXIgPSA0ODM7XG4gIHN0YXRpYyBnZXQgcG9wVXBXaWR0aCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fcG9wVXBXaWR0aDsgfVxuICBzdGF0aWMgc2V0IHBvcFVwV2lkdGgod2lkdGg6IG51bWJlcikge1xuICAgIHRoaXMuX3BvcFVwV2lkdGggPSB3aWR0aDtcbiAgfVxuICBwcml2YXRlIHN0YXRpYyBfcG9wVXBIZWlnaHQ6IG51bWJlciA9IDYwMDtcbiAgc3RhdGljIGdldCBwb3BVcEhlaWdodCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fcG9wVXBIZWlnaHQ7IH1cbiAgc3RhdGljIHNldCBwb3BVcEhlaWdodChoZWlnaHQ6IG51bWJlcikge1xuICAgIHRoaXMuX3BvcFVwSGVpZ2h0ID0gaGVpZ2h0O1xuICB9XG5cbiAgc3RhdGljIGdldCBsb2dpbigpOiBzdHJpbmcgeyByZXR1cm4gXCJMT0dJTlwiOyB9XG4gIHN0YXRpYyBnZXQgcmVuZXdUb2tlbigpOiBzdHJpbmcgeyByZXR1cm4gXCJSRU5FV19UT0tFTlwiOyB9XG4gIHN0YXRpYyBnZXQgdW5rbm93bigpOiBzdHJpbmcgeyByZXR1cm4gXCJVTktOT1dOXCI7IH1cblxuICBzdGF0aWMgZ2V0IGhvbWVBY2NvdW50SWRlbnRpZmllcigpOiBzdHJpbmcgeyByZXR1cm4gXCJob21lQWNjb3VudElkZW50aWZpZXJcIjsgfVxuXG4gIHN0YXRpYyBnZXQgY29tbW9uKCk6IHN0cmluZyB7IHJldHVybiBcImNvbW1vblwiOyB9XG4gIHN0YXRpYyBnZXQgb3BlbmlkU2NvcGUoKTogc3RyaW5nIHsgcmV0dXJuIFwib3BlbmlkXCI7IH1cbiAgc3RhdGljIGdldCBwcm9maWxlU2NvcGUoKTogc3RyaW5nIHsgcmV0dXJuIFwicHJvZmlsZVwiOyB9XG5cbiAgc3RhdGljIGdldCBjYWNoZUxvY2F0aW9uTG9jYWwoKTogc3RyaW5nIHsgcmV0dXJuIFwibG9jYWxTdG9yYWdlXCI7IH1cbiAgc3RhdGljIGdldCBjYWNoZUxvY2F0aW9uU2Vzc2lvbigpOiBzdHJpbmcgeyByZXR1cm4gXCJzZXNzaW9uU3RvcmFnZVwiOyB9XG5cblxufVxuXG4vKipcbiAqIEBoaWRkZW5cbiAqL1xuZXhwb3J0IGNsYXNzIEVycm9yQ29kZXMge1xuICBzdGF0aWMgZ2V0IGxvZ2luUHJvZ3Jlc3NFcnJvcigpOiBzdHJpbmcgeyByZXR1cm4gXCJsb2dpbl9wcm9ncmVzc19lcnJvclwiOyB9XG4gIHN0YXRpYyBnZXQgYWNxdWlyZVRva2VuUHJvZ3Jlc3NFcnJvcigpOiBzdHJpbmcgeyByZXR1cm4gXCJhY3F1aXJldG9rZW5fcHJvZ3Jlc3NfZXJyb3JcIjsgfVxuICBzdGF0aWMgZ2V0IGlucHV0U2NvcGVzRXJyb3IoKTogc3RyaW5nIHsgcmV0dXJuIFwiaW5wdXRfc2NvcGVzX2Vycm9yXCI7IH1cbiAgc3RhdGljIGdldCBlbmRwb2ludFJlc29sdXRpb25FcnJvcigpOiBzdHJpbmcgeyByZXR1cm4gXCJlbmRwb2ludHNfcmVzb2x1dGlvbl9lcnJvclwiOyB9XG4gIHN0YXRpYyBnZXQgcG9wVXBXaW5kb3dFcnJvcigpOiBzdHJpbmcgeyByZXR1cm4gXCJwb3B1cF93aW5kb3dfZXJyb3JcIjsgfVxuICBzdGF0aWMgZ2V0IHVzZXJMb2dpbkVycm9yKCk6IHN0cmluZyB7IHJldHVybiBcInVzZXJfbG9naW5fZXJyb3JcIjsgfVxuICBzdGF0aWMgZ2V0IHVzZXJDYW5jZWxsZWRFcnJvcigpOiBzdHJpbmcgeyByZXR1cm4gXCJ1c2VyX2NhbmNlbGxlZFwiOyB9XG59XG5cbi8qKlxuICogQGhpZGRlblxuICovXG5leHBvcnQgY2xhc3MgRXJyb3JEZXNjcmlwdGlvbiB7XG4gIHN0YXRpYyBnZXQgbG9naW5Qcm9ncmVzc0Vycm9yKCk6IHN0cmluZyB7IHJldHVybiBcIkxvZ2luIGlzIGluIHByb2dyZXNzXCI7IH1cbiAgc3RhdGljIGdldCBhY3F1aXJlVG9rZW5Qcm9ncmVzc0Vycm9yKCk6IHN0cmluZyB7IHJldHVybiBcIkFjcXVpcmUgdG9rZW4gaXMgaW4gcHJvZ3Jlc3NcIjsgfVxuICBzdGF0aWMgZ2V0IGlucHV0U2NvcGVzRXJyb3IoKTogc3RyaW5nIHsgcmV0dXJuIFwiSW52YWxpZCB2YWx1ZSBvZiBpbnB1dCBzY29wZXMgcHJvdmlkZWRcIjsgfVxuICBzdGF0aWMgZ2V0IGVuZHBvaW50UmVzb2x1dGlvbkVycm9yKCk6IHN0cmluZyB7IHJldHVybiBcIkVuZHBvaW50cyBjYW5ub3QgYmUgcmVzb2x2ZWRcIjsgfVxuICBzdGF0aWMgZ2V0IHBvcFVwV2luZG93RXJyb3IoKTogc3RyaW5nIHsgcmV0dXJuIFwiRXJyb3Igb3BlbmluZyBwb3B1cCB3aW5kb3cuIFRoaXMgY2FuIGhhcHBlbiBpZiB5b3UgYXJlIHVzaW5nIElFIG9yIGlmIHBvcHVwcyBhcmUgYmxvY2tlZCBpbiB0aGUgYnJvd3Nlci5cIjsgfVxuICBzdGF0aWMgZ2V0IHVzZXJMb2dpbkVycm9yKCk6IHN0cmluZyB7IHJldHVybiBcIlVzZXIgbG9naW4gaXMgcmVxdWlyZWRcIjsgfVxuICBzdGF0aWMgZ2V0IHVzZXJDYW5jZWxsZWRFcnJvcigpOiBzdHJpbmcgeyByZXR1cm4gXCJVc2VyIGNsb3NlZCB0aGUgcG9wdXAgd2luZG93IGFuZCBjYW5jZWxsZWQgdGhlIGZsb3dcIjsgfVxufVxuXG4vKipcbiAqIEBoaWRkZW5cbiAqL1xuZXhwb3J0IGNvbnN0IENhY2hlS2V5cyA9IHtcbiAgICBBVVRIT1JJVFk6IFwibXNhbF9hdXRob3JpdHlcIixcbiAgICBBQ1FVSVJFX1RPS0VOX1VTRVI6IFwibXNhbC5hY3F1aXJlVG9rZW5Vc2VyXCJcbn07XG5cbi8qKlxuICogQGhpZGRlblxuICovXG5leHBvcnQgY29uc3QgU1NPVHlwZXMgPSB7XG4gICAgQUNDT1VOVDogXCJhY2NvdW50XCIsXG4gICAgU0lEOiBcInNpZFwiLFxuICAgIExPR0lOX0hJTlQ6IFwibG9naW5faGludFwiLFxuICAgIElEX1RPS0VOOiBcImlkX3Rva2VuXCIsXG4gICAgRE9NQUlOX0hJTlQ6IFwiZG9tYWluX2hpbnRcIixcbiAgICBPUkdBTklaQVRJT05TOiBcIm9yZ2FuaXphdGlvbnNcIixcbiAgICBDT05TVU1FUlM6IFwiY29uc3VtZXJzXCIsXG4gICAgQUNDT1VOVF9JRDogXCJhY2NvdW50SWRlbnRpZmllclwiLFxuICAgIEhPTUVBQ0NPVU5UX0lEOiBcImhvbWVBY2NvdW50SWRlbnRpZmllclwiLFxuICAgIExPR0lOX1JFUTogXCJsb2dpbl9yZXFcIixcbiAgICBET01BSU5fUkVROiBcImRvbWFpbl9yZXFcIlxufTtcblxuLyoqXG4gKiB3ZSBjb25zaWRlcmVkIG1ha2luZyB0aGlzIFwiZW51bVwiIGluIHRoZSByZXF1ZXN0IGluc3RlYWQgb2Ygc3RyaW5nLCBob3dldmVyIGl0IGxvb2tzIGxpa2UgdGhlIGFsbG93ZWQgbGlzdCBvZlxuICogcHJvbXB0IHZhbHVlcyBrZXB0IGNoYW5naW5nIG92ZXIgcGFzdCBjb3VwbGUgb2YgeWVhcnMuIFRoZXJlIGFyZSBzb21lIHVuZG9jdW1lbnRlZCBwcm9tcHQgdmFsdWVzIGZvciBzb21lXG4gKiBpbnRlcm5hbCBwYXJ0bmVycyB0b28sIGhlbmNlIHRoZSBjaG9pY2Ugb2YgZ2VuZXJpYyBcInN0cmluZ1wiIHR5cGUgaW5zdGVhZCBvZiB0aGUgXCJlbnVtXCJcbiAqIEBoaWRkZW5cbiAqL1xuZXhwb3J0IGNvbnN0IFByb21wdFN0YXRlID0ge1xuXHRMT0dJTjogXCJsb2dpblwiLFxuXHRTRUxFQ1RfQUNDT1VOVDogXCJzZWxlY3RfYWNjb3VudFwiLFxuXHRDT05TRU5UOiBcImNvbnNlbnRcIixcblx0Tk9ORTogXCJub25lXCIsXG59O1xuXG5leHBvcnQgY29uc3QgTGlicmFyeSA9IHtcbiAgdmVyc2lvbjogXCIxLjAuMC1wcmV2aWV3LjFcIlxufTtcbiIsIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuXG5pbXBvcnQgeyBDb25zdGFudHMgfSBmcm9tIFwiLi4vQ29uc3RhbnRzXCI7XG5pbXBvcnQgeyBDbGllbnRBdXRoRXJyb3IgfSBmcm9tIFwiLi9DbGllbnRBdXRoRXJyb3JcIjtcblxuZXhwb3J0IGNvbnN0IENsaWVudENvbmZpZ3VyYXRpb25FcnJvck1lc3NhZ2UgPSB7XG4gICAgaW52YWxpZENhY2hlTG9jYXRpb246IHtcbiAgICAgICAgY29kZTogXCJpbnZhbGlkX2NhY2hlX2xvY2F0aW9uXCIsXG4gICAgICAgIGRlc2M6IFwiVGhlIGNhY2hlIGNvbnRhaW5zIG11bHRpcGxlIHRva2VucyBzYXRpc2Z5aW5nIHRoZSByZXF1aXJlbWVudHMuIFwiICtcbiAgICAgICAgICAgIFwiQ2FsbCBBY3F1aXJlVG9rZW4gYWdhaW4gcHJvdmlkaW5nIG1vcmUgcmVxdWlyZW1lbnRzIGxpa2UgYXV0aG9yaXR5LlwiXG4gICAgfSxcbiAgICBub1JlZGlyZWN0Q2FsbGJhY2tzU2V0OiB7XG4gICAgICAgIGNvZGU6IFwibm9fcmVkaXJlY3RfY2FsbGJhY2tzXCIsXG4gICAgICAgIGRlc2M6IFwiTm8gcmVkaXJlY3QgY2FsbGJhY2tzIGhhdmUgYmVlbiBzZXQuIFBsZWFzZSBjYWxsIHNldFJlZGlyZWN0Q2FsbGJhY2tzKCkgd2l0aCB0aGUgYXBwcm9wcmlhdGUgZnVuY3Rpb24gYXJndW1lbnRzIGJlZm9yZSBjb250aW51aW5nLiBcIiArXG4gICAgICAgICAgICBcIk1vcmUgaW5mb3JtYXRpb24gaXMgYXZhaWxhYmxlIGhlcmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9BenVyZUFEL21pY3Jvc29mdC1hdXRoZW50aWNhdGlvbi1saWJyYXJ5LWZvci1qcy93aWtpLy1iYXNpY3MuXCJcbiAgICB9LFxuICAgIGludmFsaWRDYWxsYmFja09iamVjdDoge1xuICAgICAgICBjb2RlOiBcImludmFsaWRfY2FsbGJhY2tfb2JqZWN0XCIsXG4gICAgICAgIGRlc2M6IFwiVGhlIG9iamVjdCBwYXNzZWQgZm9yIHRoZSBjYWxsYmFjayB3YXMgaW52YWxpZC4gXCIgK1xuICAgICAgICAgIFwiTW9yZSBpbmZvcm1hdGlvbiBpcyBhdmFpbGFibGUgaGVyZTogaHR0cHM6Ly9naXRodWIuY29tL0F6dXJlQUQvbWljcm9zb2Z0LWF1dGhlbnRpY2F0aW9uLWxpYnJhcnktZm9yLWpzL3dpa2kvLWJhc2ljcy5cIlxuICAgIH0sXG4gICAgc2NvcGVzUmVxdWlyZWQ6IHtcbiAgICAgICAgY29kZTogXCJzY29wZXNfcmVxdWlyZWRcIixcbiAgICAgICAgZGVzYzogXCJTY29wZXMgYXJlIHJlcXVpcmVkIHRvIG9idGFpbiBhbiBhY2Nlc3MgdG9rZW4uXCJcbiAgICB9LFxuICAgIGVtcHR5U2NvcGVzOiB7XG4gICAgICAgIGNvZGU6IFwiZW1wdHlfaW5wdXRfc2NvcGVzX2Vycm9yXCIsXG4gICAgICAgIGRlc2M6IFwiU2NvcGVzIGNhbm5vdCBiZSBwYXNzZWQgYXMgZW1wdHkgYXJyYXkuXCJcbiAgICB9LFxuICAgIG5vbkFycmF5U2NvcGVzOiB7XG4gICAgICAgIGNvZGU6IFwibm9uYXJyYXlfaW5wdXRfc2NvcGVzX2Vycm9yXCIsXG4gICAgICAgIGRlc2M6IFwiU2NvcGVzIGNhbm5vdCBiZSBwYXNzZWQgYXMgbm9uLWFycmF5LlwiXG4gICAgfSxcbiAgICBjbGllbnRTY29wZToge1xuICAgICAgICBjb2RlOiBcImNsaWVudGlkX2lucHV0X3Njb3Blc19lcnJvclwiLFxuICAgICAgICBkZXNjOiBcIkNsaWVudCBJRCBjYW4gb25seSBiZSBwcm92aWRlZCBhcyBhIHNpbmdsZSBzY29wZS5cIlxuICAgIH0sXG4gICAgaW52YWxpZFByb21wdDoge1xuICAgICAgICBjb2RlOiBcImludmFsaWRfcHJvbXB0X3ZhbHVlXCIsXG4gICAgICAgIGRlc2M6IFwiU3VwcG9ydGVkIHByb21wdCB2YWx1ZXMgYXJlICdsb2dpbicsICdzZWxlY3RfYWNjb3VudCcsICdjb25zZW50JyBhbmQgJ25vbmUnXCIsXG4gICAgfSxcbiAgICBpbnZhbGlkQXV0aG9yaXR5VHlwZToge1xuICAgICAgICBjb2RlOiBcImludmFsaWRfYXV0aG9yaXR5X3R5cGVcIixcbiAgICAgICAgZGVzYzogXCJUaGUgZ2l2ZW4gYXV0aG9yaXR5IGlzIG5vdCBhIHZhbGlkIHR5cGUgb2YgYXV0aG9yaXR5IHN1cHBvcnRlZCBieSBNU0FMLiBQbGVhc2Ugc2VlIGhlcmUgZm9yIHZhbGlkIGF1dGhvcml0aWVzOiA8aW5zZXJ0IFVSTCBoZXJlPi5cIlxuICAgIH0sXG4gICAgYXV0aG9yaXR5VXJpSW5zZWN1cmU6IHtcbiAgICAgICAgY29kZTogXCJhdXRob3JpdHlfdXJpX2luc2VjdXJlXCIsXG4gICAgICAgIGRlc2M6IFwiQXV0aG9yaXR5IFVSSXMgbXVzdCB1c2UgaHR0cHMuXCJcbiAgICB9LFxuICAgIGF1dGhvcml0eVVyaUludmFsaWRQYXRoOiB7XG4gICAgICAgIGNvZGU6IFwiYXV0aG9yaXR5X3VyaV9pbnZhbGlkX3BhdGhcIixcbiAgICAgICAgZGVzYzogXCJHaXZlbiBhdXRob3JpdHkgVVJJIGlzIGludmFsaWQuXCJcbiAgICB9LFxuICAgIHVuc3VwcG9ydGVkQXV0aG9yaXR5VmFsaWRhdGlvbjoge1xuICAgICAgICBjb2RlOiBcInVuc3VwcG9ydGVkX2F1dGhvcml0eV92YWxpZGF0aW9uXCIsXG4gICAgICAgIGRlc2M6IFwiVGhlIGF1dGhvcml0eSB2YWxpZGF0aW9uIGlzIG5vdCBzdXBwb3J0ZWQgZm9yIHRoaXMgYXV0aG9yaXR5IHR5cGUuXCJcbiAgICB9LFxuICAgIGIyY0F1dGhvcml0eVVyaUludmFsaWRQYXRoOiB7XG4gICAgICAgIGNvZGU6IFwiYjJjX2F1dGhvcml0eV91cmlfaW52YWxpZF9wYXRoXCIsXG4gICAgICAgIGRlc2M6IFwiVGhlIGdpdmVuIFVSSSBmb3IgdGhlIEIyQyBhdXRob3JpdHkgaXMgaW52YWxpZC5cIlxuICAgIH0sXG59O1xuXG4vKipcbiAqIEVycm9yIHRocm93biB3aGVuIHRoZXJlIGlzIGFuIGVycm9yIGluIGNvbmZpZ3VyYXRpb24gb2YgdGhlIC5qcyBsaWJyYXJ5LlxuICovXG5leHBvcnQgY2xhc3MgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yIGV4dGVuZHMgQ2xpZW50QXV0aEVycm9yIHtcblxuICAgIGNvbnN0cnVjdG9yKGVycm9yQ29kZTogc3RyaW5nLCBlcnJvck1lc3NhZ2U/OiBzdHJpbmcpIHtcbiAgICAgICAgc3VwZXIoZXJyb3JDb2RlLCBlcnJvck1lc3NhZ2UpO1xuICAgICAgICB0aGlzLm5hbWUgPSBcIkNsaWVudENvbmZpZ3VyYXRpb25FcnJvclwiO1xuICAgICAgICBPYmplY3Quc2V0UHJvdG90eXBlT2YodGhpcywgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yLnByb3RvdHlwZSk7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZUludmFsaWRDYWNoZUxvY2F0aW9uQ29uZmlnRXJyb3IoZ2l2ZW5DYWNoZUxvY2F0aW9uOiBzdHJpbmcpOiBDbGllbnRDb25maWd1cmF0aW9uRXJyb3Ige1xuICAgICAgICByZXR1cm4gbmV3IENsaWVudENvbmZpZ3VyYXRpb25FcnJvcihDbGllbnRDb25maWd1cmF0aW9uRXJyb3JNZXNzYWdlLmludmFsaWRDYWNoZUxvY2F0aW9uLmNvZGUsXG4gICAgICAgICAgICBgJHtDbGllbnRDb25maWd1cmF0aW9uRXJyb3JNZXNzYWdlLmludmFsaWRDYWNoZUxvY2F0aW9uLmRlc2N9IFByb3ZpZGVkIHZhbHVlOiAke2dpdmVuQ2FjaGVMb2NhdGlvbn0uIFBvc3NpYmxlIHZhbHVlcyBhcmU6ICR7Q29uc3RhbnRzLmNhY2hlTG9jYXRpb25Mb2NhbH0sICR7Q29uc3RhbnRzLmNhY2hlTG9jYXRpb25TZXNzaW9ufS5gKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlUmVkaXJlY3RDYWxsYmFja3NOb3RTZXRFcnJvcigpOiBDbGllbnRDb25maWd1cmF0aW9uRXJyb3Ige1xuICAgICAgICByZXR1cm4gbmV3IENsaWVudENvbmZpZ3VyYXRpb25FcnJvcihDbGllbnRDb25maWd1cmF0aW9uRXJyb3JNZXNzYWdlLm5vUmVkaXJlY3RDYWxsYmFja3NTZXQuY29kZSwgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yTWVzc2FnZS5ub1JlZGlyZWN0Q2FsbGJhY2tzU2V0LmRlc2MpO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVJbnZhbGlkQ2FsbGJhY2tPYmplY3RFcnJvcihjYWxsYmFja1R5cGU6IHN0cmluZywgY2FsbGJhY2tPYmplY3Q6IG9iamVjdCk6IENsaWVudENvbmZpZ3VyYXRpb25FcnJvciB7XG4gICAgICAgIHJldHVybiBuZXcgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yKENsaWVudENvbmZpZ3VyYXRpb25FcnJvck1lc3NhZ2UuaW52YWxpZENhbGxiYWNrT2JqZWN0LmNvZGUsXG4gICAgICAgICAgICBgJHtDbGllbnRDb25maWd1cmF0aW9uRXJyb3JNZXNzYWdlLmludmFsaWRDYWxsYmFja09iamVjdC5kZXNjfSBHaXZlbiB2YWx1ZSBmb3IgJHtjYWxsYmFja1R5cGV9IGNhbGxiYWNrIGZ1bmN0aW9uOiAke2NhbGxiYWNrT2JqZWN0fWApO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVFbXB0eVNjb3Blc0FycmF5RXJyb3Ioc2NvcGVzVmFsdWU6IHN0cmluZyk6IENsaWVudENvbmZpZ3VyYXRpb25FcnJvciB7XG4gICAgICAgIHJldHVybiBuZXcgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yKENsaWVudENvbmZpZ3VyYXRpb25FcnJvck1lc3NhZ2UuZW1wdHlTY29wZXMuY29kZSxcbiAgICAgICAgICAgIGAke0NsaWVudENvbmZpZ3VyYXRpb25FcnJvck1lc3NhZ2UuZW1wdHlTY29wZXMuZGVzY30gR2l2ZW4gdmFsdWU6ICR7c2NvcGVzVmFsdWV9LmApO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVTY29wZXNOb25BcnJheUVycm9yKHNjb3Blc1ZhbHVlOiBzdHJpbmcpOiBDbGllbnRDb25maWd1cmF0aW9uRXJyb3Ige1xuICAgICAgICByZXR1cm4gbmV3IENsaWVudENvbmZpZ3VyYXRpb25FcnJvcihDbGllbnRDb25maWd1cmF0aW9uRXJyb3JNZXNzYWdlLm5vbkFycmF5U2NvcGVzLmNvZGUsXG4gICAgICAgICAgICBgJHtDbGllbnRDb25maWd1cmF0aW9uRXJyb3JNZXNzYWdlLm5vbkFycmF5U2NvcGVzLmRlc2N9IEdpdmVuIHZhbHVlOiAke3Njb3Blc1ZhbHVlfS5gKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlQ2xpZW50SWRTaW5nbGVTY29wZUVycm9yKHNjb3Blc1ZhbHVlOiBzdHJpbmcpOiBDbGllbnRDb25maWd1cmF0aW9uRXJyb3Ige1xuICAgICAgICByZXR1cm4gbmV3IENsaWVudENvbmZpZ3VyYXRpb25FcnJvcihDbGllbnRDb25maWd1cmF0aW9uRXJyb3JNZXNzYWdlLmNsaWVudFNjb3BlLmNvZGUsXG4gICAgICAgICAgICBgJHtDbGllbnRDb25maWd1cmF0aW9uRXJyb3JNZXNzYWdlLmNsaWVudFNjb3BlLmRlc2N9IEdpdmVuIHZhbHVlOiAke3Njb3Blc1ZhbHVlfS5gKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlU2NvcGVzUmVxdWlyZWRFcnJvcihzY29wZXNWYWx1ZTogYW55KTogQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnRDb25maWd1cmF0aW9uRXJyb3IoQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yTWVzc2FnZS5zY29wZXNSZXF1aXJlZC5jb2RlLFxuICAgICAgICAgICAgYCR7Q2xpZW50Q29uZmlndXJhdGlvbkVycm9yTWVzc2FnZS5zY29wZXNSZXF1aXJlZC5kZXNjfSBHaXZlbiB2YWx1ZTogJHtzY29wZXNWYWx1ZX1gKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlSW52YWxpZFByb21wdEVycm9yKHByb21wdFZhbHVlOiBhbnkpOiBDbGllbnRDb25maWd1cmF0aW9uRXJyb3Ige1xuICAgICAgICByZXR1cm4gbmV3IENsaWVudENvbmZpZ3VyYXRpb25FcnJvcihDbGllbnRDb25maWd1cmF0aW9uRXJyb3JNZXNzYWdlLmludmFsaWRQcm9tcHQuY29kZSxcbiAgICAgICAgICAgIGAke0NsaWVudENvbmZpZ3VyYXRpb25FcnJvck1lc3NhZ2UuaW52YWxpZFByb21wdC5kZXNjfSBHaXZlbiB2YWx1ZTogJHtwcm9tcHRWYWx1ZX1gKTtcbiAgICB9XG59XG4iLCIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cblxuaW1wb3J0IHsgSVVyaSB9IGZyb20gXCIuL0lVcmlcIjtcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSBcIi4vVXRpbHNcIjtcbmltcG9ydCB7IElUZW5hbnREaXNjb3ZlcnlSZXNwb25zZSB9IGZyb20gXCIuL0lUZW5hbnREaXNjb3ZlcnlSZXNwb25zZVwiO1xuaW1wb3J0IHsgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yTWVzc2FnZSB9IGZyb20gXCIuL2Vycm9yL0NsaWVudENvbmZpZ3VyYXRpb25FcnJvclwiO1xuaW1wb3J0IHsgWGhyQ2xpZW50IH0gZnJvbSBcIi4vWEhSQ2xpZW50XCI7XG5cbi8qKlxuICogQGhpZGRlblxuICovXG5leHBvcnQgZW51bSBBdXRob3JpdHlUeXBlIHtcbiAgQWFkLFxuICBBZGZzLFxuICBCMkNcbn1cblxuLyoqXG4gKiBAaGlkZGVuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBBdXRob3JpdHkge1xuICBjb25zdHJ1Y3RvcihhdXRob3JpdHk6IHN0cmluZywgdmFsaWRhdGVBdXRob3JpdHk6IGJvb2xlYW4pIHtcbiAgICB0aGlzLklzVmFsaWRhdGlvbkVuYWJsZWQgPSB2YWxpZGF0ZUF1dGhvcml0eTtcbiAgICB0aGlzLkNhbm9uaWNhbEF1dGhvcml0eSA9IGF1dGhvcml0eTtcblxuICAgIHRoaXMudmFsaWRhdGVBc1VyaSgpO1xuICB9XG5cbiAgcHVibGljIGFic3RyYWN0IGdldCBBdXRob3JpdHlUeXBlKCk6IEF1dGhvcml0eVR5cGU7XG5cbiAgcHVibGljIElzVmFsaWRhdGlvbkVuYWJsZWQ6IGJvb2xlYW47XG5cbiAgcHVibGljIGdldCBUZW5hbnQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5DYW5vbmljYWxBdXRob3JpdHlVcmxDb21wb25lbnRzLlBhdGhTZWdtZW50c1swXTtcbiAgfVxuXG4gIHByaXZhdGUgdGVuYW50RGlzY292ZXJ5UmVzcG9uc2U6IElUZW5hbnREaXNjb3ZlcnlSZXNwb25zZTtcblxuICBwdWJsaWMgZ2V0IEF1dGhvcml6YXRpb25FbmRwb2ludCgpOiBzdHJpbmcge1xuICAgIHRoaXMudmFsaWRhdGVSZXNvbHZlZCgpO1xuICAgIHJldHVybiB0aGlzLnRlbmFudERpc2NvdmVyeVJlc3BvbnNlLkF1dGhvcml6YXRpb25FbmRwb2ludC5yZXBsYWNlKFwie3RlbmFudH1cIiwgdGhpcy5UZW5hbnQpO1xuICB9XG5cbiAgcHVibGljIGdldCBFbmRTZXNzaW9uRW5kcG9pbnQoKTogc3RyaW5nIHtcbiAgICB0aGlzLnZhbGlkYXRlUmVzb2x2ZWQoKTtcbiAgICByZXR1cm4gdGhpcy50ZW5hbnREaXNjb3ZlcnlSZXNwb25zZS5FbmRTZXNzaW9uRW5kcG9pbnQucmVwbGFjZShcInt0ZW5hbnR9XCIsIHRoaXMuVGVuYW50KTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgU2VsZlNpZ25lZEp3dEF1ZGllbmNlKCk6IHN0cmluZyB7XG4gICAgdGhpcy52YWxpZGF0ZVJlc29sdmVkKCk7XG4gICAgcmV0dXJuIHRoaXMudGVuYW50RGlzY292ZXJ5UmVzcG9uc2UuSXNzdWVyLnJlcGxhY2UoXCJ7dGVuYW50fVwiLCB0aGlzLlRlbmFudCk7XG4gIH1cblxuICBwcml2YXRlIHZhbGlkYXRlUmVzb2x2ZWQoKSB7XG4gICAgaWYgKCF0aGlzLnRlbmFudERpc2NvdmVyeVJlc3BvbnNlKSB7XG4gICAgICB0aHJvdyBcIlBsZWFzZSBjYWxsIFJlc29sdmVFbmRwb2ludHNBc3luYyBmaXJzdFwiO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBIFVSTCB0aGF0IGlzIHRoZSBhdXRob3JpdHkgc2V0IGJ5IHRoZSBkZXZlbG9wZXJcbiAgICovXG4gIHB1YmxpYyBnZXQgQ2Fub25pY2FsQXV0aG9yaXR5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuY2Fub25pY2FsQXV0aG9yaXR5O1xuICB9XG5cbiAgcHVibGljIHNldCBDYW5vbmljYWxBdXRob3JpdHkodXJsOiBzdHJpbmcpIHtcbiAgICB0aGlzLmNhbm9uaWNhbEF1dGhvcml0eSA9IFV0aWxzLkNhbm9uaWNhbGl6ZVVyaSh1cmwpO1xuICAgIHRoaXMuY2Fub25pY2FsQXV0aG9yaXR5VXJsQ29tcG9uZW50cyA9IG51bGw7XG4gIH1cblxuICBwcml2YXRlIGNhbm9uaWNhbEF1dGhvcml0eTogc3RyaW5nO1xuICBwcml2YXRlIGNhbm9uaWNhbEF1dGhvcml0eVVybENvbXBvbmVudHM6IElVcmk7XG5cbiAgcHVibGljIGdldCBDYW5vbmljYWxBdXRob3JpdHlVcmxDb21wb25lbnRzKCk6IElVcmkge1xuICAgIGlmICghdGhpcy5jYW5vbmljYWxBdXRob3JpdHlVcmxDb21wb25lbnRzKSB7XG4gICAgICB0aGlzLmNhbm9uaWNhbEF1dGhvcml0eVVybENvbXBvbmVudHMgPSBVdGlscy5HZXRVcmxDb21wb25lbnRzKHRoaXMuQ2Fub25pY2FsQXV0aG9yaXR5KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5jYW5vbmljYWxBdXRob3JpdHlVcmxDb21wb25lbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIC8vIGh0dHA6Ly9vcGVuaWQubmV0L3NwZWNzL29wZW5pZC1jb25uZWN0LWRpc2NvdmVyeS0xXzAuaHRtbCNQcm92aWRlck1ldGFkYXRhXG4gICAqL1xuICBwcm90ZWN0ZWQgZ2V0IERlZmF1bHRPcGVuSWRDb25maWd1cmF0aW9uRW5kcG9pbnQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7dGhpcy5DYW5vbmljYWxBdXRob3JpdHl9djIuMC8ud2VsbC1rbm93bi9vcGVuaWQtY29uZmlndXJhdGlvbmA7XG4gIH1cblxuICAvKipcbiAgICogR2l2ZW4gYSBzdHJpbmcsIHZhbGlkYXRlIHRoYXQgaXQgaXMgb2YgdGhlIGZvcm0gaHR0cHM6Ly9kb21haW4vcGF0aFxuICAgKi9cbiAgcHJpdmF0ZSB2YWxpZGF0ZUFzVXJpKCkge1xuICAgIGxldCBjb21wb25lbnRzO1xuICAgIHRyeSB7XG4gICAgICBjb21wb25lbnRzID0gdGhpcy5DYW5vbmljYWxBdXRob3JpdHlVcmxDb21wb25lbnRzO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRocm93IENsaWVudENvbmZpZ3VyYXRpb25FcnJvck1lc3NhZ2UuaW52YWxpZEF1dGhvcml0eVR5cGU7XG4gICAgfVxuXG4gICAgaWYgKCFjb21wb25lbnRzLlByb3RvY29sIHx8IGNvbXBvbmVudHMuUHJvdG9jb2wudG9Mb3dlckNhc2UoKSAhPT0gXCJodHRwczpcIikge1xuICAgICAgdGhyb3cgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yTWVzc2FnZS5hdXRob3JpdHlVcmlJbnNlY3VyZTtcbiAgICB9XG5cbiAgICBpZiAoIWNvbXBvbmVudHMuUGF0aFNlZ21lbnRzIHx8IGNvbXBvbmVudHMuUGF0aFNlZ21lbnRzLmxlbmd0aCA8IDEpIHtcbiAgICAgIHRocm93IENsaWVudENvbmZpZ3VyYXRpb25FcnJvck1lc3NhZ2UuYXV0aG9yaXR5VXJpSW52YWxpZFBhdGg7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxzIHRoZSBPSURDIGVuZHBvaW50IGFuZCByZXR1cm5zIHRoZSByZXNwb25zZVxuICAgKi9cbiAgcHJpdmF0ZSBEaXNjb3ZlckVuZHBvaW50cyhvcGVuSWRDb25maWd1cmF0aW9uRW5kcG9pbnQ6IHN0cmluZyk6IFByb21pc2U8SVRlbmFudERpc2NvdmVyeVJlc3BvbnNlPiB7XG4gICAgY29uc3QgY2xpZW50ID0gbmV3IFhockNsaWVudCgpO1xuICAgIHJldHVybiBjbGllbnQuc2VuZFJlcXVlc3RBc3luYyhvcGVuSWRDb25maWd1cmF0aW9uRW5kcG9pbnQsIFwiR0VUXCIsIC8qZW5hYmxlQ2FjaGluZzogKi8gdHJ1ZSlcbiAgICAgICAgLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiA8SVRlbmFudERpc2NvdmVyeVJlc3BvbnNlPntcbiAgICAgICAgICAgICAgICBBdXRob3JpemF0aW9uRW5kcG9pbnQ6IHJlc3BvbnNlLmF1dGhvcml6YXRpb25fZW5kcG9pbnQsXG4gICAgICAgICAgICAgICAgRW5kU2Vzc2lvbkVuZHBvaW50OiByZXNwb25zZS5lbmRfc2Vzc2lvbl9lbmRwb2ludCxcbiAgICAgICAgICAgICAgICBJc3N1ZXI6IHJlc3BvbnNlLmlzc3VlclxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHByb21pc2UuXG4gICAqIENoZWNrcyB0byBzZWUgaWYgdGhlIGF1dGhvcml0eSBpcyBpbiB0aGUgY2FjaGVcbiAgICogRGlzY292ZXIgZW5kcG9pbnRzIHZpYSBvcGVuaWQtY29uZmlndXJhdGlvblxuICAgKiBJZiBzdWNjZXNzZnVsLCBjYWNoZXMgdGhlIGVuZHBvaW50IGZvciBsYXRlciB1c2UgaW4gT0lEQ1xuICAgKi9cbiAgcHVibGljIHJlc29sdmVFbmRwb2ludHNBc3luYygpOiBQcm9taXNlPEF1dGhvcml0eT4ge1xuICAgIGxldCBvcGVuSWRDb25maWd1cmF0aW9uRW5kcG9pbnQgPSBcIlwiO1xuICAgIHJldHVybiB0aGlzLkdldE9wZW5JZENvbmZpZ3VyYXRpb25FbmRwb2ludEFzeW5jKCkudGhlbihvcGVuSWRDb25maWd1cmF0aW9uRW5kcG9pbnRSZXNwb25zZSA9PiB7XG4gICAgICBvcGVuSWRDb25maWd1cmF0aW9uRW5kcG9pbnQgPSBvcGVuSWRDb25maWd1cmF0aW9uRW5kcG9pbnRSZXNwb25zZTtcbiAgICAgIHJldHVybiB0aGlzLkRpc2NvdmVyRW5kcG9pbnRzKG9wZW5JZENvbmZpZ3VyYXRpb25FbmRwb2ludCk7XG4gICAgfSkudGhlbigodGVuYW50RGlzY292ZXJ5UmVzcG9uc2U6IElUZW5hbnREaXNjb3ZlcnlSZXNwb25zZSkgPT4ge1xuICAgICAgdGhpcy50ZW5hbnREaXNjb3ZlcnlSZXNwb25zZSA9IHRlbmFudERpc2NvdmVyeVJlc3BvbnNlO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHByb21pc2Ugd2l0aCB0aGUgVGVuYW50RGlzY292ZXJ5RW5kcG9pbnRcbiAgICovXG4gIHB1YmxpYyBhYnN0cmFjdCBHZXRPcGVuSWRDb25maWd1cmF0aW9uRW5kcG9pbnRBc3luYygpOiBQcm9taXNlPHN0cmluZz47XG59XG4iLCIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cblxuZXhwb3J0IGNvbnN0IEF1dGhFcnJvck1lc3NhZ2UgPSB7XG4gICAgdW5leHBlY3RlZEVycm9yOiB7XG4gICAgICAgIGNvZGU6IFwidW5leHBlY3RlZF9lcnJvclwiLFxuICAgICAgICBkZXNjOiBcIlVuZXhwZWN0ZWQgZXJyb3IgaW4gYXV0aGVudGljYXRpb24uXCJcbiAgICB9XG59O1xuXG4vKipcbiogR2VuZXJhbCBlcnJvciBjbGFzcyB0aHJvd24gYnkgdGhlIE1TQUwuanMgbGlicmFyeS5cbiovXG5leHBvcnQgY2xhc3MgQXV0aEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuXG4gICAgZXJyb3JDb2RlOiBzdHJpbmc7XG4gICAgZXJyb3JNZXNzYWdlOiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcihlcnJvckNvZGU6IHN0cmluZywgZXJyb3JNZXNzYWdlPzogc3RyaW5nKSB7XG4gICAgICAgIHN1cGVyKGVycm9yTWVzc2FnZSk7XG4gICAgICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZih0aGlzLCBBdXRoRXJyb3IucHJvdG90eXBlKTtcblxuICAgICAgICB0aGlzLmVycm9yQ29kZSA9IGVycm9yQ29kZTtcbiAgICAgICAgdGhpcy5lcnJvck1lc3NhZ2UgPSBlcnJvck1lc3NhZ2U7XG4gICAgICAgIHRoaXMubmFtZSA9IFwiQXV0aEVycm9yXCI7XG4gICAgfVxuXG5cbiAgICBzdGF0aWMgY3JlYXRlVW5leHBlY3RlZEVycm9yKGVyckRlc2M6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gbmV3IEF1dGhFcnJvcihBdXRoRXJyb3JNZXNzYWdlLnVuZXhwZWN0ZWRFcnJvci5jb2RlLCBgJHtBdXRoRXJyb3JNZXNzYWdlLnVuZXhwZWN0ZWRFcnJvci5kZXNjfTogJHtlcnJEZXNjfWApO1xuICAgIH1cbn1cbiIsIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuXG5pbXBvcnQgeyBBdXRoRXJyb3IgfSBmcm9tIFwiLi9BdXRoRXJyb3JcIjtcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSBcIi4uL1V0aWxzXCI7XG5pbXBvcnQgeyBJZFRva2VuIH0gZnJvbSBcIi4uL0lkVG9rZW5cIjtcblxuZXhwb3J0IGNvbnN0IENsaWVudEF1dGhFcnJvck1lc3NhZ2UgPSB7XG4gICAgbXVsdGlwbGVNYXRjaGluZ1Rva2Vuczoge1xuICAgICAgICBjb2RlOiBcIm11bHRpcGxlX21hdGNoaW5nX3Rva2Vuc1wiLFxuICAgICAgICBkZXNjOiBcIlRoZSBjYWNoZSBjb250YWlucyBtdWx0aXBsZSB0b2tlbnMgc2F0aXNmeWluZyB0aGUgcmVxdWlyZW1lbnRzLiBcIiArXG4gICAgICAgICAgICBcIkNhbGwgQWNxdWlyZVRva2VuIGFnYWluIHByb3ZpZGluZyBtb3JlIHJlcXVpcmVtZW50cyBsaWtlIGF1dGhvcml0eS5cIlxuICAgIH0sXG4gICAgbXVsdGlwbGVDYWNoZUF1dGhvcml0aWVzOiB7XG4gICAgICAgIGNvZGU6IFwibXVsdGlwbGVfYXV0aG9yaXRpZXNcIixcbiAgICAgICAgZGVzYzogXCJNdWx0aXBsZSBhdXRob3JpdGllcyBmb3VuZCBpbiB0aGUgY2FjaGUuIFBhc3MgYXV0aG9yaXR5IGluIHRoZSBBUEkgb3ZlcmxvYWQuXCJcbiAgICB9LFxuICAgIGVuZHBvaW50UmVzb2x1dGlvbkVycm9yOiB7XG4gICAgICAgIGNvZGU6IFwiZW5kcG9pbnRzX3Jlc29sdXRpb25fZXJyb3JcIixcbiAgICAgICAgZGVzYzogXCJFcnJvcjogY291bGQgbm90IHJlc29sdmUgZW5kcG9pbnRzLiBQbGVhc2UgY2hlY2sgbmV0d29yayBhbmQgdHJ5IGFnYWluLlwiXG4gICAgfSxcbiAgICBwb3BVcFdpbmRvd0Vycm9yOiB7XG4gICAgICAgIGNvZGU6IFwicG9wdXBfd2luZG93X2Vycm9yXCIsXG4gICAgICAgIGRlc2M6IFwiRXJyb3Igb3BlbmluZyBwb3B1cCB3aW5kb3cuIFRoaXMgY2FuIGhhcHBlbiBpZiB5b3UgYXJlIHVzaW5nIElFIG9yIGlmIHBvcHVwcyBhcmUgYmxvY2tlZCBpbiB0aGUgYnJvd3Nlci5cIlxuICAgIH0sXG4gICAgdG9rZW5SZW5ld2FsRXJyb3I6IHtcbiAgICAgICAgY29kZTogXCJ0b2tlbl9yZW5ld2FsX2Vycm9yXCIsXG4gICAgICAgIGRlc2M6IFwiVG9rZW4gcmVuZXdhbCBvcGVyYXRpb24gZmFpbGVkIGR1ZSB0byB0aW1lb3V0LlwiXG4gICAgfSxcbiAgICBpbnZhbGlkSWRUb2tlbjoge1xuICAgICAgICBjb2RlOiBcImludmFsaWRfaWRfdG9rZW5cIixcbiAgICAgICAgZGVzYzogXCJJbnZhbGlkIElEIHRva2VuLlwiXG4gICAgfSxcbiAgICBpbnZhbGlkU3RhdGVFcnJvcjoge1xuICAgICAgICBjb2RlOiBcImludmFsaWRfc3RhdGVfZXJyb3JcIixcbiAgICAgICAgZGVzYzogXCJJbnZhbGlkIHN0YXRlLlwiXG4gICAgfSxcbiAgICBub25jZU1pc21hdGNoRXJyb3I6IHtcbiAgICAgICAgY29kZTogXCJub25jZV9taXNtYXRjaF9lcnJvclwiLFxuICAgICAgICBkZXNjOiBcIk5vbmNlIGlzIG5vdCBtYXRjaGluZywgTm9uY2UgcmVjZWl2ZWQ6IFwiXG4gICAgfSxcbiAgICBsb2dpblByb2dyZXNzRXJyb3I6IHtcbiAgICAgICAgY29kZTogXCJsb2dpbl9wcm9ncmVzc19lcnJvclwiLFxuICAgICAgICBkZXNjOiBcIkxvZ2luX0luX1Byb2dyZXNzOiBFcnJvciBkdXJpbmcgbG9naW4gY2FsbCAtIGxvZ2luIGlzIGFscmVhZHkgaW4gcHJvZ3Jlc3MuXCJcbiAgICB9LFxuICAgIGFjcXVpcmVUb2tlblByb2dyZXNzRXJyb3I6IHtcbiAgICAgICAgY29kZTogXCJhY3F1aXJldG9rZW5fcHJvZ3Jlc3NfZXJyb3JcIixcbiAgICAgICAgZGVzYzogXCJBY3F1aXJlVG9rZW5fSW5fUHJvZ3Jlc3M6IEVycm9yIGR1cmluZyBsb2dpbiBjYWxsIC0gbG9naW4gaXMgYWxyZWFkeSBpbiBwcm9ncmVzcy5cIlxuICAgIH0sXG4gICAgdXNlckNhbmNlbGxlZEVycm9yOiB7XG4gICAgICAgIGNvZGU6IFwidXNlcl9jYW5jZWxsZWRcIixcbiAgICAgICAgZGVzYzogXCJVc2VyIGNhbmNlbGxlZCB0aGUgZmxvdy5cIlxuICAgIH0sXG4gICAgY2FsbGJhY2tFcnJvcjoge1xuICAgICAgICBjb2RlOiBcImNhbGxiYWNrX2Vycm9yXCIsXG4gICAgICAgIGRlc2M6IFwiRXJyb3Igb2NjdXJyZWQgaW4gdG9rZW4gcmVjZWl2ZWQgY2FsbGJhY2sgZnVuY3Rpb24uXCJcbiAgICB9LFxuICAgIHVzZXJMb2dpblJlcXVpcmVkRXJyb3I6IHtcbiAgICAgICAgY29kZTogXCJ1c2VyX2xvZ2luX2Vycm9yXCIsXG4gICAgICAgIGRlc2M6IFwiVXNlciBsb2dpbiBpcyByZXF1aXJlZC5cIlxuICAgIH0sXG4gICAgdXNlckRvZXNOb3RFeGlzdEVycm9yOiB7XG4gICAgICAgIGNvZGU6IFwidXNlcl9ub25fZXhpc3RlbnRcIixcbiAgICAgICAgZGVzYzogXCJVc2VyIG9iamVjdCBkb2VzIG5vdCBleGlzdC4gUGxlYXNlIGNhbGwgYSBsb2dpbiBBUEkuXCJcbiAgICB9XG59O1xuXG4vKipcbiAqIEVycm9yIHRocm93biB3aGVuIHRoZXJlIGlzIGFuIGVycm9yIGluIHRoZSBjbGllbnQgY29kZSBydW5uaW5nIG9uIHRoZSBicm93c2VyLlxuICovXG5leHBvcnQgY2xhc3MgQ2xpZW50QXV0aEVycm9yIGV4dGVuZHMgQXV0aEVycm9yIHtcblxuICAgIGNvbnN0cnVjdG9yKGVycm9yQ29kZTogc3RyaW5nLCBlcnJvck1lc3NhZ2U/OiBzdHJpbmcpIHtcbiAgICAgICAgc3VwZXIoZXJyb3JDb2RlLCBlcnJvck1lc3NhZ2UpO1xuICAgICAgICB0aGlzLm5hbWUgPSBcIkNsaWVudEF1dGhFcnJvclwiO1xuXG4gICAgICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZih0aGlzLCBDbGllbnRBdXRoRXJyb3IucHJvdG90eXBlKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlRW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IoZXJyRGV0YWlsPzogc3RyaW5nKTogQ2xpZW50QXV0aEVycm9yIHtcbiAgICAgICAgbGV0IGVycm9yTWVzc2FnZSA9IENsaWVudEF1dGhFcnJvck1lc3NhZ2UuZW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IuZGVzYztcbiAgICAgICAgaWYgKGVyckRldGFpbCAmJiAhVXRpbHMuaXNFbXB0eShlcnJEZXRhaWwpKSB7XG4gICAgICAgICAgICBlcnJvck1lc3NhZ2UgKz0gYCBEZXRhaWxzOiAke2VyckRldGFpbH1gO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgQ2xpZW50QXV0aEVycm9yKENsaWVudEF1dGhFcnJvck1lc3NhZ2UuZW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IuY29kZSwgZXJyb3JNZXNzYWdlKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlTXVsdGlwbGVNYXRjaGluZ1Rva2Vuc0luQ2FjaGVFcnJvcihzY29wZTogc3RyaW5nKTogQ2xpZW50QXV0aEVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnRBdXRoRXJyb3IoQ2xpZW50QXV0aEVycm9yTWVzc2FnZS5tdWx0aXBsZU1hdGNoaW5nVG9rZW5zLmNvZGUsXG4gICAgICAgICAgICBgQ2FjaGUgZXJyb3IgZm9yIHNjb3BlICR7c2NvcGV9OiAke0NsaWVudEF1dGhFcnJvck1lc3NhZ2UubXVsdGlwbGVNYXRjaGluZ1Rva2Vucy5kZXNjfS5gKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlTXVsdGlwbGVBdXRob3JpdGllc0luQ2FjaGVFcnJvcihzY29wZTogc3RyaW5nKTogQ2xpZW50QXV0aEVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnRBdXRoRXJyb3IoQ2xpZW50QXV0aEVycm9yTWVzc2FnZS5tdWx0aXBsZUNhY2hlQXV0aG9yaXRpZXMuY29kZSxcbiAgICAgICAgICAgIGBDYWNoZSBlcnJvciBmb3Igc2NvcGUgJHtzY29wZX06ICR7Q2xpZW50QXV0aEVycm9yTWVzc2FnZS5tdWx0aXBsZUNhY2hlQXV0aG9yaXRpZXMuZGVzY30uYCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZVBvcHVwV2luZG93RXJyb3IoZXJyRGV0YWlsPzogc3RyaW5nKTogQ2xpZW50QXV0aEVycm9yIHtcbiAgICAgICAgdmFyIGVycm9yTWVzc2FnZSA9IENsaWVudEF1dGhFcnJvck1lc3NhZ2UucG9wVXBXaW5kb3dFcnJvci5kZXNjO1xuICAgICAgICBpZiAoZXJyRGV0YWlsICYmICFVdGlscy5pc0VtcHR5KGVyckRldGFpbCkpIHtcbiAgICAgICAgICAgIGVycm9yTWVzc2FnZSArPSBgIERldGFpbHM6ICR7ZXJyRGV0YWlsfWA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnRBdXRoRXJyb3IoQ2xpZW50QXV0aEVycm9yTWVzc2FnZS5wb3BVcFdpbmRvd0Vycm9yLmNvZGUsIGVycm9yTWVzc2FnZSk7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZVRva2VuUmVuZXdhbFRpbWVvdXRFcnJvcigpOiBDbGllbnRBdXRoRXJyb3Ige1xuICAgICAgICByZXR1cm4gbmV3IENsaWVudEF1dGhFcnJvcihDbGllbnRBdXRoRXJyb3JNZXNzYWdlLnRva2VuUmVuZXdhbEVycm9yLmNvZGUsXG4gICAgICAgICAgICBDbGllbnRBdXRoRXJyb3JNZXNzYWdlLnRva2VuUmVuZXdhbEVycm9yLmRlc2MpO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVJbnZhbGlkSWRUb2tlbkVycm9yKGlkVG9rZW46IElkVG9rZW4pIDogQ2xpZW50QXV0aEVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnRBdXRoRXJyb3IoQ2xpZW50QXV0aEVycm9yTWVzc2FnZS5pbnZhbGlkSWRUb2tlbi5jb2RlLFxuICAgICAgICAgICAgYCR7Q2xpZW50QXV0aEVycm9yTWVzc2FnZS5pbnZhbGlkSWRUb2tlbi5kZXNjfSBHaXZlbiB0b2tlbjogJHtpZFRva2VufWApO1xuICAgIH1cblxuICAgIC8vVE9ETzogSXMgdGhpcyBub3QgYSBzZWN1cml0eSBmbGF3IHRvIHNlbmQgdGhlIHVzZXIgdGhlIHN0YXRlIGV4cGVjdGVkPz9cbiAgICBzdGF0aWMgY3JlYXRlSW52YWxpZFN0YXRlRXJyb3IoaW52YWxpZFN0YXRlOiBzdHJpbmcsIGFjdHVhbFN0YXRlOiBzdHJpbmcpOiBDbGllbnRBdXRoRXJyb3Ige1xuICAgICAgICByZXR1cm4gbmV3IENsaWVudEF1dGhFcnJvcihDbGllbnRBdXRoRXJyb3JNZXNzYWdlLmludmFsaWRTdGF0ZUVycm9yLmNvZGUsXG4gICAgICAgICAgICBgJHtDbGllbnRBdXRoRXJyb3JNZXNzYWdlLmludmFsaWRTdGF0ZUVycm9yLmRlc2N9ICR7aW52YWxpZFN0YXRlfSwgc3RhdGUgZXhwZWN0ZWQgOiAke2FjdHVhbFN0YXRlfS5gKTtcbiAgICB9XG5cbiAgICAvL1RPRE86IElzIHRoaXMgbm90IGEgc2VjdXJpdHkgZmxhdyB0byBzZW5kIHRoZSB1c2VyIHRoZSBOb25jZSBleHBlY3RlZD8/XG4gICAgc3RhdGljIGNyZWF0ZU5vbmNlTWlzbWF0Y2hFcnJvcihpbnZhbGlkTm9uY2U6IHN0cmluZywgYWN0dWFsTm9uY2U6IHN0cmluZyk6IENsaWVudEF1dGhFcnJvciB7XG4gICAgICAgIHJldHVybiBuZXcgQ2xpZW50QXV0aEVycm9yKENsaWVudEF1dGhFcnJvck1lc3NhZ2Uubm9uY2VNaXNtYXRjaEVycm9yLmNvZGUsXG4gICAgICAgICAgICBgJHtDbGllbnRBdXRoRXJyb3JNZXNzYWdlLm5vbmNlTWlzbWF0Y2hFcnJvci5kZXNjfSAke2ludmFsaWROb25jZX0sIG5vbmNlIGV4cGVjdGVkIDogJHthY3R1YWxOb25jZX0uYCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZUxvZ2luSW5Qcm9ncmVzc0Vycm9yKCk6IENsaWVudEF1dGhFcnJvciB7XG4gICAgICAgIHJldHVybiBuZXcgQ2xpZW50QXV0aEVycm9yKENsaWVudEF1dGhFcnJvck1lc3NhZ2UubG9naW5Qcm9ncmVzc0Vycm9yLmNvZGUsXG4gICAgICAgICAgICBDbGllbnRBdXRoRXJyb3JNZXNzYWdlLmxvZ2luUHJvZ3Jlc3NFcnJvci5kZXNjKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlQWNxdWlyZVRva2VuSW5Qcm9ncmVzc0Vycm9yKCk6IENsaWVudEF1dGhFcnJvciB7XG4gICAgICAgIHJldHVybiBuZXcgQ2xpZW50QXV0aEVycm9yKENsaWVudEF1dGhFcnJvck1lc3NhZ2UuYWNxdWlyZVRva2VuUHJvZ3Jlc3NFcnJvci5jb2RlLFxuICAgICAgICAgICAgQ2xpZW50QXV0aEVycm9yTWVzc2FnZS5hY3F1aXJlVG9rZW5Qcm9ncmVzc0Vycm9yLmRlc2MpO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVVc2VyQ2FuY2VsbGVkRXJyb3IoKTogQ2xpZW50QXV0aEVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnRBdXRoRXJyb3IoQ2xpZW50QXV0aEVycm9yTWVzc2FnZS51c2VyQ2FuY2VsbGVkRXJyb3IuY29kZSxcbiAgICAgICAgICAgIENsaWVudEF1dGhFcnJvck1lc3NhZ2UudXNlckNhbmNlbGxlZEVycm9yLmRlc2MpO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVFcnJvckluQ2FsbGJhY2tGdW5jdGlvbihlcnJvckRlc2M6IHN0cmluZyk6IENsaWVudEF1dGhFcnJvciB7XG4gICAgICAgIHJldHVybiBuZXcgQ2xpZW50QXV0aEVycm9yKENsaWVudEF1dGhFcnJvck1lc3NhZ2UuY2FsbGJhY2tFcnJvci5jb2RlLFxuICAgICAgICAgICAgYCR7Q2xpZW50QXV0aEVycm9yTWVzc2FnZS5jYWxsYmFja0Vycm9yLmRlc2N9ICR7ZXJyb3JEZXNjfS5gKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlVXNlckxvZ2luUmVxdWlyZWRFcnJvcigpIDogQ2xpZW50QXV0aEVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnRBdXRoRXJyb3IoQ2xpZW50QXV0aEVycm9yTWVzc2FnZS51c2VyTG9naW5SZXF1aXJlZEVycm9yLmNvZGUsXG4gICAgICAgICAgICBDbGllbnRBdXRoRXJyb3JNZXNzYWdlLnVzZXJMb2dpblJlcXVpcmVkRXJyb3IuZGVzYyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZVVzZXJEb2VzTm90RXhpc3RFcnJvcigpIDogQ2xpZW50QXV0aEVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnRBdXRoRXJyb3IoQ2xpZW50QXV0aEVycm9yTWVzc2FnZS51c2VyRG9lc05vdEV4aXN0RXJyb3IuY29kZSxcbiAgICAgICAgICAgIENsaWVudEF1dGhFcnJvck1lc3NhZ2UudXNlckRvZXNOb3RFeGlzdEVycm9yLmRlc2MpO1xuICAgIH1cbn1cbiIsIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuXG5pbXBvcnQgeyBVdGlscyB9IGZyb20gXCIuL1V0aWxzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUxvZ2dlckNhbGxiYWNrIHtcbiAgKGxldmVsOiBMb2dMZXZlbCwgbWVzc2FnZTogc3RyaW5nLCBjb250YWluc1BpaTogYm9vbGVhbik6IHZvaWQ7XG59XG5cbmV4cG9ydCBlbnVtIExvZ0xldmVsIHtcbiAgRXJyb3IsXG4gIFdhcm5pbmcsXG4gIEluZm8sXG4gIFZlcmJvc2Vcbn1cblxuZXhwb3J0IGNsYXNzIExvZ2dlciB7Ly8gU2luZ2xldG9uIENsYXNzXG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIC8vIFRPRE86IFRoaXMgZG9lcyBub3Qgc2VlbSB0byBiZSBhIHNpbmdsZXRvbiEhIENoYW5nZSBvciBEZWxldGUuXG4gIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBMb2dnZXI7XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHByaXZhdGUgY29ycmVsYXRpb25JZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIGxldmVsOiBMb2dMZXZlbCA9IExvZ0xldmVsLkluZm87XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHByaXZhdGUgcGlpTG9nZ2luZ0VuYWJsZWQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHByaXZhdGUgbG9jYWxDYWxsYmFjazogSUxvZ2dlckNhbGxiYWNrO1xuXG4gIGNvbnN0cnVjdG9yKGxvY2FsQ2FsbGJhY2s6IElMb2dnZXJDYWxsYmFjayxcbiAgICAgIG9wdGlvbnM6XG4gICAgICB7XG4gICAgICAgICAgY29ycmVsYXRpb25JZD86IHN0cmluZyxcbiAgICAgICAgICBsZXZlbD86IExvZ0xldmVsLFxuICAgICAgICAgIHBpaUxvZ2dpbmdFbmFibGVkPzogYm9vbGVhbixcbiAgICAgIH0gPSB7fSkge1xuICAgICAgY29uc3Qge1xuICAgICAgICAgIGNvcnJlbGF0aW9uSWQgPSBcIlwiLFxuICAgICAgICAgIGxldmVsID0gTG9nTGV2ZWwuSW5mbyxcbiAgICAgICAgICBwaWlMb2dnaW5nRW5hYmxlZCA9IGZhbHNlXG4gICAgICB9ID0gb3B0aW9ucztcblxuICAgICAgdGhpcy5sb2NhbENhbGxiYWNrID0gbG9jYWxDYWxsYmFjaztcbiAgICAgIHRoaXMuY29ycmVsYXRpb25JZCA9IGNvcnJlbGF0aW9uSWQ7XG4gICAgICB0aGlzLmxldmVsID0gbGV2ZWw7XG4gICAgICB0aGlzLnBpaUxvZ2dpbmdFbmFibGVkID0gcGlpTG9nZ2luZ0VuYWJsZWQ7XG4gIH1cblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgcHJpdmF0ZSBsb2dNZXNzYWdlKGxvZ0xldmVsOiBMb2dMZXZlbCwgbG9nTWVzc2FnZTogc3RyaW5nLCBjb250YWluc1BpaTogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmICgobG9nTGV2ZWwgPiB0aGlzLmxldmVsKSB8fCAoIXRoaXMucGlpTG9nZ2luZ0VuYWJsZWQgJiYgY29udGFpbnNQaWkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9VVENTdHJpbmcoKTtcbiAgICBsZXQgbG9nOiBzdHJpbmc7XG4gICAgaWYgKCFVdGlscy5pc0VtcHR5KHRoaXMuY29ycmVsYXRpb25JZCkpIHtcbiAgICAgIGxvZyA9IHRpbWVzdGFtcCArIFwiOlwiICsgdGhpcy5jb3JyZWxhdGlvbklkICsgXCItXCIgKyBVdGlscy5nZXRMaWJyYXJ5VmVyc2lvbigpICsgXCItXCIgKyBMb2dMZXZlbFtsb2dMZXZlbF0gKyBcIiBcIiArIGxvZ01lc3NhZ2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbG9nID0gdGltZXN0YW1wICsgXCI6XCIgKyBVdGlscy5nZXRMaWJyYXJ5VmVyc2lvbigpICsgXCItXCIgKyBMb2dMZXZlbFtsb2dMZXZlbF0gKyBcIiBcIiArIGxvZ01lc3NhZ2U7XG4gICAgfVxuICAgIHRoaXMuZXhlY3V0ZUNhbGxiYWNrKGxvZ0xldmVsLCBsb2csIGNvbnRhaW5zUGlpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBleGVjdXRlQ2FsbGJhY2sobGV2ZWw6IExvZ0xldmVsLCBtZXNzYWdlOiBzdHJpbmcsIGNvbnRhaW5zUGlpOiBib29sZWFuKSB7XG4gICAgaWYgKHRoaXMubG9jYWxDYWxsYmFjaykge1xuICAgICAgdGhpcy5sb2NhbENhbGxiYWNrKGxldmVsLCBtZXNzYWdlLCBjb250YWluc1BpaSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIGVycm9yKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMubG9nTWVzc2FnZShMb2dMZXZlbC5FcnJvciwgbWVzc2FnZSwgZmFsc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIGVycm9yUGlpKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMubG9nTWVzc2FnZShMb2dMZXZlbC5FcnJvciwgbWVzc2FnZSwgdHJ1ZSk7XG4gIH1cblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgd2FybmluZyhtZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmxvZ01lc3NhZ2UoTG9nTGV2ZWwuV2FybmluZywgbWVzc2FnZSwgZmFsc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHdhcm5pbmdQaWkobWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5sb2dNZXNzYWdlKExvZ0xldmVsLldhcm5pbmcsIG1lc3NhZ2UsIHRydWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIGluZm8obWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5sb2dNZXNzYWdlKExvZ0xldmVsLkluZm8sIG1lc3NhZ2UsIGZhbHNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBpbmZvUGlpKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMubG9nTWVzc2FnZShMb2dMZXZlbC5JbmZvLCBtZXNzYWdlLCB0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICB2ZXJib3NlKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMubG9nTWVzc2FnZShMb2dMZXZlbC5WZXJib3NlLCBtZXNzYWdlLCBmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgdmVyYm9zZVBpaShtZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmxvZ01lc3NhZ2UoTG9nTGV2ZWwuVmVyYm9zZSwgbWVzc2FnZSwgdHJ1ZSk7XG4gIH1cbn1cbiIsIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuXG5pbXBvcnQgeyBBdXRoRXJyb3IgfSBmcm9tIFwiLi9BdXRoRXJyb3JcIjtcblxuZXhwb3J0IGNvbnN0IFNlcnZlckVycm9yTWVzc2FnZSA9IHtcbiAgICBzZXJ2ZXJVbmF2YWlsYWJsZToge1xuICAgICAgICBjb2RlOiBcInNlcnZlcl91bmF2YWlsYWJsZVwiLFxuICAgICAgICBkZXNjOiBcIlNlcnZlciBpcyB0ZW1wb3JhcmlseSB1bmF2YWlsYWJsZS5cIlxuICAgIH0sXG4gICAgdW5rbm93blNlcnZlckVycm9yOiB7XG4gICAgICAgIGNvZGU6IFwidW5rbm93bl9zZXJ2ZXJfZXJyb3JcIlxuICAgIH0sXG59O1xuXG4vKipcbiAqIEVycm9yIHRocm93biB3aGVuIHRoZXJlIGlzIGFuIGVycm9yIHdpdGggdGhlIHNlcnZlciBjb2RlLCBmb3IgZXhhbXBsZSwgdW5hdmFpbGFiaWxpdHkuXG4gKi9cbmV4cG9ydCBjbGFzcyBTZXJ2ZXJFcnJvciBleHRlbmRzIEF1dGhFcnJvciB7XG5cbiAgICBjb25zdHJ1Y3RvcihlcnJvckNvZGU6IHN0cmluZywgZXJyb3JNZXNzYWdlPzogc3RyaW5nKSB7XG4gICAgICAgIHN1cGVyKGVycm9yQ29kZSwgZXJyb3JNZXNzYWdlKTtcbiAgICAgICAgdGhpcy5uYW1lID0gXCJTZXJ2ZXJFcnJvclwiO1xuXG4gICAgICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZih0aGlzLCBTZXJ2ZXJFcnJvci5wcm90b3R5cGUpO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVTZXJ2ZXJVbmF2YWlsYWJsZUVycm9yKCk6IFNlcnZlckVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTZXJ2ZXJFcnJvcihTZXJ2ZXJFcnJvck1lc3NhZ2Uuc2VydmVyVW5hdmFpbGFibGUuY29kZSxcbiAgICAgICAgICAgIFNlcnZlckVycm9yTWVzc2FnZS5zZXJ2ZXJVbmF2YWlsYWJsZS5kZXNjKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlVW5rbm93blNlcnZlckVycm9yKGVycm9yRGVzYzogc3RyaW5nKTogU2VydmVyRXJyb3Ige1xuICAgICAgICByZXR1cm4gbmV3IFNlcnZlckVycm9yKFNlcnZlckVycm9yTWVzc2FnZS51bmtub3duU2VydmVyRXJyb3IuY29kZSxcbiAgICAgICAgICAgIGVycm9yRGVzYyk7XG4gICAgfVxufVxuIiwiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG5cbmltcG9ydCB7IEFjY2Vzc1Rva2VuQ2FjaGVJdGVtIH0gZnJvbSBcIi4vQWNjZXNzVG9rZW5DYWNoZUl0ZW1cIjtcbmltcG9ydCB7IEFjY2Vzc1Rva2VuS2V5IH0gZnJvbSBcIi4vQWNjZXNzVG9rZW5LZXlcIjtcbmltcG9ydCB7IEFjY2Vzc1Rva2VuVmFsdWUgfSBmcm9tIFwiLi9BY2Nlc3NUb2tlblZhbHVlXCI7XG5pbXBvcnQgeyBTZXJ2ZXJSZXF1ZXN0UGFyYW1ldGVycyB9IGZyb20gXCIuL1NlcnZlclJlcXVlc3RQYXJhbWV0ZXJzXCI7XG5pbXBvcnQgeyBBdXRob3JpdHkgfSBmcm9tIFwiLi9BdXRob3JpdHlcIjtcbmltcG9ydCB7IENsaWVudEluZm8gfSBmcm9tIFwiLi9DbGllbnRJbmZvXCI7XG5pbXBvcnQgeyBDb25zdGFudHMsIEVycm9yQ29kZXMsIEVycm9yRGVzY3JpcHRpb24sIFNTT1R5cGVzLCBQcm9tcHRTdGF0ZSB9IGZyb20gXCIuL0NvbnN0YW50c1wiO1xuaW1wb3J0IHsgSWRUb2tlbiB9IGZyb20gXCIuL0lkVG9rZW5cIjtcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gXCIuL0xvZ2dlclwiO1xuaW1wb3J0IHsgU3RvcmFnZSB9IGZyb20gXCIuL1N0b3JhZ2VcIjtcbmltcG9ydCB7IEFjY291bnQgfSBmcm9tIFwiLi9BY2NvdW50XCI7XG5pbXBvcnQgeyBVdGlscyB9IGZyb20gXCIuL1V0aWxzXCI7XG5pbXBvcnQgeyBBdXRob3JpdHlGYWN0b3J5IH0gZnJvbSBcIi4vQXV0aG9yaXR5RmFjdG9yeVwiO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiwgYnVpbGRDb25maWd1cmF0aW9uIH0gZnJvbSBcIi4vQ29uZmlndXJhdGlvblwiO1xuaW1wb3J0IHsgQXV0aGVudGljYXRpb25QYXJhbWV0ZXJzLCBRUERpY3QgfSBmcm9tIFwiLi9BdXRoZW50aWNhdGlvblBhcmFtZXRlcnNcIjtcbmltcG9ydCB7IENsaWVudENvbmZpZ3VyYXRpb25FcnJvciB9IGZyb20gXCIuL2Vycm9yL0NsaWVudENvbmZpZ3VyYXRpb25FcnJvclwiO1xuaW1wb3J0IHsgQXV0aEVycm9yIH0gZnJvbSBcIi4vZXJyb3IvQXV0aEVycm9yXCI7XG5pbXBvcnQgeyBDbGllbnRBdXRoRXJyb3IsIENsaWVudEF1dGhFcnJvck1lc3NhZ2UgfSBmcm9tIFwiLi9lcnJvci9DbGllbnRBdXRoRXJyb3JcIjtcbmltcG9ydCB7IFNlcnZlckVycm9yIH0gZnJvbSBcIi4vZXJyb3IvU2VydmVyRXJyb3JcIjtcbmltcG9ydCB7IEludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3IgfSBmcm9tIFwiLi9lcnJvci9JbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yXCI7XG5pbXBvcnQgeyBBdXRoUmVzcG9uc2UgfSBmcm9tIFwiLi9BdXRoUmVzcG9uc2VcIjtcblxuLy8gZGVmYXVsdCBhdXRob3JpdHlcbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGF1dGhvcml0eSAtIEEgVVJMIGluZGljYXRpbmcgYSBkaXJlY3RvcnkgdGhhdCBNU0FMIGNhbiB1c2UgdG8gb2J0YWluIHRva2Vucy5cbiAqIC0gSW4gQXp1cmUgQUQsIGl0IGlzIG9mIHRoZSBmb3JtIGh0dHBzOi8vJmx0O3RlbmFudCZndDsvJmx0O3RlbmFudCZndDssIHdoZXJlICZsdDt0ZW5hbnQmZ3Q7IGlzIHRoZSBkaXJlY3RvcnkgaG9zdCAoZS5nLiBodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20pIGFuZCAmbHQ7dGVuYW50Jmd0OyBpcyBhIGlkZW50aWZpZXIgd2l0aGluIHRoZSBkaXJlY3RvcnkgaXRzZWxmIChlLmcuIGEgZG9tYWluIGFzc29jaWF0ZWQgdG8gdGhlIHRlbmFudCwgc3VjaCBhcyBjb250b3NvLm9ubWljcm9zb2Z0LmNvbSwgb3IgdGhlIEdVSUQgcmVwcmVzZW50aW5nIHRoZSBUZW5hbnRJRCBwcm9wZXJ0eSBvZiB0aGUgZGlyZWN0b3J5KVxuICogLSBJbiBBenVyZSBCMkMsIGl0IGlzIG9mIHRoZSBmb3JtIGh0dHBzOi8vJmx0O2luc3RhbmNlJmd0Oy90ZnAvJmx0O3RlbmFudCZndDsvPHBvbGljeU5hbWU+L1xuICogLSBEZWZhdWx0IHZhbHVlIGlzOiBcImh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbS9jb21tb25cIlxuICovXG5jb25zdCBERUZBVUxUX0FVVEhPUklUWSA9IFwiaHR0cHM6Ly9sb2dpbi5taWNyb3NvZnRvbmxpbmUuY29tL2NvbW1vblwiO1xuXG4vKipcbiAqIEludGVyZmFjZSB0byBoYW5kbGUgaUZyYW1lIGdlbmVyYXRpb24sIFBvcHVwIFdpbmRvdyBjcmVhdGlvbiBhbmQgcmVkaXJlY3QgaGFuZGxpbmdcbiAqL1xuZGVjbGFyZSBnbG9iYWwge1xuICAgIGludGVyZmFjZSBXaW5kb3cge1xuICAgICAgICBtc2FsOiBPYmplY3Q7XG4gICAgICAgIEN1c3RvbUV2ZW50OiBDdXN0b21FdmVudDtcbiAgICAgICAgRXZlbnQ6IEV2ZW50O1xuICAgICAgICBhY3RpdmVSZW5ld2Fsczoge307XG4gICAgICAgIHJlbmV3U3RhdGVzOiBBcnJheTxzdHJpbmc+O1xuICAgICAgICBjYWxsYmFja01hcHBlZFRvUmVuZXdTdGF0ZXMgOiB7fTtcbiAgICAgICAgcHJvbWlzZU1hcHBlZFRvUmVuZXdTdGF0ZXM6IHt9O1xuICAgICAgICBvcGVuZWRXaW5kb3dzOiBBcnJheTxXaW5kb3c+O1xuICAgICAgICByZXF1ZXN0VHlwZTogc3RyaW5nO1xuICAgIH1cbn1cblxuLyoqXG4gKiByZXNwb25zZV90eXBlIGZyb20gT3BlbklEQ29ubmVjdFxuICogUmVmZXJlbmNlczogaHR0cHM6Ly9vcGVuaWQubmV0L3NwZWNzL29hdXRoLXYyLW11bHRpcGxlLXJlc3BvbnNlLXR5cGVzLTFfMC5odG1sICYgaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzY3NDkjc2VjdGlvbi00LjIuMVxuICogU2luY2Ugd2Ugc3VwcG9ydCBvbmx5IGltcGxpY2l0IGZsb3cgaW4gdGhpcyBsaWJyYXJ5LCB3ZSByZXN0cmljdCB0aGUgcmVzcG9uc2VfdHlwZSBzdXBwb3J0IHRvIG9ubHkgJ3Rva2VuJyBhbmQgJ2lkX3Rva2VuJ1xuICpcbiAqIEBoaWRkZW5cbiAqL1xuY29uc3QgUmVzcG9uc2VUeXBlcyA9IHtcbiAgaWRfdG9rZW46IFwiaWRfdG9rZW5cIixcbiAgdG9rZW46IFwidG9rZW5cIixcbiAgaWRfdG9rZW5fdG9rZW46IFwiaWRfdG9rZW4gdG9rZW5cIlxufTtcblxuLyoqXG4gKiBAaGlkZGVuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2FjaGVSZXN1bHQge1xuICBlcnJvckRlc2M6IHN0cmluZztcbiAgdG9rZW46IHN0cmluZztcbiAgZXJyb3I6IHN0cmluZztcbn1cblxuLyoqXG4gKiBEYXRhIHR5cGUgdG8gaG9sZCBpbmZvcm1hdGlvbiBhYm91dCBzdGF0ZSByZXR1cm5lZCBmcm9tIHRoZSBzZXJ2ZXJcbiAqL1xuZXhwb3J0IHR5cGUgUmVzcG9uc2VTdGF0ZUluZm8gPSB7XG4gIHN0YXRlOiBzdHJpbmc7XG4gIHN0YXRlTWF0Y2g6IGJvb2xlYW47XG4gIHJlcXVlc3RUeXBlOiBzdHJpbmc7XG59O1xuXG4vKipcbiAqIEEgdHlwZSBhbGlhcyBmb3IgYSB0b2tlblJlY2VpdmVkQ2FsbGJhY2sgZnVuY3Rpb24uXG4gKiBAcGFyYW0gdG9rZW5SZWNlaXZlZENhbGxiYWNrLnRva2VuIHRva2VuIHJldHVybmVkIGZyb20gU1RTIGlmIHRva2VuIHJlcXVlc3QgaXMgc3VjY2Vzc2Z1bC5cbiAqIEBwYXJhbSB0b2tlblJlY2VpdmVkQ2FsbGJhY2sudG9rZW5UeXBlIHRva2VuVHlwZSByZXR1cm5lZCBmcm9tIHRoZSBTVFMgaWYgQVBJIGNhbGwgaXMgc3VjY2Vzc2Z1bC4gUG9zc2libGUgdmFsdWVzIGFyZTogaWRfdG9rZW4gT1IgYWNjZXNzX3Rva2VuLlxuICovXG5leHBvcnQgdHlwZSB0b2tlblJlY2VpdmVkQ2FsbGJhY2sgPSAocmVzcG9uc2U6IEF1dGhSZXNwb25zZSkgPT4gdm9pZDtcblxuLyoqXG4gKiBBIHR5cGUgYWxpYXMgZm9yIGEgZXJyb3JSZWNlaXZlZENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHBhcmFtIGVycm9yUmVjZWl2ZWRDYWxsYmFjay5lcnJvckRlc2MgZXJyb3Igb2JqZWN0IGNyZWF0ZWQgYnkgbGlicmFyeSBjb250YWluaW5nIGVycm9yIHN0cmluZyByZXR1cm5lZCBmcm9tIHRoZSBTVFMgaWYgQVBJIGNhbGwgZmFpbHMuXG4gKi9cbmV4cG9ydCB0eXBlIGVycm9yUmVjZWl2ZWRDYWxsYmFjayA9IChhdXRoRXJyb3I6IEF1dGhFcnJvciwgYWNjb3VudFN0YXRlOiBzdHJpbmcpID0+IHZvaWQ7XG5cbi8qKlxuICogQSB3cmFwcGVyIHRvIGhhbmRsZSB0aGUgdG9rZW4gcmVzcG9uc2UvZXJyb3Igd2l0aGluIHRoZSBpRnJhbWUgYWx3YXlzXG4gKlxuICogQHBhcmFtIHRhcmdldFxuICogQHBhcmFtIHByb3BlcnR5S2V5XG4gKiBAcGFyYW0gZGVzY3JpcHRvclxuICovXG5jb25zdCByZXNvbHZlVG9rZW5Pbmx5SWZPdXRPZklmcmFtZSA9ICh0YXJnZXQ6IGFueSwgcHJvcGVydHlLZXk6IHN0cmluZywgZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yKSA9PiB7XG4gIGNvbnN0IHRva2VuQWNxdWlzaXRpb25NZXRob2QgPSBkZXNjcmlwdG9yLnZhbHVlO1xuICBkZXNjcmlwdG9yLnZhbHVlID0gZnVuY3Rpb24gKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICByZXR1cm4gdGhpcy5pc0luSWZyYW1lKClcbiAgICAgICAgICA/IG5ldyBQcm9taXNlKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9KVxuICAgICAgICAgIDogdG9rZW5BY3F1aXNpdGlvbk1ldGhvZC5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfTtcbiAgcmV0dXJuIGRlc2NyaXB0b3I7XG59O1xuXG4vKipcbiAqIFVzZXJBZ2VudEFwcGxpY2F0aW9uIGNsYXNzIC0gT2JqZWN0IEluc3RhbmNlIHRoYXQgdGhlIGRldmVsb3BlciB3b3VsZCBuZWVkIHRvIG1ha2UgbG9naW4vYWNxdWlyZVRva2VuIGNhbGxzXG4gKi9cbmV4cG9ydCBjbGFzcyBVc2VyQWdlbnRBcHBsaWNhdGlvbiB7XG5cbiAgLy8gaW5wdXQgQ29uZmlndXJhdGlvbiBieSB0aGUgZGV2ZWxvcGVyL3VzZXJcbiAgcHJpdmF0ZSBjb25maWc6IENvbmZpZ3VyYXRpb247XG5cbiAgLy8gY2FsbGJhY2tzIGZvciB0b2tlbi9lcnJvclxuICBwcml2YXRlIHRva2VuUmVjZWl2ZWRDYWxsYmFjazogdG9rZW5SZWNlaXZlZENhbGxiYWNrID0gbnVsbDtcbiAgcHJpdmF0ZSBlcnJvclJlY2VpdmVkQ2FsbGJhY2s6IGVycm9yUmVjZWl2ZWRDYWxsYmFjayA9IG51bGw7XG5cbiAgLy8gQWRkZWQgZm9yIHJlYWRhYmlsaXR5IGFzIHRoZXNlIHBhcmFtcyBhcmUgdmVyeSBmcmVxdWVudGx5IHVzZWRcbiAgcHJpdmF0ZSBsb2dnZXI6IExvZ2dlcjtcbiAgcHJpdmF0ZSBjbGllbnRJZDogc3RyaW5nO1xuICBwcml2YXRlIGluQ29va2llOiBib29sZWFuO1xuXG4gIC8vIENhY2hlIGFuZCBBY2NvdW50IGluZm8gcmVmZXJyZWQgYWNyb3NzIHRva2VuIGdyYW50IGZsb3dcbiAgcHJvdGVjdGVkIGNhY2hlU3RvcmFnZTogU3RvcmFnZTtcbiAgcHJpdmF0ZSBhY2NvdW50OiBBY2NvdW50O1xuXG4gIC8vIHN0YXRlIHZhcmlhYmxlc1xuICBwcml2YXRlIGxvZ2luSW5Qcm9ncmVzczogYm9vbGVhbjtcbiAgcHJpdmF0ZSBhY3F1aXJlVG9rZW5JblByb2dyZXNzOiBib29sZWFuO1xuICBwcml2YXRlIHNpbGVudEF1dGhlbnRpY2F0aW9uU3RhdGU6IHN0cmluZztcbiAgcHJpdmF0ZSBzaWxlbnRMb2dpbjogYm9vbGVhbjtcbiAgcHJpdmF0ZSByZWRpcmVjdENhbGxiYWNrc1NldDogYm9vbGVhbjtcblxuICAvLyBBdXRob3JpdHkgRnVuY3Rpb25hbGl0eVxuICBwcm90ZWN0ZWQgYXV0aG9yaXR5SW5zdGFuY2U6IEF1dGhvcml0eTtcblxuICAvLyBJZiB0aGUgZGV2ZWxvcGVyIHBhc3NlcyBhbiBhdXRob3JpdHksIGNyZWF0ZSBhbiBpbnN0YW5jZVxuICBwdWJsaWMgc2V0IGF1dGhvcml0eSh2YWwpIHtcbiAgICB0aGlzLmF1dGhvcml0eUluc3RhbmNlID0gQXV0aG9yaXR5RmFjdG9yeS5DcmVhdGVJbnN0YW5jZSh2YWwsIHRoaXMuY29uZmlnLmF1dGgudmFsaWRhdGVBdXRob3JpdHkpO1xuICB9XG5cbiAgLy8gcmV0cmlldmUgdGhlIGF1dGhvcml0eSBpbnN0YW5jZVxuICBwdWJsaWMgZ2V0IGF1dGhvcml0eSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmF1dGhvcml0eUluc3RhbmNlLkNhbm9uaWNhbEF1dGhvcml0eTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRBdXRob3JpdHlJbnN0YW5jZSgpOiBBdXRob3JpdHkge1xuICAgIHJldHVybiB0aGlzLmF1dGhvcml0eUluc3RhbmNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgYSBVc2VyQWdlbnRBcHBsaWNhdGlvbiB3aXRoIGEgZ2l2ZW4gY2xpZW50SWQgYW5kIGF1dGhvcml0eS5cbiAgICogQGNvbnN0cnVjdG9yXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjbGllbnRJZCAtIFRoZSBjbGllbnRJRCBvZiB5b3VyIGFwcGxpY2F0aW9uLCB5b3Ugc2hvdWxkIGdldCB0aGlzIGZyb20gdGhlIGFwcGxpY2F0aW9uIHJlZ2lzdHJhdGlvbiBwb3J0YWwuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhdXRob3JpdHkgLSBBIFVSTCBpbmRpY2F0aW5nIGEgZGlyZWN0b3J5IHRoYXQgTVNBTCBjYW4gdXNlIHRvIG9idGFpbiB0b2tlbnMuXG4gICAqIC0gSW4gQXp1cmUgQUQsIGl0IGlzIG9mIHRoZSBmb3JtIGh0dHBzOi8vJmx0O2luc3RhbmNlPi8mbHQ7dGVuYW50Jmd0OyxcXCB3aGVyZSAmbHQ7aW5zdGFuY2UmZ3Q7IGlzIHRoZSBkaXJlY3RvcnkgaG9zdCAoZS5nLiBodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20pIGFuZCAmbHQ7dGVuYW50Jmd0OyBpcyBhIGlkZW50aWZpZXIgd2l0aGluIHRoZSBkaXJlY3RvcnkgaXRzZWxmIChlLmcuIGEgZG9tYWluIGFzc29jaWF0ZWQgdG8gdGhlIHRlbmFudCwgc3VjaCBhcyBjb250b3NvLm9ubWljcm9zb2Z0LmNvbSwgb3IgdGhlIEdVSUQgcmVwcmVzZW50aW5nIHRoZSBUZW5hbnRJRCBwcm9wZXJ0eSBvZiB0aGUgZGlyZWN0b3J5KVxuICAgKiAtIEluIEF6dXJlIEIyQywgaXQgaXMgb2YgdGhlIGZvcm0gaHR0cHM6Ly8mbHQ7aW5zdGFuY2UmZ3Q7L3RmcC8mbHQ7dGVuYW50SWQmZ3Q7LyZsdDtwb2xpY3lOYW1lJmd0Oy9cbiAgICogLSBEZWZhdWx0IHZhbHVlIGlzOiBcImh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbS9jb21tb25cIlxuICAgKiBAcGFyYW0gX3Rva2VuUmVjZWl2ZWRDYWxsYmFjayAtICBUaGUgZnVuY3Rpb24gdGhhdCB3aWxsIGdldCB0aGUgY2FsbCBiYWNrIG9uY2UgdGhpcyBBUEkgaXMgY29tcGxldGVkIChlaXRoZXIgc3VjY2Vzc2Z1bGx5IG9yIHdpdGggYSBmYWlsdXJlKS5cbiAgICogQHBhcmFtIHtib29sZWFufSB2YWxpZGF0ZUF1dGhvcml0eSAtICBib29sZWFuIHRvIHR1cm4gYXV0aG9yaXR5IHZhbGlkYXRpb24gb24vb2ZmLlxuICAgKi9cbiAgY29uc3RydWN0b3IoY29uZmlndXJhdGlvbjogQ29uZmlndXJhdGlvbikge1xuXG4gICAgLy8gU2V0IHRoZSBDb25maWd1cmF0aW9uXG4gICAgdGhpcy5jb25maWcgPSBidWlsZENvbmZpZ3VyYXRpb24oY29uZmlndXJhdGlvbik7XG5cbiAgICAvLyBTZXQgdGhlIGNhbGxiYWNrIGJvb2xlYW5cbiAgICB0aGlzLnJlZGlyZWN0Q2FsbGJhY2tzU2V0ID0gZmFsc2U7XG5cbiAgICB0aGlzLmxvZ2dlciA9IHRoaXMuY29uZmlnLnN5c3RlbS5sb2dnZXI7XG4gICAgdGhpcy5jbGllbnRJZCA9IHRoaXMuY29uZmlnLmF1dGguY2xpZW50SWQ7XG4gICAgdGhpcy5pbkNvb2tpZSA9IHRoaXMuY29uZmlnLmNhY2hlLnN0b3JlQXV0aFN0YXRlSW5Db29raWU7XG5cbiAgICAvLyBpZiBubyBhdXRob3JpdHkgaXMgcGFzc2VkLCBzZXQgdGhlIGRlZmF1bHQ6IFwiaHR0cHM6Ly9sb2dpbi5taWNyb3NvZnRvbmxpbmUuY29tL2NvbW1vblwiXG4gICAgdGhpcy5hdXRob3JpdHkgPSB0aGlzLmNvbmZpZy5hdXRoLmF1dGhvcml0eSB8fCBERUZBVUxUX0FVVEhPUklUWTtcblxuICAgIC8vIHRyYWNrIGxvZ2luIGFuZCBhY3F1aXJlVG9rZW4gaW4gcHJvZ3Jlc3NcbiAgICB0aGlzLmxvZ2luSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgIHRoaXMuYWNxdWlyZVRva2VuSW5Qcm9ncmVzcyA9IGZhbHNlO1xuXG4gICAgLy8gY2FjaGUga2V5cyBtc2FsIC0gdHlwZXNjcmlwdCB0aHJvd3MgYW4gZXJyb3IgaWYgYW55IHZhbHVlIG90aGVyIHRoYW4gXCJsb2NhbFN0b3JhZ2VcIiBvciBcInNlc3Npb25TdG9yYWdlXCIgaXMgcGFzc2VkXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuY2FjaGVTdG9yYWdlID0gbmV3IFN0b3JhZ2UodGhpcy5jb25maWcuY2FjaGUuY2FjaGVMb2NhdGlvbik7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB0aHJvdyBDbGllbnRDb25maWd1cmF0aW9uRXJyb3IuY3JlYXRlSW52YWxpZENhY2hlTG9jYXRpb25Db25maWdFcnJvcih0aGlzLmNvbmZpZy5jYWNoZS5jYWNoZUxvY2F0aW9uKTtcbiAgICB9XG5cbiAgICAvLyBJbml0aWFsaXplIHdpbmRvdyBoYW5kbGluZyBjb2RlXG4gICAgd2luZG93Lm9wZW5lZFdpbmRvd3MgPSBbXTtcbiAgICB3aW5kb3cuYWN0aXZlUmVuZXdhbHMgPSB7fTtcbiAgICB3aW5kb3cucmVuZXdTdGF0ZXMgPSBbXTtcbiAgICB3aW5kb3cuY2FsbGJhY2tNYXBwZWRUb1JlbmV3U3RhdGVzID0geyB9O1xuICAgIHdpbmRvdy5wcm9taXNlTWFwcGVkVG9SZW5ld1N0YXRlcyA9IHsgfTtcbiAgICB3aW5kb3cubXNhbCA9IHRoaXM7XG5cbiAgICBjb25zdCB1cmxIYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2g7XG4gICAgY29uc3QgaXNDYWxsYmFjayA9IHRoaXMuaXNDYWxsYmFjayh1cmxIYXNoKTtcblxuICAgIC8vIE9uIHRoZSBzZXJ2ZXIgMzAyIC0gUmVkaXJlY3QsIGhhbmRsZSB0aGlzXG4gICAgaWYgKCF0aGlzLmNvbmZpZy5mcmFtZXdvcmsuaXNBbmd1bGFyKSB7XG4gICAgICBpZiAoaXNDYWxsYmFjaykge1xuICAgICAgICB0aGlzLmhhbmRsZUF1dGhlbnRpY2F0aW9uUmVzcG9uc2UodXJsSGFzaCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8jcmVnaW9uIFJlZGlyZWN0IENhbGxiYWNrc1xuICAvKipcbiAgICogU2V0cyB0aGUgY2FsbGJhY2sgZnVuY3Rpb25zIGZvciB0aGUgcmVkaXJlY3QgZmxvdyB0byBzZW5kIGJhY2sgdGhlIHN1Y2Nlc3Mgb3IgZXJyb3Igb2JqZWN0LlxuICAgKiBAcGFyYW0ge3Rva2VuUmVjZWl2ZWRDYWxsYmFja30gc3VjY2Vzc0NhbGxiYWNrIC0gQ2FsbGJhY2sgd2hpY2ggY29udGFpbnMgdGhlIEF1dGhSZXNwb25zZSBvYmplY3QsIGNvbnRhaW5pbmcgZGF0YSBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAqIEBwYXJhbSB7ZXJyb3JSZWNlaXZlZENhbGxiYWNrfSBlcnJvckNhbGxiYWNrIC0gQ2FsbGJhY2sgd2hpY2ggY29udGFpbnMgYSBBdXRoRXJyb3Igb2JqZWN0LCBjb250YWluaW5nIGVycm9yIGRhdGEgZnJvbSBlaXRoZXIgdGhlIHNlcnZlclxuICAgKiBvciB0aGUgbGlicmFyeSwgZGVwZW5kaW5nIG9uIHRoZSBvcmlnaW4gb2YgdGhlIGVycm9yLlxuICAgKi9cbiAgaGFuZGxlUmVkaXJlY3RDYWxsYmFja3Moc3VjY2Vzc0NhbGxiYWNrOiB0b2tlblJlY2VpdmVkQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2s6IGVycm9yUmVjZWl2ZWRDYWxsYmFjayk6IHZvaWQge1xuICAgIGlmICghc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICB0aGlzLnJlZGlyZWN0Q2FsbGJhY2tzU2V0ID0gZmFsc2U7XG4gICAgICB0aHJvdyBDbGllbnRDb25maWd1cmF0aW9uRXJyb3IuY3JlYXRlSW52YWxpZENhbGxiYWNrT2JqZWN0RXJyb3IoXCJzdWNjZXNzQ2FsbGJhY2tcIiwgc3VjY2Vzc0NhbGxiYWNrKTtcbiAgICB9IGVsc2UgaWYgKCFlcnJvckNhbGxiYWNrKSB7XG4gICAgICB0aGlzLnJlZGlyZWN0Q2FsbGJhY2tzU2V0ID0gZmFsc2U7XG4gICAgICB0aHJvdyBDbGllbnRDb25maWd1cmF0aW9uRXJyb3IuY3JlYXRlSW52YWxpZENhbGxiYWNrT2JqZWN0RXJyb3IoXCJlcnJvckNhbGxiYWNrXCIsIGVycm9yQ2FsbGJhY2spO1xuICAgIH1cblxuICAgIC8vIFNldCBjYWxsYmFja3NcbiAgICB0aGlzLnRva2VuUmVjZWl2ZWRDYWxsYmFjayA9IHN1Y2Nlc3NDYWxsYmFjaztcbiAgICB0aGlzLmVycm9yUmVjZWl2ZWRDYWxsYmFjayA9IGVycm9yQ2FsbGJhY2s7XG5cbiAgICB0aGlzLnJlZGlyZWN0Q2FsbGJhY2tzU2V0ID0gdHJ1ZTtcblxuICAgIC8vIE9uIHRoZSBzZXJ2ZXIgMzAyIC0gUmVkaXJlY3QsIGhhbmRsZSB0aGlzXG4gICAgLy8gVE9ETzogcmVuYW1lIHBlbmRpbmdDYWxsYmFjayB0byBjYWNoZWRIYXNoXG4gICAgaWYgKCF0aGlzLmNvbmZpZy5mcmFtZXdvcmsuaXNBbmd1bGFyKSB7XG4gICAgICBjb25zdCBwZW5kaW5nQ2FsbGJhY2sgPSB0aGlzLmNhY2hlU3RvcmFnZS5nZXRJdGVtKENvbnN0YW50cy51cmxIYXNoKTtcbiAgICAgIGlmIChwZW5kaW5nQ2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5wcm9jZXNzQ2FsbEJhY2socGVuZGluZ0NhbGxiYWNrLCBudWxsKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyNlbmRyZWdpb25cblxuICAvLyNyZWdpb24gUmVkaXJlY3QgRmxvd1xuXG4gIC8qKlxuICAgKiBJbml0aWF0ZSB0aGUgbG9naW4gcHJvY2VzcyBieSByZWRpcmVjdGluZyB0aGUgdXNlciB0byB0aGUgU1RTIGF1dGhvcml6YXRpb24gZW5kcG9pbnQuXG4gICAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IHNjb3BlcyAtIFBlcm1pc3Npb25zIHlvdSB3YW50IGluY2x1ZGVkIGluIHRoZSBhY2Nlc3MgdG9rZW4uIE5vdCBhbGwgc2NvcGVzIGFyZSBndWFyYW50ZWVkIHRvIGJlIGluY2x1ZGVkIGluIHRoZSBhY2Nlc3MgdG9rZW4gcmV0dXJuZWQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBleHRyYVF1ZXJ5UGFyYW1ldGVycyAtIEtleS12YWx1ZSBwYWlycyB0byBwYXNzIHRvIHRoZSBhdXRoZW50aWNhdGlvbiBzZXJ2ZXIgZHVyaW5nIHRoZSBpbnRlcmFjdGl2ZSBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgKi9cbiAgbG9naW5SZWRpcmVjdChyZXF1ZXN0PzogQXV0aGVudGljYXRpb25QYXJhbWV0ZXJzKTogdm9pZCB7XG5cbiAgICAvLyBUaHJvdyBlcnJvciBpZiBjYWxsYmFja3MgYXJlIG5vdCBzZXQgYmVmb3JlIHJlZGlyZWN0XG4gICAgaWYgKCF0aGlzLnJlZGlyZWN0Q2FsbGJhY2tzU2V0KSB7XG4gICAgICB0aHJvdyBDbGllbnRDb25maWd1cmF0aW9uRXJyb3IuY3JlYXRlUmVkaXJlY3RDYWxsYmFja3NOb3RTZXRFcnJvcigpO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZXMgbmF2aWdhdGUgdXJsOyBzYXZlcyB2YWx1ZSBpbiBjYWNoZTsgcmVkaXJlY3QgdXNlciB0byBBQURcbiAgICBpZiAodGhpcy5sb2dpbkluUHJvZ3Jlc3MpIHtcbiAgICAgIHRoaXMuZXJyb3JSZWNlaXZlZENhbGxiYWNrKENsaWVudEF1dGhFcnJvci5jcmVhdGVMb2dpbkluUHJvZ3Jlc3NFcnJvcigpLCB0aGlzLmdldEFjY291bnRTdGF0ZSh0aGlzLnNpbGVudEF1dGhlbnRpY2F0aW9uU3RhdGUpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBpZiBleHRyYVNjb3Blc1RvQ29uc2VudCBpcyBwYXNzZWQsIGFwcGVuZCB0aGVtIHRvIHRoZSBsb2dpbiByZXF1ZXN0XG4gICAgbGV0IHNjb3BlczogQXJyYXk8c3RyaW5nPiA9IHRoaXMuYXBwZW5kU2NvcGVzKHJlcXVlc3QpO1xuXG4gICAgLy8gVmFsaWRhdGUgYW5kIGZpbHRlciBzY29wZXMgKHRoZSB2YWxpZGF0ZSBmdW5jdGlvbiB3aWxsIHRocm93IGlmIHZhbGlkYXRpb24gZmFpbHMpXG4gICAgdGhpcy52YWxpZGF0ZUlucHV0U2NvcGUoc2NvcGVzLCBmYWxzZSk7XG5cbiAgICBjb25zdCBhY2NvdW50OiBBY2NvdW50ID0gdGhpcy5nZXRBY2NvdW50KCk7XG5cbiAgICAvLyBkZWZlciBxdWVyeVBhcmFtZXRlcnMgZ2VuZXJhdGlvbiB0byBIZWxwZXIgaWYgZGV2ZWxvcGVyIHBhc3NlcyBhY2NvdW50L3NpZC9sb2dpbl9oaW50XG4gICAgIGlmIChVdGlscy5pc1NTT1BhcmFtKHJlcXVlc3QpKSB7XG4gICAgICAgLy8gaWYgYWNjb3VudCBpcyBub3QgcHJvdmlkZWQsIHdlIHBhc3MgbnVsbFxuICAgICAgIHRoaXMubG9naW5SZWRpcmVjdEhlbHBlcihhY2NvdW50LCByZXF1ZXN0LCBzY29wZXMpO1xuICAgIH1cbiAgICAvLyBlbHNlIGhhbmRsZSB0aGUgbGlicmFyeSBkYXRhXG4gICAgZWxzZSB7XG4gICAgICAvLyBleHRyYWN0IEFEQUwgaWRfdG9rZW4gaWYgZXhpc3RzXG4gICAgICBsZXQgYWRhbElkVG9rZW4gPSB0aGlzLmV4dHJhY3RBREFMSWRUb2tlbigpO1xuXG4gICAgICAvLyBzaWxlbnQgbG9naW4gaWYgQURBTCBpZF90b2tlbiBpcyByZXRyaWV2ZWQgc3VjY2Vzc2Z1bGx5IC0gU1NPXG4gICAgICBpZiAoYWRhbElkVG9rZW4gJiYgIXNjb3Blcykge1xuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKFwiQURBTCdzIGlkVG9rZW4gZXhpc3RzLiBFeHRyYWN0aW5nIGxvZ2luIGluZm9ybWF0aW9uIGZyb20gQURBTCdzIGlkVG9rZW4gXCIpO1xuICAgICAgICBsZXQgdG9rZW5SZXF1ZXN0OiBBdXRoZW50aWNhdGlvblBhcmFtZXRlcnMgPSB0aGlzLmJ1aWxkSURUb2tlblJlcXVlc3QocmVxdWVzdCk7XG5cbiAgICAgICAgdGhpcy5zaWxlbnRMb2dpbiA9IHRydWU7XG4gICAgICAgIHRoaXMuYWNxdWlyZVRva2VuU2lsZW50KHRva2VuUmVxdWVzdCkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgdGhpcy5zaWxlbnRMb2dpbiA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMubG9nZ2VyLmluZm8oXCJVbmlmaWVkIGNhY2hlIGNhbGwgaXMgc3VjY2Vzc2Z1bFwiKTtcblxuICAgICAgICAgIGlmICh0aGlzLnRva2VuUmVjZWl2ZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy50b2tlblJlY2VpdmVkQ2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgKGVycm9yKSA9PiB7XG4gICAgICAgICAgdGhpcy5zaWxlbnRMb2dpbiA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKFwiRXJyb3Igb2NjdXJyZWQgZHVyaW5nIHVuaWZpZWQgY2FjaGUgQVRTXCIpO1xuXG4gICAgICAgICAgLy8gY2FsbCB0aGUgbG9naW5SZWRpcmVjdEhlbHBlciBsYXRlciB3aXRoIG5vIHVzZXIgYWNjb3VudCBjb250ZXh0XG4gICAgICAgICAgdGhpcy5sb2dpblJlZGlyZWN0SGVscGVyKG51bGwsIHJlcXVlc3QsIHNjb3Blcyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgLy8gZWxzZSBwcm9jZWVkIHRvIGxvZ2luXG4gICAgICBlbHNlIHtcbiAgICAgICAgLy8gY2FsbCB0aGUgbG9naW5SZWRpcmVjdEhlbHBlciBsYXRlciB3aXRoIG5vIHVzZXIgYWNjb3VudCBjb250ZXh0XG4gICAgICAgIHRoaXMubG9naW5SZWRpcmVjdEhlbHBlcihudWxsLCByZXF1ZXN0LCBzY29wZXMpO1xuICAgICAgfVxuICAgIH1cblxuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBmdW5jdGlvbiB0byBsb2dpblJlZGlyZWN0XG4gICAqXG4gICAqIEBoaWRkZW5cbiAgICogQHBhcmFtIHNjb3Blc1xuICAgKiBAcGFyYW0gZXh0cmFRdWVyeVBhcmFtZXRlcnNcbiAgICovXG4gIHByaXZhdGUgbG9naW5SZWRpcmVjdEhlbHBlcihhY2NvdW50OiBBY2NvdW50LCByZXF1ZXN0OiBBdXRoZW50aWNhdGlvblBhcmFtZXRlcnMsIHNjb3Blcz86IEFycmF5PHN0cmluZz4pIHtcbiAgICAvLyBUcmFjayBsb2dpbiBpbiBwcm9ncmVzc1xuICAgIHRoaXMubG9naW5JblByb2dyZXNzID0gdHJ1ZTtcblxuICAgIHRoaXMuYXV0aG9yaXR5SW5zdGFuY2UucmVzb2x2ZUVuZHBvaW50c0FzeW5jKCkudGhlbigoKSA9PiB7XG5cbiAgICAgIC8vIGNyZWF0ZSB0aGUgUmVxdWVzdCB0byBiZSBzZW50IHRvIHRoZSBTZXJ2ZXJcbiAgICAgIGxldCBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QgPSBuZXcgU2VydmVyUmVxdWVzdFBhcmFtZXRlcnMoXG4gICAgICAgIHRoaXMuYXV0aG9yaXR5SW5zdGFuY2UsXG4gICAgICAgIHRoaXMuY2xpZW50SWQsIHNjb3BlcyxcbiAgICAgICAgUmVzcG9uc2VUeXBlcy5pZF90b2tlbixcbiAgICAgICAgdGhpcy5nZXRSZWRpcmVjdFVyaSgpLFxuICAgICAgICB0aGlzLmNvbmZpZy5hdXRoLnN0YXRlXG4gICAgICApO1xuXG4gICAgICAvLyBwb3B1bGF0ZSBRdWVyeVBhcmFtZXRlcnMgKHNpZC9sb2dpbl9oaW50L2RvbWFpbl9oaW50KSBhbmQgYW55IG90aGVyIGV4dHJhUXVlcnlQYXJhbWV0ZXJzIHNldCBieSB0aGUgZGV2ZWxvcGVyXG4gICAgICBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QgPSB0aGlzLnBvcHVsYXRlUXVlcnlQYXJhbXMoYWNjb3VudCwgcmVxdWVzdCwgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0KTtcblxuICAgICAgLy8gaWYgdGhlIHVzZXIgc2V0cyB0aGUgbG9naW4gc3RhcnQgcGFnZSAtIGFuZ3VsYXIgb25seT8/XG4gICAgICBsZXQgbG9naW5TdGFydFBhZ2UgPSB0aGlzLmNhY2hlU3RvcmFnZS5nZXRJdGVtKENvbnN0YW50cy5hbmd1bGFyTG9naW5SZXF1ZXN0KTtcbiAgICAgIGlmICghbG9naW5TdGFydFBhZ2UgfHwgbG9naW5TdGFydFBhZ2UgPT09IFwiXCIpIHtcbiAgICAgICAgbG9naW5TdGFydFBhZ2UgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLmFuZ3VsYXJMb2dpblJlcXVlc3QsIFwiXCIpO1xuICAgICAgfVxuXG4gICAgICAvLyBDYWNoZSB0aGUgc3RhdGUsIG5vbmNlLCBhbmQgbG9naW4gcmVxdWVzdCBkYXRhXG4gICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5sb2dpblJlcXVlc3QsIGxvZ2luU3RhcnRQYWdlLCB0aGlzLmluQ29va2llKTtcbiAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLmxvZ2luRXJyb3IsIFwiXCIpO1xuXG4gICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5zdGF0ZUxvZ2luLCBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGUsIHRoaXMuaW5Db29raWUpO1xuICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubm9uY2VJZFRva2VuLCBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Qubm9uY2UsIHRoaXMuaW5Db29raWUpO1xuXG4gICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsRXJyb3IsIFwiXCIpO1xuICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbEVycm9yRGVzY3JpcHRpb24sIFwiXCIpO1xuXG4gICAgICAvLyBDYWNoZSBhdXRob3JpdHlLZXlcbiAgICAgIHRoaXMuc2V0QXV0aG9yaXR5Q2FjaGUoc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlLCB0aGlzLmF1dGhvcml0eSk7XG5cbiAgICAgIC8vIGJ1aWxkIFVSTCB0byBuYXZpZ2F0ZSB0byBwcm9jZWVkIHdpdGggdGhlIGxvZ2luXG4gICAgICBsZXQgdXJsTmF2aWdhdGUgPSBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QuY3JlYXRlTmF2aWdhdGVVcmwoc2NvcGVzKSArIENvbnN0YW50cy5yZXNwb25zZV9tb2RlX2ZyYWdtZW50O1xuXG4gICAgICAvLyBSZWRpcmVjdCB1c2VyIHRvIGxvZ2luIFVSTFxuICAgICAgdGhpcy5wcm9tcHRVc2VyKHVybE5hdmlnYXRlKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIG9idGFpbiBhbiBhY2Nlc3NfdG9rZW4gYnkgcmVkaXJlY3RpbmcgdGhlIHVzZXIgdG8gdGhlIGF1dGhvcml6YXRpb24gZW5kcG9pbnQuXG4gICAqIFRvIHJlbmV3IGlkVG9rZW4sIGNsaWVudElkIHNob3VsZCBiZSBwYXNzZWQgYXMgdGhlIG9ubHkgc2NvcGUgaW4gdGhlIHNjb3BlcyBhcnJheS5cbiAgICogQHBhcmFtIHtBcnJheTxzdHJpbmc+fSBzY29wZXMgLSBQZXJtaXNzaW9ucyB5b3Ugd2FudCBpbmNsdWRlZCBpbiB0aGUgYWNjZXNzIHRva2VuLiBOb3QgYWxsIHNjb3BlcyBhcmUgIGd1YXJhbnRlZWQgdG8gYmUgaW5jbHVkZWQgaW4gdGhlIGFjY2VzcyB0b2tlbi4gU2NvcGVzIGxpa2UgXCJvcGVuaWRcIiBhbmQgXCJwcm9maWxlXCIgYXJlIHNlbnQgd2l0aCBldmVyeSByZXF1ZXN0LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gYXV0aG9yaXR5IC0gQSBVUkwgaW5kaWNhdGluZyBhIGRpcmVjdG9yeSB0aGF0IE1TQUwgY2FuIHVzZSB0byBvYnRhaW4gdG9rZW5zLlxuICAgKiAtIEluIEF6dXJlIEFELCBpdCBpcyBvZiB0aGUgZm9ybSBodHRwczovL3tpbnN0YW5jZX0vJmx0O3RlbmFudCZndDssIHdoZXJlICZsdDt0ZW5hbnQmZ3Q7IGlzIHRoZSBkaXJlY3RvcnkgaG9zdCAoZS5nLiBodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20pIGFuZCAmbHQ7dGVuYW50Jmd0OyBpcyBhIGlkZW50aWZpZXIgd2l0aGluIHRoZSBkaXJlY3RvcnkgaXRzZWxmIChlLmcuIGEgZG9tYWluIGFzc29jaWF0ZWQgdG8gdGhlIHRlbmFudCwgc3VjaCBhcyBjb250b3NvLm9ubWljcm9zb2Z0LmNvbSwgb3IgdGhlIEdVSUQgcmVwcmVzZW50aW5nIHRoZSBUZW5hbnRJRCBwcm9wZXJ0eSBvZiB0aGUgZGlyZWN0b3J5KVxuICAgKiAtIEluIEF6dXJlIEIyQywgaXQgaXMgb2YgdGhlIGZvcm0gaHR0cHM6Ly97aW5zdGFuY2V9L3RmcC8mbHQ7dGVuYW50Jmd0Oy88cG9saWN5TmFtZT5cbiAgICogLSBEZWZhdWx0IHZhbHVlIGlzOiBcImh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbS9jb21tb25cIlxuICAgKiBAcGFyYW0ge0FjY291bnR9IGFjY291bnQgLSBUaGUgYWNjb3VudCBmb3Igd2hpY2ggdGhlIHNjb3BlcyBhcmUgcmVxdWVzdGVkLlRoZSBkZWZhdWx0IGFjY291bnQgaXMgdGhlIGxvZ2dlZCBpbiBhY2NvdW50LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXh0cmFRdWVyeVBhcmFtZXRlcnMgLSBLZXktdmFsdWUgcGFpcnMgdG8gcGFzcyB0byB0aGUgU1RTIGR1cmluZyB0aGUgIGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAqL1xuICBhY3F1aXJlVG9rZW5SZWRpcmVjdChyZXF1ZXN0OiBBdXRoZW50aWNhdGlvblBhcmFtZXRlcnMpOiB2b2lkIHtcbiAgICAvLyBUaHJvdyBlcnJvciBpZiBjYWxsYmFja3MgYXJlIG5vdCBzZXQgYmVmb3JlIHJlZGlyZWN0XG4gICAgaWYgKCF0aGlzLnJlZGlyZWN0Q2FsbGJhY2tzU2V0KSB7XG4gICAgICB0aHJvdyBDbGllbnRDb25maWd1cmF0aW9uRXJyb3IuY3JlYXRlUmVkaXJlY3RDYWxsYmFja3NOb3RTZXRFcnJvcigpO1xuICAgIH1cblxuICAgIC8vIFZhbGlkYXRlIGFuZCBmaWx0ZXIgc2NvcGVzICh0aGUgdmFsaWRhdGUgZnVuY3Rpb24gd2lsbCB0aHJvdyBpZiB2YWxpZGF0aW9uIGZhaWxzKVxuICAgIHRoaXMudmFsaWRhdGVJbnB1dFNjb3BlKHJlcXVlc3Quc2NvcGVzLCB0cnVlKTtcblxuICAgIC8vIEdldCB0aGUgYWNjb3VudCBvYmplY3QgaWYgYSBzZXNzaW9uIGV4aXN0c1xuICAgIGNvbnN0IGFjY291bnQ6IEFjY291bnQgPSByZXF1ZXN0LmFjY291bnQgfHwgdGhpcy5nZXRBY2NvdW50KCk7XG5cbiAgICAvLyBJZiBhbHJlYWR5IGluIHByb2dyZXNzLCBkbyBub3QgcHJvY2VlZFxuICAgIGlmICh0aGlzLmFjcXVpcmVUb2tlbkluUHJvZ3Jlc3MpIHtcbiAgICAgIHRoaXMuZXJyb3JSZWNlaXZlZENhbGxiYWNrKENsaWVudEF1dGhFcnJvci5jcmVhdGVBY3F1aXJlVG9rZW5JblByb2dyZXNzRXJyb3IoKSwgdGhpcy5nZXRBY2NvdW50U3RhdGUodGhpcy5zaWxlbnRBdXRoZW50aWNhdGlvblN0YXRlKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgbm8gc2Vzc2lvbiBleGlzdHMsIHByb21wdCB0aGUgdXNlciB0byBsb2dpbi5cbiAgICBjb25zdCBzY29wZSA9IHJlcXVlc3Quc2NvcGVzLmpvaW4oXCIgXCIpLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKCFhY2NvdW50ICYmICEocmVxdWVzdC5zaWQgIHx8IHJlcXVlc3QubG9naW5IaW50KSkge1xuICAgICAgdGhpcy5sb2dnZXIuaW5mbyhcIlVzZXIgbG9naW4gaXMgcmVxdWlyZWRcIik7XG4gICAgICB0aHJvdyBDbGllbnRBdXRoRXJyb3IuY3JlYXRlVXNlckxvZ2luUmVxdWlyZWRFcnJvcigpO1xuICAgIH1cblxuICAgIGxldCBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Q6IFNlcnZlclJlcXVlc3RQYXJhbWV0ZXJzO1xuICAgIGNvbnN0IGFjcXVpcmVUb2tlbkF1dGhvcml0eSA9IHJlcXVlc3QuYXV0aG9yaXR5ID8gQXV0aG9yaXR5RmFjdG9yeS5DcmVhdGVJbnN0YW5jZShyZXF1ZXN0LmF1dGhvcml0eSwgdGhpcy5jb25maWcuYXV0aC52YWxpZGF0ZUF1dGhvcml0eSkgOiB0aGlzLmF1dGhvcml0eUluc3RhbmNlO1xuXG4gICAgLy8gVHJhY2sgdGhlIGFjcXVpcmVUb2tlbiBwcm9ncmVzc1xuICAgIHRoaXMuYWNxdWlyZVRva2VuSW5Qcm9ncmVzcyA9IHRydWU7XG5cbiAgICBhY3F1aXJlVG9rZW5BdXRob3JpdHkucmVzb2x2ZUVuZHBvaW50c0FzeW5jKCkudGhlbigoKSA9PiB7XG4gICAgICAvLyBPbiBGdWxmaWxsbWVudFxuICAgICAgY29uc3QgcmVzcG9uc2VUeXBlID0gdGhpcy5nZXRUb2tlblR5cGUoYWNjb3VudCwgcmVxdWVzdC5zY29wZXMsIGZhbHNlKTtcbiAgICAgIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdCA9IG5ldyBTZXJ2ZXJSZXF1ZXN0UGFyYW1ldGVycyhcbiAgICAgICAgYWNxdWlyZVRva2VuQXV0aG9yaXR5LFxuICAgICAgICB0aGlzLmNsaWVudElkLFxuICAgICAgICByZXF1ZXN0LnNjb3BlcyxcbiAgICAgICAgcmVzcG9uc2VUeXBlLFxuICAgICAgICB0aGlzLmdldFJlZGlyZWN0VXJpKCksXG4gICAgICAgIHRoaXMuY29uZmlnLmF1dGguc3RhdGVcbiAgICAgICk7XG5cbiAgICAgIC8vIENhY2hlIG5vbmNlXG4gICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5ub25jZUlkVG9rZW4sIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5ub25jZSwgdGhpcy5pbkNvb2tpZSk7XG5cbiAgICAgIC8vIENhY2hlIGFjY291bnQgYW5kIGF1dGhvcml0eVxuICAgICAgdGhpcy5zZXRBY2NvdW50Q2FjaGUoYWNjb3VudCwgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlKTtcbiAgICAgIHRoaXMuc2V0QXV0aG9yaXR5Q2FjaGUoc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlLCBhY3F1aXJlVG9rZW5BdXRob3JpdHkuQ2Fub25pY2FsQXV0aG9yaXR5KTtcblxuICAgICAgLy8gcG9wdWxhdGUgUXVlcnlQYXJhbWV0ZXJzIChzaWQvbG9naW5faGludC9kb21haW5faGludCkgYW5kIGFueSBvdGhlciBleHRyYVF1ZXJ5UGFyYW1ldGVycyBzZXQgYnkgdGhlIGRldmVsb3BlclxuICAgICAgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0ID0gdGhpcy5wb3B1bGF0ZVF1ZXJ5UGFyYW1zKGFjY291bnQsIHJlcXVlc3QsIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdCk7XG5cbiAgICAgIC8vIENvbnN0cnVjdCB1cmxOYXZpZ2F0ZVxuICAgICAgbGV0IHVybE5hdmlnYXRlID0gc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LmNyZWF0ZU5hdmlnYXRlVXJsKHJlcXVlc3Quc2NvcGVzKSArIENvbnN0YW50cy5yZXNwb25zZV9tb2RlX2ZyYWdtZW50O1xuXG4gICAgICAvLyBzZXQgc3RhdGUgaW4gY2FjaGUgYW5kIHJlZGlyZWN0IHRvIHVybE5hdmlnYXRlXG4gICAgICBpZiAodXJsTmF2aWdhdGUpIHtcbiAgICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMuc3RhdGVBY3F1aXJlVG9rZW4sIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSwgdGhpcy5pbkNvb2tpZSk7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKHVybE5hdmlnYXRlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlIHJlZGlyZWN0IHJlc3BvbnNlIGlzIHJlY2VpdmVkIGZyb20gdGhlIFNUUy4gSW4gY2FzZSBvZiByZWRpcmVjdCwgdGhlIHVybCBmcmFnbWVudCBoYXMgZWl0aGVyIGlkX3Rva2VuLCBhY2Nlc3NfdG9rZW4gb3IgZXJyb3IuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBoYXNoIC0gSGFzaCBwYXNzZWQgZnJvbSByZWRpcmVjdCBwYWdlLlxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gLSB0cnVlIGlmIHJlc3BvbnNlIGNvbnRhaW5zIGlkX3Rva2VuLCBhY2Nlc3NfdG9rZW4gb3IgZXJyb3IsIGZhbHNlIG90aGVyd2lzZS5cbiAgICogQGhpZGRlblxuICAgKi9cbiAgLy8gVE9ETyAtIHJlbmFtZSB0aGlzLCB0aGUgbmFtZSBpcyBjb25mdXNpbmdcbiAgaXNDYWxsYmFjayhoYXNoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBoYXNoID0gdGhpcy5nZXRIYXNoKGhhc2gpO1xuICAgIGNvbnN0IHBhcmFtZXRlcnMgPSBVdGlscy5kZXNlcmlhbGl6ZShoYXNoKTtcbiAgICByZXR1cm4gKFxuICAgICAgcGFyYW1ldGVycy5oYXNPd25Qcm9wZXJ0eShDb25zdGFudHMuZXJyb3JEZXNjcmlwdGlvbikgfHxcbiAgICAgIHBhcmFtZXRlcnMuaGFzT3duUHJvcGVydHkoQ29uc3RhbnRzLmVycm9yKSB8fFxuICAgICAgcGFyYW1ldGVycy5oYXNPd25Qcm9wZXJ0eShDb25zdGFudHMuYWNjZXNzVG9rZW4pIHx8XG4gICAgICBwYXJhbWV0ZXJzLmhhc093blByb3BlcnR5KENvbnN0YW50cy5pZFRva2VuKVxuXG4gICAgKTtcbiAgfVxuXG4gIC8vI2VuZHJlZ2lvblxuXG4gIC8vI3JlZ2lvbiBQb3B1cCBGbG93XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIHRoZSBsb2dpbiBwcm9jZXNzIGJ5IG9wZW5pbmcgYSBwb3B1cCB3aW5kb3cuXG4gICAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IHNjb3BlcyAtIFBlcm1pc3Npb25zIHlvdSB3YW50IGluY2x1ZGVkIGluIHRoZSBhY2Nlc3MgdG9rZW4uIE5vdCBhbGwgc2NvcGVzIGFyZSAgZ3VhcmFudGVlZCB0byBiZSBpbmNsdWRlZCBpbiB0aGUgYWNjZXNzIHRva2VuIHJldHVybmVkLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXh0cmFRdWVyeVBhcmFtZXRlcnMgLSBLZXktdmFsdWUgcGFpcnMgdG8gcGFzcyB0byB0aGUgU1RTIGR1cmluZyB0aGUgaW50ZXJhY3RpdmUgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICogQHJldHVybnMge1Byb21pc2UuPHN0cmluZz59IC0gQSBQcm9taXNlIHRoYXQgaXMgZnVsZmlsbGVkIHdoZW4gdGhpcyBmdW5jdGlvbiBoYXMgY29tcGxldGVkLCBvciByZWplY3RlZCBpZiBhbiBlcnJvciB3YXMgcmFpc2VkLiBSZXR1cm5zIHRoZSB0b2tlbiBvciBlcnJvci5cbiAgICovXG4gIGxvZ2luUG9wdXAocmVxdWVzdD86IEF1dGhlbnRpY2F0aW9uUGFyYW1ldGVycyk6IFByb21pc2U8QXV0aFJlc3BvbnNlPiB7XG4gICAgLy8gQ3JlYXRlcyBuYXZpZ2F0ZSB1cmw7IHNhdmVzIHZhbHVlIGluIGNhY2hlOyByZWRpcmVjdCB1c2VyIHRvIEFBRFxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxBdXRoUmVzcG9uc2U+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIC8vIEZhaWwgaWYgbG9naW4gaXMgYWxyZWFkeSBpbiBwcm9ncmVzc1xuICAgICAgaWYgKHRoaXMubG9naW5JblByb2dyZXNzKSB7XG4gICAgICAgIHJldHVybiByZWplY3QoQ2xpZW50QXV0aEVycm9yLmNyZWF0ZUxvZ2luSW5Qcm9ncmVzc0Vycm9yKCkpO1xuICAgICAgfVxuXG4gICAgICAvLyBpZiBleHRyYVNjb3Blc1RvQ29uc2VudCBpcyBwYXNzZWQsIGFwcGVuZCB0aGVtIHRvIHRoZSBsb2dpbiByZXF1ZXN0XG4gICAgICBsZXQgc2NvcGVzOiBBcnJheTxzdHJpbmc+ID0gdGhpcy5hcHBlbmRTY29wZXMocmVxdWVzdCk7XG5cbiAgICAgIC8vIFZhbGlkYXRlIGFuZCBmaWx0ZXIgc2NvcGVzICh0aGUgdmFsaWRhdGUgZnVuY3Rpb24gd2lsbCB0aHJvdyBpZiB2YWxpZGF0aW9uIGZhaWxzKVxuICAgICAgdGhpcy52YWxpZGF0ZUlucHV0U2NvcGUoc2NvcGVzLCBmYWxzZSk7XG5cbiAgICAgIGxldCBhY2NvdW50ID0gdGhpcy5nZXRBY2NvdW50KCk7XG5cbiAgICAgLy8gYWRkIHRoZSBwcm9tcHQgcGFyYW1ldGVyIHRvIHRoZSAnZXh0cmFRdWVyeVBhcmFtZXRlcnMnIGlmIHBhc3NlZFxuICAgICAgaWYgKFV0aWxzLmlzU1NPUGFyYW0ocmVxdWVzdCkpIHtcbiAgICAgICAgIC8vIGlmIGFjY291bnQgaXMgbm90IHByb3ZpZGVkLCB3ZSBwYXNzIG51bGxcbiAgICAgICAgIHRoaXMubG9naW5Qb3B1cEhlbHBlcihhY2NvdW50LCByZXF1ZXN0LCByZXNvbHZlLCByZWplY3QsIHNjb3Blcyk7XG4gICAgICB9XG4gICAgICAvLyBlbHNlIGhhbmRsZSB0aGUgbGlicmFyeSBkYXRhXG4gICAgICBlbHNlIHtcbiAgICAgICAgLy8gRXh0cmFjdCBBREFMIGlkX3Rva2VuIGlmIGl0IGV4aXN0c1xuICAgICAgICBsZXQgYWRhbElkVG9rZW4gPSB0aGlzLmV4dHJhY3RBREFMSWRUb2tlbigpO1xuXG4gICAgICAgIC8vIHNpbGVudCBsb2dpbiBpZiBBREFMIGlkX3Rva2VuIGlzIHJldHJpZXZlZCBzdWNjZXNzZnVsbHkgLSBTU09cbiAgICAgICAgaWYgKGFkYWxJZFRva2VuICYmICFzY29wZXMpIHtcbiAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKFwiQURBTCdzIGlkVG9rZW4gZXhpc3RzLiBFeHRyYWN0aW5nIGxvZ2luIGluZm9ybWF0aW9uIGZyb20gQURBTCdzIGlkVG9rZW4gXCIpO1xuICAgICAgICAgIGxldCB0b2tlblJlcXVlc3Q6IEF1dGhlbnRpY2F0aW9uUGFyYW1ldGVycyA9IHRoaXMuYnVpbGRJRFRva2VuUmVxdWVzdChyZXF1ZXN0KTtcblxuICAgICAgICAgIHRoaXMuc2lsZW50TG9naW4gPSB0cnVlO1xuICAgICAgICAgIHRoaXMuYWNxdWlyZVRva2VuU2lsZW50KHRva2VuUmVxdWVzdClcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgdGhpcy5zaWxlbnRMb2dpbiA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIuaW5mbyhcIlVuaWZpZWQgY2FjaGUgY2FsbCBpcyBzdWNjZXNzZnVsXCIpO1xuXG4gICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICB9LCAoZXJyb3IpID0+IHtcblxuICAgICAgICAgICAgdGhpcy5zaWxlbnRMb2dpbiA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoXCJFcnJvciBvY2N1cnJlZCBkdXJpbmcgdW5pZmllZCBjYWNoZSBBVFNcIik7XG4gICAgICAgICAgICB0aGlzLmxvZ2luUG9wdXBIZWxwZXIobnVsbCwgcmVxdWVzdCwgcmVzb2x2ZSwgcmVqZWN0LCBzY29wZXMpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIGVsc2UgcHJvY2VlZCB3aXRoIGxvZ2luXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHRoaXMubG9naW5Qb3B1cEhlbHBlcihudWxsLCByZXF1ZXN0LCByZXNvbHZlLCByZWplY3QsIHNjb3BlcyApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHRvIGxvZ2luUG9wdXBcbiAgICpcbiAgICogQGhpZGRlblxuICAgKiBAcGFyYW0gcmVzb2x2ZVxuICAgKiBAcGFyYW0gcmVqZWN0XG4gICAqIEBwYXJhbSBzY29wZXNcbiAgICogQHBhcmFtIGV4dHJhUXVlcnlQYXJhbWV0ZXJzXG4gICAqL1xuICBwcml2YXRlIGxvZ2luUG9wdXBIZWxwZXIoYWNjb3VudDogQWNjb3VudCwgcmVxdWVzdDogQXV0aGVudGljYXRpb25QYXJhbWV0ZXJzLCByZXNvbHZlOiBhbnksIHJlamVjdDogYW55LCBzY29wZXM/OiBBcnJheTxzdHJpbmc+KSB7XG4gICAgaWYgKCFzY29wZXMpIHtcbiAgICAgIHNjb3BlcyA9IFt0aGlzLmNsaWVudElkXTtcbiAgICB9XG4gICAgY29uc3Qgc2NvcGUgPSBzY29wZXMuam9pbihcIiBcIikudG9Mb3dlckNhc2UoKTtcblxuICAgIC8vIEdlbmVyYXRlIGEgcG9wdXAgd2luZG93XG4gICAgY29uc3QgcG9wVXBXaW5kb3cgPSB0aGlzLm9wZW5XaW5kb3coXCJhYm91dDpibGFua1wiLCBcIl9ibGFua1wiLCAxLCB0aGlzLCByZXNvbHZlLCByZWplY3QpO1xuICAgIGlmICghcG9wVXBXaW5kb3cpIHtcbiAgICAgIC8vIFdlIHBhc3MgcmVqZWN0IGluIG9wZW5XaW5kb3csIHdlIHJlamVjdCB0aGVyZSBkdXJpbmcgYW4gZXJyb3JcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBUcmFjayBsb2dpbiBwcm9ncmVzc1xuICAgIHRoaXMubG9naW5JblByb2dyZXNzID0gdHJ1ZTtcblxuICAgIC8vIFJlc29sdmUgZW5kcG9pbnRcbiAgICB0aGlzLmF1dGhvcml0eUluc3RhbmNlLnJlc29sdmVFbmRwb2ludHNBc3luYygpLnRoZW4oKCkgPT4ge1xuICAgICAgbGV0IHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdCA9IG5ldyBTZXJ2ZXJSZXF1ZXN0UGFyYW1ldGVycyh0aGlzLmF1dGhvcml0eUluc3RhbmNlLCB0aGlzLmNsaWVudElkLCBzY29wZXMsIFJlc3BvbnNlVHlwZXMuaWRfdG9rZW4sIHRoaXMuZ2V0UmVkaXJlY3RVcmkoKSwgdGhpcy5jb25maWcuYXV0aC5zdGF0ZSk7XG5cbiAgICAgIC8vIHBvcHVsYXRlIFF1ZXJ5UGFyYW1ldGVycyAoc2lkL2xvZ2luX2hpbnQvZG9tYWluX2hpbnQpIGFuZCBhbnkgb3RoZXIgZXh0cmFRdWVyeVBhcmFtZXRlcnMgc2V0IGJ5IHRoZSBkZXZlbG9wZXI7XG4gICAgICBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QgPSB0aGlzLnBvcHVsYXRlUXVlcnlQYXJhbXMoYWNjb3VudCwgcmVxdWVzdCwgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0KTtcblxuICAgICAgLy8gQ2FjaGUgdGhlIHN0YXRlLCBub25jZSwgYW5kIGxvZ2luIHJlcXVlc3QgZGF0YVxuICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubG9naW5SZXF1ZXN0LCB3aW5kb3cubG9jYXRpb24uaHJlZiwgdGhpcy5pbkNvb2tpZSk7XG4gICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5sb2dpbkVycm9yLCBcIlwiKTtcblxuICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubm9uY2VJZFRva2VuLCBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Qubm9uY2UsIHRoaXMuaW5Db29raWUpO1xuXG4gICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsRXJyb3IsIFwiXCIpO1xuICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbEVycm9yRGVzY3JpcHRpb24sIFwiXCIpO1xuXG4gICAgICAvLyBjYWNoZSBhdXRob3JpdHlLZXlcbiAgICAgIHRoaXMuc2V0QXV0aG9yaXR5Q2FjaGUoc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlLCB0aGlzLmF1dGhvcml0eSk7XG5cbiAgICAgIC8vIEJ1aWxkIHRoZSBVUkwgdG8gbmF2aWdhdGUgdG8gaW4gdGhlIHBvcHVwIHdpbmRvd1xuICAgICAgbGV0IHVybE5hdmlnYXRlID0gc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LmNyZWF0ZU5hdmlnYXRlVXJsKHNjb3BlcykgICsgQ29uc3RhbnRzLnJlc3BvbnNlX21vZGVfZnJhZ21lbnQ7XG5cbiAgICAgIHdpbmRvdy5yZW5ld1N0YXRlcy5wdXNoKHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSk7XG4gICAgICB3aW5kb3cucmVxdWVzdFR5cGUgPSBDb25zdGFudHMubG9naW47XG5cbiAgICAgIC8vIFJlZ2lzdGVyIGNhbGxiYWNrIHRvIGNhcHR1cmUgcmVzdWx0cyBmcm9tIHNlcnZlclxuICAgICAgdGhpcy5yZWdpc3RlckNhbGxiYWNrKHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSwgc2NvcGUsIHJlc29sdmUsIHJlamVjdCk7XG5cbiAgICAgIC8vIE5hdmlnYXRlIHVybCBpbiBwb3B1cFdpbmRvd1xuICAgICAgaWYgKHBvcFVwV2luZG93KSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm9QaWkoXCJOYXZpZ2F0ZWQgUG9wdXAgd2luZG93IHRvOlwiICsgdXJsTmF2aWdhdGUpO1xuICAgICAgICBwb3BVcFdpbmRvdy5sb2NhdGlvbi5ocmVmID0gdXJsTmF2aWdhdGU7XG4gICAgICB9XG4gICAgfSwgKCkgPT4ge1xuICAgICAgLy8gRW5kcG9pbnQgcmVzb2x1dGlvbiBmYWlsdXJlIGVycm9yXG4gICAgICB0aGlzLmxvZ2dlci5pbmZvKEVycm9yQ29kZXMuZW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IgKyBcIjpcIiArIEVycm9yRGVzY3JpcHRpb24uZW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IpO1xuICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbEVycm9yLCBFcnJvckNvZGVzLmVuZHBvaW50UmVzb2x1dGlvbkVycm9yKTtcbiAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLm1zYWxFcnJvckRlc2NyaXB0aW9uLCBFcnJvckRlc2NyaXB0aW9uLmVuZHBvaW50UmVzb2x1dGlvbkVycm9yKTtcblxuICAgICAgLy8gV2hhdCBpcyB0aGlzPyBJcyB0aGlzIHRoZSByZWplY3QgdGhhdCBpcyBwYXNzZWQgaW4/PyAtLSBSRURPIHRoaXMgaW4gdGhlIHN1YnNlcXVlbnQgcmVmYWN0b3IsIHBhc3NpbmcgcmVqZWN0IGlzIGNvbmZ1c2luZ1xuICAgICAgaWYgKHJlamVjdCkge1xuICAgICAgICByZWplY3QoQ2xpZW50QXV0aEVycm9yLmNyZWF0ZUVuZHBvaW50UmVzb2x1dGlvbkVycm9yKCkpO1xuICAgICAgfVxuXG4gICAgICAvLyBDbG9zZSB0aGUgcG9wdXAgd2luZG93XG4gICAgICBpZiAocG9wVXBXaW5kb3cpIHtcbiAgICAgICAgcG9wVXBXaW5kb3cuY2xvc2UoKTtcbiAgICAgIH1cbiAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAvLyBBbGwgY2F0Y2ggLSB3aGVuIGlzIHRoaXMgZXhlY3V0ZWQ/IFBvc3NpYmx5IHdoZW4gZXJyb3IgaXMgdGhyb3duLCBidXQgbm90IGlmIHByZXZpb3VzIGZ1bmN0aW9uIHJlamVjdHMgaW5zdGVhZCBvZiB0aHJvd2luZ1xuICAgICAgdGhpcy5sb2dnZXIud2FybmluZyhcImNvdWxkIG5vdCByZXNvbHZlIGVuZHBvaW50c1wiKTtcbiAgICAgIHJlamVjdChDbGllbnRBdXRoRXJyb3IuY3JlYXRlRW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IoZXJyLnRvU3RyaW5nKSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXNlZCB0byBhY3F1aXJlIGFuIGFjY2VzcyB0b2tlbiBmb3IgYSBuZXcgdXNlciB1c2luZyBpbnRlcmFjdGl2ZSBhdXRoZW50aWNhdGlvbiB2aWEgYSBwb3B1cCBXaW5kb3cuXG4gICAqIFRvIHJlcXVlc3QgYW4gaWRfdG9rZW4sIHBhc3MgdGhlIGNsaWVudElkIGFzIHRoZSBvbmx5IHNjb3BlIGluIHRoZSBzY29wZXMgYXJyYXkuXG4gICAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nPn0gc2NvcGVzIC0gUGVybWlzc2lvbnMgeW91IHdhbnQgaW5jbHVkZWQgaW4gdGhlIGFjY2VzcyB0b2tlbi4gTm90IGFsbCBzY29wZXMgYXJlICBndWFyYW50ZWVkIHRvIGJlIGluY2x1ZGVkIGluIHRoZSBhY2Nlc3MgdG9rZW4uIFNjb3BlcyBsaWtlIFwib3BlbmlkXCIgYW5kIFwicHJvZmlsZVwiIGFyZSBzZW50IHdpdGggZXZlcnkgcmVxdWVzdC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGF1dGhvcml0eSAtIEEgVVJMIGluZGljYXRpbmcgYSBkaXJlY3RvcnkgdGhhdCBNU0FMIGNhbiB1c2UgdG8gb2J0YWluIHRva2Vucy5cbiAgICogLSBJbiBBenVyZSBBRCwgaXQgaXMgb2YgdGhlIGZvcm0gaHR0cHM6Ly8mbHQ7dGVuYW50Jmd0Oy8mbHQ7dGVuYW50Jmd0Oywgd2hlcmUgJmx0O3RlbmFudCZndDsgaXMgdGhlIGRpcmVjdG9yeSBob3N0IChlLmcuIGh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbSkgYW5kICZsdDt0ZW5hbnQmZ3Q7IGlzIGEgaWRlbnRpZmllciB3aXRoaW4gdGhlIGRpcmVjdG9yeSBpdHNlbGYgKGUuZy4gYSBkb21haW4gYXNzb2NpYXRlZCB0byB0aGUgdGVuYW50LCBzdWNoIGFzIGNvbnRvc28ub25taWNyb3NvZnQuY29tLCBvciB0aGUgR1VJRCByZXByZXNlbnRpbmcgdGhlIFRlbmFudElEIHByb3BlcnR5IG9mIHRoZSBkaXJlY3RvcnkpXG4gICAqIC0gSW4gQXp1cmUgQjJDLCBpdCBpcyBvZiB0aGUgZm9ybSBodHRwczovLyZsdDtpbnN0YW5jZSZndDsvdGZwLyZsdDt0ZW5hbnQmZ3Q7Lzxwb2xpY3lOYW1lPi9cbiAgICogLSBEZWZhdWx0IHZhbHVlIGlzOiBcImh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbS9jb21tb25cIi5cbiAgICogQHBhcmFtIHtBY2NvdW50fSBhY2NvdW50IC0gVGhlIGFjY291bnQgZm9yIHdoaWNoIHRoZSBzY29wZXMgYXJlIHJlcXVlc3RlZC5UaGUgZGVmYXVsdCBhY2NvdW50IGlzIHRoZSBsb2dnZWQgaW4gYWNjb3VudC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGV4dHJhUXVlcnlQYXJhbWV0ZXJzIC0gS2V5LXZhbHVlIHBhaXJzIHRvIHBhc3MgdG8gdGhlIFNUUyBkdXJpbmcgdGhlICBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZS48c3RyaW5nPn0gLSBBIFByb21pc2UgdGhhdCBpcyBmdWxmaWxsZWQgd2hlbiB0aGlzIGZ1bmN0aW9uIGhhcyBjb21wbGV0ZWQsIG9yIHJlamVjdGVkIGlmIGFuIGVycm9yIHdhcyByYWlzZWQuIFJldHVybnMgdGhlIHRva2VuIG9yIGVycm9yLlxuICAgKi9cbiAgYWNxdWlyZVRva2VuUG9wdXAocmVxdWVzdDogQXV0aGVudGljYXRpb25QYXJhbWV0ZXJzKTogUHJvbWlzZTxBdXRoUmVzcG9uc2U+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2U8QXV0aFJlc3BvbnNlPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAvLyBWYWxpZGF0ZSBhbmQgZmlsdGVyIHNjb3BlcyAodGhlIHZhbGlkYXRlIGZ1bmN0aW9uIHdpbGwgdGhyb3cgaWYgdmFsaWRhdGlvbiBmYWlscylcbiAgICAgIHRoaXMudmFsaWRhdGVJbnB1dFNjb3BlKHJlcXVlc3Quc2NvcGVzLCB0cnVlKTtcblxuICAgICAgY29uc3Qgc2NvcGUgPSByZXF1ZXN0LnNjb3Blcy5qb2luKFwiIFwiKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAvLyBHZXQgdGhlIGFjY291bnQgb2JqZWN0IGlmIGEgc2Vzc2lvbiBleGlzdHNcbiAgICAgIGNvbnN0IGFjY291bnQ6IEFjY291bnQgPSByZXF1ZXN0LmFjY291bnQgfHwgdGhpcy5nZXRBY2NvdW50KCk7XG5cbiAgICAgIC8vIElmIGFscmVhZHkgaW4gcHJvZ3Jlc3MsIHRocm93IGFuIGVycm9yIGFuZCByZWplY3QgdGhlIHJlcXVlc3RcbiAgICAgIGlmICh0aGlzLmFjcXVpcmVUb2tlbkluUHJvZ3Jlc3MpIHtcbiAgICAgICAgcmV0dXJuIHJlamVjdChDbGllbnRBdXRoRXJyb3IuY3JlYXRlQWNxdWlyZVRva2VuSW5Qcm9ncmVzc0Vycm9yKCkpO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiBubyBzZXNzaW9uIGV4aXN0cywgcHJvbXB0IHRoZSB1c2VyIHRvIGxvZ2luLlxuICAgICAgaWYgKCFhY2NvdW50ICYmICEhKHJlcXVlc3Quc2lkICB8fCByZXF1ZXN0LmxvZ2luSGludCkpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbyhcIlVzZXIgbG9naW4gaXMgcmVxdWlyZWRcIik7XG4gICAgICAgIHJldHVybiByZWplY3QoQ2xpZW50QXV0aEVycm9yLmNyZWF0ZVVzZXJMb2dpblJlcXVpcmVkRXJyb3IoKSk7XG4gICAgICB9XG5cbiAgICAgIC8vIHRyYWNrIHRoZSBhY3F1aXJlVG9rZW4gcHJvZ3Jlc3NcbiAgICAgIHRoaXMuYWNxdWlyZVRva2VuSW5Qcm9ncmVzcyA9IHRydWU7XG5cbiAgICAgIGxldCBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Q6IFNlcnZlclJlcXVlc3RQYXJhbWV0ZXJzO1xuICAgICAgY29uc3QgYWNxdWlyZVRva2VuQXV0aG9yaXR5ID0gcmVxdWVzdC5hdXRob3JpdHkgPyBBdXRob3JpdHlGYWN0b3J5LkNyZWF0ZUluc3RhbmNlKHJlcXVlc3QuYXV0aG9yaXR5LCB0aGlzLmNvbmZpZy5hdXRoLnZhbGlkYXRlQXV0aG9yaXR5KSA6IHRoaXMuYXV0aG9yaXR5SW5zdGFuY2U7XG5cbiAgICAgIC8vIE9wZW4gdGhlIHBvcHVwIHdpbmRvd1xuICAgICAgY29uc3QgcG9wVXBXaW5kb3cgPSB0aGlzLm9wZW5XaW5kb3coXCJhYm91dDpibGFua1wiLCBcIl9ibGFua1wiLCAxLCB0aGlzLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgaWYgKCFwb3BVcFdpbmRvdykge1xuICAgICAgICAvLyBXZSBwYXNzIHJlamVjdCB0byBvcGVuV2luZG93LCBzbyB3ZSBhcmUgcmVqZWN0aW5nIHRoZXJlLlxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGFjcXVpcmVUb2tlbkF1dGhvcml0eS5yZXNvbHZlRW5kcG9pbnRzQXN5bmMoKS50aGVuKCgpID0+IHtcbiAgICAgICAgLy8gT24gZnVsbGZpbGxtZW50XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlVHlwZSA9IHRoaXMuZ2V0VG9rZW5UeXBlKGFjY291bnQsIHJlcXVlc3Quc2NvcGVzLCBmYWxzZSk7XG4gICAgICAgIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdCA9IG5ldyBTZXJ2ZXJSZXF1ZXN0UGFyYW1ldGVycyhcbiAgICAgICAgICBhY3F1aXJlVG9rZW5BdXRob3JpdHksXG4gICAgICAgICAgdGhpcy5jbGllbnRJZCxcbiAgICAgICAgICByZXF1ZXN0LnNjb3BlcyxcbiAgICAgICAgICByZXNwb25zZVR5cGUsXG4gICAgICAgICAgdGhpcy5nZXRSZWRpcmVjdFVyaSgpLFxuICAgICAgICAgIHRoaXMuY29uZmlnLmF1dGguc3RhdGVcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBwb3B1bGF0ZSBRdWVyeVBhcmFtZXRlcnMgKHNpZC9sb2dpbl9oaW50L2RvbWFpbl9oaW50KSBhbmQgYW55IG90aGVyIGV4dHJhUXVlcnlQYXJhbWV0ZXJzIHNldCBieSB0aGUgZGV2ZWxvcGVyXG4gICAgICAgIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdCA9IHRoaXMucG9wdWxhdGVRdWVyeVBhcmFtcyhhY2NvdW50LCByZXF1ZXN0LCBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QpO1xuXG4gICAgICAgIC8vIENhY2hlIG5vbmNlXG4gICAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLm5vbmNlSWRUb2tlbiwgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0Lm5vbmNlLCB0aGlzLmluQ29va2llKTtcbiAgICAgICAgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlID0gc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlO1xuXG4gICAgICAgIC8vIENhY2hlIGFjY291bnQgYW5kIGF1dGhvcml0eVxuICAgICAgICB0aGlzLnNldEFjY291bnRDYWNoZShhY2NvdW50LCBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGUpO1xuICAgICAgICB0aGlzLnNldEF1dGhvcml0eUNhY2hlKHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSwgYWNxdWlyZVRva2VuQXV0aG9yaXR5LkNhbm9uaWNhbEF1dGhvcml0eSk7XG5cbiAgICAgICAgLy8gQ29uc3RydWN0IHRoZSB1cmxOYXZpZ2F0ZVxuICAgICAgICBsZXQgdXJsTmF2aWdhdGUgPSBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QuY3JlYXRlTmF2aWdhdGVVcmwocmVxdWVzdC5zY29wZXMpICsgQ29uc3RhbnRzLnJlc3BvbnNlX21vZGVfZnJhZ21lbnQ7XG5cbiAgICAgICAgd2luZG93LnJlbmV3U3RhdGVzLnB1c2goc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlKTtcbiAgICAgICAgd2luZG93LnJlcXVlc3RUeXBlID0gQ29uc3RhbnRzLnJlbmV3VG9rZW47XG4gICAgICAgIHRoaXMucmVnaXN0ZXJDYWxsYmFjayhzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGUsIHNjb3BlLCByZXNvbHZlLCByZWplY3QpO1xuXG4gICAgICAgIC8vIG9wZW4gcG9wdXAgd2luZG93IHRvIHVybE5hdmlnYXRlXG4gICAgICAgIGlmIChwb3BVcFdpbmRvdykge1xuICAgICAgICAgIHBvcFVwV2luZG93LmxvY2F0aW9uLmhyZWYgPSB1cmxOYXZpZ2F0ZTtcbiAgICAgICAgfVxuXG4gICAgICB9LCAoKSA9PiB7XG4gICAgICAgIC8vIE9uIHJlamVjdGlvblxuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKEVycm9yQ29kZXMuZW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IgKyBcIjpcIiArIEVycm9yRGVzY3JpcHRpb24uZW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IpO1xuICAgICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsRXJyb3IsIEVycm9yQ29kZXMuZW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IpO1xuICAgICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsRXJyb3JEZXNjcmlwdGlvbiwgRXJyb3JEZXNjcmlwdGlvbi5lbmRwb2ludFJlc29sdXRpb25FcnJvcik7XG5cbiAgICAgICAgaWYgKHJlamVjdCkge1xuICAgICAgICAgIHJlamVjdChDbGllbnRBdXRoRXJyb3IuY3JlYXRlRW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IoKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBvcFVwV2luZG93KSB7XG4gICAgICAgICAgICBwb3BVcFdpbmRvdy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm5pbmcoXCJjb3VsZCBub3QgcmVzb2x2ZSBlbmRwb2ludHNcIik7XG4gICAgICAgIHJlamVjdChDbGllbnRBdXRoRXJyb3IuY3JlYXRlRW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IoZXJyLnRvU3RyaW5nKCkpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gc2VuZCB0aGUgdXNlciB0byB0aGUgcmVkaXJlY3RfdXJpIGFmdGVyIGF1dGhlbnRpY2F0aW9uIGlzIGNvbXBsZXRlLiBUaGUgdXNlcidzIGJlYXJlciB0b2tlbiBpcyBhdHRhY2hlZCB0byB0aGUgVVJJIGZyYWdtZW50IGFzIGFuIGlkX3Rva2VuL2FjY2Vzc190b2tlbiBmaWVsZC5cbiAgICogVGhpcyBmdW5jdGlvbiBhbHNvIGNsb3NlcyB0aGUgcG9wdXAgd2luZG93IGFmdGVyIHJlZGlyZWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdXJsTmF2aWdhdGVcbiAgICogQHBhcmFtIHRpdGxlXG4gICAqIEBwYXJhbSBpbnRlcnZhbFxuICAgKiBAcGFyYW0gaW5zdGFuY2VcbiAgICogQHBhcmFtIHJlc29sdmVcbiAgICogQHBhcmFtIHJlamVjdFxuICAgKiBAaGlkZGVuXG4gICAqIEBpZ25vcmVcbiAgICovXG4gIHByaXZhdGUgb3BlbldpbmRvdyh1cmxOYXZpZ2F0ZTogc3RyaW5nLCB0aXRsZTogc3RyaW5nLCBpbnRlcnZhbDogbnVtYmVyLCBpbnN0YW5jZTogdGhpcywgcmVzb2x2ZT86IEZ1bmN0aW9uLCByZWplY3Q/OiBGdW5jdGlvbik6IFdpbmRvdyB7XG4gICAgLy8gR2VuZXJhdGUgYSBwb3B1cCB3aW5kb3dcbiAgICB2YXIgcG9wdXBXaW5kb3c6IFdpbmRvdztcbiAgICB0cnkge1xuICAgICAgcG9wdXBXaW5kb3cgPSB0aGlzLm9wZW5Qb3B1cCh1cmxOYXZpZ2F0ZSwgdGl0bGUsIENvbnN0YW50cy5wb3BVcFdpZHRoLCBDb25zdGFudHMucG9wVXBIZWlnaHQpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGluc3RhbmNlLmxvZ2luSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgICAgaW5zdGFuY2UuYWNxdWlyZVRva2VuSW5Qcm9ncmVzcyA9IGZhbHNlO1xuXG4gICAgICB0aGlzLmxvZ2dlci5pbmZvKEVycm9yQ29kZXMucG9wVXBXaW5kb3dFcnJvciArIFwiOlwiICsgRXJyb3JEZXNjcmlwdGlvbi5wb3BVcFdpbmRvd0Vycm9yKTtcbiAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLm1zYWxFcnJvciwgRXJyb3JDb2Rlcy5wb3BVcFdpbmRvd0Vycm9yKTtcbiAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLm1zYWxFcnJvckRlc2NyaXB0aW9uLCBFcnJvckRlc2NyaXB0aW9uLnBvcFVwV2luZG93RXJyb3IpO1xuICAgICAgaWYgKHJlamVjdCkge1xuICAgICAgICByZWplY3QoQ2xpZW50QXV0aEVycm9yLmNyZWF0ZVBvcHVwV2luZG93RXJyb3IoKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBQdXNoIHBvcHVwIHdpbmRvdyBoYW5kbGUgb250byBzdGFjayBmb3IgdHJhY2tpbmdcbiAgICB3aW5kb3cub3BlbmVkV2luZG93cy5wdXNoKHBvcHVwV2luZG93KTtcblxuICAgIGNvbnN0IHBvbGxUaW1lciA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAvLyBJZiBwb3B1cCBjbG9zZWQgb3IgbG9naW4gaW4gcHJvZ3Jlc3MsIGNhbmNlbCBsb2dpblxuICAgICAgaWYgKHBvcHVwV2luZG93ICYmIHBvcHVwV2luZG93LmNsb3NlZCAmJiBpbnN0YW5jZS5sb2dpbkluUHJvZ3Jlc3MpIHtcbiAgICAgICAgaWYgKHJlamVjdCkge1xuICAgICAgICAgIHJlamVjdChDbGllbnRBdXRoRXJyb3IuY3JlYXRlVXNlckNhbmNlbGxlZEVycm9yKCkpO1xuICAgICAgICB9XG4gICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKHBvbGxUaW1lcik7XG4gICAgICAgIGlmICh0aGlzLmNvbmZpZy5mcmFtZXdvcmsuaXNBbmd1bGFyKSB7XG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdChcIm1zYWw6cG9wVXBDbG9zZWRcIiwgRXJyb3JDb2Rlcy51c2VyQ2FuY2VsbGVkRXJyb3IgKyBDb25zdGFudHMucmVzb3VyY2VEZWxpbWl0ZXIgKyBFcnJvckRlc2NyaXB0aW9uLnVzZXJDYW5jZWxsZWRFcnJvcik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaW5zdGFuY2UubG9naW5JblByb2dyZXNzID0gZmFsc2U7XG4gICAgICAgIGluc3RhbmNlLmFjcXVpcmVUb2tlbkluUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcG9wVXBXaW5kb3dMb2NhdGlvbiA9IHBvcHVwV2luZG93LmxvY2F0aW9uO1xuXG4gICAgICAgIC8vIElmIHRoZSBwb3B1cCBoYXNoIGNoYW5nZXMsIGNsb3NlIHRoZSBwb3B1cCB3aW5kb3dcbiAgICAgICAgaWYgKHBvcFVwV2luZG93TG9jYXRpb24uaHJlZi5pbmRleE9mKHRoaXMuZ2V0UmVkaXJlY3RVcmkoKSkgIT09IC0xKSB7XG4gICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwocG9sbFRpbWVyKTtcbiAgICAgICAgICBpbnN0YW5jZS5sb2dpbkluUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICAgICAgICBpbnN0YW5jZS5hY3F1aXJlVG9rZW5JblByb2dyZXNzID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy5sb2dnZXIuaW5mbyhcIkNsb3NpbmcgcG9wdXAgd2luZG93XCIpO1xuICAgICAgICAgIC8vIFRPRE86IENoZWNrIGhvdyB0aGlzIGNhbiBiZSBleHRyYWN0ZWQgZm9yIGFueSBmcmFtZXdvcmsgc3BlY2lmaWMgY29kZT9cbiAgICAgICAgICBpZiAodGhpcy5jb25maWcuZnJhbWV3b3JrLmlzQW5ndWxhcikge1xuICAgICAgICAgICAgICB0aGlzLmJyb2FkY2FzdChcIm1zYWw6cG9wVXBIYXNoQ2hhbmdlZFwiLCBwb3BVcFdpbmRvd0xvY2F0aW9uLmhhc2gpO1xuICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHdpbmRvdy5vcGVuZWRXaW5kb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICB3aW5kb3cub3BlbmVkV2luZG93c1tpXS5jbG9zZSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIENyb3NzIERvbWFpbiB1cmwgY2hlY2sgZXJyb3IuXG4gICAgICAgIC8vIFdpbGwgYmUgdGhyb3duIHVudGlsIEFBRCByZWRpcmVjdHMgdGhlIHVzZXIgYmFjayB0byB0aGUgYXBwXCJzIHJvb3QgcGFnZSB3aXRoIHRoZSB0b2tlbi5cbiAgICAgICAgLy8gTm8gbmVlZCB0byBsb2cgb3IgdGhyb3cgdGhpcyBlcnJvciBhcyBpdCB3aWxsIGNyZWF0ZSB1bm5lY2Vzc2FyeSB0cmFmZmljLlxuICAgICAgfVxuICAgIH0sXG4gICAgaW50ZXJ2YWwpO1xuXG4gICAgcmV0dXJuIHBvcHVwV2luZG93O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgcG9wdXAgd2luZG93IGZvciBsb2dpbi5cbiAgICpcbiAgICogQHBhcmFtIHVybE5hdmlnYXRlXG4gICAqIEBwYXJhbSB0aXRsZVxuICAgKiBAcGFyYW0gcG9wVXBXaWR0aFxuICAgKiBAcGFyYW0gcG9wVXBIZWlnaHRcbiAgICogQGlnbm9yZVxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIG9wZW5Qb3B1cCh1cmxOYXZpZ2F0ZTogc3RyaW5nLCB0aXRsZTogc3RyaW5nLCBwb3BVcFdpZHRoOiBudW1iZXIsIHBvcFVwSGVpZ2h0OiBudW1iZXIpIHtcbiAgICB0cnkge1xuICAgICAgLyoqXG4gICAgICAgKiBhZGRpbmcgd2luTGVmdCBhbmQgd2luVG9wIHRvIGFjY291bnQgZm9yIGR1YWwgbW9uaXRvclxuICAgICAgICogdXNpbmcgc2NyZWVuTGVmdCBhbmQgc2NyZWVuVG9wIGZvciBJRTggYW5kIGVhcmxpZXJcbiAgICAgICAqL1xuICAgICAgY29uc3Qgd2luTGVmdCA9IHdpbmRvdy5zY3JlZW5MZWZ0ID8gd2luZG93LnNjcmVlbkxlZnQgOiB3aW5kb3cuc2NyZWVuWDtcbiAgICAgIGNvbnN0IHdpblRvcCA9IHdpbmRvdy5zY3JlZW5Ub3AgPyB3aW5kb3cuc2NyZWVuVG9wIDogd2luZG93LnNjcmVlblk7XG4gICAgICAvKipcbiAgICAgICAqIHdpbmRvdy5pbm5lcldpZHRoIGRpc3BsYXlzIGJyb3dzZXIgd2luZG93XCJzIGhlaWdodCBhbmQgd2lkdGggZXhjbHVkaW5nIHRvb2xiYXJzXG4gICAgICAgKiB1c2luZyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGggZm9yIElFOCBhbmQgZWFybGllclxuICAgICAgICovXG4gICAgICBjb25zdCB3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCB8fCBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoO1xuICAgICAgY29uc3QgaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQgfHwgZG9jdW1lbnQuYm9keS5jbGllbnRIZWlnaHQ7XG4gICAgICBjb25zdCBsZWZ0ID0gKCh3aWR0aCAvIDIpIC0gKHBvcFVwV2lkdGggLyAyKSkgKyB3aW5MZWZ0O1xuICAgICAgY29uc3QgdG9wID0gKChoZWlnaHQgLyAyKSAtIChwb3BVcEhlaWdodCAvIDIpKSArIHdpblRvcDtcblxuICAgICAgLy8gb3BlbiB0aGUgd2luZG93XG4gICAgICBjb25zdCBwb3B1cFdpbmRvdyA9IHdpbmRvdy5vcGVuKHVybE5hdmlnYXRlLCB0aXRsZSwgXCJ3aWR0aD1cIiArIHBvcFVwV2lkdGggKyBcIiwgaGVpZ2h0PVwiICsgcG9wVXBIZWlnaHQgKyBcIiwgdG9wPVwiICsgdG9wICsgXCIsIGxlZnQ9XCIgKyBsZWZ0KTtcbiAgICAgIGlmICghcG9wdXBXaW5kb3cpIHtcbiAgICAgICAgdGhyb3cgQ2xpZW50QXV0aEVycm9yLmNyZWF0ZVBvcHVwV2luZG93RXJyb3IoKTtcbiAgICAgIH1cbiAgICAgIGlmIChwb3B1cFdpbmRvdy5mb2N1cykge1xuICAgICAgICBwb3B1cFdpbmRvdy5mb2N1cygpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcG9wdXBXaW5kb3c7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoXCJlcnJvciBvcGVuaW5nIHBvcHVwIFwiICsgZS5tZXNzYWdlKTtcbiAgICAgIHRoaXMubG9naW5JblByb2dyZXNzID0gZmFsc2U7XG4gICAgICB0aGlzLmFjcXVpcmVUb2tlbkluUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICAgIHRocm93IENsaWVudEF1dGhFcnJvci5jcmVhdGVQb3B1cFdpbmRvd0Vycm9yKGUudG9TdHJpbmcoKSk7XG4gICAgfVxuICB9XG5cbiAgLy8jZW5kcmVnaW9uXG5cbiAgLy8jcmVnaW9uIFNpbGVudCBGbG93XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gZ2V0IHRoZSB0b2tlbiBmcm9tIGNhY2hlLlxuICAgKiBNU0FMIHdpbGwgcmV0dXJuIHRoZSBjYWNoZWQgdG9rZW4gaWYgaXQgaXMgbm90IGV4cGlyZWQuXG4gICAqIE9yIGl0IHdpbGwgc2VuZCBhIHJlcXVlc3QgdG8gdGhlIFNUUyB0byBvYnRhaW4gYW4gYWNjZXNzX3Rva2VuIHVzaW5nIGEgaGlkZGVuIGlmcmFtZS4gVG8gcmVuZXcgaWRUb2tlbiwgY2xpZW50SWQgc2hvdWxkIGJlIHBhc3NlZCBhcyB0aGUgb25seSBzY29wZSBpbiB0aGUgc2NvcGVzIGFycmF5LlxuICAgKiBAcGFyYW0ge0FycmF5PHN0cmluZz59IHNjb3BlcyAtIFBlcm1pc3Npb25zIHlvdSB3YW50IGluY2x1ZGVkIGluIHRoZSBhY2Nlc3MgdG9rZW4uIE5vdCBhbGwgc2NvcGVzIGFyZSAgZ3VhcmFudGVlZCB0byBiZSBpbmNsdWRlZCBpbiB0aGUgYWNjZXNzIHRva2VuLiBTY29wZXMgbGlrZSBcIm9wZW5pZFwiIGFuZCBcInByb2ZpbGVcIiBhcmUgc2VudCB3aXRoIGV2ZXJ5IHJlcXVlc3QuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhdXRob3JpdHkgLSBBIFVSTCBpbmRpY2F0aW5nIGEgZGlyZWN0b3J5IHRoYXQgTVNBTCBjYW4gdXNlIHRvIG9idGFpbiB0b2tlbnMuXG4gICAqIC0gSW4gQXp1cmUgQUQsIGl0IGlzIG9mIHRoZSBmb3JtIGh0dHBzOi8vJmx0O3RlbmFudCZndDsvJmx0O3RlbmFudCZndDssIHdoZXJlICZsdDt0ZW5hbnQmZ3Q7IGlzIHRoZSBkaXJlY3RvcnkgaG9zdCAoZS5nLiBodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20pIGFuZCAmbHQ7dGVuYW50Jmd0OyBpcyBhIGlkZW50aWZpZXIgd2l0aGluIHRoZSBkaXJlY3RvcnkgaXRzZWxmIChlLmcuIGEgZG9tYWluIGFzc29jaWF0ZWQgdG8gdGhlIHRlbmFudCwgc3VjaCBhcyBjb250b3NvLm9ubWljcm9zb2Z0LmNvbSwgb3IgdGhlIEdVSUQgcmVwcmVzZW50aW5nIHRoZSBUZW5hbnRJRCBwcm9wZXJ0eSBvZiB0aGUgZGlyZWN0b3J5KVxuICAgKiAtIEluIEF6dXJlIEIyQywgaXQgaXMgb2YgdGhlIGZvcm0gaHR0cHM6Ly8mbHQ7aW5zdGFuY2UmZ3Q7L3RmcC8mbHQ7dGVuYW50Jmd0Oy88cG9saWN5TmFtZT4vXG4gICAqIC0gRGVmYXVsdCB2YWx1ZSBpczogXCJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vY29tbW9uXCJcbiAgICogQHBhcmFtIHtBY2NvdW50fSBhY2NvdW50IC0gVGhlIHVzZXIgYWNjb3VudCBmb3Igd2hpY2ggdGhlIHNjb3BlcyBhcmUgcmVxdWVzdGVkLlRoZSBkZWZhdWx0IGFjY291bnQgaXMgdGhlIGxvZ2dlZCBpbiBhY2NvdW50LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXh0cmFRdWVyeVBhcmFtZXRlcnMgLSBLZXktdmFsdWUgcGFpcnMgdG8gcGFzcyB0byB0aGUgU1RTIGR1cmluZyB0aGUgIGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlLjxzdHJpbmc+fSAtIEEgUHJvbWlzZSB0aGF0IGlzIGZ1bGZpbGxlZCB3aGVuIHRoaXMgZnVuY3Rpb24gaGFzIGNvbXBsZXRlZCwgb3IgcmVqZWN0ZWQgaWYgYW4gZXJyb3Igd2FzIHJhaXNlZC4gUmVzb2x2ZWQgd2l0aCB0b2tlbiBvciByZWplY3RlZCB3aXRoIGVycm9yLlxuICAgKi9cbiAgQHJlc29sdmVUb2tlbk9ubHlJZk91dE9mSWZyYW1lXG4gIGFjcXVpcmVUb2tlblNpbGVudChyZXF1ZXN0OiBBdXRoZW50aWNhdGlvblBhcmFtZXRlcnMpOiBQcm9taXNlPEF1dGhSZXNwb25zZT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxBdXRoUmVzcG9uc2U+KChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgLy8gVmFsaWRhdGUgYW5kIGZpbHRlciBzY29wZXMgKHRoZSB2YWxpZGF0ZSBmdW5jdGlvbiB3aWxsIHRocm93IGlmIHZhbGlkYXRpb24gZmFpbHMpXG4gICAgICB0aGlzLnZhbGlkYXRlSW5wdXRTY29wZShyZXF1ZXN0LnNjb3BlcywgdHJ1ZSk7XG5cbiAgICAgIGNvbnN0IHNjb3BlID0gcmVxdWVzdC5zY29wZXMuam9pbihcIiBcIikudG9Mb3dlckNhc2UoKTtcblxuICAgICAgLy8gaWYgdGhlIGRldmVsb3BlciBwYXNzZXMgYW4gYWNjb3VudCBnaXZlIGhpbSB0aGUgcHJpb3JpdHlcbiAgICAgIGNvbnN0IGFjY291bnQ6IEFjY291bnQgPSByZXF1ZXN0LmFjY291bnQgfHwgdGhpcy5nZXRBY2NvdW50KCk7XG5cbiAgICAgIC8vIGV4dHJhY3QgaWYgdGhlcmUgaXMgYW4gYWRhbElkVG9rZW4gc3Rhc2hlZCBpbiB0aGUgY2FjaGVcbiAgICAgIGNvbnN0IGFkYWxJZFRva2VuID0gdGhpcy5jYWNoZVN0b3JhZ2UuZ2V0SXRlbShDb25zdGFudHMuYWRhbElkVG9rZW4pO1xuXG4gICAgICAvL2lmIHRoZXJlIGlzIG5vIGFjY291bnQgbG9nZ2VkIGluIGFuZCBubyBsb2dpbl9oaW50L3NpZCBpcyBwYXNzZWQgaW4gdGhlIHJlcXVlc3RcbiAgICAgIGlmICghYWNjb3VudCAmJiAhIShyZXF1ZXN0LnNpZCAgfHwgcmVxdWVzdC5sb2dpbkhpbnQpICYmIFV0aWxzLmlzRW1wdHkoYWRhbElkVG9rZW4pICkge1xuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKFwiVXNlciBsb2dpbiBpcyByZXF1aXJlZFwiKTtcbiAgICAgICAgcmV0dXJuIHJlamVjdChDbGllbnRBdXRoRXJyb3IuY3JlYXRlVXNlckxvZ2luUmVxdWlyZWRFcnJvcigpKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVzcG9uc2VUeXBlID0gdGhpcy5nZXRUb2tlblR5cGUoYWNjb3VudCwgcmVxdWVzdC5zY29wZXMsIHRydWUpO1xuXG4gICAgICBsZXQgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0ID0gbmV3IFNlcnZlclJlcXVlc3RQYXJhbWV0ZXJzKFxuICAgICAgICBBdXRob3JpdHlGYWN0b3J5LkNyZWF0ZUluc3RhbmNlKHJlcXVlc3QuYXV0aG9yaXR5LCB0aGlzLmNvbmZpZy5hdXRoLnZhbGlkYXRlQXV0aG9yaXR5KSxcbiAgICAgICAgdGhpcy5jbGllbnRJZCxcbiAgICAgICAgcmVxdWVzdC5zY29wZXMsXG4gICAgICAgIHJlc3BvbnNlVHlwZSxcbiAgICAgICAgdGhpcy5nZXRSZWRpcmVjdFVyaSgpLFxuICAgICAgICB0aGlzLmNvbmZpZy5hdXRoLnN0YXRlXG4gICAgICApO1xuXG4gICAgICAvLyBwb3B1bGF0ZSBRdWVyeVBhcmFtZXRlcnMgKHNpZC9sb2dpbl9oaW50L2RvbWFpbl9oaW50KSBhbmQgYW55IG90aGVyIGV4dHJhUXVlcnlQYXJhbWV0ZXJzIHNldCBieSB0aGUgZGV2ZWxvcGVyXG4gICAgICBpZiAoVXRpbHMuaXNTU09QYXJhbShyZXF1ZXN0KSB8fCBhY2NvdW50KSB7XG4gICAgICAgIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdCA9IHRoaXMucG9wdWxhdGVRdWVyeVBhcmFtcyhhY2NvdW50LCByZXF1ZXN0LCBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QpO1xuICAgICAgfVxuICAgICAgLy9pZiB1c2VyIGRpZG4ndCBwYXNzIGxvZ2luX2hpbnQvc2lkIGFuZCBhZGFsJ3MgaWR0b2tlbiBpcyBwcmVzZW50LCBleHRyYWN0IHRoZSBsb2dpbl9oaW50IGZyb20gdGhlIGFkYWxJZFRva2VuXG4gICAgICBlbHNlIGlmICghYWNjb3VudCAmJiAhVXRpbHMuaXNFbXB0eShhZGFsSWRUb2tlbikpIHtcbiAgICAgICAgLy8gaWYgYWRhbElkVG9rZW4gZXhpc3RzLCBleHRyYWN0IHRoZSBTU08gaW5mbyBmcm9tIHRoZSBzYW1lXG4gICAgICAgIGNvbnN0IGFkYWxJZFRva2VuT2JqZWN0ID0gVXRpbHMuZXh0cmFjdElkVG9rZW4oYWRhbElkVG9rZW4pO1xuICAgICAgICB0aGlzLmxvZ2dlci52ZXJib3NlKFwiQURBTCdzIGlkVG9rZW4gZXhpc3RzLiBFeHRyYWN0aW5nIGxvZ2luIGluZm9ybWF0aW9uIGZyb20gQURBTCdzIGlkVG9rZW4gXCIpO1xuICAgICAgICBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QgPSB0aGlzLnBvcHVsYXRlUXVlcnlQYXJhbXMoYWNjb3VudCwgbnVsbCwgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LCBhZGFsSWRUb2tlbk9iamVjdCk7XG4gICAgICB9XG5cbiAgICAgIGxldCBhdXRoRXJyOiBBdXRoRXJyb3I7XG4gICAgICBsZXQgY2FjaGVSZXN1bHRSZXNwb25zZTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgY2FjaGVSZXN1bHRSZXNwb25zZSA9IHRoaXMuZ2V0Q2FjaGVkVG9rZW4oc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LCBhY2NvdW50KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgYXV0aEVyciA9IGU7XG4gICAgICB9XG5cbiAgICAgIC8vIHJlc29sdmUvcmVqZWN0IGJhc2VkIG9uIGNhY2hlUmVzdWx0XG4gICAgICBpZiAoY2FjaGVSZXN1bHRSZXNwb25zZSkge1xuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKFwiVG9rZW4gaXMgYWxyZWFkeSBpbiBjYWNoZSBmb3Igc2NvcGU6XCIgKyBzY29wZSk7XG4gICAgICAgIHJlc29sdmUoY2FjaGVSZXN1bHRSZXNwb25zZSk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoYXV0aEVycikge1xuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvUGlpKGF1dGhFcnIuZXJyb3JDb2RlICsgXCI6XCIgKyBhdXRoRXJyLmVycm9yTWVzc2FnZSk7XG4gICAgICAgIHJlamVjdChhdXRoRXJyKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICAvLyBlbHNlIHByb2NlZWQgd2l0aCBsb2dpblxuICAgICAgZWxzZSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLnZlcmJvc2UoXCJUb2tlbiBpcyBub3QgaW4gY2FjaGUgZm9yIHNjb3BlOlwiICsgc2NvcGUpO1xuICAgICAgICAvLyBDYWNoZSByZXN1bHQgY2FuIHJldHVybiBudWxsIGlmIGNhY2hlIGlzIGVtcHR5LiBJbiB0aGF0IGNhc2UsIHNldCBhdXRob3JpdHkgdG8gZGVmYXVsdCB2YWx1ZSBpZiBubyBhdXRob3JpdHkgaXMgcGFzc2VkIHRvIHRoZSBhcGkuXG4gICAgICAgIGlmICghc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LmF1dGhvcml0eUluc3RhbmNlKSB7XG4gICAgICAgICAgICBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QuYXV0aG9yaXR5SW5zdGFuY2UgPSByZXF1ZXN0LmF1dGhvcml0eSA/IEF1dGhvcml0eUZhY3RvcnkuQ3JlYXRlSW5zdGFuY2UocmVxdWVzdC5hdXRob3JpdHksIHRoaXMuY29uZmlnLmF1dGgudmFsaWRhdGVBdXRob3JpdHkpIDogdGhpcy5hdXRob3JpdHlJbnN0YW5jZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjYWNoZSBtaXNzXG4gICAgICAgIHJldHVybiBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QuYXV0aG9yaXR5SW5zdGFuY2UucmVzb2x2ZUVuZHBvaW50c0FzeW5jKClcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIC8vIHJlZnJlc2ggYXR0ZW1wdCB3aXRoIGlmcmFtZVxuICAgICAgICAgIC8vIEFscmVhZHkgcmVuZXdpbmcgZm9yIHRoaXMgc2NvcGUsIGNhbGxiYWNrIHdoZW4gd2UgZ2V0IHRoZSB0b2tlbi5cbiAgICAgICAgICBpZiAod2luZG93LmFjdGl2ZVJlbmV3YWxzW3Njb3BlXSkge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIudmVyYm9zZShcIlJlbmV3IHRva2VuIGZvciBzY29wZTogXCIgKyBzY29wZSArIFwiIGlzIGluIHByb2dyZXNzLiBSZWdpc3RlcmluZyBjYWxsYmFja1wiKTtcbiAgICAgICAgICAgIC8vIEFjdGl2ZSByZW5ld2FscyBjb250YWlucyB0aGUgc3RhdGUgZm9yIGVhY2ggcmVuZXdhbC5cbiAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJDYWxsYmFjayh3aW5kb3cuYWN0aXZlUmVuZXdhbHNbc2NvcGVdLCBzY29wZSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAocmVxdWVzdC5zY29wZXMgJiYgcmVxdWVzdC5zY29wZXMuaW5kZXhPZih0aGlzLmNsaWVudElkKSA+IC0xICYmIHJlcXVlc3Quc2NvcGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAvLyBBcHAgdXNlcyBpZFRva2VuIHRvIHNlbmQgdG8gYXBpIGVuZHBvaW50c1xuICAgICAgICAgICAgICAvLyBEZWZhdWx0IHNjb3BlIGlzIHRyYWNrZWQgYXMgY2xpZW50SWQgdG8gc3RvcmUgdGhpcyB0b2tlblxuICAgICAgICAgICAgICB0aGlzLmxvZ2dlci52ZXJib3NlKFwicmVuZXdpbmcgaWRUb2tlblwiKTtcbiAgICAgICAgICAgICAgdGhpcy5yZW5ld0lkVG9rZW4ocmVxdWVzdC5zY29wZXMsIHJlc29sdmUsIHJlamVjdCwgYWNjb3VudCwgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIHJlbmV3IGFjY2VzcyB0b2tlblxuICAgICAgICAgICAgICB0aGlzLmxvZ2dlci52ZXJib3NlKFwicmVuZXdpbmcgYWNjZXNzdG9rZW5cIik7XG4gICAgICAgICAgICAgIHRoaXMucmVuZXdUb2tlbihyZXF1ZXN0LnNjb3BlcywgcmVzb2x2ZSwgcmVqZWN0LCBhY2NvdW50LCBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm5pbmcoXCJjb3VsZCBub3QgcmVzb2x2ZSBlbmRwb2ludHNcIik7XG4gICAgICAgICAgcmVqZWN0KENsaWVudEF1dGhFcnJvci5jcmVhdGVFbmRwb2ludFJlc29sdXRpb25FcnJvcihlcnIudG9TdHJpbmcoKSkpO1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgY3VycmVudCB3aW5kb3cgaXMgaW4gaWZyYW0gZm9yIHRva2VuIHJlbmV3YWxcbiAgICogQGlnbm9yZVxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwdWJsaWMgaXNJbklmcmFtZSgpIHtcbiAgICAgIHJldHVybiB3aW5kb3cucGFyZW50ICE9PSB3aW5kb3c7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIHBhcmVudCB3aW5kb3cgZXhpc3RzIGFuZCBoYXMgbXNhbFxuICAgKi9cbiAgcHJpdmF0ZSBwYXJlbnRJc01zYWwoKSB7XG4gICAgcmV0dXJuIHdpbmRvdy5wYXJlbnQgIT09IHdpbmRvdyAmJiB3aW5kb3cucGFyZW50Lm1zYWw7XG4gIH1cblxuICBwcml2YXRlIGlzSW50ZXJhY3Rpb25SZXF1aXJlZChlcnJvclN0cmluZzogc3RyaW5nKSA6IGJvb2xlYW4ge1xuICAgIGlmIChlcnJvclN0cmluZy5pbmRleE9mKFwiaW50ZXJhY3Rpb25fcmVxdWlyZWRcIikgIT09IC0xIHx8XG4gICAgZXJyb3JTdHJpbmcuaW5kZXhPZihcImNvbnNlbnRfcmVxdWlyZWRcIikgIT09IC0xIHx8XG4gICAgZXJyb3JTdHJpbmcuaW5kZXhPZihcImxvZ2luX3JlcXVpcmVkXCIpICE9PSAtMSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsaW5nIF9sb2FkRnJhbWUgYnV0IHdpdGggYSB0aW1lb3V0IHRvIHNpZ25hbCBmYWlsdXJlIGluIGxvYWRmcmFtZVN0YXR1cy4gQ2FsbGJhY2tzIGFyZSBsZWZ0LlxuICAgKiByZWdpc3RlcmVkIHdoZW4gbmV0d29yayBlcnJvcnMgb2NjdXIgYW5kIHN1YnNlcXVlbnQgdG9rZW4gcmVxdWVzdHMgZm9yIHNhbWUgcmVzb3VyY2UgYXJlIHJlZ2lzdGVyZWQgdG8gdGhlIHBlbmRpbmcgcmVxdWVzdC5cbiAgICogQGlnbm9yZVxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIGxvYWRJZnJhbWVUaW1lb3V0KHVybE5hdmlnYXRlOiBzdHJpbmcsIGZyYW1lTmFtZTogc3RyaW5nLCBzY29wZTogc3RyaW5nKTogdm9pZCB7XG4gICAgLy9zZXQgaWZyYW1lIHNlc3Npb24gdG8gcGVuZGluZ1xuICAgIGNvbnN0IGV4cGVjdGVkU3RhdGUgPSB3aW5kb3cuYWN0aXZlUmVuZXdhbHNbc2NvcGVdO1xuICAgIHRoaXMubG9nZ2VyLnZlcmJvc2UoXCJTZXQgbG9hZGluZyBzdGF0ZSB0byBwZW5kaW5nIGZvcjogXCIgKyBzY29wZSArIFwiOlwiICsgZXhwZWN0ZWRTdGF0ZSk7XG4gICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMucmVuZXdTdGF0dXMgKyBleHBlY3RlZFN0YXRlLCBDb25zdGFudHMudG9rZW5SZW5ld1N0YXR1c0luUHJvZ3Jlc3MpO1xuICAgIHRoaXMubG9hZEZyYW1lKHVybE5hdmlnYXRlLCBmcmFtZU5hbWUpO1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLnJlbmV3U3RhdHVzICsgZXhwZWN0ZWRTdGF0ZSkgPT09IENvbnN0YW50cy50b2tlblJlbmV3U3RhdHVzSW5Qcm9ncmVzcykge1xuICAgICAgICAvLyBmYWlsIHRoZSBpZnJhbWUgc2Vzc2lvbiBpZiBpdFwicyBpbiBwZW5kaW5nIHN0YXRlXG4gICAgICAgIHRoaXMubG9nZ2VyLnZlcmJvc2UoXCJMb2FkaW5nIGZyYW1lIGhhcyB0aW1lZCBvdXQgYWZ0ZXI6IFwiICsgKHRoaXMuY29uZmlnLnN5c3RlbS5sb2FkRnJhbWVUaW1lb3V0IC8gMTAwMCkgKyBcIiBzZWNvbmRzIGZvciBzY29wZSBcIiArIHNjb3BlICsgXCI6XCIgKyBleHBlY3RlZFN0YXRlKTtcbiAgICAgICAgLy8gRXJyb3IgYWZ0ZXIgdGltZW91dFxuICAgICAgICBpZiAoZXhwZWN0ZWRTdGF0ZSAmJiB3aW5kb3cuY2FsbGJhY2tNYXBwZWRUb1JlbmV3U3RhdGVzW2V4cGVjdGVkU3RhdGVdKSB7XG4gICAgICAgICAgd2luZG93LmNhbGxiYWNrTWFwcGVkVG9SZW5ld1N0YXRlc1tleHBlY3RlZFN0YXRlXShudWxsLCBDbGllbnRBdXRoRXJyb3IuY3JlYXRlVG9rZW5SZW5ld2FsVGltZW91dEVycm9yKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMucmVuZXdTdGF0dXMgKyBleHBlY3RlZFN0YXRlLCBDb25zdGFudHMudG9rZW5SZW5ld1N0YXR1c0NhbmNlbGxlZCk7XG4gICAgICB9XG4gICAgfSwgdGhpcy5jb25maWcuc3lzdGVtLmxvYWRGcmFtZVRpbWVvdXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGlmcmFtZSB3aXRoIGF1dGhvcml6YXRpb24gZW5kcG9pbnQgVVJMXG4gICAqIEBpZ25vcmVcbiAgICogQGhpZGRlblxuICAgKi9cbiAgcHJpdmF0ZSBsb2FkRnJhbWUodXJsTmF2aWdhdGU6IHN0cmluZywgZnJhbWVOYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAvLyBUaGlzIHRyaWNrIG92ZXJjb21lcyBpZnJhbWUgbmF2aWdhdGlvbiBpbiBJRVxuICAgIC8vIElFIGRvZXMgbm90IGxvYWQgdGhlIHBhZ2UgY29uc2lzdGVudGx5IGluIGlmcmFtZVxuICAgIHRoaXMubG9nZ2VyLmluZm8oXCJMb2FkRnJhbWU6IFwiICsgZnJhbWVOYW1lKTtcbiAgICBjb25zdCBmcmFtZUNoZWNrID0gZnJhbWVOYW1lO1xuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBjb25zdCBmcmFtZUhhbmRsZSA9IHRoaXMuYWRkSGlkZGVuSUZyYW1lKGZyYW1lQ2hlY2spO1xuICAgICAgaWYgKGZyYW1lSGFuZGxlLnNyYyA9PT0gXCJcIiB8fCBmcmFtZUhhbmRsZS5zcmMgPT09IFwiYWJvdXQ6YmxhbmtcIikge1xuICAgICAgICBmcmFtZUhhbmRsZS5zcmMgPSB1cmxOYXZpZ2F0ZTtcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mb1BpaShcIkZyYW1lIE5hbWUgOiBcIiArIGZyYW1lTmFtZSArIFwiIE5hdmlnYXRlZCB0bzogXCIgKyB1cmxOYXZpZ2F0ZSk7XG4gICAgICB9XG4gICAgfSxcbiAgICA1MDApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIGhpZGRlbiBpZnJhbWUgZm9yIHNpbGVudCB0b2tlbiByZW5ld2FsLlxuICAgKiBAaWdub3JlXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHByaXZhdGUgYWRkSGlkZGVuSUZyYW1lKGlmcmFtZUlkOiBzdHJpbmcpOiBIVE1MSUZyYW1lRWxlbWVudCB7XG4gICAgaWYgKHR5cGVvZiBpZnJhbWVJZCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5sb2dnZXIuaW5mbyhcIkFkZCBtc2FsIGZyYW1lIHRvIGRvY3VtZW50OlwiICsgaWZyYW1lSWQpO1xuICAgIGxldCBhZGFsRnJhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZnJhbWVJZCkgYXMgSFRNTElGcmFtZUVsZW1lbnQ7XG4gICAgaWYgKCFhZGFsRnJhbWUpIHtcbiAgICAgIGlmIChkb2N1bWVudC5jcmVhdGVFbGVtZW50ICYmXG4gICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAmJlxuICAgICAgICAod2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIk1TSUUgNS4wXCIpID09PSAtMSkpIHtcbiAgICAgICAgY29uc3QgaWZyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlmcmFtZVwiKTtcbiAgICAgICAgaWZyLnNldEF0dHJpYnV0ZShcImlkXCIsIGlmcmFtZUlkKTtcbiAgICAgICAgaWZyLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xuICAgICAgICBpZnIuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgIGlmci5zdHlsZS53aWR0aCA9IGlmci5zdHlsZS5oZWlnaHQgPSBcIjBcIjtcbiAgICAgICAgaWZyLnN0eWxlLmJvcmRlciA9IFwiMFwiO1xuICAgICAgICBhZGFsRnJhbWUgPSAoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJib2R5XCIpWzBdLmFwcGVuZENoaWxkKGlmcikgYXMgSFRNTElGcmFtZUVsZW1lbnQpO1xuICAgICAgfSBlbHNlIGlmIChkb2N1bWVudC5ib2R5ICYmIGRvY3VtZW50LmJvZHkuaW5zZXJ0QWRqYWNlbnRIVE1MKSB7XG4gICAgICAgICAgZG9jdW1lbnQuYm9keS5pbnNlcnRBZGphY2VudEhUTUwoXCJiZWZvcmVlbmRcIiwgXCI8aWZyYW1lIG5hbWU9J1wiICsgaWZyYW1lSWQgKyBcIicgaWQ9J1wiICsgaWZyYW1lSWQgKyBcIicgc3R5bGU9J2Rpc3BsYXk6bm9uZSc+PC9pZnJhbWU+XCIpO1xuICAgICAgfVxuXG4gICAgICBpZiAod2luZG93LmZyYW1lcyAmJiB3aW5kb3cuZnJhbWVzW2lmcmFtZUlkXSkge1xuICAgICAgICBhZGFsRnJhbWUgPSB3aW5kb3cuZnJhbWVzW2lmcmFtZUlkXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYWRhbEZyYW1lO1xuICB9XG5cbiAgLy8jZW5kcmVnaW9uXG5cbiAgLy8jcmVnaW9uIEdlbmVyYWwgSGVscGVyc1xuXG4gIC8qKlxuICAgKiBBZGRzIGxvZ2luX2hpbnQgdG8gYXV0aG9yaXphdGlvbiBVUkwgd2hpY2ggaXMgdXNlZCB0byBwcmUtZmlsbCB0aGUgdXNlcm5hbWUgZmllbGQgb2Ygc2lnbiBpbiBwYWdlIGZvciB0aGUgdXNlciBpZiBrbm93biBhaGVhZCBvZiB0aW1lXG4gICAqIGRvbWFpbl9oaW50IGNhbiBiZSBvbmUgb2YgdXNlcnMvb3JnYW5pemF0aW9ucyB3aGljaCB3aGVuIGFkZGVkIHNraXBzIHRoZSBlbWFpbCBiYXNlZCBkaXNjb3ZlcnkgcHJvY2VzcyBvZiB0aGUgdXNlclxuICAgKiBkb21haW5fcmVxIHV0aWQgcmVjZWl2ZWQgYXMgcGFydCBvZiB0aGUgY2xpZW50SW5mb1xuICAgKiBsb2dpbl9yZXEgdWlkIHJlY2VpdmVkIGFzIHBhcnQgb2YgY2xpZW50SW5mb1xuICAgKiBBbHNvIGRvZXMgYSBzYW5pdHkgY2hlY2sgZm9yIGV4dHJhUXVlcnlQYXJhbWV0ZXJzIHBhc3NlZCBieSB0aGUgdXNlciB0byBlbnN1cmUgbm8gcmVwZWF0IHF1ZXJ5UGFyYW1ldGVyc1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsTmF2aWdhdGUgLSBBdXRoZW50aWNhdGlvbiByZXF1ZXN0IHVybFxuICAgKiBAcGFyYW0ge0FjY291bnR9IGFjY291bnQgLSBBY2NvdW50IGZvciB3aGljaCB0aGUgdG9rZW4gaXMgcmVxdWVzdGVkXG4gICAqIEBpZ25vcmVcbiAgICogQGhpZGRlblxuICAgKi9cbiAgcHJpdmF0ZSBhZGRIaW50UGFyYW1ldGVycyhhY2NvdW50T2JqOiBBY2NvdW50LCBxUGFyYW1zOiBRUERpY3QsIHNlcnZlclJlcVBhcmFtczogU2VydmVyUmVxdWVzdFBhcmFtZXRlcnMpOiBRUERpY3Qge1xuXG4gICAgY29uc3QgYWNjb3VudDogQWNjb3VudCA9IGFjY291bnRPYmogfHwgdGhpcy5nZXRBY2NvdW50KCk7XG5cbiAgICAvLyBUaGlzIGlzIGEgZmluYWwgY2hlY2sgZm9yIGFsbCBxdWVyeVBhcmFtcyBhZGRlZCBzbyBmYXI7IHByZWZlcmVuY2Ugb3JkZXI6IHNpZCA+IGxvZ2luX2hpbnRcbiAgICAvLyBzaWQgY2Fubm90IGJlIHBhc3NlZCBhbG9uZyB3aXRoIGxvZ2luX2hpbnQsIGhlbmNlIHdlIGNoZWNrIGJvdGggYXJlIG5vdCBwb3B1bGF0ZWQgeWV0IGluIHF1ZXJ5UGFyYW1ldGVycyBzbyBmYXJcbiAgICBpZiAoYWNjb3VudCkge1xuICAgICAgLy8gc2lkXG4gICAgICBpZiAoYWNjb3VudC5zaWQgJiYgc2VydmVyUmVxUGFyYW1zLnByb21wdFZhbHVlID09PSBQcm9tcHRTdGF0ZS5OT05FKSB7XG4gICAgICAgIGlmICghcVBhcmFtc1tTU09UeXBlcy5TSURdICAmJiAhcVBhcmFtc1tTU09UeXBlcy5MT0dJTl9ISU5UXSkge1xuICAgICAgICAgIHFQYXJhbXMgPSBVdGlscy5hZGRTU09QYXJhbWV0ZXIoU1NPVHlwZXMuU0lELCBhY2NvdW50LnNpZCwgcVBhcmFtcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGxvZ2luX2hpbnRcbiAgICAgIGVsc2Uge1xuICAgICAgICAvLyBsb2dpbl9oaW50IGlzIGFjY291bnQudXNlck5hbWVcbiAgICAgICAgaWYgKCFxUGFyYW1zW1NTT1R5cGVzLkxPR0lOX0hJTlRdICAmJiBhY2NvdW50LnVzZXJOYW1lICYmICFVdGlscy5pc0VtcHR5KGFjY291bnQudXNlck5hbWUpKSB7XG4gICAgICAgICAgcVBhcmFtcyA9IFV0aWxzLmFkZFNTT1BhcmFtZXRlcihTU09UeXBlcy5MT0dJTl9ISU5ULCBhY2NvdW50LnVzZXJOYW1lLCBxUGFyYW1zKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIXFQYXJhbXNbU1NPVHlwZXMuRE9NQUlOX1JFUV0gJiYgIXFQYXJhbXNbU1NPVHlwZXMuTE9HSU5fUkVRXSApIHtcbiAgICAgICAgcVBhcmFtcyA9IFV0aWxzLmFkZFNTT1BhcmFtZXRlcihTU09UeXBlcy5IT01FQUNDT1VOVF9JRCwgYWNjb3VudC5ob21lQWNjb3VudElkZW50aWZpZXIsIHFQYXJhbXMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBxUGFyYW1zO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gcmVkaXJlY3QgdGhlIGJyb3dzZXIgdG8gdGhlIFNUUyBhdXRob3JpemF0aW9uIGVuZHBvaW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1cmxOYXZpZ2F0ZSAtIFVSTCBvZiB0aGUgYXV0aG9yaXphdGlvbiBlbmRwb2ludFxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIHByb21wdFVzZXIodXJsTmF2aWdhdGU6IHN0cmluZykge1xuICAgIC8vIE5hdmlnYXRlIGlmIHZhbGlkIFVSTFxuICAgIGlmICh1cmxOYXZpZ2F0ZSAmJiAhVXRpbHMuaXNFbXB0eSh1cmxOYXZpZ2F0ZSkpIHtcbiAgICAgIHRoaXMubG9nZ2VyLmluZm9QaWkoXCJOYXZpZ2F0ZSB0bzpcIiArIHVybE5hdmlnYXRlKTtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKHVybE5hdmlnYXRlKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLmxvZ2dlci5pbmZvKFwiTmF2aWdhdGUgdXJsIGlzIGVtcHR5XCIpO1xuICAgICAgdGhyb3cgQXV0aEVycm9yLmNyZWF0ZVVuZXhwZWN0ZWRFcnJvcihcIk5hdmlnYXRlIHVybCBpcyBlbXB0eVwiKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXNlZCB0byBhZGQgdGhlIGRldmVsb3BlciByZXF1ZXN0ZWQgY2FsbGJhY2sgdG8gdGhlIGFycmF5IG9mIGNhbGxiYWNrcyBmb3IgdGhlIHNwZWNpZmllZCBzY29wZXMuIFRoZSB1cGRhdGVkIGFycmF5IGlzIHN0b3JlZCBvbiB0aGUgd2luZG93IG9iamVjdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2NvcGUgLSBEZXZlbG9wZXIgcmVxdWVzdGVkIHBlcm1pc3Npb25zLiBOb3QgYWxsIHNjb3BlcyBhcmUgZ3VhcmFudGVlZCB0byBiZSBpbmNsdWRlZCBpbiB0aGUgYWNjZXNzIHRva2VuIHJldHVybmVkLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXhwZWN0ZWRTdGF0ZSAtIFVuaXF1ZSBzdGF0ZSBpZGVudGlmaWVyIChndWlkKS5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gcmVzb2x2ZSAtIFRoZSByZXNvbHZlIGZ1bmN0aW9uIG9mIHRoZSBwcm9taXNlIG9iamVjdC5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gcmVqZWN0IC0gVGhlIHJlamVjdCBmdW5jdGlvbiBvZiB0aGUgcHJvbWlzZSBvYmplY3QuXG4gICAqIEBpZ25vcmVcbiAgICogQGhpZGRlblxuICAgKi9cbiAgcHJpdmF0ZSByZWdpc3RlckNhbGxiYWNrKGV4cGVjdGVkU3RhdGU6IHN0cmluZywgc2NvcGU6IHN0cmluZywgcmVzb2x2ZTogRnVuY3Rpb24sIHJlamVjdDogRnVuY3Rpb24pOiB2b2lkIHtcbiAgICAvLyB0cmFjayBhY3RpdmUgcmVuZXdhbHNcbiAgICB3aW5kb3cuYWN0aXZlUmVuZXdhbHNbc2NvcGVdID0gZXhwZWN0ZWRTdGF0ZTtcblxuICAgIC8vIGluaXRpYWxpemUgY2FsbGJhY2tzIG1hcHBlZCBhcnJheVxuICAgIGlmICghd2luZG93LnByb21pc2VNYXBwZWRUb1JlbmV3U3RhdGVzW2V4cGVjdGVkU3RhdGVdKSB7XG4gICAgICAgIHdpbmRvdy5wcm9taXNlTWFwcGVkVG9SZW5ld1N0YXRlc1tleHBlY3RlZFN0YXRlXSA9IFtdO1xuICAgIH1cbiAgICAvLyBpbmRleGluZyBvbiB0aGUgY3VycmVudCBzdGF0ZSwgcHVzaCB0aGUgY2FsbGJhY2sgcGFyYW1zIHRvIGNhbGxiYWNrcyBtYXBwZWRcbiAgICB3aW5kb3cucHJvbWlzZU1hcHBlZFRvUmVuZXdTdGF0ZXNbZXhwZWN0ZWRTdGF0ZV0ucHVzaCh7IHJlc29sdmU6IHJlc29sdmUsIHJlamVjdDogcmVqZWN0IH0pO1xuXG4gICAgLy8gU3RvcmUgdGhlIHNlcnZlciBlc3BvbnNlIGluIHRoZSBjdXJyZW50IHdpbmRvdz8/XG4gICAgaWYgKCF3aW5kb3cuY2FsbGJhY2tNYXBwZWRUb1JlbmV3U3RhdGVzW2V4cGVjdGVkU3RhdGVdKSB7XG4gICAgICB3aW5kb3cuY2FsbGJhY2tNYXBwZWRUb1JlbmV3U3RhdGVzW2V4cGVjdGVkU3RhdGVdID1cbiAgICAgIChyZXNwb25zZTogQXV0aFJlc3BvbnNlLCBlcnJvcjogQXV0aEVycm9yKSA9PiB7XG4gICAgICAgIC8vIHJlc2V0IGFjdGl2ZSByZW5ld2Fsc1xuICAgICAgICB3aW5kb3cuYWN0aXZlUmVuZXdhbHNbc2NvcGVdID0gbnVsbDtcblxuICAgICAgICAvLyBmb3IgYWxsIHByb21pc2VNYXBwZWR0b1JlbmV3U3RhdGVzIGZvciBhIGdpdmVuICdzdGF0ZScgLSBjYWxsIHRoZSByZWplY3QvcmVzb2x2ZSB3aXRoIGVycm9yL3Rva2VuIHJlc3BlY3RpdmVseVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHdpbmRvdy5wcm9taXNlTWFwcGVkVG9SZW5ld1N0YXRlc1tleHBlY3RlZFN0YXRlXS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cucHJvbWlzZU1hcHBlZFRvUmVuZXdTdGF0ZXNbZXhwZWN0ZWRTdGF0ZV1baV0ucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cucHJvbWlzZU1hcHBlZFRvUmVuZXdTdGF0ZXNbZXhwZWN0ZWRTdGF0ZV1baV0ucmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aHJvdyBBdXRoRXJyb3IuY3JlYXRlVW5leHBlY3RlZEVycm9yKFwiRXJyb3IgYW5kIHJlc3BvbnNlIGFyZSBib3RoIG51bGxcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIud2FybmluZyhlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXNldFxuICAgICAgICB3aW5kb3cucHJvbWlzZU1hcHBlZFRvUmVuZXdTdGF0ZXNbZXhwZWN0ZWRTdGF0ZV0gPSBudWxsO1xuICAgICAgICB3aW5kb3cuY2FsbGJhY2tNYXBwZWRUb1JlbmV3U3RhdGVzW2V4cGVjdGVkU3RhdGVdID0gbnVsbDtcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLy8jZW5kcmVnaW9uXG5cbiAgLy8jcmVnaW9uIExvZ291dFxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIGxvZyBvdXQgdGhlIGN1cnJlbnQgdXNlciwgYW5kIHJlZGlyZWN0IHRoZSB1c2VyIHRvIHRoZSBwb3N0TG9nb3V0UmVkaXJlY3RVcmkuXG4gICAqIERlZmF1bHRzIGJlaGF2aW91ciBpcyB0byByZWRpcmVjdCB0aGUgdXNlciB0byBgd2luZG93LmxvY2F0aW9uLmhyZWZgLlxuICAgKi9cbiAgbG9nb3V0KCk6IHZvaWQge1xuICAgIHRoaXMuY2xlYXJDYWNoZSgpO1xuICAgIHRoaXMuYWNjb3VudCA9IG51bGw7XG4gICAgbGV0IGxvZ291dCA9IFwiXCI7XG4gICAgaWYgKHRoaXMuZ2V0UG9zdExvZ291dFJlZGlyZWN0VXJpKCkpIHtcbiAgICAgIGxvZ291dCA9IFwicG9zdF9sb2dvdXRfcmVkaXJlY3RfdXJpPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMuZ2V0UG9zdExvZ291dFJlZGlyZWN0VXJpKCkpO1xuICAgIH1cblxuICAgIGNvbnN0IHVybE5hdmlnYXRlID0gdGhpcy5hdXRob3JpdHkgKyBcIi9vYXV0aDIvdjIuMC9sb2dvdXQ/XCIgKyBsb2dvdXQ7XG4gICAgdGhpcy5wcm9tcHRVc2VyKHVybE5hdmlnYXRlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhciBhbGwgYWNjZXNzIHRva2VucyBpbiB0aGUgY2FjaGUuXG4gICAqIEBpZ25vcmVcbiAgICogQGhpZGRlblxuICAgKi9cbiAgcHJvdGVjdGVkIGNsZWFyQ2FjaGUoKTogdm9pZCB7XG4gICAgd2luZG93LnJlbmV3U3RhdGVzID0gW107XG4gICAgY29uc3QgYWNjZXNzVG9rZW5JdGVtcyA9IHRoaXMuY2FjaGVTdG9yYWdlLmdldEFsbEFjY2Vzc1Rva2VucyhDb25zdGFudHMuY2xpZW50SWQsIENvbnN0YW50cy5ob21lQWNjb3VudElkZW50aWZpZXIpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWNjZXNzVG9rZW5JdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5jYWNoZVN0b3JhZ2UucmVtb3ZlSXRlbShKU09OLnN0cmluZ2lmeShhY2Nlc3NUb2tlbkl0ZW1zW2ldLmtleSkpO1xuICAgIH1cbiAgICB0aGlzLmNhY2hlU3RvcmFnZS5yZXNldENhY2hlSXRlbXMoKTtcbiAgICB0aGlzLmNhY2hlU3RvcmFnZS5jbGVhckNvb2tpZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFyIGEgZ2l2ZW4gYWNjZXNzIHRva2VuIGZyb20gdGhlIGNhY2hlLlxuICAgKlxuICAgKiBAcGFyYW0gYWNjZXNzVG9rZW5cbiAgICovXG4gIHByb3RlY3RlZCBjbGVhckNhY2hlRm9yU2NvcGUoYWNjZXNzVG9rZW46IHN0cmluZykge1xuICAgIGNvbnN0IGFjY2Vzc1Rva2VuSXRlbXMgPSB0aGlzLmNhY2hlU3RvcmFnZS5nZXRBbGxBY2Nlc3NUb2tlbnMoQ29uc3RhbnRzLmNsaWVudElkLCBDb25zdGFudHMuaG9tZUFjY291bnRJZGVudGlmaWVyKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFjY2Vzc1Rva2VuSXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IHRva2VuID0gYWNjZXNzVG9rZW5JdGVtc1tpXTtcbiAgICAgICAgaWYgKHRva2VuLnZhbHVlLmFjY2Vzc1Rva2VuID09PSBhY2Nlc3NUb2tlbikge1xuICAgICAgICAgICAgdGhpcy5jYWNoZVN0b3JhZ2UucmVtb3ZlSXRlbShKU09OLnN0cmluZ2lmeSh0b2tlbi5rZXkpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vI2VuZHJlZ2lvblxuXG4gIC8vI3JlZ2lvbiBSZXNwb25zZVxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIGNhbGwgdGhlIGNvbnN0cnVjdG9yIGNhbGxiYWNrIHdpdGggdGhlIHRva2VuL2Vycm9yXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbaGFzaD13aW5kb3cubG9jYXRpb24uaGFzaF0gLSBIYXNoIGZyYWdtZW50IG9mIFVybC5cbiAgICogQGhpZGRlblxuICAgKi9cbiAgcHJpdmF0ZSBwcm9jZXNzQ2FsbEJhY2soaGFzaDogc3RyaW5nLCBzdGF0ZUluZm86IFJlc3BvbnNlU3RhdGVJbmZvLCBwYXJlbnRDYWxsYmFjaz86IEZ1bmN0aW9uKTogdm9pZCB7XG4gICAgdGhpcy5sb2dnZXIuaW5mbyhcIlByb2Nlc3NpbmcgdGhlIGNhbGxiYWNrIGZyb20gcmVkaXJlY3QgcmVzcG9uc2VcIik7XG4gICAgLy8gZ2V0IHRoZSBzdGF0ZSBpbmZvIGZyb20gdGhlIGhhc2hcbiAgICBpZiAoIXN0YXRlSW5mbykge1xuICAgICAgc3RhdGVJbmZvID0gdGhpcy5nZXRSZXNwb25zZVN0YXRlKGhhc2gpO1xuICAgIH1cblxuICAgIGxldCByZXNwb25zZSA6IEF1dGhSZXNwb25zZTtcbiAgICBsZXQgYXV0aEVyciA6IEF1dGhFcnJvcjtcbiAgICAvLyBTYXZlIHRoZSB0b2tlbiBpbmZvIGZyb20gdGhlIGhhc2hcbiAgICB0cnkge1xuICAgICAgcmVzcG9uc2UgPSB0aGlzLnNhdmVUb2tlbkZyb21IYXNoKGhhc2gsIHN0YXRlSW5mbyk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBhdXRoRXJyID0gZXJyO1xuICAgIH1cblxuICAgIC8vIHJlbW92ZSBoYXNoIGZyb20gdGhlIGNhY2hlXG4gICAgdGhpcy5jYWNoZVN0b3JhZ2UucmVtb3ZlSXRlbShDb25zdGFudHMudXJsSGFzaCk7XG5cbiAgICB0cnkge1xuICAgICAgLy8gQ2xlYXIgdGhlIGNvb2tpZSBpbiB0aGUgaGFzaFxuICAgICAgdGhpcy5jYWNoZVN0b3JhZ2UuY2xlYXJDb29raWUoKTtcbiAgICAgIGNvbnN0IGFjY291bnRTdGF0ZTogc3RyaW5nID0gdGhpcy5nZXRBY2NvdW50U3RhdGUodGhpcy5jYWNoZVN0b3JhZ2UuZ2V0SXRlbShDb25zdGFudHMuc3RhdGVMb2dpbiwgdGhpcy5pbkNvb2tpZSkpO1xuXG4gICAgICBpZiAocmVzcG9uc2UpIHtcbiAgICAgICAgaWYgKChzdGF0ZUluZm8ucmVxdWVzdFR5cGUgPT09IENvbnN0YW50cy5yZW5ld1Rva2VuKSB8fCByZXNwb25zZS5hY2Nlc3NUb2tlbikge1xuICAgICAgICAgIGlmICh3aW5kb3cucGFyZW50ICE9PSB3aW5kb3cpIHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLnZlcmJvc2UoXCJXaW5kb3cgaXMgaW4gaWZyYW1lLCBhY3F1aXJpbmcgdG9rZW4gc2lsZW50bHlcIik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLnZlcmJvc2UoXCJhY3F1aXJpbmcgdG9rZW4gaW50ZXJhY3RpdmUgaW4gcHJvZ3Jlc3NcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc3BvbnNlLnRva2VuVHlwZSA9IENvbnN0YW50cy5hY2Nlc3NUb2tlbjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzdGF0ZUluZm8ucmVxdWVzdFR5cGUgPT09IENvbnN0YW50cy5sb2dpbikge1xuICAgICAgICAgIHJlc3BvbnNlLnRva2VuVHlwZSA9IENvbnN0YW50cy5pZFRva2VuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcGFyZW50Q2FsbGJhY2spIHtcbiAgICAgICAgICB0aGlzLnRva2VuUmVjZWl2ZWRDYWxsYmFjayhyZXNwb25zZSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCFwYXJlbnRDYWxsYmFjaykge1xuICAgICAgICB0aGlzLmVycm9yUmVjZWl2ZWRDYWxsYmFjayhhdXRoRXJyLCBhY2NvdW50U3RhdGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHBhcmVudENhbGxiYWNrKHJlc3BvbnNlLCBhdXRoRXJyKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHRoaXMubG9nZ2VyLmVycm9yKFwiRXJyb3Igb2NjdXJyZWQgaW4gdG9rZW4gcmVjZWl2ZWQgY2FsbGJhY2sgZnVuY3Rpb246IFwiICsgZXJyKTtcbiAgICAgIHRocm93IENsaWVudEF1dGhFcnJvci5jcmVhdGVFcnJvckluQ2FsbGJhY2tGdW5jdGlvbihlcnIudG9TdHJpbmcoKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIG11c3QgYmUgY2FsbGVkIGZvciBwcm9jZXNzaW5nIHRoZSByZXNwb25zZSByZWNlaXZlZCBmcm9tIHRoZSBTVFMuIEl0IGV4dHJhY3RzIHRoZSBoYXNoLCBwcm9jZXNzZXMgdGhlIHRva2VuIG9yIGVycm9yIGluZm9ybWF0aW9uIGFuZCBzYXZlcyBpdCBpbiB0aGUgY2FjaGUuIEl0IHRoZW5cbiAgICogY2FsbHMgdGhlIHJlZ2lzdGVyZWQgY2FsbGJhY2tzIGluIGNhc2Ugb2YgcmVkaXJlY3Qgb3IgcmVzb2x2ZXMgdGhlIHByb21pc2VzIHdpdGggdGhlIHJlc3VsdC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtoYXNoPXdpbmRvdy5sb2NhdGlvbi5oYXNoXSAtIEhhc2ggZnJhZ21lbnQgb2YgVXJsLlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIGhhbmRsZUF1dGhlbnRpY2F0aW9uUmVzcG9uc2UoaGFzaDogc3RyaW5nKTogdm9pZCB7XG4gICAgLy8gcmV0cmlldmUgdGhlIGhhc2hcbiAgICBpZiAoaGFzaCA9PSBudWxsKSB7XG4gICAgICBoYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2g7XG4gICAgfVxuXG4gICAgbGV0IHNlbGYgPSBudWxsO1xuICAgIGxldCBpc1BvcHVwOiBib29sZWFuID0gZmFsc2U7XG4gICAgbGV0IGlzV2luZG93T3BlbmVyTXNhbCA9IGZhbHNlO1xuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIGN1cnJlbnQgd2luZG93IG9wZW5lZCB0aGUgaUZyYW1lL3BvcHVwXG4gICAgdHJ5IHtcbiAgICAgIGlzV2luZG93T3BlbmVyTXNhbCA9IHdpbmRvdy5vcGVuZXIgJiYgd2luZG93Lm9wZW5lci5tc2FsICYmIHdpbmRvdy5vcGVuZXIubXNhbCAhPT0gd2luZG93Lm1zYWw7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBlcnIgPSBTZWN1cml0eUVycm9yOiBCbG9ja2VkIGEgZnJhbWUgd2l0aCBvcmlnaW4gXCJbdXJsXVwiIGZyb20gYWNjZXNzaW5nIGEgY3Jvc3Mtb3JpZ2luIGZyYW1lLlxuICAgICAgaXNXaW5kb3dPcGVuZXJNc2FsID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSBzZWxmIHRvIHRoZSB3aW5kb3cgdGhhdCBjcmVhdGVkIHRoZSBwb3B1cC9pZnJhbWVcbiAgICBpZiAoaXNXaW5kb3dPcGVuZXJNc2FsKSB7XG4gICAgICBzZWxmID0gd2luZG93Lm9wZW5lci5tc2FsO1xuICAgICAgaXNQb3B1cCA9IHRydWU7XG4gICAgfSBlbHNlIGlmICh3aW5kb3cucGFyZW50ICYmIHdpbmRvdy5wYXJlbnQubXNhbCkge1xuICAgICAgc2VsZiA9IHdpbmRvdy5wYXJlbnQubXNhbDtcbiAgICB9XG5cbiAgICAvLyBpZiAod2luZG93LnBhcmVudCAhPT0gd2luZG93KSwgYnkgdXNpbmcgc2VsZiwgd2luZG93LnBhcmVudCBiZWNvbWVzIGVxdWFsIHRvIHdpbmRvdyBpbiBnZXRSZXNwb25zZVN0YXRlIG1ldGhvZCBzcGVjaWZpY2FsbHlcbiAgICBjb25zdCBzdGF0ZUluZm8gPSBzZWxmLmdldFJlc3BvbnNlU3RhdGUoaGFzaCk7XG5cbiAgICBsZXQgdG9rZW5SZXNwb25zZUNhbGxiYWNrOiAocmVzcG9uc2U6IEF1dGhSZXNwb25zZSwgZXJyb3I6IEF1dGhFcnJvcikgPT4gdm9pZCA9IG51bGw7XG5cbiAgICBzZWxmLmxvZ2dlci5pbmZvKFwiUmV0dXJuZWQgZnJvbSByZWRpcmVjdCB1cmxcIik7XG4gICAgLy8gSWYgcGFyZW50IHdpbmRvdyBpcyB0aGUgbXNhbCBpbnN0YW5jZSB3aGljaCBvcGVuZWQgdGhlIGN1cnJlbnQgd2luZG93IChpZnJhbWUpXG4gICAgaWYgKHRoaXMucGFyZW50SXNNc2FsKCkpIHtcbiAgICAgICAgdG9rZW5SZXNwb25zZUNhbGxiYWNrID0gd2luZG93LnBhcmVudC5jYWxsYmFja01hcHBlZFRvUmVuZXdTdGF0ZXNbc3RhdGVJbmZvLnN0YXRlXTtcbiAgICB9XG4gICAgLy8gQ3VycmVudCB3aW5kb3cgaXMgd2luZG93IG9wZW5lciAocG9wdXApXG4gICAgZWxzZSBpZiAoaXNXaW5kb3dPcGVuZXJNc2FsKSB7XG4gICAgICAgIHRva2VuUmVzcG9uc2VDYWxsYmFjayA9IHdpbmRvdy5vcGVuZXIuY2FsbGJhY2tNYXBwZWRUb1JlbmV3U3RhdGVzW3N0YXRlSW5mby5zdGF0ZV07XG4gICAgfVxuICAgIC8vIFJlZGlyZWN0IGNhc2VzXG4gICAgZWxzZSB7XG4gICAgICB0b2tlblJlc3BvbnNlQ2FsbGJhY2sgPSBudWxsO1xuICAgICAgLy8gaWYgc2V0IHRvIG5hdmlnYXRlIHRvIGxvZ2luUmVxdWVzdCBwYWdlIHBvc3QgbG9naW5cbiAgICAgIGlmIChzZWxmLmNvbmZpZy5hdXRoLm5hdmlnYXRlVG9Mb2dpblJlcXVlc3RVcmwpIHtcbiAgICAgICAgc2VsZi5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMudXJsSGFzaCwgaGFzaCk7XG4gICAgICAgIGlmICh3aW5kb3cucGFyZW50ID09PSB3aW5kb3cgJiYgIWlzUG9wdXApIHtcbiAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IHNlbGYuY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLmxvZ2luUmVxdWVzdCwgc2VsZi5pbkNvb2tpZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gXCJcIjtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy5yZWRpcmVjdENhbGxiYWNrc1NldCkge1xuICAgICAgICAvLyBXZSByZWFjaGVkIHRoaXMgcG9pbnQgdG9vIGVhcmx5LCByZXR1cm4gYW5kIGNvbWUgYmFjayBsYXRlclxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgc2VsZi5wcm9jZXNzQ2FsbEJhY2soaGFzaCwgc3RhdGVJbmZvLCB0b2tlblJlc3BvbnNlQ2FsbGJhY2spO1xuXG4gICAgLy8gSWYgY3VycmVudCB3aW5kb3cgaXMgb3BlbmVyLCBjbG9zZSBhbGwgd2luZG93c1xuICAgIGlmIChpc1dpbmRvd09wZW5lck1zYWwpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgd2luZG93Lm9wZW5lci5vcGVuZWRXaW5kb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHdpbmRvdy5vcGVuZXIub3BlbmVkV2luZG93c1tpXS5jbG9zZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGRlc2VyaWFsaXplZCBwb3J0aW9uIG9mIFVSTCBoYXNoXG4gICAqIEBwYXJhbSBoYXNoXG4gICAqL1xuICBwcml2YXRlIGRlc2VyaWFsaXplSGFzaChoYXNoOiBzdHJpbmcpIHtcbiAgICBoYXNoID0gdGhpcy5nZXRIYXNoKGhhc2gpO1xuICAgIHJldHVybiBVdGlscy5kZXNlcmlhbGl6ZShoYXNoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgc3RhdGVJbmZvIG9iamVjdCBmcm9tIHRoZSBVUkwgZnJhZ21lbnQgYW5kIHJldHVybnMgaXQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBoYXNoICAtICBIYXNoIHBhc3NlZCBmcm9tIHJlZGlyZWN0IHBhZ2VcbiAgICogQHJldHVybnMge1Rva2VuUmVzcG9uc2V9IGFuIG9iamVjdCBjcmVhdGVkIGZyb20gdGhlIHJlZGlyZWN0IHJlc3BvbnNlIGZyb20gQUFEIGNvbXByaXNpbmcgb2YgdGhlIGtleXMgLSBwYXJhbWV0ZXJzLCByZXF1ZXN0VHlwZSwgc3RhdGVNYXRjaCwgc3RhdGVSZXNwb25zZSBhbmQgdmFsaWQuXG4gICAqIEBpZ25vcmVcbiAgICogQGhpZGRlblxuICAgKi9cbiAgcHJvdGVjdGVkIGdldFJlc3BvbnNlU3RhdGUoaGFzaDogc3RyaW5nKTogUmVzcG9uc2VTdGF0ZUluZm8ge1xuICAgIGNvbnN0IHBhcmFtZXRlcnMgPSB0aGlzLmRlc2VyaWFsaXplSGFzaChoYXNoKTtcbiAgICBsZXQgc3RhdGVSZXNwb25zZTogUmVzcG9uc2VTdGF0ZUluZm87XG4gICAgaWYgKCFwYXJhbWV0ZXJzKSB7XG4gICAgICB0aHJvdyBBdXRoRXJyb3IuY3JlYXRlVW5leHBlY3RlZEVycm9yKFwiSGFzaCB3YXMgbm90IHBhcnNlZCBjb3JyZWN0bHkuXCIpO1xuICAgIH1cbiAgICBpZiAocGFyYW1ldGVycy5oYXNPd25Qcm9wZXJ0eShcInN0YXRlXCIpKSB7XG4gICAgICBzdGF0ZVJlc3BvbnNlID0ge1xuICAgICAgICByZXF1ZXN0VHlwZTogQ29uc3RhbnRzLnVua25vd24sXG4gICAgICAgIHN0YXRlOiBwYXJhbWV0ZXJzLnN0YXRlLFxuICAgICAgICBzdGF0ZU1hdGNoOiBmYWxzZVxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgQXV0aEVycm9yLmNyZWF0ZVVuZXhwZWN0ZWRFcnJvcihcIkhhc2ggZG9lcyBub3QgY29udGFpbiBzdGF0ZS5cIik7XG4gICAgfVxuICAgIC8vIGFzeW5jIGNhbGxzIGNhbiBmaXJlIGlmcmFtZSBhbmQgbG9naW4gcmVxdWVzdCBhdCB0aGUgc2FtZSB0aW1lIGlmIGRldmVsb3BlciBkb2VzIG5vdCB1c2UgdGhlIEFQSSBhcyBleHBlY3RlZFxuICAgIC8vIGluY29taW5nIGNhbGxiYWNrIG5lZWRzIHRvIGJlIGxvb2tlZCB1cCB0byBmaW5kIHRoZSByZXF1ZXN0IHR5cGVcblxuICAgIC8vIGxvZ2luUmVkaXJlY3RcbiAgICBpZiAoc3RhdGVSZXNwb25zZS5zdGF0ZSA9PT0gdGhpcy5jYWNoZVN0b3JhZ2UuZ2V0SXRlbShDb25zdGFudHMuc3RhdGVMb2dpbiwgdGhpcy5pbkNvb2tpZSkgfHwgc3RhdGVSZXNwb25zZS5zdGF0ZSA9PT0gdGhpcy5zaWxlbnRBdXRoZW50aWNhdGlvblN0YXRlKSB7IC8vIGxvZ2luUmVkaXJlY3RcbiAgICAgIHN0YXRlUmVzcG9uc2UucmVxdWVzdFR5cGUgPSBDb25zdGFudHMubG9naW47XG4gICAgICBzdGF0ZVJlc3BvbnNlLnN0YXRlTWF0Y2ggPSB0cnVlO1xuICAgICAgcmV0dXJuIHN0YXRlUmVzcG9uc2U7XG4gICAgfVxuICAgIC8vIGFjcXVpcmVUb2tlblJlZGlyZWN0XG4gICAgZWxzZSBpZiAoc3RhdGVSZXNwb25zZS5zdGF0ZSA9PT0gdGhpcy5jYWNoZVN0b3JhZ2UuZ2V0SXRlbShDb25zdGFudHMuc3RhdGVBY3F1aXJlVG9rZW4sIHRoaXMuaW5Db29raWUpKSB7IC8vYWNxdWlyZVRva2VuUmVkaXJlY3RcbiAgICAgIHN0YXRlUmVzcG9uc2UucmVxdWVzdFR5cGUgPSBDb25zdGFudHMucmVuZXdUb2tlbjtcbiAgICAgIHN0YXRlUmVzcG9uc2Uuc3RhdGVNYXRjaCA9IHRydWU7XG4gICAgICByZXR1cm4gc3RhdGVSZXNwb25zZTtcbiAgICB9XG5cbiAgICAvLyBleHRlcm5hbCBhcGkgcmVxdWVzdHMgbWF5IGhhdmUgbWFueSByZW5ld3Rva2VuIHJlcXVlc3RzIGZvciBkaWZmZXJlbnQgcmVzb3VyY2VcbiAgICBpZiAoIXN0YXRlUmVzcG9uc2Uuc3RhdGVNYXRjaCkge1xuICAgICAgc3RhdGVSZXNwb25zZS5yZXF1ZXN0VHlwZSA9IHdpbmRvdy5yZXF1ZXN0VHlwZTtcbiAgICAgIGNvbnN0IHN0YXRlc0luUGFyZW50Q29udGV4dCA9IHdpbmRvdy5yZW5ld1N0YXRlcztcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RhdGVzSW5QYXJlbnRDb250ZXh0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChzdGF0ZXNJblBhcmVudENvbnRleHRbaV0gPT09IHN0YXRlUmVzcG9uc2Uuc3RhdGUpIHtcbiAgICAgICAgICBzdGF0ZVJlc3BvbnNlLnN0YXRlTWF0Y2ggPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0YXRlUmVzcG9uc2U7XG4gIH1cblxuICAvLyNlbmRyZWdpb25cblxuICAvLyNyZWdpb24gVG9rZW4gUHJvY2Vzc2luZyAoRXh0cmFjdCB0byBUb2tlblByb2Nlc3NpbmcudHMpXG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gZ2V0IHRva2VuIGZvciB0aGUgc3BlY2lmaWVkIHNldCBvZiBzY29wZXMgZnJvbSB0aGUgY2FjaGVcbiAgICogQHBhcmFtIHtBdXRoZW50aWNhdGlvblJlcXVlc3RQYXJhbWV0ZXJzfSBhdXRoZW50aWNhdGlvblJlcXVlc3QgLSBSZXF1ZXN0IHNlbnQgdG8gdGhlIFNUUyB0byBvYnRhaW4gYW4gaWRfdG9rZW4vYWNjZXNzX3Rva2VuXG4gICAqIEBwYXJhbSB7QWNjb3VudH0gYWNjb3VudCAtIEFjY291bnQgZm9yIHdoaWNoIHRoZSBzY29wZXMgd2VyZSByZXF1ZXN0ZWRcbiAgICogQGhpZGRlblxuICAgKi9cbiAgcHJpdmF0ZSBnZXRDYWNoZWRUb2tlbihzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Q6IFNlcnZlclJlcXVlc3RQYXJhbWV0ZXJzLCBhY2NvdW50OiBBY2NvdW50KTogQXV0aFJlc3BvbnNlIHtcbiAgICBsZXQgYWNjZXNzVG9rZW5DYWNoZUl0ZW06IEFjY2Vzc1Rva2VuQ2FjaGVJdGVtID0gbnVsbDtcbiAgICBjb25zdCBzY29wZXMgPSBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Quc2NvcGVzO1xuXG4gICAgLy8gZmlsdGVyIGJ5IGNsaWVudElkIGFuZCBhY2NvdW50XG4gICAgY29uc3QgdG9rZW5DYWNoZUl0ZW1zID0gdGhpcy5jYWNoZVN0b3JhZ2UuZ2V0QWxsQWNjZXNzVG9rZW5zKHRoaXMuY2xpZW50SWQsIGFjY291bnQgPyBhY2NvdW50LmhvbWVBY2NvdW50SWRlbnRpZmllciA6IG51bGwpO1xuXG4gICAgLy8gTm8gbWF0Y2ggZm91bmQgYWZ0ZXIgaW5pdGlhbCBmaWx0ZXJpbmdcbiAgICBpZiAodG9rZW5DYWNoZUl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsdGVyZWRJdGVtczogQXJyYXk8QWNjZXNzVG9rZW5DYWNoZUl0ZW0+ID0gW107XG5cbiAgICAvLyBpZiBubyBhdXRob3JpdHkgcGFzc2VkXG4gICAgaWYgKCFzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QuYXV0aG9yaXR5KSB7XG4gICAgICAvLyBmaWx0ZXIgYnkgc2NvcGVcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdG9rZW5DYWNoZUl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNhY2hlSXRlbSA9IHRva2VuQ2FjaGVJdGVtc1tpXTtcbiAgICAgICAgY29uc3QgY2FjaGVkU2NvcGVzID0gY2FjaGVJdGVtLmtleS5zY29wZXMuc3BsaXQoXCIgXCIpO1xuICAgICAgICBpZiAoVXRpbHMuY29udGFpbnNTY29wZShjYWNoZWRTY29wZXMsIHNjb3BlcykpIHtcbiAgICAgICAgICBmaWx0ZXJlZEl0ZW1zLnB1c2goY2FjaGVJdGVtKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBpZiBvbmx5IG9uZSBjYWNoZWQgdG9rZW4gZm91bmRcbiAgICAgIGlmIChmaWx0ZXJlZEl0ZW1zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBhY2Nlc3NUb2tlbkNhY2hlSXRlbSA9IGZpbHRlcmVkSXRlbXNbMF07XG4gICAgICAgIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5hdXRob3JpdHlJbnN0YW5jZSA9IEF1dGhvcml0eUZhY3RvcnkuQ3JlYXRlSW5zdGFuY2UoYWNjZXNzVG9rZW5DYWNoZUl0ZW0ua2V5LmF1dGhvcml0eSwgdGhpcy5jb25maWcuYXV0aC52YWxpZGF0ZUF1dGhvcml0eSk7XG4gICAgICB9XG4gICAgICAvLyBpZiBtb3JlIHRoYW4gb25lIGNhY2hlZCB0b2tlbiBpcyBmb3VuZFxuICAgICAgZWxzZSBpZiAoZmlsdGVyZWRJdGVtcy5sZW5ndGggPiAxKSB7XG4gICAgICAgIHRocm93IENsaWVudEF1dGhFcnJvci5jcmVhdGVNdWx0aXBsZU1hdGNoaW5nVG9rZW5zSW5DYWNoZUVycm9yKHNjb3Blcy50b1N0cmluZygpKTtcbiAgICAgIH1cbiAgICAgIC8vIGlmIG5vIG1hdGNoIGZvdW5kLCBjaGVjayBpZiB0aGVyZSB3YXMgYSBzaW5nbGUgYXV0aG9yaXR5IHVzZWRcbiAgICAgIGVsc2Uge1xuICAgICAgICBjb25zdCBhdXRob3JpdHlMaXN0ID0gdGhpcy5nZXRVbmlxdWVBdXRob3JpdHkodG9rZW5DYWNoZUl0ZW1zLCBcImF1dGhvcml0eVwiKTtcbiAgICAgICAgaWYgKGF1dGhvcml0eUxpc3QubGVuZ3RoID4gMSkge1xuICAgICAgICAgIHRocm93IENsaWVudEF1dGhFcnJvci5jcmVhdGVNdWx0aXBsZUF1dGhvcml0aWVzSW5DYWNoZUVycm9yKHNjb3Blcy50b1N0cmluZygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5hdXRob3JpdHlJbnN0YW5jZSA9IEF1dGhvcml0eUZhY3RvcnkuQ3JlYXRlSW5zdGFuY2UoYXV0aG9yaXR5TGlzdFswXSwgdGhpcy5jb25maWcuYXV0aC52YWxpZGF0ZUF1dGhvcml0eSk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIGlmIGFuIGF1dGhvcml0eSBpcyBwYXNzZWQgaW4gdGhlIEFQSVxuICAgIGVsc2Uge1xuICAgICAgLy8gZmlsdGVyIGJ5IGF1dGhvcml0eSBhbmQgc2NvcGVcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdG9rZW5DYWNoZUl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNhY2hlSXRlbSA9IHRva2VuQ2FjaGVJdGVtc1tpXTtcbiAgICAgICAgY29uc3QgY2FjaGVkU2NvcGVzID0gY2FjaGVJdGVtLmtleS5zY29wZXMuc3BsaXQoXCIgXCIpO1xuICAgICAgICBpZiAoVXRpbHMuY29udGFpbnNTY29wZShjYWNoZWRTY29wZXMsIHNjb3BlcykgJiYgY2FjaGVJdGVtLmtleS5hdXRob3JpdHkgPT09IHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5hdXRob3JpdHkpIHtcbiAgICAgICAgICBmaWx0ZXJlZEl0ZW1zLnB1c2goY2FjaGVJdGVtKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gbm8gbWF0Y2hcbiAgICAgIGlmIChmaWx0ZXJlZEl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIC8vIGlmIG9ubHkgb25lIGNhY2hlZFRva2VuIEZvdW5kXG4gICAgICBlbHNlIGlmIChmaWx0ZXJlZEl0ZW1zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBhY2Nlc3NUb2tlbkNhY2hlSXRlbSA9IGZpbHRlcmVkSXRlbXNbMF07XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgLy8gaWYgbW9yZSB0aGFuIGNhY2hlZCB0b2tlbiBpcyBmb3VuZFxuICAgICAgICB0aHJvdyBDbGllbnRBdXRoRXJyb3IuY3JlYXRlTXVsdGlwbGVNYXRjaGluZ1Rva2Vuc0luQ2FjaGVFcnJvcihzY29wZXMudG9TdHJpbmcoKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGFjY2Vzc1Rva2VuQ2FjaGVJdGVtICE9IG51bGwpIHtcbiAgICAgIGxldCBleHBpcmVkID0gTnVtYmVyKGFjY2Vzc1Rva2VuQ2FjaGVJdGVtLnZhbHVlLmV4cGlyZXNJbik7XG4gICAgICAvLyBJZiBleHBpcmF0aW9uIGlzIHdpdGhpbiBvZmZzZXQsIGl0IHdpbGwgZm9yY2UgcmVuZXdcbiAgICAgIGNvbnN0IG9mZnNldCA9IHRoaXMuY29uZmlnLnN5c3RlbS50b2tlblJlbmV3YWxPZmZzZXRTZWNvbmRzIHx8IDMwMDtcbiAgICAgIGlmIChleHBpcmVkICYmIChleHBpcmVkID4gVXRpbHMubm93KCkgKyBvZmZzZXQpKSB7XG4gICAgICAgIGxldCBpZFRva2VuID0gbmV3IElkVG9rZW4oYWNjZXNzVG9rZW5DYWNoZUl0ZW0udmFsdWUuaWRUb2tlbik7XG4gICAgICAgIGlmICghYWNjb3VudCkge1xuICAgICAgICAgIGFjY291bnQgPSB0aGlzLmdldEFjY291bnQoKTtcbiAgICAgICAgICBpZiAoIWFjY291bnQpIHtcbiAgICAgICAgICAgIHRocm93IEF1dGhFcnJvci5jcmVhdGVVbmV4cGVjdGVkRXJyb3IoXCJBY2NvdW50IHNob3VsZCBub3QgYmUgbnVsbCBoZXJlLlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYVN0YXRlID0gdGhpcy5nZXRBY2NvdW50U3RhdGUodGhpcy5jYWNoZVN0b3JhZ2UuZ2V0SXRlbShDb25zdGFudHMuc3RhdGVMb2dpbiwgdGhpcy5pbkNvb2tpZSkpO1xuICAgICAgICBsZXQgcmVzcG9uc2UgOiBBdXRoUmVzcG9uc2UgPSB7XG4gICAgICAgICAgdW5pcXVlSWQ6IFwiXCIsXG4gICAgICAgICAgdGVuYW50SWQ6IFwiXCIsXG4gICAgICAgICAgdG9rZW5UeXBlOiAoYWNjZXNzVG9rZW5DYWNoZUl0ZW0udmFsdWUuaWRUb2tlbiA9PT0gYWNjZXNzVG9rZW5DYWNoZUl0ZW0udmFsdWUuYWNjZXNzVG9rZW4pID8gQ29uc3RhbnRzLmlkVG9rZW4gOiBDb25zdGFudHMuYWNjZXNzVG9rZW4sXG4gICAgICAgICAgaWRUb2tlbjogaWRUb2tlbixcbiAgICAgICAgICBhY2Nlc3NUb2tlbjogYWNjZXNzVG9rZW5DYWNoZUl0ZW0udmFsdWUuYWNjZXNzVG9rZW4sXG4gICAgICAgICAgc2NvcGVzOiBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Quc2NvcGVzLFxuICAgICAgICAgIGV4cGlyZXNPbjogbmV3IERhdGUoZXhwaXJlZCAqIDEwMDApLFxuICAgICAgICAgIGFjY291bnQ6IGFjY291bnQsXG4gICAgICAgICAgYWNjb3VudFN0YXRlOiBhU3RhdGUsXG4gICAgICAgIH07XG4gICAgICAgIFV0aWxzLnNldFJlc3BvbnNlSWRUb2tlbihyZXNwb25zZSwgaWRUb2tlbik7XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnJlbW92ZUl0ZW0oSlNPTi5zdHJpbmdpZnkoZmlsdGVyZWRJdGVtc1swXS5rZXkpKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIGdldCBhIHVuaXF1ZSBsaXN0IG9mIGF1dGhvcml0dWVzIGZyb20gdGhlIGNhY2hlXG4gICAqIEBwYXJhbSB7QXJyYXk8QWNjZXNzVG9rZW5DYWNoZUl0ZW0+fSAgYWNjZXNzVG9rZW5DYWNoZUl0ZW1zIC0gYWNjZXNzVG9rZW5DYWNoZUl0ZW1zIHNhdmVkIGluIHRoZSBjYWNoZVxuICAgKiBAaWdub3JlXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHByaXZhdGUgZ2V0VW5pcXVlQXV0aG9yaXR5KGFjY2Vzc1Rva2VuQ2FjaGVJdGVtczogQXJyYXk8QWNjZXNzVG9rZW5DYWNoZUl0ZW0+LCBwcm9wZXJ0eTogc3RyaW5nKTogQXJyYXk8c3RyaW5nPiB7XG4gICAgY29uc3QgYXV0aG9yaXR5TGlzdDogQXJyYXk8c3RyaW5nPiA9IFtdO1xuICAgIGNvbnN0IGZsYWdzOiBBcnJheTxzdHJpbmc+ID0gW107XG4gICAgYWNjZXNzVG9rZW5DYWNoZUl0ZW1zLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICBpZiAoZWxlbWVudC5rZXkuaGFzT3duUHJvcGVydHkocHJvcGVydHkpICYmIChmbGFncy5pbmRleE9mKGVsZW1lbnQua2V5W3Byb3BlcnR5XSkgPT09IC0xKSkge1xuICAgICAgICBmbGFncy5wdXNoKGVsZW1lbnQua2V5W3Byb3BlcnR5XSk7XG4gICAgICAgIGF1dGhvcml0eUxpc3QucHVzaChlbGVtZW50LmtleVtwcm9wZXJ0eV0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBhdXRob3JpdHlMaXN0O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIEFEQUwgaWRfdG9rZW4gZXhpc3RzIGFuZCByZXR1cm4gaWYgZXhpc3RzLlxuICAgKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIGV4dHJhY3RBREFMSWRUb2tlbigpOiBhbnkge1xuICAgIGNvbnN0IGFkYWxJZFRva2VuID0gdGhpcy5jYWNoZVN0b3JhZ2UuZ2V0SXRlbShDb25zdGFudHMuYWRhbElkVG9rZW4pO1xuICAgIGlmICghVXRpbHMuaXNFbXB0eShhZGFsSWRUb2tlbikpIHtcbiAgICAgICAgcmV0dXJuIFV0aWxzLmV4dHJhY3RJZFRva2VuKGFkYWxJZFRva2VuKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogQWNxdWlyZXMgYWNjZXNzIHRva2VuIHVzaW5nIGEgaGlkZGVuIGlmcmFtZS5cbiAgICogQGlnbm9yZVxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIHJlbmV3VG9rZW4oc2NvcGVzOiBBcnJheTxzdHJpbmc+LCByZXNvbHZlOiBGdW5jdGlvbiwgcmVqZWN0OiBGdW5jdGlvbiwgYWNjb3VudDogQWNjb3VudCwgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0OiBTZXJ2ZXJSZXF1ZXN0UGFyYW1ldGVycyk6IHZvaWQge1xuICAgIGNvbnN0IHNjb3BlID0gc2NvcGVzLmpvaW4oXCIgXCIpLnRvTG93ZXJDYXNlKCk7XG4gICAgdGhpcy5sb2dnZXIudmVyYm9zZShcInJlbmV3VG9rZW4gaXMgY2FsbGVkIGZvciBzY29wZTpcIiArIHNjb3BlKTtcbiAgICBjb25zdCBmcmFtZUhhbmRsZSA9IHRoaXMuYWRkSGlkZGVuSUZyYW1lKFwibXNhbFJlbmV3RnJhbWVcIiArIHNjb3BlKTtcblxuICAgIC8vIENhY2hlIGFjY291bnQgYW5kIGF1dGhvcml0eVxuICAgIHRoaXMuc2V0QWNjb3VudENhY2hlKGFjY291bnQsIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSk7XG4gICAgdGhpcy5zZXRBdXRob3JpdHlDYWNoZShzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGUsIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5hdXRob3JpdHkpO1xuXG4gICAgLy8gcmVuZXcgaGFwcGVucyBpbiBpZnJhbWUsIHNvIGl0IGtlZXBzIGphdmFzY3JpcHQgY29udGV4dFxuICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLm5vbmNlSWRUb2tlbiwgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0Lm5vbmNlLCB0aGlzLmluQ29va2llKTtcbiAgICB0aGlzLmxvZ2dlci52ZXJib3NlKFwiUmVuZXcgdG9rZW4gRXhwZWN0ZWQgc3RhdGU6IFwiICsgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlKTtcblxuICAgIC8vIEJ1aWxkIHVybE5hdmlnYXRlIHdpdGggXCJwcm9tcHQ9bm9uZVwiIGFuZCBuYXZpZ2F0ZSB0byBVUkwgaW4gaGlkZGVuIGlGcmFtZVxuICAgIGxldCB1cmxOYXZpZ2F0ZSA9IFV0aWxzLnVybFJlbW92ZVF1ZXJ5U3RyaW5nUGFyYW1ldGVyKHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5jcmVhdGVOYXZpZ2F0ZVVybChzY29wZXMpLCBDb25zdGFudHMucHJvbXB0KSArIENvbnN0YW50cy5wcm9tcHRfbm9uZTtcblxuICAgIHdpbmRvdy5yZW5ld1N0YXRlcy5wdXNoKHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSk7XG4gICAgd2luZG93LnJlcXVlc3RUeXBlID0gQ29uc3RhbnRzLnJlbmV3VG9rZW47XG4gICAgdGhpcy5yZWdpc3RlckNhbGxiYWNrKHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSwgc2NvcGUsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgdGhpcy5sb2dnZXIuaW5mb1BpaShcIk5hdmlnYXRlIHRvOlwiICsgdXJsTmF2aWdhdGUpO1xuICAgIGZyYW1lSGFuZGxlLnNyYyA9IFwiYWJvdXQ6YmxhbmtcIjtcbiAgICB0aGlzLmxvYWRJZnJhbWVUaW1lb3V0KHVybE5hdmlnYXRlLCBcIm1zYWxSZW5ld0ZyYW1lXCIgKyBzY29wZSwgc2NvcGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbmV3cyBpZHRva2VuIGZvciBhcHBcInMgb3duIGJhY2tlbmQgd2hlbiBjbGllbnRJZCBpcyBwYXNzZWQgYXMgYSBzaW5nbGUgc2NvcGUgaW4gdGhlIHNjb3BlcyBhcnJheS5cbiAgICogQGlnbm9yZVxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIHJlbmV3SWRUb2tlbihzY29wZXM6IEFycmF5PHN0cmluZz4sIHJlc29sdmU6IEZ1bmN0aW9uLCByZWplY3Q6IEZ1bmN0aW9uLCBhY2NvdW50OiBBY2NvdW50LCBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Q6IFNlcnZlclJlcXVlc3RQYXJhbWV0ZXJzKTogdm9pZCB7XG5cbiAgICB0aGlzLmxvZ2dlci5pbmZvKFwicmVuZXdpZFRva2VuIGlzIGNhbGxlZFwiKTtcbiAgICBjb25zdCBmcmFtZUhhbmRsZSA9IHRoaXMuYWRkSGlkZGVuSUZyYW1lKFwibXNhbElkVG9rZW5GcmFtZVwiKTtcblxuICAgIC8vIENhY2hlIGFjY291bnQgYW5kIGF1dGhvcml0eVxuICAgIHRoaXMuc2V0QWNjb3VudENhY2hlKGFjY291bnQsIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSk7XG4gICAgdGhpcy5zZXRBdXRob3JpdHlDYWNoZShzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGUsIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5hdXRob3JpdHkpO1xuXG4gICAgLy8gQ2FjaGUgbm9uY2VcbiAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5ub25jZUlkVG9rZW4sIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5ub25jZSwgdGhpcy5pbkNvb2tpZSk7XG5cbiAgICB0aGlzLmxvZ2dlci52ZXJib3NlKFwiUmVuZXcgSWR0b2tlbiBFeHBlY3RlZCBzdGF0ZTogXCIgKyBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGUpO1xuXG4gICAgLy8gQnVpbGQgdXJsTmF2aWdhdGUgd2l0aCBcInByb21wdD1ub25lXCIgYW5kIG5hdmlnYXRlIHRvIFVSTCBpbiBoaWRkZW4gaUZyYW1lXG4gICAgbGV0IHVybE5hdmlnYXRlID0gVXRpbHMudXJsUmVtb3ZlUXVlcnlTdHJpbmdQYXJhbWV0ZXIoc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LmNyZWF0ZU5hdmlnYXRlVXJsKHNjb3BlcyksIENvbnN0YW50cy5wcm9tcHQpICsgQ29uc3RhbnRzLnByb21wdF9ub25lO1xuXG4gICAgaWYgKHRoaXMuc2lsZW50TG9naW4pIHtcbiAgICAgICAgd2luZG93LnJlcXVlc3RUeXBlID0gQ29uc3RhbnRzLmxvZ2luO1xuICAgICAgICB0aGlzLnNpbGVudEF1dGhlbnRpY2F0aW9uU3RhdGUgPSBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgd2luZG93LnJlcXVlc3RUeXBlID0gQ29uc3RhbnRzLnJlbmV3VG9rZW47XG4gICAgICAgIHdpbmRvdy5yZW5ld1N0YXRlcy5wdXNoKHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSk7XG4gICAgfVxuXG4gICAgLy8gbm90ZTogc2NvcGUgaGVyZSBpcyBjbGllbnRJZFxuICAgIHRoaXMucmVnaXN0ZXJDYWxsYmFjayhzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGUsIHRoaXMuY2xpZW50SWQsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgdGhpcy5sb2dnZXIuaW5mb1BpaShcIk5hdmlnYXRlIHRvOlwiICsgdXJsTmF2aWdhdGUpO1xuICAgIGZyYW1lSGFuZGxlLnNyYyA9IFwiYWJvdXQ6YmxhbmtcIjtcbiAgICB0aGlzLmxvYWRJZnJhbWVUaW1lb3V0KHVybE5hdmlnYXRlLCBcIm1zYWxJZFRva2VuRnJhbWVcIiwgdGhpcy5jbGllbnRJZCk7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBtZXRob2QgbXVzdCBiZSBjYWxsZWQgZm9yIHByb2Nlc3NpbmcgdGhlIHJlc3BvbnNlIHJlY2VpdmVkIGZyb20gQUFELiBJdCBleHRyYWN0cyB0aGUgaGFzaCwgcHJvY2Vzc2VzIHRoZSB0b2tlbiBvciBlcnJvciwgc2F2ZXMgaXQgaW4gdGhlIGNhY2hlIGFuZCBjYWxscyB0aGUgcmVnaXN0ZXJlZCBjYWxsYmFja3Mgd2l0aCB0aGUgcmVzdWx0LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gYXV0aG9yaXR5IGF1dGhvcml0eSByZWNlaXZlZCBpbiB0aGUgcmVkaXJlY3QgcmVzcG9uc2UgZnJvbSBBQUQuXG4gICAqIEBwYXJhbSB7VG9rZW5SZXNwb25zZX0gcmVxdWVzdEluZm8gYW4gb2JqZWN0IGNyZWF0ZWQgZnJvbSB0aGUgcmVkaXJlY3QgcmVzcG9uc2UgZnJvbSBBQUQgY29tcHJpc2luZyBvZiB0aGUga2V5cyAtIHBhcmFtZXRlcnMsIHJlcXVlc3RUeXBlLCBzdGF0ZU1hdGNoLCBzdGF0ZVJlc3BvbnNlIGFuZCB2YWxpZC5cbiAgICogQHBhcmFtIHtBY2NvdW50fSBhY2NvdW50IGFjY291bnQgb2JqZWN0IGZvciB3aGljaCBzY29wZXMgYXJlIGNvbnNlbnRlZCBmb3IuIFRoZSBkZWZhdWx0IGFjY291bnQgaXMgdGhlIGxvZ2dlZCBpbiBhY2NvdW50LlxuICAgKiBAcGFyYW0ge0NsaWVudEluZm99IGNsaWVudEluZm8gY2xpZW50SW5mbyByZWNlaXZlZCBhcyBwYXJ0IG9mIHRoZSByZXNwb25zZSBjb21wcmlzaW5nIG9mIGZpZWxkcyB1aWQgYW5kIHV0aWQuXG4gICAqIEBwYXJhbSB7SWRUb2tlbn0gaWRUb2tlbiBpZFRva2VuIHJlY2VpdmVkIGFzIHBhcnQgb2YgdGhlIHJlc3BvbnNlLlxuICAgKiBAaWdub3JlXG4gICAqIEBwcml2YXRlXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIC8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXG4gIHByaXZhdGUgc2F2ZUFjY2Vzc1Rva2VuKHJlc3BvbnNlOiBBdXRoUmVzcG9uc2UsIGF1dGhvcml0eTogc3RyaW5nLCBwYXJhbWV0ZXJzOiBhbnksIGNsaWVudEluZm86IHN0cmluZyk6IEF1dGhSZXNwb25zZSB7XG4gICAgbGV0IHNjb3BlOiBzdHJpbmc7XG4gICAgbGV0IGFjY2Vzc1Rva2VuUmVzcG9uc2UgPSB7IC4uLnJlc3BvbnNlIH07XG4gICAgY29uc3QgY2xpZW50T2JqOiBDbGllbnRJbmZvID0gbmV3IENsaWVudEluZm8oY2xpZW50SW5mbyk7XG5cbiAgICAvLyBpZiB0aGUgcmVzcG9uc2UgY29udGFpbnMgXCJzY29wZVwiXG4gICAgaWYgKHBhcmFtZXRlcnMuaGFzT3duUHJvcGVydHkoXCJzY29wZVwiKSkge1xuICAgICAgLy8gcmVhZCB0aGUgc2NvcGVzXG4gICAgICBzY29wZSA9IHBhcmFtZXRlcnNbXCJzY29wZVwiXTtcbiAgICAgIGNvbnN0IGNvbnNlbnRlZFNjb3BlcyA9IHNjb3BlLnNwbGl0KFwiIFwiKTtcblxuICAgICAgLy8gcmV0cmlldmUgYWxsIGFjY2VzcyB0b2tlbnMgZnJvbSB0aGUgY2FjaGUsIHJlbW92ZSB0aGUgZHVwIHNjb3Jlc1xuICAgICAgY29uc3QgYWNjZXNzVG9rZW5DYWNoZUl0ZW1zID0gdGhpcy5jYWNoZVN0b3JhZ2UuZ2V0QWxsQWNjZXNzVG9rZW5zKHRoaXMuY2xpZW50SWQsIGF1dGhvcml0eSk7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWNjZXNzVG9rZW5DYWNoZUl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGFjY2Vzc1Rva2VuQ2FjaGVJdGVtID0gYWNjZXNzVG9rZW5DYWNoZUl0ZW1zW2ldO1xuXG4gICAgICAgIGlmIChhY2Nlc3NUb2tlbkNhY2hlSXRlbS5rZXkuaG9tZUFjY291bnRJZGVudGlmaWVyID09PSByZXNwb25zZS5hY2NvdW50LmhvbWVBY2NvdW50SWRlbnRpZmllcikge1xuICAgICAgICAgIGNvbnN0IGNhY2hlZFNjb3BlcyA9IGFjY2Vzc1Rva2VuQ2FjaGVJdGVtLmtleS5zY29wZXMuc3BsaXQoXCIgXCIpO1xuICAgICAgICAgIGlmIChVdGlscy5pc0ludGVyc2VjdGluZ1Njb3BlcyhjYWNoZWRTY29wZXMsIGNvbnNlbnRlZFNjb3BlcykpIHtcbiAgICAgICAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnJlbW92ZUl0ZW0oSlNPTi5zdHJpbmdpZnkoYWNjZXNzVG9rZW5DYWNoZUl0ZW0ua2V5KSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEdlbmVyYXRlIGFuZCBjYWNoZSBhY2Nlc3NUb2tlbktleSBhbmQgYWNjZXNzVG9rZW5WYWx1ZVxuICAgICAgY29uc3QgZXhwaXJlc0luID0gVXRpbHMuZXhwaXJlc0luKHBhcmFtZXRlcnNbQ29uc3RhbnRzLmV4cGlyZXNJbl0pLnRvU3RyaW5nKCk7XG4gICAgICBjb25zdCBhY2Nlc3NUb2tlbktleSA9IG5ldyBBY2Nlc3NUb2tlbktleShhdXRob3JpdHksIHRoaXMuY2xpZW50SWQsIHNjb3BlLCBjbGllbnRPYmoudWlkLCBjbGllbnRPYmoudXRpZCk7XG4gICAgICBjb25zdCBhY2Nlc3NUb2tlblZhbHVlID0gbmV3IEFjY2Vzc1Rva2VuVmFsdWUocGFyYW1ldGVyc1tDb25zdGFudHMuYWNjZXNzVG9rZW5dLCByZXNwb25zZS5pZFRva2VuLnJhd0lkVG9rZW4sIGV4cGlyZXNJbiwgY2xpZW50SW5mbyk7XG5cbiAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oSlNPTi5zdHJpbmdpZnkoYWNjZXNzVG9rZW5LZXkpLCBKU09OLnN0cmluZ2lmeShhY2Nlc3NUb2tlblZhbHVlKSk7XG5cbiAgICAgIGFjY2Vzc1Rva2VuUmVzcG9uc2UuYWNjZXNzVG9rZW4gID0gcGFyYW1ldGVyc1tDb25zdGFudHMuYWNjZXNzVG9rZW5dO1xuICAgICAgYWNjZXNzVG9rZW5SZXNwb25zZS5zY29wZXMgPSBjb25zZW50ZWRTY29wZXM7XG4gICAgICBsZXQgZXhwID0gTnVtYmVyKGV4cGlyZXNJbik7XG4gICAgICBpZiAoZXhwKSB7XG4gICAgICAgIGFjY2Vzc1Rva2VuUmVzcG9uc2UuZXhwaXJlc09uID0gbmV3IERhdGUoKFV0aWxzLm5vdygpICsgZXhwKSAqIDEwMDApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoXCJDb3VsZCBub3QgcGFyc2UgZXhwaXJlc0luIHBhcmFtZXRlci4gR2l2ZW4gdmFsdWU6IFwiICsgZXhwaXJlc0luKTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gaWYgdGhlIHJlc3BvbnNlIGRvZXMgbm90IGNvbnRhaW4gXCJzY29wZVwiIC0gc2NvcGUgaXMgdXN1YWxseSBjbGllbnRfaWQgYW5kIHRoZSB0b2tlbiB3aWxsIGJlIGlkX3Rva2VuXG4gICAgZWxzZSB7XG4gICAgICBzY29wZSA9IHRoaXMuY2xpZW50SWQ7XG5cbiAgICAgIC8vIEdlbmVyYXRlIGFuZCBjYWNoZSBhY2Nlc3NUb2tlbktleSBhbmQgYWNjZXNzVG9rZW5WYWx1ZVxuICAgICAgY29uc3QgYWNjZXNzVG9rZW5LZXkgPSBuZXcgQWNjZXNzVG9rZW5LZXkoYXV0aG9yaXR5LCB0aGlzLmNsaWVudElkLCBzY29wZSwgY2xpZW50T2JqLnVpZCwgY2xpZW50T2JqLnV0aWQpO1xuXG4gICAgICBjb25zdCBhY2Nlc3NUb2tlblZhbHVlID0gbmV3IEFjY2Vzc1Rva2VuVmFsdWUocGFyYW1ldGVyc1tDb25zdGFudHMuaWRUb2tlbl0sIHBhcmFtZXRlcnNbQ29uc3RhbnRzLmlkVG9rZW5dLCByZXNwb25zZS5pZFRva2VuLmV4cGlyYXRpb24sIGNsaWVudEluZm8pO1xuICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShKU09OLnN0cmluZ2lmeShhY2Nlc3NUb2tlbktleSksIEpTT04uc3RyaW5naWZ5KGFjY2Vzc1Rva2VuVmFsdWUpKTtcbiAgICAgIGFjY2Vzc1Rva2VuUmVzcG9uc2Uuc2NvcGVzID0gW3Njb3BlXTtcbiAgICAgIGFjY2Vzc1Rva2VuUmVzcG9uc2UuYWNjZXNzVG9rZW4gPSBwYXJhbWV0ZXJzW0NvbnN0YW50cy5pZFRva2VuXTtcbiAgICAgIGxldCBleHAgPSBOdW1iZXIocmVzcG9uc2UuaWRUb2tlbi5leHBpcmF0aW9uKTtcbiAgICAgIGlmIChleHApIHtcbiAgICAgICAgYWNjZXNzVG9rZW5SZXNwb25zZS5leHBpcmVzT24gPSBuZXcgRGF0ZShleHAgKiAxMDAwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKFwiQ291bGQgbm90IHBhcnNlIGV4cGlyZXNJbiBwYXJhbWV0ZXJcIik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhY2Nlc3NUb2tlblJlc3BvbnNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNhdmVzIHRva2VuIG9yIGVycm9yIHJlY2VpdmVkIGluIHRoZSByZXNwb25zZSBmcm9tIEFBRCBpbiB0aGUgY2FjaGUuIEluIGNhc2Ugb2YgaWRfdG9rZW4sIGl0IGFsc28gY3JlYXRlcyB0aGUgYWNjb3VudCBvYmplY3QuXG4gICAqIEBpZ25vcmVcbiAgICogQGhpZGRlblxuICAgKi9cbiAgcHJvdGVjdGVkIHNhdmVUb2tlbkZyb21IYXNoKGhhc2g6IHN0cmluZywgc3RhdGVJbmZvOiBSZXNwb25zZVN0YXRlSW5mbyk6IEF1dGhSZXNwb25zZSB7XG4gICAgdGhpcy5sb2dnZXIuaW5mbyhcIlN0YXRlIHN0YXR1czpcIiArIHN0YXRlSW5mby5zdGF0ZU1hdGNoICsgXCI7IFJlcXVlc3QgdHlwZTpcIiArIHN0YXRlSW5mby5yZXF1ZXN0VHlwZSk7XG4gICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbEVycm9yLCBcIlwiKTtcbiAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsRXJyb3JEZXNjcmlwdGlvbiwgXCJcIik7XG5cbiAgICBsZXQgcmVzcG9uc2UgOiBBdXRoUmVzcG9uc2UgPSB7XG4gICAgICB1bmlxdWVJZDogXCJcIixcbiAgICAgIHRlbmFudElkOiBcIlwiLFxuICAgICAgdG9rZW5UeXBlOiBcIlwiLFxuICAgICAgaWRUb2tlbjogbnVsbCxcbiAgICAgIGFjY2Vzc1Rva2VuOiBudWxsLFxuICAgICAgc2NvcGVzOiBbXSxcbiAgICAgIGV4cGlyZXNPbjogbnVsbCxcbiAgICAgIGFjY291bnQ6IG51bGwsXG4gICAgICBhY2NvdW50U3RhdGU6IFwiXCIsXG4gICAgfTtcblxuICAgIGxldCBlcnJvcjogQXV0aEVycm9yO1xuICAgIGNvbnN0IGhhc2hQYXJhbXMgPSB0aGlzLmRlc2VyaWFsaXplSGFzaChoYXNoKTtcbiAgICBsZXQgYXV0aG9yaXR5S2V5OiBzdHJpbmcgPSBcIlwiO1xuICAgIGxldCBhY3F1aXJlVG9rZW5BY2NvdW50S2V5OiBzdHJpbmcgPSBcIlwiO1xuXG4gICAgLy8gSWYgc2VydmVyIHJldHVybnMgYW4gZXJyb3JcbiAgICBpZiAoaGFzaFBhcmFtcy5oYXNPd25Qcm9wZXJ0eShDb25zdGFudHMuZXJyb3JEZXNjcmlwdGlvbikgfHwgaGFzaFBhcmFtcy5oYXNPd25Qcm9wZXJ0eShDb25zdGFudHMuZXJyb3IpKSB7XG4gICAgICB0aGlzLmxvZ2dlci5pbmZvUGlpKFwiRXJyb3IgOlwiICsgaGFzaFBhcmFtc1tDb25zdGFudHMuZXJyb3JdICsgXCI7IEVycm9yIGRlc2NyaXB0aW9uOlwiICsgaGFzaFBhcmFtc1tDb25zdGFudHMuZXJyb3JEZXNjcmlwdGlvbl0pO1xuICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbEVycm9yLCBoYXNoUGFyYW1zW0NvbnN0YW50cy5lcnJvcl0pO1xuICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbEVycm9yRGVzY3JpcHRpb24sIGhhc2hQYXJhbXNbQ29uc3RhbnRzLmVycm9yRGVzY3JpcHRpb25dKTtcblxuICAgICAgLy8gbG9naW5cbiAgICAgIGlmIChzdGF0ZUluZm8ucmVxdWVzdFR5cGUgPT09IENvbnN0YW50cy5sb2dpbikge1xuICAgICAgICB0aGlzLmxvZ2luSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5sb2dpbkVycm9yLCBoYXNoUGFyYW1zW0NvbnN0YW50cy5lcnJvckRlc2NyaXB0aW9uXSArIFwiOlwiICsgaGFzaFBhcmFtc1tDb25zdGFudHMuZXJyb3JdKTtcbiAgICAgICAgYXV0aG9yaXR5S2V5ID0gU3RvcmFnZS5nZW5lcmF0ZUF1dGhvcml0eUtleShzdGF0ZUluZm8uc3RhdGUpO1xuICAgICAgfVxuXG4gICAgICAvLyBhY3F1aXJlVG9rZW5cbiAgICAgIGlmIChzdGF0ZUluZm8ucmVxdWVzdFR5cGUgPT09IENvbnN0YW50cy5yZW5ld1Rva2VuKSB7XG4gICAgICAgIHRoaXMuYWNxdWlyZVRva2VuSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgICAgICBhdXRob3JpdHlLZXkgPSBTdG9yYWdlLmdlbmVyYXRlQXV0aG9yaXR5S2V5KHN0YXRlSW5mby5zdGF0ZSk7XG5cbiAgICAgICAgY29uc3QgYWNjb3VudDogQWNjb3VudCA9IHRoaXMuZ2V0QWNjb3VudCgpO1xuICAgICAgICBjb25zdCBhY2NvdW50SWQ6IHN0cmluZyA9IGFjY291bnQgPyB0aGlzLmdldEFjY291bnRJZChhY2NvdW50KSA6IFwiXCI7XG5cbiAgICAgICAgYWNxdWlyZVRva2VuQWNjb3VudEtleSA9IFN0b3JhZ2UuZ2VuZXJhdGVBY3F1aXJlVG9rZW5BY2NvdW50S2V5KGFjY291bnRJZCwgc3RhdGVJbmZvLnN0YXRlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuaXNJbnRlcmFjdGlvblJlcXVpcmVkKGhhc2hQYXJhbXNbQ29uc3RhbnRzLmVycm9yRGVzY3JpcHRpb25dKSkge1xuICAgICAgICBlcnJvciA9IG5ldyBJbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yKGhhc2hQYXJhbXNbQ29uc3RhbnRzLmVycm9yXSwgaGFzaFBhcmFtc1tDb25zdGFudHMuZXJyb3JEZXNjcmlwdGlvbl0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXJyb3IgPSBuZXcgU2VydmVyRXJyb3IoaGFzaFBhcmFtc1tDb25zdGFudHMuZXJyb3JdLCBoYXNoUGFyYW1zW0NvbnN0YW50cy5lcnJvckRlc2NyaXB0aW9uXSk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIElmIHRoZSBzZXJ2ZXIgcmV0dXJucyBcIlN1Y2Nlc3NcIlxuICAgIGVsc2Uge1xuICAgICAgLy8gVmVyaWZ5IHRoZSBzdGF0ZSBmcm9tIHJlZGlyZWN0IGFuZCByZWNvcmQgdG9rZW5zIHRvIHN0b3JhZ2UgaWYgZXhpc3RzXG4gICAgICBpZiAoc3RhdGVJbmZvLnN0YXRlTWF0Y2gpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbyhcIlN0YXRlIGlzIHJpZ2h0XCIpO1xuICAgICAgICBpZiAoaGFzaFBhcmFtcy5oYXNPd25Qcm9wZXJ0eShDb25zdGFudHMuc2Vzc2lvblN0YXRlKSkge1xuICAgICAgICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbFNlc3Npb25TdGF0ZSwgaGFzaFBhcmFtc1tDb25zdGFudHMuc2Vzc2lvblN0YXRlXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzcG9uc2UuYWNjb3VudFN0YXRlID0gc3RhdGVJbmZvLnN0YXRlO1xuXG4gICAgICAgIGxldCBjbGllbnRJbmZvOiBzdHJpbmcgPSBcIlwiO1xuXG4gICAgICAgIC8vIFByb2Nlc3MgYWNjZXNzX3Rva2VuXG4gICAgICAgIGlmIChoYXNoUGFyYW1zLmhhc093blByb3BlcnR5KENvbnN0YW50cy5hY2Nlc3NUb2tlbikpIHtcbiAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKFwiRnJhZ21lbnQgaGFzIGFjY2VzcyB0b2tlblwiKTtcbiAgICAgICAgICB0aGlzLmFjcXVpcmVUb2tlbkluUHJvZ3Jlc3MgPSBmYWxzZTtcblxuICAgICAgICAgIC8vIHJldHJpZXZlIHRoZSBpZF90b2tlbiBmcm9tIHJlc3BvbnNlIGlmIHByZXNlbnQgOlxuICAgICAgICAgIGlmIChoYXNoUGFyYW1zLmhhc093blByb3BlcnR5KENvbnN0YW50cy5pZFRva2VuKSkge1xuICAgICAgICAgICAgcmVzcG9uc2UuaWRUb2tlbiA9IG5ldyBJZFRva2VuKGhhc2hQYXJhbXNbQ29uc3RhbnRzLmlkVG9rZW5dKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzcG9uc2UgPSBVdGlscy5zZXRSZXNwb25zZUlkVG9rZW4ocmVzcG9uc2UsIG5ldyBJZFRva2VuKHRoaXMuY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLmlkVG9rZW5LZXkpKSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gcmV0cmlldmUgdGhlIGF1dGhvcml0eSBmcm9tIGNhY2hlIGFuZCByZXBsYWNlIHdpdGggdGVuYW50SURcbiAgICAgICAgICBjb25zdCBhdXRob3JpdHlLZXkgPSBTdG9yYWdlLmdlbmVyYXRlQXV0aG9yaXR5S2V5KHN0YXRlSW5mby5zdGF0ZSk7XG4gICAgICAgICAgbGV0IGF1dGhvcml0eTogc3RyaW5nID0gdGhpcy5jYWNoZVN0b3JhZ2UuZ2V0SXRlbShhdXRob3JpdHlLZXksIHRoaXMuaW5Db29raWUpO1xuXG4gICAgICAgICAgaWYgKCFVdGlscy5pc0VtcHR5KGF1dGhvcml0eSkpIHtcbiAgICAgICAgICAgIGF1dGhvcml0eSA9IFV0aWxzLnJlcGxhY2VUZW5hbnRQYXRoKGF1dGhvcml0eSwgcmVzcG9uc2UudGVuYW50SWQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIHJldHJpZXZlIGNsaWVudF9pbmZvIC0gaWYgaXQgaXMgbm90IGZvdW5kLCBnZW5lcmF0ZSB0aGUgdWlkIGFuZCB1dGlkIGZyb20gaWRUb2tlblxuICAgICAgICAgIGlmIChoYXNoUGFyYW1zLmhhc093blByb3BlcnR5KENvbnN0YW50cy5jbGllbnRJbmZvKSkge1xuICAgICAgICAgICAgY2xpZW50SW5mbyA9IGhhc2hQYXJhbXNbQ29uc3RhbnRzLmNsaWVudEluZm9dO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuaW5nKFwiQ2xpZW50SW5mbyBub3QgcmVjZWl2ZWQgaW4gdGhlIHJlc3BvbnNlIGZyb20gQUFEXCIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlc3BvbnNlLmFjY291bnQgPSBBY2NvdW50LmNyZWF0ZUFjY291bnQocmVzcG9uc2UuaWRUb2tlbiwgbmV3IENsaWVudEluZm8oY2xpZW50SW5mbykpO1xuICAgICAgICAgIGNvbnN0IGFjY291bnRLZXk6IHN0cmluZyA9IHRoaXMuZ2V0QWNjb3VudElkKHJlc3BvbnNlLmFjY291bnQpO1xuXG4gICAgICAgICAgYWNxdWlyZVRva2VuQWNjb3VudEtleSA9IFN0b3JhZ2UuZ2VuZXJhdGVBY3F1aXJlVG9rZW5BY2NvdW50S2V5KGFjY291bnRLZXksIHN0YXRlSW5mby5zdGF0ZSk7XG4gICAgICAgICAgY29uc3QgYWNxdWlyZVRva2VuQWNjb3VudEtleV9ub2FjY291bnQgPSBTdG9yYWdlLmdlbmVyYXRlQWNxdWlyZVRva2VuQWNjb3VudEtleShDb25zdGFudHMubm9fYWNjb3VudCwgc3RhdGVJbmZvLnN0YXRlKTtcblxuICAgICAgICAgIGxldCBjYWNoZWRBY2NvdW50OiBzdHJpbmcgPSB0aGlzLmNhY2hlU3RvcmFnZS5nZXRJdGVtKGFjcXVpcmVUb2tlbkFjY291bnRLZXkpO1xuICAgICAgICAgIGxldCBhY3F1aXJlVG9rZW5BY2NvdW50OiBBY2NvdW50O1xuXG4gICAgICAgICAgLy8gQ2hlY2sgd2l0aCB0aGUgYWNjb3VudCBpbiB0aGUgQ2FjaGVcbiAgICAgICAgICBpZiAoIVV0aWxzLmlzRW1wdHkoY2FjaGVkQWNjb3VudCkpIHtcbiAgICAgICAgICAgIGFjcXVpcmVUb2tlbkFjY291bnQgPSBKU09OLnBhcnNlKGNhY2hlZEFjY291bnQpO1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmFjY291bnQgJiYgYWNxdWlyZVRva2VuQWNjb3VudCAmJiBVdGlscy5jb21wYXJlQWNjb3VudHMocmVzcG9uc2UuYWNjb3VudCwgYWNxdWlyZVRva2VuQWNjb3VudCkpIHtcbiAgICAgICAgICAgICAgcmVzcG9uc2UgPSB0aGlzLnNhdmVBY2Nlc3NUb2tlbihyZXNwb25zZSwgYXV0aG9yaXR5LCBoYXNoUGFyYW1zLCBjbGllbnRJbmZvKTtcbiAgICAgICAgICAgICAgdGhpcy5sb2dnZXIuaW5mbyhcIlRoZSB1c2VyIG9iamVjdCByZWNlaXZlZCBpbiB0aGUgcmVzcG9uc2UgaXMgdGhlIHNhbWUgYXMgdGhlIG9uZSBwYXNzZWQgaW4gdGhlIGFjcXVpcmVUb2tlbiByZXF1ZXN0XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm5pbmcoXG4gICAgICAgICAgICAgICAgXCJUaGUgYWNjb3VudCBvYmplY3QgY3JlYXRlZCBmcm9tIHRoZSByZXNwb25zZSBpcyBub3QgdGhlIHNhbWUgYXMgdGhlIG9uZSBwYXNzZWQgaW4gdGhlIGFjcXVpcmVUb2tlbiByZXF1ZXN0XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmICghVXRpbHMuaXNFbXB0eSh0aGlzLmNhY2hlU3RvcmFnZS5nZXRJdGVtKGFjcXVpcmVUb2tlbkFjY291bnRLZXlfbm9hY2NvdW50KSkpIHtcbiAgICAgICAgICAgIHJlc3BvbnNlID0gdGhpcy5zYXZlQWNjZXNzVG9rZW4ocmVzcG9uc2UsIGF1dGhvcml0eSwgaGFzaFBhcmFtcywgY2xpZW50SW5mbyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJvY2VzcyBpZF90b2tlblxuICAgICAgICBpZiAoaGFzaFBhcmFtcy5oYXNPd25Qcm9wZXJ0eShDb25zdGFudHMuaWRUb2tlbikpIHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLmluZm8oXCJGcmFnbWVudCBoYXMgaWQgdG9rZW5cIik7XG5cbiAgICAgICAgICAgIC8vIGxvZ2luIG5vIGxvbmdlciBpbiBwcm9ncmVzc1xuICAgICAgICAgICAgdGhpcy5sb2dpbkluUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICAgICAgICAgIHJlc3BvbnNlID0gVXRpbHMuc2V0UmVzcG9uc2VJZFRva2VuKHJlc3BvbnNlLCBuZXcgSWRUb2tlbihoYXNoUGFyYW1zW0NvbnN0YW50cy5pZFRva2VuXSkpO1xuICAgICAgICAgICAgaWYgKGhhc2hQYXJhbXMuaGFzT3duUHJvcGVydHkoQ29uc3RhbnRzLmNsaWVudEluZm8pKSB7XG4gICAgICAgICAgICAgIGNsaWVudEluZm8gPSBoYXNoUGFyYW1zW0NvbnN0YW50cy5jbGllbnRJbmZvXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm5pbmcoXCJDbGllbnRJbmZvIG5vdCByZWNlaXZlZCBpbiB0aGUgcmVzcG9uc2UgZnJvbSBBQURcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF1dGhvcml0eUtleSA9IFN0b3JhZ2UuZ2VuZXJhdGVBdXRob3JpdHlLZXkoc3RhdGVJbmZvLnN0YXRlKTtcbiAgICAgICAgICAgIGxldCBhdXRob3JpdHk6IHN0cmluZyA9IHRoaXMuY2FjaGVTdG9yYWdlLmdldEl0ZW0oYXV0aG9yaXR5S2V5LCB0aGlzLmluQ29va2llKTtcblxuICAgICAgICAgICAgaWYgKCFVdGlscy5pc0VtcHR5KGF1dGhvcml0eSkpIHtcbiAgICAgICAgICAgICAgYXV0aG9yaXR5ID0gVXRpbHMucmVwbGFjZVRlbmFudFBhdGgoYXV0aG9yaXR5LCByZXNwb25zZS5pZFRva2VuLnRlbmFudElkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5hY2NvdW50ID0gQWNjb3VudC5jcmVhdGVBY2NvdW50KHJlc3BvbnNlLmlkVG9rZW4sIG5ldyBDbGllbnRJbmZvKGNsaWVudEluZm8pKTtcbiAgICAgICAgICAgIHJlc3BvbnNlLmFjY291bnQgPSB0aGlzLmFjY291bnQ7XG5cbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5pZFRva2VuICYmIHJlc3BvbnNlLmlkVG9rZW4ubm9uY2UpIHtcbiAgICAgICAgICAgICAgLy8gY2hlY2sgbm9uY2UgaW50ZWdyaXR5IGlmIGlkVG9rZW4gaGFzIG5vbmNlIC0gdGhyb3cgYW4gZXJyb3IgaWYgbm90IG1hdGNoZWRcbiAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmlkVG9rZW4ubm9uY2UgIT09IHRoaXMuY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLm5vbmNlSWRUb2tlbiwgdGhpcy5pbkNvb2tpZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFjY291bnQgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLmxvZ2luRXJyb3IsIFwiTm9uY2UgTWlzbWF0Y2guIEV4cGVjdGVkIE5vbmNlOiBcIiArIHRoaXMuY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLm5vbmNlSWRUb2tlbiwgdGhpcy5pbkNvb2tpZSkgKyBcIixcIiArIFwiQWN0dWFsIE5vbmNlOiBcIiArIHJlc3BvbnNlLmlkVG9rZW4ubm9uY2UpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKFwiTm9uY2UgTWlzbWF0Y2guRXhwZWN0ZWQgTm9uY2U6IFwiICsgdGhpcy5jYWNoZVN0b3JhZ2UuZ2V0SXRlbShDb25zdGFudHMubm9uY2VJZFRva2VuLCB0aGlzLmluQ29va2llKSArIFwiLFwiICsgXCJBY3R1YWwgTm9uY2U6IFwiICsgcmVzcG9uc2UuaWRUb2tlbi5ub25jZSk7XG4gICAgICAgICAgICAgICAgZXJyb3IgPSBDbGllbnRBdXRoRXJyb3IuY3JlYXRlTm9uY2VNaXNtYXRjaEVycm9yKHRoaXMuY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLm5vbmNlSWRUb2tlbiwgdGhpcy5pbkNvb2tpZSksIHJlc3BvbnNlLmlkVG9rZW4ubm9uY2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vIFNhdmUgdGhlIHRva2VuXG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLmlkVG9rZW5LZXksIGhhc2hQYXJhbXNbQ29uc3RhbnRzLmlkVG9rZW5dKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsQ2xpZW50SW5mbywgY2xpZW50SW5mbyk7XG5cbiAgICAgICAgICAgICAgICAvLyBTYXZlIGlkVG9rZW4gYXMgYWNjZXNzIHRva2VuIGZvciBhcHAgaXRzZWxmXG4gICAgICAgICAgICAgICAgdGhpcy5zYXZlQWNjZXNzVG9rZW4ocmVzcG9uc2UsIGF1dGhvcml0eSwgaGFzaFBhcmFtcywgY2xpZW50SW5mbyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGF1dGhvcml0eUtleSA9IHN0YXRlSW5mby5zdGF0ZTtcbiAgICAgICAgICAgICAgYWNxdWlyZVRva2VuQWNjb3VudEtleSA9IHN0YXRlSW5mby5zdGF0ZTtcbiAgICAgICAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoXCJJbnZhbGlkIGlkX3Rva2VuIHJlY2VpdmVkIGluIHRoZSByZXNwb25zZVwiKTtcbiAgICAgICAgICAgICAgZXJyb3IgPSBDbGllbnRBdXRoRXJyb3IuY3JlYXRlSW52YWxpZElkVG9rZW5FcnJvcihyZXNwb25zZS5pZFRva2VuKTtcbiAgICAgICAgICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbEVycm9yLCBlcnJvci5lcnJvckNvZGUpO1xuICAgICAgICAgICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsRXJyb3JEZXNjcmlwdGlvbiwgZXJyb3IuZXJyb3JNZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gU3RhdGUgbWlzbWF0Y2ggLSB1bmV4cGVjdGVkL2ludmFsaWQgc3RhdGVcbiAgICAgIGVsc2Uge1xuICAgICAgICBhdXRob3JpdHlLZXkgPSBzdGF0ZUluZm8uc3RhdGU7XG4gICAgICAgIGFjcXVpcmVUb2tlbkFjY291bnRLZXkgPSBzdGF0ZUluZm8uc3RhdGU7XG5cbiAgICAgICAgY29uc3QgZXhwZWN0ZWRTdGF0ZSA9IHRoaXMuY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLnN0YXRlTG9naW4sIHRoaXMuaW5Db29raWUpO1xuICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcihcIlN0YXRlIE1pc21hdGNoLkV4cGVjdGVkIFN0YXRlOiBcIiArIGV4cGVjdGVkU3RhdGUgKyBcIixcIiArIFwiQWN0dWFsIFN0YXRlOiBcIiArIHN0YXRlSW5mby5zdGF0ZSk7XG5cbiAgICAgICAgZXJyb3IgPSBDbGllbnRBdXRoRXJyb3IuY3JlYXRlSW52YWxpZFN0YXRlRXJyb3Ioc3RhdGVJbmZvLnN0YXRlLCBleHBlY3RlZFN0YXRlKTtcbiAgICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbEVycm9yLCBlcnJvci5lcnJvckNvZGUpO1xuICAgICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsRXJyb3JEZXNjcmlwdGlvbiwgZXJyb3IuZXJyb3JNZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5yZW5ld1N0YXR1cyArIHN0YXRlSW5mby5zdGF0ZSwgQ29uc3RhbnRzLnRva2VuUmVuZXdTdGF0dXNDb21wbGV0ZWQpO1xuICAgIHRoaXMuY2FjaGVTdG9yYWdlLnJlbW92ZUFjcXVpcmVUb2tlbkVudHJpZXMoYXV0aG9yaXR5S2V5LCBhY3F1aXJlVG9rZW5BY2NvdW50S2V5KTtcbiAgICAvLyB0aGlzIGlzIHJlcXVpcmVkIGlmIG5hdmlnYXRlVG9Mb2dpblJlcXVlc3RVcmw9ZmFsc2VcbiAgICBpZiAodGhpcy5pbkNvb2tpZSkge1xuICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbUNvb2tpZShhdXRob3JpdHlLZXksIFwiXCIsIC0xKTtcbiAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLmNsZWFyQ29va2llKCk7XG4gICAgfVxuICAgIGlmIChlcnJvcikge1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICAgIHJldHVybiByZXNwb25zZTtcbiAgfVxuICAvKiB0c2xpbnQ6ZW5hYmxlOm5vLXN0cmluZy1saXRlcmFsICovXG5cbiAgLy8jZW5kcmVnaW9uXG5cbiAgLy8jcmVnaW9uIEFjY291bnRcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgc2lnbmVkIGluIGFjY291bnQgKHJlY2VpdmVkIGZyb20gYW4gYWNjb3VudCBvYmplY3QgY3JlYXRlZCBhdCB0aGUgdGltZSBvZiBsb2dpbikgb3IgbnVsbC5cbiAgICovXG4gIGdldEFjY291bnQoKTogQWNjb3VudCB7XG4gICAgLy8gaWYgYSBzZXNzaW9uIGFscmVhZHkgZXhpc3RzLCBnZXQgdGhlIGFjY291bnQgZnJvbSB0aGUgc2Vzc2lvblxuICAgIGlmICh0aGlzLmFjY291bnQpIHtcbiAgICAgIHJldHVybiB0aGlzLmFjY291bnQ7XG4gICAgfVxuXG4gICAgLy8gZnJhbWUgaXMgdXNlZCB0byBnZXQgaWRUb2tlbiBhbmQgcG9wdWxhdGUgdGhlIGFjY291bnQgZm9yIHRoZSBnaXZlbiBzZXNzaW9uXG4gICAgY29uc3QgcmF3SWRUb2tlbiA9IHRoaXMuY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLmlkVG9rZW5LZXkpO1xuICAgIGNvbnN0IHJhd0NsaWVudEluZm8gPSB0aGlzLmNhY2hlU3RvcmFnZS5nZXRJdGVtKENvbnN0YW50cy5tc2FsQ2xpZW50SW5mbyk7XG5cbiAgICBpZiAoIVV0aWxzLmlzRW1wdHkocmF3SWRUb2tlbikgJiYgIVV0aWxzLmlzRW1wdHkocmF3Q2xpZW50SW5mbykpIHtcbiAgICAgIGNvbnN0IGlkVG9rZW4gPSBuZXcgSWRUb2tlbihyYXdJZFRva2VuKTtcbiAgICAgIGNvbnN0IGNsaWVudEluZm8gPSBuZXcgQ2xpZW50SW5mbyhyYXdDbGllbnRJbmZvKTtcbiAgICAgIHRoaXMuYWNjb3VudCA9IEFjY291bnQuY3JlYXRlQWNjb3VudChpZFRva2VuLCBjbGllbnRJbmZvKTtcbiAgICAgIHJldHVybiB0aGlzLmFjY291bnQ7XG4gICAgfVxuICAgIC8vIGlmIGxvZ2luIG5vdCB5ZXQgZG9uZSwgcmV0dXJuIG51bGxcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRyYWN0cyBzdGF0ZSB2YWx1ZSBmcm9tIHRoZSBhY2NvdW50U3RhdGUgc2VudCB3aXRoIHRoZSBhdXRoZW50aWNhdGlvbiByZXF1ZXN0LlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBzY29wZS5cbiAgICogQGlnbm9yZVxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBnZXRBY2NvdW50U3RhdGUgKHN0YXRlOiBzdHJpbmcpIHtcbiAgICBpZiAoc3RhdGUpIHtcbiAgICAgIGNvbnN0IHNwbGl0SW5kZXggPSBzdGF0ZS5pbmRleE9mKFwifFwiKTtcbiAgICAgIGlmIChzcGxpdEluZGV4ID4gLTEgJiYgc3BsaXRJbmRleCArIDEgPCBzdGF0ZS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLnN1YnN0cmluZyhzcGxpdEluZGV4ICsgMSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBcIlwiO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gZmlsdGVyIGFsbCBjYWNoZWQgaXRlbXMgYW5kIHJldHVybiBhIGxpc3Qgb2YgdW5pcXVlIGFjY291bnRzIGJhc2VkIG9uIGhvbWVBY2NvdW50SWRlbnRpZmllci5cbiAgICogQHBhcmFtIHtBcnJheTxBY2NvdW50Pn0gQWNjb3VudHMgLSBhY2NvdW50cyBzYXZlZCBpbiB0aGUgY2FjaGUuXG4gICAqL1xuICBnZXRBbGxBY2NvdW50cygpOiBBcnJheTxBY2NvdW50PiB7XG4gICAgY29uc3QgYWNjb3VudHM6IEFycmF5PEFjY291bnQ+ID0gW107XG4gICAgY29uc3QgYWNjZXNzVG9rZW5DYWNoZUl0ZW1zID0gdGhpcy5jYWNoZVN0b3JhZ2UuZ2V0QWxsQWNjZXNzVG9rZW5zKENvbnN0YW50cy5jbGllbnRJZCwgQ29uc3RhbnRzLmhvbWVBY2NvdW50SWRlbnRpZmllcik7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFjY2Vzc1Rva2VuQ2FjaGVJdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgaWRUb2tlbiA9IG5ldyBJZFRva2VuKGFjY2Vzc1Rva2VuQ2FjaGVJdGVtc1tpXS52YWx1ZS5pZFRva2VuKTtcbiAgICAgIGNvbnN0IGNsaWVudEluZm8gPSBuZXcgQ2xpZW50SW5mbyhhY2Nlc3NUb2tlbkNhY2hlSXRlbXNbaV0udmFsdWUuaG9tZUFjY291bnRJZGVudGlmaWVyKTtcbiAgICAgIGNvbnN0IGFjY291bnQ6IEFjY291bnQgPSBBY2NvdW50LmNyZWF0ZUFjY291bnQoaWRUb2tlbiwgY2xpZW50SW5mbyk7XG4gICAgICBhY2NvdW50cy5wdXNoKGFjY291bnQpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmdldFVuaXF1ZUFjY291bnRzKGFjY291bnRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIGZpbHRlciBhY2NvdW50cyBiYXNlZCBvbiBob21lQWNjb3VudElkZW50aWZpZXJcbiAgICogQHBhcmFtIHtBcnJheTxBY2NvdW50Pn0gIEFjY291bnRzIC0gYWNjb3VudHMgc2F2ZWQgaW4gdGhlIGNhY2hlXG4gICAqIEBpZ25vcmVcbiAgICogQGhpZGRlblxuICAgKi9cbiAgcHJpdmF0ZSBnZXRVbmlxdWVBY2NvdW50cyhhY2NvdW50czogQXJyYXk8QWNjb3VudD4pOiBBcnJheTxBY2NvdW50PiB7XG4gICAgaWYgKCFhY2NvdW50cyB8fCBhY2NvdW50cy5sZW5ndGggPD0gMSkge1xuICAgICAgcmV0dXJuIGFjY291bnRzO1xuICAgIH1cblxuICAgIGNvbnN0IGZsYWdzOiBBcnJheTxzdHJpbmc+ID0gW107XG4gICAgY29uc3QgdW5pcXVlQWNjb3VudHM6IEFycmF5PEFjY291bnQ+ID0gW107XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGFjY291bnRzLmxlbmd0aDsgKytpbmRleCkge1xuICAgICAgaWYgKGFjY291bnRzW2luZGV4XS5ob21lQWNjb3VudElkZW50aWZpZXIgJiYgZmxhZ3MuaW5kZXhPZihhY2NvdW50c1tpbmRleF0uaG9tZUFjY291bnRJZGVudGlmaWVyKSA9PT0gLTEpIHtcbiAgICAgICAgZmxhZ3MucHVzaChhY2NvdW50c1tpbmRleF0uaG9tZUFjY291bnRJZGVudGlmaWVyKTtcbiAgICAgICAgdW5pcXVlQWNjb3VudHMucHVzaChhY2NvdW50c1tpbmRleF0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB1bmlxdWVBY2NvdW50cztcbiAgfVxuXG4gIC8vI2VuZHJlZ2lvblxuXG4gIC8vI3JlZ2lvbiBTY29wZXMgKEV4dHJhY3QgdG8gU2NvcGVzLnRzKVxuXG4gIC8vIE5vdGU6IFwidGhpc1wiIGRlcGVuZGVuY3kgaW4gdGhpcyBzZWN0aW9uIGlzIG1pbmltYWwuXG4gIC8vIElmIHBDYWNoZVN0b3JhZ2UgaXMgc2VwYXJhdGVkIGZyb20gdGhlIGNsYXNzIG9iamVjdCwgb3IgcGFzc2VkIGFzIGEgZm4gcGFyYW0sIHNjb3Blc1V0aWxzLnRzIGNhbiBiZSBjcmVhdGVkXG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gdmFsaWRhdGUgdGhlIHNjb3BlcyBpbnB1dCBwYXJhbWV0ZXIgcmVxdWVzdGVkICBieSB0aGUgZGV2ZWxvcGVyLlxuICAgKiBAcGFyYW0ge0FycmF5PHN0cmluZz59IHNjb3BlcyAtIERldmVsb3BlciByZXF1ZXN0ZWQgcGVybWlzc2lvbnMuIE5vdCBhbGwgc2NvcGVzIGFyZSBndWFyYW50ZWVkIHRvIGJlIGluY2x1ZGVkIGluIHRoZSBhY2Nlc3MgdG9rZW4gcmV0dXJuZWQuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2NvcGVzUmVxdWlyZWQgLSBCb29sZWFuIGluZGljYXRpbmcgd2hldGhlciB0aGUgc2NvcGVzIGFycmF5IGlzIHJlcXVpcmVkIG9yIG5vdFxuICAgKiBAaWdub3JlXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHByaXZhdGUgdmFsaWRhdGVJbnB1dFNjb3BlKHNjb3BlczogQXJyYXk8c3RyaW5nPiwgc2NvcGVzUmVxdWlyZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBpZiAoIXNjb3Blcykge1xuICAgICAgaWYgKHNjb3Blc1JlcXVpcmVkKSB7XG4gICAgICAgIHRocm93IENsaWVudENvbmZpZ3VyYXRpb25FcnJvci5jcmVhdGVTY29wZXNSZXF1aXJlZEVycm9yKHNjb3Blcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgdGhhdCBzY29wZXMgaXMgYW4gYXJyYXkgb2JqZWN0IChhbHNvIHRocm93cyBlcnJvciBpZiBzY29wZXMgPT0gbnVsbClcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoc2NvcGVzKSkge1xuICAgICAgdGhyb3cgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yLmNyZWF0ZVNjb3Blc05vbkFycmF5RXJyb3Ioc2NvcGVzKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayB0aGF0IHNjb3BlcyBpcyBub3QgYW4gZW1wdHkgYXJyYXlcbiAgICBpZiAoc2NvcGVzLmxlbmd0aCA8IDEpIHtcbiAgICAgIHRocm93IENsaWVudENvbmZpZ3VyYXRpb25FcnJvci5jcmVhdGVFbXB0eVNjb3Blc0FycmF5RXJyb3Ioc2NvcGVzLnRvU3RyaW5nKCkpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIHRoYXQgY2xpZW50SWQgaXMgcGFzc2VkIGFzIHNpbmdsZSBzY29wZVxuICAgIGlmIChzY29wZXMuaW5kZXhPZih0aGlzLmNsaWVudElkKSA+IC0xKSB7XG4gICAgICBpZiAoc2NvcGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgdGhyb3cgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yLmNyZWF0ZUNsaWVudElkU2luZ2xlU2NvcGVFcnJvcihzY29wZXMudG9TdHJpbmcoKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICogRXh0cmFjdHMgc2NvcGUgdmFsdWUgZnJvbSB0aGUgc3RhdGUgc2VudCB3aXRoIHRoZSBhdXRoZW50aWNhdGlvbiByZXF1ZXN0LlxuICAqIEByZXR1cm5zIHtzdHJpbmd9IHNjb3BlLlxuICAqIEBpZ25vcmVcbiAgKiBAaGlkZGVuXG4gICovXG4gIHByaXZhdGUgZ2V0U2NvcGVGcm9tU3RhdGUoc3RhdGU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKHN0YXRlKSB7XG4gICAgICBjb25zdCBzcGxpdEluZGV4ID0gc3RhdGUuaW5kZXhPZihcInxcIik7XG4gICAgICBpZiAoc3BsaXRJbmRleCA+IC0xICYmIHNwbGl0SW5kZXggKyAxIDwgc3RhdGUubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5zdWJzdHJpbmcoc3BsaXRJbmRleCArIDEpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBlbmRzIGV4dHJhU2NvcGVzVG9Db25zZW50IGlmIHBhc3NlZFxuICAgKiBAcGFyYW0gcmVxdWVzdFxuICAgKi9cbiAgcHJpdmF0ZSBhcHBlbmRTY29wZXMocmVxdWVzdDogQXV0aGVudGljYXRpb25QYXJhbWV0ZXJzKTogQXJyYXk8c3RyaW5nPiB7XG5cbiAgICBsZXQgc2NvcGVzOiBBcnJheTxzdHJpbmc+O1xuXG4gICAgaWYgKHJlcXVlc3QgJiYgcmVxdWVzdC5zY29wZXMpIHtcbiAgICAgICAgaWYgKHJlcXVlc3QuZXh0cmFTY29wZXNUb0NvbnNlbnQpIHtcbiAgICAgICAgICAgIHNjb3BlcyA9IFsuLi5yZXF1ZXN0LnNjb3BlcywgLi4ucmVxdWVzdC5leHRyYVNjb3Blc1RvQ29uc2VudF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgIHNjb3BlcyA9IHJlcXVlc3Quc2NvcGVzO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNjb3BlcztcbiAgfVxuXG4gIC8vI2VuZHJlZ2lvblxuXG4gIC8vI3JlZ2lvbiBBbmd1bGFyXG5cbiAgLyoqXG4gICogQnJvYWRjYXN0IG1lc3NhZ2VzIC0gVXNlZCBvbmx5IGZvciBBbmd1bGFyPyAgKlxuICAqIEBwYXJhbSBldmVudE5hbWVcbiAgKiBAcGFyYW0gZGF0YVxuICAqL1xuICBwcml2YXRlIGJyb2FkY2FzdChldmVudE5hbWU6IHN0cmluZywgZGF0YTogc3RyaW5nKSB7XG4gICAgY29uc3QgZXZ0ID0gbmV3IEN1c3RvbUV2ZW50KGV2ZW50TmFtZSwgeyBkZXRhaWw6IGRhdGEgfSk7XG4gICAgd2luZG93LmRpc3BhdGNoRXZlbnQoZXZ0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gdG8gcmV0cmlldmUgdGhlIGNhY2hlZCB0b2tlblxuICAgKlxuICAgKiBAcGFyYW0gc2NvcGVzXG4gICAqIEBwYXJhbSBhY2NvdW50XG4gICAqL1xuICBwcm90ZWN0ZWQgZ2V0Q2FjaGVkVG9rZW5JbnRlcm5hbChzY29wZXMgOiBBcnJheTxzdHJpbmc+ICwgYWNjb3VudDogQWNjb3VudCk6IEF1dGhSZXNwb25zZSB7XG4gICAgLy8gR2V0IHRoZSBjdXJyZW50IHNlc3Npb24ncyBhY2NvdW50IG9iamVjdFxuICAgIGNvbnN0IGFjY291bnRPYmplY3Q6IEFjY291bnQgPSBhY2NvdW50IHx8IHRoaXMuZ2V0QWNjb3VudCgpO1xuICAgIGlmICghYWNjb3VudE9iamVjdCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBDb25zdHJ1Y3QgQXV0aGVudGljYXRpb25SZXF1ZXN0IGJhc2VkIG9uIHJlc3BvbnNlIHR5cGVcbiAgICBjb25zdCBuZXdBdXRob3JpdHkgPSB0aGlzLmF1dGhvcml0eUluc3RhbmNlID8gdGhpcy5hdXRob3JpdHlJbnN0YW5jZSA6IEF1dGhvcml0eUZhY3RvcnkuQ3JlYXRlSW5zdGFuY2UodGhpcy5hdXRob3JpdHksIHRoaXMuY29uZmlnLmF1dGgudmFsaWRhdGVBdXRob3JpdHkpO1xuICAgIGNvbnN0IHJlc3BvbnNlVHlwZSA9IHRoaXMuZ2V0VG9rZW5UeXBlKGFjY291bnRPYmplY3QsIHNjb3BlcywgdHJ1ZSk7XG4gICAgY29uc3Qgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0ID0gbmV3IFNlcnZlclJlcXVlc3RQYXJhbWV0ZXJzKFxuICAgICAgbmV3QXV0aG9yaXR5LFxuICAgICAgdGhpcy5jbGllbnRJZCxcbiAgICAgIHNjb3BlcyxcbiAgICAgIHJlc3BvbnNlVHlwZSxcbiAgICAgIHRoaXMuZ2V0UmVkaXJlY3RVcmkoKSxcbiAgICAgIHRoaXMuY29uZmlnLmF1dGguc3RhdGVcbiAgICApO1xuXG4gICAgLy8gZ2V0IGNhY2hlZCB0b2tlblxuICAgIHJldHVybiB0aGlzLmdldENhY2hlZFRva2VuKHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdCwgYWNjb3VudCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHNjb3BlcyBmb3IgdGhlIEVuZHBvaW50IC0gVXNlZCBpbiBBbmd1bGFyIHRvIHRyYWNrIHByb3RlY3RlZCBhbmQgdW5wcm90ZWN0ZWQgcmVzb3VyY2VzIHdpdGhvdXQgaW50ZXJhY3Rpb24gZnJvbSB0aGUgZGV2ZWxvcGVyIGFwcFxuICAgKlxuICAgKiBAcGFyYW0gZW5kcG9pbnRcbiAgICovXG4gIHByb3RlY3RlZCBnZXRTY29wZXNGb3JFbmRwb2ludChlbmRwb2ludDogc3RyaW5nKSA6IEFycmF5PHN0cmluZz4ge1xuICAgIC8vIGlmIHVzZXIgc3BlY2lmaWVkIGxpc3Qgb2YgdW5wcm90ZWN0ZWRSZXNvdXJjZXMsIG5vIG5lZWQgdG8gc2VuZCB0b2tlbiB0byB0aGVzZSBlbmRwb2ludHMsIHJldHVybiBudWxsLlxuICAgIGlmICh0aGlzLmNvbmZpZy5mcmFtZXdvcmsudW5wcm90ZWN0ZWRSZXNvdXJjZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY29uZmlnLmZyYW1ld29yay51bnByb3RlY3RlZFJlc291cmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGVuZHBvaW50LmluZGV4T2YodGhpcy5jb25maWcuZnJhbWV3b3JrLnVucHJvdGVjdGVkUmVzb3VyY2VzW2ldKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBwcm9jZXNzIGFsbCBwcm90ZWN0ZWQgcmVzb3VyY2VzIGFuZCBzZW5kIHRoZSBtYXRjaGVkIG9uZVxuICAgIGlmICh0aGlzLmNvbmZpZy5mcmFtZXdvcmsucHJvdGVjdGVkUmVzb3VyY2VNYXAuc2l6ZSA+IDApIHtcbiAgICAgICAgZm9yIChsZXQga2V5IG9mIEFycmF5LmZyb20odGhpcy5jb25maWcuZnJhbWV3b3JrLnByb3RlY3RlZFJlc291cmNlTWFwLmtleXMoKSkpIHtcbiAgICAgICAgICAgIC8vIGNvbmZpZ0VuZHBvaW50IGlzIGxpa2UgL2FwaS9Ub2RvIHJlcXVlc3RlZCBlbmRwb2ludCBjYW4gYmUgL2FwaS9Ub2RvLzFcbiAgICAgICAgICAgIGlmIChlbmRwb2ludC5pbmRleE9mKGtleSkgPiAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbmZpZy5mcmFtZXdvcmsucHJvdGVjdGVkUmVzb3VyY2VNYXAuZ2V0KGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBkZWZhdWx0IHJlc291cmNlIHdpbGwgYmUgY2xpZW50aWQgaWYgbm90aGluZyBzcGVjaWZpZWRcbiAgICAvLyBBcHAgd2lsbCB1c2UgaWR0b2tlbiBmb3IgY2FsbHMgdG8gaXRzZWxmXG4gICAgLy8gY2hlY2sgaWYgaXQncyBzdGFyaW5nIGZyb20gaHR0cCBvciBodHRwcywgbmVlZHMgdG8gbWF0Y2ggd2l0aCBhcHAgaG9zdFxuICAgIGlmIChlbmRwb2ludC5pbmRleE9mKFwiaHR0cDovL1wiKSA+IC0xIHx8IGVuZHBvaW50LmluZGV4T2YoXCJodHRwczovL1wiKSA+IC0xKSB7XG4gICAgICAgIGlmICh0aGlzLmdldEhvc3RGcm9tVXJpKGVuZHBvaW50KSA9PT0gdGhpcy5nZXRIb3N0RnJvbVVyaSh0aGlzLmdldFJlZGlyZWN0VXJpKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEFycmF5PHN0cmluZz4odGhpcy5jbGllbnRJZCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgIC8vIGluIGFuZ3VsYXIgbGV2ZWwsIHRoZSB1cmwgZm9yICRodHRwIGludGVyY2VwdG9yIGNhbGwgY291bGQgYmUgcmVsYXRpdmUgdXJsLFxuICAgIC8vIGlmIGl0J3MgcmVsYXRpdmUgY2FsbCwgd2UnbGwgdHJlYXQgaXQgYXMgYXBwIGJhY2tlbmQgY2FsbC5cbiAgICAgICAgcmV0dXJuIG5ldyBBcnJheTxzdHJpbmc+KHRoaXMuY2xpZW50SWQpO1xuICAgIH1cblxuICAgIC8vIGlmIG5vdCB0aGUgYXBwJ3Mgb3duIGJhY2tlbmQgb3Igbm90IGEgZG9tYWluIGxpc3RlZCBpbiB0aGUgZW5kcG9pbnRzIHN0cnVjdHVyZVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIHRyYWNrcyBpZiBsb2dpbiBpcyBpbiBwcm9ncmVzc1xuICAgKi9cbiAgcHJvdGVjdGVkIGdldExvZ2luSW5Qcm9ncmVzcygpOiBib29sZWFuIHtcbiAgICBjb25zdCBwZW5kaW5nQ2FsbGJhY2sgPSB0aGlzLmNhY2hlU3RvcmFnZS5nZXRJdGVtKENvbnN0YW50cy51cmxIYXNoKTtcbiAgICBpZiAocGVuZGluZ0NhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5sb2dpbkluUHJvZ3Jlc3M7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIGxvZ2luSW5Qcm9ncmVzc1xuICAgKi9cbiAgcHJvdGVjdGVkIHNldGxvZ2luSW5Qcm9ncmVzcyhsb2dpbkluUHJvZ3Jlc3MgOiBib29sZWFuKSB7XG4gICAgdGhpcy5sb2dpbkluUHJvZ3Jlc3MgPSBsb2dpbkluUHJvZ3Jlc3M7XG4gIH1cblxuICAvKipcbiAgICogcmV0dXJucyB0aGUgc3RhdHVzIG9mIGFjcXVpcmVUb2tlbkluUHJvZ3Jlc3NcbiAgICovXG4gIHByb3RlY3RlZCBnZXRBY3F1aXJlVG9rZW5JblByb2dyZXNzKCk6IGJvb2xlYW4ge1xuICAgICAgcmV0dXJuIHRoaXMuYWNxdWlyZVRva2VuSW5Qcm9ncmVzcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0gYWNxdWlyZVRva2VuSW5Qcm9ncmVzc1xuICAgKi9cbiAgcHJvdGVjdGVkIHNldEFjcXVpcmVUb2tlbkluUHJvZ3Jlc3MoYWNxdWlyZVRva2VuSW5Qcm9ncmVzcyA6IGJvb2xlYW4pIHtcbiAgICAgIHRoaXMuYWNxdWlyZVRva2VuSW5Qcm9ncmVzcyA9IGFjcXVpcmVUb2tlbkluUHJvZ3Jlc3M7XG4gIH1cblxuICAvKipcbiAgICogcmV0dXJucyB0aGUgbG9nZ2VyIGhhbmRsZVxuICAgKi9cbiAgcHJvdGVjdGVkIGdldExvZ2dlcigpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbmZpZy5zeXN0ZW0ubG9nZ2VyO1xuICB9XG5cbiAgLy8jZW5kcmVnaW9uXG5cbiAgLy8jcmVnaW9uIEdldHRlcnMgYW5kIFNldHRlcnNcblxuICAvKipcbiAgICogVXNlZCB0byBnZXQgdGhlIHJlZGlyZWN0IHVyaS4gRXZhbHVhdGVzIHJlZGlyZWN0VXJpIGlmIGl0cyBhIGZ1bmN0aW9uLCBvdGhlcndpc2Ugc2ltcGx5IHJldHVybnMgaXRzIHZhbHVlLlxuICAgKiBAaWdub3JlXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHB1YmxpYyBnZXRSZWRpcmVjdFVyaSgpOiBzdHJpbmcge1xuICAgIGlmICh0eXBlb2YgdGhpcy5jb25maWcuYXV0aC5yZWRpcmVjdFVyaSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb25maWcuYXV0aC5yZWRpcmVjdFVyaSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5jb25maWcuYXV0aC5yZWRpcmVjdFVyaTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIGdldCB0aGUgcG9zdCBsb2dvdXQgcmVkaXJlY3QgdXJpLiBFdmFsdWF0ZXMgcG9zdExvZ291dHJlZGlyZWN0VXJpIGlmIGl0cyBhIGZ1bmN0aW9uLCBvdGhlcndpc2Ugc2ltcGx5IHJldHVybnMgaXRzIHZhbHVlLlxuICAgKiBAaWdub3JlXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHB1YmxpYyBnZXRQb3N0TG9nb3V0UmVkaXJlY3RVcmkoKTogc3RyaW5nIHtcbiAgICBpZiAodHlwZW9mIHRoaXMuY29uZmlnLmF1dGgucG9zdExvZ291dFJlZGlyZWN0VXJpID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbmZpZy5hdXRoLnBvc3RMb2dvdXRSZWRpcmVjdFVyaSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5jb25maWcuYXV0aC5wb3N0TG9nb3V0UmVkaXJlY3RVcmk7XG4gIH1cblxuICAvLyNlbmRyZWdpb25cblxuICAvLyNyZWdpb24gU3RyaW5nIFV0aWwgKFNob3VsZCBiZSBleHRyYWN0ZWQgdG8gVXRpbHMudHMpXG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgYXV0aG9yaXphdGlvbiBlbmRwb2ludCBVUkwgY29udGFpbnMgcXVlcnkgc3RyaW5nIHBhcmFtZXRlcnNcbiAgICogQGlnbm9yZVxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIHVybENvbnRhaW5zUXVlcnlTdHJpbmdQYXJhbWV0ZXIobmFtZTogc3RyaW5nLCB1cmw6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIC8vIHJlZ2V4IHRvIGRldGVjdCBwYXR0ZXJuIG9mIGEgPyBvciAmIGZvbGxvd2VkIGJ5IHRoZSBuYW1lIHBhcmFtZXRlciBhbmQgYW4gZXF1YWxzIGNoYXJhY3RlclxuICAgIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChcIltcXFxcPyZdXCIgKyBuYW1lICsgXCI9XCIpO1xuICAgIHJldHVybiByZWdleC50ZXN0KHVybCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYW5jaG9yIHBhcnQoIykgb2YgdGhlIFVSTFxuICAgKiBAaWdub3JlXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHByaXZhdGUgZ2V0SGFzaChoYXNoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmIChoYXNoLmluZGV4T2YoXCIjL1wiKSA+IC0xKSB7XG4gICAgICBoYXNoID0gaGFzaC5zdWJzdHJpbmcoaGFzaC5pbmRleE9mKFwiIy9cIikgKyAyKTtcbiAgICB9IGVsc2UgaWYgKGhhc2guaW5kZXhPZihcIiNcIikgPiAtMSkge1xuICAgICAgaGFzaCA9IGhhc2guc3Vic3RyaW5nKDEpO1xuICAgIH1cblxuICAgIHJldHVybiBoYXNoO1xuICB9XG5cbiAgLyoqXG4gICAqIGV4dHJhY3QgVVJJIGZyb20gdGhlIGhvc3RcbiAgICpcbiAgICogQHBhcmFtIHVyaVxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIGdldEhvc3RGcm9tVXJpKHVyaTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAvLyByZW1vdmUgaHR0cDovLyBvciBodHRwczovLyBmcm9tIHVyaVxuICAgIGxldCBleHRyYWN0ZWRVcmkgPSBTdHJpbmcodXJpKS5yZXBsYWNlKC9eKGh0dHBzPzopXFwvXFwvLywgXCJcIik7XG4gICAgZXh0cmFjdGVkVXJpID0gZXh0cmFjdGVkVXJpLnNwbGl0KFwiL1wiKVswXTtcbiAgICByZXR1cm4gZXh0cmFjdGVkVXJpO1xuICB9XG5cbiAgLyoqXG4gICAqIFV0aWxzIGZ1bmN0aW9uIHRvIGNyZWF0ZSB0aGUgQXV0aGVudGljYXRpb25cbiAgICogQHBhcmFtIHVzZXJPYmplY3RcbiAgICogQHBhcmFtIHNjb3Blc1xuICAgKiBAcGFyYW0gc2lsZW50Q2FsbFxuICAgKi9cbiAgcHJpdmF0ZSBnZXRUb2tlblR5cGUoYWNjb3VudE9iamVjdDogQWNjb3VudCwgc2NvcGVzOiBzdHJpbmdbXSwgc2lsZW50Q2FsbDogYm9vbGVhbik6IHN0cmluZyB7XG5cbiAgICAvLyBpZiBhY2NvdW50IGlzIHBhc3NlZCBhbmQgbWF0Y2hlcyB0aGUgYWNjb3VudCBvYmplY3Qvb3Igc2V0IHRvIGdldEFjY291bnQoKSBmcm9tIGNhY2hlXG4gICAgLy8gaWYgY2xpZW50LWlkIGlzIHBhc3NlZCBhcyBzY29wZSwgZ2V0IGlkX3Rva2VuIGVsc2UgdG9rZW4vaWRfdG9rZW5fdG9rZW4gKGluIGNhc2Ugbm8gc2Vzc2lvbiBleGlzdHMpXG4gICAgbGV0IHRva2VuVHlwZTogc3RyaW5nO1xuXG4gICAgLy8gYWNxdWlyZVRva2VuU2lsZW50XG4gICAgaWYgKHNpbGVudENhbGwpIHtcbiAgICAgIGlmIChVdGlscy5jb21wYXJlQWNjb3VudHMoYWNjb3VudE9iamVjdCwgdGhpcy5nZXRBY2NvdW50KCkpKSB7XG4gICAgICAgIHRva2VuVHlwZSA9IChzY29wZXMuaW5kZXhPZih0aGlzLmNvbmZpZy5hdXRoLmNsaWVudElkKSA+IC0xKSA/IFJlc3BvbnNlVHlwZXMuaWRfdG9rZW4gOiBSZXNwb25zZVR5cGVzLnRva2VuO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHRva2VuVHlwZSAgPSAoc2NvcGVzLmluZGV4T2YodGhpcy5jb25maWcuYXV0aC5jbGllbnRJZCkgPiAtMSkgPyBSZXNwb25zZVR5cGVzLmlkX3Rva2VuIDogUmVzcG9uc2VUeXBlcy5pZF90b2tlbl90b2tlbjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRva2VuVHlwZTtcbiAgICB9XG4gICAgLy8gYWxsIG90aGVyIGNhc2VzXG4gICAgZWxzZSB7XG4gICAgICBpZiAoIVV0aWxzLmNvbXBhcmVBY2NvdW50cyhhY2NvdW50T2JqZWN0LCB0aGlzLmdldEFjY291bnQoKSkpIHtcbiAgICAgICAgICAgdG9rZW5UeXBlID0gUmVzcG9uc2VUeXBlcy5pZF90b2tlbl90b2tlbjtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB0b2tlblR5cGUgPSAoc2NvcGVzLmluZGV4T2YodGhpcy5jbGllbnRJZCkgPiAtMSkgPyBSZXNwb25zZVR5cGVzLmlkX3Rva2VuIDogUmVzcG9uc2VUeXBlcy50b2tlbjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRva2VuVHlwZTtcbiAgICB9XG5cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjYWNoZWtleXMgZm9yIGFuZCBzdG9yZXMgdGhlIGFjY291bnQgaW5mb3JtYXRpb24gaW4gY2FjaGVcbiAgICogQHBhcmFtIGFjY291bnRcbiAgICogQHBhcmFtIHN0YXRlXG4gICAqL1xuICBwcml2YXRlIHNldEFjY291bnRDYWNoZShhY2NvdW50OiBBY2NvdW50LCBzdGF0ZTogc3RyaW5nKSB7XG4gICAgLy8gQ2FjaGUgYWNxdWlyZVRva2VuQWNjb3VudEtleVxuICAgIGxldCBhY2NvdW50SWQgPSBhY2NvdW50ID8gdGhpcy5nZXRBY2NvdW50SWQoYWNjb3VudCkgOiBDb25zdGFudHMubm9fYWNjb3VudDtcblxuICAgIGNvbnN0IGFjcXVpcmVUb2tlbkFjY291bnRLZXkgPSBTdG9yYWdlLmdlbmVyYXRlQWNxdWlyZVRva2VuQWNjb3VudEtleShhY2NvdW50SWQsIHN0YXRlKTtcbiAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKGFjcXVpcmVUb2tlbkFjY291bnRLZXksIEpTT04uc3RyaW5naWZ5KGFjY291bnQpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjYWNoZUtleSBmb3IgYW5kIHN0b3JlcyB0aGUgYXV0aG9yaXR5IGluZm9ybWF0aW9uIGluIGNhY2hlXG4gICAqIEBwYXJhbSBzdGF0ZVxuICAgKiBAcGFyYW0gYXV0aG9yaXR5XG4gICAqL1xuICBwcml2YXRlIHNldEF1dGhvcml0eUNhY2hlKHN0YXRlOiBzdHJpbmcsIGF1dGhvcml0eTogc3RyaW5nKSB7XG4gICAgLy8gQ2FjaGUgYXV0aG9yaXR5S2V5XG4gICAgY29uc3QgYXV0aG9yaXR5S2V5ID0gU3RvcmFnZS5nZW5lcmF0ZUF1dGhvcml0eUtleShzdGF0ZSk7XG4gICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShhdXRob3JpdHlLZXksIGF1dGhvcml0eSwgdGhpcy5pbkNvb2tpZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgdW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSBsb2dnZWQgaW4gYWNjb3VudFxuICAgKiBAcGFyYW0gYWNjb3VudFxuICAgKi9cbiAgcHJpdmF0ZSBnZXRBY2NvdW50SWQoYWNjb3VudDogQWNjb3VudCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke2FjY291bnQuYWNjb3VudElkZW50aWZpZXJ9YCArIENvbnN0YW50cy5yZXNvdXJjZURlbGltaXRlciArIGAke2FjY291bnQuaG9tZUFjY291bnRJZGVudGlmaWVyfWA7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0ICd0b2tlblJlcXVlc3QnIGZyb20gdGhlIGF2YWlsYWJsZSBkYXRhIGluIGFkYWxJZFRva2VuXG4gICAqIEBwYXJhbSBleHRyYVF1ZXJ5UGFyYW1ldGVyc1xuICAgKi9cbiAgcHJpdmF0ZSBidWlsZElEVG9rZW5SZXF1ZXN0KHJlcXVlc3Q6IEF1dGhlbnRpY2F0aW9uUGFyYW1ldGVycyk6IEF1dGhlbnRpY2F0aW9uUGFyYW1ldGVycyB7XG5cbiAgICBsZXQgdG9rZW5SZXF1ZXN0OiBBdXRoZW50aWNhdGlvblBhcmFtZXRlcnMgPSB7XG4gICAgICBzY29wZXM6IFt0aGlzLmNsaWVudElkXSxcbiAgICAgIGF1dGhvcml0eTogdGhpcy5hdXRob3JpdHksXG4gICAgICBhY2NvdW50OiB0aGlzLmdldEFjY291bnQoKSxcbiAgICAgIGV4dHJhUXVlcnlQYXJhbWV0ZXJzOiByZXF1ZXN0LmV4dHJhUXVlcnlQYXJhbWV0ZXJzXG4gICAgfTtcblxuICAgIHJldHVybiB0b2tlblJlcXVlc3Q7XG4gIH1cblxuICAvKipcbiAgICogVXRpbGl0eSB0byBwb3B1bGF0ZSBRdWVyeVBhcmFtZXRlcnMgYW5kIEV4dHJhUXVlcnlQYXJhbWV0ZXJzIHRvIFNlcnZlclJlcXVlc3RQYXJhbWVyZXJzXG4gICAqIEBwYXJhbSByZXF1ZXN0XG4gICAqIEBwYXJhbSBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3RcbiAgICovXG4gIHByaXZhdGUgcG9wdWxhdGVRdWVyeVBhcmFtcyhhY2NvdW50OiBBY2NvdW50LCByZXF1ZXN0OiBBdXRoZW50aWNhdGlvblBhcmFtZXRlcnMsIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdDogU2VydmVyUmVxdWVzdFBhcmFtZXRlcnMsIGFkYWxJZFRva2VuT2JqZWN0PzogYW55KTogU2VydmVyUmVxdWVzdFBhcmFtZXRlcnMge1xuXG4gICAgbGV0IHF1ZXJ5UGFyYW1ldGVyczogUVBEaWN0ID0ge307XG5cbiAgICBpZiAocmVxdWVzdCkge1xuICAgICAgLy8gYWRkIHRoZSBwcm9tcHQgcGFyYW1ldGVyIHRvIHNlcnZlclJlcXVlc3RQYXJhbWV0ZXJzIGlmIHBhc3NlZFxuICAgICAgaWYgKHJlcXVlc3QucHJvbXB0KSB7XG4gICAgICAgIHRoaXMudmFsaWRhdGVQcm9tcHRQYXJhbWV0ZXIocmVxdWVzdC5wcm9tcHQpO1xuICAgICAgICBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QucHJvbXB0VmFsdWUgPSByZXF1ZXN0LnByb21wdDtcbiAgICAgIH1cblxuICAgICAgLy8gaWYgdGhlIGRldmVsb3BlciBwcm92aWRlcyBvbmUgb2YgdGhlc2UsIGdpdmUgcHJlZmVyZW5jZSB0byBkZXZlbG9wZXIgY2hvaWNlXG4gICAgICBpZiAoVXRpbHMuaXNTU09QYXJhbShyZXF1ZXN0KSkge1xuICAgICAgICBxdWVyeVBhcmFtZXRlcnMgPSBVdGlscy5jb25zdHJ1Y3RVbmlmaWVkQ2FjaGVRdWVyeVBhcmFtZXRlcihyZXF1ZXN0LCBudWxsKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoYWRhbElkVG9rZW5PYmplY3QpIHtcbiAgICAgICAgcXVlcnlQYXJhbWV0ZXJzID0gVXRpbHMuY29uc3RydWN0VW5pZmllZENhY2hlUXVlcnlQYXJhbWV0ZXIobnVsbCwgYWRhbElkVG9rZW5PYmplY3QpO1xuICAgIH1cblxuICAgIC8vIGFkZHMgc2lkL2xvZ2luX2hpbnQgaWYgbm90IHBvcHVsYXRlZDsgcG9wdWxhdGVzIGRvbWFpbl9yZXEsIGxvZ2luX3JlcSBhbmQgZG9tYWluX2hpbnRcbiAgICB0aGlzLmxvZ2dlci52ZXJib3NlKFwiQ2FsbGluZyBhZGRIaW50IHBhcmFtZXRlcnNcIik7XG4gICAgcXVlcnlQYXJhbWV0ZXJzID0gdGhpcy5hZGRIaW50UGFyYW1ldGVycyhhY2NvdW50LCBxdWVyeVBhcmFtZXRlcnMsIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdCk7XG5cbiAgICAvLyBzYW5pdHkgY2hlY2sgZm9yIGRldmVsb3BlciBwYXNzZWQgZXh0cmFRdWVyeVBhcmFtZXRlcnNcbiAgICBsZXQgZVFQYXJhbXM6IFFQRGljdDtcbiAgICBpZiAocmVxdWVzdCkge1xuICAgICAgICBlUVBhcmFtcyA9IHRoaXMucmVtb3ZlU1NPUGFyYW1zRnJvbUVRUGFyYW1zKHJlcXVlc3QuZXh0cmFRdWVyeVBhcmFtZXRlcnMpO1xuICAgIH1cblxuICAgIC8vIFBvcHVsYXRlIHRoZSBleHRyYVF1ZXJ5UGFyYW1ldGVycyB0byBiZSBzZW50IHRvIHRoZSBzZXJ2ZXJcbiAgICBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QucXVlcnlQYXJhbWV0ZXJzID0gVXRpbHMuZ2VuZXJhdGVRdWVyeVBhcmFtZXRlcnNTdHJpbmcocXVlcnlQYXJhbWV0ZXJzKTtcbiAgICBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QuZXh0cmFRdWVyeVBhcmFtZXRlcnMgPSBVdGlscy5nZW5lcmF0ZVF1ZXJ5UGFyYW1ldGVyc1N0cmluZyhlUVBhcmFtcyk7XG5cbiAgICByZXR1cm4gc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0O1xuICB9XG5cbiAgLyoqXG4gICAqIFV0aWxpdHkgdG8gdGVzdCBpZiB2YWxpZCBwcm9tcHQgdmFsdWUgaXMgcGFzc2VkIGluIHRoZSByZXF1ZXN0XG4gICAqIEBwYXJhbSByZXF1ZXN0XG4gICAqL1xuICBwcml2YXRlIHZhbGlkYXRlUHJvbXB0UGFyYW1ldGVyIChwcm9tcHQ6IHN0cmluZykge1xuICAgIGlmICghKFtQcm9tcHRTdGF0ZS5MT0dJTiwgUHJvbXB0U3RhdGUuU0VMRUNUX0FDQ09VTlQsIFByb21wdFN0YXRlLkNPTlNFTlQsIFByb21wdFN0YXRlLk5PTkVdLmluZGV4T2YocHJvbXB0KSA+PSAwKSkge1xuICAgICAgICB0aHJvdyBDbGllbnRDb25maWd1cmF0aW9uRXJyb3IuY3JlYXRlSW52YWxpZFByb21wdEVycm9yKHByb21wdCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBzaWQgYW5kIGxvZ2luX2hpbnQgaWYgcGFzc2VkIGFzIGV4dHJhUXVlcnlQYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBlUVBhcmFtc1xuICAgKi9cbiAgcHJpdmF0ZSByZW1vdmVTU09QYXJhbXNGcm9tRVFQYXJhbXMoZVFQYXJhbXM6IFFQRGljdCk6IFFQRGljdCB7XG5cbiAgICBpZiAoZVFQYXJhbXMpIHtcbiAgICAgIGRlbGV0ZSBlUVBhcmFtc1tTU09UeXBlcy5TSURdO1xuICAgICAgZGVsZXRlIGVRUGFyYW1zW1NTT1R5cGVzLkxPR0lOX0hJTlRdO1xuICAgIH1cblxuICAgIHJldHVybiBlUVBhcmFtcztcbiAgfVxuXG4gLy8jZW5kcmVnaW9uXG59XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uXG4gKiAgQWxsIFJpZ2h0cyBSZXNlcnZlZFxuICogIE1JVCBMaWNlbnNlXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZiB0aGlzXG4gKiBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlXG4gKiB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksXG4gKiBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZ1xuICogY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxuICogaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsXG4gKiBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlNcbiAqIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSxcbiAqIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVRcbiAqIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKi9cblxuaW1wb3J0IHsgQ2xpZW50SW5mbyB9IGZyb20gXCIuL0NsaWVudEluZm9cIjtcbmltcG9ydCB7IElkVG9rZW4gfSBmcm9tIFwiLi9JZFRva2VuXCI7XG5pbXBvcnQgeyBVdGlscyB9IGZyb20gXCIuL1V0aWxzXCI7XG5cbi8qKlxuICogYWNjb3VudElkZW50aWZpZXIgICAgICAgY29tYmluYXRpb24gb2YgaWRUb2tlbi51aWQgYW5kIGlkVG9rZW4udXRpZFxuICogaG9tZUFjY291bnRJZGVudGlmaWVyICAgY29tYmluYXRpb24gb2YgY2xpZW50SW5mby51aWQgYW5kIGNsaWVudEluZm8udXRpZFxuICogdXNlck5hbWUgICAgICAgICAgICAgICAgaWRUb2tlbi5wcmVmZXJyZWRfdXNlcm5hbWVcbiAqIG5hbWUgICAgICAgICAgICAgICAgICAgIGlkVG9rZW4ubmFtZVxuICogaWRUb2tlbiAgICAgICAgICAgICAgICAgaWRUb2tlblxuICogc2lkICAgICAgICAgICAgICAgICAgICAgaWRUb2tlbi5zaWQgLSBzZXNzaW9uIGlkZW50aWZpZXJcbiAqIGVudmlyb25tZW50ICAgICAgICAgICAgIGlkdG9rZW4uaXNzdWVyICh0aGUgYXV0aG9yaXR5IHRoYXQgaXNzdWVzIHRoZSB0b2tlbilcbiAqL1xuZXhwb3J0IGNsYXNzIEFjY291bnQge1xuXG4gICAgYWNjb3VudElkZW50aWZpZXI6IHN0cmluZztcbiAgICBob21lQWNjb3VudElkZW50aWZpZXI6IHN0cmluZztcbiAgICB1c2VyTmFtZTogc3RyaW5nO1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBpZFRva2VuOiBPYmplY3Q7XG4gICAgc2lkOiBzdHJpbmc7XG4gICAgZW52aXJvbm1lbnQ6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gQWNjb3VudCBPYmplY3RcbiAgICAgKiBAcHJhcmFtIGFjY291bnRJZGVudGlmaWVyXG4gICAgICogQHBhcmFtIGhvbWVBY2NvdW50SWRlbnRpZmllclxuICAgICAqIEBwYXJhbSB1c2VyTmFtZVxuICAgICAqIEBwYXJhbSBuYW1lXG4gICAgICogQHBhcmFtIGlkVG9rZW5cbiAgICAgKiBAcGFyYW0gc2lkXG4gICAgICogQHBhcmFtIGVudmlyb25tZW50XG4gICAgICovXG4gICAgY29uc3RydWN0b3IoYWNjb3VudElkZW50aWZpZXI6IHN0cmluZywgaG9tZUFjY291bnRJZGVudGlmaWVyOiBzdHJpbmcsIHVzZXJOYW1lOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgaWRUb2tlbjogT2JqZWN0LCBzaWQ6IHN0cmluZywgIGVudmlyb25tZW50OiBzdHJpbmcpIHtcbiAgICAgIHRoaXMuYWNjb3VudElkZW50aWZpZXIgPSBhY2NvdW50SWRlbnRpZmllcjtcbiAgICAgIHRoaXMuaG9tZUFjY291bnRJZGVudGlmaWVyID0gaG9tZUFjY291bnRJZGVudGlmaWVyO1xuICAgICAgdGhpcy51c2VyTmFtZSA9IHVzZXJOYW1lO1xuICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgIHRoaXMuaWRUb2tlbiA9IGlkVG9rZW47XG4gICAgICB0aGlzLnNpZCA9IHNpZDtcbiAgICAgIHRoaXMuZW52aXJvbm1lbnQgPSBlbnZpcm9ubWVudDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAaGlkZGVuXG4gICAgICogQHBhcmFtIGlkVG9rZW5cbiAgICAgKiBAcGFyYW0gY2xpZW50SW5mb1xuICAgICAqL1xuICAgIHN0YXRpYyBjcmVhdGVBY2NvdW50KGlkVG9rZW46IElkVG9rZW4sIGNsaWVudEluZm86IENsaWVudEluZm8pOiBBY2NvdW50IHtcblxuICAgICAgICAvLyBjcmVhdGUgYWNjb3VudElkZW50aWZpZXJcbiAgICAgICAgY29uc3QgYWNjb3VudElkZW50aWZpZXI6IHN0cmluZyA9IGlkVG9rZW4ub2JqZWN0SWQgfHwgIGlkVG9rZW4uc3ViamVjdDtcblxuICAgICAgICAvLyBjcmVhdGUgaG9tZUFjY291bnRJZGVudGlmaWVyXG4gICAgICAgIGNvbnN0IHVpZDogc3RyaW5nID0gY2xpZW50SW5mbyA/IGNsaWVudEluZm8udWlkIDogXCJcIjtcbiAgICAgICAgY29uc3QgdXRpZDogc3RyaW5nID0gY2xpZW50SW5mbyA/IGNsaWVudEluZm8udXRpZCA6IFwiXCI7XG5cbiAgICAgICAgY29uc3QgaG9tZUFjY291bnRJZGVudGlmaWVyID0gVXRpbHMuYmFzZTY0RW5jb2RlU3RyaW5nVXJsU2FmZSh1aWQpICsgXCIuXCIgKyBVdGlscy5iYXNlNjRFbmNvZGVTdHJpbmdVcmxTYWZlKHV0aWQpO1xuICAgICAgICByZXR1cm4gbmV3IEFjY291bnQoYWNjb3VudElkZW50aWZpZXIsIGhvbWVBY2NvdW50SWRlbnRpZmllciwgaWRUb2tlbi5wcmVmZXJyZWROYW1lLCBpZFRva2VuLm5hbWUsIGlkVG9rZW4uZGVjb2RlZElkVG9rZW4sIGlkVG9rZW4uc2lkLCBpZFRva2VuLmlzc3Vlcik7XG4gICAgfVxufVxuIiwiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG5cbmltcG9ydCB7IEF1dGhvcml0eSwgQXV0aG9yaXR5VHlwZSB9IGZyb20gXCIuL0F1dGhvcml0eVwiO1xuaW1wb3J0IHsgWGhyQ2xpZW50IH0gZnJvbSBcIi4vWEhSQ2xpZW50XCI7XG5cbi8qKlxuICogQGhpZGRlblxuICovXG5leHBvcnQgY2xhc3MgQWFkQXV0aG9yaXR5IGV4dGVuZHMgQXV0aG9yaXR5IHtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgQWFkSW5zdGFuY2VEaXNjb3ZlcnlFbmRwb2ludDogc3RyaW5nID0gXCJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vY29tbW9uL2Rpc2NvdmVyeS9pbnN0YW5jZVwiO1xuXG4gIHByaXZhdGUgZ2V0IEFhZEluc3RhbmNlRGlzY292ZXJ5RW5kcG9pbnRVcmwoKTogc3RyaW5nIHtcbiAgICAgIHJldHVybiBgJHtBYWRBdXRob3JpdHkuQWFkSW5zdGFuY2VEaXNjb3ZlcnlFbmRwb2ludH0/YXBpLXZlcnNpb249MS4wJmF1dGhvcml6YXRpb25fZW5kcG9pbnQ9JHt0aGlzLkNhbm9uaWNhbEF1dGhvcml0eX1vYXV0aDIvdjIuMC9hdXRob3JpemVgO1xuICB9XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKGF1dGhvcml0eTogc3RyaW5nLCB2YWxpZGF0ZUF1dGhvcml0eTogYm9vbGVhbikge1xuICAgIHN1cGVyKGF1dGhvcml0eSwgdmFsaWRhdGVBdXRob3JpdHkpO1xuICB9XG5cbiAgcHVibGljIGdldCBBdXRob3JpdHlUeXBlKCk6IEF1dGhvcml0eVR5cGUge1xuICAgIHJldHVybiBBdXRob3JpdHlUeXBlLkFhZDtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IFRydXN0ZWRIb3N0TGlzdDogYW55ID0ge1xuICAgIFwibG9naW4ud2luZG93cy5uZXRcIjogXCJsb2dpbi53aW5kb3dzLm5ldFwiLFxuICAgIFwibG9naW4uY2hpbmFjbG91ZGFwaS5jblwiOiBcImxvZ2luLmNoaW5hY2xvdWRhcGkuY25cIixcbiAgICBcImxvZ2luLmNsb3VkZ292YXBpLnVzXCI6IFwibG9naW4uY2xvdWRnb3ZhcGkudXNcIixcbiAgICBcImxvZ2luLm1pY3Jvc29mdG9ubGluZS5jb21cIjogXCJsb2dpbi5taWNyb3NvZnRvbmxpbmUuY29tXCIsXG4gICAgXCJsb2dpbi5taWNyb3NvZnRvbmxpbmUuZGVcIjogXCJsb2dpbi5taWNyb3NvZnRvbmxpbmUuZGVcIixcbiAgICBcImxvZ2luLm1pY3Jvc29mdG9ubGluZS51c1wiOiBcImxvZ2luLm1pY3Jvc29mdG9ubGluZS51c1wiXG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBwcm9taXNlIHdoaWNoIHJlc29sdmVzIHRvIHRoZSBPSURDIGVuZHBvaW50XG4gICAqIE9ubHkgcmVzcG9uZHMgd2l0aCB0aGUgZW5kcG9pbnRcbiAgICovXG4gIHB1YmxpYyBHZXRPcGVuSWRDb25maWd1cmF0aW9uRW5kcG9pbnRBc3luYygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgY29uc3QgcmVzdWx0UHJvbWlzZTogUHJvbWlzZTxzdHJpbmc+ID0gbmV3IFByb21pc2U8c3RyaW5nPigocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgcmVzb2x2ZSh0aGlzLkRlZmF1bHRPcGVuSWRDb25maWd1cmF0aW9uRW5kcG9pbnQpKTtcblxuICAgIGlmICghdGhpcy5Jc1ZhbGlkYXRpb25FbmFibGVkKSB7XG4gICAgICByZXR1cm4gcmVzdWx0UHJvbWlzZTtcbiAgICB9XG5cbiAgICBsZXQgaG9zdDogc3RyaW5nID0gdGhpcy5DYW5vbmljYWxBdXRob3JpdHlVcmxDb21wb25lbnRzLkhvc3ROYW1lQW5kUG9ydDtcbiAgICBpZiAodGhpcy5Jc0luVHJ1c3RlZEhvc3RMaXN0KGhvc3QpKSB7XG4gICAgICByZXR1cm4gcmVzdWx0UHJvbWlzZTtcbiAgICB9XG5cbiAgICBsZXQgY2xpZW50OiBYaHJDbGllbnQgPSBuZXcgWGhyQ2xpZW50KCk7XG5cbiAgICByZXR1cm4gY2xpZW50LnNlbmRSZXF1ZXN0QXN5bmModGhpcy5BYWRJbnN0YW5jZURpc2NvdmVyeUVuZHBvaW50VXJsLCBcIkdFVFwiLCB0cnVlKVxuICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgIHJldHVybiByZXNwb25zZS50ZW5hbnRfZGlzY292ZXJ5X2VuZHBvaW50O1xuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRvIHNlZSBpZiB0aGUgaG9zdCBpcyBpbiBhIGxpc3Qgb2YgdHJ1c3RlZCBob3N0c1xuICAgKiBAcGFyYW0ge3N0cmluZ30gVGhlIGhvc3QgdG8gbG9vayB1cFxuICAgKi9cbiAgcHVibGljIElzSW5UcnVzdGVkSG9zdExpc3QoaG9zdDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIEFhZEF1dGhvcml0eS5UcnVzdGVkSG9zdExpc3RbaG9zdC50b0xvd2VyQ2FzZSgpXTtcbiAgfVxufVxuIiwiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG5cbi8qKlxuICogWEhSIGNsaWVudCBmb3IgSlNPTiBlbmRwb2ludHNcbiAqIGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL2FzeW5jLXByb21pc2VcbiAqIEBoaWRkZW5cbiAqL1xuZXhwb3J0IGNsYXNzIFhockNsaWVudCB7XG4gIHB1YmxpYyBzZW5kUmVxdWVzdEFzeW5jKHVybDogc3RyaW5nLCBtZXRob2Q6IHN0cmluZywgZW5hYmxlQ2FjaGluZz86IGJvb2xlYW4pOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgIHhoci5vcGVuKG1ldGhvZCwgdXJsLCAvKmFzeW5jOiAqLyB0cnVlKTtcbiAgICAgIGlmIChlbmFibGVDYWNoaW5nKSB7XG4gICAgICAgIC8vIFRPRE86IChzaGl2YikgZW5zdXJlIHRoYXQgdGhpcyBjYW4gYmUgY2FjaGVkXG4gICAgICAgIC8vIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ2FjaGUtQ29udHJvbFwiLCBcIlB1YmxpY1wiKTtcbiAgICAgIH1cblxuICAgICAgeGhyLm9ubG9hZCA9IChldikgPT4ge1xuICAgICAgICAgIGlmICh4aHIuc3RhdHVzIDwgMjAwIHx8IHhoci5zdGF0dXMgPj0gMzAwKSB7XG4gICAgICAgICAgICAgIHJlamVjdCh0aGlzLmhhbmRsZUVycm9yKHhoci5yZXNwb25zZVRleHQpKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICB2YXIganNvblJlc3BvbnNlID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgIHJlamVjdCh0aGlzLmhhbmRsZUVycm9yKHhoci5yZXNwb25zZVRleHQpKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXNvbHZlKGpzb25SZXNwb25zZSk7XG4gICAgICB9O1xuXG4gICAgICB4aHIub25lcnJvciA9IChldikgPT4ge1xuICAgICAgICByZWplY3QoeGhyLnN0YXR1cyk7XG4gICAgICB9O1xuXG4gICAgICBpZiAobWV0aG9kID09PSBcIkdFVFwiKSB7XG4gICAgICAgIHhoci5zZW5kKCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdGhyb3cgXCJub3QgaW1wbGVtZW50ZWRcIjtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByb3RlY3RlZCBoYW5kbGVFcnJvcihyZXNwb25zZVRleHQ6IHN0cmluZyk6IGFueSB7XG4gICAgdmFyIGpzb25SZXNwb25zZTtcbiAgICB0cnkge1xuICAgICAganNvblJlc3BvbnNlID0gSlNPTi5wYXJzZShyZXNwb25zZVRleHQpO1xuICAgICAgaWYgKGpzb25SZXNwb25zZS5lcnJvcikge1xuICAgICAgICAgIHJldHVybiBqc29uUmVzcG9uc2UuZXJyb3I7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IHJlc3BvbnNlVGV4dDtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gcmVzcG9uc2VUZXh0O1xuICAgIH1cbiAgfVxufVxuIiwiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG5cbmltcG9ydCB7IExvZ2dlciB9IGZyb20gXCIuL0xvZ2dlclwiO1xuaW1wb3J0IHsgVXRpbHMgfSBmcm9tIFwiLi9VdGlsc1wiO1xuXG4vLyBtYWtlIENhY2hlU3RvcmFnZSBhIGZpeGVkIHR5cGUgdG8gbGltaXQgaXQgdG8gc3BlY2lmaWMgaW5wdXRzXG5leHBvcnQgdHlwZSBDYWNoZUxvY2F0aW9uID0gXCJsb2NhbFN0b3JhZ2VcIiB8IFwic2Vzc2lvblN0b3JhZ2VcIjtcblxuLyoqXG4gKiBEZWZhdWx0cyBmb3IgdGhlIENvbmZpZ3VyYXRpb24gT3B0aW9uc1xuICovXG5jb25zdCBGUkFNRV9USU1FT1VUID0gNjAwMDtcbmNvbnN0IE9GRlNFVCA9IDMwMDtcblxuLyoqXG4gKiAgQXV0aGVudGljYXRpb24gT3B0aW9uc1xuICpcbiAqICBjbGllbnRJZCAgICAgICAgICAgICAgICAgICAgLSBDbGllbnQgSUQgYXNzaWduZWQgdG8geW91ciBhcHAgYnkgQXp1cmUgQWN0aXZlIERpcmVjdG9yeVxuICogIGF1dGhvcml0eSAgICAgICAgICAgICAgICAgICAtIERldmVsb3BlciBjYW4gY2hvb3NlIHRvIHNlbmQgYW4gYXV0aG9yaXR5LCBkZWZhdWx0cyB0byBcIiBcIlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKFRPRE86IEZvbGxvdyB1cCB3aXRoIHRoZSBhdXRob3JpdHkgZGlzY3Vzc2lvbiB3aXRoIHRoZSBQTXMgLSBVbnRpbCB0aGVuIHRoaXMgY29tbWVudCBpcyBhIHBsYWNlaG9sZGVyKVxuICogIHZhbGlkYXRlQXV0aG9yaXR5ICAgICAgICAgICAtIFVzZWQgdG8gdHVybiBhdXRob3JpdHkgdmFsaWRhdGlvbiBvbi9vZmYuIFdoZW4gc2V0IHRvIHRydWUgKGRlZmF1bHQpLCBNU0FMIHdpbGwgY29tcGFyZSB0aGUgYXBwbGljYXRpb24ncyBhdXRob3JpdHlcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFnYWluc3Qgd2VsbC1rbm93biBVUkxzIHRlbXBsYXRlcyByZXByZXNlbnRpbmcgd2VsbC1mb3JtZWQgYXV0aG9yaXRpZXMuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJdCBpcyB1c2VmdWwgd2hlbiB0aGUgYXV0aG9yaXR5IGlzIG9idGFpbmVkIGF0IHJ1biB0aW1lIHRvIHByZXZlbnQgTVNBTCBmcm9tIGRpc3BsYXlpbmcgYXV0aGVudGljYXRpb24gcHJvbXB0cyBmcm9tIG1hbGljaW91cyBwYWdlcy5cbiAqICByZWRpcmVjdFVyaSAgICAgICAgICAgICAgICAgLSBUaGUgcmVkaXJlY3QgVVJJIG9mIHRoZSBhcHBsaWNhdGlvbiwgdGhpcyBzaG91bGQgYmUgc2FtZSBhcyB0aGUgdmFsdWUgaW4gdGhlIGFwcGxpY2F0aW9uIHJlZ2lzdHJhdGlvbiBwb3J0YWwuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEZWZhdWx0cyB0byBgd2luZG93LmxvY2F0aW9uLmhyZWZgLlxuICogIHBvc3RMb2dvdXRSZWRpcmVjdFVyaSAgICAgICAtIFVzZWQgdG8gcmVkaXJlY3QgdGhlIHVzZXIgdG8gdGhpcyBsb2NhdGlvbiBhZnRlciBsb2dvdXQuIERlZmF1bHRzIHRvIGB3aW5kb3cubG9jYXRpb24uaHJlZmAuXG4gKiAgc3RhdGUgICAgICAgICAgICAgICAgICAgICAgIC0gVXNlIHRvIHNlbmQgdGhlIHN0YXRlIHBhcmFtZXRlciB3aXRoIGF1dGhlbnRpY2F0aW9uIHJlcXVlc3RcbiAqICBuYXZpZ2F0ZVRvTG9naW5SZXF1ZXN0VXJsICAgLSBVc2VkIHRvIHR1cm4gb2ZmIGRlZmF1bHQgbmF2aWdhdGlvbiB0byBzdGFydCBwYWdlIGFmdGVyIGxvZ2luLiBEZWZhdWx0IGlzIHRydWUuIFRoaXMgaXMgdXNlZCBvbmx5IGZvciByZWRpcmVjdCBmbG93cy5cbiAqXG4gKi9cbmV4cG9ydCB0eXBlIEF1dGhPcHRpb25zID0ge1xuICBjbGllbnRJZDogc3RyaW5nO1xuICBhdXRob3JpdHk/OiBzdHJpbmc7XG4gIHZhbGlkYXRlQXV0aG9yaXR5PzogYm9vbGVhbjtcbiAgcmVkaXJlY3RVcmk/OiBzdHJpbmcgfCAoKCkgPT4gc3RyaW5nKTtcbiAgcG9zdExvZ291dFJlZGlyZWN0VXJpPzogc3RyaW5nIHwgKCgpID0+IHN0cmluZyk7XG4gIHN0YXRlPzogc3RyaW5nO1xuICBuYXZpZ2F0ZVRvTG9naW5SZXF1ZXN0VXJsPzogYm9vbGVhbjtcbn07XG5cbi8qKlxuICogQ2FjaGUgT3B0aW9uc1xuICpcbiAqIGNhY2hlTG9jYXRpb24gICAgICAgICAgICAtIFVzZWQgdG8gc3BlY2lmeSB0aGUgY2FjaGVMb2NhdGlvbiB1c2VyIHdhbnRzIHRvIHNldDogVmFsaWQgdmFsdWVzIGFyZSBcImxvY2FsU3RvcmFnZVwiIGFuZCBcInNlc3Npb25TdG9yYWdlXCJcbiAqIHN0b3JlQXV0aFN0YXRlSW5Db29raWUgICAtIElmIHNldCwgdGhlIGxpYnJhcnkgd2lsbCBzdG9yZSB0aGUgYXV0aCByZXF1ZXN0IHN0YXRlIHJlcXVpcmVkIGZvciB2YWxpZGF0aW9uIG9mIHRoZSBhdXRoIGZsb3dzIGluIHRoZSBicm93c2VyIGNvb2tpZXMuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJ5IGRlZmF1bHQgdGhpcyBmbGFnIGlzIHNldCB0byBmYWxzZS5cbiAqL1xuZXhwb3J0IHR5cGUgQ2FjaGVPcHRpb25zID0ge1xuICBjYWNoZUxvY2F0aW9uPzogQ2FjaGVMb2NhdGlvbjtcbiAgc3RvcmVBdXRoU3RhdGVJbkNvb2tpZT86IGJvb2xlYW47XG59O1xuXG4vKipcbiAqIExpYnJhcnkgU3BlY2lmaWMgT3B0aW9uc1xuICpcbiAqIGxvZ2dlciAgICAgICAgICAgICAgICAgICAgICAgLSBVc2VkIHRvIGluaXRpYWxpemUgdGhlIExvZ2dlciBvYmplY3Q7IFRPRE86IEV4cGFuZCBvbiBsb2dnZXIgZGV0YWlscyBvciBsaW5rIHRvIHRoZSBkb2N1bWVudGF0aW9uIG9uIGxvZ2dlclxuICogbG9hZEZyYW1lVGltZW91dCAgICAgICAgICAgICAtIG1heGltdW0gdGltZSB0aGUgbGlicmFyeSBzaG91bGQgd2FpdCBmb3IgYSBmcmFtZSB0byBsb2FkXG4gKiB0b2tlblJlbmV3YWxPZmZzZXRTZWNvbmRzICAgIC0gc2V0cyB0aGUgd2luZG93IG9mIG9mZnNldCBuZWVkZWQgdG8gcmVuZXcgdGhlIHRva2VuIGJlZm9yZSBleHBpcnlcbiAqXG4gKi9cbmV4cG9ydCB0eXBlIFN5c3RlbU9wdGlvbnMgPSB7XG4gIGxvZ2dlcj86IExvZ2dlcjtcbiAgbG9hZEZyYW1lVGltZW91dD86IG51bWJlcjtcbiAgdG9rZW5SZW5ld2FsT2Zmc2V0U2Vjb25kcz86IG51bWJlcjtcbn07XG5cbi8qKlxuICogQXBwL0ZyYW1ld29yayBzcGVjaWZpYyBlbnZpcm9ubWVudCBTdXBwb3J0XG4gKlxuICogaXNBbmd1bGFyICAgICAgICAgICAgICAgIC0gZmxhZyBzZXQgdG8gZGV0ZXJtaW5lIGlmIGl0IGlzIEFuZ3VsYXIgRnJhbWV3b3JrLiBVc2VkIHRvIGJyb2FkY2FzdCB0b2tlbnMuIFRPRE86IGRldGFuZ2xlIHRoaXMgZGVwZW5kZW5jeSBmcm9tIGNvcmUuXG4gKiB1bnByb3RlY3RlZFJlc291cmNlcyAgICAgLSBBcnJheSBvZiBVUkkncyB3aGljaCBhcmUgdW5wcm90ZWN0ZWQgcmVzb3VyY2VzLiBNU0FMIHdpbGwgbm90IGF0dGFjaCBhIHRva2VuIHRvIG91dGdvaW5nIHJlcXVlc3RzIHRoYXQgaGF2ZSB0aGVzZSBVUkkuIERlZmF1bHRzIHRvICdudWxsJy5cbiAqIHByb3RlY3RlZFJlc291cmNlTWFwICAgICAtIFRoaXMgaXMgbWFwcGluZyBvZiByZXNvdXJjZXMgdG8gc2NvcGVzIHVzZWQgYnkgTVNBTCBmb3IgYXV0b21hdGljYWxseSBhdHRhY2hpbmcgYWNjZXNzIHRva2VucyBpbiB3ZWIgQVBJIGNhbGxzLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBIHNpbmdsZSBhY2Nlc3MgdG9rZW4gaXMgb2J0YWluZWQgZm9yIHRoZSByZXNvdXJjZS4gU28geW91IGNhbiBtYXAgYSBzcGVjaWZpYyByZXNvdXJjZSBwYXRoIGFzIGZvbGxvd3M6XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcImh0dHBzOi8vZ3JhcGgubWljcm9zb2Z0LmNvbS92MS4wL21lXCIsIFtcInVzZXIucmVhZFwiXX0sXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9yIHRoZSBhcHAgVVJMIG9mIHRoZSByZXNvdXJjZSBhczoge1wiaHR0cHM6Ly9ncmFwaC5taWNyb3NvZnQuY29tL1wiLCBbXCJ1c2VyLnJlYWRcIiwgXCJtYWlsLnNlbmRcIl19LlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUaGlzIGlzIHJlcXVpcmVkIGZvciBDT1JTIGNhbGxzLlxuICpcbiAqL1xuZXhwb3J0IHR5cGUgRnJhbWV3b3JrT3B0aW9ucyA9IHtcbiAgaXNBbmd1bGFyPzogYm9vbGVhbjtcbiAgdW5wcm90ZWN0ZWRSZXNvdXJjZXM/OiBBcnJheTxzdHJpbmc+O1xuICBwcm90ZWN0ZWRSZXNvdXJjZU1hcD86IE1hcDxzdHJpbmcsIEFycmF5PHN0cmluZz4+O1xufTtcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIE9iamVjdFxuICovXG5leHBvcnQgdHlwZSBDb25maWd1cmF0aW9uID0ge1xuICBhdXRoOiBBdXRoT3B0aW9ucyxcbiAgY2FjaGU/OiBDYWNoZU9wdGlvbnMsXG4gIHN5c3RlbT86IFN5c3RlbU9wdGlvbnMsXG4gIGZyYW1ld29yaz86IEZyYW1ld29ya09wdGlvbnNcbn07XG5cbmNvbnN0IERFRkFVTFRfQVVUSF9PUFRJT05TOiBBdXRoT3B0aW9ucyA9IHtcbiAgY2xpZW50SWQ6IFwiXCIsXG4gIGF1dGhvcml0eTogbnVsbCxcbiAgdmFsaWRhdGVBdXRob3JpdHk6IHRydWUsXG4gIHJlZGlyZWN0VXJpOiAoKSA9PiBVdGlscy5nZXREZWZhdWx0UmVkaXJlY3RVcmkoKSxcbiAgcG9zdExvZ291dFJlZGlyZWN0VXJpOiAoKSA9PiBVdGlscy5nZXREZWZhdWx0UmVkaXJlY3RVcmkoKSxcbiAgc3RhdGU6IFwiXCIsXG4gIG5hdmlnYXRlVG9Mb2dpblJlcXVlc3RVcmw6IHRydWVcbn07XG5cbmNvbnN0IERFRkFVTFRfQ0FDSEVfT1BUSU9OUzogQ2FjaGVPcHRpb25zID0ge1xuICBjYWNoZUxvY2F0aW9uOiBcInNlc3Npb25TdG9yYWdlXCIsXG4gIHN0b3JlQXV0aFN0YXRlSW5Db29raWU6IGZhbHNlXG59O1xuXG5jb25zdCBERUZBVUxUX1NZU1RFTV9PUFRJT05TOiBTeXN0ZW1PcHRpb25zID0ge1xuICBsb2dnZXI6IG5ldyBMb2dnZXIobnVsbCksXG4gIGxvYWRGcmFtZVRpbWVvdXQ6IEZSQU1FX1RJTUVPVVQsXG4gIHRva2VuUmVuZXdhbE9mZnNldFNlY29uZHM6IE9GRlNFVFxufTtcblxuY29uc3QgREVGQVVMVF9GUkFNRVdPUktfT1BUSU9OUzogRnJhbWV3b3JrT3B0aW9ucyA9IHtcbiAgaXNBbmd1bGFyOiBmYWxzZSxcbiAgdW5wcm90ZWN0ZWRSZXNvdXJjZXM6IG5ldyBBcnJheTxzdHJpbmc+KCksXG4gIHByb3RlY3RlZFJlc291cmNlTWFwOiBuZXcgTWFwPHN0cmluZywgQXJyYXk8c3RyaW5nPj4oKVxufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBzZXQgdGhlIGRlZmF1bHQgb3B0aW9ucyB3aGVuIG5vdCBleHBsaWNpdGx5IHNldFxuICpcbiAqIEBwYXJhbSBUQXV0aE9wdGlvbnNcbiAqIEBwYXJhbSBUQ2FjaGVPcHRpb25zXG4gKiBAcGFyYW0gVFN5c3RlbU9wdGlvbnNcbiAqIEBwYXJhbSBURnJhbWV3b3JrT3B0aW9uc1xuICpcbiAqIEByZXR1cm5zIFRDb25maWd1cmF0aW9uIG9iamVjdFxuICovXG5cbi8vIGRlc3RydWN0dXJlIHdpdGggZGVmYXVsdCBzZXR0aW5nc1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkQ29uZmlndXJhdGlvbih7IGF1dGgsIGNhY2hlID0ge30sIHN5c3RlbSA9IHt9LCBmcmFtZXdvcmsgPSB7fX06IENvbmZpZ3VyYXRpb24pOiBDb25maWd1cmF0aW9uIHtcbiAgY29uc3Qgb3ZlcmxheWVkQ29uZmlnOiBDb25maWd1cmF0aW9uID0ge1xuICAgIGF1dGg6IHsgLi4uREVGQVVMVF9BVVRIX09QVElPTlMsIC4uLmF1dGggfSxcbiAgICBjYWNoZTogeyAuLi5ERUZBVUxUX0NBQ0hFX09QVElPTlMsIC4uLmNhY2hlIH0sXG4gICAgc3lzdGVtOiB7IC4uLkRFRkFVTFRfU1lTVEVNX09QVElPTlMsIC4uLnN5c3RlbSB9LFxuICAgIGZyYW1ld29yazogeyAuLi5ERUZBVUxUX0ZSQU1FV09SS19PUFRJT05TLCAuLi5mcmFtZXdvcmsgfVxuICB9O1xuICByZXR1cm4gb3ZlcmxheWVkQ29uZmlnO1xufVxuXG4iLCIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cblxuaW1wb3J0IHsgU2VydmVyRXJyb3IgfSBmcm9tIFwiLi9TZXJ2ZXJFcnJvclwiO1xuXG5leHBvcnQgY29uc3QgSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvck1lc3NhZ2UgPSB7XG4gICAgbG9naW5SZXF1aXJlZDoge1xuICAgICAgICBjb2RlOiBcImxvZ2luX3JlcXVpcmVkXCJcbiAgICB9LFxuICAgIGludGVyYWN0aW9uUmVxdWlyZWQ6IHtcbiAgICAgICAgY29kZTogXCJpbnRlcmFjdGlvbl9yZXF1aXJlZFwiXG4gICAgfSxcbiAgICBjb25zZW50UmVxdWlyZWQ6IHtcbiAgICAgICAgY29kZTogXCJjb25zZW50X3JlcXVpcmVkXCJcbiAgICB9LFxufTtcblxuLyoqXG4gKiBFcnJvciB0aHJvd24gd2hlbiB0aGUgdXNlciBpcyByZXF1aXJlZCB0byBwZXJmb3JtIGFuIGludGVyYWN0aXZlIHRva2VuIHJlcXVlc3QuXG4gKi9cbmV4cG9ydCBjbGFzcyBJbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yIGV4dGVuZHMgU2VydmVyRXJyb3Ige1xuXG4gICAgY29uc3RydWN0b3IoZXJyb3JDb2RlOiBzdHJpbmcsIGVycm9yTWVzc2FnZT86IHN0cmluZykge1xuICAgICAgICBzdXBlcihlcnJvckNvZGUsIGVycm9yTWVzc2FnZSk7XG4gICAgICAgIHRoaXMubmFtZSA9IFwiSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvclwiO1xuXG4gICAgICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZih0aGlzLCBJbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yLnByb3RvdHlwZSk7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZUxvZ2luUmVxdWlyZWRBdXRoRXJyb3IoZXJyb3JEZXNjOiBzdHJpbmcpOiBJbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yKEludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3JNZXNzYWdlLmxvZ2luUmVxdWlyZWQuY29kZSwgZXJyb3JEZXNjKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvcihlcnJvckRlc2M6IHN0cmluZyk6IEludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3Ige1xuICAgICAgICByZXR1cm4gbmV3IEludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3IoSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvck1lc3NhZ2UuaW50ZXJhY3Rpb25SZXF1aXJlZC5jb2RlLCBlcnJvckRlc2MpO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVDb25zZW50UmVxdWlyZWRBdXRoRXJyb3IoZXJyb3JEZXNjOiBzdHJpbmcpOiBJbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yKEludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3JNZXNzYWdlLmNvbnNlbnRSZXF1aXJlZC5jb2RlLCBlcnJvckRlc2MpO1xuICAgIH1cbn1cbiIsImV4cG9ydCB7IFVzZXJBZ2VudEFwcGxpY2F0aW9uIH0gZnJvbSBcIi4vVXNlckFnZW50QXBwbGljYXRpb25cIjtcbmV4cG9ydCB7IExvZ2dlciB9IGZyb20gXCIuL0xvZ2dlclwiO1xuZXhwb3J0IHsgTG9nTGV2ZWwgfSBmcm9tIFwiLi9Mb2dnZXJcIjtcbmV4cG9ydCB7IEFjY291bnQgfSBmcm9tIFwiLi9BY2NvdW50XCI7XG5leHBvcnQgeyBDb25zdGFudHMgfSBmcm9tIFwiLi9Db25zdGFudHNcIjtcbmV4cG9ydCB7IEF1dGhvcml0eSB9IGZyb20gXCIuL0F1dGhvcml0eVwiO1xuZXhwb3J0IHsgQ2FjaGVSZXN1bHQgfSBmcm9tIFwiLi9Vc2VyQWdlbnRBcHBsaWNhdGlvblwiO1xuZXhwb3J0IHsgQ2FjaGVMb2NhdGlvbiwgQ29uZmlndXJhdGlvbiB9IGZyb20gXCIuL0NvbmZpZ3VyYXRpb25cIjtcbmV4cG9ydCB7IEF1dGhlbnRpY2F0aW9uUGFyYW1ldGVycyB9IGZyb20gXCIuL0F1dGhlbnRpY2F0aW9uUGFyYW1ldGVyc1wiO1xuZXhwb3J0IHsgQXV0aFJlc3BvbnNlIH0gZnJvbSBcIi4vQXV0aFJlc3BvbnNlXCI7XG5cbi8vIEVycm9yc1xuZXhwb3J0IHsgQXV0aEVycm9yIH0gZnJvbSBcIi4vZXJyb3IvQXV0aEVycm9yXCI7XG5leHBvcnQgeyBDbGllbnRBdXRoRXJyb3IgfSBmcm9tIFwiLi9lcnJvci9DbGllbnRBdXRoRXJyb3JcIjtcbmV4cG9ydCB7IFNlcnZlckVycm9yIH0gZnJvbSBcIi4vZXJyb3IvU2VydmVyRXJyb3JcIjtcbmV4cG9ydCB7IENsaWVudENvbmZpZ3VyYXRpb25FcnJvciB9IGZyb20gXCIuL2Vycm9yL0NsaWVudENvbmZpZ3VyYXRpb25FcnJvclwiO1xuZXhwb3J0IHsgSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvciB9IGZyb20gXCIuL2Vycm9yL0ludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3JcIjtcbiIsIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuXG5pbXBvcnQgeyBVdGlscyB9IGZyb20gXCIuL1V0aWxzXCI7XG5cbi8qKlxuICogQGhpZGRlblxuICovXG5leHBvcnQgY2xhc3MgQWNjZXNzVG9rZW5LZXkge1xuXG4gIGF1dGhvcml0eTogc3RyaW5nO1xuICBjbGllbnRJZDogc3RyaW5nO1xuICBzY29wZXM6IHN0cmluZztcbiAgaG9tZUFjY291bnRJZGVudGlmaWVyOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoYXV0aG9yaXR5OiBzdHJpbmcsIGNsaWVudElkOiBzdHJpbmcsIHNjb3Blczogc3RyaW5nLCB1aWQ6IHN0cmluZywgdXRpZDogc3RyaW5nKSB7XG4gICAgLy8gVE9ETzogQ2Fub25pY2FsaXplIGF1dGhvcml0eSBVUklcbiAgICB0aGlzLmF1dGhvcml0eSA9IGF1dGhvcml0eTtcbiAgICB0aGlzLmNsaWVudElkID0gY2xpZW50SWQ7XG4gICAgdGhpcy5zY29wZXMgPSBzY29wZXM7XG4gICAgdGhpcy5ob21lQWNjb3VudElkZW50aWZpZXIgPSBVdGlscy5iYXNlNjRFbmNvZGVTdHJpbmdVcmxTYWZlKHVpZCkgKyBcIi5cIiArIFV0aWxzLmJhc2U2NEVuY29kZVN0cmluZ1VybFNhZmUodXRpZCk7XG4gIH1cbn1cbiIsIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuXG4vKipcbiAqIEBoaWRkZW5cbiAqL1xuZXhwb3J0IGNsYXNzIEFjY2Vzc1Rva2VuVmFsdWUge1xuXG4gIGFjY2Vzc1Rva2VuOiBzdHJpbmc7XG4gIGlkVG9rZW46IHN0cmluZztcbiAgZXhwaXJlc0luOiBzdHJpbmc7XG4gIGhvbWVBY2NvdW50SWRlbnRpZmllcjogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKGFjY2Vzc1Rva2VuOiBzdHJpbmcsIGlkVG9rZW46IHN0cmluZywgZXhwaXJlc0luOiBzdHJpbmcsIGhvbWVBY2NvdW50SWRlbnRpZmllcjogc3RyaW5nKSB7XG4gICAgdGhpcy5hY2Nlc3NUb2tlbiA9IGFjY2Vzc1Rva2VuO1xuICAgIHRoaXMuaWRUb2tlbiA9IGlkVG9rZW47XG4gICAgdGhpcy5leHBpcmVzSW4gPSBleHBpcmVzSW47XG4gICAgdGhpcy5ob21lQWNjb3VudElkZW50aWZpZXIgPSBob21lQWNjb3VudElkZW50aWZpZXI7XG4gIH1cbn1cbiIsIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuXG5pbXBvcnQgeyBBdXRob3JpdHkgfSBmcm9tIFwiLi9BdXRob3JpdHlcIjtcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSBcIi4vVXRpbHNcIjtcblxuLyoqXG4gKiBOb25jZTogT0lEQyBOb25jZSBkZWZpbml0aW9uOiBodHRwczovL29wZW5pZC5uZXQvc3BlY3Mvb3BlbmlkLWNvbm5lY3QtY29yZS0xXzAuaHRtbCNJRFRva2VuXG4gKiBTdGF0ZTogT0F1dGggU3BlYzogaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzY3NDkjc2VjdGlvbi0xMC4xMlxuICogQGhpZGRlblxuICovXG5leHBvcnQgY2xhc3MgU2VydmVyUmVxdWVzdFBhcmFtZXRlcnMge1xuXG4gIGF1dGhvcml0eUluc3RhbmNlOiBBdXRob3JpdHk7XG4gIGNsaWVudElkOiBzdHJpbmc7XG4gIHNjb3BlczogQXJyYXk8c3RyaW5nPjtcblxuICBub25jZTogc3RyaW5nO1xuICBzdGF0ZTogc3RyaW5nO1xuXG4gIC8vIHRlbGVtZXRyeSBpbmZvcm1hdGlvblxuICB4Q2xpZW50VmVyOiBzdHJpbmc7XG4gIHhDbGllbnRTa3U6IHN0cmluZztcbiAgY29ycmVsYXRpb25JZDogc3RyaW5nO1xuXG4gIHJlc3BvbnNlVHlwZTogc3RyaW5nO1xuICByZWRpcmVjdFVyaTogc3RyaW5nO1xuXG4gIC8vIFRPRE86IFRoZSBiZWxvdyBhcmUgbm90IHVzZWQgLSBjaGVjayBhbmQgZGVsZXRlIHdpdGggdGhlIHJlbmFtZSBQUlxuICBwcm9tcHRWYWx1ZTogc3RyaW5nO1xuICBzaWQ6IHN0cmluZztcbiAgbG9naW5IaW50OiBzdHJpbmc7XG4gIGRvbWFpbkhpbnQ6IHN0cmluZztcbiAgbG9naW5SZXE6IHN0cmluZztcbiAgZG9tYWluUmVxOiBzdHJpbmc7XG5cbiAgcXVlcnlQYXJhbWV0ZXJzOiBzdHJpbmc7XG4gIGV4dHJhUXVlcnlQYXJhbWV0ZXJzOiBzdHJpbmc7XG5cbiAgcHVibGljIGdldCBhdXRob3JpdHkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5hdXRob3JpdHlJbnN0YW5jZSA/IHRoaXMuYXV0aG9yaXR5SW5zdGFuY2UuQ2Fub25pY2FsQXV0aG9yaXR5IDogbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0gYXV0aG9yaXR5XG4gICAqIEBwYXJhbSBjbGllbnRJZFxuICAgKiBAcGFyYW0gc2NvcGVcbiAgICogQHBhcmFtIHJlc3BvbnNlVHlwZVxuICAgKiBAcGFyYW0gcmVkaXJlY3RVcmlcbiAgICogQHBhcmFtIHN0YXRlXG4gICAqL1xuICBjb25zdHJ1Y3RvciAoYXV0aG9yaXR5OiBBdXRob3JpdHksIGNsaWVudElkOiBzdHJpbmcsIHNjb3BlOiBBcnJheTxzdHJpbmc+LCByZXNwb25zZVR5cGU6IHN0cmluZywgcmVkaXJlY3RVcmk6IHN0cmluZywgc3RhdGU6IHN0cmluZyApIHtcbiAgICB0aGlzLmF1dGhvcml0eUluc3RhbmNlID0gYXV0aG9yaXR5O1xuICAgIHRoaXMuY2xpZW50SWQgPSBjbGllbnRJZDtcbiAgICB0aGlzLnNjb3BlcyA9IHNjb3BlO1xuXG4gICAgdGhpcy5ub25jZSA9IFV0aWxzLmNyZWF0ZU5ld0d1aWQoKTtcbiAgICB0aGlzLnN0YXRlID0gc3RhdGUgJiYgIVV0aWxzLmlzRW1wdHkoc3RhdGUpID8gIFV0aWxzLmNyZWF0ZU5ld0d1aWQoKSArIFwifFwiICsgc3RhdGUgICA6IFV0aWxzLmNyZWF0ZU5ld0d1aWQoKTtcblxuICAgIC8vIFRPRE86IENoYW5nZSB0aGlzIHRvIHVzZXIgcGFzc2VkIHZzIGdlbmVyYXRlZCB3aXRoIHRoZSBuZXcgUFJcbiAgICB0aGlzLmNvcnJlbGF0aW9uSWQgPSBVdGlscy5jcmVhdGVOZXdHdWlkKCk7XG5cbiAgICAvLyB0ZWxlbWV0cnkgaW5mb3JtYXRpb25cbiAgICB0aGlzLnhDbGllbnRTa3UgPSBcIk1TQUwuSlNcIjtcbiAgICB0aGlzLnhDbGllbnRWZXIgPSBVdGlscy5nZXRMaWJyYXJ5VmVyc2lvbigpO1xuXG4gICAgdGhpcy5yZXNwb25zZVR5cGUgPSByZXNwb25zZVR5cGU7XG4gICAgdGhpcy5yZWRpcmVjdFVyaSA9IHJlZGlyZWN0VXJpO1xuXG4gIH1cblxuICAvKipcbiAgICogZ2VuZXJhdGVzIHRoZSBVUkwgd2l0aCBRdWVyeVN0cmluZyBQYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBzY29wZXNcbiAgICovXG4gIGNyZWF0ZU5hdmlnYXRlVXJsKHNjb3BlczogQXJyYXk8c3RyaW5nPik6IHN0cmluZyB7XG4gICAgY29uc3Qgc3RyID0gdGhpcy5jcmVhdGVOYXZpZ2F0aW9uVXJsU3RyaW5nKHNjb3Blcyk7XG4gICAgbGV0IGF1dGhFbmRwb2ludDogc3RyaW5nID0gdGhpcy5hdXRob3JpdHlJbnN0YW5jZS5BdXRob3JpemF0aW9uRW5kcG9pbnQ7XG4gICAgLy8gaWYgdGhlIGVuZHBvaW50IGFscmVhZHkgaGFzIHF1ZXJ5cGFyYW1zLCBsZXRzIGFkZCB0byBpdCwgb3RoZXJ3aXNlIGFkZCB0aGUgZmlyc3Qgb25lXG4gICAgaWYgKGF1dGhFbmRwb2ludC5pbmRleE9mKFwiP1wiKSA8IDApIHtcbiAgICAgIGF1dGhFbmRwb2ludCArPSBcIj9cIjtcbiAgICB9IGVsc2Uge1xuICAgICAgYXV0aEVuZHBvaW50ICs9IFwiJlwiO1xuICAgIH1cblxuICAgIGNvbnN0IHJlcXVlc3RVcmw6IHN0cmluZyA9IGAke2F1dGhFbmRwb2ludH0ke3N0ci5qb2luKFwiJlwiKX1gO1xuICAgIHJldHVybiByZXF1ZXN0VXJsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIHRoZSBhcnJheSBvZiBhbGwgUXVlcnlTdHJpbmdQYXJhbXMgdG8gYmUgc2VudCB0byB0aGUgc2VydmVyXG4gICAqIEBwYXJhbSBzY29wZXNcbiAgICovXG4gIGNyZWF0ZU5hdmlnYXRpb25VcmxTdHJpbmcoc2NvcGVzOiBBcnJheTxzdHJpbmc+KTogQXJyYXk8c3RyaW5nPiB7XG4gICAgaWYgKCFzY29wZXMpIHtcbiAgICAgIHNjb3BlcyA9IFt0aGlzLmNsaWVudElkXTtcbiAgICB9XG5cbiAgICBpZiAoc2NvcGVzLmluZGV4T2YodGhpcy5jbGllbnRJZCkgPT09IC0xKSB7XG4gICAgICBzY29wZXMucHVzaCh0aGlzLmNsaWVudElkKTtcbiAgICB9XG4gICAgY29uc3Qgc3RyOiBBcnJheTxzdHJpbmc+ID0gW107XG4gICAgc3RyLnB1c2goXCJyZXNwb25zZV90eXBlPVwiICsgdGhpcy5yZXNwb25zZVR5cGUpO1xuXG4gICAgdGhpcy50cmFuc2xhdGVjbGllbnRJZFVzZWRJblNjb3BlKHNjb3Blcyk7XG4gICAgc3RyLnB1c2goXCJzY29wZT1cIiArIGVuY29kZVVSSUNvbXBvbmVudCh0aGlzLnBhcnNlU2NvcGUoc2NvcGVzKSkpO1xuICAgIHN0ci5wdXNoKFwiY2xpZW50X2lkPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMuY2xpZW50SWQpKTtcbiAgICBzdHIucHVzaChcInJlZGlyZWN0X3VyaT1cIiArIGVuY29kZVVSSUNvbXBvbmVudCh0aGlzLnJlZGlyZWN0VXJpKSk7XG5cbiAgICBzdHIucHVzaChcInN0YXRlPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMuc3RhdGUpKTtcbiAgICBzdHIucHVzaChcIm5vbmNlPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMubm9uY2UpKTtcblxuICAgIHN0ci5wdXNoKFwiY2xpZW50X2luZm89MVwiKTtcbiAgICBzdHIucHVzaChgeC1jbGllbnQtU0tVPSR7dGhpcy54Q2xpZW50U2t1fWApO1xuICAgIHN0ci5wdXNoKGB4LWNsaWVudC1WZXI9JHt0aGlzLnhDbGllbnRWZXJ9YCk7XG4gICAgaWYgKHRoaXMucHJvbXB0VmFsdWUpIHtcbiAgICAgIHN0ci5wdXNoKFwicHJvbXB0PVwiICsgZW5jb2RlVVJJKHRoaXMucHJvbXB0VmFsdWUpKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5xdWVyeVBhcmFtZXRlcnMpIHtcbiAgICAgIHN0ci5wdXNoKHRoaXMucXVlcnlQYXJhbWV0ZXJzKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5leHRyYVF1ZXJ5UGFyYW1ldGVycykge1xuICAgICAgc3RyLnB1c2godGhpcy5leHRyYVF1ZXJ5UGFyYW1ldGVycyk7XG4gICAgfVxuXG4gICAgc3RyLnB1c2goXCJjbGllbnQtcmVxdWVzdC1pZD1cIiArIGVuY29kZVVSSUNvbXBvbmVudCh0aGlzLmNvcnJlbGF0aW9uSWQpKTtcbiAgICByZXR1cm4gc3RyO1xuICB9XG5cbiAgLyoqXG4gICAqIGFwcGVuZCB0aGUgcmVxdWlyZWQgc2NvcGVzOiBodHRwczovL29wZW5pZC5uZXQvc3BlY3Mvb3BlbmlkLWNvbm5lY3QtYmFzaWMtMV8wLmh0bWwjU2NvcGVzXG4gICAqIEBwYXJhbSBzY29wZXNcbiAgICovXG4gIHRyYW5zbGF0ZWNsaWVudElkVXNlZEluU2NvcGUoc2NvcGVzOiBBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gICAgY29uc3QgY2xpZW50SWRJbmRleDogbnVtYmVyID0gc2NvcGVzLmluZGV4T2YodGhpcy5jbGllbnRJZCk7XG4gICAgaWYgKGNsaWVudElkSW5kZXggPj0gMCkge1xuICAgICAgc2NvcGVzLnNwbGljZShjbGllbnRJZEluZGV4LCAxKTtcbiAgICAgIGlmIChzY29wZXMuaW5kZXhPZihcIm9wZW5pZFwiKSA9PT0gLTEpIHtcbiAgICAgICAgc2NvcGVzLnB1c2goXCJvcGVuaWRcIik7XG4gICAgICB9XG4gICAgICBpZiAoc2NvcGVzLmluZGV4T2YoXCJwcm9maWxlXCIpID09PSAtMSkge1xuICAgICAgICBzY29wZXMucHVzaChcInByb2ZpbGVcIik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIHRoZSBzY29wZXMgaW50byBhIGZvcm1hdHRlZCBzY29wZUxpc3RcbiAgICogQHBhcmFtIHNjb3Blc1xuICAgKi9cbiAgcGFyc2VTY29wZShzY29wZXM6IEFycmF5PHN0cmluZz4pOiBzdHJpbmcge1xuICAgIGxldCBzY29wZUxpc3Q6IHN0cmluZyA9IFwiXCI7XG4gICAgaWYgKHNjb3Blcykge1xuICAgICAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgc2NvcGVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHNjb3BlTGlzdCArPSAoaSAhPT0gc2NvcGVzLmxlbmd0aCAtIDEpID8gc2NvcGVzW2ldICsgXCIgXCIgOiBzY29wZXNbaV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNjb3BlTGlzdDtcbiAgfVxufVxuIiwiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG5cbmltcG9ydCB7IFV0aWxzIH0gZnJvbSBcIi4vVXRpbHNcIjtcblxuLyoqXG4gKiBAaGlkZGVuXG4gKi9cbmV4cG9ydCBjbGFzcyBDbGllbnRJbmZvIHtcblxuICBwcml2YXRlIF91aWQ6IHN0cmluZztcbiAgZ2V0IHVpZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl91aWQgPyB0aGlzLl91aWQgOiBcIlwiO1xuICB9XG5cbiAgc2V0IHVpZCh1aWQ6IHN0cmluZykge1xuICAgIHRoaXMuX3VpZCA9IHVpZDtcbiAgfVxuXG4gIHByaXZhdGUgX3V0aWQ6IHN0cmluZztcbiAgZ2V0IHV0aWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fdXRpZCA/IHRoaXMuX3V0aWQgOiBcIlwiO1xuICB9XG5cbiAgc2V0IHV0aWQodXRpZDogc3RyaW5nKSB7XG4gICAgdGhpcy5fdXRpZCA9IHV0aWQ7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihyYXdDbGllbnRJbmZvOiBzdHJpbmcpIHtcbiAgICBpZiAoIXJhd0NsaWVudEluZm8gfHwgVXRpbHMuaXNFbXB0eShyYXdDbGllbnRJbmZvKSkge1xuICAgICAgdGhpcy51aWQgPSBcIlwiO1xuICAgICAgdGhpcy51dGlkID0gXCJcIjtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgZGVjb2RlZENsaWVudEluZm86IHN0cmluZyA9IFV0aWxzLmJhc2U2NERlY29kZVN0cmluZ1VybFNhZmUocmF3Q2xpZW50SW5mbyk7XG4gICAgICBjb25zdCBjbGllbnRJbmZvOiBDbGllbnRJbmZvID0gPENsaWVudEluZm8+SlNPTi5wYXJzZShkZWNvZGVkQ2xpZW50SW5mbyk7XG4gICAgICBpZiAoY2xpZW50SW5mbykge1xuICAgICAgICBpZiAoY2xpZW50SW5mby5oYXNPd25Qcm9wZXJ0eShcInVpZFwiKSkge1xuICAgICAgICAgIHRoaXMudWlkID0gY2xpZW50SW5mby51aWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2xpZW50SW5mby5oYXNPd25Qcm9wZXJ0eShcInV0aWRcIikpIHtcbiAgICAgICAgICB0aGlzLnV0aWQgPSBjbGllbnRJbmZvLnV0aWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZSk7XG4gICAgfVxuICB9XG59XG4iLCIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cblxuaW1wb3J0IHsgVXRpbHMgfSBmcm9tIFwiLi9VdGlsc1wiO1xuXG4vKipcbiAqIEBoaWRkZW5cbiAqL1xuZXhwb3J0IGNsYXNzIElkVG9rZW4ge1xuXG4gIGlzc3Vlcjogc3RyaW5nO1xuICBvYmplY3RJZDogc3RyaW5nO1xuICBzdWJqZWN0OiBzdHJpbmc7XG4gIHRlbmFudElkOiBzdHJpbmc7XG4gIHZlcnNpb246IHN0cmluZztcbiAgcHJlZmVycmVkTmFtZTogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIGhvbWVPYmplY3RJZDogc3RyaW5nO1xuICBub25jZTogc3RyaW5nO1xuICBleHBpcmF0aW9uOiBzdHJpbmc7XG4gIHJhd0lkVG9rZW46IHN0cmluZztcbiAgZGVjb2RlZElkVG9rZW46IE9iamVjdDtcbiAgc2lkOiBzdHJpbmc7XG4gIC8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXG4gIGNvbnN0cnVjdG9yKHJhd0lkVG9rZW46IHN0cmluZykge1xuICAgIGlmIChVdGlscy5pc0VtcHR5KHJhd0lkVG9rZW4pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJudWxsIG9yIGVtcHR5IHJhdyBpZHRva2VuXCIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgdGhpcy5yYXdJZFRva2VuID0gcmF3SWRUb2tlbjtcbiAgICAgIHRoaXMuZGVjb2RlZElkVG9rZW4gPSBVdGlscy5leHRyYWN0SWRUb2tlbihyYXdJZFRva2VuKTtcbiAgICAgIGlmICh0aGlzLmRlY29kZWRJZFRva2VuKSB7XG4gICAgICAgIGlmICh0aGlzLmRlY29kZWRJZFRva2VuLmhhc093blByb3BlcnR5KFwiaXNzXCIpKSB7XG4gICAgICAgICAgdGhpcy5pc3N1ZXIgPSB0aGlzLmRlY29kZWRJZFRva2VuW1wiaXNzXCJdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZGVjb2RlZElkVG9rZW4uaGFzT3duUHJvcGVydHkoXCJvaWRcIikpIHtcbiAgICAgICAgICAgIHRoaXMub2JqZWN0SWQgPSB0aGlzLmRlY29kZWRJZFRva2VuW1wib2lkXCJdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZGVjb2RlZElkVG9rZW4uaGFzT3duUHJvcGVydHkoXCJzdWJcIikpIHtcbiAgICAgICAgICB0aGlzLnN1YmplY3QgPSB0aGlzLmRlY29kZWRJZFRva2VuW1wic3ViXCJdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZGVjb2RlZElkVG9rZW4uaGFzT3duUHJvcGVydHkoXCJ0aWRcIikpIHtcbiAgICAgICAgICB0aGlzLnRlbmFudElkID0gdGhpcy5kZWNvZGVkSWRUb2tlbltcInRpZFwiXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRlY29kZWRJZFRva2VuLmhhc093blByb3BlcnR5KFwidmVyXCIpKSB7XG4gICAgICAgICAgdGhpcy52ZXJzaW9uID0gdGhpcy5kZWNvZGVkSWRUb2tlbltcInZlclwiXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRlY29kZWRJZFRva2VuLmhhc093blByb3BlcnR5KFwicHJlZmVycmVkX3VzZXJuYW1lXCIpKSB7XG4gICAgICAgICAgdGhpcy5wcmVmZXJyZWROYW1lID0gdGhpcy5kZWNvZGVkSWRUb2tlbltcInByZWZlcnJlZF91c2VybmFtZVwiXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRlY29kZWRJZFRva2VuLmhhc093blByb3BlcnR5KFwibmFtZVwiKSkge1xuICAgICAgICAgIHRoaXMubmFtZSA9IHRoaXMuZGVjb2RlZElkVG9rZW5bXCJuYW1lXCJdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZGVjb2RlZElkVG9rZW4uaGFzT3duUHJvcGVydHkoXCJub25jZVwiKSkge1xuICAgICAgICAgIHRoaXMubm9uY2UgPSB0aGlzLmRlY29kZWRJZFRva2VuW1wibm9uY2VcIl07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5kZWNvZGVkSWRUb2tlbi5oYXNPd25Qcm9wZXJ0eShcImV4cFwiKSkge1xuICAgICAgICAgIHRoaXMuZXhwaXJhdGlvbiA9IHRoaXMuZGVjb2RlZElkVG9rZW5bXCJleHBcIl07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5kZWNvZGVkSWRUb2tlbi5oYXNPd25Qcm9wZXJ0eShcImhvbWVfb2lkXCIpKSB7XG4gICAgICAgICAgICB0aGlzLmhvbWVPYmplY3RJZCA9IHRoaXMuZGVjb2RlZElkVG9rZW5bXCJob21lX29pZFwiXTtcbiAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRoaXMuZGVjb2RlZElkVG9rZW4uaGFzT3duUHJvcGVydHkoXCJzaWRcIikpIHtcbiAgICAgICAgICAgICAgdGhpcy5zaWQgPSB0aGlzLmRlY29kZWRJZFRva2VuW1wic2lkXCJdO1xuICAgICAgICAgIH1cbiAgICAgIC8qIHRzbGludDplbmFibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBUT0RPOiBUaGlzIGVycm9yIGhlcmUgd29uJ3QgcmVhbGx5IGV2ZXJ5IGJlIHRocm93biwgc2luY2UgZXh0cmFjdElkVG9rZW4oKSByZXR1cm5zIG51bGwgaWYgdGhlIGRlY29kZUp3dCgpIGZhaWxzLlxuICAgICAgLy8gTmVlZCB0byBhZGQgYmV0dGVyIGVycm9yIGhhbmRsaW5nIGhlcmUgdG8gYWNjb3VudCBmb3IgYmVpbmcgdW5hYmxlIHRvIGRlY29kZSBqd3RzLlxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIHBhcnNlIHRoZSByZXR1cm5lZCBpZCB0b2tlblwiKTtcbiAgICB9XG4gIH1cblxufVxuIiwiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG5cbmltcG9ydCB7IENvbnN0YW50cyB9IGZyb20gXCIuL0NvbnN0YW50c1wiO1xuaW1wb3J0IHsgQWNjZXNzVG9rZW5DYWNoZUl0ZW0gfSBmcm9tIFwiLi9BY2Nlc3NUb2tlbkNhY2hlSXRlbVwiO1xuaW1wb3J0IHsgQ2FjaGVMb2NhdGlvbiB9IGZyb20gXCIuL0NvbmZpZ3VyYXRpb25cIjtcbmltcG9ydCB7IENhY2hlS2V5cyB9IGZyb20gXCIuL0NvbnN0YW50c1wiO1xuXG4vKipcbiAqIEBoaWRkZW5cbiAqL1xuZXhwb3J0IGNsYXNzIFN0b3JhZ2Ugey8vIFNpbmdsZXRvblxuXG4gIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBTdG9yYWdlO1xuICBwcml2YXRlIGxvY2FsU3RvcmFnZVN1cHBvcnRlZDogYm9vbGVhbjtcbiAgcHJpdmF0ZSBzZXNzaW9uU3RvcmFnZVN1cHBvcnRlZDogYm9vbGVhbjtcbiAgcHJpdmF0ZSBjYWNoZUxvY2F0aW9uOiBDYWNoZUxvY2F0aW9uO1xuXG4gIGNvbnN0cnVjdG9yKGNhY2hlTG9jYXRpb246IENhY2hlTG9jYXRpb24pIHtcbiAgICBpZiAoU3RvcmFnZS5pbnN0YW5jZSkge1xuICAgICAgcmV0dXJuIFN0b3JhZ2UuaW5zdGFuY2U7XG4gICAgfVxuXG4gICAgdGhpcy5jYWNoZUxvY2F0aW9uID0gY2FjaGVMb2NhdGlvbjtcbiAgICB0aGlzLmxvY2FsU3RvcmFnZVN1cHBvcnRlZCA9IHR5cGVvZiB3aW5kb3dbdGhpcy5jYWNoZUxvY2F0aW9uXSAhPT0gXCJ1bmRlZmluZWRcIiAmJiB3aW5kb3dbdGhpcy5jYWNoZUxvY2F0aW9uXSAhPSBudWxsO1xuICAgIHRoaXMuc2Vzc2lvblN0b3JhZ2VTdXBwb3J0ZWQgPSB0eXBlb2Ygd2luZG93W2NhY2hlTG9jYXRpb25dICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvd1tjYWNoZUxvY2F0aW9uXSAhPSBudWxsO1xuICAgIFN0b3JhZ2UuaW5zdGFuY2UgPSB0aGlzO1xuICAgIGlmICghdGhpcy5sb2NhbFN0b3JhZ2VTdXBwb3J0ZWQgJiYgIXRoaXMuc2Vzc2lvblN0b3JhZ2VTdXBwb3J0ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImxvY2FsU3RvcmFnZSBhbmQgc2Vzc2lvblN0b3JhZ2Ugbm90IHN1cHBvcnRlZFwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gU3RvcmFnZS5pbnN0YW5jZTtcbiAgfVxuXG4gICAgLy8gYWRkIHZhbHVlIHRvIHN0b3JhZ2VcbiAgICBzZXRJdGVtKGtleTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nLCBlbmFibGVDb29raWVTdG9yYWdlPzogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICBpZiAod2luZG93W3RoaXMuY2FjaGVMb2NhdGlvbl0pIHtcbiAgICAgICAgICAgIHdpbmRvd1t0aGlzLmNhY2hlTG9jYXRpb25dLnNldEl0ZW0oa2V5LCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVuYWJsZUNvb2tpZVN0b3JhZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0SXRlbUNvb2tpZShrZXksIHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGdldCBvbmUgaXRlbSBieSBrZXkgZnJvbSBzdG9yYWdlXG4gICAgZ2V0SXRlbShrZXk6IHN0cmluZywgZW5hYmxlQ29va2llU3RvcmFnZT86IGJvb2xlYW4pOiBzdHJpbmcge1xuICAgICAgICBpZiAoZW5hYmxlQ29va2llU3RvcmFnZSAmJiB0aGlzLmdldEl0ZW1Db29raWUoa2V5KSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0SXRlbUNvb2tpZShrZXkpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh3aW5kb3dbdGhpcy5jYWNoZUxvY2F0aW9uXSkge1xuICAgICAgICAgICAgcmV0dXJuIHdpbmRvd1t0aGlzLmNhY2hlTG9jYXRpb25dLmdldEl0ZW0oa2V5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyByZW1vdmUgdmFsdWUgZnJvbSBzdG9yYWdlXG4gICAgcmVtb3ZlSXRlbShrZXk6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBpZiAod2luZG93W3RoaXMuY2FjaGVMb2NhdGlvbl0pIHtcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3dbdGhpcy5jYWNoZUxvY2F0aW9uXS5yZW1vdmVJdGVtKGtleSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBjbGVhciBzdG9yYWdlIChyZW1vdmUgYWxsIGl0ZW1zIGZyb20gaXQpXG4gICAgY2xlYXIoKTogdm9pZCB7XG4gICAgICAgIGlmICh3aW5kb3dbdGhpcy5jYWNoZUxvY2F0aW9uXSkge1xuICAgICAgICAgICAgcmV0dXJuIHdpbmRvd1t0aGlzLmNhY2hlTG9jYXRpb25dLmNsZWFyKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRBbGxBY2Nlc3NUb2tlbnMoY2xpZW50SWQ6IHN0cmluZywgaG9tZUFjY291bnRJZGVudGlmaWVyOiBzdHJpbmcpOiBBcnJheTxBY2Nlc3NUb2tlbkNhY2hlSXRlbT4ge1xuICAgICAgICBjb25zdCByZXN1bHRzOiBBcnJheTxBY2Nlc3NUb2tlbkNhY2hlSXRlbT4gPSBbXTtcbiAgICAgICAgbGV0IGFjY2Vzc1Rva2VuQ2FjaGVJdGVtOiBBY2Nlc3NUb2tlbkNhY2hlSXRlbTtcbiAgICAgICAgY29uc3Qgc3RvcmFnZSA9IHdpbmRvd1t0aGlzLmNhY2hlTG9jYXRpb25dO1xuICAgICAgICBpZiAoc3RvcmFnZSkge1xuICAgICAgICAgICAgbGV0IGtleTogc3RyaW5nO1xuICAgICAgICAgICAgZm9yIChrZXkgaW4gc3RvcmFnZSkge1xuICAgICAgICAgICAgICAgIGlmIChzdG9yYWdlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleS5tYXRjaChjbGllbnRJZCkgJiYga2V5Lm1hdGNoKGhvbWVBY2NvdW50SWRlbnRpZmllcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy5nZXRJdGVtKGtleSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY2Nlc3NUb2tlbkNhY2hlSXRlbSA9IG5ldyBBY2Nlc3NUb2tlbkNhY2hlSXRlbShKU09OLnBhcnNlKGtleSksIEpTT04ucGFyc2UodmFsdWUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goYWNjZXNzVG9rZW5DYWNoZUl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuXG4gICAgcmVtb3ZlQWNxdWlyZVRva2VuRW50cmllcyhhdXRob3JpdHlLZXk6IHN0cmluZywgYWNxdWlyZVRva2VuQWNjb3VudEtleTogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHN0b3JhZ2UgPSB3aW5kb3dbdGhpcy5jYWNoZUxvY2F0aW9uXTtcbiAgICAgICAgaWYgKHN0b3JhZ2UpIHtcbiAgICAgICAgICAgIGxldCBrZXk6IHN0cmluZztcbiAgICAgICAgICAgIGZvciAoa2V5IGluIHN0b3JhZ2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RvcmFnZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgoYXV0aG9yaXR5S2V5ICE9PSBcIlwiICYmIGtleS5pbmRleE9mKGF1dGhvcml0eUtleSkgPiAtMSkgfHwgKGFjcXVpcmVUb2tlbkFjY291bnRLZXkgIT09IFwiXCIgJiYga2V5LmluZGV4T2YoYWNxdWlyZVRva2VuQWNjb3VudEtleSkgPiAtMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlSXRlbShrZXkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVzZXRDYWNoZUl0ZW1zKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBzdG9yYWdlID0gd2luZG93W3RoaXMuY2FjaGVMb2NhdGlvbl07XG4gICAgICAgIGlmIChzdG9yYWdlKSB7XG4gICAgICAgICAgICBsZXQga2V5OiBzdHJpbmc7XG4gICAgICAgICAgICBmb3IgKGtleSBpbiBzdG9yYWdlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0b3JhZ2UuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5LmluZGV4T2YoQ29uc3RhbnRzLm1zYWwpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRJdGVtKGtleSwgXCJcIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleS5pbmRleE9mKENvbnN0YW50cy5yZW5ld1N0YXR1cykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUl0ZW0oa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldEl0ZW1Db29raWUoY05hbWU6IHN0cmluZywgY1ZhbHVlOiBzdHJpbmcsIGV4cGlyZXM/OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgbGV0IGNvb2tpZVN0ciA9IGNOYW1lICsgXCI9XCIgKyBjVmFsdWUgKyBcIjtcIjtcbiAgICAgICAgaWYgKGV4cGlyZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IGV4cGlyZVRpbWUgPSB0aGlzLnNldEV4cGlyYXRpb25Db29raWUoZXhwaXJlcyk7XG4gICAgICAgICAgICBjb29raWVTdHIgKz0gXCJleHBpcmVzPVwiICsgZXhwaXJlVGltZSArIFwiO1wiO1xuICAgICAgICB9XG5cbiAgICAgICAgZG9jdW1lbnQuY29va2llID0gY29va2llU3RyO1xuICAgIH1cblxuICAgIGdldEl0ZW1Db29raWUoY05hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBjTmFtZSArIFwiPVwiO1xuICAgICAgICBjb25zdCBjYSA9IGRvY3VtZW50LmNvb2tpZS5zcGxpdChcIjtcIik7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2EubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBjID0gY2FbaV07XG4gICAgICAgICAgICB3aGlsZSAoYy5jaGFyQXQoMCkgPT09IFwiIFwiKSB7XG4gICAgICAgICAgICAgICAgYyA9IGMuc3Vic3RyaW5nKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGMuaW5kZXhPZihuYW1lKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjLnN1YnN0cmluZyhuYW1lLmxlbmd0aCwgYy5sZW5ndGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cblxuICAgIHNldEV4cGlyYXRpb25Db29raWUoY29va2llTGlmZTogbnVtYmVyKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgdG9kYXkgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBjb25zdCBleHByID0gbmV3IERhdGUodG9kYXkuZ2V0VGltZSgpICsgY29va2llTGlmZSAqIDI0ICogNjAgKiA2MCAqIDEwMDApO1xuICAgICAgICByZXR1cm4gZXhwci50b1VUQ1N0cmluZygpO1xuICAgIH1cblxuICAgIGNsZWFyQ29va2llKCk6IHZvaWQge1xuICAgICAgICB0aGlzLnNldEl0ZW1Db29raWUoQ29uc3RhbnRzLm5vbmNlSWRUb2tlbiwgXCJcIiwgLTEpO1xuICAgICAgICB0aGlzLnNldEl0ZW1Db29raWUoQ29uc3RhbnRzLnN0YXRlTG9naW4sIFwiXCIsIC0xKTtcbiAgICAgICAgdGhpcy5zZXRJdGVtQ29va2llKENvbnN0YW50cy5sb2dpblJlcXVlc3QsIFwiXCIsIC0xKTtcbiAgICAgICAgdGhpcy5zZXRJdGVtQ29va2llKENvbnN0YW50cy5zdGF0ZUFjcXVpcmVUb2tlbiwgXCJcIiwgLTEpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhY3F1aXJlVG9rZW5BY2NvdW50S2V5IHRvIGNhY2hlIGFjY291bnQgb2JqZWN0XG4gICAgICogQHBhcmFtIGFjY291bnRJZFxuICAgICAqIEBwYXJhbSBzdGF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBnZW5lcmF0ZUFjcXVpcmVUb2tlbkFjY291bnRLZXkoYWNjb3VudElkOiBhbnksIHN0YXRlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gQ2FjaGVLZXlzLkFDUVVJUkVfVE9LRU5fVVNFUiArIENvbnN0YW50cy5yZXNvdXJjZURlbGltaXRlciArXG4gICAgICAgICAgICBgJHthY2NvdW50SWR9YCArIENvbnN0YW50cy5yZXNvdXJjZURlbGltaXRlciAgKyBgJHtzdGF0ZX1gO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhdXRob3JpdHlLZXkgdG8gY2FjaGUgYXV0aG9yaXR5XG4gICAgICogQHBhcmFtIHN0YXRlXG4gICAgICovXG4gICAgc3RhdGljIGdlbmVyYXRlQXV0aG9yaXR5S2V5KHN0YXRlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gQ2FjaGVLZXlzLkFVVEhPUklUWSArIENvbnN0YW50cy5yZXNvdXJjZURlbGltaXRlciArIGAke3N0YXRlfWA7XG4gICAgfVxufVxuIiwiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG5cbmltcG9ydCB7IEFjY2Vzc1Rva2VuS2V5IH0gZnJvbSBcIi4vQWNjZXNzVG9rZW5LZXlcIjtcbmltcG9ydCB7IEFjY2Vzc1Rva2VuVmFsdWUgfSBmcm9tIFwiLi9BY2Nlc3NUb2tlblZhbHVlXCI7XG5cbi8qKlxuICogQGhpZGRlblxuICovXG5leHBvcnQgY2xhc3MgQWNjZXNzVG9rZW5DYWNoZUl0ZW0ge1xuXG4gIGtleTogQWNjZXNzVG9rZW5LZXk7XG4gIHZhbHVlOiBBY2Nlc3NUb2tlblZhbHVlO1xuXG4gIGNvbnN0cnVjdG9yKGtleTogQWNjZXNzVG9rZW5LZXksIHZhbHVlOiBBY2Nlc3NUb2tlblZhbHVlKSB7XG4gICAgdGhpcy5rZXkgPSBrZXk7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICB9XG59XG4iLCIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cblxuLyoqXG4gKiBAaGlkZGVuXG4gKi9cbmltcG9ydCB7IFV0aWxzIH0gZnJvbSBcIi4vVXRpbHNcIjtcbmltcG9ydCB7IEFhZEF1dGhvcml0eSB9IGZyb20gXCIuL0FhZEF1dGhvcml0eVwiO1xuaW1wb3J0IHsgQjJjQXV0aG9yaXR5IH0gZnJvbSBcIi4vQjJjQXV0aG9yaXR5XCI7XG5pbXBvcnQgeyBBdXRob3JpdHksIEF1dGhvcml0eVR5cGUgfSBmcm9tIFwiLi9BdXRob3JpdHlcIjtcbmltcG9ydCB7IENsaWVudENvbmZpZ3VyYXRpb25FcnJvck1lc3NhZ2UgfSBmcm9tIFwiLi9lcnJvci9DbGllbnRDb25maWd1cmF0aW9uRXJyb3JcIjtcblxuZXhwb3J0IGNsYXNzIEF1dGhvcml0eUZhY3Rvcnkge1xuICAgIC8qKlxuICAgICogUGFyc2UgdGhlIHVybCBhbmQgZGV0ZXJtaW5lIHRoZSB0eXBlIG9mIGF1dGhvcml0eVxuICAgICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgRGV0ZWN0QXV0aG9yaXR5RnJvbVVybChhdXRob3JpdHlVcmw6IHN0cmluZyk6IEF1dGhvcml0eVR5cGUge1xuICAgICAgICBhdXRob3JpdHlVcmwgPSBVdGlscy5DYW5vbmljYWxpemVVcmkoYXV0aG9yaXR5VXJsKTtcbiAgICAgICAgY29uc3QgY29tcG9uZW50cyA9IFV0aWxzLkdldFVybENvbXBvbmVudHMoYXV0aG9yaXR5VXJsKTtcbiAgICAgICAgY29uc3QgcGF0aFNlZ21lbnRzID0gY29tcG9uZW50cy5QYXRoU2VnbWVudHM7XG4gICAgICAgIHN3aXRjaCAocGF0aFNlZ21lbnRzWzBdKSB7XG4gICAgICAgICAgICBjYXNlIFwidGZwXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhvcml0eVR5cGUuQjJDO1xuICAgICAgICAgICAgY2FzZSBcImFkZnNcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aG9yaXR5VHlwZS5BZGZzO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aG9yaXR5VHlwZS5BYWQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAqIENyZWF0ZSBhbiBhdXRob3JpdHkgb2JqZWN0IG9mIHRoZSBjb3JyZWN0IHR5cGUgYmFzZWQgb24gdGhlIHVybFxuICAgICogUGVyZm9ybXMgYmFzaWMgYXV0aG9yaXR5IHZhbGlkYXRpb24gLSBjaGVja3MgdG8gc2VlIGlmIHRoZSBhdXRob3JpdHkgaXMgb2YgYSB2YWxpZCB0eXBlIChlZyBhYWQsIGIyYylcbiAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgQ3JlYXRlSW5zdGFuY2UoYXV0aG9yaXR5VXJsOiBzdHJpbmcsIHZhbGlkYXRlQXV0aG9yaXR5OiBib29sZWFuKTogQXV0aG9yaXR5IHtcbiAgICAgICAgaWYgKFV0aWxzLmlzRW1wdHkoYXV0aG9yaXR5VXJsKSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdHlwZSA9IEF1dGhvcml0eUZhY3RvcnkuRGV0ZWN0QXV0aG9yaXR5RnJvbVVybChhdXRob3JpdHlVcmwpO1xuICAgICAgICAvLyBEZXBlbmRpbmcgb24gYWJvdmUgZGV0ZWN0aW9uLCBjcmVhdGUgdGhlIHJpZ2h0IHR5cGUuXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSBBdXRob3JpdHlUeXBlLkIyQzpcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEIyY0F1dGhvcml0eShhdXRob3JpdHlVcmwsIHZhbGlkYXRlQXV0aG9yaXR5KTtcbiAgICAgICAgICAgIGNhc2UgQXV0aG9yaXR5VHlwZS5BYWQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBBYWRBdXRob3JpdHkoYXV0aG9yaXR5VXJsLCB2YWxpZGF0ZUF1dGhvcml0eSk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IENsaWVudENvbmZpZ3VyYXRpb25FcnJvck1lc3NhZ2UuaW52YWxpZEF1dGhvcml0eVR5cGU7XG4gICAgICAgIH1cbiAgICB9XG5cbn1cbiIsIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuXG5pbXBvcnQgeyBBYWRBdXRob3JpdHkgfSBmcm9tIFwiLi9BYWRBdXRob3JpdHlcIjtcbmltcG9ydCB7IEF1dGhvcml0eSwgQXV0aG9yaXR5VHlwZSB9IGZyb20gXCIuL0F1dGhvcml0eVwiO1xuaW1wb3J0IHsgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yTWVzc2FnZSB9IGZyb20gXCIuL2Vycm9yL0NsaWVudENvbmZpZ3VyYXRpb25FcnJvclwiO1xuaW1wb3J0IHsgVXRpbHMgfSBmcm9tIFwiLi9VdGlsc1wiO1xuXG4vKipcbiAqIEBoaWRkZW5cbiAqL1xuZXhwb3J0IGNsYXNzIEIyY0F1dGhvcml0eSBleHRlbmRzIEFhZEF1dGhvcml0eSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihhdXRob3JpdHk6IHN0cmluZywgdmFsaWRhdGVBdXRob3JpdHk6IGJvb2xlYW4pIHtcbiAgICBzdXBlcihhdXRob3JpdHksIHZhbGlkYXRlQXV0aG9yaXR5KTtcbiAgICBjb25zdCB1cmxDb21wb25lbnRzID0gVXRpbHMuR2V0VXJsQ29tcG9uZW50cyhhdXRob3JpdHkpO1xuXG4gICAgY29uc3QgcGF0aFNlZ21lbnRzID0gdXJsQ29tcG9uZW50cy5QYXRoU2VnbWVudHM7XG4gICAgaWYgKHBhdGhTZWdtZW50cy5sZW5ndGggPCAzKSB7XG4gICAgICAgIHRocm93IENsaWVudENvbmZpZ3VyYXRpb25FcnJvck1lc3NhZ2UuYjJjQXV0aG9yaXR5VXJpSW52YWxpZFBhdGg7XG4gICAgfVxuXG4gICAgdGhpcy5DYW5vbmljYWxBdXRob3JpdHkgPSBgaHR0cHM6Ly8ke3VybENvbXBvbmVudHMuSG9zdE5hbWVBbmRQb3J0fS8ke3BhdGhTZWdtZW50c1swXX0vJHtwYXRoU2VnbWVudHNbMV19LyR7cGF0aFNlZ21lbnRzWzJdfS9gO1xuICB9XG5cbiAgcHVibGljIGdldCBBdXRob3JpdHlUeXBlKCk6IEF1dGhvcml0eVR5cGUge1xuICAgIHJldHVybiBBdXRob3JpdHlUeXBlLkIyQztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcHJvbWlzZSB3aXRoIHRoZSBUZW5hbnREaXNjb3ZlcnlFbmRwb2ludFxuICAgKi9cbiAgcHVibGljIEdldE9wZW5JZENvbmZpZ3VyYXRpb25FbmRwb2ludEFzeW5jKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVzdWx0UHJvbWlzZSA9IG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICAgIHJlc29sdmUodGhpcy5EZWZhdWx0T3BlbklkQ29uZmlndXJhdGlvbkVuZHBvaW50KSk7XG5cbiAgICBpZiAoIXRoaXMuSXNWYWxpZGF0aW9uRW5hYmxlZCkge1xuICAgICAgcmV0dXJuIHJlc3VsdFByb21pc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuSXNJblRydXN0ZWRIb3N0TGlzdCh0aGlzLkNhbm9uaWNhbEF1dGhvcml0eVVybENvbXBvbmVudHMuSG9zdE5hbWVBbmRQb3J0KSkge1xuICAgICAgcmV0dXJuIHJlc3VsdFByb21pc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICAgIHJlamVjdChDbGllbnRDb25maWd1cmF0aW9uRXJyb3JNZXNzYWdlLnVuc3VwcG9ydGVkQXV0aG9yaXR5VmFsaWRhdGlvbikpO1xuICB9XG59XG4iLCIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cblxuaW1wb3J0IHsgQWNjb3VudCB9IGZyb20gXCIuL0FjY291bnRcIjtcblxuLyoqXG4gKiBLZXktVmFsdWUgdHlwZSB0byBzdXBwb3J0IHF1ZXJ5UGFyYW1zIGFuZCBleHRyYVF1ZXJ5UGFyYW1zXG4gKi9cbmV4cG9ydCB0eXBlIFFQRGljdCA9IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9O1xuXG5cbmV4cG9ydCB0eXBlIEF1dGhlbnRpY2F0aW9uUGFyYW1ldGVycyA9IHtcbiAgICBzY29wZXM/OiBBcnJheTxzdHJpbmc+O1xuICAgIGV4dHJhU2NvcGVzVG9Db25zZW50PzogQXJyYXk8c3RyaW5nPjtcbiAgICBwcm9tcHQ/OiBzdHJpbmc7XG4gICAgZXh0cmFRdWVyeVBhcmFtZXRlcnM/OiBRUERpY3Q7XG4gICAgY2xhaW1zUmVxdWVzdD86IG51bGw7XG4gICAgYXV0aG9yaXR5Pzogc3RyaW5nO1xuICAgIGNvcnJlbGF0aW9uSWQ/OiBzdHJpbmc7XG4gICAgYWNjb3VudD86IEFjY291bnQ7XG4gICAgc2lkPzogc3RyaW5nO1xuICAgIGxvZ2luSGludD86IHN0cmluZztcbn07XG4iLCIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cblxuaW1wb3J0IHsgQWNjb3VudCB9IGZyb20gXCIuL0FjY291bnRcIjtcbmltcG9ydCB7IElkVG9rZW4gfSBmcm9tIFwiLi9JZFRva2VuXCI7XG5cbi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuXG5leHBvcnQgdHlwZSBBdXRoUmVzcG9uc2UgPSB7XG4gICAgdW5pcXVlSWQ6IHN0cmluZztcbiAgICB0ZW5hbnRJZDogc3RyaW5nO1xuICAgIHRva2VuVHlwZTogc3RyaW5nO1xuICAgIGlkVG9rZW46IElkVG9rZW47XG4gICAgYWNjZXNzVG9rZW46IHN0cmluZztcbiAgICBzY29wZXM6IEFycmF5PHN0cmluZz47XG4gICAgZXhwaXJlc09uOiBEYXRlO1xuICAgIGFjY291bnQ6IEFjY291bnQ7XG4gICAgYWNjb3VudFN0YXRlOiBzdHJpbmc7XG59O1xuIl0sInNvdXJjZVJvb3QiOiIifQ==