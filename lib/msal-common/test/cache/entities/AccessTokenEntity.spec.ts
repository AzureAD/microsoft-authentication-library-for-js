import { AccessTokenEntity } from "../../../src/cache/entities/AccessTokenEntity";
import { mockCache, mockAccessTokenEntity_1, mockAccessTokenEntity_2, mockRefreshTokenEntity, mockAccessTokenWithAuthSchemeEntity } from "./cacheConstants";
import { CacheType } from "../../../src/utils/Constants";
import { ClientAuthError, ClientAuthErrorMessage } from "../../../src/error/ClientAuthError";

describe("AccessTokenEntity.ts Unit Tests", () => {
    describe("AccessToken Credential entity", () => {
        it("Verify an AccessTokenEntity entity", () => {
            const at = new AccessTokenEntity();
            expect(at instanceof AccessTokenEntity);
        });

        it("Generate AccessTokenEntity key", () => {
            const at = mockCache.createMockATOne();
            expect(at.generateCredentialKey()).toEqual(
                "uid.utid-login.microsoftonline.com-accesstoken-mock_client_id-microsoft-scope1 scope2 scope3--"
            );
        });

        it("Generate AccessTokenEntity key (adfs)", () => {
            const at = mockCache.createMockAdfsAt();
            expect(at.generateCredentialKey()).toEqual("uid.utid-login.microsoftonline.com-accesstoken-mock_client_id-microsoft-scope1 scope2 scope3--");
        });

        it("Throws error if AccessTokenEntity is not assigned a type", () => {
            const at = new AccessTokenEntity();
            expect(() => at.generateType()).toThrowError(ClientAuthError);
            expect(() => at.generateType()).toThrowError(ClientAuthErrorMessage.unexpectedCredentialType.desc);
        });

        it("Generate AccessTokenEntity type", () => {
            const at = mockCache.createMockATOne();
            expect(at.generateType()).toEqual(CacheType.ACCESS_TOKEN);
        });

        it("verify if an object is an access token entity", () => {
            expect(AccessTokenEntity.isAccessTokenEntity(mockAccessTokenEntity_1)).toEqual(true);
            expect(AccessTokenEntity.isAccessTokenEntity(mockAccessTokenEntity_2)).toEqual(true);
        });

        it("verify if an object is not an access token entity", () => {
            expect(AccessTokenEntity.isAccessTokenEntity(mockRefreshTokenEntity)).toEqual(false);
        });
    });

    describe("AccessToken_With_AuthScheme credential entity", () => {
        it("Verify an AccessToken_With_AuthScheme entity", () => {
            const popAT = mockCache.createMockPopAT();
            expect(popAT instanceof AccessTokenEntity);
        });

        it("Generate AccessTokenEntity key", () => {
            const popAT = mockCache.createMockPopAT();
            expect(popAT.generateCredentialKey()).toEqual(
                "uid.utid-login.microsoftonline.com-accesstoken_with_authscheme-mock_client_id-microsoft-scope1 scope2 scope3--pop"
            );
        });

        it("Generate AccessTokenEntity type", () => {
            const popAT = mockCache.createMockPopAT();
            expect(popAT.generateType()).toEqual(CacheType.ACCESS_TOKEN);
        });

        it("verify if an object is an access token entity", () => {
            expect(AccessTokenEntity.isAccessTokenEntity(mockAccessTokenWithAuthSchemeEntity)).toEqual(true);
        });
    });
});
