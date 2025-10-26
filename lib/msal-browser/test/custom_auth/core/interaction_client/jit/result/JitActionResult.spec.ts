/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    createJitVerificationRequiredResult,
    createJitCompletedResult,
    JIT_VERIFICATION_REQUIRED_RESULT_TYPE,
    JIT_COMPLETED_RESULT_TYPE,
    JitVerificationRequiredResult,
    JitCompletedResult,
} from "../../../../../../src/custom_auth/core/interaction_client/jit/result/JitActionResult.js";
import { AuthenticationMethod } from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/types/ApiResponseTypes.js";
import { AuthenticationResult } from "../../../../../../src/response/AuthenticationResult.js";

describe("JitActionResult", () => {
    const mockCorrelationId = "test-correlation-id";
    const mockContinuationToken = "test-continuation-token";
    const mockAuthMethods: AuthenticationMethod[] = [
        {
            id: "email",
            challenge_type: "oob",
            challenge_channel: "email",
            login_hint: "user@example.com",
        },
    ];
    const mockAuthResult = {} as AuthenticationResult;

    describe("createJitVerificationRequiredResult", () => {
        it("should create JitVerificationRequiredResult with correct type", () => {
            const result: JitVerificationRequiredResult =
                createJitVerificationRequiredResult({
                    correlationId: mockCorrelationId,
                    continuationToken: mockContinuationToken,
                    challengeChannel: "email",
                    challengeTargetLabel: "user@example.com",
                    codeLength: 6,
                });

            expect(result.type).toBe(JIT_VERIFICATION_REQUIRED_RESULT_TYPE);
            expect(result.correlationId).toBe(mockCorrelationId);
            expect(result.continuationToken).toBe(mockContinuationToken);
            expect(result.challengeChannel).toBe("email");
            expect(result.challengeTargetLabel).toBe("user@example.com");
            expect(result.codeLength).toBe(6);
        });
    });

    describe("createJitCompletedResult", () => {
        it("should create JitCompletedResult with correct type", () => {
            const result: JitCompletedResult = createJitCompletedResult({
                correlationId: mockCorrelationId,
                authenticationResult: mockAuthResult,
            });

            expect(result.type).toBe(JIT_COMPLETED_RESULT_TYPE);
            expect(result.correlationId).toBe(mockCorrelationId);
            expect(result.authenticationResult).toBe(mockAuthResult);
        });
    });
});
