import { RefreshTokenEntity } from "../../../src/cache/entities/RefreshTokenEntity";
import { mockRefreshTokenEntity, mockRefreshTokenEntityWithFamilyId, mockAppMetaDataEntity } from "./cacheConstants";
import { CacheType } from "../../../src/utils/Constants";
import { ClientAuthError, ClientAuthErrorMessage } from "../../../src/error/ClientAuthError";

describe("RefreshTokenEntity.ts Unit Tests", () => {
    it("Verify a RefreshTokenEntity", () => {
        const rt = new RefreshTokenEntity();
        expect(rt instanceof RefreshTokenEntity);
    });

    it("Create a RefreshTokenEntity", () => {
        const rt = new RefreshTokenEntity();
        Object.assign(rt, mockRefreshTokenEntity);
        expect(rt.generateCredentialKey()).toEqual("uid.utid-login.microsoftonline.com-refreshtoken-mock_client_id----");
    });

    it("Create a RefreshTokenEntity with familyId", () => {
        const rt = new RefreshTokenEntity();
        Object.assign(rt, mockRefreshTokenEntityWithFamilyId);
        expect(rt.generateCredentialKey()).toEqual("uid.utid-login.microsoftonline.com-refreshtoken-1----");
    });

    it("Throws error if RefreshTokenEntity is not assigned a type", () => {
        const rt = new RefreshTokenEntity();
        expect(() => rt.generateType()).toThrowError(ClientAuthError);
        expect(() => rt.generateType()).toThrowError(ClientAuthErrorMessage.unexpectedCredentialType.desc);
    });

    it("Generate RefreshTokenEntity type", () => {
        const rt = new RefreshTokenEntity();
        Object.assign(rt, mockRefreshTokenEntity);
        expect(rt.generateType()).toEqual(CacheType.REFRESH_TOKEN);
    });

    it("verify if an object is a refresh token entity", () => {
        expect(RefreshTokenEntity.isRefreshTokenEntity(mockRefreshTokenEntity)).toEqual(true);
        expect(RefreshTokenEntity.isRefreshTokenEntity(mockRefreshTokenEntityWithFamilyId)).toEqual(true);
    });

    it("verify if an object is not a refresh token entity", () => {
        expect(RefreshTokenEntity.isRefreshTokenEntity(mockAppMetaDataEntity)).toEqual(false);
    });
});
