import {
    Constants,
    PromptValue,
    ResponseMode,
    GrantType,
    AuthenticationScheme,
    HeaderNames,
    OAuthResponseType,
} from "../../src/utils/Constants.js";
import * as AADServerParamKeys from "../../src/constants/AADServerParamKeys.js";
import {
    TEST_CONFIG,
    TEST_URIS,
    TEST_TOKENS,
    DEVICE_CODE_RESPONSE,
    TEST_POP_VALUES,
    TEST_DATA_CLIENT_INFO,
    TEST_SSH_VALUES,
} from "../test_kit/StringConstants.js";
import * as RequestParameterBuilder from "../../src/request/RequestParameterBuilder.js";
import * as UrlUtils from "../../src/utils/UrlUtils.js";
import {
    ClientConfigurationErrorCodes,
    ClientConfigurationErrorMessage,
    createClientConfigurationError,
} from "../../src/error/ClientConfigurationError.js";
import { ClientAssertion, ClientAssertionCallback } from "../../src/index.js";
import { getClientAssertion } from "../../src/utils/ClientAssertionUtils.js";
import { ClientAssertionConfig } from "../../src/account/ClientCredentials.js";
import { MockPerformanceClient } from "../telemetry/PerformanceClient.spec.js";

describe("RequestParameterBuilder unit tests", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("Build query string from RequestParameterBuilder object", () => {
        const parameters = new Map<string, string>();
        RequestParameterBuilder.addResponseType(
            parameters,
            OAuthResponseType.CODE
        );
        RequestParameterBuilder.addResponseMode(
            parameters,
            ResponseMode.FORM_POST
        );
        RequestParameterBuilder.addScopes(
            parameters,
            TEST_CONFIG.DEFAULT_SCOPES
        );
        RequestParameterBuilder.addClientId(
            parameters,
            TEST_CONFIG.MSAL_CLIENT_ID
        );
        RequestParameterBuilder.addRedirectUri(
            parameters,
            TEST_URIS.TEST_REDIRECT_URI_LOCALHOST
        );
        RequestParameterBuilder.addDomainHint(
            parameters,
            TEST_CONFIG.DOMAIN_HINT
        );
        RequestParameterBuilder.addLoginHint(
            parameters,
            TEST_CONFIG.LOGIN_HINT
        );
        RequestParameterBuilder.addClaims(parameters, TEST_CONFIG.CLAIMS, []);
        RequestParameterBuilder.addCorrelationId(
            parameters,
            TEST_CONFIG.CORRELATION_ID
        );
        RequestParameterBuilder.addPrompt(
            parameters,
            PromptValue.SELECT_ACCOUNT
        );
        RequestParameterBuilder.addState(parameters, TEST_CONFIG.STATE);
        RequestParameterBuilder.addNonce(parameters, TEST_CONFIG.NONCE);
        RequestParameterBuilder.addCodeChallengeParams(
            parameters,
            TEST_CONFIG.TEST_CHALLENGE,
            TEST_CONFIG.CODE_CHALLENGE_METHOD
        );
        RequestParameterBuilder.addAuthorizationCode(
            parameters,
            TEST_TOKENS.AUTHORIZATION_CODE
        );
        RequestParameterBuilder.addDeviceCode(
            parameters,
            DEVICE_CODE_RESPONSE.deviceCode
        );
        RequestParameterBuilder.addCodeVerifier(
            parameters,
            TEST_CONFIG.TEST_VERIFIER
        );
        RequestParameterBuilder.addGrantType(
            parameters,
            GrantType.DEVICE_CODE_GRANT
        );
        RequestParameterBuilder.addSid(parameters, TEST_CONFIG.SID);
        RequestParameterBuilder.addLogoutHint(
            parameters,
            TEST_CONFIG.LOGIN_HINT
        );

        const requestQueryString = UrlUtils.mapToQueryString(parameters);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.RESPONSE_TYPE}=${OAuthResponseType.CODE}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.RESPONSE_MODE}=${encodeURIComponent(
                    ResponseMode.FORM_POST
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(
                    TEST_URIS.TEST_REDIRECT_URI_LOCALHOST
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.DOMAIN_HINT}=${encodeURIComponent(
                    TEST_CONFIG.DOMAIN_HINT
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.LOGIN_HINT}=${encodeURIComponent(
                    TEST_CONFIG.LOGIN_HINT
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.CLAIMS}=${encodeURIComponent(
                    TEST_CONFIG.CLAIMS
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.CLIENT_REQUEST_ID}=${encodeURIComponent(
                    TEST_CONFIG.CORRELATION_ID
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.PROMPT}=${PromptValue.SELECT_ACCOUNT}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.STATE}=${encodeURIComponent(
                    TEST_CONFIG.STATE
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.NONCE}=${encodeURIComponent(
                    TEST_CONFIG.NONCE
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.CODE_CHALLENGE}=${encodeURIComponent(
                    TEST_CONFIG.TEST_CHALLENGE
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${
                    AADServerParamKeys.CODE_CHALLENGE_METHOD
                }=${encodeURIComponent(TEST_CONFIG.CODE_CHALLENGE_METHOD)}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.CODE}=${encodeURIComponent(
                    TEST_TOKENS.AUTHORIZATION_CODE
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.DEVICE_CODE}=${encodeURIComponent(
                    DEVICE_CODE_RESPONSE.deviceCode
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.CODE_VERIFIER}=${encodeURIComponent(
                    TEST_CONFIG.TEST_VERIFIER
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.SID}=${encodeURIComponent(
                    TEST_CONFIG.SID
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.LOGOUT_HINT}=${encodeURIComponent(
                    TEST_CONFIG.LOGIN_HINT
                )}`
            )
        ).toBe(true);
    });

    it("Doesn't encode extra params by default", () => {
        const parameters = new Map<string, string>();
        RequestParameterBuilder.addResponseType(
            parameters,
            OAuthResponseType.CODE
        );
        RequestParameterBuilder.addResponseMode(
            parameters,
            ResponseMode.FORM_POST
        );
        RequestParameterBuilder.addScopes(
            parameters,
            TEST_CONFIG.DEFAULT_SCOPES
        );
        RequestParameterBuilder.addClientId(
            parameters,
            TEST_CONFIG.MSAL_CLIENT_ID
        );
        RequestParameterBuilder.addRedirectUri(
            parameters,
            TEST_URIS.TEST_REDIRECT_URI_LOCALHOST
        );
        RequestParameterBuilder.addDomainHint(
            parameters,
            TEST_CONFIG.DOMAIN_HINT
        );
        RequestParameterBuilder.addLoginHint(
            parameters,
            TEST_CONFIG.LOGIN_HINT
        );
        RequestParameterBuilder.addClaims(parameters, TEST_CONFIG.CLAIMS, []);
        RequestParameterBuilder.addCorrelationId(
            parameters,
            TEST_CONFIG.CORRELATION_ID
        );
        RequestParameterBuilder.addPrompt(
            parameters,
            PromptValue.SELECT_ACCOUNT
        );
        RequestParameterBuilder.addState(parameters, TEST_CONFIG.STATE);
        RequestParameterBuilder.addNonce(parameters, TEST_CONFIG.NONCE);
        RequestParameterBuilder.addCodeChallengeParams(
            parameters,
            TEST_CONFIG.TEST_CHALLENGE,
            TEST_CONFIG.CODE_CHALLENGE_METHOD
        );
        RequestParameterBuilder.addAuthorizationCode(
            parameters,
            TEST_TOKENS.AUTHORIZATION_CODE
        );
        RequestParameterBuilder.addDeviceCode(
            parameters,
            DEVICE_CODE_RESPONSE.deviceCode
        );
        RequestParameterBuilder.addCodeVerifier(
            parameters,
            TEST_CONFIG.TEST_VERIFIER
        );
        RequestParameterBuilder.addGrantType(
            parameters,
            GrantType.DEVICE_CODE_GRANT
        );
        RequestParameterBuilder.addSid(parameters, TEST_CONFIG.SID);
        RequestParameterBuilder.addLogoutHint(
            parameters,
            TEST_CONFIG.LOGIN_HINT
        );
        RequestParameterBuilder.addExtraQueryParameters(parameters, {
            extra_params: "param1,param2",
        });

        const requestQueryString = UrlUtils.mapToQueryString(
            parameters,
            false,
            {
                extra_params: "param1,param2",
            }
        );
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.RESPONSE_TYPE}=${OAuthResponseType.CODE}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.RESPONSE_MODE}=${encodeURIComponent(
                    ResponseMode.FORM_POST
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(
                    TEST_URIS.TEST_REDIRECT_URI_LOCALHOST
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.DOMAIN_HINT}=${encodeURIComponent(
                    TEST_CONFIG.DOMAIN_HINT
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.LOGIN_HINT}=${encodeURIComponent(
                    TEST_CONFIG.LOGIN_HINT
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.CLAIMS}=${encodeURIComponent(
                    TEST_CONFIG.CLAIMS
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.CLIENT_REQUEST_ID}=${encodeURIComponent(
                    TEST_CONFIG.CORRELATION_ID
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.PROMPT}=${PromptValue.SELECT_ACCOUNT}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.STATE}=${encodeURIComponent(
                    TEST_CONFIG.STATE
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.NONCE}=${encodeURIComponent(
                    TEST_CONFIG.NONCE
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.CODE_CHALLENGE}=${encodeURIComponent(
                    TEST_CONFIG.TEST_CHALLENGE
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${
                    AADServerParamKeys.CODE_CHALLENGE_METHOD
                }=${encodeURIComponent(TEST_CONFIG.CODE_CHALLENGE_METHOD)}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.CODE}=${encodeURIComponent(
                    TEST_TOKENS.AUTHORIZATION_CODE
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.DEVICE_CODE}=${encodeURIComponent(
                    DEVICE_CODE_RESPONSE.deviceCode
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.CODE_VERIFIER}=${encodeURIComponent(
                    TEST_CONFIG.TEST_VERIFIER
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.SID}=${encodeURIComponent(
                    TEST_CONFIG.SID
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.LOGOUT_HINT}=${encodeURIComponent(
                    TEST_CONFIG.LOGIN_HINT
                )}`
            )
        ).toBe(true);
        expect(requestQueryString.includes(`extra_params=param1,param2`)).toBe(
            true
        );
    });

    it("Encodes extra params if encodeParams is true and extra params are passed in", () => {
        const parameters = new Map<string, string>();
        RequestParameterBuilder.addExtraQueryParameters(parameters, {
            extra_params: "param1,param2",
        });

        const requestQueryString = UrlUtils.mapToQueryString(parameters, true, {
            extra_params: "param1,param2",
        });

        expect(
            requestQueryString.includes(
                `extra_params=${encodeURIComponent("param1,param2")}`
            )
        ).toBe(true);
    });

    it("Adds token type and req_cnf correctly for proof-of-possession tokens", () => {
        const parameters = new Map<string, string>();
        RequestParameterBuilder.addPopToken(
            parameters,
            TEST_POP_VALUES.ENCODED_REQ_CNF
        );
        const requestQueryString = UrlUtils.mapToQueryString(parameters);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.TOKEN_TYPE}=${AuthenticationScheme.POP}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.REQ_CNF}=${encodeURIComponent(
                    TEST_POP_VALUES.ENCODED_REQ_CNF
                )}`
            )
        ).toBe(true);
    });

    it("Does not add token type or req_cnf for PoP request if req_cnf is undefined or empty", () => {
        const parameters = new Map<string, string>();
        RequestParameterBuilder.addPopToken(parameters, "");
        const requestQueryString = UrlUtils.mapToQueryString(parameters);
        expect(Object.keys(requestQueryString)).toHaveLength(0);
    });

    it("Adds token type and req_cnf correctly for SSH certificates", () => {
        const parameters = new Map<string, string>();
        RequestParameterBuilder.addSshJwk(parameters, TEST_SSH_VALUES.SSH_JWK);
        const requestQueryString = UrlUtils.mapToQueryString(parameters);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.TOKEN_TYPE}=${AuthenticationScheme.SSH}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.REQ_CNF}=${TEST_SSH_VALUES.ENCODED_SSH_JWK}`
            )
        ).toBe(true);
    });

    it("Does not add token type or req_cnf for SSH Certificate request if req_cnf is undefined or empty", () => {
        const parameters = new Map<string, string>();
        RequestParameterBuilder.addSshJwk(parameters, "");
        const requestQueryString = UrlUtils.mapToQueryString(parameters);
        expect(Object.keys(requestQueryString)).toHaveLength(0);
    });

    it("addScopes appends oidc scopes by default", () => {
        const parameters = new Map<string, string>();
        RequestParameterBuilder.addScopes(parameters, ["testScope"]);
        let requestQueryString = UrlUtils.mapToQueryString(parameters);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.SCOPE}=testScope%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
            )
        ).toBe(true);

        const parameters2 = new Map<string, string>();
        RequestParameterBuilder.addScopes(parameters2, []);
        requestQueryString = UrlUtils.mapToQueryString(parameters2);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
            )
        ).toBe(true);
    });

    it("addScopes does not append oidc scopes if flag set to false", () => {
        const parameters = new Map<string, string>();
        RequestParameterBuilder.addScopes(parameters, ["testScope"], false);
        const requestQueryString = UrlUtils.mapToQueryString(parameters);
        expect(
            requestQueryString.includes(`${AADServerParamKeys.SCOPE}=testScope`)
        ).toBe(true);
    });

    it("addScopes overrides OIDC_DEFAULT_SCOPES with defaultScopes", () => {
        const parameters = new Map<string, string>();
        RequestParameterBuilder.addScopes(parameters, [], true, [
            "openid",
            "profile",
        ]);
        const requestQueryString = UrlUtils.mapToQueryString(parameters);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(`${Constants.OFFLINE_ACCESS_SCOPE}`)
        ).toBe(false);
    });

    it("addScopes adds openid scope when in OIDC protocol mode", () => {
        const parameters = new Map<string, string>();
        RequestParameterBuilder.addScopes(parameters, [], true, []);
        const requestQueryString = UrlUtils.mapToQueryString(parameters);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}`
            )
        ).toBe(true);
    });

    it("addCodeChallengeParams throws invalidCodeChallengeParamsError if codeChallengeMethod empty", () => {
        const parameters = new Map<string, string>();
        expect(() =>
            RequestParameterBuilder.addCodeChallengeParams(
                parameters,
                TEST_CONFIG.TEST_CHALLENGE,
                ""
            )
        ).toThrowError(
            createClientConfigurationError(
                ClientConfigurationErrorCodes.pkceParamsMissing
            )
        );
    });

    it("addCodeChallengeParams throws invalidCodeChallengeParamsError if codeChallenge empty", () => {
        const parameters = new Map<string, string>();
        expect(() =>
            RequestParameterBuilder.addCodeChallengeParams(
                parameters,
                "",
                AADServerParamKeys.CODE_CHALLENGE_METHOD
            )
        ).toThrowError(
            createClientConfigurationError(
                ClientConfigurationErrorCodes.pkceParamsMissing
            )
        );
    });

    it("addResponseTypeForIdToken does add response_type correctly", () => {
        const parameters = new Map<string, string>();
        RequestParameterBuilder.addResponseType(
            parameters,
            OAuthResponseType.IDTOKEN_TOKEN
        );
        const requestQueryString = UrlUtils.mapToQueryString(parameters);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.RESPONSE_TYPE}=${encodeURIComponent(
                    OAuthResponseType.IDTOKEN_TOKEN
                )}`
            )
        ).toBe(true);
    });

    it("throws error if claims is not stringified JSON object", () => {
        const claims = "not-a-valid-JSON-object";
        jest.spyOn(
            RequestParameterBuilder,
            "addClientCapabilitiesToClaims"
        ).mockReturnValue(claims);
        const parameters = new Map<string, string>();
        expect(() =>
            RequestParameterBuilder.addClaims(parameters, claims, [])
        ).toThrow(ClientConfigurationErrorMessage.invalidClaimsRequest.desc);
    });

    it("adds clientAssertion (string) and assertionType if they are provided by the developer", async () => {
        const clientAssertion: ClientAssertion = {
            assertion: "testAssertion",
            assertionType: "jwt-bearer",
        };

        const parameters = new Map<string, string>();
        RequestParameterBuilder.addClientAssertion(
            parameters,
            await getClientAssertion(
                clientAssertion.assertion,
                "client_id",
                "optional_token_endpoint"
            )
        );
        RequestParameterBuilder.addClientAssertionType(
            parameters,
            clientAssertion.assertionType
        );
        const requestQueryString = UrlUtils.mapToQueryString(parameters);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.CLIENT_ASSERTION}=${encodeURIComponent(
                    "testAssertion"
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${
                    AADServerParamKeys.CLIENT_ASSERTION_TYPE
                }=${encodeURIComponent("jwt-bearer")}`
            )
        ).toBe(true);
    });

    it("does not add client assertion (string) and client assertion type if they are empty strings", async () => {
        const clientAssertion: ClientAssertion = {
            assertion: "",
            assertionType: "",
        };

        const parameters = new Map<string, string>();
        RequestParameterBuilder.addClientAssertion(
            parameters,
            await getClientAssertion(
                clientAssertion.assertion,
                "client_id",
                "optional_token_endpoint"
            )
        );
        RequestParameterBuilder.addClientAssertionType(
            parameters,
            clientAssertion.assertionType
        );
        const requestQueryString = UrlUtils.mapToQueryString(parameters);
        expect(
            requestQueryString.includes(AADServerParamKeys.CLIENT_ASSERTION)
        ).toBe(false);
        expect(
            requestQueryString.includes(
                AADServerParamKeys.CLIENT_ASSERTION_TYPE
            )
        ).toBe(false);
    });

    it("adds clientAssertion (ClientAssertionCallback) and assertionType if they are provided by the developer", async () => {
        const ClientAssertionCallback: ClientAssertionCallback = (
            _config: ClientAssertionConfig
        ) => {
            return Promise.resolve("testAssertion");
        };

        const clientAssertion: ClientAssertion = {
            assertion: ClientAssertionCallback,
            assertionType: "jwt-bearer",
        };

        const parameters = new Map<string, string>();
        RequestParameterBuilder.addClientAssertion(
            parameters,
            await getClientAssertion(
                clientAssertion.assertion,
                "client_id",
                "optional_token_endpoint"
            )
        );
        RequestParameterBuilder.addClientAssertionType(
            parameters,
            clientAssertion.assertionType
        );
        const requestQueryString = UrlUtils.mapToQueryString(parameters);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.CLIENT_ASSERTION}=${encodeURIComponent(
                    "testAssertion"
                )}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${
                    AADServerParamKeys.CLIENT_ASSERTION_TYPE
                }=${encodeURIComponent("jwt-bearer")}`
            )
        ).toBe(true);
    });

    it("does not add client assertion (ClientAssertionCallback) and client assertion type if they are empty strings", async () => {
        const ClientAssertionCallback: ClientAssertionCallback = (
            _config: ClientAssertionConfig
        ) => {
            return Promise.resolve("");
        };

        const clientAssertion: ClientAssertion = {
            assertion: ClientAssertionCallback,
            assertionType: "",
        };

        const parameters = new Map<string, string>();
        RequestParameterBuilder.addClientAssertion(
            parameters,
            await getClientAssertion(
                clientAssertion.assertion,
                "client_id",
                "optional_token_endpoint"
            )
        );
        RequestParameterBuilder.addClientAssertionType(
            parameters,
            clientAssertion.assertionType
        );
        const requestQueryString = UrlUtils.mapToQueryString(parameters);
        expect(
            requestQueryString.includes(AADServerParamKeys.CLIENT_ASSERTION)
        ).toBe(false);
        expect(
            requestQueryString.includes(
                AADServerParamKeys.CLIENT_ASSERTION_TYPE
            )
        ).toBe(false);
    });

    describe("CCS parameters", () => {
        it("adds CCS parameter from given client_info object", () => {
            const parameters = new Map<string, string>();
            RequestParameterBuilder.addCcsOid(parameters, {
                uid: TEST_DATA_CLIENT_INFO.TEST_UID,
                utid: TEST_DATA_CLIENT_INFO.TEST_UTID,
            });
            const requestQueryString = UrlUtils.mapToQueryString(parameters);
            expect(
                requestQueryString.includes(
                    `${HeaderNames.CCS_HEADER}=${encodeURIComponent(
                        `Oid:${TEST_DATA_CLIENT_INFO.TEST_UID}@${TEST_DATA_CLIENT_INFO.TEST_UTID}`
                    )}`
                )
            ).toBeTruthy();
        });

        it("adds CCS parameter from given UPN", () => {
            const parameters = new Map<string, string>();
            const testUpn = "AbeLi@microsoft.com";
            RequestParameterBuilder.addCcsUpn(parameters, testUpn);
            const requestQueryString = UrlUtils.mapToQueryString(parameters);
            expect(
                requestQueryString.includes(
                    `${HeaderNames.CCS_HEADER}=${encodeURIComponent(
                        `UPN:${testUpn}`
                    )}`
                )
            ).toBeTruthy();
        });
    });

    describe("addClientCapabilitiesToClaims tests", () => {
        it("passing just claims returns claims", () => {
            const testClaims = TEST_CONFIG.CLAIMS;
            expect(
                RequestParameterBuilder.addClientCapabilitiesToClaims(
                    testClaims,
                    []
                )
            ).toBe(testClaims);
        });

        it("passing just clientCapabilities returns clientCapabilities as claims request", () => {
            const clientCapabilities = ["CP1"];
            const expectedString =
                '{"access_token":{"xms_cc":{"values":["CP1"]}}}';
            expect(
                RequestParameterBuilder.addClientCapabilitiesToClaims(
                    undefined,
                    clientCapabilities
                )
            ).toBe(expectedString);
        });

        it("passed claims already has access_token key, append xms_cc claim from clientCapabilities", () => {
            const claimsRequest =
                '{"access_token":{"example_claim":{"values":["example_value"]}}}';
            const clientCapabilities = ["CP1"];
            const expectedString =
                '{"access_token":{"example_claim":{"values":["example_value"]},"xms_cc":{"values":["CP1"]}}}';
            expect(
                RequestParameterBuilder.addClientCapabilitiesToClaims(
                    claimsRequest,
                    clientCapabilities
                )
            ).toBe(expectedString);
        });

        it("passed claims does not have access_token key, add access_token key and xms_cc key underneath", () => {
            const claimsRequest =
                '{"id_token":{"example_claim":{"values":["example_value"]}}}';
            const clientCapabilities = ["CP1"];
            const expectedString =
                '{"id_token":{"example_claim":{"values":["example_value"]}},"access_token":{"xms_cc":{"values":["CP1"]}}}';
            expect(
                RequestParameterBuilder.addClientCapabilitiesToClaims(
                    claimsRequest,
                    clientCapabilities
                )
            ).toBe(expectedString);
        });

        it("throws error if claims passed is not stringified JSON object", () => {
            const testClaims = "not-a-valid-JSON-object";
            expect(() =>
                RequestParameterBuilder.addClientCapabilitiesToClaims(
                    testClaims,
                    []
                )
            ).toThrowError(
                ClientConfigurationErrorMessage.invalidClaimsRequest.desc
            );
        });
    });

    describe("addExtraQueryParameters tests", () => {
        it("adds extra query parameters to the request", () => {
            const parameters = new Map<string, string>();
            RequestParameterBuilder.addClientId(
                parameters,
                TEST_CONFIG.MSAL_CLIENT_ID
            );
            const eqp = {
                testKey1: "testVal1",
                testKey2: "testVal2",
            };

            RequestParameterBuilder.addExtraQueryParameters(parameters, eqp);
            const expectedString = `client_id=${TEST_CONFIG.MSAL_CLIENT_ID}&testKey1=testVal1&testKey2=testVal2`;

            expect(UrlUtils.mapToQueryString(parameters)).toBe(expectedString);
        });

        it("Does not add extra query parameters if they are empty", () => {
            const parameters = new Map<string, string>();
            RequestParameterBuilder.addClientId(
                parameters,
                TEST_CONFIG.MSAL_CLIENT_ID
            );
            const eqp = {
                testKey1: "testVal1",
                testKey2: "testVal2",
                testKey3: "",
            };

            RequestParameterBuilder.addExtraQueryParameters(parameters, eqp);
            const expectedString = `client_id=${TEST_CONFIG.MSAL_CLIENT_ID}&testKey1=testVal1&testKey2=testVal2`;

            expect(UrlUtils.mapToQueryString(parameters)).toBe(expectedString);
        });

        it("Does not  add extra query parameters if they already exist in the request", () => {
            const parameters = new Map<string, string>();
            RequestParameterBuilder.addClientId(
                parameters,
                TEST_CONFIG.MSAL_CLIENT_ID
            );
            const eqp = {
                testKey1: "testVal1",
                testKey2: "testVal2",
                client_id: "some-other-client-id",
            };

            RequestParameterBuilder.addExtraQueryParameters(parameters, eqp);
            const expectedString = `client_id=${TEST_CONFIG.MSAL_CLIENT_ID}&testKey1=testVal1&testKey2=testVal2`;

            expect(UrlUtils.mapToQueryString(parameters)).toBe(expectedString);
        });

        it("Does not mutate the original extraQueryParameters object", () => {
            const parameters = new Map<string, string>();
            RequestParameterBuilder.addClientId(
                parameters,
                TEST_CONFIG.MSAL_CLIENT_ID
            );
            const eqp = {
                testKey1: "testVal1",
                testKey2: "testVal2",
                client_id: "some-other-client-id",
            };

            RequestParameterBuilder.addExtraQueryParameters(parameters, eqp);

            expect(Object.keys(eqp)).toEqual([
                "testKey1",
                "testKey2",
                "client_id",
            ]);
            expect(Object.values(eqp)).toEqual([
                "testVal1",
                "testVal2",
                "some-other-client-id",
            ]);
        });
    });

    describe("broker parameters tests", () => {
        const redirectUri = "embedded-redirect-uri";
        const clientId = "embedded-client-id";
        const brokerClientId = "broker-client-id";
        const brokerRedirectUri = "broker-redirect-uri";

        it("adds broker params to query string", async () => {
            const parameters = new Map<string, string>();
            RequestParameterBuilder.addBrokerParameters(
                parameters,
                brokerClientId,
                brokerRedirectUri
            );
            const queryString = UrlUtils.mapToQueryString(parameters);
            expect(queryString).toContain(`brk_client_id=broker-client-id`);
            expect(queryString).toContain(
                `brk_redirect_uri=broker-redirect-uri`
            );
        });

        it("instruments embedded client id and uri", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const parameters = new Map<string, string>();

            const measurement = mockPerfClient.startMeasurement(
                "test-measurement",
                TEST_CONFIG.CORRELATION_ID
            );

            RequestParameterBuilder.addClientId(parameters, clientId);
            RequestParameterBuilder.addRedirectUri(parameters, redirectUri);
            RequestParameterBuilder.addBrokerParameters(
                parameters,
                brokerClientId,
                brokerRedirectUri
            );
            RequestParameterBuilder.instrumentBrokerParams(
                parameters,
                TEST_CONFIG.CORRELATION_ID,
                mockPerfClient
            );

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                expect(events[0].embeddedClientId).toEqual(clientId);
                expect(events[0].embeddedRedirectUri).toEqual(redirectUri);
                done();
            });

            measurement.end({ success: true });
        });

        it("does not instrument embedded client id", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const parameters = new Map<string, string>();

            const measurement = mockPerfClient.startMeasurement(
                "test-measurement",
                TEST_CONFIG.CORRELATION_ID
            );

            RequestParameterBuilder.addExtraQueryParameters(parameters, {
                client_id: "embedded-client-id",
            });
            RequestParameterBuilder.instrumentBrokerParams(
                parameters,
                TEST_CONFIG.CORRELATION_ID,
                mockPerfClient
            );

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                expect(events[0].embeddedClientId).toBeUndefined();
                done();
            });

            measurement.end({ success: true });
        });
    });
});
