/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "../../../../../response/AuthenticationResult.js";
import { AuthenticationMethodV2 } from "../../../auth_flow/v2/AuthenticationMethodV2.js";
import { FlowContinuationStateV2 } from "../FlowContinuationStateV2.js";

/*
 * Unified outcome envelope returned by V2 interaction-client actions. The L1
 * state layer maps each outcome to its corresponding public state.
 */

interface FlowActionResultBaseV2 {
    type: string;
    correlationId: string;
}

/*
 * Authentication methods available for user selection. The continuation state
 * is used when requesting a challenge for the selected method.
 */
export interface FlowMethodSelectionRequiredResultV2
    extends FlowActionResultBaseV2 {
    type: typeof FLOW_METHOD_SELECTION_REQUIRED_V2;
    continuationState: FlowContinuationStateV2;
    methods: AuthenticationMethodV2[];
}

/*
 * A one-time code was sent and must be submitted next. `continuationState` carries the token and
 * the `verify`/`resend` hrefs; the remaining fields are display metadata for the app's prompt.
 */
export interface FlowCodeRequiredResultV2 extends FlowActionResultBaseV2 {
    type: typeof FLOW_CODE_REQUIRED_V2;
    continuationState: FlowContinuationStateV2;
    channel?: string;
    sentTo?: string;
    codeLength?: number;
}

// The user's existing password must be submitted next for sign-in.
export interface FlowPasswordRequiredResultV2 extends FlowActionResultBaseV2 {
    type: typeof FLOW_PASSWORD_REQUIRED_V2;
    continuationState: FlowContinuationStateV2;
}

// A new password must be submitted next for password reset.
export interface FlowNewPasswordRequiredResultV2
    extends FlowActionResultBaseV2 {
    type: typeof FLOW_NEW_PASSWORD_REQUIRED_V2;
    continuationState: FlowContinuationStateV2;
}

/*
 * A flow completed without automatically signing the account in. `continuationState`
 * carries the token to redeem for tokens.
 */
export interface FlowSignInContinuationRequiredResultV2
    extends FlowActionResultBaseV2 {
    type: typeof FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2;
    continuationState: FlowContinuationStateV2;
}

// The flow completed and the account is signed in.
export interface FlowCompletedResultV2 extends FlowActionResultBaseV2 {
    type: typeof FLOW_COMPLETED_V2;
    authenticationResult: AuthenticationResult;
}

export type FlowActionResultV2 =
    | FlowMethodSelectionRequiredResultV2
    | FlowCodeRequiredResultV2
    | FlowPasswordRequiredResultV2
    | FlowNewPasswordRequiredResultV2
    | FlowSignInContinuationRequiredResultV2
    | FlowCompletedResultV2;

// Result type discriminators.
export const FLOW_METHOD_SELECTION_REQUIRED_V2 =
    "FlowMethodSelectionRequiredResultV2";
export const FLOW_CODE_REQUIRED_V2 = "FlowCodeRequiredResultV2";
export const FLOW_PASSWORD_REQUIRED_V2 = "FlowPasswordRequiredResultV2";
export const FLOW_NEW_PASSWORD_REQUIRED_V2 =
    "FlowNewPasswordRequiredResultV2";
export const FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2 =
    "FlowSignInContinuationRequiredResultV2";
export const FLOW_COMPLETED_V2 = "FlowCompletedResultV2";

export function createFlowMethodSelectionRequiredResultV2(
    input: Omit<FlowMethodSelectionRequiredResultV2, "type">
): FlowMethodSelectionRequiredResultV2 {
    return { type: FLOW_METHOD_SELECTION_REQUIRED_V2, ...input };
}

export function createFlowCodeRequiredResultV2(
    input: Omit<FlowCodeRequiredResultV2, "type">
): FlowCodeRequiredResultV2 {
    return { type: FLOW_CODE_REQUIRED_V2, ...input };
}

export function createFlowPasswordRequiredResultV2(
    input: Omit<FlowPasswordRequiredResultV2, "type">
): FlowPasswordRequiredResultV2 {
    return { type: FLOW_PASSWORD_REQUIRED_V2, ...input };
}

export function createFlowNewPasswordRequiredResultV2(
    input: Omit<FlowNewPasswordRequiredResultV2, "type">
): FlowNewPasswordRequiredResultV2 {
    return { type: FLOW_NEW_PASSWORD_REQUIRED_V2, ...input };
}

export function createFlowSignInContinuationRequiredResultV2(
    input: Omit<FlowSignInContinuationRequiredResultV2, "type">
): FlowSignInContinuationRequiredResultV2 {
    return { type: FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2, ...input };
}

export function createFlowCompletedResultV2(
    input: Omit<FlowCompletedResultV2, "type">
): FlowCompletedResultV2 {
    return { type: FLOW_COMPLETED_V2, ...input };
}
