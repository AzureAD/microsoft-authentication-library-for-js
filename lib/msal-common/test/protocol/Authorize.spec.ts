import { Authority } from "../../src/authority/Authority.js";
import {
    AuthOptions,
} from "../../src/config/ClientConfiguration.js";
import { CommonAuthorizationUrlRequest } from "../../src/request/CommonAuthorizationUrlRequest.js";
import {
    AuthenticationScheme,
    Constants,
    HeaderNames,
    PromptValue,
    ResponseMode,
} from "../../src/utils/Constants.js";
import {
    getDiscoveredAuthority,
} from "../client/ClientTestUtils.js";
import {
    DEFAULT_OPENID_CONFIG_RESPONSE,
    RANDOM_TEST_GUID,
    TEST_ACCOUNT_INFO,
    TEST_CONFIG,
    TEST_DATA_CLIENT_INFO,
    TEST_URIS,
} from "../test_kit/StringConstants.js";
import * as AADServerParamKeys from "../../src/constants/AADServerParamKeys.js";
import * as AuthorizeProtocol from "../../src/protocol/Authorize.js";
import * as UrlUtils from "../../src/utils/UrlUtils.js";
import { MockPerformanceClient } from "../telemetry/PerformanceClient.spec.js";
import { TokenClaims } from "../../src/account/TokenClaims.js";
import { Logger } from "../../src/logger/Logger.js";

