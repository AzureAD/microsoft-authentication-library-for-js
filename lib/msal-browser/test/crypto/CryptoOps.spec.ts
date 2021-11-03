import { CryptoOps } from "../../src/crypto/CryptoOps";
import { GuidGenerator } from "../../src/crypto/GuidGenerator";
import { BrowserCrypto } from "../../src/crypto/BrowserCrypto";
import { TEST_CONFIG, TEST_URIS, TEST_POP_VALUES } from "../utils/StringConstants";
import { createHash } from "crypto";
import { AuthenticationScheme, BaseAuthRequest, CryptoKeyTypes, Logger, PkceCodes } from "@azure/msal-common";
import { BrowserAuthError } from "../../src";
import { CryptoKeyConfig } from "../../src/utils/CryptoConstants";
const msrCrypto = require("../polyfills/msrcrypto.min");

let mockDatabase = {
    "TestDB.keys": {}
};

// Mock DatabaseStorage
jest.mock("../../src/cache/DatabaseStorage", () => {
    return {
        DatabaseStorage: jest.fn().mockImplementation(() => {
            return {
                dbName: "TestDB",
                version: 1,
                tableName: "TestDB.keys",
                open: () => {},
                getItem: (kid: string) => {
                    return mockDatabase["TestDB.keys"][kid];
                },
                setItem: (kid: string, payload: any) => {
                    mockDatabase["TestDB.keys"][kid] = payload;
                    return mockDatabase["TestDB.keys"][kid];
                },
                removeItem: (kid: string) => {
                    delete mockDatabase["TestDB.keys"][kid];
                },
                containsKey: (kid: string) => {
                    return !!(mockDatabase["TestDB.keys"][kid]);
                }
            }
      })
    }
});

