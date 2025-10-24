import { CustomAuthStandardController } from "../../../src/custom_auth/controller/CustomAuthStandardController.js";
import {
    ResetPasswordInputs,
    SignInInputs,
    SignUpInputs,
} from "../../../src/custom_auth/CustomAuthActionInputs.js";
import { CustomAuthOperatingContext } from "../../../src/custom_auth/operating_context/CustomAuthOperatingContext.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { SignInError } from "../../../src/custom_auth/sign_in/auth_flow/error_type/SignInError.js";
import { SignInResult } from "../../../src/custom_auth/sign_in/auth_flow/result/SignInResult.js";
import { CustomAuthAccountData } from "../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { SignUpError } from "../../../src/custom_auth/sign_up/auth_flow/error_type/SignUpError.js";
import { ChallengeType } from "../../../src/custom_auth/CustomAuthConstants.js";
import {
    CustomAuthApiError,
    RedirectError,
} from "../../../src/custom_auth/core/error/CustomAuthApiError.js";
import { SignUpResult } from "../../../src/custom_auth/sign_up/auth_flow/result/SignUpResult.js";
import * as CustomAuthApiErrorCode from "../../../src/custom_auth/core/network_client/custom_auth_api/types/ApiErrorCodes.js";
import * as CustomAuthApiSuberror from "../../../src/custom_auth/core/network_client/custom_auth_api/types/ApiSuberrors.js";
import { ResetPasswordError } from "../../../src/custom_auth/reset_password/auth_flow/error_type/ResetPasswordError.js";
import { ResetPasswordCodeRequiredState } from "../../../src/custom_auth/reset_password/auth_flow/state/ResetPasswordCodeRequiredState.js";
import { ResetPasswordStartResult } from "../../../src/custom_auth/reset_password/auth_flow/result/ResetPasswordStartResult.js";
import { TestServerTokenResponse } from "../test_resources/TestConstants.js";

