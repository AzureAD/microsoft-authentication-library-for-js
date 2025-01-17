/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "../../../account/auth_flow/model/AccountInfo.js";
import { SignInContinuationTokenParams } from "../../interaction_client/parameter/SignInParams.js";
import { SignInError } from "../error_type/SignInError.js";
import { SignInResult } from "../result/SignInResult.js";
import { SignInStateHandler } from "./SignInStateHandler.js";

/*
 * Sign-in continuation state handler.
 */
export class SignInContinuationStateHandler extends SignInStateHandler {
    /*
     * Initiates the sign-in flow with continuation token.
     * @returns The result of the operation.
     */
    async signIn(): Promise<SignInResult> {
        try {
            const continuationTokenParams: SignInContinuationTokenParams = {
                clientId: this.config.auth.clientId,
                correlationId: this.correlationId,
                challengeType: this.config.customAuth.challengeTypes ?? [],
                scopes: this.scopes ?? [],
                continuationToken: this.continuationToken ?? "",
                username: this.username,
            };

            this.logger.info("Signing in with continuation token.");

            const completedResult =
                await this.signInClient.signInWithContinuationToken(
                    continuationTokenParams,
                );

            this.logger.info("Signed in with continuation token.");

            const accountInfo = new AccountInfo(
                completedResult.authenticationResult.account,
                this.correlationId,
                this.config,
            );

            return new SignInResult(accountInfo);
        } catch (error) {
            this.logger.error(
                `Failed to sign in with continuation token. Error: ${error}.`,
            );

            return SignInResult.createWithError(error, SignInError);
        }
    }
}
