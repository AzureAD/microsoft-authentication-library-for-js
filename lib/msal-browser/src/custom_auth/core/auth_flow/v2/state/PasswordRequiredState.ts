/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import type { PasswordRequiredStateParameters } from "./CustomAuthV2StateParameters.js";

/**
 * State returned when a password credential is required.
 *
 * Reserved for the native auth V2 sign-in flow; referenced by shared action
 * result unions. Its actions are added when sign-in V2 lands.
 */
export class PasswordRequiredState extends AuthFlowActionRequiredStateBase<PasswordRequiredStateParameters> {
    readonly stateType = "passwordRequired";
}
