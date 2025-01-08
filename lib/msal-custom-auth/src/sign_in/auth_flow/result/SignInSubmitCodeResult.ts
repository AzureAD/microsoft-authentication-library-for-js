/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInSubmitCodeError } from "../error_type/SignInError.js";
import { SignInSubmitCredentialResult } from "./SignInSubmitCredentialResult.js";

/*
 * Result of a sign-in submit code operation.
 */
export class SignInSubmitCodeResult extends SignInSubmitCredentialResult<SignInSubmitCodeError> {}
