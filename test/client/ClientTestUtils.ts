/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientConfiguration, Constants, LogLevel, NetworkRequestOptions, PkceCodes, ClientAuthError, AccountEntity, CredentialEntity, AppMetadataEntity, ThrottlingEntity, IdTokenEntity, AccessTokenEntity, RefreshTokenEntity, CredentialType, ProtocolMode , AuthorityFactory } from "../../src";
import { RANDOM_TEST_GUID, TEST_CONFIG, TEST_POP_VALUES } from "../utils/StringConstants";

import { TrustedAuthority } from "../../src/authority/TrustedAuthority";
import sinon from "sinon";
import { CloudDiscoveryMetadata } from "../../src/authority/CloudDiscoveryMetadata";
import { CacheManager } from "../../src/cache/CacheManager";
import { ServerTelemetryEntity } from "../../src/cache/entities/ServerTelemetryEntity";

/* eslint-disable */
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
    setAccount(key: string, value: AccountEntity): void {
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
    setIdTokenCredential(key: string, value: CredentialEntity): void {
        this.store[key] = value;
    }

    // Credentials (accesstokens)
    getAccessTokenCredential(key: string): AccessTokenEntity | null {
        const credType = CredentialEntity.getCredentialType(key);
        if (credType === CredentialType.ACCESS_TOKEN) {
            return this.store[key] as AccessTokenEntity;
        }
        return null;
    }
    setAccessTokenCredential(key: string, value: AccessTokenEntity): void {
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
    setRefreshTokenCredential(key: string, value: RefreshTokenEntity): void {
        this.store[key] = value;
    }

    // AppMetadata
    getAppMetadata(key: string): AppMetadataEntity | null {
        return this.store[key] as AppMetadataEntity;
    }
    setAppMetadata(key: string, value: AppMetadataEntity): void {
        this.store[key] = value;
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
    clear(): void {
        this.store = {};
    }
}

export class ClientTestUtils {

    static async createTestClientConfiguration(): Promise<ClientConfiguration>{

        const testLoggerCallback = (level: LogLevel, message: string, containsPii: boolean): void => {
            if (containsPii) {
                console.log(`Log level: ${level} Message: ${message}`);
            }
        };

        const mockHttpClient = {
            sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                return null;
            },
            sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                return null;
            }
        };

        const authority  = AuthorityFactory.createInstance(TEST_CONFIG.validAuthority, mockHttpClient, ProtocolMode.AAD);

        await authority.resolveEndpointsAsync().catch(error => {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError(error);
        });

        return {
            authOptions: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                authority: authority,
                knownAuthorities: [],
            },
            storageInterface: new MockStorageClass(),
            networkInterface: {
                sendGetRequestAsync<T>(
                    url: string,
                    options?: NetworkRequestOptions
                ): T {
                    return null;
                },
                sendPostRequestAsync<T>(
                    url: string,
                    options?: NetworkRequestOptions
                ): T {
                    return null;
                },
            },
            cryptoInterface: {
                createNewGuid(): string {
                    return RANDOM_TEST_GUID;
                },
                base64Decode(input: string): string {
                    switch (input) {
                        case TEST_POP_VALUES.ENCODED_REQ_CNF:
                            return TEST_POP_VALUES.DECODED_REQ_CNF;
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
                async signJwt(): Promise<string> {
                    return "";
                }
            },
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

    static setCloudDiscoveryMetadataStubs(): void {
        sinon.stub(TrustedAuthority, "IsInTrustedHostList").returns(true);
        const stubbedCloudDiscoveryMetadata: CloudDiscoveryMetadata = {
            preferred_cache: "login.windows.net",
            preferred_network: "login.microsoftonline.com",
            aliases: ["login.microsoftonline.com", "login.windows.net", "login.microsoft.com", "sts.windows.net"]
        };
        sinon.stub(TrustedAuthority, "getTrustedHostList").returns(stubbedCloudDiscoveryMetadata.aliases);
        sinon.stub(TrustedAuthority, "getCloudDiscoveryMetadata").returns(stubbedCloudDiscoveryMetadata);
    }
}
