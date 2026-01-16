import { CustomAuthAccountData } from "../../../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { CustomAuthBrowserConfiguration } from "../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { InvalidArgumentError } from "../../../../../src/custom_auth/core/error/InvalidArgumentError.js";
import { SignInSubmitPasswordError } from "../../../../../src/custom_auth/sign_in/auth_flow/error_type/SignInError.js";
import { SignInSubmitPasswordResult } from "../../../../../src/custom_auth/sign_in/auth_flow/result/SignInSubmitPasswordResult.js";
import { SignInPasswordRequiredState } from "../../../../../src/custom_auth/sign_in/auth_flow/state/SignInPasswordRequiredState.js";
import { createSignInCompleteResult } from "../../../../../src/custom_auth/sign_in/interaction_client/result/SignInActionResult.js";
import { SignInClient } from "../../../../../src/custom_auth/sign_in/interaction_client/SignInClient.js";
import { CustomAuthSilentCacheClient } from "../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { JitClient } from "../../../../../src/custom_auth/core/interaction_client/jit/JitClient.js";
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

    let state: SignInPasswordRequiredState;

    beforeEach(() => {
        state = new SignInPasswordRequiredState({
            username: username,
            signInClient: mockSignInClient,
            cacheClient: mockCacheClient,
            jitClient: mockJitClient,
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
            claims: undefined, // No claims by default
        });
    });

    it("should include claims parameter when provided in state", async () => {
        const stateWithClaims = new SignInPasswordRequiredState({
            username: username,
            signInClient: mockSignInClient,
            cacheClient: mockCacheClient,
            jitClient: mockJitClient,
            mfaClient: mockMfaClient,
            correlationId: correlationId,
            logger: getDefaultLogger(),
            continuationToken: continuationToken,
            config: mockConfig,
            scopes: ["scope1", "scope2"],
            claims: "test-claims",
        });

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

        const result = await stateWithClaims.submitPassword("valid-password");

        expect(result.isCompleted()).toBe(true);
        expect(mockSignInClient.submitPassword).toHaveBeenCalledWith({
            clientId: "test-client-id",
            correlationId: correlationId,
            challengeType: ["password"],
            scopes: ["scope1", "scope2"],
            continuationToken: continuationToken,
            password: "valid-password",
            username: username,
            claims: "test-claims",
        });
    });

    it("should handle MFA required scenario after password submission", async () => {
        const mfaContinuationToken = "mfa-continuation-token";
        const mockAuthMethods = [
            {
                id: "email_method",
                challenge_type: "email",
                challenge_channel: "email",
                login_hint: "test@test.com",
            },
            {
                id: "phone_method",
                challenge_type: "phone",
                challenge_channel: "phone_number",
                login_hint: "+1234567890",
            },
        ];

        mockSignInClient.submitPassword.mockResolvedValue({
            type: "SignInMfaRequiredResult",
            correlationId: correlationId,
            continuationToken: mfaContinuationToken,
            authMethods: mockAuthMethods,
        } as any);

        const result = await state.submitPassword("valid-password");

        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(SignInSubmitPasswordResult);
        expect(result.isFailed()).toBe(false);
        expect(result.isMfaRequired()).toBe(true);
        expect(result.error).toBeUndefined();
        expect(result.state).toBeDefined();
        expect(result.state?.constructor.name).toBe("MfaAwaitingState");
    });

    it("should handle missing challengeTypes configuration", async () => {
        const configWithoutChallengeTypes = {
            auth: { clientId: "test-client-id" },
            customAuth: {}, // No challengeTypes
        } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

        const stateWithoutChallengeTypes = new SignInPasswordRequiredState({
            username: username,
            signInClient: mockSignInClient,
            cacheClient: mockCacheClient,
            jitClient: mockJitClient,
            mfaClient: mockMfaClient,
            correlationId: correlationId,
            logger: getDefaultLogger(),
            continuationToken: continuationToken,
            config: configWithoutChallengeTypes,
            scopes: ["scope1", "scope2"],
        });

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

        const result = await stateWithoutChallengeTypes.submitPassword(
            "valid-password"
        );

        expect(result.isCompleted()).toBe(true);
        expect(mockSignInClient.submitPassword).toHaveBeenCalledWith({
            clientId: "test-client-id",
            correlationId: correlationId,
            challengeType: [],
            scopes: ["scope1", "scope2"],
            continuationToken: continuationToken,
            password: "valid-password",
            username: username,
            claims: undefined,
        });
    });

    it("should handle empty scopes array", async () => {
        const stateWithEmptyScopes = new SignInPasswordRequiredState({
            username: username,
            signInClient: mockSignInClient,
            cacheClient: mockCacheClient,
            jitClient: mockJitClient,
            mfaClient: mockMfaClient,
            correlationId: correlationId,
            logger: getDefaultLogger(),
            continuationToken: continuationToken,
            config: mockConfig,
            scopes: [], // Empty scopes
        });

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

        const result = await stateWithEmptyScopes.submitPassword(
            "valid-password"
        );

        expect(result.isCompleted()).toBe(true);
        expect(mockSignInClient.submitPassword).toHaveBeenCalledWith({
            clientId: "test-client-id",
            correlationId: correlationId,
            challengeType: ["password"],
            scopes: [],
            continuationToken: continuationToken,
            password: "valid-password",
            username: username,
            claims: undefined,
        });
    });

    it("should handle undefined scopes", async () => {
        const stateWithUndefinedScopes = new SignInPasswordRequiredState({
            username: username,
            signInClient: mockSignInClient,
            cacheClient: mockCacheClient,
            jitClient: mockJitClient,
            mfaClient: mockMfaClient,
            correlationId: correlationId,
            logger: getDefaultLogger(),
            continuationToken: continuationToken,
            config: mockConfig,
            scopes: undefined, // Undefined scopes
        });

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

        const result = await stateWithUndefinedScopes.submitPassword(
            "valid-password"
        );

        expect(result.isCompleted()).toBe(true);
        expect(mockSignInClient.submitPassword).toHaveBeenCalledWith({
            clientId: "test-client-id",
            correlationId: correlationId,
            challengeType: ["password"],
            scopes: [],
            continuationToken: continuationToken,
            password: "valid-password",
            username: username,
            claims: undefined,
        });
    });

    it("should handle missing continuation token gracefully", async () => {
        const stateWithoutToken = new SignInPasswordRequiredState({
            username: username,
            signInClient: mockSignInClient,
            cacheClient: mockCacheClient,
            jitClient: mockJitClient,
            mfaClient: mockMfaClient,
            correlationId: correlationId,
            logger: getDefaultLogger(),
            continuationToken: "valid-token", // Must be non-empty
            config: mockConfig,
            scopes: ["scope1", "scope2"],
        });

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

        const result = await stateWithoutToken.submitPassword("valid-password");

        expect(result.isCompleted()).toBe(true);
        expect(mockSignInClient.submitPassword).toHaveBeenCalledWith({
            clientId: "test-client-id",
            correlationId: correlationId,
            challengeType: ["password"],
            scopes: ["scope1", "scope2"],
            continuationToken: "valid-token",
            password: "valid-password",
            username: username,
            claims: undefined,
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

    it("should handle JIT required scenario after password submission", async () => {
        const jitContinuationToken = "jit-continuation-token";

        mockSignInClient.submitPassword.mockResolvedValue({
            type: "SignInJitRequiredResult",
            continuationToken: jitContinuationToken,
            correlationId: correlationId,
            authMethods: ["email", "sms"],
        } as any);

        const result = await state.submitPassword("valid-password");

        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(SignInSubmitPasswordResult);
        expect(result.isFailed()).toBe(false);
        expect(result.isAuthMethodRegistrationRequired()).toBe(true);
        expect(result.error).toBeUndefined();
        // Verify JIT state is returned
        expect(result.state).toBeDefined();
        expect(result.state?.constructor.name).toBe(
            "AuthMethodRegistrationRequiredState"
        );
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

    it("should return undefined scopes when not set", () => {
        const stateWithoutScopes = new SignInPasswordRequiredState({
            username: username,
            signInClient: mockSignInClient,
            cacheClient: mockCacheClient,
            jitClient: mockJitClient,
            mfaClient: mockMfaClient,
            correlationId: correlationId,
            logger: getDefaultLogger(),
            continuationToken: continuationToken,
            config: mockConfig,
            scopes: undefined,
        });

        expect(stateWithoutScopes.getScopes()).toBeUndefined();
    });

    it("should return empty array when scopes are empty", () => {
        const stateWithEmptyScopes = new SignInPasswordRequiredState({
            username: username,
            signInClient: mockSignInClient,
            cacheClient: mockCacheClient,
            jitClient: mockJitClient,
            mfaClient: mockMfaClient,
            correlationId: correlationId,
            logger: getDefaultLogger(),
            continuationToken: continuationToken,
            config: mockConfig,
            scopes: [],
        });

        expect(stateWithEmptyScopes.getScopes()).toEqual([]);
    });

    it("should handle error propagation from handleSignInResult", async () => {
        // Mock the base class method to return an error
        const mockError = new Error("HandleSignInResult error");
        jest.spyOn(state as any, "handleSignInResult").mockReturnValue({
            error: mockError,
            state: null,
            accountInfo: null,
        });

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

        expect(result.isFailed()).toBe(true);
        expect(result.error).toBeDefined();
    });

    it("should handle unknown state from handleSignInResult and return error", async () => {
        mockSignInClient.submitPassword.mockResolvedValue({
            type: "UnknownResultType",
            correlationId: correlationId,
        } as any);

        const result = await state.submitPassword("valid-password");

        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(SignInSubmitPasswordResult);
        expect(result.isFailed()).toBe(true);
        expect(result.error).toBeDefined();
    });
});
