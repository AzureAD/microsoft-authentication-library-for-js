import { expect } from "chai";
import { AccountEntity } from "../../../src/cache/entities/AccountEntity";
import { mockAccountEntity } from "./cacheConstants";
import { IdToken } from "../../../src/account/IdToken";
import { AuthorityFactory } from "../../../src/authority/AuthorityFactory";
import { Constants } from "../../../src/utils/Constants";
import { NetworkRequestOptions, INetworkModule } from "../../../src/network/INetworkModule";
import { ICrypto, PkceCodes } from "../../../src/crypto/ICrypto";
import { RANDOM_TEST_GUID, TEST_DATA_CLIENT_INFO, TEST_CONFIG, TEST_TOKENS, TEST_URIS } from "../../utils/StringConstants";
import sinon from "sinon";

describe("AccountEntity.ts Unit Tests", () => {

    it("Verify an AccountEntity", () => {
        const ac = new AccountEntity();
        expect(ac instanceof AccountEntity);
    });

    it("generate an AccountEntityKey", () => {
        let ac = new AccountEntity();
        Object.assign(ac, mockAccountEntity);
        expect(ac.generateAccountKey()).to.eql(
            "uid.utid-login.microsoftonline.com-microsoft"
        );
    });

    it("create an Account", () => {
        let cryptoInterface: ICrypto = {
            createNewGuid(): string {
                return RANDOM_TEST_GUID;
            },
            base64Decode(input: string): string {
                switch (input) {
                    case TEST_DATA_CLIENT_INFO.TEST_CACHE_RAW_CLIENT_INFO:
                        return TEST_DATA_CLIENT_INFO.TEST_CACHE_DECODED_CLIENT_INFO;
                    default:
                        return input;
                }
            },
            base64Encode(input: string): string {
                switch (input) {
                    case "uid":
                        return "dWlk";
                    case "utid":
                        return "dXRpZA==";
                    default:
                        return input;
                }
            },
            async generatePkceCodes(): Promise<PkceCodes> {
                return {
                    challenge: TEST_CONFIG.TEST_CHALLENGE,
                    verifier: TEST_CONFIG.TEST_VERIFIER,
                };
            },
        };

        const networkInterface: INetworkModule = {
            sendGetRequestAsync<T>(
                url: string,
                options?: NetworkRequestOptions
            ): T {
                return null;
            },
            sendPostRequestAsync<T>(
                url: string,
                options?: NetworkRequestOptions
            ): T {
                return null;
            }
        };
        const authority =  AuthorityFactory.createInstance(
            Constants.DEFAULT_AUTHORITY,
            networkInterface
		);
        
        // Set up stubs
        const idTokenClaims = {
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
        sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
		const idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);

        const acc = AccountEntity.createAccount(
            TEST_DATA_CLIENT_INFO.TEST_CACHE_RAW_CLIENT_INFO,
            authority,
            idToken,
            null,
            cryptoInterface
        );

        expect(acc.generateAccountKey()).to.eql(`uid.utid-login.windows.net-${idTokenClaims.tid}`);
    });
});
