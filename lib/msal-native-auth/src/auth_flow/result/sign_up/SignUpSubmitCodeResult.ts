/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInContinuationStateHandler } from "../../state_handler/sign_in/SignInContinuationStateHandler.js";
import { SignUpAttributesRequiredStateHandler } from "../../state_handler/sign_up/SignUpAttributesRequiredStateHandler.js";
import { SignUpPasswordRequiredStateHandler } from "../../state_handler/sign_up/SignUpPasswordRequiredStateHandler.js";
import { SignUpState } from "../AuthFlowState.js";
import { ResultBase } from "../ResultBase.js";

/*
 * Result of a sign-up operation that requires a code.
 */
export class SignUpSubmitCodeResult extends ResultBase<
    SignUpState,
    void,
    | SignUpPasswordRequiredStateHandler
    | SignUpAttributesRequiredStateHandler
    | SignInContinuationStateHandler
> {
    constructor(
        stateHandler?:
            | SignUpPasswordRequiredStateHandler
            | SignUpAttributesRequiredStateHandler
            | SignInContinuationStateHandler
    ) {
        super(undefined, stateHandler);

        if (this.stateHandler instanceof SignUpPasswordRequiredStateHandler) {
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
