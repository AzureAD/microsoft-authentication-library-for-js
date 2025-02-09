/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowStateBase, ResetPasswordState } from "../../../core/auth_flow/AuthFlowStateBase.js";

export class ResetPasswordCompleted extends AuthFlowStateBase {
    constructor() {
        super(ResetPasswordState.Completed);
    }
}
