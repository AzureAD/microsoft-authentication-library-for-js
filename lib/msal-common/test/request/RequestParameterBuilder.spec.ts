import * as Constants from "../../src/utils/Constants.js";
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
    ClientConfigurationError,
} from "../../src/error/ClientConfigurationError.js";
import { ClientAssertion, ClientAssertionCallback } from "../../src/index.js";
import { getClientAssertion } from "../../src/utils/ClientAssertionUtils.js";
import { ClientAssertionConfig } from "../../src/account/ClientCredentials.js";
import { MockPerformanceClient } from "../telemetry/PerformanceClient.spec.js";

const DEFAULT_OPTIONAL_ID_TOKEN_CLAIMS =
    '{"id_token":{"signin_state":{"essential":false},"login_hint":{"essential":false}}}';
const DEFAULT_OPTIONAL_ID_TOKEN_CLAIMS_WITH_CLIENT_CAPABILITIES =
    '{"id_token":{"signin_state":{"essential":false},"login_hint":{"essential":false}},"access_token":{"xms_cc":{"values":["CP1"]}}}';
const DEFAULT_OPTIONAL_ID_TOKEN_CLAIMS_WITH_TEST_CLAIMS =
    '{"access_token":{"example_claim":{"values":["example_value"]}},"id_token":{"signin_state":{"essential":false},"login_hint":{"essential":false}}}';

