/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "../../../../../response/AuthenticationResult.js";
import { AuthenticationMethodV2 } from "../../../auth_flow/v2/AuthenticationMethodV2.js";
import { FlowContinuationStateV2 } from "../FlowContinuationStateV2.js";
import { SignUpAttributeV2 } from "../../../network_client/custom_auth_api/v2/result/SignUpResultsV2.js";
import { AuthenticationMethodRegistrationV2 } from "../../../auth_flow/v2/AuthenticationMethodRegistrationV2.js";

interface FlowActionResultBaseV2 {
    type: string;
    correlationId: string;
}

export interface FlowMethodSelectionRequiredResultV2
    extends FlowActionResultBaseV2 {
    type: typeof FLOW_METHOD_SELECTION_REQUIRED_V2;
    continuationState: FlowContinuationStateV2;
    methods: AuthenticationMethodV2[];
}

export interface FlowCodeRequiredResultV2 extends FlowActionResultBaseV2 {
    type: typeof FLOW_CODE_REQUIRED_V2;
    continuationState: FlowContinuationStateV2;
    channel?: string;
    sentTo?: string;
    codeLength?: number;
}

export interface FlowSignInCodeRequiredResultV2
    extends FlowCodeRequiredResultV2 {
    method: AuthenticationMethodV2;
}

export interface FlowExistingAccountCodeRequiredResultV2
    extends Omit<FlowCodeRequiredResultV2, "type"> {
    type: typeof FLOW_EXISTING_ACCOUNT_CODE_REQUIRED_V2;
    method: AuthenticationMethodV2;
}

export interface FlowExistingAccountPasswordRequiredResultV2
    extends FlowActionResultBaseV2 {
    type: typeof FLOW_EXISTING_ACCOUNT_PASSWORD_REQUIRED_V2;
    continuationState: FlowContinuationStateV2;
}

export interface FlowResetPasswordCodeRequiredResultV2
    extends FlowCodeRequiredResultV2 {
    method: AuthenticationMethodV2;
}

export interface FlowPasswordRequiredResultV2 extends FlowActionResultBaseV2 {
    type: typeof FLOW_PASSWORD_REQUIRED_V2;
    continuationState: FlowContinuationStateV2;
}

export interface FlowSignUpPasswordRequiredResultV2
    extends FlowActionResultBaseV2 {
    type: typeof FLOW_SIGN_UP_PASSWORD_REQUIRED_V2;
    continuationState: FlowContinuationStateV2;
    requestedPasswordAttribute: SignUpAttributeV2;
}

export interface FlowMFARequiredResultV2 extends FlowActionResultBaseV2 {
    type: typeof FLOW_MFA_REQUIRED_V2;
    continuationState: FlowContinuationStateV2;
    methods: AuthenticationMethodV2[];
}

export interface FlowNewPasswordRequiredResultV2
    extends FlowActionResultBaseV2 {
    type: typeof FLOW_NEW_PASSWORD_REQUIRED_V2;
    continuationState: FlowContinuationStateV2;
}

export interface FlowAttributesRequiredResultV2 extends FlowActionResultBaseV2 {
    type: typeof FLOW_ATTRIBUTES_REQUIRED_V2;
    continuationState: FlowContinuationStateV2;
    attributes: SignUpAttributeV2[];
}

export interface FlowSignInContinuationRequiredResultV2
    extends FlowActionResultBaseV2 {
    type: typeof FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2;
    continuationState: FlowContinuationStateV2;
}

export interface FlowCompletedResultV2 extends FlowActionResultBaseV2 {
    type: typeof FLOW_COMPLETED_V2;
    authenticationResult: AuthenticationResult;
}

export interface FlowAuthMethodRegistrationRequiredResultV2
    extends FlowActionResultBaseV2 {
    type: typeof FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2;
    continuationState: FlowContinuationStateV2;
    methods: AuthenticationMethodRegistrationV2[];
}

export interface FlowAuthMethodVerificationRequiredResultV2
    extends FlowActionResultBaseV2 {
    type: typeof FLOW_AUTH_METHOD_VERIFICATION_REQUIRED_V2;
    continuationState: FlowContinuationStateV2;
    sentTo?: string;
    codeLength: number;
}

export type FlowSubmitCodeResultV2 =
    | FlowNewPasswordRequiredResultV2
    | FlowSignUpPasswordRequiredResultV2
    | FlowAttributesRequiredResultV2
    | FlowSignInContinuationRequiredResultV2
    | FlowMFARequiredResultV2
    | FlowAuthMethodRegistrationRequiredResultV2
    | FlowCompletedResultV2;

export type FlowSignInStartResultV2 =
    | FlowMethodSelectionRequiredResultV2
    | FlowPasswordRequiredResultV2
    | FlowSignInCodeRequiredResultV2;

export type FlowExistingAccountChallengeResultV2 =
    | FlowExistingAccountCodeRequiredResultV2
    | FlowExistingAccountPasswordRequiredResultV2;

export type FlowSignUpStartResultV2 =
    | FlowCodeRequiredResultV2
    | FlowExistingAccountChallengeResultV2
    | FlowMethodSelectionRequiredResultV2;

