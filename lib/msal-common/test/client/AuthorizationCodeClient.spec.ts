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
    CORS_SIMPLE_REQUEST_HEADERS,
    TEST_SSH_VALUES,
    AUTHENTICATION_RESULT_WITH_HEADERS,
    CORS_RESPONSE_HEADERS,
} from "../test_kit/StringConstants.js";
import { ClientConfiguration } from "../../src/config/ClientConfiguration.js";
import { BaseClient } from "../../src/client/BaseClient.js";
import {
    PromptValue,
    ResponseMode,
    AuthenticationScheme,
    ThrottlingConstants,
    Constants,
    HeaderNames,
    ONE_DAY_IN_MS,
} from "../../src/utils/Constants.js";
import * as AADServerParamKeys from "../../src/constants/AADServerParamKeys.js";
import { ClientTestUtils, MockStorageClass } from "./ClientTestUtils.js";
import { TestError } from "../test_kit/TestErrors.js";
import { Authority } from "../../src/authority/Authority.js";
import { AuthorizationCodeClient } from "../../src/client/AuthorizationCodeClient.js";
import { CommonAuthorizationUrlRequest } from "../../src/request/CommonAuthorizationUrlRequest.js";
import { TokenClaims } from "../../src/account/TokenClaims.js";
import { ServerError } from "../../src/error/ServerError.js";
import { CommonAuthorizationCodeRequest } from "../../src/request/CommonAuthorizationCodeRequest.js";
import * as AuthToken from "../../src/account/AuthToken.js";
import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../../src/error/ClientAuthError.js";
import {
    AuthError,
    CcsCredentialType,
    ClientConfigurationErrorCodes,
    createClientConfigurationError,
} from "../../src/index.js";
import { ProtocolMode } from "../../src/authority/ProtocolMode.js";

