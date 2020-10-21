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
import { ServerTelemetryEntity } from "../entities/ServerTelemetryEntity";
import { ThrottlingEntity } from "../entities/ThrottlingEntity";
import { IdTokenEntity } from "../entities/IdTokenEntity";
import { AccessTokenEntity } from "../entities/AccessTokenEntity";
import { RefreshTokenEntity } from "../entities/RefreshTokenEntity";

export interface ICacheManager {

    /**
     * fetch the account entity from the platform cache
     * @param key
     */
    getAccount(key: string): AccountEntity | null;

    /**
     * set account entity in the platform cache
     * @param key
     * @param value
     */
    setAccount(key: string, value: AccountEntity): void;

    /**
     * fetch the idToken entity from the platform cache
     * @param key
     */
    getIdTokenCredential(key: string): IdTokenEntity | null;

    /**
     * set idToken entity to the platform cache
     * @param key
     * @param value
     */
    setIdTokenCredential(key: string, value: IdTokenEntity): void;

    /**
     * fetch the idToken entity from the platform cache
     * @param key
     */
    getAccessTokenCredential(key: string): AccessTokenEntity | null;

    /**
     * set idToken entity to the platform cache
     * @param key
     * @param value
     */
    setAccessTokenCredential(key: string, value: AccessTokenEntity): void;

    /**
     * fetch the idToken entity from the platform cache
     * @param key
     */
    getRefreshTokenCredential(key: string): RefreshTokenEntity | null;

    /**
     * set idToken entity to the platform cache
     * @param key
     * @param value
     */
    setRefreshTokenCredential(key: string, value: RefreshTokenEntity): void;

    /**
     * fetch appMetadata entity from the platform cache
     * @param key
     */
    getAppMetadata(key: string): AppMetadataEntity | null;

    /**
     * set appMetadata entity to the platform cache
     * @param key
     * @param value
     */
    setAppMetadata(key: string, value: AppMetadataEntity): void;

    /**
     * fetch server telemetry entity from the platform cache
     * @param key
     */
    getServerTelemetry(key: string): ServerTelemetryEntity | null;

    /**
     * set server telemetry entity to the platform cache
     * @param key
     * @param value
     */
    setServerTelemetry(key: string, value: ServerTelemetryEntity): void;

    /**
     * fetch throttling entity from the platform cache
     * @param key
     */
    getThrottlingCache(key: string): ThrottlingEntity | null;

    /**
     * set throttling entity to the platform cache
     * @param key
     * @param value
     */
    setThrottlingCache(key: string, value: ThrottlingEntity): void;

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
