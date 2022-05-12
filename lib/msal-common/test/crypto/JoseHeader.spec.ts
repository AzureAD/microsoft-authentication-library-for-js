import { JoseHeader } from "../../src/crypto/JoseHeader";
import { JoseHeaderErrorMessage } from "../../src/error/JoseHeaderError";
import { JsonTypes } from "../../src/utils/Constants";
import { TEST_CRYPTO_ALGORITHMS, TEST_POP_VALUES } from "../test_kit/StringConstants";

describe("JoseHeader.ts Unit Tests", () => {
	describe("getShrHeaderString", () => {
		it("should return the correct stringified header", () => {
			const joseHeader = new JoseHeader({
				alg: TEST_CRYPTO_ALGORITHMS.rsa,
				kid: TEST_POP_VALUES.KID
			});

			const shrHeaderString = joseHeader.getShrHeaderString();
			expect(shrHeaderString).toBe(`{"typ":"${JsonTypes.Jwt}","alg":"${TEST_CRYPTO_ALGORITHMS.rsa}","kid":"${TEST_POP_VALUES.KID}"}`);
		});

		it("should throw if kid header is missing", () => {
			const joseHeader = new JoseHeader({
				alg: TEST_CRYPTO_ALGORITHMS.rsa,
			});

			expect(() => joseHeader.getShrHeaderString()).toThrowError(JoseHeaderErrorMessage.missingKidError.desc);
		});

		it("should throw if kid header is missing", () => {
			const joseHeader = new JoseHeader({
				kid: TEST_POP_VALUES.KID
			});

			expect(() => joseHeader.getShrHeaderString()).toThrowError(JoseHeaderErrorMessage.missingAlgError.desc);
		});
	});
});