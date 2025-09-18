jest.mock("../../../../src/custom_auth/CustomAuthConstants.js", () => ({
    PasswordResetPollingTimeoutInMs: 5000,
    ChallengeType: {
        PASSWORD: "password",
        OOB: "oob",
        REDIRECT: "redirect",
    },
    ResetPasswordPollStatus: {
        IN_PROGRESS: "in_progress",
        SUCCEEDED: "succeeded",
        FAILED: "failed",
        NOT_STARTED: "not_started",
    },
}));

import { ResetPasswordClient } from "../../../../src/custom_auth/reset_password/interaction_client/ResetPasswordClient.js";
import { customAuthConfig } from "../../test_resources/CustomAuthConfig.js";
import { CustomAuthAuthority } from "../../../../src/custom_auth/core/CustomAuthAuthority.js";
import { ChallengeType } from "../../../../src/custom_auth/CustomAuthConstants.js";
import * as CustomAuthApiErrorCode from "../../../../src/custom_auth/core/network_client/custom_auth_api/types/ApiErrorCodes.js";
import { buildConfiguration } from "../../../../src/config/Configuration.js";
import { StubbedNetworkModule } from "@azure/msal-common/browser";
import {
    getDefaultBrowserCacheManager,
    getDefaultCrypto,
    getDefaultEventHandler,
    getDefaultLogger,
    getDefaultNavigationClient,
    getDefaultPerformanceClient,
} from "../../test_resources/TestModules.js";

jest.mock(
    "../../../../src/custom_auth/core/network_client/custom_auth_api/CustomAuthApiClient.js",
    () => {
        let signInApiClient = {
            initiate: jest.fn(),
            requestChallenge: jest.fn(),
            requestTokensWithPassword: jest.fn(),
            requestTokensWithOob: jest.fn(),
            signInWithContinuationToken: jest.fn(),
        };
        let signUpApiClient = {
            start: jest.fn(),
            requestChallenge: jest.fn(),
            continueWithCode: jest.fn(),
            continueWithPassword: jest.fn(),
            continueWithAttributes: jest.fn(),
        };
        let resetPasswordApiClient = {
            start: jest.fn(),
            requestChallenge: jest.fn(),
            continueWithCode: jest.fn(),
            submitNewPassword: jest.fn(),
            pollCompletion: jest.fn(),
        };
        let registerApiClient = {
            introspect: jest.fn(),
            challenge: jest.fn(),
            continueWithOob: jest.fn(),
            continueWithContinuationToken: jest.fn(),
        };

        const CustomAuthApiClient = jest.fn().mockImplementation(() => ({
            signInApi: signInApiClient,
            signUpApi: signUpApiClient,
            resetPasswordApi: resetPasswordApiClient,
            registerApi: registerApiClient,
        }));

        const mockedApiClient = new CustomAuthApiClient();
        return {
            mockedApiClient,
            signInApiClient,
            signUpApiClient,
            resetPasswordApiClient,
            registerApiClient,
        };
    }
);

