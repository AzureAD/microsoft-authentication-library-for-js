import { CustomAuthBrowserConfiguration } from "../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { InvalidArgumentError } from "../../../../../src/custom_auth/core/error/InvalidArgumentError.js";
import { ResetPasswordSubmitPasswordError } from "../../../../../src/custom_auth/reset_password/auth_flow/error_type/ResetPasswordError.js";
import { ResetPasswordSubmitPasswordResult } from "../../../../../src/custom_auth/reset_password/auth_flow/result/ResetPasswordSubmitPasswordResult.js";
import { ResetPasswordClient } from "../../../../../src/custom_auth/reset_password/interaction_client/ResetPasswordClient.js";
import { SignInClient } from "../../../../../src/custom_auth/sign_in/interaction_client/SignInClient.js";
import { CustomAuthSilentCacheClient } from "../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { ResetPasswordPasswordRequiredState } from "../../../../../src/custom_auth/reset_password/auth_flow/state/ResetPasswordPasswordRequiredState.js";
import { CustomAuthApiError } from "../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import { JitClient } from "../../../../../src/custom_auth/core/interaction_client/jit/JitClient.js";
import { MfaClient } from "../../../../../src/custom_auth/core/interaction_client/mfa/MfaClient.js";
import { getDefaultLogger } from "../../../test_resources/TestModules.js";

describe("ResetPasswordPasswordRequiredState", () => {
    const clientId = "test-client-id";
    const mockConfig = {
        auth: { clientId: clientId },
        customAuth: { challengeTypes: ["password"] },
    } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

    const mockResetPasswordClient = {
        submitNewPassword: jest.fn(),
    } as unknown as jest.Mocked<ResetPasswordClient>;

    const mockSignInClient = {} as unknown as jest.Mocked<SignInClient>;

    const mockJitClient = {
        introspect: jest.fn(),
        requestChallenge: jest.fn(),
        continueChallenge: jest.fn(),
    } as unknown as jest.Mocked<JitClient>;
    const mockMfaClient = {
        requestChallenge: jest.fn(),
        submitChallenge: jest.fn(),
        getAuthMethods: jest.fn(),
    } as unknown as jest.Mocked<MfaClient>;

    const username = "testuser";
    const correlationId = "test-correlation-id";
    const continuationToken = "test-continuation-token";

    let state: ResetPasswordPasswordRequiredState;

    beforeEach(() => {
        state = new ResetPasswordPasswordRequiredState({
            correlationId: correlationId,
            logger: getDefaultLogger(),
            continuationToken: continuationToken,
            config: mockConfig,
            resetPasswordClient: mockResetPasswordClient,
            signInClient: mockSignInClient,
            jitClient: mockJitClient,
            mfaClient: mockMfaClient,
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
            mockResetPasswordClient.submitNewPassword.mockResolvedValue({
                correlationId: correlationId,
                continuationToken: "new-continuation-token",
            });

            const result = await state.submitNewPassword("valid-password");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(ResetPasswordSubmitPasswordResult);
            expect(result.isCompleted()).toBe(true);
            expect(
                mockResetPasswordClient.submitNewPassword
            ).toHaveBeenCalledWith({
                clientId: clientId,
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
                clientId: clientId,
                correlationId: correlationId,
                challengeType: ["password"],
                continuationToken: continuationToken,
                newPassword: "valid-password",
                username: username,
            });
        });
    });
});
