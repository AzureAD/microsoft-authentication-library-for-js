/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import { CustomAuthV2Result } from "../CustomAuthV2Result.js";
import { V2SignInContinuationError } from "../error/V2SignInContinuationError.js";
import { CompletedState } from "./CompletedState.js";
import { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import type { V2SignInContinuationStateParameters } from "./CustomAuthV2StateParameters.js";
import type { V2SignInContinuationResult } from "../result/V2SignInContinuationResult.js";
import type { V2SignInContinuationInputs } from "../../../../CustomAuthV2ActionInputs.js";

/**
 * Shared state returned when a completed V2 flow can sign the user in by
 * redeeming its continuation. Password reset and sign-up can both surface this
 * state without duplicating the token-acquisition behavior.
 */
export class V2SignInContinuationState extends AuthFlowActionRequiredStateBase<V2SignInContinuationStateParameters> {
    readonly stateType = "signInContinuation";

    /**
     * Signs the user in using the continuation established by the completed V2
     * flow. On success the returned result reaches the completed state
     * carrying the signed-in account data; on failure the result's error reports
     * why the follow-up sign-in could not complete.
     * @param inputs - Optional scopes and claims requested for the issued token.
     * @returns The result of signing in after the password reset.
     */
    async signIn(
        inputs?: V2SignInContinuationInputs
    ): Promise<V2SignInContinuationResult> {
        const { correlationId, logger, continuationState, flowClient } =
            this.stateParameters;

        try {
            logger.verbose("Signing in with a V2 continuation.", correlationId);

            const result = await flowClient.signInWithContinuation({
                correlationId,
                continuationState,
                scopes: inputs?.scopes,
                claims: inputs?.claims,
            });

            const account = new CustomAuthAccountData(
                result.authenticationResult.account,
                this.stateParameters.config,
                this.stateParameters.cacheClient,
                logger,
                correlationId
            );

            return new CustomAuthV2Result(
                new CompletedState(),
                account,
                continuationState.scenario
            );
        } catch (error) {
            logger.errorPii(
                `Failed to sign in with a V2 continuation. Error: '${error}'.`,
                correlationId
            );

            return CustomAuthV2Result.createWithError(error, {
                errorType: V2SignInContinuationError,
                scenario: continuationState.scenario,
                correlationId,
            });
        }
    }
}
