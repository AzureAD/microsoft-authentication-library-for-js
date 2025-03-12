/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInSubmitPasswordError } from "../error_type/SignInError.js";
import { SignInFailed } from "../state/SignInFailed.js";
import { SignInSubmitCredentialResult } from "./SignInSubmitCredentialResult.js";

/*
 * Result of a sign-in submit password operation.
 */
export class SignInSubmitPasswordResult extends SignInSubmitCredentialResult<SignInSubmitPasswordError> {
    /**
     * Creates a SignInSubmitPasswordResult instance with error details when an exception thrown during sign-in submit password.
     * @param {unknown} error
     * @returns {SignInSubmitPasswordResult} The SignInSubmitPasswordResult instance with a CustomAuthError error and failed state.
     */
    static createWithError(error: unknown): SignInSubmitPasswordResult {
        const result = new SignInSubmitPasswordResult();
        result.state = new SignInFailed();
        result.error = new SignInSubmitPasswordError(SignInSubmitPasswordResult.createErrorData(error));

        return result;
    }
}
