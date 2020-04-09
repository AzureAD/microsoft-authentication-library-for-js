import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import {
    Authority,
    AuthorizationCodeClient,
    AuthorizationCodeRequest,
    AuthorizationCodeUrlRequest,
    Configuration,
    Constants
} from "../../src";
import {
    ALTERNATE_OPENID_CONFIG_RESPONSE,
    AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
    TEST_TOKENS,
    TEST_URIS
} from "../utils/StringConstants";
import {BaseClient} from "../../src/client/BaseClient";
import {AADServerParamKeys, PromptValue, ResponseMode, SSOTypes} from "../../src/utils/Constants";
import { ClientTestUtils } from "./ClientTestUtils";
import { B2CTrustedHostList } from "../../src/authority/B2cAuthority";

const expect = chai.expect;
chai.use(chaiAsPromised);

describe("AuthorizationCodeClient unit tests", () => {

    let config: Configuration;

    beforeEach(() => {
        config = ClientTestUtils.createTestClientConfiguration();
    });

    afterEach(() => {
        config = null;
        sinon.restore();
        while (B2CTrustedHostList.length) {
            B2CTrustedHostList.pop();
        }
    });

    describe("Constructor", () => {

        it("creates a AuthorizationCodeClient", () => {
            const client = new AuthorizationCodeClient(config);
            expect(client).to.be.not.null;
            expect(client instanceof AuthorizationCodeClient).to.be.true;
            expect(client instanceof BaseClient).to.be.true;
        });
    });

    describe("Authorization url creation", () => {

        it("Creates an authorization url with default parameters", async () => {

            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            let client = new AuthorizationCodeClient(config);

            const authCodeUrlRequest: AuthorizationCodeUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl).to.contain(Constants.DEFAULT_AUTHORITY);
            expect(loginUrl).to.contain(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
            expect(loginUrl).to.contain(`${AADServerParamKeys.SCOPE}=${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIRECT_URI_LOCALHOST)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.RESPONSE_MODE}=${encodeURIComponent(Constants.QUERY_RESPONSE_MODE)}`)
        });

        it("Creates an authorization url passing in a default scope", async () => {

            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            let client = new AuthorizationCodeClient(config);

            const authCodeUrlRequest: AuthorizationCodeUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [Constants.OPENID_SCOPE]
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl).to.contain(Constants.DEFAULT_AUTHORITY);
            expect(loginUrl).to.contain(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
            expect(loginUrl).to.contain(`${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIRECT_URI_LOCALHOST)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.RESPONSE_MODE}=${encodeURIComponent(Constants.QUERY_RESPONSE_MODE)}`)
        });

        it("Creates an authorization url passing in optional parameters", async () => {

            // Override with alternate authority openid_config
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE);
            let client = new AuthorizationCodeClient(config);

            const authCodeUrlRequest: AuthorizationCodeUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                authority: TEST_CONFIG.alternateValidAuthority,
                responseMode: ResponseMode.FORM_POST,
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: TEST_CONFIG.CODE_CHALLENGE_METHOD,
                state: TEST_CONFIG.STATE,
                prompt: PromptValue.SELECT_ACCOUNT,
                loginHint: TEST_CONFIG.LOGIN_HINT,
                domainHint: TEST_CONFIG.DOMAIN_HINT,
                claims: TEST_CONFIG.CLAIMS,
                nonce: TEST_CONFIG.NONCE,
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl).to.contain(TEST_CONFIG.alternateValidAuthority);
            expect(loginUrl).to.contain(ALTERNATE_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
            expect(loginUrl).to.contain(`${AADServerParamKeys.SCOPE}=${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIRECT_URI_LOCALHOST)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.RESPONSE_MODE}=${encodeURIComponent(ResponseMode.FORM_POST)}`)
            expect(loginUrl).to.contain(`${AADServerParamKeys.STATE}=${encodeURIComponent(TEST_CONFIG.STATE)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.NONCE}=${encodeURIComponent(TEST_CONFIG.NONCE)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE}=${encodeURIComponent(TEST_CONFIG.TEST_CHALLENGE)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE_METHOD}=${encodeURIComponent(TEST_CONFIG.CODE_CHALLENGE_METHOD)}`);
            expect(loginUrl).to.contain(`${SSOTypes.LOGIN_HINT}=${encodeURIComponent(TEST_CONFIG.LOGIN_HINT)}`);
            expect(loginUrl).to.contain(`${SSOTypes.DOMAIN_HINT}=${encodeURIComponent(TEST_CONFIG.DOMAIN_HINT)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`);
        });
    });

    describe("Acquire a token", () => {

        it("Acquires a token successfully", async () => {

            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            sinon.stub(AuthorizationCodeClient.prototype, "executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);
            const createTokenRequestBodySpy = sinon.spy(AuthorizationCodeClient.prototype, "createTokenRequestBody");

            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: AuthorizationCodeRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER
            };

            const authenticationResult = await client.acquireToken(authCodeRequest);

            expect(JSON.parse(authenticationResult)).to.deep.eq(AUTHENTICATION_RESULT.body);
            expect(createTokenRequestBodySpy.calledWith(authCodeRequest)).to.be.ok;

            console.log(createTokenRequestBodySpy.returnValues);

            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.SCOPE}=${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIRECT_URI_LOCALHOST)}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CODE}=${TEST_TOKENS.AUTHORIZATION_CODE}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.GRANT_TYPE}=${Constants.CODE_GRANT_TYPE}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CODE_VERIFIER}=${TEST_CONFIG.TEST_VERIFIER}`);
        });
    });
});
