/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { JitClient } from "../../../../../src/custom_auth/core/interaction_client/jit/JitClient.js";
import {
    JitChallengeAuthMethodParams,
    JitSubmitChallengeParams,
} from "../../../../../src/custom_auth/core/interaction_client/jit/parameter/JitParams.js";
import {
    JIT_VERIFICATION_REQUIRED_RESULT_TYPE,
    JIT_COMPLETED_RESULT_TYPE,
} from "../../../../../src/custom_auth/core/interaction_client/jit/result/JitActionResult.js";
import {
    ChallengeType,
    GrantType,
} from "../../../../../src/custom_auth/CustomAuthConstants.js";
import { AuthenticationMethod } from "../../../../../src/custom_auth/core/network_client/custom_auth_api/types/ApiResponseTypes.js";
import { customAuthConfig } from "../../../test_resources/CustomAuthConfig.js";
import { CustomAuthAuthority } from "../../../../../src/custom_auth/core/CustomAuthAuthority.js";
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
import { TestServerTokenResponse } from "../../../test_resources/TestConstants.js";

jest.mock(
    "../../../../../src/custom_auth/core/network_client/custom_auth_api/CustomAuthApiClient.js",
    () => {
        let registerApiClient = {
            introspect: jest.fn(),
            challenge: jest.fn(),
            continue: jest.fn(),
        };
        let signInApiClient = {
            requestTokenWithContinuationToken: jest.fn(),
        };

        const CustomAuthApiClient = jest.fn().mockImplementation(() => ({
            registerApi: registerApiClient,
            signInApi: signInApiClient,
        }));

        const mockedApiClient = new CustomAuthApiClient();
        return {
            mockedApiClient,
            registerApiClient,
            signInApiClient,
        };
    }
);

const {
    mockedApiClient,
    registerApiClient,
    signInApiClient,
} = require("../../../../../src/custom_auth/core/network_client/custom_auth_api/CustomAuthApiClient.js");

