import { BrowserCrypto } from "../../src/crypto/BrowserCrypto";
import { createHash } from "crypto";
import { PkceGenerator } from "../../src/crypto/PkceGenerator";
import { Logger, PkceCodes } from "@azure/msal-common";
import { NUM_TESTS } from "../utils/StringConstants";

describe("PkceGenerator.ts Unit Tests", () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("generateCodes() generates valid pkce codes", async () => {
        //@ts-ignore
        jest.spyOn(BrowserCrypto.prototype, "sha256Digest").mockImplementation(
            //@ts-ignore
            (data: Uint8Array): Promise<ArrayBuffer> => {
                return Promise.resolve(
                    createHash("SHA256").update(Buffer.from(data)).digest()
                );
            }
        );
        const browserCrypto = new BrowserCrypto(new Logger({}));

        const pkceGenerator = new PkceGenerator(browserCrypto);
        /**
         * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
         */
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        for (let i = 0; i < NUM_TESTS; i++) {
            const generatedCodes: PkceCodes =
                await pkceGenerator.generateCodes();
            expect(regExp.test(generatedCodes.challenge)).toBe(true);
            expect(regExp.test(generatedCodes.verifier)).toBe(true);
        }
    });
});
