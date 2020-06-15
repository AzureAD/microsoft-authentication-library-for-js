/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccountFilter,
    CredentialFilter
} from "./utils/CacheTypes";
import { AccountEntity } from "./entities/AccountEntity";
import { ICacheStorage } from "./interface/ICacheStorage";
import { Credential } from "./entities/Credential";
import { CredentialType, CacheSchemaType, Constants } from "../utils/Constants";
import { AccountCache, CredentialCache } from "./utils/CacheTypes";
import { CacheHelper } from "./utils/CacheHelper";
import { CacheRecord } from "./entities/CacheRecord";
import { StringUtils } from "../utils/StringUtils";
import { IdTokenEntity } from "./entities/IdTokenEntity";
import { AccessTokenEntity } from "./entities/AccessTokenEntity";
import { RefreshTokenEntity } from "./entities/RefreshTokenEntity";
import { ScopeSet } from "../request/ScopeSet";

export class UnifiedCacheManager {

    /**
     * Returns all accounts in cache
     */
    static getAllAccounts(cacheStorage: ICacheStorage): AccountCache {
        return this.getAccountsFilteredBy(cacheStorage);
    }

    /**
     * saves a cache record
     * @param cacheRecord
     */
    static saveCacheRecord(cacheStorage: ICacheStorage, cacheRecord: CacheRecord, clientId: string, responseScopes: ScopeSet): void {
        this.saveAccount(cacheStorage, cacheRecord.account);
        this.saveCredential(cacheStorage, cacheRecord.idToken);
        this.saveAccessToken(cacheStorage, cacheRecord.accessToken, clientId, responseScopes);
        this.saveCredential(cacheStorage, cacheRecord.refreshToken);
    }

    /**
     * saves account into cache
     * @param account
     */
    private static saveAccount(cacheStorage: ICacheStorage, account: AccountEntity): void {
        const key = account.generateAccountKey();
        cacheStorage.setItem(
            key,
            account,
            CacheSchemaType.ACCOUNT
        );
    }

    /**
     * saves credential - accessToken, idToken or refreshToken into cache
     * @param credential
     */
    private static saveCredential(cacheStorage: ICacheStorage, credential: Credential): void {
        const key = credential.generateCredentialKey();
        cacheStorage.setItem(
            key,
            credential,
            CacheSchemaType.CREDENTIAL
        );
    }

    /**
     * saves access token credential
     * @param credential 
     */
    private static saveAccessToken(cacheStorage: ICacheStorage, credential: AccessTokenEntity, clientId: string, responseScopes: ScopeSet): void {
        const currentTokenCache = this.getCredentialsFilteredBy(
            cacheStorage,
            {
                clientId: credential.clientId,
                credentialType: CredentialType.ACCESS_TOKEN,
                environment: credential.environment,
                homeAccountId: credential.homeAccountId,
                realm: credential.realm
            }
        );
        const currentAccessTokens: AccessTokenEntity[] = Object.values(currentTokenCache.accessTokens) as AccessTokenEntity[];
        if (currentAccessTokens) {
            currentAccessTokens.forEach((tokenEntity) => {
                const tokenScopeSet = ScopeSet.fromString(tokenEntity.target);
                if (tokenScopeSet.intersectingScopeSets(responseScopes)) {
                    this.removeCredential(cacheStorage, tokenEntity);
                }
            });
        }
        this.saveCredential(cacheStorage, credential);
    }

    /**
     * Given account key retrieve an account
     * @param key
     */
    static getAccount(cacheStorage: ICacheStorage, key: string): AccountEntity {
        const account = cacheStorage.getItem(
            key,
            CacheSchemaType.ACCOUNT
        ) as AccountEntity;
        return account;
    }

    /**
     * retrieve a credential - accessToken, idToken or refreshToken; given the cache key
     * @param key
     */
    static getCredential(cacheStorage: ICacheStorage, key: string): Credential {
        return cacheStorage.getItem(
            key,
            CacheSchemaType.CREDENTIAL
        ) as Credential;
    }

    /**
     * retrieve accounts matching all provided filters; if no filter is set, get all accounts
     * not checking for casing as keys are all generated in lower case, remember to convert to lower case if object properties are compared
     * @param homeAccountId
     * @param environment
     * @param realm
     */
    static getAccountsFilteredBy(cacheStorage: ICacheStorage, accountFilter?: AccountFilter): AccountCache {
        return this.getAccountsFilteredByInternal(
            cacheStorage,
            accountFilter ? accountFilter.homeAccountId : "",
            accountFilter ? accountFilter.environment : "",
            accountFilter ? accountFilter.realm : ""
        );
    }