describe("RequestParameterBuilder unit tests", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("Build query string from RequestParameterBuilder object", () => {
        const parameters = new Map<string, string>();
        RequestParameterBuilder.addResponseType(
            parameters,
            Constants.OAuthResponseType.CODE
        );
        RequestParameterBuilder.addResponseMode(
            parameters,
            Constants.ResponseMode.FORM_POST
        );
        RequestParameterBuilder.addScopes(
            parameters,
            TEST_CONFIG.DEFAULT_SCOPES,
            ""
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
        RequestParameterBuilder.addClaims(
            parameters,
            "",
            TEST_CONFIG.CLAIMS,
            []
        );
        RequestParameterBuilder.addCorrelationId(
            parameters,
            TEST_CONFIG.CORRELATION_ID
        );
        RequestParameterBuilder.addPrompt(
            parameters,
            Constants.PromptValue.SELECT_ACCOUNT
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
            Constants.GrantType.DEVICE_CODE_GRANT
        );
        RequestParameterBuilder.addSid(parameters, TEST_CONFIG.SID);
        RequestParameterBuilder.addLogoutHint(
            parameters,
            TEST_CONFIG.LOGIN_HINT
        );
        RequestParameterBuilder.addResource(
            parameters,
            "https://graph.microsoft.com"
        );

        const requestQueryString = UrlUtils.mapToQueryString(parameters);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.RESPONSE_TYPE}=${Constants.OAuthResponseType.CODE}`
            )
        ).toBe(true);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.RESPONSE_MODE}=${encodeURIComponent(
                    Constants.ResponseMode.FORM_POST
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
                    DEFAULT_OPTIONAL_ID_TOKEN_CLAIMS_WITH_TEST_CLAIMS
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
                `${AADServerParamKeys.PROMPT}=${Constants.PromptValue.SELECT_ACCOUNT}`
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
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.RESOURCE}=${encodeURIComponent(
                    "https://graph.microsoft.com"
                )}`
            )
        ).toBe(true);
    });

    it("Encodes extra params", () => {
        const parameters = new Map<string, string>();
        RequestParameterBuilder.addExtraParameters(parameters, {
            extra_params: "param1,param2",
        });

        const requestQueryString = UrlUtils.mapToQueryString(parameters);

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
                `${AADServerParamKeys.TOKEN_TYPE}=${Constants.AuthenticationScheme.POP}`
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
                `${AADServerParamKeys.TOKEN_TYPE}=${Constants.AuthenticationScheme.SSH}`
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
        RequestParameterBuilder.addScopes(parameters, ["testScope"], "");
        let requestQueryString = UrlUtils.mapToQueryString(parameters);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.SCOPE}=testScope%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
            )
        ).toBe(true);

        const parameters2 = new Map<string, string>();
        RequestParameterBuilder.addScopes(parameters2, [], "");
        requestQueryString = UrlUtils.mapToQueryString(parameters2);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
            )
        ).toBe(true);
    });

    it("addScopes does not append oidc scopes if flag set to false", () => {
        const parameters = new Map<string, string>();
        RequestParameterBuilder.addScopes(parameters, ["testScope"], "", false);
        const requestQueryString = UrlUtils.mapToQueryString(parameters);
        expect(
            requestQueryString.includes(`${AADServerParamKeys.SCOPE}=testScope`)
        ).toBe(true);
    });

    it("addScopes overrides OIDC_DEFAULT_SCOPES with defaultScopes", () => {
        const parameters = new Map<string, string>();
        RequestParameterBuilder.addScopes(parameters, [], "", true, [
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
        RequestParameterBuilder.addScopes(parameters, [], "", true, []);
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
        ).toThrow(
            new ClientConfigurationError(
                ClientConfigurationErrorCodes.pkceParamsMissing,
                ""
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
        ).toThrow(
            new ClientConfigurationError(
                ClientConfigurationErrorCodes.pkceParamsMissing,
                ""
            )
        );
    });

    it("addResponseTypeForIdToken does add response_type correctly", () => {
        const parameters = new Map<string, string>();
        RequestParameterBuilder.addResponseType(
            parameters,
            Constants.OAuthResponseType.IDTOKEN_TOKEN
        );
        const requestQueryString = UrlUtils.mapToQueryString(parameters);
        expect(
            requestQueryString.includes(
                `${AADServerParamKeys.RESPONSE_TYPE}=${encodeURIComponent(
                    Constants.OAuthResponseType.IDTOKEN_TOKEN
                )}`
            )
        ).toBe(true);
    });

    it("addClaims sets claims parameter with merged claims when valid claims and capabilities are provided", () => {
        const parameters = new Map<string, string>();
        const claims = JSON.stringify({ userinfo: { given_name: null } });
        RequestParameterBuilder.addClaims(parameters, "", claims, ["CP1"]);

        const claimsParam = parameters.get(AADServerParamKeys.CLAIMS);
        expect(claimsParam).toBeDefined();
        const parsed = JSON.parse(claimsParam!);
        expect(parsed.userinfo.given_name).toBeNull();
        expect(parsed.access_token?.xms_cc?.values).toEqual(["CP1"]);
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
                    `${Constants.HeaderNames.CCS_HEADER}=${encodeURIComponent(
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
                    `${Constants.HeaderNames.CCS_HEADER}=${encodeURIComponent(
                        `UPN:${testUpn}`
                    )}`
                )
            ).toBeTruthy();
        });
    });

    describe("buildMergedClaims tests", () => {
        it("passing just claims returns claims with default idToken claims", () => {
            const testClaims = TEST_CONFIG.CLAIMS;
            const expectedString =
                '{"access_token":{"example_claim":{"values":["example_value"]}},"id_token":{"signin_state":{"essential":false},"login_hint":{"essential":false}}}';
            expect(
                RequestParameterBuilder.buildMergedClaims(testClaims, [])
            ).toBe(expectedString);
        });

        it("passing just clientCapabilities returns clientCapabilities and default idToken claims", () => {
            const clientCapabilities = ["CP1"];
            const expectedString =
                '{"id_token":{"signin_state":{"essential":false},"login_hint":{"essential":false}},"access_token":{"xms_cc":{"values":["CP1"]}}}';
            expect(
                RequestParameterBuilder.buildMergedClaims(
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
                '{"access_token":{"example_claim":{"values":["example_value"]},"xms_cc":{"values":["CP1"]}},"id_token":{"signin_state":{"essential":false},"login_hint":{"essential":false}}}';
            expect(
                RequestParameterBuilder.buildMergedClaims(
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
                '{"id_token":{"example_claim":{"values":["example_value"]},"signin_state":{"essential":false},"login_hint":{"essential":false}},"access_token":{"xms_cc":{"values":["CP1"]}}}';
            expect(
                RequestParameterBuilder.buildMergedClaims(
                    claimsRequest,
                    clientCapabilities
                )
            ).toBe(expectedString);
        });

        it("does not overwrite caller-specified idToken claims", () => {
            const claimsRequest =
                '{"id_token":{"signin_state":{"essential":true}}}';
            const expectedString =
                '{"id_token":{"signin_state":{"essential":true},"login_hint":{"essential":false}}}';
            expect(
                RequestParameterBuilder.buildMergedClaims(claimsRequest, [])
            ).toBe(expectedString);
        });

        it("throws error if claims passed is not stringified JSON object", () => {
            const testClaims = "not-a-valid-JSON-object";
            expect(() =>
                RequestParameterBuilder.buildMergedClaims(testClaims, [])
            ).toThrow(
                new ClientConfigurationError(
                    ClientConfigurationErrorCodes.invalidClaims,
                    ""
                )
            );
        });
    });

    describe("buildMergedClaims claimsToMerge (client-originated claims) tests", () => {
        /*
         * `claimsToMerge` is deep-merged into the base claims with precedence; buildMergedClaims
         * also injects the default idToken claims, so assertions parse the result and check the
         * merged sections rather than exact-matching the whole string.
         */
        it("returns just the base claims when claimsToMerge is empty/whitespace/undefined", () => {
            const base = '{"nsp":{"essential":true}}';
            const fromUndefined = RequestParameterBuilder.buildMergedClaims(
                base,
                [],
                "",
                undefined
            );
            const fromWhitespace = RequestParameterBuilder.buildMergedClaims(
                base,
                [],
                "",
                "   "
            );
            expect(fromWhitespace).toBe(fromUndefined);
            expect(JSON.parse(fromUndefined)).toHaveProperty("nsp");
        });

        it("returns just claimsToMerge when base claims are empty", () => {
            const claimsFromClient = '{"nsp":{"essential":true}}';
            const parsed = JSON.parse(
                RequestParameterBuilder.buildMergedClaims(
                    undefined,
                    [],
                    "",
                    claimsFromClient
                )
            );
            expect(parsed).toHaveProperty("nsp");
        });

        it("merges non-overlapping top-level keys", () => {
            const base = '{"nsp":{"essential":true}}';
            const claimsFromClient =
                '{"userinfo":{"given_name":{"essential":true}}}';
            const parsed = JSON.parse(
                RequestParameterBuilder.buildMergedClaims(
                    base,
                    [],
                    "",
                    claimsFromClient
                )
            );
            expect(parsed).toHaveProperty("nsp");
            expect(parsed).toHaveProperty("userinfo");
        });

        it("lets claimsToMerge win on overlapping keys", () => {
            const base = '{"nsp":{"value":"v1"}}';
            const claimsFromClient = '{"nsp":{"value":"v2"}}';
            const parsed = JSON.parse(
                RequestParameterBuilder.buildMergedClaims(
                    base,
                    [],
                    "",
                    claimsFromClient
                )
            );
            expect(parsed.nsp.value).toBe("v2");
        });

        it("deep-merges a colliding object key, preserving sibling sub-claims", () => {
            const base = '{"access_token":{"nbf":{"essential":true}}}';
            const claimsFromClient =
                '{"access_token":{"xms_az_nwperimid":{"value":"perimid-1"}}}';
            const parsed = JSON.parse(
                RequestParameterBuilder.buildMergedClaims(
                    base,
                    [],
                    "",
                    claimsFromClient
                )
            );
            expect(parsed.access_token.nbf).toEqual({ essential: true });
            expect(parsed.access_token.xms_az_nwperimid).toEqual({
                value: "perimid-1",
            });
        });

        it("deep-merges recursively across multiple nesting levels", () => {
            const base = '{"a":{"b":{"keep":1}}}';
            const claimsFromClient =
                '{"a":{"b":{"add":2}},"c":{"essential":true}}';
            const parsed = JSON.parse(
                RequestParameterBuilder.buildMergedClaims(
                    base,
                    [],
                    "",
                    claimsFromClient
                )
            );
            expect(parsed.a.b).toEqual({ keep: 1, add: 2 });
            expect(parsed.c).toEqual({ essential: true });
        });

        it("replaces arrays and scalars (no element merging) with claimsToMerge winning", () => {
            const base =
                '{"access_token":{"groups":{"values":["a","b"]},"scalar":1}}';
            const claimsFromClient =
                '{"access_token":{"groups":{"values":["c"]},"scalar":2}}';
            const parsed = JSON.parse(
                RequestParameterBuilder.buildMergedClaims(
                    base,
                    [],
                    "",
                    claimsFromClient
                )
            );
            expect(parsed.access_token.groups.values).toEqual(["c"]);
            expect(parsed.access_token.scalar).toBe(2);
        });

        it("appends xms_cc capabilities on top of the merged claims", () => {
            const base = '{"access_token":{"nbf":{"essential":true}}}';
            const claimsFromClient =
                '{"access_token":{"xms_az_nwperimid":{"value":"perimid-1"}}}';
            const parsed = JSON.parse(
                RequestParameterBuilder.buildMergedClaims(
                    base,
                    ["CP1"],
                    "",
                    claimsFromClient
                )
            );
            expect(parsed.access_token.nbf).toEqual({ essential: true });
            expect(parsed.access_token.xms_az_nwperimid).toEqual({
                value: "perimid-1",
            });
            expect(parsed.access_token.xms_cc).toEqual({ values: ["CP1"] });
        });

        it("throws invalidClaims when base claims are invalid JSON", () => {
            const valid = '{"a":1}';
            expect(() =>
                RequestParameterBuilder.buildMergedClaims(
                    "not-json",
                    [],
                    "",
                    valid
                )
            ).toThrow(
                new ClientConfigurationError(
                    ClientConfigurationErrorCodes.invalidClaims,
                    ""
                )
            );
        });

        it("throws invalidClaims when claimsToMerge is invalid JSON", () => {
            const valid = '{"a":1}';
            expect(() =>
                RequestParameterBuilder.buildMergedClaims(
                    valid,
                    [],
                    "",
                    "not-json"
                )
            ).toThrow(
                new ClientConfigurationError(
                    ClientConfigurationErrorCodes.invalidClaims,
                    ""
                )
            );
        });

        it.each(["[]", '"string"', "null", "5"])(
            "throws invalidClaims when claimsToMerge is valid JSON but not an object (%s)",
            (nonObjectJson: string) => {
                const valid = '{"a":1}';
                expect(() =>
                    RequestParameterBuilder.buildMergedClaims(
                        valid,
                        [],
                        "",
                        nonObjectJson
                    )
                ).toThrow(
                    new ClientConfigurationError(
                        ClientConfigurationErrorCodes.invalidClaims,
                        ""
                    )
                );
            }
        );
    });

    describe("addExtraParameters tests", () => {
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

            RequestParameterBuilder.addExtraParameters(parameters, eqp);
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

            RequestParameterBuilder.addExtraParameters(parameters, eqp);
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

            RequestParameterBuilder.addExtraParameters(parameters, eqp);
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

            RequestParameterBuilder.addExtraParameters(parameters, eqp);

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

            RequestParameterBuilder.addExtraParameters(parameters, {
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

    describe("addClaims with skipBrokerClaims tests", () => {
        it("includes clientCapabilities when BROKER_CLIENT_ID is present but skipBrokerClaims is not set", () => {
            const parameters = new Map<string, string>();
            // Add broker params first
            RequestParameterBuilder.addBrokerParameters(
                parameters,
                "broker-client-id",
                "broker-redirect-uri"
            );

            RequestParameterBuilder.addClaims(
                parameters,
                "",
                JSON.stringify({ userinfo: { given_name: null } }),
                ["CP1", "CP2"],
                false
            );

            const claimsParam = parameters.get(AADServerParamKeys.CLAIMS);
            expect(claimsParam).toBeDefined();
            const parsedClaims = JSON.parse(claimsParam!);
            expect(parsedClaims.userinfo).toBeDefined();
            expect(parsedClaims.access_token?.xms_cc?.values).toEqual([
                "CP1",
                "CP2",
            ]);
        });

        it("includes clientCapabilities when BROKER_CLIENT_ID is NOT present", () => {
            const parameters = new Map<string, string>();

            RequestParameterBuilder.addClaims(
                parameters,
                "",
                JSON.stringify({ userinfo: { given_name: null } }),
                ["CP1", "CP2"],
                false
            );

            const claimsParam = parameters.get(AADServerParamKeys.CLAIMS);
            expect(claimsParam).toBeDefined();
            const parsedClaims = JSON.parse(claimsParam!);
            expect(parsedClaims.userinfo).toBeDefined();
            expect(parsedClaims.access_token?.xms_cc?.values).toEqual([
                "CP1",
                "CP2",
            ]);
        });

        it("includes clientCapabilities when skipBrokerClaims is true but BROKER_CLIENT_ID is NOT present", () => {
            const parameters = new Map<string, string>();

            RequestParameterBuilder.addClaims(
                parameters,
                "",
                JSON.stringify({ userinfo: { given_name: null } }),
                ["CP1", "CP2"],
                true
            );

            const claimsParam = parameters.get(AADServerParamKeys.CLAIMS);
            expect(claimsParam).toBeDefined();
            const parsedClaims = JSON.parse(claimsParam!);
            expect(parsedClaims.userinfo).toBeDefined();
            expect(parsedClaims.access_token?.xms_cc?.values).toEqual([
                "CP1",
                "CP2",
            ]);
        });

        it("ignores clientCapabilities when both skipBrokerClaims is true and BROKER_CLIENT_ID is present", () => {
            const parameters = new Map<string, string>();
            // Add broker params first
            RequestParameterBuilder.addBrokerParameters(
                parameters,
                "broker-client-id",
                "broker-redirect-uri"
            );

            RequestParameterBuilder.addClaims(
                parameters,
                "",
                JSON.stringify({ userinfo: { given_name: null } }),
                ["CP1", "CP2"],
                true
            );

            const claimsParam = parameters.get(AADServerParamKeys.CLAIMS);
            expect(claimsParam).toBeDefined();
            const parsedClaims = JSON.parse(claimsParam!);
            expect(parsedClaims.userinfo).toBeDefined();
            expect(parsedClaims.access_token?.xms_cc).toBeUndefined();
        });

        it("adds default id token claims parameter when claims and clientCapabilities are both empty", () => {
            const parameters = new Map<string, string>();

            RequestParameterBuilder.addClaims(
                parameters,
                "",
                undefined,
                undefined,
                false
            );

            expect(parameters.get(AADServerParamKeys.CLAIMS)).toBe(
                DEFAULT_OPTIONAL_ID_TOKEN_CLAIMS
            );
        });

        it("adds claims when only clientCapabilities are provided", () => {
            const parameters = new Map<string, string>();

            RequestParameterBuilder.addClaims(
                parameters,
                "",
                undefined,
                ["CP1"],
                false
            );

            const claimsParam = parameters.get(AADServerParamKeys.CLAIMS);
            expect(claimsParam).toBeDefined();
            expect(claimsParam).toBe(
                DEFAULT_OPTIONAL_ID_TOKEN_CLAIMS_WITH_CLIENT_CAPABILITIES
            );
        });
    });

    describe("addAttributeTokens", () => {
        it("emits sorted, space-joined attribute_tokens when provided", () => {
            const parameters = new Map<string, string>();
            RequestParameterBuilder.addAttributeTokens(parameters, [
                "zeta",
                "alpha",
                "mike",
            ]);
            expect(parameters.get(AADServerParamKeys.ATTRIBUTE_TOKENS)).toBe(
                "alpha mike zeta"
            );
        });

        it("deletes attribute_tokens when passed an empty array", () => {
            const parameters = new Map<string, string>();
            parameters.set(AADServerParamKeys.ATTRIBUTE_TOKENS, "keep");
            RequestParameterBuilder.addAttributeTokens(parameters, []);
            expect(parameters.has(AADServerParamKeys.ATTRIBUTE_TOKENS)).toBe(
                false
            );
        });

        it("preserves caller-provided values (including spacing/duplicates) after sorting", () => {
            const parameters = new Map<string, string>();
            RequestParameterBuilder.addAttributeTokens(parameters, [
                "b",
                "a",
                "a",
                " c ",
            ]);
            expect(parameters.get(AADServerParamKeys.ATTRIBUTE_TOKENS)).toBe(
                " c  a a b"
            );
        });

        it("does not mutate the caller-provided array", () => {
            const parameters = new Map<string, string>();
            const input = ["c", "a", "b"];
            RequestParameterBuilder.addAttributeTokens(parameters, input);
            expect(input).toEqual(["c", "a", "b"]);
        });
    });
});
