import {
    mockCache,
    mockAccessTokenEntity_1,
    mockAccessTokenEntity_2,
    mockRefreshTokenEntity,
    mockAccessTokenWithAuthSchemeEntity,
} from "./cacheConstants";
import { CacheHelpers } from "../../../src";

describe("AccessTokenEntity.ts Unit Tests", () => {
    describe("AccessToken Credential entity", () => {
        it("Generate AccessTokenEntity key", () => {
            const at = mockCache.createMockATOne();
            expect(CacheHelpers.generateCredentialKey(at)).toEqual(
                "uid.utid-login.microsoftonline.com-accesstoken-mock_client_id-microsoft-scope1 scope2 scope3--"
            );
        });

        it("Generate AccessTokenEntity key (adfs)", () => {
            const at = mockCache.createMockAdfsAt();
            expect(CacheHelpers.generateCredentialKey(at)).toEqual(
                "uid.utid-login.microsoftonline.com-accesstoken-mock_client_id-microsoft-scope1 scope2 scope3--"
            );
        });

        it("verify if an object is an access token entity", () => {
            expect(
                CacheHelpers.isAccessTokenEntity(mockAccessTokenEntity_1)
            ).toEqual(true);
            expect(
                CacheHelpers.isAccessTokenEntity(mockAccessTokenEntity_2)
            ).toEqual(true);
        });

        it("verify if an object is not an access token entity", () => {
            expect(
                CacheHelpers.isAccessTokenEntity(mockRefreshTokenEntity)
            ).toEqual(false);
        });
    });

    describe("AccessToken_With_AuthScheme credential entity", () => {
        it("Generate AccessTokenEntity key", () => {
            const popAT = mockCache.createMockPopAT();
            expect(CacheHelpers.generateCredentialKey(popAT)).toEqual(
                "uid.utid-login.microsoftonline.com-accesstoken_with_authscheme-mock_client_id-microsoft-scope1 scope2 scope3--pop"
            );
        });

        it("verify if an object is an access token entity", () => {
            expect(
                CacheHelpers.isAccessTokenEntity(
                    mockAccessTokenWithAuthSchemeEntity
                )
            ).toEqual(true);
        });
    });
});
