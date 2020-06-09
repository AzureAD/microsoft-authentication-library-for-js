import { expect } from "chai";
import { AccessTokenKey } from "../../src/cache/AccessTokenKey";
import { Constants, ICrypto, PkceCodes } from "../../src";
import { TEST_CONFIG, TEST_DATA_CLIENT_INFO, RANDOM_TEST_GUID } from "../utils/StringConstants";

describe("AccessTokenKey.ts tests", () => {
    
    describe("Constructor", () => {

        let cryptoInterface: ICrypto;
        let scopeString: string;
        beforeEach(() => {
            cryptoInterface = {
                createNewGuid(): string {
                    return RANDOM_TEST_GUID;
                },
                base64Decode(input: string): string {
                    return input;
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
            scopeString = TEST_CONFIG.DEFAULT_SCOPES.join(" ");
        });

        it("Correctly assign values for key", () => {
            const atKey = new AccessTokenKey(Constants.DEFAULT_AUTHORITY, TEST_CONFIG.MSAL_CLIENT_ID, scopeString, TEST_DATA_CLIENT_INFO.TEST_UID, TEST_DATA_CLIENT_INFO.TEST_UTID, cryptoInterface);
            expect(atKey.authority).to.be.eq(`${Constants.DEFAULT_AUTHORITY}/`);
            expect(atKey.clientId).to.be.eq(TEST_CONFIG.MSAL_CLIENT_ID);
            expect(atKey.scopes).to.be.eq(scopeString);
            expect(atKey.homeAccountIdentifier).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID);
        });

        it("Does not assign value for homeAccountId if uid or utid are empty", () => {
            const atKey = new AccessTokenKey(Constants.DEFAULT_AUTHORITY, TEST_CONFIG.MSAL_CLIENT_ID, scopeString, "", TEST_DATA_CLIENT_INFO.TEST_UTID, cryptoInterface);
            expect(atKey.homeAccountIdentifier).to.be.undefined;

            const atKey2 = new AccessTokenKey(Constants.DEFAULT_AUTHORITY, TEST_CONFIG.MSAL_CLIENT_ID, scopeString, TEST_DATA_CLIENT_INFO.TEST_UID, "", cryptoInterface);
            expect(atKey2.homeAccountIdentifier).to.be.undefined;
        });
    });
});
