import { expect } from "chai";
import {
    AccessTokenCacheMaps,
    IdTokenCacheMaps,
    RefreshTokenCacheMaps,
    AccountCacheMaps,
    AppMetadataCacheMaps
} from "../../../src/cache/serialize/JsonKeys";


describe("JsonKets.ts Unit Tests", () => {

    it("Verify an AccessTokenCacheMaps", () => {
        expect(AccessTokenCacheMaps.toCacheMap["homeAccountId"]).to.equal("home_account_id");
        expect(AccessTokenCacheMaps.fromCacheMap["home_account_id"]).to.equal("homeAccountId");
    });

    it("Verify an IdTokenCacheMaps", () => {
        expect(IdTokenCacheMaps.toCacheMap["clientId"]).to.equal("client_id");
        expect(IdTokenCacheMaps.fromCacheMap["client_id"]).to.equal("clientId");
    });

    it("Verify an RefreshTokenCacheMaps", () => {
        expect(RefreshTokenCacheMaps.toCacheMap["credentialType"]).to.equal("credential_type");
        expect(RefreshTokenCacheMaps.fromCacheMap["credential_type"]).to.equal("credentialType");
    });

    it("Verify an AccountCacheMaps", () => {
        expect(AccountCacheMaps.toCacheMap["clientInfo"]).to.equal("client_info");
        expect(AccountCacheMaps.fromCacheMap["client_info"]).to.equal("clientInfo");
    });

    it("Verify an AppMetadataCacheMaps", () => {
        expect(AppMetadataCacheMaps.toCacheMap["familyId"]).to.equal("family_id");
        expect(AppMetadataCacheMaps.fromCacheMap["family_id"]).to.equal("familyId");
    });
});
