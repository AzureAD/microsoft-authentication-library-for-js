import { CustomAuthAccountData } from "../../../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { CustomAuthBrowserConfiguration } from "../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { InvalidArgumentError } from "../../../../../src/custom_auth/core/error/InvalidArgumentError.js";
import {
    SignInResendCodeError,
    SignInSubmitCodeError,
} from "../../../../../src/custom_auth/sign_in/auth_flow/error_type/SignInError.js";
import { SignInResendCodeResult } from "../../../../../src/custom_auth/sign_in/auth_flow/result/SignInResendCodeResult.js";
import { SignInSubmitCodeResult } from "../../../../../src/custom_auth/sign_in/auth_flow/result/SignInSubmitCodeResult.js";
import {
    createSignInCodeSendResult,
    createSignInCompleteResult,
} from "../../../../../src/custom_auth/sign_in/interaction_client/result/SignInActionResult.js";
import { SignInClient } from "../../../../../src/custom_auth/sign_in/interaction_client/SignInClient.js";
import { CustomAuthSilentCacheClient } from "../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { SignInCodeRequiredState } from "../../../../../src/custom_auth/sign_in/auth_flow/state/SignInCodeRequiredState.js";
import { DefaultCustomAuthApiCodeLength } from "../../../../../src/custom_auth/CustomAuthConstants.js";
import { JitClient } from "../../../../../src/custom_auth/core/interaction_client/jit/JitClient.js";
import { MfaClient } from "../../../../../src/custom_auth/core/interaction_client/mfa/MfaClient.js";
import { getDefaultLogger } from "../../../test_resources/TestModules.js";

