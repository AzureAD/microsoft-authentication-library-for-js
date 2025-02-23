import { CustomAuthAccountData } from "../../../../src/get_account/auth_flow/CustomAuthAccountData.js";
import { CustomAuthBrowserConfiguration } from "../../../../src/configuration/CustomAuthConfiguration.js";
import { InvalidArgumentError } from "../../../../src/core/error/InvalidArgumentError.js";
import {
    SignInResendCodeError,
    SignInSubmitCodeError,
} from "../../../../src/sign_in/auth_flow/error_type/SignInError.js";
import { SignInResendCodeResult } from "../../../../src/sign_in/auth_flow/result/SignInResendCodeResult.js";
import { SignInSubmitCodeResult } from "../../../../src/sign_in/auth_flow/result/SignInSubmitCodeResult.js";
import { SignInCodeRequiredStateHandler } from "../../../../src/sign_in/auth_flow/state_handler/SignInCodeRequiredStateHandler.js";
import {
    SignInCodeSendResult,
    SignInCompletedResult,
} from "../../../../src/sign_in/interaction_client/result/SignInActionResult.js";
import { SignInClient } from "../../../../src/sign_in/interaction_client/SignInClient.js";
import { Logger } from "@azure/msal-browser";
import { SignInState } from "../../../../src/core/auth_flow/AuthFlowStateBase.js";
import { CustomAuthTokenClient } from "../../../../src/get_account/interaction_client/CustomAuthTokenClient.js";

describe("SignInCodeRequiredStateHandler", () => {
    const mockConfig = {
        auth: { clientId: "test-client-id" },
        customAuth: { challengeTypes: ["code"] },
    } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

    const mockSignInClient = {
        submitCode: jest.fn(),
        resendCode: jest.fn(),
    } as unknown as jest.Mocked<SignInClient>;

    const mockTokenClient = {} as unknown as jest.Mocked<CustomAuthTokenClient>;

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const username = "testuser";
    const correlationId = "test-correlation-id";
    const continuationToken = "test-continuation-token";

    let handler: SignInCodeRequiredStateHandler;

    beforeEach(() => {
        handler = new SignInCodeRequiredStateHandler(
            username,
            mockSignInClient,
            mockTokenClient,
            correlationId,
            mockLogger,
            continuationToken,
            mockConfig,
            8,
            ["scope1", "scope2"],
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("submitCode", () => {
        it("should return an error result if code is empty", async () => {
            const result = await handler.submitCode("");

            expect(result.state?.type).toBe(SignInState.Failed);
            expect(result.error).toBeInstanceOf(SignInSubmitCodeError);
            expect(result.error?.isInvalidCode()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(InvalidArgumentError);
            expect(result.error?.errorData?.errorDescription).toContain("code");
        });

        it("should successfully submit a code and return a result", async () => {
            mockSignInClient.submitCode.mockResolvedValue(
                new SignInCompletedResult(correlationId, {
                    accessToken: "test-access-token",
                    idToken: "test-id-token",
                    expiresOn: new Date(Date.now() + 3600 * 1000),
                    tokenType: "Bearer",
                    correlationId: correlationId,
                    authority: "https://test-authority.com",
                    tenantId: "test-tenant-id",
                    scopes: [],
                    account: {
                        homeAccountId: "",
                        environment: "",
                        tenantId: "test-tenant-id",
                        username: username,
                        localAccountId: "",
                        idToken: "test-id-token",
                    },
                    idTokenClaims: {},
                    fromCache: false,
                    uniqueId: "test-unique-id",
                }),
            );

            const result = await handler.submitCode("12345678");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignInSubmitCodeResult);
            expect(result.data).toBeInstanceOf(CustomAuthAccountData);
            expect(mockSignInClient.submitCode).toHaveBeenCalledWith({
                clientId: "test-client-id",
                correlationId: correlationId,
                challengeType: ["code"],
                scopes: ["scope1", "scope2"],
                continuationToken: continuationToken,
                code: "12345678",
                username: username,
            });
        });

        it("should return an error result if submitCode throws an error", async () => {
            const mockError = new Error("Submission failed");
            mockSignInClient.submitCode.mockRejectedValue(mockError);

            const result = await handler.submitCode("valid-code");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignInSubmitCodeResult);
            expect(result.error).toBeDefined();
            expect(result.error).toBeInstanceOf(SignInSubmitCodeError);
        });
    });

    describe("resendCode", () => {
        it("should successfully resend a code and return a result", async () => {
            mockSignInClient.resendCode.mockResolvedValue(
                new SignInCodeSendResult(correlationId, "new-continuation-token", "code", "email", 6, "email-otp"),
            );

            const result = await handler.resendCode();

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignInResendCodeResult);
            expect(result.data).toBeUndefined();
            expect(result.state?.type).toBe(SignInState.CodeRequired);
        });

        it("should return an error result if resendCode throws an error", async () => {
            const mockError = new Error("Resend code failed");
            mockSignInClient.resendCode.mockRejectedValue(mockError);

            const result = await handler.resendCode();

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignInResendCodeResult);
            expect(result.error).toBeDefined();
            expect(result.error).toBeInstanceOf(SignInResendCodeError);
        });
    });
});
