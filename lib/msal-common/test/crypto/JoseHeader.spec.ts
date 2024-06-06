import { JoseHeader } from "../../src/crypto/JoseHeader";
import {
    JoseHeaderErrorCodes,
    JoseHeaderErrorMessages,
} from "../../src/error/JoseHeaderError";
import { JsonWebTokenTypes } from "../../src/utils/Constants";
import {
    TEST_CRYPTO_ALGORITHMS,
    TEST_POP_VALUES,
} from "../test_kit/StringConstants";

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
                JoseHeaderErrorMessages[JoseHeaderErrorCodes.missingKidError]
            );
        });

        it("should throw if alg header is missing", () => {
            expect(() =>
                JoseHeader.getShrHeaderString({
                    kid: TEST_POP_VALUES.KID,
                    typ: JsonWebTokenTypes.Pop,
                })
            ).toThrowError(
                JoseHeaderErrorMessages[JoseHeaderErrorCodes.missingAlgError]
            );
        });
    });
});
