/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IController } from "@azure/msal-browser";
import { GetAccountResult } from "../account/auth_flow/result/GetAccountResult.js";
import { SignInResult } from "../sign_in/auth_flow/result/SignInResult.js";
import { SignUpResult } from "../sign_up/auth_flow/result/SignUpResult.js";
import {
    GetAccountInputs,
    ResetPasswordInputs,
    SignInInputs,
    SignUpInputs,
} from "../CustomAuthActionInputs.js";
import { ResetPasswordStartResult } from "../reset_password/auth_flow/result/ResetPasswordStartResult.js";

/*
 * Controller interface for standard authentication operations.
 */
export interface ICustomAuthStandardController extends IController {
    /*
     * Gets the current account from the cache.
     * @param getAccountInputs - Inputs for getting the current cached account
     * @returns - A promise that resolves to GetAccountResult
     */
    getCurrentAccount(
        getAccountInputs: GetAccountInputs,
    ): Promise<GetAccountResult>;

    /*
     * Signs the current user out.
     * @param signInInputs - Inputs for signing in.
     * @returns The result of the operation.
     */
    signIn(signInInputs: SignInInputs): Promise<SignInResult>;

    /*
     * Signs the current user up.
     * @param signUpInputs - Inputs for signing up.
     * @returns The result of the operation.
     */
    signUp(signUpInputs: SignUpInputs): Promise<SignUpResult>;

    /*
     * Resets the password for the current user.
     * @param resetPasswordInputs - Inputs for resetting the password.
     * @returns The result of the operation.
     */
    resetPassword(
        resetPasswordInputs: ResetPasswordInputs,
    ): Promise<ResetPasswordStartResult>;
}
