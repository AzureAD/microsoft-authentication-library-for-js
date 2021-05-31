import { Base64Decode } from "../../src/encode/Base64Decode";
import { IdTokenClaims, Constants } from "@azure/msal-common";
import { TEST_DATA_CLIENT_INFO, TEST_URIS, TEST_CONFIG, RANDOM_TEST_GUID } from "../utils/StringConstants";
import { Base64Encode } from "../../src/encode/Base64Encode";
import { CommonAuthorizationCodeRequest } from "@azure/msal-common";

describe("Base64Decode.ts Unit Tests", () => {

    let b64Decode: Base64Decode;
    beforeEach(() => {
        b64Decode = new Base64Decode();
    });

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
            expect(b64Decode.decode("")).toHaveLength(0);
            expect(b64Decode.decode("Zg==")).toBe("f");
            expect(b64Decode.decode("Zm8=")).toBe("fo");
            expect(b64Decode.decode("Zm9v")).toBe("foo");
            expect(b64Decode.decode("Zm9vYg==")).toBe("foob");
            expect(b64Decode.decode("Zm9vYmE=")).toBe("fooba");
            expect(b64Decode.decode("Zm9vYmFy")).toBe("foobar");
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
            expect(b64Decode.decode("")).toHaveLength(0);
            expect(b64Decode.decode("Zg")).toBe("f");
            expect(b64Decode.decode("Zm8")).toBe("fo");
            expect(b64Decode.decode("Zm9v")).toBe("foo");
            expect(b64Decode.decode("Zm9vYg")).toBe("foob");
            expect(b64Decode.decode("Zm9vYmE")).toBe("fooba");
            expect(b64Decode.decode("Zm9vYmFy")).toBe("foobar");
        });

        it("MSAL Test Vectors", () => {
            const b64Encode = new Base64Encode();

            // Client Info B64
            expect(b64Decode.decode(TEST_DATA_CLIENT_INFO.TEST_UID_ENCODED)).toBe(TEST_DATA_CLIENT_INFO.TEST_UID);
            expect(b64Decode.decode(TEST_DATA_CLIENT_INFO.TEST_UTID_ENCODED)).toBe(TEST_DATA_CLIENT_INFO.TEST_UTID);
            expect(b64Decode.decode(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO)).toBe(TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO);

            // Id token claims B64
            const idTokenClaims: IdTokenClaims = {
                "ver": "2.0",
                "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": 1536361411,
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "nonce": "123523"
            };
            const stringifiedClaims = JSON.stringify(idTokenClaims);
            expect(b64Decode.decode(b64Encode.encode(stringifiedClaims))).toBe(stringifiedClaims);
            
            // Request object B64
            const tokenRequest: CommonAuthorizationCodeRequest = {
				redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}`,
				scopes: [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE],
				code: "thisIsAnAuthCode",
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: `${RANDOM_TEST_GUID}`
            };
            const stringifiedReq = JSON.stringify(tokenRequest);
            expect(b64Decode.decode(b64Encode.encode(stringifiedReq))).toBe(stringifiedReq);
        });

        it("Percent encoded URI", ()=> {
            const b64Encode = new Base64Encode();
            expect(b64Decode.decode(b64Encode.encode(TEST_URIS.TEST_REDIR_WITH_PERCENTENCODED_SYMBOLS_URI))).toBe(TEST_URIS.TEST_REDIR_WITH_PERCENTENCODED_SYMBOLS_URI);
        });
    });
});
