/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "../../../../../response/AuthenticationResult.js";
import { AuthenticationMethod } from "../../../network_client/custom_auth_api/types/ApiResponseTypes.js";

/**
 * Base interface for all MFA action results.
 */
interface MfaActionResult {
    type: string;
    correlationId: string;
}

/**
 * Base interface for MFA results that include continuation token.
 */
interface MfaContinuationTokenResult extends MfaActionResult {
    continuationToken: string;
}

/**
 * Result when MFA verification is required.
 */
export interface MfaVerificationRequiredResult
    extends MfaContinuationTokenResult {
    type: typeof MFA_VERIFICATION_REQUIRED_RESULT_TYPE;
    challengeChannel: string;
    challengeTargetLabel: string;
    codeLength: number;
    bindingMethod: string;
}

/**
 * Result when method selection is required.
 */
export interface MfaMethodSelectionRequiredResult
    extends MfaContinuationTokenResult {
    type: typeof MFA_METHOD_SELECTION_REQUIRED_RESULT_TYPE;
    authMethods: AuthenticationMethod[];
}

/**
 * Result when MFA is completed successfully.
 */
export interface MfaCompletedResult extends MfaActionResult {
    type: typeof MFA_COMPLETED_RESULT_TYPE;
    authenticationResult: AuthenticationResult;
}

/**
 * Result for getting authentication methods.
 */
export interface MfaGetAuthMethodsResult extends MfaContinuationTokenResult {
    type: typeof MFA_GET_AUTH_METHODS_RESULT_TYPE;
    authMethods: AuthenticationMethod[];
}

// Result type constants
export const MFA_VERIFICATION_REQUIRED_RESULT_TYPE =
    "MfaVerificationRequiredResult";
export const MFA_METHOD_SELECTION_REQUIRED_RESULT_TYPE =
    "MfaMethodSelectionRequiredResult";
export const MFA_COMPLETED_RESULT_TYPE = "MfaCompletedResult";
export const MFA_GET_AUTH_METHODS_RESULT_TYPE = "MfaGetAuthMethodsResult";

/**
 * Factory function to create MfaVerificationRequiredResult.
 */
export function createMfaVerificationRequiredResult(
    input: Omit<MfaVerificationRequiredResult, "type">
): MfaVerificationRequiredResult {
    return {
        type: MFA_VERIFICATION_REQUIRED_RESULT_TYPE,
        ...input,
    };
}

/**
 * Factory function to create MfaMethodSelectionRequiredResult.
 */
export function createMfaMethodSelectionRequiredResult(
    input: Omit<MfaMethodSelectionRequiredResult, "type">
): MfaMethodSelectionRequiredResult {
    return {
        type: MFA_METHOD_SELECTION_REQUIRED_RESULT_TYPE,
        ...input,
    };
}

/**
 * Factory function to create MfaCompletedResult.
 */
export function createMfaCompletedResult(
    input: Omit<MfaCompletedResult, "type">
): MfaCompletedResult {
    return {
        type: MFA_COMPLETED_RESULT_TYPE,
        ...input,
    };
}

/**
 * Factory function to create MfaGetAuthMethodsResult.
 */
export function createMfaGetAuthMethodsResult(
    input: Omit<MfaGetAuthMethodsResult, "type">
): MfaGetAuthMethodsResult {
    return {
        type: MFA_GET_AUTH_METHODS_RESULT_TYPE,
        ...input,
    };
}
