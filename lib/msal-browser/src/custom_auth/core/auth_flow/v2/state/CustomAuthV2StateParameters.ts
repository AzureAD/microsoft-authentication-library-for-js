/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateParameters } from "../../AuthFlowState.js";
import { AuthenticationMethodV2 } from "../AuthenticationMethodV2.js";

export interface AuthenticationMethodSelectionRequiredStateParameters
    extends AuthFlowActionRequiredStateParameters {
    methods: readonly AuthenticationMethodV2[];
}

export interface ChallengeVerificationRequiredStateParameters
    extends AuthFlowActionRequiredStateParameters {
    method: AuthenticationMethodV2;
    sentTo?: string;
    channel?: string;
    codeLength?: number;
}

export type PasswordRequiredStateParameters =
    AuthFlowActionRequiredStateParameters;

export type NewPasswordRequiredStateParameters =
    AuthFlowActionRequiredStateParameters;

export type AttributesRequiredStateParameters =
    AuthFlowActionRequiredStateParameters;

export type AuthenticationMethodRegistrationRequiredStateParameters =
    AuthFlowActionRequiredStateParameters;

export type AuthMethodRegistrationVerificationRequiredStateParameters =
    AuthFlowActionRequiredStateParameters;

export type MfaSelectionRequiredStateParameters =
    AuthFlowActionRequiredStateParameters;

export type MfaChallengeVerificationRequiredStateParameters =
    AuthFlowActionRequiredStateParameters;
