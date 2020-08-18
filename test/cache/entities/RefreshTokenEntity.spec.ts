import { expect } from "chai";
import { RefreshTokenEntity } from "../../../src/cache/entities/RefreshTokenEntity";
import { mockRefreshTokenEntity, mockRefreshTokenEntityWithFamilyId, mockAppMetaDataEntity } from "./cacheConstants";
import { ClientAuthError, ClientAuthErrorMessage } from "../../../src";
import { CacheType } from "../../../src/utils/Constants";

describe("RefreshTokenEntity.ts Unit Tests", () => {
    it("Verify a RefreshTokenEntity", () => {
        const rt = new RefreshTokenEntity();
        expect(rt instanceof RefreshTokenEntity);
    });

    it("Create a RefreshTokenEntity", () => {
        const rt = new RefreshTokenEntity();
        Object.assign(rt, mockRefreshTokenEntity);
        expect(rt.generateCredentialKey()).to.eql(
            "uid.utid-login.microsoftonline.com-refreshtoken-mock_client_id--"
        );
    });

    it("Create a RefreshTokenEntity with familyId", () => {
        const rt = new RefreshTokenEntity();
        Object.assign(rt, mockRefreshTokenEntityWithFamilyId);
        expect(rt.generateCredentialKey()).to.eql(
            "uid.utid-login.microsoftonline.com-refreshtoken-1--"
        );
    });

    it("Throws error if RefreshTokenEntity is not assigned a type", () => {
        const rt = new RefreshTokenEntity();
        expect(() => rt.generateType()).to.throw(ClientAuthError);
        expect(() => rt.generateType()).to.throw(ClientAuthErrorMessage.unexpectedCredentialType.desc);
    });

    it("Generate RefreshTokenEntity type", () => {
        const rt = new RefreshTokenEntity();
        Object.assign(rt, mockRefreshTokenEntity);
        expect(rt.generateType()).to.eql(CacheType.REFRESH_TOKEN);
    });

    it("verify if an object is a refresh token entity", () => {
        expect(RefreshTokenEntity.isRefreshTokenEntity(mockRefreshTokenEntity)).to.eql(true);
        expect(RefreshTokenEntity.isRefreshTokenEntity(mockRefreshTokenEntityWithFamilyId)).to.eql(true);
    });

    it("verify if an object is not a refresh token entity", () => {
        expect(RefreshTokenEntity.isRefreshTokenEntity(mockAppMetaDataEntity)).to.eql(false);
    });
});
