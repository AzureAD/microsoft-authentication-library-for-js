import { expect } from "chai";
import { AccountEntity } from "../../../src/cache/entities/AccountEntity";
import { mockAccountEntity } from "./cacheConstants";
import { IdToken } from "../../../src/account/IdToken";
import { AuthorityFactory } from "../../../src/authority/AuthorityFactory";
import { Constants } from "../../../src/utils/Constants";
import { NetworkRequestOptions, INetworkModule } from "../../../src/network/INetworkModule";
import { ICrypto, PkceCodes } from "../../../src/crypto/ICrypto";
import { RANDOM_TEST_GUID, TEST_DATA_CLIENT_INFO, TEST_CONFIG, TEST_TOKENS, TEST_URIS, TEST_POP_VALUES } from "../../utils/StringConstants";
import sinon from "sinon";
import { ClientAuthError, ClientAuthErrorMessage } from "../../../src";
import { ClientTestUtils } from "../../client/ClientTestUtils";

describe("AccountEntity.ts Unit Tests", () => {
    beforeEach(() => {
        ClientTestUtils.setCloudDiscoveryMetadataStubs();
    });

    afterEach(() => {
        sinon.restore();
    });

    it("Verify an AccountEntity", () => {
        const ac = new AccountEntity();
        expect(ac instanceof AccountEntity);
    });

    it("generate an AccountEntityKey", () => {
        const ac = new AccountEntity();
        Object.assign(ac, mockAccountEntity);
        expect(ac.generateAccountKey()).to.eql(
            "uid.utid-login.microsoftonline.com-microsoft"
        );
    });

    it("throws error if account entity is not assigned a type", () => {
        const ac = new AccountEntity();
        expect(() => ac.generateType()).to.throw(ClientAuthError);
        expect(() => ac.generateType()).to.throw(ClientAuthErrorMessage.unexpectedAccountType.desc);
    });

    it("generate type of the cache", () => {
        const ac = new AccountEntity();
        Object.assign(ac, mockAccountEntity);
        expect(ac.generateType()).to.eql(1003);
    });

    it("create an Account", () => {
        let cryptoInterface: ICrypto = {
            createNewGuid(): string {
                return RANDOM_TEST_GUID;
            },
            base64Decode(input: string): string {
                switch (input) {
                    case TEST_POP_VALUES.ENCODED_REQ_CNF:
                        return TEST_POP_VALUES.DECODED_REQ_CNF;
                    case TEST_DATA_CLIENT_INFO.TEST_CACHE_RAW_CLIENT_INFO:
                        return TEST_DATA_CLIENT_INFO.TEST_CACHE_DECODED_CLIENT_INFO;
                    default:
                        return input;
                }
            },
            base64Encode(input: string): string {
                switch (input) {
                    case TEST_POP_VALUES.DECODED_REQ_CNF:
                        TEST_POP_VALUES.ENCODED_REQ_CNF;
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
            async getPublicKeyThumbprint(): Promise<string> {
                return TEST_POP_VALUES.KID;
            }
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
            "exp": 1536361411,
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
            cryptoInterface
        );

        expect(acc.generateAccountKey()).to.eql(`uid.utid-login.windows.net-${idTokenClaims.tid}`);
    });
});
