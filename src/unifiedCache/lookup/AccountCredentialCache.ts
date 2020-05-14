/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountEntity } from "../entities/AccountEntity";
import { IdTokenEntity } from "../entities/IdTokenEntity";
import { AccessTokenEntity } from "../entities/AccessTokenEntity";
import { RefreshTokenEntity } from "../entities/RefreshTokenEntity";
import { Credential } from "../entities/Credential";
import { UnifiedCacheManager } from "../UnifiedCacheManager";
import { CredentialType, Separators, CacheKeyPosition } from "../../utils/Constants";
import { AccountCache, CredentialCache, IdTokenCache, AccessTokenCache, RefreshTokenCache } from "../utils/CacheTypes";
import { IAccountCredentialCache } from "../interface/IAccountCredentialCache";
import { CacheHelper } from "../utils/CacheHelper";

export class AccountCredentialCache implements IAccountCredentialCache {
    private cacheManager: UnifiedCacheManager;

    constructor(cacheMgr: UnifiedCacheManager) {
        this.cacheManager = cacheMgr;
    }

    /**
     * saves account into cache
     * @param account
     */
    saveAccount(account: AccountEntity): void {
        const cache = this.cacheManager.getCacheInMemory();
        const key = account.generateAccountKey();
        cache.accounts[key] = account;
        this.cacheManager.setCacheInMemory(cache);
    }

    /**
     * saves credential - accessToken, idToken or refreshToken into cache
     * @param credential
     */
    saveCredential(credential: Credential): void {
        const cache = this.cacheManager.getCacheInMemory();
        const key = credential.generateCredentialKey();

        switch (credential.credentialType) {
            case CredentialType.ID_TOKEN:
                cache.idTokens[key] = credential as IdTokenEntity;
                break;
            case CredentialType.ACCESS_TOKEN:
                cache.accessTokens[key] = credential as AccessTokenEntity;
                break;
            case CredentialType.REFRESH_TOKEN:
                cache.refreshTokens[key] = credential as RefreshTokenEntity;
                break;
            default:
                console.log("Cache entity type mismatch");
        }

        this.cacheManager.setCacheInMemory(cache);
    }

    /**
     * Given account key retrieve an account
     * @param key
     */
    getAccount(key: string): AccountEntity {
        return this.cacheManager.getCacheInMemory().accounts[key] || null;
    }

