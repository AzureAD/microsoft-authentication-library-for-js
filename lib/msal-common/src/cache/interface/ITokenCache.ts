/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountEntity } from "../entities/AccountEntity";
import { Credential } from "../entities/Credential";
import { AccountCache } from "../utils/CacheTypes";

export interface ITokenCache {
    /**
     * saves account into cache
     * @param account
     */
    saveAccount(account: AccountEntity): void;

    /**
     * saves credential - accessToken, idToken or refreshToken into cache
     * @param credential
     */
    saveCredential(credential: Credential): void;

    /**
     * Given account key retrieve an account
     * @param key
     */
    getAccount(key: string): AccountEntity;

    /**
     * retrieve a credential - accessToken, idToken or refreshToken; given the cache key
     * @param key
     */
    getCredential(key: string): Credential;

    /**
     * retrieve accounts matching all provided filters; if no filter is set, get all accounts
     * @param homeAccountId
     * @param environment
     * @param realm
     */
    getAccounts(
        homeAccountId?: string,
        environment?: string,
        realm?: string
    ): AccountCache;

    /**
     * retrieve credentails matching all provided filters; if no filter is set, get all credentials
     * @param homeAccountId
     * @param environment
     * @param credentialType
     * @param clientId
     * @param realm
     * @param target
     */
    getCredentials(
        homeAccountId?: string,
        environment?: string,
        credentialType?: string,
        clientId?: string,
        realm?: string,
        target?: string
    ): Credential;

    /**
     * returns a boolean if the given account is removed
     * @param account
     */
    removeAccount(account: AccountEntity): boolean;

    /**
     * returns a boolean if the given credential is removed
     * @param credential
     */
    removeCredential(credential: Credential): boolean;
}
