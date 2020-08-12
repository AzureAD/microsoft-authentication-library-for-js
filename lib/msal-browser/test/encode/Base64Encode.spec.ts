import { expect } from "chai";
import { Base64Encode } from "../../src/encode/Base64Encode";
import { TEST_DATA_CLIENT_INFO } from "../utils/StringConstants";

describe("Base64Encode.ts Unit Tests", () => {

    let b64Encode: Base64Encode;
    beforeEach(() => {
        b64Encode = new Base64Encode();
    });

    describe("encode", () => {
        
        it("RFC 4648 Test Vectors", () => {
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
            expect(b64Encode.encode("")).to.be.empty;
            expect(b64Encode.encode("f")).to.be.eq("Zg==");
            expect(b64Encode.encode("fo")).to.be.eq("Zm8=");
            expect(b64Encode.encode("foo")).to.be.eq("Zm9v");
            expect(b64Encode.encode("foob")).to.be.eq("Zm9vYg==");
            expect(b64Encode.encode("fooba")).to.be.eq("Zm9vYmE=");
            expect(b64Encode.encode("foobar")).to.be.eq("Zm9vYmFy");
        });

        it("MSAL Test Vectors", () => {
            // Client Info B64
            expect(b64Encode.encode(TEST_DATA_CLIENT_INFO.TEST_UID)).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_UID_ENCODED);
            expect(b64Encode.encode(TEST_DATA_CLIENT_INFO.TEST_UTID)).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_UTID_ENCODED);
        });
    });

    describe("urlEncode", () => {
        
        it("RFC 4648 Test Vectors", () => {
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
            expect(b64Encode.urlEncode("")).to.be.empty;
            expect(b64Encode.urlEncode("f")).to.be.eq("Zg");
            expect(b64Encode.urlEncode("fo")).to.be.eq("Zm8");
            expect(b64Encode.urlEncode("foo")).to.be.eq("Zm9v");
            expect(b64Encode.urlEncode("foob")).to.be.eq("Zm9vYg");
            expect(b64Encode.urlEncode("fooba")).to.be.eq("Zm9vYmE");
            expect(b64Encode.urlEncode("foobar")).to.be.eq("Zm9vYmFy");
        });

        it("MSAL Test Vectors", () => {
            // Client Info B64
            expect(b64Encode.urlEncode(TEST_DATA_CLIENT_INFO.TEST_UID)).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_UID_ENCODED);
            expect(b64Encode.urlEncode(TEST_DATA_CLIENT_INFO.TEST_UTID)).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_UTID_URLENCODED);
        });
    });
});
