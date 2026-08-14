/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import type { AuthMethodRegistrationVerificationRequiredStateParameters } from "./CustomAuthV2StateParameters.js";

/**
 * State returned when the user must verify a challenge for the authentication
 * method they are registering (just-in-time registration).
 *
 * Reserved for native auth V2 sign-in/sign-up (JIT) flows; referenced by shared
 * action result unions. Its actions are added when those flows land.
 */
export class AuthMethodRegistrationVerificationRequiredState extends AuthFlowActionRequiredStateBase<AuthMethodRegistrationVerificationRequiredStateParameters> {
    readonly stateType = "authenticationMethodRegistrationVerificationRequired";
}
