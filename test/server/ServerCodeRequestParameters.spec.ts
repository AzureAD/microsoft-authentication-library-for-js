import { expect } from "chai";
import { ServerCodeRequestParameters } from "../../src/server/ServerCodeRequestParameters";
import { AadAuthority } from "../../src/auth/authority/AadAuthority";
import { Constants } from "../../src/utils/Constants";
import { NetworkRequestOptions, INetworkModule } from "../../src/network/INetworkModule";
import { TEST_CONFIG, TEST_URIS, RANDOM_TEST_GUID, TEST_TOKENS, TEST_DATA_CLIENT_INFO } from "../utils/StringConstants";
import { AuthenticationParameters } from "../../src/request/AuthenticationParameters";
import { ICrypto, PkceCodes } from "../../src/crypto/ICrypto";
import { IdTokenClaims } from "../../src/auth/IdTokenClaims";
import { IdToken } from "../../src/auth/IdToken";
import { buildClientInfo } from "../../src/auth/ClientInfo";
import sinon from "sinon";
import { Account } from "../../src/auth/Account";
import { ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";

describe.only("ServerCodeRequestParameters.ts Class Unit Tests", () => {

    describe("Constructor", () => {

        let networkInterface: INetworkModule;
        let cryptoInterface: ICrypto;
        let aadAuthority: AadAuthority;
        beforeEach(() => {
            networkInterface = {
                sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                },
                sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                }
            };
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
            aadAuthority = new AadAuthority(Constants.DEFAULT_AUTHORITY, networkInterface);
            
        });

        afterEach(() => {
            sinon.restore();
        });

        it("correctly assigns request parameter values", () => {
            const testScope1 = "scope1";
            const testScope2 = "scope2";
            const corrId = "thisIsCorrelationId";
            const loginRequest: AuthenticationParameters = {
                scopes: [testScope1, testScope2],
                correlationId: corrId,
                userRequestState: "thisIsState"
            };
            const codeRequestParams = new ServerCodeRequestParameters(
                aadAuthority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                loginRequest,
                null,
                TEST_URIS.TEST_REDIR_URI,
                cryptoInterface,
                false
            );
            loginRequest.scopes.push(Constants.OFFLINE_ACCESS_SCOPE);
            expect(codeRequestParams.xClientVer).to.be.eq("1.0.0-alpha.0");
            expect(codeRequestParams.xClientSku).to.be.eq(Constants.LIBRARY_NAME);
            expect(codeRequestParams.clientId).to.be.eq(TEST_CONFIG.MSAL_CLIENT_ID);
            expect(codeRequestParams.scopes.asArray()).to.be.deep.eq(loginRequest.scopes);
            expect(codeRequestParams.redirectUri).to.be.eq(TEST_URIS.TEST_REDIR_URI);
            expect(codeRequestParams.authorityInstance).to.be.eq(aadAuthority);
            expect(codeRequestParams.responseType).to.be.eq(Constants.CODE_RESPONSE_TYPE);
            expect(codeRequestParams.userRequest).to.be.deep.eq(loginRequest);
            expect(codeRequestParams.queryParameters).to.be.undefined;
            expect(codeRequestParams.extraQueryParameters).to.be.undefined;
            expect(codeRequestParams.generatedPkce).to.be.undefined;
            expect(codeRequestParams.state).to.be.eq(`${RANDOM_TEST_GUID}|${loginRequest.userRequestState}`);
            expect(codeRequestParams.nonce).to.be.eq(RANDOM_TEST_GUID);
            expect(codeRequestParams.account).to.be.null;
        });

        it("appends extraScopesToConsent if isLoginCall is true", () => {
            const testScope1 = "scope1";
            const testScope2 = "scope2";
            const loginRequest: AuthenticationParameters = {
                scopes: [testScope1],
                extraScopesToConsent: [testScope2]
            };
            const codeRequestParams = new ServerCodeRequestParameters(
                aadAuthority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                loginRequest,
                null,
                TEST_URIS.TEST_REDIR_URI,
                cryptoInterface,
                true
            );
            const expectedScopes = [testScope2, Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, Constants.OFFLINE_ACCESS_SCOPE, testScope1];
            expect(codeRequestParams.scopes.asArray()).to.be.deep.eq(expectedScopes);
            expect(codeRequestParams.correlationId).to.be.eq(RANDOM_TEST_GUID);
            expect(codeRequestParams.state).to.be.eq(RANDOM_TEST_GUID);
        });

        it("Uses cached account object", () => {
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
            const loginRequest: AuthenticationParameters = {};
            const testAccount = Account.createAccount(idToken, clientInfo, cryptoInterface);
            const codeRequestParams = new ServerCodeRequestParameters(
                aadAuthority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                loginRequest,
                testAccount,
                TEST_URIS.TEST_REDIR_URI,
                cryptoInterface,
                true
            );
            expect(codeRequestParams.scopes.asArray()).to.be.deep.eq(TEST_CONFIG.DEFAULT_SCOPES);
            expect(codeRequestParams.account).to.be.deep.eq(testAccount);
        });

        it("Uses request account object", () => {
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
            const loginRequest: AuthenticationParameters = {
                account: testAccount
            };
            const codeRequestParams = new ServerCodeRequestParameters(
                aadAuthority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                loginRequest,
                null,
                TEST_URIS.TEST_REDIR_URI,
                cryptoInterface,
                true
            );
            expect(codeRequestParams.account).to.be.deep.eq(testAccount);
        });

        it("throws error if scopes are required and not provided", () => {
            const loginRequest: AuthenticationParameters = {};
            expect(() => new ServerCodeRequestParameters(
                aadAuthority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                loginRequest,
                null,
                TEST_URIS.TEST_REDIR_URI,
                cryptoInterface,
                false
            )).to.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
        });
    });

    describe("hasSSOParam()", () => {

    });

    describe("populateQueryParams()", () => {

    });

    describe("createNavigateUrl()", () => {

    });
});
