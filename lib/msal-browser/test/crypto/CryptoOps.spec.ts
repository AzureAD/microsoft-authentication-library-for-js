import { CryptoOps, CachedKeyPair } from "../../src/crypto/CryptoOps";
import { GuidGenerator } from "../../src/crypto/GuidGenerator";
import { BrowserCrypto } from "../../src/crypto/BrowserCrypto";
import { TEST_CONFIG, TEST_URIS, TEST_POP_VALUES } from "../utils/StringConstants";
import { createHash } from "crypto";
import { AuthenticationScheme, PkceCodes } from "@azure/msal-common";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage";
import { CRYPTO_KEY_CONFIG } from "../../src/utils/CryptoConstants";
import { DBTableNames } from "../../src/utils/BrowserConstants";

const msrCrypto = require("../polyfills/msrcrypto.min");


describe("CryptoOps.ts Unit Tests", () => {
    let cryptoObj: CryptoOps;
    let dbStorage = { "asymmetricKeys": { }, "symmetricKeys": {} };
    let oldWindowCrypto = window.crypto;
    beforeEach(() => {
        jest.spyOn(DatabaseStorage.prototype, "open").mockImplementation(async (): Promise<void> => {
            dbStorage.asymmetricKeys = {};
            dbStorage.symmetricKeys = {};
        });

        jest.spyOn(DatabaseStorage.prototype, "put").mockImplementation(async (tableName: string, key: string, payload: any): Promise<void> => {
            dbStorage[tableName][key] = payload;
        });
        cryptoObj = new CryptoOps();

        oldWindowCrypto = window.crypto;
        //@ts-ignore
        window.crypto = {
            ...oldWindowCrypto,
            ...msrCrypto
        }
    });

    afterEach(() => {
        jest.restoreAllMocks();
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

    it("getPublicKeyThumbprint() generates a valid request thumbprint", async () => {
        //@ts-ignore
        jest.spyOn(BrowserCrypto.prototype as any, "getSubtleCryptoDigest").mockImplementation((algorithm: string, data: Uint8Array): Promise<ArrayBuffer> => {
            expect(algorithm).toBe("SHA-256");
            return Promise.resolve(createHash("SHA256").update(Buffer.from(data)).digest());
        });
        const generateKeyPairSpy = jest.spyOn(BrowserCrypto.prototype, "generateKeyPair");
        const exportJwkSpy = jest.spyOn(BrowserCrypto.prototype, "exportJwk");
        
        const keyType = "req_cnf";

        const testRequest = {
            authority: TEST_CONFIG.validAuthority,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            correlationId: TEST_CONFIG.CORRELATION_ID,
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
        expect(result.publicKey.algorithm.name.toLowerCase()).toEqual(CRYPTO_KEY_CONFIG.AT_BINDING.keyGenAlgorithmOptions.name.toLowerCase());
        expect(exportJwkSpy).toHaveBeenCalledWith(result.publicKey);
        expect(regExp.test(pkThumbprint)).toBe(true);
        expect(Object.keys(dbStorage[DBTableNames.asymmetricKeys][pkThumbprint])).not.toHaveLength(0);
    }, 30000);

    it("getPublicKeyThumbprint() generates a valid stk_jwk thumbprint", async () => {
        //@ts-ignore
        jest.spyOn(BrowserCrypto.prototype as any, "getSubtleCryptoDigest").mockImplementation((algorithm: string, data: Uint8Array): Promise<ArrayBuffer> => {
            expect(algorithm).toBe("SHA-256");
            return Promise.resolve(createHash("SHA256").update(Buffer.from(data)).digest());
        });
        const generateKeyPairSpy = jest.spyOn(BrowserCrypto.prototype, "generateKeyPair");
        const exportJwkSpy = jest.spyOn(BrowserCrypto.prototype, "exportJwk");

        const keyType = "stk_jwk";

        const testRequest = {
            authority: TEST_CONFIG.validAuthority,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            correlationId: TEST_CONFIG.CORRELATION_ID,
        };

        const pkThumbprint = await cryptoObj.getPublicKeyThumbprint(testRequest, keyType);
        /**
         * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
         */
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        const result = await generateKeyPairSpy.mock.results[0].value;

        expect(result.publicKey.algorithm.name.toLowerCase()).toEqual(CRYPTO_KEY_CONFIG.RT_BINDING.keyGenAlgorithmOptions.name.toLowerCase());
        expect(result.privateKey.algorithm.name.toLowerCase()).toEqual(CRYPTO_KEY_CONFIG.RT_BINDING.keyGenAlgorithmOptions.name.toLowerCase());
        expect(exportJwkSpy).toHaveBeenCalledWith(result.publicKey);
        expect(regExp.test(pkThumbprint)).toBe(true);
        expect(Object.keys(dbStorage[DBTableNames.asymmetricKeys][pkThumbprint])).not.toHaveLength(0);
    }, 30000);
});
