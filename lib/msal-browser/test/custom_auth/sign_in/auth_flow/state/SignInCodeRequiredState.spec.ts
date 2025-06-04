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
import { Logger } from "@azure/msal-browser";
import { CustomAuthSilentCacheClient } from "../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { SignInCodeRequiredState } from "../../../../../src/custom_auth/sign_in/auth_flow/state/SignInCodeRequiredState.js";

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

    const mockLogger = {
        info: jest.fn(),
        verbose: jest.fn(),
        error: jest.fn(),
        errorPii: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const username = "testuser";
    const correlationId = "test-correlation-id";
    const continuationToken = "test-continuation-token";

    let state: SignInCodeRequiredState;

    beforeEach(() => {
        state = new SignInCodeRequiredState({
            username: username,
            signInClient: mockSignInClient,
            cacheClient: mockCacheClient,
            correlationId: correlationId,
            logger: mockLogger,
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
        it("should return an error result if code is empty", async () => {
            const result = await state.submitCode("");

            expect(result.isFailed()).toBeTruthy();
            expect(result.error).toBeInstanceOf(SignInSubmitCodeError);
            expect(result.error?.isInvalidCode()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(
                InvalidArgumentError
            );
            expect(result.error?.errorData?.errorDescription).toContain("code");
        });

        it("should successfully submit a code and return a result", async () => {
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
            expect(result.data).toBeInstanceOf(CustomAuthAccountData);
            expect(mockSignInClient.submitCode).toHaveBeenCalledWith({
                clientId: "test-client-id",
                correlationId: correlationId,
                challengeType: ["code"],
                scopes: ["scope1", "scope2"],
                continuationToken: continuationToken,
                code: "12345678",
                username: username,
            });
        });

        it("should return an error result if submitCode throws an error", async () => {
            const mockError = new Error("Submission failed");
            mockSignInClient.submitCode.mockRejectedValue(mockError);

            const result = await state.submitCode("valid-code");

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignInSubmitCodeResult);
            expect(result.error).toBeDefined();
            expect(result.error).toBeInstanceOf(SignInSubmitCodeError);
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
        });

        it("should return an error result if resendCode throws an error", async () => {
            const mockError = new Error("Resend code failed");
            mockSignInClient.resendCode.mockRejectedValue(mockError);

            const result = await state.resendCode();

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignInResendCodeResult);
            expect(result.error).toBeDefined();
            expect(result.error).toBeInstanceOf(SignInResendCodeError);
        });
    });
});
