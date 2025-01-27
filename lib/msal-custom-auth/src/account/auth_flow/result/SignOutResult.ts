/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignOutState } from "../../../core/auth_flow/AuthFlowState.js";
import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignOutError } from "../error_type/GetAccountError.js";

/*
 * Result of a sign-out operation.
 */
export class SignOutResult extends AuthFlowResultBase<
    SignOutState,
    SignOutError,
    void,
    void
> {
    constructor() {
        super(undefined, undefined);
    }

    get state(): SignOutState {
        if (!!this.error) {
            return SignOutState.Error;
        }

        return SignOutState.Completed;
    }
}
