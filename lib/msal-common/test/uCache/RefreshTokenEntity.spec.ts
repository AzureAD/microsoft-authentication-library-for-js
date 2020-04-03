import { expect } from "chai";
import { RefreshTokenEntity } from "../../src/uCache/entities/RefreshTokenEntity";
import { RTValues, RTValuesWithFamilyId } from "./cacheConstants";

describe("RefreshTokenEntity.ts Unit Tests", () => {
    it("Verify a RefreshTokenEntity", () => {
        const rt = new RefreshTokenEntity();
        expect(rt instanceof RefreshTokenEntity);
    });

    it("Create a RefreshTokenEntity", () => {
        let rt = new RefreshTokenEntity();
        Object.assign(rt, RTValues);
        expect(rt.generateRefreshTokenEntityKey()).to.eql(
            "uid.utid-login.microsoftonline.com-refreshtoken-mock_client_id--"
        );
    });

    it("Create a RefreshTokenEntity with familyId", () => {
        let rt = new RefreshTokenEntity();
        Object.assign(rt, RTValuesWithFamilyId);
        expect(rt.generateRefreshTokenEntityKey()).to.eql(
            "uid.utid-login.microsoftonline.com-refreshtoken-1--"
        );
    });
});
