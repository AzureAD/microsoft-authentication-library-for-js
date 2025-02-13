import { createHash } from "crypto";
import { PkceCodes } from "@azure/msal-common";
import { NUM_TESTS, RANDOM_TEST_GUID } from "../utils/StringConstants";
import * as BrowserCrypto from "../../src/crypto/BrowserCrypto";
import {
    generatePkceCodes,
    getPreGeneratedPkceCodes,
    preGeneratePkceCodes,
} from "../../src/crypto/PkceGenerator";
import { StubPerformanceClient } from "@azure/msal-common";
import { Logger } from "@azure/msal-common";

describe("PkceGenerator.ts Unit Tests", () => {
    const logger = new Logger({});

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("generateCodes() generates valid pkce codes", async () => {
        jest.spyOn(BrowserCrypto, "sha256Digest").mockImplementation(
            //@ts-ignore
            (data: Uint8Array): Promise<ArrayBuffer> => {
                return Promise.resolve(
                    createHash("SHA256").update(Buffer.from(data)).digest()
                );
            }
        );
        /**
         * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
         */
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        for (let i = 0; i < NUM_TESTS; i++) {
            const generatedCodes: PkceCodes = await generatePkceCodes(
                new StubPerformanceClient(),
                logger,
                RANDOM_TEST_GUID
            );
            expect(regExp.test(generatedCodes.challenge)).toBe(true);
            expect(regExp.test(generatedCodes.verifier)).toBe(true);
        }
    });

    it("getPkceCodes returns undefined before preGeneratePkceCodes is called", async () => {
        jest.spyOn(BrowserCrypto, "sha256Digest").mockImplementation(
            //@ts-ignore
            (data: Uint8Array): Promise<ArrayBuffer> => {
                return Promise.resolve(
                    createHash("SHA256").update(Buffer.from(data)).digest()
                );
            }
        );
        expect(
            getPreGeneratedPkceCodes(
                new StubPerformanceClient(),
                logger,
                RANDOM_TEST_GUID
            )
        ).toBeUndefined();
    });

    it("getPkceCodes returns value after preGeneratePkceCodes is called", async () => {
        jest.spyOn(BrowserCrypto, "sha256Digest").mockImplementation(
            //@ts-ignore
            (data: Uint8Array): Promise<ArrayBuffer> => {
                return Promise.resolve(
                    createHash("SHA256").update(Buffer.from(data)).digest()
                );
            }
        );
        /**
         * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
         */
        await preGeneratePkceCodes(
            new StubPerformanceClient(),
            logger,
            RANDOM_TEST_GUID
        );

        const pkce = getPreGeneratedPkceCodes(
            new StubPerformanceClient(),
            logger,
            RANDOM_TEST_GUID
        );
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        expect(regExp.test(pkce!.challenge)).toBe(true);
        expect(regExp.test(pkce!.verifier)).toBe(true);
    });

    it("preGeneratePkceCodes overwrites previous value", async () => {
        jest.spyOn(BrowserCrypto, "sha256Digest").mockImplementation(
            //@ts-ignore
            (data: Uint8Array): Promise<ArrayBuffer> => {
                return Promise.resolve(
                    createHash("SHA256").update(Buffer.from(data)).digest()
                );
            }
        );
        /**
         * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
         */
        await preGeneratePkceCodes(
            new StubPerformanceClient(),
            logger,
            RANDOM_TEST_GUID
        );
        const pkce1 = getPreGeneratedPkceCodes(
            new StubPerformanceClient(),
            logger,
            RANDOM_TEST_GUID
        );

        await preGeneratePkceCodes(
            new StubPerformanceClient(),
            logger,
            RANDOM_TEST_GUID
        );
        const pkce2 = getPreGeneratedPkceCodes(
            new StubPerformanceClient(),
            logger,
            RANDOM_TEST_GUID
        );

        expect(pkce1?.challenge).toBeDefined();
        expect(pkce2?.challenge).toBeDefined();
        expect(pkce1?.challenge !== pkce2?.challenge).toBeTruthy();
    });
});
