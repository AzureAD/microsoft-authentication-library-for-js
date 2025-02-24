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
import { CustomAuthTokenClient } from "../../../get_account/interaction_client/CustomAuthTokenClient.js";

/*
 * Sign-in handler for the state which requires a code.
 */
export class SignInCodeRequiredStateHandler extends SignInStateHandler {
    constructor(
        username: string,
        signInClient: SignInClient,
        tokenClient: CustomAuthTokenClient,
        correlationId: string,
        logger: Logger,
        continuationToken: string,
        config: CustomAuthBrowserConfiguration,
        public codeLength: number,
        public scopes?: string[],
    ) {
        super(username, signInClient, tokenClient, correlationId, logger, continuationToken, config);
    }

    /*
     * Submits a code for sign-in.
     * @param code - The code to submit.
     * @returns The result of the operation.
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

            this.logger.info("Submitting code for sign-in.");

            const completedResult = await this.signInClient.submitCode(submitCodeParams);

            this.logger.info("Code submitted for sign-in.");

            const accountInfo = new CustomAuthAccountData(
                completedResult.authenticationResult.account,
                this.config,
                this.tokenClient,
                this.logger,
                this.correlationId,
            );

            return new SignInSubmitCodeResult(new SignInCompleted(), accountInfo);
        } catch (error) {
            this.logger.error(`Failed to submit code for sign-in. Error: ${error}.`);

            return SignInSubmitCodeResult.createWithError(error);
        }
    }

    /*
     * Resends a code for sign-in.
     * @returns The result of the operation.
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

            this.logger.info("Resending code for sign-in.");

            const result = await this.signInClient.resendCode(submitCodeParams);

            this.logger.info("Code resent for sign-in.");

            return new SignInResendCodeResult(
                new SignInCodeRequired(
                    result.correlationId,
                    result.continuationToken,
                    this.logger,
                    this.config,
                    this.signInClient,
                    this.tokenClient,
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
