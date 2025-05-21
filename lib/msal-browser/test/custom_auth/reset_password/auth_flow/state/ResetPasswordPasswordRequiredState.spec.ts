import { CustomAuthBrowserConfiguration } from "../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { InvalidArgumentError } from "../../../../../src/custom_auth/core/error/InvalidArgumentError.js";
import { ResetPasswordSubmitPasswordError } from "../../../../../src/custom_auth/reset_password/auth_flow/error_type/ResetPasswordError.js";
import { ResetPasswordSubmitPasswordResult } from "../../../../../src/custom_auth/reset_password/auth_flow/result/ResetPasswordSubmitPasswordResult.js";
import { ResetPasswordCompletedResult } from "../../../../../src/custom_auth/reset_password/interaction_client/result/ResetPasswordActionResult.js";
import { ResetPasswordClient } from "../../../../../src/custom_auth/reset_password/interaction_client/ResetPasswordClient.js";
import { Logger } from "@azure/msal-browser";
import { SignInClient } from "../../../../../src/custom_auth/sign_in/interaction_client/SignInClient.js";
import { CustomAuthSilentCacheClient } from "../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { ResetPasswordPasswordRequiredState } from "../../../../../src/custom_auth/reset_password/auth_flow/state/ResetPasswordPasswordRequiredState.js";
import { CustomAuthApiError } from "../../../../../src/custom_auth/core/error/CustomAuthApiError.js";

describe("ResetPasswordPasswordRequiredState", () => {
    const mockConfig = {
        auth: { clientId: "test-client-id" },
        customAuth: { challengeTypes: ["password"] },
    } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

    const mockResetPasswordClient = {
        submitNewPassword: jest.fn(),
    } as unknown as jest.Mocked<ResetPasswordClient>;

    const mockSignInClient = {} as unknown as jest.Mocked<SignInClient>;

    const mockLogger = {
        info: jest.fn(),
        verbose: jest.fn(),
        error: jest.fn(),
        errorPii: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const username = "testuser";
    const correlationId = "test-correlation-id";
    const continuationToken = "test-continuation-token";

    let state: ResetPasswordPasswordRequiredState;

    beforeEach(() => {
        state = new ResetPasswordPasswordRequiredState({
            correlationId: correlationId,
            logger: mockLogger,
            continuationToken: continuationToken,
            config: mockConfig,
            resetPasswordClient: mockResetPasswordClient,
            signInClient: mockSignInClient,
            cacheClient:
                {} as unknown as jest.Mocked<CustomAuthSilentCacheClient>,
            username: username,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("submitPassword", () => {
        it("should return an error result if password is empty", async () => {
            const result = await state.submitNewPassword("");

            expect(result.isFailed()).toBeTruthy();
            expect(result.error).toBeInstanceOf(
                ResetPasswordSubmitPasswordError
            );
            expect(result.error?.isInvalidPassword()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(
                InvalidArgumentError
            );
            expect(result.error?.errorData?.errorDescription).toContain(
                "password"
            );
        });

        it("should successfully submit a password and return completed state", async () => {
            mockResetPasswordClient.submitNewPassword.mockResolvedValue(
                new ResetPasswordCompletedResult(
                    correlationId,
                    "new-continuation-token"
                )
            );

            const result = await state.submitNewPassword("valid-password");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(ResetPasswordSubmitPasswordResult);
            expect(result.isCompleted()).toBe(true);
            expect(
                mockResetPasswordClient.submitNewPassword
            ).toHaveBeenCalledWith({
                clientId: "test-client-id",
                correlationId: correlationId,
                challengeType: ["password"],
                continuationToken: continuationToken,
                newPassword: "valid-password",
                username: username,
            });
        });

        it("should successfully submit a password and return completed state", async () => {
            mockResetPasswordClient.submitNewPassword.mockRejectedValue(
                new CustomAuthApiError(
                    "invalid_grant",
                    "Invalid grant",
                    correlationId,
                    [],
                    "password_too_weak"
                )
            );

            const result = await state.submitNewPassword("valid-password");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(ResetPasswordSubmitPasswordResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error).toBeInstanceOf(
                ResetPasswordSubmitPasswordError
            );
            expect(result.error?.isInvalidPassword()).toBe(true);
            expect(
                mockResetPasswordClient.submitNewPassword
            ).toHaveBeenCalledWith({
                clientId: "test-client-id",
                correlationId: correlationId,
                challengeType: ["password"],
                continuationToken: continuationToken,
                newPassword: "valid-password",
                username: username,
            });
        });
    });
});
