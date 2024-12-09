/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInCodeRequiredStateHandler } from "../../state_handler/sign_in/SignInCodeRequiredStateHandler.js";
import { SignInState } from "../AuthFlowState.js";
import { ResultBase } from "../ResultBase.js";

export class SignInResendCodeResult extends ResultBase<
    SignInState,
    void,
    SignInCodeRequiredStateHandler
> {
    constructor(stateHandler?: SignInCodeRequiredStateHandler) {
        super(undefined, stateHandler);
    }

    get state(): SignInState {
        if (this.error) {
            return SignInState.Failed;
        }

        if (this.stateHandler) {
            return SignInState.CodeRequired;
        }

        return SignInState.Unknown;
    }
}
