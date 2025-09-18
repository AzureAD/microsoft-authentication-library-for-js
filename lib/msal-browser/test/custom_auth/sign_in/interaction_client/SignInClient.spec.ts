import { SignInClient } from "../../../../src/custom_auth/sign_in/interaction_client/SignInClient.js";
import { customAuthConfig } from "../../test_resources/CustomAuthConfig.js";
import { CustomAuthAuthority } from "../../../../src/custom_auth/core/CustomAuthAuthority.js";
import { ChallengeType } from "../../../../src/custom_auth/CustomAuthConstants.js";
import {
    SIGN_IN_CODE_SEND_RESULT_TYPE,
    SIGN_IN_COMPLETED_RESULT_TYPE,
    SIGN_IN_PASSWORD_REQUIRED_RESULT_TYPE,
    SIGN_IN_JIT_REQUIRED_RESULT_TYPE,
    SIGN_IN_MFA_REQUIRED_RESULT_TYPE,
    SignInCodeSendResult,
    SignInJitRequiredResult,
    SignInCompletedResult,
    SignInMfaRequiredResult,
} from "../../../../src/custom_auth/sign_in/interaction_client/result/SignInActionResult.js";
import { SignInScenario } from "../../../../src/custom_auth/sign_in/auth_flow/SignInScenario.js";
import { StubbedNetworkModule } from "@azure/msal-common/browser";
import { buildConfiguration } from "../../../../src/config/Configuration.js";
import {
    getDefaultBrowserCacheManager,
    getDefaultCrypto,
    getDefaultEventHandler,
    getDefaultLogger,
    getDefaultNavigationClient,
    getDefaultPerformanceClient,
} from "../../test_resources/TestModules.js";
import {
    TestServerTokenResponse,
    TestTenantId,
} from "../../test_resources/TestConstants.js";
import { CustomAuthApiError } from "../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import {
    REGISTRATION_REQUIRED,
    MFA_REQUIRED,
} from "../../../../src/custom_auth/core/network_client/custom_auth_api/types/ApiSuberrors.js";
import * as CustomAuthApiErrorCode from "../../../../src/custom_auth/core/network_client/custom_auth_api/types/ApiErrorCodes.js";
import {
    SignInContinuationTokenParams,
    SignInSubmitCodeParams,
    SignInSubmitPasswordParams,
} from "../../../../src/custom_auth/sign_in/interaction_client/parameter/SignInParams.js";

jest.mock(
    "../../../../src/custom_auth/core/network_client/custom_auth_api/CustomAuthApiClient.js",
    () => {
        let signInApiClient = {
            initiate: jest.fn(),
            requestChallenge: jest.fn(),
            requestTokensWithPassword: jest.fn(),
            requestTokensWithOob: jest.fn(),
            requestTokenWithContinuationToken: jest.fn(),
            requestAuthMethods: jest.fn(),
        };
        let signUpApiClient = {
            start: jest.fn(),
            requestChallenge: jest.fn(),
            continueWithCode: jest.fn(),
            continueWithPassword: jest.fn(),
            continueWithAttributes: jest.fn(),
        };
        let resetPasswordApiClient = {
            start: jest.fn(),
            requestChallenge: jest.fn(),
            continueWithCode: jest.fn(),
            submitNewPassword: jest.fn(),
            pollCompletion: jest.fn(),
        };
        let registerApiClient = {
            introspect: jest.fn(),
            challenge: jest.fn(),
            continueWithOob: jest.fn(),
            continueWithContinuationToken: jest.fn(),
        };

        // Set up the prototype or instance methods/properties
        const CustomAuthApiClient = jest.fn().mockImplementation(() => ({
            signInApi: signInApiClient,
            signUpApi: signUpApiClient,
            resetPasswordApi: resetPasswordApiClient,
            registerApi: registerApiClient,
        }));

        const mockedApiClient = new CustomAuthApiClient();
        return {
            mockedApiClient,
            signInApiClient,
            signUpApiClient,
            resetPasswordApiClient,
            registerApiClient,
        };
    }
);

