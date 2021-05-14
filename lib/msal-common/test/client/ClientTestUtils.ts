/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientConfiguration, Constants, PkceCodes, ClientAuthError, AccountEntity, CredentialEntity, AppMetadataEntity, ThrottlingEntity, IdTokenEntity, AccessTokenEntity, RefreshTokenEntity, CredentialType, ProtocolMode , AuthorityFactory, AuthorityOptions, AuthorityMetadataEntity } from "../../src";
import { RANDOM_TEST_GUID, TEST_CONFIG, TEST_POP_VALUES, TEST_TOKENS } from "../test_kit/StringConstants";

import { CacheManager } from "../../src/cache/CacheManager";
import { ServerTelemetryEntity } from "../../src/cache/entities/ServerTelemetryEntity";

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
    }

    // Credentials (idtokens)
    getIdTokenCredential(key: string): IdTokenEntity | null {
        const credType = CredentialEntity.getCredentialType(key);
        if (credType === CredentialType.ID_TOKEN) {
            return this.store[key] as IdTokenEntity;
        }
        return null;
    }
    setIdTokenCredential(value: IdTokenEntity): void {
        const key = value.generateCredentialKey();
        this.store[key] = value;
    }

    // Credentials (accesstokens)
    getAccessTokenCredential(key: string): AccessTokenEntity | null {
        const credType = CredentialEntity.getCredentialType(key);
        if (credType === CredentialType.ACCESS_TOKEN || credType === CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME) {
            return this.store[key] as AccessTokenEntity;
        }
        return null;
    }
    setAccessTokenCredential(value: AccessTokenEntity): void {
        const key = value.generateCredentialKey();
        this.store[key] = value;
    }

    // Credentials (accesstokens)
    getRefreshTokenCredential(key: string): RefreshTokenEntity | null {
        const credType = CredentialEntity.getCredentialType(key);
        if (credType === CredentialType.REFRESH_TOKEN) {
            return this.store[key] as RefreshTokenEntity;
        }
        return null;
    }
    setRefreshTokenCredential(value: RefreshTokenEntity): void {
        const key = value.generateCredentialKey();
        this.store[key] = value;
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
    getAuthorityMetadataKeys(): string[] {
        return this.getKeys();
    }
    clear(): void {
        this.store = {};
    }
}

export const mockCrypto = {
    createNewGuid(): string {
        return RANDOM_TEST_GUID;
    },
    base64Decode(input: string): string {
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
    async getAsymmetricPublicKey(): Promise<string> {
        return TEST_POP_VALUES.DECODED_STK_JWK_THUMBPRINT;
    },
    async signJwt(): Promise<string> {
        return "";
    }
};

export class ClientTestUtils {
    
    static async createTestClientConfiguration(): Promise<ClientConfiguration>{
        const mockStorage = new MockStorageClass(TEST_CONFIG.MSAL_CLIENT_ID, mockCrypto);

        const testLoggerCallback = (): void => {
            return;
        };

        const mockHttpClient = {
            sendGetRequestAsync<T>(): T {
                return null;
            },
            sendPostRequestAsync<T>(): T {
                return null;
            }
        };

        const authorityOptions: AuthorityOptions = {
            protocolMode: ProtocolMode.AAD,
            knownAuthorities: [TEST_CONFIG.validAuthority],
            cloudDiscoveryMetadata: "",
            authorityMetadata: ""
        };
        const authority  = AuthorityFactory.createInstance(TEST_CONFIG.validAuthority, mockHttpClient, mockStorage, authorityOptions);

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
            clientCredentials: {
                clientSecret: TEST_CONFIG.MSAL_CLIENT_SECRET,
            },
            libraryInfo: {
                sku: Constants.SKU,
                version: TEST_CONFIG.TEST_VERSION,
                os: TEST_CONFIG.TEST_OS,
                cpu: TEST_CONFIG.TEST_CPU,
            },
        };
    }
}
