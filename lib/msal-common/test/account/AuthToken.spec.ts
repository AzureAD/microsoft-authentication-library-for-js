import * as AuthToken from "../../src/account/AuthToken";
import {
    TEST_CONFIG,
    TEST_DATA_CLIENT_INFO,
    RANDOM_TEST_GUID,
    TEST_URIS,
    TEST_POP_VALUES,
    TEST_CRYPTO_VALUES,
    TEST_TOKENS,
} from "../test_kit/StringConstants";
import { PkceCodes, ICrypto } from "../../src/crypto/ICrypto";
import {
    ClientAuthErrorMessage,
    ClientAuthError,
} from "../../src/error/ClientAuthError";
import { AuthError } from "../../src/error/AuthError";

// Set up stubs
const idTokenClaims = {
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

const testTokenPayload =
    "eyJ2ZXIiOiIyLjAiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vOTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFkL3YyLjAiLCJzdWIiOiJBQUFBQUFBQUFBQUFBQUFBQUFBQUFJa3pxRlZyU2FTYUZIeTc4MmJidGFRIiwiYXVkIjoiNmNiMDQwMTgtYTNmNS00NmE3LWI5OTUtOTQwYzc4ZjVhZWYzIiwiZXhwIjoxNTM2MzYxNDExLCJpYXQiOjE1MzYyNzQ3MTEsIm5iZiI6MTUzNjI3NDcxMSwibmFtZSI6IkFiZSBMaW5jb2xuIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiQWJlTGlAbWljcm9zb2Z0LmNvbSIsIm9pZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC02NmYzLTMzMzJlY2E3ZWE4MSIsInRpZCI6IjMzMzgwNDBkLTZjNjctNGM1Yi1iMTEyLTM2YTMwNGI2NmRhZCIsIm5vbmNlIjoiMTIzNTIzIiwiYWlvIjoiRGYyVVZYTDFpeCFsTUNXTVNPSkJjRmF0emNHZnZGR2hqS3Y4cTVnMHg3MzJkUjVNQjVCaXN2R1FPN1lXQnlqZDhpUURMcSFlR2JJRGFreXA1bW5PcmNkcUhlWVNubHRlcFFtUnA2QUlaOGpZIn0=";

describe("AuthToken.ts Class Unit Tests", () => {
    let cryptoInterface: ICrypto;
    beforeEach(() => {
        cryptoInterface = {
            createNewGuid(): string {
                return RANDOM_TEST_GUID;
            },
            base64Decode(input: string): string {
                switch (input) {
                    case TEST_POP_VALUES.ENCODED_REQ_CNF:
                        return TEST_POP_VALUES.DECODED_REQ_CNF;
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
                    case TEST_POP_VALUES.DECODED_REQ_CNF:
                        return TEST_POP_VALUES.ENCODED_REQ_CNF;
                    default:
                        return input;
                }
            },
            async generatePkceCodes(): Promise<PkceCodes> {
                return {
                    challenge: TEST_CONFIG.TEST_CHALLENGE,
                    verifier: TEST_CONFIG.TEST_VERIFIER,
                };
            },
            async getPublicKeyThumbprint(): Promise<string> {
                return TEST_POP_VALUES.KID;
            },
            async signJwt(): Promise<string> {
                return "";
            },
            async removeTokenBindingKey(): Promise<boolean> {
                return Promise.resolve(true);
            },
            async clearKeystore(): Promise<boolean> {
                return Promise.resolve(true);
            },
            async hashString(): Promise<string> {
                return Promise.resolve(TEST_CRYPTO_VALUES.TEST_SHA256_HASH);
            },
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("getJWSPayload", () => {
        it("getJWSPayload returns a correctly crackedToken.", () => {
            const sampleJwt = `${TEST_TOKENS.SAMPLE_JWT_HEADER}.${TEST_TOKENS.SAMPLE_JWT_PAYLOAD}.${TEST_TOKENS.SAMPLE_JWT_SIG}`;
            const decodedJwt = AuthToken.getJWSPayload(sampleJwt);

            expect(decodedJwt).toEqual(TEST_TOKENS.SAMPLE_JWT_PAYLOAD);
        });

        it("decodeJwt throws error when given a null token string", (done) => {
            try {
                // @ts-ignore
                AuthToken.getJWSPayload(null);
            } catch (err) {
                expect(err instanceof ClientAuthError).toBe(true);
                expect(err instanceof AuthError).toBe(true);
                expect(err instanceof Error).toBe(true);
                const parsedErr = err as ClientAuthError;
                expect(parsedErr.errorCode).toBe(
                    ClientAuthErrorMessage.nullOrEmptyToken.code
                );
                expect(parsedErr.errorMessage).toContain(
                    ClientAuthErrorMessage.nullOrEmptyToken.desc
                );
                expect(parsedErr.message).toContain(
                    ClientAuthErrorMessage.nullOrEmptyToken.desc
                );
                expect(parsedErr.name).toBe("ClientAuthError");
                expect(parsedErr.stack).toContain("AuthToken.spec.ts");
                done();
            }
        });

        it("decodeJwt throws error when given a empty token string", (done) => {
            try {
                AuthToken.getJWSPayload("");
            } catch (err) {
                expect(err instanceof ClientAuthError).toBe(true);
                expect(err instanceof AuthError).toBe(true);
                expect(err instanceof Error).toBe(true);
                const parsedErr = err as ClientAuthError;
                expect(parsedErr.errorCode).toBe(
                    ClientAuthErrorMessage.nullOrEmptyToken.code
                );
                expect(parsedErr.errorMessage).toContain(
                    ClientAuthErrorMessage.nullOrEmptyToken.desc
                );
                expect(parsedErr.message).toContain(
                    ClientAuthErrorMessage.nullOrEmptyToken.desc
                );
                expect(parsedErr.name).toBe("ClientAuthError");
                expect(parsedErr.stack).toContain("AuthToken.spec.ts");
                done();
            }
        });

        it("decodeJwt throws error when given a malformed token string", (done) => {
            try {
                AuthToken.getJWSPayload(TEST_TOKENS.SAMPLE_MALFORMED_JWT);
            } catch (err) {
                expect(err instanceof ClientAuthError).toBe(true);
                expect(err instanceof AuthError).toBe(true);
                expect(err instanceof Error).toBe(true);
                const parsedErr = err as ClientAuthError;
                expect(parsedErr.errorCode).toBe(
                    ClientAuthErrorMessage.tokenParsingError.code
                );
                expect(parsedErr.errorMessage).toContain(
                    ClientAuthErrorMessage.tokenParsingError.desc
                );
                expect(parsedErr.message).toContain(
                    ClientAuthErrorMessage.tokenParsingError.desc
                );
                expect(parsedErr.name).toBe("ClientAuthError");
                expect(parsedErr.stack).toContain("AuthToken.spec.ts");
                done();
            }
        });
    });

    describe("extractIdToken()", () => {
        it("Throws error if rawIdToken is null or empty", () => {
            expect(() =>
                AuthToken.extractTokenClaims("", cryptoInterface.base64Decode)
            ).toThrowError(ClientAuthErrorMessage.nullOrEmptyToken.desc);
            expect(() =>
                AuthToken.extractTokenClaims("", cryptoInterface.base64Decode)
            ).toThrowError(ClientAuthError);

            // @ts-ignore
            expect(() =>
                AuthToken.extractTokenClaims(null, cryptoInterface)
            ).toThrowError(ClientAuthErrorMessage.nullOrEmptyToken.desc);
            // @ts-ignore
            expect(() =>
                AuthToken.extractTokenClaims(null, cryptoInterface)
            ).toThrowError(ClientAuthError);
        });

        it("Throws error if idToken is null or empty", () => {
            expect(() =>
                AuthToken.extractTokenClaims("", cryptoInterface.base64Decode)
            ).toThrowError(ClientAuthErrorMessage.nullOrEmptyToken.desc);
            expect(() =>
                AuthToken.extractTokenClaims("", cryptoInterface.base64Decode)
            ).toThrowError(ClientAuthError);

            expect(() =>
                // @ts-ignore
                AuthToken.extractTokenClaims(null, cryptoInterface)
            ).toThrowError(ClientAuthErrorMessage.nullOrEmptyToken.desc);
            expect(() =>
                // @ts-ignore
                AuthToken.extractTokenClaims(null, cryptoInterface)
            ).toThrowError(ClientAuthError);
        });

        it("Throws error if payload cannot be parsed", () => {
            expect(() =>
                AuthToken.extractTokenClaims(
                    "not-a-real-token",
                    cryptoInterface.base64Decode
                )
            ).toThrowError(ClientAuthErrorMessage.tokenParsingError.desc);
            expect(() =>
                AuthToken.extractTokenClaims(
                    "not-a-real-token",
                    cryptoInterface.base64Decode
                )
            ).toThrowError(ClientAuthError);
        });

        it("Successfully extracts the idTokenClaims from the decodedJwt", () => {
            expect(
                AuthToken.extractTokenClaims(
                    TEST_TOKENS.IDTOKEN_V2,
                    cryptoInterface.base64Decode
                )
            ).toEqual(idTokenClaims);
        });
    });
});
