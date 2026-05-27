import * as AuthToken from "../../src/account/AuthToken";
import { TEST_TOKENS, ID_TOKEN_CLAIMS } from "../test_kit/StringConstants";
import { ICrypto } from "../../src/crypto/ICrypto";
import {
    ClientAuthErrorCodes,
    ClientAuthError,
} from "../../src/error/ClientAuthError";
import { AuthError } from "../../src/error/AuthError";
import { mockCrypto } from "../client/ClientTestUtils.js";

describe("AuthToken.ts Class Unit Tests", () => {
    let cryptoInterface: ICrypto;
    beforeEach(() => {
        cryptoInterface = mockCrypto;
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
                    ClientAuthErrorCodes.nullOrEmptyToken
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
                    ClientAuthErrorCodes.nullOrEmptyToken
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
                    ClientAuthErrorCodes.tokenParsingError
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
            ).toThrow(
                new ClientAuthError(ClientAuthErrorCodes.nullOrEmptyToken, "")
            );

            expect(() =>
                // @ts-ignore
                AuthToken.extractTokenClaims(null, cryptoInterface)
            ).toThrow(
                new ClientAuthError(ClientAuthErrorCodes.nullOrEmptyToken, "")
            );
        });

        it("Throws error if idToken is null or empty", () => {
            expect(() =>
                AuthToken.extractTokenClaims("", cryptoInterface.base64Decode)
            ).toThrow(
                new ClientAuthError(ClientAuthErrorCodes.nullOrEmptyToken, "")
            );

            expect(() =>
                // @ts-ignore
                AuthToken.extractTokenClaims(null, cryptoInterface)
            ).toThrow(
                new ClientAuthError(ClientAuthErrorCodes.nullOrEmptyToken, "")
            );
        });

        it("Throws error if payload cannot be parsed", () => {
            expect(() =>
                AuthToken.extractTokenClaims(
                    "not-a-real-token",
                    cryptoInterface.base64Decode
                )
            ).toThrow(
                new ClientAuthError(ClientAuthErrorCodes.tokenParsingError, "")
            );
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

    describe("isKmsi()", () => {
        it("Returns false if claims don't contain signin_state", () => {
            expect(AuthToken.isKmsi({})).toBe(false);
        });

        it("Returns false if signin_state claim does not contain kmsi", () => {
            expect(
                AuthToken.isKmsi({
                    signin_state: ["not-kmsi", "other-value"],
                })
            ).toBe(false);
        });

        it("Returns true if signin_state claim contains kmsi", () => {
            expect(
                AuthToken.isKmsi({
                    signin_state: ["kmsi", "other-value"],
                })
            ).toBe(true);
        });

        it("Returns true if signin_state contains kmsi in uppercase", () => {
            expect(
                AuthToken.isKmsi({
                    signin_state: ["KMSI"],
                })
            ).toBe(true);
        });

        it("Returns true if signin_state contains kmsi with leading/trailing whitespace", () => {
            expect(
                AuthToken.isKmsi({
                    signin_state: [" kmsi ", "other-value"],
                })
            ).toBe(true);
        });

        it("Returns true if signin_state claim contains dvc_dmjd", () => {
            expect(
                AuthToken.isKmsi({
                    signin_state: ["dvc_dmjd", "other-value"],
                })
            ).toBe(true);
        });
    });
});
