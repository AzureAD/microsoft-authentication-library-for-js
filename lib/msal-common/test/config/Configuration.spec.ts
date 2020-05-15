import { expect } from "chai";
import { ClientConfiguration, buildClientConfiguration } from "../../src/config/ClientConfiguration";
import { PkceCodes } from "../../src/crypto/ICrypto";
import { AuthError } from "../../src/error/AuthError";
import { NetworkRequestOptions } from "../../src/network/INetworkModule";
import { LogLevel } from "../../src/logger/Logger";
import { Constants } from "../../src";
import { version } from "../../package.json";
import {TEST_CONFIG} from "../utils/StringConstants";


describe("ClientConfiguration.ts Class Unit Tests", () => {

    it("buildConfiguration assigns default functions", async () => {
        const emptyConfig: ClientConfiguration = buildClientConfiguration({});
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
        let clearErr;
        try {
            await emptyConfig.storageInterface.clear()
        } catch (e) {
            clearErr = e;
        }
        expect(clearErr && clearErr.errorMessage).to.eq("Unexpected error in authentication.: Storage interface - clear() has not been implemented for the cacheStorage interface.");
        expect(clearErr instanceof AuthError).to.be.true;

        expect(emptyConfig.storageInterface.containsKey).to.be.not.null;
        let containsErr;
        try {
            await emptyConfig.storageInterface.containsKey("testKey");
        } catch(e) {
            containsErr = e;
        }
        expect(containsErr && containsErr.errorMessage).to.eq("Unexpected error in authentication.: Storage interface - containsKey() has not been implemented for the cacheStorage interface.");
        expect(containsErr instanceof AuthError).to.be.true;

        expect(emptyConfig.storageInterface.getItem).to.be.not.null;
        let getErr;
        try {
            await emptyConfig.storageInterface.getItem("testKey");
        } catch (e) {
            getErr = e;
        }

        expect(getErr && getErr.errorMessage).to.eql("Unexpected error in authentication.: Storage interface - getItem() has not been implemented for the cacheStorage interface.");
        expect(getErr instanceof AuthError).to.be.true;

        expect(emptyConfig.storageInterface.getKeys).to.be.not.null;
        let getKeysErr;
        try {
            await emptyConfig.storageInterface.getKeys();
        } catch (e) {
            getKeysErr = e;
        }

        expect(getKeysErr && getKeysErr.errorMessage).to.eq("Unexpected error in authentication.: Storage interface - getKeys() has not been implemented for the cacheStorage interface.");
        expect(getKeysErr instanceof AuthError).to.be.true;

        expect(emptyConfig.storageInterface.removeItem).to.be.not.null;
        let removeErr;
        try {
            await emptyConfig.storageInterface.removeItem("testKey");
        } catch (e) {
            removeErr = e;
        }
        expect(removeErr && removeErr.errorMessage).to.eq("Unexpected error in authentication.: Storage interface - removeItem() has not been implemented for the cacheStorage interface.");
        expect(removeErr instanceof AuthError).to.be.true;

        expect(emptyConfig.storageInterface.setItem).to.be.not.null;
        let setErr;
        try {
            await emptyConfig.storageInterface.setItem("testKey", "testValue");
        } catch (e) {
            setErr = e;
        }
        expect(setErr && setErr.errorMessage).to.eq("Unexpected error in authentication.: Storage interface - setItem() has not been implemented for the cacheStorage interface.");
        expect(setErr instanceof AuthError).to.be.true;
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

    const clearFunc = (): void => {
        return;
    };

    const removeFunc = (key: string): void => {
        return;
    };

    const setFunc = (key: string, value: string): void => {
        return;
    };

    const testPkceCodes = {
        challenge: "TestChallenge",
        verifier: "TestVerifier"
    } as PkceCodes;

    const testNetworkResult = {
        testParam: "testValue"
    };

    const testKeySet = ["testKey1", "testKey2"];

    it("buildConfiguration correctly assigns new values", () => {
        const newConfig: ClientConfiguration = buildClientConfiguration({
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
                }
            },
            storageInterface: {
                clear: clearFunc,
                containsKey: (key: string): boolean => {
                    return true;
                },
                getItem: (key: string): string => {
                    return "cacheItem";
                },
                getKeys: (): string[] => {
                    return testKeySet;
                },
                removeItem: removeFunc,
                setItem: setFunc
            },
            networkInterface: {
                sendGetRequestAsync: async (url: string, options?: NetworkRequestOptions): Promise<any> => {
                    return testNetworkResult;
                },
                sendPostRequestAsync: async (url: string, options?: NetworkRequestOptions): Promise<any> => {
                    return testNetworkResult;
                }
            },
            loggerOptions: {
                loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {
                    if (containsPii) {
                        console.log(`Log level: ${level} Message: ${message}`);
                    }
                },
                piiLoggingEnabled: true
            },
            libraryInfo: {
                sku: TEST_CONFIG.TEST_SKU,
                version: TEST_CONFIG.TEST_VERSION,
                os: TEST_CONFIG.TEST_OS,
                cpu: TEST_CONFIG.TEST_CPU
            }
        });
        // Crypto interface tests
        expect(newConfig.cryptoInterface).to.be.not.null;
        expect(newConfig.cryptoInterface.base64Decode).to.be.not.null;
        expect(newConfig.cryptoInterface.base64Decode("testString")).to.be.eq("testDecodedString");
        expect(newConfig.cryptoInterface.base64Encode).to.be.not.null;
        expect(newConfig.cryptoInterface.base64Encode("testString")).to.be.eq("testEncodedString");
        expect(newConfig.cryptoInterface.generatePkceCodes).to.be.not.null;
        expect(newConfig.cryptoInterface.generatePkceCodes()).to.eventually.eq(testPkceCodes);
        // Storage interface tests
        expect(newConfig.storageInterface).to.be.not.null;
        expect(newConfig.storageInterface.clear).to.be.not.null;
        expect(newConfig.storageInterface.clear).to.be.eq(clearFunc);
        expect(newConfig.storageInterface.containsKey).to.be.not.null;
        expect(newConfig.storageInterface.containsKey("testKey")).to.be.true;
        expect(newConfig.storageInterface.getItem).to.be.not.null;
        expect(newConfig.storageInterface.getItem("testKey")).to.be.eq("cacheItem");
        expect(newConfig.storageInterface.getKeys).to.be.not.null;
        expect(newConfig.storageInterface.getKeys()).to.be.eq(testKeySet);
        expect(newConfig.storageInterface.removeItem).to.be.not.null;
        expect(newConfig.storageInterface.removeItem).to.be.eq(removeFunc);
        expect(newConfig.storageInterface.setItem).to.be.not.null;
        expect(newConfig.storageInterface.setItem).to.be.eq(setFunc);
        // Network interface tests
        expect(newConfig.networkInterface).to.be.not.null;
        expect(newConfig.networkInterface.sendGetRequestAsync).to.be.not.null;
        expect(newConfig.networkInterface.sendGetRequestAsync("", null)).to.eventually.eq(testNetworkResult);
        expect(newConfig.networkInterface.sendPostRequestAsync).to.be.not.null;
        expect(newConfig.networkInterface.sendPostRequestAsync("", null)).to.eventually.eq(testNetworkResult);
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
