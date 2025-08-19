import {
    mockRefreshTokenEntity,
    mockRefreshTokenEntityWithFamilyId,
    mockAppMetaDataEntity,
} from "./cacheConstants";
import { CacheHelpers } from "../../../src";
import { generateCredentialKey } from "../../client/ClientTestUtils.js";

describe("RefreshTokenEntity.ts Unit Tests", () => {
    it("Create a RefreshTokenEntity", () => {
        expect(generateCredentialKey(mockRefreshTokenEntity)).toEqual(
            "uid.utid-login.microsoftonline.com-refreshtoken-mock_client_id---"
        );
    });

    it("Create a RefreshTokenEntity with familyId", () => {
        expect(
            generateCredentialKey(mockRefreshTokenEntityWithFamilyId)
        ).toEqual("uid.utid-login.microsoftonline.com-refreshtoken-1---");
    });

    it("verify if an object is a refresh token entity", () => {
        expect(
            CacheHelpers.isRefreshTokenEntity(mockRefreshTokenEntity)
        ).toEqual(true);
        expect(
            CacheHelpers.isRefreshTokenEntity(
                mockRefreshTokenEntityWithFamilyId
            )
        ).toEqual(true);
    });

    it("verify if an object is not a refresh token entity", () => {
        expect(
            CacheHelpers.isRefreshTokenEntity(mockAppMetaDataEntity)
        ).toEqual(false);
    });
});
