import { ClientConfiguration, Constants, LogLevel, NetworkRequestOptions, PkceCodes, ClientAuthError, AccountEntity, ValidCacheType, CredentialEntity, AppMetadataEntity, ThrottlingEntity} from "../../src";
import { RANDOM_TEST_GUID, TEST_CONFIG } from "../utils/StringConstants";
import { AuthorityFactory } from "../../src";
import { TrustedAuthority } from "../../src/authority/TrustedAuthority";
import sinon from "sinon";
import { CloudDiscoveryMetadata } from "../../src/authority/CloudDiscoveryMetadata";
import { CacheManager } from "../../src/cache/CacheManager";
import { ServerTelemetryEntity } from "../../src/cache/entities/ServerTelemetryEntity";

export class MockStorageClass extends CacheManager {
    store: Record<string, ValidCacheType>;

    // Accounts
    setAccount(key: string, value: AccountEntity): void {
        this.store[key] = value;
    }
    getAccount(key: string): AccountEntity {
        return this.store[key] as AccountEntity;
    }

    // Credentials (idtokens, accesstokens, refreshtokens)
    setCredential(key: string, value: CredentialEntity): void {
        this.store[key] = value;
    }
    getCredential(key: string): CredentialEntity {
        return this.store[key] as CredentialEntity;
    }

    // AppMetadata
    setAppMetadata(key: string, value: AppMetadataEntity): void {
        this.store[key] = value;
    }
    getAppMetadata(key: string): AppMetadataEntity {
        return this.store[key] as AppMetadataEntity;
    }

    // Telemetry cache
    setServerTelemetry(key: string, value: ServerTelemetryEntity): void {
        this.store[key] = value;
    }
    getServerTelemetry(key: string): ServerTelemetryEntity {
        return this.store[key] as ServerTelemetryEntity;
    }

    // Throttling cache
    setThrottlingCache(key: string, value: ThrottlingEntity): void {
        this.store[key] = value;
    }
    getThrottlingCache(key: string): ThrottlingEntity {
        return this.store[key] as ThrottlingEntity;
    }

    removeItem(key: string, type?: string): boolean {
        delete this.store[key];
        return true;
    }
    containsKey(key: string, type?: string): boolean {
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

        const authority  = AuthorityFactory.createInstance(TEST_CONFIG.validAuthority, mockHttpClient);

        await authority.resolveEndpointsAsync().catch(error => {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError(error);
        });

        const store = {};
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
                    return input;
                },
                base64Encode(input: string): string {
                    return input;
                },
                async generatePkceCodes(): Promise<PkceCodes> {
                    return {
                        challenge: TEST_CONFIG.TEST_CHALLENGE,
                        verifier: TEST_CONFIG.TEST_VERIFIER,
                    };
                },
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
