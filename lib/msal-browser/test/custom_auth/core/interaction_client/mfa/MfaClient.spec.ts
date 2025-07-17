/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MfaClient } from "../../../../../src/custom_auth/core/interaction_client/mfa/MfaClient.js";
import { customAuthConfig } from "../../../test_resources/CustomAuthConfig.js";
import { CustomAuthAuthority } from "../../../../../src/custom_auth/core/CustomAuthAuthority.js";
import { ChallengeType } from "../../../../../src/custom_auth/CustomAuthConstants.js";
import {
    MFA_VERIFICATION_REQUIRED_RESULT_TYPE,
    MFA_METHOD_SELECTION_REQUIRED_RESULT_TYPE,
    MFA_COMPLETED_RESULT_TYPE,
    MFA_GET_AUTH_METHODS_RESULT_TYPE,
    MfaVerificationRequiredResult,
    MfaMethodSelectionRequiredResult,
    MfaCompletedResult,
    MfaGetAuthMethodsResult,
} from "../../../../../src/custom_auth/core/interaction_client/mfa/result/MfaActionResult.js";
import { StubbedNetworkModule } from "@azure/msal-common/browser";
import { buildConfiguration } from "../../../../../src/config/Configuration.js";
import {
    getDefaultBrowserCacheManager,
    getDefaultCrypto,
    getDefaultEventHandler,
    getDefaultLogger,
    getDefaultNavigationClient,
    getDefaultPerformanceClient,
} from "../../../test_resources/TestModules.js";
import {
    TestServerTokenResponse,
    TestTenantId,
} from "../../../test_resources/TestConstants.js";
import { CustomAuthApiError } from "../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import * as CustomAuthApiSuberror from "../../../../../src/custom_auth/core/network_client/custom_auth_api/types/ApiSuberrors.js";
import * as CustomAuthApiErrorCode from "../../../../../src/custom_auth/core/network_client/custom_auth_api/types/ApiErrorCodes.js";

