/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthAccountData } from "../../../get_account/auth_flow/CustomAuthAccountData.js";
import { SignInContinuationTokenParams } from "../../interaction_client/parameter/SignInParams.js";
import { SignInResult } from "../result/SignInResult.js";
import { SignInWithContinuationTokenInputs } from "../../../CustomAuthActionInputs.js";
import { SignInContinuationStateParameters } from "./SignInStateParameters.js";
import { SignInState } from "./SignInState.js";
import { SignInCompletedState } from "./SignInCompletedState.js";
import {
    SIGN_IN_JIT_REQUIRED_RESULT_TYPE,
    SIGN_IN_COMPLETED_RESULT_TYPE,
} from "../../interaction_client/result/SignInActionResult.js";
import { AuthMethodRegistrationRequiredState } from "../../../core/auth_flow/jit/state/AuthMethodRegistrationState.js";
import * as ArgumentValidator from "../../../core/utils/ArgumentValidator.js";

/*
 * Sign-in continuation state.
 */
export class SignInContinuationState extends SignInState<SignInContinuationStateParameters> {
    /**
     * Initiates the sign-in flow with continuation token.
     * @param {SignInWithContinuationTokenInputs} signInWithContinuationTokenInputs - The result of the operation.
     * @returns {Promise<SignInResult>} The result of the operation.
     */
    async signIn(
        signInWithContinuationTokenInputs?: SignInWithContinuationTokenInputs
    ): Promise<SignInResult> {
        try {
            if (signInWithContinuationTokenInputs?.claims) {
                ArgumentValidator.ensureArgumentIsJSONString(
                    "signInWithContinuationTokenInputs.claims",
                    signInWithContinuationTokenInputs.claims,
                    this.stateParameters.correlationId
                );
            }

            const continuationTokenParams: SignInContinuationTokenParams = {
                clientId: this.stateParameters.config.auth.clientId,
                correlationId: this.stateParameters.correlationId,
                challengeType:
                    this.stateParameters.config.customAuth.challengeTypes ?? [],
                scopes: signInWithContinuationTokenInputs?.scopes ?? [],
                continuationToken: this.stateParameters.continuationToken ?? "",
                username: this.stateParameters.username,
                signInScenario: this.stateParameters.signInScenario,
                claims: signInWithContinuationTokenInputs?.claims,
            };

            this.stateParameters.logger.verbose(
                "Signing in with continuation token.",
                this.stateParameters.correlationId
            );

            const signInResult =
                await this.stateParameters.signInClient.signInWithContinuationToken(
                    continuationTokenParams
                );

            this.stateParameters.logger.verbose(
                "Signed in with continuation token.",
                this.stateParameters.correlationId
            );

            if (signInResult.type === SIGN_IN_COMPLETED_RESULT_TYPE) {
                // Sign-in completed successfully
                const accountInfo = new CustomAuthAccountData(
                    signInResult.authenticationResult.account,
                    this.stateParameters.config,
                    this.stateParameters.cacheClient,
                    this.stateParameters.logger,
                    this.stateParameters.correlationId
                );

                return new SignInResult(
                    new SignInCompletedState(),
                    accountInfo
                );
            } else if (signInResult.type === SIGN_IN_JIT_REQUIRED_RESULT_TYPE) {
                // JIT is required
                this.stateParameters.logger.warning(
                    "Auth method registration required during continuation token sign-in.",
                    this.stateParameters.correlationId
                );

                // Return AuthMethodRegistrationRequiredState to handle JIT scenario
                const authMethodRegistrationState =
                    new AuthMethodRegistrationRequiredState({
                        correlationId: this.stateParameters.correlationId,
                        continuationToken: signInResult.continuationToken,
                        logger: this.stateParameters.logger,
                        config: this.stateParameters.config,
                        jitClient: this.stateParameters.jitClient,
                        cacheClient: this.stateParameters.cacheClient,
                        authMethods: signInResult.authMethods,
                        username: this.stateParameters.username,
                        scopes: signInWithContinuationTokenInputs?.scopes ?? [],
                        claims: this.stateParameters.claims,
                    });

                return new SignInResult(authMethodRegistrationState);
            } else {
                // Unexpected result type
                const result = signInResult as { type: string };
                const error = new Error(
                    `Unexpected result type: ${result.type}`
                );
                return SignInResult.createWithError(error);
            }
        } catch (error) {
            this.stateParameters.logger.errorPii(
                `Failed to sign in with continuation token. Error: ${error}.`,
                this.stateParameters.correlationId
            );

            return SignInResult.createWithError(error);
        }
    }
}
