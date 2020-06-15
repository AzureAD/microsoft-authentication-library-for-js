import { expect } from "chai";
import { RefreshTokenEntity } from "../../../src/cache/entities/RefreshTokenEntity";
import { mockRefreshTokenEntity, mockRefreshTokenEntityWithFamilyId } from "./cacheConstants";

describe("RefreshTokenEntity.ts Unit Tests", () => {
    it("Verify a RefreshTokenEntity", () => {
        const rt = new RefreshTokenEntity();
        expect(rt instanceof RefreshTokenEntity);
    });

    it("Create a RefreshTokenEntity", () => {
        let rt = new RefreshTokenEntity();
        Object.assign(rt, mockRefreshTokenEntity);
        expect(rt.generateCredentialKey()).to.eql(
            "uid.utid-login.microsoftonline.com-refreshtoken-mock_client_id--"
        );
    });

    it("Create a RefreshTokenEntity with familyId", () => {
        let rt = new RefreshTokenEntity();
        Object.assign(rt, mockRefreshTokenEntityWithFamilyId);
        expect(rt.generateCredentialKey()).to.eql(
            "uid.utid-login.microsoftonline.com-refreshtoken-1--"
        );
    });
});
