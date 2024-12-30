/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "../../../account/auth_flow/model/AccountInfo.js";
import { SignInState } from "../../../core/auth_flow/AuthFlowState.js";
import { ResultBase } from "../../../core/auth_flow/ResultBase.js";
import { SignInCodeRequiredStateHandler } from "../state_handler/SignInCodeRequiredStateHandler.js";
import { SignInPasswordRequiredStateHandler } from "../state_handler/SignInPasswordRequiredStateHandler.js";

/*
 * Result of a sign-in operation.
 */
export class SignInResult extends ResultBase<
    SignInState,
    AccountInfo,
    SignInCodeRequiredStateHandler | SignInPasswordRequiredStateHandler
> {
    constructor(
        resultData?: AccountInfo,
        stateHandler?:
            | SignInCodeRequiredStateHandler
            | SignInPasswordRequiredStateHandler,
    ) {
        super(resultData, stateHandler);

        if (this.stateHandler instanceof SignInCodeRequiredStateHandler) {
            this._state = SignInState.CodeRequired;
        } else if (
            this.stateHandler instanceof SignInPasswordRequiredStateHandler
        ) {
            this._state = SignInState.PasswordRequired;
        }
    }

    get state(): SignInState {
        if (this.error) {
            return SignInState.Failed;
        }

        if (this._state) {
            return this._state;
        }

        if (this.data) {
            return SignInState.Completed;
        }

        return SignInState.Unknown;
    }
}
