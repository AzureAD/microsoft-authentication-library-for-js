import { CustomAuthBrowserConfiguration } from "../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { InvalidArgumentError } from "../../../../../src/custom_auth/core/error/InvalidArgumentError.js";
import { SignUpSubmitPasswordError } from "../../../../../src/custom_auth/sign_up/auth_flow/error_type/SignUpError.js";
import { SignUpSubmitPasswordResult } from "../../../../../src/custom_auth/sign_up/auth_flow/result/SignUpSubmitPasswordResult.js";
import { SignUpPasswordRequiredState } from "../../../../../src/custom_auth/sign_up/auth_flow/state/SignUpPasswordRequiredState.js";
import {
    createSignUpAttributesRequiredResult,
    createSignUpCompletedResult,
} from "../../../../../src/custom_auth/sign_up/interaction_client/result/SignUpActionResult.js";
import { SignUpClient } from "../../../../../src/custom_auth/sign_up/interaction_client/SignUpClient.js";
import { SignInClient } from "../../../../../src/custom_auth/sign_in/interaction_client/SignInClient.js";
import { CustomAuthSilentCacheClient } from "../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { JitClient } from "../../../../../src/custom_auth/core/interaction_client/jit/JitClient.js";
import { MfaClient } from "../../../../../src/custom_auth/core/interaction_client/mfa/MfaClient.js";
import { getDefaultLogger } from "../../../test_resources/TestModules.js";

describe("SignUpPasswordRequiredState", () => {
    const mockConfig = {
        auth: { clientId: "test-client-id" },
        customAuth: { challengeTypes: ["password"] },
    } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

    const mockSignUpClient = {
        submitPassword: jest.fn(),
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

    let state: SignUpPasswordRequiredState;

    beforeEach(() => {
        state = new SignUpPasswordRequiredState({
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
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("submitPassword", () => {
        it("should return an error result if password is empty", async () => {
            const result = await state.submitPassword("");

            expect(result.isFailed()).toBeTruthy();
            expect(result.error).toBeInstanceOf(SignUpSubmitPasswordError);
            expect(result.error?.isInvalidPassword()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(
                InvalidArgumentError
            );
            expect(result.error?.errorData?.errorDescription).toContain(
                "password"
            );
        });

        it("should successfully submit a password and return completed state if no credentail required", async () => {
            mockSignUpClient.submitPassword.mockResolvedValue(
                createSignUpCompletedResult({
                    correlationId: correlationId,
                    continuationToken: "continuation-token",
                })
            );

            const result = await state.submitPassword("valid-password");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignUpSubmitPasswordResult);
            expect(result.isCompleted()).toBe(true);
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
                createSignUpAttributesRequiredResult({
                    correlationId: correlationId,
                    continuationToken: "continuation-token",
                    requiredAttributes: [
                        {
                            name: "name",
                            type: "string",
                        },
                    ],
                })
            );

            const result = await state.submitPassword("valid-password");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignUpSubmitPasswordResult);
            expect(result.isAttributesRequired()).toBe(true);
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
