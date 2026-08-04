/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICustomAuthPublicClientApplication } from "./ICustomAuthPublicClientApplication.js";
import {
    ResetPasswordV2Inputs,
    SignInV2Inputs,
    SignUpV2Inputs,
} from "./CustomAuthV2ActionInputs.js";
import { ResetPasswordV2Result } from "./core/auth_flow/v2/result/ResetPasswordV2Result.js";
import { SignInV2Result } from "./core/auth_flow/v2/result/SignInV2Result.js";
import { SignUpV2Result } from "./core/auth_flow/v2/result/SignUpV2Result.js";

/**
 * Public interface for the native auth V2 surface.
 *
 * Extends the V1 interface additively — V2 entry methods are declared here and
 * never added to {@link ICustomAuthPublicClientApplication}, so existing V1
 * consumers (including mocks and test doubles) are unaffected.
 *
 * Q1 (2026-08-02): all three V2 methods are declared now. `signInV2` and
 * `signUpV2` are throwing stubs until those flows land; only `resetPasswordV2`
 * is implemented in the SSPR track.
 */
export interface ICustomAuthPublicClientApplicationV2
    extends ICustomAuthPublicClientApplication {
    /**
     * Initiates the native auth V2 sign-in flow.
     * @param {SignInV2Inputs} inputs - Inputs for the sign-in V2 flow
     * @returns {Promise<SignInV2Result>} A promise that resolves to SignInV2Result
     */
    signInV2(inputs: SignInV2Inputs): Promise<SignInV2Result>;

    /**
     * Initiates the native auth V2 sign-up flow.
     * @param {SignUpV2Inputs} inputs - Inputs for the sign-up V2 flow
     * @returns {Promise<SignUpV2Result>} A promise that resolves to SignUpV2Result
     */
    signUpV2(inputs: SignUpV2Inputs): Promise<SignUpV2Result>;

    /**
     * Initiates the native auth V2 reset-password flow.
     * @param {ResetPasswordV2Inputs} inputs - Inputs for the reset-password V2 flow
     * @returns {Promise<ResetPasswordV2Result>} A promise that resolves to ResetPasswordV2Result
     */
    resetPasswordV2(
        inputs: ResetPasswordV2Inputs
    ): Promise<ResetPasswordV2Result>;
}
