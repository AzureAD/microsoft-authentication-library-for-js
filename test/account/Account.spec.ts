import { expect } from "chai";
import { IdTokenClaims } from "../../src/account/IdTokenClaims";
import { TEST_URIS, TEST_DATA_CLIENT_INFO, TEST_TOKENS, RANDOM_TEST_GUID, TEST_CONFIG } from "../utils/StringConstants";
import { Account } from "../../src/account/Account";
import sinon from "sinon";
import { IdToken } from "../../src/account/IdToken";
import { ICrypto, PkceCodes } from "../../src";
import { buildClientInfo } from "../../src/account/ClientInfo";

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
                "nonce": "123523"
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

        let cryptoInterface: ICrypto;
        beforeEach(() => {
            cryptoInterface = {
                createNewGuid(): string {
                    return RANDOM_TEST_GUID;
                },
                base64Decode(input: string): string {
                    switch (input) {
                        case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                            return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                        default:
                            return input;
                    }
                },
                base64Encode(input: string): string {
                    switch (input) {
                        case "123-test-uid":
                            return "MTIzLXRlc3QtdWlk";
                        case "456-test-utid":
                            return "NDU2LXRlc3QtdXRpZA==";
                        default:
                            return input;
                    }
                },
                async generatePkceCodes(): Promise<PkceCodes> {
                    return {
                        challenge: TEST_CONFIG.TEST_CHALLENGE,
                        verifier: TEST_CONFIG.TEST_VERIFIER
                    }
                }
            };
        });

        afterEach(() => {
            sinon.restore();
        });

        it("Returns a valid account with given idToken and client info object", () => {
            const idTokenClaims: IdTokenClaims = {
                "ver": "2.0",
                "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": "1536361411",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "sid": "test_session_id",
                "nonce": "123523"
            };
            sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
            const idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);
            const clientInfo = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, cryptoInterface);

            const testAccount = Account.createAccount(idToken, clientInfo, cryptoInterface);
            expect(testAccount.accountIdentifier).to.be.eq(idTokenClaims.oid);
            expect(testAccount.homeAccountIdentifier).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID);
            expect(testAccount.userName).to.be.eq(idTokenClaims.preferred_username);
            expect(testAccount.name).to.be.eq(idTokenClaims.name);
            expect(testAccount.idToken).to.be.eq(TEST_TOKENS.IDTOKEN_V2);
            expect(testAccount.idTokenClaims).to.be.deep.eq(idTokenClaims);
            expect(testAccount.sid).to.be.eq(idTokenClaims.sid);
            expect(testAccount.environment).to.be.eq(idTokenClaims.iss);
        });

        it("Uses sub instead of oid for accountIdentifier if oid does not exist", () => {
            const idTokenClaims: IdTokenClaims = {
                "ver": "2.0",
                "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": "1536361411",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "sid": "test_session_id",
                "nonce": "123523"
            };
            sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
            const idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);
            const clientInfo = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, cryptoInterface);

            const testAccount = Account.createAccount(idToken, clientInfo, cryptoInterface);
            expect(testAccount.accountIdentifier).to.be.eq(idTokenClaims.sub);
        });

        it("Sets homeAccountIdentifier to empty if uid or utid are empty", () => {
            const idTokenClaims: IdTokenClaims = {
                "ver": "2.0",
                "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": "1536361411",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "sid": "test_session_id",
                "nonce": "123523"
            };
            sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
            const idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);
            const clientInfo1 = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, cryptoInterface);
            const clientInfo2 = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, cryptoInterface);

            clientInfo1.uid = "";
            clientInfo2.utid = "";

            const testAccount = Account.createAccount(idToken, clientInfo1, cryptoInterface);

            const testAccount2 = Account.createAccount(idToken, clientInfo2, cryptoInterface);

            expect(testAccount.homeAccountIdentifier).to.be.undefined;
            expect(testAccount2.homeAccountIdentifier).to.be.undefined;
        });
    });

    describe("compareAccounts()", () => {

        let cryptoInterface: ICrypto;
        beforeEach(() => {
            cryptoInterface = {
                createNewGuid(): string {
                    return RANDOM_TEST_GUID;
                },
                base64Decode(input: string): string {
                    switch (input) {
                        case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                            return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                        default:
                            return input;
                    }
                },
                base64Encode(input: string): string {
                    switch (input) {
                        case "123-test-uid":
                            return "MTIzLXRlc3QtdWlk";
                        case "456-test-uid":
                            return "NDU2LXRlc3QtdWlk";
                        case "456-test-utid":
                            return "NDU2LXRlc3QtdXRpZA==";
                        default:
                            return input;
                    }
                },
                async generatePkceCodes(): Promise<PkceCodes> {
                    return {
                        challenge: TEST_CONFIG.TEST_CHALLENGE,
                        verifier: TEST_CONFIG.TEST_VERIFIER
                    }
                }
            };
        });

        afterEach(() => {
            sinon.restore();
        });

        it("returns false if one or both of the accounts are null", () => {
            const idTokenClaims: IdTokenClaims = {
                "ver": "2.0",
                "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": "1536361411",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "sid": "test_session_id",
                "nonce": "123523"
            };
            sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
            const idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);
            const clientInfo = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, cryptoInterface);

            const testAccount = Account.createAccount(idToken, clientInfo, cryptoInterface);

            expect(Account.compareAccounts(testAccount, null)).to.be.false;
            expect(Account.compareAccounts(null, testAccount)).to.be.false;
            expect(Account.compareAccounts(null, null)).to.be.false;
        });

        it("Returns false if homeAccountIdentifier is empty for one or both accounts", () => {
            const idTokenClaims: IdTokenClaims = {
                "ver": "2.0",
                "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": "1536361411",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "sid": "test_session_id",
                "nonce": "123523"
            };
            sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
            const idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);
            const clientInfo1 = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, cryptoInterface);
            const clientInfo2 = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, cryptoInterface);
            const clientInfo3 = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, cryptoInterface);

            clientInfo1.uid = "";
            clientInfo2.utid = "";

            const testAccount = Account.createAccount(idToken, clientInfo1, cryptoInterface);

            const testAccount2 = Account.createAccount(idToken, clientInfo2, cryptoInterface);

            const testAccount3 = Account.createAccount(idToken, clientInfo3, cryptoInterface);

            expect(Account.compareAccounts(testAccount, testAccount3)).to.be.false;
            expect(Account.compareAccounts(testAccount2, testAccount3)).to.be.false;
        });

        it("Returns false if homeAccountIds match", () => {
            const idTokenClaims: IdTokenClaims = {
                "ver": "2.0",
                "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": "1536361411",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "sid": "test_session_id",
                "nonce": "123523"
            };
            sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
            const idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);
            const clientInfo = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, cryptoInterface);
            const clientInfo2 = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, cryptoInterface);
            clientInfo.uid = "456-test-uid";

            const testAccount = Account.createAccount(idToken, clientInfo, cryptoInterface);
            const testAccount2 = Account.createAccount(idToken, clientInfo2, cryptoInterface);

            expect(Account.compareAccounts(testAccount, testAccount2)).to.be.false;
        });

        it("Returns true if homeAccountIds match", () => {
            const idTokenClaims: IdTokenClaims = {
                "ver": "2.0",
                "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": "1536361411",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "sid": "test_session_id",
                "nonce": "123523"
            };
            sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
            const idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);
            const clientInfo = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, cryptoInterface);

            const testAccount = Account.createAccount(idToken, clientInfo, cryptoInterface);
            const testAccount2 = Account.createAccount(idToken, clientInfo, cryptoInterface);

            expect(Account.compareAccounts(testAccount, testAccount2)).to.be.true;
        });
    });
});
