/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ResetPasswordApiClient } from "../ResetPasswordApiClient.js";
import { SignupApiClient } from "../SignupApiClient.js";
import { SingInApiClient } from "../SingInApiClient.js";
export interface ICustomAuthApiClient {
    signInApiClient: SingInApiClient;
    signUpApiClient: SignupApiClient;
    resetPasswordApiClient: ResetPasswordApiClient;
}
