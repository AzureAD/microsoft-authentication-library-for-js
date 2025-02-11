/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-browser";
import { AccountInfo } from "../../../account/auth_flow/model/AccountInfo.js";
import { SignInContinuationTokenParams } from "../../interaction_client/parameter/SignInParams.js";
import { SignInClient } from "../../interaction_client/SignInClient.js";
import { SignInResult } from "../result/SignInResult.js";
import { SignInCompleted } from "../state/SignInCompleted.js";
import { SignInStateHandler } from "./SignInStateHandler.js";
import { CustomAuthBrowserConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { SignInScenario } from "../SignInScenario.js";

/*
 * Sign-in continuation state handler.
 */
export class SignInContinuationStateHandler extends SignInStateHandler {
    constructor(
        username: string,
        signInClient: SignInClient,
        correlationId: string,
        logger: Logger,
        continuationToken: string,
        config: CustomAuthBrowserConfiguration,
        private signInScenario: SignInScenario,
    ) {
        super(username, signInClient, correlationId, logger, continuationToken, config);
    }

    /*
     * Initiates the sign-in flow with continuation token.
     * @returns The result of the operation.
     */
    async signIn(scopes?: string[]): Promise<SignInResult> {
        try {
            const continuationTokenParams: SignInContinuationTokenParams = {
                clientId: this.config.auth.clientId,
                correlationId: this.correlationId,
                challengeType: this.config.customAuth.challengeTypes ?? [],
                scopes: scopes ?? [],
                continuationToken: this.continuationToken ?? "",
                username: this.username,
                signInScenario: this.signInScenario,
            };

            this.logger.info("Signing in with continuation token.");

            const completedResult = await this.signInClient.signInWithContinuationToken(continuationTokenParams);

            this.logger.info("Signed in with continuation token.");

            const accountInfo = new AccountInfo(
                completedResult.authenticationResult.account,
                this.correlationId,
                this.config,
            );

            return new SignInResult(new SignInCompleted(), accountInfo);
        } catch (error) {
            this.logger.error(`Failed to sign in with continuation token. Error: ${error}.`);

            return SignInResult.createWithError(error);
        }
    }
}
