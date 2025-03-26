/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowStateType } from "../../../core/auth_flow/AuthFlowStateType.js";
import { SignInContinuationState } from "../../../sign_in/auth_flow/state/SignInContinuationState.js";
import { SignInContinuationStateParameters } from "../../../sign_in/auth_flow/state/SignInStateParameters.js";

export class ResetPasswordCompletedState extends SignInContinuationState {
    constructor(stateParameters: SignInContinuationStateParameters) {
        super(AuthFlowStateType.Completed, stateParameters);
    }
}
