/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import type { AuthenticationMethodRegistrationRequiredStateParameters } from "./CustomAuthV2StateParameters.js";

/**
 * State returned when the user must register an authentication method.
 *
 * Reserved for native auth V2 sign-in/sign-up (JIT) flows; referenced by shared
 * action result unions. Its actions are added when those flows land.
 */
export class AuthenticationMethodRegistrationRequiredState extends AuthFlowActionRequiredStateBase<AuthenticationMethodRegistrationRequiredStateParameters> {
    readonly stateType = "authenticationMethodRegistrationRequired";
}
