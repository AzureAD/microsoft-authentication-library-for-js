import { expect } from "chai";
import { AccessTokenEntity } from "../../../src/cache/entities/AccessTokenEntity";
import { mockCache } from "./cacheConstants";

describe("AccessTokenEntity.ts Unit Tests", () => {

    it("Verify an AccessTokenEntity entity", () => {
        const at = new AccessTokenEntity();
        expect(at instanceof AccessTokenEntity);
    });

    it("Generate AccessTokenEntity key", () => {
        let at = mockCache.createMockATOne();
        expect(at.generateCredentialKey()).to.eql(
            "uid.utid-login.microsoftonline.com-accesstoken-mock_client_id-microsoft-scope1 scope2 scope3"
        );
    });
});
