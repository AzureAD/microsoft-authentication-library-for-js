import {Constants, SSOTypes, PromptValue, AADServerParamKeys, ResponseMode, GrantType, AuthenticationScheme, HeaderNames} from "../../src/utils/Constants";
import {
    TEST_CONFIG,
    TEST_URIS,
    TEST_TOKENS,
    DEVICE_CODE_RESPONSE,
    TEST_POP_VALUES,
    TEST_DATA_CLIENT_INFO,
    TEST_SSH_VALUES
} from "../test_kit/StringConstants";
import { RequestParameterBuilder } from "../../src/request/RequestParameterBuilder";
import sinon from "sinon";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";

describe("RequestParameterBuilder unit tests", () => {

    it("constructor", () => {
        const requestParameterBuilder = new RequestParameterBuilder();
        expect(requestParameterBuilder).toBeInstanceOf(RequestParameterBuilder);
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
        requestParameterBuilder.addLogoutHint(TEST_CONFIG.LOGIN_HINT);

        const requestQueryString = requestParameterBuilder.createQueryString();
        expect(requestQueryString.includes(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`)).toBe(true);
        expect(requestQueryString.includes(`${AADServerParamKeys.RESPONSE_MODE}=${encodeURIComponent(ResponseMode.FORM_POST)}`)).toBe(true);
        expect(requestQueryString.includes(`${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`)).toBe(true);
        expect(requestQueryString.includes(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`)).toBe(true);
        expect(requestQueryString.includes(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIRECT_URI_LOCALHOST)}`)).toBe(true);
        expect(requestQueryString.includes(`${SSOTypes.DOMAIN_HINT}=${encodeURIComponent(TEST_CONFIG.DOMAIN_HINT)}`)).toBe(true);
        expect(requestQueryString.includes(`${SSOTypes.LOGIN_HINT}=${encodeURIComponent(TEST_CONFIG.LOGIN_HINT)}`)).toBe(true);
        expect(requestQueryString.includes(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`)).toBe(true);
        expect(requestQueryString.includes(`${AADServerParamKeys.CLIENT_REQUEST_ID}=${encodeURIComponent(TEST_CONFIG.CORRELATION_ID)}`)).toBe(true);
        expect(requestQueryString.includes(`${AADServerParamKeys.PROMPT}=${PromptValue.SELECT_ACCOUNT}`)).toBe(true);
        expect(requestQueryString.includes(`${AADServerParamKeys.STATE}=${encodeURIComponent(TEST_CONFIG.STATE)}`)).toBe(true);
        expect(requestQueryString.includes(`${AADServerParamKeys.NONCE}=${encodeURIComponent(TEST_CONFIG.NONCE)}`)).toBe(true);
        expect(requestQueryString.includes(`${AADServerParamKeys.CODE_CHALLENGE}=${encodeURIComponent(TEST_CONFIG.TEST_CHALLENGE)}`)).toBe(true);
        expect(requestQueryString.includes(`${AADServerParamKeys.CODE_CHALLENGE_METHOD}=${encodeURIComponent(TEST_CONFIG.CODE_CHALLENGE_METHOD)}`)).toBe(true);
        expect(requestQueryString.includes(`${AADServerParamKeys.CODE}=${encodeURIComponent(TEST_TOKENS.AUTHORIZATION_CODE)}`)).toBe(true);
        expect(requestQueryString.includes(`${AADServerParamKeys.DEVICE_CODE}=${encodeURIComponent(DEVICE_CODE_RESPONSE.deviceCode)}`)).toBe(true);
        expect(requestQueryString.includes(`${AADServerParamKeys.CODE_VERIFIER}=${encodeURIComponent(TEST_CONFIG.TEST_VERIFIER)}`)).toBe(true);
        expect(requestQueryString.includes(`${SSOTypes.SID}=${encodeURIComponent(TEST_CONFIG.SID)}`)).toBe(true);
        expect(requestQueryString.includes(`${AADServerParamKeys.LOGOUT_HINT}=${encodeURIComponent(TEST_CONFIG.LOGIN_HINT)}`)).toBe(true);
    });

    it("Adds token type and req_cnf correctly for proof-of-possession tokens", () => {
        const requestParameterBuilder = new RequestParameterBuilder();
        requestParameterBuilder.addPopToken(TEST_POP_VALUES.ENCODED_REQ_CNF);
        const requestQueryString = requestParameterBuilder.createQueryString();
        expect(requestQueryString.includes(`${AADServerParamKeys.TOKEN_TYPE}=${AuthenticationScheme.POP}`)).toBe(true);
        expect(requestQueryString.includes(`${AADServerParamKeys.REQ_CNF}=${encodeURIComponent(TEST_POP_VALUES.ENCODED_REQ_CNF)}`)).toBe(true);
    });

    it("Does not add token type or req_cnf for PoP request if req_cnf is undefined or empty", () => {
        const requestParameterBuilder = new RequestParameterBuilder();
        requestParameterBuilder.addPopToken("");
        const requestQueryString = requestParameterBuilder.createQueryString();
        expect(Object.keys(requestQueryString)).toHaveLength(0);

        const requestParameterBuilder2 = new RequestParameterBuilder();
        //@ts-ignore
        requestParameterBuilder.addPopToken(undefined);
        const requestQueryString2 = requestParameterBuilder2.createQueryString();
        expect(Object.keys(requestQueryString2)).toHaveLength(0);
    });

    it("Adds token type and req_cnf correctly for SSH certificates", () => {
        const requestParameterBuilder = new RequestParameterBuilder();
        requestParameterBuilder.addSshJwk(TEST_SSH_VALUES.SSH_JWK);
        const requestQueryString = requestParameterBuilder.createQueryString();
        expect(requestQueryString.includes(`${AADServerParamKeys.TOKEN_TYPE}=${AuthenticationScheme.SSH}`)).toBe(true);
        expect(requestQueryString.includes(`${AADServerParamKeys.REQ_CNF}=${TEST_SSH_VALUES.ENCODED_SSH_JWK}`)).toBe(true);
    });

    it("Does not add token type or req_cnf for SSH Certificate request if req_cnf is undefined or empty", () => {
        const requestParameterBuilder = new RequestParameterBuilder();
        requestParameterBuilder.addSshJwk("");
        const requestQueryString = requestParameterBuilder.createQueryString();
        expect(Object.keys(requestQueryString)).toHaveLength(0);

        const requestParameterBuilder2 = new RequestParameterBuilder();
        //@ts-ignore
        requestParameterBuilder.addSshJwk(undefined);
        const requestQueryString2 = requestParameterBuilder2.createQueryString();
        expect(Object.keys(requestQueryString2)).toHaveLength(0);
    });

    it("addScopes appends oidc scopes by default", () => {
        let requestParameterBuilder = new RequestParameterBuilder();
        requestParameterBuilder.addScopes(["testScope"]);
        let requestQueryString = requestParameterBuilder.createQueryString();
        expect(requestQueryString.includes(`${AADServerParamKeys.SCOPE}=testScope%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`)).toBe(true);

        requestParameterBuilder = new RequestParameterBuilder();
        requestParameterBuilder.addScopes([]);
        requestQueryString = requestParameterBuilder.createQueryString();
        expect(requestQueryString.includes(`${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`)).toBe(true);

        requestParameterBuilder = new RequestParameterBuilder();
        //@ts-ignore
        requestParameterBuilder.addScopes(null);
        requestQueryString = requestParameterBuilder.createQueryString();
        expect(requestQueryString.includes(`${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`)).toBe(true);

        requestParameterBuilder = new RequestParameterBuilder();
        //@ts-ignore
        requestParameterBuilder.addScopes(undefined);
        requestQueryString = requestParameterBuilder.createQueryString();
        expect(requestQueryString.includes(`${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`)).toBe(true);
    });

    it("addScopes does not append oidc scopes if flag set to false", () => {
        const requestParameterBuilder = new RequestParameterBuilder();
        requestParameterBuilder.addScopes(["testScope"], false);
        const requestQueryString = requestParameterBuilder.createQueryString();
        expect(requestQueryString.includes(`${AADServerParamKeys.SCOPE}=testScope`)).toBe(true);
    });

    it("addCodeChallengeParams throws invalidCodeChallengeParamsError if codeChallengeMethod empty", () => {
        const requestParameterBuilder = new RequestParameterBuilder();
        expect(() => requestParameterBuilder.addCodeChallengeParams(TEST_CONFIG.TEST_CHALLENGE, "")).toThrowError(
            ClientConfigurationError.createInvalidCodeChallengeParamsError().errorMessage
        );
    });

    it("addCodeChallengeParams throws invalidCodeChallengeParamsError if codeChallenge empty", () => {
        const requestParameterBuilder = new RequestParameterBuilder();
        expect(() => requestParameterBuilder.addCodeChallengeParams("", AADServerParamKeys.CODE_CHALLENGE_METHOD)).toThrowError(
            ClientConfigurationError.createInvalidCodeChallengeParamsError().errorMessage
        );
    });

    it("addResponseTypeForIdToken does add response_type correctly", () => {
        const requestParameterBuilder = new RequestParameterBuilder();
        requestParameterBuilder.addResponseTypeForTokenAndIdToken();
        const requestQueryString = requestParameterBuilder.createQueryString();
        expect(requestQueryString.includes(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.TOKEN_RESPONSE_TYPE}%20${Constants.ID_TOKEN_RESPONSE_TYPE}`)).toBe(true);
    });

    it("throws error if claims is not stringified JSON object", () => {
        const claims = "not-a-valid-JSON-object";
        sinon.stub(RequestParameterBuilder.prototype, "addClientCapabilitiesToClaims").returns(claims);
        const requestParameterBuilder = new RequestParameterBuilder();
        expect(() => requestParameterBuilder.addClaims(claims, [])).toThrowError(ClientConfigurationErrorMessage.invalidClaimsRequest.desc);
        sinon.restore();
    });

    it("adds clientAssertion and assertionType if they are passed in as strings", () => {
        const clientAssertion = {
            assertion: "testAssertion",
            assertionType: "jwt-bearer"        };

        const requestParameterBuilder = new RequestParameterBuilder();
        requestParameterBuilder.addClientAssertion(clientAssertion.assertion);
        requestParameterBuilder.addClientAssertionType(clientAssertion.assertionType);
        const requestQueryString = requestParameterBuilder.createQueryString();
        expect(requestQueryString.includes(`${AADServerParamKeys.CLIENT_ASSERTION}=${encodeURIComponent("testAssertion")}`)).toBe(true);
        expect(requestQueryString.includes(`${AADServerParamKeys.CLIENT_ASSERTION_TYPE}=${encodeURIComponent("jwt-bearer")}`)).toBe(true);
    });

    it("doesn't add client assertion and client assertion type if they are empty strings", () => {
        const clientAssertion = {
            assertion: "",
            assertionType: ""
        };

        const requestParameterBuilder = new RequestParameterBuilder();
        requestParameterBuilder.addClientAssertion(clientAssertion.assertion);
        requestParameterBuilder.addClientAssertionType(clientAssertion.assertionType);
        const requestQueryString = requestParameterBuilder.createQueryString();
        expect(requestQueryString.includes(AADServerParamKeys.CLIENT_ASSERTION)).toBe(false);
        expect(requestQueryString.includes(AADServerParamKeys.CLIENT_ASSERTION_TYPE)).toBe(false);
    });

    describe("CCS parameters", () => {

        it("adds CCS parameter from given client_info object", () => {
            const requestParameterBuilder = new RequestParameterBuilder();
            requestParameterBuilder.addCcsOid({
                uid: TEST_DATA_CLIENT_INFO.TEST_UID,
                utid: TEST_DATA_CLIENT_INFO.TEST_UTID
            });
            const requestQueryString = requestParameterBuilder.createQueryString();
            expect(requestQueryString.includes(`${HeaderNames.CCS_HEADER}=${encodeURIComponent(`Oid:${TEST_DATA_CLIENT_INFO.TEST_UID}@${TEST_DATA_CLIENT_INFO.TEST_UTID}`)}`)).toBeTruthy();
        });

        it("adds CCS parameter from given UPN", () => {
            const requestParameterBuilder = new RequestParameterBuilder();
            const testUpn = "AbeLi@microsoft.com";
            requestParameterBuilder.addCcsUpn(testUpn);
            const requestQueryString = requestParameterBuilder.createQueryString();
            expect(requestQueryString.includes(`${HeaderNames.CCS_HEADER}=${encodeURIComponent(`UPN:${testUpn}`)}`)).toBeTruthy();
        });
    });

    describe("addClientCapabilitiesToClaims tests", () => {
        it("passing just claims returns claims", () => {
            const requestParameterBuilder = new RequestParameterBuilder();
            const testClaims = TEST_CONFIG.CLAIMS;
            expect(requestParameterBuilder.addClientCapabilitiesToClaims(testClaims, [])).toBe(testClaims);
        });

        it("passing just clientCapabilities returns clientCapabilities as claims request", () => {
            const requestParameterBuilder = new RequestParameterBuilder();
            const clientCapabilities = ["CP1"];
            const expectedString = "{\"access_token\":{\"xms_cc\":{\"values\":[\"CP1\"]}}}";
            expect(requestParameterBuilder.addClientCapabilitiesToClaims(undefined, clientCapabilities)).toBe(expectedString);
        });

        it("passed claims already has access_token key, append xms_cc claim from clientCapabilities", () => {
            const requestParameterBuilder = new RequestParameterBuilder();
            const claimsRequest = "{\"access_token\":{\"example_claim\":{\"values\":[\"example_value\"]}}}";
            const clientCapabilities = ["CP1"];
            const expectedString = "{\"access_token\":{\"example_claim\":{\"values\":[\"example_value\"]},\"xms_cc\":{\"values\":[\"CP1\"]}}}";
            expect(requestParameterBuilder.addClientCapabilitiesToClaims(claimsRequest, clientCapabilities)).toBe(expectedString);
        });

        it("passed claims does not have access_token key, add access_token key and xms_cc key underneath", () => {
            const requestParameterBuilder = new RequestParameterBuilder();
            const claimsRequest = "{\"id_token\":{\"example_claim\":{\"values\":[\"example_value\"]}}}";
            const clientCapabilities = ["CP1"];
            const expectedString = "{\"id_token\":{\"example_claim\":{\"values\":[\"example_value\"]}},\"access_token\":{\"xms_cc\":{\"values\":[\"CP1\"]}}}";
            expect(requestParameterBuilder.addClientCapabilitiesToClaims(claimsRequest, clientCapabilities)).toBe(expectedString);
        });

        it("throws error if claims passed is not stringified JSON object", () => {
            const requestParameterBuilder = new RequestParameterBuilder();
            const testClaims = "not-a-valid-JSON-object";
            expect(() => requestParameterBuilder.addClientCapabilitiesToClaims(testClaims, [])).toThrowError(ClientConfigurationErrorMessage.invalidClaimsRequest.desc);
        });
    });
});
