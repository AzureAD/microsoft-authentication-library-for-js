import { Logger } from "@azure/msal-browser";
import { AccountInfo } from "../../../../src/account/auth_flow/model/AccountInfo.js";
import { CustomAuthBrowserConfiguration } from "../../../../src/configuration/CustomAuthConfiguration.js";
import { InvalidArgumentError } from "../../../../src/core/error/InvalidArgumentError.js";
import { SignInSubmitPasswordError } from "../../../../src/sign_in/auth_flow/error_type/SignInError.js";
import { SignInSubmitPasswordResult } from "../../../../src/sign_in/auth_flow/result/SignInSubmitPasswordResult.js";
import { SignInPasswordRequiredStateHandler } from "../../../../src/sign_in/auth_flow/state_handler/SignInPasswordRequiredStateHandler.js";
import { SignInCompleteResult } from "../../../../src/sign_in/interaction_client/result/SignInActionResult.js";
import { SignInClient } from "../../../../src/sign_in/interaction_client/SignInClient.js";
import { SignInState } from "../../../../src/core/auth_flow/AuthFlowStateBase.js";

describe("SignInPasswordRequiredStateHandler", () => {
    const mockConfig = {
        auth: { clientId: "test-client-id" },
        customAuth: { challengeTypes: ["password"] },
    } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

    const mockSignInClient = {
        submitPassword: jest.fn(),
    } as unknown as jest.Mocked<SignInClient>;

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const username = "testuser";
    const correlationId = "test-correlation-id";
    const continuationToken = "test-continuation-token";

    let handler: SignInPasswordRequiredStateHandler;

    beforeEach(() => {
        handler = new SignInPasswordRequiredStateHandler(
            username,
            mockSignInClient,
            correlationId,
            mockLogger,
            continuationToken,
            mockConfig,
            ["scope1", "scope2"],
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should return an error result if password is empty", async () => {
        const result = await handler.submitPassword("");

        expect(result.state?.type).toBe(SignInState.Failed);
        expect(result.error).toBeInstanceOf(SignInSubmitPasswordError);
        expect(result.error?.errorData).toBeInstanceOf(InvalidArgumentError);
        expect(result.error?.errorData?.errorDescription).toContain("password");
    });

    it("should successfully submit a password and return a result", async () => {
        mockSignInClient.submitPassword.mockResolvedValue(
            new SignInCompleteResult(correlationId, {
                accessToken: "test-access-token",
                idToken: "test-id-token",
                refreshToken: "test-refresh-token",
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

        const result = await handler.submitPassword("valid-password");

        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(SignInSubmitPasswordResult);
        expect(result.state?.type).toBe(SignInState.Completed);
        expect(result.data).toBeInstanceOf(AccountInfo);
        expect(mockSignInClient.submitPassword).toHaveBeenCalledWith({
            clientId: "test-client-id",
            correlationId: correlationId,
            challengeType: ["password"],
            scopes: ["scope1", "scope2"],
            continuationToken: continuationToken,
            password: "valid-password",
            username: username,
        });
    });

    it("should return an error result if submitPassword throws an error", async () => {
        const mockError = new Error("Submission failed");
        mockSignInClient.submitPassword.mockRejectedValue(mockError);

        const result = await handler.submitPassword("valid-password");

        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(SignInSubmitPasswordResult);
        expect(result.error).toBeDefined();
        expect(result.error).toBeInstanceOf(SignInSubmitPasswordError);
    });
});
