/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TemporaryCacheKeys, Constants } from "../utils/Constants";
import { ICacheStorage } from "./ICacheStorage";
import { Account } from "../auth/Account";
import { Authority } from "../auth/authority/Authority";
import { ServerCodeRequestParameters } from "../server/ServerCodeRequestParameters";

export class CacheHelpers {

    private cacheStorage: ICacheStorage;

    constructor(cacheImpl: ICacheStorage) {
        this.cacheStorage = cacheImpl;
    }

    /**
     * Create acquireTokenAccountKey to cache account object
     * @param accountId
     * @param state
     */
    generateAcquireTokenAccountKey(accountId: any): string {
        return `${TemporaryCacheKeys.ACQUIRE_TOKEN_ACCOUNT}${Constants.RESOURCE_DELIM}${accountId}`;
    }

    /**
     * Create authorityKey to cache authority
     * @param state
     */
    generateAuthorityKey(state: string): string {
        return `${TemporaryCacheKeys.AUTHORITY}${Constants.RESOURCE_DELIM}${state}`;
    }

    generateNonceKey(state: string): string {
        return `${TemporaryCacheKeys.NONCE_IDTOKEN}${Constants.RESOURCE_DELIM}${state}`;
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
    setAccountCache(account: Account) {
        // Cache acquireTokenAccountKey
        const accountId = account && account.homeAccountIdentifier ? account.homeAccountIdentifier : Constants.NO_ACCOUNT;

        const acquireTokenAccountKey = this.generateAcquireTokenAccountKey(accountId);
        this.cacheStorage.setItem(acquireTokenAccountKey, JSON.stringify(account));
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
    setAuthorityCache(authority: Authority, state: string) {
        // Cache authorityKey
        const authorityKey = this.generateAuthorityKey(state);
        this.cacheStorage.setItem(authorityKey, authority.canonicalAuthority);
    }

    /**
     * Updates account, authority, and state in cache
     * @param serverAuthenticationRequest
     * @param account
     * @hidden
     * @ignore
     */
    updateCacheEntries(serverAuthenticationRequest: ServerCodeRequestParameters, account: Account): void {
        // Cache account and state
        if (account) {
            this.setAccountCache(account);
        }

        // Cache the request state
        this.cacheStorage.setItem(TemporaryCacheKeys.REQUEST_STATE, serverAuthenticationRequest.state);

        // Cache the nonce
        this.cacheStorage.setItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${serverAuthenticationRequest.state}`, serverAuthenticationRequest.nonce);

        // Cache authorityKey
        this.setAuthorityCache(serverAuthenticationRequest.authorityInstance, serverAuthenticationRequest.state);
    }

    /**
     * Reset all temporary cache items
     * @param state 
     */
    resetTempCacheItems(state: string): void {
        let key: string;
        // check state and remove associated cache
        for (key in this.cacheStorage.getKeys()) {
            if (!state || key.indexOf(state) !== -1) {
                const splitKey = key.split(Constants.RESOURCE_DELIM);
                const keyState = splitKey.length > 1 ? splitKey[splitKey.length-1]: null;
                if (keyState === state && !this.tokenRenewalInProgress(keyState)) {
                    this.cacheStorage.removeItem(key);
                }
            }
        }
        // delete the interaction status cache
        this.cacheStorage.removeItem(TemporaryCacheKeys.INTERACTION_STATUS);
        this.cacheStorage.removeItem(TemporaryCacheKeys.REDIRECT_REQUEST);
    }

    /**
     * Return if the token renewal is still in progress
     * @param stateValue
     */
    tokenRenewalInProgress(stateValue: string): boolean {
        const renewStatus = this.cacheStorage.getItem(TemporaryCacheKeys.RENEW_STATUS + stateValue);
        return !!(renewStatus && renewStatus === Constants.INTERACTION_IN_PROGRESS);
    }
}
