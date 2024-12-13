/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { FetchClient, StandardController } from "@azure/msal-browser";
import { GetAccountResult } from "../account/auth_flow/result/GetAccountResult.js";
import { SignInResult } from "../sign_in/auth_flow/result/SignInResult.js";
import { SignUpResult } from "../sign_up/auth_flow/result/SignUpResult.js";
import {
    SignInStartParams,
    SignInSubmitPasswordParams,
} from "../sign_in/interaction_client/parameter/SignInParams.js";
import { SignInWithContinuationTokenResult } from "../sign_in/interaction_client/result/SignInActionResult.js";
import { SigninClient } from "../sign_in/interaction_client/SignInClient.js";
import {
    GetAccountInputs,
    SignInInputs,
    SignUpInputs,
    ResetPasswordInputs,
    CustomAuthActionInputs,
} from "../CustomAuthActionInputs.js";
import { CustomAuthConfiguration } from "../configuration/CustomAuthConfiguration.js";
import { CustomAuthApiClient } from "../core/network_client/CustomAuthApiClient.js";
import { SignInCodeSendResponse } from "../core/network_client/response/SignInResponse.js";
import { CustomAuthOperatingContext } from "../operating_context/CustomAuthOperatingContext.js";
import { ICustomAuthStandardController } from "./ICustomAuthStandardController.js";
import { InvalidArgumentError } from "../core/error/InvalidArgumentError.js";
import { SignInPasswordRequiredStateHandler } from "../sign_in/auth_flow/state_handler/SignInPasswordRequiredStateHandler.js";
import { AccountInfo } from "../account/auth_flow/model/AccountInfo.js";
import { SignInCodeRequiredStateHandler } from "../sign_in/auth_flow/state_handler/SignInCodeRequiredStateHandler.js";
import { UnexpectedError } from "../core/error/UnexpectedError.js";
import { ResetPasswordStartResult } from "../reset_password/auth_flow/result/ResetPasswordStartResult.js";

/*
 * Controller for standard native auth operations.
 */
export class CustomAuthStandardController
    extends StandardController
    implements ICustomAuthStandardController
{
    /*
     * The client to use for sign-in operations.
     */
    private readonly signInClient: SigninClient; // More clients will be added for sign-up, reset password, etc.

    /*
     * The configuration for the client.
     */
    private readonly customAuthConfig: CustomAuthConfiguration;

    /*
     * Constructor for CustomAuthStandardController.
     * @param operatingContext - The operating context for the controller.
     */
    constructor(operatingContext: CustomAuthOperatingContext) {
        super(operatingContext);

        this.customAuthConfig = operatingContext.getCustomAuthConfig();

        const customAuthApiClient = new CustomAuthApiClient(new FetchClient());
        this.signInClient = new SigninClient(customAuthApiClient);
        // Create more interaction clients here, such as SignUpClient, ResetPasswordClient, etc.
    }

    /*
     * Gets the current account from the cache.
     * @param getAccountInputs - Inputs for getting the current cached account
     * @returns - A promise that resolves to GetAccountResult
     */
    async getCurrentAccount(
        getAccountInputs: GetAccountInputs
    ): Promise<GetAccountResult> {
        const correlationId = this.getCorrelationId(getAccountInputs);

        throw new Error(
            `Method not implemented with Parameter ${correlationId}.`
        );
    }

    /*
     * Signs the user in.
     * @param signInInputs - Inputs for signing in the user.
     * @returns The result of the operation.
     */
    async signIn(signInInputs: SignInInputs): Promise<SignInResult> {
        const correlationId = this.getCorrelationId(signInInputs);

        if (!signInInputs.username) {
            return Promise.resolve(
                SignInResult.createWithError(
                    new InvalidArgumentError("username", correlationId)
                )
            );
        }

        /*
         * Use the signIn method as an example of how to implement a auth flow action.
         * Please note this is not a working implementation.
         */
        try {
            // The authority URL need to be revisited to ensure it is correct.
            const authorityUrl = this.config.auth.authority;

            // start the signin flow
            const signInStartParams: SignInStartParams = new SignInStartParams(
                authorityUrl,
                this.config.auth.clientId,
                correlationId,
                this.customAuthConfig.customAuth.challengeTypes ?? [],
                signInInputs.scopes ?? [],
                signInInputs.username,
                signInInputs.password
            );

            const startResult = await this.signInClient.start(
                signInStartParams
            );

            if (startResult instanceof SignInWithContinuationTokenResult) {
                // require password
                if (!signInInputs.password) {
                    return new SignInResult(
                        undefined,
                        new SignInPasswordRequiredStateHandler(
                            this.signInClient,
                            correlationId,
                            startResult.continuationToken,
                            this.customAuthConfig,
                            signInInputs.scopes
                        )
                    );
                }

                // if the password is provided, then try to get token silently.
                const signInSubmitPasswordParams =
                    new SignInSubmitPasswordParams(
                        authorityUrl,
                        this.config.auth.clientId,
                        correlationId,
                        this.customAuthConfig.customAuth.challengeTypes ?? [],
                        signInInputs.scopes ?? [],
                        startResult.continuationToken,
                        signInInputs.password
                    );

                const completedResult = await this.signInClient.submitPassword(
                    signInSubmitPasswordParams
                );

                const accountManager = new AccountInfo(
                    completedResult.authenticationResult.account,
                    correlationId,
                    this.customAuthConfig
                );

                return new SignInResult(accountManager);
            } else if (startResult instanceof SignInCodeSendResponse) {
                // require code
                return new SignInResult(
                    undefined,
                    new SignInCodeRequiredStateHandler(
                        this.signInClient,
                        correlationId,
                        startResult.continuationToken,
                        this.customAuthConfig,
                        signInInputs.scopes
                    )
                );
            } else {
                throw new UnexpectedError("Unknow SignInStartResult type");
            }
        } catch (error) {
            return SignInResult.createWithError(error);
        }
    }

    /*
     * Signs the user up.
     * @param signUpInputs - Inputs for signing up the user.
     * @returns The result of the operation
     */
    async signUp(signUpInputs: SignUpInputs): Promise<SignUpResult> {
        const correlationId = this.getCorrelationId(signUpInputs);

        if (!signUpInputs.username) {
            return Promise.resolve(
                SignUpResult.createWithError(
                    new InvalidArgumentError("username", correlationId)
                )
            );
        }

        throw new Error(
            `Method not implemented with Parameter ${correlationId}.`
        );
    }

    /*
     * Resets the user's password.
     * @param resetPasswordInputs - Inputs for resetting the user's password.
     * @returns The result of the operation.
     */
    async resetPassword(
        resetPasswordInputs: ResetPasswordInputs
    ): Promise<ResetPasswordStartResult> {
        const correlationId = this.getCorrelationId(resetPasswordInputs);

        if (!resetPasswordInputs.username) {
            return Promise.resolve(
                ResetPasswordStartResult.createWithError(
                    new InvalidArgumentError("username", correlationId)
                )
            );
        }

        throw new Error(
            `Method not implemented with Parameter ${correlationId}.`
        );
    }

    private getCorrelationId(actionInputs: CustomAuthActionInputs): string {
        return actionInputs.correlationId || this.browserCrypto.createNewGuid();
    }
}
