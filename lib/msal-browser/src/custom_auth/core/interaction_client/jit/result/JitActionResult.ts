/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "../../../../../response/AuthenticationResult.js";
import { AuthenticationMethod } from "../../../network_client/custom_auth_api/types/ApiResponseTypes.js";

interface JitActionResult {
    type: string;
    correlationId: string;
}

interface JitContinuationTokenResult extends JitActionResult {
    continuationToken: string;
}

export interface JitGetAuthMethodsResult extends JitContinuationTokenResult {
    type: typeof JIT_GET_AUTH_METHODS_RESULT_TYPE;
    authMethods: AuthenticationMethod[];
}

export interface JitVerificationRequiredResult
    extends JitContinuationTokenResult {
    type: typeof JIT_VERIFICATION_REQUIRED_RESULT_TYPE;
    challengeChannel: string;
    challengeTargetLabel: string;
    codeLength: number;
}

export interface JitCompletedResult extends JitActionResult {
    type: typeof JIT_COMPLETED_RESULT_TYPE;
    authenticationResult: AuthenticationResult;
}

// Result type constants
export const JIT_GET_AUTH_METHODS_RESULT_TYPE = "JitGetAuthMethodsResult";
export const JIT_VERIFICATION_REQUIRED_RESULT_TYPE =
    "JitVerificationRequiredResult";
export const JIT_COMPLETED_RESULT_TYPE = "JitCompletedResult";

export function createJitGetAuthMethodsResult(
    input: Omit<JitGetAuthMethodsResult, "type">
): JitGetAuthMethodsResult {
    return {
        type: JIT_GET_AUTH_METHODS_RESULT_TYPE,
        ...input,
    };
}

export function createJitVerificationRequiredResult(
    input: Omit<JitVerificationRequiredResult, "type">
): JitVerificationRequiredResult {
    return {
        type: JIT_VERIFICATION_REQUIRED_RESULT_TYPE,
        ...input,
    };
}

export function createJitCompletedResult(
    input: Omit<JitCompletedResult, "type">
): JitCompletedResult {
    return {
        type: JIT_COMPLETED_RESULT_TYPE,
        ...input,
    };
}
