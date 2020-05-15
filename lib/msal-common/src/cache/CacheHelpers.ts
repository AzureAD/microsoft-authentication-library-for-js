/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AccessTokenCacheItem } from "./AccessTokenCacheItem";
import { AccessTokenKey } from "./AccessTokenKey";
import { AccessTokenValue } from "./AccessTokenValue";
import { Account } from "../account/Account";
import { Authority } from "../authority/Authority";
import { ServerCodeRequestParameters } from "../server/ServerCodeRequestParameters";
import { ClientAuthError } from "../error/ClientAuthError";
import { StringUtils } from "../utils/StringUtils";
import { TemporaryCacheKeys, Constants } from "../utils/Constants";
import { ICacheStorageAsync } from "./ICacheStorageAsync";

/**
 * The CacheHelpers class contains a set of helper functions used by the module to manage cache items.
 */
export class CacheHelpers {

    // Storage interface
    private cacheStorage: ICacheStorageAsync;

    constructor(cacheImpl: ICacheStorageAsync) {
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
    setAccountCache(account: Account): Promise<void> {
        // Cache acquireTokenAccountKey
        const accountId = account && account.homeAccountIdentifier ? account.homeAccountIdentifier : Constants.NO_ACCOUNT;

        const acquireTokenAccountKey = this.generateAcquireTokenAccountKey(accountId);
        return this.cacheStorage.setItem(acquireTokenAccountKey, JSON.stringify(account));
    }

    /**
     * Sets the cacheKey for and stores the authority information in cache
     * @param state
     * @param authority
     */
    setAuthorityCache(authority: Authority, state: string): Promise<void> {
        // Cache authorityKey
        const authorityKey = this.generateAuthorityKey(state);
        return this.cacheStorage.setItem(authorityKey, authority.canonicalAuthority);
    }

    /**
     * Updates account, authority, and state in cache
     * @param serverAuthenticationRequest
     * @param account
     */
    async updateCacheEntries(serverAuthenticationRequest: ServerCodeRequestParameters, account: Account): Promise<void> {
        // Cache account and state
        if (account) {
            await this.setAccountCache(account);
        }

        // Cache the request state
        await this.cacheStorage.setItem(TemporaryCacheKeys.REQUEST_STATE, serverAuthenticationRequest.state);

        // Cache the nonce
        await this.cacheStorage.setItem(this.generateNonceKey(serverAuthenticationRequest.state), serverAuthenticationRequest.nonce);

        // Cache authorityKey
        return this.setAuthorityCache(serverAuthenticationRequest.authorityInstance, serverAuthenticationRequest.state);
    }

    /**
     * Reset all temporary cache items
     * @param state
     */
    async resetTempCacheItems(state?: string): Promise<void> {
        // check state and remove associated cache items
        const cacheKeys = await this.cacheStorage.getKeys();
        const removedTempCacheItems: Array<Promise<void>> = cacheKeys.map(key => {
            if (!StringUtils.isEmpty(state) && key.indexOf(state) !== -1) {
                const splitKey = key.split(Constants.RESOURCE_DELIM);
                const keyState = splitKey.length > 1 ? splitKey[splitKey.length-1]: null;
                if (keyState === state) {
                    return this.cacheStorage.removeItem(key);
                }
            }
            return null;
        }).filter(removed => removed);
        await Promise.all(removedTempCacheItems);
        // delete generic interactive request parameters
        await this.cacheStorage.removeItem(TemporaryCacheKeys.REQUEST_STATE);
        await this.cacheStorage.removeItem(TemporaryCacheKeys.REQUEST_PARAMS);
        await this.cacheStorage.removeItem(TemporaryCacheKeys.ORIGIN_URI);
    }

    /**
     * Get all access tokens in the cache
     * @param clientId
     * @param homeAccountIdentifier
     */
    async getAllAccessTokens(clientId: string, authority: string, resource?: string, homeAccountIdentifier?: string): Promise<Array<AccessTokenCacheItem>> {
        const cacheKeys: Array<string> = await this.cacheStorage.getKeys();
        const tokenKeys: Array<string> = cacheKeys.filter((key) => {
            return key.match(clientId) && key.match(authority) && key.match(resource) && key.match(homeAccountIdentifier);
        });
        const foundTokens: Array<Promise<AccessTokenCacheItem>> = tokenKeys.map(async (key) => {
            const valueAtKey = await this.cacheStorage.getItem(key);
            if (valueAtKey) {
                try {
                    const parsedAccessTokenKey: AccessTokenKey = JSON.parse(key) as AccessTokenKey;
                    if (this.checkForExactKeyMatch(parsedAccessTokenKey, clientId, authority, resource, homeAccountIdentifier)) {
                        const newAccessTokenCacheItem = new AccessTokenCacheItem(parsedAccessTokenKey, JSON.parse(valueAtKey) as AccessTokenValue);
                        return newAccessTokenCacheItem;
                    }
                } catch (e) {
                    throw ClientAuthError.createCacheParseError(key);
                }
            }
            return null;
        });

        return Promise.all(foundTokens).then(arr => arr.filter(item => item));
    }

    /**
     * Remove all access tokens in the cache
     * @param clientId
     * @param homeAccountIdentifier
     */
    async removeAllAccessTokens(clientId: string, authority: string, resource?: string, homeAccountIdentifier?: string): Promise<void> {
        const cacheKeys = await this.cacheStorage.getKeys();
        const tokenKeys: Array<string> = cacheKeys.filter((key) => {
            return key.match(clientId) && key.match(authority) && key.match(resource) && key.match(homeAccountIdentifier);
        });
        const removedTokens: Array<Promise<void>> = tokenKeys.map(async (key) => {
            try {
                const parsedAccessTokenKey = JSON.parse(key) as AccessTokenKey;
                if (this.checkForExactKeyMatch(parsedAccessTokenKey, clientId, authority, resource, homeAccountIdentifier)) {
                    return await this.cacheStorage.removeItem(key);
                }
                return null;
            } catch (e) {
                throw ClientAuthError.createCacheParseError(key);
            }
        }).filter(resolution => resolution);
        return Promise.all(removedTokens).then(() => null);
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
