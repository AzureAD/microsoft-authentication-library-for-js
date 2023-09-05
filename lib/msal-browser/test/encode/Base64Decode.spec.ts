import { base64Decode } from "../../src/encode/Base64Decode";
import { IdTokenClaims, Constants } from "@azure/msal-common";
import {
    TEST_DATA_CLIENT_INFO,
    TEST_URIS,
    TEST_CONFIG,
    RANDOM_TEST_GUID,
} from "../utils/StringConstants";
import { base64Encode } from "../../src/encode/Base64Encode";
import { CommonAuthorizationCodeRequest } from "@azure/msal-common";

describe("Base64Decode.ts Unit Tests", () => {
    describe("decode", () => {
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
            expect(base64Decode("")).toHaveLength(0);
            expect(base64Decode("Zg==")).toBe("f");
            expect(base64Decode("Zm8=")).toBe("fo");
            expect(base64Decode("Zm9v")).toBe("foo");
            expect(base64Decode("Zm9vYg==")).toBe("foob");
            expect(base64Decode("Zm9vYmE=")).toBe("fooba");
            expect(base64Decode("Zm9vYmFy")).toBe("foobar");
        });

        it("RFC 4648 Test Vectors without '='", () => {
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
            expect(base64Decode("")).toHaveLength(0);
            expect(base64Decode("Zg")).toBe("f");
            expect(base64Decode("Zm8")).toBe("fo");
            expect(base64Decode("Zm9v")).toBe("foo");
            expect(base64Decode("Zm9vYg")).toBe("foob");
            expect(base64Decode("Zm9vYmE")).toBe("fooba");
            expect(base64Decode("Zm9vYmFy")).toBe("foobar");
        });

        it("MSAL Test Vectors", () => {
            // Client Info B64
            expect(base64Decode(TEST_DATA_CLIENT_INFO.TEST_UID_ENCODED)).toBe(
                TEST_DATA_CLIENT_INFO.TEST_UID
            );
            expect(base64Decode(TEST_DATA_CLIENT_INFO.TEST_UTID_ENCODED)).toBe(
                TEST_DATA_CLIENT_INFO.TEST_UTID
            );
            expect(
                base64Decode(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO)
            ).toBe(TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO);

            // Id token claims B64
            const idTokenClaims: IdTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            const stringifiedClaims = JSON.stringify(idTokenClaims);
            expect(base64Decode(base64Encode(stringifiedClaims))).toBe(
                stringifiedClaims
            );

            // Request object B64
            const tokenRequest: CommonAuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}`,
                scopes: [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE],
                code: "thisIsAnAuthCode",
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: `${RANDOM_TEST_GUID}`,
            };
            const stringifiedReq = JSON.stringify(tokenRequest);
            expect(base64Decode(base64Encode(stringifiedReq))).toBe(
                stringifiedReq
            );
        });

        it("Percent encoded URI", () => {
            expect(
                base64Decode(
                    base64Encode(
                        TEST_URIS.TEST_REDIR_WITH_PERCENTENCODED_SYMBOLS_URI
                    )
                )
            ).toBe(TEST_URIS.TEST_REDIR_WITH_PERCENTENCODED_SYMBOLS_URI);
        });
    });
});
