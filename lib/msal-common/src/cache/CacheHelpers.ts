/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AccessTokenCacheItem } from "./AccessTokenCacheItem";
import { AccessTokenKey } from "./AccessTokenKey";
import { AccessTokenValue } from "./AccessTokenValue";
import { ICacheStorage } from "./ICacheStorage";
import { ClientAuthError } from "../error/ClientAuthError";
import { StringUtils } from "../utils/StringUtils";

/**
 * The CacheHelpers class contains a set of helper functions used by the module to manage cache items.
 */
export class CacheHelpers {

    // Storage interface
    private cacheStorage: ICacheStorage;

    constructor(cacheImpl: ICacheStorage) {
        this.cacheStorage = cacheImpl;

    }

    /**
     * Get all access tokens in the cache
     * @param clientId
     * @param homeAccountIdentifier
     */
    getAllAccessTokens(clientId: string, authority: string, homeAccountIdentifier?: string): Array<AccessTokenCacheItem> {
        const results = this.cacheStorage.getKeys().reduce<Array<AccessTokenCacheItem>>((tokens, key) => {
            const keyMatches = key.match(clientId) && key.match(authority) && key.match(homeAccountIdentifier);
            if (keyMatches) {
                const value = this.cacheStorage.getItem(key) as string;
                if (value) {
                    try {
                        const parseAtKey = JSON.parse(key) as AccessTokenKey;
                        if (this.checkForExactKeyMatch(parseAtKey, clientId, authority, homeAccountIdentifier)) {
                            const newAccessTokenCacheItem = new AccessTokenCacheItem(parseAtKey, JSON.parse(value) as AccessTokenValue);
                            return tokens.concat([ newAccessTokenCacheItem ]);
                        }
                    } catch (e) {
                        throw ClientAuthError.createCacheParseError(key);
                    }
                }
            }
            return tokens;
        }, []);

        return results;
    }

    /**
     * Remove all access tokens in the cache
     * @param clientId
     * @param homeAccountIdentifier
     */
    removeAllAccessTokens(clientId: string, authority: string, homeAccountIdentifier?: string): void {
        this.cacheStorage.getKeys().forEach((key) => {
            const keyMatches = key.match(clientId) && key.match(authority) && key.match(homeAccountIdentifier);
            if (keyMatches) {
                try {
                    const parseAtKey = JSON.parse(key) as AccessTokenKey;
                    if (this.checkForExactKeyMatch(parseAtKey, clientId, authority, homeAccountIdentifier)) {
                        this.cacheStorage.removeItem(key);
                    }
                } catch (e) {
                    throw ClientAuthError.createCacheParseError(key);
                }
            }
        });
    }

    /**
     * Checks that any parameters are exact matches for key value, since key.match in the above functions only do contains checks, not exact matches.
     * @param atKey
     * @param clientId
     * @param authority
     * @param homeAccountIdentifier
     */
    private checkForExactKeyMatch(atKey: AccessTokenKey, clientId: string, authority: string, homeAccountIdentifier?: string): boolean {
        const hasClientId = (atKey.clientId === clientId);
        // If any inputs are empty, return true so we don't fail the check.
        const hasAuthorityUri = StringUtils.isEmpty(authority) || (atKey.authority === authority);
        const hasHomeAccountId = StringUtils.isEmpty(homeAccountIdentifier) || (atKey.homeAccountIdentifier === homeAccountIdentifier);

        return hasClientId && hasAuthorityUri && hasHomeAccountId;
    }
}
