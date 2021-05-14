import * as Mocha from "mocha";
import * as chai from "chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
const expect = chai.expect;	
chai.use(chaiAsPromised);
import {
    Authority,
    AuthorizationCodeClient,
    CommonAuthorizationCodeRequest,
    CommonAuthorizationUrlRequest,
    Constants,
    ClientAuthErrorMessage,
    ServerError,
    IdToken,
    CacheManager,
    AccountInfo,
    AccountEntity,
    AuthToken,
    ICrypto,
    TokenClaims,
    SignedHttpRequest
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
    TEST_POP_VALUES,
    POP_AUTHENTICATION_RESULT,
    TEST_ACCOUNT_INFO,
    CORS_SIMPLE_REQUEST_HEADERS
} from "../test_kit/StringConstants";
import { ClientConfiguration } from "../../src/config/ClientConfiguration";
import { BaseClient } from "../../src/client/BaseClient";
import { AADServerParamKeys, PromptValue, ResponseMode, SSOTypes, AuthenticationScheme, ThrottlingConstants } from "../../src/utils/Constants";
import { ClientTestUtils, MockStorageClass } from "./ClientTestUtils";
import { version } from "../../src/packageMetadata";
import { TestError } from "../test_kit/TestErrors";

describe("AuthorizationCodeClient unit tests", () => {
    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", () => {

        it("creates a AuthorizationCodeClient that extends BaseClient", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);
            expect(client).to.be.not.null;
            expect(client instanceof AuthorizationCodeClient).to.be.true;
            expect(client instanceof BaseClient).to.be.true;
        });
    });

    describe("Authorization url creation", () => {

        it("Creates an authorization url with default parameters", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.QUERY,
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                stkJwk: TEST_POP_VALUES.KID
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
            expect(loginUrl).to.contain(`${AADServerParamKeys.STK_JWK}=${encodeURIComponent(TEST_POP_VALUES.DECODED_STK_JWK_THUMBPRINT)}`);
        });

        it("Creates an authorization url passing in optional parameters", async () => {
            // Override with alternate authority openid_config
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FORM_POST,
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: TEST_CONFIG.CODE_CHALLENGE_METHOD,
                state: TEST_CONFIG.STATE,
                prompt: PromptValue.LOGIN,
                loginHint: TEST_CONFIG.LOGIN_HINT,
                domainHint: TEST_CONFIG.DOMAIN_HINT,
                claims: TEST_CONFIG.CLAIMS,
                nonce: TEST_CONFIG.NONCE,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                stkJwk: TEST_POP_VALUES.KID
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl).to.contain(TEST_CONFIG.validAuthority);
            expect(loginUrl).to.contain(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
            expect(loginUrl).to.contain(`${AADServerParamKeys.SCOPE}=${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIRECT_URI_LOCALHOST)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.RESPONSE_MODE}=${encodeURIComponent(ResponseMode.FORM_POST)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.STATE}=${encodeURIComponent(TEST_CONFIG.STATE)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.PROMPT}=${PromptValue.LOGIN}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.NONCE}=${encodeURIComponent(TEST_CONFIG.NONCE)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE}=${encodeURIComponent(TEST_CONFIG.TEST_CHALLENGE)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE_METHOD}=${encodeURIComponent(TEST_CONFIG.CODE_CHALLENGE_METHOD)}`);
            expect(loginUrl).to.contain(`${SSOTypes.LOGIN_HINT}=${encodeURIComponent(TEST_CONFIG.LOGIN_HINT)}`);
            expect(loginUrl).to.contain(`${SSOTypes.DOMAIN_HINT}=${encodeURIComponent(TEST_CONFIG.DOMAIN_HINT)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.STK_JWK}=${encodeURIComponent(TEST_POP_VALUES.DECODED_STK_JWK_THUMBPRINT)}`);
        });

        it("Prefers sid over loginHint if both provided and prompt=None", async () => {
            // Override with alternate authority openid_config
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                loginHint: TEST_CONFIG.LOGIN_HINT,
                prompt: PromptValue.NONE,
                sid: TEST_CONFIG.SID,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
                stkJwk: TEST_POP_VALUES.KID
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl).to.not.contain(`${SSOTypes.LOGIN_HINT}=`);
            expect(loginUrl).to.contain(`${SSOTypes.SID}=${encodeURIComponent(TEST_CONFIG.SID)}`);
        });

        it("Prefers loginHint over sid if both provided and prompt!=None", async () => {
            // Override with alternate authority openid_config
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                loginHint: TEST_CONFIG.LOGIN_HINT,
                prompt: PromptValue.LOGIN,
                sid: TEST_CONFIG.SID,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
                stkJwk: TEST_POP_VALUES.KID
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl).to.contain(`${SSOTypes.LOGIN_HINT}=${encodeURIComponent(TEST_CONFIG.LOGIN_HINT)}`);
            expect(loginUrl).to.not.contain(`${SSOTypes.SID}=`);
        });

        it("Ignores sid if prompt!=None", async () => {
            // Override with alternate authority openid_config
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                prompt: PromptValue.LOGIN,
                sid: TEST_CONFIG.SID,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
                stkJwk: TEST_POP_VALUES.KID
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl).to.not.contain(`${SSOTypes.LOGIN_HINT}=`);
            expect(loginUrl).to.not.contain(`${SSOTypes.SID}=`);
        });

        it("Prefers loginHint over Account if both provided and account does not have token claims", async () => {
            // Override with alternate authority openid_config
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                loginHint: TEST_CONFIG.LOGIN_HINT,
                account: TEST_ACCOUNT_INFO,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
                stkJwk: TEST_POP_VALUES.KID
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl).to.contain(`${SSOTypes.LOGIN_HINT}=${encodeURIComponent(TEST_CONFIG.LOGIN_HINT)}`);
            expect(loginUrl).to.not.contain(`${SSOTypes.LOGIN_HINT}=${encodeURIComponent(TEST_ACCOUNT_INFO.username)}`);
            expect(loginUrl).to.not.contain(`${SSOTypes.SID}=`);
        });

        it("Uses sid from account if not provided in request and prompt=None, overrides login_hint", async () => {
            // Override with alternate authority openid_config
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);
            const testAccount = TEST_ACCOUNT_INFO;
            const testTokenClaims: Required<Omit<TokenClaims, "home_oid"|"upn"|"cloud_instance_host_name"|"cnf"|"emails"|"iat"|"x5c_ca">> = {
                "ver": "2.0",
                "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": 1536361411,
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "nonce": "123523",
                "sid": "testSid"
            };
            testAccount.idTokenClaims = testTokenClaims;

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                account: testAccount,
                loginHint: TEST_CONFIG.LOGIN_HINT,
                prompt: PromptValue.NONE,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
                stkJwk: TEST_POP_VALUES.KID
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl).to.contain(`${SSOTypes.SID}=${encodeURIComponent(testTokenClaims.sid)}`);
            expect(loginUrl).to.not.contain(`${SSOTypes.LOGIN_HINT}=`);
        });

        it("Uses loginHint instead of sid from account prompt!=None", async () => {
            // Override with alternate authority openid_config
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);
            const testAccount = TEST_ACCOUNT_INFO;
            const testTokenClaims: Required<Omit<TokenClaims, "home_oid"|"upn"|"cloud_instance_host_name"|"cnf"|"emails"|"iat"|"x5c_ca">> = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                sid: "testSid"
            };
            testAccount.idTokenClaims = testTokenClaims;

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                account: testAccount,
                loginHint: TEST_CONFIG.LOGIN_HINT,
                prompt: PromptValue.LOGIN,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
                stkJwk: TEST_POP_VALUES.KID
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl).to.not.contain(`${SSOTypes.SID}=`);
            expect(loginUrl).to.contain(`${SSOTypes.LOGIN_HINT}=${encodeURIComponent(TEST_CONFIG.LOGIN_HINT)}`);
        });

        it("Uses login_hint instead of username if sid is not present in token claims for account or request", async () => {
            // Override with alternate authority openid_config
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);
            const testAccount = TEST_ACCOUNT_INFO;
            const testTokenClaims: Required<Omit<TokenClaims, "home_oid"|"upn"|"cloud_instance_host_name"|"cnf"|"emails"|"sid"|"iat"|"x5c_ca">> = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523"
            };
            testAccount.idTokenClaims = testTokenClaims;

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                account: testAccount,
                loginHint: TEST_CONFIG.LOGIN_HINT,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
                stkJwk: TEST_POP_VALUES.KID
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl).to.contain(`${SSOTypes.LOGIN_HINT}=${encodeURIComponent(TEST_CONFIG.LOGIN_HINT)}`);
            expect(loginUrl).to.not.contain(`${SSOTypes.SID}=`);
        });

        it("Sets login_hint to Account.username if login_hint and sid are not provided", async () => {
            // Override with alternate authority openid_config
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                account: TEST_ACCOUNT_INFO,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
                stkJwk: TEST_POP_VALUES.KID
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl).to.contain(`${SSOTypes.LOGIN_HINT}=${encodeURIComponent(TEST_ACCOUNT_INFO.username)}`);
            expect(loginUrl).to.not.contain(`${SSOTypes.SID}=`);
        });

        it("Ignores Account if prompt is select_account", async () => {
            // Override with alternate authority openid_config
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                account: TEST_ACCOUNT_INFO,
                prompt: "select_account",
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
                stkJwk: TEST_POP_VALUES.KID
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl).to.not.contain(`${SSOTypes.LOGIN_HINT}=`);
            expect(loginUrl).to.not.contain(`${SSOTypes.SID}=`);
        });

        it("Ignores loginHint if prompt is select_account", async () => {
            // Override with alternate authority openid_config
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                loginHint: "testaccount@microsoft.com",
                prompt: "select_account",
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
                stkJwk: TEST_POP_VALUES.KID
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl).to.not.contain(`${SSOTypes.LOGIN_HINT}=`);
            expect(loginUrl).to.not.contain(`${SSOTypes.SID}=`);
        });

        it("Ignores sid if prompt is select_account", async () => {
            // Override with alternate authority openid_config
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                sid: "testsid",
                prompt: "select_account",
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
                stkJwk: TEST_POP_VALUES.KID
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl).to.not.contain(`${SSOTypes.LOGIN_HINT}=`);
            expect(loginUrl).to.not.contain(`${SSOTypes.SID}=`);
        });

        it("Creates a login URL with scopes from given token request", async () => {
            // Override with alternate authority openid_config
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const testScope1 = "testscope1";
            const testScope2 = "testscope2";
            const loginRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [testScope1, testScope2],
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
                stkJwk: TEST_POP_VALUES.KID
            };

            const loginUrl = await client.getAuthCodeUrl(loginRequest);
            expect(loginUrl).to.contain(`${AADServerParamKeys.SCOPE}=${encodeURIComponent(`${testScope1} ${testScope2}`)}`);
        });

        it("Does not append an extra '?' when the authorization endpoint already contains a query string", async () => {
            // Override with alternate authority openid_config
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves({
                "token_endpoint": "https://login.windows.net/common/oauth2/v2.0/token?param1=value1",
                "issuer": "https://login.windows.net/{tenantid}/v2.0",
                "userinfo_endpoint": "https://graph.microsoft.com/oidc/userinfo",
                "authorization_endpoint": "https://login.windows.net/common/oauth2/v2.0/authorize?param1=value1",
                "end_session_endpoint": "https://login.windows.net/common/oauth2/v2.0/logout?param1=value1",
            });

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.QUERY,
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl.split("?").length).to.equal(2);
            expect(loginUrl).to.contain(`param1=value1`);
            expect(loginUrl).to.contain(ALTERNATE_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
            expect(loginUrl).to.contain(`${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIRECT_URI_LOCALHOST)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.RESPONSE_MODE}=${encodeURIComponent(ResponseMode.QUERY)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE}=${encodeURIComponent(TEST_CONFIG.TEST_CHALLENGE)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE_METHOD}=${encodeURIComponent(Constants.S256_CODE_CHALLENGE_METHOD)}`);
        });
    });

    describe("handleFragmentResponse()", () => {

        it("returns valid server code response", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError("configuration crypto interface not initialized correctly.");
            }
            const testSuccessHash = `#code=thisIsATestCode&client_info=${TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO}&state=${encodeURIComponent(TEST_STATE_VALUES.ENCODED_LIB_STATE)}`;
            config.cryptoInterface.base64Decode = (input: string): string => {
                switch (input) {
                    case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                        return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                    case TEST_POP_VALUES.ENCODED_REQ_CNF:
                        return TEST_POP_VALUES.DECODED_REQ_CNF;
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
                    case TEST_POP_VALUES.DECODED_REQ_CNF:
                        return TEST_POP_VALUES.ENCODED_REQ_CNF;
                    default:
                        return input;
                }
            };
            const client: AuthorizationCodeClient = new AuthorizationCodeClient(config);
            const authCodePayload = client.handleFragmentResponse(testSuccessHash, TEST_STATE_VALUES.ENCODED_LIB_STATE);
            expect(authCodePayload.code).to.be.eq("thisIsATestCode");
            expect(authCodePayload.state).to.be.eq(TEST_STATE_VALUES.ENCODED_LIB_STATE);
        });

        it("returns valid server code response when state is encoded twice", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError("configuration crypto interface not initialized correctly.");
            }
            const testSuccessHash = `#code=thisIsATestCode&client_info=${TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO}&state=${encodeURIComponent(encodeURIComponent(TEST_STATE_VALUES.ENCODED_LIB_STATE))}`;
            config.cryptoInterface.base64Decode = (input: string): string => {
                switch (input) {
                    case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                        return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                    case TEST_POP_VALUES.ENCODED_REQ_CNF:
                        return TEST_POP_VALUES.DECODED_REQ_CNF;
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
                    case TEST_POP_VALUES.DECODED_REQ_CNF:
                        return TEST_POP_VALUES.ENCODED_REQ_CNF;
                    default:
                        return input;
                }
            };
            const client: AuthorizationCodeClient = new AuthorizationCodeClient(config);
            const authCodePayload = client.handleFragmentResponse(testSuccessHash, TEST_STATE_VALUES.ENCODED_LIB_STATE);
            expect(authCodePayload.code).to.be.eq("thisIsATestCode");
            expect(authCodePayload.state).to.be.eq(TEST_STATE_VALUES.ENCODED_LIB_STATE);
        });

        it("throws server error when error is in hash", async () => {
            const testErrorHash = `#error=error_code&error_description=msal+error+description&state=${encodeURIComponent(TEST_STATE_VALUES.ENCODED_LIB_STATE)}`;
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client: AuthorizationCodeClient = new AuthorizationCodeClient(config);
            const cacheStorageMock = config.storageInterface as MockStorageClass;
            expect(() => client.handleFragmentResponse(testErrorHash, TEST_STATE_VALUES.ENCODED_LIB_STATE)).to.throw("msal error description");
            expect(cacheStorageMock.getKeys().length).to.be.eq(1);
            expect(cacheStorageMock.getAuthorityMetadataKeys().length).to.be.eq(1)

            expect(() => client.handleFragmentResponse(testErrorHash, TEST_STATE_VALUES.ENCODED_LIB_STATE)).to.throw(ServerError);
            expect(cacheStorageMock.getKeys().length).to.be.eq(1);
            expect(cacheStorageMock.getAuthorityMetadataKeys().length).to.be.eq(1)
        });
    });

    describe("Acquire a token", () => {

        it("Throws error if code response does not contain authorization code", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            if (!config.storageInterface) {
                throw TestError.createTestSetupError("configuration storageInterface not initialized correctly.");
            }
            const client = new AuthorizationCodeClient(config);

            const codeRequest: CommonAuthorizationCodeRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["scope"],
                code: "",
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                stkJwk: TEST_POP_VALUES.KID
            };
            await expect(client.acquireToken(codeRequest, {
                code: ""
            })).to.be.rejectedWith(ClientAuthErrorMessage.tokenRequestCannotBeMade.desc);
            expect(config.storageInterface.getKeys().length).to.be.eq(1);
            expect(config.storageInterface.getAuthorityMetadataKeys().length).to.be.eq(1);
        });

        it("Does not add headers that do not qualify for a simple request", async () => {
            // For more information about this test see: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
            let stubCalled = false;
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            sinon.stub(AuthorizationCodeClient.prototype, <any>"executePostToTokenEndpoint").callsFake((tokenEndpoint: string, queryString: string, headers: Record<string, string>) => {
                const headerNames = Object.keys(headers);
                headerNames.forEach((name) => {
                    expect(CORS_SIMPLE_REQUEST_HEADERS).contains(name.toLowerCase());
                });

                stubCalled = true;
                return AUTHENTICATION_RESULT;
            });

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError("configuration cryptoInterface not initialized correctly.");
            }

            // Set up required objects and mocked return values
            const testState = `eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9${Constants.RESOURCE_DELIM}userState`;
            const decodedLibState = "{ \"id\": \"testid\", \"ts\": 1592846482 }";
            config.cryptoInterface.base64Decode = (input: string): string => {
                switch (input) {
                    case TEST_POP_VALUES.ENCODED_REQ_CNF:
                        return TEST_POP_VALUES.DECODED_REQ_CNF;
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
                    case TEST_POP_VALUES.DECODED_REQ_CNF:
                        return TEST_POP_VALUES.ENCODED_REQ_CNF;
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
            sinon.stub(IdToken, "extractTokenClaims").returns(idTokenClaims);
            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                stkJwk: TEST_POP_VALUES.KID
            };

            await client.acquireToken(authCodeRequest, {
                code: authCodeRequest.code,
                nonce: idTokenClaims.nonce,
                state: testState
            });

            expect(stubCalled).to.be.true;
        });

        it("Acquires a token successfully", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            sinon.stub(AuthorizationCodeClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);
            const createTokenRequestBodySpy = sinon.spy(AuthorizationCodeClient.prototype, <any>"createTokenRequestBody");

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError("configuration cryptoInterface not initialized correctly.");
            }

            // Set up required objects and mocked return values
            const testState = `eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9${Constants.RESOURCE_DELIM}userState`;
            const decodedLibState = "{ \"id\": \"testid\", \"ts\": 1592846482 }";
            config.cryptoInterface.base64Decode = (input: string): string => {
                switch (input) {
                    case TEST_POP_VALUES.ENCODED_REQ_CNF:
                        return TEST_POP_VALUES.DECODED_REQ_CNF;
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
                    case TEST_POP_VALUES.DECODED_REQ_CNF:
                        return TEST_POP_VALUES.ENCODED_REQ_CNF;
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
            sinon.stub(IdToken, "extractTokenClaims").returns(idTokenClaims);
            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                stkJwk: TEST_POP_VALUES.KID
            };

            const authenticationResult = await client.acquireToken(authCodeRequest, {
                code: authCodeRequest.code,
                nonce: idTokenClaims.nonce,
                state: testState
            });
            if (!authenticationResult.expiresOn) {
                throw TestError.createTestSetupError("mockedAccountInfo does not have a value");
            }

            expect(authenticationResult.accessToken).to.deep.eq(AUTHENTICATION_RESULT.body.access_token);
            expect((Date.now() + (AUTHENTICATION_RESULT.body.expires_in * 1000)) >= authenticationResult.expiresOn.getMilliseconds()).to.be.true;
            expect(createTokenRequestBodySpy.calledWith(authCodeRequest)).to.be.ok;
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.SCOPE}=${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIRECT_URI_LOCALHOST)}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.CODE}=${TEST_TOKENS.AUTHORIZATION_CODE}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.GRANT_TYPE}=${Constants.CODE_GRANT_TYPE}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.CODE_VERIFIER}=${TEST_CONFIG.TEST_VERIFIER}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.STK_JWK}=${TEST_POP_VALUES.ENCODED_STK_JWK_THUMBPRINT}`);
        });

        it("Adds tokenQueryParameters to the /token request", (done) => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            sinon.stub(AuthorizationCodeClient.prototype, <any>"executePostToTokenEndpoint").callsFake((url) => {
                expect(url).to.contain("/token?testParam=testValue")
                done();
            });

            ClientTestUtils.createTestClientConfiguration().then(config => {
                const client = new AuthorizationCodeClient(config);
                const authCodeRequest: CommonAuthorizationCodeRequest = {
                    authority: Constants.DEFAULT_AUTHORITY,
                    scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                    redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                    code: TEST_TOKENS.AUTHORIZATION_CODE,
                    codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                    claims: TEST_CONFIG.CLAIMS,
                    correlationId: RANDOM_TEST_GUID,
                    authenticationScheme: AuthenticationScheme.BEARER,
                    stkJwk: TEST_POP_VALUES.KID,
                    tokenQueryParameters: {
                        testParam: "testValue"
                    }
                };
    
                client.acquireToken(authCodeRequest).catch(e => {
                    // Catch errors thrown after the function call this test is testing    
                });
            });
        });

        it("Sends the required parameters when a pop token is requested", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            sinon.stub(AuthorizationCodeClient.prototype, <any>"executePostToTokenEndpoint").resolves(POP_AUTHENTICATION_RESULT);
            const createTokenRequestBodySpy = sinon.spy(AuthorizationCodeClient.prototype, <any>"createTokenRequestBody");

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError("configuration cryptoInterface not initialized correctly.");
            }

            // Set up required objects and mocked return values
            const testState = `eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9${Constants.RESOURCE_DELIM}userState`;
            const decodedLibState = "{ \"id\": \"testid\", \"ts\": 1592846482 }";
            
            config.cryptoInterface.base64Decode = (input: string): string => {
                switch (input) {
                    case TEST_POP_VALUES.ENCODED_REQ_CNF:
                        return TEST_POP_VALUES.DECODED_REQ_CNF;
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
                    case TEST_POP_VALUES.DECODED_REQ_CNF:
                        return TEST_POP_VALUES.ENCODED_REQ_CNF;
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
            const signedJwt = "signedJwt";
            config.cryptoInterface.signJwt = async (payload: SignedHttpRequest, kid: string): Promise<string> => {
                expect(payload.at).to.be.eq(POP_AUTHENTICATION_RESULT.body.access_token);
                return signedJwt;
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
            sinon.stub(AuthToken, "extractTokenClaims").callsFake((encodedToken: string, crypto: ICrypto): TokenClaims => {
                switch (encodedToken) {
                    case POP_AUTHENTICATION_RESULT.body.id_token:
                        return idTokenClaims as TokenClaims;
                    case POP_AUTHENTICATION_RESULT.body.access_token:
                        return {
                            cnf: {
                                kid: TEST_POP_VALUES.KID
                            }
                        };
                    default:
                        return {};
                }
            });
            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authenticationScheme: AuthenticationScheme.POP,
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                resourceRequestMethod: "POST",
                resourceRequestUri: TEST_URIS.TEST_RESOURCE_ENDPT_WITH_PARAMS,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                stkJwk: TEST_POP_VALUES.KID
            };

            const authenticationResult = await client.acquireToken(authCodeRequest, {
                code: authCodeRequest.code,
                nonce: idTokenClaims.nonce,
                state: testState
            });

            if (!authenticationResult.expiresOn) {
                throw TestError.createTestSetupError("configuration cryptoInterface not initialized correctly.");
            }

            expect(authenticationResult.accessToken).to.eq(signedJwt);
            expect((Date.now() + (POP_AUTHENTICATION_RESULT.body.expires_in * 1000)) >= authenticationResult.expiresOn.getMilliseconds()).to.be.true;
            expect(createTokenRequestBodySpy.calledWith(authCodeRequest)).to.be.ok;
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.SCOPE}=${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIRECT_URI_LOCALHOST)}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.CODE}=${TEST_TOKENS.AUTHORIZATION_CODE}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.GRANT_TYPE}=${Constants.CODE_GRANT_TYPE}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.CODE_VERIFIER}=${TEST_CONFIG.TEST_VERIFIER}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.TOKEN_TYPE}=${AuthenticationScheme.POP}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.REQ_CNF}=${encodeURIComponent(TEST_POP_VALUES.ENCODED_REQ_CNF)}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.STK_JWK}=${TEST_POP_VALUES.ENCODED_STK_JWK_THUMBPRINT}`);
        });

        it("properly handles expiration timestamps as strings", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            sinon.stub(AuthorizationCodeClient.prototype, <any>"executePostToTokenEndpoint").resolves({
                ...AUTHENTICATION_RESULT,
                body: {
                    ...AUTHENTICATION_RESULT.body,
                    expires_in: "3599",
                    ext_expires_in: "3599"
                }
            });
            const createTokenRequestBodySpy = sinon.spy(AuthorizationCodeClient.prototype, <any>"createTokenRequestBody");

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError("configuration cryptoInterface not initialized correctly.");
            }
            // Set up required objects and mocked return values
            const testState = `eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9${Constants.RESOURCE_DELIM}userState`;
            const decodedLibState = "{ \"id\": \"testid\", \"ts\": 1592846482 }";
            config.cryptoInterface.base64Decode = (input: string): string => {
                switch (input) {
                    case TEST_POP_VALUES.ENCODED_REQ_CNF:
                        return TEST_POP_VALUES.DECODED_REQ_CNF;
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
                    case TEST_POP_VALUES.DECODED_REQ_CNF:
                        return TEST_POP_VALUES.ENCODED_REQ_CNF;
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
            sinon.stub(IdToken, "extractTokenClaims").returns(idTokenClaims);
            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                stkJwk: TEST_POP_VALUES.KID
            };

            const authenticationResult = await client.acquireToken(authCodeRequest, {
                code: authCodeRequest.code,
                nonce: idTokenClaims.nonce,
                state: testState
            });

            expect(authenticationResult.expiresOn?.toString()).to.not.equal("Invalid Date");
        });

        it("Saves refresh_in correctly to the cache", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const authResult = {
                ...AUTHENTICATION_RESULT,
                body: {
                    ...AUTHENTICATION_RESULT.body,
                    "refresh_in": 1000
                }
            };
            sinon.stub(AuthorizationCodeClient.prototype, <any>"executePostToTokenEndpoint").resolves(authResult);
            const createTokenRequestBodySpy = sinon.spy(AuthorizationCodeClient.prototype, <any>"createTokenRequestBody");

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError("configuration cryptoInterface not initialized correctly.");
            }
            // Set up required objects and mocked return values
            const testState = `eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9${Constants.RESOURCE_DELIM}userState`;
            const decodedLibState = "{ \"id\": \"testid\", \"ts\": 1592846482 }";
            config.cryptoInterface.base64Decode = (input: string): string => {
                switch (input) {
                    case TEST_POP_VALUES.ENCODED_REQ_CNF:
                        return TEST_POP_VALUES.DECODED_REQ_CNF;
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
                    case TEST_POP_VALUES.DECODED_REQ_CNF:
                        return TEST_POP_VALUES.ENCODED_REQ_CNF;
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
            sinon.stub(IdToken, "extractTokenClaims").returns(idTokenClaims);
            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                stkJwk: TEST_POP_VALUES.KID
            };

            const authenticationResult = await client.acquireToken(authCodeRequest, {
                code: authCodeRequest.code,
                nonce: idTokenClaims.nonce,
                state: testState
            });
            const accessTokenKey = config.storageInterface?.getKeys().find(value => value.indexOf("accesstoken") >= 0);
            const accessTokenCacheItem = accessTokenKey ? config.storageInterface?.getAccessTokenCredential(accessTokenKey) : null;

            expect(authenticationResult.accessToken).to.deep.eq(AUTHENTICATION_RESULT.body.access_token);
            expect(authenticationResult.expiresOn && (Date.now() + (AUTHENTICATION_RESULT.body.expires_in * 1000)) >= authenticationResult.expiresOn.getMilliseconds()).to.be.true;
            expect(createTokenRequestBodySpy.calledWith(authCodeRequest)).to.be.ok;
            expect(accessTokenCacheItem && accessTokenCacheItem.refreshOn && accessTokenCacheItem.refreshOn === accessTokenCacheItem.cachedAt + authResult.body.refresh_in);
        });
    });

    describe("getLogoutUri()", () => {

        it("Returns a uri and clears the cache", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                environment: "login.windows.net",
                tenantId: "testTenantId",
                username: "test@contoso.com",
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_LOCAL_ACCOUNT_ID
            };

            const removeAccountSpy = sinon.stub(MockStorageClass.prototype, "clear").returns();
            const logoutUri = client.getLogoutUri({account: null, correlationId: RANDOM_TEST_GUID});

            expect(removeAccountSpy.calledOnce).to.be.true;
            expect(logoutUri).to.be.eq(`${DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace("{tenant}", "common")}?${AADServerParamKeys.CLIENT_REQUEST_ID}=${RANDOM_TEST_GUID}`);
        });

        it("Returns a uri and clears the cache of relevant account info", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                environment: "login.windows.net",
                tenantId: "testTenantId",
                username: "test@contoso.com",
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_LOCAL_ACCOUNT_ID
            };

            const removeAccountSpy = sinon.stub(CacheManager.prototype, "removeAccount").returns(true);
            const logoutUri = client.getLogoutUri({account: testAccount, correlationId: RANDOM_TEST_GUID});

            expect(removeAccountSpy.calledWith(AccountEntity.generateAccountCacheKey(testAccount))).to.be.true;
            expect(logoutUri).to.be.eq(`${DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace("{tenant}", "common")}?${AADServerParamKeys.CLIENT_REQUEST_ID}=${RANDOM_TEST_GUID}`);
        });

        it("Returns a uri with given postLogoutUri and correlationId", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                environment: "login.windows.net",
                tenantId: "testTenantId",
                username: "test@contoso.com",
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_LOCAL_ACCOUNT_ID
            };

            const removeAccountSpy = sinon.stub(CacheManager.prototype, "removeAccount").returns(true);
            const logoutUri = client.getLogoutUri({
                account: testAccount,
                correlationId: RANDOM_TEST_GUID,
                postLogoutRedirectUri: TEST_URIS.TEST_LOGOUT_URI,
                idTokenHint: "id_token_hint"
            });

            expect(removeAccountSpy.calledWith(AccountEntity.generateAccountCacheKey(testAccount))).to.be.true;
            const testLogoutUriWithParams = `${DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace("{tenant}", "common")}?${AADServerParamKeys.POST_LOGOUT_URI}=${encodeURIComponent(TEST_URIS.TEST_LOGOUT_URI)}&${AADServerParamKeys.CLIENT_REQUEST_ID}=${encodeURIComponent(RANDOM_TEST_GUID)}&${AADServerParamKeys.ID_TOKEN_HINT}=id_token_hint`;
            expect(logoutUri).to.be.eq(testLogoutUriWithParams);
        });
    });
});
