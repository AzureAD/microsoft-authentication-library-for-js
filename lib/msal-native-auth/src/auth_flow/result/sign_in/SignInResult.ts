/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "../../data/AccountInfo.js";
import { ResultBase } from "../ResultBase.js";
import { SignInState } from "../AuthFlowState.js";
import { SignInCodeRequiredStateHandler } from "../../state_handler/sign_in/SignInCodeRequiredStateHandler.js";
import { SignInPasswordRequiredStateHandler } from "../../state_handler/sign_in/SignInPasswordRequiredStateHandler.js";

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
            | SignInPasswordRequiredStateHandler
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
