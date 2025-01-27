/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignUpAttributesRequiredStateHandler } from "../state_handler/SignUpAttributesRequiredStateHandler.js";
import { SignUpState } from "../../../core/auth_flow/AuthFlowState.js";
import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignInContinuationStateHandler } from "../../../sign_in/auth_flow/state_handler/SignInContinuationStateHandler.js";
import { SignUpSubmitPasswordError } from "../error_type/SignUpError.js";
import { SignUpCodeRequiredStateHandler } from "../state_handler/SignUpCodeRequiredStateHandler.js";

/*
 * Result of a sign-up operation that requires a password.
 */
export class SignUpSubmitPasswordResult extends AuthFlowResultBase<
    SignUpState,
    SignUpSubmitPasswordError,
    void,
    | SignUpAttributesRequiredStateHandler
    | SignUpCodeRequiredStateHandler
    | SignInContinuationStateHandler
> {
    constructor(
        stateHandler?:
            | SignUpAttributesRequiredStateHandler
            | SignUpCodeRequiredStateHandler
            | SignInContinuationStateHandler,
    ) {
        super(undefined, stateHandler);

        if (this.stateHandler instanceof SignUpAttributesRequiredStateHandler) {
            this._state = SignUpState.AttributesRequired;
        } else if (
            this.stateHandler instanceof SignUpCodeRequiredStateHandler
        ) {
            this._state = SignUpState.CodeRequired;
        } else if (
            this.stateHandler instanceof SignInContinuationStateHandler
        ) {
            this._state = SignUpState.Completed;
        }
    }

    get state(): SignUpState {
        if (!!this.error) {
            return SignUpState.Failed;
        }

        if (this._state !== undefined && this._state !== null) {
            return this._state;
        }

        return SignUpState.Unknown;
    }
}
