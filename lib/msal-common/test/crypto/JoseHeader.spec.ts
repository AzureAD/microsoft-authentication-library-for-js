import { JoseHeader } from "../../src/crypto/JoseHeader";
import { JoseHeaderErrorCodes } from "../../src/error/JoseHeaderError";
import { JsonWebTokenTypes } from "../../src/utils/Constants";
import {
    TEST_CRYPTO_ALGORITHMS,
    TEST_CONFIG,
    TEST_POP_VALUES,
} from "../test_kit/StringConstants";
import { getDefaultErrorMessage } from "../../src/error/AuthError.js";

describe("JoseHeader.ts Unit Tests", () => {
    describe("getShrHeaderString", () => {
        it("should return the correct stringified header", () => {
            const shrHeaderString = JoseHeader.getShrHeaderString({
                alg: TEST_CRYPTO_ALGORITHMS.rsa,
                kid: TEST_POP_VALUES.KID,
                typ: JsonWebTokenTypes.Pop,
            });

            expect(shrHeaderString).toBe(
                `{"typ":"${JsonWebTokenTypes.Pop}","alg":"${TEST_CRYPTO_ALGORITHMS.rsa}","kid":"${TEST_POP_VALUES.KID}"}`
            );
        });

        it("should override the typ header if provided", () => {
            const shrHeaderString = JoseHeader.getShrHeaderString({
                alg: TEST_CRYPTO_ALGORITHMS.rsa,
                kid: TEST_POP_VALUES.KID,
                typ: JsonWebTokenTypes.Jwt,
            });

            expect(shrHeaderString).toBe(
                `{"typ":"${JsonWebTokenTypes.Jwt}","alg":"${TEST_CRYPTO_ALGORITHMS.rsa}","kid":"${TEST_POP_VALUES.KID}"}`
            );
        });

        it("should throw if kid header is missing", () => {
            expect(() =>
                JoseHeader.getShrHeaderString({
                    alg: TEST_CRYPTO_ALGORITHMS.rsa,
                    typ: JsonWebTokenTypes.Pop,
                })
            ).toThrowError(
                getDefaultErrorMessage(JoseHeaderErrorCodes.missingKidError)
            );
        });

        it("should include correlationId in missing kid errors when provided", () => {
            try {
                JoseHeader.getShrHeader(
                    {
                        alg: TEST_CRYPTO_ALGORITHMS.rsa,
                        typ: JsonWebTokenTypes.Pop,
                    },
                    TEST_CONFIG.CORRELATION_ID
                );
                throw new Error("Expected getShrHeader to throw");
            } catch (e) {
                expect(e).toHaveProperty(
                    "correlationId",
                    TEST_CONFIG.CORRELATION_ID
                );
            }
        });

        it("should throw if alg header is missing", () => {
            expect(() =>
                JoseHeader.getShrHeaderString({
                    kid: TEST_POP_VALUES.KID,
                    typ: JsonWebTokenTypes.Pop,
                })
            ).toThrowError(
                getDefaultErrorMessage(JoseHeaderErrorCodes.missingAlgError)
            );
        });
    });

    describe("getDpopHeader", () => {
        it("should include correlationId in missing jwk errors when provided", () => {
            try {
                JoseHeader.getDpopHeader(
                    {
                        alg: TEST_CRYPTO_ALGORITHMS.rsa,
                    },
                    TEST_CONFIG.CORRELATION_ID
                );
                throw new Error("Expected getDpopHeader to throw");
            } catch (e) {
                expect(e).toHaveProperty(
                    "correlationId",
                    TEST_CONFIG.CORRELATION_ID
                );
            }
        });
    });
});
