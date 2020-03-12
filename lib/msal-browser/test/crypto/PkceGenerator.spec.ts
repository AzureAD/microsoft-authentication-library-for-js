import { expect } from "chai";
import { BrowserCrypto } from "../../src/crypto/BrowserCrypto";
import crypto from "crypto";
import sinon from "sinon";
import { PkceGenerator } from "../../src/crypto/PkceGenerator";
import { PkceCodes } from "@azure/msal-common";
import { NUM_TESTS } from "../utils/StringConstants";

describe("PkceGenerator.ts Unit Tests", () => {

    afterEach(() => {
        sinon.restore();
    });

    it("generateCodes() generates valid pkce codes", async () => {
        sinon.stub(BrowserCrypto.prototype, <any>"getSubtleCryptoDigest").callsFake(async (algorithm: string, data: Uint8Array): Promise<ArrayBuffer> => {
            expect(algorithm).to.be.eq("SHA-256");
            return crypto.createHash("SHA256").update(Buffer.from(data)).digest();
        });
        const browserCrypto = new BrowserCrypto();

        const pkceGenerator = new PkceGenerator(browserCrypto);
        /**
         * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
         */
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        for (let i = 0; i < NUM_TESTS; i++) {
            const generatedCodes: PkceCodes = await pkceGenerator.generateCodes();
            expect(regExp.test(generatedCodes.challenge)).to.be.true;
            expect(regExp.test(generatedCodes.verifier)).to.be.true;
        }
    });

    it("generateCodes() generates valid pkce codes with msCrypto", async () => {
        sinon.stub(BrowserCrypto.prototype, <any>"getMSCryptoDigest").callsFake(async (algorithm: string, data: Uint8Array): Promise<ArrayBuffer> => {
            expect(algorithm).to.be.eq("SHA-256");
            return crypto.createHash("SHA256").update(Buffer.from(data)).digest();
        });
        sinon.stub(BrowserCrypto.prototype, <any>"hasIECrypto").returns(true);
        const browserCrypto = new BrowserCrypto();

        const pkceGenerator = new PkceGenerator(browserCrypto);
        /**
         * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
         */
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        for (let i = 0; i < NUM_TESTS; i++) {
            const generatedCodes: PkceCodes = await pkceGenerator.generateCodes();
            expect(regExp.test(generatedCodes.challenge)).to.be.true;
            expect(regExp.test(generatedCodes.verifier)).to.be.true;
        }
    });
});
