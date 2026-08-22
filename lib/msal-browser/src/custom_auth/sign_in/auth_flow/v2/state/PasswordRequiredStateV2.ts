/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../../../core/auth_flow/AuthFlowState.js";
import type { PasswordRequiredStateParametersV2 } from "./SignInStateParametersV2.js";

/**
 * State returned when the selected sign-in method requires the user's
 * password.
 */
export class PasswordRequiredStateV2 extends AuthFlowActionRequiredStateBase<PasswordRequiredStateParametersV2> {
    readonly stateType = "passwordRequired";
}