describe("AuthorizationCodeClient unit tests", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("Constructor", () => {
        it("creates a AuthorizationCodeClient that extends BaseClient", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);
            expect(client).not.toBeNull();
            expect(client instanceof AuthorizationCodeClient).toBe(true);
            expect(client instanceof BaseClient).toBe(true);
        });
    });

    describe("Authorization url creation", () => {
        it("Creates an authorization url with default parameters", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
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
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
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
                    `${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`
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
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.CODE_CHALLENGE}=${encodeURIComponent(
                        TEST_CONFIG.TEST_CHALLENGE
                    )}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${
                        AADServerParamKeys.CODE_CHALLENGE_METHOD
                    }=${encodeURIComponent(
                        Constants.S256_CODE_CHALLENGE_METHOD
                    )}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`
                )
            ).toBe(true);
        });

        it("Creates an authorization url passing in optional parameters", async () => {
            // Override with alternate authority openid_config
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

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
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
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
                    `${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`
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
                    `${AADServerParamKeys.CODE_CHALLENGE}=${encodeURIComponent(
                        TEST_CONFIG.TEST_CHALLENGE
                    )}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${
                        AADServerParamKeys.CODE_CHALLENGE_METHOD
                    }=${encodeURIComponent(TEST_CONFIG.CODE_CHALLENGE_METHOD)}`
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
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`
                )
            ).toBe(true);
        });

        it("Adds CCS entry if loginHint is provided", async () => {
            // Override with alternate authority openid_config
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

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
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
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
        });

        it("Adds CCS entry if account is provided", async () => {
            // Override with alternate authority openid_config
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);
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
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
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
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);
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
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
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
        });

        it("skips login_hint claim if domainHint param is set", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);
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
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
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
        });

        it("picks up both loginHint and domainHint params", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);
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
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
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
            // Override with alternate authority openid_config
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

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
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
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
        });

        it("Prefers loginHint over sid if both provided and prompt!=None", async () => {
            // Override with alternate authority openid_config
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

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
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
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
            // Override with alternate authority openid_config
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

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
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl.includes(`${AADServerParamKeys.LOGIN_HINT}=`)).toBe(
                false
            );
            expect(loginUrl.includes(`${AADServerParamKeys.SID}=`)).toBe(false);
        });

        it("Prefers loginHint over Account if both provided and account does not have token claims", async () => {
            // Override with alternate authority openid_config
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

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
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
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
            // Override with alternate authority openid_config
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);
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
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
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
            // Override with alternate authority openid_config
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);
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
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
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
            // Override with alternate authority openid_config
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);
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
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
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
            // Override with alternate authority openid_config
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

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
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
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
            // Override with alternate authority openid_config
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

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
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl.includes(`${AADServerParamKeys.LOGIN_HINT}=`)).toBe(
                false
            );
            expect(loginUrl.includes(`${AADServerParamKeys.SID}=`)).toBe(false);
        });

        it("Ignores loginHint if prompt is select_account", async () => {
            // Override with alternate authority openid_config
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

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
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl.includes(`${AADServerParamKeys.LOGIN_HINT}=`)).toBe(
                false
            );
            expect(loginUrl.includes(`${AADServerParamKeys.SID}=`)).toBe(false);
        });

        it("Ignores sid if prompt is select_account", async () => {
            // Override with alternate authority openid_config
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

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
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl.includes(`${AADServerParamKeys.LOGIN_HINT}=`)).toBe(
                false
            );
            expect(loginUrl.includes(`${AADServerParamKeys.SID}=`)).toBe(false);
        });

        it("Creates a login URL with scopes from given token request", async () => {
            // Override with alternate authority openid_config
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(ALTERNATE_OPENID_CONFIG_RESPONSE.body);

            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
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
            };

            const loginUrl = await client.getAuthCodeUrl(loginRequest);
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.SCOPE}=${encodeURIComponent(
                        `${testScope1} ${testScope2}`
                    )}`
                )
            ).toBe(true);
        });

        it("Does not append an extra '?' when the authorization endpoint already contains a query string", async () => {
            // Override with alternate authority openid_config
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromHardcodedValues"
            ).mockReturnValue({
                token_endpoint:
                    "https://login.windows.net/common/oauth2/v2.0/token?param1=value1",
                issuer: "https://login.windows.net/{tenantid}/v2.0",
                userinfo_endpoint: "https://graph.microsoft.com/oidc/userinfo",
                authorization_endpoint:
                    "https://login.windows.net/common/oauth2/v2.0/authorize?param1=value1",
                end_session_endpoint:
                    "https://login.windows.net/common/oauth2/v2.0/logout?param1=value1",
            });

            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
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
            };
            const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
            expect(loginUrl.split("?").length).toEqual(2);
            expect(loginUrl.includes(`param1=value1`)).toBe(true);
            expect(
                loginUrl.includes(
                    ALTERNATE_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace(
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
                    `${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`
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
            expect(
                loginUrl.includes(
                    `${AADServerParamKeys.CODE_CHALLENGE}=${encodeURIComponent(
                        TEST_CONFIG.TEST_CHALLENGE
                    )}`
                )
            ).toBe(true);
            expect(
                loginUrl.includes(
                    `${
                        AADServerParamKeys.CODE_CHALLENGE_METHOD
                    }=${encodeURIComponent(
                        Constants.S256_CODE_CHALLENGE_METHOD
                    )}`
                )
            ).toBe(true);
        });
    });

    it("Adds req-cnf as needed", async () => {
        // Override with alternate authority openid_config
        jest.spyOn(
            Authority.prototype,
            <any>"getEndpointMetadataFromNetwork"
        ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);

        const config: ClientConfiguration =
            await ClientTestUtils.createTestClientConfiguration();
        const client = new AuthorizationCodeClient(config);

        if (!config.cryptoInterface) {
            throw TestError.createTestSetupError(
                "configuration cryptoInterface not initialized correctly."
            );
        }

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
            authenticationScheme: AuthenticationScheme.POP,
            platformBroker: true,
        };
        const loginUrl = await client.getAuthCodeUrl(authCodeUrlRequest);
        expect(
            loginUrl.includes(
                `${AADServerParamKeys.NATIVE_BROKER}=${encodeURIComponent("1")}`
            )
        ).toBe(true);
        expect(
            loginUrl.includes(
                `${AADServerParamKeys.REQ_CNF}=${encodeURIComponent(
                    TEST_POP_VALUES.ENCODED_REQ_CNF
                )}`
            )
        ).toBe(true);
    });

    describe("handleFragmentResponse()", () => {
        it("returns valid server code response", async () => {
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();

            const client: AuthorizationCodeClient = new AuthorizationCodeClient(
                config
            );
            const authCodePayload = client.handleFragmentResponse(
                {
                    code: "thisIsATestCode",
                    state: TEST_STATE_VALUES.ENCODED_LIB_STATE,
                    client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                },
                TEST_STATE_VALUES.ENCODED_LIB_STATE
            );
            expect(authCodePayload.code).toBe("thisIsATestCode");
            expect(authCodePayload.state).toBe(
                TEST_STATE_VALUES.ENCODED_LIB_STATE
            );
        });

        it("throws server error when error is in hash", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client: AuthorizationCodeClient = new AuthorizationCodeClient(
                config
            );
            const cacheStorageMock =
                config.storageInterface as MockStorageClass;

            let error: AuthError | null = null;
            try {
                client.handleFragmentResponse(
                    {
                        error: "error_code",
                        error_description: "msal error description",
                        state: TEST_STATE_VALUES.ENCODED_LIB_STATE,
                    },
                    TEST_STATE_VALUES.ENCODED_LIB_STATE
                );
            } catch (e) {
                error = e as AuthError;
            }
            expect(error).toBeInstanceOf(ServerError);
            expect(error?.errorCode).toEqual("error_code");
            expect(error?.errorMessage).toEqual("msal error description");
            expect(cacheStorageMock.getKeys().length).toBe(1);
            expect(cacheStorageMock.getAuthorityMetadataKeys().length).toBe(1);
        });
    });

    describe("Acquire a token", () => {
        let config: ClientConfiguration;
        beforeEach(async () => {
            config = await ClientTestUtils.createTestClientConfiguration();
        });

        it("Throws error if null code request is passed", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);

            const client = new AuthorizationCodeClient(config);

            await expect(
                // @ts-ignore
                client.acquireToken({ code: null }, null)
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.requestCannotBeMade)
            );
            // @ts-ignore
            expect(config.storageInterface.getKeys().length).toBe(1);

            expect(
                // @ts-ignore
                config.storageInterface.getAuthorityMetadataKeys().length
            ).toBe(1);
        });

        it("Throws error if code response does not contain authorization code", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);

            if (!config.storageInterface) {
                throw TestError.createTestSetupError(
                    "configuration storageInterface not initialized correctly."
                );
            }
            const client = new AuthorizationCodeClient(config);

            const codeRequest: CommonAuthorizationCodeRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["scope"],
                code: "",
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
            };

            await expect(
                // @ts-ignore
                client.acquireToken(codeRequest, null)
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.requestCannotBeMade)
            );
            // @ts-ignore
            expect(config.storageInterface.getKeys().length).toBe(1);
            // @ts-ignore
            expect(
                config.storageInterface.getAuthorityMetadataKeys().length
            ).toBe(1);
        });

        it("preventCorsPreflight=true does not add headers other than simpleRequest headers", async () => {
            // For more information about this test see: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const executePostToTokenEndpointSpy: jest.SpyInstance = jest
                .spyOn(
                    AuthorizationCodeClient.prototype,
                    <any>"executePostToTokenEndpoint"
                )
                .mockImplementation(
                    // @ts-expect-error
                    (
                        tokenEndpoint: string,
                        queryString: string,
                        headers: Record<string, string>
                    ) => {
                        const headerNames = Object.keys(headers);
                        headerNames.forEach((name) => {
                            expect(CORS_SIMPLE_REQUEST_HEADERS).toEqual(
                                expect.arrayContaining([name.toLowerCase()])
                            );
                        });

                        return Promise.resolve(AUTHENTICATION_RESULT);
                    }
                );

            if (!config.cryptoInterface || !config.systemOptions) {
                throw TestError.createTestSetupError(
                    "configuration cryptoInterface or systemOptions not initialized correctly."
                );
            }
            config.systemOptions.preventCorsPreflight = true;

            // Set up required objects and mocked return values
            const testState = `eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9${Constants.RESOURCE_DELIM}userState`;
            const decodedLibState = '{ "id": "testid", "ts": 1592846482 }';

            jest.spyOn(
                config.cryptoInterface,
                "base64Decode"
            ).mockImplementation((input) => {
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
            });

            jest.spyOn(
                config.cryptoInterface,
                "base64Encode"
            ).mockImplementation((input) => {
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
            });

            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValue(
                idTokenClaims
            );
            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                ccsCredential: {
                    credential: idTokenClaims.preferred_username,
                    type: CcsCredentialType.UPN,
                },
            };

            await client.acquireToken(authCodeRequest, {
                code: authCodeRequest.code,
                nonce: idTokenClaims.nonce,
                state: testState,
            });

            expect(executePostToTokenEndpointSpy).toHaveBeenCalled();
        });

        it("preventCorsPreflight=false adds headers to request", async () => {
            // For more information about this test see: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const reqHeaders = [
                ...CORS_SIMPLE_REQUEST_HEADERS,
                HeaderNames.CCS_HEADER.toLowerCase(),
            ];
            const executePostToTokenEndpointSpy: jest.SpyInstance = jest
                .spyOn(
                    AuthorizationCodeClient.prototype,
                    <any>"executePostToTokenEndpoint"
                )
                .mockImplementation(
                    // @ts-expect-error
                    (
                        tokenEndpoint: string,
                        queryString: string,
                        headers: Record<string, string>
                    ) => {
                        const headerNames = Object.keys(headers);
                        headerNames.forEach((name) => {
                            expect(reqHeaders).toEqual(
                                expect.arrayContaining([name.toLowerCase()])
                            );
                        });

                        return Promise.resolve(AUTHENTICATION_RESULT);
                    }
                );

            if (!config.cryptoInterface || !config.systemOptions) {
                throw TestError.createTestSetupError(
                    "configuration cryptoInterface or systemOptions not initialized correctly."
                );
            }
            config.systemOptions.preventCorsPreflight = false;

            // Set up required objects and mocked return values
            const testState = `eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9${Constants.RESOURCE_DELIM}userState`;
            const decodedLibState = '{ "id": "testid", "ts": 1592846482 }';

            jest.spyOn(
                config.cryptoInterface,
                "base64Decode"
            ).mockImplementation((input) => {
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
            });

            jest.spyOn(
                config.cryptoInterface,
                "base64Encode"
            ).mockImplementation((input) => {
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
            });

            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValue(
                idTokenClaims
            );
            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                ccsCredential: {
                    credential: idTokenClaims.preferred_username,
                    type: CcsCredentialType.UPN,
                },
            };

            await client.acquireToken(authCodeRequest, {
                code: authCodeRequest.code,
                nonce: idTokenClaims.nonce,
                state: testState,
            });

            expect(executePostToTokenEndpointSpy).toHaveBeenCalled();
        });

        it("Does not add headers that do not qualify for a simple request", async () => {
            // For more information about this test see: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const executePostToTokenEndpointSpy: jest.SpyInstance = jest
                .spyOn(
                    AuthorizationCodeClient.prototype,
                    <any>"executePostToTokenEndpoint"
                )
                .mockImplementation(
                    // @ts-expect-error
                    (
                        tokenEndpoint: string,
                        queryString: string,
                        headers: Record<string, string>
                    ) => {
                        const headerNames = Object.keys(headers);
                        headerNames.forEach((name) => {
                            expect(CORS_SIMPLE_REQUEST_HEADERS).toEqual(
                                expect.arrayContaining([name.toLowerCase()])
                            );
                        });

                        return Promise.resolve(AUTHENTICATION_RESULT);
                    }
                );

            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError(
                    "configuration cryptoInterface not initialized correctly."
                );
            }

            // Set up required objects and mocked return values
            const testState = `eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9${Constants.RESOURCE_DELIM}userState`;
            const decodedLibState = '{ "id": "testid", "ts": 1592846482 }';

            jest.spyOn(
                config.cryptoInterface,
                "base64Decode"
            ).mockImplementation((input) => {
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
            });

            jest.spyOn(
                config.cryptoInterface,
                "base64Encode"
            ).mockImplementation((input) => {
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
            });

            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValue(
                idTokenClaims
            );
            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
            };

            await client.acquireToken(authCodeRequest, {
                code: authCodeRequest.code,
                nonce: idTokenClaims.nonce,
                state: testState,
            });

            expect(executePostToTokenEndpointSpy).toHaveBeenCalled();
        });

        it("Throws error if max age is equal to 0 or has transpired since the last end-user authentication", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(AUTHENTICATION_RESULT);

            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError(
                    "configuration cryptoInterface not initialized correctly."
                );
            }

            // Set up required objects and mocked return values
            const testState = `eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9${Constants.RESOURCE_DELIM}userState`;
            const decodedLibState = '{ "id": "testid", "ts": 1592846482 }';

            jest.spyOn(
                config.cryptoInterface,
                "base64Decode"
            ).mockImplementation((input) => {
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
            });

            jest.spyOn(
                config.cryptoInterface,
                "base64Encode"
            ).mockImplementation((input) => {
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
            });

            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                auth_time: Date.now() - ONE_DAY_IN_MS * 2,
            };
            jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValue(
                idTokenClaims
            );
            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                maxAge: 0, // 0 indicates an immediate refresh
            };

            await expect(
                client.acquireToken(authCodeRequest, {
                    code: authCodeRequest.code,
                    nonce: idTokenClaims.nonce,
                    state: testState,
                })
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.maxAgeTranspired)
            );
        });

        it("Throws error if max age is requested and auth time is not included in the token claims", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(AUTHENTICATION_RESULT);

            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError(
                    "configuration cryptoInterface not initialized correctly."
                );
            }

            // Set up required objects and mocked return values
            const testState = `eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9${Constants.RESOURCE_DELIM}userState`;
            const decodedLibState = '{ "id": "testid", "ts": 1592846482 }';

            jest.spyOn(
                config.cryptoInterface,
                "base64Decode"
            ).mockImplementation((input) => {
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
            });

            jest.spyOn(
                config.cryptoInterface,
                "base64Encode"
            ).mockImplementation((input) => {
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
            });

            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                // "auth_time" is missing for the purpose of this test
            };
            jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValue(
                idTokenClaims
            );
            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                maxAge: ONE_DAY_IN_MS * 3,
            };

            await expect(
                client.acquireToken(authCodeRequest, {
                    code: authCodeRequest.code,
                    nonce: idTokenClaims.nonce,
                    state: testState,
                })
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.authTimeNotFound)
            );
        });

        it("Acquires a token successfully", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(AUTHENTICATION_RESULT);
            const createTokenRequestBodySpy = jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"createTokenRequestBody"
            );
            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError(
                    "configuration cryptoInterface not initialized correctly."
                );
            }

            // Set up required objects and mocked return values
            const testState = `eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9${Constants.RESOURCE_DELIM}userState`;
            const decodedLibState = '{ "id": "testid", "ts": 1592846482 }';

            jest.spyOn(
                config.cryptoInterface,
                "base64Decode"
            ).mockImplementation((input) => {
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
            });

            jest.spyOn(
                config.cryptoInterface,
                "base64Encode"
            ).mockImplementation((input) => {
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
            });

            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValue(
                idTokenClaims
            );
            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
            };

            const authenticationResult = await client.acquireToken(
                authCodeRequest,
                {
                    code: authCodeRequest.code,
                    nonce: idTokenClaims.nonce,
                    state: testState,
                }
            );
            if (!authenticationResult.expiresOn) {
                throw TestError.createTestSetupError(
                    "mockedAccountInfo does not have a value"
                );
            }

            expect(authenticationResult.accessToken).toEqual(
                AUTHENTICATION_RESULT.body.access_token
            );
            // @ts-ignore
            expect(
                Date.now() + AUTHENTICATION_RESULT.body.expires_in * 1000 >=
                    authenticationResult.expiresOn.getMilliseconds()
            ).toBe(true);
            expect(createTokenRequestBodySpy).toHaveBeenCalledWith(
                authCodeRequest
            );

            const returnVal = (await createTokenRequestBodySpy.mock.results[0]
                .value) as string;
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.SCOPE}=${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(
                        TEST_URIS.TEST_REDIRECT_URI_LOCALHOST
                    )}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CODE}=${TEST_TOKENS.AUTHORIZATION_CODE}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.GRANT_TYPE}=${Constants.CODE_GRANT_TYPE}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CODE_VERIFIER}=${TEST_CONFIG.TEST_VERIFIER}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`
                )
            ).toBe(true);
        });

        it("Acquires a token successfully when max age is provided and has not transpired yet", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(AUTHENTICATION_RESULT);
            const createTokenRequestBodySpy = jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"createTokenRequestBody"
            );
            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError(
                    "configuration cryptoInterface not initialized correctly."
                );
            }

            // Set up required objects and mocked return values
            const testState = `eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9${Constants.RESOURCE_DELIM}userState`;
            const decodedLibState = '{ "id": "testid", "ts": 1592846482 }';

            jest.spyOn(
                config.cryptoInterface,
                "base64Decode"
            ).mockImplementation((input) => {
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
            });

            jest.spyOn(
                config.cryptoInterface,
                "base64Encode"
            ).mockImplementation((input) => {
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
            });

            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                auth_time: Date.now() - ONE_DAY_IN_MS * 2,
            };
            jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValue(
                idTokenClaims
            );
            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                maxAge: ONE_DAY_IN_MS * 3,
            };

            const authenticationResult = await client.acquireToken(
                authCodeRequest,
                {
                    code: authCodeRequest.code,
                    nonce: idTokenClaims.nonce,
                    state: testState,
                }
            );
            if (!authenticationResult.expiresOn) {
                throw TestError.createTestSetupError(
                    "mockedAccountInfo does not have a value"
                );
            }

            expect(authenticationResult.accessToken).toEqual(
                AUTHENTICATION_RESULT.body.access_token
            );
            // @ts-ignore
            expect(
                Date.now() + AUTHENTICATION_RESULT.body.expires_in * 1000 >=
                    authenticationResult.expiresOn.getMilliseconds()
            ).toBe(true);
            expect(createTokenRequestBodySpy).toHaveBeenCalledWith(
                authCodeRequest
            );

            const returnVal = (await createTokenRequestBodySpy.mock.results[0]
                .value) as string;
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.SCOPE}=${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(
                        TEST_URIS.TEST_REDIRECT_URI_LOCALHOST
                    )}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CODE}=${TEST_TOKENS.AUTHORIZATION_CODE}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.GRANT_TYPE}=${Constants.CODE_GRANT_TYPE}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CODE_VERIFIER}=${TEST_CONFIG.TEST_VERIFIER}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`
                )
            ).toBe(true);
        });

        it("Adds correlationId to the /token query string", (done) => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"executePostToTokenEndpoint"
                // @ts-expect-error
            ).mockImplementation((url: string) => {
                try {
                    expect(url).toContain(
                        `client-request-id=${RANDOM_TEST_GUID}`
                    );
                    done();
                } catch (error) {
                    done(error);
                }
            });

            const client = new AuthorizationCodeClient(config);
            const authorizationCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
            };

            client.acquireToken(authorizationCodeRequest).catch((error) => {
                // Catch errors thrown after the function call this test is testing
            });
        });

        it("Adds tokenQueryParameters to the /token request", (done) => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"executePostToTokenEndpoint"
                // @ts-expect-error
            ).mockImplementation((url: string) => {
                try {
                    expect(
                        url.includes(
                            "/token?testParam1=testValue1&testParam3=testValue3"
                        )
                    ).toBeTruthy();
                    expect(!url.includes("/token?testParam2=")).toBeTruthy();
                    done();
                } catch (error) {
                    done(error);
                }
            });

            const client = new AuthorizationCodeClient(config);
            const authorizationCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                tokenQueryParameters: {
                    testParam1: "testValue1",
                    testParam2: "",
                    testParam3: "testValue3",
                },
            };

            client.acquireToken(authorizationCodeRequest).catch((error) => {
                // Catch errors thrown after the function call this test is testing
            });
        });

        it("Adds tokenBodyParameters to the /token request", (done) => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"executePostToTokenEndpoint"
                // @ts-expect-error
            ).mockImplementation((url: string, body: string) => {
                expect(body).toContain("extra_body_parameter=true");
                done();
            });

            if (!config.cryptoInterface || !config.systemOptions) {
                throw TestError.createTestSetupError(
                    "configuration cryptoInterface or systemOptions not initialized correctly."
                );
            }
            const client = new AuthorizationCodeClient(config);

            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                tokenBodyParameters: {
                    extra_body_parameter: "true",
                },
            };

            client.acquireToken(authCodeRequest).catch((error) => {
                // Catch errors thrown after the function call this test is testing
            });
        });

        it("Adds return_spa_code=1 to body when enableSpaAuthCode is set", (done) => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"executePostToTokenEndpoint"
                // @ts-expect-error
            ).mockImplementation((url: string, body: string) => {
                expect(body).toContain("return_spa_code=1");
                done();
            });

            if (!config.cryptoInterface || !config.systemOptions) {
                throw TestError.createTestSetupError(
                    "configuration cryptoInterface or systemOptions not initialized correctly."
                );
            }
            const client = new AuthorizationCodeClient(config);

            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                enableSpaAuthorizationCode: true,
            };

            client.acquireToken(authCodeRequest).catch((error) => {
                // Catch errors thrown after the function call this test is testing
            });
        });

        it("Doesnt add redirect_uri when hybridSpa flag is set", (done) => {
            class TestAuthorizationCodeClient extends AuthorizationCodeClient {
                constructor(config: ClientConfiguration) {
                    super(config);
                    this.includeRedirectUri = false;
                }
            }
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                TestAuthorizationCodeClient.prototype,
                <any>"executePostToTokenEndpoint"
                // @ts-expect-error
            ).mockImplementation((url: string, body: string) => {
                expect(body).not.toContain("redirect_uri=");
                done();
            });

            if (!config.cryptoInterface || !config.systemOptions) {
                throw TestError.createTestSetupError(
                    "configuration cryptoInterface or systemOptions not initialized correctly."
                );
            }
            const client = new TestAuthorizationCodeClient(config);

            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
                tokenBodyParameters: {
                    extra_body_parameter: "true",
                },
            };

            client.acquireToken(authCodeRequest).catch((error) => {
                // Catch errors thrown after the function call this test is testing
            });
        });

        it("Sends the required parameters when a pop token is requested", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(POP_AUTHENTICATION_RESULT);
            const createTokenRequestBodySpy = jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"createTokenRequestBody"
            );
            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError(
                    "configuration cryptoInterface not initialized correctly."
                );
            }

            // Set up required objects and mocked return values
            const testState = `eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9${Constants.RESOURCE_DELIM}userState`;
            const decodedLibState = '{ "id": "testid", "ts": 1592846482 }';

            jest.spyOn(
                config.cryptoInterface,
                "base64Decode"
            ).mockImplementation((input) => {
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
            });

            jest.spyOn(
                config.cryptoInterface,
                "base64Encode"
            ).mockImplementation((input) => {
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
            });

            const signedJwt =
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJjbmYiOnsia2lkIjoiTnpiTHNYaDh1RENjZC02TU53WEY0V183bm9XWEZaQWZIa3hac1JHQzlYcyJ9fQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

            config.cryptoInterface.signJwt = async (
                // @ts-ignore
                payload: SignedHttpRequest,
                kid: string
            ): Promise<string> => {
                expect(payload.at).toBe(
                    POP_AUTHENTICATION_RESULT.body.access_token
                );
                return signedJwt;
            };
            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            jest.spyOn(AuthToken, "extractTokenClaims").mockImplementation(
                (
                    encodedToken: string,
                    base64Decode: (val: string) => string
                ): TokenClaims => {
                    switch (encodedToken) {
                        case POP_AUTHENTICATION_RESULT.body.id_token:
                            return idTokenClaims as TokenClaims;
                        case POP_AUTHENTICATION_RESULT.body.access_token:
                            return {
                                cnf: {
                                    kid: TEST_POP_VALUES.KID,
                                },
                            };
                        default:
                            return {};
                    }
                }
            );
            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authenticationScheme: AuthenticationScheme.POP,
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                resourceRequestMethod: "POST",
                resourceRequestUri: TEST_URIS.TEST_RESOURCE_ENDPT_WITH_PARAMS,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
            };

            const authenticationResult = await client.acquireToken(
                authCodeRequest,
                {
                    code: authCodeRequest.code,
                    nonce: idTokenClaims.nonce,
                    state: testState,
                }
            );

            expect(authenticationResult.accessToken).toBe(signedJwt);

            expect(
                Date.now() + POP_AUTHENTICATION_RESULT.body.expires_in * 1000 >=
                    // @ts-ignore
                    authenticationResult.expiresOn.getMilliseconds()
            ).toBe(true);
            expect(createTokenRequestBodySpy).toHaveBeenCalledWith(
                authCodeRequest
            );
            const returnVal = (await createTokenRequestBodySpy.mock.results[0]
                .value) as string;
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.SCOPE}=${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(
                        TEST_URIS.TEST_REDIRECT_URI_LOCALHOST
                    )}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CODE}=${TEST_TOKENS.AUTHORIZATION_CODE}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.GRANT_TYPE}=${Constants.CODE_GRANT_TYPE}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CODE_VERIFIER}=${TEST_CONFIG.TEST_VERIFIER}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.TOKEN_TYPE}=${AuthenticationScheme.POP}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.REQ_CNF}=${TEST_POP_VALUES.ENCODED_REQ_CNF}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CLAIMS}=${encodeURIComponent(
                        TEST_CONFIG.CLAIMS
                    )}`
                )
            ).toBe(true);
        });

        it("Sends the required parameters when a SSH certificate is requested", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(POP_AUTHENTICATION_RESULT);
            const createTokenRequestBodySpy = jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"createTokenRequestBody"
            );
            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError(
                    "configuration cryptoInterface not initialized correctly."
                );
            }

            // Set up required objects and mocked return values
            const testState = `eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9${Constants.RESOURCE_DELIM}userState`;
            const decodedLibState = '{ "id": "testid", "ts": 1592846482 }';

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

            // @ts-ignore
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
            const signedJwt =
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJjbmYiOnsia2lkIjoiTnpiTHNYaDh1RENjZC02TU53WEY0V183bm9XWEZaQWZIa3hac1JHQzlYcyJ9fQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

            config.cryptoInterface.signJwt = async (
                // @ts-ignore
                payload: SignedHttpRequest,
                kid: string
            ): Promise<string> => {
                expect(payload.at).toBe(
                    POP_AUTHENTICATION_RESULT.body.access_token
                );
                return signedJwt;
            };
            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            jest.spyOn(AuthToken, "extractTokenClaims").mockImplementation(
                (
                    encodedToken: string,
                    base64Decode: (val: string) => string
                ): TokenClaims => {
                    switch (encodedToken) {
                        case POP_AUTHENTICATION_RESULT.body.id_token:
                            return idTokenClaims as TokenClaims;
                        case POP_AUTHENTICATION_RESULT.body.access_token:
                            return {
                                cnf: {
                                    kid: TEST_POP_VALUES.KID,
                                },
                            };
                        default:
                            return {};
                    }
                }
            );
            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authenticationScheme: AuthenticationScheme.SSH,
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                sshJwk: TEST_SSH_VALUES.SSH_JWK,
                sshKid: TEST_SSH_VALUES.SSH_KID,
            };

            const authenticationResult = await client.acquireToken(
                authCodeRequest,
                {
                    code: authCodeRequest.code,
                    nonce: idTokenClaims.nonce,
                    state: testState,
                }
            );

            expect(authenticationResult.accessToken).toBe(signedJwt);
            expect(
                Date.now() + POP_AUTHENTICATION_RESULT.body.expires_in * 1000 >=
                    // @ts-ignore
                    authenticationResult.expiresOn.getMilliseconds()
            ).toBe(true);
            expect(createTokenRequestBodySpy).toHaveBeenCalledWith(
                authCodeRequest
            );
            const returnVal = (await createTokenRequestBodySpy.mock.results[0]
                .value) as string;
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.SCOPE}=${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(
                        TEST_URIS.TEST_REDIRECT_URI_LOCALHOST
                    )}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CODE}=${TEST_TOKENS.AUTHORIZATION_CODE}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.GRANT_TYPE}=${Constants.CODE_GRANT_TYPE}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CODE_VERIFIER}=${TEST_CONFIG.TEST_VERIFIER}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.TOKEN_TYPE}=${AuthenticationScheme.SSH}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.REQ_CNF}=${TEST_SSH_VALUES.ENCODED_SSH_JWK}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CLAIMS}=${encodeURIComponent(
                        TEST_CONFIG.CLAIMS
                    )}`
                )
            ).toBe(true);
        });

        it("Throws missing SSH JWK error when the token request has Authentication Scheme set to SSH and SSH JWK is missing", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(POP_AUTHENTICATION_RESULT);

            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError(
                    "configuration cryptoInterface not initialized correctly."
                );
            }

            // Set up required objects and mocked return values
            const testState = `eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9${Constants.RESOURCE_DELIM}userState`;
            const decodedLibState = '{ "id": "testid", "ts": 1592846482 }';

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

            // @ts-ignore
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

            config.cryptoInterface.signJwt = async (
                // @ts-ignore
                payload: SignedHttpRequest,
                kid: string
            ): Promise<string> => {
                expect(payload.at).toBe(
                    POP_AUTHENTICATION_RESULT.body.access_token
                );
                return signedJwt;
            };
            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            jest.spyOn(AuthToken, "extractTokenClaims").mockImplementation(
                (
                    encodedToken: string,
                    base64Decode: (val: string) => string
                ): TokenClaims => {
                    switch (encodedToken) {
                        case POP_AUTHENTICATION_RESULT.body.id_token:
                            return idTokenClaims as TokenClaims;
                        case POP_AUTHENTICATION_RESULT.body.access_token:
                            return {
                                cnf: {
                                    kid: TEST_POP_VALUES.KID,
                                },
                            };
                        default:
                            return {};
                    }
                }
            );
            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authenticationScheme: AuthenticationScheme.SSH,
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
            };

            expect(
                client.acquireToken(authCodeRequest, {
                    code: authCodeRequest.code,
                    nonce: idTokenClaims.nonce,
                    state: testState,
                })
            ).rejects.toThrow(
                createClientConfigurationError(
                    ClientConfigurationErrorCodes.missingSshJwk
                )
            );
        });

        it("properly handles expiration timestamps as strings", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue({
                ...AUTHENTICATION_RESULT,
                body: {
                    ...AUTHENTICATION_RESULT.body,
                    expires_in: "3599",
                    ext_expires_in: "3599",
                },
            });
            jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"createTokenRequestBody"
            );

            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError(
                    "configuration cryptoInterface not initialized correctly."
                );
            }
            // Set up required objects and mocked return values
            const testState = `eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9${Constants.RESOURCE_DELIM}userState`;
            const decodedLibState = '{ "id": "testid", "ts": 1592846482 }';

            jest.spyOn(
                config.cryptoInterface,
                "base64Decode"
            ).mockImplementation((input) => {
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
            });

            jest.spyOn(
                config.cryptoInterface,
                "base64Encode"
            ).mockImplementation((input) => {
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
            });

            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValue(
                idTokenClaims
            );
            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
            };

            const authenticationResult = await client.acquireToken(
                authCodeRequest,
                {
                    code: authCodeRequest.code,
                    nonce: idTokenClaims.nonce,
                    state: testState,
                }
            );

            expect(authenticationResult.expiresOn?.toString()).not.toBe(
                "Invalid Date"
            );
        });

        it("Saves refresh_in correctly to the cache", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const authResult = {
                ...AUTHENTICATION_RESULT,
                body: {
                    ...AUTHENTICATION_RESULT.body,
                    refresh_in: 1000,
                },
            };
            jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(authResult);
            const createTokenRequestBodySpy = jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"createTokenRequestBody"
            );
            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError(
                    "configuration cryptoInterface not initialized correctly."
                );
            }
            // Set up required objects and mocked return values
            const testState = `eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9${Constants.RESOURCE_DELIM}userState`;
            const decodedLibState = '{ "id": "testid", "ts": 1592846482 }';

            jest.spyOn(
                config.cryptoInterface,
                "base64Decode"
            ).mockImplementation((input) => {
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
            });

            jest.spyOn(
                config.cryptoInterface,
                "base64Encode"
            ).mockImplementation((input) => {
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
            });

            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValue(
                idTokenClaims
            );
            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
            };

            const authenticationResult = await client.acquireToken(
                authCodeRequest,
                {
                    code: authCodeRequest.code,
                    nonce: idTokenClaims.nonce,
                    state: testState,
                }
            );
            const accessTokenKey = config.storageInterface
                ?.getKeys()
                .find((value) => value.indexOf("accesstoken") >= 0);
            const accessTokenCacheItem = accessTokenKey
                ? config.storageInterface?.getAccessTokenCredential(
                      accessTokenKey
                  )
                : null;

            expect(authenticationResult.accessToken).toEqual(
                AUTHENTICATION_RESULT.body.access_token
            );
            expect(
                authenticationResult.expiresOn &&
                    Date.now() + AUTHENTICATION_RESULT.body.expires_in * 1000 >=
                        authenticationResult.expiresOn.getMilliseconds()
            ).toBe(true);
            expect(createTokenRequestBodySpy).toHaveBeenCalledWith(
                authCodeRequest
            );
            expect(
                accessTokenCacheItem &&
                    accessTokenCacheItem.refreshOn &&
                    accessTokenCacheItem.refreshOn ===
                        accessTokenCacheItem.cachedAt +
                            authResult.body.refresh_in
            );
        });

        it("includes the requestId in the result when received in server response", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(AUTHENTICATION_RESULT_WITH_HEADERS);

            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError(
                    "configuration cryptoInterface not initialized correctly."
                );
            }

            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValue(
                idTokenClaims
            );
            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
            };

            const authenticationResult = await client.acquireToken(
                authCodeRequest,
                {
                    code: authCodeRequest.code,
                    nonce: idTokenClaims.nonce,
                }
            );
            if (!authenticationResult.expiresOn) {
                throw TestError.createTestSetupError(
                    "mockedAccountInfo does not have a value"
                );
            }

            expect(authenticationResult.requestId).toBeTruthy;
            expect(authenticationResult.requestId).toEqual(
                CORS_RESPONSE_HEADERS.xMsRequestId
            );
        });

        it("does not include the requestId in the result when none in server response", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(AUTHENTICATION_RESULT);

            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError(
                    "configuration cryptoInterface not initialized correctly."
                );
            }
            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValue(
                idTokenClaims
            );
            const client = new AuthorizationCodeClient(config);
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
            };

            const authenticationResult = await client.acquireToken(
                authCodeRequest,
                {
                    code: authCodeRequest.code,
                    nonce: idTokenClaims.nonce,
                }
            );
            if (!authenticationResult.expiresOn) {
                throw TestError.createTestSetupError(
                    "mockedAccountInfo does not have a value"
                );
            }

            expect(authenticationResult.requestId).toBeFalsy;
            expect(authenticationResult.requestId).toEqual("");
        });

        it("includes the http version in Authorization code client measurement(AT) when received in server response", async () => {
            const performanceClient = {
                startMeasurement: jest.fn(),
                endMeasurement: jest.fn(),
                addFields: jest.fn(),
                incrementFields: jest.fn(),
                discardMeasurements: jest.fn(),
                removePerformanceCallback: jest.fn(),
                addPerformanceCallback: jest.fn(),
                emitEvents: jest.fn(),
                startPerformanceMeasurement: jest.fn(),
                generateId: jest.fn(),
                calculateQueuedTime: jest.fn(),
                addQueueMeasurement: jest.fn(),
                setPreQueueTime: jest.fn(),
            };

            const client = new AuthorizationCodeClient(
                config,
                performanceClient
            );
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                // @ts-ignore
                client.networkClient,
                "sendPostRequestAsync"
            ).mockResolvedValue(AUTHENTICATION_RESULT_WITH_HEADERS);

            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError(
                    "configuration cryptoInterface not initialized correctly."
                );
            }
            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValue(
                idTokenClaims
            );

            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
            };
            await client.acquireToken(authCodeRequest, {
                code: authCodeRequest.code,
                nonce: idTokenClaims.nonce,
            });

            expect(performanceClient.addFields).toHaveBeenCalledWith(
                {
                    httpVerToken: "xMsHttpVer",
                    refreshTokenSize:
                        AUTHENTICATION_RESULT_WITH_HEADERS.body.refresh_token
                            ?.length,
                    requestId: "xMsRequestId",
                },
                RANDOM_TEST_GUID
            );
        });

        it("does not add http version to the measurement when not received in server response", async () => {
            const performanceClient = {
                startMeasurement: jest.fn(),
                endMeasurement: jest.fn(),
                addFields: jest.fn(),
                incrementFields: jest.fn(),
                discardMeasurements: jest.fn(),
                removePerformanceCallback: jest.fn(),
                addPerformanceCallback: jest.fn(),
                emitEvents: jest.fn(),
                startPerformanceMeasurement: jest.fn(),
                generateId: jest.fn(),
                calculateQueuedTime: jest.fn(),
                addQueueMeasurement: jest.fn(),
                setPreQueueTime: jest.fn(),
            };
            const client = new AuthorizationCodeClient(
                config,
                performanceClient
            );
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                // @ts-ignore
                client.networkClient,
                "sendPostRequestAsync"
            ).mockResolvedValue({ ...AUTHENTICATION_RESULT, headers: {} });

            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError(
                    "configuration cryptoInterface not initialized correctly."
                );
            }
            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValue(
                idTokenClaims
            );

            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
            };
            await client.acquireToken(authCodeRequest, {
                code: authCodeRequest.code,
                nonce: idTokenClaims.nonce,
            });

            expect(performanceClient.addFields).toHaveBeenCalledWith(
                {
                    httpVerToken: "",
                    refreshTokenSize:
                        AUTHENTICATION_RESULT.body.refresh_token?.length,
                    requestId: "",
                },
                RANDOM_TEST_GUID
            );
        });
    });

    describe("Telemetry protocol mode tests", () => {
        it("Adds telemetry headers to token request in AAD protocol mode", async () => {
            let config = await ClientTestUtils.createTestClientConfiguration(
                true
            );
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const createTokenRequestBodySpy = jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"createTokenRequestBody"
            );
            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError(
                    "configuration cryptoInterface not initialized correctly."
                );
            }
            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValue(
                idTokenClaims
            );
            const performanceClient = {
                startMeasurement: jest.fn(),
                endMeasurement: jest.fn(),
                addFields: jest.fn(),
                incrementFields: jest.fn(),
                discardMeasurements: jest.fn(),
                removePerformanceCallback: jest.fn(),
                addPerformanceCallback: jest.fn(),
                emitEvents: jest.fn(),
                startPerformanceMeasurement: jest.fn(),
                generateId: jest.fn(),
                calculateQueuedTime: jest.fn(),
                addQueueMeasurement: jest.fn(),
                setPreQueueTime: jest.fn(),
            };
            performanceClient.startMeasurement.mockImplementation(() => {
                return {
                    add: (fields: { [key: string]: {} | undefined }) =>
                        performanceClient.addFields(
                            fields,
                            TEST_CONFIG.CORRELATION_ID
                        ),
                    increment: jest.fn(),
                    end: jest.fn(),
                };
            });
            const client = new AuthorizationCodeClient(
                config,
                performanceClient
            );
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
            };
            try {
                await client.acquireToken(authCodeRequest, {
                    code: authCodeRequest.code,
                    nonce: idTokenClaims.nonce,
                });
            } catch {}
            expect(createTokenRequestBodySpy).toHaveBeenCalledWith(
                authCodeRequest
            );

            const returnVal = (await createTokenRequestBodySpy.mock.results[0]
                .value) as string;
            expect(
                returnVal.includes(`${AADServerParamKeys.X_CLIENT_CURR_TELEM}`)
            ).toBe(true);
            expect(
                returnVal.includes(`${AADServerParamKeys.X_CLIENT_LAST_TELEM}`)
            ).toBe(true);
        });
        it("Does not add telemetry headers to token request in OIDC protocol mode", async () => {
            let config = await ClientTestUtils.createTestClientConfiguration(
                true,
                ProtocolMode.OIDC
            );
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const createTokenRequestBodySpy = jest.spyOn(
                AuthorizationCodeClient.prototype,
                <any>"createTokenRequestBody"
            );
            if (!config.cryptoInterface) {
                throw TestError.createTestSetupError(
                    "configuration cryptoInterface not initialized correctly."
                );
            }
            // Set up stubs
            const idTokenClaims = {
                ver: "2.0",
                iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                exp: 1536361411,
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValue(
                idTokenClaims
            );
            const performanceClient = {
                startMeasurement: jest.fn(),
                endMeasurement: jest.fn(),
                addFields: jest.fn(),
                incrementFields: jest.fn(),
                discardMeasurements: jest.fn(),
                removePerformanceCallback: jest.fn(),
                addPerformanceCallback: jest.fn(),
                emitEvents: jest.fn(),
                startPerformanceMeasurement: jest.fn(),
                generateId: jest.fn(),
                calculateQueuedTime: jest.fn(),
                addQueueMeasurement: jest.fn(),
                setPreQueueTime: jest.fn(),
            };
            performanceClient.startMeasurement.mockImplementation(() => {
                return {
                    add: (fields: { [key: string]: {} | undefined }) =>
                        performanceClient.addFields(
                            fields,
                            TEST_CONFIG.CORRELATION_ID
                        ),
                    increment: jest.fn(),
                    end: jest.fn(),
                };
            });
            const client = new AuthorizationCodeClient(
                config,
                performanceClient
            );
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                redirectUri: TEST_URIS.TEST_REDIRECT_URI_LOCALHOST,
                code: TEST_TOKENS.AUTHORIZATION_CODE,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                claims: TEST_CONFIG.CLAIMS,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
            };
            try {
                await client.acquireToken(authCodeRequest, {
                    code: authCodeRequest.code,
                    nonce: idTokenClaims.nonce,
                });
            } catch {}
            expect(createTokenRequestBodySpy).toHaveBeenCalledWith(
                authCodeRequest
            );

            const returnVal = (await createTokenRequestBodySpy.mock.results[0]
                .value) as string;
            expect(
                returnVal.includes(`${AADServerParamKeys.X_CLIENT_CURR_TELEM}`)
            ).toBe(false);
            expect(
                returnVal.includes(`${AADServerParamKeys.X_CLIENT_LAST_TELEM}`)
            ).toBe(false);
        });
    });

    describe("getLogoutUri()", () => {
        it("Returns a uri", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const logoutUri = client.getLogoutUri({
                account: null,
                correlationId: RANDOM_TEST_GUID,
            });

            expect(logoutUri).toBe(
                `${DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace(
                    "{tenant}",
                    "common"
                )}?${AADServerParamKeys.CLIENT_REQUEST_ID}=${RANDOM_TEST_GUID}`
            );
        });

        it("Returns a uri with given parameters", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const logoutUri = client.getLogoutUri({
                correlationId: RANDOM_TEST_GUID,
                postLogoutRedirectUri: TEST_URIS.TEST_LOGOUT_URI,
                idTokenHint: "id_token_hint",
                state: "test_state",
            });

            const testLogoutUriWithParams = `${DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace(
                "{tenant}",
                "common"
            )}?${AADServerParamKeys.POST_LOGOUT_URI}=${encodeURIComponent(
                TEST_URIS.TEST_LOGOUT_URI
            )}&${AADServerParamKeys.CLIENT_REQUEST_ID}=${encodeURIComponent(
                RANDOM_TEST_GUID
            )}&${AADServerParamKeys.ID_TOKEN_HINT}=id_token_hint&${
                AADServerParamKeys.STATE
            }=test_state`;
            expect(logoutUri).toBe(testLogoutUriWithParams);
        });

        it("Does not append an extra '?' when the end session endpoint already contains a query string", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromHardcodedValues"
            ).mockReturnValue({
                token_endpoint:
                    "https://login.windows.net/common/oauth2/v2.0/token?param1=value1",
                issuer: "https://login.windows.net/{tenantid}/v2.0",
                userinfo_endpoint: "https://graph.microsoft.com/oidc/userinfo",
                authorization_endpoint:
                    "https://login.windows.net/common/oauth2/v2.0/authorize?param1=value1",
                end_session_endpoint:
                    "https://login.windows.net/common/oauth2/v2.0/logout?param1=value1",
            });
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const logoutUri = client.getLogoutUri({
                correlationId: RANDOM_TEST_GUID,
                postLogoutRedirectUri: TEST_URIS.TEST_LOGOUT_URI,
                idTokenHint: "id_token_hint",
                state: "test_state",
                extraQueryParameters: {
                    testParam: "test_val",
                },
            });

            const testLogoutUriWithParams = `https://login.windows.net/common/oauth2/v2.0/logout?param1=value1&${
                AADServerParamKeys.POST_LOGOUT_URI
            }=${encodeURIComponent(TEST_URIS.TEST_LOGOUT_URI)}&${
                AADServerParamKeys.CLIENT_REQUEST_ID
            }=${encodeURIComponent(RANDOM_TEST_GUID)}&${
                AADServerParamKeys.ID_TOKEN_HINT
            }=id_token_hint&${
                AADServerParamKeys.STATE
            }=test_state&testParam=test_val`;
            expect(logoutUri).toBe(testLogoutUriWithParams);
        });
    });

    describe("createAuthCodeUrlQueryString tests", () => {
        it("pick up default client_id", async () => {
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const queryString =
                // @ts-ignore
                await client.createAuthCodeUrlQueryString({
                    scopes: ["User.Read"],
                    prompt: PromptValue.LOGIN,
                    redirectUri: "localhost",
                });

            expect(queryString).toContain(
                `client_id=${TEST_CONFIG.MSAL_CLIENT_ID}`
            );
        });

        it("pick up extra query client_id param", async () => {
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const queryString =
                // @ts-ignore
                await client.createAuthCodeUrlQueryString({
                    scopes: ["User.Read"],
                    prompt: PromptValue.LOGIN,
                    redirectUri: "localhost",
                    extraQueryParameters: {
                        client_id: "child_client_id",
                    },
                });

            expect(queryString).toContain(`client_id=child_client_id`);
        });

        it("pick up instance_aware config param when set to true", async () => {
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            config.authOptions.instanceAware = true;
            const client = new AuthorizationCodeClient(config);

            const queryString =
                // @ts-ignore
                await client.createAuthCodeUrlQueryString({
                    scopes: ["User.Read"],
                    prompt: PromptValue.LOGIN,
                    redirectUri: "localhost",
                });

            expect(queryString).toContain(`instance_aware=true`);
        });

        it("do not pick up instance_aware config param when set to false", async () => {
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            config.authOptions.instanceAware = false;
            const client = new AuthorizationCodeClient(config);

            const queryString =
                // @ts-ignore
                await client.createAuthCodeUrlQueryString({
                    scopes: ["User.Read"],
                    prompt: PromptValue.LOGIN,
                    redirectUri: "localhost",
                });

            expect(queryString.includes("instance_aware")).toBeFalsy();
        });

        it("pick up instance_aware EQ param when config is set to false", async () => {
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            config.authOptions.instanceAware = false;
            const client = new AuthorizationCodeClient(config);

            const queryString =
                // @ts-ignore
                await client.createAuthCodeUrlQueryString({
                    scopes: ["User.Read"],
                    prompt: PromptValue.LOGIN,
                    redirectUri: "localhost",
                    extraQueryParameters: {
                        instance_aware: "true",
                    },
                });

            expect(queryString).toContain(`instance_aware=true`);
        });

        it("pick up instance_aware EQ param when config is set to true", async () => {
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            config.authOptions.instanceAware = true;
            const client = new AuthorizationCodeClient(config);

            const queryString =
                // @ts-ignore
                await client.createAuthCodeUrlQueryString({
                    scopes: ["User.Read"],
                    prompt: PromptValue.LOGIN,
                    redirectUri: "localhost",
                    extraQueryParameters: {
                        instance_aware: "false",
                    },
                });

            expect(queryString).toContain(`instance_aware=false`);
        });

        it("pick up broker params", async () => {
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const queryString =
                // @ts-ignore
                await client.createAuthCodeUrlQueryString({
                    scopes: ["User.Read"],
                    redirectUri: "localhost",
                    embeddedClientId: "child_client_id_1",
                });

            expect(queryString).toContain(`client_id=child_client_id_1`);
            expect(queryString).toContain(
                `brk_client_id=${config.authOptions.clientId}`
            );
            expect(queryString).toContain(`brk_redirect_uri=https://localhost`);
        });

        it("broker params take precedence over extra query params", async () => {
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const queryString =
                // @ts-ignore
                await client.createAuthCodeUrlQueryString({
                    scopes: ["User.Read"],
                    redirectUri: "localhost",
                    embeddedClientId: "child_client_id_1",
                    extraQueryParameters: {
                        client_id: "child_client_id_2",
                        brk_client_id: "broker_client_id_2",
                        brk_redirect_uri: "broker_redirect_uri_2",
                    },
                });

            expect(queryString).toContain(`client_id=child_client_id_1`);
            expect(queryString).toContain(
                `brk_client_id=${config.authOptions.clientId}`
            );
            expect(queryString).toContain(`brk_redirect_uri=https://localhost`);
        });
    });

    describe("createTokenRequestBody tests", () => {
        it("pick up default client_id", async () => {
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const queryString =
                // @ts-ignore
                await client.createTokenRequestBody({
                    scopes: ["User.Read"],
                    redirectUri: "localhost",
                });

            expect(queryString).toContain(
                `client_id=${TEST_CONFIG.MSAL_CLIENT_ID}`
            );
        });

        it("pick up extra query client_id param", async () => {
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const queryString =
                // @ts-ignore
                await client.createTokenRequestBody({
                    scopes: ["User.Read"],
                    redirectUri: "localhost",
                    tokenBodyParameters: {
                        client_id: "child_client_id",
                    },
                });

            expect(queryString).toContain(`client_id=child_client_id`);
        });

        it("pick up broker params", async () => {
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const queryString =
                // @ts-ignore
                await client.createTokenRequestBody({
                    scopes: ["User.Read"],
                    redirectUri: "localhost",
                    embeddedClientId: "child_client_id_1",
                });

            expect(queryString).toContain(`client_id=child_client_id_1`);
            expect(queryString).toContain(
                `brk_client_id=${config.authOptions.clientId}`
            );
            expect(queryString).toContain(`brk_redirect_uri=https://localhost`);
        });

        it("broker params take precedence over token body params", async () => {
            const config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new AuthorizationCodeClient(config);

            const queryString =
                // @ts-ignore
                await client.createTokenRequestBody({
                    scopes: ["User.Read"],
                    redirectUri: "localhost",
                    embeddedClientId: "child_client_id_1",
                    tokenBodyParameters: {
                        client_id: "child_client_id_2",
                        brk_client_id: "broker_client_id_2",
                        brk_redirect_uri: "broker_redirect_uri_2",
                    },
                });

            expect(queryString).toContain(`client_id=child_client_id_1`);
            expect(queryString).toContain(
                `brk_client_id=${config.authOptions.clientId}`
            );
            expect(queryString).toContain(`brk_redirect_uri=https://localhost`);
        });
    });
});
