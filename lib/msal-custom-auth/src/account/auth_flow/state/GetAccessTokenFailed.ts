/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthFlowStateBase,
    GetAccessTokenState,
} from "../../../core/auth_flow/AuthFlowStateBase.js";

export class GetAccessTokenFailed extends AuthFlowStateBase {
    constructor() {
        super(GetAccessTokenState.Failed);
    }
}
