/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PublicClientApplication } from "@azure/msal-browser";
import { GetAccountResult } from "./auth_flow/result/GetAccountResult.js";
import { ResetPasswordStartResult } from "./auth_flow/result/reset_password/ResetPasswordStartResult.js";
import { SignInResult } from "./auth_flow/result/sign_in/SignInResult.js";
import { SignUpResult } from "./auth_flow/result/sign_up/SignUpResult.js";
import { INativeAuthStardardController } from "./controller/INativeAuthStandardController.js";
import { NativeAuthStandardController } from "./controller/NativeAuthStandardController.js";
import { INativeAuthPublicClientApplication } from "./INativeAuthPublicClientApplication.js";
import {
    GetAccountInputs,
    SignInInputs,
    SignUpInputs,
    ResetPasswordInputs,
} from "./NativeAuthActionInputs.js";
import { NativeAuthConfiguration } from "./NativeAuthConfiguration.js";
import { NativeAuthOperatingContext } from "./operating_context/NativeAuthOperatingContext.js";

export class NativeAuthPublicClientApplication
    extends PublicClientApplication
    implements INativeAuthPublicClientApplication
{
    private readonly nativeAuthController: NativeAuthStandardController;

    /*
     * Creates a new instance of a PublicClientApplication with the given configuration.
     * @param config - A configuration object for the PublicClientApplication instance
     */
    static create(
        config: NativeAuthConfiguration
    ): NativeAuthPublicClientApplication {
        return new NativeAuthPublicClientApplication(config);
    }

    /*
     * Creates a new instance of a PublicClientApplication with the given configuration and controller.
     * @param config - A configuration object for the PublicClientApplication instance
     * @param controller - A controller object for the PublicClientApplication instance
     */
    constructor(
        config: NativeAuthConfiguration,
        controller?: INativeAuthStardardController
    ) {
        const nativeAuthController = new NativeAuthStandardController(
            new NativeAuthOperatingContext(config)
        );

        super(config, controller || nativeAuthController);

        this.nativeAuthController = nativeAuthController;
    }

    /*
     * Gets the current account from the cache.
     * @param getAccountInputs - Inputs for getting the current cached account
     * @returns - A promise that resolves to GetAccountResult
     */
    getCurrentAccount(
        getAccountInputs: GetAccountInputs
    ): Promise<GetAccountResult> {
        throw new Error(
            `Method not implemented with parameter ${getAccountInputs}`
        );
    }

    /*
     * Initiates the sign-in flow.
     * @param signInInputs - Inputs for the sign-in flow
     * @returns - A promise that resolves to SignInResult
     */
    signIn(signInInputs: SignInInputs): Promise<SignInResult> {
        return this.nativeAuthController.signIn(signInInputs);
    }

    /*
     * Initiates the sign-up flow.
     * @param signUpInputs - Inputs for the sign-up flow
     * @returns - A promise that resolves to SignUpResult
     */
    signUp(signUpInputs: SignUpInputs): Promise<SignUpResult> {
        throw new Error(
            `Method not implemented with parameter ${signUpInputs}`
        );
    }

    /*
     * Initiates the reset password flow.
     * @param resetPasswordInputs - Inputs for the reset password flow
     * @returns - A promise that resolves to ResetPasswordStartResult
     */
    resetPassword(
        resetPasswordInputs: ResetPasswordInputs
    ): Promise<ResetPasswordStartResult> {
        throw new Error(
            `Method not implemented with parameter ${resetPasswordInputs}`
        );
    }
}
