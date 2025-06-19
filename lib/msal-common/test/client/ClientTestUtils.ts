/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    RANDOM_TEST_GUID,
    TEST_CONFIG,
    TEST_CRYPTO_VALUES,
    TEST_POP_VALUES,
    TEST_TOKENS,
} from "../test_kit/StringConstants.js";

import { CacheManager } from "../../src/cache/CacheManager.js";
import { ServerTelemetryEntity } from "../../src/cache/entities/ServerTelemetryEntity.js";
import { AccountEntity } from "../../src/cache/entities/AccountEntity.js";
import { IdTokenEntity } from "../../src/cache/entities/IdTokenEntity.js";
import * as CacheHelpers from "../../src/cache/utils/CacheHelpers.js";
import { AccessTokenEntity } from "../../src/cache/entities/AccessTokenEntity.js";
import { RefreshTokenEntity } from "../../src/cache/entities/RefreshTokenEntity.js";
import { AppMetadataEntity } from "../../src/cache/entities/AppMetadataEntity.js";
import { AuthorityMetadataEntity } from "../../src/cache/entities/AuthorityMetadataEntity.js";
import { ThrottlingEntity } from "../../src/cache/entities/ThrottlingEntity.js";
import { ProtocolMode } from "../../src/authority/ProtocolMode.js";
import { ClientConfiguration } from "../../src/config/ClientConfiguration.js";
import { Logger, LogLevel } from "../../src/logger/Logger.js";
import { Authority } from "../../src/authority/Authority.js";
import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../../src/error/ClientAuthError.js";
import { ServerTelemetryManager } from "../../src/telemetry/server/ServerTelemetryManager.js";
import { SKU } from "../../src/utils/Constants.js";
import { AuthorityOptions } from "../../src/authority/AuthorityOptions.js";
import { TokenKeys } from "../../src/cache/utils/CacheTypes.js";
import * as AccountEntityUtils from "../../src/cache/utils/AccountEntityUtils.js";
import { EncodingTypes } from "../../src/utils/Constants.js";
import { StubPerformanceClient } from "../../src/telemetry/performance/StubPerformanceClient.js";

const ACCOUNT_KEYS = "ACCOUNT_KEYS";
const TOKEN_KEYS = "TOKEN_KEYS";

export class MockStorageClass extends CacheManager {
    store = {};

    // Accounts
    getAccount(key: string): AccountEntity | null {
        const account: AccountEntity = this.store[key] as AccountEntity;
        if (AccountEntityUtils.isAccountEntity(account)) {
            return account;
        }
        return null;
    }

    async setAccount(value: AccountEntity): Promise<void> {
        const key = AccountEntityUtils.generateAccountKey(value);
        this.store[key] = value;

        const currentAccounts = this.getAccountKeys();
        if (!currentAccounts.includes(key)) {
            currentAccounts.push(key);
            this.store[ACCOUNT_KEYS] = currentAccounts;
        }
    }

    removeAccount(key: string): void {
        super.removeAccount(key, RANDOM_TEST_GUID);
        const currentAccounts = this.getAccountKeys();
        const removalIndex = currentAccounts.indexOf(key);
        if (removalIndex > -1) {
            currentAccounts.splice(removalIndex, 1);
            this.store[ACCOUNT_KEYS] = currentAccounts;
        }
    }

    getAccountKeys(): string[] {
        return [...(this.store[ACCOUNT_KEYS] || [])];
    }

    getTokenKeys(): TokenKeys {
        return {
            ...(this.store[TOKEN_KEYS] || {
                idToken: [],
                accessToken: [],
                refreshToken: [],
            }),
        } as TokenKeys;
    }

    // Credentials (idtokens)
    getIdTokenCredential(key: string): IdTokenEntity | null {
        return (this.store[key] as IdTokenEntity) || null;
    }
    async setIdTokenCredential(value: IdTokenEntity): Promise<void> {
        const key = CacheHelpers.generateCredentialKey(value);
        this.store[key] = value;

        const tokenKeys = this.getTokenKeys();
        if (!tokenKeys.idToken.includes(key)) {
            tokenKeys.idToken.push(key);
            this.store[TOKEN_KEYS] = tokenKeys;
        }
    }

    // Credentials (accesstokens)
    getAccessTokenCredential(key: string): AccessTokenEntity | null {
        return (this.store[key] as AccessTokenEntity) || null;
    }
    async setAccessTokenCredential(value: AccessTokenEntity): Promise<void> {
        const key = CacheHelpers.generateCredentialKey(value);
        this.store[key] = value;

        const tokenKeys = this.getTokenKeys();
        if (!tokenKeys.accessToken.includes(key)) {
            tokenKeys.accessToken.push(key);
            this.store[TOKEN_KEYS] = tokenKeys;
        }
    }

