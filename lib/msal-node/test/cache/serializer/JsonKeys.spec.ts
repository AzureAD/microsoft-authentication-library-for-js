import { AccessTokenCacheMaps, AccountCacheMaps, RefreshTokenCacheMaps, IdTokenCacheMaps, AppMetadataCacheMaps } from "cache/serializer/JsonKeys";

describe.skip("JsonKets.ts Unit Tests", () => {

    test("Verify an AccessTokenCacheMaps", () => {
        expect(AccessTokenCacheMaps.toCacheMap["homeAccountId"]).toEqual("home_account_id");
        expect(AccessTokenCacheMaps.fromCacheMap["home_account_id"]).toEqual("homeAccountId");
    });

    test("Verify an IdTokenCacheMaps", () => {
        expect(IdTokenCacheMaps.toCacheMap["clientId"]).toEqual("client_id");
        expect(IdTokenCacheMaps.fromCacheMap["client_id"]).toEqual("clientId");
    });

    test("Verify an RefreshTokenCacheMaps", () => {
        expect(RefreshTokenCacheMaps.toCacheMap["credentialType"]).toEqual("credential_type");
        expect(RefreshTokenCacheMaps.fromCacheMap["credential_type"]).toEqual("credentialType");
    });

    test("Verify an AccountCacheMaps", () => {
        expect(AccountCacheMaps.toCacheMap["clientInfo"]).toEqual("client_info");
        expect(AccountCacheMaps.fromCacheMap["client_info"]).toEqual("clientInfo");
    });

    test("Verify an AppMetadataCacheMaps", () => {
        expect(AppMetadataCacheMaps.toCacheMap["familyId"]).toEqual("family_id");
        expect(AppMetadataCacheMaps.fromCacheMap["family_id"]).toEqual("familyId");
    });
});