describe("JitClient", () => {
    let jitClient: JitClient;
    let customAuthAuthority: CustomAuthAuthority;
    const mockCorrelationId = "test-correlation-id";
    const mockContinuationToken = "test-continuation-token";

    beforeEach(async () => {
        jest.clearAllMocks();

        const mockBrowserConfiguration = buildConfiguration(
            customAuthConfig,
            true
        );
        const mockCacheManager = getDefaultBrowserCacheManager();
        const mockLogger = getDefaultLogger();
        const mockPerformanceClient = getDefaultPerformanceClient();

        customAuthAuthority = new CustomAuthAuthority(
            customAuthConfig.auth.authority ?? "",
            mockBrowserConfiguration,
            StubbedNetworkModule,
            mockCacheManager,
            mockLogger,
            mockPerformanceClient,
            customAuthConfig.customAuth.authApiProxyUrl
        );

        jitClient = new JitClient(
            mockBrowserConfiguration,
            mockCacheManager,
            getDefaultCrypto(),
            mockLogger,
            getDefaultEventHandler(),
            getDefaultNavigationClient(),
            getDefaultPerformanceClient(),
            mockedApiClient,
            customAuthAuthority
        );
    });

    describe("challengeAuthMethod", () => {
        const mockAuthMethod: AuthenticationMethod = {
            id: "email",
            challenge_type: "oob",
            challenge_channel: "email",
            login_hint: "user@example.com",
        };

        const mockParams: JitChallengeAuthMethodParams = {
            correlationId: mockCorrelationId,
            continuationToken: mockContinuationToken,
            authMethod: mockAuthMethod,
            verificationContact: "user@example.com",
            scopes: ["openid"],
        };

        it("should handle fast-pass scenario and return completed result", async () => {
            const mockChallengeResponse = {
                correlation_id: mockCorrelationId,
                continuation_token: "challenge-continuation-token",
                challenge_type: ChallengeType.PREVERIFIED,
                challenge_channel: "email",
                challenge_target: "user@example.com",
                binding_method: "prompt",
            };

            const mockContinueResponse = {
                correlation_id: mockCorrelationId,
                continuation_token: "final-continuation-token",
            };

            const mockTokenResponse = {
                ...TestServerTokenResponse,
                correlation_id: mockCorrelationId,
            };

            registerApiClient.challenge.mockResolvedValue(
                mockChallengeResponse
            );
            registerApiClient.continue.mockResolvedValue(mockContinueResponse);
            signInApiClient.requestTokenWithContinuationToken.mockResolvedValue(
                mockTokenResponse
            );

            const result = await jitClient.challengeAuthMethod(mockParams);

            expect(result.type).toBe(JIT_COMPLETED_RESULT_TYPE);
            expect(result.correlationId).toBe(mockCorrelationId);

            // Verify that continue endpoint is called with grant_type=continuation_token for fast-pass
            expect(registerApiClient.continue).toHaveBeenCalledWith({
                continuation_token: "challenge-continuation-token",
                grant_type: GrantType.CONTINUATION_TOKEN,
                correlationId: mockCorrelationId,
                telemetryManager: expect.any(Object),
            });

            // Verify that token endpoint is called with the new continuation token from continue response
            expect(
                signInApiClient.requestTokenWithContinuationToken
            ).toHaveBeenCalledWith({
                continuation_token: "final-continuation-token",
                scope: "openid",
                correlationId: mockCorrelationId,
                telemetryManager: expect.any(Object),
            });
        });

        it("should handle verification required scenario", async () => {
            const mockChallengeResponse = {
                correlation_id: mockCorrelationId,
                continuation_token: "new-continuation-token",
                challenge_type: ChallengeType.OOB,
                challenge_channel: "email",
                challenge_target: "user@example.com",
                binding_method: "prompt",
                code_length: 6,
            };

            registerApiClient.challenge.mockResolvedValue(
                mockChallengeResponse
            );

            const result = await jitClient.challengeAuthMethod(mockParams);

            expect(result.type).toBe(JIT_VERIFICATION_REQUIRED_RESULT_TYPE);
            expect(result.correlationId).toBe(mockCorrelationId);

            if (result.type === JIT_VERIFICATION_REQUIRED_RESULT_TYPE) {
                expect(result.continuationToken).toBe("new-continuation-token");
                expect(result.challengeChannel).toBe("email");
                expect(result.challengeTargetLabel).toBe("user@example.com");
                expect(result.codeLength).toBe(6);
            }
        });

        it("should call continue endpoint with correct grant_type for fast-pass flow", async () => {
            const mockChallengeResponse = {
                correlation_id: mockCorrelationId,
                continuation_token: "preverified-token",
                challenge_type: ChallengeType.PREVERIFIED,
                challenge_channel: "email",
                challenge_target: "user@example.com",
                binding_method: "prompt",
            };

            const mockContinueResponse = {
                correlation_id: mockCorrelationId,
                continuation_token: "post-continue-token",
            };

            const mockTokenResponse = {
                ...TestServerTokenResponse,
                correlation_id: mockCorrelationId,
            };

            registerApiClient.challenge.mockResolvedValue(
                mockChallengeResponse
            );
            registerApiClient.continue.mockResolvedValue(mockContinueResponse);
            signInApiClient.requestTokenWithContinuationToken.mockResolvedValue(
                mockTokenResponse
            );

            await jitClient.challengeAuthMethod(mockParams);

            // Verify the continue endpoint is called with grant_type=continuation_token (not oob)
            expect(registerApiClient.continue).toHaveBeenCalledTimes(1);
            expect(registerApiClient.continue).toHaveBeenCalledWith({
                continuation_token: "preverified-token",
                grant_type: GrantType.CONTINUATION_TOKEN,
                correlationId: mockCorrelationId,
                telemetryManager: expect.any(Object),
            });

            // Verify no oob parameter is passed for fast-pass
            const continueCall = registerApiClient.continue.mock.calls[0][0];
            expect(continueCall.oob).toBeUndefined();
        });
    });

    describe("submitChallenge", () => {
        it("should submit challenge and return completed result", async () => {
            const mockParams: JitSubmitChallengeParams = {
                correlationId: mockCorrelationId,
                continuationToken: mockContinuationToken,
                challenge: "123456",
                grantType: "oob",
                scopes: ["openid"],
            };

            const mockContinueResponse = {
                correlation_id: mockCorrelationId,
                continuation_token: "final-continuation-token",
            };

            const mockTokenResponse = {
                ...TestServerTokenResponse,
                correlation_id: mockCorrelationId,
            };

            registerApiClient.continue.mockResolvedValue(mockContinueResponse);
            signInApiClient.requestTokenWithContinuationToken.mockResolvedValue(
                mockTokenResponse
            );

            const result = await jitClient.submitChallenge(mockParams);

            expect(result.type).toBe(JIT_COMPLETED_RESULT_TYPE);
            expect(result.correlationId).toBe(mockCorrelationId);
            expect(registerApiClient.continue).toHaveBeenCalledWith({
                continuation_token: mockContinuationToken,
                grant_type: GrantType.OOB,
                oob: "123456",
                correlationId: mockCorrelationId,
                telemetryManager: expect.any(Object),
            });
            expect(
                signInApiClient.requestTokenWithContinuationToken
            ).toHaveBeenCalled();
        });

        it("should use grant_type from parameters for normal verification flow", async () => {
            const mockParams: JitSubmitChallengeParams = {
                correlationId: mockCorrelationId,
                continuationToken: mockContinuationToken,
                challenge: "123456",
                grantType: "oob",
                scopes: ["openid"],
            };

            const mockContinueResponse = {
                correlation_id: mockCorrelationId,
                continuation_token: "final-continuation-token",
            };

            const mockTokenResponse = {
                ...TestServerTokenResponse,
                correlation_id: mockCorrelationId,
            };

            registerApiClient.continue.mockResolvedValue(mockContinueResponse);
            signInApiClient.requestTokenWithContinuationToken.mockResolvedValue(
                mockTokenResponse
            );

            await jitClient.submitChallenge(mockParams);

            // Verify that continue is called with the grant_type from parameters (oob for normal flow)
            expect(registerApiClient.continue).toHaveBeenCalledWith({
                continuation_token: mockContinuationToken,
                grant_type: GrantType.OOB,
                oob: "123456",
                correlationId: mockCorrelationId,
                telemetryManager: expect.any(Object),
            });
        });
    });
});
