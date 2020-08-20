import { expect } from "chai";
import {Constants, SSOTypes, PromptValue, AADServerParamKeys, ResponseMode, GrantType, AuthenticationScheme} from "../../src/utils/Constants";
import {
    TEST_CONFIG,
    TEST_URIS,
    TEST_TOKENS,
    DEVICE_CODE_RESPONSE,
    TEST_POP_VALUES
} from "../utils/StringConstants";
import { RequestParameterBuilder } from "../../src/request/RequestParameterBuilder";
import { ScopeSet } from "../../src/request/ScopeSet";
import { ClientConfigurationError } from "../../src";

describe("RequestParameterBuilder unit tests", () => {

    it("constructor", () => {
        const requestParameterBuilder = new RequestParameterBuilder();
        expect(requestParameterBuilder).to.be.instanceOf(RequestParameterBuilder);
    });

    it("Build query string from RequestParameterBuilder object", () => {
        const requestParameterBuilder = new RequestParameterBuilder();
        requestParameterBuilder.addResponseTypeCode();
        requestParameterBuilder.addResponseMode(ResponseMode.FORM_POST);
        requestParameterBuilder.addScopes(new ScopeSet(TEST_CONFIG.DEFAULT_SCOPES));
        requestParameterBuilder.addClientId(TEST_CONFIG.MSAL_CLIENT_ID);
        requestParameterBuilder.addRedirectUri(TEST_URIS.TEST_REDIRECT_URI_LOCALHOST);
        requestParameterBuilder.addDomainHint(TEST_CONFIG.DOMAIN_HINT);
        requestParameterBuilder.addLoginHint(TEST_CONFIG.LOGIN_HINT);
        requestParameterBuilder.addClaims(TEST_CONFIG.CLAIMS);
        requestParameterBuilder.addCorrelationId(TEST_CONFIG.CORRELATION_ID);
        requestParameterBuilder.addPrompt(PromptValue.SELECT_ACCOUNT);
        requestParameterBuilder.addState(TEST_CONFIG.STATE);
        requestParameterBuilder.addNonce(TEST_CONFIG.NONCE);
        requestParameterBuilder.addCodeChallengeParams(TEST_CONFIG.TEST_CHALLENGE, TEST_CONFIG.CODE_CHALLENGE_METHOD);
        requestParameterBuilder.addAuthorizationCode(TEST_TOKENS.AUTHORIZATION_CODE);
        requestParameterBuilder.addDeviceCode(DEVICE_CODE_RESPONSE.deviceCode);
        requestParameterBuilder.addCodeVerifier(TEST_CONFIG.TEST_VERIFIER);
        requestParameterBuilder.addGrantType(GrantType.DEVICE_CODE_GRANT);
        requestParameterBuilder.addSid(TEST_CONFIG.SID);

        const requestQueryString = requestParameterBuilder.createQueryString();
        expect(requestQueryString).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
        expect(requestQueryString).to.contain(`${AADServerParamKeys.RESPONSE_MODE}=${encodeURIComponent(ResponseMode.FORM_POST)}`);
        expect(requestQueryString).to.contain(`${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
        expect(requestQueryString).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
        expect(requestQueryString).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIRECT_URI_LOCALHOST)}`);
        expect(requestQueryString).to.contain(`${SSOTypes.DOMAIN_HINT}=${encodeURIComponent(TEST_CONFIG.DOMAIN_HINT)}`);
        expect(requestQueryString).to.contain(`${SSOTypes.LOGIN_HINT}=${encodeURIComponent(TEST_CONFIG.LOGIN_HINT)}`);
        expect(requestQueryString).to.contain(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`);
        expect(requestQueryString).to.contain(`${AADServerParamKeys.CLIENT_REQUEST_ID}=${encodeURIComponent(TEST_CONFIG.CORRELATION_ID)}`);
        expect(requestQueryString).to.contain(`${AADServerParamKeys.PROMPT}=${PromptValue.SELECT_ACCOUNT}`);
        expect(requestQueryString).to.contain(`${AADServerParamKeys.STATE}=${encodeURIComponent(TEST_CONFIG.STATE)}`);
        expect(requestQueryString).to.contain(`${AADServerParamKeys.NONCE}=${encodeURIComponent(TEST_CONFIG.NONCE)}`);
        expect(requestQueryString).to.contain(`${AADServerParamKeys.CODE_CHALLENGE}=${encodeURIComponent(TEST_CONFIG.TEST_CHALLENGE)}`);
        expect(requestQueryString).to.contain(`${AADServerParamKeys.CODE_CHALLENGE_METHOD}=${encodeURIComponent(TEST_CONFIG.CODE_CHALLENGE_METHOD)}`);
        expect(requestQueryString).to.contain(`${AADServerParamKeys.CODE}=${encodeURIComponent(TEST_TOKENS.AUTHORIZATION_CODE)}`);
        expect(requestQueryString).to.contain(`${AADServerParamKeys.DEVICE_CODE}=${encodeURIComponent(DEVICE_CODE_RESPONSE.deviceCode)}`);
        expect(requestQueryString).to.contain(`${AADServerParamKeys.CODE_VERIFIER}=${encodeURIComponent(TEST_CONFIG.TEST_VERIFIER)}`);
        expect(requestQueryString).to.contain(`${SSOTypes.SID}=${encodeURIComponent(TEST_CONFIG.SID)}`);
    });

    it("Adds token type and req_cnf correctly for proof-of-possession tokens", () => {
        const requestParameterBuilder = new RequestParameterBuilder();
        requestParameterBuilder.addPopToken(TEST_POP_VALUES.ENCODED_REQ_CNF);
        const requestQueryString = requestParameterBuilder.createQueryString();
        expect(requestQueryString).to.contain(`${AADServerParamKeys.TOKEN_TYPE}=${AuthenticationScheme.POP}`);
        expect(requestQueryString).to.contain(`${AADServerParamKeys.REQ_CNF}=${encodeURIComponent(TEST_POP_VALUES.ENCODED_REQ_CNF)}`);
    });

    it("Does not add token type or req_cnf if req_cnf is undefined or empty", () => {
        const requestParameterBuilder = new RequestParameterBuilder();
        requestParameterBuilder.addPopToken("");
        const requestQueryString = requestParameterBuilder.createQueryString();
        expect(requestQueryString).to.be.empty;
        
        const requestParameterBuilder2 = new RequestParameterBuilder();
        requestParameterBuilder.addPopToken(undefined);
        const requestQueryString2 = requestParameterBuilder2.createQueryString();
        expect(requestQueryString2).to.be.empty;
    });

    it("addCodeChallengeParams throws invalidCodeChallengeParamsError if codeChallengeMethod empty", () => {
        const requestParameterBuilder = new RequestParameterBuilder();
        expect(() => requestParameterBuilder.addCodeChallengeParams(TEST_CONFIG.TEST_CHALLENGE, "")).to.throw(ClientConfigurationError.createInvalidCodeChallengeParamsError().errorMessage);
    });

    it("addCodeChallengeParams throws invalidCodeChallengeParamsError if codeChallenge empty", () => {
        const requestParameterBuilder = new RequestParameterBuilder();
        expect(() => requestParameterBuilder.addCodeChallengeParams("", AADServerParamKeys.CODE_CHALLENGE_METHOD)).to.throw(ClientConfigurationError.createInvalidCodeChallengeParamsError().errorMessage);
    });
});
