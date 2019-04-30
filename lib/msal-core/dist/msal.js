/*! @azure/msal v1.0.0-preview.4 2019-04-24 */
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
var ClientAuthError_1 = __webpack_require__(3);
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
            throw ClientAuthError_1.ClientAuthError.createTokenEncodingError(base64IdToken);
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
        url = url.toLowerCase();
        var urlObject = this.GetUrlComponents(url);
        var pathArray = urlObject.PathSegments;
        if (tenantId && (pathArray.length !== 0 && (pathArray[0] === Constants_1.Constants.common || pathArray[0] === Constants_1.SSOTypes.ORGANIZATIONS))) {
            pathArray[0] = tenantId;
        }
        return this.constructAuthorityUriFromObject(urlObject, pathArray);
    };
    Utils.constructAuthorityUriFromObject = function (urlObject, pathArray) {
        return this.CanonicalizeUri(urlObject.Protocol + "//" + urlObject.HostNameAndPort + "/" + pathArray.join("/"));
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

Object.defineProperty(exports, "__esModule", { value: true });
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
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
    version: "1.0.0-preview.4"
};


/***/ }),
/* 3 */
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
        desc: "Invalid ID token format."
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
    },
    clientInfoDecodingError: {
        code: "client_info_decoding_error",
        desc: "The client info could not be parsed/decoded correctly. Please review the trace to determine the root cause."
    },
    nullOrEmptyIdToken: {
        code: "null_or_empty_id_token",
        desc: "The idToken is null or empty. Please review the trace to determine the root cause."
    },
    idTokenNotParsed: {
        code: "id_token_parsing_error",
        desc: "ID token cannot be parsed. Please review stack trace to determine root cause."
    },
    tokenEncodingError: {
        code: "token_encoding_error",
        desc: "The token to be decoded is not encoded correctly."
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
    ClientAuthError.createClientInfoDecodingError = function (caughtError) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.clientInfoDecodingError.code, exports.ClientAuthErrorMessage.clientInfoDecodingError.desc + " Failed with error: " + caughtError);
    };
    ClientAuthError.createIdTokenNullOrEmptyError = function (invalidRawTokenString) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.nullOrEmptyIdToken.code, exports.ClientAuthErrorMessage.nullOrEmptyIdToken.desc + " Raw ID Token Value: " + invalidRawTokenString);
    };
    ClientAuthError.createIdTokenParsingError = function (caughtParsingError) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.idTokenNotParsed.code, exports.ClientAuthErrorMessage.idTokenNotParsed.desc + " Failed with error: " + caughtParsingError);
    };
    ClientAuthError.createTokenEncodingError = function (incorrectlyEncodedToken) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.tokenEncodingError.code, exports.ClientAuthErrorMessage.tokenEncodingError.desc + " Attempted to decode: " + incorrectlyEncodedToken);
    };
    return ClientAuthError;
}(AuthError_1.AuthError));
exports.ClientAuthError = ClientAuthError;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var Constants_1 = __webpack_require__(2);
var ClientAuthError_1 = __webpack_require__(3);
exports.ClientConfigurationErrorMessage = {
    configurationNotSet: {
        code: "no_config_set",
        desc: "Configuration has not been set. Please call the UserAgentApplication constructor with a valid Configuration object."
    },
    invalidCacheLocation: {
        code: "invalid_cache_location",
        desc: "The cache location provided is not valid."
    },
    noStorageSupported: {
        code: "browser_storage_not_supported",
        desc: "localStorage and sessionStorage are not supported."
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
    ClientConfigurationError.createNoSetConfigurationError = function () {
        return new ClientConfigurationError(exports.ClientConfigurationErrorMessage.configurationNotSet.code, "" + exports.ClientConfigurationErrorMessage.configurationNotSet.desc);
    };
    ClientConfigurationError.createInvalidCacheLocationConfigError = function (givenCacheLocation) {
        return new ClientConfigurationError(exports.ClientConfigurationErrorMessage.invalidCacheLocation.code, exports.ClientConfigurationErrorMessage.invalidCacheLocation.desc + " Provided value: " + givenCacheLocation + ". Possible values are: " + Constants_1.Constants.cacheLocationLocal + ", " + Constants_1.Constants.cacheLocationSession + ".");
    };
    ClientConfigurationError.createNoStorageSupportedError = function () {
        return new ClientConfigurationError(exports.ClientConfigurationErrorMessage.noStorageSupported.code, exports.ClientConfigurationErrorMessage.noStorageSupported.desc);
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
var Utils_1 = __webpack_require__(0);
var ClientConfigurationError_1 = __webpack_require__(4);
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
var ClientConfigurationError_1 = __webpack_require__(4);
var AuthError_1 = __webpack_require__(5);
var ClientAuthError_1 = __webpack_require__(3);
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
            _this.logger.info(ClientAuthError_1.ClientAuthErrorMessage.endpointResolutionError.code + ":" + ClientAuthError_1.ClientAuthErrorMessage.endpointResolutionError.desc);
            _this.cacheStorage.setItem(Constants_1.Constants.msalError, ClientAuthError_1.ClientAuthErrorMessage.endpointResolutionError.code);
            _this.cacheStorage.setItem(Constants_1.Constants.msalErrorDescription, ClientAuthError_1.ClientAuthErrorMessage.endpointResolutionError.desc);
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
                _this.logger.info(ClientAuthError_1.ClientAuthErrorMessage.endpointResolutionError.code + ":" + ClientAuthError_1.ClientAuthErrorMessage.endpointResolutionError.desc);
                _this.cacheStorage.setItem(Constants_1.Constants.msalError, ClientAuthError_1.ClientAuthErrorMessage.endpointResolutionError.code);
                _this.cacheStorage.setItem(Constants_1.Constants.msalErrorDescription, ClientAuthError_1.ClientAuthErrorMessage.endpointResolutionError.desc);
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
            this.logger.info(ClientAuthError_1.ClientAuthErrorMessage.popUpWindowError.code + ":" + ClientAuthError_1.ClientAuthErrorMessage.popUpWindowError.desc);
            this.cacheStorage.setItem(Constants_1.Constants.msalError, ClientAuthError_1.ClientAuthErrorMessage.popUpWindowError.code);
            this.cacheStorage.setItem(Constants_1.Constants.msalErrorDescription, ClientAuthError_1.ClientAuthErrorMessage.popUpWindowError.desc);
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
                    _this.broadcast("msal:popUpClosed", ClientAuthError_1.ClientAuthErrorMessage.userCancelledError.code + Constants_1.Constants.resourceDelimiter + ClientAuthError_1.ClientAuthErrorMessage.userCancelledError.desc);
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
                if (Utils_1.Utils.containsScope(cachedScopes, scopes) && Utils_1.Utils.CanonicalizeUri(cacheItem.key.authority) === serverAuthenticationRequest.authority) {
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
                    scopes: accessTokenCacheItem.key.scopes.split(" "),
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
    /**
     * Used to get the current configuration of MSAL.js
     */
    UserAgentApplication.prototype.getCurrentConfiguration = function () {
        if (!this.config) {
            throw ClientConfigurationError_1.ClientConfigurationError.createNoSetConfigurationError();
        }
        return this.config;
    };
    //#endregion
    //#region String Util (Should be extracted to Utils.ts)
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
        this.cacheStorage.setItem(authorityKey, Utils_1.Utils.CanonicalizeUri(authority), this.inCookie);
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
var Authority_1 = __webpack_require__(6);
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
var Authority_1 = __webpack_require__(6);
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
var ClientAuthError_1 = __webpack_require__(3);
exports.ClientAuthError = ClientAuthError_1.ClientAuthError;
var ServerError_1 = __webpack_require__(8);
exports.ServerError = ServerError_1.ServerError;
var ClientConfigurationError_1 = __webpack_require__(4);
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
        this.authority = Utils_1.Utils.CanonicalizeUri(authority);
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
var ClientAuthError_1 = __webpack_require__(3);
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
            throw ClientAuthError_1.ClientAuthError.createClientInfoDecodingError(e);
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
var ClientAuthError_1 = __webpack_require__(3);
/**
 * @hidden
 */
var IdToken = /** @class */ (function () {
    /* tslint:disable:no-string-literal */
    function IdToken(rawIdToken) {
        if (Utils_1.Utils.isEmpty(rawIdToken)) {
            throw ClientAuthError_1.ClientAuthError.createIdTokenNullOrEmptyError(rawIdToken);
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
            throw ClientAuthError_1.ClientAuthError.createIdTokenParsingError(e);
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
var ClientConfigurationError_1 = __webpack_require__(4);
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
            throw ClientConfigurationError_1.ClientConfigurationError.createNoStorageSupportedError();
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
            var expireTime = this.getCookieExpirationTime(expires);
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
    Storage.prototype.getCookieExpirationTime = function (cookieLifeDays) {
        var today = new Date();
        var expr = new Date(today.getTime() + cookieLifeDays * 24 * 60 * 60 * 1000);
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
var Authority_1 = __webpack_require__(6);
var ClientConfigurationError_1 = __webpack_require__(4);
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
var Authority_1 = __webpack_require__(6);
var ClientConfigurationError_1 = __webpack_require__(4);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9Nc2FsL3dlYnBhY2svdW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbiIsIndlYnBhY2s6Ly9Nc2FsL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL01zYWwvLi9zcmMvVXRpbHMudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL25vZGVfbW9kdWxlcy90c2xpYi90c2xpYi5lczYuanMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9Db25zdGFudHMudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9lcnJvci9DbGllbnRBdXRoRXJyb3IudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9lcnJvci9DbGllbnRDb25maWd1cmF0aW9uRXJyb3IudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9lcnJvci9BdXRoRXJyb3IudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9BdXRob3JpdHkudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9Mb2dnZXIudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9lcnJvci9TZXJ2ZXJFcnJvci50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL1VzZXJBZ2VudEFwcGxpY2F0aW9uLnRzIiwid2VicGFjazovL01zYWwvLi9zcmMvQWNjb3VudC50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL0FhZEF1dGhvcml0eS50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL1hIUkNsaWVudC50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL0NvbmZpZ3VyYXRpb24udHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9lcnJvci9JbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yLnRzIiwid2VicGFjazovL01zYWwvLi9zcmMvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9BY2Nlc3NUb2tlbktleS50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL0FjY2Vzc1Rva2VuVmFsdWUudHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9TZXJ2ZXJSZXF1ZXN0UGFyYW1ldGVycy50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL0NsaWVudEluZm8udHMiLCJ3ZWJwYWNrOi8vTXNhbC8uL3NyYy9JZFRva2VuLnRzIiwid2VicGFjazovL01zYWwvLi9zcmMvU3RvcmFnZS50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL0FjY2Vzc1Rva2VuQ2FjaGVJdGVtLnRzIiwid2VicGFjazovL01zYWwvLi9zcmMvQXV0aG9yaXR5RmFjdG9yeS50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL0IyY0F1dGhvcml0eS50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL0F1dGhlbnRpY2F0aW9uUGFyYW1ldGVycy50cyIsIndlYnBhY2s6Ly9Nc2FsLy4vc3JjL0F1dGhSZXNwb25zZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxPO0FDVkE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxrREFBMEMsZ0NBQWdDO0FBQzFFO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0VBQXdELGtCQUFrQjtBQUMxRTtBQUNBLHlEQUFpRCxjQUFjO0FBQy9EOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpREFBeUMsaUNBQWlDO0FBQzFFLHdIQUFnSCxtQkFBbUIsRUFBRTtBQUNySTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOzs7QUFHQTtBQUNB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RSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQUMsU0FBUztvQkFDakQsS0FBSyxDQUFDO3dCQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO3dCQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7d0JBQUMsU0FBUztvQkFDakQ7d0JBQ0ksSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTs0QkFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDOzRCQUFDLFNBQVM7eUJBQUU7d0JBQzVHLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTs0QkFBRSxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFBQyxNQUFNO3lCQUFFO3dCQUN0RixJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7NEJBQUUsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQzs0QkFBQyxNQUFNO3lCQUFFO3dCQUNyRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsS0FB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LE9BQU8sRUFBRSxVQUFVLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDOUQsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEdBQUcsY0FBYyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDdEgsU0FBUyxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxSSxTQUFTLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUk7UUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FBRTtJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUFFLENBQUMsQ0FBQztJQUNsRixTQUFTLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssWUFBWSxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMs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a0MsQ0FBQztRQUFoRCxDQUFnRCxDQUFDLENBQUM7UUFFcEQsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtZQUM3QixPQUFPLGFBQWEsQ0FBQztTQUN0QjtRQUVELElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxlQUFlLENBQUMsRUFBRTtZQUNsRixPQUFPLGFBQWEsQ0FBQztTQUN0QjtRQUVELE9BQU8sSUFBSSxPQUFPLENBQVMsVUFBQyxPQUFPLEVBQUUsTUFBTTtZQUN6QyxhQUFNLENBQUMsMERBQStCLENBQUMsOEJBQThCLENBQUM7UUFBdEUsQ0FBc0UsQ0FBQyxDQUFDO0lBQzVFLENBQUM7SUFDSCxtQkFBQztBQUFELENBQUMsQ0FuQ2lDLDJCQUFZLEdBbUM3QztBQW5DWSxvQ0FBWTs7Ozs7Ozs7O0FDWHpCLDREQUE0RDtBQUM1RCxrQ0FBa0M7Ozs7Ozs7Ozs7QUNEbEMsNERBQTREO0FBQzVELGtDQUFrQyIsImZpbGUiOiJtc2FsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIHdlYnBhY2tVbml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKVxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHRlbHNlIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcblx0XHRkZWZpbmUoXCJNc2FsXCIsIFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcIk1zYWxcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wiTXNhbFwiXSA9IGZhY3RvcnkoKTtcbn0pKHdpbmRvdywgZnVuY3Rpb24oKSB7XG5yZXR1cm4gIiwiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IDE1KTtcbiIsIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuXG5pbXBvcnQgeyBJVXJpIH0gZnJvbSBcIi4vSVVyaVwiO1xuaW1wb3J0IHsgQWNjb3VudCB9IGZyb20gXCIuL0FjY291bnRcIjtcbmltcG9ydCB7Q29uc3RhbnRzLCBTU09UeXBlcywgUHJvbXB0U3RhdGV9IGZyb20gXCIuL0NvbnN0YW50c1wiO1xuaW1wb3J0IHsgQXV0aGVudGljYXRpb25QYXJhbWV0ZXJzLCBRUERpY3QgfSBmcm9tIFwiLi9BdXRoZW50aWNhdGlvblBhcmFtZXRlcnNcIjtcbmltcG9ydCB7IEF1dGhSZXNwb25zZSB9IGZyb20gXCIuL0F1dGhSZXNwb25zZVwiO1xuaW1wb3J0IHsgSWRUb2tlbiB9IGZyb20gXCIuL0lkVG9rZW5cIjtcbmltcG9ydCB7IENsaWVudEF1dGhFcnJvciB9IGZyb20gXCIuL2Vycm9yL0NsaWVudEF1dGhFcnJvclwiO1xuXG5pbXBvcnQgeyBMaWJyYXJ5IH0gZnJvbSBcIi4vQ29uc3RhbnRzXCI7XG5cbi8qKlxuICogQGhpZGRlblxuICovXG5leHBvcnQgY2xhc3MgVXRpbHMge1xuXG4gIC8vI3JlZ2lvbiBHZW5lcmFsIFV0aWxcblxuICAvKipcbiAgICogVXRpbHMgZnVuY3Rpb24gdG8gY29tcGFyZSB0d28gQWNjb3VudCBvYmplY3RzIC0gdXNlZCB0byBjaGVjayBpZiB0aGUgc2FtZSB1c2VyIGFjY291bnQgaXMgbG9nZ2VkIGluXG4gICAqXG4gICAqIEBwYXJhbSBhMTogQWNjb3VudCBvYmplY3RcbiAgICogQHBhcmFtIGEyOiBBY2NvdW50IG9iamVjdFxuICAgKi9cbiAgc3RhdGljIGNvbXBhcmVBY2NvdW50cyhhMTogQWNjb3VudCwgYTI6IEFjY291bnQpOiBib29sZWFuIHtcbiAgIGlmICghYTEgfHwgIWEyKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIGlmIChhMS5ob21lQWNjb3VudElkZW50aWZpZXIgJiYgYTIuaG9tZUFjY291bnRJZGVudGlmaWVyKSB7XG4gICAgICBpZiAoYTEuaG9tZUFjY291bnRJZGVudGlmaWVyID09PSBhMi5ob21lQWNjb3VudElkZW50aWZpZXIpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWNpbWFsIHRvIEhleFxuICAgKlxuICAgKiBAcGFyYW0gbnVtXG4gICAqL1xuICBzdGF0aWMgZGVjaW1hbFRvSGV4KG51bTogbnVtYmVyKTogc3RyaW5nIHtcbiAgICB2YXIgaGV4OiBzdHJpbmcgPSBudW0udG9TdHJpbmcoMTYpO1xuICAgIHdoaWxlIChoZXgubGVuZ3RoIDwgMikge1xuICAgICAgaGV4ID0gXCIwXCIgKyBoZXg7XG4gICAgfVxuICAgIHJldHVybiBoZXg7XG4gIH1cblxuICAvKipcbiAgICogTVNBTCBKUyBMaWJyYXJ5IFZlcnNpb25cbiAgICovXG4gIHN0YXRpYyBnZXRMaWJyYXJ5VmVyc2lvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiBMaWJyYXJ5LnZlcnNpb247XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyByYW5kb20gR1VJRCAtIHVzZWQgdG8gcG9wdWxhdGUgc3RhdGU/XG4gICAqIEByZXR1cm5zIHN0cmluZyAoR1VJRClcbiAgICovXG4gIHN0YXRpYyBjcmVhdGVOZXdHdWlkKCk6IHN0cmluZyB7XG4gICAgLy8gUkZDNDEyMjogVGhlIHZlcnNpb24gNCBVVUlEIGlzIG1lYW50IGZvciBnZW5lcmF0aW5nIFVVSURzIGZyb20gdHJ1bHktcmFuZG9tIG9yXG4gICAgLy8gcHNldWRvLXJhbmRvbSBudW1iZXJzLlxuICAgIC8vIFRoZSBhbGdvcml0aG0gaXMgYXMgZm9sbG93czpcbiAgICAvLyAgICAgU2V0IHRoZSB0d28gbW9zdCBzaWduaWZpY2FudCBiaXRzIChiaXRzIDYgYW5kIDcpIG9mIHRoZVxuICAgIC8vICAgICAgICBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkIHRvIHplcm8gYW5kIG9uZSwgcmVzcGVjdGl2ZWx5LlxuICAgIC8vICAgICBTZXQgdGhlIGZvdXIgbW9zdCBzaWduaWZpY2FudCBiaXRzIChiaXRzIDEyIHRocm91Z2ggMTUpIG9mIHRoZVxuICAgIC8vICAgICAgICB0aW1lX2hpX2FuZF92ZXJzaW9uIGZpZWxkIHRvIHRoZSA0LWJpdCB2ZXJzaW9uIG51bWJlciBmcm9tXG4gICAgLy8gICAgICAgIFNlY3Rpb24gNC4xLjMuIFZlcnNpb240XG4gICAgLy8gICAgIFNldCBhbGwgdGhlIG90aGVyIGJpdHMgdG8gcmFuZG9tbHkgKG9yIHBzZXVkby1yYW5kb21seSkgY2hvc2VuXG4gICAgLy8gICAgIHZhbHVlcy5cbiAgICAvLyBVVUlEICAgICAgICAgICAgICAgICAgID0gdGltZS1sb3cgXCItXCIgdGltZS1taWQgXCItXCJ0aW1lLWhpZ2gtYW5kLXZlcnNpb24gXCItXCJjbG9jay1zZXEtcmVzZXJ2ZWQgYW5kIGxvdygyaGV4T2N0ZXQpXCItXCIgbm9kZVxuICAgIC8vIHRpbWUtbG93ICAgICAgICAgICAgICAgPSA0aGV4T2N0ZXRcbiAgICAvLyB0aW1lLW1pZCAgICAgICAgICAgICAgID0gMmhleE9jdGV0XG4gICAgLy8gdGltZS1oaWdoLWFuZC12ZXJzaW9uICA9IDJoZXhPY3RldFxuICAgIC8vIGNsb2NrLXNlcS1hbmQtcmVzZXJ2ZWQgPSBoZXhPY3RldDpcbiAgICAvLyBjbG9jay1zZXEtbG93ICAgICAgICAgID0gaGV4T2N0ZXRcbiAgICAvLyBub2RlICAgICAgICAgICAgICAgICAgID0gNmhleE9jdGV0XG4gICAgLy8gRm9ybWF0OiB4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHhcbiAgICAvLyB5IGNvdWxkIGJlIDEwMDAsIDEwMDEsIDEwMTAsIDEwMTEgc2luY2UgbW9zdCBzaWduaWZpY2FudCB0d28gYml0cyBuZWVkcyB0byBiZSAxMFxuICAgIC8vIHkgdmFsdWVzIGFyZSA4LCA5LCBBLCBCXG5cbiAgICBjb25zdCBjcnlwdG9PYmo6IENyeXB0byA9IHdpbmRvdy5jcnlwdG87IC8vIGZvciBJRSAxMVxuICAgIGlmIChjcnlwdG9PYmogJiYgY3J5cHRvT2JqLmdldFJhbmRvbVZhbHVlcykge1xuICAgICAgY29uc3QgYnVmZmVyOiBVaW50OEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoMTYpO1xuICAgICAgY3J5cHRvT2JqLmdldFJhbmRvbVZhbHVlcyhidWZmZXIpO1xuXG4gICAgICAvL2J1ZmZlcls2XSBhbmQgYnVmZmVyWzddIHJlcHJlc2VudHMgdGhlIHRpbWVfaGlfYW5kX3ZlcnNpb24gZmllbGQuIFdlIHdpbGwgc2V0IHRoZSBmb3VyIG1vc3Qgc2lnbmlmaWNhbnQgYml0cyAoNCB0aHJvdWdoIDcpIG9mIGJ1ZmZlcls2XSB0byByZXByZXNlbnQgZGVjaW1hbCBudW1iZXIgNCAoVVVJRCB2ZXJzaW9uIG51bWJlcikuXG4gICAgICBidWZmZXJbNl0gfD0gMHg0MDsgLy9idWZmZXJbNl0gfCAwMTAwMDAwMCB3aWxsIHNldCB0aGUgNiBiaXQgdG8gMS5cbiAgICAgIGJ1ZmZlcls2XSAmPSAweDRmOyAvL2J1ZmZlcls2XSAmIDAxMDAxMTExIHdpbGwgc2V0IHRoZSA0LCA1LCBhbmQgNyBiaXQgdG8gMCBzdWNoIHRoYXQgYml0cyA0LTcgPT0gMDEwMCA9IFwiNFwiLlxuXG4gICAgICAvL2J1ZmZlcls4XSByZXByZXNlbnRzIHRoZSBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkIGZpZWxkLiBXZSB3aWxsIHNldCB0aGUgdHdvIG1vc3Qgc2lnbmlmaWNhbnQgYml0cyAoNiBhbmQgNykgb2YgdGhlIGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWQgdG8gemVybyBhbmQgb25lLCByZXNwZWN0aXZlbHkuXG4gICAgICBidWZmZXJbOF0gfD0gMHg4MDsgLy9idWZmZXJbOF0gfCAxMDAwMDAwMCB3aWxsIHNldCB0aGUgNyBiaXQgdG8gMS5cbiAgICAgIGJ1ZmZlcls4XSAmPSAweGJmOyAvL2J1ZmZlcls4XSAmIDEwMTExMTExIHdpbGwgc2V0IHRoZSA2IGJpdCB0byAwLlxuXG4gICAgICByZXR1cm4gVXRpbHMuZGVjaW1hbFRvSGV4KGJ1ZmZlclswXSkgKyBVdGlscy5kZWNpbWFsVG9IZXgoYnVmZmVyWzFdKVxuICAgICAgICArIFV0aWxzLmRlY2ltYWxUb0hleChidWZmZXJbMl0pICsgVXRpbHMuZGVjaW1hbFRvSGV4KGJ1ZmZlclszXSlcbiAgICAgICAgKyBcIi1cIiArIFV0aWxzLmRlY2ltYWxUb0hleChidWZmZXJbNF0pICsgVXRpbHMuZGVjaW1hbFRvSGV4KGJ1ZmZlcls1XSlcbiAgICAgICAgKyBcIi1cIiArIFV0aWxzLmRlY2ltYWxUb0hleChidWZmZXJbNl0pICsgVXRpbHMuZGVjaW1hbFRvSGV4KGJ1ZmZlcls3XSlcbiAgICAgICAgKyBcIi1cIiArIFV0aWxzLmRlY2ltYWxUb0hleChidWZmZXJbOF0pICsgVXRpbHMuZGVjaW1hbFRvSGV4KGJ1ZmZlcls5XSlcbiAgICAgICAgKyBcIi1cIiArIFV0aWxzLmRlY2ltYWxUb0hleChidWZmZXJbMTBdKSArIFV0aWxzLmRlY2ltYWxUb0hleChidWZmZXJbMTFdKVxuICAgICAgICArIFV0aWxzLmRlY2ltYWxUb0hleChidWZmZXJbMTJdKSArIFV0aWxzLmRlY2ltYWxUb0hleChidWZmZXJbMTNdKVxuICAgICAgICArIFV0aWxzLmRlY2ltYWxUb0hleChidWZmZXJbMTRdKSArIFV0aWxzLmRlY2ltYWxUb0hleChidWZmZXJbMTVdKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb25zdCBndWlkSG9sZGVyOiBzdHJpbmcgPSBcInh4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eFwiO1xuICAgICAgY29uc3QgaGV4OiBzdHJpbmcgPSBcIjAxMjM0NTY3ODlhYmNkZWZcIjtcbiAgICAgIGxldCByOiBudW1iZXIgPSAwO1xuICAgICAgbGV0IGd1aWRSZXNwb25zZTogc3RyaW5nID0gXCJcIjtcbiAgICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCAzNjsgaSsrKSB7XG4gICAgICAgIGlmIChndWlkSG9sZGVyW2ldICE9PSBcIi1cIiAmJiBndWlkSG9sZGVyW2ldICE9PSBcIjRcIikge1xuICAgICAgICAgIC8vIGVhY2ggeCBhbmQgeSBuZWVkcyB0byBiZSByYW5kb21cbiAgICAgICAgICByID0gTWF0aC5yYW5kb20oKSAgKiAxNiB8IDA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGd1aWRIb2xkZXJbaV0gPT09IFwieFwiKSB7XG4gICAgICAgICAgZ3VpZFJlc3BvbnNlICs9IGhleFtyXTtcbiAgICAgICAgfSBlbHNlIGlmIChndWlkSG9sZGVyW2ldID09PSBcInlcIikge1xuICAgICAgICAgIC8vIGNsb2NrLXNlcS1hbmQtcmVzZXJ2ZWQgZmlyc3QgaGV4IGlzIGZpbHRlcmVkIGFuZCByZW1haW5pbmcgaGV4IHZhbHVlcyBhcmUgcmFuZG9tXG4gICAgICAgICAgciAmPSAweDM7IC8vIGJpdCBhbmQgd2l0aCAwMDExIHRvIHNldCBwb3MgMiB0byB6ZXJvID8wPz9cbiAgICAgICAgICByIHw9IDB4ODsgLy8gc2V0IHBvcyAzIHRvIDEgYXMgMT8/P1xuICAgICAgICAgIGd1aWRSZXNwb25zZSArPSBoZXhbcl07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZ3VpZFJlc3BvbnNlICs9IGd1aWRIb2xkZXJbaV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBndWlkUmVzcG9uc2U7XG4gICAgfVxuICB9XG5cbiAgLy8jZW5kcmVnaW9uXG5cbiAgLy8jcmVnaW9uIFRpbWVcblxuICAvKipcbiAgICogUmV0dXJucyB0aW1lIGluIHNlY29uZHMgZm9yIGV4cGlyYXRpb24gYmFzZWQgb24gc3RyaW5nIHZhbHVlIHBhc3NlZCBpbi5cbiAgICpcbiAgICogQHBhcmFtIGV4cGlyZXNcbiAgICovXG4gIHN0YXRpYyBleHBpcmVzSW4oZXhwaXJlczogc3RyaW5nKTogbnVtYmVyIHtcbiAgICAvLyBpZiBBQUQgZGlkIG5vdCBzZW5kIFwiZXhwaXJlc19pblwiIHByb3BlcnR5LCB1c2UgZGVmYXVsdCBleHBpcmF0aW9uIG9mIDM1OTkgc2Vjb25kcywgZm9yIHNvbWUgcmVhc29uIEFBRCBzZW5kcyAzNTk5IGFzIFwiZXhwaXJlc19pblwiIHZhbHVlIGluc3RlYWQgb2YgMzYwMFxuICAgICBpZiAoIWV4cGlyZXMpIHtcbiAgICAgICAgIGV4cGlyZXMgPSBcIjM1OTlcIjtcbiAgICAgIH1cbiAgICByZXR1cm4gdGhpcy5ub3coKSArIHBhcnNlSW50KGV4cGlyZXMsIDEwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiByZXR1cm4gdGhlIGN1cnJlbnQgdGltZSBpbiBVbml4IHRpbWUuIERhdGUuZ2V0VGltZSgpIHJldHVybnMgaW4gbWlsbGlzZWNvbmRzLlxuICAgKi9cbiAgc3RhdGljIG5vdygpOiBudW1iZXIge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC8gMTAwMC4wKTtcbiAgfVxuXG4gIC8vI2VuZHJlZ2lvblxuXG4gIC8vI3JlZ2lvbiBTdHJpbmcgT3BzXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGEgc3RyaW5nIGlzIGVtcHR5XG4gICAqXG4gICAqIEBwYXJhbSBzdHJcbiAgICovXG4gIHN0YXRpYyBpc0VtcHR5KHN0cjogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICh0eXBlb2Ygc3RyID09PSBcInVuZGVmaW5lZFwiIHx8ICFzdHIgfHwgMCA9PT0gc3RyLmxlbmd0aCk7XG4gIH1cblxuICAvLyNlbmRyZWdpb25cblxuICAvLyNyZWdpb24gVG9rZW4gUHJvY2Vzc2luZyAoRXh0cmFjdCB0byBUb2tlblByb2Nlc3NpbmcudHMpXG5cbiAgLyoqXG4gICAqIGRlY29kZSBhIEpXVFxuICAgKlxuICAgKiBAcGFyYW0gand0VG9rZW5cbiAgICovXG4gIHN0YXRpYyBkZWNvZGVKd3Qoand0VG9rZW46IHN0cmluZyk6IGFueSB7XG4gICAgaWYgKHRoaXMuaXNFbXB0eShqd3RUb2tlbikpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBpZFRva2VuUGFydHNSZWdleCA9IC9eKFteXFwuXFxzXSopXFwuKFteXFwuXFxzXSspXFwuKFteXFwuXFxzXSopJC87XG4gICAgY29uc3QgbWF0Y2hlcyA9IGlkVG9rZW5QYXJ0c1JlZ2V4LmV4ZWMoand0VG9rZW4pO1xuICAgIGlmICghbWF0Y2hlcyB8fCBtYXRjaGVzLmxlbmd0aCA8IDQpIHtcbiAgICAgIC8vdGhpcy5fcmVxdWVzdENvbnRleHQubG9nZ2VyLndhcm4oXCJUaGUgcmV0dXJuZWQgaWRfdG9rZW4gaXMgbm90IHBhcnNlYWJsZS5cIik7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgY3JhY2tlZFRva2VuID0ge1xuICAgICAgaGVhZGVyOiBtYXRjaGVzWzFdLFxuICAgICAgSldTUGF5bG9hZDogbWF0Y2hlc1syXSxcbiAgICAgIEpXU1NpZzogbWF0Y2hlc1szXVxuICAgIH07XG4gICAgcmV0dXJuIGNyYWNrZWRUb2tlbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRyYWN0IElkVG9rZW4gYnkgZGVjb2RpbmcgdGhlIFJBV0lkVG9rZW5cbiAgICpcbiAgICogQHBhcmFtIGVuY29kZWRJZFRva2VuXG4gICAqL1xuICBzdGF0aWMgZXh0cmFjdElkVG9rZW4oZW5jb2RlZElkVG9rZW46IHN0cmluZyk6IGFueSB7XG4gICAgLy8gaWQgdG9rZW4gd2lsbCBiZSBkZWNvZGVkIHRvIGdldCB0aGUgdXNlcm5hbWVcbiAgICBjb25zdCBkZWNvZGVkVG9rZW4gPSB0aGlzLmRlY29kZUp3dChlbmNvZGVkSWRUb2tlbik7XG4gICAgaWYgKCFkZWNvZGVkVG9rZW4pIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgY29uc3QgYmFzZTY0SWRUb2tlbiA9IGRlY29kZWRUb2tlbi5KV1NQYXlsb2FkO1xuICAgICAgY29uc3QgYmFzZTY0RGVjb2RlZCA9IHRoaXMuYmFzZTY0RGVjb2RlU3RyaW5nVXJsU2FmZShiYXNlNjRJZFRva2VuKTtcbiAgICAgIGlmICghYmFzZTY0RGVjb2RlZCkge1xuICAgICAgICAvL3RoaXMuX3JlcXVlc3RDb250ZXh0LmxvZ2dlci5pbmZvKFwiVGhlIHJldHVybmVkIGlkX3Rva2VuIGNvdWxkIG5vdCBiZSBiYXNlNjQgdXJsIHNhZmUgZGVjb2RlZC5cIik7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgLy8gRUNNQSBzY3JpcHQgaGFzIEpTT04gYnVpbHQtaW4gc3VwcG9ydFxuICAgICAgcmV0dXJuIEpTT04ucGFyc2UoYmFzZTY0RGVjb2RlZCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvL3RoaXMuX3JlcXVlc3RDb250ZXh0LmxvZ2dlci5lcnJvcihcIlRoZSByZXR1cm5lZCBpZF90b2tlbiBjb3VsZCBub3QgYmUgZGVjb2RlZFwiICsgZXJyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vI2VuZHJlZ2lvblxuXG4gIC8vI3JlZ2lvbiBFbmNvZGUgYW5kIERlY29kZVxuXG4gIC8qKlxuICAgKiBlbmNvZGluZyBzdHJpbmcgdG8gYmFzZTY0IC0gcGxhdGZvcm0gc3BlY2lmaWMgY2hlY2tcbiAgICpcbiAgICogQHBhcmFtIGlucHV0XG4gICAqL1xuICBzdGF0aWMgYmFzZTY0RW5jb2RlU3RyaW5nVXJsU2FmZShpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAvLyBodG1sNSBzaG91bGQgc3VwcG9ydCBhdG9iIGZ1bmN0aW9uIGZvciBkZWNvZGluZ1xuICAgIGlmICh3aW5kb3cuYnRvYSkge1xuICAgICAgcmV0dXJuIHdpbmRvdy5idG9hKGlucHV0KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5lbmNvZGUoaW5wdXQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBkZWNvZGluZyBiYXNlNjQgdG9rZW4gLSBwbGF0Zm9ybSBzcGVjaWZpYyBjaGVja1xuICAgKlxuICAgKiBAcGFyYW0gYmFzZTY0SWRUb2tlblxuICAgKi9cbiAgc3RhdGljIGJhc2U2NERlY29kZVN0cmluZ1VybFNhZmUoYmFzZTY0SWRUb2tlbjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAvLyBodG1sNSBzaG91bGQgc3VwcG9ydCBhdG9iIGZ1bmN0aW9uIGZvciBkZWNvZGluZ1xuICAgIGJhc2U2NElkVG9rZW4gPSBiYXNlNjRJZFRva2VuLnJlcGxhY2UoLy0vZywgXCIrXCIpLnJlcGxhY2UoL18vZywgXCIvXCIpO1xuICAgIGlmICh3aW5kb3cuYXRvYikge1xuICAgICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KGVuY29kZVVSSUNvbXBvbmVudCh3aW5kb3cuYXRvYihiYXNlNjRJZFRva2VuKSkpOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMuZGVjb2RlKGJhc2U2NElkVG9rZW4pKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIGJhc2U2NCBlbmNvZGUgYSBzdHJpbmdcbiAgICpcbiAgICogQHBhcmFtIGlucHV0XG4gICAqL1xuICAvLyBUT0RPOiBSZW5hbWUgdG8gc3BlY2lmeSB0eXBlIG9mIGVuY29kaW5nXG4gIHN0YXRpYyBlbmNvZGUoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3Qga2V5U3RyOiBzdHJpbmcgPSBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky89XCI7XG4gICAgbGV0IG91dHB1dCA9IFwiXCI7XG4gICAgbGV0IGNocjE6IG51bWJlciwgY2hyMjogbnVtYmVyLCBjaHIzOiBudW1iZXIsIGVuYzE6IG51bWJlciwgZW5jMjogbnVtYmVyLCBlbmMzOiBudW1iZXIsIGVuYzQ6IG51bWJlcjtcbiAgICB2YXIgaSA9IDA7XG5cbiAgICBpbnB1dCA9IHRoaXMudXRmOEVuY29kZShpbnB1dCk7XG5cbiAgICB3aGlsZSAoaSA8IGlucHV0Lmxlbmd0aCkge1xuICAgICAgY2hyMSA9IGlucHV0LmNoYXJDb2RlQXQoaSsrKTtcbiAgICAgIGNocjIgPSBpbnB1dC5jaGFyQ29kZUF0KGkrKyk7XG4gICAgICBjaHIzID0gaW5wdXQuY2hhckNvZGVBdChpKyspO1xuXG4gICAgICBlbmMxID0gY2hyMSA+PiAyO1xuICAgICAgZW5jMiA9ICgoY2hyMSAmIDMpIDw8IDQpIHwgKGNocjIgPj4gNCk7XG4gICAgICBlbmMzID0gKChjaHIyICYgMTUpIDw8IDIpIHwgKGNocjMgPj4gNik7XG4gICAgICBlbmM0ID0gY2hyMyAmIDYzO1xuXG4gICAgICBpZiAoaXNOYU4oY2hyMikpIHtcbiAgICAgICAgZW5jMyA9IGVuYzQgPSA2NDtcbiAgICAgIH0gZWxzZSBpZiAoaXNOYU4oY2hyMykpIHtcbiAgICAgICAgZW5jNCA9IDY0O1xuICAgICAgfVxuXG4gICAgICBvdXRwdXQgPSBvdXRwdXQgKyBrZXlTdHIuY2hhckF0KGVuYzEpICsga2V5U3RyLmNoYXJBdChlbmMyKSArIGtleVN0ci5jaGFyQXQoZW5jMykgKyBrZXlTdHIuY2hhckF0KGVuYzQpO1xuICAgIH1cblxuICAgIHJldHVybiBvdXRwdXQucmVwbGFjZSgvXFwrL2csIFwiLVwiKS5yZXBsYWNlKC9cXC8vZywgXCJfXCIpLnJlcGxhY2UoLz0rJC8sIFwiXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIHV0ZjggZW5jb2RlIGEgc3RyaW5nXG4gICAqXG4gICAqIEBwYXJhbSBpbnB1dFxuICAgKi9cbiAgc3RhdGljIHV0ZjhFbmNvZGUoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaW5wdXQgPSBpbnB1dC5yZXBsYWNlKC9cXHJcXG4vZywgXCJcXG5cIik7XG4gICAgdmFyIHV0ZnRleHQgPSBcIlwiO1xuXG4gICAgZm9yICh2YXIgbiA9IDA7IG4gPCBpbnB1dC5sZW5ndGg7IG4rKykge1xuICAgICAgdmFyIGMgPSBpbnB1dC5jaGFyQ29kZUF0KG4pO1xuXG4gICAgICBpZiAoYyA8IDEyOCkge1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYyk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmICgoYyA+IDEyNykgJiYgKGMgPCAyMDQ4KSkge1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKGMgPj4gNikgfCAxOTIpO1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKGMgJiA2MykgfCAxMjgpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHV0ZnRleHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgoYyA+PiAxMikgfCAyMjQpO1xuICAgICAgICB1dGZ0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKChjID4+IDYpICYgNjMpIHwgMTI4KTtcbiAgICAgICAgdXRmdGV4dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChjICYgNjMpIHwgMTI4KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdXRmdGV4dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBkZWNvZGUgYSBiYXNlNjQgdG9rZW4gc3RyaW5nXG4gICAqXG4gICAqIEBwYXJhbSBiYXNlNjRJZFRva2VuXG4gICAqL1xuICAvLyBUT0RPOiBSZW5hbWUgdG8gc3BlY2lmeSB0eXBlIG9mIGVuY29kaW5nXG4gIHN0YXRpYyBkZWNvZGUoYmFzZTY0SWRUb2tlbjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICB2YXIgY29kZXMgPSBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky89XCI7XG4gICAgYmFzZTY0SWRUb2tlbiA9IFN0cmluZyhiYXNlNjRJZFRva2VuKS5yZXBsYWNlKC89KyQvLCBcIlwiKTtcbiAgICB2YXIgbGVuZ3RoID0gYmFzZTY0SWRUb2tlbi5sZW5ndGg7XG4gICAgaWYgKGxlbmd0aCAlIDQgPT09IDEpIHtcbiAgICAgIHRocm93IENsaWVudEF1dGhFcnJvci5jcmVhdGVUb2tlbkVuY29kaW5nRXJyb3IoYmFzZTY0SWRUb2tlbik7XG4gICAgfVxuICAgIGxldCBoMTogbnVtYmVyLCBoMjogbnVtYmVyLCBoMzogbnVtYmVyLCBoNDogbnVtYmVyLCBiaXRzOiBudW1iZXIsIGMxOiBudW1iZXIsIGMyOiBudW1iZXIsIGMzOiBudW1iZXIsIGRlY29kZWQgPSBcIlwiO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDQpIHtcbiAgICAgIC8vRXZlcnkgNCBiYXNlNjQgZW5jb2RlZCBjaGFyYWN0ZXIgd2lsbCBiZSBjb252ZXJ0ZWQgdG8gMyBieXRlIHN0cmluZywgd2hpY2ggaXMgMjQgYml0c1xuICAgICAgLy8gdGhlbiA2IGJpdHMgcGVyIGJhc2U2NCBlbmNvZGVkIGNoYXJhY3RlclxuICAgICAgaDEgPSBjb2Rlcy5pbmRleE9mKGJhc2U2NElkVG9rZW4uY2hhckF0KGkpKTtcbiAgICAgIGgyID0gY29kZXMuaW5kZXhPZihiYXNlNjRJZFRva2VuLmNoYXJBdChpICsgMSkpO1xuICAgICAgaDMgPSBjb2Rlcy5pbmRleE9mKGJhc2U2NElkVG9rZW4uY2hhckF0KGkgKyAyKSk7XG4gICAgICBoNCA9IGNvZGVzLmluZGV4T2YoYmFzZTY0SWRUb2tlbi5jaGFyQXQoaSArIDMpKTtcbiAgICAgIC8vIEZvciBwYWRkaW5nLCBpZiBsYXN0IHR3byBhcmUgXCI9XCJcbiAgICAgIGlmIChpICsgMiA9PT0gbGVuZ3RoIC0gMSkge1xuICAgICAgICBiaXRzID0gaDEgPDwgMTggfCBoMiA8PCAxMiB8IGgzIDw8IDY7XG4gICAgICAgIGMxID0gYml0cyA+PiAxNiAmIDI1NTtcbiAgICAgICAgYzIgPSBiaXRzID4+IDggJiAyNTU7XG4gICAgICAgIGRlY29kZWQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjMSwgYzIpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIC8vIGlmIGxhc3Qgb25lIGlzIFwiPVwiXG4gICAgICBlbHNlIGlmIChpICsgMSA9PT0gbGVuZ3RoIC0gMSkge1xuICAgICAgICBiaXRzID0gaDEgPDwgMTggfCBoMiA8PCAxMjtcbiAgICAgICAgYzEgPSBiaXRzID4+IDE2ICYgMjU1O1xuICAgICAgICBkZWNvZGVkICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYzEpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGJpdHMgPSBoMSA8PCAxOCB8IGgyIDw8IDEyIHwgaDMgPDwgNiB8IGg0O1xuICAgICAgLy8gdGhlbiBjb252ZXJ0IHRvIDMgYnl0ZSBjaGFyc1xuICAgICAgYzEgPSBiaXRzID4+IDE2ICYgMjU1O1xuICAgICAgYzIgPSBiaXRzID4+IDggJiAyNTU7XG4gICAgICBjMyA9IGJpdHMgJiAyNTU7XG4gICAgICBkZWNvZGVkICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYzEsIGMyLCBjMyk7XG4gICAgfVxuICAgIHJldHVybiBkZWNvZGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIGRlc2VyaWFsaXplIGEgc3RyaW5nXG4gICAqXG4gICAqIEBwYXJhbSBxdWVyeVxuICAgKi9cbiAgc3RhdGljIGRlc2VyaWFsaXplKHF1ZXJ5OiBzdHJpbmcpOiBhbnkge1xuICAgIGxldCBtYXRjaDogQXJyYXk8c3RyaW5nPjsgLy8gUmVnZXggZm9yIHJlcGxhY2luZyBhZGRpdGlvbiBzeW1ib2wgd2l0aCBhIHNwYWNlXG4gICAgY29uc3QgcGwgPSAvXFwrL2c7XG4gICAgY29uc3Qgc2VhcmNoID0gLyhbXiY9XSspPShbXiZdKikvZztcbiAgICBjb25zdCBkZWNvZGUgPSAoczogc3RyaW5nKSA9PiBkZWNvZGVVUklDb21wb25lbnQocy5yZXBsYWNlKHBsLCBcIiBcIikpO1xuICAgIGNvbnN0IG9iajoge30gPSB7fTtcbiAgICBtYXRjaCA9IHNlYXJjaC5leGVjKHF1ZXJ5KTtcbiAgICB3aGlsZSAobWF0Y2gpIHtcbiAgICAgIG9ialtkZWNvZGUobWF0Y2hbMV0pXSA9IGRlY29kZShtYXRjaFsyXSk7XG4gICAgICBtYXRjaCA9IHNlYXJjaC5leGVjKHF1ZXJ5KTtcbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbiAgfVxuXG4gIC8vI2VuZHJlZ2lvblxuXG4gIC8vI3JlZ2lvbiBTY29wZXMgKGV4dHJhY3QgdG8gU2NvcGVzLnRzKVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGVyZSBhcmUgZHVwIHNjb3BlcyBpbiBhIGdpdmVuIHJlcXVlc3RcbiAgICpcbiAgICogQHBhcmFtIGNhY2hlZFNjb3Blc1xuICAgKiBAcGFyYW0gc2NvcGVzXG4gICAqL1xuICAvLyBUT0RPOiBSZW5hbWUgdGhpcywgaW50ZXJzZWN0aW5nIHNjb3BlcyBpc24ndCBhIGdyZWF0IG5hbWUgZm9yIGR1cGxpY2F0ZSBjaGVja2VyXG4gIHN0YXRpYyBpc0ludGVyc2VjdGluZ1Njb3BlcyhjYWNoZWRTY29wZXM6IEFycmF5PHN0cmluZz4sIHNjb3BlczogQXJyYXk8c3RyaW5nPik6IGJvb2xlYW4ge1xuICAgIGNhY2hlZFNjb3BlcyA9IHRoaXMuY29udmVydFRvTG93ZXJDYXNlKGNhY2hlZFNjb3Blcyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY29wZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGNhY2hlZFNjb3Blcy5pbmRleE9mKHNjb3Blc1tpXS50b0xvd2VyQ2FzZSgpKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSBnaXZlbiBzY29wZSBpcyBwcmVzZW50IGluIHRoZSByZXF1ZXN0XG4gICAqXG4gICAqIEBwYXJhbSBjYWNoZWRTY29wZXNcbiAgICogQHBhcmFtIHNjb3Blc1xuICAgKi9cbiAgc3RhdGljIGNvbnRhaW5zU2NvcGUoY2FjaGVkU2NvcGVzOiBBcnJheTxzdHJpbmc+LCBzY29wZXM6IEFycmF5PHN0cmluZz4pOiBib29sZWFuIHtcbiAgICBjYWNoZWRTY29wZXMgPSB0aGlzLmNvbnZlcnRUb0xvd2VyQ2FzZShjYWNoZWRTY29wZXMpO1xuICAgIHJldHVybiBzY29wZXMuZXZlcnkoKHZhbHVlOiBhbnkpOiBib29sZWFuID0+IGNhY2hlZFNjb3Blcy5pbmRleE9mKHZhbHVlLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSkgPj0gMCk7XG4gIH1cblxuICAvKipcbiAgICogdG9Mb3dlclxuICAgKlxuICAgKiBAcGFyYW0gc2NvcGVzXG4gICAqL1xuICAvLyBUT0RPOiBSZW5hbWUgdGhpcywgdG9vIGdlbmVyaWMgbmFtZSBmb3IgYSBmdW5jdGlvbiB0aGF0IG9ubHkgZGVhbHMgd2l0aCBzY29wZXNcbiAgc3RhdGljIGNvbnZlcnRUb0xvd2VyQ2FzZShzY29wZXM6IEFycmF5PHN0cmluZz4pOiBBcnJheTxzdHJpbmc+IHtcbiAgICByZXR1cm4gc2NvcGVzLm1hcChzY29wZSA9PiBzY29wZS50b0xvd2VyQ2FzZSgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiByZW1vdmUgb25lIGVsZW1lbnQgZnJvbSBhIHNjb3BlIGFycmF5XG4gICAqXG4gICAqIEBwYXJhbSBzY29wZXNcbiAgICogQHBhcmFtIHNjb3BlXG4gICAqL1xuICAvLyBUT0RPOiBSZW5hbWUgdGhpcywgdG9vIGdlbmVyaWMgbmFtZSBmb3IgYSBmdW5jdGlvbiB0aGF0IG9ubHkgZGVhbHMgd2l0aCBzY29wZXNcbiAgc3RhdGljIHJlbW92ZUVsZW1lbnQoc2NvcGVzOiBBcnJheTxzdHJpbmc+LCBzY29wZTogc3RyaW5nKTogQXJyYXk8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHNjb3Blcy5maWx0ZXIodmFsdWUgPT4gdmFsdWUgIT09IHNjb3BlKTtcbiAgfVxuXG4gIC8vI2VuZHJlZ2lvblxuXG4gIC8vI3JlZ2lvbiBVUkwgUHJvY2Vzc2luZyAoRXh0cmFjdCB0byBVcmxQcm9jZXNzaW5nLnRzPylcblxuICBzdGF0aWMgZ2V0RGVmYXVsdFJlZGlyZWN0VXJpKCk6IHN0cmluZyB7XG4gICAgICByZXR1cm4gd2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoXCI/XCIpWzBdLnNwbGl0KFwiI1wiKVswXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlbiBhIHVybCBsaWtlIGh0dHBzOi8vYTpiL2NvbW1vbi9kP2U9ZiNnLCBhbmQgYSB0ZW5hbnRJZCwgcmV0dXJucyBodHRwczovL2E6Yi90ZW5hbnRJZC9kXG4gICAqIEBwYXJhbSBocmVmIFRoZSB1cmxcbiAgICogQHBhcmFtIHRlbmFudElkIFRoZSB0ZW5hbnQgaWQgdG8gcmVwbGFjZVxuICAgKi9cbiAgc3RhdGljIHJlcGxhY2VUZW5hbnRQYXRoKHVybDogc3RyaW5nLCB0ZW5hbnRJZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgIHVybCA9IHVybC50b0xvd2VyQ2FzZSgpO1xuICAgICAgdmFyIHVybE9iamVjdCA9IHRoaXMuR2V0VXJsQ29tcG9uZW50cyh1cmwpO1xuICAgICAgdmFyIHBhdGhBcnJheSA9IHVybE9iamVjdC5QYXRoU2VnbWVudHM7XG4gICAgICBpZiAodGVuYW50SWQgJiYgKHBhdGhBcnJheS5sZW5ndGggIT09IDAgJiYgKHBhdGhBcnJheVswXSA9PT0gQ29uc3RhbnRzLmNvbW1vbiB8fCBwYXRoQXJyYXlbMF0gPT09IFNTT1R5cGVzLk9SR0FOSVpBVElPTlMpKSkge1xuICAgICAgICBwYXRoQXJyYXlbMF0gPSB0ZW5hbnRJZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdEF1dGhvcml0eVVyaUZyb21PYmplY3QodXJsT2JqZWN0LCBwYXRoQXJyYXkpO1xuICB9XG5cbiAgc3RhdGljIGNvbnN0cnVjdEF1dGhvcml0eVVyaUZyb21PYmplY3QodXJsT2JqZWN0OiBJVXJpLCBwYXRoQXJyYXk6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIHRoaXMuQ2Fub25pY2FsaXplVXJpKHVybE9iamVjdC5Qcm90b2NvbCArIFwiLy9cIiArIHVybE9iamVjdC5Ib3N0TmFtZUFuZFBvcnQgKyBcIi9cIiArIHBhdGhBcnJheS5qb2luKFwiL1wiKSk7XG4gIH1cblxuICAvKipcbiAgICogUGFyc2VzIG91dCB0aGUgY29tcG9uZW50cyBmcm9tIGEgdXJsIHN0cmluZy5cbiAgICogQHJldHVybnMgQW4gb2JqZWN0IHdpdGggdGhlIHZhcmlvdXMgY29tcG9uZW50cy4gUGxlYXNlIGNhY2hlIHRoaXMgdmFsdWUgaW5zdGVkIG9mIGNhbGxpbmcgdGhpcyBtdWx0aXBsZSB0aW1lcyBvbiB0aGUgc2FtZSB1cmwuXG4gICAqL1xuICBzdGF0aWMgR2V0VXJsQ29tcG9uZW50cyh1cmw6IHN0cmluZyk6IElVcmkge1xuICAgIGlmICghdXJsKSB7XG4gICAgICB0aHJvdyBcIlVybCByZXF1aXJlZFwiO1xuICAgIH1cblxuICAgIC8vIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL2N1cnRpc3ovMTExMzliMmNmY2FlZjRhMjYxZTBcbiAgICB2YXIgcmVnRXggPSBSZWdFeHAoXCJeKChbXjovPyNdKyk6KT8oLy8oW14vPyNdKikpPyhbXj8jXSopKFxcXFw/KFteI10qKSk/KCMoLiopKT9cIik7XG5cbiAgICB2YXIgbWF0Y2ggPSB1cmwubWF0Y2gocmVnRXgpO1xuXG4gICAgaWYgKCFtYXRjaCB8fCBtYXRjaC5sZW5ndGggPCA2KSB7XG4gICAgICB0aHJvdyBcIlZhbGlkIHVybCByZXF1aXJlZFwiO1xuICAgIH1cblxuICAgIGxldCB1cmxDb21wb25lbnRzID0gPElVcmk+e1xuICAgICAgUHJvdG9jb2w6IG1hdGNoWzFdLFxuICAgICAgSG9zdE5hbWVBbmRQb3J0OiBtYXRjaFs0XSxcbiAgICAgIEFic29sdXRlUGF0aDogbWF0Y2hbNV1cbiAgICB9O1xuXG4gICAgbGV0IHBhdGhTZWdtZW50cyA9IHVybENvbXBvbmVudHMuQWJzb2x1dGVQYXRoLnNwbGl0KFwiL1wiKTtcbiAgICBwYXRoU2VnbWVudHMgPSBwYXRoU2VnbWVudHMuZmlsdGVyKCh2YWwpID0+IHZhbCAmJiB2YWwubGVuZ3RoID4gMCk7IC8vIHJlbW92ZSBlbXB0eSBlbGVtZW50c1xuICAgIHVybENvbXBvbmVudHMuUGF0aFNlZ21lbnRzID0gcGF0aFNlZ21lbnRzO1xuICAgIHJldHVybiB1cmxDb21wb25lbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdpdmVuIGEgdXJsIG9yIHBhdGgsIGFwcGVuZCBhIHRyYWlsaW5nIHNsYXNoIGlmIG9uZSBkb2VzbnQgZXhpc3RcbiAgICpcbiAgICogQHBhcmFtIHVybFxuICAgKi9cbiAgc3RhdGljIENhbm9uaWNhbGl6ZVVyaSh1cmw6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKHVybCkge1xuICAgICAgdXJsID0gdXJsLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxuXG4gICAgaWYgKHVybCAmJiAhVXRpbHMuZW5kc1dpdGgodXJsLCBcIi9cIikpIHtcbiAgICAgIHVybCArPSBcIi9cIjtcbiAgICB9XG5cbiAgICByZXR1cm4gdXJsO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB0byBzZWUgaWYgdGhlIHVybCBlbmRzIHdpdGggdGhlIHN1ZmZpeFxuICAgKiBSZXF1aXJlZCBiZWNhdXNlIHdlIGFyZSBjb21waWxpbmcgZm9yIGVzNSBpbnN0ZWFkIG9mIGVzNlxuICAgKiBAcGFyYW0gdXJsXG4gICAqIEBwYXJhbSBzdHJcbiAgICovXG4gIC8vIFRPRE86IFJlbmFtZSB0aGlzLCBub3QgY2xlYXIgd2hhdCBpdCBpcyBzdXBwb3NlZCB0byBkb1xuICBzdGF0aWMgZW5kc1dpdGgodXJsOiBzdHJpbmcsIHN1ZmZpeDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKCF1cmwgfHwgIXN1ZmZpeCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB1cmwuaW5kZXhPZihzdWZmaXgsIHVybC5sZW5ndGggLSBzdWZmaXgubGVuZ3RoKSAhPT0gLTE7XG4gIH1cblxuICAvKipcbiAgICogVXRpbHMgZnVuY3Rpb24gdG8gcmVtb3ZlIHRoZSBsb2dpbl9oaW50IGFuZCBkb21haW5faGludCBmcm9tIHRoZSBpL3AgZXh0cmFRdWVyeVBhcmFtZXRlcnNcbiAgICogQHBhcmFtIHVybFxuICAgKiBAcGFyYW0gbmFtZVxuICAgKi9cbiAgc3RhdGljIHVybFJlbW92ZVF1ZXJ5U3RyaW5nUGFyYW1ldGVyKHVybDogc3RyaW5nLCBuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLmlzRW1wdHkodXJsKSkge1xuICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG5cbiAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKFwiKFxcXFwmXCIgKyBuYW1lICsgXCI9KVteXFwmXStcIik7XG4gICAgdXJsID0gdXJsLnJlcGxhY2UocmVnZXgsIFwiXCIpO1xuICAgIC8vIG5hbWU9dmFsdWUmXG4gICAgcmVnZXggPSBuZXcgUmVnRXhwKFwiKFwiICsgbmFtZSArIFwiPSlbXlxcJl0rJlwiKTtcbiAgICB1cmwgPSB1cmwucmVwbGFjZShyZWdleCwgXCJcIik7XG4gICAgLy8gbmFtZT12YWx1ZVxuICAgIHJlZ2V4ID0gbmV3IFJlZ0V4cChcIihcIiArIG5hbWUgKyBcIj0pW15cXCZdK1wiKTtcbiAgICB1cmwgPSB1cmwucmVwbGFjZShyZWdleCwgXCJcIik7XG4gICAgcmV0dXJuIHVybDtcbiAgfVxuXG4gIC8vI2VuZHJlZ2lvblxuXG4gIC8vI3JlZ2lvbiBFeHRyYVF1ZXJ5UGFyYW1ldGVycyBQcm9jZXNzaW5nIChFeHRyYWN0PylcblxuICAvKipcbiAgICogQ29uc3RydWN0cyBleHRyYVF1ZXJ5UGFyYW1ldGVycyB0byBiZSBzZW50IHRvIHRoZSBzZXJ2ZXIgZm9yIHRoZSBBdXRoZW50aWNhdGlvblBhcmFtZXRlcnMgc2V0IGJ5IHRoZSBkZXZlbG9wZXJcbiAgICogaW4gYW55IGxvZ2luKCkgb3IgYWNxdWlyZVRva2VuKCkgY2FsbHNcbiAgICogQHBhcmFtIGlkVG9rZW5PYmplY3RcbiAgICogQHBhcmFtIGV4dHJhUXVlcnlQYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBzaWRcbiAgICogQHBhcmFtIGxvZ2luSGludFxuICAgKi9cbiAgLy9UT0RPOiBjaGVjayBob3cgdGhpcyBiZWhhdmVzIHdoZW4gZG9tYWluX2hpbnQgb25seSBpcyBzZW50IGluIGV4dHJhcGFyYW1ldGVycyBhbmQgaWRUb2tlbiBoYXMgbm8gdXBuLlxuICBzdGF0aWMgY29uc3RydWN0VW5pZmllZENhY2hlUXVlcnlQYXJhbWV0ZXIocmVxdWVzdDogQXV0aGVudGljYXRpb25QYXJhbWV0ZXJzLCBpZFRva2VuT2JqZWN0OiBhbnkpOiBRUERpY3Qge1xuXG4gICAgLy8gcHJlZmVyZW5jZSBvcmRlcjogYWNjb3VudCA+IHNpZCA+IGxvZ2luX2hpbnRcbiAgICBsZXQgc3NvVHlwZTtcbiAgICBsZXQgc3NvRGF0YTtcbiAgICBsZXQgc3NvUGFyYW06IFFQRGljdCA9IHt9O1xuICAgIGxldCBzZXJ2ZXJSZXFQYXJhbTogUVBEaWN0ID0ge307XG4gICAgLy8gaWYgYWNjb3VudCBpbmZvIGlzIHBhc3NlZCwgYWNjb3VudC5zaWQgPiBhY2NvdW50LmxvZ2luX2hpbnRcbiAgICBpZiAocmVxdWVzdCkge1xuICAgICAgaWYgKHJlcXVlc3QuYWNjb3VudCkge1xuICAgICAgICBjb25zdCBhY2NvdW50OiBBY2NvdW50ID0gcmVxdWVzdC5hY2NvdW50O1xuICAgICAgICBpZiAoYWNjb3VudC5zaWQpIHtcbiAgICAgICAgICBzc29UeXBlID0gU1NPVHlwZXMuU0lEO1xuICAgICAgICAgIHNzb0RhdGEgPSBhY2NvdW50LnNpZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChhY2NvdW50LnVzZXJOYW1lKSB7XG4gICAgICAgICAgc3NvVHlwZSA9IFNTT1R5cGVzLkxPR0lOX0hJTlQ7XG4gICAgICAgICAgc3NvRGF0YSA9IGFjY291bnQudXNlck5hbWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIHNpZCBmcm9tIHJlcXVlc3RcbiAgICAgIGVsc2UgaWYgKHJlcXVlc3Quc2lkKSB7XG4gICAgICAgIHNzb1R5cGUgPSBTU09UeXBlcy5TSUQ7XG4gICAgICAgIHNzb0RhdGEgPSByZXF1ZXN0LnNpZDtcbiAgICAgIH1cbiAgICAgIC8vIGxvZ2luSGludCBmcm9tIHJlcXVlc3RcbiAgICAgIGVsc2UgaWYgKHJlcXVlc3QubG9naW5IaW50KSB7XG4gICAgICAgIHNzb1R5cGUgPSBTU09UeXBlcy5MT0dJTl9ISU5UO1xuICAgICAgICBzc29EYXRhID0gcmVxdWVzdC5sb2dpbkhpbnQ7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIGFkYWxJZFRva2VuIHJldHJpZXZlZCBmcm9tIGNhY2hlXG4gICAgZWxzZSBpZiAoaWRUb2tlbk9iamVjdCkge1xuICAgICAgaWYgKGlkVG9rZW5PYmplY3QuaGFzT3duUHJvcGVydHkoQ29uc3RhbnRzLnVwbikpIHtcbiAgICAgICAgc3NvVHlwZSA9IFNTT1R5cGVzLklEX1RPS0VOO1xuICAgICAgICBzc29EYXRhID0gaWRUb2tlbk9iamVjdC51cG47XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgc3NvVHlwZSA9IFNTT1R5cGVzLk9SR0FOSVpBVElPTlM7XG4gICAgICAgIHNzb0RhdGEgPSBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHNlcnZlclJlcVBhcmFtID0gdGhpcy5hZGRTU09QYXJhbWV0ZXIoc3NvVHlwZSwgc3NvRGF0YSwgc3NvUGFyYW0pO1xuXG4gICAgLy8gYWRkIHRoZSBIb21lQWNjb3VudElkZW50aWZpZXIgaW5mby8gZG9tYWluX2hpbnRcbiAgICBpZiAocmVxdWVzdCAmJiByZXF1ZXN0LmFjY291bnQgJiYgcmVxdWVzdC5hY2NvdW50LmhvbWVBY2NvdW50SWRlbnRpZmllcikge1xuICAgICAgICBzZXJ2ZXJSZXFQYXJhbSA9IHRoaXMuYWRkU1NPUGFyYW1ldGVyKFNTT1R5cGVzLkhPTUVBQ0NPVU5UX0lELCByZXF1ZXN0LmFjY291bnQuaG9tZUFjY291bnRJZGVudGlmaWVyLCBzc29QYXJhbSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlcnZlclJlcVBhcmFtO1xuICB9XG5cblxuICAvKipcbiAgICogQWRkIFNJRCB0byBleHRyYVF1ZXJ5UGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gc2lkXG4gICAqL1xuICAvLyBUT0RPOiBDYW4gb3B0aW1pemUgdGhpcyBsYXRlciwgbWFrZSBzc29QYXJhbSBvcHRpb25hbFxuICBzdGF0aWMgYWRkU1NPUGFyYW1ldGVyKHNzb1R5cGU6IHN0cmluZywgc3NvRGF0YTogc3RyaW5nLCBzc29QYXJhbTogUVBEaWN0KTogUVBEaWN0IHtcblxuICAgIHN3aXRjaCAoc3NvVHlwZSkge1xuICAgICAgY2FzZSBTU09UeXBlcy5TSUQ6IHtcbiAgICAgICAgc3NvUGFyYW1bU1NPVHlwZXMuU0lEXSA9IHNzb0RhdGE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBTU09UeXBlcy5JRF9UT0tFTjoge1xuICAgICAgICBzc29QYXJhbVtTU09UeXBlcy5MT0dJTl9ISU5UXSA9IHNzb0RhdGE7XG4gICAgICAgIHNzb1BhcmFtW1NTT1R5cGVzLkRPTUFJTl9ISU5UXSA9IFNTT1R5cGVzLk9SR0FOSVpBVElPTlM7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBTU09UeXBlcy5MT0dJTl9ISU5UOiB7XG4gICAgICAgIHNzb1BhcmFtW1NTT1R5cGVzLkxPR0lOX0hJTlRdID0gc3NvRGF0YTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFNTT1R5cGVzLk9SR0FOSVpBVElPTlM6IHtcbiAgICAgICAgc3NvUGFyYW1bU1NPVHlwZXMuRE9NQUlOX0hJTlRdID0gU1NPVHlwZXMuT1JHQU5JWkFUSU9OUztcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFNTT1R5cGVzLkNPTlNVTUVSUzoge1xuICAgICAgICBzc29QYXJhbVtTU09UeXBlcy5ET01BSU5fSElOVF0gPSBTU09UeXBlcy5DT05TVU1FUlM7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBTU09UeXBlcy5IT01FQUNDT1VOVF9JRDoge1xuICAgICAgICBsZXQgaG9tZUFjY291bnRJZCA9IHNzb0RhdGEuc3BsaXQoXCIuXCIpO1xuICAgICAgICBjb25zdCB1aWQgPSBVdGlscy5iYXNlNjREZWNvZGVTdHJpbmdVcmxTYWZlKGhvbWVBY2NvdW50SWRbMF0pO1xuICAgICAgICBjb25zdCB1dGlkID0gVXRpbHMuYmFzZTY0RGVjb2RlU3RyaW5nVXJsU2FmZShob21lQWNjb3VudElkWzFdKTtcblxuICAgICAgICAvLyBUT0RPOiBkb21haW5fcmVxIGFuZCBsb2dpbl9yZXEgYXJlIG5vdCBuZWVkZWQgYWNjb3JkaW5nIHRvIGVTVFMgdGVhbVxuICAgICAgICBzc29QYXJhbVtTU09UeXBlcy5MT0dJTl9SRVFdID0gdWlkO1xuICAgICAgICBzc29QYXJhbVtTU09UeXBlcy5ET01BSU5fUkVRXSA9IHV0aWQ7XG5cbiAgICAgICAgaWYgKHV0aWQgPT09IENvbnN0YW50cy5jb25zdW1lcnNVdGlkKSB7XG4gICAgICAgICAgICBzc29QYXJhbVtTU09UeXBlcy5ET01BSU5fSElOVF0gPSBTU09UeXBlcy5DT05TVU1FUlM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzc29QYXJhbVtTU09UeXBlcy5ET01BSU5fSElOVF0gPSBTU09UeXBlcy5PUkdBTklaQVRJT05TO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBTU09UeXBlcy5MT0dJTl9SRVE6IHtcbiAgICAgICAgc3NvUGFyYW1bU1NPVHlwZXMuTE9HSU5fUkVRXSA9IHNzb0RhdGE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBTU09UeXBlcy5ET01BSU5fUkVROiB7XG4gICAgICAgIHNzb1BhcmFtW1NTT1R5cGVzLkRPTUFJTl9SRVFdID0gc3NvRGF0YTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNzb1BhcmFtO1xuICB9XG5cbiAgLyoqXG4gICAqIFV0aWxpdHkgdG8gZ2VuZXJhdGUgYSBRdWVyeVBhcmFtZXRlclN0cmluZyBmcm9tIGEgS2V5LVZhbHVlIG1hcHBpbmcgb2YgZXh0cmFRdWVyeVBhcmFtZXRlcnMgcGFzc2VkXG4gICAqIEBwYXJhbSBleHRyYVF1ZXJ5UGFyYW1ldGVyc1xuICAgKi9cbiAgc3RhdGljIGdlbmVyYXRlUXVlcnlQYXJhbWV0ZXJzU3RyaW5nKHF1ZXJ5UGFyYW1ldGVyczogUVBEaWN0KTogc3RyaW5nIHtcbiAgICBsZXQgcGFyYW1zU3RyaW5nOiBzdHJpbmcgPSBudWxsO1xuXG4gICAgaWYgKHF1ZXJ5UGFyYW1ldGVycykge1xuICAgICAgT2JqZWN0LmtleXMocXVlcnlQYXJhbWV0ZXJzKS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgICBpZiAocGFyYW1zU3RyaW5nID09IG51bGwpIHtcbiAgICAgICAgICBwYXJhbXNTdHJpbmcgPSBgJHtrZXl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5UGFyYW1ldGVyc1trZXldKX1gO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHBhcmFtc1N0cmluZyArPSBgJiR7a2V5fT0ke2VuY29kZVVSSUNvbXBvbmVudChxdWVyeVBhcmFtZXRlcnNba2V5XSl9YDtcbiAgICAgICAgfVxuICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFyYW1zU3RyaW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIHRvIHNlZSBpZiB0aGVyZSBhcmUgU1NPIHBhcmFtcyBzZXQgaW4gdGhlIFJlcXVlc3RcbiAgICogQHBhcmFtIHJlcXVlc3RcbiAgICovXG4gIHN0YXRpYyBpc1NTT1BhcmFtKHJlcXVlc3Q6IEF1dGhlbnRpY2F0aW9uUGFyYW1ldGVycykge1xuICAgICAgcmV0dXJuIHJlcXVlc3QgJiYgKHJlcXVlc3QuYWNjb3VudCB8fCByZXF1ZXN0LnNpZCB8fCByZXF1ZXN0LmxvZ2luSGludCk7XG4gIH1cblxuICAvLyNlbmRyZWdpb25cblxuICAvLyNyZWdpb24gUmVzcG9uc2UgSGVscGVyc1xuXG4gIHN0YXRpYyBzZXRSZXNwb25zZUlkVG9rZW4ob3JpZ2luYWxSZXNwb25zZTogQXV0aFJlc3BvbnNlLCBpZFRva2VuOiBJZFRva2VuKSA6IEF1dGhSZXNwb25zZSB7XG4gICAgdmFyIHJlc3BvbnNlID0geyAuLi5vcmlnaW5hbFJlc3BvbnNlIH07XG4gICAgcmVzcG9uc2UuaWRUb2tlbiA9IGlkVG9rZW47XG4gICAgaWYgKHJlc3BvbnNlLmlkVG9rZW4ub2JqZWN0SWQpIHtcbiAgICAgIHJlc3BvbnNlLnVuaXF1ZUlkID0gcmVzcG9uc2UuaWRUb2tlbi5vYmplY3RJZDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzcG9uc2UudW5pcXVlSWQgPSByZXNwb25zZS5pZFRva2VuLnN1YmplY3Q7XG4gICAgfVxuICAgIHJlc3BvbnNlLnRlbmFudElkID0gcmVzcG9uc2UuaWRUb2tlbi50ZW5hbnRJZDtcbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH1cblxuICAvLyNlbmRyZWdpb25cblxufVxuIiwiLyohICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbkNvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcclxudGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcclxuTGljZW5zZSBhdCBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcclxuXHJcblRISVMgQ09ERSBJUyBQUk9WSURFRCBPTiBBTiAqQVMgSVMqIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcclxuS0lORCwgRUlUSEVSIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIFdJVEhPVVQgTElNSVRBVElPTiBBTlkgSU1QTElFRFxyXG5XQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgVElUTEUsIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLFxyXG5NRVJDSEFOVEFCTElUWSBPUiBOT04tSU5GUklOR0VNRU5ULlxyXG5cclxuU2VlIHRoZSBBcGFjaGUgVmVyc2lvbiAyLjAgTGljZW5zZSBmb3Igc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zXHJcbmFuZCBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cclxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi9cclxuLyogZ2xvYmFsIFJlZmxlY3QsIFByb21pc2UgKi9cclxuXHJcbnZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24oZCwgYikge1xyXG4gICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxyXG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcclxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcclxuICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZXh0ZW5kcyhkLCBiKSB7XHJcbiAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19hc3NpZ24gPSBmdW5jdGlvbigpIHtcclxuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiBfX2Fzc2lnbih0KSB7XHJcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSkgdFtwXSA9IHNbcF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3Jlc3QocywgZSkge1xyXG4gICAgdmFyIHQgPSB7fTtcclxuICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSAmJiBlLmluZGV4T2YocCkgPCAwKVxyXG4gICAgICAgIHRbcF0gPSBzW3BdO1xyXG4gICAgaWYgKHMgIT0gbnVsbCAmJiB0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBwID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzKTsgaSA8IHAubGVuZ3RoOyBpKyspIGlmIChlLmluZGV4T2YocFtpXSkgPCAwKVxyXG4gICAgICAgICAgICB0W3BbaV1dID0gc1twW2ldXTtcclxuICAgIHJldHVybiB0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xyXG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XHJcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xyXG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcGFyYW0ocGFyYW1JbmRleCwgZGVjb3JhdG9yKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fbWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpIHtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0ZXIodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XHJcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHJlc3VsdC52YWx1ZSk7IH0pLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cclxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZ2VuZXJhdG9yKHRoaXNBcmcsIGJvZHkpIHtcclxuICAgIHZhciBfID0geyBsYWJlbDogMCwgc2VudDogZnVuY3Rpb24oKSB7IGlmICh0WzBdICYgMSkgdGhyb3cgdFsxXTsgcmV0dXJuIHRbMV07IH0sIHRyeXM6IFtdLCBvcHM6IFtdIH0sIGYsIHksIHQsIGc7XHJcbiAgICByZXR1cm4gZyA9IHsgbmV4dDogdmVyYigwKSwgXCJ0aHJvd1wiOiB2ZXJiKDEpLCBcInJldHVyblwiOiB2ZXJiKDIpIH0sIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiAoZ1tTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KSwgZztcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHN0ZXAoW24sIHZdKTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc3RlcChvcCkge1xyXG4gICAgICAgIGlmIChmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiR2VuZXJhdG9yIGlzIGFscmVhZHkgZXhlY3V0aW5nLlwiKTtcclxuICAgICAgICB3aGlsZSAoXykgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKGYgPSAxLCB5ICYmICh0ID0gb3BbMF0gJiAyID8geVtcInJldHVyblwiXSA6IG9wWzBdID8geVtcInRocm93XCJdIHx8ICgodCA9IHlbXCJyZXR1cm5cIl0pICYmIHQuY2FsbCh5KSwgMCkgOiB5Lm5leHQpICYmICEodCA9IHQuY2FsbCh5LCBvcFsxXSkpLmRvbmUpIHJldHVybiB0O1xyXG4gICAgICAgICAgICBpZiAoeSA9IDAsIHQpIG9wID0gW29wWzBdICYgMiwgdC52YWx1ZV07XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3BbMF0pIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgMDogY2FzZSAxOiB0ID0gb3A7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA0OiBfLmxhYmVsKys7IHJldHVybiB7IHZhbHVlOiBvcFsxXSwgZG9uZTogZmFsc2UgfTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNTogXy5sYWJlbCsrOyB5ID0gb3BbMV07IG9wID0gWzBdOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNzogb3AgPSBfLm9wcy5wb3AoKTsgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodCA9IF8udHJ5cywgdCA9IHQubGVuZ3RoID4gMCAmJiB0W3QubGVuZ3RoIC0gMV0pICYmIChvcFswXSA9PT0gNiB8fCBvcFswXSA9PT0gMikpIHsgXyA9IDA7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSAzICYmICghdCB8fCAob3BbMV0gPiB0WzBdICYmIG9wWzFdIDwgdFszXSkpKSB7IF8ubGFiZWwgPSBvcFsxXTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDYgJiYgXy5sYWJlbCA8IHRbMV0pIHsgXy5sYWJlbCA9IHRbMV07IHQgPSBvcDsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodCAmJiBfLmxhYmVsIDwgdFsyXSkgeyBfLmxhYmVsID0gdFsyXTsgXy5vcHMucHVzaChvcCk7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRbMl0pIF8ub3BzLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb3AgPSBib2R5LmNhbGwodGhpc0FyZywgXyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkgeyBvcCA9IFs2LCBlXTsgeSA9IDA7IH0gZmluYWxseSB7IGYgPSB0ID0gMDsgfVxyXG4gICAgICAgIGlmIChvcFswXSAmIDUpIHRocm93IG9wWzFdOyByZXR1cm4geyB2YWx1ZTogb3BbMF0gPyBvcFsxXSA6IHZvaWQgMCwgZG9uZTogdHJ1ZSB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHBvcnRTdGFyKG0sIGV4cG9ydHMpIHtcclxuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKCFleHBvcnRzLmhhc093blByb3BlcnR5KHApKSBleHBvcnRzW3BdID0gbVtwXTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fdmFsdWVzKG8pIHtcclxuICAgIHZhciBtID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9bU3ltYm9sLml0ZXJhdG9yXSwgaSA9IDA7XHJcbiAgICBpZiAobSkgcmV0dXJuIG0uY2FsbChvKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgbmV4dDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAobyAmJiBpID49IG8ubGVuZ3RoKSBvID0gdm9pZCAwO1xyXG4gICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogbyAmJiBvW2krK10sIGRvbmU6ICFvIH07XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcmVhZChvLCBuKSB7XHJcbiAgICB2YXIgbSA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvW1N5bWJvbC5pdGVyYXRvcl07XHJcbiAgICBpZiAoIW0pIHJldHVybiBvO1xyXG4gICAgdmFyIGkgPSBtLmNhbGwobyksIHIsIGFyID0gW10sIGU7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHdoaWxlICgobiA9PT0gdm9pZCAwIHx8IG4tLSA+IDApICYmICEociA9IGkubmV4dCgpKS5kb25lKSBhci5wdXNoKHIudmFsdWUpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGVycm9yKSB7IGUgPSB7IGVycm9yOiBlcnJvciB9OyB9XHJcbiAgICBmaW5hbGx5IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAociAmJiAhci5kb25lICYmIChtID0gaVtcInJldHVyblwiXSkpIG0uY2FsbChpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZmluYWxseSB7IGlmIChlKSB0aHJvdyBlLmVycm9yOyB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZCgpIHtcclxuICAgIGZvciAodmFyIGFyID0gW10sIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIGFyID0gYXIuY29uY2F0KF9fcmVhZChhcmd1bWVudHNbaV0pKTtcclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXQodikge1xyXG4gICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBfX2F3YWl0ID8gKHRoaXMudiA9IHYsIHRoaXMpIDogbmV3IF9fYXdhaXQodik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jR2VuZXJhdG9yKHRoaXNBcmcsIF9hcmd1bWVudHMsIGdlbmVyYXRvcikge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBnID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pLCBpLCBxID0gW107XHJcbiAgICByZXR1cm4gaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaWYgKGdbbl0pIGlbbl0gPSBmdW5jdGlvbiAodikgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKGEsIGIpIHsgcS5wdXNoKFtuLCB2LCBhLCBiXSkgPiAxIHx8IHJlc3VtZShuLCB2KTsgfSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHJlc3VtZShuLCB2KSB7IHRyeSB7IHN0ZXAoZ1tuXSh2KSk7IH0gY2F0Y2ggKGUpIHsgc2V0dGxlKHFbMF1bM10sIGUpOyB9IH1cclxuICAgIGZ1bmN0aW9uIHN0ZXAocikgeyByLnZhbHVlIGluc3RhbmNlb2YgX19hd2FpdCA/IFByb21pc2UucmVzb2x2ZShyLnZhbHVlLnYpLnRoZW4oZnVsZmlsbCwgcmVqZWN0KSA6IHNldHRsZShxWzBdWzJdLCByKTsgfVxyXG4gICAgZnVuY3Rpb24gZnVsZmlsbCh2YWx1ZSkgeyByZXN1bWUoXCJuZXh0XCIsIHZhbHVlKTsgfVxyXG4gICAgZnVuY3Rpb24gcmVqZWN0KHZhbHVlKSB7IHJlc3VtZShcInRocm93XCIsIHZhbHVlKTsgfVxyXG4gICAgZnVuY3Rpb24gc2V0dGxlKGYsIHYpIHsgaWYgKGYodiksIHEuc2hpZnQoKSwgcS5sZW5ndGgpIHJlc3VtZShxWzBdWzBdLCBxWzBdWzFdKTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hc3luY0RlbGVnYXRvcihvKSB7XHJcbiAgICB2YXIgaSwgcDtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiwgZnVuY3Rpb24gKGUpIHsgdGhyb3cgZTsgfSksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4sIGYpIHsgaVtuXSA9IG9bbl0gPyBmdW5jdGlvbiAodikgeyByZXR1cm4gKHAgPSAhcCkgPyB7IHZhbHVlOiBfX2F3YWl0KG9bbl0odikpLCBkb25lOiBuID09PSBcInJldHVyblwiIH0gOiBmID8gZih2KSA6IHY7IH0gOiBmOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jVmFsdWVzKG8pIHtcclxuICAgIGlmICghU3ltYm9sLmFzeW5jSXRlcmF0b3IpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTeW1ib2wuYXN5bmNJdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbiAgICB2YXIgbSA9IG9bU3ltYm9sLmFzeW5jSXRlcmF0b3JdLCBpO1xyXG4gICAgcmV0dXJuIG0gPyBtLmNhbGwobykgOiAobyA9IHR5cGVvZiBfX3ZhbHVlcyA9PT0gXCJmdW5jdGlvblwiID8gX192YWx1ZXMobykgOiBvW1N5bWJvbC5pdGVyYXRvcl0oKSwgaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGkpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IGlbbl0gPSBvW25dICYmIGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7IHYgPSBvW25dKHYpLCBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCB2LmRvbmUsIHYudmFsdWUpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc2V0dGxlKHJlc29sdmUsIHJlamVjdCwgZCwgdikgeyBQcm9taXNlLnJlc29sdmUodikudGhlbihmdW5jdGlvbih2KSB7IHJlc29sdmUoeyB2YWx1ZTogdiwgZG9uZTogZCB9KTsgfSwgcmVqZWN0KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19tYWtlVGVtcGxhdGVPYmplY3QoY29va2VkLCByYXcpIHtcclxuICAgIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydHkpIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNvb2tlZCwgXCJyYXdcIiwgeyB2YWx1ZTogcmF3IH0pOyB9IGVsc2UgeyBjb29rZWQucmF3ID0gcmF3OyB9XHJcbiAgICByZXR1cm4gY29va2VkO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0U3Rhcihtb2QpIHtcclxuICAgIGlmIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpIHJldHVybiBtb2Q7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZiAobW9kICE9IG51bGwpIGZvciAodmFyIGsgaW4gbW9kKSBpZiAoT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwobW9kLCBrKSkgcmVzdWx0W2tdID0gbW9kW2tdO1xyXG4gICAgcmVzdWx0LmRlZmF1bHQgPSBtb2Q7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19pbXBvcnREZWZhdWx0KG1vZCkge1xyXG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBkZWZhdWx0OiBtb2QgfTtcclxufVxyXG4iLCJpbXBvcnQgeyBDYWNoZUxvY2F0aW9uIH0gZnJvbSBcIi4vQ29uZmlndXJhdGlvblwiO1xyXG5cclxuLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cclxuXHJcbi8qKlxyXG4gKiBAaGlkZGVuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgQ29uc3RhbnRzIHtcclxuICBzdGF0aWMgZ2V0IGVycm9yRGVzY3JpcHRpb24oKTogc3RyaW5nIHsgcmV0dXJuIFwiZXJyb3JfZGVzY3JpcHRpb25cIjsgfVxyXG4gIHN0YXRpYyBnZXQgZXJyb3IoKTogc3RyaW5nIHsgcmV0dXJuIFwiZXJyb3JcIjsgfVxyXG5cclxuICBzdGF0aWMgZ2V0IHNjb3BlKCk6IHN0cmluZyB7IHJldHVybiBcInNjb3BlXCI7IH1cclxuICBzdGF0aWMgZ2V0IGNsaWVudEluZm8oKTogc3RyaW5nIHsgcmV0dXJuIFwiY2xpZW50X2luZm9cIjsgfVxyXG4gIHN0YXRpYyBnZXQgY2xpZW50SWQoKTogc3RyaW5nIHsgcmV0dXJuIFwiY2xpZW50SWRcIjsgfVxyXG5cclxuICBzdGF0aWMgZ2V0IGlkVG9rZW4oKTogc3RyaW5nIHsgcmV0dXJuIFwiaWRfdG9rZW5cIjsgfVxyXG4gIHN0YXRpYyBnZXQgYWRhbElkVG9rZW4oKTogc3RyaW5nIHsgcmV0dXJuIFwiYWRhbC5pZHRva2VuXCI7IH1cclxuICBzdGF0aWMgZ2V0IGFjY2Vzc1Rva2VuKCk6IHN0cmluZyB7IHJldHVybiBcImFjY2Vzc190b2tlblwiOyB9XHJcbiAgc3RhdGljIGdldCBleHBpcmVzSW4oKTogc3RyaW5nIHsgcmV0dXJuIFwiZXhwaXJlc19pblwiOyB9XHJcbiAgc3RhdGljIGdldCBzZXNzaW9uU3RhdGUoKTogc3RyaW5nIHsgcmV0dXJuIFwic2Vzc2lvbl9zdGF0ZVwiOyB9XHJcblxyXG4gIHN0YXRpYyBnZXQgbXNhbENsaWVudEluZm8oKTogc3RyaW5nIHsgcmV0dXJuIFwibXNhbC5jbGllbnQuaW5mb1wiOyB9XHJcbiAgc3RhdGljIGdldCBtc2FsRXJyb3IoKTogc3RyaW5nIHsgcmV0dXJuIFwibXNhbC5lcnJvclwiOyB9XHJcbiAgc3RhdGljIGdldCBtc2FsRXJyb3JEZXNjcmlwdGlvbigpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLmVycm9yLmRlc2NyaXB0aW9uXCI7IH1cclxuXHJcbiAgc3RhdGljIGdldCBtc2FsU2Vzc2lvblN0YXRlKCk6IHN0cmluZyB7IHJldHVybiBcIm1zYWwuc2Vzc2lvbi5zdGF0ZVwiOyB9XHJcbiAgc3RhdGljIGdldCB0b2tlbktleXMoKTogc3RyaW5nIHsgcmV0dXJuIFwibXNhbC50b2tlbi5rZXlzXCI7IH1cclxuICBzdGF0aWMgZ2V0IGFjY2Vzc1Rva2VuS2V5KCk6IHN0cmluZyB7IHJldHVybiBcIm1zYWwuYWNjZXNzLnRva2VuLmtleVwiOyB9XHJcbiAgc3RhdGljIGdldCBleHBpcmF0aW9uS2V5KCk6IHN0cmluZyB7IHJldHVybiBcIm1zYWwuZXhwaXJhdGlvbi5rZXlcIjsgfVxyXG4gIHN0YXRpYyBnZXQgc3RhdGVMb2dpbigpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLnN0YXRlLmxvZ2luXCI7IH1cclxuICBzdGF0aWMgZ2V0IHN0YXRlQWNxdWlyZVRva2VuKCk6IHN0cmluZyB7IHJldHVybiBcIm1zYWwuc3RhdGUuYWNxdWlyZVRva2VuXCI7IH1cclxuICBzdGF0aWMgZ2V0IHN0YXRlUmVuZXcoKTogc3RyaW5nIHsgcmV0dXJuIFwibXNhbC5zdGF0ZS5yZW5ld1wiOyB9XHJcbiAgc3RhdGljIGdldCBub25jZUlkVG9rZW4oKTogc3RyaW5nIHsgcmV0dXJuIFwibXNhbC5ub25jZS5pZHRva2VuXCI7IH1cclxuICBzdGF0aWMgZ2V0IHVzZXJOYW1lKCk6IHN0cmluZyB7IHJldHVybiBcIm1zYWwudXNlcm5hbWVcIjsgfVxyXG4gIHN0YXRpYyBnZXQgaWRUb2tlbktleSgpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLmlkdG9rZW5cIjsgfVxyXG4gIHN0YXRpYyBnZXQgbG9naW5SZXF1ZXN0KCk6IHN0cmluZyB7IHJldHVybiBcIm1zYWwubG9naW4ucmVxdWVzdFwiOyB9XHJcbiAgc3RhdGljIGdldCBsb2dpbkVycm9yKCk6IHN0cmluZyB7IHJldHVybiBcIm1zYWwubG9naW4uZXJyb3JcIjsgfVxyXG4gIHN0YXRpYyBnZXQgcmVuZXdTdGF0dXMoKTogc3RyaW5nIHsgcmV0dXJuIFwibXNhbC50b2tlbi5yZW5ldy5zdGF0dXNcIjsgfVxyXG4gIHN0YXRpYyBnZXQgdXJsSGFzaCgpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLnVybEhhc2hcIjsgfVxyXG4gIHN0YXRpYyBnZXQgYW5ndWxhckxvZ2luUmVxdWVzdCgpOiBzdHJpbmcgeyByZXR1cm4gXCJtc2FsLmFuZ3VsYXIubG9naW4ucmVxdWVzdFwiOyB9XHJcbiAgc3RhdGljIGdldCBtc2FsKCk6IHN0cmluZyB7IHJldHVybiBcIm1zYWxcIjsgfVxyXG5cclxuICBzdGF0aWMgZ2V0IG5vX2FjY291bnQoKTogc3RyaW5nIHsgcmV0dXJuIFwiTk9fQUNDT1VOVFwiOyB9XHJcbiAgc3RhdGljIGdldCBjb25zdW1lcnNVdGlkKCk6IHN0cmluZyB7IHJldHVybiBcIjkxODgwNDBkLTZjNjctNGM1Yi1iMTEyLTM2YTMwNGI2NmRhZFwiOyB9XHJcbiAgc3RhdGljIGdldCB1cG4oKTogc3RyaW5nIHsgcmV0dXJuIFwidXBuXCI7IH1cclxuXHJcbiAgc3RhdGljIGdldCBwcm9tcHRfc2VsZWN0X2FjY291bnQoKTogc3RyaW5nIHsgcmV0dXJuIFwiJnByb21wdD1zZWxlY3RfYWNjb3VudFwiOyB9XHJcbiAgc3RhdGljIGdldCBwcm9tcHRfbm9uZSgpOiBzdHJpbmcgeyByZXR1cm4gXCImcHJvbXB0PW5vbmVcIjsgfVxyXG4gIHN0YXRpYyBnZXQgcHJvbXB0KCk6IHN0cmluZyB7IHJldHVybiBcInByb21wdFwiOyB9XHJcblxyXG4gIHN0YXRpYyBnZXQgcmVzcG9uc2VfbW9kZV9mcmFnbWVudCgpOiBzdHJpbmcgeyByZXR1cm4gXCImcmVzcG9uc2VfbW9kZT1mcmFnbWVudFwiOyB9XHJcbiAgc3RhdGljIGdldCByZXNvdXJjZURlbGltaXRlcigpOiBzdHJpbmcgeyByZXR1cm4gXCJ8XCI7IH1cclxuXHJcbiAgc3RhdGljIGdldCB0b2tlblJlbmV3U3RhdHVzQ2FuY2VsbGVkKCk6IHN0cmluZyB7IHJldHVybiBcIkNhbmNlbGVkXCI7IH1cclxuICBzdGF0aWMgZ2V0IHRva2VuUmVuZXdTdGF0dXNDb21wbGV0ZWQoKTogc3RyaW5nIHsgcmV0dXJuIFwiQ29tcGxldGVkXCI7IH1cclxuICBzdGF0aWMgZ2V0IHRva2VuUmVuZXdTdGF0dXNJblByb2dyZXNzKCk6IHN0cmluZyB7IHJldHVybiBcIkluIFByb2dyZXNzXCI7IH1cclxuXHJcbiAgcHJpdmF0ZSBzdGF0aWMgX3BvcFVwV2lkdGg6IG51bWJlciA9IDQ4MztcclxuICBzdGF0aWMgZ2V0IHBvcFVwV2lkdGgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX3BvcFVwV2lkdGg7IH1cclxuICBzdGF0aWMgc2V0IHBvcFVwV2lkdGgod2lkdGg6IG51bWJlcikge1xyXG4gICAgdGhpcy5fcG9wVXBXaWR0aCA9IHdpZHRoO1xyXG4gIH1cclxuICBwcml2YXRlIHN0YXRpYyBfcG9wVXBIZWlnaHQ6IG51bWJlciA9IDYwMDtcclxuICBzdGF0aWMgZ2V0IHBvcFVwSGVpZ2h0KCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9wb3BVcEhlaWdodDsgfVxyXG4gIHN0YXRpYyBzZXQgcG9wVXBIZWlnaHQoaGVpZ2h0OiBudW1iZXIpIHtcclxuICAgIHRoaXMuX3BvcFVwSGVpZ2h0ID0gaGVpZ2h0O1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGdldCBsb2dpbigpOiBzdHJpbmcgeyByZXR1cm4gXCJMT0dJTlwiOyB9XHJcbiAgc3RhdGljIGdldCByZW5ld1Rva2VuKCk6IHN0cmluZyB7IHJldHVybiBcIlJFTkVXX1RPS0VOXCI7IH1cclxuICBzdGF0aWMgZ2V0IHVua25vd24oKTogc3RyaW5nIHsgcmV0dXJuIFwiVU5LTk9XTlwiOyB9XHJcblxyXG4gIHN0YXRpYyBnZXQgaG9tZUFjY291bnRJZGVudGlmaWVyKCk6IHN0cmluZyB7IHJldHVybiBcImhvbWVBY2NvdW50SWRlbnRpZmllclwiOyB9XHJcblxyXG4gIHN0YXRpYyBnZXQgY29tbW9uKCk6IHN0cmluZyB7IHJldHVybiBcImNvbW1vblwiOyB9XHJcbiAgc3RhdGljIGdldCBvcGVuaWRTY29wZSgpOiBzdHJpbmcgeyByZXR1cm4gXCJvcGVuaWRcIjsgfVxyXG4gIHN0YXRpYyBnZXQgcHJvZmlsZVNjb3BlKCk6IHN0cmluZyB7IHJldHVybiBcInByb2ZpbGVcIjsgfVxyXG5cclxuICBzdGF0aWMgZ2V0IGNhY2hlTG9jYXRpb25Mb2NhbCgpOiBDYWNoZUxvY2F0aW9uIHsgcmV0dXJuIFwibG9jYWxTdG9yYWdlXCI7IH1cclxuICBzdGF0aWMgZ2V0IGNhY2hlTG9jYXRpb25TZXNzaW9uKCk6IENhY2hlTG9jYXRpb24geyByZXR1cm4gXCJzZXNzaW9uU3RvcmFnZVwiOyB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAaGlkZGVuXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgQ2FjaGVLZXlzID0ge1xyXG4gICAgQVVUSE9SSVRZOiBcIm1zYWxfYXV0aG9yaXR5XCIsXHJcbiAgICBBQ1FVSVJFX1RPS0VOX1VTRVI6IFwibXNhbC5hY3F1aXJlVG9rZW5Vc2VyXCJcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAaGlkZGVuXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgU1NPVHlwZXMgPSB7XHJcbiAgICBBQ0NPVU5UOiBcImFjY291bnRcIixcclxuICAgIFNJRDogXCJzaWRcIixcclxuICAgIExPR0lOX0hJTlQ6IFwibG9naW5faGludFwiLFxyXG4gICAgSURfVE9LRU46IFwiaWRfdG9rZW5cIixcclxuICAgIERPTUFJTl9ISU5UOiBcImRvbWFpbl9oaW50XCIsXHJcbiAgICBPUkdBTklaQVRJT05TOiBcIm9yZ2FuaXphdGlvbnNcIixcclxuICAgIENPTlNVTUVSUzogXCJjb25zdW1lcnNcIixcclxuICAgIEFDQ09VTlRfSUQ6IFwiYWNjb3VudElkZW50aWZpZXJcIixcclxuICAgIEhPTUVBQ0NPVU5UX0lEOiBcImhvbWVBY2NvdW50SWRlbnRpZmllclwiLFxyXG4gICAgTE9HSU5fUkVROiBcImxvZ2luX3JlcVwiLFxyXG4gICAgRE9NQUlOX1JFUTogXCJkb21haW5fcmVxXCJcclxufTtcclxuXHJcbi8qKlxyXG4gKiB3ZSBjb25zaWRlcmVkIG1ha2luZyB0aGlzIFwiZW51bVwiIGluIHRoZSByZXF1ZXN0IGluc3RlYWQgb2Ygc3RyaW5nLCBob3dldmVyIGl0IGxvb2tzIGxpa2UgdGhlIGFsbG93ZWQgbGlzdCBvZlxyXG4gKiBwcm9tcHQgdmFsdWVzIGtlcHQgY2hhbmdpbmcgb3ZlciBwYXN0IGNvdXBsZSBvZiB5ZWFycy4gVGhlcmUgYXJlIHNvbWUgdW5kb2N1bWVudGVkIHByb21wdCB2YWx1ZXMgZm9yIHNvbWVcclxuICogaW50ZXJuYWwgcGFydG5lcnMgdG9vLCBoZW5jZSB0aGUgY2hvaWNlIG9mIGdlbmVyaWMgXCJzdHJpbmdcIiB0eXBlIGluc3RlYWQgb2YgdGhlIFwiZW51bVwiXHJcbiAqIEBoaWRkZW5cclxuICovXHJcbmV4cG9ydCBjb25zdCBQcm9tcHRTdGF0ZSA9IHtcclxuXHRMT0dJTjogXCJsb2dpblwiLFxyXG5cdFNFTEVDVF9BQ0NPVU5UOiBcInNlbGVjdF9hY2NvdW50XCIsXHJcblx0Q09OU0VOVDogXCJjb25zZW50XCIsXHJcblx0Tk9ORTogXCJub25lXCIsXHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgTGlicmFyeSA9IHtcclxuICB2ZXJzaW9uOiBcIjEuMC4wLXByZXZpZXcuNFwiXHJcbn07XHJcbiIsIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuXG5pbXBvcnQgeyBBdXRoRXJyb3IgfSBmcm9tIFwiLi9BdXRoRXJyb3JcIjtcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSBcIi4uL1V0aWxzXCI7XG5pbXBvcnQgeyBJZFRva2VuIH0gZnJvbSBcIi4uL0lkVG9rZW5cIjtcblxuZXhwb3J0IGNvbnN0IENsaWVudEF1dGhFcnJvck1lc3NhZ2UgPSB7XG4gICAgbXVsdGlwbGVNYXRjaGluZ1Rva2Vuczoge1xuICAgICAgICBjb2RlOiBcIm11bHRpcGxlX21hdGNoaW5nX3Rva2Vuc1wiLFxuICAgICAgICBkZXNjOiBcIlRoZSBjYWNoZSBjb250YWlucyBtdWx0aXBsZSB0b2tlbnMgc2F0aXNmeWluZyB0aGUgcmVxdWlyZW1lbnRzLiBcIiArXG4gICAgICAgICAgICBcIkNhbGwgQWNxdWlyZVRva2VuIGFnYWluIHByb3ZpZGluZyBtb3JlIHJlcXVpcmVtZW50cyBsaWtlIGF1dGhvcml0eS5cIlxuICAgIH0sXG4gICAgbXVsdGlwbGVDYWNoZUF1dGhvcml0aWVzOiB7XG4gICAgICAgIGNvZGU6IFwibXVsdGlwbGVfYXV0aG9yaXRpZXNcIixcbiAgICAgICAgZGVzYzogXCJNdWx0aXBsZSBhdXRob3JpdGllcyBmb3VuZCBpbiB0aGUgY2FjaGUuIFBhc3MgYXV0aG9yaXR5IGluIHRoZSBBUEkgb3ZlcmxvYWQuXCJcbiAgICB9LFxuICAgIGVuZHBvaW50UmVzb2x1dGlvbkVycm9yOiB7XG4gICAgICAgIGNvZGU6IFwiZW5kcG9pbnRzX3Jlc29sdXRpb25fZXJyb3JcIixcbiAgICAgICAgZGVzYzogXCJFcnJvcjogY291bGQgbm90IHJlc29sdmUgZW5kcG9pbnRzLiBQbGVhc2UgY2hlY2sgbmV0d29yayBhbmQgdHJ5IGFnYWluLlwiXG4gICAgfSxcbiAgICBwb3BVcFdpbmRvd0Vycm9yOiB7XG4gICAgICAgIGNvZGU6IFwicG9wdXBfd2luZG93X2Vycm9yXCIsXG4gICAgICAgIGRlc2M6IFwiRXJyb3Igb3BlbmluZyBwb3B1cCB3aW5kb3cuIFRoaXMgY2FuIGhhcHBlbiBpZiB5b3UgYXJlIHVzaW5nIElFIG9yIGlmIHBvcHVwcyBhcmUgYmxvY2tlZCBpbiB0aGUgYnJvd3Nlci5cIlxuICAgIH0sXG4gICAgdG9rZW5SZW5ld2FsRXJyb3I6IHtcbiAgICAgICAgY29kZTogXCJ0b2tlbl9yZW5ld2FsX2Vycm9yXCIsXG4gICAgICAgIGRlc2M6IFwiVG9rZW4gcmVuZXdhbCBvcGVyYXRpb24gZmFpbGVkIGR1ZSB0byB0aW1lb3V0LlwiXG4gICAgfSxcbiAgICBpbnZhbGlkSWRUb2tlbjoge1xuICAgICAgICBjb2RlOiBcImludmFsaWRfaWRfdG9rZW5cIixcbiAgICAgICAgZGVzYzogXCJJbnZhbGlkIElEIHRva2VuIGZvcm1hdC5cIlxuICAgIH0sXG4gICAgaW52YWxpZFN0YXRlRXJyb3I6IHtcbiAgICAgICAgY29kZTogXCJpbnZhbGlkX3N0YXRlX2Vycm9yXCIsXG4gICAgICAgIGRlc2M6IFwiSW52YWxpZCBzdGF0ZS5cIlxuICAgIH0sXG4gICAgbm9uY2VNaXNtYXRjaEVycm9yOiB7XG4gICAgICAgIGNvZGU6IFwibm9uY2VfbWlzbWF0Y2hfZXJyb3JcIixcbiAgICAgICAgZGVzYzogXCJOb25jZSBpcyBub3QgbWF0Y2hpbmcsIE5vbmNlIHJlY2VpdmVkOiBcIlxuICAgIH0sXG4gICAgbG9naW5Qcm9ncmVzc0Vycm9yOiB7XG4gICAgICAgIGNvZGU6IFwibG9naW5fcHJvZ3Jlc3NfZXJyb3JcIixcbiAgICAgICAgZGVzYzogXCJMb2dpbl9Jbl9Qcm9ncmVzczogRXJyb3IgZHVyaW5nIGxvZ2luIGNhbGwgLSBsb2dpbiBpcyBhbHJlYWR5IGluIHByb2dyZXNzLlwiXG4gICAgfSxcbiAgICBhY3F1aXJlVG9rZW5Qcm9ncmVzc0Vycm9yOiB7XG4gICAgICAgIGNvZGU6IFwiYWNxdWlyZXRva2VuX3Byb2dyZXNzX2Vycm9yXCIsXG4gICAgICAgIGRlc2M6IFwiQWNxdWlyZVRva2VuX0luX1Byb2dyZXNzOiBFcnJvciBkdXJpbmcgbG9naW4gY2FsbCAtIGxvZ2luIGlzIGFscmVhZHkgaW4gcHJvZ3Jlc3MuXCJcbiAgICB9LFxuICAgIHVzZXJDYW5jZWxsZWRFcnJvcjoge1xuICAgICAgICBjb2RlOiBcInVzZXJfY2FuY2VsbGVkXCIsXG4gICAgICAgIGRlc2M6IFwiVXNlciBjYW5jZWxsZWQgdGhlIGZsb3cuXCJcbiAgICB9LFxuICAgIGNhbGxiYWNrRXJyb3I6IHtcbiAgICAgICAgY29kZTogXCJjYWxsYmFja19lcnJvclwiLFxuICAgICAgICBkZXNjOiBcIkVycm9yIG9jY3VycmVkIGluIHRva2VuIHJlY2VpdmVkIGNhbGxiYWNrIGZ1bmN0aW9uLlwiXG4gICAgfSxcbiAgICB1c2VyTG9naW5SZXF1aXJlZEVycm9yOiB7XG4gICAgICAgIGNvZGU6IFwidXNlcl9sb2dpbl9lcnJvclwiLFxuICAgICAgICBkZXNjOiBcIlVzZXIgbG9naW4gaXMgcmVxdWlyZWQuXCJcbiAgICB9LFxuICAgIHVzZXJEb2VzTm90RXhpc3RFcnJvcjoge1xuICAgICAgICBjb2RlOiBcInVzZXJfbm9uX2V4aXN0ZW50XCIsXG4gICAgICAgIGRlc2M6IFwiVXNlciBvYmplY3QgZG9lcyBub3QgZXhpc3QuIFBsZWFzZSBjYWxsIGEgbG9naW4gQVBJLlwiXG4gICAgfSxcbiAgICBjbGllbnRJbmZvRGVjb2RpbmdFcnJvcjoge1xuICAgICAgICBjb2RlOiBcImNsaWVudF9pbmZvX2RlY29kaW5nX2Vycm9yXCIsXG4gICAgICAgIGRlc2M6IFwiVGhlIGNsaWVudCBpbmZvIGNvdWxkIG5vdCBiZSBwYXJzZWQvZGVjb2RlZCBjb3JyZWN0bHkuIFBsZWFzZSByZXZpZXcgdGhlIHRyYWNlIHRvIGRldGVybWluZSB0aGUgcm9vdCBjYXVzZS5cIlxuICAgIH0sXG4gICAgbnVsbE9yRW1wdHlJZFRva2VuOiB7XG4gICAgICAgIGNvZGU6IFwibnVsbF9vcl9lbXB0eV9pZF90b2tlblwiLFxuICAgICAgICBkZXNjOiBcIlRoZSBpZFRva2VuIGlzIG51bGwgb3IgZW1wdHkuIFBsZWFzZSByZXZpZXcgdGhlIHRyYWNlIHRvIGRldGVybWluZSB0aGUgcm9vdCBjYXVzZS5cIlxuICAgIH0sXG4gICAgaWRUb2tlbk5vdFBhcnNlZDoge1xuICAgICAgICBjb2RlOiBcImlkX3Rva2VuX3BhcnNpbmdfZXJyb3JcIixcbiAgICAgICAgZGVzYzogXCJJRCB0b2tlbiBjYW5ub3QgYmUgcGFyc2VkLiBQbGVhc2UgcmV2aWV3IHN0YWNrIHRyYWNlIHRvIGRldGVybWluZSByb290IGNhdXNlLlwiXG4gICAgfSxcbiAgICB0b2tlbkVuY29kaW5nRXJyb3I6IHtcbiAgICAgICAgY29kZTogXCJ0b2tlbl9lbmNvZGluZ19lcnJvclwiLFxuICAgICAgICBkZXNjOiBcIlRoZSB0b2tlbiB0byBiZSBkZWNvZGVkIGlzIG5vdCBlbmNvZGVkIGNvcnJlY3RseS5cIlxuICAgIH1cbn07XG5cbi8qKlxuICogRXJyb3IgdGhyb3duIHdoZW4gdGhlcmUgaXMgYW4gZXJyb3IgaW4gdGhlIGNsaWVudCBjb2RlIHJ1bm5pbmcgb24gdGhlIGJyb3dzZXIuXG4gKi9cbmV4cG9ydCBjbGFzcyBDbGllbnRBdXRoRXJyb3IgZXh0ZW5kcyBBdXRoRXJyb3Ige1xuXG4gICAgY29uc3RydWN0b3IoZXJyb3JDb2RlOiBzdHJpbmcsIGVycm9yTWVzc2FnZT86IHN0cmluZykge1xuICAgICAgICBzdXBlcihlcnJvckNvZGUsIGVycm9yTWVzc2FnZSk7XG4gICAgICAgIHRoaXMubmFtZSA9IFwiQ2xpZW50QXV0aEVycm9yXCI7XG5cbiAgICAgICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKHRoaXMsIENsaWVudEF1dGhFcnJvci5wcm90b3R5cGUpO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVFbmRwb2ludFJlc29sdXRpb25FcnJvcihlcnJEZXRhaWw/OiBzdHJpbmcpOiBDbGllbnRBdXRoRXJyb3Ige1xuICAgICAgICBsZXQgZXJyb3JNZXNzYWdlID0gQ2xpZW50QXV0aEVycm9yTWVzc2FnZS5lbmRwb2ludFJlc29sdXRpb25FcnJvci5kZXNjO1xuICAgICAgICBpZiAoZXJyRGV0YWlsICYmICFVdGlscy5pc0VtcHR5KGVyckRldGFpbCkpIHtcbiAgICAgICAgICAgIGVycm9yTWVzc2FnZSArPSBgIERldGFpbHM6ICR7ZXJyRGV0YWlsfWA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnRBdXRoRXJyb3IoQ2xpZW50QXV0aEVycm9yTWVzc2FnZS5lbmRwb2ludFJlc29sdXRpb25FcnJvci5jb2RlLCBlcnJvck1lc3NhZ2UpO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVNdWx0aXBsZU1hdGNoaW5nVG9rZW5zSW5DYWNoZUVycm9yKHNjb3BlOiBzdHJpbmcpOiBDbGllbnRBdXRoRXJyb3Ige1xuICAgICAgICByZXR1cm4gbmV3IENsaWVudEF1dGhFcnJvcihDbGllbnRBdXRoRXJyb3JNZXNzYWdlLm11bHRpcGxlTWF0Y2hpbmdUb2tlbnMuY29kZSxcbiAgICAgICAgICAgIGBDYWNoZSBlcnJvciBmb3Igc2NvcGUgJHtzY29wZX06ICR7Q2xpZW50QXV0aEVycm9yTWVzc2FnZS5tdWx0aXBsZU1hdGNoaW5nVG9rZW5zLmRlc2N9LmApO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVNdWx0aXBsZUF1dGhvcml0aWVzSW5DYWNoZUVycm9yKHNjb3BlOiBzdHJpbmcpOiBDbGllbnRBdXRoRXJyb3Ige1xuICAgICAgICByZXR1cm4gbmV3IENsaWVudEF1dGhFcnJvcihDbGllbnRBdXRoRXJyb3JNZXNzYWdlLm11bHRpcGxlQ2FjaGVBdXRob3JpdGllcy5jb2RlLFxuICAgICAgICAgICAgYENhY2hlIGVycm9yIGZvciBzY29wZSAke3Njb3BlfTogJHtDbGllbnRBdXRoRXJyb3JNZXNzYWdlLm11bHRpcGxlQ2FjaGVBdXRob3JpdGllcy5kZXNjfS5gKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlUG9wdXBXaW5kb3dFcnJvcihlcnJEZXRhaWw/OiBzdHJpbmcpOiBDbGllbnRBdXRoRXJyb3Ige1xuICAgICAgICB2YXIgZXJyb3JNZXNzYWdlID0gQ2xpZW50QXV0aEVycm9yTWVzc2FnZS5wb3BVcFdpbmRvd0Vycm9yLmRlc2M7XG4gICAgICAgIGlmIChlcnJEZXRhaWwgJiYgIVV0aWxzLmlzRW1wdHkoZXJyRGV0YWlsKSkge1xuICAgICAgICAgICAgZXJyb3JNZXNzYWdlICs9IGAgRGV0YWlsczogJHtlcnJEZXRhaWx9YDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IENsaWVudEF1dGhFcnJvcihDbGllbnRBdXRoRXJyb3JNZXNzYWdlLnBvcFVwV2luZG93RXJyb3IuY29kZSwgZXJyb3JNZXNzYWdlKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlVG9rZW5SZW5ld2FsVGltZW91dEVycm9yKCk6IENsaWVudEF1dGhFcnJvciB7XG4gICAgICAgIHJldHVybiBuZXcgQ2xpZW50QXV0aEVycm9yKENsaWVudEF1dGhFcnJvck1lc3NhZ2UudG9rZW5SZW5ld2FsRXJyb3IuY29kZSxcbiAgICAgICAgICAgIENsaWVudEF1dGhFcnJvck1lc3NhZ2UudG9rZW5SZW5ld2FsRXJyb3IuZGVzYyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZUludmFsaWRJZFRva2VuRXJyb3IoaWRUb2tlbjogSWRUb2tlbikgOiBDbGllbnRBdXRoRXJyb3Ige1xuICAgICAgICByZXR1cm4gbmV3IENsaWVudEF1dGhFcnJvcihDbGllbnRBdXRoRXJyb3JNZXNzYWdlLmludmFsaWRJZFRva2VuLmNvZGUsXG4gICAgICAgICAgICBgJHtDbGllbnRBdXRoRXJyb3JNZXNzYWdlLmludmFsaWRJZFRva2VuLmRlc2N9IEdpdmVuIHRva2VuOiAke2lkVG9rZW59YCk7XG4gICAgfVxuXG4gICAgLy9UT0RPOiBJcyB0aGlzIG5vdCBhIHNlY3VyaXR5IGZsYXcgdG8gc2VuZCB0aGUgdXNlciB0aGUgc3RhdGUgZXhwZWN0ZWQ/P1xuICAgIHN0YXRpYyBjcmVhdGVJbnZhbGlkU3RhdGVFcnJvcihpbnZhbGlkU3RhdGU6IHN0cmluZywgYWN0dWFsU3RhdGU6IHN0cmluZyk6IENsaWVudEF1dGhFcnJvciB7XG4gICAgICAgIHJldHVybiBuZXcgQ2xpZW50QXV0aEVycm9yKENsaWVudEF1dGhFcnJvck1lc3NhZ2UuaW52YWxpZFN0YXRlRXJyb3IuY29kZSxcbiAgICAgICAgICAgIGAke0NsaWVudEF1dGhFcnJvck1lc3NhZ2UuaW52YWxpZFN0YXRlRXJyb3IuZGVzY30gJHtpbnZhbGlkU3RhdGV9LCBzdGF0ZSBleHBlY3RlZCA6ICR7YWN0dWFsU3RhdGV9LmApO1xuICAgIH1cblxuICAgIC8vVE9ETzogSXMgdGhpcyBub3QgYSBzZWN1cml0eSBmbGF3IHRvIHNlbmQgdGhlIHVzZXIgdGhlIE5vbmNlIGV4cGVjdGVkPz9cbiAgICBzdGF0aWMgY3JlYXRlTm9uY2VNaXNtYXRjaEVycm9yKGludmFsaWROb25jZTogc3RyaW5nLCBhY3R1YWxOb25jZTogc3RyaW5nKTogQ2xpZW50QXV0aEVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnRBdXRoRXJyb3IoQ2xpZW50QXV0aEVycm9yTWVzc2FnZS5ub25jZU1pc21hdGNoRXJyb3IuY29kZSxcbiAgICAgICAgICAgIGAke0NsaWVudEF1dGhFcnJvck1lc3NhZ2Uubm9uY2VNaXNtYXRjaEVycm9yLmRlc2N9ICR7aW52YWxpZE5vbmNlfSwgbm9uY2UgZXhwZWN0ZWQgOiAke2FjdHVhbE5vbmNlfS5gKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlTG9naW5JblByb2dyZXNzRXJyb3IoKTogQ2xpZW50QXV0aEVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnRBdXRoRXJyb3IoQ2xpZW50QXV0aEVycm9yTWVzc2FnZS5sb2dpblByb2dyZXNzRXJyb3IuY29kZSxcbiAgICAgICAgICAgIENsaWVudEF1dGhFcnJvck1lc3NhZ2UubG9naW5Qcm9ncmVzc0Vycm9yLmRlc2MpO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVBY3F1aXJlVG9rZW5JblByb2dyZXNzRXJyb3IoKTogQ2xpZW50QXV0aEVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnRBdXRoRXJyb3IoQ2xpZW50QXV0aEVycm9yTWVzc2FnZS5hY3F1aXJlVG9rZW5Qcm9ncmVzc0Vycm9yLmNvZGUsXG4gICAgICAgICAgICBDbGllbnRBdXRoRXJyb3JNZXNzYWdlLmFjcXVpcmVUb2tlblByb2dyZXNzRXJyb3IuZGVzYyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZVVzZXJDYW5jZWxsZWRFcnJvcigpOiBDbGllbnRBdXRoRXJyb3Ige1xuICAgICAgICByZXR1cm4gbmV3IENsaWVudEF1dGhFcnJvcihDbGllbnRBdXRoRXJyb3JNZXNzYWdlLnVzZXJDYW5jZWxsZWRFcnJvci5jb2RlLFxuICAgICAgICAgICAgQ2xpZW50QXV0aEVycm9yTWVzc2FnZS51c2VyQ2FuY2VsbGVkRXJyb3IuZGVzYyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZUVycm9ySW5DYWxsYmFja0Z1bmN0aW9uKGVycm9yRGVzYzogc3RyaW5nKTogQ2xpZW50QXV0aEVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnRBdXRoRXJyb3IoQ2xpZW50QXV0aEVycm9yTWVzc2FnZS5jYWxsYmFja0Vycm9yLmNvZGUsXG4gICAgICAgICAgICBgJHtDbGllbnRBdXRoRXJyb3JNZXNzYWdlLmNhbGxiYWNrRXJyb3IuZGVzY30gJHtlcnJvckRlc2N9LmApO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVVc2VyTG9naW5SZXF1aXJlZEVycm9yKCkgOiBDbGllbnRBdXRoRXJyb3Ige1xuICAgICAgICByZXR1cm4gbmV3IENsaWVudEF1dGhFcnJvcihDbGllbnRBdXRoRXJyb3JNZXNzYWdlLnVzZXJMb2dpblJlcXVpcmVkRXJyb3IuY29kZSxcbiAgICAgICAgICAgIENsaWVudEF1dGhFcnJvck1lc3NhZ2UudXNlckxvZ2luUmVxdWlyZWRFcnJvci5kZXNjKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlVXNlckRvZXNOb3RFeGlzdEVycm9yKCkgOiBDbGllbnRBdXRoRXJyb3Ige1xuICAgICAgICByZXR1cm4gbmV3IENsaWVudEF1dGhFcnJvcihDbGllbnRBdXRoRXJyb3JNZXNzYWdlLnVzZXJEb2VzTm90RXhpc3RFcnJvci5jb2RlLFxuICAgICAgICAgICAgQ2xpZW50QXV0aEVycm9yTWVzc2FnZS51c2VyRG9lc05vdEV4aXN0RXJyb3IuZGVzYyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZUNsaWVudEluZm9EZWNvZGluZ0Vycm9yKGNhdWdodEVycm9yOiBzdHJpbmcpIDogQ2xpZW50QXV0aEVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnRBdXRoRXJyb3IoQ2xpZW50QXV0aEVycm9yTWVzc2FnZS5jbGllbnRJbmZvRGVjb2RpbmdFcnJvci5jb2RlLFxuICAgICAgICAgICAgYCR7Q2xpZW50QXV0aEVycm9yTWVzc2FnZS5jbGllbnRJbmZvRGVjb2RpbmdFcnJvci5kZXNjfSBGYWlsZWQgd2l0aCBlcnJvcjogJHtjYXVnaHRFcnJvcn1gKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlSWRUb2tlbk51bGxPckVtcHR5RXJyb3IoaW52YWxpZFJhd1Rva2VuU3RyaW5nOiBzdHJpbmcpIDogQ2xpZW50QXV0aEVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnRBdXRoRXJyb3IoQ2xpZW50QXV0aEVycm9yTWVzc2FnZS5udWxsT3JFbXB0eUlkVG9rZW4uY29kZSxcbiAgICAgICAgICAgIGAke0NsaWVudEF1dGhFcnJvck1lc3NhZ2UubnVsbE9yRW1wdHlJZFRva2VuLmRlc2N9IFJhdyBJRCBUb2tlbiBWYWx1ZTogJHtpbnZhbGlkUmF3VG9rZW5TdHJpbmd9YCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZUlkVG9rZW5QYXJzaW5nRXJyb3IoY2F1Z2h0UGFyc2luZ0Vycm9yOiBzdHJpbmcpIDogQ2xpZW50QXV0aEVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnRBdXRoRXJyb3IoQ2xpZW50QXV0aEVycm9yTWVzc2FnZS5pZFRva2VuTm90UGFyc2VkLmNvZGUsXG4gICAgICAgICAgICBgJHtDbGllbnRBdXRoRXJyb3JNZXNzYWdlLmlkVG9rZW5Ob3RQYXJzZWQuZGVzY30gRmFpbGVkIHdpdGggZXJyb3I6ICR7Y2F1Z2h0UGFyc2luZ0Vycm9yfWApO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVUb2tlbkVuY29kaW5nRXJyb3IoaW5jb3JyZWN0bHlFbmNvZGVkVG9rZW46IHN0cmluZykgOiBDbGllbnRBdXRoRXJyb3Ige1xuICAgICAgICByZXR1cm4gbmV3IENsaWVudEF1dGhFcnJvcihDbGllbnRBdXRoRXJyb3JNZXNzYWdlLnRva2VuRW5jb2RpbmdFcnJvci5jb2RlLFxuICAgICAgICAgICAgYCR7Q2xpZW50QXV0aEVycm9yTWVzc2FnZS50b2tlbkVuY29kaW5nRXJyb3IuZGVzY30gQXR0ZW1wdGVkIHRvIGRlY29kZTogJHtpbmNvcnJlY3RseUVuY29kZWRUb2tlbn1gKTtcbiAgICB9XG59XG4iLCIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cblxuaW1wb3J0IHsgQ29uc3RhbnRzIH0gZnJvbSBcIi4uL0NvbnN0YW50c1wiO1xuaW1wb3J0IHsgQ2xpZW50QXV0aEVycm9yIH0gZnJvbSBcIi4vQ2xpZW50QXV0aEVycm9yXCI7XG5cbmV4cG9ydCBjb25zdCBDbGllbnRDb25maWd1cmF0aW9uRXJyb3JNZXNzYWdlID0ge1xuICAgIGNvbmZpZ3VyYXRpb25Ob3RTZXQ6IHtcbiAgICAgICAgY29kZTogXCJub19jb25maWdfc2V0XCIsXG4gICAgICAgIGRlc2M6IFwiQ29uZmlndXJhdGlvbiBoYXMgbm90IGJlZW4gc2V0LiBQbGVhc2UgY2FsbCB0aGUgVXNlckFnZW50QXBwbGljYXRpb24gY29uc3RydWN0b3Igd2l0aCBhIHZhbGlkIENvbmZpZ3VyYXRpb24gb2JqZWN0LlwiXG4gICAgfSxcbiAgICBpbnZhbGlkQ2FjaGVMb2NhdGlvbjoge1xuICAgICAgICBjb2RlOiBcImludmFsaWRfY2FjaGVfbG9jYXRpb25cIixcbiAgICAgICAgZGVzYzogXCJUaGUgY2FjaGUgbG9jYXRpb24gcHJvdmlkZWQgaXMgbm90IHZhbGlkLlwiXG4gICAgfSxcbiAgICBub1N0b3JhZ2VTdXBwb3J0ZWQ6IHtcbiAgICAgICAgY29kZTogXCJicm93c2VyX3N0b3JhZ2Vfbm90X3N1cHBvcnRlZFwiLFxuICAgICAgICBkZXNjOiBcImxvY2FsU3RvcmFnZSBhbmQgc2Vzc2lvblN0b3JhZ2UgYXJlIG5vdCBzdXBwb3J0ZWQuXCJcbiAgICB9LFxuICAgIG5vUmVkaXJlY3RDYWxsYmFja3NTZXQ6IHtcbiAgICAgICAgY29kZTogXCJub19yZWRpcmVjdF9jYWxsYmFja3NcIixcbiAgICAgICAgZGVzYzogXCJObyByZWRpcmVjdCBjYWxsYmFja3MgaGF2ZSBiZWVuIHNldC4gUGxlYXNlIGNhbGwgc2V0UmVkaXJlY3RDYWxsYmFja3MoKSB3aXRoIHRoZSBhcHByb3ByaWF0ZSBmdW5jdGlvbiBhcmd1bWVudHMgYmVmb3JlIGNvbnRpbnVpbmcuIFwiICtcbiAgICAgICAgICAgIFwiTW9yZSBpbmZvcm1hdGlvbiBpcyBhdmFpbGFibGUgaGVyZTogaHR0cHM6Ly9naXRodWIuY29tL0F6dXJlQUQvbWljcm9zb2Z0LWF1dGhlbnRpY2F0aW9uLWxpYnJhcnktZm9yLWpzL3dpa2kvLWJhc2ljcy5cIlxuICAgIH0sXG4gICAgaW52YWxpZENhbGxiYWNrT2JqZWN0OiB7XG4gICAgICAgIGNvZGU6IFwiaW52YWxpZF9jYWxsYmFja19vYmplY3RcIixcbiAgICAgICAgZGVzYzogXCJUaGUgb2JqZWN0IHBhc3NlZCBmb3IgdGhlIGNhbGxiYWNrIHdhcyBpbnZhbGlkLiBcIiArXG4gICAgICAgICAgXCJNb3JlIGluZm9ybWF0aW9uIGlzIGF2YWlsYWJsZSBoZXJlOiBodHRwczovL2dpdGh1Yi5jb20vQXp1cmVBRC9taWNyb3NvZnQtYXV0aGVudGljYXRpb24tbGlicmFyeS1mb3ItanMvd2lraS8tYmFzaWNzLlwiXG4gICAgfSxcbiAgICBzY29wZXNSZXF1aXJlZDoge1xuICAgICAgICBjb2RlOiBcInNjb3Blc19yZXF1aXJlZFwiLFxuICAgICAgICBkZXNjOiBcIlNjb3BlcyBhcmUgcmVxdWlyZWQgdG8gb2J0YWluIGFuIGFjY2VzcyB0b2tlbi5cIlxuICAgIH0sXG4gICAgZW1wdHlTY29wZXM6IHtcbiAgICAgICAgY29kZTogXCJlbXB0eV9pbnB1dF9zY29wZXNfZXJyb3JcIixcbiAgICAgICAgZGVzYzogXCJTY29wZXMgY2Fubm90IGJlIHBhc3NlZCBhcyBlbXB0eSBhcnJheS5cIlxuICAgIH0sXG4gICAgbm9uQXJyYXlTY29wZXM6IHtcbiAgICAgICAgY29kZTogXCJub25hcnJheV9pbnB1dF9zY29wZXNfZXJyb3JcIixcbiAgICAgICAgZGVzYzogXCJTY29wZXMgY2Fubm90IGJlIHBhc3NlZCBhcyBub24tYXJyYXkuXCJcbiAgICB9LFxuICAgIGNsaWVudFNjb3BlOiB7XG4gICAgICAgIGNvZGU6IFwiY2xpZW50aWRfaW5wdXRfc2NvcGVzX2Vycm9yXCIsXG4gICAgICAgIGRlc2M6IFwiQ2xpZW50IElEIGNhbiBvbmx5IGJlIHByb3ZpZGVkIGFzIGEgc2luZ2xlIHNjb3BlLlwiXG4gICAgfSxcbiAgICBpbnZhbGlkUHJvbXB0OiB7XG4gICAgICAgIGNvZGU6IFwiaW52YWxpZF9wcm9tcHRfdmFsdWVcIixcbiAgICAgICAgZGVzYzogXCJTdXBwb3J0ZWQgcHJvbXB0IHZhbHVlcyBhcmUgJ2xvZ2luJywgJ3NlbGVjdF9hY2NvdW50JywgJ2NvbnNlbnQnIGFuZCAnbm9uZSdcIixcbiAgICB9LFxuICAgIGludmFsaWRBdXRob3JpdHlUeXBlOiB7XG4gICAgICAgIGNvZGU6IFwiaW52YWxpZF9hdXRob3JpdHlfdHlwZVwiLFxuICAgICAgICBkZXNjOiBcIlRoZSBnaXZlbiBhdXRob3JpdHkgaXMgbm90IGEgdmFsaWQgdHlwZSBvZiBhdXRob3JpdHkgc3VwcG9ydGVkIGJ5IE1TQUwuIFBsZWFzZSBzZWUgaGVyZSBmb3IgdmFsaWQgYXV0aG9yaXRpZXM6IDxpbnNlcnQgVVJMIGhlcmU+LlwiXG4gICAgfSxcbiAgICBhdXRob3JpdHlVcmlJbnNlY3VyZToge1xuICAgICAgICBjb2RlOiBcImF1dGhvcml0eV91cmlfaW5zZWN1cmVcIixcbiAgICAgICAgZGVzYzogXCJBdXRob3JpdHkgVVJJcyBtdXN0IHVzZSBodHRwcy5cIlxuICAgIH0sXG4gICAgYXV0aG9yaXR5VXJpSW52YWxpZFBhdGg6IHtcbiAgICAgICAgY29kZTogXCJhdXRob3JpdHlfdXJpX2ludmFsaWRfcGF0aFwiLFxuICAgICAgICBkZXNjOiBcIkdpdmVuIGF1dGhvcml0eSBVUkkgaXMgaW52YWxpZC5cIlxuICAgIH0sXG4gICAgdW5zdXBwb3J0ZWRBdXRob3JpdHlWYWxpZGF0aW9uOiB7XG4gICAgICAgIGNvZGU6IFwidW5zdXBwb3J0ZWRfYXV0aG9yaXR5X3ZhbGlkYXRpb25cIixcbiAgICAgICAgZGVzYzogXCJUaGUgYXV0aG9yaXR5IHZhbGlkYXRpb24gaXMgbm90IHN1cHBvcnRlZCBmb3IgdGhpcyBhdXRob3JpdHkgdHlwZS5cIlxuICAgIH0sXG4gICAgYjJjQXV0aG9yaXR5VXJpSW52YWxpZFBhdGg6IHtcbiAgICAgICAgY29kZTogXCJiMmNfYXV0aG9yaXR5X3VyaV9pbnZhbGlkX3BhdGhcIixcbiAgICAgICAgZGVzYzogXCJUaGUgZ2l2ZW4gVVJJIGZvciB0aGUgQjJDIGF1dGhvcml0eSBpcyBpbnZhbGlkLlwiXG4gICAgfSxcbn07XG5cbi8qKlxuICogRXJyb3IgdGhyb3duIHdoZW4gdGhlcmUgaXMgYW4gZXJyb3IgaW4gY29uZmlndXJhdGlvbiBvZiB0aGUgLmpzIGxpYnJhcnkuXG4gKi9cbmV4cG9ydCBjbGFzcyBDbGllbnRDb25maWd1cmF0aW9uRXJyb3IgZXh0ZW5kcyBDbGllbnRBdXRoRXJyb3Ige1xuXG4gICAgY29uc3RydWN0b3IoZXJyb3JDb2RlOiBzdHJpbmcsIGVycm9yTWVzc2FnZT86IHN0cmluZykge1xuICAgICAgICBzdXBlcihlcnJvckNvZGUsIGVycm9yTWVzc2FnZSk7XG4gICAgICAgIHRoaXMubmFtZSA9IFwiQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yXCI7XG4gICAgICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZih0aGlzLCBDbGllbnRDb25maWd1cmF0aW9uRXJyb3IucHJvdG90eXBlKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlTm9TZXRDb25maWd1cmF0aW9uRXJyb3IoKTogQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnRDb25maWd1cmF0aW9uRXJyb3IoQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yTWVzc2FnZS5jb25maWd1cmF0aW9uTm90U2V0LmNvZGUsXG4gICAgICAgICAgICBgJHtDbGllbnRDb25maWd1cmF0aW9uRXJyb3JNZXNzYWdlLmNvbmZpZ3VyYXRpb25Ob3RTZXQuZGVzY31gKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlSW52YWxpZENhY2hlTG9jYXRpb25Db25maWdFcnJvcihnaXZlbkNhY2hlTG9jYXRpb246IHN0cmluZyk6IENsaWVudENvbmZpZ3VyYXRpb25FcnJvciB7XG4gICAgICAgIHJldHVybiBuZXcgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yKENsaWVudENvbmZpZ3VyYXRpb25FcnJvck1lc3NhZ2UuaW52YWxpZENhY2hlTG9jYXRpb24uY29kZSxcbiAgICAgICAgICAgIGAke0NsaWVudENvbmZpZ3VyYXRpb25FcnJvck1lc3NhZ2UuaW52YWxpZENhY2hlTG9jYXRpb24uZGVzY30gUHJvdmlkZWQgdmFsdWU6ICR7Z2l2ZW5DYWNoZUxvY2F0aW9ufS4gUG9zc2libGUgdmFsdWVzIGFyZTogJHtDb25zdGFudHMuY2FjaGVMb2NhdGlvbkxvY2FsfSwgJHtDb25zdGFudHMuY2FjaGVMb2NhdGlvblNlc3Npb259LmApO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVOb1N0b3JhZ2VTdXBwb3J0ZWRFcnJvcigpIDogQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnRDb25maWd1cmF0aW9uRXJyb3IoQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yTWVzc2FnZS5ub1N0b3JhZ2VTdXBwb3J0ZWQuY29kZSxcbiAgICAgICAgICAgIENsaWVudENvbmZpZ3VyYXRpb25FcnJvck1lc3NhZ2Uubm9TdG9yYWdlU3VwcG9ydGVkLmRlc2MpO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVSZWRpcmVjdENhbGxiYWNrc05vdFNldEVycm9yKCk6IENsaWVudENvbmZpZ3VyYXRpb25FcnJvciB7XG4gICAgICAgIHJldHVybiBuZXcgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yKENsaWVudENvbmZpZ3VyYXRpb25FcnJvck1lc3NhZ2Uubm9SZWRpcmVjdENhbGxiYWNrc1NldC5jb2RlLCBDbGllbnRDb25maWd1cmF0aW9uRXJyb3JNZXNzYWdlLm5vUmVkaXJlY3RDYWxsYmFja3NTZXQuZGVzYyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZUludmFsaWRDYWxsYmFja09iamVjdEVycm9yKGNhbGxiYWNrVHlwZTogc3RyaW5nLCBjYWxsYmFja09iamVjdDogb2JqZWN0KTogQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnRDb25maWd1cmF0aW9uRXJyb3IoQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yTWVzc2FnZS5pbnZhbGlkQ2FsbGJhY2tPYmplY3QuY29kZSxcbiAgICAgICAgICAgIGAke0NsaWVudENvbmZpZ3VyYXRpb25FcnJvck1lc3NhZ2UuaW52YWxpZENhbGxiYWNrT2JqZWN0LmRlc2N9IEdpdmVuIHZhbHVlIGZvciAke2NhbGxiYWNrVHlwZX0gY2FsbGJhY2sgZnVuY3Rpb246ICR7Y2FsbGJhY2tPYmplY3R9YCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZUVtcHR5U2NvcGVzQXJyYXlFcnJvcihzY29wZXNWYWx1ZTogc3RyaW5nKTogQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDbGllbnRDb25maWd1cmF0aW9uRXJyb3IoQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yTWVzc2FnZS5lbXB0eVNjb3Blcy5jb2RlLFxuICAgICAgICAgICAgYCR7Q2xpZW50Q29uZmlndXJhdGlvbkVycm9yTWVzc2FnZS5lbXB0eVNjb3Blcy5kZXNjfSBHaXZlbiB2YWx1ZTogJHtzY29wZXNWYWx1ZX0uYCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZVNjb3Blc05vbkFycmF5RXJyb3Ioc2NvcGVzVmFsdWU6IHN0cmluZyk6IENsaWVudENvbmZpZ3VyYXRpb25FcnJvciB7XG4gICAgICAgIHJldHVybiBuZXcgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yKENsaWVudENvbmZpZ3VyYXRpb25FcnJvck1lc3NhZ2Uubm9uQXJyYXlTY29wZXMuY29kZSxcbiAgICAgICAgICAgIGAke0NsaWVudENvbmZpZ3VyYXRpb25FcnJvck1lc3NhZ2Uubm9uQXJyYXlTY29wZXMuZGVzY30gR2l2ZW4gdmFsdWU6ICR7c2NvcGVzVmFsdWV9LmApO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVDbGllbnRJZFNpbmdsZVNjb3BlRXJyb3Ioc2NvcGVzVmFsdWU6IHN0cmluZyk6IENsaWVudENvbmZpZ3VyYXRpb25FcnJvciB7XG4gICAgICAgIHJldHVybiBuZXcgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yKENsaWVudENvbmZpZ3VyYXRpb25FcnJvck1lc3NhZ2UuY2xpZW50U2NvcGUuY29kZSxcbiAgICAgICAgICAgIGAke0NsaWVudENvbmZpZ3VyYXRpb25FcnJvck1lc3NhZ2UuY2xpZW50U2NvcGUuZGVzY30gR2l2ZW4gdmFsdWU6ICR7c2NvcGVzVmFsdWV9LmApO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVTY29wZXNSZXF1aXJlZEVycm9yKHNjb3Blc1ZhbHVlOiBhbnkpOiBDbGllbnRDb25maWd1cmF0aW9uRXJyb3Ige1xuICAgICAgICByZXR1cm4gbmV3IENsaWVudENvbmZpZ3VyYXRpb25FcnJvcihDbGllbnRDb25maWd1cmF0aW9uRXJyb3JNZXNzYWdlLnNjb3Blc1JlcXVpcmVkLmNvZGUsXG4gICAgICAgICAgICBgJHtDbGllbnRDb25maWd1cmF0aW9uRXJyb3JNZXNzYWdlLnNjb3Blc1JlcXVpcmVkLmRlc2N9IEdpdmVuIHZhbHVlOiAke3Njb3Blc1ZhbHVlfWApO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVJbnZhbGlkUHJvbXB0RXJyb3IocHJvbXB0VmFsdWU6IGFueSk6IENsaWVudENvbmZpZ3VyYXRpb25FcnJvciB7XG4gICAgICAgIHJldHVybiBuZXcgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yKENsaWVudENvbmZpZ3VyYXRpb25FcnJvck1lc3NhZ2UuaW52YWxpZFByb21wdC5jb2RlLFxuICAgICAgICAgICAgYCR7Q2xpZW50Q29uZmlndXJhdGlvbkVycm9yTWVzc2FnZS5pbnZhbGlkUHJvbXB0LmRlc2N9IEdpdmVuIHZhbHVlOiAke3Byb21wdFZhbHVlfWApO1xuICAgIH1cbn1cbiIsIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuXG5leHBvcnQgY29uc3QgQXV0aEVycm9yTWVzc2FnZSA9IHtcbiAgICB1bmV4cGVjdGVkRXJyb3I6IHtcbiAgICAgICAgY29kZTogXCJ1bmV4cGVjdGVkX2Vycm9yXCIsXG4gICAgICAgIGRlc2M6IFwiVW5leHBlY3RlZCBlcnJvciBpbiBhdXRoZW50aWNhdGlvbi5cIlxuICAgIH1cbn07XG5cbi8qKlxuKiBHZW5lcmFsIGVycm9yIGNsYXNzIHRocm93biBieSB0aGUgTVNBTC5qcyBsaWJyYXJ5LlxuKi9cbmV4cG9ydCBjbGFzcyBBdXRoRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG5cbiAgICBlcnJvckNvZGU6IHN0cmluZztcbiAgICBlcnJvck1lc3NhZ2U6IHN0cmluZztcblxuICAgIGNvbnN0cnVjdG9yKGVycm9yQ29kZTogc3RyaW5nLCBlcnJvck1lc3NhZ2U/OiBzdHJpbmcpIHtcbiAgICAgICAgc3VwZXIoZXJyb3JNZXNzYWdlKTtcbiAgICAgICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKHRoaXMsIEF1dGhFcnJvci5wcm90b3R5cGUpO1xuXG4gICAgICAgIHRoaXMuZXJyb3JDb2RlID0gZXJyb3JDb2RlO1xuICAgICAgICB0aGlzLmVycm9yTWVzc2FnZSA9IGVycm9yTWVzc2FnZTtcbiAgICAgICAgdGhpcy5uYW1lID0gXCJBdXRoRXJyb3JcIjtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlVW5leHBlY3RlZEVycm9yKGVyckRlc2M6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gbmV3IEF1dGhFcnJvcihBdXRoRXJyb3JNZXNzYWdlLnVuZXhwZWN0ZWRFcnJvci5jb2RlLCBgJHtBdXRoRXJyb3JNZXNzYWdlLnVuZXhwZWN0ZWRFcnJvci5kZXNjfTogJHtlcnJEZXNjfWApO1xuICAgIH1cbn1cbiIsIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuXG5pbXBvcnQgeyBJVXJpIH0gZnJvbSBcIi4vSVVyaVwiO1xuaW1wb3J0IHsgVXRpbHMgfSBmcm9tIFwiLi9VdGlsc1wiO1xuaW1wb3J0IHsgSVRlbmFudERpc2NvdmVyeVJlc3BvbnNlIH0gZnJvbSBcIi4vSVRlbmFudERpc2NvdmVyeVJlc3BvbnNlXCI7XG5pbXBvcnQgeyBDbGllbnRDb25maWd1cmF0aW9uRXJyb3JNZXNzYWdlIH0gZnJvbSBcIi4vZXJyb3IvQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yXCI7XG5pbXBvcnQgeyBYaHJDbGllbnQgfSBmcm9tIFwiLi9YSFJDbGllbnRcIjtcblxuLyoqXG4gKiBAaGlkZGVuXG4gKi9cbmV4cG9ydCBlbnVtIEF1dGhvcml0eVR5cGUge1xuICBBYWQsXG4gIEFkZnMsXG4gIEIyQ1xufVxuXG4vKipcbiAqIEBoaWRkZW5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEF1dGhvcml0eSB7XG4gIGNvbnN0cnVjdG9yKGF1dGhvcml0eTogc3RyaW5nLCB2YWxpZGF0ZUF1dGhvcml0eTogYm9vbGVhbikge1xuICAgIHRoaXMuSXNWYWxpZGF0aW9uRW5hYmxlZCA9IHZhbGlkYXRlQXV0aG9yaXR5O1xuICAgIHRoaXMuQ2Fub25pY2FsQXV0aG9yaXR5ID0gYXV0aG9yaXR5O1xuXG4gICAgdGhpcy52YWxpZGF0ZUFzVXJpKCk7XG4gIH1cblxuICBwdWJsaWMgYWJzdHJhY3QgZ2V0IEF1dGhvcml0eVR5cGUoKTogQXV0aG9yaXR5VHlwZTtcblxuICBwdWJsaWMgSXNWYWxpZGF0aW9uRW5hYmxlZDogYm9vbGVhbjtcblxuICBwdWJsaWMgZ2V0IFRlbmFudCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLkNhbm9uaWNhbEF1dGhvcml0eVVybENvbXBvbmVudHMuUGF0aFNlZ21lbnRzWzBdO1xuICB9XG5cbiAgcHJpdmF0ZSB0ZW5hbnREaXNjb3ZlcnlSZXNwb25zZTogSVRlbmFudERpc2NvdmVyeVJlc3BvbnNlO1xuXG4gIHB1YmxpYyBnZXQgQXV0aG9yaXphdGlvbkVuZHBvaW50KCk6IHN0cmluZyB7XG4gICAgdGhpcy52YWxpZGF0ZVJlc29sdmVkKCk7XG4gICAgcmV0dXJuIHRoaXMudGVuYW50RGlzY292ZXJ5UmVzcG9uc2UuQXV0aG9yaXphdGlvbkVuZHBvaW50LnJlcGxhY2UoXCJ7dGVuYW50fVwiLCB0aGlzLlRlbmFudCk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IEVuZFNlc3Npb25FbmRwb2ludCgpOiBzdHJpbmcge1xuICAgIHRoaXMudmFsaWRhdGVSZXNvbHZlZCgpO1xuICAgIHJldHVybiB0aGlzLnRlbmFudERpc2NvdmVyeVJlc3BvbnNlLkVuZFNlc3Npb25FbmRwb2ludC5yZXBsYWNlKFwie3RlbmFudH1cIiwgdGhpcy5UZW5hbnQpO1xuICB9XG5cbiAgcHVibGljIGdldCBTZWxmU2lnbmVkSnd0QXVkaWVuY2UoKTogc3RyaW5nIHtcbiAgICB0aGlzLnZhbGlkYXRlUmVzb2x2ZWQoKTtcbiAgICByZXR1cm4gdGhpcy50ZW5hbnREaXNjb3ZlcnlSZXNwb25zZS5Jc3N1ZXIucmVwbGFjZShcInt0ZW5hbnR9XCIsIHRoaXMuVGVuYW50KTtcbiAgfVxuXG4gIHByaXZhdGUgdmFsaWRhdGVSZXNvbHZlZCgpIHtcbiAgICBpZiAoIXRoaXMudGVuYW50RGlzY292ZXJ5UmVzcG9uc2UpIHtcbiAgICAgIHRocm93IFwiUGxlYXNlIGNhbGwgUmVzb2x2ZUVuZHBvaW50c0FzeW5jIGZpcnN0XCI7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEEgVVJMIHRoYXQgaXMgdGhlIGF1dGhvcml0eSBzZXQgYnkgdGhlIGRldmVsb3BlclxuICAgKi9cbiAgcHVibGljIGdldCBDYW5vbmljYWxBdXRob3JpdHkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5jYW5vbmljYWxBdXRob3JpdHk7XG4gIH1cblxuICBwdWJsaWMgc2V0IENhbm9uaWNhbEF1dGhvcml0eSh1cmw6IHN0cmluZykge1xuICAgIHRoaXMuY2Fub25pY2FsQXV0aG9yaXR5ID0gVXRpbHMuQ2Fub25pY2FsaXplVXJpKHVybCk7XG4gICAgdGhpcy5jYW5vbmljYWxBdXRob3JpdHlVcmxDb21wb25lbnRzID0gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgY2Fub25pY2FsQXV0aG9yaXR5OiBzdHJpbmc7XG4gIHByaXZhdGUgY2Fub25pY2FsQXV0aG9yaXR5VXJsQ29tcG9uZW50czogSVVyaTtcblxuICBwdWJsaWMgZ2V0IENhbm9uaWNhbEF1dGhvcml0eVVybENvbXBvbmVudHMoKTogSVVyaSB7XG4gICAgaWYgKCF0aGlzLmNhbm9uaWNhbEF1dGhvcml0eVVybENvbXBvbmVudHMpIHtcbiAgICAgIHRoaXMuY2Fub25pY2FsQXV0aG9yaXR5VXJsQ29tcG9uZW50cyA9IFV0aWxzLkdldFVybENvbXBvbmVudHModGhpcy5DYW5vbmljYWxBdXRob3JpdHkpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmNhbm9uaWNhbEF1dGhvcml0eVVybENvbXBvbmVudHM7XG4gIH1cblxuICAvKipcbiAgICogLy8gaHR0cDovL29wZW5pZC5uZXQvc3BlY3Mvb3BlbmlkLWNvbm5lY3QtZGlzY292ZXJ5LTFfMC5odG1sI1Byb3ZpZGVyTWV0YWRhdGFcbiAgICovXG4gIHByb3RlY3RlZCBnZXQgRGVmYXVsdE9wZW5JZENvbmZpZ3VyYXRpb25FbmRwb2ludCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHt0aGlzLkNhbm9uaWNhbEF1dGhvcml0eX12Mi4wLy53ZWxsLWtub3duL29wZW5pZC1jb25maWd1cmF0aW9uYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlbiBhIHN0cmluZywgdmFsaWRhdGUgdGhhdCBpdCBpcyBvZiB0aGUgZm9ybSBodHRwczovL2RvbWFpbi9wYXRoXG4gICAqL1xuICBwcml2YXRlIHZhbGlkYXRlQXNVcmkoKSB7XG4gICAgbGV0IGNvbXBvbmVudHM7XG4gICAgdHJ5IHtcbiAgICAgIGNvbXBvbmVudHMgPSB0aGlzLkNhbm9uaWNhbEF1dGhvcml0eVVybENvbXBvbmVudHM7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yTWVzc2FnZS5pbnZhbGlkQXV0aG9yaXR5VHlwZTtcbiAgICB9XG5cbiAgICBpZiAoIWNvbXBvbmVudHMuUHJvdG9jb2wgfHwgY29tcG9uZW50cy5Qcm90b2NvbC50b0xvd2VyQ2FzZSgpICE9PSBcImh0dHBzOlwiKSB7XG4gICAgICB0aHJvdyBDbGllbnRDb25maWd1cmF0aW9uRXJyb3JNZXNzYWdlLmF1dGhvcml0eVVyaUluc2VjdXJlO1xuICAgIH1cblxuICAgIGlmICghY29tcG9uZW50cy5QYXRoU2VnbWVudHMgfHwgY29tcG9uZW50cy5QYXRoU2VnbWVudHMubGVuZ3RoIDwgMSkge1xuICAgICAgdGhyb3cgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yTWVzc2FnZS5hdXRob3JpdHlVcmlJbnZhbGlkUGF0aDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbHMgdGhlIE9JREMgZW5kcG9pbnQgYW5kIHJldHVybnMgdGhlIHJlc3BvbnNlXG4gICAqL1xuICBwcml2YXRlIERpc2NvdmVyRW5kcG9pbnRzKG9wZW5JZENvbmZpZ3VyYXRpb25FbmRwb2ludDogc3RyaW5nKTogUHJvbWlzZTxJVGVuYW50RGlzY292ZXJ5UmVzcG9uc2U+IHtcbiAgICBjb25zdCBjbGllbnQgPSBuZXcgWGhyQ2xpZW50KCk7XG4gICAgcmV0dXJuIGNsaWVudC5zZW5kUmVxdWVzdEFzeW5jKG9wZW5JZENvbmZpZ3VyYXRpb25FbmRwb2ludCwgXCJHRVRcIiwgLyplbmFibGVDYWNoaW5nOiAqLyB0cnVlKVxuICAgICAgICAudGhlbigocmVzcG9uc2U6IGFueSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIDxJVGVuYW50RGlzY292ZXJ5UmVzcG9uc2U+e1xuICAgICAgICAgICAgICAgIEF1dGhvcml6YXRpb25FbmRwb2ludDogcmVzcG9uc2UuYXV0aG9yaXphdGlvbl9lbmRwb2ludCxcbiAgICAgICAgICAgICAgICBFbmRTZXNzaW9uRW5kcG9pbnQ6IHJlc3BvbnNlLmVuZF9zZXNzaW9uX2VuZHBvaW50LFxuICAgICAgICAgICAgICAgIElzc3VlcjogcmVzcG9uc2UuaXNzdWVyXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcHJvbWlzZS5cbiAgICogQ2hlY2tzIHRvIHNlZSBpZiB0aGUgYXV0aG9yaXR5IGlzIGluIHRoZSBjYWNoZVxuICAgKiBEaXNjb3ZlciBlbmRwb2ludHMgdmlhIG9wZW5pZC1jb25maWd1cmF0aW9uXG4gICAqIElmIHN1Y2Nlc3NmdWwsIGNhY2hlcyB0aGUgZW5kcG9pbnQgZm9yIGxhdGVyIHVzZSBpbiBPSURDXG4gICAqL1xuICBwdWJsaWMgcmVzb2x2ZUVuZHBvaW50c0FzeW5jKCk6IFByb21pc2U8QXV0aG9yaXR5PiB7XG4gICAgbGV0IG9wZW5JZENvbmZpZ3VyYXRpb25FbmRwb2ludCA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMuR2V0T3BlbklkQ29uZmlndXJhdGlvbkVuZHBvaW50QXN5bmMoKS50aGVuKG9wZW5JZENvbmZpZ3VyYXRpb25FbmRwb2ludFJlc3BvbnNlID0+IHtcbiAgICAgIG9wZW5JZENvbmZpZ3VyYXRpb25FbmRwb2ludCA9IG9wZW5JZENvbmZpZ3VyYXRpb25FbmRwb2ludFJlc3BvbnNlO1xuICAgICAgcmV0dXJuIHRoaXMuRGlzY292ZXJFbmRwb2ludHMob3BlbklkQ29uZmlndXJhdGlvbkVuZHBvaW50KTtcbiAgICB9KS50aGVuKCh0ZW5hbnREaXNjb3ZlcnlSZXNwb25zZTogSVRlbmFudERpc2NvdmVyeVJlc3BvbnNlKSA9PiB7XG4gICAgICB0aGlzLnRlbmFudERpc2NvdmVyeVJlc3BvbnNlID0gdGVuYW50RGlzY292ZXJ5UmVzcG9uc2U7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcHJvbWlzZSB3aXRoIHRoZSBUZW5hbnREaXNjb3ZlcnlFbmRwb2ludFxuICAgKi9cbiAgcHVibGljIGFic3RyYWN0IEdldE9wZW5JZENvbmZpZ3VyYXRpb25FbmRwb2ludEFzeW5jKCk6IFByb21pc2U8c3RyaW5nPjtcbn1cbiIsIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuXG5pbXBvcnQgeyBVdGlscyB9IGZyb20gXCIuL1V0aWxzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUxvZ2dlckNhbGxiYWNrIHtcbiAgKGxldmVsOiBMb2dMZXZlbCwgbWVzc2FnZTogc3RyaW5nLCBjb250YWluc1BpaTogYm9vbGVhbik6IHZvaWQ7XG59XG5cbmV4cG9ydCBlbnVtIExvZ0xldmVsIHtcbiAgRXJyb3IsXG4gIFdhcm5pbmcsXG4gIEluZm8sXG4gIFZlcmJvc2Vcbn1cblxuZXhwb3J0IGNsYXNzIExvZ2dlciB7Ly8gU2luZ2xldG9uIENsYXNzXG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIC8vIFRPRE86IFRoaXMgZG9lcyBub3Qgc2VlbSB0byBiZSBhIHNpbmdsZXRvbiEhIENoYW5nZSBvciBEZWxldGUuXG4gIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBMb2dnZXI7XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHByaXZhdGUgY29ycmVsYXRpb25JZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcml2YXRlIGxldmVsOiBMb2dMZXZlbCA9IExvZ0xldmVsLkluZm87XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHByaXZhdGUgcGlpTG9nZ2luZ0VuYWJsZWQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHByaXZhdGUgbG9jYWxDYWxsYmFjazogSUxvZ2dlckNhbGxiYWNrO1xuXG4gIGNvbnN0cnVjdG9yKGxvY2FsQ2FsbGJhY2s6IElMb2dnZXJDYWxsYmFjayxcbiAgICAgIG9wdGlvbnM6XG4gICAgICB7XG4gICAgICAgICAgY29ycmVsYXRpb25JZD86IHN0cmluZyxcbiAgICAgICAgICBsZXZlbD86IExvZ0xldmVsLFxuICAgICAgICAgIHBpaUxvZ2dpbmdFbmFibGVkPzogYm9vbGVhbixcbiAgICAgIH0gPSB7fSkge1xuICAgICAgY29uc3Qge1xuICAgICAgICAgIGNvcnJlbGF0aW9uSWQgPSBcIlwiLFxuICAgICAgICAgIGxldmVsID0gTG9nTGV2ZWwuSW5mbyxcbiAgICAgICAgICBwaWlMb2dnaW5nRW5hYmxlZCA9IGZhbHNlXG4gICAgICB9ID0gb3B0aW9ucztcblxuICAgICAgdGhpcy5sb2NhbENhbGxiYWNrID0gbG9jYWxDYWxsYmFjaztcbiAgICAgIHRoaXMuY29ycmVsYXRpb25JZCA9IGNvcnJlbGF0aW9uSWQ7XG4gICAgICB0aGlzLmxldmVsID0gbGV2ZWw7XG4gICAgICB0aGlzLnBpaUxvZ2dpbmdFbmFibGVkID0gcGlpTG9nZ2luZ0VuYWJsZWQ7XG4gIH1cblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgcHJpdmF0ZSBsb2dNZXNzYWdlKGxvZ0xldmVsOiBMb2dMZXZlbCwgbG9nTWVzc2FnZTogc3RyaW5nLCBjb250YWluc1BpaTogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmICgobG9nTGV2ZWwgPiB0aGlzLmxldmVsKSB8fCAoIXRoaXMucGlpTG9nZ2luZ0VuYWJsZWQgJiYgY29udGFpbnNQaWkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9VVENTdHJpbmcoKTtcbiAgICBsZXQgbG9nOiBzdHJpbmc7XG4gICAgaWYgKCFVdGlscy5pc0VtcHR5KHRoaXMuY29ycmVsYXRpb25JZCkpIHtcbiAgICAgIGxvZyA9IHRpbWVzdGFtcCArIFwiOlwiICsgdGhpcy5jb3JyZWxhdGlvbklkICsgXCItXCIgKyBVdGlscy5nZXRMaWJyYXJ5VmVyc2lvbigpICsgXCItXCIgKyBMb2dMZXZlbFtsb2dMZXZlbF0gKyBcIiBcIiArIGxvZ01lc3NhZ2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbG9nID0gdGltZXN0YW1wICsgXCI6XCIgKyBVdGlscy5nZXRMaWJyYXJ5VmVyc2lvbigpICsgXCItXCIgKyBMb2dMZXZlbFtsb2dMZXZlbF0gKyBcIiBcIiArIGxvZ01lc3NhZ2U7XG4gICAgfVxuICAgIHRoaXMuZXhlY3V0ZUNhbGxiYWNrKGxvZ0xldmVsLCBsb2csIGNvbnRhaW5zUGlpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBleGVjdXRlQ2FsbGJhY2sobGV2ZWw6IExvZ0xldmVsLCBtZXNzYWdlOiBzdHJpbmcsIGNvbnRhaW5zUGlpOiBib29sZWFuKSB7XG4gICAgaWYgKHRoaXMubG9jYWxDYWxsYmFjaykge1xuICAgICAgdGhpcy5sb2NhbENhbGxiYWNrKGxldmVsLCBtZXNzYWdlLCBjb250YWluc1BpaSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIGVycm9yKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMubG9nTWVzc2FnZShMb2dMZXZlbC5FcnJvciwgbWVzc2FnZSwgZmFsc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIGVycm9yUGlpKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMubG9nTWVzc2FnZShMb2dMZXZlbC5FcnJvciwgbWVzc2FnZSwgdHJ1ZSk7XG4gIH1cblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgd2FybmluZyhtZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmxvZ01lc3NhZ2UoTG9nTGV2ZWwuV2FybmluZywgbWVzc2FnZSwgZmFsc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHdhcm5pbmdQaWkobWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5sb2dNZXNzYWdlKExvZ0xldmVsLldhcm5pbmcsIG1lc3NhZ2UsIHRydWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIGluZm8obWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5sb2dNZXNzYWdlKExvZ0xldmVsLkluZm8sIG1lc3NhZ2UsIGZhbHNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBpbmZvUGlpKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMubG9nTWVzc2FnZShMb2dMZXZlbC5JbmZvLCBtZXNzYWdlLCB0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICB2ZXJib3NlKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMubG9nTWVzc2FnZShMb2dMZXZlbC5WZXJib3NlLCBtZXNzYWdlLCBmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgdmVyYm9zZVBpaShtZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmxvZ01lc3NhZ2UoTG9nTGV2ZWwuVmVyYm9zZSwgbWVzc2FnZSwgdHJ1ZSk7XG4gIH1cbn1cbiIsIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuXG5pbXBvcnQgeyBBdXRoRXJyb3IgfSBmcm9tIFwiLi9BdXRoRXJyb3JcIjtcblxuZXhwb3J0IGNvbnN0IFNlcnZlckVycm9yTWVzc2FnZSA9IHtcbiAgICBzZXJ2ZXJVbmF2YWlsYWJsZToge1xuICAgICAgICBjb2RlOiBcInNlcnZlcl91bmF2YWlsYWJsZVwiLFxuICAgICAgICBkZXNjOiBcIlNlcnZlciBpcyB0ZW1wb3JhcmlseSB1bmF2YWlsYWJsZS5cIlxuICAgIH0sXG4gICAgdW5rbm93blNlcnZlckVycm9yOiB7XG4gICAgICAgIGNvZGU6IFwidW5rbm93bl9zZXJ2ZXJfZXJyb3JcIlxuICAgIH0sXG59O1xuXG4vKipcbiAqIEVycm9yIHRocm93biB3aGVuIHRoZXJlIGlzIGFuIGVycm9yIHdpdGggdGhlIHNlcnZlciBjb2RlLCBmb3IgZXhhbXBsZSwgdW5hdmFpbGFiaWxpdHkuXG4gKi9cbmV4cG9ydCBjbGFzcyBTZXJ2ZXJFcnJvciBleHRlbmRzIEF1dGhFcnJvciB7XG5cbiAgICBjb25zdHJ1Y3RvcihlcnJvckNvZGU6IHN0cmluZywgZXJyb3JNZXNzYWdlPzogc3RyaW5nKSB7XG4gICAgICAgIHN1cGVyKGVycm9yQ29kZSwgZXJyb3JNZXNzYWdlKTtcbiAgICAgICAgdGhpcy5uYW1lID0gXCJTZXJ2ZXJFcnJvclwiO1xuXG4gICAgICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZih0aGlzLCBTZXJ2ZXJFcnJvci5wcm90b3R5cGUpO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVTZXJ2ZXJVbmF2YWlsYWJsZUVycm9yKCk6IFNlcnZlckVycm9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTZXJ2ZXJFcnJvcihTZXJ2ZXJFcnJvck1lc3NhZ2Uuc2VydmVyVW5hdmFpbGFibGUuY29kZSxcbiAgICAgICAgICAgIFNlcnZlckVycm9yTWVzc2FnZS5zZXJ2ZXJVbmF2YWlsYWJsZS5kZXNjKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlVW5rbm93blNlcnZlckVycm9yKGVycm9yRGVzYzogc3RyaW5nKTogU2VydmVyRXJyb3Ige1xuICAgICAgICByZXR1cm4gbmV3IFNlcnZlckVycm9yKFNlcnZlckVycm9yTWVzc2FnZS51bmtub3duU2VydmVyRXJyb3IuY29kZSxcbiAgICAgICAgICAgIGVycm9yRGVzYyk7XG4gICAgfVxufVxuIiwiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cclxuXHJcbmltcG9ydCB7IEFjY2Vzc1Rva2VuQ2FjaGVJdGVtIH0gZnJvbSBcIi4vQWNjZXNzVG9rZW5DYWNoZUl0ZW1cIjtcclxuaW1wb3J0IHsgQWNjZXNzVG9rZW5LZXkgfSBmcm9tIFwiLi9BY2Nlc3NUb2tlbktleVwiO1xyXG5pbXBvcnQgeyBBY2Nlc3NUb2tlblZhbHVlIH0gZnJvbSBcIi4vQWNjZXNzVG9rZW5WYWx1ZVwiO1xyXG5pbXBvcnQgeyBTZXJ2ZXJSZXF1ZXN0UGFyYW1ldGVycyB9IGZyb20gXCIuL1NlcnZlclJlcXVlc3RQYXJhbWV0ZXJzXCI7XHJcbmltcG9ydCB7IEF1dGhvcml0eSB9IGZyb20gXCIuL0F1dGhvcml0eVwiO1xyXG5pbXBvcnQgeyBDbGllbnRJbmZvIH0gZnJvbSBcIi4vQ2xpZW50SW5mb1wiO1xyXG5pbXBvcnQgeyBDb25zdGFudHMsIFNTT1R5cGVzLCBQcm9tcHRTdGF0ZSB9IGZyb20gXCIuL0NvbnN0YW50c1wiO1xyXG5pbXBvcnQgeyBJZFRva2VuIH0gZnJvbSBcIi4vSWRUb2tlblwiO1xyXG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiLi9Mb2dnZXJcIjtcclxuaW1wb3J0IHsgU3RvcmFnZSB9IGZyb20gXCIuL1N0b3JhZ2VcIjtcclxuaW1wb3J0IHsgQWNjb3VudCB9IGZyb20gXCIuL0FjY291bnRcIjtcclxuaW1wb3J0IHsgVXRpbHMgfSBmcm9tIFwiLi9VdGlsc1wiO1xyXG5pbXBvcnQgeyBBdXRob3JpdHlGYWN0b3J5IH0gZnJvbSBcIi4vQXV0aG9yaXR5RmFjdG9yeVwiO1xyXG5pbXBvcnQgeyBDb25maWd1cmF0aW9uLCBidWlsZENvbmZpZ3VyYXRpb24gfSBmcm9tIFwiLi9Db25maWd1cmF0aW9uXCI7XHJcbmltcG9ydCB7IEF1dGhlbnRpY2F0aW9uUGFyYW1ldGVycywgUVBEaWN0IH0gZnJvbSBcIi4vQXV0aGVudGljYXRpb25QYXJhbWV0ZXJzXCI7XHJcbmltcG9ydCB7IENsaWVudENvbmZpZ3VyYXRpb25FcnJvciB9IGZyb20gXCIuL2Vycm9yL0NsaWVudENvbmZpZ3VyYXRpb25FcnJvclwiO1xyXG5pbXBvcnQgeyBBdXRoRXJyb3IgfSBmcm9tIFwiLi9lcnJvci9BdXRoRXJyb3JcIjtcclxuaW1wb3J0IHsgQ2xpZW50QXV0aEVycm9yLCBDbGllbnRBdXRoRXJyb3JNZXNzYWdlIH0gZnJvbSBcIi4vZXJyb3IvQ2xpZW50QXV0aEVycm9yXCI7XHJcbmltcG9ydCB7IFNlcnZlckVycm9yIH0gZnJvbSBcIi4vZXJyb3IvU2VydmVyRXJyb3JcIjtcclxuaW1wb3J0IHsgSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvciB9IGZyb20gXCIuL2Vycm9yL0ludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3JcIjtcclxuaW1wb3J0IHsgQXV0aFJlc3BvbnNlIH0gZnJvbSBcIi4vQXV0aFJlc3BvbnNlXCI7XHJcblxyXG4vLyBkZWZhdWx0IGF1dGhvcml0eVxyXG4vKipcclxuICogQHBhcmFtIHtzdHJpbmd9IGF1dGhvcml0eSAtIEEgVVJMIGluZGljYXRpbmcgYSBkaXJlY3RvcnkgdGhhdCBNU0FMIGNhbiB1c2UgdG8gb2J0YWluIHRva2Vucy5cclxuICogLSBJbiBBenVyZSBBRCwgaXQgaXMgb2YgdGhlIGZvcm0gaHR0cHM6Ly8mbHQ7dGVuYW50Jmd0Oy8mbHQ7dGVuYW50Jmd0Oywgd2hlcmUgJmx0O3RlbmFudCZndDsgaXMgdGhlIGRpcmVjdG9yeSBob3N0IChlLmcuIGh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbSkgYW5kICZsdDt0ZW5hbnQmZ3Q7IGlzIGEgaWRlbnRpZmllciB3aXRoaW4gdGhlIGRpcmVjdG9yeSBpdHNlbGYgKGUuZy4gYSBkb21haW4gYXNzb2NpYXRlZCB0byB0aGUgdGVuYW50LCBzdWNoIGFzIGNvbnRvc28ub25taWNyb3NvZnQuY29tLCBvciB0aGUgR1VJRCByZXByZXNlbnRpbmcgdGhlIFRlbmFudElEIHByb3BlcnR5IG9mIHRoZSBkaXJlY3RvcnkpXHJcbiAqIC0gSW4gQXp1cmUgQjJDLCBpdCBpcyBvZiB0aGUgZm9ybSBodHRwczovLyZsdDtpbnN0YW5jZSZndDsvdGZwLyZsdDt0ZW5hbnQmZ3Q7Lzxwb2xpY3lOYW1lPi9cclxuICogLSBEZWZhdWx0IHZhbHVlIGlzOiBcImh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbS9jb21tb25cIlxyXG4gKi9cclxuY29uc3QgREVGQVVMVF9BVVRIT1JJVFkgPSBcImh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbS9jb21tb25cIjtcclxuXHJcbi8qKlxyXG4gKiBJbnRlcmZhY2UgdG8gaGFuZGxlIGlGcmFtZSBnZW5lcmF0aW9uLCBQb3B1cCBXaW5kb3cgY3JlYXRpb24gYW5kIHJlZGlyZWN0IGhhbmRsaW5nXHJcbiAqL1xyXG5kZWNsYXJlIGdsb2JhbCB7XHJcbiAgICBpbnRlcmZhY2UgV2luZG93IHtcclxuICAgICAgICBtc2FsOiBPYmplY3Q7XHJcbiAgICAgICAgQ3VzdG9tRXZlbnQ6IEN1c3RvbUV2ZW50O1xyXG4gICAgICAgIEV2ZW50OiBFdmVudDtcclxuICAgICAgICBhY3RpdmVSZW5ld2Fsczoge307XHJcbiAgICAgICAgcmVuZXdTdGF0ZXM6IEFycmF5PHN0cmluZz47XHJcbiAgICAgICAgY2FsbGJhY2tNYXBwZWRUb1JlbmV3U3RhdGVzIDoge307XHJcbiAgICAgICAgcHJvbWlzZU1hcHBlZFRvUmVuZXdTdGF0ZXM6IHt9O1xyXG4gICAgICAgIG9wZW5lZFdpbmRvd3M6IEFycmF5PFdpbmRvdz47XHJcbiAgICAgICAgcmVxdWVzdFR5cGU6IHN0cmluZztcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIHJlc3BvbnNlX3R5cGUgZnJvbSBPcGVuSURDb25uZWN0XHJcbiAqIFJlZmVyZW5jZXM6IGh0dHBzOi8vb3BlbmlkLm5ldC9zcGVjcy9vYXV0aC12Mi1tdWx0aXBsZS1yZXNwb25zZS10eXBlcy0xXzAuaHRtbCAmIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM2NzQ5I3NlY3Rpb24tNC4yLjFcclxuICogU2luY2Ugd2Ugc3VwcG9ydCBvbmx5IGltcGxpY2l0IGZsb3cgaW4gdGhpcyBsaWJyYXJ5LCB3ZSByZXN0cmljdCB0aGUgcmVzcG9uc2VfdHlwZSBzdXBwb3J0IHRvIG9ubHkgJ3Rva2VuJyBhbmQgJ2lkX3Rva2VuJ1xyXG4gKlxyXG4gKiBAaGlkZGVuXHJcbiAqL1xyXG5jb25zdCBSZXNwb25zZVR5cGVzID0ge1xyXG4gIGlkX3Rva2VuOiBcImlkX3Rva2VuXCIsXHJcbiAgdG9rZW46IFwidG9rZW5cIixcclxuICBpZF90b2tlbl90b2tlbjogXCJpZF90b2tlbiB0b2tlblwiXHJcbn07XHJcblxyXG4vKipcclxuICogQGhpZGRlblxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBDYWNoZVJlc3VsdCB7XHJcbiAgZXJyb3JEZXNjOiBzdHJpbmc7XHJcbiAgdG9rZW46IHN0cmluZztcclxuICBlcnJvcjogc3RyaW5nO1xyXG59XHJcblxyXG4vKipcclxuICogRGF0YSB0eXBlIHRvIGhvbGQgaW5mb3JtYXRpb24gYWJvdXQgc3RhdGUgcmV0dXJuZWQgZnJvbSB0aGUgc2VydmVyXHJcbiAqL1xyXG5leHBvcnQgdHlwZSBSZXNwb25zZVN0YXRlSW5mbyA9IHtcclxuICBzdGF0ZTogc3RyaW5nO1xyXG4gIHN0YXRlTWF0Y2g6IGJvb2xlYW47XHJcbiAgcmVxdWVzdFR5cGU6IHN0cmluZztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBIHR5cGUgYWxpYXMgZm9yIGEgdG9rZW5SZWNlaXZlZENhbGxiYWNrIGZ1bmN0aW9uLlxyXG4gKiBAcGFyYW0gdG9rZW5SZWNlaXZlZENhbGxiYWNrLnRva2VuIHRva2VuIHJldHVybmVkIGZyb20gU1RTIGlmIHRva2VuIHJlcXVlc3QgaXMgc3VjY2Vzc2Z1bC5cclxuICogQHBhcmFtIHRva2VuUmVjZWl2ZWRDYWxsYmFjay50b2tlblR5cGUgdG9rZW5UeXBlIHJldHVybmVkIGZyb20gdGhlIFNUUyBpZiBBUEkgY2FsbCBpcyBzdWNjZXNzZnVsLiBQb3NzaWJsZSB2YWx1ZXMgYXJlOiBpZF90b2tlbiBPUiBhY2Nlc3NfdG9rZW4uXHJcbiAqL1xyXG5leHBvcnQgdHlwZSB0b2tlblJlY2VpdmVkQ2FsbGJhY2sgPSAocmVzcG9uc2U6IEF1dGhSZXNwb25zZSkgPT4gdm9pZDtcclxuXHJcbi8qKlxyXG4gKiBBIHR5cGUgYWxpYXMgZm9yIGEgZXJyb3JSZWNlaXZlZENhbGxiYWNrIGZ1bmN0aW9uLlxyXG4gKiBAcGFyYW0gZXJyb3JSZWNlaXZlZENhbGxiYWNrLmVycm9yRGVzYyBlcnJvciBvYmplY3QgY3JlYXRlZCBieSBsaWJyYXJ5IGNvbnRhaW5pbmcgZXJyb3Igc3RyaW5nIHJldHVybmVkIGZyb20gdGhlIFNUUyBpZiBBUEkgY2FsbCBmYWlscy5cclxuICovXHJcbmV4cG9ydCB0eXBlIGVycm9yUmVjZWl2ZWRDYWxsYmFjayA9IChhdXRoRXJyb3I6IEF1dGhFcnJvciwgYWNjb3VudFN0YXRlOiBzdHJpbmcpID0+IHZvaWQ7XHJcblxyXG4vKipcclxuICogQSB3cmFwcGVyIHRvIGhhbmRsZSB0aGUgdG9rZW4gcmVzcG9uc2UvZXJyb3Igd2l0aGluIHRoZSBpRnJhbWUgYWx3YXlzXHJcbiAqXHJcbiAqIEBwYXJhbSB0YXJnZXRcclxuICogQHBhcmFtIHByb3BlcnR5S2V5XHJcbiAqIEBwYXJhbSBkZXNjcmlwdG9yXHJcbiAqL1xyXG5jb25zdCByZXNvbHZlVG9rZW5Pbmx5SWZPdXRPZklmcmFtZSA9ICh0YXJnZXQ6IGFueSwgcHJvcGVydHlLZXk6IHN0cmluZywgZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yKSA9PiB7XHJcbiAgY29uc3QgdG9rZW5BY3F1aXNpdGlvbk1ldGhvZCA9IGRlc2NyaXB0b3IudmFsdWU7XHJcbiAgZGVzY3JpcHRvci52YWx1ZSA9IGZ1bmN0aW9uICguLi5hcmdzOiBhbnlbXSkge1xyXG4gICAgICByZXR1cm4gdGhpcy5pc0luSWZyYW1lKClcclxuICAgICAgICAgID8gbmV3IFByb21pc2UoKCkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgOiB0b2tlbkFjcXVpc2l0aW9uTWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gIH07XHJcbiAgcmV0dXJuIGRlc2NyaXB0b3I7XHJcbn07XHJcblxyXG4vKipcclxuICogVXNlckFnZW50QXBwbGljYXRpb24gY2xhc3MgLSBPYmplY3QgSW5zdGFuY2UgdGhhdCB0aGUgZGV2ZWxvcGVyIHdvdWxkIG5lZWQgdG8gbWFrZSBsb2dpbi9hY3F1aXJlVG9rZW4gY2FsbHNcclxuICovXHJcbmV4cG9ydCBjbGFzcyBVc2VyQWdlbnRBcHBsaWNhdGlvbiB7XHJcblxyXG4gIC8vIGlucHV0IENvbmZpZ3VyYXRpb24gYnkgdGhlIGRldmVsb3Blci91c2VyXHJcbiAgcHJpdmF0ZSBjb25maWc6IENvbmZpZ3VyYXRpb247XHJcblxyXG4gIC8vIGNhbGxiYWNrcyBmb3IgdG9rZW4vZXJyb3JcclxuICBwcml2YXRlIHRva2VuUmVjZWl2ZWRDYWxsYmFjazogdG9rZW5SZWNlaXZlZENhbGxiYWNrID0gbnVsbDtcclxuICBwcml2YXRlIGVycm9yUmVjZWl2ZWRDYWxsYmFjazogZXJyb3JSZWNlaXZlZENhbGxiYWNrID0gbnVsbDtcclxuXHJcbiAgLy8gQWRkZWQgZm9yIHJlYWRhYmlsaXR5IGFzIHRoZXNlIHBhcmFtcyBhcmUgdmVyeSBmcmVxdWVudGx5IHVzZWRcclxuICBwcml2YXRlIGxvZ2dlcjogTG9nZ2VyO1xyXG4gIHByaXZhdGUgY2xpZW50SWQ6IHN0cmluZztcclxuICBwcml2YXRlIGluQ29va2llOiBib29sZWFuO1xyXG5cclxuICAvLyBDYWNoZSBhbmQgQWNjb3VudCBpbmZvIHJlZmVycmVkIGFjcm9zcyB0b2tlbiBncmFudCBmbG93XHJcbiAgcHJvdGVjdGVkIGNhY2hlU3RvcmFnZTogU3RvcmFnZTtcclxuICBwcml2YXRlIGFjY291bnQ6IEFjY291bnQ7XHJcblxyXG4gIC8vIHN0YXRlIHZhcmlhYmxlc1xyXG4gIHByaXZhdGUgbG9naW5JblByb2dyZXNzOiBib29sZWFuO1xyXG4gIHByaXZhdGUgYWNxdWlyZVRva2VuSW5Qcm9ncmVzczogYm9vbGVhbjtcclxuICBwcml2YXRlIHNpbGVudEF1dGhlbnRpY2F0aW9uU3RhdGU6IHN0cmluZztcclxuICBwcml2YXRlIHNpbGVudExvZ2luOiBib29sZWFuO1xyXG4gIHByaXZhdGUgcmVkaXJlY3RDYWxsYmFja3NTZXQ6IGJvb2xlYW47XHJcblxyXG4gIC8vIEF1dGhvcml0eSBGdW5jdGlvbmFsaXR5XHJcbiAgcHJvdGVjdGVkIGF1dGhvcml0eUluc3RhbmNlOiBBdXRob3JpdHk7XHJcblxyXG4gIC8vIElmIHRoZSBkZXZlbG9wZXIgcGFzc2VzIGFuIGF1dGhvcml0eSwgY3JlYXRlIGFuIGluc3RhbmNlXHJcbiAgcHVibGljIHNldCBhdXRob3JpdHkodmFsKSB7XHJcbiAgICB0aGlzLmF1dGhvcml0eUluc3RhbmNlID0gQXV0aG9yaXR5RmFjdG9yeS5DcmVhdGVJbnN0YW5jZSh2YWwsIHRoaXMuY29uZmlnLmF1dGgudmFsaWRhdGVBdXRob3JpdHkpO1xyXG4gIH1cclxuXHJcbiAgLy8gcmV0cmlldmUgdGhlIGF1dGhvcml0eSBpbnN0YW5jZVxyXG4gIHB1YmxpYyBnZXQgYXV0aG9yaXR5KCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy5hdXRob3JpdHlJbnN0YW5jZS5DYW5vbmljYWxBdXRob3JpdHk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0QXV0aG9yaXR5SW5zdGFuY2UoKTogQXV0aG9yaXR5IHtcclxuICAgIHJldHVybiB0aGlzLmF1dGhvcml0eUluc3RhbmNlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZSBhIFVzZXJBZ2VudEFwcGxpY2F0aW9uIHdpdGggYSBnaXZlbiBjbGllbnRJZCBhbmQgYXV0aG9yaXR5LlxyXG4gICAqIEBjb25zdHJ1Y3RvclxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNsaWVudElkIC0gVGhlIGNsaWVudElEIG9mIHlvdXIgYXBwbGljYXRpb24sIHlvdSBzaG91bGQgZ2V0IHRoaXMgZnJvbSB0aGUgYXBwbGljYXRpb24gcmVnaXN0cmF0aW9uIHBvcnRhbC5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gYXV0aG9yaXR5IC0gQSBVUkwgaW5kaWNhdGluZyBhIGRpcmVjdG9yeSB0aGF0IE1TQUwgY2FuIHVzZSB0byBvYnRhaW4gdG9rZW5zLlxyXG4gICAqIC0gSW4gQXp1cmUgQUQsIGl0IGlzIG9mIHRoZSBmb3JtIGh0dHBzOi8vJmx0O2luc3RhbmNlPi8mbHQ7dGVuYW50Jmd0OyxcXCB3aGVyZSAmbHQ7aW5zdGFuY2UmZ3Q7IGlzIHRoZSBkaXJlY3RvcnkgaG9zdCAoZS5nLiBodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20pIGFuZCAmbHQ7dGVuYW50Jmd0OyBpcyBhIGlkZW50aWZpZXIgd2l0aGluIHRoZSBkaXJlY3RvcnkgaXRzZWxmIChlLmcuIGEgZG9tYWluIGFzc29jaWF0ZWQgdG8gdGhlIHRlbmFudCwgc3VjaCBhcyBjb250b3NvLm9ubWljcm9zb2Z0LmNvbSwgb3IgdGhlIEdVSUQgcmVwcmVzZW50aW5nIHRoZSBUZW5hbnRJRCBwcm9wZXJ0eSBvZiB0aGUgZGlyZWN0b3J5KVxyXG4gICAqIC0gSW4gQXp1cmUgQjJDLCBpdCBpcyBvZiB0aGUgZm9ybSBodHRwczovLyZsdDtpbnN0YW5jZSZndDsvdGZwLyZsdDt0ZW5hbnRJZCZndDsvJmx0O3BvbGljeU5hbWUmZ3Q7L1xyXG4gICAqIC0gRGVmYXVsdCB2YWx1ZSBpczogXCJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vY29tbW9uXCJcclxuICAgKiBAcGFyYW0gX3Rva2VuUmVjZWl2ZWRDYWxsYmFjayAtICBUaGUgZnVuY3Rpb24gdGhhdCB3aWxsIGdldCB0aGUgY2FsbCBiYWNrIG9uY2UgdGhpcyBBUEkgaXMgY29tcGxldGVkIChlaXRoZXIgc3VjY2Vzc2Z1bGx5IG9yIHdpdGggYSBmYWlsdXJlKS5cclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHZhbGlkYXRlQXV0aG9yaXR5IC0gIGJvb2xlYW4gdG8gdHVybiBhdXRob3JpdHkgdmFsaWRhdGlvbiBvbi9vZmYuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoY29uZmlndXJhdGlvbjogQ29uZmlndXJhdGlvbikge1xyXG5cclxuICAgIC8vIFNldCB0aGUgQ29uZmlndXJhdGlvblxyXG4gICAgdGhpcy5jb25maWcgPSBidWlsZENvbmZpZ3VyYXRpb24oY29uZmlndXJhdGlvbik7XHJcblxyXG4gICAgLy8gU2V0IHRoZSBjYWxsYmFjayBib29sZWFuXHJcbiAgICB0aGlzLnJlZGlyZWN0Q2FsbGJhY2tzU2V0ID0gZmFsc2U7XHJcblxyXG4gICAgdGhpcy5sb2dnZXIgPSB0aGlzLmNvbmZpZy5zeXN0ZW0ubG9nZ2VyO1xyXG4gICAgdGhpcy5jbGllbnRJZCA9IHRoaXMuY29uZmlnLmF1dGguY2xpZW50SWQ7XHJcbiAgICB0aGlzLmluQ29va2llID0gdGhpcy5jb25maWcuY2FjaGUuc3RvcmVBdXRoU3RhdGVJbkNvb2tpZTtcclxuXHJcbiAgICAvLyBpZiBubyBhdXRob3JpdHkgaXMgcGFzc2VkLCBzZXQgdGhlIGRlZmF1bHQ6IFwiaHR0cHM6Ly9sb2dpbi5taWNyb3NvZnRvbmxpbmUuY29tL2NvbW1vblwiXHJcbiAgICB0aGlzLmF1dGhvcml0eSA9IHRoaXMuY29uZmlnLmF1dGguYXV0aG9yaXR5IHx8IERFRkFVTFRfQVVUSE9SSVRZO1xyXG5cclxuICAgIC8vIHRyYWNrIGxvZ2luIGFuZCBhY3F1aXJlVG9rZW4gaW4gcHJvZ3Jlc3NcclxuICAgIHRoaXMubG9naW5JblByb2dyZXNzID0gZmFsc2U7XHJcbiAgICB0aGlzLmFjcXVpcmVUb2tlbkluUHJvZ3Jlc3MgPSBmYWxzZTtcclxuXHJcbiAgICAvLyBjYWNoZSBrZXlzIG1zYWwgLSB0eXBlc2NyaXB0IHRocm93cyBhbiBlcnJvciBpZiBhbnkgdmFsdWUgb3RoZXIgdGhhbiBcImxvY2FsU3RvcmFnZVwiIG9yIFwic2Vzc2lvblN0b3JhZ2VcIiBpcyBwYXNzZWRcclxuICAgIHRyeSB7XHJcbiAgICAgIHRoaXMuY2FjaGVTdG9yYWdlID0gbmV3IFN0b3JhZ2UodGhpcy5jb25maWcuY2FjaGUuY2FjaGVMb2NhdGlvbik7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgdGhyb3cgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yLmNyZWF0ZUludmFsaWRDYWNoZUxvY2F0aW9uQ29uZmlnRXJyb3IodGhpcy5jb25maWcuY2FjaGUuY2FjaGVMb2NhdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSW5pdGlhbGl6ZSB3aW5kb3cgaGFuZGxpbmcgY29kZVxyXG4gICAgd2luZG93Lm9wZW5lZFdpbmRvd3MgPSBbXTtcclxuICAgIHdpbmRvdy5hY3RpdmVSZW5ld2FscyA9IHt9O1xyXG4gICAgd2luZG93LnJlbmV3U3RhdGVzID0gW107XHJcbiAgICB3aW5kb3cuY2FsbGJhY2tNYXBwZWRUb1JlbmV3U3RhdGVzID0geyB9O1xyXG4gICAgd2luZG93LnByb21pc2VNYXBwZWRUb1JlbmV3U3RhdGVzID0geyB9O1xyXG4gICAgd2luZG93Lm1zYWwgPSB0aGlzO1xyXG5cclxuICAgIGNvbnN0IHVybEhhc2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaDtcclxuICAgIGNvbnN0IGlzQ2FsbGJhY2sgPSB0aGlzLmlzQ2FsbGJhY2sodXJsSGFzaCk7XHJcblxyXG4gICAgLy8gT24gdGhlIHNlcnZlciAzMDIgLSBSZWRpcmVjdCwgaGFuZGxlIHRoaXNcclxuICAgIGlmICghdGhpcy5jb25maWcuZnJhbWV3b3JrLmlzQW5ndWxhcikge1xyXG4gICAgICBpZiAoaXNDYWxsYmFjaykge1xyXG4gICAgICAgIHRoaXMuaGFuZGxlQXV0aGVudGljYXRpb25SZXNwb25zZSh1cmxIYXNoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8jcmVnaW9uIFJlZGlyZWN0IENhbGxiYWNrc1xyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGNhbGxiYWNrIGZ1bmN0aW9ucyBmb3IgdGhlIHJlZGlyZWN0IGZsb3cgdG8gc2VuZCBiYWNrIHRoZSBzdWNjZXNzIG9yIGVycm9yIG9iamVjdC5cclxuICAgKiBAcGFyYW0ge3Rva2VuUmVjZWl2ZWRDYWxsYmFja30gc3VjY2Vzc0NhbGxiYWNrIC0gQ2FsbGJhY2sgd2hpY2ggY29udGFpbnMgdGhlIEF1dGhSZXNwb25zZSBvYmplY3QsIGNvbnRhaW5pbmcgZGF0YSBmcm9tIHRoZSBzZXJ2ZXIuXHJcbiAgICogQHBhcmFtIHtlcnJvclJlY2VpdmVkQ2FsbGJhY2t9IGVycm9yQ2FsbGJhY2sgLSBDYWxsYmFjayB3aGljaCBjb250YWlucyBhIEF1dGhFcnJvciBvYmplY3QsIGNvbnRhaW5pbmcgZXJyb3IgZGF0YSBmcm9tIGVpdGhlciB0aGUgc2VydmVyXHJcbiAgICogb3IgdGhlIGxpYnJhcnksIGRlcGVuZGluZyBvbiB0aGUgb3JpZ2luIG9mIHRoZSBlcnJvci5cclxuICAgKi9cclxuICBoYW5kbGVSZWRpcmVjdENhbGxiYWNrcyhzdWNjZXNzQ2FsbGJhY2s6IHRva2VuUmVjZWl2ZWRDYWxsYmFjaywgZXJyb3JDYWxsYmFjazogZXJyb3JSZWNlaXZlZENhbGxiYWNrKTogdm9pZCB7XHJcbiAgICBpZiAoIXN1Y2Nlc3NDYWxsYmFjaykge1xyXG4gICAgICB0aGlzLnJlZGlyZWN0Q2FsbGJhY2tzU2V0ID0gZmFsc2U7XHJcbiAgICAgIHRocm93IENsaWVudENvbmZpZ3VyYXRpb25FcnJvci5jcmVhdGVJbnZhbGlkQ2FsbGJhY2tPYmplY3RFcnJvcihcInN1Y2Nlc3NDYWxsYmFja1wiLCBzdWNjZXNzQ2FsbGJhY2spO1xyXG4gICAgfSBlbHNlIGlmICghZXJyb3JDYWxsYmFjaykge1xyXG4gICAgICB0aGlzLnJlZGlyZWN0Q2FsbGJhY2tzU2V0ID0gZmFsc2U7XHJcbiAgICAgIHRocm93IENsaWVudENvbmZpZ3VyYXRpb25FcnJvci5jcmVhdGVJbnZhbGlkQ2FsbGJhY2tPYmplY3RFcnJvcihcImVycm9yQ2FsbGJhY2tcIiwgZXJyb3JDYWxsYmFjayk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2V0IGNhbGxiYWNrc1xyXG4gICAgdGhpcy50b2tlblJlY2VpdmVkQ2FsbGJhY2sgPSBzdWNjZXNzQ2FsbGJhY2s7XHJcbiAgICB0aGlzLmVycm9yUmVjZWl2ZWRDYWxsYmFjayA9IGVycm9yQ2FsbGJhY2s7XHJcblxyXG4gICAgdGhpcy5yZWRpcmVjdENhbGxiYWNrc1NldCA9IHRydWU7XHJcblxyXG4gICAgLy8gT24gdGhlIHNlcnZlciAzMDIgLSBSZWRpcmVjdCwgaGFuZGxlIHRoaXNcclxuICAgIC8vIFRPRE86IHJlbmFtZSBwZW5kaW5nQ2FsbGJhY2sgdG8gY2FjaGVkSGFzaFxyXG4gICAgaWYgKCF0aGlzLmNvbmZpZy5mcmFtZXdvcmsuaXNBbmd1bGFyKSB7XHJcbiAgICAgIGNvbnN0IHBlbmRpbmdDYWxsYmFjayA9IHRoaXMuY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLnVybEhhc2gpO1xyXG4gICAgICBpZiAocGVuZGluZ0NhbGxiYWNrKSB7XHJcbiAgICAgICAgdGhpcy5wcm9jZXNzQ2FsbEJhY2socGVuZGluZ0NhbGxiYWNrLCBudWxsKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8jZW5kcmVnaW9uXHJcblxyXG4gIC8vI3JlZ2lvbiBSZWRpcmVjdCBGbG93XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYXRlIHRoZSBsb2dpbiBwcm9jZXNzIGJ5IHJlZGlyZWN0aW5nIHRoZSB1c2VyIHRvIHRoZSBTVFMgYXV0aG9yaXphdGlvbiBlbmRwb2ludC5cclxuICAgKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBzY29wZXMgLSBQZXJtaXNzaW9ucyB5b3Ugd2FudCBpbmNsdWRlZCBpbiB0aGUgYWNjZXNzIHRva2VuLiBOb3QgYWxsIHNjb3BlcyBhcmUgZ3VhcmFudGVlZCB0byBiZSBpbmNsdWRlZCBpbiB0aGUgYWNjZXNzIHRva2VuIHJldHVybmVkLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBleHRyYVF1ZXJ5UGFyYW1ldGVycyAtIEtleS12YWx1ZSBwYWlycyB0byBwYXNzIHRvIHRoZSBhdXRoZW50aWNhdGlvbiBzZXJ2ZXIgZHVyaW5nIHRoZSBpbnRlcmFjdGl2ZSBhdXRoZW50aWNhdGlvbiBmbG93LlxyXG4gICAqL1xyXG4gIGxvZ2luUmVkaXJlY3QocmVxdWVzdD86IEF1dGhlbnRpY2F0aW9uUGFyYW1ldGVycyk6IHZvaWQge1xyXG5cclxuICAgIC8vIFRocm93IGVycm9yIGlmIGNhbGxiYWNrcyBhcmUgbm90IHNldCBiZWZvcmUgcmVkaXJlY3RcclxuICAgIGlmICghdGhpcy5yZWRpcmVjdENhbGxiYWNrc1NldCkge1xyXG4gICAgICB0aHJvdyBDbGllbnRDb25maWd1cmF0aW9uRXJyb3IuY3JlYXRlUmVkaXJlY3RDYWxsYmFja3NOb3RTZXRFcnJvcigpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENyZWF0ZXMgbmF2aWdhdGUgdXJsOyBzYXZlcyB2YWx1ZSBpbiBjYWNoZTsgcmVkaXJlY3QgdXNlciB0byBBQURcclxuICAgIGlmICh0aGlzLmxvZ2luSW5Qcm9ncmVzcykge1xyXG4gICAgICB0aGlzLmVycm9yUmVjZWl2ZWRDYWxsYmFjayhDbGllbnRBdXRoRXJyb3IuY3JlYXRlTG9naW5JblByb2dyZXNzRXJyb3IoKSwgdGhpcy5nZXRBY2NvdW50U3RhdGUodGhpcy5zaWxlbnRBdXRoZW50aWNhdGlvblN0YXRlKSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpZiBleHRyYVNjb3Blc1RvQ29uc2VudCBpcyBwYXNzZWQsIGFwcGVuZCB0aGVtIHRvIHRoZSBsb2dpbiByZXF1ZXN0XHJcbiAgICBsZXQgc2NvcGVzOiBBcnJheTxzdHJpbmc+ID0gdGhpcy5hcHBlbmRTY29wZXMocmVxdWVzdCk7XHJcblxyXG4gICAgLy8gVmFsaWRhdGUgYW5kIGZpbHRlciBzY29wZXMgKHRoZSB2YWxpZGF0ZSBmdW5jdGlvbiB3aWxsIHRocm93IGlmIHZhbGlkYXRpb24gZmFpbHMpXHJcbiAgICB0aGlzLnZhbGlkYXRlSW5wdXRTY29wZShzY29wZXMsIGZhbHNlKTtcclxuXHJcbiAgICBjb25zdCBhY2NvdW50OiBBY2NvdW50ID0gdGhpcy5nZXRBY2NvdW50KCk7XHJcblxyXG4gICAgLy8gZGVmZXIgcXVlcnlQYXJhbWV0ZXJzIGdlbmVyYXRpb24gdG8gSGVscGVyIGlmIGRldmVsb3BlciBwYXNzZXMgYWNjb3VudC9zaWQvbG9naW5faGludFxyXG4gICAgIGlmIChVdGlscy5pc1NTT1BhcmFtKHJlcXVlc3QpKSB7XHJcbiAgICAgICAvLyBpZiBhY2NvdW50IGlzIG5vdCBwcm92aWRlZCwgd2UgcGFzcyBudWxsXHJcbiAgICAgICB0aGlzLmxvZ2luUmVkaXJlY3RIZWxwZXIoYWNjb3VudCwgcmVxdWVzdCwgc2NvcGVzKTtcclxuICAgIH1cclxuICAgIC8vIGVsc2UgaGFuZGxlIHRoZSBsaWJyYXJ5IGRhdGFcclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyBleHRyYWN0IEFEQUwgaWRfdG9rZW4gaWYgZXhpc3RzXHJcbiAgICAgIGxldCBhZGFsSWRUb2tlbiA9IHRoaXMuZXh0cmFjdEFEQUxJZFRva2VuKCk7XHJcblxyXG4gICAgICAvLyBzaWxlbnQgbG9naW4gaWYgQURBTCBpZF90b2tlbiBpcyByZXRyaWV2ZWQgc3VjY2Vzc2Z1bGx5IC0gU1NPXHJcbiAgICAgIGlmIChhZGFsSWRUb2tlbiAmJiAhc2NvcGVzKSB7XHJcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbyhcIkFEQUwncyBpZFRva2VuIGV4aXN0cy4gRXh0cmFjdGluZyBsb2dpbiBpbmZvcm1hdGlvbiBmcm9tIEFEQUwncyBpZFRva2VuIFwiKTtcclxuICAgICAgICBsZXQgdG9rZW5SZXF1ZXN0OiBBdXRoZW50aWNhdGlvblBhcmFtZXRlcnMgPSB0aGlzLmJ1aWxkSURUb2tlblJlcXVlc3QocmVxdWVzdCk7XHJcblxyXG4gICAgICAgIHRoaXMuc2lsZW50TG9naW4gPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuYWNxdWlyZVRva2VuU2lsZW50KHRva2VuUmVxdWVzdCkudGhlbihyZXNwb25zZSA9PiB7XHJcbiAgICAgICAgICB0aGlzLnNpbGVudExvZ2luID0gZmFsc2U7XHJcbiAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKFwiVW5pZmllZCBjYWNoZSBjYWxsIGlzIHN1Y2Nlc3NmdWxcIik7XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMudG9rZW5SZWNlaXZlZENhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIHRoaXMudG9rZW5SZWNlaXZlZENhbGxiYWNrKHJlc3BvbnNlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LCAoZXJyb3IpID0+IHtcclxuICAgICAgICAgIHRoaXMuc2lsZW50TG9naW4gPSBmYWxzZTtcclxuICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKFwiRXJyb3Igb2NjdXJyZWQgZHVyaW5nIHVuaWZpZWQgY2FjaGUgQVRTXCIpO1xyXG5cclxuICAgICAgICAgIC8vIGNhbGwgdGhlIGxvZ2luUmVkaXJlY3RIZWxwZXIgbGF0ZXIgd2l0aCBubyB1c2VyIGFjY291bnQgY29udGV4dFxyXG4gICAgICAgICAgdGhpcy5sb2dpblJlZGlyZWN0SGVscGVyKG51bGwsIHJlcXVlc3QsIHNjb3Blcyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgLy8gZWxzZSBwcm9jZWVkIHRvIGxvZ2luXHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIC8vIGNhbGwgdGhlIGxvZ2luUmVkaXJlY3RIZWxwZXIgbGF0ZXIgd2l0aCBubyB1c2VyIGFjY291bnQgY29udGV4dFxyXG4gICAgICAgIHRoaXMubG9naW5SZWRpcmVjdEhlbHBlcihudWxsLCByZXF1ZXN0LCBzY29wZXMpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGVscGVyIGZ1bmN0aW9uIHRvIGxvZ2luUmVkaXJlY3RcclxuICAgKlxyXG4gICAqIEBoaWRkZW5cclxuICAgKiBAcGFyYW0gc2NvcGVzXHJcbiAgICogQHBhcmFtIGV4dHJhUXVlcnlQYXJhbWV0ZXJzXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBsb2dpblJlZGlyZWN0SGVscGVyKGFjY291bnQ6IEFjY291bnQsIHJlcXVlc3Q6IEF1dGhlbnRpY2F0aW9uUGFyYW1ldGVycywgc2NvcGVzPzogQXJyYXk8c3RyaW5nPikge1xyXG4gICAgLy8gVHJhY2sgbG9naW4gaW4gcHJvZ3Jlc3NcclxuICAgIHRoaXMubG9naW5JblByb2dyZXNzID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLmF1dGhvcml0eUluc3RhbmNlLnJlc29sdmVFbmRwb2ludHNBc3luYygpLnRoZW4oKCkgPT4ge1xyXG5cclxuICAgICAgLy8gY3JlYXRlIHRoZSBSZXF1ZXN0IHRvIGJlIHNlbnQgdG8gdGhlIFNlcnZlclxyXG4gICAgICBsZXQgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0ID0gbmV3IFNlcnZlclJlcXVlc3RQYXJhbWV0ZXJzKFxyXG4gICAgICAgIHRoaXMuYXV0aG9yaXR5SW5zdGFuY2UsXHJcbiAgICAgICAgdGhpcy5jbGllbnRJZCwgc2NvcGVzLFxyXG4gICAgICAgIFJlc3BvbnNlVHlwZXMuaWRfdG9rZW4sXHJcbiAgICAgICAgdGhpcy5nZXRSZWRpcmVjdFVyaSgpLFxyXG4gICAgICAgIHRoaXMuY29uZmlnLmF1dGguc3RhdGVcclxuICAgICAgKTtcclxuXHJcbiAgICAgIC8vIHBvcHVsYXRlIFF1ZXJ5UGFyYW1ldGVycyAoc2lkL2xvZ2luX2hpbnQvZG9tYWluX2hpbnQpIGFuZCBhbnkgb3RoZXIgZXh0cmFRdWVyeVBhcmFtZXRlcnMgc2V0IGJ5IHRoZSBkZXZlbG9wZXJcclxuICAgICAgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0ID0gdGhpcy5wb3B1bGF0ZVF1ZXJ5UGFyYW1zKGFjY291bnQsIHJlcXVlc3QsIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdCk7XHJcblxyXG4gICAgICAvLyBpZiB0aGUgdXNlciBzZXRzIHRoZSBsb2dpbiBzdGFydCBwYWdlIC0gYW5ndWxhciBvbmx5Pz9cclxuICAgICAgbGV0IGxvZ2luU3RhcnRQYWdlID0gdGhpcy5jYWNoZVN0b3JhZ2UuZ2V0SXRlbShDb25zdGFudHMuYW5ndWxhckxvZ2luUmVxdWVzdCk7XHJcbiAgICAgIGlmICghbG9naW5TdGFydFBhZ2UgfHwgbG9naW5TdGFydFBhZ2UgPT09IFwiXCIpIHtcclxuICAgICAgICBsb2dpblN0YXJ0UGFnZSA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLmFuZ3VsYXJMb2dpblJlcXVlc3QsIFwiXCIpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBDYWNoZSB0aGUgc3RhdGUsIG5vbmNlLCBhbmQgbG9naW4gcmVxdWVzdCBkYXRhXHJcbiAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLmxvZ2luUmVxdWVzdCwgbG9naW5TdGFydFBhZ2UsIHRoaXMuaW5Db29raWUpO1xyXG4gICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5sb2dpbkVycm9yLCBcIlwiKTtcclxuXHJcbiAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLnN0YXRlTG9naW4sIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSwgdGhpcy5pbkNvb2tpZSk7XHJcbiAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLm5vbmNlSWRUb2tlbiwgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0Lm5vbmNlLCB0aGlzLmluQ29va2llKTtcclxuXHJcbiAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLm1zYWxFcnJvciwgXCJcIik7XHJcbiAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLm1zYWxFcnJvckRlc2NyaXB0aW9uLCBcIlwiKTtcclxuXHJcbiAgICAgIC8vIENhY2hlIGF1dGhvcml0eUtleVxyXG4gICAgICB0aGlzLnNldEF1dGhvcml0eUNhY2hlKHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSwgdGhpcy5hdXRob3JpdHkpO1xyXG5cclxuICAgICAgLy8gYnVpbGQgVVJMIHRvIG5hdmlnYXRlIHRvIHByb2NlZWQgd2l0aCB0aGUgbG9naW5cclxuICAgICAgbGV0IHVybE5hdmlnYXRlID0gc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LmNyZWF0ZU5hdmlnYXRlVXJsKHNjb3BlcykgKyBDb25zdGFudHMucmVzcG9uc2VfbW9kZV9mcmFnbWVudDtcclxuXHJcbiAgICAgIC8vIFJlZGlyZWN0IHVzZXIgdG8gbG9naW4gVVJMXHJcbiAgICAgIHRoaXMucHJvbXB0VXNlcih1cmxOYXZpZ2F0ZSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVzZWQgdG8gb2J0YWluIGFuIGFjY2Vzc190b2tlbiBieSByZWRpcmVjdGluZyB0aGUgdXNlciB0byB0aGUgYXV0aG9yaXphdGlvbiBlbmRwb2ludC5cclxuICAgKiBUbyByZW5ldyBpZFRva2VuLCBjbGllbnRJZCBzaG91bGQgYmUgcGFzc2VkIGFzIHRoZSBvbmx5IHNjb3BlIGluIHRoZSBzY29wZXMgYXJyYXkuXHJcbiAgICogQHBhcmFtIHtBcnJheTxzdHJpbmc+fSBzY29wZXMgLSBQZXJtaXNzaW9ucyB5b3Ugd2FudCBpbmNsdWRlZCBpbiB0aGUgYWNjZXNzIHRva2VuLiBOb3QgYWxsIHNjb3BlcyBhcmUgIGd1YXJhbnRlZWQgdG8gYmUgaW5jbHVkZWQgaW4gdGhlIGFjY2VzcyB0b2tlbi4gU2NvcGVzIGxpa2UgXCJvcGVuaWRcIiBhbmQgXCJwcm9maWxlXCIgYXJlIHNlbnQgd2l0aCBldmVyeSByZXF1ZXN0LlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhdXRob3JpdHkgLSBBIFVSTCBpbmRpY2F0aW5nIGEgZGlyZWN0b3J5IHRoYXQgTVNBTCBjYW4gdXNlIHRvIG9idGFpbiB0b2tlbnMuXHJcbiAgICogLSBJbiBBenVyZSBBRCwgaXQgaXMgb2YgdGhlIGZvcm0gaHR0cHM6Ly97aW5zdGFuY2V9LyZsdDt0ZW5hbnQmZ3Q7LCB3aGVyZSAmbHQ7dGVuYW50Jmd0OyBpcyB0aGUgZGlyZWN0b3J5IGhvc3QgKGUuZy4gaHR0cHM6Ly9sb2dpbi5taWNyb3NvZnRvbmxpbmUuY29tKSBhbmQgJmx0O3RlbmFudCZndDsgaXMgYSBpZGVudGlmaWVyIHdpdGhpbiB0aGUgZGlyZWN0b3J5IGl0c2VsZiAoZS5nLiBhIGRvbWFpbiBhc3NvY2lhdGVkIHRvIHRoZSB0ZW5hbnQsIHN1Y2ggYXMgY29udG9zby5vbm1pY3Jvc29mdC5jb20sIG9yIHRoZSBHVUlEIHJlcHJlc2VudGluZyB0aGUgVGVuYW50SUQgcHJvcGVydHkgb2YgdGhlIGRpcmVjdG9yeSlcclxuICAgKiAtIEluIEF6dXJlIEIyQywgaXQgaXMgb2YgdGhlIGZvcm0gaHR0cHM6Ly97aW5zdGFuY2V9L3RmcC8mbHQ7dGVuYW50Jmd0Oy88cG9saWN5TmFtZT5cclxuICAgKiAtIERlZmF1bHQgdmFsdWUgaXM6IFwiaHR0cHM6Ly9sb2dpbi5taWNyb3NvZnRvbmxpbmUuY29tL2NvbW1vblwiXHJcbiAgICogQHBhcmFtIHtBY2NvdW50fSBhY2NvdW50IC0gVGhlIGFjY291bnQgZm9yIHdoaWNoIHRoZSBzY29wZXMgYXJlIHJlcXVlc3RlZC5UaGUgZGVmYXVsdCBhY2NvdW50IGlzIHRoZSBsb2dnZWQgaW4gYWNjb3VudC5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXh0cmFRdWVyeVBhcmFtZXRlcnMgLSBLZXktdmFsdWUgcGFpcnMgdG8gcGFzcyB0byB0aGUgU1RTIGR1cmluZyB0aGUgIGF1dGhlbnRpY2F0aW9uIGZsb3cuXHJcbiAgICovXHJcbiAgYWNxdWlyZVRva2VuUmVkaXJlY3QocmVxdWVzdDogQXV0aGVudGljYXRpb25QYXJhbWV0ZXJzKTogdm9pZCB7XHJcbiAgICAvLyBUaHJvdyBlcnJvciBpZiBjYWxsYmFja3MgYXJlIG5vdCBzZXQgYmVmb3JlIHJlZGlyZWN0XHJcbiAgICBpZiAoIXRoaXMucmVkaXJlY3RDYWxsYmFja3NTZXQpIHtcclxuICAgICAgdGhyb3cgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yLmNyZWF0ZVJlZGlyZWN0Q2FsbGJhY2tzTm90U2V0RXJyb3IoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBWYWxpZGF0ZSBhbmQgZmlsdGVyIHNjb3BlcyAodGhlIHZhbGlkYXRlIGZ1bmN0aW9uIHdpbGwgdGhyb3cgaWYgdmFsaWRhdGlvbiBmYWlscylcclxuICAgIHRoaXMudmFsaWRhdGVJbnB1dFNjb3BlKHJlcXVlc3Quc2NvcGVzLCB0cnVlKTtcclxuXHJcbiAgICAvLyBHZXQgdGhlIGFjY291bnQgb2JqZWN0IGlmIGEgc2Vzc2lvbiBleGlzdHNcclxuICAgIGNvbnN0IGFjY291bnQ6IEFjY291bnQgPSByZXF1ZXN0LmFjY291bnQgfHwgdGhpcy5nZXRBY2NvdW50KCk7XHJcblxyXG4gICAgLy8gSWYgYWxyZWFkeSBpbiBwcm9ncmVzcywgZG8gbm90IHByb2NlZWRcclxuICAgIGlmICh0aGlzLmFjcXVpcmVUb2tlbkluUHJvZ3Jlc3MpIHtcclxuICAgICAgdGhpcy5lcnJvclJlY2VpdmVkQ2FsbGJhY2soQ2xpZW50QXV0aEVycm9yLmNyZWF0ZUFjcXVpcmVUb2tlbkluUHJvZ3Jlc3NFcnJvcigpLCB0aGlzLmdldEFjY291bnRTdGF0ZSh0aGlzLnNpbGVudEF1dGhlbnRpY2F0aW9uU3RhdGUpKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIG5vIHNlc3Npb24gZXhpc3RzLCBwcm9tcHQgdGhlIHVzZXIgdG8gbG9naW4uXHJcbiAgICBjb25zdCBzY29wZSA9IHJlcXVlc3Quc2NvcGVzLmpvaW4oXCIgXCIpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICBpZiAoIWFjY291bnQgJiYgIShyZXF1ZXN0LnNpZCAgfHwgcmVxdWVzdC5sb2dpbkhpbnQpKSB7XHJcbiAgICAgIHRoaXMubG9nZ2VyLmluZm8oXCJVc2VyIGxvZ2luIGlzIHJlcXVpcmVkXCIpO1xyXG4gICAgICB0aHJvdyBDbGllbnRBdXRoRXJyb3IuY3JlYXRlVXNlckxvZ2luUmVxdWlyZWRFcnJvcigpO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Q6IFNlcnZlclJlcXVlc3RQYXJhbWV0ZXJzO1xyXG4gICAgY29uc3QgYWNxdWlyZVRva2VuQXV0aG9yaXR5ID0gcmVxdWVzdC5hdXRob3JpdHkgPyBBdXRob3JpdHlGYWN0b3J5LkNyZWF0ZUluc3RhbmNlKHJlcXVlc3QuYXV0aG9yaXR5LCB0aGlzLmNvbmZpZy5hdXRoLnZhbGlkYXRlQXV0aG9yaXR5KSA6IHRoaXMuYXV0aG9yaXR5SW5zdGFuY2U7XHJcblxyXG4gICAgLy8gVHJhY2sgdGhlIGFjcXVpcmVUb2tlbiBwcm9ncmVzc1xyXG4gICAgdGhpcy5hY3F1aXJlVG9rZW5JblByb2dyZXNzID0gdHJ1ZTtcclxuXHJcbiAgICBhY3F1aXJlVG9rZW5BdXRob3JpdHkucmVzb2x2ZUVuZHBvaW50c0FzeW5jKCkudGhlbigoKSA9PiB7XHJcbiAgICAgIC8vIE9uIEZ1bGZpbGxtZW50XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlVHlwZSA9IHRoaXMuZ2V0VG9rZW5UeXBlKGFjY291bnQsIHJlcXVlc3Quc2NvcGVzLCBmYWxzZSk7XHJcbiAgICAgIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdCA9IG5ldyBTZXJ2ZXJSZXF1ZXN0UGFyYW1ldGVycyhcclxuICAgICAgICBhY3F1aXJlVG9rZW5BdXRob3JpdHksXHJcbiAgICAgICAgdGhpcy5jbGllbnRJZCxcclxuICAgICAgICByZXF1ZXN0LnNjb3BlcyxcclxuICAgICAgICByZXNwb25zZVR5cGUsXHJcbiAgICAgICAgdGhpcy5nZXRSZWRpcmVjdFVyaSgpLFxyXG4gICAgICAgIHRoaXMuY29uZmlnLmF1dGguc3RhdGVcclxuICAgICAgKTtcclxuXHJcbiAgICAgIC8vIENhY2hlIG5vbmNlXHJcbiAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLm5vbmNlSWRUb2tlbiwgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0Lm5vbmNlLCB0aGlzLmluQ29va2llKTtcclxuXHJcbiAgICAgIC8vIENhY2hlIGFjY291bnQgYW5kIGF1dGhvcml0eVxyXG4gICAgICB0aGlzLnNldEFjY291bnRDYWNoZShhY2NvdW50LCBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGUpO1xyXG4gICAgICB0aGlzLnNldEF1dGhvcml0eUNhY2hlKHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSwgYWNxdWlyZVRva2VuQXV0aG9yaXR5LkNhbm9uaWNhbEF1dGhvcml0eSk7XHJcblxyXG4gICAgICAvLyBwb3B1bGF0ZSBRdWVyeVBhcmFtZXRlcnMgKHNpZC9sb2dpbl9oaW50L2RvbWFpbl9oaW50KSBhbmQgYW55IG90aGVyIGV4dHJhUXVlcnlQYXJhbWV0ZXJzIHNldCBieSB0aGUgZGV2ZWxvcGVyXHJcbiAgICAgIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdCA9IHRoaXMucG9wdWxhdGVRdWVyeVBhcmFtcyhhY2NvdW50LCByZXF1ZXN0LCBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QpO1xyXG5cclxuICAgICAgLy8gQ29uc3RydWN0IHVybE5hdmlnYXRlXHJcbiAgICAgIGxldCB1cmxOYXZpZ2F0ZSA9IHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5jcmVhdGVOYXZpZ2F0ZVVybChyZXF1ZXN0LnNjb3BlcykgKyBDb25zdGFudHMucmVzcG9uc2VfbW9kZV9mcmFnbWVudDtcclxuXHJcbiAgICAgIC8vIHNldCBzdGF0ZSBpbiBjYWNoZSBhbmQgcmVkaXJlY3QgdG8gdXJsTmF2aWdhdGVcclxuICAgICAgaWYgKHVybE5hdmlnYXRlKSB7XHJcbiAgICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMuc3RhdGVBY3F1aXJlVG9rZW4sIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSwgdGhpcy5pbkNvb2tpZSk7XHJcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlcGxhY2UodXJsTmF2aWdhdGUpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENoZWNrcyBpZiB0aGUgcmVkaXJlY3QgcmVzcG9uc2UgaXMgcmVjZWl2ZWQgZnJvbSB0aGUgU1RTLiBJbiBjYXNlIG9mIHJlZGlyZWN0LCB0aGUgdXJsIGZyYWdtZW50IGhhcyBlaXRoZXIgaWRfdG9rZW4sIGFjY2Vzc190b2tlbiBvciBlcnJvci5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gaGFzaCAtIEhhc2ggcGFzc2VkIGZyb20gcmVkaXJlY3QgcGFnZS5cclxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gLSB0cnVlIGlmIHJlc3BvbnNlIGNvbnRhaW5zIGlkX3Rva2VuLCBhY2Nlc3NfdG9rZW4gb3IgZXJyb3IsIGZhbHNlIG90aGVyd2lzZS5cclxuICAgKiBAaGlkZGVuXHJcbiAgICovXHJcbiAgLy8gVE9ETyAtIHJlbmFtZSB0aGlzLCB0aGUgbmFtZSBpcyBjb25mdXNpbmdcclxuICBpc0NhbGxiYWNrKGhhc2g6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gICAgaGFzaCA9IHRoaXMuZ2V0SGFzaChoYXNoKTtcclxuICAgIGNvbnN0IHBhcmFtZXRlcnMgPSBVdGlscy5kZXNlcmlhbGl6ZShoYXNoKTtcclxuICAgIHJldHVybiAoXHJcbiAgICAgIHBhcmFtZXRlcnMuaGFzT3duUHJvcGVydHkoQ29uc3RhbnRzLmVycm9yRGVzY3JpcHRpb24pIHx8XHJcbiAgICAgIHBhcmFtZXRlcnMuaGFzT3duUHJvcGVydHkoQ29uc3RhbnRzLmVycm9yKSB8fFxyXG4gICAgICBwYXJhbWV0ZXJzLmhhc093blByb3BlcnR5KENvbnN0YW50cy5hY2Nlc3NUb2tlbikgfHxcclxuICAgICAgcGFyYW1ldGVycy5oYXNPd25Qcm9wZXJ0eShDb25zdGFudHMuaWRUb2tlbilcclxuXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLy8jZW5kcmVnaW9uXHJcblxyXG4gIC8vI3JlZ2lvbiBQb3B1cCBGbG93XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYXRlIHRoZSBsb2dpbiBwcm9jZXNzIGJ5IG9wZW5pbmcgYSBwb3B1cCB3aW5kb3cuXHJcbiAgICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gc2NvcGVzIC0gUGVybWlzc2lvbnMgeW91IHdhbnQgaW5jbHVkZWQgaW4gdGhlIGFjY2VzcyB0b2tlbi4gTm90IGFsbCBzY29wZXMgYXJlICBndWFyYW50ZWVkIHRvIGJlIGluY2x1ZGVkIGluIHRoZSBhY2Nlc3MgdG9rZW4gcmV0dXJuZWQuXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV4dHJhUXVlcnlQYXJhbWV0ZXJzIC0gS2V5LXZhbHVlIHBhaXJzIHRvIHBhc3MgdG8gdGhlIFNUUyBkdXJpbmcgdGhlIGludGVyYWN0aXZlIGF1dGhlbnRpY2F0aW9uIGZsb3cuXHJcbiAgICogQHJldHVybnMge1Byb21pc2UuPHN0cmluZz59IC0gQSBQcm9taXNlIHRoYXQgaXMgZnVsZmlsbGVkIHdoZW4gdGhpcyBmdW5jdGlvbiBoYXMgY29tcGxldGVkLCBvciByZWplY3RlZCBpZiBhbiBlcnJvciB3YXMgcmFpc2VkLiBSZXR1cm5zIHRoZSB0b2tlbiBvciBlcnJvci5cclxuICAgKi9cclxuICBsb2dpblBvcHVwKHJlcXVlc3Q/OiBBdXRoZW50aWNhdGlvblBhcmFtZXRlcnMpOiBQcm9taXNlPEF1dGhSZXNwb25zZT4ge1xyXG4gICAgLy8gQ3JlYXRlcyBuYXZpZ2F0ZSB1cmw7IHNhdmVzIHZhbHVlIGluIGNhY2hlOyByZWRpcmVjdCB1c2VyIHRvIEFBRFxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPEF1dGhSZXNwb25zZT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAvLyBGYWlsIGlmIGxvZ2luIGlzIGFscmVhZHkgaW4gcHJvZ3Jlc3NcclxuICAgICAgaWYgKHRoaXMubG9naW5JblByb2dyZXNzKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlamVjdChDbGllbnRBdXRoRXJyb3IuY3JlYXRlTG9naW5JblByb2dyZXNzRXJyb3IoKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGlmIGV4dHJhU2NvcGVzVG9Db25zZW50IGlzIHBhc3NlZCwgYXBwZW5kIHRoZW0gdG8gdGhlIGxvZ2luIHJlcXVlc3RcclxuICAgICAgbGV0IHNjb3BlczogQXJyYXk8c3RyaW5nPiA9IHRoaXMuYXBwZW5kU2NvcGVzKHJlcXVlc3QpO1xyXG5cclxuICAgICAgLy8gVmFsaWRhdGUgYW5kIGZpbHRlciBzY29wZXMgKHRoZSB2YWxpZGF0ZSBmdW5jdGlvbiB3aWxsIHRocm93IGlmIHZhbGlkYXRpb24gZmFpbHMpXHJcbiAgICAgIHRoaXMudmFsaWRhdGVJbnB1dFNjb3BlKHNjb3BlcywgZmFsc2UpO1xyXG5cclxuICAgICAgbGV0IGFjY291bnQgPSB0aGlzLmdldEFjY291bnQoKTtcclxuXHJcbiAgICAgLy8gYWRkIHRoZSBwcm9tcHQgcGFyYW1ldGVyIHRvIHRoZSAnZXh0cmFRdWVyeVBhcmFtZXRlcnMnIGlmIHBhc3NlZFxyXG4gICAgICBpZiAoVXRpbHMuaXNTU09QYXJhbShyZXF1ZXN0KSkge1xyXG4gICAgICAgICAvLyBpZiBhY2NvdW50IGlzIG5vdCBwcm92aWRlZCwgd2UgcGFzcyBudWxsXHJcbiAgICAgICAgIHRoaXMubG9naW5Qb3B1cEhlbHBlcihhY2NvdW50LCByZXF1ZXN0LCByZXNvbHZlLCByZWplY3QsIHNjb3Blcyk7XHJcbiAgICAgIH1cclxuICAgICAgLy8gZWxzZSBoYW5kbGUgdGhlIGxpYnJhcnkgZGF0YVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICAvLyBFeHRyYWN0IEFEQUwgaWRfdG9rZW4gaWYgaXQgZXhpc3RzXHJcbiAgICAgICAgbGV0IGFkYWxJZFRva2VuID0gdGhpcy5leHRyYWN0QURBTElkVG9rZW4oKTtcclxuXHJcbiAgICAgICAgLy8gc2lsZW50IGxvZ2luIGlmIEFEQUwgaWRfdG9rZW4gaXMgcmV0cmlldmVkIHN1Y2Nlc3NmdWxseSAtIFNTT1xyXG4gICAgICAgIGlmIChhZGFsSWRUb2tlbiAmJiAhc2NvcGVzKSB7XHJcbiAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKFwiQURBTCdzIGlkVG9rZW4gZXhpc3RzLiBFeHRyYWN0aW5nIGxvZ2luIGluZm9ybWF0aW9uIGZyb20gQURBTCdzIGlkVG9rZW4gXCIpO1xyXG4gICAgICAgICAgbGV0IHRva2VuUmVxdWVzdDogQXV0aGVudGljYXRpb25QYXJhbWV0ZXJzID0gdGhpcy5idWlsZElEVG9rZW5SZXF1ZXN0KHJlcXVlc3QpO1xyXG5cclxuICAgICAgICAgIHRoaXMuc2lsZW50TG9naW4gPSB0cnVlO1xyXG4gICAgICAgICAgdGhpcy5hY3F1aXJlVG9rZW5TaWxlbnQodG9rZW5SZXF1ZXN0KVxyXG4gICAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcclxuICAgICAgICAgICAgdGhpcy5zaWxlbnRMb2dpbiA9IGZhbHNlO1xyXG4gICAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKFwiVW5pZmllZCBjYWNoZSBjYWxsIGlzIHN1Y2Nlc3NmdWxcIik7XHJcblxyXG4gICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlKTtcclxuICAgICAgICAgIH0sIChlcnJvcikgPT4ge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zaWxlbnRMb2dpbiA9IGZhbHNlO1xyXG4gICAgICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcihcIkVycm9yIG9jY3VycmVkIGR1cmluZyB1bmlmaWVkIGNhY2hlIEFUU1wiKTtcclxuICAgICAgICAgICAgdGhpcy5sb2dpblBvcHVwSGVscGVyKG51bGwsIHJlcXVlc3QsIHJlc29sdmUsIHJlamVjdCwgc2NvcGVzKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBlbHNlIHByb2NlZWQgd2l0aCBsb2dpblxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5sb2dpblBvcHVwSGVscGVyKG51bGwsIHJlcXVlc3QsIHJlc29sdmUsIHJlamVjdCwgc2NvcGVzICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhlbHBlciBmdW5jdGlvbiB0byBsb2dpblBvcHVwXHJcbiAgICpcclxuICAgKiBAaGlkZGVuXHJcbiAgICogQHBhcmFtIHJlc29sdmVcclxuICAgKiBAcGFyYW0gcmVqZWN0XHJcbiAgICogQHBhcmFtIHNjb3Blc1xyXG4gICAqIEBwYXJhbSBleHRyYVF1ZXJ5UGFyYW1ldGVyc1xyXG4gICAqL1xyXG4gIHByaXZhdGUgbG9naW5Qb3B1cEhlbHBlcihhY2NvdW50OiBBY2NvdW50LCByZXF1ZXN0OiBBdXRoZW50aWNhdGlvblBhcmFtZXRlcnMsIHJlc29sdmU6IGFueSwgcmVqZWN0OiBhbnksIHNjb3Blcz86IEFycmF5PHN0cmluZz4pIHtcclxuICAgIGlmICghc2NvcGVzKSB7XHJcbiAgICAgIHNjb3BlcyA9IFt0aGlzLmNsaWVudElkXTtcclxuICAgIH1cclxuICAgIGNvbnN0IHNjb3BlID0gc2NvcGVzLmpvaW4oXCIgXCIpLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgLy8gR2VuZXJhdGUgYSBwb3B1cCB3aW5kb3dcclxuICAgIGNvbnN0IHBvcFVwV2luZG93ID0gdGhpcy5vcGVuV2luZG93KFwiYWJvdXQ6YmxhbmtcIiwgXCJfYmxhbmtcIiwgMSwgdGhpcywgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgIGlmICghcG9wVXBXaW5kb3cpIHtcclxuICAgICAgLy8gV2UgcGFzcyByZWplY3QgaW4gb3BlbldpbmRvdywgd2UgcmVqZWN0IHRoZXJlIGR1cmluZyBhbiBlcnJvclxyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVHJhY2sgbG9naW4gcHJvZ3Jlc3NcclxuICAgIHRoaXMubG9naW5JblByb2dyZXNzID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBSZXNvbHZlIGVuZHBvaW50XHJcbiAgICB0aGlzLmF1dGhvcml0eUluc3RhbmNlLnJlc29sdmVFbmRwb2ludHNBc3luYygpLnRoZW4oKCkgPT4ge1xyXG4gICAgICBsZXQgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0ID0gbmV3IFNlcnZlclJlcXVlc3RQYXJhbWV0ZXJzKHRoaXMuYXV0aG9yaXR5SW5zdGFuY2UsIHRoaXMuY2xpZW50SWQsIHNjb3BlcywgUmVzcG9uc2VUeXBlcy5pZF90b2tlbiwgdGhpcy5nZXRSZWRpcmVjdFVyaSgpLCB0aGlzLmNvbmZpZy5hdXRoLnN0YXRlKTtcclxuXHJcbiAgICAgIC8vIHBvcHVsYXRlIFF1ZXJ5UGFyYW1ldGVycyAoc2lkL2xvZ2luX2hpbnQvZG9tYWluX2hpbnQpIGFuZCBhbnkgb3RoZXIgZXh0cmFRdWVyeVBhcmFtZXRlcnMgc2V0IGJ5IHRoZSBkZXZlbG9wZXI7XHJcbiAgICAgIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdCA9IHRoaXMucG9wdWxhdGVRdWVyeVBhcmFtcyhhY2NvdW50LCByZXF1ZXN0LCBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QpO1xyXG5cclxuICAgICAgLy8gQ2FjaGUgdGhlIHN0YXRlLCBub25jZSwgYW5kIGxvZ2luIHJlcXVlc3QgZGF0YVxyXG4gICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5sb2dpblJlcXVlc3QsIHdpbmRvdy5sb2NhdGlvbi5ocmVmLCB0aGlzLmluQ29va2llKTtcclxuICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubG9naW5FcnJvciwgXCJcIik7XHJcblxyXG4gICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5ub25jZUlkVG9rZW4sIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5ub25jZSwgdGhpcy5pbkNvb2tpZSk7XHJcblxyXG4gICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsRXJyb3IsIFwiXCIpO1xyXG4gICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsRXJyb3JEZXNjcmlwdGlvbiwgXCJcIik7XHJcblxyXG4gICAgICAvLyBjYWNoZSBhdXRob3JpdHlLZXlcclxuICAgICAgdGhpcy5zZXRBdXRob3JpdHlDYWNoZShzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGUsIHRoaXMuYXV0aG9yaXR5KTtcclxuXHJcbiAgICAgIC8vIEJ1aWxkIHRoZSBVUkwgdG8gbmF2aWdhdGUgdG8gaW4gdGhlIHBvcHVwIHdpbmRvd1xyXG4gICAgICBsZXQgdXJsTmF2aWdhdGUgPSBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QuY3JlYXRlTmF2aWdhdGVVcmwoc2NvcGVzKSAgKyBDb25zdGFudHMucmVzcG9uc2VfbW9kZV9mcmFnbWVudDtcclxuXHJcbiAgICAgIHdpbmRvdy5yZW5ld1N0YXRlcy5wdXNoKHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSk7XHJcbiAgICAgIHdpbmRvdy5yZXF1ZXN0VHlwZSA9IENvbnN0YW50cy5sb2dpbjtcclxuXHJcbiAgICAgIC8vIFJlZ2lzdGVyIGNhbGxiYWNrIHRvIGNhcHR1cmUgcmVzdWx0cyBmcm9tIHNlcnZlclxyXG4gICAgICB0aGlzLnJlZ2lzdGVyQ2FsbGJhY2soc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlLCBzY29wZSwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuXHJcbiAgICAgIC8vIE5hdmlnYXRlIHVybCBpbiBwb3B1cFdpbmRvd1xyXG4gICAgICBpZiAocG9wVXBXaW5kb3cpIHtcclxuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvUGlpKFwiTmF2aWdhdGVkIFBvcHVwIHdpbmRvdyB0bzpcIiArIHVybE5hdmlnYXRlKTtcclxuICAgICAgICBwb3BVcFdpbmRvdy5sb2NhdGlvbi5ocmVmID0gdXJsTmF2aWdhdGU7XHJcbiAgICAgIH1cclxuICAgIH0sICgpID0+IHtcclxuICAgICAgLy8gRW5kcG9pbnQgcmVzb2x1dGlvbiBmYWlsdXJlIGVycm9yXHJcbiAgICAgIHRoaXMubG9nZ2VyLmluZm8oQ2xpZW50QXV0aEVycm9yTWVzc2FnZS5lbmRwb2ludFJlc29sdXRpb25FcnJvci5jb2RlICsgXCI6XCIgKyBDbGllbnRBdXRoRXJyb3JNZXNzYWdlLmVuZHBvaW50UmVzb2x1dGlvbkVycm9yLmRlc2MpO1xyXG4gICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsRXJyb3IsIENsaWVudEF1dGhFcnJvck1lc3NhZ2UuZW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IuY29kZSk7XHJcbiAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLm1zYWxFcnJvckRlc2NyaXB0aW9uLCBDbGllbnRBdXRoRXJyb3JNZXNzYWdlLmVuZHBvaW50UmVzb2x1dGlvbkVycm9yLmRlc2MpO1xyXG5cclxuICAgICAgLy8gV2hhdCBpcyB0aGlzPyBJcyB0aGlzIHRoZSByZWplY3QgdGhhdCBpcyBwYXNzZWQgaW4/PyAtLSBSRURPIHRoaXMgaW4gdGhlIHN1YnNlcXVlbnQgcmVmYWN0b3IsIHBhc3NpbmcgcmVqZWN0IGlzIGNvbmZ1c2luZ1xyXG4gICAgICBpZiAocmVqZWN0KSB7XHJcbiAgICAgICAgcmVqZWN0KENsaWVudEF1dGhFcnJvci5jcmVhdGVFbmRwb2ludFJlc29sdXRpb25FcnJvcigpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQ2xvc2UgdGhlIHBvcHVwIHdpbmRvd1xyXG4gICAgICBpZiAocG9wVXBXaW5kb3cpIHtcclxuICAgICAgICBwb3BVcFdpbmRvdy5jbG9zZSgpO1xyXG4gICAgICB9XHJcbiAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XHJcbiAgICAgIC8vIEFsbCBjYXRjaCAtIHdoZW4gaXMgdGhpcyBleGVjdXRlZD8gUG9zc2libHkgd2hlbiBlcnJvciBpcyB0aHJvd24sIGJ1dCBub3QgaWYgcHJldmlvdXMgZnVuY3Rpb24gcmVqZWN0cyBpbnN0ZWFkIG9mIHRocm93aW5nXHJcbiAgICAgIHRoaXMubG9nZ2VyLndhcm5pbmcoXCJjb3VsZCBub3QgcmVzb2x2ZSBlbmRwb2ludHNcIik7XHJcbiAgICAgIHJlamVjdChDbGllbnRBdXRoRXJyb3IuY3JlYXRlRW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IoZXJyLnRvU3RyaW5nKSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVzZWQgdG8gYWNxdWlyZSBhbiBhY2Nlc3MgdG9rZW4gZm9yIGEgbmV3IHVzZXIgdXNpbmcgaW50ZXJhY3RpdmUgYXV0aGVudGljYXRpb24gdmlhIGEgcG9wdXAgV2luZG93LlxyXG4gICAqIFRvIHJlcXVlc3QgYW4gaWRfdG9rZW4sIHBhc3MgdGhlIGNsaWVudElkIGFzIHRoZSBvbmx5IHNjb3BlIGluIHRoZSBzY29wZXMgYXJyYXkuXHJcbiAgICogQHBhcmFtIHtBcnJheTxzdHJpbmc+fSBzY29wZXMgLSBQZXJtaXNzaW9ucyB5b3Ugd2FudCBpbmNsdWRlZCBpbiB0aGUgYWNjZXNzIHRva2VuLiBOb3QgYWxsIHNjb3BlcyBhcmUgIGd1YXJhbnRlZWQgdG8gYmUgaW5jbHVkZWQgaW4gdGhlIGFjY2VzcyB0b2tlbi4gU2NvcGVzIGxpa2UgXCJvcGVuaWRcIiBhbmQgXCJwcm9maWxlXCIgYXJlIHNlbnQgd2l0aCBldmVyeSByZXF1ZXN0LlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhdXRob3JpdHkgLSBBIFVSTCBpbmRpY2F0aW5nIGEgZGlyZWN0b3J5IHRoYXQgTVNBTCBjYW4gdXNlIHRvIG9idGFpbiB0b2tlbnMuXHJcbiAgICogLSBJbiBBenVyZSBBRCwgaXQgaXMgb2YgdGhlIGZvcm0gaHR0cHM6Ly8mbHQ7dGVuYW50Jmd0Oy8mbHQ7dGVuYW50Jmd0Oywgd2hlcmUgJmx0O3RlbmFudCZndDsgaXMgdGhlIGRpcmVjdG9yeSBob3N0IChlLmcuIGh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbSkgYW5kICZsdDt0ZW5hbnQmZ3Q7IGlzIGEgaWRlbnRpZmllciB3aXRoaW4gdGhlIGRpcmVjdG9yeSBpdHNlbGYgKGUuZy4gYSBkb21haW4gYXNzb2NpYXRlZCB0byB0aGUgdGVuYW50LCBzdWNoIGFzIGNvbnRvc28ub25taWNyb3NvZnQuY29tLCBvciB0aGUgR1VJRCByZXByZXNlbnRpbmcgdGhlIFRlbmFudElEIHByb3BlcnR5IG9mIHRoZSBkaXJlY3RvcnkpXHJcbiAgICogLSBJbiBBenVyZSBCMkMsIGl0IGlzIG9mIHRoZSBmb3JtIGh0dHBzOi8vJmx0O2luc3RhbmNlJmd0Oy90ZnAvJmx0O3RlbmFudCZndDsvPHBvbGljeU5hbWU+L1xyXG4gICAqIC0gRGVmYXVsdCB2YWx1ZSBpczogXCJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vY29tbW9uXCIuXHJcbiAgICogQHBhcmFtIHtBY2NvdW50fSBhY2NvdW50IC0gVGhlIGFjY291bnQgZm9yIHdoaWNoIHRoZSBzY29wZXMgYXJlIHJlcXVlc3RlZC5UaGUgZGVmYXVsdCBhY2NvdW50IGlzIHRoZSBsb2dnZWQgaW4gYWNjb3VudC5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXh0cmFRdWVyeVBhcmFtZXRlcnMgLSBLZXktdmFsdWUgcGFpcnMgdG8gcGFzcyB0byB0aGUgU1RTIGR1cmluZyB0aGUgIGF1dGhlbnRpY2F0aW9uIGZsb3cuXHJcbiAgICogQHJldHVybnMge1Byb21pc2UuPHN0cmluZz59IC0gQSBQcm9taXNlIHRoYXQgaXMgZnVsZmlsbGVkIHdoZW4gdGhpcyBmdW5jdGlvbiBoYXMgY29tcGxldGVkLCBvciByZWplY3RlZCBpZiBhbiBlcnJvciB3YXMgcmFpc2VkLiBSZXR1cm5zIHRoZSB0b2tlbiBvciBlcnJvci5cclxuICAgKi9cclxuICBhY3F1aXJlVG9rZW5Qb3B1cChyZXF1ZXN0OiBBdXRoZW50aWNhdGlvblBhcmFtZXRlcnMpOiBQcm9taXNlPEF1dGhSZXNwb25zZT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPEF1dGhSZXNwb25zZT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAvLyBWYWxpZGF0ZSBhbmQgZmlsdGVyIHNjb3BlcyAodGhlIHZhbGlkYXRlIGZ1bmN0aW9uIHdpbGwgdGhyb3cgaWYgdmFsaWRhdGlvbiBmYWlscylcclxuICAgICAgdGhpcy52YWxpZGF0ZUlucHV0U2NvcGUocmVxdWVzdC5zY29wZXMsIHRydWUpO1xyXG5cclxuICAgICAgY29uc3Qgc2NvcGUgPSByZXF1ZXN0LnNjb3Blcy5qb2luKFwiIFwiKS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgLy8gR2V0IHRoZSBhY2NvdW50IG9iamVjdCBpZiBhIHNlc3Npb24gZXhpc3RzXHJcbiAgICAgIGNvbnN0IGFjY291bnQ6IEFjY291bnQgPSByZXF1ZXN0LmFjY291bnQgfHwgdGhpcy5nZXRBY2NvdW50KCk7XHJcblxyXG4gICAgICAvLyBJZiBhbHJlYWR5IGluIHByb2dyZXNzLCB0aHJvdyBhbiBlcnJvciBhbmQgcmVqZWN0IHRoZSByZXF1ZXN0XHJcbiAgICAgIGlmICh0aGlzLmFjcXVpcmVUb2tlbkluUHJvZ3Jlc3MpIHtcclxuICAgICAgICByZXR1cm4gcmVqZWN0KENsaWVudEF1dGhFcnJvci5jcmVhdGVBY3F1aXJlVG9rZW5JblByb2dyZXNzRXJyb3IoKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIElmIG5vIHNlc3Npb24gZXhpc3RzLCBwcm9tcHQgdGhlIHVzZXIgdG8gbG9naW4uXHJcbiAgICAgIGlmICghYWNjb3VudCAmJiAhIShyZXF1ZXN0LnNpZCAgfHwgcmVxdWVzdC5sb2dpbkhpbnQpKSB7XHJcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbyhcIlVzZXIgbG9naW4gaXMgcmVxdWlyZWRcIik7XHJcbiAgICAgICAgcmV0dXJuIHJlamVjdChDbGllbnRBdXRoRXJyb3IuY3JlYXRlVXNlckxvZ2luUmVxdWlyZWRFcnJvcigpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gdHJhY2sgdGhlIGFjcXVpcmVUb2tlbiBwcm9ncmVzc1xyXG4gICAgICB0aGlzLmFjcXVpcmVUb2tlbkluUHJvZ3Jlc3MgPSB0cnVlO1xyXG5cclxuICAgICAgbGV0IHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdDogU2VydmVyUmVxdWVzdFBhcmFtZXRlcnM7XHJcbiAgICAgIGNvbnN0IGFjcXVpcmVUb2tlbkF1dGhvcml0eSA9IHJlcXVlc3QuYXV0aG9yaXR5ID8gQXV0aG9yaXR5RmFjdG9yeS5DcmVhdGVJbnN0YW5jZShyZXF1ZXN0LmF1dGhvcml0eSwgdGhpcy5jb25maWcuYXV0aC52YWxpZGF0ZUF1dGhvcml0eSkgOiB0aGlzLmF1dGhvcml0eUluc3RhbmNlO1xyXG5cclxuICAgICAgLy8gT3BlbiB0aGUgcG9wdXAgd2luZG93XHJcbiAgICAgIGNvbnN0IHBvcFVwV2luZG93ID0gdGhpcy5vcGVuV2luZG93KFwiYWJvdXQ6YmxhbmtcIiwgXCJfYmxhbmtcIiwgMSwgdGhpcywgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgaWYgKCFwb3BVcFdpbmRvdykge1xyXG4gICAgICAgIC8vIFdlIHBhc3MgcmVqZWN0IHRvIG9wZW5XaW5kb3csIHNvIHdlIGFyZSByZWplY3RpbmcgdGhlcmUuXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBhY3F1aXJlVG9rZW5BdXRob3JpdHkucmVzb2x2ZUVuZHBvaW50c0FzeW5jKCkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgLy8gT24gZnVsbGZpbGxtZW50XHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2VUeXBlID0gdGhpcy5nZXRUb2tlblR5cGUoYWNjb3VudCwgcmVxdWVzdC5zY29wZXMsIGZhbHNlKTtcclxuICAgICAgICBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QgPSBuZXcgU2VydmVyUmVxdWVzdFBhcmFtZXRlcnMoXHJcbiAgICAgICAgICBhY3F1aXJlVG9rZW5BdXRob3JpdHksXHJcbiAgICAgICAgICB0aGlzLmNsaWVudElkLFxyXG4gICAgICAgICAgcmVxdWVzdC5zY29wZXMsXHJcbiAgICAgICAgICByZXNwb25zZVR5cGUsXHJcbiAgICAgICAgICB0aGlzLmdldFJlZGlyZWN0VXJpKCksXHJcbiAgICAgICAgICB0aGlzLmNvbmZpZy5hdXRoLnN0YXRlXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gcG9wdWxhdGUgUXVlcnlQYXJhbWV0ZXJzIChzaWQvbG9naW5faGludC9kb21haW5faGludCkgYW5kIGFueSBvdGhlciBleHRyYVF1ZXJ5UGFyYW1ldGVycyBzZXQgYnkgdGhlIGRldmVsb3BlclxyXG4gICAgICAgIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdCA9IHRoaXMucG9wdWxhdGVRdWVyeVBhcmFtcyhhY2NvdW50LCByZXF1ZXN0LCBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QpO1xyXG5cclxuICAgICAgICAvLyBDYWNoZSBub25jZVxyXG4gICAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLm5vbmNlSWRUb2tlbiwgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0Lm5vbmNlLCB0aGlzLmluQ29va2llKTtcclxuICAgICAgICBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGUgPSBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGU7XHJcblxyXG4gICAgICAgIC8vIENhY2hlIGFjY291bnQgYW5kIGF1dGhvcml0eVxyXG4gICAgICAgIHRoaXMuc2V0QWNjb3VudENhY2hlKGFjY291bnQsIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSk7XHJcbiAgICAgICAgdGhpcy5zZXRBdXRob3JpdHlDYWNoZShzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGUsIGFjcXVpcmVUb2tlbkF1dGhvcml0eS5DYW5vbmljYWxBdXRob3JpdHkpO1xyXG5cclxuICAgICAgICAvLyBDb25zdHJ1Y3QgdGhlIHVybE5hdmlnYXRlXHJcbiAgICAgICAgbGV0IHVybE5hdmlnYXRlID0gc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LmNyZWF0ZU5hdmlnYXRlVXJsKHJlcXVlc3Quc2NvcGVzKSArIENvbnN0YW50cy5yZXNwb25zZV9tb2RlX2ZyYWdtZW50O1xyXG5cclxuICAgICAgICB3aW5kb3cucmVuZXdTdGF0ZXMucHVzaChzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGUpO1xyXG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0VHlwZSA9IENvbnN0YW50cy5yZW5ld1Rva2VuO1xyXG4gICAgICAgIHRoaXMucmVnaXN0ZXJDYWxsYmFjayhzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGUsIHNjb3BlLCByZXNvbHZlLCByZWplY3QpO1xyXG5cclxuICAgICAgICAvLyBvcGVuIHBvcHVwIHdpbmRvdyB0byB1cmxOYXZpZ2F0ZVxyXG4gICAgICAgIGlmIChwb3BVcFdpbmRvdykge1xyXG4gICAgICAgICAgcG9wVXBXaW5kb3cubG9jYXRpb24uaHJlZiA9IHVybE5hdmlnYXRlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0sICgpID0+IHtcclxuICAgICAgICAvLyBPbiByZWplY3Rpb25cclxuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKENsaWVudEF1dGhFcnJvck1lc3NhZ2UuZW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IuY29kZSArIFwiOlwiICsgQ2xpZW50QXV0aEVycm9yTWVzc2FnZS5lbmRwb2ludFJlc29sdXRpb25FcnJvci5kZXNjKTtcclxuICAgICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsRXJyb3IsIENsaWVudEF1dGhFcnJvck1lc3NhZ2UuZW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IuY29kZSk7XHJcbiAgICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbEVycm9yRGVzY3JpcHRpb24sIENsaWVudEF1dGhFcnJvck1lc3NhZ2UuZW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IuZGVzYyk7XHJcblxyXG4gICAgICAgIGlmIChyZWplY3QpIHtcclxuICAgICAgICAgIHJlamVjdChDbGllbnRBdXRoRXJyb3IuY3JlYXRlRW5kcG9pbnRSZXNvbHV0aW9uRXJyb3IoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChwb3BVcFdpbmRvdykge1xyXG4gICAgICAgICAgICBwb3BVcFdpbmRvdy5jbG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xyXG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm5pbmcoXCJjb3VsZCBub3QgcmVzb2x2ZSBlbmRwb2ludHNcIik7XHJcbiAgICAgICAgcmVqZWN0KENsaWVudEF1dGhFcnJvci5jcmVhdGVFbmRwb2ludFJlc29sdXRpb25FcnJvcihlcnIudG9TdHJpbmcoKSkpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXNlZCB0byBzZW5kIHRoZSB1c2VyIHRvIHRoZSByZWRpcmVjdF91cmkgYWZ0ZXIgYXV0aGVudGljYXRpb24gaXMgY29tcGxldGUuIFRoZSB1c2VyJ3MgYmVhcmVyIHRva2VuIGlzIGF0dGFjaGVkIHRvIHRoZSBVUkkgZnJhZ21lbnQgYXMgYW4gaWRfdG9rZW4vYWNjZXNzX3Rva2VuIGZpZWxkLlxyXG4gICAqIFRoaXMgZnVuY3Rpb24gYWxzbyBjbG9zZXMgdGhlIHBvcHVwIHdpbmRvdyBhZnRlciByZWRpcmVjdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1cmxOYXZpZ2F0ZVxyXG4gICAqIEBwYXJhbSB0aXRsZVxyXG4gICAqIEBwYXJhbSBpbnRlcnZhbFxyXG4gICAqIEBwYXJhbSBpbnN0YW5jZVxyXG4gICAqIEBwYXJhbSByZXNvbHZlXHJcbiAgICogQHBhcmFtIHJlamVjdFxyXG4gICAqIEBoaWRkZW5cclxuICAgKiBAaWdub3JlXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBvcGVuV2luZG93KHVybE5hdmlnYXRlOiBzdHJpbmcsIHRpdGxlOiBzdHJpbmcsIGludGVydmFsOiBudW1iZXIsIGluc3RhbmNlOiB0aGlzLCByZXNvbHZlPzogRnVuY3Rpb24sIHJlamVjdD86IEZ1bmN0aW9uKTogV2luZG93IHtcclxuICAgIC8vIEdlbmVyYXRlIGEgcG9wdXAgd2luZG93XHJcbiAgICB2YXIgcG9wdXBXaW5kb3c6IFdpbmRvdztcclxuICAgIHRyeSB7XHJcbiAgICAgIHBvcHVwV2luZG93ID0gdGhpcy5vcGVuUG9wdXAodXJsTmF2aWdhdGUsIHRpdGxlLCBDb25zdGFudHMucG9wVXBXaWR0aCwgQ29uc3RhbnRzLnBvcFVwSGVpZ2h0KTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgaW5zdGFuY2UubG9naW5JblByb2dyZXNzID0gZmFsc2U7XHJcbiAgICAgIGluc3RhbmNlLmFjcXVpcmVUb2tlbkluUHJvZ3Jlc3MgPSBmYWxzZTtcclxuXHJcbiAgICAgIHRoaXMubG9nZ2VyLmluZm8oQ2xpZW50QXV0aEVycm9yTWVzc2FnZS5wb3BVcFdpbmRvd0Vycm9yLmNvZGUgKyBcIjpcIiArIENsaWVudEF1dGhFcnJvck1lc3NhZ2UucG9wVXBXaW5kb3dFcnJvci5kZXNjKTtcclxuICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbEVycm9yLCBDbGllbnRBdXRoRXJyb3JNZXNzYWdlLnBvcFVwV2luZG93RXJyb3IuY29kZSk7XHJcbiAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLm1zYWxFcnJvckRlc2NyaXB0aW9uLCBDbGllbnRBdXRoRXJyb3JNZXNzYWdlLnBvcFVwV2luZG93RXJyb3IuZGVzYyk7XHJcbiAgICAgIGlmIChyZWplY3QpIHtcclxuICAgICAgICByZWplY3QoQ2xpZW50QXV0aEVycm9yLmNyZWF0ZVBvcHVwV2luZG93RXJyb3IoKSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUHVzaCBwb3B1cCB3aW5kb3cgaGFuZGxlIG9udG8gc3RhY2sgZm9yIHRyYWNraW5nXHJcbiAgICB3aW5kb3cub3BlbmVkV2luZG93cy5wdXNoKHBvcHVwV2luZG93KTtcclxuXHJcbiAgICBjb25zdCBwb2xsVGltZXIgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICAvLyBJZiBwb3B1cCBjbG9zZWQgb3IgbG9naW4gaW4gcHJvZ3Jlc3MsIGNhbmNlbCBsb2dpblxyXG4gICAgICBpZiAocG9wdXBXaW5kb3cgJiYgcG9wdXBXaW5kb3cuY2xvc2VkICYmIGluc3RhbmNlLmxvZ2luSW5Qcm9ncmVzcykge1xyXG4gICAgICAgIGlmIChyZWplY3QpIHtcclxuICAgICAgICAgIHJlamVjdChDbGllbnRBdXRoRXJyb3IuY3JlYXRlVXNlckNhbmNlbGxlZEVycm9yKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChwb2xsVGltZXIpO1xyXG4gICAgICAgIGlmICh0aGlzLmNvbmZpZy5mcmFtZXdvcmsuaXNBbmd1bGFyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0KFwibXNhbDpwb3BVcENsb3NlZFwiLCBDbGllbnRBdXRoRXJyb3JNZXNzYWdlLnVzZXJDYW5jZWxsZWRFcnJvci5jb2RlICsgQ29uc3RhbnRzLnJlc291cmNlRGVsaW1pdGVyICsgQ2xpZW50QXV0aEVycm9yTWVzc2FnZS51c2VyQ2FuY2VsbGVkRXJyb3IuZGVzYyk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaW5zdGFuY2UubG9naW5JblByb2dyZXNzID0gZmFsc2U7XHJcbiAgICAgICAgaW5zdGFuY2UuYWNxdWlyZVRva2VuSW5Qcm9ncmVzcyA9IGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHBvcFVwV2luZG93TG9jYXRpb24gPSBwb3B1cFdpbmRvdy5sb2NhdGlvbjtcclxuXHJcbiAgICAgICAgLy8gSWYgdGhlIHBvcHVwIGhhc2ggY2hhbmdlcywgY2xvc2UgdGhlIHBvcHVwIHdpbmRvd1xyXG4gICAgICAgIGlmIChwb3BVcFdpbmRvd0xvY2F0aW9uLmhyZWYuaW5kZXhPZih0aGlzLmdldFJlZGlyZWN0VXJpKCkpICE9PSAtMSkge1xyXG4gICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwocG9sbFRpbWVyKTtcclxuICAgICAgICAgIGluc3RhbmNlLmxvZ2luSW5Qcm9ncmVzcyA9IGZhbHNlO1xyXG4gICAgICAgICAgaW5zdGFuY2UuYWNxdWlyZVRva2VuSW5Qcm9ncmVzcyA9IGZhbHNlO1xyXG4gICAgICAgICAgdGhpcy5sb2dnZXIuaW5mbyhcIkNsb3NpbmcgcG9wdXAgd2luZG93XCIpO1xyXG4gICAgICAgICAgLy8gVE9ETzogQ2hlY2sgaG93IHRoaXMgY2FuIGJlIGV4dHJhY3RlZCBmb3IgYW55IGZyYW1ld29yayBzcGVjaWZpYyBjb2RlP1xyXG4gICAgICAgICAgaWYgKHRoaXMuY29uZmlnLmZyYW1ld29yay5pc0FuZ3VsYXIpIHtcclxuICAgICAgICAgICAgICB0aGlzLmJyb2FkY2FzdChcIm1zYWw6cG9wVXBIYXNoQ2hhbmdlZFwiLCBwb3BVcFdpbmRvd0xvY2F0aW9uLmhhc2gpO1xyXG4gICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgd2luZG93Lm9wZW5lZFdpbmRvd3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgd2luZG93Lm9wZW5lZFdpbmRvd3NbaV0uY2xvc2UoKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgLy8gQ3Jvc3MgRG9tYWluIHVybCBjaGVjayBlcnJvci5cclxuICAgICAgICAvLyBXaWxsIGJlIHRocm93biB1bnRpbCBBQUQgcmVkaXJlY3RzIHRoZSB1c2VyIGJhY2sgdG8gdGhlIGFwcFwicyByb290IHBhZ2Ugd2l0aCB0aGUgdG9rZW4uXHJcbiAgICAgICAgLy8gTm8gbmVlZCB0byBsb2cgb3IgdGhyb3cgdGhpcyBlcnJvciBhcyBpdCB3aWxsIGNyZWF0ZSB1bm5lY2Vzc2FyeSB0cmFmZmljLlxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgaW50ZXJ2YWwpO1xyXG5cclxuICAgIHJldHVybiBwb3B1cFdpbmRvdztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbmZpZ3VyZXMgcG9wdXAgd2luZG93IGZvciBsb2dpbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1cmxOYXZpZ2F0ZVxyXG4gICAqIEBwYXJhbSB0aXRsZVxyXG4gICAqIEBwYXJhbSBwb3BVcFdpZHRoXHJcbiAgICogQHBhcmFtIHBvcFVwSGVpZ2h0XHJcbiAgICogQGlnbm9yZVxyXG4gICAqIEBoaWRkZW5cclxuICAgKi9cclxuICBwcml2YXRlIG9wZW5Qb3B1cCh1cmxOYXZpZ2F0ZTogc3RyaW5nLCB0aXRsZTogc3RyaW5nLCBwb3BVcFdpZHRoOiBudW1iZXIsIHBvcFVwSGVpZ2h0OiBudW1iZXIpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBhZGRpbmcgd2luTGVmdCBhbmQgd2luVG9wIHRvIGFjY291bnQgZm9yIGR1YWwgbW9uaXRvclxyXG4gICAgICAgKiB1c2luZyBzY3JlZW5MZWZ0IGFuZCBzY3JlZW5Ub3AgZm9yIElFOCBhbmQgZWFybGllclxyXG4gICAgICAgKi9cclxuICAgICAgY29uc3Qgd2luTGVmdCA9IHdpbmRvdy5zY3JlZW5MZWZ0ID8gd2luZG93LnNjcmVlbkxlZnQgOiB3aW5kb3cuc2NyZWVuWDtcclxuICAgICAgY29uc3Qgd2luVG9wID0gd2luZG93LnNjcmVlblRvcCA/IHdpbmRvdy5zY3JlZW5Ub3AgOiB3aW5kb3cuc2NyZWVuWTtcclxuICAgICAgLyoqXHJcbiAgICAgICAqIHdpbmRvdy5pbm5lcldpZHRoIGRpc3BsYXlzIGJyb3dzZXIgd2luZG93XCJzIGhlaWdodCBhbmQgd2lkdGggZXhjbHVkaW5nIHRvb2xiYXJzXHJcbiAgICAgICAqIHVzaW5nIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCBmb3IgSUU4IGFuZCBlYXJsaWVyXHJcbiAgICAgICAqL1xyXG4gICAgICBjb25zdCB3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCB8fCBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoO1xyXG4gICAgICBjb25zdCBoZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCB8fCBkb2N1bWVudC5ib2R5LmNsaWVudEhlaWdodDtcclxuICAgICAgY29uc3QgbGVmdCA9ICgod2lkdGggLyAyKSAtIChwb3BVcFdpZHRoIC8gMikpICsgd2luTGVmdDtcclxuICAgICAgY29uc3QgdG9wID0gKChoZWlnaHQgLyAyKSAtIChwb3BVcEhlaWdodCAvIDIpKSArIHdpblRvcDtcclxuXHJcbiAgICAgIC8vIG9wZW4gdGhlIHdpbmRvd1xyXG4gICAgICBjb25zdCBwb3B1cFdpbmRvdyA9IHdpbmRvdy5vcGVuKHVybE5hdmlnYXRlLCB0aXRsZSwgXCJ3aWR0aD1cIiArIHBvcFVwV2lkdGggKyBcIiwgaGVpZ2h0PVwiICsgcG9wVXBIZWlnaHQgKyBcIiwgdG9wPVwiICsgdG9wICsgXCIsIGxlZnQ9XCIgKyBsZWZ0KTtcclxuICAgICAgaWYgKCFwb3B1cFdpbmRvdykge1xyXG4gICAgICAgIHRocm93IENsaWVudEF1dGhFcnJvci5jcmVhdGVQb3B1cFdpbmRvd0Vycm9yKCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHBvcHVwV2luZG93LmZvY3VzKSB7XHJcbiAgICAgICAgcG9wdXBXaW5kb3cuZm9jdXMoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHBvcHVwV2luZG93O1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcihcImVycm9yIG9wZW5pbmcgcG9wdXAgXCIgKyBlLm1lc3NhZ2UpO1xyXG4gICAgICB0aGlzLmxvZ2luSW5Qcm9ncmVzcyA9IGZhbHNlO1xyXG4gICAgICB0aGlzLmFjcXVpcmVUb2tlbkluUHJvZ3Jlc3MgPSBmYWxzZTtcclxuICAgICAgdGhyb3cgQ2xpZW50QXV0aEVycm9yLmNyZWF0ZVBvcHVwV2luZG93RXJyb3IoZS50b1N0cmluZygpKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vI2VuZHJlZ2lvblxyXG5cclxuICAvLyNyZWdpb24gU2lsZW50IEZsb3dcclxuXHJcbiAgLyoqXHJcbiAgICogVXNlZCB0byBnZXQgdGhlIHRva2VuIGZyb20gY2FjaGUuXHJcbiAgICogTVNBTCB3aWxsIHJldHVybiB0aGUgY2FjaGVkIHRva2VuIGlmIGl0IGlzIG5vdCBleHBpcmVkLlxyXG4gICAqIE9yIGl0IHdpbGwgc2VuZCBhIHJlcXVlc3QgdG8gdGhlIFNUUyB0byBvYnRhaW4gYW4gYWNjZXNzX3Rva2VuIHVzaW5nIGEgaGlkZGVuIGlmcmFtZS4gVG8gcmVuZXcgaWRUb2tlbiwgY2xpZW50SWQgc2hvdWxkIGJlIHBhc3NlZCBhcyB0aGUgb25seSBzY29wZSBpbiB0aGUgc2NvcGVzIGFycmF5LlxyXG4gICAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nPn0gc2NvcGVzIC0gUGVybWlzc2lvbnMgeW91IHdhbnQgaW5jbHVkZWQgaW4gdGhlIGFjY2VzcyB0b2tlbi4gTm90IGFsbCBzY29wZXMgYXJlICBndWFyYW50ZWVkIHRvIGJlIGluY2x1ZGVkIGluIHRoZSBhY2Nlc3MgdG9rZW4uIFNjb3BlcyBsaWtlIFwib3BlbmlkXCIgYW5kIFwicHJvZmlsZVwiIGFyZSBzZW50IHdpdGggZXZlcnkgcmVxdWVzdC5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gYXV0aG9yaXR5IC0gQSBVUkwgaW5kaWNhdGluZyBhIGRpcmVjdG9yeSB0aGF0IE1TQUwgY2FuIHVzZSB0byBvYnRhaW4gdG9rZW5zLlxyXG4gICAqIC0gSW4gQXp1cmUgQUQsIGl0IGlzIG9mIHRoZSBmb3JtIGh0dHBzOi8vJmx0O3RlbmFudCZndDsvJmx0O3RlbmFudCZndDssIHdoZXJlICZsdDt0ZW5hbnQmZ3Q7IGlzIHRoZSBkaXJlY3RvcnkgaG9zdCAoZS5nLiBodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20pIGFuZCAmbHQ7dGVuYW50Jmd0OyBpcyBhIGlkZW50aWZpZXIgd2l0aGluIHRoZSBkaXJlY3RvcnkgaXRzZWxmIChlLmcuIGEgZG9tYWluIGFzc29jaWF0ZWQgdG8gdGhlIHRlbmFudCwgc3VjaCBhcyBjb250b3NvLm9ubWljcm9zb2Z0LmNvbSwgb3IgdGhlIEdVSUQgcmVwcmVzZW50aW5nIHRoZSBUZW5hbnRJRCBwcm9wZXJ0eSBvZiB0aGUgZGlyZWN0b3J5KVxyXG4gICAqIC0gSW4gQXp1cmUgQjJDLCBpdCBpcyBvZiB0aGUgZm9ybSBodHRwczovLyZsdDtpbnN0YW5jZSZndDsvdGZwLyZsdDt0ZW5hbnQmZ3Q7Lzxwb2xpY3lOYW1lPi9cclxuICAgKiAtIERlZmF1bHQgdmFsdWUgaXM6IFwiaHR0cHM6Ly9sb2dpbi5taWNyb3NvZnRvbmxpbmUuY29tL2NvbW1vblwiXHJcbiAgICogQHBhcmFtIHtBY2NvdW50fSBhY2NvdW50IC0gVGhlIHVzZXIgYWNjb3VudCBmb3Igd2hpY2ggdGhlIHNjb3BlcyBhcmUgcmVxdWVzdGVkLlRoZSBkZWZhdWx0IGFjY291bnQgaXMgdGhlIGxvZ2dlZCBpbiBhY2NvdW50LlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBleHRyYVF1ZXJ5UGFyYW1ldGVycyAtIEtleS12YWx1ZSBwYWlycyB0byBwYXNzIHRvIHRoZSBTVFMgZHVyaW5nIHRoZSAgYXV0aGVudGljYXRpb24gZmxvdy5cclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZS48c3RyaW5nPn0gLSBBIFByb21pc2UgdGhhdCBpcyBmdWxmaWxsZWQgd2hlbiB0aGlzIGZ1bmN0aW9uIGhhcyBjb21wbGV0ZWQsIG9yIHJlamVjdGVkIGlmIGFuIGVycm9yIHdhcyByYWlzZWQuIFJlc29sdmVkIHdpdGggdG9rZW4gb3IgcmVqZWN0ZWQgd2l0aCBlcnJvci5cclxuICAgKi9cclxuICBAcmVzb2x2ZVRva2VuT25seUlmT3V0T2ZJZnJhbWVcclxuICBhY3F1aXJlVG9rZW5TaWxlbnQocmVxdWVzdDogQXV0aGVudGljYXRpb25QYXJhbWV0ZXJzKTogUHJvbWlzZTxBdXRoUmVzcG9uc2U+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxBdXRoUmVzcG9uc2U+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuXHJcbiAgICAgIC8vIFZhbGlkYXRlIGFuZCBmaWx0ZXIgc2NvcGVzICh0aGUgdmFsaWRhdGUgZnVuY3Rpb24gd2lsbCB0aHJvdyBpZiB2YWxpZGF0aW9uIGZhaWxzKVxyXG4gICAgICB0aGlzLnZhbGlkYXRlSW5wdXRTY29wZShyZXF1ZXN0LnNjb3BlcywgdHJ1ZSk7XHJcblxyXG4gICAgICBjb25zdCBzY29wZSA9IHJlcXVlc3Quc2NvcGVzLmpvaW4oXCIgXCIpLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAvLyBpZiB0aGUgZGV2ZWxvcGVyIHBhc3NlcyBhbiBhY2NvdW50IGdpdmUgaGltIHRoZSBwcmlvcml0eVxyXG4gICAgICBjb25zdCBhY2NvdW50OiBBY2NvdW50ID0gcmVxdWVzdC5hY2NvdW50IHx8IHRoaXMuZ2V0QWNjb3VudCgpO1xyXG5cclxuICAgICAgLy8gZXh0cmFjdCBpZiB0aGVyZSBpcyBhbiBhZGFsSWRUb2tlbiBzdGFzaGVkIGluIHRoZSBjYWNoZVxyXG4gICAgICBjb25zdCBhZGFsSWRUb2tlbiA9IHRoaXMuY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLmFkYWxJZFRva2VuKTtcclxuXHJcbiAgICAgIC8vaWYgdGhlcmUgaXMgbm8gYWNjb3VudCBsb2dnZWQgaW4gYW5kIG5vIGxvZ2luX2hpbnQvc2lkIGlzIHBhc3NlZCBpbiB0aGUgcmVxdWVzdFxyXG4gICAgICBpZiAoIWFjY291bnQgJiYgISEocmVxdWVzdC5zaWQgIHx8IHJlcXVlc3QubG9naW5IaW50KSAmJiBVdGlscy5pc0VtcHR5KGFkYWxJZFRva2VuKSApIHtcclxuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKFwiVXNlciBsb2dpbiBpcyByZXF1aXJlZFwiKTtcclxuICAgICAgICByZXR1cm4gcmVqZWN0KENsaWVudEF1dGhFcnJvci5jcmVhdGVVc2VyTG9naW5SZXF1aXJlZEVycm9yKCkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCByZXNwb25zZVR5cGUgPSB0aGlzLmdldFRva2VuVHlwZShhY2NvdW50LCByZXF1ZXN0LnNjb3BlcywgdHJ1ZSk7XHJcblxyXG4gICAgICBsZXQgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0ID0gbmV3IFNlcnZlclJlcXVlc3RQYXJhbWV0ZXJzKFxyXG4gICAgICAgIEF1dGhvcml0eUZhY3RvcnkuQ3JlYXRlSW5zdGFuY2UocmVxdWVzdC5hdXRob3JpdHksIHRoaXMuY29uZmlnLmF1dGgudmFsaWRhdGVBdXRob3JpdHkpLFxyXG4gICAgICAgIHRoaXMuY2xpZW50SWQsXHJcbiAgICAgICAgcmVxdWVzdC5zY29wZXMsXHJcbiAgICAgICAgcmVzcG9uc2VUeXBlLFxyXG4gICAgICAgIHRoaXMuZ2V0UmVkaXJlY3RVcmkoKSxcclxuICAgICAgICB0aGlzLmNvbmZpZy5hdXRoLnN0YXRlXHJcbiAgICAgICk7XHJcblxyXG4gICAgICAvLyBwb3B1bGF0ZSBRdWVyeVBhcmFtZXRlcnMgKHNpZC9sb2dpbl9oaW50L2RvbWFpbl9oaW50KSBhbmQgYW55IG90aGVyIGV4dHJhUXVlcnlQYXJhbWV0ZXJzIHNldCBieSB0aGUgZGV2ZWxvcGVyXHJcbiAgICAgIGlmIChVdGlscy5pc1NTT1BhcmFtKHJlcXVlc3QpIHx8IGFjY291bnQpIHtcclxuICAgICAgICBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QgPSB0aGlzLnBvcHVsYXRlUXVlcnlQYXJhbXMoYWNjb3VudCwgcmVxdWVzdCwgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0KTtcclxuICAgICAgfVxyXG4gICAgICAvL2lmIHVzZXIgZGlkbid0IHBhc3MgbG9naW5faGludC9zaWQgYW5kIGFkYWwncyBpZHRva2VuIGlzIHByZXNlbnQsIGV4dHJhY3QgdGhlIGxvZ2luX2hpbnQgZnJvbSB0aGUgYWRhbElkVG9rZW5cclxuICAgICAgZWxzZSBpZiAoIWFjY291bnQgJiYgIVV0aWxzLmlzRW1wdHkoYWRhbElkVG9rZW4pKSB7XHJcbiAgICAgICAgLy8gaWYgYWRhbElkVG9rZW4gZXhpc3RzLCBleHRyYWN0IHRoZSBTU08gaW5mbyBmcm9tIHRoZSBzYW1lXHJcbiAgICAgICAgY29uc3QgYWRhbElkVG9rZW5PYmplY3QgPSBVdGlscy5leHRyYWN0SWRUb2tlbihhZGFsSWRUb2tlbik7XHJcbiAgICAgICAgdGhpcy5sb2dnZXIudmVyYm9zZShcIkFEQUwncyBpZFRva2VuIGV4aXN0cy4gRXh0cmFjdGluZyBsb2dpbiBpbmZvcm1hdGlvbiBmcm9tIEFEQUwncyBpZFRva2VuIFwiKTtcclxuICAgICAgICBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QgPSB0aGlzLnBvcHVsYXRlUXVlcnlQYXJhbXMoYWNjb3VudCwgbnVsbCwgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LCBhZGFsSWRUb2tlbk9iamVjdCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGxldCBhdXRoRXJyOiBBdXRoRXJyb3I7XHJcbiAgICAgIGxldCBjYWNoZVJlc3VsdFJlc3BvbnNlO1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjYWNoZVJlc3VsdFJlc3BvbnNlID0gdGhpcy5nZXRDYWNoZWRUb2tlbihzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QsIGFjY291bnQpO1xyXG4gICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgYXV0aEVyciA9IGU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHJlc29sdmUvcmVqZWN0IGJhc2VkIG9uIGNhY2hlUmVzdWx0XHJcbiAgICAgIGlmIChjYWNoZVJlc3VsdFJlc3BvbnNlKSB7XHJcbiAgICAgICAgdGhpcy5sb2dnZXIuaW5mbyhcIlRva2VuIGlzIGFscmVhZHkgaW4gY2FjaGUgZm9yIHNjb3BlOlwiICsgc2NvcGUpO1xyXG4gICAgICAgIHJlc29sdmUoY2FjaGVSZXN1bHRSZXNwb25zZSk7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoYXV0aEVycikge1xyXG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm9QaWkoYXV0aEVyci5lcnJvckNvZGUgKyBcIjpcIiArIGF1dGhFcnIuZXJyb3JNZXNzYWdlKTtcclxuICAgICAgICByZWplY3QoYXV0aEVycik7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgIH1cclxuICAgICAgLy8gZWxzZSBwcm9jZWVkIHdpdGggbG9naW5cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgdGhpcy5sb2dnZXIudmVyYm9zZShcIlRva2VuIGlzIG5vdCBpbiBjYWNoZSBmb3Igc2NvcGU6XCIgKyBzY29wZSk7XHJcbiAgICAgICAgLy8gQ2FjaGUgcmVzdWx0IGNhbiByZXR1cm4gbnVsbCBpZiBjYWNoZSBpcyBlbXB0eS4gSW4gdGhhdCBjYXNlLCBzZXQgYXV0aG9yaXR5IHRvIGRlZmF1bHQgdmFsdWUgaWYgbm8gYXV0aG9yaXR5IGlzIHBhc3NlZCB0byB0aGUgYXBpLlxyXG4gICAgICAgIGlmICghc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LmF1dGhvcml0eUluc3RhbmNlKSB7XHJcbiAgICAgICAgICAgIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5hdXRob3JpdHlJbnN0YW5jZSA9IHJlcXVlc3QuYXV0aG9yaXR5ID8gQXV0aG9yaXR5RmFjdG9yeS5DcmVhdGVJbnN0YW5jZShyZXF1ZXN0LmF1dGhvcml0eSwgdGhpcy5jb25maWcuYXV0aC52YWxpZGF0ZUF1dGhvcml0eSkgOiB0aGlzLmF1dGhvcml0eUluc3RhbmNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBjYWNoZSBtaXNzXHJcbiAgICAgICAgcmV0dXJuIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5hdXRob3JpdHlJbnN0YW5jZS5yZXNvbHZlRW5kcG9pbnRzQXN5bmMoKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgIC8vIHJlZnJlc2ggYXR0ZW1wdCB3aXRoIGlmcmFtZVxyXG4gICAgICAgICAgLy8gQWxyZWFkeSByZW5ld2luZyBmb3IgdGhpcyBzY29wZSwgY2FsbGJhY2sgd2hlbiB3ZSBnZXQgdGhlIHRva2VuLlxyXG4gICAgICAgICAgaWYgKHdpbmRvdy5hY3RpdmVSZW5ld2Fsc1tzY29wZV0pIHtcclxuICAgICAgICAgICAgdGhpcy5sb2dnZXIudmVyYm9zZShcIlJlbmV3IHRva2VuIGZvciBzY29wZTogXCIgKyBzY29wZSArIFwiIGlzIGluIHByb2dyZXNzLiBSZWdpc3RlcmluZyBjYWxsYmFja1wiKTtcclxuICAgICAgICAgICAgLy8gQWN0aXZlIHJlbmV3YWxzIGNvbnRhaW5zIHRoZSBzdGF0ZSBmb3IgZWFjaCByZW5ld2FsLlxyXG4gICAgICAgICAgICB0aGlzLnJlZ2lzdGVyQ2FsbGJhY2sod2luZG93LmFjdGl2ZVJlbmV3YWxzW3Njb3BlXSwgc2NvcGUsIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKHJlcXVlc3Quc2NvcGVzICYmIHJlcXVlc3Quc2NvcGVzLmluZGV4T2YodGhpcy5jbGllbnRJZCkgPiAtMSAmJiByZXF1ZXN0LnNjb3Blcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAvLyBBcHAgdXNlcyBpZFRva2VuIHRvIHNlbmQgdG8gYXBpIGVuZHBvaW50c1xyXG4gICAgICAgICAgICAgIC8vIERlZmF1bHQgc2NvcGUgaXMgdHJhY2tlZCBhcyBjbGllbnRJZCB0byBzdG9yZSB0aGlzIHRva2VuXHJcbiAgICAgICAgICAgICAgdGhpcy5sb2dnZXIudmVyYm9zZShcInJlbmV3aW5nIGlkVG9rZW5cIik7XHJcbiAgICAgICAgICAgICAgdGhpcy5yZW5ld0lkVG9rZW4ocmVxdWVzdC5zY29wZXMsIHJlc29sdmUsIHJlamVjdCwgYWNjb3VudCwgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAvLyByZW5ldyBhY2Nlc3MgdG9rZW5cclxuICAgICAgICAgICAgICB0aGlzLmxvZ2dlci52ZXJib3NlKFwicmVuZXdpbmcgYWNjZXNzdG9rZW5cIik7XHJcbiAgICAgICAgICAgICAgdGhpcy5yZW5ld1Rva2VuKHJlcXVlc3Quc2NvcGVzLCByZXNvbHZlLCByZWplY3QsIGFjY291bnQsIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XHJcbiAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuaW5nKFwiY291bGQgbm90IHJlc29sdmUgZW5kcG9pbnRzXCIpO1xyXG4gICAgICAgICAgcmVqZWN0KENsaWVudEF1dGhFcnJvci5jcmVhdGVFbmRwb2ludFJlc29sdXRpb25FcnJvcihlcnIudG9TdHJpbmcoKSkpO1xyXG4gICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB3aGV0aGVyIGN1cnJlbnQgd2luZG93IGlzIGluIGlmcmFtIGZvciB0b2tlbiByZW5ld2FsXHJcbiAgICogQGlnbm9yZVxyXG4gICAqIEBoaWRkZW5cclxuICAgKi9cclxuICBwdWJsaWMgaXNJbklmcmFtZSgpIHtcclxuICAgICAgcmV0dXJuIHdpbmRvdy5wYXJlbnQgIT09IHdpbmRvdztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgd2hldGhlciBwYXJlbnQgd2luZG93IGV4aXN0cyBhbmQgaGFzIG1zYWxcclxuICAgKi9cclxuICBwcml2YXRlIHBhcmVudElzTXNhbCgpIHtcclxuICAgIHJldHVybiB3aW5kb3cucGFyZW50ICE9PSB3aW5kb3cgJiYgd2luZG93LnBhcmVudC5tc2FsO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBpc0ludGVyYWN0aW9uUmVxdWlyZWQoZXJyb3JTdHJpbmc6IHN0cmluZykgOiBib29sZWFuIHtcclxuICAgIGlmIChlcnJvclN0cmluZy5pbmRleE9mKFwiaW50ZXJhY3Rpb25fcmVxdWlyZWRcIikgIT09IC0xIHx8XHJcbiAgICBlcnJvclN0cmluZy5pbmRleE9mKFwiY29uc2VudF9yZXF1aXJlZFwiKSAhPT0gLTEgfHxcclxuICAgIGVycm9yU3RyaW5nLmluZGV4T2YoXCJsb2dpbl9yZXF1aXJlZFwiKSAhPT0gLTEpIHtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxsaW5nIF9sb2FkRnJhbWUgYnV0IHdpdGggYSB0aW1lb3V0IHRvIHNpZ25hbCBmYWlsdXJlIGluIGxvYWRmcmFtZVN0YXR1cy4gQ2FsbGJhY2tzIGFyZSBsZWZ0LlxyXG4gICAqIHJlZ2lzdGVyZWQgd2hlbiBuZXR3b3JrIGVycm9ycyBvY2N1ciBhbmQgc3Vic2VxdWVudCB0b2tlbiByZXF1ZXN0cyBmb3Igc2FtZSByZXNvdXJjZSBhcmUgcmVnaXN0ZXJlZCB0byB0aGUgcGVuZGluZyByZXF1ZXN0LlxyXG4gICAqIEBpZ25vcmVcclxuICAgKiBAaGlkZGVuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBsb2FkSWZyYW1lVGltZW91dCh1cmxOYXZpZ2F0ZTogc3RyaW5nLCBmcmFtZU5hbWU6IHN0cmluZywgc2NvcGU6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgLy9zZXQgaWZyYW1lIHNlc3Npb24gdG8gcGVuZGluZ1xyXG4gICAgY29uc3QgZXhwZWN0ZWRTdGF0ZSA9IHdpbmRvdy5hY3RpdmVSZW5ld2Fsc1tzY29wZV07XHJcbiAgICB0aGlzLmxvZ2dlci52ZXJib3NlKFwiU2V0IGxvYWRpbmcgc3RhdGUgdG8gcGVuZGluZyBmb3I6IFwiICsgc2NvcGUgKyBcIjpcIiArIGV4cGVjdGVkU3RhdGUpO1xyXG4gICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMucmVuZXdTdGF0dXMgKyBleHBlY3RlZFN0YXRlLCBDb25zdGFudHMudG9rZW5SZW5ld1N0YXR1c0luUHJvZ3Jlc3MpO1xyXG4gICAgdGhpcy5sb2FkRnJhbWUodXJsTmF2aWdhdGUsIGZyYW1lTmFtZSk7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgaWYgKHRoaXMuY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLnJlbmV3U3RhdHVzICsgZXhwZWN0ZWRTdGF0ZSkgPT09IENvbnN0YW50cy50b2tlblJlbmV3U3RhdHVzSW5Qcm9ncmVzcykge1xyXG4gICAgICAgIC8vIGZhaWwgdGhlIGlmcmFtZSBzZXNzaW9uIGlmIGl0XCJzIGluIHBlbmRpbmcgc3RhdGVcclxuICAgICAgICB0aGlzLmxvZ2dlci52ZXJib3NlKFwiTG9hZGluZyBmcmFtZSBoYXMgdGltZWQgb3V0IGFmdGVyOiBcIiArICh0aGlzLmNvbmZpZy5zeXN0ZW0ubG9hZEZyYW1lVGltZW91dCAvIDEwMDApICsgXCIgc2Vjb25kcyBmb3Igc2NvcGUgXCIgKyBzY29wZSArIFwiOlwiICsgZXhwZWN0ZWRTdGF0ZSk7XHJcbiAgICAgICAgLy8gRXJyb3IgYWZ0ZXIgdGltZW91dFxyXG4gICAgICAgIGlmIChleHBlY3RlZFN0YXRlICYmIHdpbmRvdy5jYWxsYmFja01hcHBlZFRvUmVuZXdTdGF0ZXNbZXhwZWN0ZWRTdGF0ZV0pIHtcclxuICAgICAgICAgIHdpbmRvdy5jYWxsYmFja01hcHBlZFRvUmVuZXdTdGF0ZXNbZXhwZWN0ZWRTdGF0ZV0obnVsbCwgQ2xpZW50QXV0aEVycm9yLmNyZWF0ZVRva2VuUmVuZXdhbFRpbWVvdXRFcnJvcigpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLnJlbmV3U3RhdHVzICsgZXhwZWN0ZWRTdGF0ZSwgQ29uc3RhbnRzLnRva2VuUmVuZXdTdGF0dXNDYW5jZWxsZWQpO1xyXG4gICAgICB9XHJcbiAgICB9LCB0aGlzLmNvbmZpZy5zeXN0ZW0ubG9hZEZyYW1lVGltZW91dCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBMb2FkcyBpZnJhbWUgd2l0aCBhdXRob3JpemF0aW9uIGVuZHBvaW50IFVSTFxyXG4gICAqIEBpZ25vcmVcclxuICAgKiBAaGlkZGVuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBsb2FkRnJhbWUodXJsTmF2aWdhdGU6IHN0cmluZywgZnJhbWVOYW1lOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIC8vIFRoaXMgdHJpY2sgb3ZlcmNvbWVzIGlmcmFtZSBuYXZpZ2F0aW9uIGluIElFXHJcbiAgICAvLyBJRSBkb2VzIG5vdCBsb2FkIHRoZSBwYWdlIGNvbnNpc3RlbnRseSBpbiBpZnJhbWVcclxuICAgIHRoaXMubG9nZ2VyLmluZm8oXCJMb2FkRnJhbWU6IFwiICsgZnJhbWVOYW1lKTtcclxuICAgIGNvbnN0IGZyYW1lQ2hlY2sgPSBmcmFtZU5hbWU7XHJcblxyXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGZyYW1lSGFuZGxlID0gdGhpcy5hZGRIaWRkZW5JRnJhbWUoZnJhbWVDaGVjayk7XHJcbiAgICAgIGlmIChmcmFtZUhhbmRsZS5zcmMgPT09IFwiXCIgfHwgZnJhbWVIYW5kbGUuc3JjID09PSBcImFib3V0OmJsYW5rXCIpIHtcclxuICAgICAgICBmcmFtZUhhbmRsZS5zcmMgPSB1cmxOYXZpZ2F0ZTtcclxuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvUGlpKFwiRnJhbWUgTmFtZSA6IFwiICsgZnJhbWVOYW1lICsgXCIgTmF2aWdhdGVkIHRvOiBcIiArIHVybE5hdmlnYXRlKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIDUwMCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIHRoZSBoaWRkZW4gaWZyYW1lIGZvciBzaWxlbnQgdG9rZW4gcmVuZXdhbC5cclxuICAgKiBAaWdub3JlXHJcbiAgICogQGhpZGRlblxyXG4gICAqL1xyXG4gIHByaXZhdGUgYWRkSGlkZGVuSUZyYW1lKGlmcmFtZUlkOiBzdHJpbmcpOiBIVE1MSUZyYW1lRWxlbWVudCB7XHJcbiAgICBpZiAodHlwZW9mIGlmcmFtZUlkID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMubG9nZ2VyLmluZm8oXCJBZGQgbXNhbCBmcmFtZSB0byBkb2N1bWVudDpcIiArIGlmcmFtZUlkKTtcclxuICAgIGxldCBhZGFsRnJhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZnJhbWVJZCkgYXMgSFRNTElGcmFtZUVsZW1lbnQ7XHJcbiAgICBpZiAoIWFkYWxGcmFtZSkge1xyXG4gICAgICBpZiAoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAmJlxyXG4gICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAmJlxyXG4gICAgICAgICh3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiTVNJRSA1LjBcIikgPT09IC0xKSkge1xyXG4gICAgICAgIGNvbnN0IGlmciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpZnJhbWVcIik7XHJcbiAgICAgICAgaWZyLnNldEF0dHJpYnV0ZShcImlkXCIsIGlmcmFtZUlkKTtcclxuICAgICAgICBpZnIuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XHJcbiAgICAgICAgaWZyLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xyXG4gICAgICAgIGlmci5zdHlsZS53aWR0aCA9IGlmci5zdHlsZS5oZWlnaHQgPSBcIjBcIjtcclxuICAgICAgICBpZnIuc3R5bGUuYm9yZGVyID0gXCIwXCI7XHJcbiAgICAgICAgYWRhbEZyYW1lID0gKGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYm9keVwiKVswXS5hcHBlbmRDaGlsZChpZnIpIGFzIEhUTUxJRnJhbWVFbGVtZW50KTtcclxuICAgICAgfSBlbHNlIGlmIChkb2N1bWVudC5ib2R5ICYmIGRvY3VtZW50LmJvZHkuaW5zZXJ0QWRqYWNlbnRIVE1MKSB7XHJcbiAgICAgICAgICBkb2N1bWVudC5ib2R5Lmluc2VydEFkamFjZW50SFRNTChcImJlZm9yZWVuZFwiLCBcIjxpZnJhbWUgbmFtZT0nXCIgKyBpZnJhbWVJZCArIFwiJyBpZD0nXCIgKyBpZnJhbWVJZCArIFwiJyBzdHlsZT0nZGlzcGxheTpub25lJz48L2lmcmFtZT5cIik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh3aW5kb3cuZnJhbWVzICYmIHdpbmRvdy5mcmFtZXNbaWZyYW1lSWRdKSB7XHJcbiAgICAgICAgYWRhbEZyYW1lID0gd2luZG93LmZyYW1lc1tpZnJhbWVJZF07XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYWRhbEZyYW1lO1xyXG4gIH1cclxuXHJcbiAgLy8jZW5kcmVnaW9uXHJcblxyXG4gIC8vI3JlZ2lvbiBHZW5lcmFsIEhlbHBlcnNcclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBsb2dpbl9oaW50IHRvIGF1dGhvcml6YXRpb24gVVJMIHdoaWNoIGlzIHVzZWQgdG8gcHJlLWZpbGwgdGhlIHVzZXJuYW1lIGZpZWxkIG9mIHNpZ24gaW4gcGFnZSBmb3IgdGhlIHVzZXIgaWYga25vd24gYWhlYWQgb2YgdGltZVxyXG4gICAqIGRvbWFpbl9oaW50IGNhbiBiZSBvbmUgb2YgdXNlcnMvb3JnYW5pemF0aW9ucyB3aGljaCB3aGVuIGFkZGVkIHNraXBzIHRoZSBlbWFpbCBiYXNlZCBkaXNjb3ZlcnkgcHJvY2VzcyBvZiB0aGUgdXNlclxyXG4gICAqIGRvbWFpbl9yZXEgdXRpZCByZWNlaXZlZCBhcyBwYXJ0IG9mIHRoZSBjbGllbnRJbmZvXHJcbiAgICogbG9naW5fcmVxIHVpZCByZWNlaXZlZCBhcyBwYXJ0IG9mIGNsaWVudEluZm9cclxuICAgKiBBbHNvIGRvZXMgYSBzYW5pdHkgY2hlY2sgZm9yIGV4dHJhUXVlcnlQYXJhbWV0ZXJzIHBhc3NlZCBieSB0aGUgdXNlciB0byBlbnN1cmUgbm8gcmVwZWF0IHF1ZXJ5UGFyYW1ldGVyc1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVybE5hdmlnYXRlIC0gQXV0aGVudGljYXRpb24gcmVxdWVzdCB1cmxcclxuICAgKiBAcGFyYW0ge0FjY291bnR9IGFjY291bnQgLSBBY2NvdW50IGZvciB3aGljaCB0aGUgdG9rZW4gaXMgcmVxdWVzdGVkXHJcbiAgICogQGlnbm9yZVxyXG4gICAqIEBoaWRkZW5cclxuICAgKi9cclxuICBwcml2YXRlIGFkZEhpbnRQYXJhbWV0ZXJzKGFjY291bnRPYmo6IEFjY291bnQsIHFQYXJhbXM6IFFQRGljdCwgc2VydmVyUmVxUGFyYW1zOiBTZXJ2ZXJSZXF1ZXN0UGFyYW1ldGVycyk6IFFQRGljdCB7XHJcblxyXG4gICAgY29uc3QgYWNjb3VudDogQWNjb3VudCA9IGFjY291bnRPYmogfHwgdGhpcy5nZXRBY2NvdW50KCk7XHJcblxyXG4gICAgLy8gVGhpcyBpcyBhIGZpbmFsIGNoZWNrIGZvciBhbGwgcXVlcnlQYXJhbXMgYWRkZWQgc28gZmFyOyBwcmVmZXJlbmNlIG9yZGVyOiBzaWQgPiBsb2dpbl9oaW50XHJcbiAgICAvLyBzaWQgY2Fubm90IGJlIHBhc3NlZCBhbG9uZyB3aXRoIGxvZ2luX2hpbnQsIGhlbmNlIHdlIGNoZWNrIGJvdGggYXJlIG5vdCBwb3B1bGF0ZWQgeWV0IGluIHF1ZXJ5UGFyYW1ldGVycyBzbyBmYXJcclxuICAgIGlmIChhY2NvdW50KSB7XHJcbiAgICAgIC8vIHNpZFxyXG4gICAgICBpZiAoYWNjb3VudC5zaWQgJiYgc2VydmVyUmVxUGFyYW1zLnByb21wdFZhbHVlID09PSBQcm9tcHRTdGF0ZS5OT05FKSB7XHJcbiAgICAgICAgaWYgKCFxUGFyYW1zW1NTT1R5cGVzLlNJRF0gICYmICFxUGFyYW1zW1NTT1R5cGVzLkxPR0lOX0hJTlRdKSB7XHJcbiAgICAgICAgICBxUGFyYW1zID0gVXRpbHMuYWRkU1NPUGFyYW1ldGVyKFNTT1R5cGVzLlNJRCwgYWNjb3VudC5zaWQsIHFQYXJhbXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICAvLyBsb2dpbl9oaW50XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIC8vIGxvZ2luX2hpbnQgaXMgYWNjb3VudC51c2VyTmFtZVxyXG4gICAgICAgIGlmICghcVBhcmFtc1tTU09UeXBlcy5MT0dJTl9ISU5UXSAgJiYgYWNjb3VudC51c2VyTmFtZSAmJiAhVXRpbHMuaXNFbXB0eShhY2NvdW50LnVzZXJOYW1lKSkge1xyXG4gICAgICAgICAgcVBhcmFtcyA9IFV0aWxzLmFkZFNTT1BhcmFtZXRlcihTU09UeXBlcy5MT0dJTl9ISU5ULCBhY2NvdW50LnVzZXJOYW1lLCBxUGFyYW1zKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICghcVBhcmFtc1tTU09UeXBlcy5ET01BSU5fUkVRXSAmJiAhcVBhcmFtc1tTU09UeXBlcy5MT0dJTl9SRVFdICkge1xyXG4gICAgICAgIHFQYXJhbXMgPSBVdGlscy5hZGRTU09QYXJhbWV0ZXIoU1NPVHlwZXMuSE9NRUFDQ09VTlRfSUQsIGFjY291bnQuaG9tZUFjY291bnRJZGVudGlmaWVyLCBxUGFyYW1zKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBxUGFyYW1zO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXNlZCB0byByZWRpcmVjdCB0aGUgYnJvd3NlciB0byB0aGUgU1RTIGF1dGhvcml6YXRpb24gZW5kcG9pbnRcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsTmF2aWdhdGUgLSBVUkwgb2YgdGhlIGF1dGhvcml6YXRpb24gZW5kcG9pbnRcclxuICAgKiBAaGlkZGVuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBwcm9tcHRVc2VyKHVybE5hdmlnYXRlOiBzdHJpbmcpIHtcclxuICAgIC8vIE5hdmlnYXRlIGlmIHZhbGlkIFVSTFxyXG4gICAgaWYgKHVybE5hdmlnYXRlICYmICFVdGlscy5pc0VtcHR5KHVybE5hdmlnYXRlKSkge1xyXG4gICAgICB0aGlzLmxvZ2dlci5pbmZvUGlpKFwiTmF2aWdhdGUgdG86XCIgKyB1cmxOYXZpZ2F0ZSk7XHJcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKHVybE5hdmlnYXRlKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLmxvZ2dlci5pbmZvKFwiTmF2aWdhdGUgdXJsIGlzIGVtcHR5XCIpO1xyXG4gICAgICB0aHJvdyBBdXRoRXJyb3IuY3JlYXRlVW5leHBlY3RlZEVycm9yKFwiTmF2aWdhdGUgdXJsIGlzIGVtcHR5XCIpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXNlZCB0byBhZGQgdGhlIGRldmVsb3BlciByZXF1ZXN0ZWQgY2FsbGJhY2sgdG8gdGhlIGFycmF5IG9mIGNhbGxiYWNrcyBmb3IgdGhlIHNwZWNpZmllZCBzY29wZXMuIFRoZSB1cGRhdGVkIGFycmF5IGlzIHN0b3JlZCBvbiB0aGUgd2luZG93IG9iamVjdFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzY29wZSAtIERldmVsb3BlciByZXF1ZXN0ZWQgcGVybWlzc2lvbnMuIE5vdCBhbGwgc2NvcGVzIGFyZSBndWFyYW50ZWVkIHRvIGJlIGluY2x1ZGVkIGluIHRoZSBhY2Nlc3MgdG9rZW4gcmV0dXJuZWQuXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV4cGVjdGVkU3RhdGUgLSBVbmlxdWUgc3RhdGUgaWRlbnRpZmllciAoZ3VpZCkuXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gcmVzb2x2ZSAtIFRoZSByZXNvbHZlIGZ1bmN0aW9uIG9mIHRoZSBwcm9taXNlIG9iamVjdC5cclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSByZWplY3QgLSBUaGUgcmVqZWN0IGZ1bmN0aW9uIG9mIHRoZSBwcm9taXNlIG9iamVjdC5cclxuICAgKiBAaWdub3JlXHJcbiAgICogQGhpZGRlblxyXG4gICAqL1xyXG4gIHByaXZhdGUgcmVnaXN0ZXJDYWxsYmFjayhleHBlY3RlZFN0YXRlOiBzdHJpbmcsIHNjb3BlOiBzdHJpbmcsIHJlc29sdmU6IEZ1bmN0aW9uLCByZWplY3Q6IEZ1bmN0aW9uKTogdm9pZCB7XHJcbiAgICAvLyB0cmFjayBhY3RpdmUgcmVuZXdhbHNcclxuICAgIHdpbmRvdy5hY3RpdmVSZW5ld2Fsc1tzY29wZV0gPSBleHBlY3RlZFN0YXRlO1xyXG5cclxuICAgIC8vIGluaXRpYWxpemUgY2FsbGJhY2tzIG1hcHBlZCBhcnJheVxyXG4gICAgaWYgKCF3aW5kb3cucHJvbWlzZU1hcHBlZFRvUmVuZXdTdGF0ZXNbZXhwZWN0ZWRTdGF0ZV0pIHtcclxuICAgICAgICB3aW5kb3cucHJvbWlzZU1hcHBlZFRvUmVuZXdTdGF0ZXNbZXhwZWN0ZWRTdGF0ZV0gPSBbXTtcclxuICAgIH1cclxuICAgIC8vIGluZGV4aW5nIG9uIHRoZSBjdXJyZW50IHN0YXRlLCBwdXNoIHRoZSBjYWxsYmFjayBwYXJhbXMgdG8gY2FsbGJhY2tzIG1hcHBlZFxyXG4gICAgd2luZG93LnByb21pc2VNYXBwZWRUb1JlbmV3U3RhdGVzW2V4cGVjdGVkU3RhdGVdLnB1c2goeyByZXNvbHZlOiByZXNvbHZlLCByZWplY3Q6IHJlamVjdCB9KTtcclxuXHJcbiAgICAvLyBTdG9yZSB0aGUgc2VydmVyIGVzcG9uc2UgaW4gdGhlIGN1cnJlbnQgd2luZG93Pz9cclxuICAgIGlmICghd2luZG93LmNhbGxiYWNrTWFwcGVkVG9SZW5ld1N0YXRlc1tleHBlY3RlZFN0YXRlXSkge1xyXG4gICAgICB3aW5kb3cuY2FsbGJhY2tNYXBwZWRUb1JlbmV3U3RhdGVzW2V4cGVjdGVkU3RhdGVdID1cclxuICAgICAgKHJlc3BvbnNlOiBBdXRoUmVzcG9uc2UsIGVycm9yOiBBdXRoRXJyb3IpID0+IHtcclxuICAgICAgICAvLyByZXNldCBhY3RpdmUgcmVuZXdhbHNcclxuICAgICAgICB3aW5kb3cuYWN0aXZlUmVuZXdhbHNbc2NvcGVdID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gZm9yIGFsbCBwcm9taXNlTWFwcGVkdG9SZW5ld1N0YXRlcyBmb3IgYSBnaXZlbiAnc3RhdGUnIC0gY2FsbCB0aGUgcmVqZWN0L3Jlc29sdmUgd2l0aCBlcnJvci90b2tlbiByZXNwZWN0aXZlbHlcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHdpbmRvdy5wcm9taXNlTWFwcGVkVG9SZW5ld1N0YXRlc1tleHBlY3RlZFN0YXRlXS5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cucHJvbWlzZU1hcHBlZFRvUmVuZXdTdGF0ZXNbZXhwZWN0ZWRTdGF0ZV1baV0ucmVqZWN0KGVycm9yKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgd2luZG93LnByb21pc2VNYXBwZWRUb1JlbmV3U3RhdGVzW2V4cGVjdGVkU3RhdGVdW2ldLnJlc29sdmUocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRocm93IEF1dGhFcnJvci5jcmVhdGVVbmV4cGVjdGVkRXJyb3IoXCJFcnJvciBhbmQgcmVzcG9uc2UgYXJlIGJvdGggbnVsbFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuaW5nKGUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gcmVzZXRcclxuICAgICAgICB3aW5kb3cucHJvbWlzZU1hcHBlZFRvUmVuZXdTdGF0ZXNbZXhwZWN0ZWRTdGF0ZV0gPSBudWxsO1xyXG4gICAgICAgIHdpbmRvdy5jYWxsYmFja01hcHBlZFRvUmVuZXdTdGF0ZXNbZXhwZWN0ZWRTdGF0ZV0gPSBudWxsO1xyXG4gICAgICB9O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8jZW5kcmVnaW9uXHJcblxyXG4gIC8vI3JlZ2lvbiBMb2dvdXRcclxuXHJcbiAgLyoqXHJcbiAgICogVXNlZCB0byBsb2cgb3V0IHRoZSBjdXJyZW50IHVzZXIsIGFuZCByZWRpcmVjdCB0aGUgdXNlciB0byB0aGUgcG9zdExvZ291dFJlZGlyZWN0VXJpLlxyXG4gICAqIERlZmF1bHRzIGJlaGF2aW91ciBpcyB0byByZWRpcmVjdCB0aGUgdXNlciB0byBgd2luZG93LmxvY2F0aW9uLmhyZWZgLlxyXG4gICAqL1xyXG4gIGxvZ291dCgpOiB2b2lkIHtcclxuICAgIHRoaXMuY2xlYXJDYWNoZSgpO1xyXG4gICAgdGhpcy5hY2NvdW50ID0gbnVsbDtcclxuICAgIGxldCBsb2dvdXQgPSBcIlwiO1xyXG4gICAgaWYgKHRoaXMuZ2V0UG9zdExvZ291dFJlZGlyZWN0VXJpKCkpIHtcclxuICAgICAgbG9nb3V0ID0gXCJwb3N0X2xvZ291dF9yZWRpcmVjdF91cmk9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodGhpcy5nZXRQb3N0TG9nb3V0UmVkaXJlY3RVcmkoKSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCB1cmxOYXZpZ2F0ZSA9IHRoaXMuYXV0aG9yaXR5ICsgXCIvb2F1dGgyL3YyLjAvbG9nb3V0P1wiICsgbG9nb3V0O1xyXG4gICAgdGhpcy5wcm9tcHRVc2VyKHVybE5hdmlnYXRlKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsZWFyIGFsbCBhY2Nlc3MgdG9rZW5zIGluIHRoZSBjYWNoZS5cclxuICAgKiBAaWdub3JlXHJcbiAgICogQGhpZGRlblxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBjbGVhckNhY2hlKCk6IHZvaWQge1xyXG4gICAgd2luZG93LnJlbmV3U3RhdGVzID0gW107XHJcbiAgICBjb25zdCBhY2Nlc3NUb2tlbkl0ZW1zID0gdGhpcy5jYWNoZVN0b3JhZ2UuZ2V0QWxsQWNjZXNzVG9rZW5zKENvbnN0YW50cy5jbGllbnRJZCwgQ29uc3RhbnRzLmhvbWVBY2NvdW50SWRlbnRpZmllcik7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFjY2Vzc1Rva2VuSXRlbXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgdGhpcy5jYWNoZVN0b3JhZ2UucmVtb3ZlSXRlbShKU09OLnN0cmluZ2lmeShhY2Nlc3NUb2tlbkl0ZW1zW2ldLmtleSkpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5jYWNoZVN0b3JhZ2UucmVzZXRDYWNoZUl0ZW1zKCk7XHJcbiAgICB0aGlzLmNhY2hlU3RvcmFnZS5jbGVhckNvb2tpZSgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xlYXIgYSBnaXZlbiBhY2Nlc3MgdG9rZW4gZnJvbSB0aGUgY2FjaGUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYWNjZXNzVG9rZW5cclxuICAgKi9cclxuICBwcm90ZWN0ZWQgY2xlYXJDYWNoZUZvclNjb3BlKGFjY2Vzc1Rva2VuOiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IGFjY2Vzc1Rva2VuSXRlbXMgPSB0aGlzLmNhY2hlU3RvcmFnZS5nZXRBbGxBY2Nlc3NUb2tlbnMoQ29uc3RhbnRzLmNsaWVudElkLCBDb25zdGFudHMuaG9tZUFjY291bnRJZGVudGlmaWVyKTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWNjZXNzVG9rZW5JdGVtcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGxldCB0b2tlbiA9IGFjY2Vzc1Rva2VuSXRlbXNbaV07XHJcbiAgICAgICAgaWYgKHRva2VuLnZhbHVlLmFjY2Vzc1Rva2VuID09PSBhY2Nlc3NUb2tlbikge1xyXG4gICAgICAgICAgICB0aGlzLmNhY2hlU3RvcmFnZS5yZW1vdmVJdGVtKEpTT04uc3RyaW5naWZ5KHRva2VuLmtleSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vI2VuZHJlZ2lvblxyXG5cclxuICAvLyNyZWdpb24gUmVzcG9uc2VcclxuXHJcbiAgLyoqXHJcbiAgICogVXNlZCB0byBjYWxsIHRoZSBjb25zdHJ1Y3RvciBjYWxsYmFjayB3aXRoIHRoZSB0b2tlbi9lcnJvclxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbaGFzaD13aW5kb3cubG9jYXRpb24uaGFzaF0gLSBIYXNoIGZyYWdtZW50IG9mIFVybC5cclxuICAgKiBAaGlkZGVuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBwcm9jZXNzQ2FsbEJhY2soaGFzaDogc3RyaW5nLCBzdGF0ZUluZm86IFJlc3BvbnNlU3RhdGVJbmZvLCBwYXJlbnRDYWxsYmFjaz86IEZ1bmN0aW9uKTogdm9pZCB7XHJcbiAgICB0aGlzLmxvZ2dlci5pbmZvKFwiUHJvY2Vzc2luZyB0aGUgY2FsbGJhY2sgZnJvbSByZWRpcmVjdCByZXNwb25zZVwiKTtcclxuICAgIC8vIGdldCB0aGUgc3RhdGUgaW5mbyBmcm9tIHRoZSBoYXNoXHJcbiAgICBpZiAoIXN0YXRlSW5mbykge1xyXG4gICAgICBzdGF0ZUluZm8gPSB0aGlzLmdldFJlc3BvbnNlU3RhdGUoaGFzaCk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHJlc3BvbnNlIDogQXV0aFJlc3BvbnNlO1xyXG4gICAgbGV0IGF1dGhFcnIgOiBBdXRoRXJyb3I7XHJcbiAgICAvLyBTYXZlIHRoZSB0b2tlbiBpbmZvIGZyb20gdGhlIGhhc2hcclxuICAgIHRyeSB7XHJcbiAgICAgIHJlc3BvbnNlID0gdGhpcy5zYXZlVG9rZW5Gcm9tSGFzaChoYXNoLCBzdGF0ZUluZm8pO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGF1dGhFcnIgPSBlcnI7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcmVtb3ZlIGhhc2ggZnJvbSB0aGUgY2FjaGVcclxuICAgIHRoaXMuY2FjaGVTdG9yYWdlLnJlbW92ZUl0ZW0oQ29uc3RhbnRzLnVybEhhc2gpO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIC8vIENsZWFyIHRoZSBjb29raWUgaW4gdGhlIGhhc2hcclxuICAgICAgdGhpcy5jYWNoZVN0b3JhZ2UuY2xlYXJDb29raWUoKTtcclxuICAgICAgY29uc3QgYWNjb3VudFN0YXRlOiBzdHJpbmcgPSB0aGlzLmdldEFjY291bnRTdGF0ZSh0aGlzLmNhY2hlU3RvcmFnZS5nZXRJdGVtKENvbnN0YW50cy5zdGF0ZUxvZ2luLCB0aGlzLmluQ29va2llKSk7XHJcblxyXG4gICAgICBpZiAocmVzcG9uc2UpIHtcclxuICAgICAgICBpZiAoKHN0YXRlSW5mby5yZXF1ZXN0VHlwZSA9PT0gQ29uc3RhbnRzLnJlbmV3VG9rZW4pIHx8IHJlc3BvbnNlLmFjY2Vzc1Rva2VuKSB7XHJcbiAgICAgICAgICBpZiAod2luZG93LnBhcmVudCAhPT0gd2luZG93KSB7XHJcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLnZlcmJvc2UoXCJXaW5kb3cgaXMgaW4gaWZyYW1lLCBhY3F1aXJpbmcgdG9rZW4gc2lsZW50bHlcIik7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmxvZ2dlci52ZXJib3NlKFwiYWNxdWlyaW5nIHRva2VuIGludGVyYWN0aXZlIGluIHByb2dyZXNzXCIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmVzcG9uc2UudG9rZW5UeXBlID0gQ29uc3RhbnRzLmFjY2Vzc1Rva2VuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChzdGF0ZUluZm8ucmVxdWVzdFR5cGUgPT09IENvbnN0YW50cy5sb2dpbikge1xyXG4gICAgICAgICAgcmVzcG9uc2UudG9rZW5UeXBlID0gQ29uc3RhbnRzLmlkVG9rZW47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghcGFyZW50Q2FsbGJhY2spIHtcclxuICAgICAgICAgIHRoaXMudG9rZW5SZWNlaXZlZENhbGxiYWNrKHJlc3BvbnNlKTtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZiAoIXBhcmVudENhbGxiYWNrKSB7XHJcbiAgICAgICAgdGhpcy5lcnJvclJlY2VpdmVkQ2FsbGJhY2soYXV0aEVyciwgYWNjb3VudFN0YXRlKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHBhcmVudENhbGxiYWNrKHJlc3BvbnNlLCBhdXRoRXJyKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcihcIkVycm9yIG9jY3VycmVkIGluIHRva2VuIHJlY2VpdmVkIGNhbGxiYWNrIGZ1bmN0aW9uOiBcIiArIGVycik7XHJcbiAgICAgIHRocm93IENsaWVudEF1dGhFcnJvci5jcmVhdGVFcnJvckluQ2FsbGJhY2tGdW5jdGlvbihlcnIudG9TdHJpbmcoKSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGlzIG1ldGhvZCBtdXN0IGJlIGNhbGxlZCBmb3IgcHJvY2Vzc2luZyB0aGUgcmVzcG9uc2UgcmVjZWl2ZWQgZnJvbSB0aGUgU1RTLiBJdCBleHRyYWN0cyB0aGUgaGFzaCwgcHJvY2Vzc2VzIHRoZSB0b2tlbiBvciBlcnJvciBpbmZvcm1hdGlvbiBhbmQgc2F2ZXMgaXQgaW4gdGhlIGNhY2hlLiBJdCB0aGVuXHJcbiAgICogY2FsbHMgdGhlIHJlZ2lzdGVyZWQgY2FsbGJhY2tzIGluIGNhc2Ugb2YgcmVkaXJlY3Qgb3IgcmVzb2x2ZXMgdGhlIHByb21pc2VzIHdpdGggdGhlIHJlc3VsdC5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2hhc2g9d2luZG93LmxvY2F0aW9uLmhhc2hdIC0gSGFzaCBmcmFnbWVudCBvZiBVcmwuXHJcbiAgICogQGhpZGRlblxyXG4gICAqL1xyXG4gIHByaXZhdGUgaGFuZGxlQXV0aGVudGljYXRpb25SZXNwb25zZShoYXNoOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIC8vIHJldHJpZXZlIHRoZSBoYXNoXHJcbiAgICBpZiAoaGFzaCA9PSBudWxsKSB7XHJcbiAgICAgIGhhc2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaDtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgc2VsZiA9IG51bGw7XHJcbiAgICBsZXQgaXNQb3B1cDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgbGV0IGlzV2luZG93T3BlbmVyTXNhbCA9IGZhbHNlO1xyXG5cclxuICAgIC8vIENoZWNrIGlmIHRoZSBjdXJyZW50IHdpbmRvdyBvcGVuZWQgdGhlIGlGcmFtZS9wb3B1cFxyXG4gICAgdHJ5IHtcclxuICAgICAgaXNXaW5kb3dPcGVuZXJNc2FsID0gd2luZG93Lm9wZW5lciAmJiB3aW5kb3cub3BlbmVyLm1zYWwgJiYgd2luZG93Lm9wZW5lci5tc2FsICE9PSB3aW5kb3cubXNhbDtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvLyBlcnIgPSBTZWN1cml0eUVycm9yOiBCbG9ja2VkIGEgZnJhbWUgd2l0aCBvcmlnaW4gXCJbdXJsXVwiIGZyb20gYWNjZXNzaW5nIGEgY3Jvc3Mtb3JpZ2luIGZyYW1lLlxyXG4gICAgICBpc1dpbmRvd09wZW5lck1zYWwgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTZXQgdGhlIHNlbGYgdG8gdGhlIHdpbmRvdyB0aGF0IGNyZWF0ZWQgdGhlIHBvcHVwL2lmcmFtZVxyXG4gICAgaWYgKGlzV2luZG93T3BlbmVyTXNhbCkge1xyXG4gICAgICBzZWxmID0gd2luZG93Lm9wZW5lci5tc2FsO1xyXG4gICAgICBpc1BvcHVwID0gdHJ1ZTtcclxuICAgIH0gZWxzZSBpZiAod2luZG93LnBhcmVudCAmJiB3aW5kb3cucGFyZW50Lm1zYWwpIHtcclxuICAgICAgc2VsZiA9IHdpbmRvdy5wYXJlbnQubXNhbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpZiAod2luZG93LnBhcmVudCAhPT0gd2luZG93KSwgYnkgdXNpbmcgc2VsZiwgd2luZG93LnBhcmVudCBiZWNvbWVzIGVxdWFsIHRvIHdpbmRvdyBpbiBnZXRSZXNwb25zZVN0YXRlIG1ldGhvZCBzcGVjaWZpY2FsbHlcclxuICAgIGNvbnN0IHN0YXRlSW5mbyA9IHNlbGYuZ2V0UmVzcG9uc2VTdGF0ZShoYXNoKTtcclxuXHJcbiAgICBsZXQgdG9rZW5SZXNwb25zZUNhbGxiYWNrOiAocmVzcG9uc2U6IEF1dGhSZXNwb25zZSwgZXJyb3I6IEF1dGhFcnJvcikgPT4gdm9pZCA9IG51bGw7XHJcblxyXG4gICAgc2VsZi5sb2dnZXIuaW5mbyhcIlJldHVybmVkIGZyb20gcmVkaXJlY3QgdXJsXCIpO1xyXG4gICAgLy8gSWYgcGFyZW50IHdpbmRvdyBpcyB0aGUgbXNhbCBpbnN0YW5jZSB3aGljaCBvcGVuZWQgdGhlIGN1cnJlbnQgd2luZG93IChpZnJhbWUpXHJcbiAgICBpZiAodGhpcy5wYXJlbnRJc01zYWwoKSkge1xyXG4gICAgICAgIHRva2VuUmVzcG9uc2VDYWxsYmFjayA9IHdpbmRvdy5wYXJlbnQuY2FsbGJhY2tNYXBwZWRUb1JlbmV3U3RhdGVzW3N0YXRlSW5mby5zdGF0ZV07XHJcbiAgICB9XHJcbiAgICAvLyBDdXJyZW50IHdpbmRvdyBpcyB3aW5kb3cgb3BlbmVyIChwb3B1cClcclxuICAgIGVsc2UgaWYgKGlzV2luZG93T3BlbmVyTXNhbCkge1xyXG4gICAgICAgIHRva2VuUmVzcG9uc2VDYWxsYmFjayA9IHdpbmRvdy5vcGVuZXIuY2FsbGJhY2tNYXBwZWRUb1JlbmV3U3RhdGVzW3N0YXRlSW5mby5zdGF0ZV07XHJcbiAgICB9XHJcbiAgICAvLyBSZWRpcmVjdCBjYXNlc1xyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRva2VuUmVzcG9uc2VDYWxsYmFjayA9IG51bGw7XHJcbiAgICAgIC8vIGlmIHNldCB0byBuYXZpZ2F0ZSB0byBsb2dpblJlcXVlc3QgcGFnZSBwb3N0IGxvZ2luXHJcbiAgICAgIGlmIChzZWxmLmNvbmZpZy5hdXRoLm5hdmlnYXRlVG9Mb2dpblJlcXVlc3RVcmwpIHtcclxuICAgICAgICBzZWxmLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy51cmxIYXNoLCBoYXNoKTtcclxuICAgICAgICBpZiAod2luZG93LnBhcmVudCA9PT0gd2luZG93ICYmICFpc1BvcHVwKSB7XHJcbiAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IHNlbGYuY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLmxvZ2luUmVxdWVzdCwgc2VsZi5pbkNvb2tpZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9IFwiXCI7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCF0aGlzLnJlZGlyZWN0Q2FsbGJhY2tzU2V0KSB7XHJcbiAgICAgICAgLy8gV2UgcmVhY2hlZCB0aGlzIHBvaW50IHRvbyBlYXJseSwgcmV0dXJuIGFuZCBjb21lIGJhY2sgbGF0ZXJcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZWxmLnByb2Nlc3NDYWxsQmFjayhoYXNoLCBzdGF0ZUluZm8sIHRva2VuUmVzcG9uc2VDYWxsYmFjayk7XHJcblxyXG4gICAgLy8gSWYgY3VycmVudCB3aW5kb3cgaXMgb3BlbmVyLCBjbG9zZSBhbGwgd2luZG93c1xyXG4gICAgaWYgKGlzV2luZG93T3BlbmVyTXNhbCkge1xyXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHdpbmRvdy5vcGVuZXIub3BlbmVkV2luZG93cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHdpbmRvdy5vcGVuZXIub3BlbmVkV2luZG93c1tpXS5jbG9zZSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGRlc2VyaWFsaXplZCBwb3J0aW9uIG9mIFVSTCBoYXNoXHJcbiAgICogQHBhcmFtIGhhc2hcclxuICAgKi9cclxuICBwcml2YXRlIGRlc2VyaWFsaXplSGFzaChoYXNoOiBzdHJpbmcpIHtcclxuICAgIGhhc2ggPSB0aGlzLmdldEhhc2goaGFzaCk7XHJcbiAgICByZXR1cm4gVXRpbHMuZGVzZXJpYWxpemUoaGFzaCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgc3RhdGVJbmZvIG9iamVjdCBmcm9tIHRoZSBVUkwgZnJhZ21lbnQgYW5kIHJldHVybnMgaXQuXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGhhc2ggIC0gIEhhc2ggcGFzc2VkIGZyb20gcmVkaXJlY3QgcGFnZVxyXG4gICAqIEByZXR1cm5zIHtUb2tlblJlc3BvbnNlfSBhbiBvYmplY3QgY3JlYXRlZCBmcm9tIHRoZSByZWRpcmVjdCByZXNwb25zZSBmcm9tIEFBRCBjb21wcmlzaW5nIG9mIHRoZSBrZXlzIC0gcGFyYW1ldGVycywgcmVxdWVzdFR5cGUsIHN0YXRlTWF0Y2gsIHN0YXRlUmVzcG9uc2UgYW5kIHZhbGlkLlxyXG4gICAqIEBpZ25vcmVcclxuICAgKiBAaGlkZGVuXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIGdldFJlc3BvbnNlU3RhdGUoaGFzaDogc3RyaW5nKTogUmVzcG9uc2VTdGF0ZUluZm8ge1xyXG4gICAgY29uc3QgcGFyYW1ldGVycyA9IHRoaXMuZGVzZXJpYWxpemVIYXNoKGhhc2gpO1xyXG4gICAgbGV0IHN0YXRlUmVzcG9uc2U6IFJlc3BvbnNlU3RhdGVJbmZvO1xyXG4gICAgaWYgKCFwYXJhbWV0ZXJzKSB7XHJcbiAgICAgIHRocm93IEF1dGhFcnJvci5jcmVhdGVVbmV4cGVjdGVkRXJyb3IoXCJIYXNoIHdhcyBub3QgcGFyc2VkIGNvcnJlY3RseS5cIik7XHJcbiAgICB9XHJcbiAgICBpZiAocGFyYW1ldGVycy5oYXNPd25Qcm9wZXJ0eShcInN0YXRlXCIpKSB7XHJcbiAgICAgIHN0YXRlUmVzcG9uc2UgPSB7XHJcbiAgICAgICAgcmVxdWVzdFR5cGU6IENvbnN0YW50cy51bmtub3duLFxyXG4gICAgICAgIHN0YXRlOiBwYXJhbWV0ZXJzLnN0YXRlLFxyXG4gICAgICAgIHN0YXRlTWF0Y2g6IGZhbHNlXHJcbiAgICAgIH07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBBdXRoRXJyb3IuY3JlYXRlVW5leHBlY3RlZEVycm9yKFwiSGFzaCBkb2VzIG5vdCBjb250YWluIHN0YXRlLlwiKTtcclxuICAgIH1cclxuICAgIC8vIGFzeW5jIGNhbGxzIGNhbiBmaXJlIGlmcmFtZSBhbmQgbG9naW4gcmVxdWVzdCBhdCB0aGUgc2FtZSB0aW1lIGlmIGRldmVsb3BlciBkb2VzIG5vdCB1c2UgdGhlIEFQSSBhcyBleHBlY3RlZFxyXG4gICAgLy8gaW5jb21pbmcgY2FsbGJhY2sgbmVlZHMgdG8gYmUgbG9va2VkIHVwIHRvIGZpbmQgdGhlIHJlcXVlc3QgdHlwZVxyXG5cclxuICAgIC8vIGxvZ2luUmVkaXJlY3RcclxuICAgIGlmIChzdGF0ZVJlc3BvbnNlLnN0YXRlID09PSB0aGlzLmNhY2hlU3RvcmFnZS5nZXRJdGVtKENvbnN0YW50cy5zdGF0ZUxvZ2luLCB0aGlzLmluQ29va2llKSB8fCBzdGF0ZVJlc3BvbnNlLnN0YXRlID09PSB0aGlzLnNpbGVudEF1dGhlbnRpY2F0aW9uU3RhdGUpIHsgLy8gbG9naW5SZWRpcmVjdFxyXG4gICAgICBzdGF0ZVJlc3BvbnNlLnJlcXVlc3RUeXBlID0gQ29uc3RhbnRzLmxvZ2luO1xyXG4gICAgICBzdGF0ZVJlc3BvbnNlLnN0YXRlTWF0Y2ggPSB0cnVlO1xyXG4gICAgICByZXR1cm4gc3RhdGVSZXNwb25zZTtcclxuICAgIH1cclxuICAgIC8vIGFjcXVpcmVUb2tlblJlZGlyZWN0XHJcbiAgICBlbHNlIGlmIChzdGF0ZVJlc3BvbnNlLnN0YXRlID09PSB0aGlzLmNhY2hlU3RvcmFnZS5nZXRJdGVtKENvbnN0YW50cy5zdGF0ZUFjcXVpcmVUb2tlbiwgdGhpcy5pbkNvb2tpZSkpIHsgLy9hY3F1aXJlVG9rZW5SZWRpcmVjdFxyXG4gICAgICBzdGF0ZVJlc3BvbnNlLnJlcXVlc3RUeXBlID0gQ29uc3RhbnRzLnJlbmV3VG9rZW47XHJcbiAgICAgIHN0YXRlUmVzcG9uc2Uuc3RhdGVNYXRjaCA9IHRydWU7XHJcbiAgICAgIHJldHVybiBzdGF0ZVJlc3BvbnNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGV4dGVybmFsIGFwaSByZXF1ZXN0cyBtYXkgaGF2ZSBtYW55IHJlbmV3dG9rZW4gcmVxdWVzdHMgZm9yIGRpZmZlcmVudCByZXNvdXJjZVxyXG4gICAgaWYgKCFzdGF0ZVJlc3BvbnNlLnN0YXRlTWF0Y2gpIHtcclxuICAgICAgc3RhdGVSZXNwb25zZS5yZXF1ZXN0VHlwZSA9IHdpbmRvdy5yZXF1ZXN0VHlwZTtcclxuICAgICAgY29uc3Qgc3RhdGVzSW5QYXJlbnRDb250ZXh0ID0gd2luZG93LnJlbmV3U3RhdGVzO1xyXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0YXRlc0luUGFyZW50Q29udGV4dC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmIChzdGF0ZXNJblBhcmVudENvbnRleHRbaV0gPT09IHN0YXRlUmVzcG9uc2Uuc3RhdGUpIHtcclxuICAgICAgICAgIHN0YXRlUmVzcG9uc2Uuc3RhdGVNYXRjaCA9IHRydWU7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc3RhdGVSZXNwb25zZTtcclxuICB9XHJcblxyXG4gIC8vI2VuZHJlZ2lvblxyXG5cclxuICAvLyNyZWdpb24gVG9rZW4gUHJvY2Vzc2luZyAoRXh0cmFjdCB0byBUb2tlblByb2Nlc3NpbmcudHMpXHJcblxyXG4gIC8qKlxyXG4gICAqIFVzZWQgdG8gZ2V0IHRva2VuIGZvciB0aGUgc3BlY2lmaWVkIHNldCBvZiBzY29wZXMgZnJvbSB0aGUgY2FjaGVcclxuICAgKiBAcGFyYW0ge0F1dGhlbnRpY2F0aW9uUmVxdWVzdFBhcmFtZXRlcnN9IGF1dGhlbnRpY2F0aW9uUmVxdWVzdCAtIFJlcXVlc3Qgc2VudCB0byB0aGUgU1RTIHRvIG9idGFpbiBhbiBpZF90b2tlbi9hY2Nlc3NfdG9rZW5cclxuICAgKiBAcGFyYW0ge0FjY291bnR9IGFjY291bnQgLSBBY2NvdW50IGZvciB3aGljaCB0aGUgc2NvcGVzIHdlcmUgcmVxdWVzdGVkXHJcbiAgICogQGhpZGRlblxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2V0Q2FjaGVkVG9rZW4oc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0OiBTZXJ2ZXJSZXF1ZXN0UGFyYW1ldGVycywgYWNjb3VudDogQWNjb3VudCk6IEF1dGhSZXNwb25zZSB7XHJcbiAgICBsZXQgYWNjZXNzVG9rZW5DYWNoZUl0ZW06IEFjY2Vzc1Rva2VuQ2FjaGVJdGVtID0gbnVsbDtcclxuICAgIGNvbnN0IHNjb3BlcyA9IHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zY29wZXM7XHJcblxyXG4gICAgLy8gZmlsdGVyIGJ5IGNsaWVudElkIGFuZCBhY2NvdW50XHJcbiAgICBjb25zdCB0b2tlbkNhY2hlSXRlbXMgPSB0aGlzLmNhY2hlU3RvcmFnZS5nZXRBbGxBY2Nlc3NUb2tlbnModGhpcy5jbGllbnRJZCwgYWNjb3VudCA/IGFjY291bnQuaG9tZUFjY291bnRJZGVudGlmaWVyIDogbnVsbCk7XHJcblxyXG4gICAgLy8gTm8gbWF0Y2ggZm91bmQgYWZ0ZXIgaW5pdGlhbCBmaWx0ZXJpbmdcclxuICAgIGlmICh0b2tlbkNhY2hlSXRlbXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZpbHRlcmVkSXRlbXM6IEFycmF5PEFjY2Vzc1Rva2VuQ2FjaGVJdGVtPiA9IFtdO1xyXG5cclxuICAgIC8vIGlmIG5vIGF1dGhvcml0eSBwYXNzZWRcclxuICAgIGlmICghc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LmF1dGhvcml0eSkge1xyXG4gICAgICAvLyBmaWx0ZXIgYnkgc2NvcGVcclxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b2tlbkNhY2hlSXRlbXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCBjYWNoZUl0ZW0gPSB0b2tlbkNhY2hlSXRlbXNbaV07XHJcbiAgICAgICAgY29uc3QgY2FjaGVkU2NvcGVzID0gY2FjaGVJdGVtLmtleS5zY29wZXMuc3BsaXQoXCIgXCIpO1xyXG4gICAgICAgIGlmIChVdGlscy5jb250YWluc1Njb3BlKGNhY2hlZFNjb3Blcywgc2NvcGVzKSkge1xyXG4gICAgICAgICAgZmlsdGVyZWRJdGVtcy5wdXNoKGNhY2hlSXRlbSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBpZiBvbmx5IG9uZSBjYWNoZWQgdG9rZW4gZm91bmRcclxuICAgICAgaWYgKGZpbHRlcmVkSXRlbXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgYWNjZXNzVG9rZW5DYWNoZUl0ZW0gPSBmaWx0ZXJlZEl0ZW1zWzBdO1xyXG4gICAgICAgIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5hdXRob3JpdHlJbnN0YW5jZSA9IEF1dGhvcml0eUZhY3RvcnkuQ3JlYXRlSW5zdGFuY2UoYWNjZXNzVG9rZW5DYWNoZUl0ZW0ua2V5LmF1dGhvcml0eSwgdGhpcy5jb25maWcuYXV0aC52YWxpZGF0ZUF1dGhvcml0eSk7XHJcbiAgICAgIH1cclxuICAgICAgLy8gaWYgbW9yZSB0aGFuIG9uZSBjYWNoZWQgdG9rZW4gaXMgZm91bmRcclxuICAgICAgZWxzZSBpZiAoZmlsdGVyZWRJdGVtcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgdGhyb3cgQ2xpZW50QXV0aEVycm9yLmNyZWF0ZU11bHRpcGxlTWF0Y2hpbmdUb2tlbnNJbkNhY2hlRXJyb3Ioc2NvcGVzLnRvU3RyaW5nKCkpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIGlmIG5vIG1hdGNoIGZvdW5kLCBjaGVjayBpZiB0aGVyZSB3YXMgYSBzaW5nbGUgYXV0aG9yaXR5IHVzZWRcclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgY29uc3QgYXV0aG9yaXR5TGlzdCA9IHRoaXMuZ2V0VW5pcXVlQXV0aG9yaXR5KHRva2VuQ2FjaGVJdGVtcywgXCJhdXRob3JpdHlcIik7XHJcbiAgICAgICAgaWYgKGF1dGhvcml0eUxpc3QubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgdGhyb3cgQ2xpZW50QXV0aEVycm9yLmNyZWF0ZU11bHRpcGxlQXV0aG9yaXRpZXNJbkNhY2hlRXJyb3Ioc2NvcGVzLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LmF1dGhvcml0eUluc3RhbmNlID0gQXV0aG9yaXR5RmFjdG9yeS5DcmVhdGVJbnN0YW5jZShhdXRob3JpdHlMaXN0WzBdLCB0aGlzLmNvbmZpZy5hdXRoLnZhbGlkYXRlQXV0aG9yaXR5KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gaWYgYW4gYXV0aG9yaXR5IGlzIHBhc3NlZCBpbiB0aGUgQVBJXHJcbiAgICBlbHNlIHtcclxuICAgICAgLy8gZmlsdGVyIGJ5IGF1dGhvcml0eSBhbmQgc2NvcGVcclxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b2tlbkNhY2hlSXRlbXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCBjYWNoZUl0ZW0gPSB0b2tlbkNhY2hlSXRlbXNbaV07XHJcbiAgICAgICAgY29uc3QgY2FjaGVkU2NvcGVzID0gY2FjaGVJdGVtLmtleS5zY29wZXMuc3BsaXQoXCIgXCIpO1xyXG4gICAgICAgIGlmIChVdGlscy5jb250YWluc1Njb3BlKGNhY2hlZFNjb3Blcywgc2NvcGVzKSAmJiBVdGlscy5DYW5vbmljYWxpemVVcmkoY2FjaGVJdGVtLmtleS5hdXRob3JpdHkpID09PSBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QuYXV0aG9yaXR5KSB7XHJcbiAgICAgICAgICBmaWx0ZXJlZEl0ZW1zLnB1c2goY2FjaGVJdGVtKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgLy8gbm8gbWF0Y2hcclxuICAgICAgaWYgKGZpbHRlcmVkSXRlbXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgIH1cclxuICAgICAgLy8gaWYgb25seSBvbmUgY2FjaGVkVG9rZW4gRm91bmRcclxuICAgICAgZWxzZSBpZiAoZmlsdGVyZWRJdGVtcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICBhY2Nlc3NUb2tlbkNhY2hlSXRlbSA9IGZpbHRlcmVkSXRlbXNbMF07XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gaWYgbW9yZSB0aGFuIGNhY2hlZCB0b2tlbiBpcyBmb3VuZFxyXG4gICAgICAgIHRocm93IENsaWVudEF1dGhFcnJvci5jcmVhdGVNdWx0aXBsZU1hdGNoaW5nVG9rZW5zSW5DYWNoZUVycm9yKHNjb3Blcy50b1N0cmluZygpKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChhY2Nlc3NUb2tlbkNhY2hlSXRlbSAhPSBudWxsKSB7XHJcbiAgICAgIGxldCBleHBpcmVkID0gTnVtYmVyKGFjY2Vzc1Rva2VuQ2FjaGVJdGVtLnZhbHVlLmV4cGlyZXNJbik7XHJcbiAgICAgIC8vIElmIGV4cGlyYXRpb24gaXMgd2l0aGluIG9mZnNldCwgaXQgd2lsbCBmb3JjZSByZW5ld1xyXG4gICAgICBjb25zdCBvZmZzZXQgPSB0aGlzLmNvbmZpZy5zeXN0ZW0udG9rZW5SZW5ld2FsT2Zmc2V0U2Vjb25kcyB8fCAzMDA7XHJcbiAgICAgIGlmIChleHBpcmVkICYmIChleHBpcmVkID4gVXRpbHMubm93KCkgKyBvZmZzZXQpKSB7XHJcbiAgICAgICAgbGV0IGlkVG9rZW4gPSBuZXcgSWRUb2tlbihhY2Nlc3NUb2tlbkNhY2hlSXRlbS52YWx1ZS5pZFRva2VuKTtcclxuICAgICAgICBpZiAoIWFjY291bnQpIHtcclxuICAgICAgICAgIGFjY291bnQgPSB0aGlzLmdldEFjY291bnQoKTtcclxuICAgICAgICAgIGlmICghYWNjb3VudCkge1xyXG4gICAgICAgICAgICB0aHJvdyBBdXRoRXJyb3IuY3JlYXRlVW5leHBlY3RlZEVycm9yKFwiQWNjb3VudCBzaG91bGQgbm90IGJlIG51bGwgaGVyZS5cIik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGFTdGF0ZSA9IHRoaXMuZ2V0QWNjb3VudFN0YXRlKHRoaXMuY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLnN0YXRlTG9naW4sIHRoaXMuaW5Db29raWUpKTtcclxuICAgICAgICBsZXQgcmVzcG9uc2UgOiBBdXRoUmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICB1bmlxdWVJZDogXCJcIixcclxuICAgICAgICAgIHRlbmFudElkOiBcIlwiLFxyXG4gICAgICAgICAgdG9rZW5UeXBlOiAoYWNjZXNzVG9rZW5DYWNoZUl0ZW0udmFsdWUuaWRUb2tlbiA9PT0gYWNjZXNzVG9rZW5DYWNoZUl0ZW0udmFsdWUuYWNjZXNzVG9rZW4pID8gQ29uc3RhbnRzLmlkVG9rZW4gOiBDb25zdGFudHMuYWNjZXNzVG9rZW4sXHJcbiAgICAgICAgICBpZFRva2VuOiBpZFRva2VuLFxyXG4gICAgICAgICAgYWNjZXNzVG9rZW46IGFjY2Vzc1Rva2VuQ2FjaGVJdGVtLnZhbHVlLmFjY2Vzc1Rva2VuLFxyXG4gICAgICAgICAgc2NvcGVzOiBhY2Nlc3NUb2tlbkNhY2hlSXRlbS5rZXkuc2NvcGVzLnNwbGl0KFwiIFwiKSxcclxuICAgICAgICAgIGV4cGlyZXNPbjogbmV3IERhdGUoZXhwaXJlZCAqIDEwMDApLFxyXG4gICAgICAgICAgYWNjb3VudDogYWNjb3VudCxcclxuICAgICAgICAgIGFjY291bnRTdGF0ZTogYVN0YXRlLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgVXRpbHMuc2V0UmVzcG9uc2VJZFRva2VuKHJlc3BvbnNlLCBpZFRva2VuKTtcclxuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5jYWNoZVN0b3JhZ2UucmVtb3ZlSXRlbShKU09OLnN0cmluZ2lmeShmaWx0ZXJlZEl0ZW1zWzBdLmtleSkpO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVzZWQgdG8gZ2V0IGEgdW5pcXVlIGxpc3Qgb2YgYXV0aG9yaXR1ZXMgZnJvbSB0aGUgY2FjaGVcclxuICAgKiBAcGFyYW0ge0FycmF5PEFjY2Vzc1Rva2VuQ2FjaGVJdGVtPn0gIGFjY2Vzc1Rva2VuQ2FjaGVJdGVtcyAtIGFjY2Vzc1Rva2VuQ2FjaGVJdGVtcyBzYXZlZCBpbiB0aGUgY2FjaGVcclxuICAgKiBAaWdub3JlXHJcbiAgICogQGhpZGRlblxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2V0VW5pcXVlQXV0aG9yaXR5KGFjY2Vzc1Rva2VuQ2FjaGVJdGVtczogQXJyYXk8QWNjZXNzVG9rZW5DYWNoZUl0ZW0+LCBwcm9wZXJ0eTogc3RyaW5nKTogQXJyYXk8c3RyaW5nPiB7XHJcbiAgICBjb25zdCBhdXRob3JpdHlMaXN0OiBBcnJheTxzdHJpbmc+ID0gW107XHJcbiAgICBjb25zdCBmbGFnczogQXJyYXk8c3RyaW5nPiA9IFtdO1xyXG4gICAgYWNjZXNzVG9rZW5DYWNoZUl0ZW1zLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgIGlmIChlbGVtZW50LmtleS5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSkgJiYgKGZsYWdzLmluZGV4T2YoZWxlbWVudC5rZXlbcHJvcGVydHldKSA9PT0gLTEpKSB7XHJcbiAgICAgICAgZmxhZ3MucHVzaChlbGVtZW50LmtleVtwcm9wZXJ0eV0pO1xyXG4gICAgICAgIGF1dGhvcml0eUxpc3QucHVzaChlbGVtZW50LmtleVtwcm9wZXJ0eV0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBhdXRob3JpdHlMaXN0O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2hlY2sgaWYgQURBTCBpZF90b2tlbiBleGlzdHMgYW5kIHJldHVybiBpZiBleGlzdHMuXHJcbiAgICpcclxuICAgKiBAaGlkZGVuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBleHRyYWN0QURBTElkVG9rZW4oKTogYW55IHtcclxuICAgIGNvbnN0IGFkYWxJZFRva2VuID0gdGhpcy5jYWNoZVN0b3JhZ2UuZ2V0SXRlbShDb25zdGFudHMuYWRhbElkVG9rZW4pO1xyXG4gICAgaWYgKCFVdGlscy5pc0VtcHR5KGFkYWxJZFRva2VuKSkge1xyXG4gICAgICAgIHJldHVybiBVdGlscy5leHRyYWN0SWRUb2tlbihhZGFsSWRUb2tlbik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFjcXVpcmVzIGFjY2VzcyB0b2tlbiB1c2luZyBhIGhpZGRlbiBpZnJhbWUuXHJcbiAgICogQGlnbm9yZVxyXG4gICAqIEBoaWRkZW5cclxuICAgKi9cclxuICBwcml2YXRlIHJlbmV3VG9rZW4oc2NvcGVzOiBBcnJheTxzdHJpbmc+LCByZXNvbHZlOiBGdW5jdGlvbiwgcmVqZWN0OiBGdW5jdGlvbiwgYWNjb3VudDogQWNjb3VudCwgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0OiBTZXJ2ZXJSZXF1ZXN0UGFyYW1ldGVycyk6IHZvaWQge1xyXG4gICAgY29uc3Qgc2NvcGUgPSBzY29wZXMuam9pbihcIiBcIikudG9Mb3dlckNhc2UoKTtcclxuICAgIHRoaXMubG9nZ2VyLnZlcmJvc2UoXCJyZW5ld1Rva2VuIGlzIGNhbGxlZCBmb3Igc2NvcGU6XCIgKyBzY29wZSk7XHJcbiAgICBjb25zdCBmcmFtZUhhbmRsZSA9IHRoaXMuYWRkSGlkZGVuSUZyYW1lKFwibXNhbFJlbmV3RnJhbWVcIiArIHNjb3BlKTtcclxuXHJcbiAgICAvLyBDYWNoZSBhY2NvdW50IGFuZCBhdXRob3JpdHlcclxuICAgIHRoaXMuc2V0QWNjb3VudENhY2hlKGFjY291bnQsIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSk7XHJcbiAgICB0aGlzLnNldEF1dGhvcml0eUNhY2hlKHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSwgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LmF1dGhvcml0eSk7XHJcblxyXG4gICAgLy8gcmVuZXcgaGFwcGVucyBpbiBpZnJhbWUsIHNvIGl0IGtlZXBzIGphdmFzY3JpcHQgY29udGV4dFxyXG4gICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubm9uY2VJZFRva2VuLCBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Qubm9uY2UsIHRoaXMuaW5Db29raWUpO1xyXG4gICAgdGhpcy5sb2dnZXIudmVyYm9zZShcIlJlbmV3IHRva2VuIEV4cGVjdGVkIHN0YXRlOiBcIiArIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSk7XHJcblxyXG4gICAgLy8gQnVpbGQgdXJsTmF2aWdhdGUgd2l0aCBcInByb21wdD1ub25lXCIgYW5kIG5hdmlnYXRlIHRvIFVSTCBpbiBoaWRkZW4gaUZyYW1lXHJcbiAgICBsZXQgdXJsTmF2aWdhdGUgPSBVdGlscy51cmxSZW1vdmVRdWVyeVN0cmluZ1BhcmFtZXRlcihzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QuY3JlYXRlTmF2aWdhdGVVcmwoc2NvcGVzKSwgQ29uc3RhbnRzLnByb21wdCkgKyBDb25zdGFudHMucHJvbXB0X25vbmU7XHJcblxyXG4gICAgd2luZG93LnJlbmV3U3RhdGVzLnB1c2goc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlKTtcclxuICAgIHdpbmRvdy5yZXF1ZXN0VHlwZSA9IENvbnN0YW50cy5yZW5ld1Rva2VuO1xyXG4gICAgdGhpcy5yZWdpc3RlckNhbGxiYWNrKHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSwgc2NvcGUsIHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICB0aGlzLmxvZ2dlci5pbmZvUGlpKFwiTmF2aWdhdGUgdG86XCIgKyB1cmxOYXZpZ2F0ZSk7XHJcbiAgICBmcmFtZUhhbmRsZS5zcmMgPSBcImFib3V0OmJsYW5rXCI7XHJcbiAgICB0aGlzLmxvYWRJZnJhbWVUaW1lb3V0KHVybE5hdmlnYXRlLCBcIm1zYWxSZW5ld0ZyYW1lXCIgKyBzY29wZSwgc2NvcGUpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVuZXdzIGlkdG9rZW4gZm9yIGFwcFwicyBvd24gYmFja2VuZCB3aGVuIGNsaWVudElkIGlzIHBhc3NlZCBhcyBhIHNpbmdsZSBzY29wZSBpbiB0aGUgc2NvcGVzIGFycmF5LlxyXG4gICAqIEBpZ25vcmVcclxuICAgKiBAaGlkZGVuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSByZW5ld0lkVG9rZW4oc2NvcGVzOiBBcnJheTxzdHJpbmc+LCByZXNvbHZlOiBGdW5jdGlvbiwgcmVqZWN0OiBGdW5jdGlvbiwgYWNjb3VudDogQWNjb3VudCwgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0OiBTZXJ2ZXJSZXF1ZXN0UGFyYW1ldGVycyk6IHZvaWQge1xyXG5cclxuICAgIHRoaXMubG9nZ2VyLmluZm8oXCJyZW5ld2lkVG9rZW4gaXMgY2FsbGVkXCIpO1xyXG4gICAgY29uc3QgZnJhbWVIYW5kbGUgPSB0aGlzLmFkZEhpZGRlbklGcmFtZShcIm1zYWxJZFRva2VuRnJhbWVcIik7XHJcblxyXG4gICAgLy8gQ2FjaGUgYWNjb3VudCBhbmQgYXV0aG9yaXR5XHJcbiAgICB0aGlzLnNldEFjY291bnRDYWNoZShhY2NvdW50LCBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGUpO1xyXG4gICAgdGhpcy5zZXRBdXRob3JpdHlDYWNoZShzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGUsIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5hdXRob3JpdHkpO1xyXG5cclxuICAgIC8vIENhY2hlIG5vbmNlXHJcbiAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5ub25jZUlkVG9rZW4sIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5ub25jZSwgdGhpcy5pbkNvb2tpZSk7XHJcblxyXG4gICAgdGhpcy5sb2dnZXIudmVyYm9zZShcIlJlbmV3IElkdG9rZW4gRXhwZWN0ZWQgc3RhdGU6IFwiICsgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LnN0YXRlKTtcclxuXHJcbiAgICAvLyBCdWlsZCB1cmxOYXZpZ2F0ZSB3aXRoIFwicHJvbXB0PW5vbmVcIiBhbmQgbmF2aWdhdGUgdG8gVVJMIGluIGhpZGRlbiBpRnJhbWVcclxuICAgIGxldCB1cmxOYXZpZ2F0ZSA9IFV0aWxzLnVybFJlbW92ZVF1ZXJ5U3RyaW5nUGFyYW1ldGVyKHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5jcmVhdGVOYXZpZ2F0ZVVybChzY29wZXMpLCBDb25zdGFudHMucHJvbXB0KSArIENvbnN0YW50cy5wcm9tcHRfbm9uZTtcclxuXHJcbiAgICBpZiAodGhpcy5zaWxlbnRMb2dpbikge1xyXG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0VHlwZSA9IENvbnN0YW50cy5sb2dpbjtcclxuICAgICAgICB0aGlzLnNpbGVudEF1dGhlbnRpY2F0aW9uU3RhdGUgPSBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3Quc3RhdGU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0VHlwZSA9IENvbnN0YW50cy5yZW5ld1Rva2VuO1xyXG4gICAgICAgIHdpbmRvdy5yZW5ld1N0YXRlcy5wdXNoKHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gbm90ZTogc2NvcGUgaGVyZSBpcyBjbGllbnRJZFxyXG4gICAgdGhpcy5yZWdpc3RlckNhbGxiYWNrKHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdC5zdGF0ZSwgdGhpcy5jbGllbnRJZCwgcmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgIHRoaXMubG9nZ2VyLmluZm9QaWkoXCJOYXZpZ2F0ZSB0bzpcIiArIHVybE5hdmlnYXRlKTtcclxuICAgIGZyYW1lSGFuZGxlLnNyYyA9IFwiYWJvdXQ6YmxhbmtcIjtcclxuICAgIHRoaXMubG9hZElmcmFtZVRpbWVvdXQodXJsTmF2aWdhdGUsIFwibXNhbElkVG9rZW5GcmFtZVwiLCB0aGlzLmNsaWVudElkKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoaXMgbWV0aG9kIG11c3QgYmUgY2FsbGVkIGZvciBwcm9jZXNzaW5nIHRoZSByZXNwb25zZSByZWNlaXZlZCBmcm9tIEFBRC4gSXQgZXh0cmFjdHMgdGhlIGhhc2gsIHByb2Nlc3NlcyB0aGUgdG9rZW4gb3IgZXJyb3IsIHNhdmVzIGl0IGluIHRoZSBjYWNoZSBhbmQgY2FsbHMgdGhlIHJlZ2lzdGVyZWQgY2FsbGJhY2tzIHdpdGggdGhlIHJlc3VsdC5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gYXV0aG9yaXR5IGF1dGhvcml0eSByZWNlaXZlZCBpbiB0aGUgcmVkaXJlY3QgcmVzcG9uc2UgZnJvbSBBQUQuXHJcbiAgICogQHBhcmFtIHtUb2tlblJlc3BvbnNlfSByZXF1ZXN0SW5mbyBhbiBvYmplY3QgY3JlYXRlZCBmcm9tIHRoZSByZWRpcmVjdCByZXNwb25zZSBmcm9tIEFBRCBjb21wcmlzaW5nIG9mIHRoZSBrZXlzIC0gcGFyYW1ldGVycywgcmVxdWVzdFR5cGUsIHN0YXRlTWF0Y2gsIHN0YXRlUmVzcG9uc2UgYW5kIHZhbGlkLlxyXG4gICAqIEBwYXJhbSB7QWNjb3VudH0gYWNjb3VudCBhY2NvdW50IG9iamVjdCBmb3Igd2hpY2ggc2NvcGVzIGFyZSBjb25zZW50ZWQgZm9yLiBUaGUgZGVmYXVsdCBhY2NvdW50IGlzIHRoZSBsb2dnZWQgaW4gYWNjb3VudC5cclxuICAgKiBAcGFyYW0ge0NsaWVudEluZm99IGNsaWVudEluZm8gY2xpZW50SW5mbyByZWNlaXZlZCBhcyBwYXJ0IG9mIHRoZSByZXNwb25zZSBjb21wcmlzaW5nIG9mIGZpZWxkcyB1aWQgYW5kIHV0aWQuXHJcbiAgICogQHBhcmFtIHtJZFRva2VufSBpZFRva2VuIGlkVG9rZW4gcmVjZWl2ZWQgYXMgcGFydCBvZiB0aGUgcmVzcG9uc2UuXHJcbiAgICogQGlnbm9yZVxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQGhpZGRlblxyXG4gICAqL1xyXG4gIC8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbiAgcHJpdmF0ZSBzYXZlQWNjZXNzVG9rZW4ocmVzcG9uc2U6IEF1dGhSZXNwb25zZSwgYXV0aG9yaXR5OiBzdHJpbmcsIHBhcmFtZXRlcnM6IGFueSwgY2xpZW50SW5mbzogc3RyaW5nKTogQXV0aFJlc3BvbnNlIHtcclxuICAgIGxldCBzY29wZTogc3RyaW5nO1xyXG4gICAgbGV0IGFjY2Vzc1Rva2VuUmVzcG9uc2UgPSB7IC4uLnJlc3BvbnNlIH07XHJcbiAgICBjb25zdCBjbGllbnRPYmo6IENsaWVudEluZm8gPSBuZXcgQ2xpZW50SW5mbyhjbGllbnRJbmZvKTtcclxuXHJcbiAgICAvLyBpZiB0aGUgcmVzcG9uc2UgY29udGFpbnMgXCJzY29wZVwiXHJcbiAgICBpZiAocGFyYW1ldGVycy5oYXNPd25Qcm9wZXJ0eShcInNjb3BlXCIpKSB7XHJcbiAgICAgIC8vIHJlYWQgdGhlIHNjb3Blc1xyXG4gICAgICBzY29wZSA9IHBhcmFtZXRlcnNbXCJzY29wZVwiXTtcclxuICAgICAgY29uc3QgY29uc2VudGVkU2NvcGVzID0gc2NvcGUuc3BsaXQoXCIgXCIpO1xyXG5cclxuICAgICAgLy8gcmV0cmlldmUgYWxsIGFjY2VzcyB0b2tlbnMgZnJvbSB0aGUgY2FjaGUsIHJlbW92ZSB0aGUgZHVwIHNjb3Jlc1xyXG4gICAgICBjb25zdCBhY2Nlc3NUb2tlbkNhY2hlSXRlbXMgPSB0aGlzLmNhY2hlU3RvcmFnZS5nZXRBbGxBY2Nlc3NUb2tlbnModGhpcy5jbGllbnRJZCwgYXV0aG9yaXR5KTtcclxuXHJcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWNjZXNzVG9rZW5DYWNoZUl0ZW1zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgY29uc3QgYWNjZXNzVG9rZW5DYWNoZUl0ZW0gPSBhY2Nlc3NUb2tlbkNhY2hlSXRlbXNbaV07XHJcblxyXG4gICAgICAgIGlmIChhY2Nlc3NUb2tlbkNhY2hlSXRlbS5rZXkuaG9tZUFjY291bnRJZGVudGlmaWVyID09PSByZXNwb25zZS5hY2NvdW50LmhvbWVBY2NvdW50SWRlbnRpZmllcikge1xyXG4gICAgICAgICAgY29uc3QgY2FjaGVkU2NvcGVzID0gYWNjZXNzVG9rZW5DYWNoZUl0ZW0ua2V5LnNjb3Blcy5zcGxpdChcIiBcIik7XHJcbiAgICAgICAgICBpZiAoVXRpbHMuaXNJbnRlcnNlY3RpbmdTY29wZXMoY2FjaGVkU2NvcGVzLCBjb25zZW50ZWRTY29wZXMpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnJlbW92ZUl0ZW0oSlNPTi5zdHJpbmdpZnkoYWNjZXNzVG9rZW5DYWNoZUl0ZW0ua2V5KSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBHZW5lcmF0ZSBhbmQgY2FjaGUgYWNjZXNzVG9rZW5LZXkgYW5kIGFjY2Vzc1Rva2VuVmFsdWVcclxuICAgICAgY29uc3QgZXhwaXJlc0luID0gVXRpbHMuZXhwaXJlc0luKHBhcmFtZXRlcnNbQ29uc3RhbnRzLmV4cGlyZXNJbl0pLnRvU3RyaW5nKCk7XHJcbiAgICAgIGNvbnN0IGFjY2Vzc1Rva2VuS2V5ID0gbmV3IEFjY2Vzc1Rva2VuS2V5KGF1dGhvcml0eSwgdGhpcy5jbGllbnRJZCwgc2NvcGUsIGNsaWVudE9iai51aWQsIGNsaWVudE9iai51dGlkKTtcclxuICAgICAgY29uc3QgYWNjZXNzVG9rZW5WYWx1ZSA9IG5ldyBBY2Nlc3NUb2tlblZhbHVlKHBhcmFtZXRlcnNbQ29uc3RhbnRzLmFjY2Vzc1Rva2VuXSwgcmVzcG9uc2UuaWRUb2tlbi5yYXdJZFRva2VuLCBleHBpcmVzSW4sIGNsaWVudEluZm8pO1xyXG5cclxuICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShKU09OLnN0cmluZ2lmeShhY2Nlc3NUb2tlbktleSksIEpTT04uc3RyaW5naWZ5KGFjY2Vzc1Rva2VuVmFsdWUpKTtcclxuXHJcbiAgICAgIGFjY2Vzc1Rva2VuUmVzcG9uc2UuYWNjZXNzVG9rZW4gID0gcGFyYW1ldGVyc1tDb25zdGFudHMuYWNjZXNzVG9rZW5dO1xyXG4gICAgICBhY2Nlc3NUb2tlblJlc3BvbnNlLnNjb3BlcyA9IGNvbnNlbnRlZFNjb3BlcztcclxuICAgICAgbGV0IGV4cCA9IE51bWJlcihleHBpcmVzSW4pO1xyXG4gICAgICBpZiAoZXhwKSB7XHJcbiAgICAgICAgYWNjZXNzVG9rZW5SZXNwb25zZS5leHBpcmVzT24gPSBuZXcgRGF0ZSgoVXRpbHMubm93KCkgKyBleHApICogMTAwMCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoXCJDb3VsZCBub3QgcGFyc2UgZXhwaXJlc0luIHBhcmFtZXRlci4gR2l2ZW4gdmFsdWU6IFwiICsgZXhwaXJlc0luKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gaWYgdGhlIHJlc3BvbnNlIGRvZXMgbm90IGNvbnRhaW4gXCJzY29wZVwiIC0gc2NvcGUgaXMgdXN1YWxseSBjbGllbnRfaWQgYW5kIHRoZSB0b2tlbiB3aWxsIGJlIGlkX3Rva2VuXHJcbiAgICBlbHNlIHtcclxuICAgICAgc2NvcGUgPSB0aGlzLmNsaWVudElkO1xyXG5cclxuICAgICAgLy8gR2VuZXJhdGUgYW5kIGNhY2hlIGFjY2Vzc1Rva2VuS2V5IGFuZCBhY2Nlc3NUb2tlblZhbHVlXHJcbiAgICAgIGNvbnN0IGFjY2Vzc1Rva2VuS2V5ID0gbmV3IEFjY2Vzc1Rva2VuS2V5KGF1dGhvcml0eSwgdGhpcy5jbGllbnRJZCwgc2NvcGUsIGNsaWVudE9iai51aWQsIGNsaWVudE9iai51dGlkKTtcclxuXHJcbiAgICAgIGNvbnN0IGFjY2Vzc1Rva2VuVmFsdWUgPSBuZXcgQWNjZXNzVG9rZW5WYWx1ZShwYXJhbWV0ZXJzW0NvbnN0YW50cy5pZFRva2VuXSwgcGFyYW1ldGVyc1tDb25zdGFudHMuaWRUb2tlbl0sIHJlc3BvbnNlLmlkVG9rZW4uZXhwaXJhdGlvbiwgY2xpZW50SW5mbyk7XHJcbiAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oSlNPTi5zdHJpbmdpZnkoYWNjZXNzVG9rZW5LZXkpLCBKU09OLnN0cmluZ2lmeShhY2Nlc3NUb2tlblZhbHVlKSk7XHJcbiAgICAgIGFjY2Vzc1Rva2VuUmVzcG9uc2Uuc2NvcGVzID0gW3Njb3BlXTtcclxuICAgICAgYWNjZXNzVG9rZW5SZXNwb25zZS5hY2Nlc3NUb2tlbiA9IHBhcmFtZXRlcnNbQ29uc3RhbnRzLmlkVG9rZW5dO1xyXG4gICAgICBsZXQgZXhwID0gTnVtYmVyKHJlc3BvbnNlLmlkVG9rZW4uZXhwaXJhdGlvbik7XHJcbiAgICAgIGlmIChleHApIHtcclxuICAgICAgICBhY2Nlc3NUb2tlblJlc3BvbnNlLmV4cGlyZXNPbiA9IG5ldyBEYXRlKGV4cCAqIDEwMDApO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKFwiQ291bGQgbm90IHBhcnNlIGV4cGlyZXNJbiBwYXJhbWV0ZXJcIik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBhY2Nlc3NUb2tlblJlc3BvbnNlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2F2ZXMgdG9rZW4gb3IgZXJyb3IgcmVjZWl2ZWQgaW4gdGhlIHJlc3BvbnNlIGZyb20gQUFEIGluIHRoZSBjYWNoZS4gSW4gY2FzZSBvZiBpZF90b2tlbiwgaXQgYWxzbyBjcmVhdGVzIHRoZSBhY2NvdW50IG9iamVjdC5cclxuICAgKiBAaWdub3JlXHJcbiAgICogQGhpZGRlblxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBzYXZlVG9rZW5Gcm9tSGFzaChoYXNoOiBzdHJpbmcsIHN0YXRlSW5mbzogUmVzcG9uc2VTdGF0ZUluZm8pOiBBdXRoUmVzcG9uc2Uge1xyXG4gICAgdGhpcy5sb2dnZXIuaW5mbyhcIlN0YXRlIHN0YXR1czpcIiArIHN0YXRlSW5mby5zdGF0ZU1hdGNoICsgXCI7IFJlcXVlc3QgdHlwZTpcIiArIHN0YXRlSW5mby5yZXF1ZXN0VHlwZSk7XHJcbiAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsRXJyb3IsIFwiXCIpO1xyXG4gICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbEVycm9yRGVzY3JpcHRpb24sIFwiXCIpO1xyXG5cclxuICAgIGxldCByZXNwb25zZSA6IEF1dGhSZXNwb25zZSA9IHtcclxuICAgICAgdW5pcXVlSWQ6IFwiXCIsXHJcbiAgICAgIHRlbmFudElkOiBcIlwiLFxyXG4gICAgICB0b2tlblR5cGU6IFwiXCIsXHJcbiAgICAgIGlkVG9rZW46IG51bGwsXHJcbiAgICAgIGFjY2Vzc1Rva2VuOiBudWxsLFxyXG4gICAgICBzY29wZXM6IFtdLFxyXG4gICAgICBleHBpcmVzT246IG51bGwsXHJcbiAgICAgIGFjY291bnQ6IG51bGwsXHJcbiAgICAgIGFjY291bnRTdGF0ZTogXCJcIixcclxuICAgIH07XHJcblxyXG4gICAgbGV0IGVycm9yOiBBdXRoRXJyb3I7XHJcbiAgICBjb25zdCBoYXNoUGFyYW1zID0gdGhpcy5kZXNlcmlhbGl6ZUhhc2goaGFzaCk7XHJcbiAgICBsZXQgYXV0aG9yaXR5S2V5OiBzdHJpbmcgPSBcIlwiO1xyXG4gICAgbGV0IGFjcXVpcmVUb2tlbkFjY291bnRLZXk6IHN0cmluZyA9IFwiXCI7XHJcblxyXG4gICAgLy8gSWYgc2VydmVyIHJldHVybnMgYW4gZXJyb3JcclxuICAgIGlmIChoYXNoUGFyYW1zLmhhc093blByb3BlcnR5KENvbnN0YW50cy5lcnJvckRlc2NyaXB0aW9uKSB8fCBoYXNoUGFyYW1zLmhhc093blByb3BlcnR5KENvbnN0YW50cy5lcnJvcikpIHtcclxuICAgICAgdGhpcy5sb2dnZXIuaW5mb1BpaShcIkVycm9yIDpcIiArIGhhc2hQYXJhbXNbQ29uc3RhbnRzLmVycm9yXSArIFwiOyBFcnJvciBkZXNjcmlwdGlvbjpcIiArIGhhc2hQYXJhbXNbQ29uc3RhbnRzLmVycm9yRGVzY3JpcHRpb25dKTtcclxuICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbEVycm9yLCBoYXNoUGFyYW1zW0NvbnN0YW50cy5lcnJvcl0pO1xyXG4gICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsRXJyb3JEZXNjcmlwdGlvbiwgaGFzaFBhcmFtc1tDb25zdGFudHMuZXJyb3JEZXNjcmlwdGlvbl0pO1xyXG5cclxuICAgICAgLy8gbG9naW5cclxuICAgICAgaWYgKHN0YXRlSW5mby5yZXF1ZXN0VHlwZSA9PT0gQ29uc3RhbnRzLmxvZ2luKSB7XHJcbiAgICAgICAgdGhpcy5sb2dpbkluUHJvZ3Jlc3MgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5sb2dpbkVycm9yLCBoYXNoUGFyYW1zW0NvbnN0YW50cy5lcnJvckRlc2NyaXB0aW9uXSArIFwiOlwiICsgaGFzaFBhcmFtc1tDb25zdGFudHMuZXJyb3JdKTtcclxuICAgICAgICBhdXRob3JpdHlLZXkgPSBTdG9yYWdlLmdlbmVyYXRlQXV0aG9yaXR5S2V5KHN0YXRlSW5mby5zdGF0ZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGFjcXVpcmVUb2tlblxyXG4gICAgICBpZiAoc3RhdGVJbmZvLnJlcXVlc3RUeXBlID09PSBDb25zdGFudHMucmVuZXdUb2tlbikge1xyXG4gICAgICAgIHRoaXMuYWNxdWlyZVRva2VuSW5Qcm9ncmVzcyA9IGZhbHNlO1xyXG4gICAgICAgIGF1dGhvcml0eUtleSA9IFN0b3JhZ2UuZ2VuZXJhdGVBdXRob3JpdHlLZXkoc3RhdGVJbmZvLnN0YXRlKTtcclxuXHJcbiAgICAgICAgY29uc3QgYWNjb3VudDogQWNjb3VudCA9IHRoaXMuZ2V0QWNjb3VudCgpO1xyXG4gICAgICAgIGNvbnN0IGFjY291bnRJZDogc3RyaW5nID0gYWNjb3VudCA/IHRoaXMuZ2V0QWNjb3VudElkKGFjY291bnQpIDogXCJcIjtcclxuXHJcbiAgICAgICAgYWNxdWlyZVRva2VuQWNjb3VudEtleSA9IFN0b3JhZ2UuZ2VuZXJhdGVBY3F1aXJlVG9rZW5BY2NvdW50S2V5KGFjY291bnRJZCwgc3RhdGVJbmZvLnN0YXRlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMuaXNJbnRlcmFjdGlvblJlcXVpcmVkKGhhc2hQYXJhbXNbQ29uc3RhbnRzLmVycm9yRGVzY3JpcHRpb25dKSkge1xyXG4gICAgICAgIGVycm9yID0gbmV3IEludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3IoaGFzaFBhcmFtc1tDb25zdGFudHMuZXJyb3JdLCBoYXNoUGFyYW1zW0NvbnN0YW50cy5lcnJvckRlc2NyaXB0aW9uXSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZXJyb3IgPSBuZXcgU2VydmVyRXJyb3IoaGFzaFBhcmFtc1tDb25zdGFudHMuZXJyb3JdLCBoYXNoUGFyYW1zW0NvbnN0YW50cy5lcnJvckRlc2NyaXB0aW9uXSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIElmIHRoZSBzZXJ2ZXIgcmV0dXJucyBcIlN1Y2Nlc3NcIlxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIFZlcmlmeSB0aGUgc3RhdGUgZnJvbSByZWRpcmVjdCBhbmQgcmVjb3JkIHRva2VucyB0byBzdG9yYWdlIGlmIGV4aXN0c1xyXG4gICAgICBpZiAoc3RhdGVJbmZvLnN0YXRlTWF0Y2gpIHtcclxuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKFwiU3RhdGUgaXMgcmlnaHRcIik7XHJcbiAgICAgICAgaWYgKGhhc2hQYXJhbXMuaGFzT3duUHJvcGVydHkoQ29uc3RhbnRzLnNlc3Npb25TdGF0ZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbFNlc3Npb25TdGF0ZSwgaGFzaFBhcmFtc1tDb25zdGFudHMuc2Vzc2lvblN0YXRlXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlc3BvbnNlLmFjY291bnRTdGF0ZSA9IHN0YXRlSW5mby5zdGF0ZTtcclxuXHJcbiAgICAgICAgbGV0IGNsaWVudEluZm86IHN0cmluZyA9IFwiXCI7XHJcblxyXG4gICAgICAgIC8vIFByb2Nlc3MgYWNjZXNzX3Rva2VuXHJcbiAgICAgICAgaWYgKGhhc2hQYXJhbXMuaGFzT3duUHJvcGVydHkoQ29uc3RhbnRzLmFjY2Vzc1Rva2VuKSkge1xyXG4gICAgICAgICAgdGhpcy5sb2dnZXIuaW5mbyhcIkZyYWdtZW50IGhhcyBhY2Nlc3MgdG9rZW5cIik7XHJcbiAgICAgICAgICB0aGlzLmFjcXVpcmVUb2tlbkluUHJvZ3Jlc3MgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAvLyByZXRyaWV2ZSB0aGUgaWRfdG9rZW4gZnJvbSByZXNwb25zZSBpZiBwcmVzZW50IDpcclxuICAgICAgICAgIGlmIChoYXNoUGFyYW1zLmhhc093blByb3BlcnR5KENvbnN0YW50cy5pZFRva2VuKSkge1xyXG4gICAgICAgICAgICByZXNwb25zZS5pZFRva2VuID0gbmV3IElkVG9rZW4oaGFzaFBhcmFtc1tDb25zdGFudHMuaWRUb2tlbl0pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVzcG9uc2UgPSBVdGlscy5zZXRSZXNwb25zZUlkVG9rZW4ocmVzcG9uc2UsIG5ldyBJZFRva2VuKHRoaXMuY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLmlkVG9rZW5LZXkpKSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gcmV0cmlldmUgdGhlIGF1dGhvcml0eSBmcm9tIGNhY2hlIGFuZCByZXBsYWNlIHdpdGggdGVuYW50SURcclxuICAgICAgICAgIGNvbnN0IGF1dGhvcml0eUtleSA9IFN0b3JhZ2UuZ2VuZXJhdGVBdXRob3JpdHlLZXkoc3RhdGVJbmZvLnN0YXRlKTtcclxuICAgICAgICAgIGxldCBhdXRob3JpdHk6IHN0cmluZyA9IHRoaXMuY2FjaGVTdG9yYWdlLmdldEl0ZW0oYXV0aG9yaXR5S2V5LCB0aGlzLmluQ29va2llKTtcclxuXHJcbiAgICAgICAgICBpZiAoIVV0aWxzLmlzRW1wdHkoYXV0aG9yaXR5KSkge1xyXG4gICAgICAgICAgICBhdXRob3JpdHkgPSBVdGlscy5yZXBsYWNlVGVuYW50UGF0aChhdXRob3JpdHksIHJlc3BvbnNlLnRlbmFudElkKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyByZXRyaWV2ZSBjbGllbnRfaW5mbyAtIGlmIGl0IGlzIG5vdCBmb3VuZCwgZ2VuZXJhdGUgdGhlIHVpZCBhbmQgdXRpZCBmcm9tIGlkVG9rZW5cclxuICAgICAgICAgIGlmIChoYXNoUGFyYW1zLmhhc093blByb3BlcnR5KENvbnN0YW50cy5jbGllbnRJbmZvKSkge1xyXG4gICAgICAgICAgICBjbGllbnRJbmZvID0gaGFzaFBhcmFtc1tDb25zdGFudHMuY2xpZW50SW5mb107XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuaW5nKFwiQ2xpZW50SW5mbyBub3QgcmVjZWl2ZWQgaW4gdGhlIHJlc3BvbnNlIGZyb20gQUFEXCIpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJlc3BvbnNlLmFjY291bnQgPSBBY2NvdW50LmNyZWF0ZUFjY291bnQocmVzcG9uc2UuaWRUb2tlbiwgbmV3IENsaWVudEluZm8oY2xpZW50SW5mbykpO1xyXG4gICAgICAgICAgY29uc3QgYWNjb3VudEtleTogc3RyaW5nID0gdGhpcy5nZXRBY2NvdW50SWQocmVzcG9uc2UuYWNjb3VudCk7XHJcblxyXG4gICAgICAgICAgYWNxdWlyZVRva2VuQWNjb3VudEtleSA9IFN0b3JhZ2UuZ2VuZXJhdGVBY3F1aXJlVG9rZW5BY2NvdW50S2V5KGFjY291bnRLZXksIHN0YXRlSW5mby5zdGF0ZSk7XHJcbiAgICAgICAgICBjb25zdCBhY3F1aXJlVG9rZW5BY2NvdW50S2V5X25vYWNjb3VudCA9IFN0b3JhZ2UuZ2VuZXJhdGVBY3F1aXJlVG9rZW5BY2NvdW50S2V5KENvbnN0YW50cy5ub19hY2NvdW50LCBzdGF0ZUluZm8uc3RhdGUpO1xyXG5cclxuICAgICAgICAgIGxldCBjYWNoZWRBY2NvdW50OiBzdHJpbmcgPSB0aGlzLmNhY2hlU3RvcmFnZS5nZXRJdGVtKGFjcXVpcmVUb2tlbkFjY291bnRLZXkpO1xyXG4gICAgICAgICAgbGV0IGFjcXVpcmVUb2tlbkFjY291bnQ6IEFjY291bnQ7XHJcblxyXG4gICAgICAgICAgLy8gQ2hlY2sgd2l0aCB0aGUgYWNjb3VudCBpbiB0aGUgQ2FjaGVcclxuICAgICAgICAgIGlmICghVXRpbHMuaXNFbXB0eShjYWNoZWRBY2NvdW50KSkge1xyXG4gICAgICAgICAgICBhY3F1aXJlVG9rZW5BY2NvdW50ID0gSlNPTi5wYXJzZShjYWNoZWRBY2NvdW50KTtcclxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmFjY291bnQgJiYgYWNxdWlyZVRva2VuQWNjb3VudCAmJiBVdGlscy5jb21wYXJlQWNjb3VudHMocmVzcG9uc2UuYWNjb3VudCwgYWNxdWlyZVRva2VuQWNjb3VudCkpIHtcclxuICAgICAgICAgICAgICByZXNwb25zZSA9IHRoaXMuc2F2ZUFjY2Vzc1Rva2VuKHJlc3BvbnNlLCBhdXRob3JpdHksIGhhc2hQYXJhbXMsIGNsaWVudEluZm8pO1xyXG4gICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmluZm8oXCJUaGUgdXNlciBvYmplY3QgcmVjZWl2ZWQgaW4gdGhlIHJlc3BvbnNlIGlzIHRoZSBzYW1lIGFzIHRoZSBvbmUgcGFzc2VkIGluIHRoZSBhY3F1aXJlVG9rZW4gcmVxdWVzdFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICB0aGlzLmxvZ2dlci53YXJuaW5nKFxyXG4gICAgICAgICAgICAgICAgXCJUaGUgYWNjb3VudCBvYmplY3QgY3JlYXRlZCBmcm9tIHRoZSByZXNwb25zZSBpcyBub3QgdGhlIHNhbWUgYXMgdGhlIG9uZSBwYXNzZWQgaW4gdGhlIGFjcXVpcmVUb2tlbiByZXF1ZXN0XCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIGlmICghVXRpbHMuaXNFbXB0eSh0aGlzLmNhY2hlU3RvcmFnZS5nZXRJdGVtKGFjcXVpcmVUb2tlbkFjY291bnRLZXlfbm9hY2NvdW50KSkpIHtcclxuICAgICAgICAgICAgcmVzcG9uc2UgPSB0aGlzLnNhdmVBY2Nlc3NUb2tlbihyZXNwb25zZSwgYXV0aG9yaXR5LCBoYXNoUGFyYW1zLCBjbGllbnRJbmZvKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFByb2Nlc3MgaWRfdG9rZW5cclxuICAgICAgICBpZiAoaGFzaFBhcmFtcy5oYXNPd25Qcm9wZXJ0eShDb25zdGFudHMuaWRUb2tlbikpIHtcclxuICAgICAgICAgICAgdGhpcy5sb2dnZXIuaW5mbyhcIkZyYWdtZW50IGhhcyBpZCB0b2tlblwiKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGxvZ2luIG5vIGxvbmdlciBpbiBwcm9ncmVzc1xyXG4gICAgICAgICAgICB0aGlzLmxvZ2luSW5Qcm9ncmVzcyA9IGZhbHNlO1xyXG4gICAgICAgICAgICByZXNwb25zZSA9IFV0aWxzLnNldFJlc3BvbnNlSWRUb2tlbihyZXNwb25zZSwgbmV3IElkVG9rZW4oaGFzaFBhcmFtc1tDb25zdGFudHMuaWRUb2tlbl0pKTtcclxuICAgICAgICAgICAgaWYgKGhhc2hQYXJhbXMuaGFzT3duUHJvcGVydHkoQ29uc3RhbnRzLmNsaWVudEluZm8pKSB7XHJcbiAgICAgICAgICAgICAgY2xpZW50SW5mbyA9IGhhc2hQYXJhbXNbQ29uc3RhbnRzLmNsaWVudEluZm9dO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRoaXMubG9nZ2VyLndhcm5pbmcoXCJDbGllbnRJbmZvIG5vdCByZWNlaXZlZCBpbiB0aGUgcmVzcG9uc2UgZnJvbSBBQURcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGF1dGhvcml0eUtleSA9IFN0b3JhZ2UuZ2VuZXJhdGVBdXRob3JpdHlLZXkoc3RhdGVJbmZvLnN0YXRlKTtcclxuICAgICAgICAgICAgbGV0IGF1dGhvcml0eTogc3RyaW5nID0gdGhpcy5jYWNoZVN0b3JhZ2UuZ2V0SXRlbShhdXRob3JpdHlLZXksIHRoaXMuaW5Db29raWUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFVdGlscy5pc0VtcHR5KGF1dGhvcml0eSkpIHtcclxuICAgICAgICAgICAgICBhdXRob3JpdHkgPSBVdGlscy5yZXBsYWNlVGVuYW50UGF0aChhdXRob3JpdHksIHJlc3BvbnNlLmlkVG9rZW4udGVuYW50SWQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmFjY291bnQgPSBBY2NvdW50LmNyZWF0ZUFjY291bnQocmVzcG9uc2UuaWRUb2tlbiwgbmV3IENsaWVudEluZm8oY2xpZW50SW5mbykpO1xyXG4gICAgICAgICAgICByZXNwb25zZS5hY2NvdW50ID0gdGhpcy5hY2NvdW50O1xyXG5cclxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmlkVG9rZW4gJiYgcmVzcG9uc2UuaWRUb2tlbi5ub25jZSkge1xyXG4gICAgICAgICAgICAgIC8vIGNoZWNrIG5vbmNlIGludGVncml0eSBpZiBpZFRva2VuIGhhcyBub25jZSAtIHRocm93IGFuIGVycm9yIGlmIG5vdCBtYXRjaGVkXHJcbiAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmlkVG9rZW4ubm9uY2UgIT09IHRoaXMuY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLm5vbmNlSWRUb2tlbiwgdGhpcy5pbkNvb2tpZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWNjb3VudCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5sb2dpbkVycm9yLCBcIk5vbmNlIE1pc21hdGNoLiBFeHBlY3RlZCBOb25jZTogXCIgKyB0aGlzLmNhY2hlU3RvcmFnZS5nZXRJdGVtKENvbnN0YW50cy5ub25jZUlkVG9rZW4sIHRoaXMuaW5Db29raWUpICsgXCIsXCIgKyBcIkFjdHVhbCBOb25jZTogXCIgKyByZXNwb25zZS5pZFRva2VuLm5vbmNlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKFwiTm9uY2UgTWlzbWF0Y2guRXhwZWN0ZWQgTm9uY2U6IFwiICsgdGhpcy5jYWNoZVN0b3JhZ2UuZ2V0SXRlbShDb25zdGFudHMubm9uY2VJZFRva2VuLCB0aGlzLmluQ29va2llKSArIFwiLFwiICsgXCJBY3R1YWwgTm9uY2U6IFwiICsgcmVzcG9uc2UuaWRUb2tlbi5ub25jZSk7XHJcbiAgICAgICAgICAgICAgICBlcnJvciA9IENsaWVudEF1dGhFcnJvci5jcmVhdGVOb25jZU1pc21hdGNoRXJyb3IodGhpcy5jYWNoZVN0b3JhZ2UuZ2V0SXRlbShDb25zdGFudHMubm9uY2VJZFRva2VuLCB0aGlzLmluQ29va2llKSwgcmVzcG9uc2UuaWRUb2tlbi5ub25jZSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIC8vIFNhdmUgdGhlIHRva2VuXHJcbiAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5pZFRva2VuS2V5LCBoYXNoUGFyYW1zW0NvbnN0YW50cy5pZFRva2VuXSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsQ2xpZW50SW5mbywgY2xpZW50SW5mbyk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU2F2ZSBpZFRva2VuIGFzIGFjY2VzcyB0b2tlbiBmb3IgYXBwIGl0c2VsZlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zYXZlQWNjZXNzVG9rZW4ocmVzcG9uc2UsIGF1dGhvcml0eSwgaGFzaFBhcmFtcywgY2xpZW50SW5mbyk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGF1dGhvcml0eUtleSA9IHN0YXRlSW5mby5zdGF0ZTtcclxuICAgICAgICAgICAgICBhY3F1aXJlVG9rZW5BY2NvdW50S2V5ID0gc3RhdGVJbmZvLnN0YXRlO1xyXG4gICAgICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKFwiSW52YWxpZCBpZF90b2tlbiByZWNlaXZlZCBpbiB0aGUgcmVzcG9uc2VcIik7XHJcbiAgICAgICAgICAgICAgZXJyb3IgPSBDbGllbnRBdXRoRXJyb3IuY3JlYXRlSW52YWxpZElkVG9rZW5FcnJvcihyZXNwb25zZS5pZFRva2VuKTtcclxuICAgICAgICAgICAgICB0aGlzLmNhY2hlU3RvcmFnZS5zZXRJdGVtKENvbnN0YW50cy5tc2FsRXJyb3IsIGVycm9yLmVycm9yQ29kZSk7XHJcbiAgICAgICAgICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbEVycm9yRGVzY3JpcHRpb24sIGVycm9yLmVycm9yTWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgLy8gU3RhdGUgbWlzbWF0Y2ggLSB1bmV4cGVjdGVkL2ludmFsaWQgc3RhdGVcclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgYXV0aG9yaXR5S2V5ID0gc3RhdGVJbmZvLnN0YXRlO1xyXG4gICAgICAgIGFjcXVpcmVUb2tlbkFjY291bnRLZXkgPSBzdGF0ZUluZm8uc3RhdGU7XHJcblxyXG4gICAgICAgIGNvbnN0IGV4cGVjdGVkU3RhdGUgPSB0aGlzLmNhY2hlU3RvcmFnZS5nZXRJdGVtKENvbnN0YW50cy5zdGF0ZUxvZ2luLCB0aGlzLmluQ29va2llKTtcclxuICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcihcIlN0YXRlIE1pc21hdGNoLkV4cGVjdGVkIFN0YXRlOiBcIiArIGV4cGVjdGVkU3RhdGUgKyBcIixcIiArIFwiQWN0dWFsIFN0YXRlOiBcIiArIHN0YXRlSW5mby5zdGF0ZSk7XHJcblxyXG4gICAgICAgIGVycm9yID0gQ2xpZW50QXV0aEVycm9yLmNyZWF0ZUludmFsaWRTdGF0ZUVycm9yKHN0YXRlSW5mby5zdGF0ZSwgZXhwZWN0ZWRTdGF0ZSk7XHJcbiAgICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMubXNhbEVycm9yLCBlcnJvci5lcnJvckNvZGUpO1xyXG4gICAgICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oQ29uc3RhbnRzLm1zYWxFcnJvckRlc2NyaXB0aW9uLCBlcnJvci5lcnJvck1lc3NhZ2UpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShDb25zdGFudHMucmVuZXdTdGF0dXMgKyBzdGF0ZUluZm8uc3RhdGUsIENvbnN0YW50cy50b2tlblJlbmV3U3RhdHVzQ29tcGxldGVkKTtcclxuICAgIHRoaXMuY2FjaGVTdG9yYWdlLnJlbW92ZUFjcXVpcmVUb2tlbkVudHJpZXMoYXV0aG9yaXR5S2V5LCBhY3F1aXJlVG9rZW5BY2NvdW50S2V5KTtcclxuICAgIC8vIHRoaXMgaXMgcmVxdWlyZWQgaWYgbmF2aWdhdGVUb0xvZ2luUmVxdWVzdFVybD1mYWxzZVxyXG4gICAgaWYgKHRoaXMuaW5Db29raWUpIHtcclxuICAgICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbUNvb2tpZShhdXRob3JpdHlLZXksIFwiXCIsIC0xKTtcclxuICAgICAgdGhpcy5jYWNoZVN0b3JhZ2UuY2xlYXJDb29raWUoKTtcclxuICAgIH1cclxuICAgIGlmIChlcnJvcikge1xyXG4gICAgICB0aHJvdyBlcnJvcjtcclxuICAgIH1cclxuICAgIHJldHVybiByZXNwb25zZTtcclxuICB9XHJcbiAgLyogdHNsaW50OmVuYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG5cclxuICAvLyNlbmRyZWdpb25cclxuXHJcbiAgLy8jcmVnaW9uIEFjY291bnRcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgc2lnbmVkIGluIGFjY291bnQgKHJlY2VpdmVkIGZyb20gYW4gYWNjb3VudCBvYmplY3QgY3JlYXRlZCBhdCB0aGUgdGltZSBvZiBsb2dpbikgb3IgbnVsbC5cclxuICAgKi9cclxuICBnZXRBY2NvdW50KCk6IEFjY291bnQge1xyXG4gICAgLy8gaWYgYSBzZXNzaW9uIGFscmVhZHkgZXhpc3RzLCBnZXQgdGhlIGFjY291bnQgZnJvbSB0aGUgc2Vzc2lvblxyXG4gICAgaWYgKHRoaXMuYWNjb3VudCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5hY2NvdW50O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGZyYW1lIGlzIHVzZWQgdG8gZ2V0IGlkVG9rZW4gYW5kIHBvcHVsYXRlIHRoZSBhY2NvdW50IGZvciB0aGUgZ2l2ZW4gc2Vzc2lvblxyXG4gICAgY29uc3QgcmF3SWRUb2tlbiA9IHRoaXMuY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLmlkVG9rZW5LZXkpO1xyXG4gICAgY29uc3QgcmF3Q2xpZW50SW5mbyA9IHRoaXMuY2FjaGVTdG9yYWdlLmdldEl0ZW0oQ29uc3RhbnRzLm1zYWxDbGllbnRJbmZvKTtcclxuXHJcbiAgICBpZiAoIVV0aWxzLmlzRW1wdHkocmF3SWRUb2tlbikgJiYgIVV0aWxzLmlzRW1wdHkocmF3Q2xpZW50SW5mbykpIHtcclxuICAgICAgY29uc3QgaWRUb2tlbiA9IG5ldyBJZFRva2VuKHJhd0lkVG9rZW4pO1xyXG4gICAgICBjb25zdCBjbGllbnRJbmZvID0gbmV3IENsaWVudEluZm8ocmF3Q2xpZW50SW5mbyk7XHJcbiAgICAgIHRoaXMuYWNjb3VudCA9IEFjY291bnQuY3JlYXRlQWNjb3VudChpZFRva2VuLCBjbGllbnRJbmZvKTtcclxuICAgICAgcmV0dXJuIHRoaXMuYWNjb3VudDtcclxuICAgIH1cclxuICAgIC8vIGlmIGxvZ2luIG5vdCB5ZXQgZG9uZSwgcmV0dXJuIG51bGxcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRXh0cmFjdHMgc3RhdGUgdmFsdWUgZnJvbSB0aGUgYWNjb3VudFN0YXRlIHNlbnQgd2l0aCB0aGUgYXV0aGVudGljYXRpb24gcmVxdWVzdC5cclxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBzY29wZS5cclxuICAgKiBAaWdub3JlXHJcbiAgICogQGhpZGRlblxyXG4gICAqL1xyXG4gIGdldEFjY291bnRTdGF0ZSAoc3RhdGU6IHN0cmluZykge1xyXG4gICAgaWYgKHN0YXRlKSB7XHJcbiAgICAgIGNvbnN0IHNwbGl0SW5kZXggPSBzdGF0ZS5pbmRleE9mKFwifFwiKTtcclxuICAgICAgaWYgKHNwbGl0SW5kZXggPiAtMSAmJiBzcGxpdEluZGV4ICsgMSA8IHN0YXRlLmxlbmd0aCkge1xyXG4gICAgICAgIHJldHVybiBzdGF0ZS5zdWJzdHJpbmcoc3BsaXRJbmRleCArIDEpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gXCJcIjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFVzZWQgdG8gZmlsdGVyIGFsbCBjYWNoZWQgaXRlbXMgYW5kIHJldHVybiBhIGxpc3Qgb2YgdW5pcXVlIGFjY291bnRzIGJhc2VkIG9uIGhvbWVBY2NvdW50SWRlbnRpZmllci5cclxuICAgKiBAcGFyYW0ge0FycmF5PEFjY291bnQ+fSBBY2NvdW50cyAtIGFjY291bnRzIHNhdmVkIGluIHRoZSBjYWNoZS5cclxuICAgKi9cclxuICBnZXRBbGxBY2NvdW50cygpOiBBcnJheTxBY2NvdW50PiB7XHJcbiAgICBjb25zdCBhY2NvdW50czogQXJyYXk8QWNjb3VudD4gPSBbXTtcclxuICAgIGNvbnN0IGFjY2Vzc1Rva2VuQ2FjaGVJdGVtcyA9IHRoaXMuY2FjaGVTdG9yYWdlLmdldEFsbEFjY2Vzc1Rva2VucyhDb25zdGFudHMuY2xpZW50SWQsIENvbnN0YW50cy5ob21lQWNjb3VudElkZW50aWZpZXIpO1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWNjZXNzVG9rZW5DYWNoZUl0ZW1zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGlkVG9rZW4gPSBuZXcgSWRUb2tlbihhY2Nlc3NUb2tlbkNhY2hlSXRlbXNbaV0udmFsdWUuaWRUb2tlbik7XHJcbiAgICAgIGNvbnN0IGNsaWVudEluZm8gPSBuZXcgQ2xpZW50SW5mbyhhY2Nlc3NUb2tlbkNhY2hlSXRlbXNbaV0udmFsdWUuaG9tZUFjY291bnRJZGVudGlmaWVyKTtcclxuICAgICAgY29uc3QgYWNjb3VudDogQWNjb3VudCA9IEFjY291bnQuY3JlYXRlQWNjb3VudChpZFRva2VuLCBjbGllbnRJbmZvKTtcclxuICAgICAgYWNjb3VudHMucHVzaChhY2NvdW50KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcy5nZXRVbmlxdWVBY2NvdW50cyhhY2NvdW50cyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVc2VkIHRvIGZpbHRlciBhY2NvdW50cyBiYXNlZCBvbiBob21lQWNjb3VudElkZW50aWZpZXJcclxuICAgKiBAcGFyYW0ge0FycmF5PEFjY291bnQ+fSAgQWNjb3VudHMgLSBhY2NvdW50cyBzYXZlZCBpbiB0aGUgY2FjaGVcclxuICAgKiBAaWdub3JlXHJcbiAgICogQGhpZGRlblxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2V0VW5pcXVlQWNjb3VudHMoYWNjb3VudHM6IEFycmF5PEFjY291bnQ+KTogQXJyYXk8QWNjb3VudD4ge1xyXG4gICAgaWYgKCFhY2NvdW50cyB8fCBhY2NvdW50cy5sZW5ndGggPD0gMSkge1xyXG4gICAgICByZXR1cm4gYWNjb3VudHM7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZmxhZ3M6IEFycmF5PHN0cmluZz4gPSBbXTtcclxuICAgIGNvbnN0IHVuaXF1ZUFjY291bnRzOiBBcnJheTxBY2NvdW50PiA9IFtdO1xyXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGFjY291bnRzLmxlbmd0aDsgKytpbmRleCkge1xyXG4gICAgICBpZiAoYWNjb3VudHNbaW5kZXhdLmhvbWVBY2NvdW50SWRlbnRpZmllciAmJiBmbGFncy5pbmRleE9mKGFjY291bnRzW2luZGV4XS5ob21lQWNjb3VudElkZW50aWZpZXIpID09PSAtMSkge1xyXG4gICAgICAgIGZsYWdzLnB1c2goYWNjb3VudHNbaW5kZXhdLmhvbWVBY2NvdW50SWRlbnRpZmllcik7XHJcbiAgICAgICAgdW5pcXVlQWNjb3VudHMucHVzaChhY2NvdW50c1tpbmRleF0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHVuaXF1ZUFjY291bnRzO1xyXG4gIH1cclxuXHJcbiAgLy8jZW5kcmVnaW9uXHJcblxyXG4gIC8vI3JlZ2lvbiBTY29wZXMgKEV4dHJhY3QgdG8gU2NvcGVzLnRzKVxyXG5cclxuICAvLyBOb3RlOiBcInRoaXNcIiBkZXBlbmRlbmN5IGluIHRoaXMgc2VjdGlvbiBpcyBtaW5pbWFsLlxyXG4gIC8vIElmIHBDYWNoZVN0b3JhZ2UgaXMgc2VwYXJhdGVkIGZyb20gdGhlIGNsYXNzIG9iamVjdCwgb3IgcGFzc2VkIGFzIGEgZm4gcGFyYW0sIHNjb3Blc1V0aWxzLnRzIGNhbiBiZSBjcmVhdGVkXHJcblxyXG4gIC8qKlxyXG4gICAqIFVzZWQgdG8gdmFsaWRhdGUgdGhlIHNjb3BlcyBpbnB1dCBwYXJhbWV0ZXIgcmVxdWVzdGVkICBieSB0aGUgZGV2ZWxvcGVyLlxyXG4gICAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nPn0gc2NvcGVzIC0gRGV2ZWxvcGVyIHJlcXVlc3RlZCBwZXJtaXNzaW9ucy4gTm90IGFsbCBzY29wZXMgYXJlIGd1YXJhbnRlZWQgdG8gYmUgaW5jbHVkZWQgaW4gdGhlIGFjY2VzcyB0b2tlbiByZXR1cm5lZC5cclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNjb3Blc1JlcXVpcmVkIC0gQm9vbGVhbiBpbmRpY2F0aW5nIHdoZXRoZXIgdGhlIHNjb3BlcyBhcnJheSBpcyByZXF1aXJlZCBvciBub3RcclxuICAgKiBAaWdub3JlXHJcbiAgICogQGhpZGRlblxyXG4gICAqL1xyXG4gIHByaXZhdGUgdmFsaWRhdGVJbnB1dFNjb3BlKHNjb3BlczogQXJyYXk8c3RyaW5nPiwgc2NvcGVzUmVxdWlyZWQ6IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgIGlmICghc2NvcGVzKSB7XHJcbiAgICAgIGlmIChzY29wZXNSZXF1aXJlZCkge1xyXG4gICAgICAgIHRocm93IENsaWVudENvbmZpZ3VyYXRpb25FcnJvci5jcmVhdGVTY29wZXNSZXF1aXJlZEVycm9yKHNjb3Blcyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2hlY2sgdGhhdCBzY29wZXMgaXMgYW4gYXJyYXkgb2JqZWN0IChhbHNvIHRocm93cyBlcnJvciBpZiBzY29wZXMgPT0gbnVsbClcclxuICAgIGlmICghQXJyYXkuaXNBcnJheShzY29wZXMpKSB7XHJcbiAgICAgIHRocm93IENsaWVudENvbmZpZ3VyYXRpb25FcnJvci5jcmVhdGVTY29wZXNOb25BcnJheUVycm9yKHNjb3Blcyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2hlY2sgdGhhdCBzY29wZXMgaXMgbm90IGFuIGVtcHR5IGFycmF5XHJcbiAgICBpZiAoc2NvcGVzLmxlbmd0aCA8IDEpIHtcclxuICAgICAgdGhyb3cgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yLmNyZWF0ZUVtcHR5U2NvcGVzQXJyYXlFcnJvcihzY29wZXMudG9TdHJpbmcoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2hlY2sgdGhhdCBjbGllbnRJZCBpcyBwYXNzZWQgYXMgc2luZ2xlIHNjb3BlXHJcbiAgICBpZiAoc2NvcGVzLmluZGV4T2YodGhpcy5jbGllbnRJZCkgPiAtMSkge1xyXG4gICAgICBpZiAoc2NvcGVzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICB0aHJvdyBDbGllbnRDb25maWd1cmF0aW9uRXJyb3IuY3JlYXRlQ2xpZW50SWRTaW5nbGVTY29wZUVycm9yKHNjb3Blcy50b1N0cmluZygpKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgKiBFeHRyYWN0cyBzY29wZSB2YWx1ZSBmcm9tIHRoZSBzdGF0ZSBzZW50IHdpdGggdGhlIGF1dGhlbnRpY2F0aW9uIHJlcXVlc3QuXHJcbiAgKiBAcmV0dXJucyB7c3RyaW5nfSBzY29wZS5cclxuICAqIEBpZ25vcmVcclxuICAqIEBoaWRkZW5cclxuICAqL1xyXG4gIHByaXZhdGUgZ2V0U2NvcGVGcm9tU3RhdGUoc3RhdGU6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICBpZiAoc3RhdGUpIHtcclxuICAgICAgY29uc3Qgc3BsaXRJbmRleCA9IHN0YXRlLmluZGV4T2YoXCJ8XCIpO1xyXG4gICAgICBpZiAoc3BsaXRJbmRleCA+IC0xICYmIHNwbGl0SW5kZXggKyAxIDwgc3RhdGUubGVuZ3RoKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0YXRlLnN1YnN0cmluZyhzcGxpdEluZGV4ICsgMSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBcIlwiO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXBwZW5kcyBleHRyYVNjb3Blc1RvQ29uc2VudCBpZiBwYXNzZWRcclxuICAgKiBAcGFyYW0gcmVxdWVzdFxyXG4gICAqL1xyXG4gIHByaXZhdGUgYXBwZW5kU2NvcGVzKHJlcXVlc3Q6IEF1dGhlbnRpY2F0aW9uUGFyYW1ldGVycyk6IEFycmF5PHN0cmluZz4ge1xyXG5cclxuICAgIGxldCBzY29wZXM6IEFycmF5PHN0cmluZz47XHJcblxyXG4gICAgaWYgKHJlcXVlc3QgJiYgcmVxdWVzdC5zY29wZXMpIHtcclxuICAgICAgICBpZiAocmVxdWVzdC5leHRyYVNjb3Blc1RvQ29uc2VudCkge1xyXG4gICAgICAgICAgICBzY29wZXMgPSBbLi4ucmVxdWVzdC5zY29wZXMsIC4uLnJlcXVlc3QuZXh0cmFTY29wZXNUb0NvbnNlbnRdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICBzY29wZXMgPSByZXF1ZXN0LnNjb3BlcztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHNjb3BlcztcclxuICB9XHJcblxyXG4gIC8vI2VuZHJlZ2lvblxyXG5cclxuICAvLyNyZWdpb24gQW5ndWxhclxyXG5cclxuICAvKipcclxuICAqIEJyb2FkY2FzdCBtZXNzYWdlcyAtIFVzZWQgb25seSBmb3IgQW5ndWxhcj8gICpcclxuICAqIEBwYXJhbSBldmVudE5hbWVcclxuICAqIEBwYXJhbSBkYXRhXHJcbiAgKi9cclxuICBwcml2YXRlIGJyb2FkY2FzdChldmVudE5hbWU6IHN0cmluZywgZGF0YTogc3RyaW5nKSB7XHJcbiAgICBjb25zdCBldnQgPSBuZXcgQ3VzdG9tRXZlbnQoZXZlbnROYW1lLCB7IGRldGFpbDogZGF0YSB9KTtcclxuICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KGV2dCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIZWxwZXIgZnVuY3Rpb24gdG8gcmV0cmlldmUgdGhlIGNhY2hlZCB0b2tlblxyXG4gICAqXHJcbiAgICogQHBhcmFtIHNjb3Blc1xyXG4gICAqIEBwYXJhbSBhY2NvdW50XHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIGdldENhY2hlZFRva2VuSW50ZXJuYWwoc2NvcGVzIDogQXJyYXk8c3RyaW5nPiAsIGFjY291bnQ6IEFjY291bnQpOiBBdXRoUmVzcG9uc2Uge1xyXG4gICAgLy8gR2V0IHRoZSBjdXJyZW50IHNlc3Npb24ncyBhY2NvdW50IG9iamVjdFxyXG4gICAgY29uc3QgYWNjb3VudE9iamVjdDogQWNjb3VudCA9IGFjY291bnQgfHwgdGhpcy5nZXRBY2NvdW50KCk7XHJcbiAgICBpZiAoIWFjY291bnRPYmplY3QpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDb25zdHJ1Y3QgQXV0aGVudGljYXRpb25SZXF1ZXN0IGJhc2VkIG9uIHJlc3BvbnNlIHR5cGVcclxuICAgIGNvbnN0IG5ld0F1dGhvcml0eSA9IHRoaXMuYXV0aG9yaXR5SW5zdGFuY2UgPyB0aGlzLmF1dGhvcml0eUluc3RhbmNlIDogQXV0aG9yaXR5RmFjdG9yeS5DcmVhdGVJbnN0YW5jZSh0aGlzLmF1dGhvcml0eSwgdGhpcy5jb25maWcuYXV0aC52YWxpZGF0ZUF1dGhvcml0eSk7XHJcbiAgICBjb25zdCByZXNwb25zZVR5cGUgPSB0aGlzLmdldFRva2VuVHlwZShhY2NvdW50T2JqZWN0LCBzY29wZXMsIHRydWUpO1xyXG4gICAgY29uc3Qgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0ID0gbmV3IFNlcnZlclJlcXVlc3RQYXJhbWV0ZXJzKFxyXG4gICAgICBuZXdBdXRob3JpdHksXHJcbiAgICAgIHRoaXMuY2xpZW50SWQsXHJcbiAgICAgIHNjb3BlcyxcclxuICAgICAgcmVzcG9uc2VUeXBlLFxyXG4gICAgICB0aGlzLmdldFJlZGlyZWN0VXJpKCksXHJcbiAgICAgIHRoaXMuY29uZmlnLmF1dGguc3RhdGVcclxuICAgICk7XHJcblxyXG4gICAgLy8gZ2V0IGNhY2hlZCB0b2tlblxyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q2FjaGVkVG9rZW4oc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LCBhY2NvdW50KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBzY29wZXMgZm9yIHRoZSBFbmRwb2ludCAtIFVzZWQgaW4gQW5ndWxhciB0byB0cmFjayBwcm90ZWN0ZWQgYW5kIHVucHJvdGVjdGVkIHJlc291cmNlcyB3aXRob3V0IGludGVyYWN0aW9uIGZyb20gdGhlIGRldmVsb3BlciBhcHBcclxuICAgKlxyXG4gICAqIEBwYXJhbSBlbmRwb2ludFxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBnZXRTY29wZXNGb3JFbmRwb2ludChlbmRwb2ludDogc3RyaW5nKSA6IEFycmF5PHN0cmluZz4ge1xyXG4gICAgLy8gaWYgdXNlciBzcGVjaWZpZWQgbGlzdCBvZiB1bnByb3RlY3RlZFJlc291cmNlcywgbm8gbmVlZCB0byBzZW5kIHRva2VuIHRvIHRoZXNlIGVuZHBvaW50cywgcmV0dXJuIG51bGwuXHJcbiAgICBpZiAodGhpcy5jb25maWcuZnJhbWV3b3JrLnVucHJvdGVjdGVkUmVzb3VyY2VzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY29uZmlnLmZyYW1ld29yay51bnByb3RlY3RlZFJlc291cmNlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZW5kcG9pbnQuaW5kZXhPZih0aGlzLmNvbmZpZy5mcmFtZXdvcmsudW5wcm90ZWN0ZWRSZXNvdXJjZXNbaV0pID4gLTEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHByb2Nlc3MgYWxsIHByb3RlY3RlZCByZXNvdXJjZXMgYW5kIHNlbmQgdGhlIG1hdGNoZWQgb25lXHJcbiAgICBpZiAodGhpcy5jb25maWcuZnJhbWV3b3JrLnByb3RlY3RlZFJlc291cmNlTWFwLnNpemUgPiAwKSB7XHJcbiAgICAgICAgZm9yIChsZXQga2V5IG9mIEFycmF5LmZyb20odGhpcy5jb25maWcuZnJhbWV3b3JrLnByb3RlY3RlZFJlc291cmNlTWFwLmtleXMoKSkpIHtcclxuICAgICAgICAgICAgLy8gY29uZmlnRW5kcG9pbnQgaXMgbGlrZSAvYXBpL1RvZG8gcmVxdWVzdGVkIGVuZHBvaW50IGNhbiBiZSAvYXBpL1RvZG8vMVxyXG4gICAgICAgICAgICBpZiAoZW5kcG9pbnQuaW5kZXhPZihrZXkpID4gLTEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbmZpZy5mcmFtZXdvcmsucHJvdGVjdGVkUmVzb3VyY2VNYXAuZ2V0KGtleSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZGVmYXVsdCByZXNvdXJjZSB3aWxsIGJlIGNsaWVudGlkIGlmIG5vdGhpbmcgc3BlY2lmaWVkXHJcbiAgICAvLyBBcHAgd2lsbCB1c2UgaWR0b2tlbiBmb3IgY2FsbHMgdG8gaXRzZWxmXHJcbiAgICAvLyBjaGVjayBpZiBpdCdzIHN0YXJpbmcgZnJvbSBodHRwIG9yIGh0dHBzLCBuZWVkcyB0byBtYXRjaCB3aXRoIGFwcCBob3N0XHJcbiAgICBpZiAoZW5kcG9pbnQuaW5kZXhPZihcImh0dHA6Ly9cIikgPiAtMSB8fCBlbmRwb2ludC5pbmRleE9mKFwiaHR0cHM6Ly9cIikgPiAtMSkge1xyXG4gICAgICAgIGlmICh0aGlzLmdldEhvc3RGcm9tVXJpKGVuZHBvaW50KSA9PT0gdGhpcy5nZXRIb3N0RnJvbVVyaSh0aGlzLmdldFJlZGlyZWN0VXJpKCkpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQXJyYXk8c3RyaW5nPih0aGlzLmNsaWVudElkKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgLy8gaW4gYW5ndWxhciBsZXZlbCwgdGhlIHVybCBmb3IgJGh0dHAgaW50ZXJjZXB0b3IgY2FsbCBjb3VsZCBiZSByZWxhdGl2ZSB1cmwsXHJcbiAgICAvLyBpZiBpdCdzIHJlbGF0aXZlIGNhbGwsIHdlJ2xsIHRyZWF0IGl0IGFzIGFwcCBiYWNrZW5kIGNhbGwuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBBcnJheTxzdHJpbmc+KHRoaXMuY2xpZW50SWQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGlmIG5vdCB0aGUgYXBwJ3Mgb3duIGJhY2tlbmQgb3Igbm90IGEgZG9tYWluIGxpc3RlZCBpbiB0aGUgZW5kcG9pbnRzIHN0cnVjdHVyZVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiB0cmFja3MgaWYgbG9naW4gaXMgaW4gcHJvZ3Jlc3NcclxuICAgKi9cclxuICBwcm90ZWN0ZWQgZ2V0TG9naW5JblByb2dyZXNzKCk6IGJvb2xlYW4ge1xyXG4gICAgY29uc3QgcGVuZGluZ0NhbGxiYWNrID0gdGhpcy5jYWNoZVN0b3JhZ2UuZ2V0SXRlbShDb25zdGFudHMudXJsSGFzaCk7XHJcbiAgICBpZiAocGVuZGluZ0NhbGxiYWNrKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5sb2dpbkluUHJvZ3Jlc3M7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gbG9naW5JblByb2dyZXNzXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIHNldGxvZ2luSW5Qcm9ncmVzcyhsb2dpbkluUHJvZ3Jlc3MgOiBib29sZWFuKSB7XHJcbiAgICB0aGlzLmxvZ2luSW5Qcm9ncmVzcyA9IGxvZ2luSW5Qcm9ncmVzcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIHJldHVybnMgdGhlIHN0YXR1cyBvZiBhY3F1aXJlVG9rZW5JblByb2dyZXNzXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIGdldEFjcXVpcmVUb2tlbkluUHJvZ3Jlc3MoKTogYm9vbGVhbiB7XHJcbiAgICAgIHJldHVybiB0aGlzLmFjcXVpcmVUb2tlbkluUHJvZ3Jlc3M7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gYWNxdWlyZVRva2VuSW5Qcm9ncmVzc1xyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBzZXRBY3F1aXJlVG9rZW5JblByb2dyZXNzKGFjcXVpcmVUb2tlbkluUHJvZ3Jlc3MgOiBib29sZWFuKSB7XHJcbiAgICAgIHRoaXMuYWNxdWlyZVRva2VuSW5Qcm9ncmVzcyA9IGFjcXVpcmVUb2tlbkluUHJvZ3Jlc3M7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiByZXR1cm5zIHRoZSBsb2dnZXIgaGFuZGxlXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIGdldExvZ2dlcigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuY29uZmlnLnN5c3RlbS5sb2dnZXI7XHJcbiAgfVxyXG5cclxuICAvLyNlbmRyZWdpb25cclxuXHJcbiAgLy8jcmVnaW9uIEdldHRlcnMgYW5kIFNldHRlcnNcclxuXHJcbiAgLyoqXHJcbiAgICogVXNlZCB0byBnZXQgdGhlIHJlZGlyZWN0IHVyaS4gRXZhbHVhdGVzIHJlZGlyZWN0VXJpIGlmIGl0cyBhIGZ1bmN0aW9uLCBvdGhlcndpc2Ugc2ltcGx5IHJldHVybnMgaXRzIHZhbHVlLlxyXG4gICAqIEBpZ25vcmVcclxuICAgKiBAaGlkZGVuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFJlZGlyZWN0VXJpKCk6IHN0cmluZyB7XHJcbiAgICBpZiAodHlwZW9mIHRoaXMuY29uZmlnLmF1dGgucmVkaXJlY3RVcmkgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICByZXR1cm4gdGhpcy5jb25maWcuYXV0aC5yZWRpcmVjdFVyaSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmF1dGgucmVkaXJlY3RVcmk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBVc2VkIHRvIGdldCB0aGUgcG9zdCBsb2dvdXQgcmVkaXJlY3QgdXJpLiBFdmFsdWF0ZXMgcG9zdExvZ291dHJlZGlyZWN0VXJpIGlmIGl0cyBhIGZ1bmN0aW9uLCBvdGhlcndpc2Ugc2ltcGx5IHJldHVybnMgaXRzIHZhbHVlLlxyXG4gICAqIEBpZ25vcmVcclxuICAgKiBAaGlkZGVuXHJcbiAgICovXHJcbiAgcHVibGljIGdldFBvc3RMb2dvdXRSZWRpcmVjdFVyaSgpOiBzdHJpbmcge1xyXG4gICAgaWYgKHR5cGVvZiB0aGlzLmNvbmZpZy5hdXRoLnBvc3RMb2dvdXRSZWRpcmVjdFVyaSA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmNvbmZpZy5hdXRoLnBvc3RMb2dvdXRSZWRpcmVjdFVyaSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmF1dGgucG9zdExvZ291dFJlZGlyZWN0VXJpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXNlZCB0byBnZXQgdGhlIGN1cnJlbnQgY29uZmlndXJhdGlvbiBvZiBNU0FMLmpzXHJcbiAgICovXHJcbiAgcHVibGljIGdldEN1cnJlbnRDb25maWd1cmF0aW9uKCk6IENvbmZpZ3VyYXRpb24ge1xyXG4gICAgaWYgKCF0aGlzLmNvbmZpZykge1xyXG4gICAgICB0aHJvdyBDbGllbnRDb25maWd1cmF0aW9uRXJyb3IuY3JlYXRlTm9TZXRDb25maWd1cmF0aW9uRXJyb3IoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLmNvbmZpZztcclxuICB9XHJcblxyXG4gIC8vI2VuZHJlZ2lvblxyXG5cclxuICAvLyNyZWdpb24gU3RyaW5nIFV0aWwgKFNob3VsZCBiZSBleHRyYWN0ZWQgdG8gVXRpbHMudHMpXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGFuY2hvciBwYXJ0KCMpIG9mIHRoZSBVUkxcclxuICAgKiBAaWdub3JlXHJcbiAgICogQGhpZGRlblxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2V0SGFzaChoYXNoOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgaWYgKGhhc2guaW5kZXhPZihcIiMvXCIpID4gLTEpIHtcclxuICAgICAgaGFzaCA9IGhhc2guc3Vic3RyaW5nKGhhc2guaW5kZXhPZihcIiMvXCIpICsgMik7XHJcbiAgICB9IGVsc2UgaWYgKGhhc2guaW5kZXhPZihcIiNcIikgPiAtMSkge1xyXG4gICAgICBoYXNoID0gaGFzaC5zdWJzdHJpbmcoMSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGhhc2g7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBleHRyYWN0IFVSSSBmcm9tIHRoZSBob3N0XHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXJpXHJcbiAgICogQGhpZGRlblxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2V0SG9zdEZyb21VcmkodXJpOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgLy8gcmVtb3ZlIGh0dHA6Ly8gb3IgaHR0cHM6Ly8gZnJvbSB1cmlcclxuICAgIGxldCBleHRyYWN0ZWRVcmkgPSBTdHJpbmcodXJpKS5yZXBsYWNlKC9eKGh0dHBzPzopXFwvXFwvLywgXCJcIik7XHJcbiAgICBleHRyYWN0ZWRVcmkgPSBleHRyYWN0ZWRVcmkuc3BsaXQoXCIvXCIpWzBdO1xyXG4gICAgcmV0dXJuIGV4dHJhY3RlZFVyaTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFV0aWxzIGZ1bmN0aW9uIHRvIGNyZWF0ZSB0aGUgQXV0aGVudGljYXRpb25cclxuICAgKiBAcGFyYW0gdXNlck9iamVjdFxyXG4gICAqIEBwYXJhbSBzY29wZXNcclxuICAgKiBAcGFyYW0gc2lsZW50Q2FsbFxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2V0VG9rZW5UeXBlKGFjY291bnRPYmplY3Q6IEFjY291bnQsIHNjb3Blczogc3RyaW5nW10sIHNpbGVudENhbGw6IGJvb2xlYW4pOiBzdHJpbmcge1xyXG5cclxuICAgIC8vIGlmIGFjY291bnQgaXMgcGFzc2VkIGFuZCBtYXRjaGVzIHRoZSBhY2NvdW50IG9iamVjdC9vciBzZXQgdG8gZ2V0QWNjb3VudCgpIGZyb20gY2FjaGVcclxuICAgIC8vIGlmIGNsaWVudC1pZCBpcyBwYXNzZWQgYXMgc2NvcGUsIGdldCBpZF90b2tlbiBlbHNlIHRva2VuL2lkX3Rva2VuX3Rva2VuIChpbiBjYXNlIG5vIHNlc3Npb24gZXhpc3RzKVxyXG4gICAgbGV0IHRva2VuVHlwZTogc3RyaW5nO1xyXG5cclxuICAgIC8vIGFjcXVpcmVUb2tlblNpbGVudFxyXG4gICAgaWYgKHNpbGVudENhbGwpIHtcclxuICAgICAgaWYgKFV0aWxzLmNvbXBhcmVBY2NvdW50cyhhY2NvdW50T2JqZWN0LCB0aGlzLmdldEFjY291bnQoKSkpIHtcclxuICAgICAgICB0b2tlblR5cGUgPSAoc2NvcGVzLmluZGV4T2YodGhpcy5jb25maWcuYXV0aC5jbGllbnRJZCkgPiAtMSkgPyBSZXNwb25zZVR5cGVzLmlkX3Rva2VuIDogUmVzcG9uc2VUeXBlcy50b2tlbjtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB0b2tlblR5cGUgID0gKHNjb3Blcy5pbmRleE9mKHRoaXMuY29uZmlnLmF1dGguY2xpZW50SWQpID4gLTEpID8gUmVzcG9uc2VUeXBlcy5pZF90b2tlbiA6IFJlc3BvbnNlVHlwZXMuaWRfdG9rZW5fdG9rZW47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0b2tlblR5cGU7XHJcbiAgICB9XHJcbiAgICAvLyBhbGwgb3RoZXIgY2FzZXNcclxuICAgIGVsc2Uge1xyXG4gICAgICBpZiAoIVV0aWxzLmNvbXBhcmVBY2NvdW50cyhhY2NvdW50T2JqZWN0LCB0aGlzLmdldEFjY291bnQoKSkpIHtcclxuICAgICAgICAgICB0b2tlblR5cGUgPSBSZXNwb25zZVR5cGVzLmlkX3Rva2VuX3Rva2VuO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHRva2VuVHlwZSA9IChzY29wZXMuaW5kZXhPZih0aGlzLmNsaWVudElkKSA+IC0xKSA/IFJlc3BvbnNlVHlwZXMuaWRfdG9rZW4gOiBSZXNwb25zZVR5cGVzLnRva2VuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdG9rZW5UeXBlO1xyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGNhY2hla2V5cyBmb3IgYW5kIHN0b3JlcyB0aGUgYWNjb3VudCBpbmZvcm1hdGlvbiBpbiBjYWNoZVxyXG4gICAqIEBwYXJhbSBhY2NvdW50XHJcbiAgICogQHBhcmFtIHN0YXRlXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBzZXRBY2NvdW50Q2FjaGUoYWNjb3VudDogQWNjb3VudCwgc3RhdGU6IHN0cmluZykge1xyXG4gICAgLy8gQ2FjaGUgYWNxdWlyZVRva2VuQWNjb3VudEtleVxyXG4gICAgbGV0IGFjY291bnRJZCA9IGFjY291bnQgPyB0aGlzLmdldEFjY291bnRJZChhY2NvdW50KSA6IENvbnN0YW50cy5ub19hY2NvdW50O1xyXG5cclxuICAgIGNvbnN0IGFjcXVpcmVUb2tlbkFjY291bnRLZXkgPSBTdG9yYWdlLmdlbmVyYXRlQWNxdWlyZVRva2VuQWNjb3VudEtleShhY2NvdW50SWQsIHN0YXRlKTtcclxuICAgIHRoaXMuY2FjaGVTdG9yYWdlLnNldEl0ZW0oYWNxdWlyZVRva2VuQWNjb3VudEtleSwgSlNPTi5zdHJpbmdpZnkoYWNjb3VudCkpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgY2FjaGVLZXkgZm9yIGFuZCBzdG9yZXMgdGhlIGF1dGhvcml0eSBpbmZvcm1hdGlvbiBpbiBjYWNoZVxyXG4gICAqIEBwYXJhbSBzdGF0ZVxyXG4gICAqIEBwYXJhbSBhdXRob3JpdHlcclxuICAgKi9cclxuICBwcml2YXRlIHNldEF1dGhvcml0eUNhY2hlKHN0YXRlOiBzdHJpbmcsIGF1dGhvcml0eTogc3RyaW5nKSB7XHJcbiAgICAvLyBDYWNoZSBhdXRob3JpdHlLZXlcclxuICAgIGNvbnN0IGF1dGhvcml0eUtleSA9IFN0b3JhZ2UuZ2VuZXJhdGVBdXRob3JpdHlLZXkoc3RhdGUpO1xyXG4gICAgdGhpcy5jYWNoZVN0b3JhZ2Uuc2V0SXRlbShhdXRob3JpdHlLZXksIFV0aWxzLkNhbm9uaWNhbGl6ZVVyaShhdXRob3JpdHkpLCB0aGlzLmluQ29va2llKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIHVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgbG9nZ2VkIGluIGFjY291bnRcclxuICAgKiBAcGFyYW0gYWNjb3VudFxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2V0QWNjb3VudElkKGFjY291bnQ6IEFjY291bnQpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIGAke2FjY291bnQuYWNjb3VudElkZW50aWZpZXJ9YCArIENvbnN0YW50cy5yZXNvdXJjZURlbGltaXRlciArIGAke2FjY291bnQuaG9tZUFjY291bnRJZGVudGlmaWVyfWA7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25zdHJ1Y3QgJ3Rva2VuUmVxdWVzdCcgZnJvbSB0aGUgYXZhaWxhYmxlIGRhdGEgaW4gYWRhbElkVG9rZW5cclxuICAgKiBAcGFyYW0gZXh0cmFRdWVyeVBhcmFtZXRlcnNcclxuICAgKi9cclxuICBwcml2YXRlIGJ1aWxkSURUb2tlblJlcXVlc3QocmVxdWVzdDogQXV0aGVudGljYXRpb25QYXJhbWV0ZXJzKTogQXV0aGVudGljYXRpb25QYXJhbWV0ZXJzIHtcclxuXHJcbiAgICBsZXQgdG9rZW5SZXF1ZXN0OiBBdXRoZW50aWNhdGlvblBhcmFtZXRlcnMgPSB7XHJcbiAgICAgIHNjb3BlczogW3RoaXMuY2xpZW50SWRdLFxyXG4gICAgICBhdXRob3JpdHk6IHRoaXMuYXV0aG9yaXR5LFxyXG4gICAgICBhY2NvdW50OiB0aGlzLmdldEFjY291bnQoKSxcclxuICAgICAgZXh0cmFRdWVyeVBhcmFtZXRlcnM6IHJlcXVlc3QuZXh0cmFRdWVyeVBhcmFtZXRlcnNcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHRva2VuUmVxdWVzdDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFV0aWxpdHkgdG8gcG9wdWxhdGUgUXVlcnlQYXJhbWV0ZXJzIGFuZCBFeHRyYVF1ZXJ5UGFyYW1ldGVycyB0byBTZXJ2ZXJSZXF1ZXN0UGFyYW1lcmVyc1xyXG4gICAqIEBwYXJhbSByZXF1ZXN0XHJcbiAgICogQHBhcmFtIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdFxyXG4gICAqL1xyXG4gIHByaXZhdGUgcG9wdWxhdGVRdWVyeVBhcmFtcyhhY2NvdW50OiBBY2NvdW50LCByZXF1ZXN0OiBBdXRoZW50aWNhdGlvblBhcmFtZXRlcnMsIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdDogU2VydmVyUmVxdWVzdFBhcmFtZXRlcnMsIGFkYWxJZFRva2VuT2JqZWN0PzogYW55KTogU2VydmVyUmVxdWVzdFBhcmFtZXRlcnMge1xyXG5cclxuICAgIGxldCBxdWVyeVBhcmFtZXRlcnM6IFFQRGljdCA9IHt9O1xyXG5cclxuICAgIGlmIChyZXF1ZXN0KSB7XHJcbiAgICAgIC8vIGFkZCB0aGUgcHJvbXB0IHBhcmFtZXRlciB0byBzZXJ2ZXJSZXF1ZXN0UGFyYW1ldGVycyBpZiBwYXNzZWRcclxuICAgICAgaWYgKHJlcXVlc3QucHJvbXB0KSB7XHJcbiAgICAgICAgdGhpcy52YWxpZGF0ZVByb21wdFBhcmFtZXRlcihyZXF1ZXN0LnByb21wdCk7XHJcbiAgICAgICAgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LnByb21wdFZhbHVlID0gcmVxdWVzdC5wcm9tcHQ7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGlmIHRoZSBkZXZlbG9wZXIgcHJvdmlkZXMgb25lIG9mIHRoZXNlLCBnaXZlIHByZWZlcmVuY2UgdG8gZGV2ZWxvcGVyIGNob2ljZVxyXG4gICAgICBpZiAoVXRpbHMuaXNTU09QYXJhbShyZXF1ZXN0KSkge1xyXG4gICAgICAgIHF1ZXJ5UGFyYW1ldGVycyA9IFV0aWxzLmNvbnN0cnVjdFVuaWZpZWRDYWNoZVF1ZXJ5UGFyYW1ldGVyKHJlcXVlc3QsIG51bGwpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGFkYWxJZFRva2VuT2JqZWN0KSB7XHJcbiAgICAgICAgcXVlcnlQYXJhbWV0ZXJzID0gVXRpbHMuY29uc3RydWN0VW5pZmllZENhY2hlUXVlcnlQYXJhbWV0ZXIobnVsbCwgYWRhbElkVG9rZW5PYmplY3QpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGFkZHMgc2lkL2xvZ2luX2hpbnQgaWYgbm90IHBvcHVsYXRlZDsgcG9wdWxhdGVzIGRvbWFpbl9yZXEsIGxvZ2luX3JlcSBhbmQgZG9tYWluX2hpbnRcclxuICAgIHRoaXMubG9nZ2VyLnZlcmJvc2UoXCJDYWxsaW5nIGFkZEhpbnQgcGFyYW1ldGVyc1wiKTtcclxuICAgIHF1ZXJ5UGFyYW1ldGVycyA9IHRoaXMuYWRkSGludFBhcmFtZXRlcnMoYWNjb3VudCwgcXVlcnlQYXJhbWV0ZXJzLCBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QpO1xyXG5cclxuICAgIC8vIHNhbml0eSBjaGVjayBmb3IgZGV2ZWxvcGVyIHBhc3NlZCBleHRyYVF1ZXJ5UGFyYW1ldGVyc1xyXG4gICAgbGV0IGVRUGFyYW1zOiBRUERpY3Q7XHJcbiAgICBpZiAocmVxdWVzdCkge1xyXG4gICAgICAgIGVRUGFyYW1zID0gdGhpcy5yZW1vdmVTU09QYXJhbXNGcm9tRVFQYXJhbXMocmVxdWVzdC5leHRyYVF1ZXJ5UGFyYW1ldGVycyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUG9wdWxhdGUgdGhlIGV4dHJhUXVlcnlQYXJhbWV0ZXJzIHRvIGJlIHNlbnQgdG8gdGhlIHNlcnZlclxyXG4gICAgc2VydmVyQXV0aGVudGljYXRpb25SZXF1ZXN0LnF1ZXJ5UGFyYW1ldGVycyA9IFV0aWxzLmdlbmVyYXRlUXVlcnlQYXJhbWV0ZXJzU3RyaW5nKHF1ZXJ5UGFyYW1ldGVycyk7XHJcbiAgICBzZXJ2ZXJBdXRoZW50aWNhdGlvblJlcXVlc3QuZXh0cmFRdWVyeVBhcmFtZXRlcnMgPSBVdGlscy5nZW5lcmF0ZVF1ZXJ5UGFyYW1ldGVyc1N0cmluZyhlUVBhcmFtcyk7XHJcblxyXG4gICAgcmV0dXJuIHNlcnZlckF1dGhlbnRpY2F0aW9uUmVxdWVzdDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFV0aWxpdHkgdG8gdGVzdCBpZiB2YWxpZCBwcm9tcHQgdmFsdWUgaXMgcGFzc2VkIGluIHRoZSByZXF1ZXN0XHJcbiAgICogQHBhcmFtIHJlcXVlc3RcclxuICAgKi9cclxuICBwcml2YXRlIHZhbGlkYXRlUHJvbXB0UGFyYW1ldGVyIChwcm9tcHQ6IHN0cmluZykge1xyXG4gICAgaWYgKCEoW1Byb21wdFN0YXRlLkxPR0lOLCBQcm9tcHRTdGF0ZS5TRUxFQ1RfQUNDT1VOVCwgUHJvbXB0U3RhdGUuQ09OU0VOVCwgUHJvbXB0U3RhdGUuTk9ORV0uaW5kZXhPZihwcm9tcHQpID49IDApKSB7XHJcbiAgICAgICAgdGhyb3cgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yLmNyZWF0ZUludmFsaWRQcm9tcHRFcnJvcihwcm9tcHQpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlIHNpZCBhbmQgbG9naW5faGludCBpZiBwYXNzZWQgYXMgZXh0cmFRdWVyeVBhcmFtZXRlcnNcclxuICAgKiBAcGFyYW0gZVFQYXJhbXNcclxuICAgKi9cclxuICBwcml2YXRlIHJlbW92ZVNTT1BhcmFtc0Zyb21FUVBhcmFtcyhlUVBhcmFtczogUVBEaWN0KTogUVBEaWN0IHtcclxuXHJcbiAgICBpZiAoZVFQYXJhbXMpIHtcclxuICAgICAgZGVsZXRlIGVRUGFyYW1zW1NTT1R5cGVzLlNJRF07XHJcbiAgICAgIGRlbGV0ZSBlUVBhcmFtc1tTU09UeXBlcy5MT0dJTl9ISU5UXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZVFQYXJhbXM7XHJcbiAgfVxyXG5cclxuIC8vI2VuZHJlZ2lvblxyXG59XHJcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb25cbiAqICBBbGwgUmlnaHRzIFJlc2VydmVkXG4gKiAgTUlUIExpY2Vuc2VcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXNcbiAqIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmVcbiAqIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSxcbiAqIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbiAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nXG4gKiBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG4gKiBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbiAqIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SU1xuICogT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLFxuICogV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVFxuICogT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG5pbXBvcnQgeyBDbGllbnRJbmZvIH0gZnJvbSBcIi4vQ2xpZW50SW5mb1wiO1xuaW1wb3J0IHsgSWRUb2tlbiB9IGZyb20gXCIuL0lkVG9rZW5cIjtcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSBcIi4vVXRpbHNcIjtcblxuLyoqXG4gKiBhY2NvdW50SWRlbnRpZmllciAgICAgICBjb21iaW5hdGlvbiBvZiBpZFRva2VuLnVpZCBhbmQgaWRUb2tlbi51dGlkXG4gKiBob21lQWNjb3VudElkZW50aWZpZXIgICBjb21iaW5hdGlvbiBvZiBjbGllbnRJbmZvLnVpZCBhbmQgY2xpZW50SW5mby51dGlkXG4gKiB1c2VyTmFtZSAgICAgICAgICAgICAgICBpZFRva2VuLnByZWZlcnJlZF91c2VybmFtZVxuICogbmFtZSAgICAgICAgICAgICAgICAgICAgaWRUb2tlbi5uYW1lXG4gKiBpZFRva2VuICAgICAgICAgICAgICAgICBpZFRva2VuXG4gKiBzaWQgICAgICAgICAgICAgICAgICAgICBpZFRva2VuLnNpZCAtIHNlc3Npb24gaWRlbnRpZmllclxuICogZW52aXJvbm1lbnQgICAgICAgICAgICAgaWR0b2tlbi5pc3N1ZXIgKHRoZSBhdXRob3JpdHkgdGhhdCBpc3N1ZXMgdGhlIHRva2VuKVxuICovXG5leHBvcnQgY2xhc3MgQWNjb3VudCB7XG5cbiAgICBhY2NvdW50SWRlbnRpZmllcjogc3RyaW5nO1xuICAgIGhvbWVBY2NvdW50SWRlbnRpZmllcjogc3RyaW5nO1xuICAgIHVzZXJOYW1lOiBzdHJpbmc7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGlkVG9rZW46IE9iamVjdDtcbiAgICBzaWQ6IHN0cmluZztcbiAgICBlbnZpcm9ubWVudDogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBBY2NvdW50IE9iamVjdFxuICAgICAqIEBwcmFyYW0gYWNjb3VudElkZW50aWZpZXJcbiAgICAgKiBAcGFyYW0gaG9tZUFjY291bnRJZGVudGlmaWVyXG4gICAgICogQHBhcmFtIHVzZXJOYW1lXG4gICAgICogQHBhcmFtIG5hbWVcbiAgICAgKiBAcGFyYW0gaWRUb2tlblxuICAgICAqIEBwYXJhbSBzaWRcbiAgICAgKiBAcGFyYW0gZW52aXJvbm1lbnRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihhY2NvdW50SWRlbnRpZmllcjogc3RyaW5nLCBob21lQWNjb3VudElkZW50aWZpZXI6IHN0cmluZywgdXNlck5hbWU6IHN0cmluZywgbmFtZTogc3RyaW5nLCBpZFRva2VuOiBPYmplY3QsIHNpZDogc3RyaW5nLCAgZW52aXJvbm1lbnQ6IHN0cmluZykge1xuICAgICAgdGhpcy5hY2NvdW50SWRlbnRpZmllciA9IGFjY291bnRJZGVudGlmaWVyO1xuICAgICAgdGhpcy5ob21lQWNjb3VudElkZW50aWZpZXIgPSBob21lQWNjb3VudElkZW50aWZpZXI7XG4gICAgICB0aGlzLnVzZXJOYW1lID0gdXNlck5hbWU7XG4gICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgdGhpcy5pZFRva2VuID0gaWRUb2tlbjtcbiAgICAgIHRoaXMuc2lkID0gc2lkO1xuICAgICAgdGhpcy5lbnZpcm9ubWVudCA9IGVudmlyb25tZW50O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBoaWRkZW5cbiAgICAgKiBAcGFyYW0gaWRUb2tlblxuICAgICAqIEBwYXJhbSBjbGllbnRJbmZvXG4gICAgICovXG4gICAgc3RhdGljIGNyZWF0ZUFjY291bnQoaWRUb2tlbjogSWRUb2tlbiwgY2xpZW50SW5mbzogQ2xpZW50SW5mbyk6IEFjY291bnQge1xuXG4gICAgICAgIC8vIGNyZWF0ZSBhY2NvdW50SWRlbnRpZmllclxuICAgICAgICBjb25zdCBhY2NvdW50SWRlbnRpZmllcjogc3RyaW5nID0gaWRUb2tlbi5vYmplY3RJZCB8fCAgaWRUb2tlbi5zdWJqZWN0O1xuXG4gICAgICAgIC8vIGNyZWF0ZSBob21lQWNjb3VudElkZW50aWZpZXJcbiAgICAgICAgY29uc3QgdWlkOiBzdHJpbmcgPSBjbGllbnRJbmZvID8gY2xpZW50SW5mby51aWQgOiBcIlwiO1xuICAgICAgICBjb25zdCB1dGlkOiBzdHJpbmcgPSBjbGllbnRJbmZvID8gY2xpZW50SW5mby51dGlkIDogXCJcIjtcblxuICAgICAgICBjb25zdCBob21lQWNjb3VudElkZW50aWZpZXIgPSBVdGlscy5iYXNlNjRFbmNvZGVTdHJpbmdVcmxTYWZlKHVpZCkgKyBcIi5cIiArIFV0aWxzLmJhc2U2NEVuY29kZVN0cmluZ1VybFNhZmUodXRpZCk7XG4gICAgICAgIHJldHVybiBuZXcgQWNjb3VudChhY2NvdW50SWRlbnRpZmllciwgaG9tZUFjY291bnRJZGVudGlmaWVyLCBpZFRva2VuLnByZWZlcnJlZE5hbWUsIGlkVG9rZW4ubmFtZSwgaWRUb2tlbi5kZWNvZGVkSWRUb2tlbiwgaWRUb2tlbi5zaWQsIGlkVG9rZW4uaXNzdWVyKTtcbiAgICB9XG59XG4iLCIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cblxuaW1wb3J0IHsgQXV0aG9yaXR5LCBBdXRob3JpdHlUeXBlIH0gZnJvbSBcIi4vQXV0aG9yaXR5XCI7XG5pbXBvcnQgeyBYaHJDbGllbnQgfSBmcm9tIFwiLi9YSFJDbGllbnRcIjtcblxuLyoqXG4gKiBAaGlkZGVuXG4gKi9cbmV4cG9ydCBjbGFzcyBBYWRBdXRob3JpdHkgZXh0ZW5kcyBBdXRob3JpdHkge1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBBYWRJbnN0YW5jZURpc2NvdmVyeUVuZHBvaW50OiBzdHJpbmcgPSBcImh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbS9jb21tb24vZGlzY292ZXJ5L2luc3RhbmNlXCI7XG5cbiAgcHJpdmF0ZSBnZXQgQWFkSW5zdGFuY2VEaXNjb3ZlcnlFbmRwb2ludFVybCgpOiBzdHJpbmcge1xuICAgICAgcmV0dXJuIGAke0FhZEF1dGhvcml0eS5BYWRJbnN0YW5jZURpc2NvdmVyeUVuZHBvaW50fT9hcGktdmVyc2lvbj0xLjAmYXV0aG9yaXphdGlvbl9lbmRwb2ludD0ke3RoaXMuQ2Fub25pY2FsQXV0aG9yaXR5fW9hdXRoMi92Mi4wL2F1dGhvcml6ZWA7XG4gIH1cblxuICBwdWJsaWMgY29uc3RydWN0b3IoYXV0aG9yaXR5OiBzdHJpbmcsIHZhbGlkYXRlQXV0aG9yaXR5OiBib29sZWFuKSB7XG4gICAgc3VwZXIoYXV0aG9yaXR5LCB2YWxpZGF0ZUF1dGhvcml0eSk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IEF1dGhvcml0eVR5cGUoKTogQXV0aG9yaXR5VHlwZSB7XG4gICAgcmV0dXJuIEF1dGhvcml0eVR5cGUuQWFkO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgVHJ1c3RlZEhvc3RMaXN0OiBhbnkgPSB7XG4gICAgXCJsb2dpbi53aW5kb3dzLm5ldFwiOiBcImxvZ2luLndpbmRvd3MubmV0XCIsXG4gICAgXCJsb2dpbi5jaGluYWNsb3VkYXBpLmNuXCI6IFwibG9naW4uY2hpbmFjbG91ZGFwaS5jblwiLFxuICAgIFwibG9naW4uY2xvdWRnb3ZhcGkudXNcIjogXCJsb2dpbi5jbG91ZGdvdmFwaS51c1wiLFxuICAgIFwibG9naW4ubWljcm9zb2Z0b25saW5lLmNvbVwiOiBcImxvZ2luLm1pY3Jvc29mdG9ubGluZS5jb21cIixcbiAgICBcImxvZ2luLm1pY3Jvc29mdG9ubGluZS5kZVwiOiBcImxvZ2luLm1pY3Jvc29mdG9ubGluZS5kZVwiLFxuICAgIFwibG9naW4ubWljcm9zb2Z0b25saW5lLnVzXCI6IFwibG9naW4ubWljcm9zb2Z0b25saW5lLnVzXCJcbiAgfTtcblxuICAvKipcbiAgICogUmV0dXJucyBhIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgdG8gdGhlIE9JREMgZW5kcG9pbnRcbiAgICogT25seSByZXNwb25kcyB3aXRoIHRoZSBlbmRwb2ludFxuICAgKi9cbiAgcHVibGljIEdldE9wZW5JZENvbmZpZ3VyYXRpb25FbmRwb2ludEFzeW5jKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICBjb25zdCByZXN1bHRQcm9taXNlOiBQcm9taXNlPHN0cmluZz4gPSBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgICByZXNvbHZlKHRoaXMuRGVmYXVsdE9wZW5JZENvbmZpZ3VyYXRpb25FbmRwb2ludCkpO1xuXG4gICAgaWYgKCF0aGlzLklzVmFsaWRhdGlvbkVuYWJsZWQpIHtcbiAgICAgIHJldHVybiByZXN1bHRQcm9taXNlO1xuICAgIH1cblxuICAgIGxldCBob3N0OiBzdHJpbmcgPSB0aGlzLkNhbm9uaWNhbEF1dGhvcml0eVVybENvbXBvbmVudHMuSG9zdE5hbWVBbmRQb3J0O1xuICAgIGlmICh0aGlzLklzSW5UcnVzdGVkSG9zdExpc3QoaG9zdCkpIHtcbiAgICAgIHJldHVybiByZXN1bHRQcm9taXNlO1xuICAgIH1cblxuICAgIGxldCBjbGllbnQ6IFhockNsaWVudCA9IG5ldyBYaHJDbGllbnQoKTtcblxuICAgIHJldHVybiBjbGllbnQuc2VuZFJlcXVlc3RBc3luYyh0aGlzLkFhZEluc3RhbmNlRGlzY292ZXJ5RW5kcG9pbnRVcmwsIFwiR0VUXCIsIHRydWUpXG4gICAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLnRlbmFudF9kaXNjb3ZlcnlfZW5kcG9pbnQ7XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgdG8gc2VlIGlmIHRoZSBob3N0IGlzIGluIGEgbGlzdCBvZiB0cnVzdGVkIGhvc3RzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBUaGUgaG9zdCB0byBsb29rIHVwXG4gICAqL1xuICBwdWJsaWMgSXNJblRydXN0ZWRIb3N0TGlzdChob3N0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gQWFkQXV0aG9yaXR5LlRydXN0ZWRIb3N0TGlzdFtob3N0LnRvTG93ZXJDYXNlKCldO1xuICB9XG59XG4iLCIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cblxuLyoqXG4gKiBYSFIgY2xpZW50IGZvciBKU09OIGVuZHBvaW50c1xuICogaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2UvYXN5bmMtcHJvbWlzZVxuICogQGhpZGRlblxuICovXG5leHBvcnQgY2xhc3MgWGhyQ2xpZW50IHtcbiAgcHVibGljIHNlbmRSZXF1ZXN0QXN5bmModXJsOiBzdHJpbmcsIG1ldGhvZDogc3RyaW5nLCBlbmFibGVDYWNoaW5nPzogYm9vbGVhbik6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgeGhyLm9wZW4obWV0aG9kLCB1cmwsIC8qYXN5bmM6ICovIHRydWUpO1xuICAgICAgaWYgKGVuYWJsZUNhY2hpbmcpIHtcbiAgICAgICAgLy8gVE9ETzogKHNoaXZiKSBlbnN1cmUgdGhhdCB0aGlzIGNhbiBiZSBjYWNoZWRcbiAgICAgICAgLy8geGhyLnNldFJlcXVlc3RIZWFkZXIoXCJDYWNoZS1Db250cm9sXCIsIFwiUHVibGljXCIpO1xuICAgICAgfVxuXG4gICAgICB4aHIub25sb2FkID0gKGV2KSA9PiB7XG4gICAgICAgICAgaWYgKHhoci5zdGF0dXMgPCAyMDAgfHwgeGhyLnN0YXR1cyA+PSAzMDApIHtcbiAgICAgICAgICAgICAgcmVqZWN0KHRoaXMuaGFuZGxlRXJyb3IoeGhyLnJlc3BvbnNlVGV4dCkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHZhciBqc29uUmVzcG9uc2UgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgcmVqZWN0KHRoaXMuaGFuZGxlRXJyb3IoeGhyLnJlc3BvbnNlVGV4dCkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlc29sdmUoanNvblJlc3BvbnNlKTtcbiAgICAgIH07XG5cbiAgICAgIHhoci5vbmVycm9yID0gKGV2KSA9PiB7XG4gICAgICAgIHJlamVjdCh4aHIuc3RhdHVzKTtcbiAgICAgIH07XG5cbiAgICAgIGlmIChtZXRob2QgPT09IFwiR0VUXCIpIHtcbiAgICAgICAgeGhyLnNlbmQoKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB0aHJvdyBcIm5vdCBpbXBsZW1lbnRlZFwiO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHJvdGVjdGVkIGhhbmRsZUVycm9yKHJlc3BvbnNlVGV4dDogc3RyaW5nKTogYW55IHtcbiAgICB2YXIganNvblJlc3BvbnNlO1xuICAgIHRyeSB7XG4gICAgICBqc29uUmVzcG9uc2UgPSBKU09OLnBhcnNlKHJlc3BvbnNlVGV4dCk7XG4gICAgICBpZiAoanNvblJlc3BvbnNlLmVycm9yKSB7XG4gICAgICAgICAgcmV0dXJuIGpzb25SZXNwb25zZS5lcnJvcjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgcmVzcG9uc2VUZXh0O1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiByZXNwb25zZVRleHQ7XG4gICAgfVxuICB9XG59XG4iLCIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cblxuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcIi4vTG9nZ2VyXCI7XG5pbXBvcnQgeyBVdGlscyB9IGZyb20gXCIuL1V0aWxzXCI7XG5cbi8vIG1ha2UgQ2FjaGVTdG9yYWdlIGEgZml4ZWQgdHlwZSB0byBsaW1pdCBpdCB0byBzcGVjaWZpYyBpbnB1dHNcbmV4cG9ydCB0eXBlIENhY2hlTG9jYXRpb24gPSBcImxvY2FsU3RvcmFnZVwiIHwgXCJzZXNzaW9uU3RvcmFnZVwiO1xuXG4vKipcbiAqIERlZmF1bHRzIGZvciB0aGUgQ29uZmlndXJhdGlvbiBPcHRpb25zXG4gKi9cbmNvbnN0IEZSQU1FX1RJTUVPVVQgPSA2MDAwO1xuY29uc3QgT0ZGU0VUID0gMzAwO1xuXG4vKipcbiAqICBBdXRoZW50aWNhdGlvbiBPcHRpb25zXG4gKlxuICogIGNsaWVudElkICAgICAgICAgICAgICAgICAgICAtIENsaWVudCBJRCBhc3NpZ25lZCB0byB5b3VyIGFwcCBieSBBenVyZSBBY3RpdmUgRGlyZWN0b3J5XG4gKiAgYXV0aG9yaXR5ICAgICAgICAgICAgICAgICAgIC0gRGV2ZWxvcGVyIGNhbiBjaG9vc2UgdG8gc2VuZCBhbiBhdXRob3JpdHksIGRlZmF1bHRzIHRvIFwiIFwiXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoVE9ETzogRm9sbG93IHVwIHdpdGggdGhlIGF1dGhvcml0eSBkaXNjdXNzaW9uIHdpdGggdGhlIFBNcyAtIFVudGlsIHRoZW4gdGhpcyBjb21tZW50IGlzIGEgcGxhY2Vob2xkZXIpXG4gKiAgdmFsaWRhdGVBdXRob3JpdHkgICAgICAgICAgIC0gVXNlZCB0byB0dXJuIGF1dGhvcml0eSB2YWxpZGF0aW9uIG9uL29mZi4gV2hlbiBzZXQgdG8gdHJ1ZSAoZGVmYXVsdCksIE1TQUwgd2lsbCBjb21wYXJlIHRoZSBhcHBsaWNhdGlvbidzIGF1dGhvcml0eVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWdhaW5zdCB3ZWxsLWtub3duIFVSTHMgdGVtcGxhdGVzIHJlcHJlc2VudGluZyB3ZWxsLWZvcm1lZCBhdXRob3JpdGllcy5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEl0IGlzIHVzZWZ1bCB3aGVuIHRoZSBhdXRob3JpdHkgaXMgb2J0YWluZWQgYXQgcnVuIHRpbWUgdG8gcHJldmVudCBNU0FMIGZyb20gZGlzcGxheWluZyBhdXRoZW50aWNhdGlvbiBwcm9tcHRzIGZyb20gbWFsaWNpb3VzIHBhZ2VzLlxuICogIHJlZGlyZWN0VXJpICAgICAgICAgICAgICAgICAtIFRoZSByZWRpcmVjdCBVUkkgb2YgdGhlIGFwcGxpY2F0aW9uLCB0aGlzIHNob3VsZCBiZSBzYW1lIGFzIHRoZSB2YWx1ZSBpbiB0aGUgYXBwbGljYXRpb24gcmVnaXN0cmF0aW9uIHBvcnRhbC5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERlZmF1bHRzIHRvIGB3aW5kb3cubG9jYXRpb24uaHJlZmAuXG4gKiAgcG9zdExvZ291dFJlZGlyZWN0VXJpICAgICAgIC0gVXNlZCB0byByZWRpcmVjdCB0aGUgdXNlciB0byB0aGlzIGxvY2F0aW9uIGFmdGVyIGxvZ291dC4gRGVmYXVsdHMgdG8gYHdpbmRvdy5sb2NhdGlvbi5ocmVmYC5cbiAqICBzdGF0ZSAgICAgICAgICAgICAgICAgICAgICAgLSBVc2UgdG8gc2VuZCB0aGUgc3RhdGUgcGFyYW1ldGVyIHdpdGggYXV0aGVudGljYXRpb24gcmVxdWVzdFxuICogIG5hdmlnYXRlVG9Mb2dpblJlcXVlc3RVcmwgICAtIFVzZWQgdG8gdHVybiBvZmYgZGVmYXVsdCBuYXZpZ2F0aW9uIHRvIHN0YXJ0IHBhZ2UgYWZ0ZXIgbG9naW4uIERlZmF1bHQgaXMgdHJ1ZS4gVGhpcyBpcyB1c2VkIG9ubHkgZm9yIHJlZGlyZWN0IGZsb3dzLlxuICpcbiAqL1xuZXhwb3J0IHR5cGUgQXV0aE9wdGlvbnMgPSB7XG4gIGNsaWVudElkOiBzdHJpbmc7XG4gIGF1dGhvcml0eT86IHN0cmluZztcbiAgdmFsaWRhdGVBdXRob3JpdHk/OiBib29sZWFuO1xuICByZWRpcmVjdFVyaT86IHN0cmluZyB8ICgoKSA9PiBzdHJpbmcpO1xuICBwb3N0TG9nb3V0UmVkaXJlY3RVcmk/OiBzdHJpbmcgfCAoKCkgPT4gc3RyaW5nKTtcbiAgc3RhdGU/OiBzdHJpbmc7XG4gIG5hdmlnYXRlVG9Mb2dpblJlcXVlc3RVcmw/OiBib29sZWFuO1xufTtcblxuLyoqXG4gKiBDYWNoZSBPcHRpb25zXG4gKlxuICogY2FjaGVMb2NhdGlvbiAgICAgICAgICAgIC0gVXNlZCB0byBzcGVjaWZ5IHRoZSBjYWNoZUxvY2F0aW9uIHVzZXIgd2FudHMgdG8gc2V0OiBWYWxpZCB2YWx1ZXMgYXJlIFwibG9jYWxTdG9yYWdlXCIgYW5kIFwic2Vzc2lvblN0b3JhZ2VcIlxuICogc3RvcmVBdXRoU3RhdGVJbkNvb2tpZSAgIC0gSWYgc2V0LCB0aGUgbGlicmFyeSB3aWxsIHN0b3JlIHRoZSBhdXRoIHJlcXVlc3Qgc3RhdGUgcmVxdWlyZWQgZm9yIHZhbGlkYXRpb24gb2YgdGhlIGF1dGggZmxvd3MgaW4gdGhlIGJyb3dzZXIgY29va2llcy5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQnkgZGVmYXVsdCB0aGlzIGZsYWcgaXMgc2V0IHRvIGZhbHNlLlxuICovXG5leHBvcnQgdHlwZSBDYWNoZU9wdGlvbnMgPSB7XG4gIGNhY2hlTG9jYXRpb24/OiBDYWNoZUxvY2F0aW9uO1xuICBzdG9yZUF1dGhTdGF0ZUluQ29va2llPzogYm9vbGVhbjtcbn07XG5cbi8qKlxuICogTGlicmFyeSBTcGVjaWZpYyBPcHRpb25zXG4gKlxuICogbG9nZ2VyICAgICAgICAgICAgICAgICAgICAgICAtIFVzZWQgdG8gaW5pdGlhbGl6ZSB0aGUgTG9nZ2VyIG9iamVjdDsgVE9ETzogRXhwYW5kIG9uIGxvZ2dlciBkZXRhaWxzIG9yIGxpbmsgdG8gdGhlIGRvY3VtZW50YXRpb24gb24gbG9nZ2VyXG4gKiBsb2FkRnJhbWVUaW1lb3V0ICAgICAgICAgICAgIC0gbWF4aW11bSB0aW1lIHRoZSBsaWJyYXJ5IHNob3VsZCB3YWl0IGZvciBhIGZyYW1lIHRvIGxvYWRcbiAqIHRva2VuUmVuZXdhbE9mZnNldFNlY29uZHMgICAgLSBzZXRzIHRoZSB3aW5kb3cgb2Ygb2Zmc2V0IG5lZWRlZCB0byByZW5ldyB0aGUgdG9rZW4gYmVmb3JlIGV4cGlyeVxuICpcbiAqL1xuZXhwb3J0IHR5cGUgU3lzdGVtT3B0aW9ucyA9IHtcbiAgbG9nZ2VyPzogTG9nZ2VyO1xuICBsb2FkRnJhbWVUaW1lb3V0PzogbnVtYmVyO1xuICB0b2tlblJlbmV3YWxPZmZzZXRTZWNvbmRzPzogbnVtYmVyO1xufTtcblxuLyoqXG4gKiBBcHAvRnJhbWV3b3JrIHNwZWNpZmljIGVudmlyb25tZW50IFN1cHBvcnRcbiAqXG4gKiBpc0FuZ3VsYXIgICAgICAgICAgICAgICAgLSBmbGFnIHNldCB0byBkZXRlcm1pbmUgaWYgaXQgaXMgQW5ndWxhciBGcmFtZXdvcmsuIFVzZWQgdG8gYnJvYWRjYXN0IHRva2Vucy4gVE9ETzogZGV0YW5nbGUgdGhpcyBkZXBlbmRlbmN5IGZyb20gY29yZS5cbiAqIHVucHJvdGVjdGVkUmVzb3VyY2VzICAgICAtIEFycmF5IG9mIFVSSSdzIHdoaWNoIGFyZSB1bnByb3RlY3RlZCByZXNvdXJjZXMuIE1TQUwgd2lsbCBub3QgYXR0YWNoIGEgdG9rZW4gdG8gb3V0Z29pbmcgcmVxdWVzdHMgdGhhdCBoYXZlIHRoZXNlIFVSSS4gRGVmYXVsdHMgdG8gJ251bGwnLlxuICogcHJvdGVjdGVkUmVzb3VyY2VNYXAgICAgIC0gVGhpcyBpcyBtYXBwaW5nIG9mIHJlc291cmNlcyB0byBzY29wZXMgdXNlZCBieSBNU0FMIGZvciBhdXRvbWF0aWNhbGx5IGF0dGFjaGluZyBhY2Nlc3MgdG9rZW5zIGluIHdlYiBBUEkgY2FsbHMuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEEgc2luZ2xlIGFjY2VzcyB0b2tlbiBpcyBvYnRhaW5lZCBmb3IgdGhlIHJlc291cmNlLiBTbyB5b3UgY2FuIG1hcCBhIHNwZWNpZmljIHJlc291cmNlIHBhdGggYXMgZm9sbG93czpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1wiaHR0cHM6Ly9ncmFwaC5taWNyb3NvZnQuY29tL3YxLjAvbWVcIiwgW1widXNlci5yZWFkXCJdfSxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3IgdGhlIGFwcCBVUkwgb2YgdGhlIHJlc291cmNlIGFzOiB7XCJodHRwczovL2dyYXBoLm1pY3Jvc29mdC5jb20vXCIsIFtcInVzZXIucmVhZFwiLCBcIm1haWwuc2VuZFwiXX0uXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRoaXMgaXMgcmVxdWlyZWQgZm9yIENPUlMgY2FsbHMuXG4gKlxuICovXG5leHBvcnQgdHlwZSBGcmFtZXdvcmtPcHRpb25zID0ge1xuICBpc0FuZ3VsYXI/OiBib29sZWFuO1xuICB1bnByb3RlY3RlZFJlc291cmNlcz86IEFycmF5PHN0cmluZz47XG4gIHByb3RlY3RlZFJlc291cmNlTWFwPzogTWFwPHN0cmluZywgQXJyYXk8c3RyaW5nPj47XG59O1xuXG4vKipcbiAqIENvbmZpZ3VyYXRpb24gT2JqZWN0XG4gKi9cbmV4cG9ydCB0eXBlIENvbmZpZ3VyYXRpb24gPSB7XG4gIGF1dGg6IEF1dGhPcHRpb25zLFxuICBjYWNoZT86IENhY2hlT3B0aW9ucyxcbiAgc3lzdGVtPzogU3lzdGVtT3B0aW9ucyxcbiAgZnJhbWV3b3JrPzogRnJhbWV3b3JrT3B0aW9uc1xufTtcblxuY29uc3QgREVGQVVMVF9BVVRIX09QVElPTlM6IEF1dGhPcHRpb25zID0ge1xuICBjbGllbnRJZDogXCJcIixcbiAgYXV0aG9yaXR5OiBudWxsLFxuICB2YWxpZGF0ZUF1dGhvcml0eTogdHJ1ZSxcbiAgcmVkaXJlY3RVcmk6ICgpID0+IFV0aWxzLmdldERlZmF1bHRSZWRpcmVjdFVyaSgpLFxuICBwb3N0TG9nb3V0UmVkaXJlY3RVcmk6ICgpID0+IFV0aWxzLmdldERlZmF1bHRSZWRpcmVjdFVyaSgpLFxuICBzdGF0ZTogXCJcIixcbiAgbmF2aWdhdGVUb0xvZ2luUmVxdWVzdFVybDogdHJ1ZVxufTtcblxuY29uc3QgREVGQVVMVF9DQUNIRV9PUFRJT05TOiBDYWNoZU9wdGlvbnMgPSB7XG4gIGNhY2hlTG9jYXRpb246IFwic2Vzc2lvblN0b3JhZ2VcIixcbiAgc3RvcmVBdXRoU3RhdGVJbkNvb2tpZTogZmFsc2Vcbn07XG5cbmNvbnN0IERFRkFVTFRfU1lTVEVNX09QVElPTlM6IFN5c3RlbU9wdGlvbnMgPSB7XG4gIGxvZ2dlcjogbmV3IExvZ2dlcihudWxsKSxcbiAgbG9hZEZyYW1lVGltZW91dDogRlJBTUVfVElNRU9VVCxcbiAgdG9rZW5SZW5ld2FsT2Zmc2V0U2Vjb25kczogT0ZGU0VUXG59O1xuXG5jb25zdCBERUZBVUxUX0ZSQU1FV09SS19PUFRJT05TOiBGcmFtZXdvcmtPcHRpb25zID0ge1xuICBpc0FuZ3VsYXI6IGZhbHNlLFxuICB1bnByb3RlY3RlZFJlc291cmNlczogbmV3IEFycmF5PHN0cmluZz4oKSxcbiAgcHJvdGVjdGVkUmVzb3VyY2VNYXA6IG5ldyBNYXA8c3RyaW5nLCBBcnJheTxzdHJpbmc+PigpXG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIHNldCB0aGUgZGVmYXVsdCBvcHRpb25zIHdoZW4gbm90IGV4cGxpY2l0bHkgc2V0XG4gKlxuICogQHBhcmFtIFRBdXRoT3B0aW9uc1xuICogQHBhcmFtIFRDYWNoZU9wdGlvbnNcbiAqIEBwYXJhbSBUU3lzdGVtT3B0aW9uc1xuICogQHBhcmFtIFRGcmFtZXdvcmtPcHRpb25zXG4gKlxuICogQHJldHVybnMgVENvbmZpZ3VyYXRpb24gb2JqZWN0XG4gKi9cblxuLy8gZGVzdHJ1Y3R1cmUgd2l0aCBkZWZhdWx0IHNldHRpbmdzXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRDb25maWd1cmF0aW9uKHsgYXV0aCwgY2FjaGUgPSB7fSwgc3lzdGVtID0ge30sIGZyYW1ld29yayA9IHt9fTogQ29uZmlndXJhdGlvbik6IENvbmZpZ3VyYXRpb24ge1xuICBjb25zdCBvdmVybGF5ZWRDb25maWc6IENvbmZpZ3VyYXRpb24gPSB7XG4gICAgYXV0aDogeyAuLi5ERUZBVUxUX0FVVEhfT1BUSU9OUywgLi4uYXV0aCB9LFxuICAgIGNhY2hlOiB7IC4uLkRFRkFVTFRfQ0FDSEVfT1BUSU9OUywgLi4uY2FjaGUgfSxcbiAgICBzeXN0ZW06IHsgLi4uREVGQVVMVF9TWVNURU1fT1BUSU9OUywgLi4uc3lzdGVtIH0sXG4gICAgZnJhbWV3b3JrOiB7IC4uLkRFRkFVTFRfRlJBTUVXT1JLX09QVElPTlMsIC4uLmZyYW1ld29yayB9XG4gIH07XG4gIHJldHVybiBvdmVybGF5ZWRDb25maWc7XG59XG5cbiIsIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuXG5pbXBvcnQgeyBTZXJ2ZXJFcnJvciB9IGZyb20gXCIuL1NlcnZlckVycm9yXCI7XG5cbmV4cG9ydCBjb25zdCBJbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yTWVzc2FnZSA9IHtcbiAgICBsb2dpblJlcXVpcmVkOiB7XG4gICAgICAgIGNvZGU6IFwibG9naW5fcmVxdWlyZWRcIlxuICAgIH0sXG4gICAgaW50ZXJhY3Rpb25SZXF1aXJlZDoge1xuICAgICAgICBjb2RlOiBcImludGVyYWN0aW9uX3JlcXVpcmVkXCJcbiAgICB9LFxuICAgIGNvbnNlbnRSZXF1aXJlZDoge1xuICAgICAgICBjb2RlOiBcImNvbnNlbnRfcmVxdWlyZWRcIlxuICAgIH0sXG59O1xuXG4vKipcbiAqIEVycm9yIHRocm93biB3aGVuIHRoZSB1c2VyIGlzIHJlcXVpcmVkIHRvIHBlcmZvcm0gYW4gaW50ZXJhY3RpdmUgdG9rZW4gcmVxdWVzdC5cbiAqL1xuZXhwb3J0IGNsYXNzIEludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3IgZXh0ZW5kcyBTZXJ2ZXJFcnJvciB7XG5cbiAgICBjb25zdHJ1Y3RvcihlcnJvckNvZGU6IHN0cmluZywgZXJyb3JNZXNzYWdlPzogc3RyaW5nKSB7XG4gICAgICAgIHN1cGVyKGVycm9yQ29kZSwgZXJyb3JNZXNzYWdlKTtcbiAgICAgICAgdGhpcy5uYW1lID0gXCJJbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yXCI7XG5cbiAgICAgICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKHRoaXMsIEludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3IucHJvdG90eXBlKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlTG9naW5SZXF1aXJlZEF1dGhFcnJvcihlcnJvckRlc2M6IHN0cmluZyk6IEludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3Ige1xuICAgICAgICByZXR1cm4gbmV3IEludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3IoSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvck1lc3NhZ2UubG9naW5SZXF1aXJlZC5jb2RlLCBlcnJvckRlc2MpO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVJbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yKGVycm9yRGVzYzogc3RyaW5nKTogSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvciB7XG4gICAgICAgIHJldHVybiBuZXcgSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvcihJbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yTWVzc2FnZS5pbnRlcmFjdGlvblJlcXVpcmVkLmNvZGUsIGVycm9yRGVzYyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZUNvbnNlbnRSZXF1aXJlZEF1dGhFcnJvcihlcnJvckRlc2M6IHN0cmluZyk6IEludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3Ige1xuICAgICAgICByZXR1cm4gbmV3IEludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3IoSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvck1lc3NhZ2UuY29uc2VudFJlcXVpcmVkLmNvZGUsIGVycm9yRGVzYyk7XG4gICAgfVxufVxuIiwiZXhwb3J0IHsgVXNlckFnZW50QXBwbGljYXRpb24gfSBmcm9tIFwiLi9Vc2VyQWdlbnRBcHBsaWNhdGlvblwiO1xuZXhwb3J0IHsgTG9nZ2VyIH0gZnJvbSBcIi4vTG9nZ2VyXCI7XG5leHBvcnQgeyBMb2dMZXZlbCB9IGZyb20gXCIuL0xvZ2dlclwiO1xuZXhwb3J0IHsgQWNjb3VudCB9IGZyb20gXCIuL0FjY291bnRcIjtcbmV4cG9ydCB7IENvbnN0YW50cyB9IGZyb20gXCIuL0NvbnN0YW50c1wiO1xuZXhwb3J0IHsgQXV0aG9yaXR5IH0gZnJvbSBcIi4vQXV0aG9yaXR5XCI7XG5leHBvcnQgeyBDYWNoZVJlc3VsdCB9IGZyb20gXCIuL1VzZXJBZ2VudEFwcGxpY2F0aW9uXCI7XG5leHBvcnQgeyBDYWNoZUxvY2F0aW9uLCBDb25maWd1cmF0aW9uIH0gZnJvbSBcIi4vQ29uZmlndXJhdGlvblwiO1xuZXhwb3J0IHsgQXV0aGVudGljYXRpb25QYXJhbWV0ZXJzIH0gZnJvbSBcIi4vQXV0aGVudGljYXRpb25QYXJhbWV0ZXJzXCI7XG5leHBvcnQgeyBBdXRoUmVzcG9uc2UgfSBmcm9tIFwiLi9BdXRoUmVzcG9uc2VcIjtcblxuLy8gRXJyb3JzXG5leHBvcnQgeyBBdXRoRXJyb3IgfSBmcm9tIFwiLi9lcnJvci9BdXRoRXJyb3JcIjtcbmV4cG9ydCB7IENsaWVudEF1dGhFcnJvciB9IGZyb20gXCIuL2Vycm9yL0NsaWVudEF1dGhFcnJvclwiO1xuZXhwb3J0IHsgU2VydmVyRXJyb3IgfSBmcm9tIFwiLi9lcnJvci9TZXJ2ZXJFcnJvclwiO1xuZXhwb3J0IHsgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yIH0gZnJvbSBcIi4vZXJyb3IvQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yXCI7XG5leHBvcnQgeyBJbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yIH0gZnJvbSBcIi4vZXJyb3IvSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvclwiO1xuIiwiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG5cbmltcG9ydCB7IFV0aWxzIH0gZnJvbSBcIi4vVXRpbHNcIjtcblxuLyoqXG4gKiBAaGlkZGVuXG4gKi9cbmV4cG9ydCBjbGFzcyBBY2Nlc3NUb2tlbktleSB7XG5cbiAgYXV0aG9yaXR5OiBzdHJpbmc7XG4gIGNsaWVudElkOiBzdHJpbmc7XG4gIHNjb3Blczogc3RyaW5nO1xuICBob21lQWNjb3VudElkZW50aWZpZXI6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihhdXRob3JpdHk6IHN0cmluZywgY2xpZW50SWQ6IHN0cmluZywgc2NvcGVzOiBzdHJpbmcsIHVpZDogc3RyaW5nLCB1dGlkOiBzdHJpbmcpIHtcbiAgICB0aGlzLmF1dGhvcml0eSA9IFV0aWxzLkNhbm9uaWNhbGl6ZVVyaShhdXRob3JpdHkpO1xuICAgIHRoaXMuY2xpZW50SWQgPSBjbGllbnRJZDtcbiAgICB0aGlzLnNjb3BlcyA9IHNjb3BlcztcbiAgICB0aGlzLmhvbWVBY2NvdW50SWRlbnRpZmllciA9IFV0aWxzLmJhc2U2NEVuY29kZVN0cmluZ1VybFNhZmUodWlkKSArIFwiLlwiICsgVXRpbHMuYmFzZTY0RW5jb2RlU3RyaW5nVXJsU2FmZSh1dGlkKTtcbiAgfVxufVxuIiwiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG5cbi8qKlxuICogQGhpZGRlblxuICovXG5leHBvcnQgY2xhc3MgQWNjZXNzVG9rZW5WYWx1ZSB7XG5cbiAgYWNjZXNzVG9rZW46IHN0cmluZztcbiAgaWRUb2tlbjogc3RyaW5nO1xuICBleHBpcmVzSW46IHN0cmluZztcbiAgaG9tZUFjY291bnRJZGVudGlmaWVyOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoYWNjZXNzVG9rZW46IHN0cmluZywgaWRUb2tlbjogc3RyaW5nLCBleHBpcmVzSW46IHN0cmluZywgaG9tZUFjY291bnRJZGVudGlmaWVyOiBzdHJpbmcpIHtcbiAgICB0aGlzLmFjY2Vzc1Rva2VuID0gYWNjZXNzVG9rZW47XG4gICAgdGhpcy5pZFRva2VuID0gaWRUb2tlbjtcbiAgICB0aGlzLmV4cGlyZXNJbiA9IGV4cGlyZXNJbjtcbiAgICB0aGlzLmhvbWVBY2NvdW50SWRlbnRpZmllciA9IGhvbWVBY2NvdW50SWRlbnRpZmllcjtcbiAgfVxufVxuIiwiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG5cbmltcG9ydCB7IEF1dGhvcml0eSB9IGZyb20gXCIuL0F1dGhvcml0eVwiO1xuaW1wb3J0IHsgVXRpbHMgfSBmcm9tIFwiLi9VdGlsc1wiO1xuXG4vKipcbiAqIE5vbmNlOiBPSURDIE5vbmNlIGRlZmluaXRpb246IGh0dHBzOi8vb3BlbmlkLm5ldC9zcGVjcy9vcGVuaWQtY29ubmVjdC1jb3JlLTFfMC5odG1sI0lEVG9rZW5cbiAqIFN0YXRlOiBPQXV0aCBTcGVjOiBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNjc0OSNzZWN0aW9uLTEwLjEyXG4gKiBAaGlkZGVuXG4gKi9cbmV4cG9ydCBjbGFzcyBTZXJ2ZXJSZXF1ZXN0UGFyYW1ldGVycyB7XG5cbiAgYXV0aG9yaXR5SW5zdGFuY2U6IEF1dGhvcml0eTtcbiAgY2xpZW50SWQ6IHN0cmluZztcbiAgc2NvcGVzOiBBcnJheTxzdHJpbmc+O1xuXG4gIG5vbmNlOiBzdHJpbmc7XG4gIHN0YXRlOiBzdHJpbmc7XG5cbiAgLy8gdGVsZW1ldHJ5IGluZm9ybWF0aW9uXG4gIHhDbGllbnRWZXI6IHN0cmluZztcbiAgeENsaWVudFNrdTogc3RyaW5nO1xuICBjb3JyZWxhdGlvbklkOiBzdHJpbmc7XG5cbiAgcmVzcG9uc2VUeXBlOiBzdHJpbmc7XG4gIHJlZGlyZWN0VXJpOiBzdHJpbmc7XG5cbiAgLy8gVE9ETzogVGhlIGJlbG93IGFyZSBub3QgdXNlZCAtIGNoZWNrIGFuZCBkZWxldGUgd2l0aCB0aGUgcmVuYW1lIFBSXG4gIHByb21wdFZhbHVlOiBzdHJpbmc7XG4gIHNpZDogc3RyaW5nO1xuICBsb2dpbkhpbnQ6IHN0cmluZztcbiAgZG9tYWluSGludDogc3RyaW5nO1xuICBsb2dpblJlcTogc3RyaW5nO1xuICBkb21haW5SZXE6IHN0cmluZztcblxuICBxdWVyeVBhcmFtZXRlcnM6IHN0cmluZztcbiAgZXh0cmFRdWVyeVBhcmFtZXRlcnM6IHN0cmluZztcblxuICBwdWJsaWMgZ2V0IGF1dGhvcml0eSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmF1dGhvcml0eUluc3RhbmNlID8gdGhpcy5hdXRob3JpdHlJbnN0YW5jZS5DYW5vbmljYWxBdXRob3JpdHkgOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSBhdXRob3JpdHlcbiAgICogQHBhcmFtIGNsaWVudElkXG4gICAqIEBwYXJhbSBzY29wZVxuICAgKiBAcGFyYW0gcmVzcG9uc2VUeXBlXG4gICAqIEBwYXJhbSByZWRpcmVjdFVyaVxuICAgKiBAcGFyYW0gc3RhdGVcbiAgICovXG4gIGNvbnN0cnVjdG9yIChhdXRob3JpdHk6IEF1dGhvcml0eSwgY2xpZW50SWQ6IHN0cmluZywgc2NvcGU6IEFycmF5PHN0cmluZz4sIHJlc3BvbnNlVHlwZTogc3RyaW5nLCByZWRpcmVjdFVyaTogc3RyaW5nLCBzdGF0ZTogc3RyaW5nICkge1xuICAgIHRoaXMuYXV0aG9yaXR5SW5zdGFuY2UgPSBhdXRob3JpdHk7XG4gICAgdGhpcy5jbGllbnRJZCA9IGNsaWVudElkO1xuICAgIHRoaXMuc2NvcGVzID0gc2NvcGU7XG5cbiAgICB0aGlzLm5vbmNlID0gVXRpbHMuY3JlYXRlTmV3R3VpZCgpO1xuICAgIHRoaXMuc3RhdGUgPSBzdGF0ZSAmJiAhVXRpbHMuaXNFbXB0eShzdGF0ZSkgPyAgVXRpbHMuY3JlYXRlTmV3R3VpZCgpICsgXCJ8XCIgKyBzdGF0ZSAgIDogVXRpbHMuY3JlYXRlTmV3R3VpZCgpO1xuXG4gICAgLy8gVE9ETzogQ2hhbmdlIHRoaXMgdG8gdXNlciBwYXNzZWQgdnMgZ2VuZXJhdGVkIHdpdGggdGhlIG5ldyBQUlxuICAgIHRoaXMuY29ycmVsYXRpb25JZCA9IFV0aWxzLmNyZWF0ZU5ld0d1aWQoKTtcblxuICAgIC8vIHRlbGVtZXRyeSBpbmZvcm1hdGlvblxuICAgIHRoaXMueENsaWVudFNrdSA9IFwiTVNBTC5KU1wiO1xuICAgIHRoaXMueENsaWVudFZlciA9IFV0aWxzLmdldExpYnJhcnlWZXJzaW9uKCk7XG5cbiAgICB0aGlzLnJlc3BvbnNlVHlwZSA9IHJlc3BvbnNlVHlwZTtcbiAgICB0aGlzLnJlZGlyZWN0VXJpID0gcmVkaXJlY3RVcmk7XG5cbiAgfVxuXG4gIC8qKlxuICAgKiBnZW5lcmF0ZXMgdGhlIFVSTCB3aXRoIFF1ZXJ5U3RyaW5nIFBhcmFtZXRlcnNcbiAgICogQHBhcmFtIHNjb3Blc1xuICAgKi9cbiAgY3JlYXRlTmF2aWdhdGVVcmwoc2NvcGVzOiBBcnJheTxzdHJpbmc+KTogc3RyaW5nIHtcbiAgICBjb25zdCBzdHIgPSB0aGlzLmNyZWF0ZU5hdmlnYXRpb25VcmxTdHJpbmcoc2NvcGVzKTtcbiAgICBsZXQgYXV0aEVuZHBvaW50OiBzdHJpbmcgPSB0aGlzLmF1dGhvcml0eUluc3RhbmNlLkF1dGhvcml6YXRpb25FbmRwb2ludDtcbiAgICAvLyBpZiB0aGUgZW5kcG9pbnQgYWxyZWFkeSBoYXMgcXVlcnlwYXJhbXMsIGxldHMgYWRkIHRvIGl0LCBvdGhlcndpc2UgYWRkIHRoZSBmaXJzdCBvbmVcbiAgICBpZiAoYXV0aEVuZHBvaW50LmluZGV4T2YoXCI/XCIpIDwgMCkge1xuICAgICAgYXV0aEVuZHBvaW50ICs9IFwiP1wiO1xuICAgIH0gZWxzZSB7XG4gICAgICBhdXRoRW5kcG9pbnQgKz0gXCImXCI7XG4gICAgfVxuXG4gICAgY29uc3QgcmVxdWVzdFVybDogc3RyaW5nID0gYCR7YXV0aEVuZHBvaW50fSR7c3RyLmpvaW4oXCImXCIpfWA7XG4gICAgcmV0dXJuIHJlcXVlc3RVcmw7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGUgdGhlIGFycmF5IG9mIGFsbCBRdWVyeVN0cmluZ1BhcmFtcyB0byBiZSBzZW50IHRvIHRoZSBzZXJ2ZXJcbiAgICogQHBhcmFtIHNjb3Blc1xuICAgKi9cbiAgY3JlYXRlTmF2aWdhdGlvblVybFN0cmluZyhzY29wZXM6IEFycmF5PHN0cmluZz4pOiBBcnJheTxzdHJpbmc+IHtcbiAgICBpZiAoIXNjb3Blcykge1xuICAgICAgc2NvcGVzID0gW3RoaXMuY2xpZW50SWRdO1xuICAgIH1cblxuICAgIGlmIChzY29wZXMuaW5kZXhPZih0aGlzLmNsaWVudElkKSA9PT0gLTEpIHtcbiAgICAgIHNjb3Blcy5wdXNoKHRoaXMuY2xpZW50SWQpO1xuICAgIH1cbiAgICBjb25zdCBzdHI6IEFycmF5PHN0cmluZz4gPSBbXTtcbiAgICBzdHIucHVzaChcInJlc3BvbnNlX3R5cGU9XCIgKyB0aGlzLnJlc3BvbnNlVHlwZSk7XG5cbiAgICB0aGlzLnRyYW5zbGF0ZWNsaWVudElkVXNlZEluU2NvcGUoc2NvcGVzKTtcbiAgICBzdHIucHVzaChcInNjb3BlPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMucGFyc2VTY29wZShzY29wZXMpKSk7XG4gICAgc3RyLnB1c2goXCJjbGllbnRfaWQ9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodGhpcy5jbGllbnRJZCkpO1xuICAgIHN0ci5wdXNoKFwicmVkaXJlY3RfdXJpPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMucmVkaXJlY3RVcmkpKTtcblxuICAgIHN0ci5wdXNoKFwic3RhdGU9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodGhpcy5zdGF0ZSkpO1xuICAgIHN0ci5wdXNoKFwibm9uY2U9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodGhpcy5ub25jZSkpO1xuXG4gICAgc3RyLnB1c2goXCJjbGllbnRfaW5mbz0xXCIpO1xuICAgIHN0ci5wdXNoKGB4LWNsaWVudC1TS1U9JHt0aGlzLnhDbGllbnRTa3V9YCk7XG4gICAgc3RyLnB1c2goYHgtY2xpZW50LVZlcj0ke3RoaXMueENsaWVudFZlcn1gKTtcbiAgICBpZiAodGhpcy5wcm9tcHRWYWx1ZSkge1xuICAgICAgc3RyLnB1c2goXCJwcm9tcHQ9XCIgKyBlbmNvZGVVUkkodGhpcy5wcm9tcHRWYWx1ZSkpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnF1ZXJ5UGFyYW1ldGVycykge1xuICAgICAgc3RyLnB1c2godGhpcy5xdWVyeVBhcmFtZXRlcnMpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmV4dHJhUXVlcnlQYXJhbWV0ZXJzKSB7XG4gICAgICBzdHIucHVzaCh0aGlzLmV4dHJhUXVlcnlQYXJhbWV0ZXJzKTtcbiAgICB9XG5cbiAgICBzdHIucHVzaChcImNsaWVudC1yZXF1ZXN0LWlkPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMuY29ycmVsYXRpb25JZCkpO1xuICAgIHJldHVybiBzdHI7XG4gIH1cblxuICAvKipcbiAgICogYXBwZW5kIHRoZSByZXF1aXJlZCBzY29wZXM6IGh0dHBzOi8vb3BlbmlkLm5ldC9zcGVjcy9vcGVuaWQtY29ubmVjdC1iYXNpYy0xXzAuaHRtbCNTY29wZXNcbiAgICogQHBhcmFtIHNjb3Blc1xuICAgKi9cbiAgdHJhbnNsYXRlY2xpZW50SWRVc2VkSW5TY29wZShzY29wZXM6IEFycmF5PHN0cmluZz4pOiB2b2lkIHtcbiAgICBjb25zdCBjbGllbnRJZEluZGV4OiBudW1iZXIgPSBzY29wZXMuaW5kZXhPZih0aGlzLmNsaWVudElkKTtcbiAgICBpZiAoY2xpZW50SWRJbmRleCA+PSAwKSB7XG4gICAgICBzY29wZXMuc3BsaWNlKGNsaWVudElkSW5kZXgsIDEpO1xuICAgICAgaWYgKHNjb3Blcy5pbmRleE9mKFwib3BlbmlkXCIpID09PSAtMSkge1xuICAgICAgICBzY29wZXMucHVzaChcIm9wZW5pZFwiKTtcbiAgICAgIH1cbiAgICAgIGlmIChzY29wZXMuaW5kZXhPZihcInByb2ZpbGVcIikgPT09IC0xKSB7XG4gICAgICAgIHNjb3Blcy5wdXNoKFwicHJvZmlsZVwiKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUGFyc2UgdGhlIHNjb3BlcyBpbnRvIGEgZm9ybWF0dGVkIHNjb3BlTGlzdFxuICAgKiBAcGFyYW0gc2NvcGVzXG4gICAqL1xuICBwYXJzZVNjb3BlKHNjb3BlczogQXJyYXk8c3RyaW5nPik6IHN0cmluZyB7XG4gICAgbGV0IHNjb3BlTGlzdDogc3RyaW5nID0gXCJcIjtcbiAgICBpZiAoc2NvcGVzKSB7XG4gICAgICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBzY29wZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgc2NvcGVMaXN0ICs9IChpICE9PSBzY29wZXMubGVuZ3RoIC0gMSkgPyBzY29wZXNbaV0gKyBcIiBcIiA6IHNjb3Blc1tpXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2NvcGVMaXN0O1xuICB9XG59XG4iLCIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cblxuaW1wb3J0IHsgVXRpbHMgfSBmcm9tIFwiLi9VdGlsc1wiO1xuaW1wb3J0IHsgQ2xpZW50QXV0aEVycm9yIH0gZnJvbSBcIi4vZXJyb3IvQ2xpZW50QXV0aEVycm9yXCI7XG5cbi8qKlxuICogQGhpZGRlblxuICovXG5leHBvcnQgY2xhc3MgQ2xpZW50SW5mbyB7XG5cbiAgcHJpdmF0ZSBfdWlkOiBzdHJpbmc7XG4gIGdldCB1aWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fdWlkID8gdGhpcy5fdWlkIDogXCJcIjtcbiAgfVxuXG4gIHNldCB1aWQodWlkOiBzdHJpbmcpIHtcbiAgICB0aGlzLl91aWQgPSB1aWQ7XG4gIH1cblxuICBwcml2YXRlIF91dGlkOiBzdHJpbmc7XG4gIGdldCB1dGlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX3V0aWQgPyB0aGlzLl91dGlkIDogXCJcIjtcbiAgfVxuXG4gIHNldCB1dGlkKHV0aWQ6IHN0cmluZykge1xuICAgIHRoaXMuX3V0aWQgPSB1dGlkO1xuICB9XG5cbiAgY29uc3RydWN0b3IocmF3Q2xpZW50SW5mbzogc3RyaW5nKSB7XG4gICAgaWYgKCFyYXdDbGllbnRJbmZvIHx8IFV0aWxzLmlzRW1wdHkocmF3Q2xpZW50SW5mbykpIHtcbiAgICAgIHRoaXMudWlkID0gXCJcIjtcbiAgICAgIHRoaXMudXRpZCA9IFwiXCI7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRlY29kZWRDbGllbnRJbmZvOiBzdHJpbmcgPSBVdGlscy5iYXNlNjREZWNvZGVTdHJpbmdVcmxTYWZlKHJhd0NsaWVudEluZm8pO1xuICAgICAgY29uc3QgY2xpZW50SW5mbzogQ2xpZW50SW5mbyA9IDxDbGllbnRJbmZvPkpTT04ucGFyc2UoZGVjb2RlZENsaWVudEluZm8pO1xuICAgICAgaWYgKGNsaWVudEluZm8pIHtcbiAgICAgICAgaWYgKGNsaWVudEluZm8uaGFzT3duUHJvcGVydHkoXCJ1aWRcIikpIHtcbiAgICAgICAgICB0aGlzLnVpZCA9IGNsaWVudEluZm8udWlkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNsaWVudEluZm8uaGFzT3duUHJvcGVydHkoXCJ1dGlkXCIpKSB7XG4gICAgICAgICAgdGhpcy51dGlkID0gY2xpZW50SW5mby51dGlkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgQ2xpZW50QXV0aEVycm9yLmNyZWF0ZUNsaWVudEluZm9EZWNvZGluZ0Vycm9yKGUpO1xuICAgIH1cbiAgfVxufVxuIiwiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG5cbmltcG9ydCB7IFV0aWxzIH0gZnJvbSBcIi4vVXRpbHNcIjtcbmltcG9ydCB7IENsaWVudEF1dGhFcnJvciB9IGZyb20gXCIuL2Vycm9yL0NsaWVudEF1dGhFcnJvclwiO1xuXG4vKipcbiAqIEBoaWRkZW5cbiAqL1xuZXhwb3J0IGNsYXNzIElkVG9rZW4ge1xuXG4gIGlzc3Vlcjogc3RyaW5nO1xuICBvYmplY3RJZDogc3RyaW5nO1xuICBzdWJqZWN0OiBzdHJpbmc7XG4gIHRlbmFudElkOiBzdHJpbmc7XG4gIHZlcnNpb246IHN0cmluZztcbiAgcHJlZmVycmVkTmFtZTogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIGhvbWVPYmplY3RJZDogc3RyaW5nO1xuICBub25jZTogc3RyaW5nO1xuICBleHBpcmF0aW9uOiBzdHJpbmc7XG4gIHJhd0lkVG9rZW46IHN0cmluZztcbiAgZGVjb2RlZElkVG9rZW46IE9iamVjdDtcbiAgc2lkOiBzdHJpbmc7XG4gIC8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXG4gIGNvbnN0cnVjdG9yKHJhd0lkVG9rZW46IHN0cmluZykge1xuICAgIGlmIChVdGlscy5pc0VtcHR5KHJhd0lkVG9rZW4pKSB7XG4gICAgICB0aHJvdyBDbGllbnRBdXRoRXJyb3IuY3JlYXRlSWRUb2tlbk51bGxPckVtcHR5RXJyb3IocmF3SWRUb2tlbik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICB0aGlzLnJhd0lkVG9rZW4gPSByYXdJZFRva2VuO1xuICAgICAgdGhpcy5kZWNvZGVkSWRUb2tlbiA9IFV0aWxzLmV4dHJhY3RJZFRva2VuKHJhd0lkVG9rZW4pO1xuICAgICAgaWYgKHRoaXMuZGVjb2RlZElkVG9rZW4pIHtcbiAgICAgICAgaWYgKHRoaXMuZGVjb2RlZElkVG9rZW4uaGFzT3duUHJvcGVydHkoXCJpc3NcIikpIHtcbiAgICAgICAgICB0aGlzLmlzc3VlciA9IHRoaXMuZGVjb2RlZElkVG9rZW5bXCJpc3NcIl07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5kZWNvZGVkSWRUb2tlbi5oYXNPd25Qcm9wZXJ0eShcIm9pZFwiKSkge1xuICAgICAgICAgICAgdGhpcy5vYmplY3RJZCA9IHRoaXMuZGVjb2RlZElkVG9rZW5bXCJvaWRcIl07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5kZWNvZGVkSWRUb2tlbi5oYXNPd25Qcm9wZXJ0eShcInN1YlwiKSkge1xuICAgICAgICAgIHRoaXMuc3ViamVjdCA9IHRoaXMuZGVjb2RlZElkVG9rZW5bXCJzdWJcIl07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5kZWNvZGVkSWRUb2tlbi5oYXNPd25Qcm9wZXJ0eShcInRpZFwiKSkge1xuICAgICAgICAgIHRoaXMudGVuYW50SWQgPSB0aGlzLmRlY29kZWRJZFRva2VuW1widGlkXCJdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZGVjb2RlZElkVG9rZW4uaGFzT3duUHJvcGVydHkoXCJ2ZXJcIikpIHtcbiAgICAgICAgICB0aGlzLnZlcnNpb24gPSB0aGlzLmRlY29kZWRJZFRva2VuW1widmVyXCJdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZGVjb2RlZElkVG9rZW4uaGFzT3duUHJvcGVydHkoXCJwcmVmZXJyZWRfdXNlcm5hbWVcIikpIHtcbiAgICAgICAgICB0aGlzLnByZWZlcnJlZE5hbWUgPSB0aGlzLmRlY29kZWRJZFRva2VuW1wicHJlZmVycmVkX3VzZXJuYW1lXCJdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZGVjb2RlZElkVG9rZW4uaGFzT3duUHJvcGVydHkoXCJuYW1lXCIpKSB7XG4gICAgICAgICAgdGhpcy5uYW1lID0gdGhpcy5kZWNvZGVkSWRUb2tlbltcIm5hbWVcIl07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5kZWNvZGVkSWRUb2tlbi5oYXNPd25Qcm9wZXJ0eShcIm5vbmNlXCIpKSB7XG4gICAgICAgICAgdGhpcy5ub25jZSA9IHRoaXMuZGVjb2RlZElkVG9rZW5bXCJub25jZVwiXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRlY29kZWRJZFRva2VuLmhhc093blByb3BlcnR5KFwiZXhwXCIpKSB7XG4gICAgICAgICAgdGhpcy5leHBpcmF0aW9uID0gdGhpcy5kZWNvZGVkSWRUb2tlbltcImV4cFwiXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRlY29kZWRJZFRva2VuLmhhc093blByb3BlcnR5KFwiaG9tZV9vaWRcIikpIHtcbiAgICAgICAgICAgIHRoaXMuaG9tZU9iamVjdElkID0gdGhpcy5kZWNvZGVkSWRUb2tlbltcImhvbWVfb2lkXCJdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZGVjb2RlZElkVG9rZW4uaGFzT3duUHJvcGVydHkoXCJzaWRcIikpIHtcbiAgICAgICAgICAgIHRoaXMuc2lkID0gdGhpcy5kZWNvZGVkSWRUb2tlbltcInNpZFwiXTtcbiAgICAgICAgfVxuICAgICAgLyogdHNsaW50OmVuYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIFRPRE86IFRoaXMgZXJyb3IgaGVyZSB3b24ndCByZWFsbHkgZXZlcnkgYmUgdGhyb3duLCBzaW5jZSBleHRyYWN0SWRUb2tlbigpIHJldHVybnMgbnVsbCBpZiB0aGUgZGVjb2RlSnd0KCkgZmFpbHMuXG4gICAgICAvLyBOZWVkIHRvIGFkZCBiZXR0ZXIgZXJyb3IgaGFuZGxpbmcgaGVyZSB0byBhY2NvdW50IGZvciBiZWluZyB1bmFibGUgdG8gZGVjb2RlIGp3dHMuXG4gICAgICB0aHJvdyBDbGllbnRBdXRoRXJyb3IuY3JlYXRlSWRUb2tlblBhcnNpbmdFcnJvcihlKTtcbiAgICB9XG4gIH1cblxufVxuIiwiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG5cbmltcG9ydCB7IENvbnN0YW50cyB9IGZyb20gXCIuL0NvbnN0YW50c1wiO1xuaW1wb3J0IHsgQWNjZXNzVG9rZW5DYWNoZUl0ZW0gfSBmcm9tIFwiLi9BY2Nlc3NUb2tlbkNhY2hlSXRlbVwiO1xuaW1wb3J0IHsgQ2FjaGVMb2NhdGlvbiB9IGZyb20gXCIuL0NvbmZpZ3VyYXRpb25cIjtcbmltcG9ydCB7IENhY2hlS2V5cyB9IGZyb20gXCIuL0NvbnN0YW50c1wiO1xuaW1wb3J0IHsgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yIH0gZnJvbSBcIi4vZXJyb3IvQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yXCI7XG5cbi8qKlxuICogQGhpZGRlblxuICovXG5leHBvcnQgY2xhc3MgU3RvcmFnZSB7Ly8gU2luZ2xldG9uXG5cbiAgcHJpdmF0ZSBzdGF0aWMgaW5zdGFuY2U6IFN0b3JhZ2U7XG4gIHByaXZhdGUgbG9jYWxTdG9yYWdlU3VwcG9ydGVkOiBib29sZWFuO1xuICBwcml2YXRlIHNlc3Npb25TdG9yYWdlU3VwcG9ydGVkOiBib29sZWFuO1xuICBwcml2YXRlIGNhY2hlTG9jYXRpb246IENhY2hlTG9jYXRpb247XG5cbiAgY29uc3RydWN0b3IoY2FjaGVMb2NhdGlvbjogQ2FjaGVMb2NhdGlvbikge1xuICAgIGlmIChTdG9yYWdlLmluc3RhbmNlKSB7XG4gICAgICByZXR1cm4gU3RvcmFnZS5pbnN0YW5jZTtcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlTG9jYXRpb24gPSBjYWNoZUxvY2F0aW9uO1xuICAgIHRoaXMubG9jYWxTdG9yYWdlU3VwcG9ydGVkID0gdHlwZW9mIHdpbmRvd1t0aGlzLmNhY2hlTG9jYXRpb25dICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvd1t0aGlzLmNhY2hlTG9jYXRpb25dICE9IG51bGw7XG4gICAgdGhpcy5zZXNzaW9uU3RvcmFnZVN1cHBvcnRlZCA9IHR5cGVvZiB3aW5kb3dbY2FjaGVMb2NhdGlvbl0gIT09IFwidW5kZWZpbmVkXCIgJiYgd2luZG93W2NhY2hlTG9jYXRpb25dICE9IG51bGw7XG4gICAgU3RvcmFnZS5pbnN0YW5jZSA9IHRoaXM7XG4gICAgaWYgKCF0aGlzLmxvY2FsU3RvcmFnZVN1cHBvcnRlZCAmJiAhdGhpcy5zZXNzaW9uU3RvcmFnZVN1cHBvcnRlZCkge1xuICAgICAgdGhyb3cgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yLmNyZWF0ZU5vU3RvcmFnZVN1cHBvcnRlZEVycm9yKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFN0b3JhZ2UuaW5zdGFuY2U7XG4gIH1cblxuICAgIC8vIGFkZCB2YWx1ZSB0byBzdG9yYWdlXG4gICAgc2V0SXRlbShrZXk6IHN0cmluZywgdmFsdWU6IHN0cmluZywgZW5hYmxlQ29va2llU3RvcmFnZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAgICAgaWYgKHdpbmRvd1t0aGlzLmNhY2hlTG9jYXRpb25dKSB7XG4gICAgICAgICAgICB3aW5kb3dbdGhpcy5jYWNoZUxvY2F0aW9uXS5zZXRJdGVtKGtleSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlbmFibGVDb29raWVTdG9yYWdlKSB7XG4gICAgICAgICAgICB0aGlzLnNldEl0ZW1Db29raWUoa2V5LCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBnZXQgb25lIGl0ZW0gYnkga2V5IGZyb20gc3RvcmFnZVxuICAgIGdldEl0ZW0oa2V5OiBzdHJpbmcsIGVuYWJsZUNvb2tpZVN0b3JhZ2U/OiBib29sZWFuKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKGVuYWJsZUNvb2tpZVN0b3JhZ2UgJiYgdGhpcy5nZXRJdGVtQ29va2llKGtleSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEl0ZW1Db29raWUoa2V5KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAod2luZG93W3RoaXMuY2FjaGVMb2NhdGlvbl0pIHtcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3dbdGhpcy5jYWNoZUxvY2F0aW9uXS5nZXRJdGVtKGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gcmVtb3ZlIHZhbHVlIGZyb20gc3RvcmFnZVxuICAgIHJlbW92ZUl0ZW0oa2V5OiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgaWYgKHdpbmRvd1t0aGlzLmNhY2hlTG9jYXRpb25dKSB7XG4gICAgICAgICAgICByZXR1cm4gd2luZG93W3RoaXMuY2FjaGVMb2NhdGlvbl0ucmVtb3ZlSXRlbShrZXkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gY2xlYXIgc3RvcmFnZSAocmVtb3ZlIGFsbCBpdGVtcyBmcm9tIGl0KVxuICAgIGNsZWFyKCk6IHZvaWQge1xuICAgICAgICBpZiAod2luZG93W3RoaXMuY2FjaGVMb2NhdGlvbl0pIHtcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3dbdGhpcy5jYWNoZUxvY2F0aW9uXS5jbGVhcigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0QWxsQWNjZXNzVG9rZW5zKGNsaWVudElkOiBzdHJpbmcsIGhvbWVBY2NvdW50SWRlbnRpZmllcjogc3RyaW5nKTogQXJyYXk8QWNjZXNzVG9rZW5DYWNoZUl0ZW0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0czogQXJyYXk8QWNjZXNzVG9rZW5DYWNoZUl0ZW0+ID0gW107XG4gICAgICAgIGxldCBhY2Nlc3NUb2tlbkNhY2hlSXRlbTogQWNjZXNzVG9rZW5DYWNoZUl0ZW07XG4gICAgICAgIGNvbnN0IHN0b3JhZ2UgPSB3aW5kb3dbdGhpcy5jYWNoZUxvY2F0aW9uXTtcbiAgICAgICAgaWYgKHN0b3JhZ2UpIHtcbiAgICAgICAgICAgIGxldCBrZXk6IHN0cmluZztcbiAgICAgICAgICAgIGZvciAoa2V5IGluIHN0b3JhZ2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RvcmFnZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkubWF0Y2goY2xpZW50SWQpICYmIGtleS5tYXRjaChob21lQWNjb3VudElkZW50aWZpZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHRoaXMuZ2V0SXRlbShrZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWNjZXNzVG9rZW5DYWNoZUl0ZW0gPSBuZXcgQWNjZXNzVG9rZW5DYWNoZUl0ZW0oSlNPTi5wYXJzZShrZXkpLCBKU09OLnBhcnNlKHZhbHVlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGFjY2Vzc1Rva2VuQ2FjaGVJdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cblxuICAgIHJlbW92ZUFjcXVpcmVUb2tlbkVudHJpZXMoYXV0aG9yaXR5S2V5OiBzdHJpbmcsIGFjcXVpcmVUb2tlbkFjY291bnRLZXk6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBjb25zdCBzdG9yYWdlID0gd2luZG93W3RoaXMuY2FjaGVMb2NhdGlvbl07XG4gICAgICAgIGlmIChzdG9yYWdlKSB7XG4gICAgICAgICAgICBsZXQga2V5OiBzdHJpbmc7XG4gICAgICAgICAgICBmb3IgKGtleSBpbiBzdG9yYWdlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0b3JhZ2UuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoKGF1dGhvcml0eUtleSAhPT0gXCJcIiAmJiBrZXkuaW5kZXhPZihhdXRob3JpdHlLZXkpID4gLTEpIHx8IChhY3F1aXJlVG9rZW5BY2NvdW50S2V5ICE9PSBcIlwiICYmIGtleS5pbmRleE9mKGFjcXVpcmVUb2tlbkFjY291bnRLZXkpID4gLTEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUl0ZW0oa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlc2V0Q2FjaGVJdGVtcygpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgc3RvcmFnZSA9IHdpbmRvd1t0aGlzLmNhY2hlTG9jYXRpb25dO1xuICAgICAgICBpZiAoc3RvcmFnZSkge1xuICAgICAgICAgICAgbGV0IGtleTogc3RyaW5nO1xuICAgICAgICAgICAgZm9yIChrZXkgaW4gc3RvcmFnZSkge1xuICAgICAgICAgICAgICAgIGlmIChzdG9yYWdlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleS5pbmRleE9mKENvbnN0YW50cy5tc2FsKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0SXRlbShrZXksIFwiXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkuaW5kZXhPZihDb25zdGFudHMucmVuZXdTdGF0dXMpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVJdGVtKGtleSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRJdGVtQ29va2llKGNOYW1lOiBzdHJpbmcsIGNWYWx1ZTogc3RyaW5nLCBleHBpcmVzPzogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGxldCBjb29raWVTdHIgPSBjTmFtZSArIFwiPVwiICsgY1ZhbHVlICsgXCI7XCI7XG4gICAgICAgIGlmIChleHBpcmVzKSB7XG4gICAgICAgICAgICBjb25zdCBleHBpcmVUaW1lID0gdGhpcy5nZXRDb29raWVFeHBpcmF0aW9uVGltZShleHBpcmVzKTtcbiAgICAgICAgICAgIGNvb2tpZVN0ciArPSBcImV4cGlyZXM9XCIgKyBleHBpcmVUaW1lICsgXCI7XCI7XG4gICAgICAgIH1cblxuICAgICAgICBkb2N1bWVudC5jb29raWUgPSBjb29raWVTdHI7XG4gICAgfVxuXG4gICAgZ2V0SXRlbUNvb2tpZShjTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IGNOYW1lICsgXCI9XCI7XG4gICAgICAgIGNvbnN0IGNhID0gZG9jdW1lbnQuY29va2llLnNwbGl0KFwiO1wiKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjYS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IGMgPSBjYVtpXTtcbiAgICAgICAgICAgIHdoaWxlIChjLmNoYXJBdCgwKSA9PT0gXCIgXCIpIHtcbiAgICAgICAgICAgICAgICBjID0gYy5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYy5pbmRleE9mKG5hbWUpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGMuc3Vic3RyaW5nKG5hbWUubGVuZ3RoLCBjLmxlbmd0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuXG4gICAgZ2V0Q29va2llRXhwaXJhdGlvblRpbWUoY29va2llTGlmZURheXM6IG51bWJlcik6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IHRvZGF5ID0gbmV3IERhdGUoKTtcbiAgICAgICAgY29uc3QgZXhwciA9IG5ldyBEYXRlKHRvZGF5LmdldFRpbWUoKSArIGNvb2tpZUxpZmVEYXlzICogMjQgKiA2MCAqIDYwICogMTAwMCk7XG4gICAgICAgIHJldHVybiBleHByLnRvVVRDU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgY2xlYXJDb29raWUoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuc2V0SXRlbUNvb2tpZShDb25zdGFudHMubm9uY2VJZFRva2VuLCBcIlwiLCAtMSk7XG4gICAgICAgIHRoaXMuc2V0SXRlbUNvb2tpZShDb25zdGFudHMuc3RhdGVMb2dpbiwgXCJcIiwgLTEpO1xuICAgICAgICB0aGlzLnNldEl0ZW1Db29raWUoQ29uc3RhbnRzLmxvZ2luUmVxdWVzdCwgXCJcIiwgLTEpO1xuICAgICAgICB0aGlzLnNldEl0ZW1Db29raWUoQ29uc3RhbnRzLnN0YXRlQWNxdWlyZVRva2VuLCBcIlwiLCAtMSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGFjcXVpcmVUb2tlbkFjY291bnRLZXkgdG8gY2FjaGUgYWNjb3VudCBvYmplY3RcbiAgICAgKiBAcGFyYW0gYWNjb3VudElkXG4gICAgICogQHBhcmFtIHN0YXRlXG4gICAgICovXG4gICAgc3RhdGljIGdlbmVyYXRlQWNxdWlyZVRva2VuQWNjb3VudEtleShhY2NvdW50SWQ6IGFueSwgc3RhdGU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBDYWNoZUtleXMuQUNRVUlSRV9UT0tFTl9VU0VSICsgQ29uc3RhbnRzLnJlc291cmNlRGVsaW1pdGVyICtcbiAgICAgICAgICAgIGAke2FjY291bnRJZH1gICsgQ29uc3RhbnRzLnJlc291cmNlRGVsaW1pdGVyICArIGAke3N0YXRlfWA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGF1dGhvcml0eUtleSB0byBjYWNoZSBhdXRob3JpdHlcbiAgICAgKiBAcGFyYW0gc3RhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2VuZXJhdGVBdXRob3JpdHlLZXkoc3RhdGU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBDYWNoZUtleXMuQVVUSE9SSVRZICsgQ29uc3RhbnRzLnJlc291cmNlRGVsaW1pdGVyICsgYCR7c3RhdGV9YDtcbiAgICB9XG59XG4iLCIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cblxuaW1wb3J0IHsgQWNjZXNzVG9rZW5LZXkgfSBmcm9tIFwiLi9BY2Nlc3NUb2tlbktleVwiO1xuaW1wb3J0IHsgQWNjZXNzVG9rZW5WYWx1ZSB9IGZyb20gXCIuL0FjY2Vzc1Rva2VuVmFsdWVcIjtcblxuLyoqXG4gKiBAaGlkZGVuXG4gKi9cbmV4cG9ydCBjbGFzcyBBY2Nlc3NUb2tlbkNhY2hlSXRlbSB7XG5cbiAga2V5OiBBY2Nlc3NUb2tlbktleTtcbiAgdmFsdWU6IEFjY2Vzc1Rva2VuVmFsdWU7XG5cbiAgY29uc3RydWN0b3Ioa2V5OiBBY2Nlc3NUb2tlbktleSwgdmFsdWU6IEFjY2Vzc1Rva2VuVmFsdWUpIHtcbiAgICB0aGlzLmtleSA9IGtleTtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gIH1cbn1cbiIsIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuXG4vKipcbiAqIEBoaWRkZW5cbiAqL1xuaW1wb3J0IHsgVXRpbHMgfSBmcm9tIFwiLi9VdGlsc1wiO1xuaW1wb3J0IHsgQWFkQXV0aG9yaXR5IH0gZnJvbSBcIi4vQWFkQXV0aG9yaXR5XCI7XG5pbXBvcnQgeyBCMmNBdXRob3JpdHkgfSBmcm9tIFwiLi9CMmNBdXRob3JpdHlcIjtcbmltcG9ydCB7IEF1dGhvcml0eSwgQXV0aG9yaXR5VHlwZSB9IGZyb20gXCIuL0F1dGhvcml0eVwiO1xuaW1wb3J0IHsgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yTWVzc2FnZSB9IGZyb20gXCIuL2Vycm9yL0NsaWVudENvbmZpZ3VyYXRpb25FcnJvclwiO1xuXG5leHBvcnQgY2xhc3MgQXV0aG9yaXR5RmFjdG9yeSB7XG4gICAgLyoqXG4gICAgKiBQYXJzZSB0aGUgdXJsIGFuZCBkZXRlcm1pbmUgdGhlIHR5cGUgb2YgYXV0aG9yaXR5XG4gICAgKi9cbiAgICBwcml2YXRlIHN0YXRpYyBEZXRlY3RBdXRob3JpdHlGcm9tVXJsKGF1dGhvcml0eVVybDogc3RyaW5nKTogQXV0aG9yaXR5VHlwZSB7XG4gICAgICAgIGF1dGhvcml0eVVybCA9IFV0aWxzLkNhbm9uaWNhbGl6ZVVyaShhdXRob3JpdHlVcmwpO1xuICAgICAgICBjb25zdCBjb21wb25lbnRzID0gVXRpbHMuR2V0VXJsQ29tcG9uZW50cyhhdXRob3JpdHlVcmwpO1xuICAgICAgICBjb25zdCBwYXRoU2VnbWVudHMgPSBjb21wb25lbnRzLlBhdGhTZWdtZW50cztcbiAgICAgICAgc3dpdGNoIChwYXRoU2VnbWVudHNbMF0pIHtcbiAgICAgICAgICAgIGNhc2UgXCJ0ZnBcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aG9yaXR5VHlwZS5CMkM7XG4gICAgICAgICAgICBjYXNlIFwiYWRmc1wiOlxuICAgICAgICAgICAgICAgIHJldHVybiBBdXRob3JpdHlUeXBlLkFkZnM7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBBdXRob3JpdHlUeXBlLkFhZDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICogQ3JlYXRlIGFuIGF1dGhvcml0eSBvYmplY3Qgb2YgdGhlIGNvcnJlY3QgdHlwZSBiYXNlZCBvbiB0aGUgdXJsXG4gICAgKiBQZXJmb3JtcyBiYXNpYyBhdXRob3JpdHkgdmFsaWRhdGlvbiAtIGNoZWNrcyB0byBzZWUgaWYgdGhlIGF1dGhvcml0eSBpcyBvZiBhIHZhbGlkIHR5cGUgKGVnIGFhZCwgYjJjKVxuICAgICovXG4gICAgcHVibGljIHN0YXRpYyBDcmVhdGVJbnN0YW5jZShhdXRob3JpdHlVcmw6IHN0cmluZywgdmFsaWRhdGVBdXRob3JpdHk6IGJvb2xlYW4pOiBBdXRob3JpdHkge1xuICAgICAgICBpZiAoVXRpbHMuaXNFbXB0eShhdXRob3JpdHlVcmwpKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0eXBlID0gQXV0aG9yaXR5RmFjdG9yeS5EZXRlY3RBdXRob3JpdHlGcm9tVXJsKGF1dGhvcml0eVVybCk7XG4gICAgICAgIC8vIERlcGVuZGluZyBvbiBhYm92ZSBkZXRlY3Rpb24sIGNyZWF0ZSB0aGUgcmlnaHQgdHlwZS5cbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIEF1dGhvcml0eVR5cGUuQjJDOlxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQjJjQXV0aG9yaXR5KGF1dGhvcml0eVVybCwgdmFsaWRhdGVBdXRob3JpdHkpO1xuICAgICAgICAgICAgY2FzZSBBdXRob3JpdHlUeXBlLkFhZDpcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEFhZEF1dGhvcml0eShhdXRob3JpdHlVcmwsIHZhbGlkYXRlQXV0aG9yaXR5KTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yTWVzc2FnZS5pbnZhbGlkQXV0aG9yaXR5VHlwZTtcbiAgICAgICAgfVxuICAgIH1cblxufVxuIiwiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG5cbmltcG9ydCB7IEFhZEF1dGhvcml0eSB9IGZyb20gXCIuL0FhZEF1dGhvcml0eVwiO1xuaW1wb3J0IHsgQXV0aG9yaXR5LCBBdXRob3JpdHlUeXBlIH0gZnJvbSBcIi4vQXV0aG9yaXR5XCI7XG5pbXBvcnQgeyBDbGllbnRDb25maWd1cmF0aW9uRXJyb3JNZXNzYWdlIH0gZnJvbSBcIi4vZXJyb3IvQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yXCI7XG5pbXBvcnQgeyBVdGlscyB9IGZyb20gXCIuL1V0aWxzXCI7XG5cbi8qKlxuICogQGhpZGRlblxuICovXG5leHBvcnQgY2xhc3MgQjJjQXV0aG9yaXR5IGV4dGVuZHMgQWFkQXV0aG9yaXR5IHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGF1dGhvcml0eTogc3RyaW5nLCB2YWxpZGF0ZUF1dGhvcml0eTogYm9vbGVhbikge1xuICAgIHN1cGVyKGF1dGhvcml0eSwgdmFsaWRhdGVBdXRob3JpdHkpO1xuICAgIGNvbnN0IHVybENvbXBvbmVudHMgPSBVdGlscy5HZXRVcmxDb21wb25lbnRzKGF1dGhvcml0eSk7XG5cbiAgICBjb25zdCBwYXRoU2VnbWVudHMgPSB1cmxDb21wb25lbnRzLlBhdGhTZWdtZW50cztcbiAgICBpZiAocGF0aFNlZ21lbnRzLmxlbmd0aCA8IDMpIHtcbiAgICAgICAgdGhyb3cgQ2xpZW50Q29uZmlndXJhdGlvbkVycm9yTWVzc2FnZS5iMmNBdXRob3JpdHlVcmlJbnZhbGlkUGF0aDtcbiAgICB9XG5cbiAgICB0aGlzLkNhbm9uaWNhbEF1dGhvcml0eSA9IGBodHRwczovLyR7dXJsQ29tcG9uZW50cy5Ib3N0TmFtZUFuZFBvcnR9LyR7cGF0aFNlZ21lbnRzWzBdfS8ke3BhdGhTZWdtZW50c1sxXX0vJHtwYXRoU2VnbWVudHNbMl19L2A7XG4gIH1cblxuICBwdWJsaWMgZ2V0IEF1dGhvcml0eVR5cGUoKTogQXV0aG9yaXR5VHlwZSB7XG4gICAgcmV0dXJuIEF1dGhvcml0eVR5cGUuQjJDO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBwcm9taXNlIHdpdGggdGhlIFRlbmFudERpc2NvdmVyeUVuZHBvaW50XG4gICAqL1xuICBwdWJsaWMgR2V0T3BlbklkQ29uZmlndXJhdGlvbkVuZHBvaW50QXN5bmMoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXN1bHRQcm9taXNlID0gbmV3IFByb21pc2U8c3RyaW5nPigocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgcmVzb2x2ZSh0aGlzLkRlZmF1bHRPcGVuSWRDb25maWd1cmF0aW9uRW5kcG9pbnQpKTtcblxuICAgIGlmICghdGhpcy5Jc1ZhbGlkYXRpb25FbmFibGVkKSB7XG4gICAgICByZXR1cm4gcmVzdWx0UHJvbWlzZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5Jc0luVHJ1c3RlZEhvc3RMaXN0KHRoaXMuQ2Fub25pY2FsQXV0aG9yaXR5VXJsQ29tcG9uZW50cy5Ib3N0TmFtZUFuZFBvcnQpKSB7XG4gICAgICByZXR1cm4gcmVzdWx0UHJvbWlzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8c3RyaW5nPigocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgcmVqZWN0KENsaWVudENvbmZpZ3VyYXRpb25FcnJvck1lc3NhZ2UudW5zdXBwb3J0ZWRBdXRob3JpdHlWYWxpZGF0aW9uKSk7XG4gIH1cbn1cbiIsIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuXG5pbXBvcnQgeyBBY2NvdW50IH0gZnJvbSBcIi4vQWNjb3VudFwiO1xuXG4vKipcbiAqIEtleS1WYWx1ZSB0eXBlIHRvIHN1cHBvcnQgcXVlcnlQYXJhbXMgYW5kIGV4dHJhUXVlcnlQYXJhbXNcbiAqL1xuZXhwb3J0IHR5cGUgUVBEaWN0ID0ge1trZXk6IHN0cmluZ106IHN0cmluZ307XG5cblxuZXhwb3J0IHR5cGUgQXV0aGVudGljYXRpb25QYXJhbWV0ZXJzID0ge1xuICAgIHNjb3Blcz86IEFycmF5PHN0cmluZz47XG4gICAgZXh0cmFTY29wZXNUb0NvbnNlbnQ/OiBBcnJheTxzdHJpbmc+O1xuICAgIHByb21wdD86IHN0cmluZztcbiAgICBleHRyYVF1ZXJ5UGFyYW1ldGVycz86IFFQRGljdDtcbiAgICBjbGFpbXNSZXF1ZXN0PzogbnVsbDtcbiAgICBhdXRob3JpdHk/OiBzdHJpbmc7XG4gICAgY29ycmVsYXRpb25JZD86IHN0cmluZztcbiAgICBhY2NvdW50PzogQWNjb3VudDtcbiAgICBzaWQ/OiBzdHJpbmc7XG4gICAgbG9naW5IaW50Pzogc3RyaW5nO1xufTtcbiIsIi8vIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuXG5pbXBvcnQgeyBBY2NvdW50IH0gZnJvbSBcIi4vQWNjb3VudFwiO1xuaW1wb3J0IHsgSWRUb2tlbiB9IGZyb20gXCIuL0lkVG9rZW5cIjtcblxuLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG5cbmV4cG9ydCB0eXBlIEF1dGhSZXNwb25zZSA9IHtcbiAgICB1bmlxdWVJZDogc3RyaW5nO1xuICAgIHRlbmFudElkOiBzdHJpbmc7XG4gICAgdG9rZW5UeXBlOiBzdHJpbmc7XG4gICAgaWRUb2tlbjogSWRUb2tlbjtcbiAgICBhY2Nlc3NUb2tlbjogc3RyaW5nO1xuICAgIHNjb3BlczogQXJyYXk8c3RyaW5nPjtcbiAgICBleHBpcmVzT246IERhdGU7XG4gICAgYWNjb3VudDogQWNjb3VudDtcbiAgICBhY2NvdW50U3RhdGU6IHN0cmluZztcbn07XG4iXSwic291cmNlUm9vdCI6IiJ9