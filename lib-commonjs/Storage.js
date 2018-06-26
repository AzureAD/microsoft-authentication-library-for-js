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
var Constants_1 = require("./Constants");
var AccessTokenCacheItem_1 = require("./AccessTokenCacheItem");
exports.CacheLocations = {
    localStorage: "localStorage",
    sessionStorage: "sessionStorage"
};
/*
 * @hidden
 */
var Storage = /** @class */ (function () {
    function Storage(cacheLocation) {
        if (Storage._instances[cacheLocation]) {
            return Storage._instances[cacheLocation];
        }
        if (!(cacheLocation in exports.CacheLocations)) {
            throw new Error("cacheLocation " + cacheLocation + " not valid. Possible values are: " +
                exports.CacheLocations.localStorage + " and " + exports.CacheLocations.sessionStorage);
        }
        var storageSupported = typeof window[cacheLocation] !== "undefined" && !!window[cacheLocation];
        if (!storageSupported) {
            throw new Error("cacheLocation " + cacheLocation + " not supported by current environment");
        }
        this._cacheLocation = window[cacheLocation];
        Storage._instances[cacheLocation] = this;
        return this;
    }
    // add value to storage
    Storage.prototype.setItem = function (key, value) {
        this._cacheLocation.setItem(key, value);
    };
    // get one item by key from storage
    Storage.prototype.getItem = function (key) {
        return this._cacheLocation.getItem(key);
    };
    // remove value from storage
    Storage.prototype.removeItem = function (key) {
        return this._cacheLocation.removeItem(key);
    };
    // clear storage (remove all items from it)
    Storage.prototype.clear = function () {
        return this._cacheLocation.clear();
    };
    Storage.prototype.getAllAccessTokens = function (clientId, userIdentifier) {
        var results = [];
        var accessTokenCacheItem;
        var key;
        for (key in this._cacheLocation) {
            if (this._cacheLocation.hasOwnProperty(key)) {
                if (key.match(clientId) && key.match(userIdentifier)) {
                    var value = this.getItem(key);
                    if (value) {
                        accessTokenCacheItem = new AccessTokenCacheItem_1.AccessTokenCacheItem(JSON.parse(key), JSON.parse(value));
                        results.push(accessTokenCacheItem);
                    }
                }
            }
        }
        return results;
    };
    Storage.prototype.removeAcquireTokenEntries = function (authorityKey, acquireTokenUserKey) {
        var key;
        for (key in this._cacheLocation) {
            if (this._cacheLocation.hasOwnProperty(key)) {
                if ((authorityKey != "" && key.indexOf(authorityKey) > -1) || (acquireTokenUserKey != "" && key.indexOf(acquireTokenUserKey) > -1)) {
                    this.removeItem(key);
                }
            }
        }
    };
    Storage.prototype.resetCacheItems = function () {
        var key;
        for (key in this._cacheLocation) {
            if (this._cacheLocation.hasOwnProperty(key) && key.indexOf(Constants_1.Constants.msal) !== -1) {
                this.setItem(key, "");
            }
            if (this._cacheLocation.hasOwnProperty(key) && key.indexOf(Constants_1.Constants.renewStatus) !== -1)
                this.removeItem(key);
        }
    };
    Storage._instances = {};
    return Storage;
}());
exports.Storage = Storage;
//# sourceMappingURL=Storage.js.map