import { expect } from "chai";
import { AccountEntity } from "../../../src/cache/entities/AccountEntity";
import { mockAccountEntity } from "./cacheConstants";
import { IdToken } from "../../../src/account/IdToken";
import { AuthorityFactory } from "../../../src/authority/AuthorityFactory";
import { Constants } from "../../../src/utils/Constants";
import { NetworkRequestOptions, INetworkModule } from "../../../src/network/INetworkModule";
import { ICrypto, PkceCodes } from "../../../src/crypto/ICrypto";
import { RANDOM_TEST_GUID, TEST_DATA_CLIENT_INFO, TEST_CONFIG, TEST_TOKENS } from "../../utils/StringConstants";

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

    xit("create an Account", () => {
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
		
		const idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);

        const acc = AccountEntity.createAccount(
            "uid.utid",
            authority,
            idToken,
            null,
            cryptoInterface
        );

        expect(acc.generateAccountKey()).to.eql(
            "uid.utid-login.microsoftonline.com-microsoft"
        );
    });

});
