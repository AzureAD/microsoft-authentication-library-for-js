import { expect } from "chai";
import sinon from "sinon";
import { ServerCodeRequestParameters } from "../../src/server/ServerCodeRequestParameters";
import { AadAuthority } from "../../src/authority/AadAuthority";
import { Constants, SSOTypes, PromptValue, AADServerParamKeys } from "../../src/utils/Constants";
import { NetworkRequestOptions, INetworkModule } from "../../src/network/INetworkModule";
import { TEST_CONFIG, TEST_URIS, RANDOM_TEST_GUID, TEST_TOKENS, TEST_DATA_CLIENT_INFO, DEFAULT_OPENID_CONFIG_RESPONSE, DEFAULT_TENANT_DISCOVERY_RESPONSE } from "../utils/StringConstants";
import { AuthenticationParameters } from "../../src/request/AuthenticationParameters";
import { ICrypto, PkceCodes } from "../../src/crypto/ICrypto";
import { IdTokenClaims } from "../../src/account/IdTokenClaims";
import { IdToken } from "../../src/account/IdToken";
import { buildClientInfo, ClientInfo } from "../../src/account/ClientInfo";
import { Account } from "../../src/account/Account";
import { ClientConfigurationErrorMessage, ClientConfigurationError } from "../../src/error/ClientConfigurationError";
import { ProtocolUtils } from "../../src/utils/ProtocolUtils";
import { TimeUtils } from "../../src/utils/TimeUtils";