    /**
     * retrieve a credential - accessToken, idToken or refreshToken; given the cache key
     * @param key
     */
    getCredential(key: string): Credential {
        const cache = this.cacheManager.getCacheInMemory();
        switch (key.split(Separators.CACHE_KEY_SEPARATOR)[CacheKeyPosition.CREDENTIAL_TYPE]) {
            case "idtoken":
                return cache.idTokens[key] || null;
            case "accesstoken":
                return cache.accessTokens[key] || null;
            case "refreshtoken":
                return cache.refreshTokens[key] || null;
            default:
                console.log("Cache entity type mismatch");
                return null;
        }
    }

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
    ): AccountCache {
        const accounts: AccountCache = this.cacheManager.getCacheInMemory().accounts;
        const matchingAccounts: AccountCache = {};

        let matches: boolean = true;

        Object.keys(accounts).forEach((key) => {

            if (!!homeAccountId) {
                matches = CacheHelper.matchHomeAccountId(key, homeAccountId);
            }

            if (!!environment) {
                matches = matches && CacheHelper.matchEnvironment(key, environment);
            }

            if (!!realm) {
                matches = matches && CacheHelper.matchTarget(key, realm);
            }

            if (matches) {
                matchingAccounts[key] = accounts[key];
            }
        });

        return matchingAccounts;
    }

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
    ): CredentialCache {

        const matchingCredentials: CredentialCache = {
            idTokens: {},
            accessTokens: {},
            refreshTokens: {}
        };

        matchingCredentials.idTokens = this.getCredentialsInternal(
            this.cacheManager.getCacheInMemory().idTokens,
            homeAccountId,
            environment,
            credentialType,
            clientId,
            realm,
            target
        ) as IdTokenCache;

        matchingCredentials.accessTokens = this.getCredentialsInternal(
            this.cacheManager.getCacheInMemory().accessTokens,
            homeAccountId,
            environment,
            credentialType,
            clientId,
            realm,
            target
        ) as AccessTokenCache;

        matchingCredentials.refreshTokens = this.getCredentialsInternal(
            this.cacheManager.getCacheInMemory().refreshTokens,
            homeAccountId,
            environment,
            credentialType,
            clientId,
            realm,
            target
        ) as RefreshTokenCache;

        return matchingCredentials;
    }

    /**
     * Support function to help match credentials
     * @param cacheCredentials
     * @param homeAccountId
     * @param environment
     * @param credentialType
     * @param clientId
     * @param realm
     * @param target
     */
    private getCredentialsInternal(
        cacheCredentials: object,
        homeAccountId?: string,
        environment?: string,
        credentialType?: string,
        clientId?: string,
        realm?: string,
        target?: string,
    ): Object {

        const matchingCredentials = {};
        let matches: boolean;

        Object.keys(cacheCredentials).forEach((key) => {
            if (!!homeAccountId) {
                matches = CacheHelper.matchHomeAccountId(key, homeAccountId);
            }

            if (!!environment) {
                matches = matches && CacheHelper.matchEnvironment(key, environment);
            }

            if (!!realm) {
                matches = matches && CacheHelper.matchRealm(key, realm);
            }

            if (!!credentialType) {
                matches = matches && CacheHelper.matchCredentialType(key, credentialType);
            }

            if (!!clientId) {
                matches = matches && CacheHelper.matchClientId(key, clientId);
            }

            if (!!target) {
                matches = matches && CacheHelper.matchTarget(key, target);
            }

            if (matches) {
                matchingCredentials[key] = cacheCredentials[key];
            }
        });

        return matchingCredentials;
    }

    /**
     * returns a boolean if the given account is removed
     * @param account
     */
    removeAccount(account: AccountEntity): boolean {
        const cache = this.cacheManager.getCacheInMemory();
        const accountKey = account.generateAccountKey();

        delete cache.accounts[accountKey];
        return true;
    }

    /**
     * returns a boolean if the given account is removed
     * @param account
     */
    removeAccountContext(account: AccountEntity): boolean {
        const cache = this.cacheManager.getCacheInMemory();

        const accountId = account.generateAccountId();

        // TODO: Check how this should be done, do we just remove the account or also the associated credentials always?
        Object.keys(cache.accessTokens).forEach((key) => {
            if (cache.accessTokens[key].generateAccountId() === accountId)
                this.removeCredential(cache.accessTokens[key]);
        });

        Object.keys(cache.idTokens).forEach((key) => {
            if (cache.idTokens[key].generateAccountId() === accountId)
                this.removeCredential(cache.idTokens[key]);
        });

        Object.keys(cache.idTokens).forEach((key) => {
            if (cache.idTokens[key].generateAccountId() === accountId)
                this.removeCredential(cache.idTokens[key]);
        });

        this.removeAccount(account);
        return true;
    }

    /**
     * returns a boolean if the given credential is removed
     * @param credential
     */
    removeCredential(credential: Credential): boolean {
        const cache = this.cacheManager.getCacheInMemory();

        switch (credential.credentialType) {
            case CredentialType.ID_TOKEN:
                delete cache.idTokens[credential.generateCredentialKey()];
                return true;
            case CredentialType.ACCESS_TOKEN:
                delete cache.accessTokens[credential.generateCredentialKey()];
                return true;
            case CredentialType.REFRESH_TOKEN:
                delete cache.refreshTokens[credential.generateCredentialKey()];
                return true;
            default:
                console.log("Cache entity type mismatch");
                return false;
        }
    }
}
