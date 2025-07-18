/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// MFA State Test Suite
// This file contains unit tests for the MFA state classes.

import { MfaRequestChallengeResult } from "../../../../../../src/custom_auth/core/auth_flow/mfa/result/MfaRequestChallengeResult.js";
import { MfaSubmitChallengeResult } from "../../../../../../src/custom_auth/core/auth_flow/mfa/result/MfaSubmitChallengeResult.js";
import { MfaGetAuthMethodsResult } from "../../../../../../src/custom_auth/core/auth_flow/mfa/result/MfaGetAuthMethodsResult.js";
import { InvalidArgumentError } from "../../../../../../src/custom_auth/core/error/InvalidArgumentError.js";
import { AuthenticationMethod } from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/types/ApiResponseTypes.js";
import {
    MFA_VERIFICATION_REQUIRED_RESULT_TYPE,
    MFA_COMPLETED_RESULT_TYPE,
    MFA_GET_AUTH_METHODS_RESULT_TYPE,
    MFA_METHOD_SELECTION_REQUIRED_RESULT_TYPE,
    MfaVerificationRequiredResult,
    MfaCompletedResult,
    MfaGetAuthMethodsResult as MfaGetAuthMethodsActionResult,
    MfaMethodSelectionRequiredResult,
} from "../../../../../../src/custom_auth/core/interaction_client/mfa/result/MfaActionResult.js";
import { CustomAuthAccountData } from "../../../../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { customAuthConfig } from "../../../../test_resources/CustomAuthConfig.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";
import { TestAccounDetails } from "../../../../test_resources/TestConstants.js";
import {
    MfaAwaitingState,
    MfaVerificationRequiredState,
    MfaMethodSelectionRequiredState,
} from "../../../../../../src/custom_auth/core/auth_flow/mfa/state/MfaState.js";
import {
    MfaStateParameters,
    MfaVerificationRequiredStateParameters,
    MfaMethodSelectionRequiredStateParameters,
} from "../../../../../../src/custom_auth/core/auth_flow/mfa/state/MfaStateParameters.js";