describe("ResetPasswordClient", () => {
    let client: ResetPasswordClient;
    let authority: CustomAuthAuthority;
    const { mockedApiClient, resetPasswordApiClient } = jest.requireMock(
        "../../../../src/custom_auth/core/network_client/custom_auth_api/CustomAuthApiClient.js"
    );

    beforeEach(() => {
        const clientId = customAuthConfig.auth.clientId;
        const mockBrowserConfiguration = buildConfiguration(
            { auth: { clientId: clientId } },
            false
        );
        const mockLogger = getDefaultLogger();
        const mockPerformanceClient = getDefaultPerformanceClient(clientId);
        const mockEventHandler = getDefaultEventHandler();
        const mockCrypto = getDefaultCrypto(
            clientId,
            mockLogger,
            mockPerformanceClient
        );
        const mockCacheManager = getDefaultBrowserCacheManager(
            clientId,
            mockLogger,
            mockPerformanceClient,
            mockEventHandler,
            undefined,
            mockBrowserConfiguration.cache
        );

        authority = new CustomAuthAuthority(
            customAuthConfig.auth.authority ?? "",
            mockBrowserConfiguration,
            StubbedNetworkModule,
            mockCacheManager,
            mockLogger,
            customAuthConfig.customAuth.authApiProxyUrl
        );

        client = new ResetPasswordClient(
            mockBrowserConfiguration,
            mockCacheManager,
            mockCrypto,
            mockLogger,
            mockEventHandler,
            getDefaultNavigationClient(),
            mockPerformanceClient,
            mockedApiClient,
            authority
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("start", () => {
        it("should return ResetPasswordCodeRequiredResult suceesfully", async () => {
            resetPasswordApiClient.start.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            resetPasswordApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.OOB,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
                code_length: 6,
                challenge_channel: "email",
                challenge_target_label: "email",
                binding_method: "email",
            });

            const result = await client.start({
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
            });

            expect(result.correlationId).toBe("corr123");
            expect(result.continuationToken).toBe("continuation_token_2");
            expect(result.codeLength).toBe(6);
            expect(result.challengeChannel).toBe("email");
            expect(result.challengeTargetLabel).toBe("email");
            expect(result.bindingMethod).toBe("email");
        });

        it("should return ResetPasswordPasswordRequiredResult with error when challenge type is not OOB", async () => {
            resetPasswordApiClient.start.mockResolvedValue({
                continuation_token: "continuation_token_1",
            });
            resetPasswordApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.PASSWORD,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
            });

            await expect(
                client.start({
                    username: "abc@abc.com",
                    clientId: customAuthConfig.auth.clientId,
                    challengeType: [
                        ChallengeType.OOB,
                        ChallengeType.PASSWORD,
                        ChallengeType.REDIRECT,
                    ],
                    correlationId: "corr123",
                })
            ).rejects.toMatchObject({
                error: CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
                errorDescription: "Unsupported challenge type 'password'.",
                correlationId: "corr123",
            });
        });
    });

    describe("submitCode", () => {
        it("should return ResetPasswordPasswordRequiredResult successfully", async () => {
            resetPasswordApiClient.continueWithCode.mockResolvedValue({
                continuation_token: "continuation_token_2",
                correlation_id: "corr123",
                expires_in: 3600,
            });

            const result = await client.submitCode({
                code: "123456",
                continuationToken: "continuation_token_1",
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
            });

            expect(result.correlationId).toBe("corr123");
            expect(result.continuationToken).toBe("continuation_token_2");
        });
    });

    describe("submitNewPassword", () => {
        it("should return ResetPasswordCompletedResult for valid password", async () => {
            resetPasswordApiClient.submitNewPassword.mockResolvedValue({
                continuation_token: "continuation_token_2",
                poll_interval: 1,
                correlation_id: "corr123",
            });

            resetPasswordApiClient.pollCompletion
                .mockResolvedValueOnce({
                    status: "in-progress",
                    correlation_id: "corr123",
                })
                .mockResolvedValueOnce({
                    status: "in-progress",
                    correlation_id: "corr123",
                })
                .mockResolvedValueOnce({
                    status: "succeeded",
                    continuation_token: "continuation_token_3",
                    correlation_id: "corr123",
                });

            const result = await client.submitNewPassword({
                newPassword: "123456",
                continuationToken: "continuation_token_1",
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
            });

            expect(result.correlationId).toBe("corr123");
            expect(result.continuationToken).toBe("continuation_token_3");
            expect(resetPasswordApiClient.pollCompletion).toHaveBeenCalledTimes(
                3
            );
        }, 5000);

        it("should return ResetPasswordCompletedResult with error if the password-change is failed", async () => {
            resetPasswordApiClient.submitNewPassword.mockResolvedValue({
                continuation_token: "continuation_token_2",
                poll_interval: 1,
                correlation_id: "corr123",
            });

            resetPasswordApiClient.pollCompletion.mockResolvedValue({
                status: "failed",
                correlation_id: "corr123",
            });

            await expect(
                client.submitNewPassword({
                    newPassword: "123456",
                    continuationToken: "continuation_token_1",
                    username: "abc@abc.com",
                    clientId: customAuthConfig.auth.clientId,
                    challengeType: [
                        ChallengeType.OOB,
                        ChallengeType.PASSWORD,
                        ChallengeType.REDIRECT,
                    ],
                    correlationId: "corr123",
                })
            ).rejects.toMatchObject({
                error: CustomAuthApiErrorCode.PASSWORD_CHANGE_FAILED,
                errorDescription: "Password is failed to be reset.",
                correlationId: "corr123",
            });
        }, 5000);

        it("should return ResetPasswordCompletedResult with error if the reset password is timeout", async () => {
            resetPasswordApiClient.submitNewPassword.mockResolvedValue({
                continuation_token: "continuation_token_2",
                poll_interval: 1,
                correlation_id: "corr123",
            });

            resetPasswordApiClient.pollCompletion.mockResolvedValue({
                status: "in-progress",
                correlation_id: "corr123",
            });

            await expect(
                client.submitNewPassword({
                    newPassword: "123456",
                    continuationToken: "continuation_token_1",
                    username: "abc@abc.com",
                    clientId: customAuthConfig.auth.clientId,
                    challengeType: [
                        ChallengeType.OOB,
                        ChallengeType.PASSWORD,
                        ChallengeType.REDIRECT,
                    ],
                    correlationId: "corr123",
                })
            ).rejects.toMatchObject({
                error: CustomAuthApiErrorCode.PASSWORD_RESET_TIMEOUT,
                errorDescription: "Password reset flow has timed out.",
                correlationId: "corr123",
            });
        }, 10000);
    });

    describe("resendCode", () => {
        it("should return ResetPasswordCodeRequiredResult", async () => {
            resetPasswordApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.OOB,
                correlation_id: "corr123",
                continuation_token: "continuation_token_2",
                code_length: 6,
                challenge_channel: "email",
                challenge_target_label: "email",
                binding_method: "email",
            });

            const result = await client.resendCode({
                continuationToken: "continuation_token_1",
                username: "abc@abc.com",
                clientId: customAuthConfig.auth.clientId,
                challengeType: [
                    ChallengeType.OOB,
                    ChallengeType.PASSWORD,
                    ChallengeType.REDIRECT,
                ],
                correlationId: "corr123",
            });

            expect(result.correlationId).toBe("corr123");
            expect(result.continuationToken).toBe("continuation_token_2");
            expect(result.codeLength).toBe(6);
            expect(result.challengeChannel).toBe("email");
            expect(result.challengeTargetLabel).toBe("email");
        });
    });
});
