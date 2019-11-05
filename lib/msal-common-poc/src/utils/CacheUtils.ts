/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MsalAccount } from "../auth/MsalAccount";
import { Constants, TemporaryCacheKeys } from "./Constants";
import { Authority } from "../auth/authority/Authority";
import { ServerRequestParameters } from "../request/ServerRequestParameters";
import { ICacheStorage } from "../cache/ICacheStorage";
import { AccessTokenCacheItem } from "../cache/AccessTokenCacheItem";

/**
 * @hidden
 */
export class CacheUtils {

    /**
     * Create acquireTokenAccountKey to cache account object
     * @param accountId
     * @param state
     */
    static generateAcquireTokenAccountKey(accountId: any, state: string): string {
        return `${TemporaryCacheKeys.ACQUIRE_TOKEN_ACCOUNT}${Constants.RESOURCE_DELIM}${accountId}${Constants.RESOURCE_DELIM}${state}`;
    }

    /**
     * Create authorityKey to cache authority
     * @param state
     */
    static generateAuthorityKey(state: string): string {
        return `${TemporaryCacheKeys.AUTHORITY}${Constants.RESOURCE_DELIM}${state}`;
    }

    /**
     * @hidden
     * @ignore
     *
     * Sets the cachekeys for and stores the account information in cache
     * @param account
     * @param state
     * @hidden
     */
    static setAccountCache(cacheStorage: ICacheStorage, account: MsalAccount, state: string) {
        // Cache acquireTokenAccountKey
        const accountId = account && account.homeAccountIdentifier ? account.homeAccountIdentifier : Constants.NO_ACCOUNT;

        const acquireTokenAccountKey = CacheUtils.generateAcquireTokenAccountKey(accountId, state);
        cacheStorage.setItem(acquireTokenAccountKey, JSON.stringify(account));
    }

    /**
     * @hidden
     * @ignore
     *
     * Sets the cacheKey for and stores the authority information in cache
     * @param state
     * @param authority
     * @hidden
     */
    static setAuthorityCache(cacheStorage: ICacheStorage, state: string, authority: Authority) {
        // Cache authorityKey
        const authorityKey = CacheUtils.generateAuthorityKey(state);
        cacheStorage.setItem(authorityKey, authority.canonicalAuthority);
    }

    /**
     * Updates account, authority, and nonce in cache
     * @param serverAuthenticationRequest
     * @param account
     * @hidden
     * @ignore
     */
    static updateCacheEntries(cacheStorage: ICacheStorage, serverAuthenticationRequest: ServerRequestParameters, account: MsalAccount, loginStartPage?: any) {
        // Cache account and authority
        if (loginStartPage) {
            // Cache the state, nonce, and login request data
            cacheStorage.setItem(TemporaryCacheKeys.ORIGIN_URI, loginStartPage);
            cacheStorage.setItem(TemporaryCacheKeys.REQUEST_STATE, serverAuthenticationRequest.state);
        } else {
            CacheUtils.setAccountCache(cacheStorage, account, serverAuthenticationRequest.state);
        }
        // Cache authorityKey
        CacheUtils.setAuthorityCache(cacheStorage, serverAuthenticationRequest.state, serverAuthenticationRequest.authorityInstance);

        // Cache nonce
        cacheStorage.setItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${serverAuthenticationRequest.state}`, serverAuthenticationRequest.nonce);
    }

    /**
     * Get all access tokens in the cache
     * @param clientId
     * @param authorityUri
     */
    static getAllAccessTokens(cacheStorage: ICacheStorage, clientId: string, authorityUri: string): Array<AccessTokenCacheItem> {
        const results = cacheStorage.getKeys().reduce((tokens, key) => {
            if (cacheStorage.containsKey(key) && key.match(clientId) && key.match(authorityUri)) {
                const value = cacheStorage.getItem(key);
                if (value) {
                    const newAccessTokenCacheItem = new AccessTokenCacheItem(JSON.parse(key), JSON.parse(value));
                    return tokens.concat([ newAccessTokenCacheItem ]);
                }
            }

            return tokens;
        }, []);

        return results;
    }

    /**
     * Remove all temporary cache entries
     * @param state
     */
    static removeAcquireTokenEntries(cacheStorage: ICacheStorage, state?: string): void {
        cacheStorage.removeItem(TemporaryCacheKeys.URL_HASH);
        cacheStorage.getKeys().forEach((cacheKey, index) => {
            if (cacheStorage.containsKey(cacheKey)) {
                if ((cacheKey.indexOf(TemporaryCacheKeys.AUTHORITY) !== -1 || cacheKey.indexOf(TemporaryCacheKeys.ACQUIRE_TOKEN_ACCOUNT) !== 1) && (!state || cacheKey.indexOf(state) !== -1)) {
                    console.log("Deleting " + cacheKey);
                    const resourceDelimSplitKey = cacheKey.split(Constants.RESOURCE_DELIM);
                    let keyState;
                    if (resourceDelimSplitKey.length > 1) {
                        keyState = resourceDelimSplitKey[resourceDelimSplitKey.length-1];
                    }
                    if (keyState === state && !CacheUtils.tokenRenewalInProgress(cacheStorage, keyState)) {
                        cacheStorage.removeItem(cacheKey);
                        cacheStorage.removeItem(TemporaryCacheKeys.RENEW_STATUS + state);
                        cacheStorage.removeItem(TemporaryCacheKeys.REQUEST_STATE);
                        cacheStorage.removeItem(TemporaryCacheKeys.ORIGIN_URI);
                        cacheStorage.removeItem(TemporaryCacheKeys.INTERACTION_STATUS);
                        cacheStorage.removeItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${state}`);
                    }
                }
            }
        });
    }

    /**
     * Return if the token renewal is still in progress
     * @param stateValue
     */
    static tokenRenewalInProgress(cacheStorage: ICacheStorage, stateValue: string): boolean {
        const renewStatus = cacheStorage.getItem(TemporaryCacheKeys.RENEW_STATUS + stateValue);
        return !!(renewStatus && renewStatus === Constants.INTERACTION_IN_PROGRESS);
    }

    private isAcquireTokenEntry(cacheKey: string, state: string): boolean {
        return (
            (
                cacheKey.indexOf(TemporaryCacheKeys.AUTHORITY) !== -1 
                || cacheKey.indexOf(TemporaryCacheKeys.ACQUIRE_TOKEN_ACCOUNT) !== 1
            ) 
            &&
            (
                !state || cacheKey.indexOf(state) !== -1
            )
        );
    }
}
