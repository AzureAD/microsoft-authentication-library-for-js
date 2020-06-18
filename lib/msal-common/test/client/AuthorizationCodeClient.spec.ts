import { expect } from "chai";
import sinon from "sinon";
import {
    Authority,
    AuthorizationCodeClient,
    AuthorizationCodeRequest,
    AuthorizationUrlRequest,
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
import { ClientConfiguration } from "../../src/config/ClientConfiguration";
import { BaseClient } from "../../src/client/BaseClient";
import { AADServerParamKeys, PromptValue, ResponseMode, SSOTypes } from "../../src/utils/Constants";
import { ClientTestUtils } from "./ClientTestUtils";
import { B2cAuthority } from "../../src/authority/B2cAuthority";

describe("AuthorizationCodeClient unit tests", () => {

    afterEach(() => {
        let config = null;
        sinon.restore();
        while (B2cAuthority.B2CTrustedHostList.length) {
            B2cAuthority.B2CTrustedHostList.pop();
        }
    });

    describe("Constructor", () => {

        it("creates a AuthorizationCodeClient", async () => {
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

        xit("Acquires a token successfully", async () => {

            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            sinon.stub(AuthorizationCodeClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);
            const createTokenRequestBodySpy = sinon.spy(AuthorizationCodeClient.prototype, <any>"createTokenRequestBody");

            const config: ClientConfiguration = await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: AuthorizationCodeRequest = {
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER
            };

            const authenticationResult = await client.acquireToken(authCodeRequest);

            expect(authenticationResult.accessToken).to.deep.eq(AUTHENTICATION_RESULT.body.access_token);
            expect(createTokenRequestBodySpy.calledWith(authCodeRequest)).to.be.ok;

            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.SCOPE}=${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIRECT_URI_LOCALHOST)}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CODE}=${TEST_TOKENS.AUTHORIZATION_CODE}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.GRANT_TYPE}=${Constants.CODE_GRANT_TYPE}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CODE_VERIFIER}=${TEST_CONFIG.TEST_VERIFIER}`);
        });
    });
});
