/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICustomAuthPublicClientApplication } from "./ICustomAuthPublicClientApplication.js";
import {
    ResetPasswordInputsV2,
    SignInInputsV2,
} from "./CustomAuthActionInputsV2.js";
import { ResetPasswordStartResultV2 } from "./core/auth_flow/v2/result/ResetPasswordStartResultV2.js";
import { SignInStartResultV2 } from "./sign_in/auth_flow/v2/result/SignInStartResultV2.js";

/**
 * Public interface for the native auth V2 surface.
 */
export interface ICustomAuthPublicClientApplicationV2
    extends ICustomAuthPublicClientApplication {
    /**
     * Starts native auth V2 sign-in and returns the authentication methods
     * offered for the first factor.
     * @param inputs - Inputs for the sign-in V2 flow.
     * @returns A promise that resolves to the sign-in start result.
     */
    signInV2(inputs: SignInInputsV2): Promise<SignInStartResultV2>;

    /**
     * Initiates the native auth V2 self-service password reset flow for the given username.
     * @param {ResetPasswordInputsV2} inputs - Inputs for the reset-password V2 flow
     * @returns {Promise<ResetPasswordStartResultV2>} A promise that resolves to ResetPasswordStartResultV2
     */
    resetPasswordV2(
        inputs: ResetPasswordInputsV2
    ): Promise<ResetPasswordStartResultV2>;
}
