/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccessTokenCacheItem } from "../cache/AccessTokenCacheItem";
import { ScopeSet } from "../ScopeSet";
import { UrlUtils } from "./UrlUtils"; 

/**
 * @hidden
 */
export class AuthCacheUtils {
    static filterTokenCacheItemsByScope(tokenCacheItems: Array<AccessTokenCacheItem>, requestScopes: string []): Array<AccessTokenCacheItem> {
        return tokenCacheItems.filter((cacheItem: AccessTokenCacheItem) => {
            const cachedScopes = cacheItem.key.scopes.split(" ");
            const searchScopes = ScopeSet.removeDefaultScopes(requestScopes);

            // TODO: Revise MSAL Guard case
            const defaultScopesOnlyMatchToken = (searchScopes.length === 0 && ScopeSet.containsScope(cachedScopes, requestScopes));
            const searchScopesMatchToken = ScopeSet.containsScope(cachedScopes, searchScopes);

            return (defaultScopesOnlyMatchToken || searchScopesMatchToken);
        });

    }

    static filterTokenCacheItemsByAuthority(tokenCacheItems: Array<AccessTokenCacheItem>, authority: string): Array<AccessTokenCacheItem> {
        return tokenCacheItems.filter((cacheItem: AccessTokenCacheItem) => UrlUtils.CanonicalizeUri(cacheItem.key.authority) === authority);
    }

    static filterTokenCacheItemsByDomain(tokenCacheItems: Array<AccessTokenCacheItem>, requestDomain: string): Array<AccessTokenCacheItem> {
        return tokenCacheItems.filter(cacheItem => {
            const cacheItemDomain = UrlUtils.GetUrlComponents(cacheItem.key.authority).HostNameAndPort;
            return cacheItemDomain === requestDomain;
        });
    }
}
