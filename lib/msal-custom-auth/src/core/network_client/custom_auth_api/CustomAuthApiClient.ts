/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ResetPasswordApiClient } from "../ResetPasswordApiClient.js";
import { SignupApiClient } from "../SignupApiClient.js";
import { SingInApiClient } from "../SingInApiClient.js";
import { ICustomAuthApiClient } from "./ICustomAuthApiClient.js";

export class CustomAuthApiClient implements ICustomAuthApiClient {
    signInApiClient: SingInApiClient;
    signUpApiClient: SignupApiClient;
    resetPasswordApiClient: ResetPasswordApiClient;

    constructor(signInApiClient: SingInApiClient, signUpApiClient: SignupApiClient, resetPasswordApiClient: ResetPasswordApiClient) {
        this.signInApiClient = signInApiClient;
        this.signUpApiClient = signUpApiClient;
        this.resetPasswordApiClient = resetPasswordApiClient;
    }
}
