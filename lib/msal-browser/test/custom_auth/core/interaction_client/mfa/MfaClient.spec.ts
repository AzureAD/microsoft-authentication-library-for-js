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
    MFA_COMPLETED_RESULT_TYPE,
    MfaVerificationRequiredResult,
    MfaCompletedResult,
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
            mockPerformanceClient,
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
                    authMethodId: "method123",
                })
            ).rejects.toThrow(CustomAuthApiError);
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
            expect(completedResult.correlationId).toBe(
                TestServerTokenResponse.correlation_id
            );
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
                grant_type: "mfa_oob",
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
                grant_type: "mfa_oob",
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
                grant_type: "mfa_oob",
                scope: expect.any(String),
                correlationId: "corr123",
                telemetryManager: expect.any(Object),
            });
        });
    });
});
