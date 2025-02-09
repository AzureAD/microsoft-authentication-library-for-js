/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowStateBase, GetAccountState } from "../../../core/auth_flow/AuthFlowStateBase.js";

export class GetAccountFailed extends AuthFlowStateBase {
    constructor() {
        super(GetAccountState.Failed);
    }
}
