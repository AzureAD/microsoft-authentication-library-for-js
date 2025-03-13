/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-browser";
import { CustomAuthAccountData } from "../../../get_account/auth_flow/CustomAuthAccountData.js";
import { CustomAuthBrowserConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { SignInResendCodeParams, SignInSubmitCodeParams } from "../../interaction_client/parameter/SignInParams.js";
import { SignInClient } from "../../interaction_client/SignInClient.js";
import { SignInResendCodeResult } from "../result/SignInResendCodeResult.js";
import { SignInSubmitCodeResult } from "../result/SignInSubmitCodeResult.js";
import { SignInStateHandler } from "./SignInStateHandler.js";
import { SignInCompleted } from "../state/SignInCompleted.js";
import { SignInCodeRequired } from "../state/SignInCodeRequired.js";
import { CustomAuthSilentCacheClient } from "../../../get_account/interaction_client/CustomAuthSilentCacheClient.js";

/*
 * Sign-in handler for the state which requires a code.
 */
export class SignInCodeRequiredStateHandler extends SignInStateHandler {
    constructor(
        username: string,
        signInClient: SignInClient,
        cacheClient: CustomAuthSilentCacheClient,
        correlationId: string,
        logger: Logger,
        continuationToken: string,
        config: CustomAuthBrowserConfiguration,
        public codeLength: number,
        public scopes?: string[],
    ) {
        super(username, signInClient, cacheClient, correlationId, logger, continuationToken, config);
    }

    /**
     * Once user configures email one-time passcode as a authentication method in Microsoft Entra, a one-time passcode will be sent to the user’s email.
     * Submit this one-time passcode to continue sign-in flow.
     * @param {string} code - The code to submit.
     * @returns {Promise<SignInSubmitCodeResult>} The result of the operation.
     */
    async submitCode(code: string): Promise<SignInSubmitCodeResult> {
        try {
            this.ensureCodeIsValid(code, this.codeLength);

            const submitCodeParams: SignInSubmitCodeParams = {
                clientId: this.config.auth.clientId,
                correlationId: this.correlationId,
                challengeType: this.config.customAuth.challengeTypes ?? [],
                scopes: this.scopes ?? [],
                continuationToken: this.continuationToken ?? "",
                code: code,
                username: this.username,
            };

            this.logger.verbose("Submitting code for sign-in.", this.correlationId);

            const completedResult = await this.signInClient.submitCode(submitCodeParams);

            this.logger.verbose("Code submitted for sign-in.", this.correlationId);

            const accountInfo = new CustomAuthAccountData(
                completedResult.authenticationResult.account,
                this.config,
                this.cacheClient,
                this.logger,
                this.correlationId,
            );

            return new SignInSubmitCodeResult(new SignInCompleted(), accountInfo);
        } catch (error) {
            this.logger.errorPii(`Failed to submit code for sign-in. Error: ${error}.`, this.correlationId);

            return SignInSubmitCodeResult.createWithError(error);
        }
    }

    /**
     * Resends the another one-time passcode for sign-in flow if the previous one hasn't been verified.
     * @returns {Promise<SignInResendCodeResult>} The result of the operation.
     */
    async resendCode(): Promise<SignInResendCodeResult> {
        try {
            const submitCodeParams: SignInResendCodeParams = {
                clientId: this.config.auth.clientId,
                correlationId: this.correlationId,
                challengeType: this.config.customAuth.challengeTypes ?? [],
                continuationToken: this.continuationToken ?? "",
                username: this.username,
            };

            this.logger.verbose("Resending code for sign-in.", this.correlationId);

            const result = await this.signInClient.resendCode(submitCodeParams);

            this.logger.verbose("Code resent for sign-in.", this.correlationId);

            return new SignInResendCodeResult(
                new SignInCodeRequired(
                    result.correlationId,
                    result.continuationToken,
                    this.logger,
                    this.config,
                    this.signInClient,
                    this.cacheClient,
                    this.username,
                    result.codeLength,
                    this.scopes ?? [],
                ),
            );
        } catch (error) {
            return SignInResendCodeResult.createWithError(error);
        }
    }
}
