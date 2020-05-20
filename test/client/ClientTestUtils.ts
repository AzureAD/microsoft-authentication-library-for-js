import {
    ClientAuthError,
    ClientConfiguration,
    Constants,
    LogLevel,
    NetworkRequestOptions,
    PkceCodes
} from "../../src";
import { RANDOM_TEST_GUID, TEST_CONFIG } from "../utils/StringConstants";
import { AuthorityFactory } from "../../src";

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

        let store = {};
        return {
            authOptions: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                authority: authority,
            },
            storageInterface: {

                setItem(key: string, value: string): void {
                    store[key] = value;
                },
                getItem(key: string): string {
                    return store[key];
                },
                removeItem(key: string): void {
                    delete store[key];
                },
                containsKey(key: string): boolean {
                    return !!store[key];
                },
                getKeys(): string[] {
                    return Object.keys(store);
                },
                clear(): void {
                    store = {};
                }
            },
            networkInterface: mockHttpClient,
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
                        verifier: TEST_CONFIG.TEST_VERIFIER
                    };
                }
            },
            loggerOptions: {
                loggerCallback: testLoggerCallback
            },
            libraryInfo: {
                sku: Constants.SKU,
                version: TEST_CONFIG.TEST_VERSION,
                os: TEST_CONFIG.TEST_OS,
                cpu: TEST_CONFIG.TEST_CPU,
            }
        };
    }
}
