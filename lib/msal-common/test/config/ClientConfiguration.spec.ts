import {
    CommonClientConfiguration,
    buildClientConfiguration,
} from "../../src/config/ClientConfiguration.js";
import { AuthError } from "../../src/error/AuthError.js";
import { NetworkRequestOptions } from "../../src/network/INetworkModule.js";
import { Logger, LogLevel } from "../../src/logger/Logger.js";
import { version } from "../../src/packageMetadata.js";
import {
    TEST_CONFIG,
    TEST_CRYPTO_VALUES,
    TEST_POP_VALUES,
} from "../test_kit/StringConstants.js";
import { MockStorageClass, mockCrypto } from "../client/ClientTestUtils.js";
import { MockCache } from "../cache/entities/cacheConstants.js";
import { Constants } from "../../src/utils/Constants.js";
import * as ClientAuthErrorCodes from "../../src/error/ClientAuthErrorCodes.js";
import { createClientAuthError } from "../../src/error/ClientAuthError.js";

describe("ClientConfiguration.ts Class Unit Tests", () => {
    it("buildConfiguration assigns default functions", async () => {
        const emptyConfig: CommonClientConfiguration = buildClientConfiguration(
            {
                //@ts-ignore
                authOptions: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            }
        );
        // Crypto interface checks
        expect(emptyConfig.cryptoInterface).not.toBeNull();
        expect(emptyConfig.cryptoInterface.base64Decode).not.toBeNull();
        expect(() =>
            emptyConfig.cryptoInterface.base64Decode("test input")
        ).toThrowError(
            createClientAuthError(ClientAuthErrorCodes.methodNotImplemented)
        );
        expect(() =>
            emptyConfig.cryptoInterface.base64Decode("test input")
        ).toThrowError(AuthError);
        expect(emptyConfig.cryptoInterface.base64Encode).not.toBeNull();
        expect(() =>
            emptyConfig.cryptoInterface.base64Encode("test input")
        ).toThrowError(
            createClientAuthError(ClientAuthErrorCodes.methodNotImplemented)
        );
        expect(() =>
            emptyConfig.cryptoInterface.base64Encode("test input")
        ).toThrowError(AuthError);
        // Storage interface checks
        expect(emptyConfig.storageInterface).not.toBeNull();
        expect(emptyConfig.storageInterface.getAccount).not.toBeNull();
        expect(() =>
            emptyConfig.storageInterface.getAccount("testKey")
        ).toThrowError(
            createClientAuthError(ClientAuthErrorCodes.methodNotImplemented)
        );
        expect(() =>
            emptyConfig.storageInterface.getAccount("testKey")
        ).toThrowError(AuthError);
        expect(emptyConfig.storageInterface.getKeys).not.toBeNull();
        expect(() => emptyConfig.storageInterface.getKeys()).toThrowError(
            createClientAuthError(ClientAuthErrorCodes.methodNotImplemented)
        );
        expect(() => emptyConfig.storageInterface.getKeys()).toThrowError(
            AuthError
        );
        expect(emptyConfig.storageInterface.removeItem).not.toBeNull();
        expect(() =>
            emptyConfig.storageInterface.removeItem("testKey")
        ).toThrowError(
            createClientAuthError(ClientAuthErrorCodes.methodNotImplemented)
        );
        expect(() =>
            emptyConfig.storageInterface.removeItem("testKey")
        ).toThrowError(AuthError);
        expect(emptyConfig.storageInterface.setAccount).not.toBeNull();
        expect(() =>
            emptyConfig.storageInterface.setAccount(
                MockCache.acc,
                TEST_CONFIG.CORRELATION_ID
            )
        ).rejects.toEqual(
            createClientAuthError(ClientAuthErrorCodes.methodNotImplemented)
        );
        // Network interface checks
        expect(emptyConfig.networkInterface).not.toBeNull();
        expect(emptyConfig.networkInterface.sendGetRequestAsync).not.toBeNull();

        expect(
            //@ts-ignore
            emptyConfig.networkInterface.sendGetRequestAsync("", null)
        ).rejects.toMatchObject(
            createClientAuthError(ClientAuthErrorCodes.methodNotImplemented)
        );
        expect(
            emptyConfig.networkInterface.sendPostRequestAsync
        ).not.toBeNull();

        await expect(
            //@ts-ignore
            emptyConfig.networkInterface.sendPostRequestAsync("", null)
        ).rejects.toMatchObject(
            createClientAuthError(ClientAuthErrorCodes.methodNotImplemented)
        );
        // Logger options checks
        expect(emptyConfig.loggerOptions).not.toBeNull();
        expect(emptyConfig.loggerOptions.piiLoggingEnabled).toBe(false);
        // Cache Options checks
        expect(emptyConfig.cacheOptions).not.toBeNull();
        expect(emptyConfig.cacheOptions.claimsBasedCachingEnabled).toBe(false);
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

    const cacheStorageMock = new MockStorageClass(
        TEST_CONFIG.MSAL_CLIENT_ID,
        mockCrypto,
        new Logger({})
    );

    const testNetworkResult = {
        testParam: "testValue",
    };

    it("buildConfiguration correctly assigns new values", async () => {
        const newConfig: CommonClientConfiguration = buildClientConfiguration({
            //@ts-ignore
            authOptions: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
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
                base64UrlEncode(input: string): string {
                    switch (input) {
                        case '{"kid": "XnsuAvttTPp0nn1K_YMLePLDbp7syCKhNHt7HjYHJYc"}':
                            return "eyJraWQiOiAiWG5zdUF2dHRUUHAwbm4xS19ZTUxlUExEYnA3c3lDS2hOSHQ3SGpZSEpZYyJ9";
                        default:
                            return input;
                    }
                },
                encodeKid(input: string): string {
                    switch (input) {
                        case "XnsuAvttTPp0nn1K_YMLePLDbp7syCKhNHt7HjYHJYc":
                            return "eyJraWQiOiAiWG5zdUF2dHRUUHAwbm4xS19ZTUxlUExEYnA3c3lDS2hOSHQ3SGpZSEpZYyJ9";
                        default:
                            return input;
                    }
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
                },
            },
            storageInterface: cacheStorageMock,
            networkInterface: {
                sendGetRequestAsync: async (
                    url: string,
                    options?: NetworkRequestOptions
                ): Promise<any> => {
                    return testNetworkResult;
                },
                sendPostRequestAsync: async (
                    url: string,
                    options?: NetworkRequestOptions
                ): Promise<any> => {
                    return testNetworkResult;
                },
            },
            loggerOptions: {
                loggerCallback: (
                    level: LogLevel,
                    message: string,
                    containsPii: boolean
                ): void => {},
                piiLoggingEnabled: true,
            },
            cacheOptions: {
                claimsBasedCachingEnabled: true,
            },
            libraryInfo: {
                sku: TEST_CONFIG.TEST_SKU,
                version: TEST_CONFIG.TEST_VERSION,
                os: TEST_CONFIG.TEST_OS,
                cpu: TEST_CONFIG.TEST_CPU,
            },
            telemetry: {
                application: {
                    appName: TEST_CONFIG.TEST_APP_NAME,
                    appVersion: TEST_CONFIG.TEST_APP_VER,
                },
            },
        });
        await cacheStorageMock.setAccount(MockCache.acc);
        // Crypto interface tests
        expect(newConfig.cryptoInterface).not.toBeNull();
        expect(newConfig.cryptoInterface.base64Decode).not.toBeNull();
        expect(newConfig.cryptoInterface.base64Decode("testString")).toBe(
            "testDecodedString"
        );
        expect(newConfig.cryptoInterface.base64Encode).not.toBeNull();
        expect(newConfig.cryptoInterface.base64Encode("testString")).toBe(
            "testEncodedString"
        );
        expect(newConfig.cryptoInterface.removeTokenBindingKey).not.toBeNull();
        expect(
            newConfig.cryptoInterface.removeTokenBindingKey("testString")
        ).resolves.toBe(true);
        // Storage interface tests
        expect(newConfig.storageInterface).not.toBeNull();
        expect(newConfig.storageInterface.getAccount).not.toBeNull();
        expect(
            newConfig.storageInterface.getAccount(
                MockCache.acc.generateAccountKey()
            )
        ).toBe(MockCache.acc);
        expect(newConfig.storageInterface.getKeys).not.toBeNull();
        expect(newConfig.storageInterface.getKeys()).toEqual([
            MockCache.acc.generateAccountKey(),
            "ACCOUNT_KEYS",
        ]);
        expect(newConfig.storageInterface.removeItem).not.toBeNull();
        expect(newConfig.storageInterface.removeItem).toBe(
            cacheStorageMock.removeItem
        );
        expect(newConfig.storageInterface.setAccount).not.toBeNull();
        expect(newConfig.storageInterface.setAccount).toBe(
            cacheStorageMock.setAccount
        );
        // Network interface tests
        expect(newConfig.networkInterface).not.toBeNull();
        expect(newConfig.networkInterface.sendGetRequestAsync).not.toBeNull();

        expect(
            //@ts-ignore
            newConfig.networkInterface.sendGetRequestAsync("", null)
        ).resolves.toBe(testNetworkResult);
        expect(newConfig.networkInterface.sendPostRequestAsync).not.toBeNull();

        expect(
            //@ts-ignore
            newConfig.networkInterface.sendPostRequestAsync("", null)
        ).resolves.toBe(testNetworkResult);
        // Logger option tests
        expect(newConfig.loggerOptions).not.toBeNull();
        expect(newConfig.loggerOptions.loggerCallback).not.toBeNull();
        expect(newConfig.loggerOptions.piiLoggingEnabled).toBe(true);
        // Cache options tests
        expect(newConfig.cacheOptions).not.toBeNull();
        expect(newConfig.cacheOptions.claimsBasedCachingEnabled).toBe(true);
        // Client info tests
        expect(newConfig.libraryInfo.sku).toBe(TEST_CONFIG.TEST_SKU);
        expect(newConfig.libraryInfo.version).toBe(TEST_CONFIG.TEST_VERSION);
        expect(newConfig.libraryInfo.os).toBe(TEST_CONFIG.TEST_OS);
        expect(newConfig.libraryInfo.cpu).toBe(TEST_CONFIG.TEST_CPU);
        // App telemetry tests
        expect(newConfig.telemetry.application.appName).toBe(
            TEST_CONFIG.TEST_APP_NAME
        );
        expect(newConfig.telemetry.application.appVersion).toBe(
            TEST_CONFIG.TEST_APP_VER
        );
    });
});
