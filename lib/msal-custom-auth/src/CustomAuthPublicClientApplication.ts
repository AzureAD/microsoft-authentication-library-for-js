/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PublicClientApplication } from "@azure/msal-browser";
import { GetAccountResult } from "./account/auth_flow/result/GetAccountResult.js";
import { SignInResult } from "./sign_in/auth_flow/result/SignInResult.js";
import { SignUpResult } from "./sign_up/auth_flow/result/SignUpResult.js";
import { ICustomAuthStandardController } from "./controller/ICustomAuthStandardController.js";
import { CustomAuthStandardController } from "./controller/CustomAuthStandardController.js";
import { ICustomAuthPublicClientApplication } from "./ICustomAuthPublicClientApplication.js";
import {
    GetAccountInputs,
    SignInInputs,
    SignUpInputs,
    ResetPasswordInputs,
} from "./CustomAuthActionInputs.js";
import { CustomAuthConfiguration } from "./configuration/CustomAuthConfiguration.js";
import { CustomAuthOperatingContext } from "./operating_context/CustomAuthOperatingContext.js";
import { ResetPasswordStartResult } from "./reset_password/auth_flow/result/ResetPasswordStartResult.js";

export class CustomAuthPublicClientApplication
    extends PublicClientApplication
    implements ICustomAuthPublicClientApplication
{
    private readonly customAuthController: ICustomAuthStandardController;

    /*
     * Creates a new instance of a PublicClientApplication with the given configuration.
     * @param config - A configuration object for the PublicClientApplication instance
     */
    static create(
        config: CustomAuthConfiguration
    ): CustomAuthPublicClientApplication {
        return new CustomAuthPublicClientApplication(config);
    }

    /*
     * Creates a new instance of a PublicClientApplication with the given configuration and controller.
     * @param config - A configuration object for the PublicClientApplication instance
     * @param controller - A controller object for the PublicClientApplication instance
     */
    constructor(
        config: CustomAuthConfiguration,
        controller?: ICustomAuthStandardController
    ) {
        const customAuthController =
            controller ||
            new CustomAuthStandardController(
                new CustomAuthOperatingContext(config)
            );

        super(config, customAuthController);

        this.customAuthController = customAuthController;
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
        return this.customAuthController.signIn(signInInputs);
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
