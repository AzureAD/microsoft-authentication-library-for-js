import { CustomAuthBrowserConfiguration } from "../../../../src/configuration/CustomAuthConfiguration.js";
import { InvalidArgumentError } from "../../../../src/core/error/InvalidArgumentError.js";
import { ResetPasswordSubmitCodeError } from "../../../../src/reset_password/auth_flow/error_type/ResetPasswordError.js";
import { ResetPasswordResendCodeResult } from "../../../../src/reset_password/auth_flow/result/ResetPasswordResendCodeResult.js";
import { ResetPasswordSubmitCodeResult } from "../../../../src/reset_password/auth_flow/result/ResetPasswordSubmitCodeResult.js";
import { ResetPasswordCodeRequiredStateHandler } from "../../../../src/reset_password/auth_flow/state_handler/ResetPasswordCodeRequiredStateHandler.js";
import {
    ResetPasswordCodeRequiredResult,
    ResetPasswordPasswordRequiredResult,
} from "../../../../src/reset_password/interaction_client/result/ResetPasswordActionResult.js";
import { ResetPasswordClient } from "../../../../src/reset_password/interaction_client/ResetPasswordClient.js";
import { Logger } from "@azure/msal-browser";
import { ResetPasswordState } from "../../../../src/core/auth_flow/AuthFlowStateBase.js";
import { SignInClient } from "../../../../src/sign_in/interaction_client/SignInClient.js";
import { ResetPasswordPasswordRequired } from "../../../../src/reset_password/auth_flow/state/ResetPasswordPasswordRequired.js";
import { CustomAuthSilentCacheClient } from "../../../../src/get_account/interaction_client/CustomAuthSilentCacheClient.js";

describe("ResetPasswordCodeRequiredStateHandler", () => {
    const mockConfig = {
        auth: { clientId: "test-client-id" },
        customAuth: { challengeTypes: ["code"] },
    } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

    const mockResetPasswordClient = {
        submitCode: jest.fn(),
        resendCode: jest.fn(),
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

    let handler: ResetPasswordCodeRequiredStateHandler;

    beforeEach(() => {
        handler = new ResetPasswordCodeRequiredStateHandler(
            correlationId,
            mockLogger,
            continuationToken,
            mockConfig,
            mockResetPasswordClient,
            mockSignInClient,
            {} as unknown as jest.Mocked<CustomAuthSilentCacheClient>,
            username,
            8,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("submitCode", () => {
        it("should return an error result if code is empty", async () => {
            const result = await handler.submitCode("");

            expect(result.state?.type).toBe(ResetPasswordState.Failed);
            expect(result.error).toBeInstanceOf(ResetPasswordSubmitCodeError);
            expect(result.error?.isInvalidCode()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(InvalidArgumentError);
            expect(result.error?.errorData?.errorDescription).toContain("code");
        });

        it("should successfully submit a code and return password required state", async () => {
            mockResetPasswordClient.submitCode.mockResolvedValue(
                new ResetPasswordPasswordRequiredResult(correlationId, "continuation-token"),
            );

            const result = await handler.submitCode("12345678");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(ResetPasswordSubmitCodeResult);
            expect(result.state?.type).toBe(ResetPasswordState.PasswordRequired);
            expect(mockResetPasswordClient.submitCode).toHaveBeenCalledWith({
                clientId: "test-client-id",
                correlationId: correlationId,
                challengeType: ["code"],
                continuationToken: continuationToken,
                code: "12345678",
                username: username,
            });
        });

        it("should successfully submit a code and return password-required state if password is required", async () => {
            mockResetPasswordClient.submitCode.mockResolvedValue(
                new ResetPasswordPasswordRequiredResult(correlationId, "new-continuation-token"),
            );

            const result = await handler.submitCode("12345678");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(ResetPasswordSubmitCodeResult);
            expect(result.state?.type).toBe(ResetPasswordState.PasswordRequired);
            expect((result.state as ResetPasswordPasswordRequired)?.continuationToken).toBe("new-continuation-token");
            expect(mockResetPasswordClient.submitCode).toHaveBeenCalledWith({
                clientId: "test-client-id",
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
            mockResetPasswordClient.resendCode.mockResolvedValue(
                new ResetPasswordCodeRequiredResult(
                    correlationId,
                    "new-continuation-token",
                    "code",
                    "email",
                    6,
                    "email-otp",
                ),
            );

            const result = await handler.resendCode();

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(ResetPasswordResendCodeResult);
            expect(result.data).toBeUndefined();
            expect(result.state?.type).toBe(ResetPasswordState.CodeRequired);
        });
    });
});
