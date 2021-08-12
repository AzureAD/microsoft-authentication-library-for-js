import { CryptoOps, CachedKeyPair } from "../../src/crypto/CryptoOps";
import { GuidGenerator } from "../../src/crypto/GuidGenerator";
import { BrowserCrypto } from "../../src/crypto/BrowserCrypto";
import { createHash } from "crypto";
import { PkceCodes, BaseAuthRequest } from "@azure/msal-common";
import { TEST_URIS } from "../utils/StringConstants";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage";
import { BrowserAuthError, BrowserAuthErrorMessage } from "../../src";
const msrCrypto = require("../polyfills/msrcrypto.min");

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

        jest.spyOn(DatabaseStorage.prototype, "delete").mockImplementation(async (key: string): Promise<boolean> => {
            delete dbStorage[key];
            return Promise.resolve(true);
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
        jest.setTimeout(30000);
        //@ts-ignore
        jest.spyOn(BrowserCrypto.prototype as any, "getSubtleCryptoDigest").mockImplementation((algorithm: string, data: Uint8Array): Promise<ArrayBuffer> => {
            expect(algorithm).toBe("SHA-256");
            return Promise.resolve(createHash("SHA256").update(Buffer.from(data)).digest());
        });
        const generateKeyPairSpy = jest.spyOn(BrowserCrypto.prototype, "generateKeyPair");
        const exportJwkSpy = jest.spyOn(BrowserCrypto.prototype, "exportJwk");
        const pkThumbprint = await cryptoObj.getPublicKeyThumbprint({resourceRequestMethod: "POST", resourceRequestUri: TEST_URIS.TEST_AUTH_ENDPT_WITH_PARAMS} as BaseAuthRequest);
        /**
         * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
         */
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        expect(generateKeyPairSpy).toHaveBeenCalledWith(true, ["sign", "verify"]);
        const result = await generateKeyPairSpy.mock.results[0].value;
        expect(exportJwkSpy).toHaveBeenCalledWith(result.publicKey);
        expect(regExp.test(pkThumbprint)).toBe(true);
        expect(Object.keys(dbStorage[pkThumbprint])).not.toHaveLength(0);
    }, 30000);

    it("removeTokenBindingKey() removes the specified key from storage", async () => {
        //@ts-ignore
        jest.spyOn(BrowserCrypto.prototype as any, "getSubtleCryptoDigest").mockImplementation((algorithm: string, data: Uint8Array): Promise<ArrayBuffer> => {
            expect(algorithm).toBe("SHA-256");
            return Promise.resolve(createHash("SHA256").update(Buffer.from(data)).digest());
        });
        const pkThumbprint = await cryptoObj.getPublicKeyThumbprint({resourceRequestMethod: "POST", resourceRequestUri: TEST_URIS.TEST_AUTH_ENDPT_WITH_PARAMS} as BaseAuthRequest);
        const keyDeleted = await cryptoObj.removeTokenBindingKey(pkThumbprint);
        expect(dbStorage[pkThumbprint]).toBe(undefined);
        expect(keyDeleted).toBe(true);
    }, 30000);

    it("signJwt() throws signingKeyNotFoundInStorage error if signing keypair is not found in storage", async () => {
        jest.spyOn(DatabaseStorage.prototype, "get").mockResolvedValue(undefined);
        return await expect(cryptoObj.signJwt({}, "testString")).rejects.toThrow(BrowserAuthError.createSigningKeyNotFoundInStorageError("testString"));
    }, 30000);
});
