import chai from "chai";
import chaiAsPromised from "chai-as-promised";
const expect = chai.expect;
chai.use(chaiAsPromised);
import sinon from "sinon";
import { MsalConfiguration, buildMsalConfiguration } from "../../../src/app/config/MsalConfiguration";
import { PKCECodes } from "../../../src/utils/crypto/ICrypto";

describe("MsalConfiguration.ts Class Unit Tests", () => {

    const notImplString = " has not been implemented for the cacheStorage interface."

    it("buildMsalConfiguration assigns default functions", () => {
        let emptyConfig: MsalConfiguration = buildMsalConfiguration({});
        let consoleSpy = sinon.spy(console, "log");
        // Crypto interface checks
        expect(emptyConfig.cryptoInterface).to.be.not.null;
        expect(emptyConfig.cryptoInterface.base64Decode).to.be.not.null;
        expect(emptyConfig.cryptoInterface.base64Decode("test input")).to.be.empty;
        expect(emptyConfig.cryptoInterface.base64Encode).to.be.not.null;
        expect(emptyConfig.cryptoInterface.base64Encode("test input")).to.be.empty;
        expect(emptyConfig.cryptoInterface.generatePKCECodes).to.be.not.null;
        expect(emptyConfig.cryptoInterface.generatePKCECodes()).to.eventually.be.null;
        // Storage interface checks
        expect(emptyConfig.storageInterface).to.be.not.null;
        expect(emptyConfig.storageInterface.clear).to.be.not.null;
        emptyConfig.storageInterface.clear();
        expect(consoleSpy.calledWith("clear()" + notImplString)).to.be.true;
        expect(emptyConfig.storageInterface.containsKey).to.be.not.null;
        expect(emptyConfig.storageInterface.containsKey("testKey")).to.be.false;
        expect(emptyConfig.storageInterface.getItem).to.be.not.null;
        expect(emptyConfig.storageInterface.getItem("testKey")).to.be.empty;
        expect(emptyConfig.storageInterface.getKeys).to.be.not.null;
        expect(emptyConfig.storageInterface.getKeys()).to.be.null;
        expect(emptyConfig.storageInterface.removeItem).to.be.not.null;
        emptyConfig.storageInterface.removeItem("testKey");
        expect(consoleSpy.calledWith("removeItem()" + notImplString)).to.be.true;
        expect(emptyConfig.storageInterface.setItem).to.be.not.null;
        emptyConfig.storageInterface.setItem("testKey", "testValue");
        expect(consoleSpy.calledWith("setItem()" + notImplString)).to.be.true;
        // Network interface checks
        expect(emptyConfig.networkInterface).to.be.not.null;
        expect(emptyConfig.networkInterface.sendRequestAsync).to.be.not.null;
        expect(emptyConfig.networkInterface.sendRequestAsync("", null)).to.eventually.be.null;
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

    const testPKCECodes = {
        challenge: "TestChallenge",
        verifier: "TestVerifier"
    } as PKCECodes;

    const testNetworkResult = {
        testParam: "testValue"
    };

    const testKeySet = ["testKey1", "testKey2"];

    it("buildMsalConfiguration correctly assigns new values", () => {
        let newConfig: MsalConfiguration = buildMsalConfiguration({
            cryptoInterface: {
                base64Decode: (input: string): string => {
                    return "testDecodedString";
                },
                base64Encode: (input: string): string => {
                    return "testEncodedString";
                },
                generatePKCECodes: async (): Promise<PKCECodes> => {
                    return testPKCECodes;
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
                sendRequestAsync: async (url: string, method: RequestInit, enableCaching?: boolean): Promise<any> => {
                    return testNetworkResult;
                }
            }
        });
        // Crypto interface tests
        expect(newConfig.cryptoInterface).to.be.not.null;
        expect(newConfig.cryptoInterface.base64Decode).to.be.not.null;
        expect(newConfig.cryptoInterface.base64Decode("testString")).to.be.eq("testDecodedString");
        expect(newConfig.cryptoInterface.base64Encode).to.be.not.null;
        expect(newConfig.cryptoInterface.base64Encode("testString")).to.be.eq("testEncodedString");
        expect(newConfig.cryptoInterface.generatePKCECodes).to.be.not.null;
        expect(newConfig.cryptoInterface.generatePKCECodes()).to.eventually.eq(testPKCECodes);
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
        expect(newConfig.networkInterface.sendRequestAsync).to.be.not.null;
        expect(newConfig.networkInterface.sendRequestAsync("", null)).to.eventually.eq(testNetworkResult);
    });
});
