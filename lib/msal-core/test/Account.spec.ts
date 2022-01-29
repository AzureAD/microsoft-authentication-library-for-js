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
            expect(account instanceof Account).toBe(true);
        });

        it("verifies homeAccountIdentifier matches", () => {
            const account = Account.createAccount(idToken, clientInfo);
            const homeAccountIdentifier = CryptoUtils.base64Encode(TEST_DATA_CLIENT_INFO.TEST_UID) + "." + CryptoUtils.base64Encode(TEST_DATA_CLIENT_INFO.TEST_UTID);
    
            expect(account.homeAccountIdentifier).toBe(homeAccountIdentifier);
        });
    
        it("verifies Account object created matches the idToken parameters", () => {
            const account = Account.createAccount(idToken, clientInfo);
    
            expect(account.accountIdentifier).toBe(idToken.objectId);
            expect(account.userName).toBe(idToken.preferredName);
            expect(account.name).toBe(idToken.name);
            // This will be deprecated soon
            expect(account.idToken).toBe(idToken.claims);
            expect(account.idTokenClaims).toBe(idToken.claims);
            expect(account.sid).toBe(idToken.sid);
            expect(account.environment).toBe(idToken.issuer);
        });

        it("verifies accountIdentifier equal subject claim if objectId not present", () => {
            const tempIdToken = idToken;
            tempIdToken.objectId = "";

            const account = Account.createAccount(tempIdToken, clientInfo);
            expect(account.accountIdentifier).toBe(tempIdToken.subject);
        });

        it("verifies homeAccountIdentifier is undefined if ClientInfo is empty", () => {
            const tempIdToken = idToken;
            tempIdToken.subject = "";

            const emptyClientInfo = ClientInfo.createClientInfoFromIdToken(tempIdToken, TEST_CONFIG.validAuthority);
            const account = Account.createAccount(idToken, emptyClientInfo);
    
            expect(account.homeAccountIdentifier).toBeUndefined();
        });
    });

    describe("compareAccounts", () => {
        it("returns false if a1 is null", () => {
            const account2 = Account.createAccount(idToken, clientInfo);
            expect(Account.compareAccounts(null, account2)).toBe(false);
        });

        it("returns false if a2 is null", () => {
            const account1 = Account.createAccount(idToken, clientInfo);
            expect(Account.compareAccounts(account1, null)).toBe(false);
        });

        it("returns false if a1.homeAccountIdentifier evaluates to false", () => {
            const tempIdToken = idToken;
            tempIdToken.subject = "";

            const clientInfo2 = ClientInfo.createClientInfoFromIdToken(tempIdToken, TEST_CONFIG.validAuthority);
            const account1 = Account.createAccount(idToken, clientInfo2);
            const account2 = Account.createAccount(idToken, clientInfo);

            expect(account1.homeAccountIdentifier).toBeUndefined();
            expect(Account.compareAccounts(account1, account2)).toBe(false);
        });

        it("returns false if a2.homeAccountIdentifier evaluates to false", () => {
            const tempIdToken = idToken;
            tempIdToken.subject = "";

            const clientInfo2 = ClientInfo.createClientInfoFromIdToken(tempIdToken, TEST_CONFIG.validAuthority);
            const account1 = Account.createAccount(idToken, clientInfo);
            const account2 = Account.createAccount(idToken, clientInfo2);

            expect(account2.homeAccountIdentifier).toBeUndefined();
            expect(Account.compareAccounts(account1, account2)).toBe(false);
        });

        it("returns true if a1.homeAccountIdentifier === a2.homeAccountIdentifier", () => {
            const account1 = Account.createAccount(idToken, clientInfo);
            const account2 = Account.createAccount(idToken, clientInfo);

            expect(Account.compareAccounts(account1, account2)).toBe(true);
        });

        it("returns false if a1.homeAccountIdentifier !== a2.homeAccountIdentifier", () => {
            const tempIdToken = idToken;
            tempIdToken.subject = "test-oid";

            const clientInfo2 = ClientInfo.createClientInfoFromIdToken(tempIdToken, TEST_CONFIG.validAuthority);
            const account1 = Account.createAccount(idToken, clientInfo);
            const account2 = Account.createAccount(idToken, clientInfo2);

            expect(Account.compareAccounts(account1, account2)).toBe(false);
        });
    });
});
