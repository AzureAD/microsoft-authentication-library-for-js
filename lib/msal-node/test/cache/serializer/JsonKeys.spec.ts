import { AccessTokenCacheMaps, AccountCacheMaps, RefreshTokenCacheMaps, IdTokenCacheMaps, AppMetadataCacheMaps } from "../../../src/cache/serializer/JsonKeys";

describe("JsonKeys.ts Unit Tests", () => {

    test("Verify an AccessTokenCacheMaps", () => {
        expect(AccessTokenCacheMaps.toCacheMap["homeAccountId"]).toEqual("home_account_id");
        expect(Object.keys(AccessTokenCacheMaps.fromCacheMap)).toContain("home_account_id");
        expect(Object.values(AccessTokenCacheMaps.fromCacheMap)).toContain("homeAccountId");
    });

    test("Verify an IdTokenCacheMaps", () => {
        expect(IdTokenCacheMaps.toCacheMap["clientId"]).toEqual("client_id");
        expect(Object.keys(IdTokenCacheMaps.fromCacheMap)).toContain("client_id");
        expect(Object.values(IdTokenCacheMaps.fromCacheMap)).toContain("clientId");
    });

    test("Verify an RefreshTokenCacheMaps", () => {
        expect(RefreshTokenCacheMaps.toCacheMap["credentialType"]).toEqual("credential_type");
        expect(Object.keys(RefreshTokenCacheMaps.fromCacheMap)).toContain("credential_type");
        expect(Object.values(RefreshTokenCacheMaps.fromCacheMap)).toContain("credentialType");
    });

    test("Verify an AccountCacheMaps", () => {
        expect(AccountCacheMaps.toCacheMap["clientInfo"]).toEqual("client_info");
        expect(Object.keys(AccountCacheMaps.fromCacheMap)).toContain("client_info");
        expect(Object.values(AccountCacheMaps.fromCacheMap)).toContain("clientInfo");
    });

    test("Verify an AppMetadataCacheMaps", () => {
        expect(AppMetadataCacheMaps.toCacheMap["familyId"]).toEqual("family_id");
        expect(Object.keys(AppMetadataCacheMaps.fromCacheMap)).toContain("family_id");
        expect(Object.values(AppMetadataCacheMaps.fromCacheMap)).toContain("familyId");
    });
});