jest.mock(
    "../../../../../src/custom_auth/core/network_client/custom_auth_api/CustomAuthApiClient.js",
    () => {
        let signInApiClient = {
            initiate: jest.fn(),
            requestChallenge: jest.fn(),
            requestTokensWithPassword: jest.fn(),
            requestTokensWithOob: jest.fn(),
            requestTokenWithContinuationToken: jest.fn(),
            requestAuthMethods: jest.fn(),
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

        const CustomAuthApiClient = jest.fn().mockImplementation(() => ({
            signInApi: signInApiClient,
            signUpApi: signUpApiClient,
            resetPasswordApi: resetPasswordApiClient,
        }));

        const mockedApiClient = new CustomAuthApiClient();
        return {
            mockedApiClient,
            signInApiClient,
            signUpApiClient,
            resetPasswordApiClient,
        };
    }
);

describe("MfaClient", () => {
    let client: MfaClient;
    let authority: CustomAuthAuthority;
    const { mockedApiClient, signInApiClient } = jest.requireMock(
        "../../../../../src/custom_auth/core/network_client/custom_auth_api/CustomAuthApiClient.js"
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

        client = new MfaClient(
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

    describe("requestChallenge", () => {
        it("should return MfaVerificationRequiredResult when challenge type is OOB", async () => {
            signInApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.OOB,
                correlation_id: "corr123",
                continuation_token: "continuation_token_1",
                code_length: 6,
                challenge_channel: "email",
                challenge_target_label: "user@example.com",
                binding_method: "prompt",
            });

            const result = await client.requestChallenge({
                correlationId: "corr123",
                continuationToken: "continuation_token_0",
                challengeType: [ChallengeType.OOB],
                authMethodId: "method123",
            });

            expect(result.type).toBe(MFA_VERIFICATION_REQUIRED_RESULT_TYPE);

            const verificationResult = result as MfaVerificationRequiredResult;
            expect(verificationResult.correlationId).toBe("corr123");
            expect(verificationResult.continuationToken).toBe(
                "continuation_token_1"
            );
            expect(verificationResult.codeLength).toBe(6);
            expect(verificationResult.challengeChannel).toBe("email");
            expect(verificationResult.challengeTargetLabel).toBe(
                "user@example.com"
            );
            expect(verificationResult.bindingMethod).toBe("prompt");

            // Verify API was called with correct parameters
            expect(signInApiClient.requestChallenge).toHaveBeenCalledWith({
                challenge_type: expect.stringContaining("oob"),
                continuation_token: "continuation_token_0",
                id: "method123",
                correlationId: "corr123",
                telemetryManager: expect.any(Object),
            });
        });

        it("should throw error for unsupported challenge type", async () => {
            signInApiClient.requestChallenge.mockResolvedValue({
                challenge_type: "unsupported_type",
                correlation_id: "corr123",
                continuation_token: "continuation_token_1",
            });

            await expect(
                client.requestChallenge({
                    correlationId: "corr123",
                    continuationToken: "continuation_token_0",
                    challengeType: [ChallengeType.OOB],
                })
            ).rejects.toThrow(CustomAuthApiError);
        });

        it("should return MfaMethodSelectionRequiredResult when introspect_required error occurs", async () => {
            const introspectRequiredError = new CustomAuthApiError(
                "invalid_request",
                "Introspect required",
                "corr123",
                undefined,
                CustomAuthApiSuberror.INTROSPECT_REQUIRED
            );

            signInApiClient.requestChallenge.mockRejectedValue(
                introspectRequiredError
            );
            signInApiClient.requestAuthMethods.mockResolvedValue({
                correlation_id: "corr123",
                continuation_token: "continuation_token_1",
                methods: [
                    {
                        id: "method1",
                        challenge_type: "oob",
                        challenge_channel: "email",
                        login_hint: "user@example.com",
                    },
                    {
                        id: "method2",
                        challenge_type: "oob",
                        challenge_channel: "sms",
                        login_hint: "+1234567890",
                    },
                ],
            });

            const result = await client.requestChallenge({
                correlationId: "corr123",
                continuationToken: "continuation_token_0",
                challengeType: [ChallengeType.OOB],
            });

            expect(result.type).toBe(MFA_METHOD_SELECTION_REQUIRED_RESULT_TYPE);

            const methodSelectionResult =
                result as MfaMethodSelectionRequiredResult;
            expect(methodSelectionResult.correlationId).toBe("corr123");
            expect(methodSelectionResult.continuationToken).toBe(
                "continuation_token_1"
            );
            expect(methodSelectionResult.authMethods).toHaveLength(2);
            expect(methodSelectionResult.authMethods[0].id).toBe("method1");
            expect(methodSelectionResult.authMethods[1].id).toBe("method2");

            // Verify introspect was called
            expect(signInApiClient.requestAuthMethods).toHaveBeenCalledWith({
                continuation_token: "continuation_token_0",
                correlationId: "corr123",
                telemetryManager: expect.any(Object),
            });
        });

        it("should re-throw non-introspect errors", async () => {
            const otherError = new CustomAuthApiError(
                "invalid_request",
                "Some other error",
                "corr123"
            );

            signInApiClient.requestChallenge.mockRejectedValue(otherError);

            await expect(
                client.requestChallenge({
                    correlationId: "corr123",
                    continuationToken: "continuation_token_0",
                    challengeType: [ChallengeType.OOB],
                })
            ).rejects.toThrow(otherError);
        });

        it("should handle multiple challenge types", async () => {
            signInApiClient.requestChallenge.mockResolvedValue({
                challenge_type: ChallengeType.OOB,
                correlation_id: "corr123",
                continuation_token: "continuation_token_1",
                code_length: 6,
                challenge_channel: "email",
                challenge_target_label: "user@example.com",
                binding_method: "prompt",
            });

            const result = await client.requestChallenge({
                correlationId: "corr123",
                continuationToken: "continuation_token_0",
                challengeType: [ChallengeType.OOB, ChallengeType.PASSWORD],
            });

            expect(result.type).toBe(MFA_VERIFICATION_REQUIRED_RESULT_TYPE);

            // Verify API was called with comma-separated challenge types
            expect(signInApiClient.requestChallenge).toHaveBeenCalledWith({
                challenge_type: expect.stringContaining("oob"),
                continuation_token: "continuation_token_0",
                id: undefined,
                correlationId: "corr123",
                telemetryManager: expect.any(Object),
            });
        });
    });

    describe("submitChallenge", () => {
        it("should return MfaCompletedResult for valid challenge", async () => {
            signInApiClient.requestTokensWithOob.mockResolvedValue(
                TestServerTokenResponse
            );

            const result = await client.submitChallenge({
                correlationId: "corr123",
                continuationToken: "continuation_token_1",
                challenge: "123456",
                scopes: ["User.Read"],
            });

            expect(result.type).toBe(MFA_COMPLETED_RESULT_TYPE);

            const completedResult = result as MfaCompletedResult;
            expect(completedResult.correlationId).toBe("corr123");
            expect(completedResult.authenticationResult).toBeDefined();
            expect(completedResult.authenticationResult.accessToken).toBe(
                TestServerTokenResponse.access_token
            );
            expect(completedResult.authenticationResult.idToken).toBe(
                TestServerTokenResponse.id_token
            );
            expect(
                completedResult.authenticationResult.expiresOn
            ).toBeDefined();
            expect(completedResult.authenticationResult.tokenType).toBe(
                TestServerTokenResponse.token_type
            );
            expect(completedResult.authenticationResult.authority).toBe(
                authority.canonicalAuthority
            );
            expect(completedResult.authenticationResult.tenantId).toBe(
                TestTenantId
            );

            // Verify API was called with correct parameters
            expect(signInApiClient.requestTokensWithOob).toHaveBeenCalledWith({
                continuation_token: "continuation_token_1",
                oob: "123456",
                scope: "User.Read",
                correlationId: "corr123",
                telemetryManager: expect.any(Object),
            });
        });

        it("should throw error for empty challenge", async () => {
            await expect(
                client.submitChallenge({
                    correlationId: "corr123",
                    continuationToken: "continuation_token_1",
                    challenge: "",
                    scopes: ["User.Read"],
                })
            ).rejects.toThrow();
        });

        it("should handle multiple scopes", async () => {
            signInApiClient.requestTokensWithOob.mockResolvedValue(
                TestServerTokenResponse
            );

            await client.submitChallenge({
                correlationId: "corr123",
                continuationToken: "continuation_token_1",
                challenge: "123456",
                scopes: ["User.Read", "Mail.Read", "openid"],
            });

            expect(signInApiClient.requestTokensWithOob).toHaveBeenCalledWith({
                continuation_token: "continuation_token_1",
                oob: "123456",
                scope: "User.Read Mail.Read openid",
                correlationId: "corr123",
                telemetryManager: expect.any(Object),
            });
        });

        it("should handle empty scopes array", async () => {
            signInApiClient.requestTokensWithOob.mockResolvedValue(
                TestServerTokenResponse
            );

            await client.submitChallenge({
                correlationId: "corr123",
                continuationToken: "continuation_token_1",
                challenge: "123456",
                scopes: [],
            });

            expect(signInApiClient.requestTokensWithOob).toHaveBeenCalledWith({
                continuation_token: "continuation_token_1",
                oob: "123456",
                scope: expect.any(String),
                correlationId: "corr123",
                telemetryManager: expect.any(Object),
            });
        });
    });

    describe("getAuthMethods", () => {
        it("should return MfaGetAuthMethodsResult with available methods", async () => {
            const mockMethods = [
                {
                    id: "email_method",
                    challenge_type: "oob",
                    challenge_channel: "email",
                    login_hint: "user@example.com",
                },
                {
                    id: "sms_method",
                    challenge_type: "oob",
                    challenge_channel: "sms",
                    login_hint: "+1234567890",
                },
            ];

            signInApiClient.requestAuthMethods.mockResolvedValue({
                correlation_id: "corr123",
                continuation_token: "continuation_token_1",
                methods: mockMethods,
            });

            const result = await client.getAuthMethods({
                correlationId: "corr123",
                continuationToken: "continuation_token_0",
            });

            expect(result.type).toBe(MFA_GET_AUTH_METHODS_RESULT_TYPE);

            const authMethodsResult = result as MfaGetAuthMethodsResult;
            expect(authMethodsResult.correlationId).toBe("corr123");
            expect(authMethodsResult.continuationToken).toBe(
                "continuation_token_1"
            );
            expect(authMethodsResult.authMethods).toEqual(mockMethods);
            expect(authMethodsResult.authMethods).toHaveLength(2);

            // Verify API was called with correct parameters
            expect(signInApiClient.requestAuthMethods).toHaveBeenCalledWith({
                continuation_token: "continuation_token_0",
                correlationId: "corr123",
                telemetryManager: expect.any(Object),
            });
        });

        it("should return empty methods array when no methods available", async () => {
            signInApiClient.requestAuthMethods.mockResolvedValue({
                correlation_id: "corr123",
                continuation_token: "continuation_token_1",
                methods: [],
            });

            const result = await client.getAuthMethods({
                correlationId: "corr123",
                continuationToken: "continuation_token_0",
            });

            expect(result.type).toBe(MFA_GET_AUTH_METHODS_RESULT_TYPE);
            const authMethodsResult = result as MfaGetAuthMethodsResult;
            expect(authMethodsResult.authMethods).toEqual([]);
        });

        it("should handle API errors gracefully", async () => {
            const apiError = new CustomAuthApiError(
                "invalid_request",
                "Invalid continuation token",
                "corr123"
            );

            signInApiClient.requestAuthMethods.mockRejectedValue(apiError);

            await expect(
                client.getAuthMethods({
                    correlationId: "corr123",
                    continuationToken: "invalid_token",
                })
            ).rejects.toThrow(apiError);
        });
    });
});
