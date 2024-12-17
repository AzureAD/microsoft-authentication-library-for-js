/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    CacheManager,
    AccountEntity,
    IdTokenEntity,
    AccessTokenEntity,
    RefreshTokenEntity,
    AppMetadataEntity,
    ServerTelemetryEntity,
    ThrottlingEntity,
    AuthorityMetadataEntity,
    ValidCredentialType,
    TokenKeys,
    CacheHelpers,
} from "@azure/msal-common";

const ACCOUNT_KEYS = "ACCOUNT_KEYS";
const TOKEN_KEYS = "TOKEN_KEYS";

export class TestStorageManager extends CacheManager {
    store = {};

    // Accounts
    getAccount(key: string): AccountEntity | null {
        const account = this.store[key] as AccountEntity;
        if (!account) {
            this.removeAccountKeyFromMap(key);
            return null;
        }

        return account;
    }

    removeAccountKeyFromMap(key: string): void {
        const currentAccounts = this.getAccountKeys();
        this.store[ACCOUNT_KEYS] = currentAccounts.filter(
            (entry) => entry !== key
        );
    }

    async setAccount(value: AccountEntity): Promise<void> {
        const key = value.generateAccountKey();
        this.store[key] = value;

        const currentAccounts = this.getAccountKeys();
        if (!currentAccounts.includes(key)) {
            currentAccounts.push(key);
            this.store[ACCOUNT_KEYS] = currentAccounts;
        }
    }

    async removeAccount(key: string): Promise<void> {
        await super.removeAccount(key);
        this.removeAccountKeyFromMap(key);
    }

    getAccountKeys(): string[] {
        return this.store[ACCOUNT_KEYS] || [];
    }

    getTokenKeys(): TokenKeys {
        return (
            this.store[TOKEN_KEYS] || {
                idToken: [],
                accessToken: [],
                refreshToken: [],
            }
        );
    }

    // Credentials (idtokens)
    getIdTokenCredential(key: string): IdTokenEntity | null {
        return (this.store[key] as IdTokenEntity) || null;
    }

    async setIdTokenCredential(idToken: IdTokenEntity): Promise<void> {
        const idTokenKey = CacheHelpers.generateCredentialKey(idToken);
        this.store[idTokenKey] = idToken;

        const tokenKeys = this.getTokenKeys();
        tokenKeys.idToken.push(idTokenKey);
        this.store[TOKEN_KEYS] = tokenKeys;
    }

    // Credentials (accesstokens)
    getAccessTokenCredential(key: string): AccessTokenEntity | null {
        return (this.store[key] as AccessTokenEntity) || null;
    }

    async setAccessTokenCredential(
        accessToken: AccessTokenEntity
    ): Promise<void> {
        const accessTokenKey = CacheHelpers.generateCredentialKey(accessToken);
        this.store[accessTokenKey] = accessToken;

        const tokenKeys = this.getTokenKeys();
        tokenKeys.accessToken.push(accessTokenKey);
        this.store[TOKEN_KEYS] = tokenKeys;
    }

    // Credentials (accesstokens)
    getRefreshTokenCredential(key: string): RefreshTokenEntity | null {
        return (this.store[key] as RefreshTokenEntity) || null;
    }
    async setRefreshTokenCredential(
        refreshToken: RefreshTokenEntity
    ): Promise<void> {
        const refreshTokenKey =
            CacheHelpers.generateCredentialKey(refreshToken);
        this.store[refreshTokenKey] = refreshToken;

        const tokenKeys = this.getTokenKeys();
        tokenKeys.refreshToken.push(refreshTokenKey);
        this.store[TOKEN_KEYS] = tokenKeys;
    }

    // AppMetadata
    getAppMetadata(key: string): AppMetadataEntity | null {
        return this.store[key] as AppMetadataEntity;
    }

    setAppMetadata(appMetadata: AppMetadataEntity): void {
        const appMetadataKey = CacheHelpers.generateAppMetadataKey(appMetadata);
        this.store[appMetadataKey] = appMetadata;
    }

    // AuthorityMetadata
    getAuthorityMetadata(key: string): AuthorityMetadataEntity | null {
        return this.store[key] as AuthorityMetadataEntity;
    }

    setAuthorityMetadata(key: string, value: AuthorityMetadataEntity): void {
        this.store[key] = value;
    }

    getAuthorityMetadataKeys(): Array<string> {
        const allKeys = this.getKeys();
        return allKeys.filter((key: string) => {
            return this.isAuthorityMetadata(key);
        });
    }

    // Telemetry cache
    getServerTelemetry(key: string): ServerTelemetryEntity | null {
        return this.store[key] as ServerTelemetryEntity;
    }
    setServerTelemetry(key: string, value: ServerTelemetryEntity): void {
        this.store[key] = value;
    }

    // Throttling cache
    getThrottlingCache(key: string): ThrottlingEntity | null {
        return this.store[key] as ThrottlingEntity;
    }
    setThrottlingCache(key: string, value: ThrottlingEntity): void {
        this.store[key] = value;
    }

    removeItem(key: string): boolean {
        let result: boolean = false;
        if (!!this.store[key]) {
            delete this.store[key];
            result = true;
        }
        return result;
    }
    containsKey(key: string): boolean {
        return !!this.store[key];
    }
    getKeys(): string[] {
        return Object.keys(this.store);
    }
    async clear(): Promise<void> {
        this.store = {};
    }
}