describe("MfaAwaitingState", () => {
    let mockMfaClient: any;
    let state: MfaAwaitingState;

    beforeEach(() => {
        mockMfaClient = {
            requestChallenge: jest.fn(),
            submitChallenge: jest.fn(),
            getAuthMethods: jest.fn(),
        };

        const stateParams: MfaStateParameters = {
            correlationId: "test-correlation-id",
            continuationToken: "test-continuation-token",
            config: customAuthConfig as any,
            logger: getDefaultLogger(),
            mfaClient: mockMfaClient,
            cacheClient: {} as any,
        };

        state = new MfaAwaitingState(stateParams);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("requestChallenge", () => {
        it("should successfully request challenge and return verification required result", async () => {
            const mockVerificationResult: MfaVerificationRequiredResult = {
                type: MFA_VERIFICATION_REQUIRED_RESULT_TYPE,
                correlationId: "test-correlation-id",
                continuationToken: "new-continuation-token",
                codeLength: 6,
                challengeChannel: "email",
                challengeTargetLabel: "user@example.com",
                bindingMethod: "prompt",
            };

            mockMfaClient.requestChallenge.mockResolvedValue(
                mockVerificationResult
            );

            const result = await state.requestChallenge();

            expect(result).toBeInstanceOf(MfaRequestChallengeResult);
            expect(result.isVerificationRequired()).toBe(true);
            expect(mockMfaClient.requestChallenge).toHaveBeenCalledWith({
                correlationId: "test-correlation-id",
                continuationToken: "test-continuation-token",
                challengeType: customAuthConfig.customAuth.challengeTypes,
                authMethodId: undefined,
            });
        });

        it("should successfully request challenge and return method selection required result", async () => {
            const mockAuthMethods: AuthenticationMethod[] = [
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
            ];

            const mockMethodSelectionResult: MfaMethodSelectionRequiredResult =
                {
                    type: MFA_METHOD_SELECTION_REQUIRED_RESULT_TYPE,
                    correlationId: "test-correlation-id",
                    continuationToken: "new-continuation-token",
                    authMethods: mockAuthMethods,
                };

            mockMfaClient.requestChallenge.mockResolvedValue(
                mockMethodSelectionResult
            );

            const result = await state.requestChallenge();

            expect(result).toBeInstanceOf(MfaRequestChallengeResult);
            expect(result.isMethodSelectionRequired()).toBe(true);
            expect(mockMfaClient.requestChallenge).toHaveBeenCalledWith({
                correlationId: "test-correlation-id",
                continuationToken: "test-continuation-token",
                challengeType: customAuthConfig.customAuth.challengeTypes,
                authMethodId: undefined,
            });
        });

        it("should return error for unexpected result type", async () => {
            const mockUnexpectedResult = {
                type: "UNEXPECTED_TYPE",
                correlationId: "test-correlation-id",
                continuationToken: "new-continuation-token",
            };

            mockMfaClient.requestChallenge.mockResolvedValue(
                mockUnexpectedResult
            );

            const result = await state.requestChallenge();

            expect(result).toBeInstanceOf(MfaRequestChallengeResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData.message).toContain(
                "Unexpected result type from MFA request challenge."
            );
        });

        it("should handle error when requestChallenge fails", async () => {
            const mockError = new Error("Request challenge failed");
            mockMfaClient.requestChallenge.mockRejectedValue(mockError);

            const result = await state.requestChallenge();

            expect(result).toBeInstanceOf(MfaRequestChallengeResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData.message).toContain(
                "Request challenge failed"
            );
        });
    });
});

describe("MfaVerificationRequiredState", () => {
    let mockMfaClient: any;
    let state: MfaVerificationRequiredState;

    beforeEach(() => {
        mockMfaClient = {
            requestChallenge: jest.fn(),
            submitChallenge: jest.fn(),
            getAuthMethods: jest.fn(),
        };

        const stateParams: MfaVerificationRequiredStateParameters = {
            correlationId: "test-correlation-id",
            continuationToken: "test-continuation-token",
            config: customAuthConfig as any,
            logger: getDefaultLogger(),
            mfaClient: mockMfaClient,
            cacheClient: {} as any,
            challengeChannel: "email",
            challengeTargetLabel: "user@example.com",
            codeLength: 6,
            scopes: ["openid", "profile"],
            selectedAuthMethodId: "test-method-id",
        };

        state = new MfaVerificationRequiredState(stateParams);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getter methods", () => {
        it("should return correct code length", () => {
            expect(state.getCodeLength()).toBe(6);
        });

        it("should return correct challenge channel", () => {
            expect(state.getChannel()).toBe("email");
        });

        it("should return correct sent to target", () => {
            expect(state.getSentTo()).toBe("user@example.com");
        });
    });

    describe("submitChallenge", () => {
        it("should successfully submit challenge and return completed result", async () => {
            const mockCompletedResult: MfaCompletedResult = {
                type: MFA_COMPLETED_RESULT_TYPE,
                correlationId: "test-correlation-id",
                authenticationResult: {
                    accessToken: "access-token",
                    idToken: "id-token",
                    expiresOn: new Date(Date.now() + 3600 * 1000),
                    tokenType: "Bearer",
                    correlationId: "test-correlation-id",
                    authority: "https://test-authority.com",
                    tenantId: "test-tenant-id",
                    scopes: ["openid", "profile"],
                    account: TestAccounDetails,
                    idTokenClaims: {},
                    fromCache: false,
                    uniqueId: "test-unique-id",
                },
            };

            mockMfaClient.submitChallenge.mockResolvedValue(
                mockCompletedResult
            );

            const result = await state.submitChallenge("123456");

            expect(result).toBeInstanceOf(MfaSubmitChallengeResult);
            expect(result.isCompleted()).toBe(true);
            expect(result.data).toBeInstanceOf(CustomAuthAccountData);
            expect(mockMfaClient.submitChallenge).toHaveBeenCalledWith({
                correlationId: "test-correlation-id",
                continuationToken: "test-continuation-token",
                scopes: ["openid", "profile"],
                code: "123456",
            });
        });

        it("should return error when code is empty", async () => {
            const result = await state.submitChallenge("");

            expect(result).toBeInstanceOf(MfaSubmitChallengeResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(
                InvalidArgumentError
            );
            expect(result.error?.isInvalidCode()).toBe(true);
            expect(mockMfaClient.submitChallenge).not.toHaveBeenCalled();
        });

        it("should return error when code length is incorrect", async () => {
            const result = await state.submitChallenge("123"); // Expected 6, provided 3

            expect(result).toBeInstanceOf(MfaSubmitChallengeResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(
                InvalidArgumentError
            );
            expect(result.error?.isInvalidCode()).toBe(true);
            expect(mockMfaClient.submitChallenge).not.toHaveBeenCalled();
        });

        it("should handle error when submitChallenge fails", async () => {
            const mockError = new Error("Submit challenge failed");
            mockMfaClient.submitChallenge.mockRejectedValue(mockError);

            const result = await state.submitChallenge("123456");

            expect(result).toBeInstanceOf(MfaSubmitChallengeResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData.message).toContain(
                "Submit challenge failed"
            );
        });
    });

    describe("getAuthMethods", () => {
        it("should successfully get auth methods and return method selection required result", async () => {
            const mockAuthMethods: AuthenticationMethod[] = [
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
            ];

            const mockGetAuthMethodsResult: MfaGetAuthMethodsActionResult = {
                type: MFA_GET_AUTH_METHODS_RESULT_TYPE,
                correlationId: "test-correlation-id",
                continuationToken: "new-continuation-token",
                authMethods: mockAuthMethods,
            };

            mockMfaClient.getAuthMethods.mockResolvedValue(
                mockGetAuthMethodsResult
            );

            const result = await state.getAuthMethods();

            expect(result).toBeInstanceOf(MfaGetAuthMethodsResult);
            expect(result.isMethodSelectionRequired()).toBe(true);
            expect(mockMfaClient.getAuthMethods).toHaveBeenCalledWith({
                correlationId: "test-correlation-id",
                continuationToken: "test-continuation-token",
            });
        });

        it("should handle error when getAuthMethods fails", async () => {
            const mockError = new Error("Get auth methods failed");
            mockMfaClient.getAuthMethods.mockRejectedValue(mockError);

            const result = await state.getAuthMethods();

            expect(result).toBeInstanceOf(MfaGetAuthMethodsResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData.message).toContain(
                "Get auth methods failed"
            );
        });
    });

    describe("requestChallenge", () => {
        it("should successfully request challenge and return verification required result", async () => {
            const mockVerificationResult: MfaVerificationRequiredResult = {
                type: MFA_VERIFICATION_REQUIRED_RESULT_TYPE,
                correlationId: "test-correlation-id",
                continuationToken: "new-continuation-token",
                codeLength: 6,
                challengeChannel: "email",
                challengeTargetLabel: "user@example.com",
                bindingMethod: "prompt",
            };

            mockMfaClient.requestChallenge.mockResolvedValue(
                mockVerificationResult
            );

            const result = await state.requestChallenge();

            expect(result).toBeInstanceOf(MfaRequestChallengeResult);
            expect(result.isVerificationRequired()).toBe(true);
            expect(mockMfaClient.requestChallenge).toHaveBeenCalledWith({
                correlationId: "test-correlation-id",
                continuationToken: "test-continuation-token",
                challengeType: customAuthConfig.customAuth.challengeTypes,
                authMethodId: undefined,
            });
        });

        it("should successfully request challenge and return method selection required result", async () => {
            const mockAuthMethods: AuthenticationMethod[] = [
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
            ];

            const mockMethodSelectionResult: MfaMethodSelectionRequiredResult =
                {
                    type: MFA_METHOD_SELECTION_REQUIRED_RESULT_TYPE,
                    correlationId: "test-correlation-id",
                    continuationToken: "new-continuation-token",
                    authMethods: mockAuthMethods,
                };

            mockMfaClient.requestChallenge.mockResolvedValue(
                mockMethodSelectionResult
            );

            const result = await state.requestChallenge();

            expect(result).toBeInstanceOf(MfaRequestChallengeResult);
            expect(result.isMethodSelectionRequired()).toBe(true);
        });

        it("should return error for unexpected result type", async () => {
            const mockUnexpectedResult = {
                type: "UNEXPECTED_TYPE",
                correlationId: "test-correlation-id",
                continuationToken: "new-continuation-token",
            };

            mockMfaClient.requestChallenge.mockResolvedValue(
                mockUnexpectedResult
            );

            const result = await state.requestChallenge();

            expect(result).toBeInstanceOf(MfaRequestChallengeResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData.message).toContain(
                "Unexpected result type from MFA request challenge."
            );
        });

        it("should handle error when requestChallenge fails", async () => {
            const mockError = new Error("Request challenge failed");
            mockMfaClient.requestChallenge.mockRejectedValue(mockError);

            const result = await state.requestChallenge();

            expect(result).toBeInstanceOf(MfaRequestChallengeResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData.message).toContain(
                "Request challenge failed"
            );
        });
    });
});

describe("MfaMethodSelectionRequiredState", () => {
    let mockMfaClient: any;
    let state: MfaMethodSelectionRequiredState;

    const mockAuthMethods: AuthenticationMethod[] = [
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
    ];

    beforeEach(() => {
        mockMfaClient = {
            requestChallenge: jest.fn(),
            submitChallenge: jest.fn(),
            getAuthMethods: jest.fn(),
        };

        const stateParams: MfaMethodSelectionRequiredStateParameters = {
            correlationId: "test-correlation-id",
            continuationToken: "test-continuation-token",
            config: customAuthConfig as any,
            logger: getDefaultLogger(),
            mfaClient: mockMfaClient,
            cacheClient: {} as any,
            authMethods: mockAuthMethods,
            scopes: ["openid", "profile"],
        };

        state = new MfaMethodSelectionRequiredState(stateParams);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getAuthMethods", () => {
        it("should return the available authentication methods", () => {
            const authMethods = state.getAuthMethods();

            expect(authMethods).toBe(mockAuthMethods);
            expect(authMethods).toHaveLength(2);
            expect(authMethods[0].id).toBe("method1");
            expect(authMethods[1].id).toBe("method2");
        });
    });

    describe("requestChallenge", () => {
        it("should successfully request challenge with specific auth method and return verification required result", async () => {
            const mockVerificationResult: MfaVerificationRequiredResult = {
                type: MFA_VERIFICATION_REQUIRED_RESULT_TYPE,
                correlationId: "test-correlation-id",
                continuationToken: "new-continuation-token",
                codeLength: 6,
                challengeChannel: "email",
                challengeTargetLabel: "user@example.com",
                bindingMethod: "prompt",
            };

            mockMfaClient.requestChallenge.mockResolvedValue(
                mockVerificationResult
            );

            const result = await state.requestChallenge("method1");

            expect(result).toBeInstanceOf(MfaRequestChallengeResult);
            expect(result.isVerificationRequired()).toBe(true);
            expect(mockMfaClient.requestChallenge).toHaveBeenCalledWith({
                correlationId: "test-correlation-id",
                continuationToken: "test-continuation-token",
                challengeType: customAuthConfig.customAuth.challengeTypes,
                authMethodId: "method1",
            });
        });

        it("should successfully request challenge and return method selection required result", async () => {
            const mockMethodSelectionResult: MfaMethodSelectionRequiredResult =
                {
                    type: MFA_METHOD_SELECTION_REQUIRED_RESULT_TYPE,
                    correlationId: "test-correlation-id",
                    continuationToken: "new-continuation-token",
                    authMethods: mockAuthMethods,
                };

            mockMfaClient.requestChallenge.mockResolvedValue(
                mockMethodSelectionResult
            );

            const result = await state.requestChallenge("method1");

            expect(result).toBeInstanceOf(MfaRequestChallengeResult);
            expect(result.isMethodSelectionRequired()).toBe(true);
        });

        it("should return error for unexpected result type", async () => {
            const mockUnexpectedResult = {
                type: "UNEXPECTED_TYPE",
                correlationId: "test-correlation-id",
                continuationToken: "new-continuation-token",
            };

            mockMfaClient.requestChallenge.mockResolvedValue(
                mockUnexpectedResult
            );

            const result = await state.requestChallenge("method1");

            expect(result).toBeInstanceOf(MfaRequestChallengeResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData.message).toContain(
                "Unexpected result type from MFA request challenge."
            );
        });

        it("should return error when authMethodId is empty", async () => {
            const result = await state.requestChallenge("");

            expect(result).toBeInstanceOf(MfaRequestChallengeResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(
                InvalidArgumentError
            );
            expect(mockMfaClient.requestChallenge).not.toHaveBeenCalled();
        });

        it("should return error when authMethodId is undefined", async () => {
            const result = await state.requestChallenge(undefined as any);

            expect(result).toBeInstanceOf(MfaRequestChallengeResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(
                InvalidArgumentError
            );
            expect(mockMfaClient.requestChallenge).not.toHaveBeenCalled();
        });

        it("should handle error when requestChallenge fails", async () => {
            const mockError = new Error("Request challenge failed");
            mockMfaClient.requestChallenge.mockRejectedValue(mockError);

            const result = await state.requestChallenge("method1");

            expect(result).toBeInstanceOf(MfaRequestChallengeResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData.message).toContain(
                "Request challenge failed"
            );
        });
    });
});
