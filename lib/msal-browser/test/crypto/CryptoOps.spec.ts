import { expect } from "chai";
import sinon from "sinon";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { GuidGenerator } from "../../src/crypto/GuidGenerator";
import { BrowserCrypto } from "../../src/crypto/BrowserCrypto";
import crypto from "crypto";
import { PkceGenerator } from "../../src/crypto/PkceGenerator";
import { NUM_TESTS } from "../utils/StringConstants";
import { PkceCodes } from "@azure/msal-common";

describe("CryptoOps.ts Unit Tests", () => {

    let cryptoObj: CryptoOps;
    beforeEach(() => {
        cryptoObj = new CryptoOps();
    });

    afterEach(() => {
        sinon.restore();
    });

    it("createNewGuid()", () => {
        expect(GuidGenerator.isGuid(cryptoObj.createNewGuid())).to.be.true;
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
        expect(cryptoObj.base64Encode("")).to.be.empty;
        expect(cryptoObj.base64Encode("f")).to.be.eq("Zg==");
        expect(cryptoObj.base64Encode("fo")).to.be.eq("Zm8=");
        expect(cryptoObj.base64Encode("foo")).to.be.eq("Zm9v");
        expect(cryptoObj.base64Encode("foob")).to.be.eq("Zm9vYg==");
        expect(cryptoObj.base64Encode("fooba")).to.be.eq("Zm9vYmE=");
        expect(cryptoObj.base64Encode("foobar")).to.be.eq("Zm9vYmFy");
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
        expect(cryptoObj.base64Decode("")).to.be.empty;
        expect(cryptoObj.base64Decode("Zg==")).to.be.eq("f");
        expect(cryptoObj.base64Decode("Zm8=")).to.be.eq("fo");
        expect(cryptoObj.base64Decode("Zm9v")).to.be.eq("foo");
        expect(cryptoObj.base64Decode("Zm9vYg==")).to.be.eq("foob");
        expect(cryptoObj.base64Decode("Zm9vYmE=")).to.be.eq("fooba");
        expect(cryptoObj.base64Decode("Zm9vYmFy")).to.be.eq("foobar");
    });

    it("generatePkceCode()", async () => {
        sinon.stub(BrowserCrypto.prototype, <any>"getSubtleCryptoDigest").callsFake(async (algorithm: string, data: Uint8Array): Promise<ArrayBuffer> => {
            expect(algorithm).to.be.eq("SHA-256");
            return crypto.createHash("SHA256").update(Buffer.from(data)).digest();
        });

        /**
         * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
         */
        const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
        const generatedCodes: PkceCodes = await cryptoObj.generatePkceCodes();
        expect(regExp.test(generatedCodes.challenge)).to.be.true;
        expect(regExp.test(generatedCodes.verifier)).to.be.true;
    });
});
