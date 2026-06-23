import { getDefaultErrorMessage } from "../../src/error/AuthError.js";
import * as ClientAuthErrorCodes from "../../src/error/ClientAuthErrorCodes.js";
import { DpopProofGenerator } from "../../src/crypto/DpopProof.js";
import * as TimeUtils from "../../src/utils/TimeUtils.js";
import {
    RANDOM_TEST_GUID,
    TEST_CONFIG,
    TEST_CRYPTO_ALGORITHMS,
    TEST_CRYPTO_VALUES,
    TEST_SSH_VALUES,
    TEST_TOKENS,
    TEST_URIS,
} from "../test_kit/StringConstants.js";
import { mockCrypto } from "../client/ClientTestUtils.js";

describe("DpopProofGenerator Unit Tests", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const generator = new DpopProofGenerator(mockCrypto);
    const testJwk = JSON.parse(TEST_SSH_VALUES.SSH_JWK);

    it("Generates a DPoP proof with token endpoint and resource proof claims", async () => {
        const proof = await generator.generateProof({
            correlationId: TEST_CONFIG.CORRELATION_ID,
            resourceRequestMethod: "post",
            resourceRequestUri: `${TEST_URIS.TEST_RESOURCE_ENDPT_WITH_PARAMS}#section`,
            alg: TEST_CRYPTO_ALGORITHMS.rsa,
            jwk: testJwk,
            accessToken: TEST_TOKENS.ACCESS_TOKEN,
            jti: RANDOM_TEST_GUID,
            iat: 1234,
        });

        expect(proof).toEqual({
            header: {
                typ: "dpop+jwt",
                alg: TEST_CRYPTO_ALGORITHMS.rsa,
                jwk: testJwk,
            },
            payload: {
                jti: RANDOM_TEST_GUID,
                htm: "POST",
                htu: TEST_URIS.TEST_RESOURCE_ENDPT_WITH_PARAMS,
                iat: 1234,
                ath: TEST_CRYPTO_VALUES.TEST_SHA256_HASH,
            },
        });
    });

    it("Generates default jti and iat values when not provided", async () => {
        jest.spyOn(TimeUtils, "nowSeconds").mockReturnValue(4321);

        const proof = await generator.generateProof({
            correlationId: TEST_CONFIG.CORRELATION_ID,
            resourceRequestMethod: "get",
            resourceRequestUri: TEST_URIS.TEST_RESOURCE_ENDPT_WITH_PARAMS,
            alg: TEST_CRYPTO_ALGORITHMS.rsa,
            jwk: testJwk,
        });

        expect(proof.payload).toEqual({
            jti: RANDOM_TEST_GUID,
            htm: "GET",
            htu: TEST_URIS.TEST_RESOURCE_ENDPT_WITH_PARAMS,
            iat: 4321,
            ath: undefined,
        });
    });

    it("Throws when the resource request method is missing", async () => {
        await expect(
            generator.generateProof({
                correlationId: TEST_CONFIG.CORRELATION_ID,
                resourceRequestUri: TEST_URIS.TEST_RESOURCE_ENDPT_WITH_PARAMS,
                alg: TEST_CRYPTO_ALGORITHMS.rsa,
                jwk: testJwk,
            })
        ).rejects.toThrowError(
            getDefaultErrorMessage(
                ClientAuthErrorCodes.dpopResourceRequestMethodRequired
            )
        );
    });

    it("Throws when the resource request uri is missing", async () => {
        await expect(
            generator.generateProof({
                correlationId: TEST_CONFIG.CORRELATION_ID,
                resourceRequestMethod: "get",
                alg: TEST_CRYPTO_ALGORITHMS.rsa,
                jwk: testJwk,
            })
        ).rejects.toThrowError(
            getDefaultErrorMessage(
                ClientAuthErrorCodes.dpopResourceRequestUriRequired
            )
        );
    });
});
