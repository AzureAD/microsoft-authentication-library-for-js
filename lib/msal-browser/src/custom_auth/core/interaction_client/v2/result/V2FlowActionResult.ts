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

/*
 * The server can no longer continue natively and the app must fall back to the browser. Mapped to
 * the public web-fallback-required state by the caller.
 */
export interface V2FlowBrowserRequiredResult extends V2FlowActionResultBase {
    type: typeof V2_FLOW_BROWSER_REQUIRED;
}

export type V2FlowActionResult =
    | V2FlowCodeRequiredResult
    | V2FlowPasswordRequiredResult
    | V2FlowSignInAfterResetRequiredResult
    | V2FlowCompletedResult
    | V2FlowBrowserRequiredResult;

// Result type discriminators.
export const V2_FLOW_CODE_REQUIRED = "V2FlowCodeRequiredResult";
export const V2_FLOW_PASSWORD_REQUIRED = "V2FlowPasswordRequiredResult";
export const V2_FLOW_SIGN_IN_AFTER_RESET_REQUIRED =
    "V2FlowSignInAfterResetRequiredResult";
export const V2_FLOW_COMPLETED = "V2FlowCompletedResult";
export const V2_FLOW_BROWSER_REQUIRED = "V2FlowBrowserRequiredResult";

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

export function createV2FlowBrowserRequiredResult(
    input: Omit<V2FlowBrowserRequiredResult, "type">
): V2FlowBrowserRequiredResult {
    return { type: V2_FLOW_BROWSER_REQUIRED, ...input };
}
