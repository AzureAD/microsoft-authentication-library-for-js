/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "../../../../../response/AuthenticationResult.js";
import { V2FlowContinuationState } from "../V2FlowContinuationState.js";

/*
 * Unified outcome envelope returned by every V2 interaction-client step - the JS analogue of the
 * iOS `MSALNativeAuthFlowControllerResponse`. Rather than each per-action client returning a
 * bespoke shape (V1's model), one discriminated union describes every step transition so the L1
 * state layer can map an outcome to the next public state uniformly.
 *
 * Only forward-progress and terminal outcomes are modelled here. Failures are thrown as
 * `CustomAuthV2ApiError` and mapped to the public failed state by the caller, matching the V1
 * convention of throwing rather than returning errors in the envelope.
 */

interface V2FlowActionResultBase {
    type: string;
    correlationId: string;
}

/*
 * A selectable authentication method carried by a method-selection outcome. `challengeHref` is the
 * internal per-method link the `requestChallenge` step posts to; the public state exposes only the
 * `id`/`type`/`hint` and passes the chosen `id` back to resolve the href.
 */
export interface V2FlowMethod {
    id: string;
    type?: string;
    hint?: string;
    challengeHref: string;
}

/*
 * The flow-start step resolved to a set of authentication methods and the user must select one
 * before a challenge is sent. `continuationState` carries the token to present when requesting the
 * chosen method's challenge; `methods` are the selectable methods (each with its challenge href).
 */
export interface V2FlowMethodSelectionRequiredResult
    extends V2FlowActionResultBase {
    type: typeof V2_FLOW_METHOD_SELECTION_REQUIRED;
    continuationState: V2FlowContinuationState;
    methods: V2FlowMethod[];
}

/*
 * A one-time code was sent and must be submitted next. `continuationState` carries the token and
 * the `verify`/`resend` hrefs; the remaining fields are display metadata for the app's prompt.
 */
export interface V2FlowCodeRequiredResult extends V2FlowActionResultBase {
    type: typeof V2_FLOW_CODE_REQUIRED;
    continuationState: V2FlowContinuationState;
    channel?: string;
    sentTo?: string;
    codeLength?: number;
}

// The code was accepted; a new password must be submitted next (carries the `update` href).
export interface V2FlowPasswordRequiredResult extends V2FlowActionResultBase {
    type: typeof V2_FLOW_PASSWORD_REQUIRED;
    continuationState: V2FlowContinuationState;
}

/*
 * The reset was applied; the account must be explicitly signed in next. `continuationState`
 * carries the token to redeem for tokens (V2 does not auto-sign-in, matching V1 and iOS).
 */
export interface V2FlowSignInAfterResetRequiredResult
    extends V2FlowActionResultBase {
    type: typeof V2_FLOW_SIGN_IN_AFTER_RESET_REQUIRED;
    continuationState: V2FlowContinuationState;
    username?: string;
}

// The flow reached a token-issuing terminal step; the account is signed in.
export interface V2FlowCompletedResult extends V2FlowActionResultBase {
    type: typeof V2_FLOW_COMPLETED;
    authenticationResult: AuthenticationResult;
}

export type V2FlowActionResult =
    | V2FlowMethodSelectionRequiredResult
    | V2FlowCodeRequiredResult
    | V2FlowPasswordRequiredResult
    | V2FlowSignInAfterResetRequiredResult
    | V2FlowCompletedResult;

// Result type discriminators.
export const V2_FLOW_METHOD_SELECTION_REQUIRED =
    "V2FlowMethodSelectionRequiredResult";
export const V2_FLOW_CODE_REQUIRED = "V2FlowCodeRequiredResult";
export const V2_FLOW_PASSWORD_REQUIRED = "V2FlowPasswordRequiredResult";
export const V2_FLOW_SIGN_IN_AFTER_RESET_REQUIRED =
    "V2FlowSignInAfterResetRequiredResult";
export const V2_FLOW_COMPLETED = "V2FlowCompletedResult";

export function createV2FlowMethodSelectionRequiredResult(
    input: Omit<V2FlowMethodSelectionRequiredResult, "type">
): V2FlowMethodSelectionRequiredResult {
    return { type: V2_FLOW_METHOD_SELECTION_REQUIRED, ...input };
}

export function createV2FlowCodeRequiredResult(
    input: Omit<V2FlowCodeRequiredResult, "type">
): V2FlowCodeRequiredResult {
    return { type: V2_FLOW_CODE_REQUIRED, ...input };
}

export function createV2FlowPasswordRequiredResult(
    input: Omit<V2FlowPasswordRequiredResult, "type">
): V2FlowPasswordRequiredResult {
    return { type: V2_FLOW_PASSWORD_REQUIRED, ...input };
}

export function createV2FlowSignInAfterResetRequiredResult(
    input: Omit<V2FlowSignInAfterResetRequiredResult, "type">
): V2FlowSignInAfterResetRequiredResult {
    return { type: V2_FLOW_SIGN_IN_AFTER_RESET_REQUIRED, ...input };
}

export function createV2FlowCompletedResult(
    input: Omit<V2FlowCompletedResult, "type">
): V2FlowCompletedResult {
    return { type: V2_FLOW_COMPLETED, ...input };
}
