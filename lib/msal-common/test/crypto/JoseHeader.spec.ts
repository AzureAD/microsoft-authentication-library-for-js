import { JoseHeader } from "../../src/crypto/JoseHeader";
import { JoseHeaderErrorMessage } from "../../src/error/JoseHeaderError";
import { JsonTypes } from "../../src/utils/Constants";
import { TEST_CRYPTO_ALGORITHMS, TEST_POP_VALUES } from "../test_kit/StringConstants";

describe("JoseHeader.ts Unit Tests", () => {
	describe("getShrHeaderString", () => {
		it("should return the correct stringified header", () => {
			const shrHeaderString = JoseHeader.getShrHeaderString({
				alg: TEST_CRYPTO_ALGORITHMS.rsa,
				kid: TEST_POP_VALUES.KID
			});

			expect(shrHeaderString).toBe(`{"typ":"${JsonTypes.Jwt}","alg":"${TEST_CRYPTO_ALGORITHMS.rsa}","kid":"${TEST_POP_VALUES.KID}"}`);
		});

		it("should throw if kid header is missing", () => {
			expect(() => JoseHeader.getShrHeaderString({ alg: TEST_CRYPTO_ALGORITHMS.rsa })).toThrowError(JoseHeaderErrorMessage.missingKidError.desc);
		});

		it("should throw if kid header is missing", () => {
			expect(() => JoseHeader.getShrHeaderString({ kid: TEST_POP_VALUES.KID })).toThrowError(JoseHeaderErrorMessage.missingAlgError.desc);
		});
	});
});