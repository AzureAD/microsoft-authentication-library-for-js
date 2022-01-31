"use strict";
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringUtils = void 0;
var ClientAuthError_1 = require("../error/ClientAuthError");
/**
 * @hidden
 */
var StringUtils = /** @class */ (function () {
    function StringUtils() {
    }
    /**
     * decode a JWT
     *
     * @param authToken
     */
    StringUtils.decodeAuthToken = function (authToken) {
        if (StringUtils.isEmpty(authToken)) {
            throw ClientAuthError_1.ClientAuthError.createTokenNullOrEmptyError(authToken);
        }
        var tokenPartsRegex = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/;
        var matches = tokenPartsRegex.exec(authToken);
        if (!matches || matches.length < 4) {
            throw ClientAuthError_1.ClientAuthError.createTokenParsingError("Given token is malformed: ".concat(JSON.stringify(authToken)));
        }
        var crackedToken = {
            header: matches[1],
            JWSPayload: matches[2],
            JWSSig: matches[3]
        };
        return crackedToken;
    };
    /**
     * Check if a string is empty.
     *
     * @param str
     */
    StringUtils.isEmpty = function (str) {
        return (typeof str === "undefined" || !str || 0 === str.length);
    };
    /**
     * Check if stringified object is empty
     * @param strObj
     */
    StringUtils.isEmptyObj = function (strObj) {
        if (strObj && !StringUtils.isEmpty(strObj)) {
            try {
                var obj = JSON.parse(strObj);
                return Object.keys(obj).length === 0;
            }
            catch (e) { }
        }
        return true;
    };
    StringUtils.startsWith = function (str, search) {
        return str.indexOf(search) === 0;
    };
    StringUtils.endsWith = function (str, search) {
        return (str.length >= search.length) && (str.lastIndexOf(search) === (str.length - search.length));
    };
    /**
     * Parses string into an object.
     *
     * @param query
     */
    StringUtils.queryStringToObject = function (query) {
        var obj = {};
        var params = query.split("&");
        var decode = function (s) { return decodeURIComponent(s.replace(/\+/g, " ")); };
        params.forEach(function (pair) {
            if (pair.trim()) {
                var _a = pair.split(/=(.+)/g, 2), key = _a[0], value = _a[1]; // Split on the first occurence of the '=' character
                if (key && value) {
                    obj[decode(key)] = decode(value);
                }
            }
        });
        return obj;
    };
    /**
     * Trims entries in an array.
     *
     * @param arr
     */
    StringUtils.trimArrayEntries = function (arr) {
        return arr.map(function (entry) { return entry.trim(); });
    };
    /**
     * Removes empty strings from array
     * @param arr
     */
    StringUtils.removeEmptyStringsFromArray = function (arr) {
        return arr.filter(function (entry) {
            return !StringUtils.isEmpty(entry);
        });
    };
    /**
     * Attempts to parse a string into JSON
     * @param str
     */
    StringUtils.jsonParseHelper = function (str) {
        try {
            return JSON.parse(str);
        }
        catch (e) {
            return null;
        }
    };
    /**
     * Tests if a given string matches a given pattern, with support for wildcards and queries.
     * @param pattern Wildcard pattern to string match. Supports "*" for wildcards and "?" for queries
     * @param input String to match against
     */
    StringUtils.matchPattern = function (pattern, input) {
        /**
         * Wildcard support: https://stackoverflow.com/a/3117248/4888559
         * Queries: replaces "?" in string with escaped "\?" for regex test
         */
        var regex = new RegExp(pattern.replace(/\\/g, "\\\\").replace(/\*/g, "[^ ]*").replace(/\?/g, "\\\?")); // eslint-disable-line security/detect-non-literal-regexp
        return regex.test(input);
    };
    return StringUtils;
}());
exports.StringUtils = StringUtils;
//# sourceMappingURL=StringUtils.js.map