import * as AuthToken from "../../src/account/AuthToken";
import {
    TEST_DATA_CLIENT_INFO,
    RANDOM_TEST_GUID,
    TEST_POP_VALUES,
    TEST_CRYPTO_VALUES,
    TEST_TOKENS,
    ID_TOKEN_CLAIMS,
} from "../test_kit/StringConstants";
import { ICrypto } from "../../src/crypto/ICrypto";
import {
    ClientAuthErrorMessage,
    ClientAuthError,
} from "../../src/error/ClientAuthError";
import { AuthError } from "../../src/error/AuthError";

const TEST_ID_TOKEN_PAYLOAD = TEST_TOKENS.IDTOKEN_V2.split(".")[1];

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
                    case TEST_ID_TOKEN_PAYLOAD:
                        return JSON.stringify(ID_TOKEN_CLAIMS);
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
            base64UrlEncode(input: string): string {
                switch (input) {
                    case '{"kid": "XnsuAvttTPp0nn1K_YMLePLDbp7syCKhNHt7HjYHJYc"}':
                        return "eyJraWQiOiAiWG5zdUF2dHRUUHAwbm4xS19ZTUxlUExEYnA3c3lDS2hOSHQ3SGpZSEpZYyJ9";
                    default:
                        return input;
                }
            },
            encodeKid(input: string): string {
                switch (input) {
                    case "XnsuAvttTPp0nn1K_YMLePLDbp7syCKhNHt7HjYHJYc":
                        return "eyJraWQiOiAiWG5zdUF2dHRUUHAwbm4xS19ZTUxlUExEYnA3c3lDS2hOSHQ3SGpZSEpZYyJ9";
                    default:
                        return input;
                }
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

            expect(() =>
                // @ts-ignore
                AuthToken.extractTokenClaims(null, cryptoInterface)
            ).toThrowError(ClientAuthErrorMessage.nullOrEmptyToken.desc);
            expect(() =>
                // @ts-ignore
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
            ).toEqual(ID_TOKEN_CLAIMS);
        });
    });
});
