/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { FlowContinuationStateV2 } from "../FlowContinuationStateV2.js";

/*
 * Input parameters for V2 interaction-client actions. Continuing actions carry
 * the opaque state returned by the previous response.
 */

interface FlowParamsBaseV2 {
    correlationId: string;
}

// Begin a reset for the given account.
export interface FlowStartParamsV2 extends FlowParamsBaseV2 {
    username: string;
}

export interface FlowSignInStartParamsV2 extends FlowStartParamsV2 {
    password?: string;
    scopes?: string[];
}

// Request the challenge for the selected method, sending the one-time code to it.
export interface FlowChallengeParamsV2 extends FlowParamsBaseV2 {
    continuationState: FlowContinuationStateV2;
}

// Submit the one-time code the user received.
export interface FlowSubmitCodeParamsV2 extends FlowParamsBaseV2 {
    continuationState: FlowContinuationStateV2;
    code: string;
}

// Submit the new password once the code has been verified.
export interface FlowSubmitNewPasswordParamsV2 extends FlowParamsBaseV2 {
    continuationState: FlowContinuationStateV2;
    newPassword: string;
}

export interface FlowSubmitSignInPasswordParamsV2 extends FlowParamsBaseV2 {
    continuationState: FlowContinuationStateV2;
    password: string;
}

// Sign the account in by redeeming a completed flow's continuation for tokens.
export interface FlowSignInWithContinuationParamsV2 extends FlowParamsBaseV2 {
    continuationState: FlowContinuationStateV2;
    scopes?: string[];
}
