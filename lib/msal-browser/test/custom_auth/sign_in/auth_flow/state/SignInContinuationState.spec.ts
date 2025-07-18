import { CustomAuthAccountData } from "../../../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { CustomAuthBrowserConfiguration } from "../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { SignInError } from "../../../../../src/custom_auth/sign_in/auth_flow/error_type/SignInError.js";
import { SignInResult } from "../../../../../src/custom_auth/sign_in/auth_flow/result/SignInResult.js";
import { SignInContinuationState } from "../../../../../src/custom_auth/sign_in/auth_flow/state/SignInContinuationState.js";
import { createSignInCompleteResult } from "../../../../../src/custom_auth/sign_in/interaction_client/result/SignInActionResult.js";
import { SignInClient } from "../../../../../src/custom_auth/sign_in/interaction_client/SignInClient.js";
import { SignInScenario } from "../../../../../src/custom_auth/sign_in/auth_flow/SignInScenario.js";
import { CustomAuthSilentCacheClient } from "../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { MfaClient } from "../../../../../src/custom_auth/core/interaction_client/mfa/MfaClient.js";
import { getDefaultLogger } from "../../../test_resources/TestModules.js";

describe("SignInContinuationState", () => {
    const mockConfig = {
        auth: { clientId: "test-client-id" },
        customAuth: { challengeTypes: ["code", "password", "redirect"] },
    } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

    const mockSignInClient = {
        signInWithContinuationToken: jest.fn(),
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

    let state: SignInContinuationState;

    beforeEach(() => {
        state = new SignInContinuationState({
            username: username,
            signInClient: mockSignInClient,
            cacheClient: mockCacheClient,
            mfaClient: mockMfaClient,
            correlationId: correlationId,
            logger: getDefaultLogger(),
            continuationToken: continuationToken,
            config: mockConfig,
            signInScenario: SignInScenario.SignInAfterSignUp,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should successfully sign in and return a result", async () => {
        mockSignInClient.signInWithContinuationToken.mockResolvedValue(
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

        const result = await state.signIn({ scopes: ["scope1", "scope2"] });

        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(SignInResult);
        expect(result.data).toBeInstanceOf(CustomAuthAccountData);
        expect(
            mockSignInClient.signInWithContinuationToken
        ).toHaveBeenCalledWith({
            clientId: "test-client-id",
            correlationId: correlationId,
            challengeType: ["code", "password", "redirect"],
            scopes: ["scope1", "scope2"],
            continuationToken: continuationToken,
            username: username,
            signInScenario: SignInScenario.SignInAfterSignUp,
        });
    });

    it("should return an error result if signIn throws an error", async () => {
        const mockError = new Error("Sign in failed");
        mockSignInClient.signInWithContinuationToken.mockRejectedValue(
            mockError
        );

        const result = await state.signIn();

        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(SignInResult);
        expect(result.error).toBeDefined();
        expect(result.error).toBeInstanceOf(SignInError);
    });
});
