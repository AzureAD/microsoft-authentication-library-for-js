import { Logger } from "@azure/msal-browser";
import { AccountInfo } from "../../../../src/account/auth_flow/model/AccountInfo.js";
import { CustomAuthBrowserConfiguration } from "../../../../src/configuration/CustomAuthConfiguration.js";
import { SignInError } from "../../../../src/sign_in/auth_flow/error_type/SignInError.js";
import { SignInResult } from "../../../../src/sign_in/auth_flow/result/SignInResult.js";
import { SignInContinuationStateHandler } from "../../../../src/sign_in/auth_flow/state_handler/SignInContinuationStateHandler.js";
import { SignInCompletedResult } from "../../../../src/sign_in/interaction_client/result/SignInActionResult.js";
import { SignInClient } from "../../../../src/sign_in/interaction_client/SignInClient.js";

describe("SignInContinuationStateHandler", () => {
    const mockConfig = {
        auth: { clientId: "test-client-id" },
        customAuth: { challengeTypes: ["code", "password", "redirect"] },
    } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

    const mockSignInClient = {
        signInWithContinuationToken: jest.fn(),
    } as unknown as jest.Mocked<SignInClient>;

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const username = "testuser";
    const correlationId = "test-correlation-id";
    const continuationToken = "test-continuation-token";

    let handler: SignInContinuationStateHandler;

    beforeEach(() => {
        handler = new SignInContinuationStateHandler(
            username,
            mockSignInClient,
            correlationId,
            mockLogger,
            continuationToken,
            mockConfig,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should successfully sign in and return a result", async () => {
        mockSignInClient.signInWithContinuationToken.mockResolvedValue(
            new SignInCompletedResult(correlationId, {
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

        const result = await handler.signIn(["scope1", "scope2"]);

        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(SignInResult);
        expect(result.data).toBeInstanceOf(AccountInfo);
        expect(mockSignInClient.signInWithContinuationToken).toHaveBeenCalledWith({
            clientId: "test-client-id",
            correlationId: correlationId,
            challengeType: ["code", "password", "redirect"],
            scopes: ["scope1", "scope2"],
            continuationToken: continuationToken,
            username: username,
        });
    });

    it("should return an error result if signIn throws an error", async () => {
        const mockError = new Error("Sign in failed");
        mockSignInClient.signInWithContinuationToken.mockRejectedValue(mockError);

        const result = await handler.signIn();

        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(SignInResult);
        expect(result.error).toBeDefined();
        expect(result.error).toBeInstanceOf(SignInError);
    });
});
