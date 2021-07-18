import { AccessTokenEntity } from "../../../src/cache/entities/AccessTokenEntity";
import { mockCache, mockAccessTokenEntity_1, mockAccessTokenEntity_2, mockRefreshTokenEntity } from "./cacheConstants";
import { CacheType } from "../../../src/utils/Constants";
import { ClientAuthError, ClientAuthErrorMessage } from "../../../src/error/ClientAuthError";

describe("AccessTokenEntity.ts Unit Tests", () => {

    it("Verify an AccessTokenEntity entity", () => {
        const at = new AccessTokenEntity();
        expect(at instanceof AccessTokenEntity);
    });

    it("Generate AccessTokenEntity key", () => {
        const at = mockCache.createMockATOne();
        expect(at.generateCredentialKey()).toEqual(
            "uid.utid-login.microsoftonline.com-accesstoken-mock_client_id-microsoft-scope1 scope2 scope3"
        );
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
