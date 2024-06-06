import { mockIdTokenEntity, mockAccessTokenEntity_1 } from "./cacheConstants";
import { CacheHelpers } from "../../../src";

describe("IdTokenEntity.ts Unit Tests", () => {
    it("Create an IdTokenEntity", () => {
        expect(CacheHelpers.generateCredentialKey(mockIdTokenEntity)).toEqual(
            "uid.utid-login.microsoftonline.com-idtoken-mock_client_id-microsoft---"
        );
    });

    it("verify if an object is an id token entity", () => {
        expect(CacheHelpers.isIdTokenEntity(mockIdTokenEntity)).toEqual(true);
    });

    it("verify if an object is not an id token entity", () => {
        expect(CacheHelpers.isIdTokenEntity(mockAccessTokenEntity_1)).toEqual(
            false
        );
    });
});