    /**
     * retrieve accounts matching all provided filters; if no filter is set, get all accounts
     * not checking for casing as keys are all generated in lower case, remember to convert to lower case if object properties are compared
     * @param homeAccountId
     * @param environment
     * @param realm
     */
    private static getAccountsFilteredByInternal(
        cacheStorage: ICacheStorage,
        homeAccountId?: string,
        environment?: string,
        realm?: string
    ): AccountCache {
        const allCacheKeys = cacheStorage.getKeys();
        const matchingAccounts: AccountCache = {};

        allCacheKeys.forEach((cacheKey) => {
            let matches: boolean = true;
            // don't parse any non-credential type cache entities
            if (CacheHelper.getCredentialType(cacheKey) !== Constants.NOT_DEFINED || CacheHelper.isAppMetadata(cacheKey)) {
                return;
            }
            const entity: AccountEntity = cacheStorage.getItem(cacheKey, CacheSchemaType.ACCOUNT) as AccountEntity;

            if (!StringUtils.isEmpty(homeAccountId)) {
                matches = CacheHelper.matchHomeAccountId(entity, homeAccountId);
            }

            if (!StringUtils.isEmpty(environment)) {
                matches =
                    matches &&
                    CacheHelper.matchEnvironment(entity, environment);
            }

            if (!StringUtils.isEmpty(realm)) {
                matches = matches && CacheHelper.matchRealm(entity, realm);
            }

            if (matches) {
                matchingAccounts[cacheKey] = entity;
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
    static getCredentialsFilteredBy(cacheStorage: ICacheStorage, filter: CredentialFilter): CredentialCache {
        return this.getCredentialsFilteredByInternal(
            cacheStorage,
            filter.homeAccountId,
            filter.environment,
            filter.credentialType,
            filter.clientId,
            filter.realm,
            filter.target
        );
    }

    /**
     * Support function to help match credentials
     * @param homeAccountId
     * @param environment
     * @param credentialType
     * @param clientId
     * @param realm
     * @param target
     */
    private static getCredentialsFilteredByInternal(
        cacheStorage: ICacheStorage,
        homeAccountId?: string,
        environment?: string,
        credentialType?: string,
        clientId?: string,
        realm?: string,
        target?: string
    ): CredentialCache {
        const allCacheKeys = cacheStorage.getKeys();
        const matchingCredentials: CredentialCache = {
            idTokens: {},
            accessTokens: {},
            refreshTokens: {}
        };

        allCacheKeys.forEach((cacheKey) => {
            let matches: boolean = true;
            // don't parse any non-credential type cache entities
            const credType = CacheHelper.getCredentialType(cacheKey);
            if (credType === Constants.NOT_DEFINED) {
                return;
            }

            const entity: Credential = cacheStorage.getItem(cacheKey, CacheSchemaType.CREDENTIAL) as Credential;

            if (!StringUtils.isEmpty(homeAccountId)) {
                matches = CacheHelper.matchHomeAccountId(
                    entity,
                    homeAccountId
                );
            }

            if (!StringUtils.isEmpty(environment)) {
                matches =
                    matches &&
                    CacheHelper.matchEnvironment(entity, environment);
            }

            if (!StringUtils.isEmpty(realm)) {
                matches = matches && CacheHelper.matchRealm(entity, realm);
            }

            if (!StringUtils.isEmpty(credentialType)) {
                matches =
                    matches &&
                    CacheHelper.matchCredentialType(entity, credentialType);
            }

            if (!StringUtils.isEmpty(clientId)) {
                matches =
                    matches && CacheHelper.matchClientId(entity, clientId);
            }

            // idTokens do not have "target", target specific refreshTokens do exist for some types of authentication
            // TODO: Add case for target specific refresh tokens
            if (!StringUtils.isEmpty(target) && credType === CredentialType.ACCESS_TOKEN) {
                matches = matches && CacheHelper.matchTarget(entity, target);
            }

            if (matches) {
                switch (credType) {
                    case CredentialType.ID_TOKEN:
                        matchingCredentials.idTokens[cacheKey] = entity as IdTokenEntity;
                        break;
                    case CredentialType.ACCESS_TOKEN:
                        matchingCredentials.accessTokens[cacheKey] = entity as AccessTokenEntity;
                        break;
                    case CredentialType.REFRESH_TOKEN:
                        matchingCredentials.refreshTokens[cacheKey] = entity as RefreshTokenEntity;
                        break;
                }
            }
        });

        return matchingCredentials;
    }

    /**
     * returns a boolean if the given account is removed
     * @param account
     */
    static removeAccount(cacheStorage: ICacheStorage, accountKey: string): boolean {
        const account = this.getAccount(cacheStorage, accountKey) as AccountEntity;
        return (this.removeAccountContext(cacheStorage, account) && cacheStorage.removeItem(accountKey, CacheSchemaType.ACCOUNT));
    }

    /**
     * returns a boolean if the given account is removed
     * @param account
     */
    static removeAccountContext(cacheStorage: ICacheStorage, account: AccountEntity): boolean {
        const allCacheKeys = cacheStorage.getKeys();
        const accountId = account.generateAccountId();

        allCacheKeys.forEach((cacheKey) => {
            // don't parse any non-credential type cache entities
            if (CacheHelper.getCredentialType(cacheKey) === Constants.NOT_DEFINED) {
                return;
            }

            const cacheEntity: Credential = cacheStorage.getItem(cacheKey, CacheSchemaType.CREDENTIAL) as Credential;

            if (!!cacheEntity && accountId === cacheEntity.generateAccountId()) {
                this.removeCredential(cacheStorage, cacheEntity);
            }
        });

        return true;
    }

    /**
     * returns a boolean if the given credential is removed
     * @param credential
     */
    static removeCredential(cacheStorage: ICacheStorage, credential: Credential): boolean {
        const key = credential.generateCredentialKey();
        return cacheStorage.removeItem(key, CacheSchemaType.CREDENTIAL);
    }
}