describe("SignInClient", () => {
    let client: SignInClient;
    let authority: CustomAuthAuthority;
    const { mockedApiClient, signInApiClient, registerApiClient } =
        jest.requireMock(
            "../../../../src/custom_auth/core/network_client/custom_auth_api/CustomAuthApiClient.js"
        );

    beforeEach(() => {
        const clientId = customAuthConfig.auth.clientId;
        const mockBrowserConfiguration = buildConfiguration(
            { auth: { clientId: clientId } },
            false
        );
        const mockLogger = getDefaultLogger();
        const mockPerformanceClient = getDefaultPerformanceClient(clientId);
        const mockEventHandler = getDefaultEventHandler();
        const mockCrypto = getDefaultCrypto(
            clientId,
            mockLogger,
            mockPerformanceClient
        );
        const mockCacheManager = getDefaultBrowserCacheManager(
            clientId,
            mockLogger,
            mockPerformanceClient,
            mockEventHandler,
            undefined,
            mockBrowserConfiguration.cache
        );

        authority = new CustomAuthAuthority(
            customAuthConfig.auth.authority ?? "",
            mockBrowserConfiguration,
            StubbedNetworkModule,
            mockCacheManager,
            mockLogger,
            mockPerformanceClient,
            customAuthConfig.customAuth.authApiProxyUrl
        );

        client = new SignInClient(
            mockBrowserConfiguration,
            mockCacheManager,
            mockCrypto,
            mockLogger,
            mockEventHandler,
            getDefaultNavigationClient(),
            mockPerformanceClient,
            mockedApiClient,
            authority
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("start", () => {
        it("should return SignInCodeSendResult when challenge type is OOB", async () => {
            signInApiClient.initiate.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signInApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.OOB,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
                code_length: 6,
                challenge_channel: "email",
                challenge_target_label: "email",
            });

            const result = await client.start({
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
            });

            expect(result.type === SIGN_IN_CODE_SEND_RESULT_TYPE).toBeTruthy();

            const codeSendResult = result as SignInCodeSendResult;
            expect(codeSendResult.correlationId).toBe("corr123");
            expect(codeSendResult.continuationToken).toBe(
                "continuation_token_2"
            );
            expect(codeSendResult.codeLength).toBe(6);
            expect(codeSendResult.challengeChannel).toBe("email");
            expect(codeSendResult.challengeTargetLabel).toBe("email");
        });

        it("should return SignInContinuationTokenResult when challenge type is PASSWORD", async () => {
            signInApiClient.initiate.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signInApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.PASSWORD,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
            });

            const result = await client.start({
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
            });

            expect(result.type).toStrictEqual(
                SIGN_IN_PASSWORD_REQUIRED_RESULT_TYPE
            );
            expect(result.correlationId).toBe("corr123");
            expect(result.continuationToken).toBe("continuation_token_2");
        });

        it("should throw error for unsupported challenge type", async () => {
            signInApiClient.initiate.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signInApiClient.requestChallenge.mockResolvedValue({
                challenge_type: "unsupported_type",
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
            });

            await expect(
                client.start({
                    username: "abc@abc.com",
                    clientId: customAuthConfig.auth.clientId,
                    challengeType: [
                        ChallengeType.OOB,
                        ChallengeType.PASSWORD,
                        ChallengeType.REDIRECT,
                    ],
                    correlationId: "corr123",
                })
            ).rejects.toThrow(
                expect.objectContaining({
                    error: CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
                })
            );
        });
    });

    describe("submitCode", () => {
        let signInSubmitCodeParams: SignInSubmitCodeParams;

        beforeEach(() => {
            signInApiClient.requestTokensWithOob.mockResolvedValue(
                TestServerTokenResponse
            );

            signInSubmitCodeParams = {
                code: "123456",
                continuationToken: "continuation_token_1",
                username: "abc@test.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
                scopes: [],
            };
        });

        it("should return SignInCompleteResult for valid code", async () => {
            const result = await client.submitCode(signInSubmitCodeParams);

            expect(result.type).toStrictEqual(SIGN_IN_COMPLETED_RESULT_TYPE);
            expect(result.correlationId).toBe(
                TestServerTokenResponse.correlation_id
            );

            if (result.type === SIGN_IN_COMPLETED_RESULT_TYPE) {
                const completedResult = result as SignInCompletedResult;
                expect(completedResult.authenticationResult).toBeDefined();
                expect(completedResult.authenticationResult.accessToken).toBe(
                    TestServerTokenResponse.access_token
                );
                expect(completedResult.authenticationResult.idToken).toBe(
                    TestServerTokenResponse.id_token
                );
                expect(
                    completedResult.authenticationResult.expiresOn
                ).toBeDefined();
                expect(completedResult.authenticationResult.tokenType).toBe(
                    TestServerTokenResponse.token_type
                );
                expect(completedResult.authenticationResult.authority).toBe(
                    authority.canonicalAuthority
                );
                expect(completedResult.authenticationResult.tenantId).toBe(
                    TestTenantId
                );
                expect(
                    completedResult.authenticationResult.account
                ).toBeDefined();
                expect(
                    completedResult.authenticationResult.account.username
                ).toBe("abc@test.com");
            }
        });

        it("should include claims in password token request", async () => {
            const claims = JSON.stringify({
                access_token: {
                    acrs: {
                        essential: true,
                        value: "c1",
                    },
                },
            });

            signInSubmitCodeParams.claims = claims;
            await client.submitCode(signInSubmitCodeParams);

            // Verify that the API was called with claims
            expect(signInApiClient.requestTokensWithOob).toHaveBeenCalledWith(
                expect.objectContaining({
                    claims: claims,
                })
            );
        });

        it("should return SignInJitRequiredResult when REGISTRATION_REQUIRED error occurs", async () => {
            const jitError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "JIT registration is required",
                "corr123"
            );
            jitError.subError = REGISTRATION_REQUIRED;
            jitError.continuationToken = "jit_continuation_token";

            const mockIntrospectResponse = {
                correlation_id: "jit_corr_id",
                continuation_token: "jit_introspect_continuation_token",
                methods: [
                    { id: "email", type: "email" },
                    { id: "phone", type: "phone" },
                ],
            };

            signInApiClient.requestTokensWithOob.mockRejectedValue(jitError);
            registerApiClient.introspect.mockResolvedValue(
                mockIntrospectResponse
            );

            const result = await client.submitCode({
                code: "123456",
                continuationToken: "continuation_token_1",
                username: "abc@test.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
                scopes: [],
            });

            expect(result.type).toStrictEqual(SIGN_IN_JIT_REQUIRED_RESULT_TYPE);
            expect(result.correlationId).toBe("jit_corr_id");

            if (result.type === SIGN_IN_JIT_REQUIRED_RESULT_TYPE) {
                const jitResult = result as SignInJitRequiredResult;
                expect(jitResult.continuationToken).toBe(
                    "jit_introspect_continuation_token"
                );
                expect(jitResult.authMethods).toEqual(
                    mockIntrospectResponse.methods
                );
            }

            // Verify introspect was called with correct parameters
            expect(registerApiClient.introspect).toHaveBeenCalledWith({
                continuation_token: "jit_continuation_token",
                correlationId: "corr123",
                telemetryManager: expect.any(Object),
            });
        });

        it("should return SignInMfaRequiredResult when MFA_REQUIRED error occurs", async () => {
            const mfaError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "MFA is required",
                "corr123"
            );
            mfaError.subError = MFA_REQUIRED;
            mfaError.continuationToken = "mfa_continuation_token";

            const mockMfaIntrospectResponse = {
                correlation_id: "mfa_corr_id",
                continuation_token: "mfa_introspect_continuation_token",
                methods: [
                    { id: "sms", type: "sms" },
                    { id: "email", type: "email" },
                ],
            };

            signInApiClient.requestTokensWithOob.mockRejectedValue(mfaError);
            signInApiClient.requestAuthMethods.mockResolvedValue(
                mockMfaIntrospectResponse
            );

            const result = await client.submitCode({
                code: "123456",
                continuationToken: "continuation_token_1",
                username: "abc@test.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
                scopes: [],
            });

            expect(result.type).toStrictEqual(SIGN_IN_MFA_REQUIRED_RESULT_TYPE);
            expect(result.correlationId).toBe("mfa_corr_id");

            if (result.type === SIGN_IN_MFA_REQUIRED_RESULT_TYPE) {
                const mfaResult = result as SignInMfaRequiredResult;
                expect(mfaResult.continuationToken).toBe(
                    "mfa_introspect_continuation_token"
                );
                expect(mfaResult.authMethods).toEqual(
                    mockMfaIntrospectResponse.methods
                );
            }

            // Verify introspect was called with correct parameters
            expect(signInApiClient.requestAuthMethods).toHaveBeenCalledWith({
                continuation_token: "mfa_continuation_token",
                correlationId: "corr123",
                telemetryManager: expect.any(Object),
            });
        });

        it("should throw error when introspect call fails during MFA", async () => {
            const mfaError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "MFA is required",
                "corr123"
            );
            mfaError.subError = MFA_REQUIRED;
            mfaError.continuationToken = "mfa_continuation_token";

            const introspectError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "MFA introspect call failed",
                "corr123"
            );

            signInApiClient.requestTokensWithOob.mockRejectedValue(mfaError);
            signInApiClient.requestAuthMethods.mockRejectedValue(
                introspectError
            );

            await expect(
                client.submitCode({
                    code: "123456",
                    continuationToken: "continuation_token_1",
                    username: "abc@test.com",
                    clientId: customAuthConfig.auth.clientId,
                    challengeType: [
                        ChallengeType.OOB,
                        ChallengeType.PASSWORD,
                        ChallengeType.REDIRECT,
                    ],
                    correlationId: "corr123",
                    scopes: [],
                })
            ).rejects.toThrow(introspectError);
        });

        it("should throw error for any other error", async () => {
            const genericError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "Invalid code",
                "corr123"
            );

            signInApiClient.requestTokensWithOob.mockRejectedValue(
                genericError
            );

            await expect(
                client.submitCode({
                    code: "invalid",
                    continuationToken: "continuation_token_1",
                    username: "abc@test.com",
                    clientId: customAuthConfig.auth.clientId,
                    challengeType: [
                        ChallengeType.OOB,
                        ChallengeType.PASSWORD,
                        ChallengeType.REDIRECT,
                    ],
                    correlationId: "corr123",
                    scopes: [],
                })
            ).rejects.toThrow(genericError);
        });
    });

    describe("submitPassword", () => {
        let signInSubmitPasswordParams: SignInSubmitPasswordParams;

        beforeEach(() => {
            signInApiClient.requestTokensWithPassword.mockResolvedValue(
                TestServerTokenResponse
            );

            signInSubmitPasswordParams = {
                password: "123456",
                continuationToken: "continuation_token_1",
                username: "abc@test.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
                scopes: [],
            };
        });

        it("should return SignInCompleteResult for valid password", async () => {
            const result = await client.submitPassword(
                signInSubmitPasswordParams
            );

            expect(result.type).toStrictEqual(SIGN_IN_COMPLETED_RESULT_TYPE);
            expect(result.correlationId).toBe(
                TestServerTokenResponse.correlation_id
            );

            const completedResult = result as SignInCompletedResult;
            expect(completedResult.authenticationResult).toBeDefined();
            expect(completedResult.authenticationResult.accessToken).toBe(
                TestServerTokenResponse.access_token
            );
            expect(completedResult.authenticationResult.idToken).toBe(
                TestServerTokenResponse.id_token
            );
            expect(
                completedResult.authenticationResult.expiresOn
            ).toBeDefined();
            expect(completedResult.authenticationResult.tokenType).toBe(
                TestServerTokenResponse.token_type
            );
            expect(completedResult.authenticationResult.authority).toBe(
                authority.canonicalAuthority
            );
            expect(completedResult.authenticationResult.tenantId).toBe(
                TestTenantId
            );
            expect(completedResult.authenticationResult.account).toBeDefined();
            expect(completedResult.authenticationResult.account.username).toBe(
                "abc@test.com"
            );
        });

        it("should include claims in password token request", async () => {
            const claims = JSON.stringify({
                access_token: {
                    acrs: {
                        essential: true,
                        value: "c1",
                    },
                },
            });

            signInSubmitPasswordParams.claims = claims;
            await client.submitPassword(signInSubmitPasswordParams);

            // Verify that the API was called with claims
            expect(
                signInApiClient.requestTokensWithPassword
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    claims: claims,
                })
            );
        });

        it("should throw error when non-CustomAuthApiError occurs", async () => {
            const genericError = new Error("Network error");

            signInApiClient.requestTokensWithPassword.mockRejectedValue(
                genericError
            );

            await expect(
                client.submitPassword({
                    password: "123456",
                    continuationToken: "continuation_token_1",
                    username: "abc@test.com",
                    clientId: customAuthConfig.auth.clientId,
                    challengeType: [
                        ChallengeType.OOB,
                        ChallengeType.PASSWORD,
                        ChallengeType.REDIRECT,
                    ],
                    correlationId: "corr123",
                    scopes: [],
                })
            ).rejects.toThrow(genericError);
        });

        it("should return SignInJitRequiredResult when REGISTRATION_REQUIRED error occurs", async () => {
            const jitError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "JIT registration is required",
                "corr123"
            );
            jitError.subError = REGISTRATION_REQUIRED;
            jitError.continuationToken = "jit_continuation_token";

            const mockIntrospectResponse = {
                correlation_id: "corr123",
                continuation_token: "introspect_continuation_token",
                methods: [
                    { id: "email", type: "email" },
                    { id: "phone", type: "phone" },
                ],
            };

            signInApiClient.requestTokensWithPassword.mockRejectedValue(
                jitError
            );
            registerApiClient.introspect.mockResolvedValue(
                mockIntrospectResponse
            );

            const result = await client.submitPassword({
                password: "123456",
                continuationToken: "continuation_token_1",
                username: "abc@test.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [ChallengeType.PASSWORD],
                correlationId: "corr123",
                scopes: [],
            });

            expect(result.type).toStrictEqual(SIGN_IN_JIT_REQUIRED_RESULT_TYPE);
            expect(result.correlationId).toBe("corr123");

            if (result.type === SIGN_IN_JIT_REQUIRED_RESULT_TYPE) {
                const jitResult = result as SignInJitRequiredResult;
                expect(jitResult.continuationToken).toBe(
                    "introspect_continuation_token"
                );
                expect(jitResult.authMethods).toEqual(
                    mockIntrospectResponse.methods
                );
            }

            // Verify introspect was called with correct parameters
            expect(registerApiClient.introspect).toHaveBeenCalledWith({
                continuation_token: "jit_continuation_token",
                correlationId: "corr123",
                telemetryManager: expect.any(Object),
            });
        });

        it("should throw error when introspect call fails during JIT registration", async () => {
            const jitError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "JIT registration is required",
                "corr123"
            );
            jitError.subError = REGISTRATION_REQUIRED;
            jitError.continuationToken = "jit_continuation_token";

            const introspectError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "Introspect call failed",
                "corr123"
            );

            signInApiClient.requestTokensWithPassword.mockRejectedValue(
                jitError
            );
            registerApiClient.introspect.mockRejectedValue(introspectError);

            await expect(
                client.submitPassword({
                    password: "123456",
                    continuationToken: "continuation_token_1",
                    username: "abc@test.com",
                    clientId: customAuthConfig.auth.clientId,
                    challengeType: [ChallengeType.PASSWORD],
                    correlationId: "corr123",
                    scopes: [],
                })
            ).rejects.toThrow(introspectError);
        });

        it("should return SignInMfaRequiredResult when MFA_REQUIRED error occurs", async () => {
            const mfaError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "MFA is required",
                "corr123"
            );
            mfaError.subError = MFA_REQUIRED;
            mfaError.continuationToken = "mfa_continuation_token";

            const mockMfaIntrospectResponse = {
                correlation_id: "mfa_corr_id",
                continuation_token: "mfa_introspect_continuation_token",
                methods: [
                    { id: "sms", type: "sms" },
                    { id: "email", type: "email" },
                ],
            };

            signInApiClient.requestTokensWithPassword.mockRejectedValue(
                mfaError
            );
            signInApiClient.requestAuthMethods.mockResolvedValue(
                mockMfaIntrospectResponse
            );

            const result = await client.submitPassword({
                password: "123456",
                continuationToken: "continuation_token_1",
                username: "abc@test.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [ChallengeType.PASSWORD],
                correlationId: "corr123",
                scopes: [],
            });

            expect(result.type).toStrictEqual(SIGN_IN_MFA_REQUIRED_RESULT_TYPE);
            expect(result.correlationId).toBe("mfa_corr_id");

            if (result.type === SIGN_IN_MFA_REQUIRED_RESULT_TYPE) {
                const mfaResult = result as SignInMfaRequiredResult;
                expect(mfaResult.continuationToken).toBe(
                    "mfa_introspect_continuation_token"
                );
                expect(mfaResult.authMethods).toEqual(
                    mockMfaIntrospectResponse.methods
                );
            }

            // Verify introspect was called with correct parameters
            expect(signInApiClient.requestAuthMethods).toHaveBeenCalledWith({
                continuation_token: "mfa_continuation_token",
                correlationId: "corr123",
                telemetryManager: expect.any(Object),
            });
        });

        it("should throw error when introspect call fails during MFA", async () => {
            const mfaError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "MFA is required",
                "corr123"
            );
            mfaError.subError = MFA_REQUIRED;
            mfaError.continuationToken = "mfa_continuation_token";

            const introspectError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "MFA introspect call failed",
                "corr123"
            );

            signInApiClient.requestTokensWithPassword.mockRejectedValue(
                mfaError
            );
            signInApiClient.requestAuthMethods.mockRejectedValue(
                introspectError
            );

            await expect(
                client.submitPassword({
                    password: "123456",
                    continuationToken: "continuation_token_1",
                    username: "abc@test.com",
                    clientId: customAuthConfig.auth.clientId,
                    challengeType: [ChallengeType.PASSWORD],
                    correlationId: "corr123",
                    scopes: [],
                })
            ).rejects.toThrow(introspectError);
        });
    });

    describe("resendCode", () => {
        it("should return SignInCodeSendResult", async () => {
            signInApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.OOB,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
                code_length: 6,
                challenge_channel: "email",
                challenge_target_label: "email",
            });

            const result = await client.resendCode({
                continuationToken: "continuation_token_1",
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
            });

            expect(result.correlationId).toBe("corr123");
            expect(result.continuationToken).toBe("continuation_token_2");
            expect(result.codeLength).toBe(6);
            expect(result.challengeChannel).toBe("email");
            expect(result.challengeTargetLabel).toBe("email");
        });

        it("should throw error when challenge type is PASSWORD", async () => {
            signInApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.PASSWORD,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
            });

            await expect(
                client.resendCode({
                    continuationToken: "continuation_token_1",
                    username: "abc@abc.com",
                    clientId: customAuthConfig.auth.clientId,
                    challengeType: [
                        ChallengeType.OOB,
                        ChallengeType.PASSWORD,
                        ChallengeType.REDIRECT,
                    ],
                    correlationId: "corr123",
                })
            ).rejects.toThrow(
                expect.objectContaining({
                    error: CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
                })
            );
        });
    });

    describe("signInWithContinuationToken", () => {
        let signInContinuationTokenParams: SignInContinuationTokenParams;

        beforeEach(() => {
            signInApiClient.requestTokenWithContinuationToken.mockResolvedValue(
                TestServerTokenResponse
            );

            signInContinuationTokenParams = {
                continuationToken: "continuation_token_1",
                username: "abc@test.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
                scopes: [],
                signInScenario: SignInScenario.SignInAfterSignUp,
            };
        });

        it("should return SignInCompleteResult", async () => {
            const result = await client.signInWithContinuationToken(
                signInContinuationTokenParams
            );

            expect(result.correlationId).toBe(
                TestServerTokenResponse.correlation_id
            );
            expect(result.type).toBe(SIGN_IN_COMPLETED_RESULT_TYPE);

            if (result.type === SIGN_IN_COMPLETED_RESULT_TYPE) {
                const completedResult = result as SignInCompletedResult;
                expect(completedResult.authenticationResult).toBeDefined();
                expect(completedResult.authenticationResult.accessToken).toBe(
                    TestServerTokenResponse.access_token
                );
                expect(completedResult.authenticationResult.idToken).toBe(
                    TestServerTokenResponse.id_token
                );
                expect(
                    completedResult.authenticationResult.expiresOn
                ).toBeDefined();
                expect(completedResult.authenticationResult.tokenType).toBe(
                    TestServerTokenResponse.token_type
                );
                expect(completedResult.authenticationResult.authority).toBe(
                    authority.canonicalAuthority
                );
                expect(completedResult.authenticationResult.tenantId).toBe(
                    TestTenantId
                );
                expect(
                    completedResult.authenticationResult.account
                ).toBeDefined();
                expect(
                    completedResult.authenticationResult.account.username
                ).toBe("abc@test.com");
            }
        });

        it("should return SignInCompleteResult for SignInAfterPasswordReset scenario", async () => {
            signInContinuationTokenParams.signInScenario =
                SignInScenario.SignInAfterPasswordReset;

            const result = await client.signInWithContinuationToken(
                signInContinuationTokenParams
            );

            expect(result.correlationId).toBe(
                TestServerTokenResponse.correlation_id
            );
            expect(result.type).toBe(SIGN_IN_COMPLETED_RESULT_TYPE);
        });

        it("should throw error for unsupported sign-in scenario", async () => {
            signInContinuationTokenParams.signInScenario =
                "unsupported_scenario" as any;

            await expect(
                client.signInWithContinuationToken(
                    signInContinuationTokenParams
                )
            ).rejects.toThrow(
                expect.objectContaining({
                    message: expect.stringContaining(
                        "Unsupported sign-in scenario"
                    ),
                })
            );
        });

        it("should include claims in password token request", async () => {
            const claims = JSON.stringify({
                access_token: {
                    acrs: {
                        essential: true,
                        value: "c1",
                    },
                },
            });

            signInContinuationTokenParams.claims = claims;
            await client.signInWithContinuationToken(
                signInContinuationTokenParams
            );

            // Verify that the API was called with claims
            expect(
                signInApiClient.requestTokenWithContinuationToken
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    claims: claims,
                })
            );
        });

        it("should throw error for any other error", async () => {
            const genericError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "Invalid continuation token",
                "corr123"
            );

            signInApiClient.requestTokenWithContinuationToken.mockRejectedValue(
                genericError
            );

            await expect(
                client.signInWithContinuationToken({
                    continuationToken: "invalid_token",
                    username: "abc@test.com",
                    clientId: customAuthConfig.auth.clientId,
                    challengeType: [
                        ChallengeType.OOB,
                        ChallengeType.PASSWORD,
                        ChallengeType.REDIRECT,
                    ],
                    correlationId: "corr123",
                    scopes: [],
                    signInScenario: SignInScenario.SignInAfterSignUp,
                })
            ).rejects.toThrow(genericError);
        });

        it("should return SignInJitRequiredResult when REGISTRATION_REQUIRED error occurs", async () => {
            const jitError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "JIT registration is required",
                "corr123"
            );
            jitError.subError = REGISTRATION_REQUIRED;
            jitError.continuationToken = "jit_continuation_token";

            const mockIntrospectResponse = {
                correlation_id: "introspect_corr_id",
                continuation_token: "introspect_continuation_token",
                methods: [
                    { id: "email", type: "email" },
                    { id: "phone", type: "phone" },
                ],
            };

            signInApiClient.requestTokenWithContinuationToken.mockRejectedValue(
                jitError
            );
            registerApiClient.introspect.mockResolvedValue(
                mockIntrospectResponse
            );

            const result = await client.signInWithContinuationToken({
                continuationToken: "continuation_token_1",
                username: "abc@test.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
                scopes: [],
                signInScenario: SignInScenario.SignInAfterSignUp,
            });

            expect(result.type).toStrictEqual(SIGN_IN_JIT_REQUIRED_RESULT_TYPE);
            expect(result.correlationId).toBe("introspect_corr_id");

            if (result.type === SIGN_IN_JIT_REQUIRED_RESULT_TYPE) {
                const jitResult = result as SignInJitRequiredResult;
                expect(jitResult.continuationToken).toBe(
                    "introspect_continuation_token"
                );
                expect(jitResult.authMethods).toEqual(
                    mockIntrospectResponse.methods
                );
            }

            // Verify introspect was called with correct parameters
            expect(registerApiClient.introspect).toHaveBeenCalledWith({
                continuation_token: "jit_continuation_token",
                correlationId: "corr123",
                telemetryManager: expect.any(Object),
            });
        });

        it("should return SignInMfaRequiredResult when MFA_REQUIRED error occurs", async () => {
            const mfaError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "MFA is required",
                "corr123"
            );
            mfaError.subError = MFA_REQUIRED;
            mfaError.continuationToken = "mfa_continuation_token";

            const mockMfaIntrospectResponse = {
                correlation_id: "mfa_corr_id",
                continuation_token: "mfa_introspect_continuation_token",
                methods: [
                    { id: "sms", type: "sms" },
                    { id: "email", type: "email" },
                ],
            };

            signInApiClient.requestTokenWithContinuationToken.mockRejectedValue(
                mfaError
            );
            signInApiClient.requestAuthMethods.mockResolvedValue(
                mockMfaIntrospectResponse
            );

            const result = await client.signInWithContinuationToken({
                continuationToken: "continuation_token_1",
                username: "abc@test.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
                scopes: [],
                signInScenario: SignInScenario.SignInAfterSignUp,
            });

            expect(result.type).toStrictEqual(SIGN_IN_MFA_REQUIRED_RESULT_TYPE);
            expect(result.correlationId).toBe("mfa_corr_id");

            if (result.type === SIGN_IN_MFA_REQUIRED_RESULT_TYPE) {
                const mfaResult = result as SignInMfaRequiredResult;
                expect(mfaResult.continuationToken).toBe(
                    "mfa_introspect_continuation_token"
                );
                expect(mfaResult.authMethods).toEqual(
                    mockMfaIntrospectResponse.methods
                );
            }

            // Verify introspect was called with correct parameters
            expect(signInApiClient.requestAuthMethods).toHaveBeenCalledWith({
                continuation_token: "mfa_continuation_token",
                correlationId: "corr123",
                telemetryManager: expect.any(Object),
            });
        });

        it("should throw error when MFA introspect call fails", async () => {
            const mfaError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "MFA is required",
                "corr123"
            );
            mfaError.subError = MFA_REQUIRED;
            mfaError.continuationToken = "mfa_continuation_token";

            const introspectError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "MFA introspect call failed",
                "corr123"
            );

            signInApiClient.requestTokenWithContinuationToken.mockRejectedValue(
                mfaError
            );
            signInApiClient.requestAuthMethods.mockRejectedValue(
                introspectError
            );

            await expect(
                client.signInWithContinuationToken({
                    continuationToken: "continuation_token_1",
                    username: "abc@test.com",
                    clientId: customAuthConfig.auth.clientId,
                    challengeType: [
                        ChallengeType.OOB,
                        ChallengeType.PASSWORD,
                        ChallengeType.REDIRECT,
                    ],
                    correlationId: "corr123",
                    scopes: [],
                    signInScenario: SignInScenario.SignInAfterSignUp,
                })
            ).rejects.toThrow(introspectError);
        });
    });
});
