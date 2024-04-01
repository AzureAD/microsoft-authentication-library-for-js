import { createHash } from "crypto";
import { PkceCodes } from "@azure/msal-common";
import { NUM_TESTS, RANDOM_TEST_GUID } from "../utils/StringConstants";
import * as BrowserCrypto from "../../src/crypto/BrowserCrypto";
import { generatePkceCodes } from "../../src/crypto/PkceGenerator";
import { StubPerformanceClient } from "@azure/msal-common";
import { Logger } from "@azure/msal-common";

describe("PkceGenerator.ts Unit Tests", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("generateCodes() generates valid pkce codes", async () => {
        jest.spyOn(BrowserCrypto, "sha256Digest").mockImplementation(
            //@ts-ignore
            (data: Uint8Array): Promise<ArrayBuffer> => {
                return Promise.resolve(
                    createHash("SHA256").update(Buffer.from(data)).digest(),
                );
            },
        );
        /**
         * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
         */
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        for (let i = 0; i < NUM_TESTS; i++) {
            const generatedCodes: PkceCodes = await generatePkceCodes(
                new StubPerformanceClient(),
                new Logger({}),
                RANDOM_TEST_GUID,
            );
            expect(regExp.test(generatedCodes.challenge)).toBe(true);
            expect(regExp.test(generatedCodes.verifier)).toBe(true);
        }
    });
});
