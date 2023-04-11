/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientConfiguration, Constants, PkceCodes, ClientAuthError, AccountEntity, AppMetadataEntity, ThrottlingEntity, IdTokenEntity, AccessTokenEntity, RefreshTokenEntity, ProtocolMode , AuthorityFactory, AuthorityOptions, AuthorityMetadataEntity, ValidCredentialType, Logger, LogLevel, TokenKeys } from "../../src";
import { AUTHENTICATION_RESULT, ID_TOKEN_CLAIMS, RANDOM_TEST_GUID, TEST_CONFIG, TEST_CRYPTO_VALUES, TEST_POP_VALUES, TEST_TOKENS } from "../test_kit/StringConstants";

import { CacheManager } from "../../src/cache/CacheManager";
import { ServerTelemetryEntity } from "../../src/cache/entities/ServerTelemetryEntity";

const ACCOUNT_KEYS = "ACCOUNT_KEYS";
const TOKEN_KEYS = "TOKEN_KEYS";

export class MockStorageClass extends CacheManager {
    store = {};

    // Accounts
    getAccount(key: string): AccountEntity | null {
        const account: AccountEntity = this.store[key] as AccountEntity;
        if (AccountEntity.isAccountEntity(account)) {
            return account;
        }
        return null;
    }

    setAccount(value: AccountEntity): void {
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
        const currentAccounts = this.getAccountKeys();
        const removalIndex = currentAccounts.indexOf(key);
        if (removalIndex > -1) {
            currentAccounts.splice(removalIndex, 1);
            this.store[ACCOUNT_KEYS] = currentAccounts;
        }
    }

    getAccountKeys(): string[] {
        return this.store[ACCOUNT_KEYS] || [];
    }

    getTokenKeys(): TokenKeys {
        return this.store[TOKEN_KEYS] || {
            idToken: [],
            accessToken: [],
            refreshToken: []
        }
    }

    // Credentials (idtokens)
    getIdTokenCredential(key: string): IdTokenEntity | null {
        return this.store[key] as IdTokenEntity || null;
    }
    setIdTokenCredential(value: IdTokenEntity): void {
        const key = value.generateCredentialKey();
        this.store[key] = value;

        const tokenKeys = this.getTokenKeys();
        if (!tokenKeys.idToken.includes(key)) {
            tokenKeys.idToken.push(key);
            this.store[TOKEN_KEYS] = tokenKeys;
        }
    }

    // Credentials (accesstokens)
    getAccessTokenCredential(key: string): AccessTokenEntity | null {
        return this.store[key] as AccessTokenEntity || null;
    }
    setAccessTokenCredential(value: AccessTokenEntity): void {
        const key = value.generateCredentialKey();
        this.store[key] = value;

        const tokenKeys = this.getTokenKeys();
        if (!tokenKeys.accessToken.includes(key)) {
            tokenKeys.accessToken.push(key);
            this.store[TOKEN_KEYS] = tokenKeys;
        }
    }

    // Credentials (accesstokens)
    getRefreshTokenCredential(key: string): RefreshTokenEntity | null {
        return this.store[key] as RefreshTokenEntity || null;
    }
    setRefreshTokenCredential(value: RefreshTokenEntity): void {
        const key = value.generateCredentialKey();
        this.store[key] = value;

        const tokenKeys = this.getTokenKeys();
        if (!tokenKeys.refreshToken.includes(key)) {
            tokenKeys.refreshToken.push(key);
            this.store[TOKEN_KEYS] = tokenKeys;
        }
    }

    // AppMetadata
    getAppMetadata(key: string): AppMetadataEntity | null {
        return this.store[key] as AppMetadataEntity;
    }
    setAppMetadata(value: AppMetadataEntity): void {
        const key = value.generateAppMetadataKey();
        this.store[key] = value;
    }

    // Telemetry cache
    getServerTelemetry(key: string): ServerTelemetryEntity | null {
        return this.store[key] as ServerTelemetryEntity;
    }
    setServerTelemetry(key: string, value: ServerTelemetryEntity): void {
        this.store[key] = value;
    }

    // Authority Metadata Cache
    getAuthorityMetadata(key: string): AuthorityMetadataEntity | null {
        return this.store[key] as AuthorityMetadataEntity;
    }
    setAuthorityMetadata(key: string, value: AuthorityMetadataEntity): void {
        this.store[key] = value;
    }

    // Throttling cache
    getThrottlingCache(key: string): ThrottlingEntity | null {
        return this.store[key] as ThrottlingEntity;
    }
    setThrottlingCache(key: string, value: ThrottlingEntity): void {
        this.store[key] = value;
    }

