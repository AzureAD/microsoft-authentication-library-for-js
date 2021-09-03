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
            expect(b64Encode.encode("")).toHaveLength(0);
            expect(b64Encode.encode("f")).toBe("Zg==");
            expect(b64Encode.encode("fo")).toBe("Zm8=");
            expect(b64Encode.encode("foo")).toBe("Zm9v");
            expect(b64Encode.encode("foob")).toBe("Zm9vYg==");
            expect(b64Encode.encode("fooba")).toBe("Zm9vYmE=");
            expect(b64Encode.encode("foobar")).toBe("Zm9vYmFy");
        });

        it("MSAL Test Vectors", () => {
            // Client Info B64
            expect(b64Encode.encode(TEST_DATA_CLIENT_INFO.TEST_UID)).toBe(TEST_DATA_CLIENT_INFO.TEST_UID_ENCODED);
            expect(b64Encode.encode(TEST_DATA_CLIENT_INFO.TEST_UTID)).toBe(TEST_DATA_CLIENT_INFO.TEST_UTID_ENCODED);
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
            expect(b64Encode.urlEncode("")).toHaveLength(0);
            expect(b64Encode.urlEncode("f")).toBe("Zg");
            expect(b64Encode.urlEncode("fo")).toBe("Zm8");
            expect(b64Encode.urlEncode("foo")).toBe("Zm9v");
            expect(b64Encode.urlEncode("foob")).toBe("Zm9vYg");
            expect(b64Encode.urlEncode("fooba")).toBe("Zm9vYmE");
            expect(b64Encode.urlEncode("foobar")).toBe("Zm9vYmFy");
        });

        it("MSAL Test Vectors", () => {
            // Client Info B64
            expect(b64Encode.urlEncode(TEST_DATA_CLIENT_INFO.TEST_UID)).toBe(TEST_DATA_CLIENT_INFO.TEST_UID_ENCODED);
            expect(b64Encode.urlEncode(TEST_DATA_CLIENT_INFO.TEST_UTID)).toBe(TEST_DATA_CLIENT_INFO.TEST_UTID_URLENCODED);
        });
    });
});
