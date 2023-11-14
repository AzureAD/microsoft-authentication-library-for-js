import { getTenantIdFromIdTokenClaims } from "../../src/account/TokenClaims";

describe("TokenClaims Utilities Unit Tests", () => {
    it("returns null if no claims are passed", () => {
        expect(getTenantIdFromIdTokenClaims()).toBeNull();
    });

    it("returns null if tid, tfp, and acr claims are not present", () => {
        expect(getTenantIdFromIdTokenClaims({})).toBeNull();
    });

    it("returns tid claim if present", () => {
        expect(getTenantIdFromIdTokenClaims({ tid: "tid" })).toBe("tid");
    });

    it("returns tfp claim if present", () => {
        expect(getTenantIdFromIdTokenClaims({ tfp: "tfp" })).toBe("tfp");
    });

    it("returns acr claim if present", () => {
        expect(getTenantIdFromIdTokenClaims({ acr: "acr" })).toBe("acr");
    });

    it("correctly downcases the tenantId", () => {
        expect(getTenantIdFromIdTokenClaims({ tid: "TID" })).toBe("tid");
    });
});
