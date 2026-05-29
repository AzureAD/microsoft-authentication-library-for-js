import * as CacheHelpers from "../../../src/cache/utils/CacheHelpers.js";
import { AuthenticationScheme } from "../../../src/utils/Constants.js";
import { TEST_TOKENS, TEST_CONFIG } from "../../test_kit/StringConstants.js";
import { mockCrypto } from "../../client/ClientTestUtils.js";

describe("CacheHelpers.ts correlationId propagation", () => {
    it("createAccessTokenEntity propagates correlationId when POP token is missing cnf.kid", () => {
        const correlationId = "cache-helpers-corr-id";
        try {
            CacheHelpers.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                TEST_TOKENS.IDTOKEN_V2, // valid jwt but has no cnf.kid claim
                TEST_CONFIG.MSAL_CLIENT_ID,
                TEST_CONFIG.TENANT,
                "User.Read",
                4600,
                4600,
                mockCrypto.base64Decode,
                correlationId,
                500,
                AuthenticationScheme.POP
            );
            throw new Error("Expected createAccessTokenEntity to throw");
        } catch (err) {
            expect(err).toBeInstanceOf(Error);
            expect((err as { correlationId?: string }).correlationId).toBe(
                correlationId
            );
        }
    });
});