jest.mock(
    "../../../src/custom_auth/core/network_client/custom_auth_api/CustomAuthApiClient.js",
    () => {
        let signInApiClient = {
            initiate: jest.fn(),
            requestChallenge: jest.fn(),
            requestTokensWithPassword: jest.fn(),
            requestTokensWithOTP: jest.fn(),
            requestAuthMethods: jest.fn(),
        };
        let signUpApiClient = {
            start: jest.fn(),
            requestChallenge: jest.fn(),
            continue: jest.fn(),
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

        return {
            CustomAuthApiClient,
            signInApiClient,
            signUpApiClient,
            resetPasswordApiClient,
            registerApiClient,
        };
    }
);

describe("CustomAuthStandardController", () => {
    let controller: CustomAuthStandardController;
    const {
        signInApiClient,
        signUpApiClient,
        resetPasswordApiClient,
        registerApiClient,
    } = jest.requireMock(
        "../../../src/custom_auth/core/network_client/custom_auth_api/CustomAuthApiClient.js"
    );

    beforeEach(() => {
        const context = new CustomAuthOperatingContext(customAuthConfig);
        controller = new CustomAuthStandardController(context);

        global.fetch = jest.fn(); // Mock the fetch API
    });

    afterEach(() => {
        // controller.closeEventChannel();
        jest.clearAllMocks(); // Clear mocks between tests
        if (
            controller &&
            controller["eventHandler"] &&
            controller["eventHandler"]["broadcastChannel"]
        ) {
            controller["eventHandler"]["broadcastChannel"].close();
        }
    });

    describe("signIn", () => {
        it("should return error result if provided username is invalid", async () => {
            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "",
            };

            const result = await controller.signIn(signInInputs);

            expect(result.error).toBeDefined();
            expect(result.error).toBeInstanceOf(SignInError);

            expect(result.error?.isInvalidUsername()).toBe(true);
        });

        it("should return code required result if the challenge type is oob", async () => {
            signInApiClient.initiate.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signInApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.OOB,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
                code_length: 6,
                challenge_channel: "email",
                target_challenge_label: "email",
            });

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeUndefined();
            expect(result.isCodeRequired()).toBe(true);
        });

        it("should return password required result if the challenge type is password", async () => {
            signInApiClient.initiate.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signInApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.PASSWORD,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
            });

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeUndefined();
            expect(result.isPasswordRequired()).toBe(true);
        });

        it("should return correct completed result if the challenge type is password and password is provided", async () => {
            signInApiClient.initiate.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signInApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.PASSWORD,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
            });
            signInApiClient.requestTokensWithPassword.mockResolvedValue(
                TestServerTokenResponse
            );

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
                password: "test-password",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeUndefined();
            expect(result.isCompleted()).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data).toBeInstanceOf(CustomAuthAccountData);

            // Sign out for the other tests.
            await result.data?.signOut();
        });

        it("should return failed result if the challenge type is redirect", async () => {
            signInApiClient.initiate.mockRejectedValue(new RedirectError());

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
                password: "test-password",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeDefined();
            expect(result.error?.errorData).toBeDefined();
            expect(result.error?.isRedirectRequired()).toEqual(true);
            expect(result.isFailed()).toBe(true);
        });

        it("should handle invalid client configuration error", async () => {
            const configError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "Invalid client configuration",
                "correlation-id"
            );
            signInApiClient.initiate.mockRejectedValue(configError);

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle null signInInputs gracefully", async () => {
            const result = await controller.signIn(null as any);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeDefined();
            expect(result.error).toBeInstanceOf(SignInError);
            expect(result.isFailed()).toBe(true);
        });

        it("should handle undefined signInInputs gracefully", async () => {
            const result = await controller.signIn(undefined as any);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeDefined();
            expect(result.error).toBeInstanceOf(SignInError);
            expect(result.isFailed()).toBe(true);
        });

        it("should handle whitespace-only username", async () => {
            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "   ",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeDefined();
            expect(result.error).toBeInstanceOf(SignInError);
            expect(result.isFailed()).toBe(true);
        });

        it("should handle sign-in with custom scopes", async () => {
            signInApiClient.initiate.mockResolvedValue({
                challenge_type: ChallengeType.PASSWORD,
                correlation_id: "corr123",
                continuation_token: "continuation_token_1",
            });

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
                scopes: ["custom.scope1", "custom.scope2", "custom.scope3"],
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeUndefined();
            expect(result.isPasswordRequired()).toBe(true);
            // Verify scopes are passed through
            expect(result.state?.constructor.name).toBe(
                "SignInPasswordRequiredState"
            );
        });

        it("should handle sign-in when user is already signed in", async () => {
            // Mock that a user is already cached
            jest.spyOn(controller, "getCurrentAccount").mockReturnValue({
                data: {} as any,
                error: undefined,
            } as any);

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle sign-in with unsupported challenge type", async () => {
            // Setup the API to throw an error for unsupported challenge type
            const unsupportedError = new Error("Unsupported challenge type");
            unsupportedError.name = "CustomAuthApiError";
            signInApiClient.initiate.mockRejectedValue(unsupportedError);

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle sign-in with API network error", async () => {
            // Setup the API to throw a network error
            const networkError = new Error("Network error during sign-in");
            networkError.name = "NetworkError";
            signInApiClient.initiate.mockRejectedValue(networkError);

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle sign-in with JIT required after password submission", async () => {
            signInApiClient.initiate.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signInApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.PASSWORD,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
            });

            // Mock JIT required error - the API should throw, not return
            const jitError = new CustomAuthApiError(
                CustomAuthApiErrorCode.CREDENTIAL_REQUIRED,
                "JIT authentication method registration required",
                "corr123",
                [50011], // JIT_REQUIRED suberror code
                undefined,
                undefined,
                "jit_continuation_token"
            );
            jitError.subError = CustomAuthApiSuberror.REGISTRATION_REQUIRED; // Set the REGISTRATION_REQUIRED suberror
            signInApiClient.requestTokensWithPassword.mockRejectedValue(
                jitError
            );

            // Mock the register introspect call that will be made by SignInClient
            registerApiClient.introspect.mockResolvedValue({
                correlation_id: "corr123",
                continuation_token: "introspect_continuation_token",
                methods: [
                    {
                        id: "email_method",
                        challenge_type: "email",
                        challenge_channel: "email",
                        login_hint: "test@test.com",
                    },
                    {
                        id: "sms_method",
                        challenge_type: "sms",
                        challenge_channel: "phone_number",
                        login_hint: "+1234567890",
                    },
                ],
            });

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
                password: "test-password",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeUndefined();
            expect(result.isAuthMethodRegistrationRequired()).toBe(true);
            expect(result.state?.constructor.name).toBe(
                "AuthMethodRegistrationRequiredState"
            );
        });

        it("should handle unexpected result type after password submission", async () => {
            signInApiClient.initiate.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signInApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.PASSWORD,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
            });

            // Mock an unknown result type
            signInApiClient.requestTokensWithPassword.mockResolvedValue({
                type: "unknown_result_type",
                correlation_id: "corr123",
                continuation_token: "continuation_token_3",
            });

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
                password: "test-password",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeDefined();
            expect(result.error).toBeInstanceOf(SignInError);
        });

        it("should handle invalid client configuration error", async () => {
            const configError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "Invalid client configuration",
                "correlation-id"
            );
            signInApiClient.initiate.mockRejectedValue(configError);

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle null signInInputs gracefully", async () => {
            const result = await controller.signIn(null as any);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeDefined();
            expect(result.error).toBeInstanceOf(SignInError);
            expect(result.isFailed()).toBe(true);
        });

        it("should handle undefined signInInputs gracefully", async () => {
            const result = await controller.signIn(undefined as any);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeDefined();
            expect(result.error).toBeInstanceOf(SignInError);
            expect(result.isFailed()).toBe(true);
        });

        it("should handle whitespace-only username", async () => {
            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "   ",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeDefined();
            expect(result.error).toBeInstanceOf(SignInError);
            expect(result.isFailed()).toBe(true);
        });

        it("should handle sign-in with custom scopes", async () => {
            signInApiClient.initiate.mockResolvedValue({
                challenge_type: ChallengeType.PASSWORD,
                correlation_id: "corr123",
                continuation_token: "continuation_token_1",
            });

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
                scopes: ["custom.scope1", "custom.scope2", "custom.scope3"],
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeUndefined();
            expect(result.isPasswordRequired()).toBe(true);
            // Verify scopes are passed through
            expect(result.state?.constructor.name).toBe(
                "SignInPasswordRequiredState"
            );
        });

        it("should handle sign-in when user is already signed in", async () => {
            // Mock that a user is already cached
            jest.spyOn(controller, "getCurrentAccount").mockReturnValue({
                data: {} as any,
                error: undefined,
            } as any);

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle sign-in with unsupported challenge type", async () => {
            // Setup the API to throw an error for unsupported challenge type
            const unsupportedError = new Error("Unsupported challenge type");
            unsupportedError.name = "CustomAuthApiError";
            signInApiClient.initiate.mockRejectedValue(unsupportedError);

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle sign-in with API network error", async () => {
            // Setup the API to throw a network error
            const networkError = new Error("Network error during sign-in");
            networkError.name = "NetworkError";
            signInApiClient.initiate.mockRejectedValue(networkError);

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle sign-in with MFA required after password submission", async () => {
            signInApiClient.initiate.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signInApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.PASSWORD,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
            });
            signInApiClient.requestAuthMethods.mockResolvedValue({
                correlation_id: "corr123",
                auth_methods: [
                    {
                        id: "email_method",
                        type: "email",
                        channel: "email",
                        login_hint: "user@example.com",
                    },
                    {
                        id: "sms_method",
                        type: "sms",
                        channel: "sms",
                        login_hint: "+1234567890",
                    },
                ],
            });

            // Mock MFA required error - the API should throw, not return
            const mfaError = new CustomAuthApiError(
                CustomAuthApiErrorCode.CREDENTIAL_REQUIRED,
                "MFA required",
                "corr123",
                [55003], // MFA_REQUIRED suberror code
                undefined,
                undefined,
                "mfa_continuation_token"
            );
            mfaError.subError = "mfa_required"; // Set the MFA_REQUIRED suberror
            signInApiClient.requestTokensWithPassword.mockRejectedValue(
                mfaError
            );

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
                password: "test-password",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeUndefined();
            expect(result.isMfaRequired()).toBe(true);
            expect(result.state?.constructor.name).toBe("MfaAwaitingState");
        });

        it("should handle network failure during sign-up start", async () => {
            const networkError = new Error("Network failure");
            networkError.name = "NetworkError";
            signUpApiClient.start.mockRejectedValue(networkError);

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeDefined();
            expect(result.error).toBeInstanceOf(SignUpError);
            expect(result.isFailed()).toBe(true);
        });

        it("should handle sign-up with custom attributes", async () => {
            signUpApiClient.start.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signUpApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.PASSWORD,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
            });

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
                attributes: {
                    firstName: "John",
                    lastName: "Doe",
                    company: "Test Corp",
                },
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeUndefined();
            expect(result.isPasswordRequired()).toBe(true);
        });

        it("should handle sign-up with both password and attributes", async () => {
            signUpApiClient.start.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signUpApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.PASSWORD,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
            });

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
                password: "test-password",
                attributes: {
                    firstName: "Jane",
                    lastName: "Smith",
                },
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeUndefined();
            expect(result.isPasswordRequired()).toBe(true);
        });

        it("should handle sign-up with invalid attribute format", async () => {
            const invalidAttributeError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "Invalid attribute format",
                "correlation-id"
            );
            signUpApiClient.start.mockRejectedValue(invalidAttributeError);

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
                attributes: {
                    invalidAttribute: null,
                } as any,
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle sign-up when user is already signed in", async () => {
            // Mock that a user is already cached
            jest.spyOn(controller, "getCurrentAccount").mockReturnValue({
                data: {} as any,
                error: undefined,
            } as any);

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle username already exists error", async () => {
            const userExistsError = new CustomAuthApiError(
                CustomAuthApiErrorCode.USER_ALREADY_EXISTS,
                "Username already exists",
                "correlation-id"
            );
            signUpApiClient.start.mockRejectedValue(userExistsError);

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "existing@test.com",
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle server internal error during sign-up", async () => {
            const serverError = new CustomAuthApiError(
                CustomAuthApiErrorCode.HTTP_REQUEST_FAILED,
                "Internal server error",
                "correlation-id"
            );
            signUpApiClient.start.mockRejectedValue(serverError);

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle malformed challenge response during sign-up", async () => {
            signUpApiClient.start.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signUpApiClient.requestChallenge.mockResolvedValue({
                // Missing required challenge_type field
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
            });

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });
    });

    describe("signUp", () => {
        it("should return error result if provided username is empty", async () => {
            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "",
            };

            const result = await controller.signUp(signUpInputs);

            expect(result.error).toBeDefined();
            expect(result.error).toBeInstanceOf(SignUpError);

            expect(result.error?.isInvalidUsername()).toBe(true);
        });

        it("should return result with code required state if the challenge type is oob", async () => {
            signUpApiClient.start.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signUpApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.OOB,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
                code_length: 6,
                challenge_channel: "email",
                challenge_target_label: "email",
            });

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeUndefined();
            expect(result.isCodeRequired()).toBe(true);
        });

        it("should return result with password required state if the challenge type is password", async () => {
            signUpApiClient.start.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signUpApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.PASSWORD,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
            });

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeUndefined();
            expect(result.isPasswordRequired()).toBe(true);
        });

        it("should return failed result if the start endpoint returns redirect challenge type", async () => {
            signUpApiClient.start.mockRejectedValue(new RedirectError());

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeDefined();
            expect(result.error?.errorData).toBeDefined();
            expect(result.error?.isRedirectRequired()).toEqual(true);
            expect(result.isFailed()).toBe(true);
        });

        it("should return failed result if the challenge endpoint returns redirect challenge type", async () => {
            signUpApiClient.start.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signUpApiClient.requestChallenge.mockRejectedValue(
                new RedirectError()
            );

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeDefined();
            expect(result.error?.errorData).toBeDefined();
            expect(result.error?.isRedirectRequired()).toEqual(true);
            expect(result.isFailed()).toBe(true);
        });

        it("should return failed result if the password is too weak", async () => {
            signUpApiClient.start.mockRejectedValue(
                new CustomAuthApiError(
                    CustomAuthApiErrorCode.INVALID_GRANT,
                    "Password is too weak",
                    "correlation-id",
                    [],
                    CustomAuthApiSuberror.PASSWORD_TOO_WEAK
                )
            );

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeDefined();
            expect(result.error?.errorData).toBeDefined();
            expect(result.error?.isInvalidPassword()).toEqual(true);
            expect(result.isFailed()).toBe(true);
        });

        it("should handle network failure during sign-up start", async () => {
            const networkError = new Error("Network failure");
            networkError.name = "NetworkError";
            signUpApiClient.start.mockRejectedValue(networkError);

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeDefined();
            expect(result.error).toBeInstanceOf(SignUpError);
            expect(result.isFailed()).toBe(true);
        });

        it("should handle sign-up with custom attributes", async () => {
            signUpApiClient.start.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signUpApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.PASSWORD,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
            });

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
                attributes: {
                    firstName: "John",
                    lastName: "Doe",
                    company: "Test Corp",
                },
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeUndefined();
            expect(result.isPasswordRequired()).toBe(true);
        });

        it("should handle sign-up with both password and attributes", async () => {
            signUpApiClient.start.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signUpApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.PASSWORD,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
            });

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
                password: "test-password",
                attributes: {
                    firstName: "Jane",
                    lastName: "Smith",
                },
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeUndefined();
            expect(result.isPasswordRequired()).toBe(true);
        });

        it("should handle sign-up with invalid attribute format", async () => {
            const invalidAttributeError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "Invalid attribute format",
                "correlation-id"
            );
            signUpApiClient.start.mockRejectedValue(invalidAttributeError);

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
                attributes: {
                    invalidAttribute: null,
                } as any,
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle sign-up when user is already signed in", async () => {
            // Mock that a user is already cached
            jest.spyOn(controller, "getCurrentAccount").mockReturnValue({
                data: {} as any,
                error: undefined,
            } as any);

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle username already exists error", async () => {
            const userExistsError = new CustomAuthApiError(
                CustomAuthApiErrorCode.USER_ALREADY_EXISTS,
                "Username already exists",
                "correlation-id"
            );
            signUpApiClient.start.mockRejectedValue(userExistsError);

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "existing@test.com",
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle server internal error during sign-up", async () => {
            const serverError = new CustomAuthApiError(
                CustomAuthApiErrorCode.HTTP_REQUEST_FAILED,
                "Internal server error",
                "correlation-id"
            );
            signUpApiClient.start.mockRejectedValue(serverError);

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle malformed challenge response during sign-up", async () => {
            signUpApiClient.start.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signUpApiClient.requestChallenge.mockResolvedValue({
                // Missing required challenge_type field
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
            });

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });
    });

    describe("resetPassword", () => {
        it("should return error result if provided username is invalid", async () => {
            // Empty username
            let inputs: ResetPasswordInputs = {
                correlationId: "correlation-id",
                username: "",
            };

            let result = await controller.resetPassword(inputs);

            expect(result.error).toBeDefined();
            expect(result.error).toBeInstanceOf(ResetPasswordError);

            expect(result.error?.isInvalidUsername()).toBe(true);
        });

        it("should return code required result successfully", async () => {
            resetPasswordApiClient.start.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            resetPasswordApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.OOB,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
                code_length: 8,
                challenge_channel: "email",
                target_challenge_label: "email",
            });

            const inputs: ResetPasswordInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.resetPassword(inputs);

            expect(result.error).toBeUndefined();
            expect(result.state).toBeInstanceOf(ResetPasswordCodeRequiredState);
            expect(result.isCodeRequired()).toBe(true);
        });

        it("should return redirect error if the return challenge is redirect", async () => {
            resetPasswordApiClient.start.mockRejectedValue(new RedirectError());

            const inputs: ResetPasswordInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.resetPassword(inputs);

            expect(result).toBeInstanceOf(ResetPasswordStartResult);
            expect(result.error).toBeDefined();
            expect(result.error?.errorData).toBeDefined();
            expect(result.error?.isRedirectRequired()).toEqual(true);
            expect(result.isFailed()).toBe(true);
        });

        it("should return failed result if the user is not found", async () => {
            resetPasswordApiClient.start.mockRejectedValue(
                new CustomAuthApiError(
                    CustomAuthApiErrorCode.USER_NOT_FOUND,
                    "User not found"
                )
            );

            const inputs: ResetPasswordInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.resetPassword(inputs);

            expect(result).toBeInstanceOf(ResetPasswordStartResult);
            expect(result.error).toBeDefined();
            expect(result.error?.errorData).toBeDefined();
            expect(result.error?.isUserNotFound()).toEqual(true);
            expect(result.isFailed()).toBe(true);
        });

        it("should handle network connectivity issues during reset password", async () => {
            const connectivityError = new Error("No internet connection");
            connectivityError.name = "ConnectivityError";
            resetPasswordApiClient.start.mockRejectedValue(connectivityError);

            const inputs: ResetPasswordInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.resetPassword(inputs);

            expect(result).toBeInstanceOf(ResetPasswordStartResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle malformed username in reset password", async () => {
            const inputs: ResetPasswordInputs = {
                correlationId: "correlation-id",
                username: "not-an-email",
            };

            // Mock API rejecting malformed username
            const malformedError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_REQUEST,
                "Username format is invalid",
                "correlation-id"
            );
            resetPasswordApiClient.start.mockRejectedValue(malformedError);

            const result = await controller.resetPassword(inputs);

            expect(result).toBeInstanceOf(ResetPasswordStartResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle server maintenance error during reset password", async () => {
            const inputs: ResetPasswordInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const maintenanceError = new CustomAuthApiError(
                CustomAuthApiErrorCode.HTTP_REQUEST_FAILED,
                "Service temporarily unavailable",
                "correlation-id"
            );
            resetPasswordApiClient.start.mockRejectedValue(maintenanceError);

            const result = await controller.resetPassword(inputs);

            expect(result).toBeInstanceOf(ResetPasswordStartResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle unauthorized access during reset password", async () => {
            const inputs: ResetPasswordInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const unauthorizedError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_GRANT,
                "Unauthorized access",
                "correlation-id"
            );
            resetPasswordApiClient.start.mockRejectedValue(unauthorizedError);

            const result = await controller.resetPassword(inputs);

            expect(result).toBeInstanceOf(ResetPasswordStartResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle server maintenance error during reset password", async () => {
            const maintenanceError = new CustomAuthApiError(
                CustomAuthApiErrorCode.HTTP_REQUEST_FAILED,
                "Service temporarily unavailable",
                "correlation-id"
            );
            resetPasswordApiClient.start.mockRejectedValue(maintenanceError);

            const inputs: ResetPasswordInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.resetPassword(inputs);

            expect(result).toBeInstanceOf(ResetPasswordStartResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle unauthorized access during reset password", async () => {
            const unauthorizedError = new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_GRANT,
                "Unauthorized access",
                "correlation-id"
            );
            resetPasswordApiClient.start.mockRejectedValue(unauthorizedError);

            const inputs: ResetPasswordInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.resetPassword(inputs);

            expect(result).toBeInstanceOf(ResetPasswordStartResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle reset password when user is already signed in", async () => {
            // Mock that a user is already cached
            jest.spyOn(controller, "getCurrentAccount").mockReturnValue({
                data: {} as any,
                error: undefined,
            } as any);

            const inputs: ResetPasswordInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.resetPassword(inputs);

            expect(result).toBeInstanceOf(ResetPasswordStartResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle null resetPasswordInputs gracefully", async () => {
            const result = await controller.resetPassword(null as any);

            expect(result).toBeInstanceOf(ResetPasswordStartResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });

        it("should handle API error during reset password", async () => {
            // Setup the API to throw an error
            const apiError = new Error("API error during reset password");
            apiError.name = "CustomAuthApiError";
            resetPasswordApiClient.start.mockRejectedValue(apiError);

            const inputs: ResetPasswordInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.resetPassword(inputs);

            expect(result).toBeInstanceOf(ResetPasswordStartResult);
            expect(result.error).toBeDefined();
            expect(result.isFailed()).toBe(true);
        });
    });

    describe("getCurrentAccount", () => {
        it("should handle getCurrentAccount with correlationId in inputs", () => {
            const inputs = {
                correlationId: "test-correlation-id",
            };

            const result = controller.getCurrentAccount(inputs);

            expect(result).toBeDefined();
            // Should return empty result when no account is cached
            expect(result.data).toBeUndefined();
        });

        it("should handle getCurrentAccount without inputs", () => {
            const result = controller.getCurrentAccount();

            expect(result).toBeDefined();
            expect(result.data).toBeUndefined();
        });

        it("should handle getCurrentAccount with null inputs", () => {
            const result = controller.getCurrentAccount(null as any);

            expect(result).toBeDefined();
            expect(result.data).toBeUndefined();
        });
    });
});
