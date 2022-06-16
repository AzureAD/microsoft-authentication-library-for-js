import { CommonClientConfiguration, buildClientConfiguration } from "../../src/config/ClientConfiguration";
import { PkceCodes } from "../../src/crypto/ICrypto";
import { AuthError } from "../../src/error/AuthError";
import { NetworkRequestOptions } from "../../src/network/INetworkModule";
import { LogLevel } from "../../src/logger/Logger";
import { version } from "../../src/packageMetadata";
import {TEST_CONFIG, TEST_CRYPTO_VALUES, TEST_POP_VALUES} from "../test_kit/StringConstants";
import { MockStorageClass, mockCrypto } from "../client/ClientTestUtils";
import { MockCache } from "../cache/entities/cacheConstants";
import { Constants } from "../../src/utils/Constants";

describe("ClientConfiguration.ts Class Unit Tests", () => {

    it("buildConfiguration assigns default functions", async () => {
        const emptyConfig: CommonClientConfiguration = buildClientConfiguration({
            //@ts-ignore
            authOptions: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });
        // Crypto interface checks
        expect(emptyConfig.cryptoInterface).not.toBeNull();
        expect(emptyConfig.cryptoInterface.base64Decode).not.toBeNull();
        expect(() => emptyConfig.cryptoInterface.base64Decode("test input")).toThrowError(
            "Unexpected error in authentication.: Crypto interface - base64Decode() has not been implemented"
        );
        expect(() => emptyConfig.cryptoInterface.base64Decode("test input")).toThrowError(AuthError);
        expect(emptyConfig.cryptoInterface.base64Encode).not.toBeNull();
        expect(() => emptyConfig.cryptoInterface.base64Encode("test input")).toThrowError(
            "Unexpected error in authentication.: Crypto interface - base64Encode() has not been implemented"
        );
        expect(() => emptyConfig.cryptoInterface.base64Encode("test input")).toThrowError(AuthError);
        expect(emptyConfig.cryptoInterface.generatePkceCodes).not.toBeNull();
        await expect(emptyConfig.cryptoInterface.generatePkceCodes()).rejects.toMatchObject(AuthError.createUnexpectedError("Crypto interface - generatePkceCodes() has not been implemented"))
        // Storage interface checks
        expect(emptyConfig.storageInterface).not.toBeNull();
        expect(emptyConfig.storageInterface.clear).not.toBeNull();
        await expect(emptyConfig.storageInterface.clear()).rejects.toMatchObject(AuthError.createUnexpectedError("Storage interface - clear() has not been implemented for the cacheStorage interface."))
        expect(emptyConfig.storageInterface.containsKey).not.toBeNull();
        expect(() => emptyConfig.storageInterface.containsKey("testKey")).toThrowError(
            "Unexpected error in authentication.: Storage interface - containsKey() has not been implemented"
        );
        expect(() => emptyConfig.storageInterface.containsKey("testKey")).toThrowError(AuthError);
        expect(emptyConfig.storageInterface.getAccount).not.toBeNull();
        expect(() => emptyConfig.storageInterface.getAccount("testKey")).toThrowError(
            "Unexpected error in authentication.: Storage interface - getAccount() has not been implemented"
        );
        expect(() => emptyConfig.storageInterface.getAccount("testKey")).toThrowError(AuthError);
        expect(emptyConfig.storageInterface.getKeys).not.toBeNull();
        expect(() => emptyConfig.storageInterface.getKeys()).toThrowError(
            "Unexpected error in authentication.: Storage interface - getKeys() has not been implemented"
        );
        expect(() => emptyConfig.storageInterface.getKeys()).toThrowError(AuthError);
        expect(emptyConfig.storageInterface.removeItem).not.toBeNull();
        expect(() => emptyConfig.storageInterface.removeItem("testKey")).toThrowError(
            "Unexpected error in authentication.: Storage interface - removeItem() has not been implemented"
        );
        expect(() => emptyConfig.storageInterface.removeItem("testKey")).toThrowError(AuthError);
        expect(emptyConfig.storageInterface.setAccount).not.toBeNull();
        expect(() => emptyConfig.storageInterface.setAccount(MockCache.acc)).toThrowError(
            "Unexpected error in authentication.: Storage interface - setAccount() has not been implemented"
        );
        expect(() => emptyConfig.storageInterface.setAccount(MockCache.acc)).toThrowError(AuthError);
        // Network interface checks
        expect(emptyConfig.networkInterface).not.toBeNull();
        expect(emptyConfig.networkInterface.sendGetRequestAsync).not.toBeNull();
        //@ts-ignore
        expect(emptyConfig.networkInterface.sendGetRequestAsync("", null)).rejects.toMatchObject(AuthError.createUnexpectedError("Network interface - sendGetRequestAsync() has not been implemented"));
        expect(emptyConfig.networkInterface.sendPostRequestAsync).not.toBeNull();
        //@ts-ignore
        await expect(emptyConfig.networkInterface.sendPostRequestAsync("", null)).rejects.toMatchObject(AuthError.createUnexpectedError("Network interface - sendPostRequestAsync() has not been implemented"));
        // Logger options checks
        expect(emptyConfig.loggerOptions).not.toBeNull();
        expect(emptyConfig.loggerOptions.piiLoggingEnabled).toBe(false);
        // Client info checks
        expect(emptyConfig.libraryInfo.sku).toBe(Constants.SKU);
        expect(emptyConfig.libraryInfo.version).toBe(version);
        expect(emptyConfig.libraryInfo.os).toHaveLength(0);
        expect(emptyConfig.libraryInfo.cpu).toHaveLength(0);
        // App telemetry checks
        expect(emptyConfig.telemetry).not.toBeNull();
        expect(emptyConfig.telemetry.application).not.toBeNull();
        expect(emptyConfig.telemetry.application.appName).toHaveLength(0);
        expect(emptyConfig.telemetry.application.appVersion).toHaveLength(0);
    });

    const cacheStorageMock = new MockStorageClass(TEST_CONFIG.MSAL_CLIENT_ID, mockCrypto);

    const testPkceCodes = {
        challenge: "TestChallenge",
        verifier: "TestVerifier"
    } as PkceCodes;

    const testNetworkResult = {
        testParam: "testValue"
    };

    it("buildConfiguration correctly assigns new values", async () => {
        const newConfig: CommonClientConfiguration = buildClientConfiguration({
            //@ts-ignore
            authOptions: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            },
            cryptoInterface: {
                createNewGuid: (): string => {
                    return "newGuid";
                },
                base64Decode: (input: string): string => {
                    return "testDecodedString";
                },
                base64Encode: (input: string): string => {
                    return "testEncodedString";
                },
                generatePkceCodes: async (): Promise<PkceCodes> => {
                    return testPkceCodes;
                },
                async getPublicKeyThumbprint(): Promise<string> {
                    return TEST_POP_VALUES.KID;
                },
                async signJwt(): Promise<string> {
                    return "signedJwt";
                },
                async removeTokenBindingKey(): Promise<boolean> {
                    return Promise.resolve(true);
                },
                async clearKeystore(): Promise<boolean> {
                    return Promise.resolve(true);
                },
                async hashString(): Promise<string> {
                    return Promise.resolve(TEST_CRYPTO_VALUES.TEST_SHA256_HASH);
                }
            },
            storageInterface: cacheStorageMock,
            networkInterface: {
                sendGetRequestAsync: async (url: string, options?: NetworkRequestOptions): Promise<any> => {
                    return testNetworkResult;
                },
                sendPostRequestAsync: async (url: string, options?: NetworkRequestOptions): Promise<any> => {
                    return testNetworkResult;
                }
            },
            loggerOptions: {
                loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {},
                piiLoggingEnabled: true
            },
            libraryInfo: {
                sku: TEST_CONFIG.TEST_SKU,
                version: TEST_CONFIG.TEST_VERSION,
                os: TEST_CONFIG.TEST_OS,
                cpu: TEST_CONFIG.TEST_CPU
            },
            telemetry: {
                application: {
                    appName: TEST_CONFIG.TEST_APP_NAME,
                    appVersion: TEST_CONFIG.TEST_APP_VER
                }
            }
        });
        cacheStorageMock.setAccount(MockCache.acc);
        // Crypto interface tests
        expect(newConfig.cryptoInterface).not.toBeNull();
        expect(newConfig.cryptoInterface.base64Decode).not.toBeNull();
        expect(newConfig.cryptoInterface.base64Decode("testString")).toBe("testDecodedString");
        expect(newConfig.cryptoInterface.base64Encode).not.toBeNull();
        expect(newConfig.cryptoInterface.base64Encode("testString")).toBe("testEncodedString");
        expect(newConfig.cryptoInterface.generatePkceCodes).not.toBeNull();
        expect(newConfig.cryptoInterface.generatePkceCodes()).resolves.toBe(testPkceCodes);
        expect(newConfig.cryptoInterface.removeTokenBindingKey).not.toBeNull();
        expect(newConfig.cryptoInterface.removeTokenBindingKey("testString")).resolves.toBe(true);
        // Storage interface tests
        expect(newConfig.storageInterface).not.toBeNull();
        expect(newConfig.storageInterface.clear).not.toBeNull();
        expect(newConfig.storageInterface.clear).toBe(cacheStorageMock.clear);
        expect(newConfig.storageInterface.containsKey).not.toBeNull();
        expect(newConfig.storageInterface.containsKey(MockCache.acc.generateAccountKey())).toBe(true);
        expect(newConfig.storageInterface.getAccount).not.toBeNull();
        expect(newConfig.storageInterface.getAccount(MockCache.acc.generateAccountKey())).toBe(MockCache.acc);
        expect(newConfig.storageInterface.getKeys).not.toBeNull();
        expect(newConfig.storageInterface.getKeys()).toEqual([MockCache.acc.generateAccountKey()]);
        expect(newConfig.storageInterface.removeItem).not.toBeNull();
        expect(newConfig.storageInterface.removeItem).toBe(cacheStorageMock.removeItem);
        expect(newConfig.storageInterface.setAccount).not.toBeNull();
        expect(newConfig.storageInterface.setAccount).toBe(cacheStorageMock.setAccount);
        // Network interface tests
        expect(newConfig.networkInterface).not.toBeNull();
        expect(newConfig.networkInterface.sendGetRequestAsync).not.toBeNull();
        //@ts-ignore
        expect(newConfig.networkInterface.sendGetRequestAsync("", null)).resolves.toBe(testNetworkResult);
        expect(newConfig.networkInterface.sendPostRequestAsync).not.toBeNull();
        //@ts-ignore
        expect(newConfig.networkInterface.sendPostRequestAsync("", null)).resolves.toBe(testNetworkResult);
        // Logger option tests
        expect(newConfig.loggerOptions).not.toBeNull();
        expect(newConfig.loggerOptions.loggerCallback).not.toBeNull();
        expect(newConfig.loggerOptions.piiLoggingEnabled).toBe(true);
        // Client info tests
        expect(newConfig.libraryInfo.sku).toBe(TEST_CONFIG.TEST_SKU);
        expect(newConfig.libraryInfo.version).toBe(TEST_CONFIG.TEST_VERSION);
        expect(newConfig.libraryInfo.os).toBe(TEST_CONFIG.TEST_OS);
        expect(newConfig.libraryInfo.cpu).toBe(TEST_CONFIG.TEST_CPU);
        // App telemetry tests
        expect(newConfig.telemetry.application.appName).toBe(TEST_CONFIG.TEST_APP_NAME);
        expect(newConfig.telemetry.application.appVersion).toBe(TEST_CONFIG.TEST_APP_VER);
    });
});
