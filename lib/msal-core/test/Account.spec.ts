import { expect } from "chai";

import { ClientInfo } from "../src/ClientInfo";
import { IdToken } from "../src/IdToken";
import { Account } from "../src/Account";
import { TEST_TOKENS, TEST_DATA_CLIENT_INFO, TEST_CONFIG } from "./TestConstants";
import { CryptoUtils } from "../src/utils/CryptoUtils";

describe("Account.ts Class", function() {

    let idToken: IdToken = new IdToken(TEST_TOKENS.IDTOKEN_V2);
    let clientInfo: ClientInfo = new ClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, TEST_CONFIG.validAuthority);

    describe("createAccount", () => {
        it("verifies account object is created", () => {
            const account = Account.createAccount(idToken, clientInfo);
            expect(account instanceof Account).to.be.true;
        });

        it("verifies homeAccountIdentifier matches", () => {
            const account = Account.createAccount(idToken, clientInfo);
            const homeAccountIdentifier = CryptoUtils.base64Encode(TEST_DATA_CLIENT_INFO.TEST_UID) + "." + CryptoUtils.base64Encode(TEST_DATA_CLIENT_INFO.TEST_UTID);
    
            expect(account.homeAccountIdentifier).to.equal(homeAccountIdentifier);
        });
    
        it("verifies Account object created matches the idToken parameters", () => {
            const account = Account.createAccount(idToken, clientInfo);
    
            expect(account.accountIdentifier).to.equal(idToken.objectId);
            expect(account.userName).to.equal(idToken.preferredName);
            expect(account.name).to.equal(idToken.name);
            // This will be deprecated soon
            expect(account.idToken).to.equal(idToken.claims);
            expect(account.idTokenClaims).to.equal(idToken.claims);
            expect(account.sid).to.equal(idToken.sid);
            expect(account.environment).to.equal(idToken.issuer);
        });

        it("verifies accountIdentifier equal subject claim if objectId not present", () => {
            const tempIdToken = idToken;
            tempIdToken.objectId = "";

            const account = Account.createAccount(tempIdToken, clientInfo);
            expect(account.accountIdentifier).to.equal(tempIdToken.subject);
        });

        it("verifies homeAccountIdentifier is undefined if ClientInfo is empty", () => {
            const tempIdToken = idToken;
            tempIdToken.subject = "";

            const emptyClientInfo = ClientInfo.createClientInfoFromIdToken(tempIdToken, TEST_CONFIG.validAuthority);
            const account = Account.createAccount(idToken, emptyClientInfo);
    
            expect(account.homeAccountIdentifier).to.be.undefined;
        });
    });

    describe("compareAccounts", () => {
        it("returns false if a1 is null", () => {
            const account2 = Account.createAccount(idToken, clientInfo);
            expect(Account.compareAccounts(null, account2)).to.be.false;
        });

        it("returns false if a2 is null", () => {
            const account1 = Account.createAccount(idToken, clientInfo);
            expect(Account.compareAccounts(account1, null)).to.be.false;
        });

        it("returns false if a1.homeAccountIdentifier evaluates to false", () => {
            const tempIdToken = idToken;
            tempIdToken.subject = "";

            const clientInfo2 = ClientInfo.createClientInfoFromIdToken(tempIdToken, TEST_CONFIG.validAuthority);
            const account1 = Account.createAccount(idToken, clientInfo2);
            const account2 = Account.createAccount(idToken, clientInfo);

            expect(account1.homeAccountIdentifier).to.undefined;
            expect(Account.compareAccounts(account1, account2)).to.be.false;
        });

        it("returns false if a2.homeAccountIdentifier evaluates to false", () => {
            const tempIdToken = idToken;
            tempIdToken.subject = "";

            const clientInfo2 = ClientInfo.createClientInfoFromIdToken(tempIdToken, TEST_CONFIG.validAuthority);
            const account1 = Account.createAccount(idToken, clientInfo);
            const account2 = Account.createAccount(idToken, clientInfo2);

            expect(account2.homeAccountIdentifier).to.undefined;
            expect(Account.compareAccounts(account1, account2)).to.be.false;
        });

        it("returns true if a1.homeAccountIdentifier === a2.homeAccountIdentifier", () => {
            const account1 = Account.createAccount(idToken, clientInfo);
            const account2 = Account.createAccount(idToken, clientInfo);

            expect(Account.compareAccounts(account1, account2)).to.be.true;
        });

        it("returns false if a1.homeAccountIdentifier !== a2.homeAccountIdentifier", () => {
            const tempIdToken = idToken;
            tempIdToken.subject = "test-oid";

            const clientInfo2 = ClientInfo.createClientInfoFromIdToken(tempIdToken, TEST_CONFIG.validAuthority);
            const account1 = Account.createAccount(idToken, clientInfo);
            const account2 = Account.createAccount(idToken, clientInfo2);

            expect(Account.compareAccounts(account1, account2)).to.be.false;
        });
    });
});
