/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowStateBase, SignInState } from "../../../core/auth_flow/AuthFlowStateBase.js";

export class SignInCompleted extends AuthFlowStateBase {
    constructor() {
        super(SignInState.Completed);
    }
}
