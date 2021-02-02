import { expect } from "chai";
import { ClientConfiguration, buildClientConfiguration } from "../../src/config/ClientConfiguration";
import { PkceCodes } from "../../src/crypto/ICrypto";
import { AuthError } from "../../src/error/AuthError";
import { NetworkRequestOptions } from "../../src/network/INetworkModule";
import { LogLevel } from "../../src/logger/Logger";
import { Constants } from "../../src";
import { version } from "../../src/version.json";
import {TEST_CONFIG, TEST_POP_VALUES} from "../utils/StringConstants";
import { MockStorageClass } from "../client/ClientTestUtils";
import { MockCache } from "../cache/entities/cacheConstants";

describe("ClientConfiguration.ts Class Unit Tests", () => {

    it("buildConfiguration assigns default functions", async () => {
        const emptyConfig: ClientConfiguration = buildClientConfiguration({
            authOptions: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });
        // Crypto interface checks
        expect(emptyConfig.cryptoInterface).to.be.not.null;
        expect(emptyConfig.cryptoInterface.base64Decode).to.be.not.null;
        expect(() => emptyConfig.cryptoInterface.base64Decode("test input")).to.throw("Unexpected error in authentication.: Crypto interface - base64Decode() has not been implemented");
        expect(() => emptyConfig.cryptoInterface.base64Decode("test input")).to.throw(AuthError);
        expect(emptyConfig.cryptoInterface.base64Encode).to.be.not.null;
        expect(() => emptyConfig.cryptoInterface.base64Encode("test input")).to.throw("Unexpected error in authentication.: Crypto interface - base64Encode() has not been implemented");
        expect(() => emptyConfig.cryptoInterface.base64Encode("test input")).to.throw(AuthError);
        expect(emptyConfig.cryptoInterface.generatePkceCodes).to.be.not.null;
        await expect(emptyConfig.cryptoInterface.generatePkceCodes()).to.be.rejectedWith("Unexpected error in authentication.: Crypto interface - generatePkceCodes() has not been implemented");
        await expect(emptyConfig.cryptoInterface.generatePkceCodes()).to.be.rejectedWith(AuthError);
        // Storage interface checks
        expect(emptyConfig.storageInterface).to.be.not.null;
        expect(emptyConfig.storageInterface.clear).to.be.not.null;
        expect(() => emptyConfig.storageInterface.clear()).to.throw("Unexpected error in authentication.: Storage interface - clear() has not been implemented");
        expect(() => emptyConfig.storageInterface.clear()).to.throw(AuthError);
        expect(emptyConfig.storageInterface.containsKey).to.be.not.null;
        expect(() => emptyConfig.storageInterface.containsKey("testKey")).to.throw("Unexpected error in authentication.: Storage interface - containsKey() has not been implemented");
        expect(() => emptyConfig.storageInterface.containsKey("testKey")).to.throw(AuthError);
        expect(emptyConfig.storageInterface.getAccount).to.be.not.null;
        expect(() => emptyConfig.storageInterface.getAccount("testKey")).to.throw("Unexpected error in authentication.: Storage interface - getAccount() has not been implemented");
        expect(() => emptyConfig.storageInterface.getAccount("testKey")).to.throw(AuthError);
        expect(emptyConfig.storageInterface.getKeys).to.be.not.null;
        expect(() => emptyConfig.storageInterface.getKeys()).to.throw("Unexpected error in authentication.: Storage interface - getKeys() has not been implemented");
        expect(() => emptyConfig.storageInterface.getKeys()).to.throw(AuthError);
        expect(emptyConfig.storageInterface.removeItem).to.be.not.null;
        expect(() => emptyConfig.storageInterface.removeItem("testKey")).to.throw("Unexpected error in authentication.: Storage interface - removeItem() has not been implemented");
        expect(() => emptyConfig.storageInterface.removeItem("testKey")).to.throw(AuthError);
        expect(emptyConfig.storageInterface.setAccount).to.be.not.null;
        expect(() => emptyConfig.storageInterface.setAccount(MockCache.acc)).to.throw("Unexpected error in authentication.: Storage interface - setAccount() has not been implemented");
        expect(() => emptyConfig.storageInterface.setAccount(MockCache.acc)).to.throw(AuthError);
        // Network interface checks
        expect(emptyConfig.networkInterface).to.be.not.null;
        expect(emptyConfig.networkInterface.sendGetRequestAsync).to.be.not.null;
        await expect(emptyConfig.networkInterface.sendGetRequestAsync("", null)).to.be.rejectedWith("Unexpected error in authentication.: Network interface - sendGetRequestAsync() has not been implemented");
        await expect(emptyConfig.networkInterface.sendGetRequestAsync("", null)).to.be.rejectedWith(AuthError);
        expect(emptyConfig.networkInterface.sendPostRequestAsync).to.be.not.null;
        await expect(emptyConfig.networkInterface.sendPostRequestAsync("", null)).to.be.rejectedWith("Unexpected error in authentication.: Network interface - sendPostRequestAsync() has not been implemented");
        await expect(emptyConfig.networkInterface.sendPostRequestAsync("", null)).to.be.rejectedWith(AuthError);
        // Logger options checks
        expect(emptyConfig.loggerOptions).to.be.not.null;
        expect(emptyConfig.loggerOptions.piiLoggingEnabled).to.be.false;
        // Client info checks
        expect(emptyConfig.libraryInfo.sku).to.be.eq(Constants.SKU);
        expect(emptyConfig.libraryInfo.version).to.be.eq(version);
        expect(emptyConfig.libraryInfo.os).to.be.empty;
        expect(emptyConfig.libraryInfo.cpu).to.be.empty;
    });

    const cacheStorageMock = new MockStorageClass();

    const testPkceCodes = {
        challenge: "TestChallenge",
        verifier: "TestVerifier"
    } as PkceCodes;

    const testNetworkResult = {
        testParam: "testValue"
    };

    const testKeySet = ["testKey1", "testKey2"];

    it("buildConfiguration correctly assigns new values", async () => {
        const newConfig: ClientConfiguration = buildClientConfiguration({
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
            }
        });
        cacheStorageMock.setAccount(MockCache.acc);
        // Crypto interface tests
        expect(newConfig.cryptoInterface).to.be.not.null;
        expect(newConfig.cryptoInterface.base64Decode).to.be.not.null;
        expect(newConfig.cryptoInterface.base64Decode("testString")).to.be.eq("testDecodedString");
        expect(newConfig.cryptoInterface.base64Encode).to.be.not.null;
        expect(newConfig.cryptoInterface.base64Encode("testString")).to.be.eq("testEncodedString");
        expect(newConfig.cryptoInterface.generatePkceCodes).to.be.not.null;
        await expect(newConfig.cryptoInterface.generatePkceCodes()).to.eventually.eq(testPkceCodes);
        // Storage interface tests
        expect(newConfig.storageInterface).to.be.not.null;
        expect(newConfig.storageInterface.clear).to.be.not.null;
        expect(newConfig.storageInterface.clear).to.be.eq(cacheStorageMock.clear);
        expect(newConfig.storageInterface.containsKey).to.be.not.null;
        expect(newConfig.storageInterface.containsKey(MockCache.acc.generateAccountKey())).to.be.true;
        expect(newConfig.storageInterface.getAccount).to.be.not.null;
        expect(newConfig.storageInterface.getAccount(MockCache.acc.generateAccountKey())).to.be.eq(MockCache.acc);
        expect(newConfig.storageInterface.getKeys).to.be.not.null;
        expect(newConfig.storageInterface.getKeys()).to.be.deep.eq([MockCache.acc.generateAccountKey()]);
        expect(newConfig.storageInterface.removeItem).to.be.not.null;
        expect(newConfig.storageInterface.removeItem).to.be.eq(cacheStorageMock.removeItem);
        expect(newConfig.storageInterface.setAccount).to.be.not.null;
        expect(newConfig.storageInterface.setAccount).to.be.eq(cacheStorageMock.setAccount);
        // Network interface tests
        expect(newConfig.networkInterface).to.be.not.null;
        expect(newConfig.networkInterface.sendGetRequestAsync).to.be.not.null;
        await expect(newConfig.networkInterface.sendGetRequestAsync("", null)).to.eventually.eq(testNetworkResult);
        expect(newConfig.networkInterface.sendPostRequestAsync).to.be.not.null;
        await expect(newConfig.networkInterface.sendPostRequestAsync("", null)).to.eventually.eq(testNetworkResult);
        // Logger option tests
        expect(newConfig.loggerOptions).to.be.not.null;
        expect(newConfig.loggerOptions.loggerCallback).to.be.not.null;
        expect(newConfig.loggerOptions.piiLoggingEnabled).to.be.true;
        // Client info tests
        expect(newConfig.libraryInfo.sku).to.be.eq(TEST_CONFIG.TEST_SKU);
        expect(newConfig.libraryInfo.version).to.be.eq(TEST_CONFIG.TEST_VERSION);
        expect(newConfig.libraryInfo.os).to.be.eq(TEST_CONFIG.TEST_OS);
        expect(newConfig.libraryInfo.cpu).to.be.eq(TEST_CONFIG.TEST_CPU);
    });
});
