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

// Request the challenge for the selected method, sending the one-time code to it.
export interface FlowRequestChallengeParamsV2 extends FlowParamsBaseV2 {
    continuationState: FlowContinuationStateV2;
}

// Submit the one-time code the user received.
export interface FlowSubmitCodeParamsV2 extends FlowParamsBaseV2 {
    continuationState: FlowContinuationStateV2;
    code: string;
}

// Ask the server to re-send the one-time code.
export interface FlowResendCodeParamsV2 extends FlowParamsBaseV2 {
    continuationState: FlowContinuationStateV2;
}

// Submit the new password once the code has been verified.
export interface FlowSubmitPasswordParamsV2 extends FlowParamsBaseV2 {
    continuationState: FlowContinuationStateV2;
    newPassword: string;
}

// Sign the account in by redeeming a completed flow's continuation for tokens.
export interface FlowSignInWithContinuationParamsV2 extends FlowParamsBaseV2 {
    continuationState: FlowContinuationStateV2;
    scopes?: string[];
    claims?: string;
}
