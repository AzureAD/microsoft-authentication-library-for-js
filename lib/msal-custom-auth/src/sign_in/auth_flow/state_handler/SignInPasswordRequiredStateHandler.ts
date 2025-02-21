/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-browser";
import { CustomAuthAccountData } from "../../../get_account/auth_flow/CustomAuthAccountData.js";
import { SignInSubmitPasswordParams } from "../../interaction_client/parameter/SignInParams.js";
import { SignInClient } from "../../interaction_client/SignInClient.js";
import { SignInSubmitPasswordResult } from "../result/SignInSubmitPasswordResult.js";
import { SignInCompleted } from "../state/SignInCompleted.js";
import { SignInStateHandler } from "./SignInStateHandler.js";
import { CustomAuthBrowserConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { CustomAuthTokenClient } from "../../../get_account/interaction_client/CustomAuthTokeClient.js";

/*
 * Sign-in handler for the state which requires a password.
 */
export class SignInPasswordRequiredStateHandler extends SignInStateHandler {
    constructor(
        username: string,
        signInClient: SignInClient,
        tokenClient: CustomAuthTokenClient,
        correlationId: string,
        logger: Logger,
        continuationToken: string,
        config: CustomAuthBrowserConfiguration,
        public scopes?: string[],
    ) {
        super(username, signInClient, tokenClient, correlationId, logger, continuationToken, config);
    }

    /*
     * Submits a password for sign-in.
     * @param password - The password to submit.
     * @returns The result of the operation.
     */
    async submitPassword(password: string): Promise<SignInSubmitPasswordResult> {
        try {
            this.ensurePasswordIsNotEmpty(password);

            const submitPasswordParams: SignInSubmitPasswordParams = {
                clientId: this.config.auth.clientId,
                correlationId: this.correlationId,
                challengeType: this.config.customAuth.challengeTypes ?? [],
                scopes: this.scopes ?? [],
                continuationToken: this.continuationToken ?? "",
                password: password,
                username: this.username,
            };

            this.logger.info("Submitting password for sign-in.");

            const completedResult = await this.signInClient.submitPassword(submitPasswordParams);

            this.logger.info("Password submitted for sign-in.");

            const accountInfo = new CustomAuthAccountData(
                completedResult.authenticationResult.account,
                this.config,
                this.tokenClient,
                this.correlationId,
            );

            return new SignInSubmitPasswordResult(new SignInCompleted(), accountInfo);
        } catch (error) {
            this.logger.error(`Failed to sign in after submitting password. Error: ${error}.`);

            return SignInSubmitPasswordResult.createWithError(error);
        }
    }
}
