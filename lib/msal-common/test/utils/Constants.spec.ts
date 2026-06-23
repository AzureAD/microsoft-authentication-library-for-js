import {
    Constants,
    DpopProofGenerator,
} from "../../src/index.js";
import type { DpopProofGenerationOptions } from "../../src/index.js";
import {
    TEST_CRYPTO_ALGORITHMS,
    TEST_SSH_VALUES,
} from "../test_kit/StringConstants.js";
import { mockCrypto } from "../client/ClientTestUtils.js";

describe("Constants Unit Tests", () => {
    it("Maps authentication schemes to token types without regressing legacy schemes", () => {
        expect(Constants.AuthenticationScheme.DPOP).toBe("dpop");
        expect(Constants.DPOP_TOKEN_TYPE).toBe("DPoP");

        expect(
            Constants.getTokenTypeFromAuthenticationScheme(
                Constants.AuthenticationScheme.BEARER
            )
        ).toBe(Constants.AuthenticationScheme.BEARER);
        expect(
            Constants.getTokenTypeFromAuthenticationScheme(
                Constants.AuthenticationScheme.POP
            )
        ).toBe(Constants.AuthenticationScheme.POP);
        expect(
            Constants.getTokenTypeFromAuthenticationScheme(
                Constants.AuthenticationScheme.SSH
            )
        ).toBe(Constants.AuthenticationScheme.SSH);
        expect(
            Constants.getTokenTypeFromAuthenticationScheme(
                Constants.AuthenticationScheme.DPOP
            )
        ).toBe(Constants.DPOP_TOKEN_TYPE);
    });

    it("Exports DPoP common primitives from the public index", () => {
        const tokenType: Constants.TokenType = Constants.DPOP_TOKEN_TYPE;
        const generator = new DpopProofGenerator(mockCrypto);
        const proofOptions: DpopProofGenerationOptions = {
            correlationId: "correlation-id",
            resourceRequestMethod: "GET",
            resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
            alg: TEST_CRYPTO_ALGORITHMS.rsa,
            jwk: JSON.parse(TEST_SSH_VALUES.SSH_JWK),
        };

        expect(tokenType).toBe(Constants.DPOP_TOKEN_TYPE);
        expect(generator).toBeInstanceOf(DpopProofGenerator);
        expect(proofOptions.alg).toBe(TEST_CRYPTO_ALGORITHMS.rsa);
    });
});
