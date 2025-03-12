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
    static createWithError(error: unknown): SignInSubmitCodeResult {
        const result = new SignInSubmitCodeResult();
        result.state = new SignInFailed();
        result.error = new SignInSubmitCodeError(SignInSubmitCodeResult.createErrorData(error));

        return result;
    }
}