describe("SignInCodeRequiredState", () => {
    const mockConfig = {
        auth: { clientId: "test-client-id" },
        customAuth: { challengeTypes: ["code"] },
    } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

    const mockSignInClient = {
        submitCode: jest.fn(),
        resendCode: jest.fn(),
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

    let state: SignInCodeRequiredState;

    beforeEach(() => {
        state = new SignInCodeRequiredState({
            username: username,
            signInClient: mockSignInClient,
            cacheClient: mockCacheClient,
            jitClient: mockJitClient,
            mfaClient: mockMfaClient,
            correlationId: correlationId,
            logger: getDefaultLogger(),
            continuationToken: continuationToken,
            config: mockConfig,
            codeLength: 8,
            scopes: ["scope1", "scope2"],
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("submitCode", () => {
        it("should return an error result if code is invalid", async () => {
            let result = await state.submitCode("");

            expect(result.isFailed()).toBeTruthy();
            expect(result.error).toBeInstanceOf(SignInSubmitCodeError);
            expect(result.error?.isInvalidCode()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(
                InvalidArgumentError
            );
            expect(result.error?.errorData?.errorDescription).toContain("code");
        });

        it("should return an error result if code length is invalid", async () => {
            let result = await state.submitCode("123"); // Too short

            expect(result.isFailed()).toBeTruthy();
            expect(result.error).toBeInstanceOf(SignInSubmitCodeError);
            expect(result.error?.isInvalidCode()).toBe(true);
        });

        it("should successfully submit a code and return a completed result", async () => {
            mockSignInClient.submitCode.mockResolvedValue(
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

            const result = await state.submitCode("12345678");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignInSubmitCodeResult);
            expect(result.isCompleted()).toBe(true);
            expect(result.data).toBeInstanceOf(CustomAuthAccountData);
            expect(mockSignInClient.submitCode).toHaveBeenCalledWith({
                clientId: "test-client-id",
                correlationId: correlationId,
                challengeType: ["code"],
                scopes: ["scope1", "scope2"],
                continuationToken: continuationToken,
                code: "12345678",
                username: username,
                claims: undefined, // No claims by default
            });
        });

        it("should include claims parameter when provided in state", async () => {
            const stateWithClaims = new SignInCodeRequiredState({
                username: username,
                signInClient: mockSignInClient,
                cacheClient: mockCacheClient,
                jitClient: mockJitClient,
                mfaClient: mockMfaClient,
                correlationId: correlationId,
                logger: getDefaultLogger(),
                continuationToken: continuationToken,
                config: mockConfig,
                codeLength: 8,
                scopes: ["scope1", "scope2"],
                claims: "test-claims",
            });

            mockSignInClient.submitCode.mockResolvedValue(
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

            const result = await stateWithClaims.submitCode("12345678");

            expect(result.isCompleted()).toBe(true);
            expect(mockSignInClient.submitCode).toHaveBeenCalledWith({
                clientId: "test-client-id",
                correlationId: correlationId,
                challengeType: ["code"],
                scopes: ["scope1", "scope2"],
                continuationToken: continuationToken,
                code: "12345678",
                username: username,
                claims: "test-claims",
            });
        });

        it("should handle JIT required scenario and return AuthMethodRegistrationRequiredState", async () => {
            const jitContinuationToken = "jit-continuation-token";
            const mockAuthMethods = [
                {
                    id: "email_method",
                    challenge_type: "email",
                    challenge_channel: "email",
                    login_hint: "test@test.com",
                },
                {
                    id: "sms_method",
                    challenge_type: "sms",
                    challenge_channel: "phone_number",
                    login_hint: "+1234567890",
                },
            ];

            mockSignInClient.submitCode.mockResolvedValue({
                type: "SignInJitRequiredResult",
                correlationId: correlationId,
                continuationToken: jitContinuationToken,
                authMethods: mockAuthMethods,
            } as any);

            const result = await state.submitCode("12345678");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignInSubmitCodeResult);
            expect(result.isFailed()).toBe(false);
            expect(result.isAuthMethodRegistrationRequired()).toBe(true);
            expect(result.error).toBeUndefined();
            expect(result.state).toBeDefined();
            expect(result.state?.constructor.name).toBe(
                "AuthMethodRegistrationRequiredState"
            );
        });

        it("should handle MFA required scenario and return MfaAwaitingState", async () => {
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

            mockSignInClient.submitCode.mockResolvedValue({
                type: "SignInMfaRequiredResult",
                correlationId: correlationId,
                continuationToken: mfaContinuationToken,
                authMethods: mockAuthMethods,
            } as any);

            const result = await state.submitCode("12345678");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignInSubmitCodeResult);
            expect(result.isFailed()).toBe(false);
            expect(result.isMfaRequired()).toBe(true);
            expect(result.error).toBeUndefined();
            expect(result.state).toBeDefined();
            expect(result.state?.constructor.name).toBe("MfaAwaitingState");
        });

        it("should handle unknown state from handleSignInResult and return error", async () => {
            mockSignInClient.submitCode.mockResolvedValue({
                type: "UnknownResultType",
                correlationId: correlationId,
            } as any);

            const result = await state.submitCode("12345678");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignInSubmitCodeResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error).toBeDefined();
        });

        it("should return an error result if submitCode throws an error", async () => {
            const mockError = new Error("Submission failed");
            mockSignInClient.submitCode.mockRejectedValue(mockError);

            const result = await state.submitCode("12345678");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignInSubmitCodeResult);
            expect(result.error).toBeDefined();
            expect(result.error).toBeInstanceOf(SignInSubmitCodeError);
        });

        it("should handle network errors during submitCode", async () => {
            const networkError = new Error("Network error");
            networkError.name = "NetworkError";
            mockSignInClient.submitCode.mockRejectedValue(networkError);

            const result = await state.submitCode("12345678");

            expect(result.isFailed()).toBe(true);
            expect(result.error).toBeInstanceOf(SignInSubmitCodeError);
        });

        it("should still trigger the call to submit code even if no codeLength returned from previous call", async () => {
            mockSignInClient.submitCode.mockResolvedValue(
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

            (state as any)["stateParameters"]["codeLength"] =
                DefaultCustomAuthApiCodeLength;
            const result = await state.submitCode("12345678");
            expect(result.isCompleted()).toBeTruthy();
            expect(result.error).toBeUndefined();
        });

        it("should handle empty scopes array", async () => {
            const stateWithEmptyScopes = new SignInCodeRequiredState({
                username: username,
                signInClient: mockSignInClient,
                cacheClient: mockCacheClient,
                jitClient: mockJitClient,
                mfaClient: mockMfaClient,
                correlationId: correlationId,
                logger: getDefaultLogger(),
                continuationToken: continuationToken,
                config: mockConfig,
                codeLength: 8,
                scopes: [], // Empty scopes
            });

            mockSignInClient.submitCode.mockResolvedValue(
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

            const result = await stateWithEmptyScopes.submitCode("12345678");

            expect(result.isCompleted()).toBe(true);
            expect(mockSignInClient.submitCode).toHaveBeenCalledWith({
                clientId: "test-client-id",
                correlationId: correlationId,
                challengeType: ["code"],
                scopes: [],
                continuationToken: continuationToken,
                code: "12345678",
                username: username,
                claims: undefined,
            });
        });

        it("should handle undefined scopes", async () => {
            const stateWithUndefinedScopes = new SignInCodeRequiredState({
                username: username,
                signInClient: mockSignInClient,
                cacheClient: mockCacheClient,
                jitClient: mockJitClient,
                mfaClient: mockMfaClient,
                correlationId: correlationId,
                logger: getDefaultLogger(),
                continuationToken: continuationToken,
                config: mockConfig,
                codeLength: 8,
                scopes: undefined, // Undefined scopes
            });

            mockSignInClient.submitCode.mockResolvedValue(
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

            const result = await stateWithUndefinedScopes.submitCode(
                "12345678"
            );

            expect(result.isCompleted()).toBe(true);
            expect(mockSignInClient.submitCode).toHaveBeenCalledWith({
                clientId: "test-client-id",
                correlationId: correlationId,
                challengeType: ["code"],
                scopes: [],
                continuationToken: continuationToken,
                code: "12345678",
                username: username,
                claims: undefined,
            });
        });
    });

    describe("resendCode", () => {
        it("should successfully resend a code and return a result", async () => {
            mockSignInClient.resendCode.mockResolvedValue(
                createSignInCodeSendResult({
                    correlationId: correlationId,
                    continuationToken: "new-continuation-token",
                    challengeChannel: "code",
                    challengeTargetLabel: "email",
                    codeLength: 6,
                    bindingMethod: "email-otp",
                })
            );

            const result = await state.resendCode();

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignInResendCodeResult);
            expect(result.data).toBeUndefined();
            expect(result.isCodeRequired()).toBeTruthy();
            expect(result.state).toBeInstanceOf(SignInCodeRequiredState);

            // Verify the new state has updated continuation token and code length
            const newState = result.state as SignInCodeRequiredState;
            expect(newState.getCodeLength()).toBe(6);
        });

        it("should preserve scopes in the new state after resend", async () => {
            mockSignInClient.resendCode.mockResolvedValue(
                createSignInCodeSendResult({
                    correlationId: correlationId,
                    continuationToken: "new-continuation-token",
                    challengeChannel: "code",
                    challengeTargetLabel: "email",
                    codeLength: 6,
                    bindingMethod: "email-otp",
                })
            );

            const result = await state.resendCode();

            expect(result.isCodeRequired()).toBe(true);
            const newState = result.state as SignInCodeRequiredState;
            expect(newState.getScopes()).toEqual(["scope1", "scope2"]);
        });

        it("should call resendCode with correct parameters", async () => {
            mockSignInClient.resendCode.mockResolvedValue(
                createSignInCodeSendResult({
                    correlationId: correlationId,
                    continuationToken: "new-continuation-token",
                    challengeChannel: "code",
                    challengeTargetLabel: "email",
                    codeLength: 6,
                    bindingMethod: "email-otp",
                })
            );

            await state.resendCode();

            expect(mockSignInClient.resendCode).toHaveBeenCalledWith({
                clientId: "test-client-id",
                correlationId: correlationId,
                challengeType: ["code"],
                continuationToken: continuationToken,
                username: username,
            });
        });

        it("should handle missing challengeTypes in resendCode", async () => {
            const configWithoutChallengeTypes = {
                auth: { clientId: "test-client-id" },
                customAuth: {}, // No challengeTypes
            } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

            const stateWithoutChallengeTypes = new SignInCodeRequiredState({
                username: username,
                signInClient: mockSignInClient,
                cacheClient: mockCacheClient,
                jitClient: mockJitClient,
                mfaClient: mockMfaClient,
                correlationId: correlationId,
                logger: getDefaultLogger(),
                continuationToken: continuationToken,
                config: configWithoutChallengeTypes,
                codeLength: 8,
                scopes: ["scope1", "scope2"],
            });

            mockSignInClient.resendCode.mockResolvedValue(
                createSignInCodeSendResult({
                    correlationId: correlationId,
                    continuationToken: "new-continuation-token",
                    challengeChannel: "code",
                    challengeTargetLabel: "email",
                    codeLength: 6,
                    bindingMethod: "email-otp",
                })
            );

            const result = await stateWithoutChallengeTypes.resendCode();

            expect(result.isCodeRequired()).toBe(true);
            expect(mockSignInClient.resendCode).toHaveBeenCalledWith({
                clientId: "test-client-id",
                correlationId: correlationId,
                challengeType: [],
                continuationToken: continuationToken,
                username: username,
            });
        });

        it("should return an error result if resendCode throws an error", async () => {
            const mockError = new Error("Resend code failed");
            mockSignInClient.resendCode.mockRejectedValue(mockError);

            const result = await state.resendCode();

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignInResendCodeResult);
            expect(result.error).toBeDefined();
            expect(result.error).toBeInstanceOf(SignInResendCodeError);
            expect(result.isFailed()).toBe(true);
        });

        it("should handle network errors during resendCode", async () => {
            const networkError = new Error("Network error");
            networkError.name = "NetworkError";
            mockSignInClient.resendCode.mockRejectedValue(networkError);

            const result = await state.resendCode();

            expect(result.isFailed()).toBe(true);
            expect(result.error).toBeInstanceOf(SignInResendCodeError);
        });

        it("should handle timeout errors during resendCode", async () => {
            const timeoutError = new Error("Request timeout");
            timeoutError.name = "TimeoutError";
            mockSignInClient.resendCode.mockRejectedValue(timeoutError);

            const result = await state.resendCode();

            expect(result.isFailed()).toBe(true);
            expect(result.error).toBeInstanceOf(SignInResendCodeError);
        });
    });

    describe("getCodeLength", () => {
        it("should return the correct code length", () => {
            expect(state.getCodeLength()).toBe(8);
        });

        it("should return default code length when not specified", () => {
            const stateWithDefaultLength = new SignInCodeRequiredState({
                username: username,
                signInClient: mockSignInClient,
                cacheClient: mockCacheClient,
                jitClient: mockJitClient,
                mfaClient: mockMfaClient,
                correlationId: correlationId,
                logger: getDefaultLogger(),
                continuationToken: continuationToken,
                config: mockConfig,
                codeLength: DefaultCustomAuthApiCodeLength,
                scopes: ["scope1", "scope2"],
            });

            expect(stateWithDefaultLength.getCodeLength()).toBe(
                DefaultCustomAuthApiCodeLength
            );
        });
    });

    describe("getScopes", () => {
        it("should return the correct scopes", () => {
            expect(state.getScopes()).toEqual(["scope1", "scope2"]);
        });

        it("should return undefined when scopes are not set", () => {
            const stateWithoutScopes = new SignInCodeRequiredState({
                username: username,
                signInClient: mockSignInClient,
                cacheClient: mockCacheClient,
                jitClient: mockJitClient,
                mfaClient: mockMfaClient,
                correlationId: correlationId,
                logger: getDefaultLogger(),
                continuationToken: continuationToken,
                config: mockConfig,
                codeLength: 8,
                scopes: undefined,
            });

            expect(stateWithoutScopes.getScopes()).toBeUndefined();
        });

        it("should return empty array when scopes are empty", () => {
            const stateWithEmptyScopes = new SignInCodeRequiredState({
                username: username,
                signInClient: mockSignInClient,
                cacheClient: mockCacheClient,
                jitClient: mockJitClient,
                mfaClient: mockMfaClient,
                correlationId: correlationId,
                logger: getDefaultLogger(),
                continuationToken: continuationToken,
                config: mockConfig,
                codeLength: 8,
                scopes: [],
            });

            expect(stateWithEmptyScopes.getScopes()).toEqual([]);
        });
    });
});
