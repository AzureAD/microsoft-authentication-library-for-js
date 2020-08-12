import { expect } from "chai";
import { IdToken } from "../../src/account/IdToken";
import { TEST_CONFIG, TEST_DATA_CLIENT_INFO, RANDOM_TEST_GUID, TEST_TOKENS, TEST_URIS } from "../utils/StringConstants";
import { PkceCodes, ICrypto } from "../../src/crypto/ICrypto";
import sinon from "sinon";
import { ClientAuthErrorMessage, ClientAuthError, StringUtils } from "../../src";
import { DecodedJwt } from "../../src/account/DecodedJwt";

// Set up stubs
const idTokenClaims = {
    "ver": "2.0",
    "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
    "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
    "exp": "1536361411",
    "name": "Abe Lincoln",
    "preferred_username": "AbeLi@microsoft.com",
    "oid": "00000000-0000-0000-66f3-3332eca7ea81",
    "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
    "nonce": "123523",
};

const testTokenPayload = "eyJ2ZXIiOiIyLjAiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vOTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFkL3YyLjAiLCJzdWIiOiJBQUFBQUFBQUFBQUFBQUFBQUFBQUFJa3pxRlZyU2FTYUZIeTc4MmJidGFRIiwiYXVkIjoiNmNiMDQwMTgtYTNmNS00NmE3LWI5OTUtOTQwYzc4ZjVhZWYzIiwiZXhwIjoxNTM2MzYxNDExLCJpYXQiOjE1MzYyNzQ3MTEsIm5iZiI6MTUzNjI3NDcxMSwibmFtZSI6IkFiZSBMaW5jb2xuIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiQWJlTGlAbWljcm9zb2Z0LmNvbSIsIm9pZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC02NmYzLTMzMzJlY2E3ZWE4MSIsInRpZCI6IjMzMzgwNDBkLTZjNjctNGM1Yi1iMTEyLTM2YTMwNGI2NmRhZCIsIm5vbmNlIjoiMTIzNTIzIiwiYWlvIjoiRGYyVVZYTDFpeCFsTUNXTVNPSkJjRmF0emNHZnZGR2hqS3Y4cTVnMHg3MzJkUjVNQjVCaXN2R1FPN1lXQnlqZDhpUURMcSFlR2JJRGFreXA1bW5PcmNkcUhlWVNubHRlcFFtUnA2QUlaOGpZIn0=";

describe("IdToken.ts Class Unit Tests", () => {

    let cryptoInterface: ICrypto;
        beforeEach(() => {
            cryptoInterface = {
                createNewGuid(): string {
                    return RANDOM_TEST_GUID;
                },
                base64Decode(input: string): string {
                    switch (input) {
                        case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                            return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                        case testTokenPayload:
                            return JSON.stringify(idTokenClaims);
                        default:
                            return input;
                    }
                },
                base64Encode(input: string): string {
                    switch (input) {
                        case "123-test-uid":
                            return "MTIzLXRlc3QtdWlk";
                        case "456-test-uid":
                            return "NDU2LXRlc3QtdWlk";
                        case "456-test-utid":
                            return "NDU2LXRlc3QtdXRpZA==";
                        default:
                            return input;
                    }
                },
                async generatePkceCodes(): Promise<PkceCodes> {
                    return {
                        challenge: TEST_CONFIG.TEST_CHALLENGE,
                        verifier: TEST_CONFIG.TEST_VERIFIER
                    }
                }
            };
        });

        afterEach(() => {
            sinon.restore();
        });

    describe("Constructor", () => {

        it("Throws error if rawIdToken is null or empty", () => {
            expect(() => new IdToken("", cryptoInterface)).to.throw(ClientAuthErrorMessage.nullOrEmptyIdToken.desc);
            expect(() => new IdToken("", cryptoInterface)).to.throw(ClientAuthError);

            expect(() => new IdToken(null, cryptoInterface)).to.throw(ClientAuthErrorMessage.nullOrEmptyIdToken.desc);
            expect(() => new IdToken(null, cryptoInterface)).to.throw(ClientAuthError);
        });

        it("Successfully sets the rawidToken and claims fields", () => {
            sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);

            const idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);
            expect(idToken.rawIdToken).to.be.eq(TEST_TOKENS.IDTOKEN_V2);
            expect(idToken.claims).to.be.deep.eq(idTokenClaims);
        });
    });

    describe("extractIdToken()", () => {

        it("Throws error if idToken is null or empty", () => {
            expect(() => IdToken.extractIdToken("", cryptoInterface)).to.throw(ClientAuthErrorMessage.nullOrEmptyIdToken.desc);
            expect(() => IdToken.extractIdToken("", cryptoInterface)).to.throw(ClientAuthError);

            expect(() => IdToken.extractIdToken(null, cryptoInterface)).to.throw(ClientAuthErrorMessage.nullOrEmptyIdToken.desc);
            expect(() => IdToken.extractIdToken(null, cryptoInterface)).to.throw(ClientAuthError);
        });

        it("returns null if decodeJwt returns null", () => {
            sinon.stub(StringUtils, "decodeJwt").returns(null);
            expect(IdToken.extractIdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface)).to.be.null;
        });

        it("Throws error if payload cannot be parsed", () => {
            const decodedJwt: DecodedJwt = {
                header: "jwt header",
                JWSPayload: "jws payload",
                JWSSig: "signature"
            };
            sinon.stub(StringUtils, "decodeJwt").returns(decodedJwt);

            expect(() => IdToken.extractIdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface)).to.throw(ClientAuthErrorMessage.idTokenParsingError.desc);
            expect(() => IdToken.extractIdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface)).to.throw(ClientAuthError);
        });

        it("Successfully extracts the idTokenClaims from the decodedJwt", () => {
            const decodedJwt: DecodedJwt = {
                header: JSON.stringify({
                    "typ": "JWT",
                    "alg": "RS256",
                    "kid": "1LTMzakihiRla_8z2BEJVXeWMqo"
                }),
                JWSPayload: testTokenPayload,
                JWSSig: "signature"
            };
            sinon.stub(StringUtils, "decodeJwt").returns(decodedJwt);
            expect(IdToken.extractIdToken(decodedJwt.JWSPayload, cryptoInterface)).to.be.deep.eq(idTokenClaims);
        });
    });
});
