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
    describe("getShrHeader", () => {
        it("should return the correct header", () => {
            const shrHeader = JoseHeader.getShrHeader(
                {
                    alg: TEST_CRYPTO_ALGORITHMS.rsa,
                    kid: TEST_POP_VALUES.KID,
                    typ: JsonWebTokenTypes.Pop,
                },
                TEST_CONFIG.CORRELATION_ID
            );

            expect(shrHeader).toEqual(
                new JoseHeader(
                    {
                        typ: JsonWebTokenTypes.Pop,
                        alg: TEST_CRYPTO_ALGORITHMS.rsa,
                        kid: TEST_POP_VALUES.KID,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            );
        });

        it("should override the typ header if provided", () => {
            const shrHeader = JoseHeader.getShrHeader(
                {
                    alg: TEST_CRYPTO_ALGORITHMS.rsa,
                    kid: TEST_POP_VALUES.KID,
                    typ: JsonWebTokenTypes.Jwt,
                },
                TEST_CONFIG.CORRELATION_ID
            );

            expect(shrHeader).toEqual(
                new JoseHeader(
                    {
                        typ: JsonWebTokenTypes.Jwt,
                        alg: TEST_CRYPTO_ALGORITHMS.rsa,
                        kid: TEST_POP_VALUES.KID,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            );
        });

        it("should drop unsupported SHR header members", () => {
            const shrHeader = JoseHeader.getShrHeader(
                {
                    alg: TEST_CRYPTO_ALGORITHMS.rsa,
                    kid: TEST_POP_VALUES.KID,
                    typ: JsonWebTokenTypes.Pop,
                    crit: ["x-test"],
                    "x-test": true,
                } as any,
                TEST_CONFIG.CORRELATION_ID
            );

            expect(shrHeader).toEqual(
                new JoseHeader(
                    {
                        typ: JsonWebTokenTypes.Pop,
                        alg: TEST_CRYPTO_ALGORITHMS.rsa,
                        kid: TEST_POP_VALUES.KID,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            );
        });

        it("should throw if kid header is missing", () => {
            expect(() =>
                JoseHeader.getShrHeader(
                    {
                        alg: TEST_CRYPTO_ALGORITHMS.rsa,
                        typ: JsonWebTokenTypes.Pop,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
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
                JoseHeader.getShrHeader(
                    {
                        kid: TEST_POP_VALUES.KID,
                        typ: JsonWebTokenTypes.Pop,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toThrowError(
                getDefaultErrorMessage(JoseHeaderErrorCodes.missingAlgError)
            );
        });

        it("should throw if alg header is empty during direct construction", () => {
            expect(
                () =>
                    new JoseHeader(
                        {
                            typ: JsonWebTokenTypes.Pop,
                            alg: "",
                            kid: TEST_POP_VALUES.KID,
                        },
                        TEST_CONFIG.CORRELATION_ID
                    )
            ).toThrowError(
                getDefaultErrorMessage(JoseHeaderErrorCodes.missingAlgError)
            );
        });
    });

    describe("getDpopHeader", () => {
        it("should return a DPoP header with the provided JWK", () => {
            const jwk = {
                kty: "EC",
                crv: "P-256",
                x: "A".repeat(43),
                y: "B".repeat(43),
            };
            const dpopHeader = JoseHeader.getDpopHeader(
                {
                    alg: "ES256",
                    jwk,
                },
                TEST_CONFIG.CORRELATION_ID
            );

            expect(dpopHeader).toEqual(
                new JoseHeader(
                    {
                        typ: JsonWebTokenTypes.Dpop,
                        alg: "ES256",
                        jwk,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            );
        });

        it("should drop unsupported DPoP header members", () => {
            const jwk = {
                kty: "EC",
                crv: "P-256",
                x: "A".repeat(43),
                y: "B".repeat(43),
            };
            const dpopHeader = JoseHeader.getDpopHeader(
                {
                    alg: "ES256",
                    typ: JsonWebTokenTypes.Dpop,
                    jwk,
                    crit: ["x-test"],
                    "x-test": true,
                } as any,
                TEST_CONFIG.CORRELATION_ID
            );

            expect(dpopHeader).toEqual(
                new JoseHeader(
                    {
                        typ: JsonWebTokenTypes.Dpop,
                        alg: "ES256",
                        jwk,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            );
        });

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

        it("should throw if DPoP public JWK is empty", () => {
            expect(() =>
                JoseHeader.getDpopHeader(
                    {
                        alg: "ES256",
                        jwk: {},
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toThrowError(
                getDefaultErrorMessage(JoseHeaderErrorCodes.invalidJwkError)
            );
        });

        it("should throw if DPoP public JWK is not an object", () => {
            expect(() =>
                JoseHeader.getDpopHeader(
                    {
                        alg: "ES256",
                        typ: JsonWebTokenTypes.Dpop,
                        jwk: "not-a-jwk",
                    } as any,
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toThrowError(
                getDefaultErrorMessage(JoseHeaderErrorCodes.missingJwkError)
            );
        });

        it("should throw if DPoP public JWK is an array", () => {
            expect(() =>
                JoseHeader.getDpopHeader(
                    {
                        alg: "ES256",
                        typ: JsonWebTokenTypes.Dpop,
                        jwk: [
                            {
                                kty: "EC",
                            },
                        ] as any,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toThrowError(
                getDefaultErrorMessage(JoseHeaderErrorCodes.missingJwkError)
            );
        });

        it("should allow DPoP public JWKs with null prototypes", () => {
            const jwk = Object.assign(Object.create(null), {
                kty: "EC",
                crv: "P-256",
                x: "A".repeat(43),
                y: "B".repeat(43),
            });

            const dpopHeader = JoseHeader.getDpopHeader(
                {
                    alg: "ES256",
                    jwk,
                },
                TEST_CONFIG.CORRELATION_ID
            );

            expect(dpopHeader).toEqual(
                new JoseHeader(
                    {
                        typ: JsonWebTokenTypes.Dpop,
                        alg: "ES256",
                        jwk,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            );
        });
    });
});
