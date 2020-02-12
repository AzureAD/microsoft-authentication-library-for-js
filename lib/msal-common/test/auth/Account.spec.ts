import { expect } from "chai";
import { IdTokenClaims } from "../../src/auth/IdTokenClaims";
import { TEST_URIS, TEST_DATA_CLIENT_INFO, TEST_TOKENS } from "../utils/StringConstants";
import { Account } from "../../src/auth/Account";

describe("Account.ts Class Unit Tests", () => {
    
    describe("Constructor", () => {

        it("creates an account with given parameters", () => {
            // Set up stubs
            const idTokenClaims: IdTokenClaims = {
                "ver": "2.0",
                "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": "1536361411",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "nonce": "123523",
            };

            const testAccount = new Account(idTokenClaims.oid, TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID, idTokenClaims, TEST_TOKENS.IDTOKEN_V2);
            expect(testAccount.accountIdentifier).to.be.eq(idTokenClaims.oid);
            expect(testAccount.homeAccountIdentifier).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID);
            expect(testAccount.userName).to.be.eq(idTokenClaims.preferred_username);
            expect(testAccount.name).to.be.eq(idTokenClaims.name);
            expect(testAccount.idToken).to.be.eq(TEST_TOKENS.IDTOKEN_V2);
            expect(testAccount.idTokenClaims).to.be.deep.eq(idTokenClaims);
            expect(testAccount.sid).to.be.eq(idTokenClaims.sid);
            expect(testAccount.environment).to.be.eq(idTokenClaims.iss);
        });
    });

    describe("createAccount()", () => {
        
        it("Returns a valid account with given idToken and client info object", () => {
            
        });
    });
});
