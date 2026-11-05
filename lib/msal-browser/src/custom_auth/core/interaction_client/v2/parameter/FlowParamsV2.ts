/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { FlowContinuationStateV2 } from "../FlowContinuationStateV2.js";
import { UserAccountAttributes } from "../../../../UserAccountAttributes.js";
import type {
    AuthenticationFactorV2,
    EnrollmentMethodV2,
} from "../../../network_client/custom_auth_api/v2/result/BaseResultsV2.js";
import type { AuthenticationMethodRegistrationV2 } from "../../../auth_flow/v2/AuthenticationMethodRegistrationV2.js";

interface FlowParamsBaseV2 {
    correlationId: string;
}

export interface FlowStartParamsV2 extends FlowParamsBaseV2 {
    username: string;
    scopes?: string[];
    claims?: string;
}

export type FlowSignInStartParamsV2 = FlowStartParamsV2;

export interface FlowSignUpStartParamsV2 extends FlowStartParamsV2 {
    attributes?: UserAccountAttributes;
}

export interface FlowChallengeParamsV2 extends FlowParamsBaseV2 {
    continuationState: FlowContinuationStateV2;
    authenticationFactor?: AuthenticationFactorV2;
}

export interface FlowSubmitCodeParamsV2 extends FlowParamsBaseV2 {
    continuationState: FlowContinuationStateV2;
    authenticationFactor?: AuthenticationFactorV2;
    code: string;
}

export interface FlowSubmitNewPasswordParamsV2 extends FlowParamsBaseV2 {
    continuationState: FlowContinuationStateV2;
    newPassword: string;
}

export interface FlowSubmitSignInPasswordParamsV2 extends FlowParamsBaseV2 {
    continuationState: FlowContinuationStateV2;
    password: string;
}

export interface FlowSubmitSignUpAttributesParamsV2 extends FlowParamsBaseV2 {
    continuationState: FlowContinuationStateV2;
    attributes: UserAccountAttributes;
}

export interface FlowSignInWithContinuationParamsV2 extends FlowParamsBaseV2 {
    continuationState: FlowContinuationStateV2;
}

export interface FlowAuthMethodRegistrationRequiredParamsV2
    extends FlowParamsBaseV2 {
    continuationState: FlowContinuationStateV2;
    methods: EnrollmentMethodV2[];
}

export interface FlowRegisterAuthMethodParamsV2 extends FlowParamsBaseV2 {
    continuationState: FlowContinuationStateV2;
    method: AuthenticationMethodRegistrationV2;
    verificationContact: string;
}

export interface FlowVerifyAuthMethodRegistrationParamsV2
    extends FlowParamsBaseV2 {
    continuationState: FlowContinuationStateV2;
    code: string;
}
