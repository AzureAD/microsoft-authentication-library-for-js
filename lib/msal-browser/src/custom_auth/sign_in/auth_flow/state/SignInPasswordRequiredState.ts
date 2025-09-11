/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthAccountData } from "../../../get_account/auth_flow/CustomAuthAccountData.js";
import { SignInSubmitPasswordParams } from "../../interaction_client/parameter/SignInParams.js";
import { SignInSubmitPasswordResult } from "../result/SignInSubmitPasswordResult.js";
import { SignInCompletedState } from "./SignInCompletedState.js";
import { SignInState } from "./SignInState.js";
import { SignInPasswordRequiredStateParameters } from "./SignInStateParameters.js";
import {
    SIGN_IN_COMPLETED_RESULT_TYPE,
    SIGN_IN_JIT_REQUIRED_RESULT_TYPE,
} from "../../interaction_client/result/SignInActionResult.js";
import { AuthMethodRegistrationRequiredState } from "../../../core/auth_flow/jit/state/AuthMethodRegistrationState.js";

/*
 * Sign-in password required state.
 */
export class SignInPasswordRequiredState extends SignInState<SignInPasswordRequiredStateParameters> {
    /**
     * Once user configures email with password as a authentication method in Microsoft Entra, user submits a password to continue sign-in flow.
     * @param {string} password - The password to submit.
     * @returns {Promise<SignInSubmitPasswordResult>} The result of the operation.
     */
    async submitPassword(
        password: string
    ): Promise<SignInSubmitPasswordResult> {
        try {
            this.ensurePasswordIsNotEmpty(password);

            const submitPasswordParams: SignInSubmitPasswordParams = {
                clientId: this.stateParameters.config.auth.clientId,
                correlationId: this.stateParameters.correlationId,
                challengeType:
                    this.stateParameters.config.customAuth.challengeTypes ?? [],
                scopes: this.stateParameters.scopes ?? [],
                continuationToken: this.stateParameters.continuationToken ?? "",
                password: password,
                username: this.stateParameters.username,
                claims: this.stateParameters.claims,
            };

            this.stateParameters.logger.verbose(
                "Submitting password for sign-in.",
                this.stateParameters.correlationId
            );

            const submitPasswordResult =
                await this.stateParameters.signInClient.submitPassword(
                    submitPasswordParams
                );

            this.stateParameters.logger.verbose(
                "Password submitted for sign-in.",
                this.stateParameters.correlationId
            );

            if (submitPasswordResult.type === SIGN_IN_COMPLETED_RESULT_TYPE) {
                const accountInfo = new CustomAuthAccountData(
                    submitPasswordResult.authenticationResult.account,
                    this.stateParameters.config,
                    this.stateParameters.cacheClient,
                    this.stateParameters.logger,
                    this.stateParameters.correlationId
                );

                return new SignInSubmitPasswordResult(
                    new SignInCompletedState(),
                    accountInfo
                );
            } else if (
                submitPasswordResult.type === SIGN_IN_JIT_REQUIRED_RESULT_TYPE
            ) {
                // JIT is required - return AuthMethodRegistrationRequiredState
                this.stateParameters.logger.verbose(
                    "Authentication method registration required after password submission.",
                    this.stateParameters.correlationId
                );

                return new SignInSubmitPasswordResult(
                    new AuthMethodRegistrationRequiredState({
                        correlationId: this.stateParameters.correlationId,
                        continuationToken:
                            submitPasswordResult.continuationToken,
                        logger: this.stateParameters.logger,
                        config: this.stateParameters.config,
                        jitClient: this.stateParameters.jitClient,
                        cacheClient: this.stateParameters.cacheClient,
                        authMethods: submitPasswordResult.authMethods,
                        username: this.stateParameters.username,
                        scopes: this.stateParameters.scopes ?? [],
                        claims: this.stateParameters.claims,
                    })
                );
            } else {
                // Unexpected result type
                const result = submitPasswordResult as { type: string };
                const error = new Error(
                    `Unexpected result type: ${result.type}`
                );
                return SignInSubmitPasswordResult.createWithError(error);
            }
        } catch (error) {
            this.stateParameters.logger.errorPii(
                `Failed to sign in after submitting password. Error: ${error}.`,
                this.stateParameters.correlationId
            );

            return SignInSubmitPasswordResult.createWithError(error);
        }
    }

    /**
     * Gets the scopes to request.
     * @returns {string[] | undefined} The scopes to request.
     */
    getScopes(): string[] | undefined {
        return this.stateParameters.scopes;
    }
}
