import { CustomAuthBrowserConfiguration } from "../../../../src/configuration/CustomAuthConfiguration.js";
import { InvalidArgumentError } from "../../../../src/core/error/InvalidArgumentError.js";
import { SignUpSubmitPasswordError } from "../../../../src/sign_up/auth_flow/error_type/SignUpError.js";
import { SignUpSubmitPasswordResult } from "../../../../src/sign_up/auth_flow/result/SignUpSubmitPasswordResult.js";
import { SignUpPasswordRequiredStateHandler } from "../../../../src/sign_up/auth_flow/state_handler/SignUpPasswordRequiredStateHandler.js";
import {
    SignUpAttributesRequiredResult,
    SignUpCodeRequiredResult,
    SignUpCompletedResult,
} from "../../../../src/sign_up/interaction_client/result/SignUpActionResult.js";
import { SignUpClient } from "../../../../src/sign_up/interaction_client/SignUpClient.js";
import { Logger } from "@azure/msal-browser";
import { SignUpState } from "../../../../src/core/auth_flow/AuthFlowStateBase.js";
import { SignInClient } from "../../../../src/sign_in/interaction_client/SignInClient.js";
import { CustomAuthTokenClient } from "../../../../src/get_account/interaction_client/CustomAuthTokeClient.js";

describe("SignUpPasswordRequiredStateHandler", () => {
    const mockConfig = {
        auth: { clientId: "test-client-id" },
        customAuth: { challengeTypes: ["password"] },
    } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

    const mockSignUpClient = {
        submitPassword: jest.fn(),
    } as unknown as jest.Mocked<SignUpClient>;

    const mockSignInClient = {} as unknown as jest.Mocked<SignInClient>;

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const username = "testuser";
    const correlationId = "test-correlation-id";
    const continuationToken = "test-continuation-token";

    let handler: SignUpPasswordRequiredStateHandler;

    beforeEach(() => {
        handler = new SignUpPasswordRequiredStateHandler(
            username,
            mockSignUpClient,
            mockSignInClient,
            {} as unknown as jest.Mocked<CustomAuthTokenClient>,
            correlationId,
            mockLogger,
            continuationToken,
            mockConfig,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("submitPassword", () => {
        it("should return an error result if password is empty", async () => {
            const result = await handler.submitPassword("");

            expect(result.state?.type).toBe(SignUpState.Failed);
            expect(result.error).toBeInstanceOf(SignUpSubmitPasswordError);
            expect(result.error?.isInvalidPassword()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(InvalidArgumentError);
            expect(result.error?.errorData?.errorDescription).toContain("password");
        });

        it("should successfully submit a password and return completed state if no credentail required", async () => {
            mockSignUpClient.submitPassword.mockResolvedValue(
                new SignUpCompletedResult(correlationId, "continuation-token"),
            );

            const result = await handler.submitPassword("valid-password");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignUpSubmitPasswordResult);
            expect(result.state?.type).toBe(SignUpState.Completed);
            expect(mockSignUpClient.submitPassword).toHaveBeenCalledWith({
                clientId: "test-client-id",
                correlationId: correlationId,
                challengeType: ["password"],
                continuationToken: continuationToken,
                password: "valid-password",
                username: username,
            });
        });

        it("should successfully submit a password and return code-required state if code is required", async () => {
            mockSignUpClient.submitPassword.mockResolvedValue(
                new SignUpCodeRequiredResult(correlationId, "continuation-token", "code", "email", 6, 60, "email-otp"),
            );

            const result = await handler.submitPassword("valid-password");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignUpSubmitPasswordResult);
            expect(result.state?.type).toBe(SignUpState.CodeRequired);
            expect(mockSignUpClient.submitPassword).toHaveBeenCalledWith({
                clientId: "test-client-id",
                correlationId: correlationId,
                challengeType: ["password"],
                continuationToken: continuationToken,
                password: "valid-password",
                username: username,
            });
        });

        it("should successfully submit a password and return attributes-required state if attributes are required", async () => {
            mockSignUpClient.submitPassword.mockResolvedValue(
                new SignUpAttributesRequiredResult(correlationId, "continuation-token", [
                    {
                        name: "name",
                        type: "string",
                    },
                ]),
            );

            const result = await handler.submitPassword("valid-password");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignUpSubmitPasswordResult);
            expect(result.state?.type).toBe(SignUpState.AttributesRequired);
            expect(mockSignUpClient.submitPassword).toHaveBeenCalledWith({
                clientId: "test-client-id",
                correlationId: correlationId,
                challengeType: ["password"],
                continuationToken: continuationToken,
                password: "valid-password",
                username: username,
            });
        });
    });
});
