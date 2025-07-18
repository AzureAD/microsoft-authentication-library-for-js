import { CustomAuthAccountData } from "../../../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { CustomAuthBrowserConfiguration } from "../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { InvalidArgumentError } from "../../../../../src/custom_auth/core/error/InvalidArgumentError.js";
import { SignInSubmitPasswordError } from "../../../../../src/custom_auth/sign_in/auth_flow/error_type/SignInError.js";
import { SignInSubmitPasswordResult } from "../../../../../src/custom_auth/sign_in/auth_flow/result/SignInSubmitPasswordResult.js";
import { SignInPasswordRequiredState } from "../../../../../src/custom_auth/sign_in/auth_flow/state/SignInPasswordRequiredState.js";
import { createSignInCompleteResult } from "../../../../../src/custom_auth/sign_in/interaction_client/result/SignInActionResult.js";
import { SignInClient } from "../../../../../src/custom_auth/sign_in/interaction_client/SignInClient.js";
import { CustomAuthSilentCacheClient } from "../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { MfaClient } from "../../../../../src/custom_auth/core/interaction_client/mfa/MfaClient.js";
import { getDefaultLogger } from "../../../test_resources/TestModules.js";

describe("SignInPasswordRequiredState", () => {
    const mockConfig = {
        auth: { clientId: "test-client-id" },
        customAuth: { challengeTypes: ["password"] },
    } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

    const mockSignInClient = {
        submitPassword: jest.fn(),
    } as unknown as jest.Mocked<SignInClient>;

    const mockCacheClient =
        {} as unknown as jest.Mocked<CustomAuthSilentCacheClient>;

    const mockMfaClient = {
        requestChallenge: jest.fn(),
        submitChallenge: jest.fn(),
        getAuthMethods: jest.fn(),
    } as unknown as jest.Mocked<MfaClient>;

    const username = "testuser";
    const correlationId = "test-correlation-id";
    const continuationToken = "test-continuation-token";

    let state: SignInPasswordRequiredState;

    beforeEach(() => {
        state = new SignInPasswordRequiredState({
            username: username,
            signInClient: mockSignInClient,
            cacheClient: mockCacheClient,
            mfaClient: mockMfaClient,
            correlationId: correlationId,
            logger: getDefaultLogger(),
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
            createSignInCompleteResult({
                correlationId: correlationId,
                authenticationResult: {
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
                },
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

    it("should handle MFA required scenario after password submission", async () => {
        const mfaContinuationToken = "mfa-continuation-token";

        mockSignInClient.submitPassword.mockResolvedValue({
            type: "SignInMfaRequiredResult",
            continuationToken: mfaContinuationToken,
            correlationId: correlationId,
        } as any);

        const result = await state.submitPassword("valid-password");

        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(SignInSubmitPasswordResult);
        expect(result.isFailed()).toBe(false);
        expect(result.isMfaRequired()).toBe(true);
        expect(result.error).toBeUndefined();
        // Verify MFA state is returned
        expect(result.state).toBeDefined();
        expect(result.state?.constructor.name).toBe("MfaAwaitingState");
    });

    it("should handle unexpected result type from submitPassword", async () => {
        mockSignInClient.submitPassword.mockResolvedValue({
            type: "unexpected_result_type",
            correlationId: correlationId,
        } as any);

        const result = await state.submitPassword("valid-password");

        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(SignInSubmitPasswordResult);
        expect(result.isFailed()).toBe(true);
        expect(result.error).toBeDefined();
        expect(result.error).toBeInstanceOf(SignInSubmitPasswordError);
    });

    it("should return error for null password", async () => {
        const result = await state.submitPassword(null as any);

        expect(result.isFailed()).toBe(true);
        expect(result.error).toBeInstanceOf(SignInSubmitPasswordError);
        expect(result.error?.errorData).toBeInstanceOf(InvalidArgumentError);
        expect(result.error?.errorData?.errorDescription).toContain("password");
    });

    it("should return error for undefined password", async () => {
        const result = await state.submitPassword(undefined as any);

        expect(result.isFailed()).toBe(true);
        expect(result.error).toBeInstanceOf(SignInSubmitPasswordError);
        expect(result.error?.errorData).toBeInstanceOf(InvalidArgumentError);
        expect(result.error?.errorData?.errorDescription).toContain("password");
    });

    it("should allow whitespace-only password (matches current implementation)", async () => {
        // Note: Current implementation doesn't validate whitespace, only falsy values
        mockSignInClient.submitPassword.mockResolvedValue(
            createSignInCompleteResult({
                correlationId: correlationId,
                authenticationResult: {
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
                },
            })
        );

        const result = await state.submitPassword("   ");

        expect(result.isCompleted()).toBe(true);
        expect(result.error).toBeUndefined();
    });

    it("should handle network timeout error", async () => {
        const timeoutError = new Error("Network timeout");
        timeoutError.name = "TimeoutError";
        mockSignInClient.submitPassword.mockRejectedValue(timeoutError);

        const result = await state.submitPassword("valid-password");

        expect(result.isFailed()).toBe(true);
        expect(result.error).toBeInstanceOf(SignInSubmitPasswordError);
    });

    it("should handle API rate limiting error", async () => {
        const rateLimitError = new Error("Too many requests");
        rateLimitError.name = "RateLimitError";
        mockSignInClient.submitPassword.mockRejectedValue(rateLimitError);

        const result = await state.submitPassword("valid-password");

        expect(result.isFailed()).toBe(true);
        expect(result.error).toBeInstanceOf(SignInSubmitPasswordError);
    });

    it("should properly call submitPassword with all required parameters", async () => {
        mockSignInClient.submitPassword.mockResolvedValue(
            createSignInCompleteResult({
                correlationId: correlationId,
                authenticationResult: {
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
                },
            })
        );

        await state.submitPassword("test-password");

        expect(mockSignInClient.submitPassword).toHaveBeenCalledWith({
            clientId: "test-client-id",
            correlationId: correlationId,
            challengeType: ["password"],
            scopes: ["scope1", "scope2"],
            continuationToken: continuationToken,
            password: "test-password",
            username: username,
        });
    });

    it("should return correct scopes from getScopes method", () => {
        const scopes = state.getScopes();
        expect(scopes).toEqual(["scope1", "scope2"]);
    });

    it("should handle case when scopes are undefined", () => {
        const stateWithoutScopes = new SignInPasswordRequiredState({
            username: username,
            signInClient: mockSignInClient,
            cacheClient: mockCacheClient,
            mfaClient: mockMfaClient,
            correlationId: correlationId,
            logger: getDefaultLogger(),
            continuationToken: continuationToken,
            config: mockConfig,
            scopes: undefined,
        });

        const scopes = stateWithoutScopes.getScopes();
        expect(scopes).toBeUndefined();
    });

    it("should handle submitPassword with complex authentication result", async () => {
        const complexAuthResult = {
            accessToken: "complex-access-token",
            idToken: "complex-id-token",
            expiresOn: new Date(Date.now() + 7200 * 1000),
            tokenType: "Bearer",
            correlationId: correlationId,
            authority: "https://complex-authority.com",
            tenantId: "complex-tenant-id",
            scopes: ["complex-scope1", "complex-scope2"],
            account: {
                homeAccountId: "complex-home-account-id",
                environment: "complex-environment",
                tenantId: "complex-tenant-id",
                username: "complex-username",
                localAccountId: "complex-local-account-id",
                idToken: "complex-id-token",
            },
            idTokenClaims: {
                sub: "complex-subject",
                aud: "complex-audience",
                iss: "complex-issuer",
            },
            fromCache: false,
            uniqueId: "complex-unique-id",
        };

        mockSignInClient.submitPassword.mockResolvedValue(
            createSignInCompleteResult({
                correlationId: correlationId,
                authenticationResult: complexAuthResult,
            })
        );

        const result = await state.submitPassword("complex-password");

        expect(result.isCompleted()).toBe(true);
        expect(result.data).toBeInstanceOf(CustomAuthAccountData);
        expect(result.data?.getAccount()).toBeDefined();
    });
});
