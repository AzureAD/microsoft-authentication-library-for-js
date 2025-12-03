/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthMethodRegistrationRequiredState,
    AuthMethodVerificationRequiredState,
} from "../../../../../../src/custom_auth/core/auth_flow/jit/state/AuthMethodRegistrationState.js";
import {
    AuthMethodRegistrationRequiredStateParameters,
    AuthMethodVerificationRequiredStateParameters,
} from "../../../../../../src/custom_auth/core/auth_flow/jit/state/AuthMethodRegistrationStateParameters.js";
import { AuthMethodDetails } from "../../../../../../src/custom_auth/core/auth_flow/jit/AuthMethodDetails.js";
import { JitClient } from "../../../../../../src/custom_auth/core/interaction_client/jit/JitClient.js";
import {
    createJitVerificationRequiredResult,
    createJitCompletedResult,
} from "../../../../../../src/custom_auth/core/interaction_client/jit/result/JitActionResult.js";
import { AuthenticationMethod } from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/types/ApiResponseTypes.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";
import { customAuthConfig } from "../../../../test_resources/CustomAuthConfig.js";

describe("JitState", () => {
    let mockJitClient: jest.Mocked<JitClient>;
    let correlationId: string;

    const mockAuthMethod: AuthenticationMethod = {
        id: "email",
        challenge_type: "oob",
        challenge_channel: "email",
        login_hint: "user@example.com",
    };

    beforeEach(() => {
        correlationId = "test-correlation-id";

        mockJitClient = {
            challengeAuthMethod: jest.fn(),
            submitChallenge: jest.fn(),
        } as any;
    });

    describe("AuthMethodRegistrationRequiredState", () => {
        let state: AuthMethodRegistrationRequiredState;
        let stateParameters: AuthMethodRegistrationRequiredStateParameters;

        beforeEach(() => {
            stateParameters = {
                correlationId,
                logger: getDefaultLogger(),
                config: customAuthConfig as any,
                continuationToken: "test-token",
                jitClient: mockJitClient,
                cacheClient: {} as any,
                scopes: ["scope1"],
                username: "testuser",
                authMethods: [mockAuthMethod],
            };

            state = new AuthMethodRegistrationRequiredState(stateParameters);
        });

        it("should be created successfully", () => {
            expect(state).toBeInstanceOf(AuthMethodRegistrationRequiredState);
        });

        it("should return available auth methods", () => {
            const methods = state.getAuthMethods();
            expect(methods).toEqual([mockAuthMethod]);
        });

        it("should challenge auth method successfully and return verification required", async () => {
            const authMethodDetails: AuthMethodDetails = {
                authMethodType: mockAuthMethod,
                verificationContact: "user@example.com",
            };

            const mockResult = createJitVerificationRequiredResult({
                correlationId,
                continuationToken: "new-token",
                challengeChannel: "email",
                challengeTargetLabel: "u***@example.com",
                codeLength: 6,
            });

            mockJitClient.challengeAuthMethod.mockResolvedValue(mockResult);

            const result = await state.challengeAuthMethod(authMethodDetails);

            expect(result.isVerificationRequired()).toBe(true);
            expect(mockJitClient.challengeAuthMethod).toHaveBeenCalledWith({
                correlationId,
                continuationToken: "test-token",
                authMethod: mockAuthMethod,
                verificationContact: "user@example.com",
                scopes: ["scope1"],
                username: "testuser",
            });
        });

        it("should challenge auth method successfully and return completed for fast-pass", async () => {
            const authMethodDetails: AuthMethodDetails = {
                authMethodType: mockAuthMethod,
                verificationContact: "user@example.com",
            };

            const mockResult = createJitCompletedResult({
                correlationId,
                authenticationResult: {
                    account: {
                        homeAccountId: "test-account-id",
                        environment: "test-env",
                        tenantId: "test-tenant",
                        username: "testuser",
                        localAccountId: "test-local-id",
                    },
                } as any,
            });

            mockJitClient.challengeAuthMethod.mockResolvedValue(mockResult);

            const result = await state.challengeAuthMethod(authMethodDetails);

            expect(result.isCompleted()).toBe(true);
        });

        it("should handle challenge auth method error", async () => {
            const authMethodDetails: AuthMethodDetails = {
                authMethodType: mockAuthMethod,
                verificationContact: "user@example.com",
            };

            const error = new Error("Test error");
            mockJitClient.challengeAuthMethod.mockRejectedValue(error);

            const result = await state.challengeAuthMethod(authMethodDetails);

            expect(result.isFailed()).toBe(true);
            expect(result.error).toBeDefined();
        });
    });

    describe("AuthMethodVerificationRequiredState", () => {
        let state: AuthMethodVerificationRequiredState;
        let stateParameters: AuthMethodVerificationRequiredStateParameters;

        beforeEach(() => {
            stateParameters = {
                correlationId,
                logger: getDefaultLogger(),
                config: customAuthConfig as any,
                continuationToken: "test-token",
                jitClient: mockJitClient,
                cacheClient: {} as any,
                scopes: ["scope1"],
                username: "testuser",
                challengeChannel: "email",
                challengeTargetLabel: "u***@example.com",
                codeLength: 6,
            };

            state = new AuthMethodVerificationRequiredState(stateParameters);
        });

        it("should be created successfully", () => {
            expect(state).toBeInstanceOf(AuthMethodVerificationRequiredState);
        });

        it("should return correct challenge details", () => {
            expect(state.getCodeLength()).toBe(6);
            expect(state.getChannel()).toBe("email");
            expect(state.getSentTo()).toBe("u***@example.com");
        });

        it("should submit challenge successfully", async () => {
            const mockResult = createJitCompletedResult({
                correlationId,
                authenticationResult: {
                    account: {
                        homeAccountId: "test-account-id",
                        environment: "test-env",
                        tenantId: "test-tenant",
                        username: "testuser",
                        localAccountId: "test-local-id",
                    },
                } as any,
            });

            mockJitClient.submitChallenge.mockResolvedValue(mockResult);

            const result = await state.submitChallenge("123456");

            expect(result.isCompleted()).toBe(true);
            expect(mockJitClient.submitChallenge).toHaveBeenCalledWith({
                correlationId,
                continuationToken: "test-token",
                scopes: ["scope1"],
                grantType: "oob",
                challenge: "123456",
                username: "testuser",
            });
        });

        it("should handle submit challenge error", async () => {
            const error = new Error("Test error");
            mockJitClient.submitChallenge.mockRejectedValue(error);

            const result = await state.submitChallenge("123456");

            expect(result.isFailed()).toBe(true);
            expect(result.error).toBeDefined();
        });

        it("should challenge different auth method", async () => {
            const authMethodDetails: AuthMethodDetails = {
                authMethodType: mockAuthMethod,
                verificationContact: "different@example.com",
            };

            const mockResult = createJitVerificationRequiredResult({
                correlationId,
                continuationToken: "new-token",
                challengeChannel: "email",
                challengeTargetLabel: "d***@example.com",
                codeLength: 6,
            });

            mockJitClient.challengeAuthMethod.mockResolvedValue(mockResult);

            const result = await state.challengeAuthMethod(authMethodDetails);

            expect(result.isVerificationRequired()).toBe(true);
        });
    });
});
