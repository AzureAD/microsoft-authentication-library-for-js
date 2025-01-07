/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignUpAttributesRequiredStateHandler } from "../state_handler/SignUpAttributesRequiredStateHandler.js";
import { SignUpState } from "../../../core/auth_flow/AuthFlowState.js";
import { ResultBase } from "../../../core/auth_flow/ResultBase.js";
import { SignInContinuationStateHandler } from "../../../sign_in/auth_flow/state_handler/SignInContinuationStateHandler.js";

/*
 * Result of a sign-up operation that requires a password.
 */
export class SignUpSubmitPasswordResult extends ResultBase<
    SignUpState,
    void,
    SignUpAttributesRequiredStateHandler | SignInContinuationStateHandler
> {
    constructor(
        stateHandler?:
            | SignUpAttributesRequiredStateHandler
            | SignInContinuationStateHandler,
    ) {
        super(undefined, stateHandler);

        if (this.stateHandler instanceof SignUpAttributesRequiredStateHandler) {
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