export type FlowResetPasswordStartResultV2 =
    | FlowMethodSelectionRequiredResultV2
    | FlowResetPasswordCodeRequiredResultV2;

export type FlowRequestChallengeResultV2 =
    | FlowCodeRequiredResultV2
    | FlowPasswordRequiredResultV2;

export type FlowSubmitNewPasswordResultV2 =
    | FlowSignInContinuationRequiredResultV2
    | FlowAuthMethodRegistrationRequiredResultV2
    | FlowMFARequiredResultV2;

export type FlowSubmitSignInPasswordResultV2 =
    | FlowMFARequiredResultV2
    | FlowAuthMethodRegistrationRequiredResultV2
    | FlowCompletedResultV2;

export type FlowSignUpSubmitAttributesResultV2 =
    | FlowSignUpPasswordRequiredResultV2
    | FlowAttributesRequiredResultV2
    | FlowAuthMethodRegistrationRequiredResultV2
    | FlowSignInContinuationRequiredResultV2;

export type FlowSignUpVerificationResultV2 = FlowSignUpSubmitAttributesResultV2;

export const FLOW_METHOD_SELECTION_REQUIRED_V2 =
    "FlowMethodSelectionRequiredResultV2";
export const FLOW_CODE_REQUIRED_V2 = "FlowCodeRequiredResultV2";
export const FLOW_EXISTING_ACCOUNT_CODE_REQUIRED_V2 =
    "FlowExistingAccountCodeRequiredResultV2";
export const FLOW_EXISTING_ACCOUNT_PASSWORD_REQUIRED_V2 =
    "FlowExistingAccountPasswordRequiredResultV2";
export const FLOW_PASSWORD_REQUIRED_V2 = "FlowPasswordRequiredResultV2";
export const FLOW_SIGN_UP_PASSWORD_REQUIRED_V2 =
    "FlowSignUpPasswordRequiredResultV2";
export const FLOW_MFA_REQUIRED_V2 = "FlowMFARequiredResultV2";
export const FLOW_NEW_PASSWORD_REQUIRED_V2 = "FlowNewPasswordRequiredResultV2";
export const FLOW_ATTRIBUTES_REQUIRED_V2 = "FlowAttributesRequiredResultV2";
export const FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2 =
    "FlowSignInContinuationRequiredResultV2";
export const FLOW_COMPLETED_V2 = "FlowCompletedResultV2";
export const FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2 =
    "FlowAuthMethodRegistrationRequiredResultV2";
export const FLOW_AUTH_METHOD_VERIFICATION_REQUIRED_V2 =
    "FlowAuthMethodVerificationRequiredResultV2";

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

export function createFlowExistingAccountCodeRequiredResultV2(
    input: Omit<FlowExistingAccountCodeRequiredResultV2, "type">
): FlowExistingAccountCodeRequiredResultV2 {
    return { type: FLOW_EXISTING_ACCOUNT_CODE_REQUIRED_V2, ...input };
}

export function createFlowExistingAccountPasswordRequiredResultV2(
    input: Omit<FlowExistingAccountPasswordRequiredResultV2, "type">
): FlowExistingAccountPasswordRequiredResultV2 {
    return { type: FLOW_EXISTING_ACCOUNT_PASSWORD_REQUIRED_V2, ...input };
}

export function createFlowPasswordRequiredResultV2(
    input: Omit<FlowPasswordRequiredResultV2, "type">
): FlowPasswordRequiredResultV2 {
    return { type: FLOW_PASSWORD_REQUIRED_V2, ...input };
}

export function createFlowSignUpPasswordRequiredResultV2(
    input: Omit<FlowSignUpPasswordRequiredResultV2, "type">
): FlowSignUpPasswordRequiredResultV2 {
    return { type: FLOW_SIGN_UP_PASSWORD_REQUIRED_V2, ...input };
}

export function createFlowMFARequiredResultV2(
    input: Omit<FlowMFARequiredResultV2, "type">
): FlowMFARequiredResultV2 {
    return { type: FLOW_MFA_REQUIRED_V2, ...input };
}

export function createFlowNewPasswordRequiredResultV2(
    input: Omit<FlowNewPasswordRequiredResultV2, "type">
): FlowNewPasswordRequiredResultV2 {
    return { type: FLOW_NEW_PASSWORD_REQUIRED_V2, ...input };
}

export function createFlowAttributesRequiredResultV2(
    input: Omit<FlowAttributesRequiredResultV2, "type">
): FlowAttributesRequiredResultV2 {
    return { type: FLOW_ATTRIBUTES_REQUIRED_V2, ...input };
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

export function createFlowAuthMethodRegistrationRequiredResultV2(
    input: Omit<FlowAuthMethodRegistrationRequiredResultV2, "type">
): FlowAuthMethodRegistrationRequiredResultV2 {
    return { type: FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2, ...input };
}

export function createFlowAuthMethodVerificationRequiredResultV2(
    input: Omit<FlowAuthMethodVerificationRequiredResultV2, "type">
): FlowAuthMethodVerificationRequiredResultV2 {
    return { type: FLOW_AUTH_METHOD_VERIFICATION_REQUIRED_V2, ...input };
}
