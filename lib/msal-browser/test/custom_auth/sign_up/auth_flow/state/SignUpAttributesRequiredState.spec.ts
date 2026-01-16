import { CustomAuthBrowserConfiguration } from "../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { SignUpSubmitAttributesError } from "../../../../../src/custom_auth/sign_up/auth_flow/error_type/SignUpError.js";
import { SignUpSubmitAttributesResult } from "../../../../../src/custom_auth/sign_up/auth_flow/result/SignUpSubmitAttributesResult.js";
import { SignUpAttributesRequiredState } from "../../../../../src/custom_auth/sign_up/auth_flow/state/SignUpAttributesRequiredState.js";
import { createSignUpCompletedResult } from "../../../../../src/custom_auth/sign_up/interaction_client/result/SignUpActionResult.js";
import { SignUpClient } from "../../../../../src/custom_auth/sign_up/interaction_client/SignUpClient.js";
import { SignInClient } from "../../../../../src/custom_auth/sign_in/interaction_client/SignInClient.js";
import { UserAccountAttributes } from "../../../../../src/custom_auth/UserAccountAttributes.js";
import { CustomAuthSilentCacheClient } from "../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { JitClient } from "../../../../../src/custom_auth/core/interaction_client/jit/JitClient.js";
import { MfaClient } from "../../../../../src/custom_auth/core/interaction_client/mfa/MfaClient.js";
import { getDefaultLogger } from "../../../test_resources/TestModules.js";

describe("SignUpAttributesRequiredState", () => {
    const mockConfig = {
        auth: { clientId: "test-client-id" },
        customAuth: { challengeTypes: ["attributes"] },
    } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

    const mockSignUpClient = {
        submitAttributes: jest.fn(),
    } as unknown as jest.Mocked<SignUpClient>;

    const mockSignInClient = {} as unknown as jest.Mocked<SignInClient>;

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
    const requiredAttributes: UserAccountAttributes = {
        displayName: "test-value",
    };

    let state: SignUpAttributesRequiredState;

    beforeEach(() => {
        state = new SignUpAttributesRequiredState({
            username: username,
            signUpClient: mockSignUpClient,
            signInClient: mockSignInClient,
            jitClient: mockJitClient,
            mfaClient: mockMfaClient,
            cacheClient:
                {} as unknown as jest.Mocked<CustomAuthSilentCacheClient>,
            correlationId: correlationId,
            logger: getDefaultLogger(),
            continuationToken: continuationToken,
            config: mockConfig,
            requiredAttributes: [
                {
                    name: "name",
                    type: "string",
                },
            ],
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("submitAttributes", () => {
        it("should return an error result if attributes is empty", async () => {
            const result1 = await state.submitAttributes(
                null as unknown as UserAccountAttributes
            );

            expect(result1.isFailed()).toBeTruthy();
            expect(result1.error).toBeInstanceOf(SignUpSubmitAttributesError);
            expect(result1.error?.isAttributesValidationFailed()).toBe(true);

            const result2 = await state.submitAttributes({});

            expect(result2.isFailed()).toBeTruthy();
            expect(result2.error).toBeInstanceOf(SignUpSubmitAttributesError);
            expect(result2.error?.isAttributesValidationFailed()).toBe(true);
        });

        it("should successfully submit a attributes and return completed state if no credentail required", async () => {
            mockSignUpClient.submitAttributes.mockResolvedValue(
                createSignUpCompletedResult({
                    correlationId: correlationId,
                    continuationToken: "continuation-token",
                })
            );

            const result = await state.submitAttributes(requiredAttributes);

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignUpSubmitAttributesResult);
            expect(result.isCompleted()).toBe(true);
            expect(mockSignUpClient.submitAttributes).toHaveBeenCalledWith({
                clientId: "test-client-id",
                correlationId: correlationId,
                challengeType: ["attributes"],
                continuationToken: continuationToken,
                attributes: requiredAttributes,
                username: username,
            });
        });
    });
});
