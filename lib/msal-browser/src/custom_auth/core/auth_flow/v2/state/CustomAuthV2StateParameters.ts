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

export type NewPasswordRequiredStateParameters =
    AuthFlowActionRequiredStateParameters;

/**
 * Parameters for the sign-in-after-reset-password state. Carries the reset-flow
 * `continuationToken` (inherited from the base) that authorizes the follow-up
 * sign-in, plus the `username` of the just-reset account so the issued tokens
 * are associated with the right user.
 */
export interface SignInAfterResetPasswordStateParameters
    extends AuthFlowActionRequiredStateParameters {
    username?: string;
}
