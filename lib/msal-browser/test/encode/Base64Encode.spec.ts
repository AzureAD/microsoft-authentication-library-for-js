import { base64Encode, urlEncode } from "../../src/encode/Base64Encode";
import { TEST_DATA_CLIENT_INFO } from "../utils/StringConstants";

describe("Base64Encode.ts Unit Tests", () => {
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
            expect(base64Encode("")).toHaveLength(0);
            expect(base64Encode("f")).toBe("Zg==");
            expect(base64Encode("fo")).toBe("Zm8=");
            expect(base64Encode("foo")).toBe("Zm9v");
            expect(base64Encode("foob")).toBe("Zm9vYg==");
            expect(base64Encode("fooba")).toBe("Zm9vYmE=");
            expect(base64Encode("foobar")).toBe("Zm9vYmFy");
        });

        it("MSAL Test Vectors", () => {
            // Client Info B64
            expect(base64Encode(TEST_DATA_CLIENT_INFO.TEST_UID)).toBe(
                TEST_DATA_CLIENT_INFO.TEST_UID_ENCODED
            );
            expect(base64Encode(TEST_DATA_CLIENT_INFO.TEST_UTID)).toBe(
                TEST_DATA_CLIENT_INFO.TEST_UTID_ENCODED
            );
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
            expect(urlEncode("")).toHaveLength(0);
            expect(urlEncode("f")).toBe("Zg");
            expect(urlEncode("fo")).toBe("Zm8");
            expect(urlEncode("foo")).toBe("Zm9v");
            expect(urlEncode("foob")).toBe("Zm9vYg");
            expect(urlEncode("fooba")).toBe("Zm9vYmE");
            expect(urlEncode("foobar")).toBe("Zm9vYmFy");
        });

        it("MSAL Test Vectors", () => {
            // Client Info B64
            expect(urlEncode(TEST_DATA_CLIENT_INFO.TEST_UID)).toBe(
                TEST_DATA_CLIENT_INFO.TEST_UID_ENCODED
            );
            expect(urlEncode(TEST_DATA_CLIENT_INFO.TEST_UTID)).toBe(
                TEST_DATA_CLIENT_INFO.TEST_UTID_URLENCODED
            );
        });
    });
});