describe("CryptoOps.ts Unit Tests", () => {
    let cryptoObj: CryptoOps;
    let oldWindowCrypto = window.crypto;

    beforeEach(() => {
        cryptoObj = new CryptoOps(new Logger({}));
        oldWindowCrypto = window.crypto;
        //@ts-ignore
        window.crypto = {
            ...oldWindowCrypto,
            ...msrCrypto
        }
    });

    afterEach(() => {
        jest.restoreAllMocks();
        mockDatabase = {
            "TestDB.keys": {}
        };
        //@ts-ignore
        window.crypto = oldWindowCrypto;
    });

    it("createNewGuid()", () => {
        expect(GuidGenerator.isGuid(cryptoObj.createNewGuid())).toBe(true);
    });

    it("base64Encode()", () => {
        /**
         * From RFC 4648 Section 10
         * BASE64("") = ""
         * BASE64("f") = "Zg=="
         * BASE64("fo") = "Zm8="
         * BASE64("foo") = "Zm9v"
         * BASE64("foob") = "Zm9vYg=="
         * BASE64("fooba") = "Zm9vYmE="
         * BASE64("foobar") = "Zm9vYmFy"
         */
        expect(cryptoObj.base64Encode("")).toHaveLength(0);
        expect(cryptoObj.base64Encode("f")).toBe("Zg==");
        expect(cryptoObj.base64Encode("fo")).toBe("Zm8=");
        expect(cryptoObj.base64Encode("foo")).toBe("Zm9v");
        expect(cryptoObj.base64Encode("foob")).toBe("Zm9vYg==");
        expect(cryptoObj.base64Encode("fooba")).toBe("Zm9vYmE=");
        expect(cryptoObj.base64Encode("foobar")).toBe("Zm9vYmFy");
    });

    it("base64Decode()", () => {
        /**
         * From RFC 4648 Section 10
         * BASE64("") = ""
         * BASE64("f") = "Zg=="
         * BASE64("fo") = "Zm8="
         * BASE64("foo") = "Zm9v"
         * BASE64("foob") = "Zm9vYg=="
         * BASE64("fooba") = "Zm9vYmE="
         * BASE64("foobar") = "Zm9vYmFy"
         */
        expect(cryptoObj.base64Decode("")).toHaveLength(0);
        expect(cryptoObj.base64Decode("Zg==")).toBe("f");
        expect(cryptoObj.base64Decode("Zm8=")).toBe("fo");
        expect(cryptoObj.base64Decode("Zm9v")).toBe("foo");
        expect(cryptoObj.base64Decode("Zm9vYg==")).toBe("foob");
        expect(cryptoObj.base64Decode("Zm9vYmE=")).toBe("fooba");
        expect(cryptoObj.base64Decode("Zm9vYmFy")).toBe("foobar");
    });

    it("generatePkceCode() creates a valid Pkce code", async () => {
        //@ts-ignore
        jest.spyOn(BrowserCrypto.prototype as any, "getSubtleCryptoDigest").mockImplementation((algorithm: string, data: Uint8Array): Promise<ArrayBuffer> => {
            expect(algorithm).toBe("SHA-256");
            return Promise.resolve(createHash("SHA256").update(Buffer.from(data)).digest());
        });

        /**
         * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
         */
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        const generatedCodes: PkceCodes = await cryptoObj.generatePkceCodes();
        expect(regExp.test(generatedCodes.challenge)).toBe(true);
        expect(regExp.test(generatedCodes.verifier)).toBe(true);
    });

    it("removeTokenBindingKey() removes the specified key from storage", async () => {
        //@ts-ignore
        jest.spyOn(BrowserCrypto.prototype as any, "getSubtleCryptoDigest").mockImplementation((algorithm: string, data: Uint8Array): Promise<ArrayBuffer> => {
            expect(algorithm).toBe("SHA-256");
            return Promise.resolve(createHash("SHA256").update(Buffer.from(data)).digest());
        });
        const pkThumbprint = await cryptoObj.getPublicKeyThumbprint({resourceRequestMethod: "POST", resourceRequestUri: TEST_URIS.TEST_AUTH_ENDPT_WITH_PARAMS} as BaseAuthRequest);
        const key = mockDatabase["TestDB.keys"][pkThumbprint];
        const keyDeleted = await cryptoObj.removeTokenBindingKey(pkThumbprint);
        expect(key).not.toBe(undefined);
        expect(mockDatabase["TestDB.keys"][pkThumbprint]).toBe(undefined);
        expect(keyDeleted).toBe(true);
    }, 30000);

    it("signJwt() throws signingKeyNotFoundInStorage error if signing keypair is not found in storage", async () => {
        expect(cryptoObj.signJwt({}, "testString")).rejects.toThrow(BrowserAuthError.createSigningKeyNotFoundInStorageError());
    }, 30000);

    describe("getPublicKeyThumbprint", () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("generates a valid request thumbprint", async () => {
            jest.setTimeout(30000);
            //@ts-ignore
            jest.spyOn(BrowserCrypto.prototype as any, "getSubtleCryptoDigest").mockImplementation((algorithm: string, data: Uint8Array): Promise<ArrayBuffer> => {
                expect(algorithm).toBe("SHA-256");
                return Promise.resolve(createHash("SHA256").update(Buffer.from(data)).digest());
            });
            const generateKeyPairSpy = jest.spyOn(BrowserCrypto.prototype, "generateKeyPair");
            const exportJwkSpy = jest.spyOn(BrowserCrypto.prototype, "exportJwk");
            
            const keyType = CryptoKeyTypes.ReqCnf;
    
            const testRequest = {
                authenticationScheme: AuthenticationScheme.POP,
                resourceRequestMethod:"POST",
                resourceRequestUrl: TEST_URIS.TEST_RESOURCE_ENDPT_WITH_PARAMS,
                stkJwk: TEST_POP_VALUES.KID
            };
            
            const pkThumbprint = await cryptoObj.getPublicKeyThumbprint(testRequest, keyType);
            /**
             * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
             */
            const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
            const result = await generateKeyPairSpy.mock.results[0].value;
            expect(result.publicKey.algorithm.name.toLowerCase()).toEqual(CryptoKeyConfig.AccessTokenBinding.keyGenAlgorithmOptions.name.toLowerCase());
            expect(exportJwkSpy).toHaveBeenCalledWith(result.publicKey);
            expect(regExp.test(pkThumbprint)).toBe(true);
            expect(mockDatabase["TestDB.keys"][pkThumbprint]).not.toBe(undefined);
        }, 30000);

        it("generates a valid stk_jwk thumbprint", async () => {
            //@ts-ignore
            jest.spyOn(BrowserCrypto.prototype as any, "getSubtleCryptoDigest").mockImplementation((algorithm: string, data: Uint8Array): Promise<ArrayBuffer> => {
                expect(algorithm).toBe("SHA-256");
                return Promise.resolve(createHash("SHA256").update(Buffer.from(data)).digest());
            });
            const generateKeyPairSpy = jest.spyOn(BrowserCrypto.prototype, "generateKeyPair");
            const exportJwkSpy = jest.spyOn(BrowserCrypto.prototype, "exportJwk");
    
            const keyType = CryptoKeyTypes.StkJwk;
    
            const pkThumbprint = await cryptoObj.getPublicKeyThumbprint({}, keyType);
            /**
             * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
             */
            const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
            const result = await generateKeyPairSpy.mock.results[0].value;
    
            expect(result.publicKey.algorithm.name.toLowerCase()).toEqual(CryptoKeyConfig.RefreshTokenBinding.keyGenAlgorithmOptions.name.toLowerCase());
            expect(result.privateKey.algorithm.name.toLowerCase()).toEqual(CryptoKeyConfig.RefreshTokenBinding.keyGenAlgorithmOptions.name.toLowerCase());
            expect(exportJwkSpy).toHaveBeenCalledWith(result.publicKey);
            expect(regExp.test(pkThumbprint)).toBe(true);
            expect(Object.keys(mockDatabase["TestDB.keys"][pkThumbprint])).not.toBe(undefined);
        }, 30000);

        it("throws error if key generation fails", async () => {
            //@ts-ignore
            jest.spyOn(BrowserCrypto.prototype, "generateKeyPair").mockReturnValue(undefined);
            expect(() => cryptoObj.getPublicKeyThumbprint({})).rejects.toThrow(BrowserAuthError.createKeyGenerationFailedError());
        });
    });
});
