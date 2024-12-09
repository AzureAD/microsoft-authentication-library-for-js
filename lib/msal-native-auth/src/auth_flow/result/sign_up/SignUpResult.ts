/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ResultBase } from "../ResultBase.js";
import { SignUpState } from "../AuthFlowState.js";
import { SignUpCodeRequiredStateHandler } from "../../state_handler/sign_up/SignUpCodeRequiredStateHandler.js";
import { SignUpPasswordRequiredStateHandler } from "../../state_handler/sign_up/SignUpPasswordRequiredStateHandler.js";
import { SignUpAttributesRequiredStateHandler } from "../../state_handler/sign_up/SignUpAttributesRequiredStateHandler.js";
import { SignInContinuationStateHandler } from "../../state_handler/sign_in/SignInContinuationStateHandler.js";

/*
 * Result of a sign-up operation.
 */
export class SignUpResult extends ResultBase<
    SignUpState,
    void,
    | SignUpCodeRequiredStateHandler
    | SignUpPasswordRequiredStateHandler
    | SignUpAttributesRequiredStateHandler
    | SignInContinuationStateHandler
> {
    constructor(
        stateHandler?:
            | SignUpCodeRequiredStateHandler
            | SignUpPasswordRequiredStateHandler
            | SignUpAttributesRequiredStateHandler
            | SignInContinuationStateHandler
    ) {
        super(undefined, stateHandler);

        if (this.stateHandler instanceof SignUpCodeRequiredStateHandler) {
            this._state = SignUpState.CodeRequired;
        } else if (
            this.stateHandler instanceof SignUpPasswordRequiredStateHandler
        ) {
            this._state = SignUpState.PasswordRequired;
        } else if (
            this.stateHandler instanceof SignUpAttributesRequiredStateHandler
        ) {
            this._state = SignUpState.AttributesRequired;
        } else if (
            this.stateHandler instanceof SignInContinuationStateHandler
        ) {
            this._state = SignUpState.Completed;
        }
    }

    get state(): SignUpState {
        if (this.error) {
            return SignUpState.Failed;
        }

        if (this._state) {
            return this._state;
        }

        return SignUpState.Unknown;
    }
}