describe("ServerCodeRequestParameters.ts Class Unit Tests", () => {

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

    describe("Constructor", () => {

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
            expect(codeRequestParams.xClientVer).to.be.eq("1.0.0-beta.2");
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
            const stateObject = ProtocolUtils.parseRequestState(codeRequestParams.state, cryptoInterface);
            expect(stateObject.libraryState.id).to.be.eq(RANDOM_TEST_GUID);
            expect(stateObject.libraryState.ts).to.be.not.greaterThan(TimeUtils.nowSeconds());
            expect(stateObject.userRequestState).to.be.eq(loginRequest.userRequestState);
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
            const stateObject = ProtocolUtils.parseRequestState(codeRequestParams.state, cryptoInterface);
            expect(stateObject.libraryState.id).to.be.eq(RANDOM_TEST_GUID);
            expect(stateObject.libraryState.ts).to.be.not.greaterThan(TimeUtils.nowSeconds());
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

        let idToken: IdToken;
        let clientInfo: ClientInfo;
        let loginRequest: AuthenticationParameters;
        let testAccount: Account;
        beforeEach(() => {
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
            idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);
            clientInfo = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, cryptoInterface);
            loginRequest = {};
            testAccount = Account.createAccount(idToken, clientInfo, cryptoInterface);
        });

        it("Returns true if account is given in constructor", () => {
            const codeRequestParams = new ServerCodeRequestParameters(
                aadAuthority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                loginRequest,
                testAccount,
                TEST_URIS.TEST_REDIR_URI,
                cryptoInterface,
                true
            );
            expect(codeRequestParams.hasSSOParam()).to.be.true;
        });

        it("Returns true if account is provided in the request", () => {
            loginRequest = {
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
            expect(codeRequestParams.hasSSOParam()).to.be.true;
        });

        it("Returns true if sid is provided in the request", () => {
            loginRequest = {
                sid: "testSid"
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
            expect(codeRequestParams.hasSSOParam()).to.be.true;
        });

        it("Returns true if login_hint is provided in the request", () => {
            loginRequest = {
                loginHint: "thisIsALoginHint"
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
            expect(codeRequestParams.hasSSOParam()).to.be.true;
        });

        it("Returns false if no account object reference is available and no sid or login_hint is given in the request", () => {
            const codeRequestParams = new ServerCodeRequestParameters(
                aadAuthority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                loginRequest,
                null,
                TEST_URIS.TEST_REDIR_URI,
                cryptoInterface,
                true
            );
            expect(codeRequestParams.hasSSOParam()).to.be.false;
        });
    });

    describe("populateQueryParams()", () => {

        let idToken: IdToken;
        let clientInfo: ClientInfo;
        let loginRequest: AuthenticationParameters;
        let testAccount: Account;
        let idTokenClaims: IdTokenClaims;
        beforeEach(() => {
            idTokenClaims = {
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
            idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);
            clientInfo = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, cryptoInterface);
            loginRequest = {};
            testAccount = Account.createAccount(idToken, clientInfo, cryptoInterface);
        });

        it("throws error if prompt is not valid", () => {
            loginRequest = {
                prompt: "thisIsNotAValidPromptVal"
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
            expect(() => codeRequestParams.populateQueryParams()).to.throw(ClientConfigurationErrorMessage.invalidPrompt.desc);
            expect(() => codeRequestParams.populateQueryParams()).to.throw(ClientConfigurationError);
        });

        it("adds sid from account claims to query parameters if prompt === NONE", () => {
            loginRequest = {
                prompt: PromptValue.NONE
            };
            const codeRequestParams = new ServerCodeRequestParameters(
                aadAuthority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                loginRequest,
                testAccount,
                TEST_URIS.TEST_REDIR_URI,
                cryptoInterface,
                true
            );
            codeRequestParams.populateQueryParams();
            expect(codeRequestParams.queryParameters).to.include(`${SSOTypes.SID}=${idTokenClaims.sid}`);
        });

        it("does not add sid from account claims to query parameters if prompt != NONE", () => {
            const codeRequestParams = new ServerCodeRequestParameters(
                aadAuthority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                loginRequest,
                testAccount,
                TEST_URIS.TEST_REDIR_URI,
                cryptoInterface,
                true
            );
            codeRequestParams.populateQueryParams();
            expect(codeRequestParams.queryParameters).to.not.include(`${SSOTypes.SID}=${idTokenClaims.sid}`);
        });

        it("adds login_hint from account claims to query parameters if sid is not present", () => {
            sinon.restore();
            idTokenClaims = {
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
            sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
            idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);
            testAccount = Account.createAccount(idToken, clientInfo, cryptoInterface);
            const codeRequestParams = new ServerCodeRequestParameters(
                aadAuthority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                loginRequest,
                testAccount,
                TEST_URIS.TEST_REDIR_URI,
                cryptoInterface,
                true
            );
            codeRequestParams.populateQueryParams();
            expect(codeRequestParams.queryParameters).to.include(`${SSOTypes.LOGIN_HINT}=${encodeURIComponent(idTokenClaims.preferred_username)}`);
        });

        it("adds sid from request to query parameters if prompt === NONE", () => {
            loginRequest = {
                sid: "thisIsASid",
                prompt: PromptValue.NONE
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
            codeRequestParams.populateQueryParams();
            expect(codeRequestParams.queryParameters).to.include(`${SSOTypes.SID}=${loginRequest.sid}`);
        });

        it("does not add sid from request to query parameters if prompt != NONE", () => {
            loginRequest = {
                sid: "thisIsASid"
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
            codeRequestParams.populateQueryParams();
            expect(codeRequestParams.queryParameters).to.not.include(`${SSOTypes.SID}=${idTokenClaims.sid}`);
        });

        it("adds login_hint from request to query parameters if sid is not present", () => {
            loginRequest = {
                loginHint: "thisIsALoginHint"
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
            codeRequestParams.populateQueryParams();
            expect(codeRequestParams.queryParameters).to.include(`${SSOTypes.LOGIN_HINT}=${loginRequest.loginHint}`);
        });

        it("adds upn from adal token to query parameters as login_hint", () => {
            sinon.restore();
            const adalTokenClaims = {
                "iss": "https://sts.windows.net/fa15d692-e9c7-4460-a743-29f29522229/",
                "exp": "1537237006",
                "name": "abeli",
                "oid": "02223b6b-aa1d-42d4-9ec0-1b2bb9194438",
                "sub": "l3_roISQU222bULS9yi2k0XpqpOiMz5H3ZACo1GeXA",
                "tid": "fa15d692-e9c7-4460-a743-29f2956fd429",
                "upn": "abeli@microsoft.com",
                "ver": "1.0"
            };
            sinon.stub(IdToken, "extractIdToken").returns(adalTokenClaims);
            const adalToken = new IdToken(TEST_TOKENS.IDTOKEN_V1, cryptoInterface);

            const codeRequestParams = new ServerCodeRequestParameters(
                aadAuthority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                loginRequest,
                null,
                TEST_URIS.TEST_REDIR_URI,
                cryptoInterface,
                true
            );

            codeRequestParams.populateQueryParams(adalToken);
            expect(codeRequestParams.queryParameters).to.include(`${SSOTypes.LOGIN_HINT}=${encodeURIComponent(adalTokenClaims.upn)}`);
        });

        it("sanitizeEQParams() removes BlacklistedEQParams from extraQueryParameters string", () => {
            const sidVal = "thisIsASid";
            const loginHintVal = "thisIsALoginHint";
            loginRequest = {
                extraQueryParameters: {
                    sid: sidVal,
                    login_hint: loginHintVal
                }
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
            codeRequestParams.populateQueryParams();
            expect(codeRequestParams.queryParameters).to.be.empty;
            expect(codeRequestParams.extraQueryParameters).to.be.empty;
        });

        it("sanitizeEQParams() removes domain hint if sid is provided", () => {
            const sidVal = "thisIsASid";
            loginRequest = {
                sid: sidVal,
                prompt: PromptValue.NONE,
                extraQueryParameters: {
                    domain_hint: "domainHintTest"
                }
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
            codeRequestParams.populateQueryParams();
            expect(codeRequestParams.queryParameters).to.include(`${SSOTypes.SID}=${loginRequest.sid}`);
            expect(codeRequestParams.extraQueryParameters).to.be.empty;
        });

        it("extraQueryParameters from request are successfully added to extraQueryParameters string", () => {
            const sidVal = "thisIsASid";
            const val1 = "val1";
            const val2 = "val2";
            loginRequest = {
                sid: sidVal,
                prompt: PromptValue.NONE,
                extraQueryParameters: {
                    param1: val1,
                    param2: val2
                }
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
            codeRequestParams.populateQueryParams();
            expect(codeRequestParams.queryParameters).to.include(`${SSOTypes.SID}=${loginRequest.sid}`);
            expect(codeRequestParams.extraQueryParameters).to.include(`param1=${val1}&param2=${val2}`);
        });
    });

    describe("createNavigateUrl()", () => {

        let idToken: IdToken;
        let clientInfo: ClientInfo;
        let loginRequest: AuthenticationParameters;
        let testAccount: Account;
        let idTokenClaims: IdTokenClaims;
        beforeEach(() => {
            idTokenClaims = {
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
            idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);
            clientInfo = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, cryptoInterface);
            loginRequest = {};
            testAccount = Account.createAccount(idToken, clientInfo, cryptoInterface);
            sinon.stub(AadAuthority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
        });

        it("creates a url with default parameters if no request or SSO is being done", async () => {
            await aadAuthority.resolveEndpointsAsync();
            const codeRequestParams = new ServerCodeRequestParameters(
                aadAuthority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                loginRequest,
                null,
                TEST_URIS.TEST_REDIR_URI,
                cryptoInterface,
                true
            );
            codeRequestParams.populateQueryParams();
            const stateObject = ProtocolUtils.parseRequestState(codeRequestParams.state, cryptoInterface);
            const navUrl = await codeRequestParams.createNavigateUrl();
            expect(navUrl).to.contain(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
            expect(navUrl).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.SCOPE}=${encodeURIComponent(codeRequestParams.scopes.printScopes())}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CLIENT_ID}=${encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIR_URI)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.STATE}=${encodeURIComponent(JSON.stringify(stateObject.libraryState))}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.NONCE}=${encodeURIComponent(RANDOM_TEST_GUID)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CLIENT_INFO}=1`);
            expect(navUrl).to.contain(`${AADServerParamKeys.X_CLIENT_SKU}=${encodeURIComponent(codeRequestParams.xClientSku)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.X_CLIENT_VER}=${encodeURIComponent(codeRequestParams.xClientVer)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE}=${encodeURIComponent(codeRequestParams.generatedPkce.challenge)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE_METHOD}=${Constants.S256_CODE_CHALLENGE_METHOD}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CLIENT_REQUEST_ID}=${encodeURIComponent(RANDOM_TEST_GUID)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.RESPONSE_MODE}=${Constants.FRAGMENT_RESPONSE_MODE}`);
            expect(navUrl).to.not.contain(`${AADServerParamKeys.RESOURCE}`);
            expect(navUrl).to.not.contain(`${AADServerParamKeys.PROMPT}`);
            expect(navUrl).to.not.contain(`${AADServerParamKeys.CLAIMS}`);
            expect(codeRequestParams.queryParameters).to.be.empty;
            expect(codeRequestParams.extraQueryParameters).to.be.empty;
        });

        it("creates a url with the resource from the request", async () => {
            await aadAuthority.resolveEndpointsAsync();
            loginRequest = {
                resource: "https://www.contoso.com/resource"
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
            codeRequestParams.populateQueryParams();
            const stateObject = ProtocolUtils.parseRequestState(codeRequestParams.state, cryptoInterface);
            const navUrl = await codeRequestParams.createNavigateUrl();
            expect(navUrl).to.contain(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
            expect(navUrl).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.SCOPE}=${encodeURIComponent(codeRequestParams.scopes.printScopes())}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CLIENT_ID}=${encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIR_URI)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.STATE}=${encodeURIComponent(JSON.stringify(stateObject.libraryState))}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.NONCE}=${encodeURIComponent(RANDOM_TEST_GUID)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CLIENT_INFO}=1`);
            expect(navUrl).to.contain(`${AADServerParamKeys.X_CLIENT_SKU}=${encodeURIComponent(codeRequestParams.xClientSku)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.X_CLIENT_VER}=${encodeURIComponent(codeRequestParams.xClientVer)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE}=${encodeURIComponent(codeRequestParams.generatedPkce.challenge)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE_METHOD}=${Constants.S256_CODE_CHALLENGE_METHOD}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CLIENT_REQUEST_ID}=${encodeURIComponent(RANDOM_TEST_GUID)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.RESPONSE_MODE}=${Constants.FRAGMENT_RESPONSE_MODE}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.RESOURCE}=${encodeURIComponent(loginRequest.resource)}`);
            expect(navUrl).to.not.contain(`${AADServerParamKeys.PROMPT}`);
            expect(navUrl).to.not.contain(`${AADServerParamKeys.CLAIMS}`);
            expect(codeRequestParams.queryParameters).to.be.empty;
            expect(codeRequestParams.extraQueryParameters).to.be.empty;
        });

        it("creates a url with the prompt value from the request", async () => {
            await aadAuthority.resolveEndpointsAsync();
            loginRequest = {
                prompt: PromptValue.SELECT_ACCOUNT
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
            codeRequestParams.populateQueryParams();
            const stateObject = ProtocolUtils.parseRequestState(codeRequestParams.state, cryptoInterface);
            const navUrl = await codeRequestParams.createNavigateUrl();
            expect(navUrl).to.contain(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
            expect(navUrl).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.SCOPE}=${encodeURIComponent(codeRequestParams.scopes.printScopes())}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CLIENT_ID}=${encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIR_URI)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.STATE}=${encodeURIComponent(JSON.stringify(stateObject.libraryState))}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.NONCE}=${encodeURIComponent(RANDOM_TEST_GUID)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CLIENT_INFO}=1`);
            expect(navUrl).to.contain(`${AADServerParamKeys.X_CLIENT_SKU}=${encodeURIComponent(codeRequestParams.xClientSku)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.X_CLIENT_VER}=${encodeURIComponent(codeRequestParams.xClientVer)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE}=${encodeURIComponent(codeRequestParams.generatedPkce.challenge)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE_METHOD}=${Constants.S256_CODE_CHALLENGE_METHOD}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CLIENT_REQUEST_ID}=${encodeURIComponent(RANDOM_TEST_GUID)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.RESPONSE_MODE}=${Constants.FRAGMENT_RESPONSE_MODE}`);
            expect(navUrl).to.not.contain(`${AADServerParamKeys.RESOURCE}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.PROMPT}=${encodeURIComponent(loginRequest.prompt)}`);
            expect(navUrl).to.not.contain(`${AADServerParamKeys.CLAIMS}`);
            expect(codeRequestParams.queryParameters).to.be.empty;
            expect(codeRequestParams.extraQueryParameters).to.be.empty;
        });

        it("creates a url with the SSO parameters in query parameters", async () => {
            await aadAuthority.resolveEndpointsAsync();
            const codeRequestParams = new ServerCodeRequestParameters(
                aadAuthority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                loginRequest,
                testAccount,
                TEST_URIS.TEST_REDIR_URI,
                cryptoInterface,
                true
            );
            codeRequestParams.populateQueryParams();
            const stateObject = ProtocolUtils.parseRequestState(codeRequestParams.state, cryptoInterface);
            const navUrl = await codeRequestParams.createNavigateUrl();
            expect(navUrl).to.contain(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
            expect(navUrl).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.SCOPE}=${encodeURIComponent(codeRequestParams.scopes.printScopes())}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CLIENT_ID}=${encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIR_URI)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.STATE}=${encodeURIComponent(JSON.stringify(stateObject.libraryState))}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.NONCE}=${encodeURIComponent(RANDOM_TEST_GUID)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CLIENT_INFO}=1`);
            expect(navUrl).to.contain(`${AADServerParamKeys.X_CLIENT_SKU}=${encodeURIComponent(codeRequestParams.xClientSku)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.X_CLIENT_VER}=${encodeURIComponent(codeRequestParams.xClientVer)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE}=${encodeURIComponent(codeRequestParams.generatedPkce.challenge)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE_METHOD}=${Constants.S256_CODE_CHALLENGE_METHOD}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CLIENT_REQUEST_ID}=${encodeURIComponent(RANDOM_TEST_GUID)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.RESPONSE_MODE}=${Constants.FRAGMENT_RESPONSE_MODE}`);
            expect(navUrl).to.contain(`${SSOTypes.LOGIN_HINT}=${encodeURIComponent(idTokenClaims.preferred_username)}`);
            expect(navUrl).to.not.contain(`${AADServerParamKeys.RESOURCE}`);
            expect(navUrl).to.not.contain(`${AADServerParamKeys.PROMPT}`);
            expect(navUrl).to.not.contain(`${AADServerParamKeys.CLAIMS}`);
            expect(codeRequestParams.queryParameters).to.be.eq(`${SSOTypes.LOGIN_HINT}=${encodeURIComponent(idTokenClaims.preferred_username)}`);
            expect(codeRequestParams.extraQueryParameters).to.be.empty;
        });

        it("creates a url with the extraQueryParameters from the request", async () => {
            await aadAuthority.resolveEndpointsAsync();
            const val1 = "val1";
            const val2 = "val2";
            loginRequest = {
                extraQueryParameters: {
                    param1: val1,
                    param2: val2
                }
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
            codeRequestParams.populateQueryParams();
            const stateObject = ProtocolUtils.parseRequestState(codeRequestParams.state, cryptoInterface);
            const navUrl = await codeRequestParams.createNavigateUrl();
            expect(navUrl).to.contain(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
            expect(navUrl).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.SCOPE}=${encodeURIComponent(codeRequestParams.scopes.printScopes())}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CLIENT_ID}=${encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIR_URI)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.STATE}=${encodeURIComponent(JSON.stringify(stateObject.libraryState))}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.NONCE}=${encodeURIComponent(RANDOM_TEST_GUID)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CLIENT_INFO}=1`);
            expect(navUrl).to.contain(`${AADServerParamKeys.X_CLIENT_SKU}=${encodeURIComponent(codeRequestParams.xClientSku)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.X_CLIENT_VER}=${encodeURIComponent(codeRequestParams.xClientVer)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE}=${encodeURIComponent(codeRequestParams.generatedPkce.challenge)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE_METHOD}=${Constants.S256_CODE_CHALLENGE_METHOD}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.CLIENT_REQUEST_ID}=${encodeURIComponent(RANDOM_TEST_GUID)}`);
            expect(navUrl).to.contain(`${AADServerParamKeys.RESPONSE_MODE}=${Constants.FRAGMENT_RESPONSE_MODE}`);
            expect(navUrl).to.not.contain(`${AADServerParamKeys.RESOURCE}`);
            expect(navUrl).to.not.contain(`${AADServerParamKeys.PROMPT}`);
            expect(navUrl).to.not.contain(`${AADServerParamKeys.CLAIMS}`);
            expect(navUrl).to.include(`param1=${val1}&param2=${val2}`);
            expect(codeRequestParams.queryParameters).to.empty;
            expect(codeRequestParams.extraQueryParameters).to.be.eq(`param1=${val1}&param2=${val2}`);
        });
    });
});