    // Credentials (accesstokens)
    getRefreshTokenCredential(key: string): RefreshTokenEntity | null {
        return (this.store[key] as RefreshTokenEntity) || null;
    }
    async setRefreshTokenCredential(value: RefreshTokenEntity): Promise<void> {
        const key = CacheHelpers.generateCredentialKey(value);
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
        const key = CacheHelpers.generateAppMetadataKey(value);
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
        this.store[key] = { ...value };
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
            // Update token keys
            const tokenKeys = this.store[TOKEN_KEYS];
            if (tokenKeys?.accessToken.includes(key)) {
                const index = tokenKeys?.accessToken.indexOf(key);
                tokenKeys.accessToken.splice(index, 1);
            }
            if (tokenKeys?.idToken.includes(key)) {
                const index = tokenKeys?.idToken.indexOf(key);
                tokenKeys.idToken.splice(index, 1);
            }
            this.store[TOKEN_KEYS] = tokenKeys;
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
}

export const mockCrypto = {
    createNewGuid(): string {
        return RANDOM_TEST_GUID;
    },
    base64Decode(input: string): string {
        return Buffer.from(input, EncodingTypes.BASE64).toString("utf8");
    },
    base64Encode(input: string): string {
        return Buffer.from(input, EncodingTypes.UTF8).toString(
            EncodingTypes.BASE64
        );
    },
    base64UrlEncode(input: string): string {
        return Buffer.from(input, EncodingTypes.UTF8).toString("base64url");
    },
    encodeKid(input: string): string {
        return Buffer.from(
            JSON.stringify({ kid: input }),
            EncodingTypes.UTF8
        ).toString("base64url");
    },
    async getPublicKeyThumbprint(): Promise<string> {
        return TEST_POP_VALUES.KID;
    },
    async removeTokenBindingKey(keyId: string): Promise<void> {
        return Promise.resolve();
    },
    async signJwt(): Promise<string> {
        return TEST_TOKENS.POP_TOKEN;
    },
    async clearKeystore(): Promise<boolean> {
        return Promise.resolve(true);
    },
    async hashString(): Promise<string> {
        return Promise.resolve(TEST_CRYPTO_VALUES.TEST_SHA256_HASH);
    },
};

export class ClientTestUtils {
    static async createTestClientConfiguration(
        telem: boolean = false,
        protocolMode: ProtocolMode = ProtocolMode.AAD
    ): Promise<ClientConfiguration> {
        const mockStorage = new MockStorageClass(
            TEST_CONFIG.MSAL_CLIENT_ID,
            mockCrypto,
            new Logger({}),
            new StubPerformanceClient(),
            {
                canonicalAuthority: TEST_CONFIG.validAuthority,
            }
        );

        const testLoggerCallback = (): void => {
            return;
        };

        const mockHttpClient = {
            sendGetRequestAsync<T>(): T {
                return {} as T;
            },
            sendPostRequestAsync<T>(): T {
                return {} as T;
            },
        };

        const authority = await getDiscoveredAuthority(
            protocolMode,
            mockStorage
        );

        let serverTelemetryManager = null;

        if (telem) {
            serverTelemetryManager = new ServerTelemetryManager(
                {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    correlationId: TEST_CONFIG.CORRELATION_ID,
                    apiId: 866,
                },
                mockStorage
            );
        }

        return {
            authOptions: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                authority: authority,
                redirectUri: "https://localhost",
            },
            storageInterface: mockStorage,
            networkInterface: mockHttpClient,
            cryptoInterface: mockCrypto,
            loggerOptions: {
                loggerCallback: testLoggerCallback,
            },
            systemOptions: {
                tokenRenewalOffsetSeconds:
                    TEST_CONFIG.DEFAULT_TOKEN_RENEWAL_OFFSET,
            },
            clientCredentials: {
                clientSecret: TEST_CONFIG.MSAL_CLIENT_SECRET,
            },
            libraryInfo: {
                sku: SKU,
                version: TEST_CONFIG.TEST_VERSION,
                os: TEST_CONFIG.TEST_OS,
                cpu: TEST_CONFIG.TEST_CPU,
            },
            telemetry: {
                application: {
                    appName: TEST_CONFIG.applicationName,
                    appVersion: TEST_CONFIG.applicationVersion,
                },
            },
            serverTelemetryManager: serverTelemetryManager,
        };
    }
}

export async function getDiscoveredAuthority(
    protocolMode: ProtocolMode = ProtocolMode.AAD,
    mockStorage: MockStorageClass = new MockStorageClass(
        TEST_CONFIG.MSAL_CLIENT_ID,
        mockCrypto,
        new Logger({}),
        new StubPerformanceClient(),
        {
            canonicalAuthority: TEST_CONFIG.validAuthority,
        }
    )
): Promise<Authority> {
    const mockHttpClient = {
        sendGetRequestAsync<T>(): T {
            return {} as T;
        },
        sendPostRequestAsync<T>(): T {
            return {} as T;
        },
    };

    const authorityOptions: AuthorityOptions = {
        protocolMode: protocolMode,
        knownAuthorities: [TEST_CONFIG.validAuthority],
        cloudDiscoveryMetadata: "",
        authorityMetadata: "",
    };

    const loggerOptions = {
        loggerCallback: (): void => {},
        piiLoggingEnabled: true,
        logLevel: LogLevel.Verbose,
    };
    const logger = new Logger(loggerOptions);

    const authority = new Authority(
        TEST_CONFIG.validAuthority,
        mockHttpClient,
        mockStorage,
        authorityOptions,
        logger,
        TEST_CONFIG.CORRELATION_ID
    );

    await authority.resolveEndpointsAsync().catch((error) => {
        throw createClientAuthError(
            ClientAuthErrorCodes.endpointResolutionError
        );
    });

    return authority;
}
