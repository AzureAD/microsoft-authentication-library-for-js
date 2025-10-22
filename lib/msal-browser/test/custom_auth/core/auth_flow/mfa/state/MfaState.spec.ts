/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MfaRequestChallengeResult } from "../../../../../../src/custom_auth/core/auth_flow/mfa/result/MfaRequestChallengeResult.js";
import { MfaSubmitChallengeResult } from "../../../../../../src/custom_auth/core/auth_flow/mfa/result/MfaSubmitChallengeResult.js";
import { InvalidArgumentError } from "../../../../../../src/custom_auth/core/error/InvalidArgumentError.js";
import { AuthenticationMethod } from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/types/ApiResponseTypes.js";
import {
    MfaVerificationRequiredResult,
    MfaCompletedResult,
    MFA_VERIFICATION_REQUIRED_RESULT_TYPE,
    MFA_COMPLETED_RESULT_TYPE,
} from "../../../../../../src/custom_auth/core/interaction_client/mfa/result/MfaActionResult.js";
import { CustomAuthAccountData } from "../../../../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { customAuthConfig } from "../../../../test_resources/CustomAuthConfig.js";
import { TestAccountDetails } from "../../../../test_resources/TestConstants.js";
import {
    MfaAwaitingState,
    MfaVerificationRequiredState,
} from "../../../../../../src/custom_auth/core/auth_flow/mfa/state/MfaState.js";
import {
    MfaAwaitingStateParameters,
    MfaVerificationRequiredStateParameters,
} from "../../../../../../src/custom_auth/core/auth_flow/mfa/state/MfaStateParameters.js";
import { MfaCompletedState } from "../../../../../../src/custom_auth/core/auth_flow/mfa/state/MfaCompletedState.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";
import { UnexpectedError } from "../../../../../../src/custom_auth/core/error/UnexpectedError.js";

describe("MfaAwaitingState", () => {
    let mockMfaClient: any;
    let state: MfaAwaitingState;

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
        };

        const stateParams: MfaAwaitingStateParameters = {
            correlationId: "test-correlation-id",
            continuationToken: "test-continuation-token",
            config: customAuthConfig as any,
            logger: getDefaultLogger(),
            mfaClient: mockMfaClient,
            cacheClient: {} as any,
            authMethods: mockAuthMethods,
        };

        state = new MfaAwaitingState(stateParams);
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

        it("should return empty array when no auth methods provided", () => {
            const stateParams: MfaAwaitingStateParameters = {
                correlationId: "test-correlation-id",
                continuationToken: "test-continuation-token",
                config: customAuthConfig as any,
                logger: getDefaultLogger(),
                mfaClient: mockMfaClient,
                cacheClient: {} as any,
                authMethods: [],
            };

            const emptyState = new MfaAwaitingState(stateParams);
            const authMethods = emptyState.getAuthMethods();

            expect(authMethods).toEqual([]);
            expect(authMethods).toHaveLength(0);
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

            const result = await state.requestChallenge("method1");

            expect(result).toBeInstanceOf(MfaRequestChallengeResult);
            expect(result.isVerificationRequired()).toBe(true);
            expect(result.state).toBeInstanceOf(MfaVerificationRequiredState);

            const verificationState =
                result.state as MfaVerificationRequiredState;
            expect(verificationState.getCodeLength()).toBe(6);
            expect(verificationState.getChannel()).toBe("email");
            expect(verificationState.getSentTo()).toBe("user@example.com");

            expect(mockMfaClient.requestChallenge).toHaveBeenCalledWith({
                correlationId: "test-correlation-id",
                continuationToken: "test-continuation-token",
                challengeType: customAuthConfig.customAuth.challengeTypes,
                authMethodId: "method1",
            });
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

        it("should return error when authMethodId is null", async () => {
            const result = await state.requestChallenge(null as any);

            expect(result).toBeInstanceOf(MfaRequestChallengeResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(
                InvalidArgumentError
            );
            expect(mockMfaClient.requestChallenge).not.toHaveBeenCalled();
        });

        it("should return error when authMethodId is whitespace", async () => {
            const result = await state.requestChallenge("   ");

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
            expect(result.error?.errorData).toBeInstanceOf(UnexpectedError);
        });
    });
});

