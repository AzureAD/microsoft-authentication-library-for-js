/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInSubmitCodeError } from "../error_type/SignInError.js";
import { SignInFailed } from "../state/SignInFailed.js";
import { SignInSubmitCredentialResult } from "./SignInSubmitCredentialResult.js";

/*
 * Result of a sign-in submit code operation.
 */
export class SignInSubmitCodeResult extends SignInSubmitCredentialResult<SignInSubmitCodeError> {
    /**
     * Creates a SignInSubmitCodeResult instance with error details when an exception thrown during sign-in submit code.
     * @param {unknown} error
     * @returns {SignInSubmitCodeResult} The SignInSubmitCodeResult instance with a CustomAuthError error and failed state.
     */
    static createWithError(error: unknown): SignInSubmitCodeResult {
        const result = new SignInSubmitCodeResult();
        result.state = new SignInFailed();
        result.error = new SignInSubmitCodeError(SignInSubmitCodeResult.createErrorData(error));

        return result;
    }
}
