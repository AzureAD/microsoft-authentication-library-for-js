import { CryptoOps, CachedKeyPair } from "../../src/crypto/CryptoOps";
import { GuidGenerator } from "../../src/crypto/GuidGenerator";
import { BrowserCrypto } from "../../src/crypto/BrowserCrypto";
import { TEST_CONFIG, TEST_URIS, BROWSER_CRYPTO, KEY_USAGES, TEST_POP_VALUES } from "../utils/StringConstants";
import { createHash } from "crypto";
import { AuthenticationScheme, PkceCodes } from "@azure/msal-common";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage";
const msrCrypto = require("../polyfills/msrcrypto.min");

const PUBLIC_EXPONENT: Uint8Array = new Uint8Array([0x01, 0x00, 0x01]);

const AT_BINDING_KEY_OPTIONS = {
    keyGenAlgorithmOptions: {
        name: BROWSER_CRYPTO.PKCS1_V15_KEYGEN_ALG,
        hash: {
            name:  BROWSER_CRYPTO.S256_HASH_ALG
        },
        modulusLength: BROWSER_CRYPTO.MODULUS_LENGTH,
        publicExponent: PUBLIC_EXPONENT
    },
    keypairUsages: KEY_USAGES.AT_BINDING.KEYPAIR as KeyUsage[],
    privateKeyUsage: KEY_USAGES.AT_BINDING.PRIVATE_KEY as KeyUsage[]
};

const RT_BINDING_KEY_OPTIONS = {
    keyGenAlgorithmOptions: {
        name: BROWSER_CRYPTO.RSA_OAEP,
        hash: {
            name:  BROWSER_CRYPTO.S256_HASH_ALG
        },
        modulusLength: BROWSER_CRYPTO.MODULUS_LENGTH,
        publicExponent: PUBLIC_EXPONENT
    },
    keypairUsages: KEY_USAGES.RT_BINDING.KEYPAIR as KeyUsage[],
    privateKeyUsage: KEY_USAGES.RT_BINDING.PRIVATE_KEY as KeyUsage[]
};

describe("CryptoOps.ts Unit Tests", () => {
    let cryptoObj: CryptoOps;
    let dbStorage = {};
    let oldWindowCrypto = window.crypto;
    beforeEach(() => {
        jest.spyOn(DatabaseStorage.prototype, "open").mockImplementation(async (): Promise<void> => {
            dbStorage = {};
        });

        jest.spyOn(DatabaseStorage.prototype, "put").mockImplementation(async (key: string, payload: CachedKeyPair): Promise<void> => {
            dbStorage[key] = payload;
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
        expect(result.publicKey.algorithm.name.toLowerCase()).toEqual(AT_BINDING_KEY_OPTIONS.keyGenAlgorithmOptions.name.toLowerCase());
        expect(exportJwkSpy).toHaveBeenCalledWith(result.publicKey);
        expect(regExp.test(pkThumbprint)).toBe(true);
        expect(Object.keys(dbStorage[pkThumbprint])).not.toHaveLength(0);
    });

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
            stkJwk: TEST_POP_VALUES.KID
        };

        const pkThumbprint = await cryptoObj.getPublicKeyThumbprint(testRequest, keyType);
        /**
         * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
         */
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        const result = await generateKeyPairSpy.mock.results[0].value;

        expect(result.publicKey.algorithm.name.toLowerCase()).toEqual(RT_BINDING_KEY_OPTIONS.keyGenAlgorithmOptions.name.toLowerCase());
        expect(result.privateKey.algorithm.name.toLowerCase()).toEqual(RT_BINDING_KEY_OPTIONS.keyGenAlgorithmOptions.name.toLowerCase());
        expect(exportJwkSpy).toHaveBeenCalledWith(result.publicKey);
        expect(regExp.test(pkThumbprint)).toBe(true);
        expect(Object.keys(dbStorage[pkThumbprint])).not.toHaveLength(0);
    }, 30000);
});
