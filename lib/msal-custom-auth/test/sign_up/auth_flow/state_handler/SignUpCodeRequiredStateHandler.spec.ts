import { CustomAuthBrowserConfiguration } from "../../../../src/configuration/CustomAuthConfiguration.js";
import { InvalidArgumentError } from "../../../../src/core/error/InvalidArgumentError.js";
import { SignUpSubmitCodeError } from "../../../../src/sign_up/auth_flow/error_type/SignUpError.js";
import { SignUpResendCodeResult } from "../../../../src/sign_up/auth_flow/result/SignUpResendCodeResult.js";
import { SignUpSubmitCodeResult } from "../../../../src/sign_up/auth_flow/result/SignUpSubmitCodeResult.js";
import { SignUpCodeRequiredStateHandler } from "../../../../src/sign_up/auth_flow/state_handler/SignUpCodeRequiredStateHandler.js";
import {
    SignUpAttributesRequiredResult,
    SignUpCodeRequiredResult,
    SignUpCompletedResult,
    SignUpPasswordRequiredResult,
} from "../../../../src/sign_up/interaction_client/result/SignUpActionResult.js";
import { SignUpClient } from "../../../../src/sign_up/interaction_client/SignUpClient.js";
import { Logger } from "@azure/msal-browser";
import { SignUpState } from "../../../../src/core/auth_flow/AuthFlowStateBase.js";
import { SignInClient } from "../../../../src/sign_in/interaction_client/SignInClient.js";
import { CustomAuthTokenClient } from "../../../../src/get_account/interaction_client/CustomAuthTokenClient.js";

describe("SignUpCodeRequiredStateHandler", () => {
    const mockConfig = {
        auth: { clientId: "test-client-id" },
        customAuth: { challengeTypes: ["code"] },
    } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

    const mockSignUpClient = {
        submitCode: jest.fn(),
        resendCode: jest.fn(),
    } as unknown as jest.Mocked<SignUpClient>;

    const mockSignInClient = {} as unknown as jest.Mocked<SignInClient>;

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const username = "testuser";
    const correlationId = "test-correlation-id";
    const continuationToken = "test-continuation-token";

    let handler: SignUpCodeRequiredStateHandler;

    beforeEach(() => {
        handler = new SignUpCodeRequiredStateHandler(
            username,
            mockSignUpClient,
            mockSignInClient,
            {} as unknown as jest.Mocked<CustomAuthTokenClient>,
            correlationId,
            mockLogger,
            continuationToken,
            mockConfig,
            8,
            60,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("submitCode", () => {
        it("should return an error result if code is empty", async () => {
            const result = await handler.submitCode("");

            expect(result.state?.type).toBe(SignUpState.Failed);
            expect(result.error).toBeInstanceOf(SignUpSubmitCodeError);
            expect(result.error?.isInvalidCode()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(InvalidArgumentError);
            expect(result.error?.errorData?.errorDescription).toContain("code");
        });

        it("should successfully submit a code and return completed state if no credentail required", async () => {
            mockSignUpClient.submitCode.mockResolvedValue(
                new SignUpCompletedResult(correlationId, "continuation-token"),
            );

            const result = await handler.submitCode("12345678");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignUpSubmitCodeResult);
            expect(result.state?.type).toBe(SignUpState.Completed);
            expect(mockSignUpClient.submitCode).toHaveBeenCalledWith({
                clientId: "test-client-id",
                correlationId: correlationId,
                challengeType: ["code"],
                continuationToken: continuationToken,
                code: "12345678",
                username: username,
            });
        });

        it("should successfully submit a code and return password-required state if password is required", async () => {
            mockSignUpClient.submitCode.mockResolvedValue(
                new SignUpPasswordRequiredResult(correlationId, "continuation-token"),
            );

            const result = await handler.submitCode("12345678");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignUpSubmitCodeResult);
            expect(result.state?.type).toBe(SignUpState.PasswordRequired);
            expect(mockSignUpClient.submitCode).toHaveBeenCalledWith({
                clientId: "test-client-id",
                correlationId: correlationId,
                challengeType: ["code"],
                continuationToken: continuationToken,
                code: "12345678",
                username: username,
            });
        });

        it("should successfully submit a code and return attributes-required state if attributes are required", async () => {
            mockSignUpClient.submitCode.mockResolvedValue(
                new SignUpAttributesRequiredResult(correlationId, "continuation-token", [
                    {
                        name: "name",
                        type: "string",
                    },
                ]),
            );

            const result = await handler.submitCode("12345678");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignUpSubmitCodeResult);
            expect(result.state?.type).toBe(SignUpState.AttributesRequired);
            expect(mockSignUpClient.submitCode).toHaveBeenCalledWith({
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
            mockSignUpClient.resendCode.mockResolvedValue(
                new SignUpCodeRequiredResult(
                    correlationId,
                    "new-continuation-token",
                    "code",
                    "email",
                    6,
                    60,
                    "email-otp",
                ),
            );

            const result = await handler.resendCode();

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignUpResendCodeResult);
            expect(result.data).toBeUndefined();
            expect(result.state?.type).toBe(SignUpState.CodeRequired);
        });
    });
});
