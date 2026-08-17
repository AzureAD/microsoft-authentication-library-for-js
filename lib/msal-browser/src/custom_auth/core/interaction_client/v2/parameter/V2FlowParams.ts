/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { V2FlowContinuationState } from "../V2FlowContinuationState.js";

/*
 * Input parameters for the generic V2 flow interaction-client steps. Every step after the entry
 * carries the opaque `continuationState` produced by the previous step; the entry step
 * (`resetPassword`) instead takes the flow's seed input (the username).
 */

interface V2FlowParamsBase {
    correlationId: string;
}

// Entry step: begin a reset for the given account.
export interface V2FlowStartParams extends V2FlowParamsBase {
    username: string;
}

// Request the challenge for the selected method, sending the one-time code to it.
export interface V2FlowRequestChallengeParams extends V2FlowParamsBase {
    continuationState: V2FlowContinuationState;
}

// Submit the one-time code the user received.
export interface V2FlowSubmitCodeParams extends V2FlowParamsBase {
    continuationState: V2FlowContinuationState;
    code: string;
}

// Ask the server to re-send the one-time code.
export interface V2FlowResendCodeParams extends V2FlowParamsBase {
    continuationState: V2FlowContinuationState;
}

// Submit the new password once the code has been verified.
export interface V2FlowSubmitPasswordParams extends V2FlowParamsBase {
    continuationState: V2FlowContinuationState;
    newPassword: string;
}

// Sign the account in by redeeming a completed flow's continuation for tokens.
export interface V2FlowSignInWithContinuationParams extends V2FlowParamsBase {
    continuationState: V2FlowContinuationState;
    scopes?: string[];
    claims?: string;
}
