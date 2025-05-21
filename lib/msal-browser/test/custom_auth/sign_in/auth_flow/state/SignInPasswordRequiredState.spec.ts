import { Logger } from "@azure/msal-browser";
import { CustomAuthAccountData } from "../../../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { CustomAuthBrowserConfiguration } from "../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { InvalidArgumentError } from "../../../../../src/custom_auth/core/error/InvalidArgumentError.js";
import { SignInSubmitPasswordError } from "../../../../../src/custom_auth/sign_in/auth_flow/error_type/SignInError.js";
import { SignInSubmitPasswordResult } from "../../../../../src/custom_auth/sign_in/auth_flow/result/SignInSubmitPasswordResult.js";
import { SignInPasswordRequiredState } from "../../../../../src/custom_auth/sign_in/auth_flow/state/SignInPasswordRequiredState.js";
import { SignInCompletedResult } from "../../../../../src/custom_auth/sign_in/interaction_client/result/SignInActionResult.js";
import { SignInClient } from "../../../../../src/custom_auth/sign_in/interaction_client/SignInClient.js";
import { CustomAuthSilentCacheClient } from "../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";

describe("SignInPasswordRequiredState", () => {
    const mockConfig = {
        auth: { clientId: "test-client-id" },
        customAuth: { challengeTypes: ["password"] },
    } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

    const mockSignInClient = {
        submitPassword: jest.fn(),
    } as unknown as jest.Mocked<SignInClient>;

    const mockLogger = {
        info: jest.fn(),
        verbose: jest.fn(),
        error: jest.fn(),
        errorPii: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const mockCacheClient =
        {} as unknown as jest.Mocked<CustomAuthSilentCacheClient>;

    const username = "testuser";
    const correlationId = "test-correlation-id";
    const continuationToken = "test-continuation-token";

    let state: SignInPasswordRequiredState;

    beforeEach(() => {
        state = new SignInPasswordRequiredState({
            username: username,
            signInClient: mockSignInClient,
            cacheClient: mockCacheClient,
            correlationId: correlationId,
            logger: mockLogger,
            continuationToken: continuationToken,
            config: mockConfig,
            scopes: ["scope1", "scope2"],
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should return an error result if password is empty", async () => {
        const result = await state.submitPassword("");

        expect(result.isFailed()).toBe(true);
        expect(result.error).toBeInstanceOf(SignInSubmitPasswordError);
        expect(result.error?.errorData).toBeInstanceOf(InvalidArgumentError);
        expect(result.error?.errorData?.errorDescription).toContain("password");
    });

    it("should successfully submit a password and return a result", async () => {
        mockSignInClient.submitPassword.mockResolvedValue(
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
            })
        );

        const result = await state.submitPassword("valid-password");

        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(SignInSubmitPasswordResult);
        expect(result.isCompleted()).toBe(true);
        expect(result.data).toBeInstanceOf(CustomAuthAccountData);
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

        const result = await state.submitPassword("valid-password");

        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(SignInSubmitPasswordResult);
        expect(result.error).toBeDefined();
        expect(result.error).toBeInstanceOf(SignInSubmitPasswordError);
    });
});
