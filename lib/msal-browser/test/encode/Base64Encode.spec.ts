import { IdTokenClaims } from "@azure/msal-common";
import { base64Encode, urlEncode } from "../../src/encode/Base64Encode";
import { TEST_DATA_CLIENT_INFO, TEST_URIS } from "../utils/StringConstants";

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

        it("Encode idtokenclaims with special characters", () => {
            // Id token claims B64
            const idTokenClaims: IdTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "TeamSpirit_制御ポリシー博俊 中",
                preferred_username: "charTest@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };

            const expectedEncodedString =
                "eyJ2ZXIiOiIyLjAiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vOTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFkL3YyLjAiLCJzdWIiOiJBQUFBQUFBQUFBQUFBQUFBQUFBQUFJa3pxRlZyU2FTYUZIeTc4MmJidGFRIiwiZXhwIjoxNTM2MzYxNDExLCJuYW1lIjoiVGVhbVNwaXJpdF/liLblvqHjg53jg6rjgrfjg7zljZrkv4og5LitIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiY2hhclRlc3RAbWljcm9zb2Z0LmNvbSIsIm9pZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC02NmYzLTMzMzJlY2E3ZWE4MSIsInRpZCI6IjMzMzgwNDBkLTZjNjctNGM1Yi1iMTEyLTM2YTMwNGI2NmRhZCIsIm5vbmNlIjoiMTIzNTIzIn0=";

            const stringifiedClaims = JSON.stringify(idTokenClaims);
            expect(base64Encode(stringifiedClaims)).toBe(expectedEncodedString);
        });
    });
});