describe("Authorize Protocol Tests", () => {
    let authOptions: AuthOptions;
    let authority: Authority;

    beforeEach(async () => {
        jest.spyOn(
            Authority.prototype,
            <any>"getEndpointMetadataFromNetwork"
        ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        authority = await getDiscoveredAuthority();
        authOptions = {
            clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            authority: authority,
            redirectUri: "https://localhost",
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
    describe("Authorization url creation", () => {
        it("Creates an authorization url with default parameters", async () => {
            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.QUERY,
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
            };
            const params =
                AuthorizeProtocol.getStandardAuthorizeRequestParameters(
                    authOptions,
                    authCodeUrlRequest,
                    new Logger({})
                );
            const loginUrl = AuthorizeProtocol.getAuthorizeUrl(
                authority,
                params
            );
            expect(loginUrl.includes(Constants.DEFAULT_AUTHORITY)).toBe(true);
            expect(
                loginUrl.includes(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace(
                        "{tenant}",
                        "common"
                    )
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(
                        TEST_URIS.TEST_REDIRECT_URI_LOCALHOST
                    )}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.RESPONSE_MODE}=${encodeURIComponent(
                        ResponseMode.QUERY
                    )}`
                )
            ).toBe(true);
        });

        it("Creates an authorization url passing in optional parameters", async () => {
            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
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
            };
            const params =
                AuthorizeProtocol.getStandardAuthorizeRequestParameters(
                    authOptions,
                    authCodeUrlRequest,
                    new Logger({})
                );
            const loginUrl = AuthorizeProtocol.getAuthorizeUrl(
                authority,
                params
            );
            expect(loginUrl.includes(TEST_CONFIG.validAuthority)).toBe(true);
            expect(
                loginUrl.includes(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace(
                        "{tenant}",
                        "common"
                    )
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.SCOPE}=${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(
                        TEST_URIS.TEST_REDIRECT_URI_LOCALHOST
                    )}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.RESPONSE_MODE}=${encodeURIComponent(
                        ResponseMode.FORM_POST
                    )}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.STATE}=${encodeURIComponent(
                        TEST_CONFIG.STATE
                    )}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.PROMPT}=${PromptValue.LOGIN}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.NONCE}=${encodeURIComponent(
                        TEST_CONFIG.NONCE
                    )}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.LOGIN_HINT}=${encodeURIComponent(
                        TEST_CONFIG.LOGIN_HINT
                    )}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.DOMAIN_HINT}=${encodeURIComponent(
                        TEST_CONFIG.DOMAIN_HINT
                    )}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.CLAIMS}=${encodeURIComponent(
                        TEST_CONFIG.CLAIMS
                    )}`
                )
            ).toBe(true);
        });

        it("Adds CCS entry if loginHint is provided", async () => {
            const mockPerfClient = new MockPerformanceClient();
            let resEvents;
            mockPerfClient.addPerformanceCallback((events) => {
                resEvents = events;
            });

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                loginHint: TEST_CONFIG.LOGIN_HINT,
                prompt: PromptValue.LOGIN,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
            };
            const rootMeasurement = mockPerfClient.startMeasurement(
                "root-measurement",
                authCodeUrlRequest.correlationId
            );
            const params =
                AuthorizeProtocol.getStandardAuthorizeRequestParameters(
                    authOptions,
                    authCodeUrlRequest,
                    new Logger({}),
                    mockPerfClient
                );
            const loginUrl = AuthorizeProtocol.getAuthorizeUrl(
                authority,
                params
            );
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.LOGIN_HINT}=${encodeURIComponent(
                        TEST_CONFIG.LOGIN_HINT
                    )}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${HeaderNames.CCS_HEADER}=${encodeURIComponent(
                        `UPN:${TEST_CONFIG.LOGIN_HINT}`
                    )}`
                )
            ).toBe(true);
            rootMeasurement.end({ success: true });
            // @ts-ignore
            const event = resEvents[0];
            expect(event.loginHintFromRequest).toBeTruthy();
            expect(event.loginHintFromUpn).toBeFalsy();
            expect(event.loginHintFromClaim).toBeFalsy();
        });

        it("Adds CCS entry if account is provided", async () => {
            const testAccount = TEST_ACCOUNT_INFO;
            // @ts-ignore
            const testTokenClaims: Required<
                Omit<
                    TokenClaims,
                    | "home_oid"
                    | "upn"
                    | "cloud_instance_host_name"
                    | "cnf"
                    | "emails"
                    | "login_hint"
                >
            > = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                sid: "testSid",
            };

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                account: {
                    ...testAccount,
                    idTokenClaims: testTokenClaims,
                },
                prompt: PromptValue.NONE,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
            };
            const params =
                AuthorizeProtocol.getStandardAuthorizeRequestParameters(
                    authOptions,
                    authCodeUrlRequest,
                    new Logger({})
                );
            const loginUrl = AuthorizeProtocol.getAuthorizeUrl(
                authority,
                params
            );
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.SID}=${encodeURIComponent(
                        testTokenClaims.sid
                    )}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${HeaderNames.CCS_HEADER}=${encodeURIComponent(
                        `Oid:${TEST_DATA_CLIENT_INFO.TEST_UID}@${TEST_DATA_CLIENT_INFO.TEST_UTID}`
                    )}`
                )
            ).toBe(true);
        });

        it("prefers login_hint claim over sid/upn if both provided", async () => {
            const mockPerfClient = new MockPerformanceClient();
            let resEvents;
            mockPerfClient.addPerformanceCallback((events) => {
                resEvents = events;
            });
            const testAccount = TEST_ACCOUNT_INFO;
            // @ts-ignore
            const testTokenClaims: Required<
                Omit<
                    TokenClaims,
                    | "home_oid"
                    | "upn"
                    | "cloud_instance_host_name"
                    | "cnf"
                    | "emails"
                >
            > = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                sid: "testSid",
                login_hint: "opaque-login-hint-claim",
            };

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                account: {
                    ...testAccount,
                    idTokenClaims: testTokenClaims,
                },
                prompt: PromptValue.NONE,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
            };
            const rootMeasurement = mockPerfClient.startMeasurement(
                "root-measurement",
                authCodeUrlRequest.correlationId
            );
            const params =
                AuthorizeProtocol.getStandardAuthorizeRequestParameters(
                    authOptions,
                    authCodeUrlRequest,
                    new Logger({}),
                    mockPerfClient
                );
            const loginUrl = AuthorizeProtocol.getAuthorizeUrl(
                authority,
                params
            );
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.SID}=${encodeURIComponent(
                        testTokenClaims.sid
                    )}`
                )
            ).toBe(false);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.LOGIN_HINT}=${encodeURIComponent(
                        testTokenClaims.login_hint
                    )}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${HeaderNames.CCS_HEADER}=${encodeURIComponent(
                        `Oid:${TEST_DATA_CLIENT_INFO.TEST_UID}@${TEST_DATA_CLIENT_INFO.TEST_UTID}`
                    )}`
                )
            ).toBe(true);

            rootMeasurement.end({ success: true });
            // @ts-ignore
            const event = resEvents[0];
            expect(event.loginHintFromUpn).toBeFalsy();
            expect(event.loginHintFromClaim).toBeTruthy();
            expect(event.loginHintFromRequest).toBeFalsy();
            expect(event.domainHintFromRequest).toBeFalsy();
            expect(event.sidFromClaim).toBeFalsy();
            expect(event.sidFromRequest).toBeFalsy();
        });

        it("skips login_hint claim if domainHint param is set", async () => {
            const mockPerfClient = new MockPerformanceClient();
            let resEvents;
            mockPerfClient.addPerformanceCallback((events) => {
                resEvents = events;
            });
            const testAccount = TEST_ACCOUNT_INFO;
            // @ts-ignore
            const testTokenClaims: Required<
                Omit<
                    TokenClaims,
                    | "home_oid"
                    | "upn"
                    | "cloud_instance_host_name"
                    | "cnf"
                    | "emails"
                >
            > = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                sid: "testSid",
                login_hint: "opaque-login-hint-claim",
            };

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                account: {
                    ...testAccount,
                    idTokenClaims: testTokenClaims,
                },
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
                domainHint: TEST_CONFIG.DOMAIN_HINT,
            };
            const rootMeasurement = mockPerfClient.startMeasurement(
                "root-measurement",
                authCodeUrlRequest.correlationId
            );
            const params =
                AuthorizeProtocol.getStandardAuthorizeRequestParameters(
                    authOptions,
                    authCodeUrlRequest,
                    new Logger({}),
                    mockPerfClient
                );
            const loginUrl = AuthorizeProtocol.getAuthorizeUrl(
                authority,
                params
            );
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.SID}=${encodeURIComponent(
                        testTokenClaims.sid
                    )}`
                )
            ).toBe(false);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.LOGIN_HINT}=${encodeURIComponent(
                        testAccount.username
                    )}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.DOMAIN_HINT}=${encodeURIComponent(
                        TEST_CONFIG.DOMAIN_HINT
                    )}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${HeaderNames.CCS_HEADER}=${encodeURIComponent(
                        `Oid:${TEST_DATA_CLIENT_INFO.TEST_UID}@${TEST_DATA_CLIENT_INFO.TEST_UTID}`
                    )}`
                )
            ).toBe(true);

            rootMeasurement.end({ success: true });
            // @ts-ignore
            const event = resEvents[0];
            expect(event.loginHintFromUpn).toBeTruthy();
            expect(event.loginHintFromClaim).toBeFalsy();
            expect(event.loginHintFromRequest).toBeFalsy();
            expect(event.domainHintFromRequest).toBeTruthy();
            expect(event.sidFromClaim).toBeFalsy();
            expect(event.sidFromRequest).toBeFalsy();
        });

        it("picks up both loginHint and domainHint params", async () => {
            const testAccount = TEST_ACCOUNT_INFO;
            // @ts-ignore
            const testTokenClaims: Required<
                Omit<
                    TokenClaims,
                    | "home_oid"
                    | "upn"
                    | "cloud_instance_host_name"
                    | "cnf"
                    | "emails"
                >
            > = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                sid: "testSid",
                login_hint: "opaque-login-hint-claim",
            };

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                account: {
                    ...testAccount,
                    idTokenClaims: testTokenClaims,
                },
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
                domainHint: TEST_CONFIG.DOMAIN_HINT,
                loginHint: TEST_CONFIG.LOGIN_HINT,
            };
            const params =
                AuthorizeProtocol.getStandardAuthorizeRequestParameters(
                    authOptions,
                    authCodeUrlRequest,
                    new Logger({})
                );
            const loginUrl = AuthorizeProtocol.getAuthorizeUrl(
                authority,
                params
            );
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.SID}=${encodeURIComponent(
                        testTokenClaims.sid
                    )}`
                )
            ).toBe(false);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.LOGIN_HINT}=${encodeURIComponent(
                        TEST_CONFIG.LOGIN_HINT
                    )}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.DOMAIN_HINT}=${encodeURIComponent(
                        TEST_CONFIG.DOMAIN_HINT
                    )}`
                )
            ).toBe(true);
        });

        it("Prefers sid over loginHint if both provided and prompt=None", async () => {
            const mockPerfClient = new MockPerformanceClient();
            let resEvents;
            mockPerfClient.addPerformanceCallback((events) => {
                resEvents = events;
            });

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                loginHint: TEST_CONFIG.LOGIN_HINT,
                prompt: PromptValue.NONE,
                sid: TEST_CONFIG.SID,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
            };
            const rootMeasurement = mockPerfClient.startMeasurement(
                "root-measurement",
                authCodeUrlRequest.correlationId
            );
            const params =
                AuthorizeProtocol.getStandardAuthorizeRequestParameters(
                    authOptions,
                    authCodeUrlRequest,
                    new Logger({}),
                    mockPerfClient
                );
            const loginUrl = AuthorizeProtocol.getAuthorizeUrl(
                authority,
                params
            );
            expect(loginUrl).toEqual(
                expect.not.arrayContaining([
                    `${AADServerParamKeys.LOGIN_HINT}=`,
                ])
            );
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.SID}=${encodeURIComponent(
                        TEST_CONFIG.SID
                    )}`
                )
            ).toBe(true);

            rootMeasurement.end({ success: true });
            // @ts-ignore
            const event = resEvents[0];
            expect(event.loginHintFromRequest).toBeFalsy();
            expect(event.loginHintFromClaim).toBeFalsy();
            expect(event.loginHintFromUpn).toBeFalsy();
            expect(event.domainHintFromRequest).toBeFalsy();
            expect(event.sidFromRequest).toBeTruthy();
            expect(event.prompt).toEqual(PromptValue.NONE);
        });

        it("Prefers loginHint over sid if both provided and prompt!=None", async () => {
            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                loginHint: TEST_CONFIG.LOGIN_HINT,
                prompt: PromptValue.LOGIN,
                sid: TEST_CONFIG.SID,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
            };
            const params =
                AuthorizeProtocol.getStandardAuthorizeRequestParameters(
                    authOptions,
                    authCodeUrlRequest,
                    new Logger({})
                );
            const loginUrl = AuthorizeProtocol.getAuthorizeUrl(
                authority,
                params
            );
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.LOGIN_HINT}=${encodeURIComponent(
                        TEST_CONFIG.LOGIN_HINT
                    )}`
                )
            ).toBe(true);
            expect(loginUrl.includes(`${AADServerParamKeys.SID}=`)).toBe(false);
        });

        it("Ignores sid if prompt!=None", async () => {
            const mockPerfClient = new MockPerformanceClient();
            let resEvents;
            mockPerfClient.addPerformanceCallback((events) => {
                resEvents = events;
            });

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                prompt: PromptValue.LOGIN,
                sid: TEST_CONFIG.SID,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
            };
            const rootMeasurement = mockPerfClient.startMeasurement(
                "root-measurement",
                authCodeUrlRequest.correlationId
            );
            const params =
                AuthorizeProtocol.getStandardAuthorizeRequestParameters(
                    authOptions,
                    authCodeUrlRequest,
                    new Logger({}),
                    mockPerfClient
                );
            const loginUrl = AuthorizeProtocol.getAuthorizeUrl(
                authority,
                params
            );
            expect(loginUrl.includes(`${AADServerParamKeys.LOGIN_HINT}=`)).toBe(
                false
            );
            expect(loginUrl.includes(`${AADServerParamKeys.SID}=`)).toBe(false);

            rootMeasurement.end({ success: true });
            // @ts-ignore
            const event = resEvents[0];
            expect(event.loginHintFromUpn).toBeFalsy();
            expect(event.loginHintFromClaim).toBeFalsy();
            expect(event.loginHintFromRequest).toBeFalsy();
            expect(event.domainHintFromRequest).toBeFalsy();
            expect(event.sidFromClaim).toBeFalsy();
            expect(event.sidFromRequest).toBeFalsy();
            expect(event.prompt).toEqual(PromptValue.LOGIN);
        });

        it("Prefers loginHint over Account if both provided and account does not have token claims", async () => {
            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                loginHint: TEST_CONFIG.LOGIN_HINT,
                account: TEST_ACCOUNT_INFO,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
            };
            const params =
                AuthorizeProtocol.getStandardAuthorizeRequestParameters(
                    authOptions,
                    authCodeUrlRequest,
                    new Logger({})
                );
            const loginUrl = AuthorizeProtocol.getAuthorizeUrl(
                authority,
                params
            );
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.LOGIN_HINT}=${encodeURIComponent(
                        TEST_CONFIG.LOGIN_HINT
                    )}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.LOGIN_HINT}=${encodeURIComponent(
                        TEST_ACCOUNT_INFO.username
                    )}`
                )
            ).toBe(false);
            expect(loginUrl.includes(`${AADServerParamKeys.SID}=`)).toBe(false);
        });

        it("Uses sid from account if not provided in request and prompt=None, overrides login_hint", async () => {
            const testAccount = TEST_ACCOUNT_INFO;
            // @ts-ignore
            const testTokenClaims: Required<
                Omit<
                    TokenClaims,
                    | "home_oid"
                    | "upn"
                    | "cloud_instance_host_name"
                    | "cnf"
                    | "emails"
                >
            > = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                sid: "testSid",
            };

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                account: {
                    ...testAccount,
                    idTokenClaims: testTokenClaims,
                },
                loginHint: TEST_CONFIG.LOGIN_HINT,
                prompt: PromptValue.NONE,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
            };
            const params =
                AuthorizeProtocol.getStandardAuthorizeRequestParameters(
                    authOptions,
                    authCodeUrlRequest,
                    new Logger({})
                );
            const loginUrl = AuthorizeProtocol.getAuthorizeUrl(
                authority,
                params
            );
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.SID}=${encodeURIComponent(
                        testTokenClaims.sid
                    )}`
                )
            ).toBe(true);
            expect(loginUrl.includes(`${AADServerParamKeys.LOGIN_HINT}=`)).toBe(
                false
            );
        });

        it("Uses loginHint instead of sid from account prompt!=None", async () => {
            const testAccount = TEST_ACCOUNT_INFO;
            const testTokenClaims: Required<
                Omit<
                    TokenClaims,
                    | "home_oid"
                    | "upn"
                    | "cloud_instance_host_name"
                    | "cnf"
                    | "emails"
                    | "iat"
                    | "x5c_ca"
                    | "ts"
                    | "at"
                    | "u"
                    | "p"
                    | "m"
                    | "login_hint"
                    | "aud"
                    | "nbf"
                    | "roles"
                    | "amr"
                    | "idp"
                    | "auth_time"
                    | "tfp"
                    | "acr"
                >
            > = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                sid: "testSid",
                tenant_region_scope: "test_tenant_region_scope",
                tenant_region_sub_scope: "test_tenant_region_sub_scope",
            };

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                account: {
                    ...testAccount,
                    idTokenClaims: testTokenClaims,
                },
                loginHint: TEST_CONFIG.LOGIN_HINT,
                prompt: PromptValue.LOGIN,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
            };
            const params =
                AuthorizeProtocol.getStandardAuthorizeRequestParameters(
                    authOptions,
                    authCodeUrlRequest,
                    new Logger({})
                );
            const loginUrl = AuthorizeProtocol.getAuthorizeUrl(
                authority,
                params
            );
            expect(loginUrl.includes(`${AADServerParamKeys.SID}=`)).toBe(false);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.LOGIN_HINT}=${encodeURIComponent(
                        TEST_CONFIG.LOGIN_HINT
                    )}`
                )
            ).toBe(true);
        });

        it("Uses login_hint instead of username if sid is not present in token claims for account or request", async () => {
            const testAccount = TEST_ACCOUNT_INFO;
            const testTokenClaims: Required<
                Omit<
                    TokenClaims,
                    | "home_oid"
                    | "upn"
                    | "cloud_instance_host_name"
                    | "cnf"
                    | "emails"
                    | "sid"
                    | "iat"
                    | "x5c_ca"
                    | "ts"
                    | "at"
                    | "u"
                    | "p"
                    | "m"
                    | "login_hint"
                    | "aud"
                    | "nbf"
                    | "roles"
                    | "amr"
                    | "idp"
                    | "auth_time"
                    | "tfp"
                    | "acr"
                >
            > = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                tenant_region_scope: "test_tenant_region_scope",
                tenant_region_sub_scope: "test_tenant_region_sub_scope",
            };

            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                account: {
                    ...testAccount,
                    idTokenClaims: testTokenClaims,
                },
                loginHint: TEST_CONFIG.LOGIN_HINT,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
            };
            const params =
                AuthorizeProtocol.getStandardAuthorizeRequestParameters(
                    authOptions,
                    authCodeUrlRequest,
                    new Logger({})
                );
            const loginUrl = AuthorizeProtocol.getAuthorizeUrl(
                authority,
                params
            );
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.LOGIN_HINT}=${encodeURIComponent(
                        TEST_CONFIG.LOGIN_HINT
                    )}`
                )
            ).toBe(true);
            expect(loginUrl.includes(`${AADServerParamKeys.SID}=`)).toBe(false);
        });

        it("Sets login_hint to Account.username if login_hint and sid are not provided", async () => {
            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                account: TEST_ACCOUNT_INFO,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
            };
            const params =
                AuthorizeProtocol.getStandardAuthorizeRequestParameters(
                    authOptions,
                    authCodeUrlRequest,
                    new Logger({})
                );
            const loginUrl = AuthorizeProtocol.getAuthorizeUrl(
                authority,
                params
            );
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.LOGIN_HINT}=${encodeURIComponent(
                        TEST_ACCOUNT_INFO.username
                    )}`
                )
            ).toBe(true);
            expect(loginUrl.includes(`${AADServerParamKeys.SID}=`)).toBe(false);
        });

        it("Ignores Account if prompt is select_account", async () => {
            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                account: TEST_ACCOUNT_INFO,
                prompt: "select_account",
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
            };
            const params =
                AuthorizeProtocol.getStandardAuthorizeRequestParameters(
                    authOptions,
                    authCodeUrlRequest,
                    new Logger({})
                );
            const loginUrl = AuthorizeProtocol.getAuthorizeUrl(
                authority,
                params
            );
            expect(loginUrl.includes(`${AADServerParamKeys.LOGIN_HINT}=`)).toBe(
                false
            );
            expect(loginUrl.includes(`${AADServerParamKeys.SID}=`)).toBe(false);
        });

        it("Ignores loginHint if prompt is select_account", async () => {
            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                loginHint: "testaccount@microsoft.com",
                prompt: "select_account",
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
            };
            const params =
                AuthorizeProtocol.getStandardAuthorizeRequestParameters(
                    authOptions,
                    authCodeUrlRequest,
                    new Logger({})
                );
            const loginUrl = AuthorizeProtocol.getAuthorizeUrl(
                authority,
                params
            );
            expect(loginUrl.includes(`${AADServerParamKeys.LOGIN_HINT}=`)).toBe(
                false
            );
            expect(loginUrl.includes(`${AADServerParamKeys.SID}=`)).toBe(false);
        });

        it("Ignores sid if prompt is select_account", async () => {
            const authCodeUrlRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                sid: "testsid",
                prompt: "select_account",
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                responseMode: ResponseMode.FRAGMENT,
            };
            const params =
                AuthorizeProtocol.getStandardAuthorizeRequestParameters(
                    authOptions,
                    authCodeUrlRequest,
                    new Logger({})
                );
            const loginUrl = AuthorizeProtocol.getAuthorizeUrl(
                authority,
                params
            );
            expect(loginUrl.includes(`${AADServerParamKeys.LOGIN_HINT}=`)).toBe(
                false
            );
            expect(loginUrl.includes(`${AADServerParamKeys.SID}=`)).toBe(false);
        });

        it("Creates a login URL with scopes from given token request", async () => {
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
            };

            const params =
                AuthorizeProtocol.getStandardAuthorizeRequestParameters(
                    authOptions,
                    loginRequest,
                    new Logger({})
                );
            const loginUrl = AuthorizeProtocol.getAuthorizeUrl(
                authority,
                params
            );
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.SCOPE}=${encodeURIComponent(
                        `${testScope1} ${testScope2}`
                    )}`
                )
            ).toBe(true);
        });
    });

    describe("createAuthCodeUrlQueryString tests", () => {
        it("pick up default client_id", async () => {
            const request: CommonAuthorizationUrlRequest = {
                    scopes: ["User.Read"],
                    authority: TEST_CONFIG.validAuthority,
                    correlationId: RANDOM_TEST_GUID,
                    responseMode: ResponseMode.FRAGMENT,
                    prompt: PromptValue.LOGIN,
                    redirectUri: "localhost",
                }

            const params = AuthorizeProtocol.getStandardAuthorizeRequestParameters(authOptions, request, new Logger({}))
            const queryString = UrlUtils.mapToQueryString(params);

            expect(queryString).toContain(
                `client_id=${TEST_CONFIG.MSAL_CLIENT_ID}`
            );
        });

        it("pick up extra query client_id param", async () => {
            const request: CommonAuthorizationUrlRequest = {
                    scopes: ["User.Read"],
                    authority: TEST_CONFIG.validAuthority,
                    correlationId: RANDOM_TEST_GUID,
                    responseMode: ResponseMode.FRAGMENT,
                    prompt: PromptValue.LOGIN,
                    redirectUri: "localhost",
                    extraQueryParameters: {
                        client_id: "child_client_id",
                    },
                }
                const params = AuthorizeProtocol.getStandardAuthorizeRequestParameters(authOptions, request, new Logger({}))
            const queryString = UrlUtils.mapToQueryString(params);

            expect(queryString).toContain(`client_id=child_client_id`);
        });

        it("pick up instance_aware config param when set to true", async () => {
            authOptions.instanceAware = true;

            const request: CommonAuthorizationUrlRequest = {
                    scopes: ["User.Read"],
                    authority: TEST_CONFIG.validAuthority,
                    correlationId: RANDOM_TEST_GUID,
                    responseMode: ResponseMode.FRAGMENT,
                    prompt: PromptValue.LOGIN,
                    redirectUri: "localhost",
                }

                const params = AuthorizeProtocol.getStandardAuthorizeRequestParameters(authOptions, request, new Logger({}))
            const queryString = UrlUtils.mapToQueryString(params);

            expect(queryString).toContain(`instance_aware=true`);
        });

        it("do not pick up instance_aware config param when set to false", async () => {
            authOptions.instanceAware = false;

            const request: CommonAuthorizationUrlRequest ={
                    scopes: ["User.Read"],
                    authority: TEST_CONFIG.validAuthority,
                    correlationId: RANDOM_TEST_GUID,
                    responseMode: ResponseMode.FRAGMENT,
                    prompt: PromptValue.LOGIN,
                    redirectUri: "localhost",
                }
                const params = AuthorizeProtocol.getStandardAuthorizeRequestParameters(authOptions, request, new Logger({}))
            const queryString = UrlUtils.mapToQueryString(params);

            expect(queryString.includes("instance_aware")).toBeFalsy();
        });

        it("pick up instance_aware EQ param when config is set to false", async () => {
            authOptions.instanceAware = false;

            const request: CommonAuthorizationUrlRequest ={
                    scopes: ["User.Read"],
                    authority: TEST_CONFIG.validAuthority,
                    correlationId: RANDOM_TEST_GUID,
                    responseMode: ResponseMode.FRAGMENT,
                    prompt: PromptValue.LOGIN,
                    redirectUri: "localhost",
                    extraQueryParameters: {
                        instance_aware: "true",
                    },
                }
                const params = AuthorizeProtocol.getStandardAuthorizeRequestParameters(authOptions, request, new Logger({}))
            const queryString = UrlUtils.mapToQueryString(params);

            expect(queryString).toContain(`instance_aware=true`);
        });

        it("pick up instance_aware EQ param when config is set to true", async () => {
            authOptions.instanceAware = true;

            const request: CommonAuthorizationUrlRequest ={
                    scopes: ["User.Read"],
                    authority: TEST_CONFIG.validAuthority,
                    correlationId: RANDOM_TEST_GUID,
                    responseMode: ResponseMode.FRAGMENT,
                    prompt: PromptValue.LOGIN,
                    redirectUri: "localhost",
                    extraQueryParameters: {
                        instance_aware: "false",
                    },
                }

                const params = AuthorizeProtocol.getStandardAuthorizeRequestParameters(authOptions, request, new Logger({}))
            const queryString = UrlUtils.mapToQueryString(params);

            expect(queryString).toContain(`instance_aware=false`);
        });

        it("pick up broker params", async () => {
            const request: CommonAuthorizationUrlRequest = {
                    scopes: ["User.Read"],
                    authority: TEST_CONFIG.validAuthority,
                    correlationId: RANDOM_TEST_GUID,
                    responseMode: ResponseMode.FRAGMENT,
                    redirectUri: "localhost",
                    embeddedClientId: "child_client_id_1",
                };

            const params = AuthorizeProtocol.getStandardAuthorizeRequestParameters(authOptions, request, new Logger({}))
            const queryString = UrlUtils.mapToQueryString(params);
            expect(queryString).toContain(`client_id=child_client_id_1`);
            expect(queryString).toContain(
                `brk_client_id=${TEST_CONFIG.MSAL_CLIENT_ID}`
            );
            expect(queryString).toContain(
                `brk_redirect_uri=${encodeURIComponent("https://localhost")}`
            );
        });

        it("broker params take precedence over extra query params", async () => {
            const request: CommonAuthorizationUrlRequest = {
                    scopes: ["User.Read"],
                    authority: TEST_CONFIG.validAuthority,
                    correlationId: RANDOM_TEST_GUID,
                    responseMode: ResponseMode.FRAGMENT,
                    redirectUri: "localhost",
                    embeddedClientId: "child_client_id_1",
                    extraQueryParameters: {
                        client_id: "child_client_id_2",
                        brk_client_id: "broker_client_id_2",
                        brk_redirect_uri: "broker_redirect_uri_2",
                    }
                };

            const params = AuthorizeProtocol.getStandardAuthorizeRequestParameters(authOptions, request, new Logger({}))
            const queryString = UrlUtils.mapToQueryString(params);
            expect(queryString).toContain(`client_id=child_client_id_1`);
            expect(queryString).toContain(
                `brk_client_id=${TEST_CONFIG.MSAL_CLIENT_ID}`
            );
            expect(queryString).toContain(
                `brk_redirect_uri=${encodeURIComponent("https://localhost")}`
            );
        });
    });
});
