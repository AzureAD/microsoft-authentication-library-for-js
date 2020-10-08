import { ClientConfiguration, Constants, LogLevel, NetworkRequestOptions, PkceCodes, ClientAuthError, AccountEntity, ValidCacheType, CredentialEntity, AppMetadataEntity, ThrottlingEntity} from "../../src";
import { RANDOM_TEST_GUID, TEST_CONFIG, TEST_POP_VALUES } from "../utils/StringConstants";
import { AuthorityFactory } from "../../src";
import { TrustedAuthority } from "../../src/authority/TrustedAuthority";
import sinon from "sinon";
import { CloudDiscoveryMetadata } from "../../src/authority/CloudDiscoveryMetadata";
import { CacheManager } from "../../src/cache/CacheManager";
import { ServerTelemetryEntity } from "../../src/cache/entities/ServerTelemetryEntity";

let store: Record<string, ValidCacheType> = {};
export class MockStorageClass extends CacheManager {

    // Accounts
    getAccount(key: string): AccountEntity | null {
        return store[key] as AccountEntity;
    }
    setAccount(key: string, value: AccountEntity): void {
        store[key] = value;
    }

    // Credentials (idtokens, accesstokens, refreshtokens)
    getCredential(key: string): CredentialEntity | null {
        return store[key] as CredentialEntity;
    }
    setCredential(key: string, value: CredentialEntity): void {
        store[key] = value;
    }

    // AppMetadata
    getAppMetadata(key: string): AppMetadataEntity | null {
        return store[key] as AppMetadataEntity;
    }
    setAppMetadata(key: string, value: AppMetadataEntity): void {
        store[key] = value;
    }

    // Telemetry cache
    getServerTelemetry(key: string): ServerTelemetryEntity | null {
        return store[key] as ServerTelemetryEntity;
    }
    setServerTelemetry(key: string, value: ServerTelemetryEntity): void {
        store[key] = value;
    }

    // Throttling cache
    getThrottlingCache(key: string): ThrottlingEntity | null {
        return store[key] as ThrottlingEntity;
    }
    setThrottlingCache(key: string, value: ThrottlingEntity): void {
        store[key] = value;
    }

    removeItem(key: string): boolean {
        let result: boolean = false;
        if (!!store[key]) {
            delete store[key];
            result = true;
        }
        return result;
    }
    containsKey(key: string): boolean {
        return !!store[key];
    }
    getKeys(): string[] {
        return Object.keys(store);
    }
    clear(): void {
        store = {};
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
