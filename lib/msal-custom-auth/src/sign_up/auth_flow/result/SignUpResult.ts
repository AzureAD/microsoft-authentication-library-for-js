/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignUpState } from "../../../core/auth_flow/AuthFlowState.js";
import { SignUpCodeRequiredStateHandler } from "../state_handler/SignUpCodeRequiredStateHandler.js";
import { SignUpPasswordRequiredStateHandler } from "../state_handler/SignUpPasswordRequiredStateHandler.js";
import { SignUpAttributesRequiredStateHandler } from "../state_handler/SignUpAttributesRequiredStateHandler.js";
import { ResultBase } from "../../../core/auth_flow/ResultBase.js";
import { SignInContinuationStateHandler } from "../../../sign_in/auth_flow/state_handler/SignInContinuationStateHandler.js";
import { SignUpError } from "../error_type/SignUpError.js";

/*
 * Result of a sign-up operation.
 */
export class SignUpResult extends ResultBase<
    SignUpState,
    SignUpError,
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
            | SignInContinuationStateHandler,
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
