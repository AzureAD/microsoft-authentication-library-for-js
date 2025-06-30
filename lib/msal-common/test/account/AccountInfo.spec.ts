import { AccountEntity } from "../../src";
import * as AccountInfo from "../../src/account/AccountInfo";
import { buildAccountFromIdTokenClaims } from "msal-test-utils";
import {
    ID_TOKEN_ALT_CLAIMS,
    ID_TOKEN_CLAIMS,
    ID_TOKEN_EXTRA_CLAIMS,
    TEST_ACCOUNT_INFO,
    TEST_DATA_CLIENT_INFO,
} from "../test_kit/StringConstants";

describe("AccountInfo Unit Tests", () => {
    describe("tenantIdMatchesHomeTenant()", () => {
        const { TEST_UID, TEST_UTID } = TEST_DATA_CLIENT_INFO;
        const HOME_ACCOUNT_ID = `${TEST_UID}.${TEST_UTID}`;
        it("returns true if tenantId passed in matches utid portion of homeAccountId", () => {
            expect(
                AccountInfo.tenantIdMatchesHomeTenant(
                    TEST_UTID,
                    HOME_ACCOUNT_ID
                )
            ).toBe(true);
        });

        it("returns false if tenantId passed in does not match the utid portion of homeAccountId", () => {
            const differentTenantId = "different-tenant-id";
            expect(
                AccountInfo.tenantIdMatchesHomeTenant(
                    differentTenantId,
                    HOME_ACCOUNT_ID
                )
            ).toBe(false);
        });

        it("returns false if tenantId passed in undefined", () => {
            expect(
                AccountInfo.tenantIdMatchesHomeTenant(undefined, "uid.utid")
            ).toBe(false);
        });

        it("returns false if homeAccountId passed in undefined", () => {
            expect(
                AccountInfo.tenantIdMatchesHomeTenant("utid", undefined)
            ).toBe(false);
        });
    });

    describe("buildTenantProfile()", () => {
        describe("correctly sets tenantId", () => {
            it("from the tid claim when present", () => {
                const idTokenClaims = {
                    tid: ID_TOKEN_CLAIMS.tid,
                    tfp: ID_TOKEN_EXTRA_CLAIMS.tfp,
                    acr: ID_TOKEN_EXTRA_CLAIMS.acr,
                };
                const tenantProfile = AccountInfo.buildTenantProfile(
                    TEST_ACCOUNT_INFO.homeAccountId,
                    TEST_ACCOUNT_INFO.localAccountId,
                    TEST_ACCOUNT_INFO.tenantId,
                    idTokenClaims
                );
                expect(tenantProfile.tenantId).toEqual(idTokenClaims.tid);
                expect(tenantProfile.tenantId).not.toEqual(idTokenClaims.tfp);
                expect(tenantProfile.tenantId).not.toEqual(idTokenClaims.acr);
                expect(tenantProfile.tenantId).not.toEqual("");
            });
            it("from the tfp claim when present and tid not present", () => {
                const idTokenClaims = {
                    tfp: ID_TOKEN_EXTRA_CLAIMS.tfp,
                    acr: ID_TOKEN_EXTRA_CLAIMS.acr,
                };
                const tenantProfile = AccountInfo.buildTenantProfile(
                    TEST_ACCOUNT_INFO.homeAccountId,
                    TEST_ACCOUNT_INFO.localAccountId,
                    TEST_ACCOUNT_INFO.tenantId,
                    idTokenClaims
                );
                expect(tenantProfile.tenantId).toEqual(idTokenClaims.tfp);
                expect(tenantProfile.tenantId).not.toEqual(idTokenClaims.acr);
                expect(tenantProfile.tenantId).not.toEqual("");
            });

            it("from the acr claim when present but tid and tfp not present", () => {
                const idTokenClaims = {
                    acr: ID_TOKEN_EXTRA_CLAIMS.acr,
                };
                const tenantProfile = AccountInfo.buildTenantProfile(
                    TEST_ACCOUNT_INFO.homeAccountId,
                    TEST_ACCOUNT_INFO.localAccountId,
                    TEST_ACCOUNT_INFO.tenantId,
                    idTokenClaims
                );
                expect(tenantProfile.tenantId).toEqual(idTokenClaims.acr);
                expect(tenantProfile.tenantId).not.toEqual("");
            });

            it("falls back to empty string when tid, tfp and acr claims not present", () => {
                const idTokenClaims = { iss: ID_TOKEN_CLAIMS.iss };
                const tenantProfile = AccountInfo.buildTenantProfile(
                    TEST_ACCOUNT_INFO.homeAccountId,
                    TEST_ACCOUNT_INFO.localAccountId,
                    TEST_ACCOUNT_INFO.tenantId,
                    idTokenClaims
                );
                expect(tenantProfile.tenantId).toEqual("");
            });

            it("falls back to provided values when idTokenClaims are not present", () => {
                const tenantProfile = AccountInfo.buildTenantProfile(
                    TEST_ACCOUNT_INFO.homeAccountId,
                    TEST_ACCOUNT_INFO.localAccountId,
                    TEST_ACCOUNT_INFO.tenantId
                );
                expect(tenantProfile.tenantId).toEqual(
                    TEST_ACCOUNT_INFO.tenantId
                );
            });
        });

        describe("correctly sets localAccountId", () => {
            it("from the oid claim when present", () => {
                const idTokenClaims = {
                    oid: ID_TOKEN_CLAIMS.oid,
                    sub: ID_TOKEN_CLAIMS.sub,
                };
                const tenantProfile = AccountInfo.buildTenantProfile(
                    TEST_ACCOUNT_INFO.homeAccountId,
                    TEST_ACCOUNT_INFO.localAccountId,
                    TEST_ACCOUNT_INFO.tenantId,
                    idTokenClaims
                );
                expect(tenantProfile.localAccountId).toEqual(idTokenClaims.oid);
                expect(tenantProfile.localAccountId).not.toEqual(
                    idTokenClaims.sub
                );
                expect(tenantProfile.localAccountId).not.toEqual("");
            });

            it("from sub claim when present and oid not present", () => {
                const idTokenClaims = {
                    sub: ID_TOKEN_CLAIMS.sub,
                };
                const tenantProfile = AccountInfo.buildTenantProfile(
                    TEST_ACCOUNT_INFO.homeAccountId,
                    TEST_ACCOUNT_INFO.localAccountId,
                    TEST_ACCOUNT_INFO.tenantId,
                    idTokenClaims
                );
                expect(tenantProfile.localAccountId).toEqual(idTokenClaims.sub);
                expect(tenantProfile.localAccountId).not.toEqual("");
            });

            it("falls back to empty string when oid and sub claims are not present", () => {
                const idTokenClaims = {
                    iss: ID_TOKEN_CLAIMS.iss,
                };
                const tenantProfile = AccountInfo.buildTenantProfile(
                    TEST_ACCOUNT_INFO.homeAccountId,
                    TEST_ACCOUNT_INFO.localAccountId,
                    TEST_ACCOUNT_INFO.tenantId,
                    idTokenClaims
                );
                expect(tenantProfile.localAccountId).toEqual("");
            });

            it("falls back to provided values when idTokenClaims not provided", () => {
                const tenantProfile = AccountInfo.buildTenantProfile(
                    TEST_ACCOUNT_INFO.homeAccountId,
                    TEST_ACCOUNT_INFO.localAccountId,
                    TEST_ACCOUNT_INFO.tenantId
                );
                expect(tenantProfile.localAccountId).toEqual(
                    TEST_ACCOUNT_INFO.localAccountId
                );
            });
        });

        describe("correctly sets name", () => {
            it("from the name claim when present", () => {
                const idTokenClaims = {
                    name: ID_TOKEN_CLAIMS.name,
                };
                const tenantProfile = AccountInfo.buildTenantProfile(
                    TEST_ACCOUNT_INFO.homeAccountId,
                    TEST_ACCOUNT_INFO.localAccountId,
                    TEST_ACCOUNT_INFO.tenantId,
                    idTokenClaims
                );
                expect(tenantProfile.name).toEqual(idTokenClaims.name);
                expect(tenantProfile.name).not.toEqual("");
            });

            it("set to undefined when name claim not present", () => {
                const idTokenClaims = {
                    iss: ID_TOKEN_CLAIMS.iss,
                };
                const tenantProfile = AccountInfo.buildTenantProfile(
                    TEST_ACCOUNT_INFO.homeAccountId,
                    TEST_ACCOUNT_INFO.localAccountId,
                    TEST_ACCOUNT_INFO.tenantId,
                    idTokenClaims
                );
                expect(tenantProfile.name).toBeUndefined();
            });
        });

        describe("correctly sets isHomeTenant", () => {
            const { TEST_UID, TEST_UTID } = TEST_DATA_CLIENT_INFO;
            const HOME_ACCOUNT_ID = `${TEST_UID}.${TEST_UTID}`;

            it("to true when tenantId matches utid portion of homeAccountId", () => {
                const idTokenClaims = { tid: TEST_UTID };
                const tenantProfile = AccountInfo.buildTenantProfile(
                    HOME_ACCOUNT_ID,
                    TEST_ACCOUNT_INFO.localAccountId,
                    TEST_ACCOUNT_INFO.tenantId,
                    idTokenClaims
                );
                expect(tenantProfile.isHomeTenant).toBe(true);
            });

            it("to false when tenantId does not match utid portion of homeAccountId", () => {
                const idTokenClaims = { tid: "different-tenant-id" };
                const tenantProfile = AccountInfo.buildTenantProfile(
                    HOME_ACCOUNT_ID,
                    TEST_ACCOUNT_INFO.localAccountId,
                    TEST_ACCOUNT_INFO.tenantId,
                    idTokenClaims
                );
                expect(tenantProfile.isHomeTenant).toBe(false);
            });

            it("to false when tenantId is undefined utid portion of homeAccountId", () => {
                const idTokenClaims = { iss: ID_TOKEN_CLAIMS.iss };
                const tenantProfile = AccountInfo.buildTenantProfile(
                    HOME_ACCOUNT_ID,
                    TEST_ACCOUNT_INFO.localAccountId,
                    TEST_ACCOUNT_INFO.tenantId,
                    idTokenClaims
                );
                expect(tenantProfile.isHomeTenant).toBe(false);
            });
        });
    });

    describe("updateAccountTenantProfileData()", () => {
        const baseAccount: AccountEntity =
            buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);
        const baseAccountInfo = baseAccount.getAccountInfo();
        // Get non-overridable properties to make sure they're unchanged
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {
            tenantId,
            localAccountId,
            name,
            ...CONSTANT_ACCOUNT_PROPERTIES
        } = baseAccountInfo;

        it("returns unmodified baseAccountInfo when tenantProfile and idTokenClaims are undefined", () => {
            const updatedAccountInfo =
                AccountInfo.updateAccountTenantProfileData(
                    baseAccountInfo,
                    undefined,
                    undefined
                );
            expect(updatedAccountInfo).toEqual(baseAccountInfo);
        });

        it("returns baseAccountInfo augmented with tenantProfile data when tenantProfile passed in and idTokenClaims are undefined", () => {
            const guestTenantProfile: AccountInfo.TenantProfile = {
                tenantId: "guest-tenant-id",
                localAccountId: "guest-local-account-id",
                name: "guest-name",
                isHomeTenant: false,
            };

            const updatedAccountInfo =
                AccountInfo.updateAccountTenantProfileData(
                    baseAccountInfo,
                    guestTenantProfile,
                    undefined
                );
            expect(updatedAccountInfo.tenantId).toEqual(
                guestTenantProfile.tenantId
            );
            expect(updatedAccountInfo.localAccountId).toEqual(
                guestTenantProfile.localAccountId
            );
            expect(updatedAccountInfo.name).toEqual(guestTenantProfile.name);
            expect(updatedAccountInfo.idTokenClaims).toBeUndefined();
            expect(updatedAccountInfo).toMatchObject(
                CONSTANT_ACCOUNT_PROPERTIES
            );
        });

        it("returns baseAccountInfo augmented with idTokenClaims data when idTokenClaims passed in and tenantProfile is undefined", () => {
            const updatedAccountInfo =
                AccountInfo.updateAccountTenantProfileData(
                    baseAccountInfo,
                    undefined,
                    ID_TOKEN_ALT_CLAIMS
                );
            expect(updatedAccountInfo.tenantId).toEqual(
                ID_TOKEN_ALT_CLAIMS.tid
            );
            expect(updatedAccountInfo.localAccountId).toEqual(
                ID_TOKEN_ALT_CLAIMS.oid
            );
            expect(updatedAccountInfo.name).toEqual(ID_TOKEN_ALT_CLAIMS.name);
            expect(updatedAccountInfo.idTokenClaims).toEqual(
                ID_TOKEN_ALT_CLAIMS
            );
            expect(updatedAccountInfo).toMatchObject(
                CONSTANT_ACCOUNT_PROPERTIES
            );
        });

        it("gives precedence to idTokenClaims over tenantProfile when both are passed in", () => {
            const guestTenantProfile: AccountInfo.TenantProfile = {
                tenantId: "guest-tenant-id",
                localAccountId: "guest-local-account-id",
                name: "guest-name",
                isHomeTenant: false,
            };

            const updatedAccountInfo =
                AccountInfo.updateAccountTenantProfileData(
                    baseAccountInfo,
                    guestTenantProfile,
                    ID_TOKEN_ALT_CLAIMS
                );

            expect(updatedAccountInfo.tenantId).toEqual(
                ID_TOKEN_ALT_CLAIMS.tid
            );
            expect(updatedAccountInfo.localAccountId).toEqual(
                ID_TOKEN_ALT_CLAIMS.oid
            );
            expect(updatedAccountInfo.name).toEqual(ID_TOKEN_ALT_CLAIMS.name);
            expect(updatedAccountInfo.idTokenClaims).toEqual(
                ID_TOKEN_ALT_CLAIMS
            );
            expect(updatedAccountInfo).toMatchObject(
                CONSTANT_ACCOUNT_PROPERTIES
            );
        });
    });
});
