/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowStateBase, SignUpState } from "../../../core/auth_flow/AuthFlowStateBase.js";

export class SignUpFailed extends AuthFlowStateBase {
    constructor() {
        super(SignUpState.Failed);
    }
}
