import { expect } from "chai";
import { AccessTokenKey } from "../../src/cache/AccessTokenKey";
import { TEST_CONFIG, TEST_DATA_CLIENT_INFO, TEST_TOKENS, TEST_TOKEN_LIFETIMES } from "../utils/StringConstants";
import { Constants } from "../../src";
import { AccessTokenValue } from "../../src/cache/AccessTokenValue";
import { TimeUtils } from "../../src/utils/TimeUtils";
import { AccessTokenCacheItem } from "../../src/cache/AccessTokenCacheItem";

describe("AccessTokenCacheItem.ts tests", () => {

    describe("Constructor", () => {
        
        it("Correctly assigns keys and values", () => {
            const atKey1: AccessTokenKey = {
                authority: Constants.DEFAULT_AUTHORITY,
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                scopes: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                resource: "testResourceUri",
                homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID 
            };
            const atValue1: AccessTokenValue = {
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                idToken: TEST_TOKENS.IDTOKEN_V2,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                tokenType: TEST_CONFIG.TOKEN_TYPE_BEARER,
                expiresOnSec: `${TimeUtils.nowSeconds() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN}`,
                extExpiresOnSec: `${TimeUtils.nowSeconds() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN}`
            };
            const atKey2: AccessTokenKey = null;
            const atValue2: AccessTokenValue = null;

            const cacheItem: AccessTokenCacheItem = new AccessTokenCacheItem(atKey1, atValue1);
            expect(cacheItem.key).to.be.deep.eq(atKey1);
            expect(cacheItem.value).to.be.deep.eq(atValue1);

            const cacheItem2: AccessTokenCacheItem = new AccessTokenCacheItem(atKey2, atValue2);
            expect(cacheItem2.key).to.be.deep.eq(atKey2);
            expect(cacheItem2.value).to.be.deep.eq(atValue2);

            const cacheItem3: AccessTokenCacheItem = new AccessTokenCacheItem(atKey1, atValue2);
            expect(cacheItem3.key).to.be.deep.eq(atKey1);
            expect(cacheItem3.value).to.be.deep.eq(atValue2);

            const cacheItem4: AccessTokenCacheItem = new AccessTokenCacheItem(atKey2, atValue1);
            expect(cacheItem4.key).to.be.deep.eq(atKey2);
            expect(cacheItem4.value).to.be.deep.eq(atValue1);
        });
    });
});