describe("MfaVerificationRequiredState", () => {
    let mockMfaClient: any;
    let mockCacheClient: any;
    let state: MfaVerificationRequiredState;

    beforeEach(() => {
        mockMfaClient = {
            requestChallenge: jest.fn(),
            submitChallenge: jest.fn(),
        };

        mockCacheClient = {
            setAccount: jest.fn(),
            getAccount: jest.fn(),
        };

        const stateParams: MfaVerificationRequiredStateParameters = {
            correlationId: "test-correlation-id",
            continuationToken: "test-continuation-token",
            config: customAuthConfig as any,
            logger: getDefaultLogger(),
            mfaClient: mockMfaClient,
            cacheClient: mockCacheClient,
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

        it("should handle edge case code lengths", () => {
            const stateParams: MfaVerificationRequiredStateParameters = {
                correlationId: "test-correlation-id",
                continuationToken: "test-continuation-token",
                config: customAuthConfig as any,
                logger: getDefaultLogger(),
                mfaClient: mockMfaClient,
                cacheClient: mockCacheClient,
                challengeChannel: "sms",
                challengeTargetLabel: "+1234567890",
                codeLength: 8,
                scopes: ["openid"],
                selectedAuthMethodId: "test-method-id",
            };

            const stateWith8DigitCode = new MfaVerificationRequiredState(
                stateParams
            );
            expect(stateWith8DigitCode.getCodeLength()).toBe(8);
            expect(stateWith8DigitCode.getChannel()).toBe("sms");
            expect(stateWith8DigitCode.getSentTo()).toBe("+1234567890");
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
                    account: TestAccountDetails,
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
            expect(result.state).toBeInstanceOf(MfaCompletedState);
            expect(result.data).toBeInstanceOf(CustomAuthAccountData);
            expect(mockMfaClient.submitChallenge).toHaveBeenCalledWith({
                correlationId: "test-correlation-id",
                continuationToken: "test-continuation-token",
                scopes: ["openid", "profile"],
                challenge: "123456",
            });
        });

        it("should return error when challenge is empty", async () => {
            const result = await state.submitChallenge("");

            expect(result).toBeInstanceOf(MfaSubmitChallengeResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(
                InvalidArgumentError
            );
            expect(result.error?.isIncorrectChallenge).toBeTruthy();
            expect(mockMfaClient.submitChallenge).not.toHaveBeenCalled();
        });

        it("should return error when challenge is undefined", async () => {
            const result = await state.submitChallenge(undefined as any);

            expect(result).toBeInstanceOf(MfaSubmitChallengeResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(
                InvalidArgumentError
            );
            expect(result.error?.isIncorrectChallenge).toBeTruthy();
            expect(mockMfaClient.submitChallenge).not.toHaveBeenCalled();
        });

        it("should return error when challenge is null", async () => {
            const result = await state.submitChallenge(null as any);

            expect(result).toBeInstanceOf(MfaSubmitChallengeResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(
                InvalidArgumentError
            );
            expect(result.error?.isIncorrectChallenge).toBeTruthy();
            expect(mockMfaClient.submitChallenge).not.toHaveBeenCalled();
        });

        it("should return error when challenge is whitespace", async () => {
            const result = await state.submitChallenge("   ");

            expect(result).toBeInstanceOf(MfaSubmitChallengeResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(
                InvalidArgumentError
            );
            expect(result.error?.isIncorrectChallenge).toBeTruthy();
            expect(mockMfaClient.submitChallenge).not.toHaveBeenCalled();
        });

        it("should return error when code length is incorrect", async () => {
            const result = await state.submitChallenge("123"); // Expected 6, provided 3

            expect(result).toBeInstanceOf(MfaSubmitChallengeResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(
                InvalidArgumentError
            );
            expect(result.error?.isIncorrectChallenge).toBeTruthy();
            expect(mockMfaClient.submitChallenge).not.toHaveBeenCalled();
        });

        it("should return error when code is too long", async () => {
            const result = await state.submitChallenge("1234567890"); // Expected 6, provided 10

            expect(result).toBeInstanceOf(MfaSubmitChallengeResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(
                InvalidArgumentError
            );
            expect(result.error?.isIncorrectChallenge).toBeTruthy();
            expect(mockMfaClient.submitChallenge).not.toHaveBeenCalled();
        });

        it("should handle error when submitChallenge fails", async () => {
            const mockError = new Error("Submit challenge failed");
            mockMfaClient.submitChallenge.mockRejectedValue(mockError);

            const result = await state.submitChallenge("123456");

            expect(result).toBeInstanceOf(MfaSubmitChallengeResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(UnexpectedError);
        });
    });

    describe("requestChallenge (inherited)", () => {
        it("should successfully request challenge and return verification required result", async () => {
            const mockVerificationResult: MfaVerificationRequiredResult = {
                type: MFA_VERIFICATION_REQUIRED_RESULT_TYPE,
                correlationId: "response-correlation-id",
                continuationToken: "new-continuation-token",
                codeLength: 8,
                challengeChannel: "sms",
                challengeTargetLabel: "+1234567890",
                bindingMethod: "prompt",
            };

            mockMfaClient.requestChallenge.mockResolvedValue(
                mockVerificationResult
            );

            const result = await state.requestChallenge("method2");

            expect(result).toBeInstanceOf(MfaRequestChallengeResult);
            expect(result.isVerificationRequired()).toBe(true);
            expect(result.state).toBeInstanceOf(MfaVerificationRequiredState);

            const verificationState =
                result.state as MfaVerificationRequiredState;
            expect(verificationState.getCodeLength()).toBe(8);
            expect(verificationState.getChannel()).toBe("sms");
            expect(verificationState.getSentTo()).toBe("+1234567890");

            expect(mockMfaClient.requestChallenge).toHaveBeenCalledWith({
                correlationId: "test-correlation-id",
                continuationToken: "test-continuation-token",
                challengeType: customAuthConfig.customAuth.challengeTypes,
                authMethodId: "method2",
            });
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

        it("should handle error when requestChallenge fails", async () => {
            const mockError = new Error("Request challenge failed");
            mockMfaClient.requestChallenge.mockRejectedValue(mockError);

            const result = await state.requestChallenge("method1");

            expect(result).toBeInstanceOf(MfaRequestChallengeResult);
            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(UnexpectedError);
        });
    });
});
