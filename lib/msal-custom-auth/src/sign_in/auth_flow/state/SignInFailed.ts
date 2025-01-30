/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthFlowStateBase,
    SignInState,
} from "../../../core/auth_flow/AuthFlowStateBase.js";

export class SignInFailed extends AuthFlowStateBase {
    constructor() {
        super(SignInState.Failed);
    }
}
