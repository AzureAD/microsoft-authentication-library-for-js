/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthFlowStateBase,
    SignOutState,
} from "../../../core/auth_flow/AuthFlowStateBase.js";

export class SignOutCompleted extends AuthFlowStateBase {
    constructor() {
        super(SignOutState.Completed);
    }
}
