/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "../../../account/auth_flow/model/AccountInfo.js";
import { InvalidArgumentError } from "../../../core/error/InvalidArgumentError.js";
import { SignInSubmitCodeParams } from "../../interaction_client/parameter/SignInParams.js";
import { SignInResendCodeResult } from "../result/SignInResendCodeResult.js";
import { SignInSubmitCodeResult } from "../result/SignInSubmitCodeResult.js";
import { SignInStateHandler } from "./SignInStateHandler.js";

/*
 * Sign-in handler for the state which requires a code.
 */
export class SignInCodeRequiredStateHandler extends SignInStateHandler {
    /*
     * Submits a code for sign-in.
     * @param code - The code to submit.
     * @returns The result of the operation.
     */
    async submitCode(code: string): Promise<SignInSubmitCodeResult> {
        if (!code) {
            const result = SignInSubmitCodeResult.createWithError(
                new InvalidArgumentError("code", this.correlationId)
            );

            return Promise.resolve(result);
        }

        try {
            // The followings are the sample codes used to demonstrate how to use the signInClient to implement submitting code.
            const submitCodeParams = new SignInSubmitCodeParams(
                this.config.auth.authority ?? "",
                this.config.auth.clientId,
                this.correlationId,
                this.config.nativeAuth.challengeTypes ?? [],
                this.scopes ?? [],
                this.continuationToken ?? "",
                code
            );

            const completedResult = await this.signInClient.submitCode(
                submitCodeParams
            );

            const accountManager = new AccountInfo(
                completedResult.authenticationResult.account,
                this.correlationId,
                this.config
            );

            return new SignInSubmitCodeResult(accountManager);
        } catch (error) {
            return SignInSubmitCodeResult.createWithError(error);
        }
    }

    /*
     * Resends a code for sign-in.
     * @returns The result of the operation.
     */
    async resendCode(): Promise<SignInResendCodeResult> {
        throw new Error("Method not implemented.");
    }
}
