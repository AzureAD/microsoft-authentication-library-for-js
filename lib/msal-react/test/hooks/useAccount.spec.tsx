import { AccountInfo, IdTokenClaims } from "@azure/msal-browser";
import { accountInfoIsEqual } from "../../src/hooks/useAccount.js";

const idTokenClaims: IdTokenClaims = {
    ver: "2.0",
    iat: 1536361411,
    iss: `https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
    sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
    exp: 1536361411,
    name: "Abe Lincoln",
    preferred_username: "AbeLi@microsoft.com",
    oid: "00000000-0000-0000-66f3-3332eca7ea81",
    tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
    nonce: "123523",
};
const account: AccountInfo = {
    username: "AbeLi@microsoft.com",
    homeAccountId: "uid.utid-login.microsoftonline.com-utid",
    localAccountId: "00000000-0000-0000-66f3-3332eca7ea81",
    environment: "login.microsoftonline.com",
    tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
    loginHint: "AbeLi@microsoft.com",
    idTokenClaims: idTokenClaims,
};

describe("useAccount tests", () => {
    describe("accountInfoIsEqual tests", () => {
        it("returns true if two account info objects have the same values", () => {
            expect(accountInfoIsEqual(account, { ...account })).toBe(true);
        });

        it("returns false if two account info objects represent the same user but have different iat claims", () => {
            // iat claims are different
            expect(
                accountInfoIsEqual(account, {
                    ...account,
                    idTokenClaims: { ...account.idTokenClaims, iat: 99999 },
                })
            ).toBe(false);

            // iat claim is missing on 1 account
            expect(
                accountInfoIsEqual(account, {
                    ...account,
                    idTokenClaims: { ...account.idTokenClaims, iat: undefined },
                })
            ).toBe(false);
        });

        it("returns false if two account info objects represent the same user but have different nonce claims", () => {
            // nonce claims are different
            expect(
                accountInfoIsEqual(account, {
                    ...account,
                    idTokenClaims: {
                        ...account.idTokenClaims,
                        nonce: "differentNonce",
                    },
                })
            ).toBe(false);

            // nonce claim is missing on 1 account
            expect(
                accountInfoIsEqual(account, {
                    ...account,
                    idTokenClaims: {
                        ...account.idTokenClaims,
                        nonce: undefined,
                    },
                })
            ).toBe(false);
        });

        it("returns false if required AccountInfo parameters are not equal", () => {
            expect(
                accountInfoIsEqual(account, {
                    ...account,
                    homeAccountId: "mockHomeAccountId2",
                })
            ).toBe(false);
            expect(
                accountInfoIsEqual(account, {
                    ...account,
                    localAccountId: "mockLocalAccountId2",
                })
            ).toBe(false);
            expect(
                accountInfoIsEqual(account, {
                    ...account,
                    environment: "mockEnv2",
                })
            ).toBe(false);
            expect(
                accountInfoIsEqual(account, {
                    ...account,
                    tenantId: "mockTenant2",
                })
            ).toBe(false);
            expect(
                accountInfoIsEqual(account, {
                    ...account,
                    username: "mockUsername2",
                })
            ).toBe(false);
            expect(
                accountInfoIsEqual(account, { ...account, idTokenClaims: {} })
            ).toBe(false);
        });

        it("returns false if an account info object is invalid", () => {
            expect(accountInfoIsEqual(account, null)).toBe(false);
            expect(accountInfoIsEqual(null, account)).toBe(false);
            expect(accountInfoIsEqual(null, null)).toBe(false);
        });
    });
});
