"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeCacheTestUtils = void 0;
var tslib_1 = require("tslib");
var fs_1 = (0, tslib_1.__importDefault)(require("fs"));
var Serializer_1 = require("../../lib/msal-node/src/cache/serializer/Serializer");
var Deserializer_1 = require("../../lib/msal-node/src/cache/serializer/Deserializer");
var NodeCacheTestUtils = /** @class */ (function () {
    function NodeCacheTestUtils() {
    }
    NodeCacheTestUtils.getTokens = function (cacheLocation) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            var deserializedCache, tokenCache;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, NodeCacheTestUtils.readCacheFile(cacheLocation)];
                    case 1:
                        deserializedCache = _a.sent();
                        tokenCache = {
                            idTokens: [],
                            accessTokens: [],
                            refreshTokens: []
                        };
                        Object.keys(tokenCache).forEach(function (cacheSectionKey) {
                            Object.keys(deserializedCache[cacheSectionKey]).map(function (cacheKey) {
                                var cacheSection = deserializedCache[cacheSectionKey];
                                tokenCache[cacheSectionKey].push(cacheSection[cacheKey]);
                            });
                        });
                        return [2 /*return*/, Promise.resolve(tokenCache)];
                }
            });
        });
    };
    NodeCacheTestUtils.readCacheFile = function (cacheLocation) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            var _this = this;
            return (0, tslib_1.__generator)(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        fs_1.default.readFile(cacheLocation, "utf-8", function (err, data) {
                            if (err) {
                                console.log("Error getting tokens from cache: ", err);
                                reject(err);
                            }
                            var cache = (data) ? data : _this.getCacheTemplate();
                            var deserializedCache = Deserializer_1.Deserializer.deserializeAllCache(JSON.parse(cache));
                            resolve(deserializedCache);
                        });
                    })];
            });
        });
    };
    NodeCacheTestUtils.waitForTokens = function (cacheLocation, interval) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            var tokenCache;
            var _this = this;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getTokens(cacheLocation)];
                    case 1:
                        tokenCache = _a.sent();
                        if (tokenCache.idTokens.length) {
                            return [2 /*return*/, tokenCache];
                        }
                        return [2 /*return*/, new Promise(function (resolve) {
                                var intervalId = setInterval(function () { return (0, tslib_1.__awaiter)(_this, void 0, void 0, function () {
                                    return (0, tslib_1.__generator)(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.getTokens(cacheLocation)];
                                            case 1:
                                                tokenCache = _a.sent();
                                                if (tokenCache.idTokens.length) {
                                                    clearInterval(intervalId);
                                                    resolve(tokenCache);
                                                }
                                                return [2 /*return*/];
                                        }
                                    });
                                }); }, interval);
                            })];
                }
            });
        });
    };
    NodeCacheTestUtils.writeToCacheFile = function (cacheLocation, deserializedCache) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            return (0, tslib_1.__generator)(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        fs_1.default.writeFile(cacheLocation, JSON.stringify(deserializedCache, null, 1), function (error) {
                            if (error) {
                                console.error("Error writing to cache file in resetCache: ", error);
                                reject(error);
                            }
                            resolve();
                        });
                    })];
            });
        });
    };
    NodeCacheTestUtils.expireAccessTokens = function (cacheLocation) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            var deserializedCache, atKeys, serializedCache;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, NodeCacheTestUtils.readCacheFile(cacheLocation)];
                    case 1:
                        deserializedCache = _a.sent();
                        atKeys = Object.keys(deserializedCache.accessTokens);
                        atKeys.forEach(function (atKey) {
                            deserializedCache.accessTokens[atKey].expiresOn = "0";
                            deserializedCache.accessTokens[atKey].extendedExpiresOn = "0";
                        });
                        serializedCache = Serializer_1.Serializer.serializeAllCache(deserializedCache);
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                fs_1.default.writeFile(cacheLocation, JSON.stringify(serializedCache, null, 1), function (error) {
                                    if (error) {
                                        reject(error);
                                    }
                                    resolve();
                                });
                            })];
                }
            });
        });
    };
    NodeCacheTestUtils.resetCache = function (cacheLocation) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            var emptyCache;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        emptyCache = this.getCacheSchema();
                        return [4 /*yield*/, NodeCacheTestUtils.writeToCacheFile(cacheLocation, emptyCache)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    NodeCacheTestUtils.getCacheSchema = function () {
        return {
            Account: {},
            IdToken: {},
            AccessToken: {},
            RefreshToken: {},
            AppMetadata: {}
        };
    };
    NodeCacheTestUtils.getCacheTemplate = function () {
        return JSON.stringify(this.getCacheSchema());
    };
    return NodeCacheTestUtils;
}());
exports.NodeCacheTestUtils = NodeCacheTestUtils;
//# sourceMappingURL=NodeCacheTestUtils.js.map