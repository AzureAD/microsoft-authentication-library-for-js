import { CustomAuthStandardController } from "../../src/controller/CustomAuthStandardController.js";
import {
    SignInInputs,
    SignUpInputs,
} from "../../src/CustomAuthActionInputs.js";
import { CustomAuthOperatingContext } from "../../src/operating_context/CustomAuthOperatingContext.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { SignInError } from "../../src/sign_in/auth_flow/error_type/SignInError.js";
import { SignInResult } from "../../src/sign_in/auth_flow/result/SignInResult.js";
import {
    SignInState,
    SignUpState,
} from "../../src/core/auth_flow/AuthFlowStateBase.js";
import { AccountInfo } from "../../src/account/auth_flow/model/AccountInfo.js";
import { SignUpError } from "../../src/sign_up/auth_flow/error_type/SignUpError.js";
import { ChallengeType } from "../../src/CustomAuthConstants.js";
import {
    CustomAuthApiError,
    CustomAuthApiErrorCode,
    CustomAuthApiSuberror,
    RedirectError,
} from "../../src/core/error/CustomAuthApiError.js";
import { SignUpResult } from "../../src/sign_up/auth_flow/result/SignUpResult.js";

jest.mock("../../src/core/network_client/custom_auth_api/CustomAuthApiClient.js", () => {
    let signInApiClient = {
        initiate: jest.fn(),
        requestChallenge: jest.fn(),
        requestTokensWithPassword: jest.fn(),
        requestTokensWithOTP: jest.fn(),
    };
    let signUpApiClient = {
        start: jest.fn(),
        requestChallenge: jest.fn(),
        continue: jest.fn(),
        continueWithPassword: jest.fn(),
        continueWithAttributes: jest.fn(),
    };
    let resetPasswordApiClient = {
        startResetPassword: jest.fn(),
        requestChallenge: jest.fn(),
        submitOTP: jest.fn(),
        submitNewPassword: jest.fn(),
        pollCompletion: jest.fn(),
    };
    const CustomAuthApiClient = jest.fn();

    // Set up the prototype or instance methods/properties
    CustomAuthApiClient.prototype = {
        signInApiClient,
        signUpApiClient,
        resetPasswordApiClient,
    };

    return { CustomAuthApiClient, signInApiClient, signUpApiClient, resetPasswordApiClient };
});

describe("CustomAuthStandardController", () => {
    let controller: CustomAuthStandardController;
    const { signInApiClient, signUpApiClient, resetPasswordApiClient } = jest.requireMock(
        "../../src/core/network_client/custom_auth_api/CustomAuthApiClient.js",
    );

    beforeEach(() => {
        const context = new CustomAuthOperatingContext(customAuthConfig);
        controller = new CustomAuthStandardController(context);

        global.fetch = jest.fn(); // Mock the fetch API
    });

    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks between tests
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
            expect(result.state?.type).toStrictEqual(SignInState.CodeRequired);
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
            expect(result.state?.type).toStrictEqual(SignInState.PasswordRequired);
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
            signInApiClient.requestTokensWithPassword.mockResolvedValue({
                correlation_id: "test-correlation-id",
                access_token: "test-access-token",
                refresh_token: "test-refresh-token",
                id_token: "test-id-token",
                expires_in: 3600,
                token_type: "Bearer",
            });

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
                password: "test-password",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeUndefined();
            expect(result.state?.type).toStrictEqual(SignInState.Completed);
            expect(result.data).toBeDefined();
            expect(result.data).toBeInstanceOf(AccountInfo);
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
            expect(result.error?.isRedirect()).toEqual(true);
            expect(result.state?.type).toStrictEqual(SignInState.Failed);
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

        it("should return error result if provided username is invalid", async () => {
            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "agc@",
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
                target_challenge_label: "email",
            });

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeUndefined();
            expect(result.state?.type).toStrictEqual(SignUpState.CodeRequired);
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
            expect(result.state?.type).toStrictEqual(SignUpState.PasswordRequired);
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
            expect(result.error?.isRedirect()).toEqual(true);
            expect(result.state?.type).toStrictEqual(SignUpState.Failed);
        });

        it("should return failed result if the challenge endpoint returns redirect challenge type", async () => {
            signUpApiClient.start.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            signUpApiClient.requestChallenge.mockRejectedValue(new RedirectError());

            const signUpInputs: SignUpInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signUp(signUpInputs);

            expect(result).toBeInstanceOf(SignUpResult);
            expect(result.error).toBeDefined();
            expect(result.error?.errorData).toBeDefined();
            expect(result.error?.isRedirect()).toEqual(true);
            expect(result.state?.type).toStrictEqual(SignUpState.Failed);
        });

        it("should return failed result if the password is too weak", async () => {
            signUpApiClient.start.mockRejectedValue(
                new CustomAuthApiError(
                    CustomAuthApiErrorCode.INVALID_GRANT,
                    "Password is too weak",
                    "correlation-id",
                    [],
                    CustomAuthApiSuberror.PASSWORD_TOO_WEAK,
                ),
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
            expect(result.state?.type).toStrictEqual(SignUpState.Failed);
        });
    });
});
