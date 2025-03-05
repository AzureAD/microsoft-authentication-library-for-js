/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants, PublicClientApplication } from "@azure/msal-browser";
import { GetAccountResult } from "./get_account/auth_flow/result/GetAccountResult.js";
import { SignInResult } from "./sign_in/auth_flow/result/SignInResult.js";
import { SignUpResult } from "./sign_up/auth_flow/result/SignUpResult.js";
import { ICustomAuthStandardController } from "./controller/ICustomAuthStandardController.js";
import { CustomAuthStandardController } from "./controller/CustomAuthStandardController.js";
import { ICustomAuthPublicClientApplication } from "./ICustomAuthPublicClientApplication.js";
import { AccountRetrievalInputs, SignInInputs, SignUpInputs, ResetPasswordInputs } from "./CustomAuthActionInputs.js";
import { CustomAuthConfiguration } from "./configuration/CustomAuthConfiguration.js";
import { CustomAuthOperatingContext } from "./operating_context/CustomAuthOperatingContext.js";
import { ResetPasswordStartResult } from "./reset_password/auth_flow/result/ResetPasswordStartResult.js";
import {
    InvalidAuthApiProxyDomain,
    InvalidAuthority,
    InvalidConfigurationError,
    MissingConfiguration,
} from "./core/error/InvalidConfigurationError.js";
import { UrlUtils } from "./core/utils/UrlUtils.js";
import { StringUtils } from "./core/utils/StringUtils.js";

export class CustomAuthPublicClientApplication
    extends PublicClientApplication
    implements ICustomAuthPublicClientApplication
{
    private readonly customAuthController: ICustomAuthStandardController;

    /*
     * Creates a new instance of a PublicClientApplication with the given configuration.
     * @param config - A configuration object for the PublicClientApplication instance
     * @param controller - A controller object for the PublicClientApplication instance
     */
    static async create(
        config: CustomAuthConfiguration,
        controller?: ICustomAuthStandardController,
    ): Promise<ICustomAuthPublicClientApplication> {
        CustomAuthPublicClientApplication.validateConfig(config);

        let customAuthController = controller;

        if (!customAuthController) {
            customAuthController = new CustomAuthStandardController(new CustomAuthOperatingContext(config));

            await customAuthController.initialize();
        }

        const app = new CustomAuthPublicClientApplication(config, customAuthController);

        return app;
    }

    /*
     * Creates a new instance of a PublicClientApplication with the given configuration and controller.
     * @param config - A configuration object for the PublicClientApplication instance
     * @param controller - A controller object for the PublicClientApplication instance
     */
    private constructor(config: CustomAuthConfiguration, controller: ICustomAuthStandardController) {
        super(config, controller);

        this.customAuthController = controller;
    }

    /*
     * Gets the current account from the cache.
     * @param getAccountInputs - Inputs for getting the current cached account
     * @returns - The result of the operation
     */
    getCurrentAccount(accountRetrievalInputs?: AccountRetrievalInputs): GetAccountResult {
        return this.customAuthController.getCurrentAccount(accountRetrievalInputs);
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
        return this.customAuthController.signUp(signUpInputs);
    }

    /*
     * Initiates the reset password flow.
     * @param resetPasswordInputs - Inputs for the reset password flow
     * @returns - A promise that resolves to ResetPasswordStartResult
     */
    resetPassword(resetPasswordInputs: ResetPasswordInputs): Promise<ResetPasswordStartResult> {
        return this.customAuthController.resetPassword(resetPasswordInputs);
    }

    /**
     * Validates the configuration to ensure it is a valid CustomAuthConfiguration object.
     * @param config The configuration object for the PublicClientApplication.
     */
    private static validateConfig(config: CustomAuthConfiguration): void {
        // Ensure the configuration object has a valid CIAM authority URL.
        if (!config) {
            throw new InvalidConfigurationError(MissingConfiguration, "The configuration is missing.");
        }

        if (!config.auth?.authority) {
            throw new InvalidConfigurationError(
                InvalidAuthority,
                `The authority URL '${config.auth?.authority}' is not set.`,
            );
        }

        const trimmedAuthority = StringUtils.trimSlashes(config.auth.authority);

        if (!trimmedAuthority.endsWith(Constants.CIAM_AUTH_URL)) {
            throw new InvalidConfigurationError(
                InvalidAuthority,
                `The authority URL '${config.auth?.authority}' is not a CIAM authority.`,
            );
        }

        if (config.customAuth.authApiProxyUrl && !UrlUtils.IsValidSecureUrl(config.customAuth.authApiProxyUrl)) {
            throw new InvalidConfigurationError(
                InvalidAuthApiProxyDomain,
                `The authApiProxyDomain URL '${config.customAuth.authApiProxyUrl}' is not a valid secure URL.`,
            );
        }
    }
}