    removeItem(key: string): void {
        if (!!this.store[key]) {
            delete this.store[key];
        }
    }
    containsKey(key: string): boolean {
        return !!this.store[key];
    }
    getKeys(): string[] {
        return Object.keys(this.store);
    }
    getAuthorityMetadataKeys(): string[] {
        return this.getKeys();
    }
    async clear(): Promise<void> {
        this.store = {};
    }
    updateCredentialCacheKey(currentCacheKey: string, credential: ValidCredentialType): string {
        const updatedCacheKey = credential.generateCredentialKey();

        if (currentCacheKey !== updatedCacheKey) {
            const cacheItem = this.store[currentCacheKey];
            if (cacheItem) {
                this.removeItem(currentCacheKey);
                this.store[updatedCacheKey] = cacheItem;
                return updatedCacheKey;
            }
        }

        return currentCacheKey;
    }
}

export const mockCrypto = {
    createNewGuid(): string {
        return RANDOM_TEST_GUID;
    },
    base64Decode(input: string): string {
        if (AUTHENTICATION_RESULT.body.id_token.includes(input)) {
            return JSON.stringify(ID_TOKEN_CLAIMS);
        }
        switch (input) {
            case TEST_POP_VALUES.ENCODED_REQ_CNF:
                return TEST_POP_VALUES.DECODED_REQ_CNF;
            case TEST_TOKENS.POP_TOKEN_PAYLOAD:
                return TEST_TOKENS.DECODED_POP_TOKEN_PAYLOAD;
            default:
                return input;
        }
    },
    base64Encode(input: string): string {
        switch (input) {
            case TEST_POP_VALUES.DECODED_REQ_CNF:
                return TEST_POP_VALUES.ENCODED_REQ_CNF;
            default:
                return input;
        }
    },
    async generatePkceCodes(): Promise<PkceCodes> {
        return {
            challenge: TEST_CONFIG.TEST_CHALLENGE,
            verifier: TEST_CONFIG.TEST_VERIFIER,
        };
    },
    async getPublicKeyThumbprint(): Promise<string> {
        return TEST_POP_VALUES.KID;
    },
    async removeTokenBindingKey(keyId: string): Promise<boolean> {
        return Promise.resolve(true);
    },
    async signJwt(): Promise<string> {
        return "";
    },
    async clearKeystore(): Promise<boolean> {
        return Promise.resolve(true);
    },
    async hashString(): Promise<string> {
        return Promise.resolve(TEST_CRYPTO_VALUES.TEST_SHA256_HASH);
    }
};

export class ClientTestUtils {
    
    static async createTestClientConfiguration(): Promise<ClientConfiguration>{
        const mockStorage = new MockStorageClass(TEST_CONFIG.MSAL_CLIENT_ID, mockCrypto, new Logger({}));

        const testLoggerCallback = (): void => {
            return;
        };

        const mockHttpClient = {
            sendGetRequestAsync<T>(): T {
                return {} as T;
            },
            sendPostRequestAsync<T>(): T {
                return {} as T;
            }
        };

        const authorityOptions: AuthorityOptions = {
            protocolMode: ProtocolMode.AAD,
            knownAuthorities: [TEST_CONFIG.validAuthority],
            cloudDiscoveryMetadata: "",
            authorityMetadata: ""
        };

        const loggerOptions = {
            loggerCallback: (): void => {},
            piiLoggingEnabled: true,
            logLevel: LogLevel.Verbose
        };
        const logger = new Logger(loggerOptions);

        const authority  = AuthorityFactory.createInstance(TEST_CONFIG.validAuthority, mockHttpClient, mockStorage, authorityOptions, logger);

        await authority.resolveEndpointsAsync().catch(error => {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError(error);
        });

        return {
            authOptions: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                authority: authority
            },
            storageInterface: mockStorage,
            networkInterface: mockHttpClient,
            cryptoInterface: mockCrypto,
            loggerOptions: {
                loggerCallback: testLoggerCallback,
            },
            systemOptions: {
                tokenRenewalOffsetSeconds: TEST_CONFIG.DEFAULT_TOKEN_RENEWAL_OFFSET
            },
            clientCredentials: {
                clientSecret: TEST_CONFIG.MSAL_CLIENT_SECRET,
            },
            libraryInfo: {
                sku: Constants.SKU,
                version: TEST_CONFIG.TEST_VERSION,
                os: TEST_CONFIG.TEST_OS,
                cpu: TEST_CONFIG.TEST_CPU,
            },
            telemetry: {
                application: {
                    appName: TEST_CONFIG.applicationName,
                    appVersion: TEST_CONFIG.applicationVersion
                }
            }
        };
    }
}
