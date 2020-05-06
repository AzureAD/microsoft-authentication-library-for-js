import { expect } from "chai";
import { AccessTokenValue } from "../../../src/cache/spacache/AccessTokenValue";
import { TEST_TOKENS, TEST_CONFIG, TEST_TOKEN_LIFETIMES } from "../../utils/StringConstants";

describe("AccessTokenValue.ts tests", () => {

    describe("Constructor", () => {

        it("Assigns values correctly", () => {
            const atValue1: AccessTokenValue = {
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                idToken: TEST_TOKENS.IDTOKEN_V2,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                tokenType: TEST_CONFIG.TOKEN_TYPE_BEARER,
                expiresOnSec: `${TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP}`,
                extExpiresOnSec: `${TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN}`
            };

            expect(atValue1.accessToken).to.be.eq(TEST_TOKENS.ACCESS_TOKEN);
            expect(atValue1.idToken).to.be.eq(TEST_TOKENS.IDTOKEN_V2);
            expect(atValue1.refreshToken).to.be.eq(TEST_TOKENS.REFRESH_TOKEN);
            expect(atValue1.tokenType).to.be.eq(TEST_CONFIG.TOKEN_TYPE_BEARER);
            expect(atValue1.expiresOnSec).to.be.eq(`${TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP}`);
            expect(atValue1.extExpiresOnSec).to.be.eq(`${TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN}`);
        });
    });
});
