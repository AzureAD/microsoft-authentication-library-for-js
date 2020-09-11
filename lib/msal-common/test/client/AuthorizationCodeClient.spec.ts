import * as Mocha from "mocha";
import { expect } from "chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import {
    Authority,
    AuthorizationCodeClient,
    AuthorizationCodeRequest,
    AuthorizationUrlRequest,
    Constants,
    ClientConfigurationErrorMessage,
    ClientAuthErrorMessage,
    ServerError,
    IdToken,
    CacheManager,
    AccountInfo,
    AccountEntity
} from "../../src";
import {
    ALTERNATE_OPENID_CONFIG_RESPONSE,
    AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
    TEST_TOKENS,
    TEST_URIS,
    TEST_DATA_CLIENT_INFO,
    RANDOM_TEST_GUID,
    TEST_STATE_VALUES,
    TEST_ACCOUNT_INFO
} from "../utils/StringConstants";
import { ClientConfiguration } from "../../src/config/ClientConfiguration";
import { BaseClient } from "../../src/client/BaseClient";
import { AADServerParamKeys, PromptValue, ResponseMode, SSOTypes } from "../../src/utils/Constants";
import { ClientTestUtils, MockStorageClass } from "./ClientTestUtils";

describe("AuthorizationCodeClient unit tests", () => {
    beforeEach(() => {
        ClientTestUtils.setCloudDiscoveryMetadataStubs();
    });

    afterEach(() => {
        const config = null;
        sinon.restore();
    });

    describe("Constructor", () => {

        it("creates a AuthorizationCodeClient that extends BaseClient", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);
            expect(client).to.be.not.null;
            expect(client instanceof AuthorizationCodeClient).to.be.true;
            expect(client instanceof BaseClient).to.be.true;
        });
    });

    describe("Authorization url creation", () => {

        it("Creates an authorization url with default parameters", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const authCodeUrlRequest: AuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl).to.contain(Constants.DEFAULT_AUTHORITY);
            expect(loginUrl).to.contain(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
            expect(loginUrl).to.contain(`${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIRECT_URI_LOCALHOST)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.RESPONSE_MODE}=${encodeURIComponent(ResponseMode.QUERY)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE}=${encodeURIComponent(TEST_CONFIG.TEST_CHALLENGE)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE_METHOD}=${encodeURIComponent(Constants.S256_CODE_CHALLENGE_METHOD)}`);
        });

        it("Creates an authorization url passing in optional parameters", async () => {
            // Override with alternate authority openid_config
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE);

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const authCodeUrlRequest: AuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                authority: TEST_CONFIG.alternateValidAuthority,
                responseMode: ResponseMode.FORM_POST,
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: TEST_CONFIG.CODE_CHALLENGE_METHOD,
                state: TEST_CONFIG.STATE,
                prompt: PromptValue.SELECT_ACCOUNT,
                loginHint: TEST_CONFIG.LOGIN_HINT,
                domainHint: TEST_CONFIG.DOMAIN_HINT,
                claims: TEST_CONFIG.CLAIMS,
                nonce: TEST_CONFIG.NONCE
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl).to.contain(TEST_CONFIG.alternateValidAuthority);
            expect(loginUrl).to.contain(ALTERNATE_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
            expect(loginUrl).to.contain(`${AADServerParamKeys.SCOPE}=${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIRECT_URI_LOCALHOST)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.RESPONSE_MODE}=${encodeURIComponent(ResponseMode.FORM_POST)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.STATE}=${encodeURIComponent(TEST_CONFIG.STATE)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.NONCE}=${encodeURIComponent(TEST_CONFIG.NONCE)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE}=${encodeURIComponent(TEST_CONFIG.TEST_CHALLENGE)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE_METHOD}=${encodeURIComponent(TEST_CONFIG.CODE_CHALLENGE_METHOD)}`);
            expect(loginUrl).to.contain(`${SSOTypes.LOGIN_HINT}=${encodeURIComponent(TEST_CONFIG.LOGIN_HINT)}`);
            expect(loginUrl).to.contain(`${SSOTypes.DOMAIN_HINT}=${encodeURIComponent(TEST_CONFIG.DOMAIN_HINT)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`);
        });

        it("Prefers sid over loginHint if both provided", async () => {
            // Override with alternate authority openid_config
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE);

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const authCodeUrlRequest: AuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                loginHint: TEST_CONFIG.LOGIN_HINT,
                sid: TEST_CONFIG.SID
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl).to.not.contain(`${SSOTypes.LOGIN_HINT}=`);
            expect(loginUrl).to.contain(`${SSOTypes.SID}=${encodeURIComponent(TEST_CONFIG.SID)}`);
        });

        it("Prefers loginHint over Account if both provided", async () => {
            // Override with alternate authority openid_config
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE);

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const authCodeUrlRequest: AuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                loginHint: TEST_CONFIG.LOGIN_HINT,
                account: TEST_ACCOUNT_INFO
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl).to.contain(`${SSOTypes.LOGIN_HINT}=${encodeURIComponent(TEST_CONFIG.LOGIN_HINT)}`);
            expect(loginUrl).to.not.contain(`${SSOTypes.SID}=`);
        });

        it("Sets login_hint to Account.username if login_hint and sid are not provided", async () => {
            // Override with alternate authority openid_config
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE);

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const authCodeUrlRequest: AuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                account: TEST_ACCOUNT_INFO
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl).to.contain(`${SSOTypes.LOGIN_HINT}=${encodeURIComponent(TEST_ACCOUNT_INFO.username)}`);
            expect(loginUrl).to.not.contain(`${SSOTypes.SID}=`);
        });

        it("Creates a login URL with scopes from given token request", async () => {
            // Override with alternate authority openid_config
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE);

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const testScope1 = "testscope1";
            const testScope2 = "testscope2";
            const loginRequest: AuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [testScope1, testScope2],
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD
            };

            const loginUrl = await client.getAuthCodeUrl(loginRequest);
            expect(loginUrl).to.contain(`${AADServerParamKeys.SCOPE}=${encodeURIComponent(`${testScope1} ${testScope2}`)}`);
        });

        it("Uses authority if given in request", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const loginRequest: AuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                authority: `${TEST_URIS.ALTERNATE_INSTANCE}/common`,
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD
            };
            const loginUrl = await client.getAuthCodeUrl(loginRequest);
            expect(loginUrl).to.contain(TEST_URIS.ALTERNATE_INSTANCE);
            expect(loginUrl).to.contain(ALTERNATE_OPENID_CONFIG_RESPONSE.body.authorization_endpoint);
            expect(loginUrl).to.contain(`${AADServerParamKeys.SCOPE}=${encodeURIComponent(`${Constants.OPENID_SCOPE} ${Constants.PROFILE_SCOPE} ${Constants.OFFLINE_ACCESS_SCOPE}`)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIR_URI)}`);
        });

        it("Throws error if no scopes are passed to createUrl", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const emptyRequest: AuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: null,
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD
            };
            await expect(client.getAuthCodeUrl(emptyRequest)).to.be.rejectedWith(ClientConfigurationErrorMessage.emptyScopesError.desc);
        });

        it("Throws error if empty scopes are passed to createUrl", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const emptyRequest: AuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [],
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD
            };
            await expect(client.getAuthCodeUrl(emptyRequest)).to.be.rejectedWith(ClientConfigurationErrorMessage.emptyScopesError.desc);
        });
    });

    describe("handleFragmentResponse()", () => {

        it("returns valid server code response", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const testSuccessHash = `#code=thisIsATestCode&client_info=${TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO}&state=${encodeURIComponent(TEST_STATE_VALUES.ENCODED_LIB_STATE)}`;
            config.cryptoInterface.base64Decode = (input: string): string => {
                switch (input) {
                    case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                        return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                    default:
                        return input;
                }
            };
            config.cryptoInterface.base64Encode = (input: string): string => {
                switch (input) {
                    case "123-test-uid":
                        return "MTIzLXRlc3QtdWlk";
                    case "456-test-utid":
                        return "NDU2LXRlc3QtdXRpZA==";
                    default:
                        return input;
                }
            };
            const client: AuthorizationCodeClient = new AuthorizationCodeClient(config);
            const code = client.handleFragmentResponse(testSuccessHash, TEST_STATE_VALUES.ENCODED_LIB_STATE);
            expect(code).to.be.eq("thisIsATestCode");
        });

        it("returns valid server code response when state is encoded twice", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const testSuccessHash = `#code=thisIsATestCode&client_info=${TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO}&state=${encodeURIComponent(encodeURIComponent(TEST_STATE_VALUES.ENCODED_LIB_STATE))}`;
            config.cryptoInterface.base64Decode = (input: string): string => {
                switch (input) {
                    case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                        return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                    default:
                        return input;
                }
            };
            config.cryptoInterface.base64Encode = (input: string): string => {
                switch (input) {
                    case "123-test-uid":
                        return "MTIzLXRlc3QtdWlk";
                    case "456-test-utid":
                        return "NDU2LXRlc3QtdXRpZA==";
                    default:
                        return input;
                }
            };
            const client: AuthorizationCodeClient = new AuthorizationCodeClient(config);
            const code = client.handleFragmentResponse(testSuccessHash, TEST_STATE_VALUES.ENCODED_LIB_STATE);
            expect(code).to.be.eq("thisIsATestCode");
        });

        it("throws server error when error is in hash", async () => {
            const testErrorHash = `#error=error_code&error_description=msal+error+description&state=${encodeURIComponent(TEST_STATE_VALUES.ENCODED_LIB_STATE)}`;
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client: AuthorizationCodeClient = new AuthorizationCodeClient(config);
            const cacheStorageMock = config.storageInterface as MockStorageClass;
            expect(() => client.handleFragmentResponse(testErrorHash, TEST_STATE_VALUES.ENCODED_LIB_STATE)).to.throw("msal error description");
            expect(cacheStorageMock.store).to.be.empty;

            expect(() => client.handleFragmentResponse(testErrorHash, TEST_STATE_VALUES.ENCODED_LIB_STATE)).to.throw(ServerError);
            expect(cacheStorageMock.store).to.be.empty;
        });
    });

    describe("Acquire a token", () => {

        it("Throws error if null code request is passed", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            await expect(client.acquireToken(null, "", "")).to.be.rejectedWith(ClientAuthErrorMessage.tokenRequestCannotBeMade.desc);
            expect(config.storageInterface.getKeys()).to.be.empty;
        });

        it("Throws error if code response does not contain PKCE code", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const codeRequest: AuthorizationCodeRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["scope"],
                code: null
            };
            await expect(client.acquireToken(codeRequest, "", "")).to.be.rejectedWith(ClientAuthErrorMessage.tokenRequestCannotBeMade.desc);
            expect(config.storageInterface.getKeys()).to.be.empty;
        });

        it("Acquires a token successfully", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            sinon.stub(AuthorizationCodeClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);
            const createTokenRequestBodySpy = sinon.spy(AuthorizationCodeClient.prototype, <any>"createTokenRequestBody");

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            // Set up required objects and mocked return values
            const testState = `eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9${Constants.RESOURCE_DELIM}userState`;
            const decodedLibState = "{ \"id\": \"testid\", \"ts\": 1592846482 }";
            config.cryptoInterface.base64Decode = (input: string): string => {
                switch (input) {
                    case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                        return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                    case "eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9":
                        return decodedLibState;
                    default:
                        return input;
                }
            };

            config.cryptoInterface.base64Encode = (input: string): string => {
                switch (input) {
                    case "123-test-uid":
                        return "MTIzLXRlc3QtdWlk";
                    case "456-test-utid":
                        return "NDU2LXRlc3QtdXRpZA==";
                    case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                        return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                    default:
                        return input;
                }
            };
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
            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: AuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS
            };

            const authenticationResult = await client.acquireToken(authCodeRequest, idTokenClaims.nonce, testState);

            expect(authenticationResult.accessToken).to.deep.eq(AUTHENTICATION_RESULT.body.access_token);
            expect((Date.now() + (AUTHENTICATION_RESULT.body.expires_in * 1000)) >= authenticationResult.expiresOn.getMilliseconds()).to.be.true;
            expect(createTokenRequestBodySpy.calledWith(authCodeRequest)).to.be.ok;

            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.SCOPE}=${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIRECT_URI_LOCALHOST)}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CODE}=${TEST_TOKENS.AUTHORIZATION_CODE}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.GRANT_TYPE}=${Constants.CODE_GRANT_TYPE}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CODE_VERIFIER}=${TEST_CONFIG.TEST_VERIFIER}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`);
        });
    });

    describe("getLogoutUri()", () => {

        it("Returns a uri and clears the cache", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                environment: "login.windows.net",
                tenantId: "testTenantId",
                username: "test@contoso.com"
            };

            const removeAccountSpy = sinon.stub(MockStorageClass.prototype, "clear").returns();
            const logoutUri = client.getLogoutUri({account: null});

            expect(removeAccountSpy.calledOnce).to.be.true;
            expect(logoutUri).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace("{tenant}", "common"));
        });

        it("Returns a uri and clears the cache of relevant account info", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                environment: "login.windows.net",
                tenantId: "testTenantId",
                username: "test@contoso.com"
            };

            const removeAccountSpy = sinon.stub(CacheManager.prototype, "removeAccount").returns(true);
            const logoutUri = client.getLogoutUri({account: testAccount});

            expect(removeAccountSpy.calledWith(AccountEntity.generateAccountCacheKey(testAccount))).to.be.true;
            expect(logoutUri).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace("{tenant}", "common"));
        });

        it("Returns a uri with given postLogoutUri and correlationId", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                environment: "login.windows.net",
                tenantId: "testTenantId",
                username: "test@contoso.com"
            };

            const removeAccountSpy = sinon.stub(CacheManager.prototype, "removeAccount").returns(true);
            const logoutUri = client.getLogoutUri({
                account: testAccount,
                correlationId: RANDOM_TEST_GUID,
                postLogoutRedirectUri: TEST_URIS.TEST_LOGOUT_URI
            });

            expect(removeAccountSpy.calledWith(AccountEntity.generateAccountCacheKey(testAccount))).to.be.true;
            const testLogoutUriWithParams = `${DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace("{tenant}", "common")}?${AADServerParamKeys.POST_LOGOUT_URI}=${encodeURIComponent(TEST_URIS.TEST_LOGOUT_URI)}&${AADServerParamKeys.CLIENT_REQUEST_ID}=${encodeURIComponent(RANDOM_TEST_GUID)}`;
            expect(logoutUri).to.be.eq(testLogoutUriWithParams);
        });
    });
});
