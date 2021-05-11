import { expect } from "chai";
import {Constants, SSOTypes, PromptValue, AADServerParamKeys, ResponseMode, GrantType, AuthenticationScheme} from "../../src/utils/Constants";
import {
    TEST_CONFIG,
    TEST_URIS,
    TEST_TOKENS,
    DEVICE_CODE_RESPONSE,
    TEST_POP_VALUES
} from "../test_kit/StringConstants";
import { RequestParameterBuilder } from "../../src/request/RequestParameterBuilder";
import { ScopeSet } from "../../src/request/ScopeSet";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src";
import sinon from "sinon";

describe("RequestParameterBuilder unit tests", () => {

    it("constructor", () => {
        const requestParameterBuilder = new RequestParameterBuilder();
        expect(requestParameterBuilder).to.be.instanceOf(RequestParameterBuilder);
    });

    it("Build query string from RequestParameterBuilder object", () => {
        const requestParameterBuilder = new RequestParameterBuilder();
        requestParameterBuilder.addResponseTypeCode();
        requestParameterBuilder.addResponseMode(ResponseMode.FORM_POST);
        requestParameterBuilder.addScopes(TEST_CONFIG.DEFAULT_SCOPES);
        requestParameterBuilder.addClientId(TEST_CONFIG.MSAL_CLIENT_ID);
        requestParameterBuilder.addRedirectUri(TEST_URIS.TEST_REDIRECT_URI_LOCALHOST);
        requestParameterBuilder.addDomainHint(TEST_CONFIG.DOMAIN_HINT);
        requestParameterBuilder.addLoginHint(TEST_CONFIG.LOGIN_HINT);
        requestParameterBuilder.addClaims(TEST_CONFIG.CLAIMS, []);
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

    it("addScopes appends oidc scopes by default", () => {
        let requestParameterBuilder = new RequestParameterBuilder();
        requestParameterBuilder.addScopes(["testScope"]);
        let requestQueryString = requestParameterBuilder.createQueryString();
        expect(requestQueryString).to.contain(`${AADServerParamKeys.SCOPE}=testScope%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);

        requestParameterBuilder = new RequestParameterBuilder();
        requestParameterBuilder.addScopes([]);
        requestQueryString = requestParameterBuilder.createQueryString();
        expect(requestQueryString).to.contain(`${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);

        requestParameterBuilder = new RequestParameterBuilder();
        requestParameterBuilder.addScopes(null);
        requestQueryString = requestParameterBuilder.createQueryString();
        expect(requestQueryString).to.contain(`${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);

        requestParameterBuilder = new RequestParameterBuilder();
        requestParameterBuilder.addScopes(undefined);
        requestQueryString = requestParameterBuilder.createQueryString();
        expect(requestQueryString).to.contain(`${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
    });

    it("addScopes does not append oidc scopes if flag set to false", () => {
        const requestParameterBuilder = new RequestParameterBuilder();
        requestParameterBuilder.addScopes(["testScope"], false);
        const requestQueryString = requestParameterBuilder.createQueryString();
        expect(requestQueryString).to.contain(`${AADServerParamKeys.SCOPE}=testScope`);
    });

    it("addCodeChallengeParams throws invalidCodeChallengeParamsError if codeChallengeMethod empty", () => {
        const requestParameterBuilder = new RequestParameterBuilder();
        expect(() => requestParameterBuilder.addCodeChallengeParams(TEST_CONFIG.TEST_CHALLENGE, "")).to.throw(ClientConfigurationError.createInvalidCodeChallengeParamsError().errorMessage);
    });

    it("addCodeChallengeParams throws invalidCodeChallengeParamsError if codeChallenge empty", () => {
        const requestParameterBuilder = new RequestParameterBuilder();
        expect(() => requestParameterBuilder.addCodeChallengeParams("", AADServerParamKeys.CODE_CHALLENGE_METHOD)).to.throw(ClientConfigurationError.createInvalidCodeChallengeParamsError().errorMessage);
    });

    it("throws error if claims is not stringified JSON object", () => {
        const claims = "not-a-valid-JSON-object";
        sinon.stub(RequestParameterBuilder.prototype, "addClientCapabilitiesToClaims").returns(claims);
        const requestParameterBuilder = new RequestParameterBuilder();
        expect(() => requestParameterBuilder.addClaims(claims, [])).to.throw(ClientConfigurationErrorMessage.invalidClaimsRequest.desc);
        sinon.restore();
    });

    describe("addClientCapabilitiesToClaims tests", () => {
        it("passing just claims returns claims", () => {
            const requestParameterBuilder = new RequestParameterBuilder();
            const testClaims = TEST_CONFIG.CLAIMS;
            expect(requestParameterBuilder.addClientCapabilitiesToClaims(testClaims, [])).to.eq(testClaims);
        });

        it("passing just clientCapabilities returns clientCapabilities as claims request", () => {
            const requestParameterBuilder = new RequestParameterBuilder();
            const clientCapabilities = ["CP1"];
            const expectedString = "{\"access_token\":{\"xms_cc\":{\"values\":[\"CP1\"]}}}";
            expect(requestParameterBuilder.addClientCapabilitiesToClaims(undefined, clientCapabilities)).to.eq(expectedString);
        });

        it("passed claims already has access_token key, append xms_cc claim from clientCapabilities", () => {
            const requestParameterBuilder = new RequestParameterBuilder();
            const claimsRequest = "{\"access_token\":{\"example_claim\":{\"values\":[\"example_value\"]}}}";
            const clientCapabilities = ["CP1"];
            const expectedString = "{\"access_token\":{\"example_claim\":{\"values\":[\"example_value\"]},\"xms_cc\":{\"values\":[\"CP1\"]}}}";
            expect(requestParameterBuilder.addClientCapabilitiesToClaims(claimsRequest, clientCapabilities)).to.eq(expectedString);
        });

        it("passed claims does not have access_token key, add access_token key and xms_cc key underneath", () => {
            const requestParameterBuilder = new RequestParameterBuilder();
            const claimsRequest = "{\"id_token\":{\"example_claim\":{\"values\":[\"example_value\"]}}}";
            const clientCapabilities = ["CP1"];
            const expectedString = "{\"id_token\":{\"example_claim\":{\"values\":[\"example_value\"]}},\"access_token\":{\"xms_cc\":{\"values\":[\"CP1\"]}}}";
            expect(requestParameterBuilder.addClientCapabilitiesToClaims(claimsRequest, clientCapabilities)).to.eq(expectedString);
        });

        it("throws error if claims passed is not stringified JSON object", () => {
            const requestParameterBuilder = new RequestParameterBuilder();
            const testClaims = "not-a-valid-JSON-object";
            expect(() => requestParameterBuilder.addClientCapabilitiesToClaims(testClaims, [])).to.throw(ClientConfigurationErrorMessage.invalidClaimsRequest.desc);
        });
    });
});
