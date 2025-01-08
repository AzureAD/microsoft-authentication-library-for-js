/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInSubmitPasswordError } from "../error_type/SignInError.js";
import { SignInSubmitCredentialResult } from "./SignInSubmitCredentialResult.js";

/*
 * Result of a sign-in submit password operation.
 */
export class SignInSubmitPasswordResult extends SignInSubmitCredentialResult<SignInSubmitPasswordError> {}
