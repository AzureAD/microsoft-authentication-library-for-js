import {
    CommonClientConfiguration,
    buildClientConfiguration,
} from "../../src/config/ClientConfiguration.js";
import { AuthError } from "../../src/error/AuthError.js";
import { NetworkRequestOptions } from "../../src/network/INetworkModule.js";
import { Logger, LogLevel } from "../../src/logger/Logger.js";
import { version } from "../../src/packageMetadata.js";
import { RANDOM_TEST_GUID, TEST_CONFIG } from "../test_kit/StringConstants.js";
import { MockStorageClass, mockCrypto } from "../client/ClientTestUtils.js";
import { MockCache } from "../cache/entities/cacheConstants.js";
import { Constants } from "../../src/utils/Constants.js";
import * as ClientAuthErrorCodes from "../../src/error/ClientAuthErrorCodes.js";
import { createClientAuthError } from "../../src/error/ClientAuthError.js";
import { StubPerformanceClient } from "../../src/telemetry/performance/StubPerformanceClient.js";

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
            emptyConfig.storageInterface.getAccount("testKey", RANDOM_TEST_GUID)
        ).toThrowError(
            createClientAuthError(ClientAuthErrorCodes.methodNotImplemented)
        );
        expect(() =>
            emptyConfig.storageInterface.getAccount("testKey", RANDOM_TEST_GUID)
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
            emptyConfig.storageInterface.removeItem("testKey", RANDOM_TEST_GUID)
        ).toThrowError(
            createClientAuthError(ClientAuthErrorCodes.methodNotImplemented)
        );
        expect(() =>
            emptyConfig.storageInterface.removeItem("testKey", RANDOM_TEST_GUID)
        ).toThrowError(AuthError);
        expect(emptyConfig.storageInterface.setAccount).not.toBeNull();
        expect(() =>
            emptyConfig.storageInterface.setAccount(
                MockCache.acc,
                TEST_CONFIG.CORRELATION_ID,
                true,
                0
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
        new Logger({}),
        new StubPerformanceClient()
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
            cryptoInterface: mockCrypto,
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
        await cacheStorageMock.setAccount(
            MockCache.acc,
            TEST_CONFIG.CORRELATION_ID,
            true,
            0
        );
        expect(newConfig.cryptoInterface).not.toBeNull();
        expect(newConfig.storageInterface).not.toBeNull();
        expect(newConfig.networkInterface).not.toBeNull();
        expect(newConfig.loggerOptions).not.toBeNull();
        expect(newConfig.cacheOptions).not.toBeNull();
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
