import { CustomAuthBrowserConfiguration } from "../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { InvalidArgumentError } from "../../../../../src/custom_auth/core/error/InvalidArgumentError.js";
import { SignUpSubmitCodeError } from "../../../../../src/custom_auth/sign_up/auth_flow/error_type/SignUpError.js";
import { SignUpResendCodeResult } from "../../../../../src/custom_auth/sign_up/auth_flow/result/SignUpResendCodeResult.js";
import { SignUpSubmitCodeResult } from "../../../../../src/custom_auth/sign_up/auth_flow/result/SignUpSubmitCodeResult.js";
import { SignUpCodeRequiredState } from "../../../../../src/custom_auth/sign_up/auth_flow/state/SignUpCodeRequiredState.js";
import {
    createSignUpAttributesRequiredResult,
    createSignUpCodeRequiredResult,
    createSignUpCompletedResult,
    createSignUpPasswordRequiredResult,
} from "../../../../../src/custom_auth/sign_up/interaction_client/result/SignUpActionResult.js";
import { SignUpClient } from "../../../../../src/custom_auth/sign_up/interaction_client/SignUpClient.js";
import { SignInClient } from "../../../../../src/custom_auth/sign_in/interaction_client/SignInClient.js";
import { CustomAuthSilentCacheClient } from "../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { JitClient } from "../../../../../src/custom_auth/core/interaction_client/jit/JitClient.js";
import { MfaClient } from "../../../../../src/custom_auth/core/interaction_client/mfa/MfaClient.js";
import { getDefaultLogger } from "../../../test_resources/TestModules.js";

describe("SignUpCodeRequiredState", () => {
    const mockConfig = {
        auth: { clientId: "test-client-id" },
        customAuth: { challengeTypes: ["code"] },
    } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

    const mockSignUpClient = {
        submitCode: jest.fn(),
        resendCode: jest.fn(),
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

    let state: SignUpCodeRequiredState;

    beforeEach(() => {
        state = new SignUpCodeRequiredState({
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
            codeLength: 8,
            codeResendInterval: 60,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("submitCode", () => {
        it("should return an error result if code is empty", async () => {
            const result = await state.submitCode("");

            expect(result.isFailed()).toBeTruthy();
            expect(result.error).toBeInstanceOf(SignUpSubmitCodeError);
            expect(result.error?.isInvalidCode()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(
                InvalidArgumentError
            );
            expect(result.error?.errorData?.errorDescription).toContain("code");
        });

        it("should successfully submit a code and return completed state if no credentail required", async () => {
            mockSignUpClient.submitCode.mockResolvedValue(
                createSignUpCompletedResult({
                    correlationId: correlationId,
                    continuationToken: "continuation-token",
                })
            );

            const result = await state.submitCode("12345678");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignUpSubmitCodeResult);
            expect(result.isCompleted()).toBe(true);
            expect(mockSignUpClient.submitCode).toHaveBeenCalledWith({
                clientId: "test-client-id",
                correlationId: correlationId,
                challengeType: ["code"],
                continuationToken: continuationToken,
                code: "12345678",
                username: username,
            });
        });

        it("should successfully submit a code and return password-required state if password is required", async () => {
            mockSignUpClient.submitCode.mockResolvedValue(
                createSignUpPasswordRequiredResult({
                    correlationId: correlationId,
                    continuationToken: "continuation-token",
                })
            );

            const result = await state.submitCode("12345678");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignUpSubmitCodeResult);
            expect(result.isPasswordRequired()).toBe(true);
            expect(mockSignUpClient.submitCode).toHaveBeenCalledWith({
                clientId: "test-client-id",
                correlationId: correlationId,
                challengeType: ["code"],
                continuationToken: continuationToken,
                code: "12345678",
                username: username,
            });
        });

        it("should successfully submit a code and return attributes-required state if attributes are required", async () => {
            mockSignUpClient.submitCode.mockResolvedValue(
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

            const result = await state.submitCode("12345678");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignUpSubmitCodeResult);
            expect(result.isAttributesRequired()).toBe(true);
            expect(mockSignUpClient.submitCode).toHaveBeenCalledWith({
                clientId: "test-client-id",
                correlationId: correlationId,
                challengeType: ["code"],
                continuationToken: continuationToken,
                code: "12345678",
                username: username,
            });
        });
    });

    describe("resendCode", () => {
        it("should successfully resend a code and return a code required state", async () => {
            mockSignUpClient.resendCode.mockResolvedValue(
                createSignUpCodeRequiredResult({
                    correlationId: correlationId,
                    continuationToken: "new-continuation-token",
                    challengeChannel: "code",
                    challengeTargetLabel: "email",
                    codeLength: 6,
                    interval: 60,
                    bindingMethod: "email-otp",
                })
            );

            const result = await state.resendCode();

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignUpResendCodeResult);
            expect(result.data).toBeUndefined();
            expect(result.isCodeRequired()).toBeTruthy();
        });
    });
});
