/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AccessTokenCacheItem } from "./AccessTokenCacheItem";
import { AccessTokenKey } from "./AccessTokenKey";
import { AccessTokenValue } from "./AccessTokenValue";
import { ICacheStorage } from "./ICacheStorage";
import { Account } from "../auth/Account";
import { Authority } from "../auth/authority/Authority";
import { ServerCodeRequestParameters } from "../server/ServerCodeRequestParameters";
import { ClientAuthError } from "../error/ClientAuthError";
import { StringUtils } from "../utils/StringUtils";
import { TemporaryCacheKeys, Constants } from "../utils/Constants";

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
     * Create acquireTokenAccountKey to cache account object
     * @param accountId
     * @param state
     */
    generateAcquireTokenAccountKey(accountId: string): string {
        return `${TemporaryCacheKeys.ACQUIRE_TOKEN_ACCOUNT}${Constants.RESOURCE_DELIM}${accountId}`;
    }

    /**
     * Create authorityKey to cache authority
     * @param state
     */
    generateAuthorityKey(state: string): string {
        return `${TemporaryCacheKeys.AUTHORITY}${Constants.RESOURCE_DELIM}${state}`;
    }

    /**
     * Create Nonce key to cache nonce
     * @param state 
     */
    generateNonceKey(state: string): string {
        return `${TemporaryCacheKeys.NONCE_IDTOKEN}${Constants.RESOURCE_DELIM}${state}`;
    }

    /**
     * Sets the cachekeys for and stores the account information in cache
     * @param account
     * @param state
     */
    setAccountCache(account: Account): void {
        // Cache acquireTokenAccountKey
        const accountId = account && account.homeAccountIdentifier ? account.homeAccountIdentifier : Constants.NO_ACCOUNT;

        const acquireTokenAccountKey = this.generateAcquireTokenAccountKey(accountId);
        this.cacheStorage.setItem(acquireTokenAccountKey, JSON.stringify(account));
    }

    /**
     * Sets the cacheKey for and stores the authority information in cache
     * @param state
     * @param authority
     */
    setAuthorityCache(authority: Authority, state: string): void {
        // Cache authorityKey
        const authorityKey = this.generateAuthorityKey(state);
        this.cacheStorage.setItem(authorityKey, authority.canonicalAuthority);
    }

    /**
     * Updates account, authority, and state in cache
     * @param serverAuthenticationRequest
     * @param account
     */
    updateCacheEntries(serverAuthenticationRequest: ServerCodeRequestParameters, account: Account): void {
        // Cache account and state
        if (account) {
            this.setAccountCache(account);
        }

        // Cache the request state
        this.cacheStorage.setItem(TemporaryCacheKeys.REQUEST_STATE, serverAuthenticationRequest.state);

        // Cache the nonce
        this.cacheStorage.setItem(this.generateNonceKey(serverAuthenticationRequest.state), serverAuthenticationRequest.nonce);

        // Cache authorityKey
        this.setAuthorityCache(serverAuthenticationRequest.authorityInstance, serverAuthenticationRequest.state);
    }

    /**
     * Reset all temporary cache items
     * @param state 
     */
    resetTempCacheItems(state?: string): void {
        // check state and remove associated cache items
        this.cacheStorage.getKeys().forEach(key => {
            if (!StringUtils.isEmpty(state) && key.indexOf(state) !== -1) {
                const splitKey = key.split(Constants.RESOURCE_DELIM);
                const keyState = splitKey.length > 1 ? splitKey[splitKey.length-1]: null;
                if (keyState === state) {
                    this.cacheStorage.removeItem(key);
                }
            }
        });
        // delete generic interactive request parameters
        this.cacheStorage.removeItem(TemporaryCacheKeys.REQUEST_STATE);
        this.cacheStorage.removeItem(TemporaryCacheKeys.REQUEST_PARAMS);
        this.cacheStorage.removeItem(TemporaryCacheKeys.ORIGIN_URI);
    }

    /**
     * Get all access tokens in the cache
     * @param clientId
     * @param homeAccountIdentifier
     */
    getAllAccessTokens(clientId: string, authority: string, resource?: string, homeAccountIdentifier?: string): Array<AccessTokenCacheItem> {
        const results = this.cacheStorage.getKeys().reduce<Array<AccessTokenCacheItem>>((tokens, key) => {
            const keyMatches = key.match(clientId) && key.match(authority) && key.match(resource) && key.match(homeAccountIdentifier);
            if (keyMatches) {
                const value = this.cacheStorage.getItem(key);
                if (value) {
                    try {
                        const parseAtKey = JSON.parse(key) as AccessTokenKey;
                        if (this.checkForExactKeyMatch(parseAtKey, clientId, authority, resource, homeAccountIdentifier)) {
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
    removeAllAccessTokens(clientId: string, authority: string, resource?: string, homeAccountIdentifier?: string): void {
        this.cacheStorage.getKeys().forEach((key) => {
            const keyMatches = key.match(clientId) && key.match(authority) && key.match(resource) && key.match(homeAccountIdentifier);
            if (keyMatches) {
                try {
                    const parseAtKey = JSON.parse(key) as AccessTokenKey;
                    if (this.checkForExactKeyMatch(parseAtKey, clientId, authority, resource, homeAccountIdentifier)) {
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
     * @param resource 
     * @param homeAccountIdentifier 
     */
    private checkForExactKeyMatch(atKey: AccessTokenKey, clientId: string, authority: string, resource?: string, homeAccountIdentifier?: string): boolean {
        const hasClientId = (atKey.clientId === clientId);
        // If any inputs are empty, return true so we don't fail the check.
        const hasAuthorityUri = StringUtils.isEmpty(authority) || (atKey.authority === authority);
        const hasResourceUri = StringUtils.isEmpty(resource) || (atKey.resource === resource);
        const hasHomeAccountId = StringUtils.isEmpty(homeAccountIdentifier) || (atKey.homeAccountIdentifier === homeAccountIdentifier);

        return hasClientId && hasAuthorityUri && hasResourceUri && hasHomeAccountId;
    }
}
