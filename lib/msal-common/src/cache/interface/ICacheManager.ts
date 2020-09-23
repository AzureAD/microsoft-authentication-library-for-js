/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CredentialEntity } from "../entities/CredentialEntity";
import {
    AccountCache,
    CredentialCache,
    AccountFilter,
    CredentialFilter
} from "../utils/CacheTypes";
import { CacheRecord } from "../entities/CacheRecord";
import { AccountEntity } from "../entities/AccountEntity";
import { AccountInfo } from "../../account/AccountInfo";
import { AppMetadataEntity } from "../entities/AppMetadataEntity";

export interface ICacheManager {

    /**
     * Returns all accounts in cache
     */
    getAllAccounts(): AccountInfo[];

    /**
     * saves a cache record
     * @param cacheRecord
     */
    saveCacheRecord(cacheRecord: CacheRecord): void;

    /**
     * Given account key retrieve an account
     * @param key
     */
    getAccount(key: string): AccountEntity | null;

    /**
     * retrieve a credential - accessToken, idToken or refreshToken; given the cache key
     * @param key
     */
    getCredential(key: string): CredentialEntity | null;

    /**
    * retrieve appMetadata, given the cache key
    * @param key
    */
    getAppMetadata(key: string): AppMetadataEntity | null;

    /**
     * retrieve accounts matching all provided filters; if no filter is set, get all accounts
     * @param homeAccountId
     * @param environment
     * @param realm
     */
    getAccountsFilteredBy(filter: AccountFilter): AccountCache;

    /**
     * retrieve credentials matching all provided filters; if no filter is set, get all credentials
     * @param homeAccountId
     * @param environment
     * @param credentialType
     * @param clientId
     * @param realm
     * @param target
     */
    getCredentialsFilteredBy(filter: CredentialFilter): CredentialCache;

    /**
     * Removes all accounts and related tokens from cache.
     */
    removeAllAccounts(): boolean;

    /**
     * returns a boolean if the given account is removed
     * @param account
     */
    removeAccount(accountKey: string): boolean;

    /**
     * returns a boolean if the given account is removed
     * @param account
     */
    removeAccountContext(account: AccountEntity): boolean;

    /**
     * returns a boolean if the given credential is removed
     * @param credential
     */
    removeCredential(credential: CredentialEntity): boolean;
}
