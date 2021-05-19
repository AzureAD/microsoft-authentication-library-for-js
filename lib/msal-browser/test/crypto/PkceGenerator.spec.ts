import { BrowserCrypto } from "../../src/crypto/BrowserCrypto";
import { createHash } from "crypto";
import { PkceGenerator } from "../../src/crypto/PkceGenerator";
import { PkceCodes } from "@azure/msal-common";
import { NUM_TESTS } from "../utils/StringConstants";

describe("PkceGenerator.ts Unit Tests", () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("generateCodes() generates valid pkce codes", async () => {
        //@ts-ignore
        jest.spyOn(BrowserCrypto.prototype as any, "getSubtleCryptoDigest").mockImplementation((algorithm: string, data: Uint8Array): Promise<ArrayBuffer> => {
            expect(algorithm).toBe("SHA-256");
            return Promise.resolve(createHash("SHA256").update(Buffer.from(data)).digest());
        });
        const browserCrypto = new BrowserCrypto();

        const pkceGenerator = new PkceGenerator(browserCrypto);
        /**
         * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
         */
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        for (let i = 0; i < NUM_TESTS; i++) {
            const generatedCodes: PkceCodes = await pkceGenerator.generateCodes();
            expect(regExp.test(generatedCodes.challenge)).toBe(true);
            expect(regExp.test(generatedCodes.verifier)).toBe(true);
        }
    });

    it("generateCodes() generates valid pkce codes with msCrypto", async () => {
        //@ts-ignore
        jest.spyOn(BrowserCrypto.prototype as any, "getMSCryptoDigest").mockImplementation((algorithm: string, data: Uint8Array): Promise<ArrayBuffer> => {
            expect(algorithm).toBe("SHA-256");
            return Promise.resolve(createHash("SHA256").update(Buffer.from(data)).digest());
        });
        jest.spyOn(BrowserCrypto.prototype as any, "hasIECrypto").mockReturnValue(true);
        const browserCrypto = new BrowserCrypto();

        const pkceGenerator = new PkceGenerator(browserCrypto);
        /**
         * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
         */
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        for (let i = 0; i < NUM_TESTS; i++) {
            const generatedCodes: PkceCodes = await pkceGenerator.generateCodes();
            expect(regExp.test(generatedCodes.challenge)).toBe(true);
            expect(regExp.test(generatedCodes.verifier)).toBe(true);
        }
    });
});
