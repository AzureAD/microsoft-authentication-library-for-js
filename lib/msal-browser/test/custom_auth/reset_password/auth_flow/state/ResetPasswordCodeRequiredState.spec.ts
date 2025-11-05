import { CustomAuthBrowserConfiguration } from "../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { InvalidArgumentError } from "../../../../../src/custom_auth/core/error/InvalidArgumentError.js";
import { ResetPasswordSubmitCodeError } from "../../../../../src/custom_auth/reset_password/auth_flow/error_type/ResetPasswordError.js";
import { ResetPasswordResendCodeResult } from "../../../../../src/custom_auth/reset_password/auth_flow/result/ResetPasswordResendCodeResult.js";
import { ResetPasswordSubmitCodeResult } from "../../../../../src/custom_auth/reset_password/auth_flow/result/ResetPasswordSubmitCodeResult.js";
import { ResetPasswordCodeRequiredState } from "../../../../../src/custom_auth/reset_password/auth_flow/state/ResetPasswordCodeRequiredState.js";
import { ResetPasswordClient } from "../../../../../src/custom_auth/reset_password/interaction_client/ResetPasswordClient.js";
import { SignInClient } from "../../../../../src/custom_auth/sign_in/interaction_client/SignInClient.js";
import { CustomAuthSilentCacheClient } from "../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { JitClient } from "../../../../../src/custom_auth/core/interaction_client/jit/JitClient.js";
import { MfaClient } from "../../../../../src/custom_auth/core/interaction_client/mfa/MfaClient.js";
import { getDefaultLogger } from "../../../test_resources/TestModules.js";

describe("ResetPasswordCodeRequiredState", () => {
    const clientId = "test-client-id";
    const mockConfig = {
        auth: { clientId: clientId },
        customAuth: { challengeTypes: ["code"] },
    } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

    const mockResetPasswordClient = {
        submitCode: jest.fn(),
        resendCode: jest.fn(),
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

    let state: ResetPasswordCodeRequiredState;

    beforeEach(() => {
        state = new ResetPasswordCodeRequiredState({
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
            codeLength: 8,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("submitCode", () => {
        it("should return an error result if code is empty", async () => {
            const result = await state.submitCode("");

            expect(result.isFailed()).toBeTruthy();
            expect(result.error).toBeInstanceOf(ResetPasswordSubmitCodeError);
            expect(result.error?.isInvalidCode()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(
                InvalidArgumentError
            );
            expect(result.error?.errorData?.errorDescription).toContain("code");
        });

        it("should successfully submit a code and return password required state", async () => {
            mockResetPasswordClient.submitCode.mockResolvedValue({
                correlationId: correlationId,
                continuationToken: "continuation-token",
            });

            const result = await state.submitCode("12345678");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(ResetPasswordSubmitCodeResult);
            expect(result.isPasswordRequired()).toBe(true);
            expect(mockResetPasswordClient.submitCode).toHaveBeenCalledWith({
                clientId: clientId,
                correlationId: correlationId,
                challengeType: ["code"],
                continuationToken: continuationToken,
                code: "12345678",
                username: username,
            });
        });

        it("should successfully submit a code and return password-required state if password is required", async () => {
            mockResetPasswordClient.submitCode.mockResolvedValue({
                correlationId: correlationId,
                continuationToken: "new-continuation-token",
            });

            const result = await state.submitCode("12345678");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(ResetPasswordSubmitCodeResult);
            expect(result.isPasswordRequired()).toBe(true);
            expect(mockResetPasswordClient.submitCode).toHaveBeenCalledWith({
                clientId: clientId,
                correlationId: correlationId,
                challengeType: ["code"],
                continuationToken: continuationToken,
                code: "12345678",
                username: username,
            });
        });
    });

    describe("resendCode", () => {
        it("should successfully resend a code and return a code required state", async () => {
            mockResetPasswordClient.resendCode.mockResolvedValue({
                correlationId: correlationId,
                continuationToken: "new-continuation-token",
                challengeChannel: "code",
                challengeTargetLabel: "email",
                codeLength: 6,
                bindingMethod: "email-otp",
            });

            const result = await state.resendCode();

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(ResetPasswordResendCodeResult);
            expect(result.data).toBeUndefined();
            expect(result.isCodeRequired()).toBeTruthy();
        });
    });
});
