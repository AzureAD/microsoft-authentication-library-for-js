import * as Mocha from "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
const expect = chai.expect;
chai.use(chaiAsPromised);
import { BaseClient } from "../../src/client/BaseClient";
import { Configuration } from "../../src/config/Configuration";
import { AuthenticationParameters } from "../../src/request/AuthenticationParameters";
import { TokenResponse } from "../../src/response/TokenResponse";
import { CodeResponse } from "../../src/response/CodeResponse";
import { TokenRenewParameters } from "../../src/request/TokenRenewParameters";
import sinon from "sinon";
import { Account, PkceCodes, PersistentCacheKeys, ICrypto } from "../../src";
import { TEST_TOKENS, TEST_DATA_CLIENT_INFO, TEST_CONFIG, RANDOM_TEST_GUID } from "../utils/StringConstants";
import { buildClientInfo, ClientInfo } from "../../src/auth/ClientInfo";
import { IdToken } from "../../src/auth/IdToken";
import { IdTokenClaims } from "../../src/auth/IdTokenClaims";

class TestClient extends BaseClient {

    constructor(config: Configuration, testAccount: Account) {
        super(config);
        this.account = testAccount
    }

    handleFragmentResponse(hashFragment: string): CodeResponse {
        throw new Error("Method not implemented.");
    }

    createLoginUrl(request: AuthenticationParameters): Promise<string> {
        throw new Error("Method not implemented.");
    }

    createAcquireTokenUrl(request: AuthenticationParameters): Promise<string> {
        throw new Error("Method not implemented.");
    }

    acquireToken(codeResponse: CodeResponse): Promise<TokenResponse> {
        throw new Error("Method not implemented.");
    }

    renewToken(request: TokenRenewParameters): Promise<TokenResponse> {
        throw new Error("Method not implemented.");
    }

    logout(authorityUri?: string): Promise<string> {
        throw new Error("Method not implemented.");
    }
}

describe("BaseClient.ts Class Unit Tests", () => {
    describe("Constructor", () => {

        it("Creates a valid BaseClient object", () => {
            let config: Configuration = {
                systemOptions: null,
                cryptoInterface: null,
                networkInterface: null,
                storageInterface: null,
                loggerOptions: null
            };
            let client = new TestClient(config, null);
            expect(client).to.be.not.null;
            expect(client instanceof BaseClient).to.be.true;
        });
    });

    describe("getAccount()", () => {
        let store;
        let config: Configuration;
        let client: TestClient;
        let idToken: IdToken;
        let clientInfo: ClientInfo;
        let testAccount: Account;
        beforeEach(() => {
            store = {};
            config = {
                systemOptions: null,
                cryptoInterface: {
                    createNewGuid(): string {
                        return RANDOM_TEST_GUID;
                    },
                    base64Decode(input: string): string {
                        return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
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
                },
                networkInterface: null,
                storageInterface: {
                    setItem(key: string, value: string): void {
                        store[key] = value;
                    },
                    getItem(key: string): string {
                        return store[key];
                    },
                    removeItem(key: string): void {
                        delete store[key];
                    },
                    containsKey(key: string): boolean {
                        return !!store[key];
                    },
                    getKeys(): string[] {
                        return Object.keys(store);
                    },
                    clear(): void {
                        store = {};
                    }
                },
                loggerOptions: null
            };

            const idTokenClaims: IdTokenClaims = {
                "ver": "2.0",
                "iss": "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": "1536361411",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "nonce": "123523",
            };
            sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
            idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, config.cryptoInterface);
            clientInfo = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, config.cryptoInterface);
            testAccount = Account.createAccount(idToken, clientInfo, config.cryptoInterface);
        });

        afterEach(() => {
            sinon.restore();
        });

        it("returns null if nothing is in the cache", () => {
            client = new TestClient(config, null);
            expect(client.getAccount()).to.be.null;
        });

        it("returns the current account if it exists", () => {
            client = new TestClient(config, testAccount);
            expect(Account.compareAccounts(client.getAccount(), testAccount)).to.be.true;
        });

        it("Creates account object from cached id token and client info", () => {
            store[PersistentCacheKeys.ID_TOKEN] = idToken;
            store[PersistentCacheKeys.CLIENT_INFO] = clientInfo;
            client = new TestClient(config, null);
            expect(Account.compareAccounts(client.getAccount(), testAccount)).to.be.true;
        });
    });
});
