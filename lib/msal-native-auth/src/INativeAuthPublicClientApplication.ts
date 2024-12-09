/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { GetAccountResult } from "./auth_flow/result/GetAccountResult.js";
import { ResetPasswordStartResult } from "./auth_flow/result/reset_password/ResetPasswordStartResult.js";
import { SignInResult } from "./auth_flow/result/sign_in/SignInResult.js";
import { SignUpResult } from "./auth_flow/result/sign_up/SignUpResult.js";
import {
    GetAccountInputs,
    ResetPasswordInputs,
    SignInInputs,
    SignUpInputs,
} from "./NativeAuthActionInputs.js";

export interface INativeAuthPublicClientApplication {
    /*
     * Gets the current account from the cache.
     * @param getAccountInputs - Inputs for getting the current cached account
     * @returns - A promise that resolves to GetAccountResult
     */
    getCurrentAccount(
        getAccountInputs: GetAccountInputs
    ): Promise<GetAccountResult>;

    /*
     * Initiates the sign-in flow.
     * @param signInInputs - Inputs for the sign-in flow
     * @returns - A promise that resolves to SignInResult
     */
    signIn(signInInputs: SignInInputs): Promise<SignInResult>;

    /*
     * Initiates the sign-up flow.
     * @param signUpInputs - Inputs for the sign-up flow
     * @returns - A promise that resolves to SignUpResult
     */
    signUp(signUpInputs: SignUpInputs): Promise<SignUpResult>;

    /*
     * Initiates the reset password flow.
     * @param resetPasswordInputs - Inputs for the reset password flow
     * @returns - A promise that resolves to ResetPasswordStartResult
     */
    resetPassword(
        resetPasswordInputs: ResetPasswordInputs
    ): Promise<ResetPasswordStartResult>;
}
