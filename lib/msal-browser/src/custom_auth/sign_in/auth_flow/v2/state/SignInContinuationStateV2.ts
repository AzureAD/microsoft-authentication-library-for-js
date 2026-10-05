/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../../../core/auth_flow/AuthFlowState.js";
import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import { CompletedStateV2 } from "../../../../core/auth_flow/v2/state/CompletedStateV2.js";
import { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import { SignInContinuationErrorV2 } from "../error_type/SignInContinuationErrorV2.js";
import type { SignInContinuationStateParametersV2 } from "./SignInStateParametersV2.js";
import type { SignInContinuationResultV2 } from "../result/SignInContinuationResultV2.js";
import type { SignInContinuationInputsV2 } from "../../../../CustomAuthActionInputs.js";
import * as ArgumentValidator from "../../../../core/utils/ArgumentValidator.js";

/**
 * Shared state returned when a completed V2 flow can sign the user in by
 * redeeming its continuation. Password reset and sign-up can both surface this
 * state without duplicating the token-acquisition behavior.
 */
export class SignInContinuationStateV2 extends AuthFlowActionRequiredStateBase<SignInContinuationStateParametersV2> {
    readonly stateType = "signInContinuation";

    /**
     * Signs the user in using the continuation established by the completed V2
     * flow. On success the returned result reaches the completed state
     * carrying the signed-in account data; on failure the result's error reports
     * why the follow-up sign-in could not complete.
     * @param inputs - Optional scopes requested for the issued token. Claims
     * are accepted for API alignment but are not sent until the V2 service
     * supports them on authorize-challenge.
     * @returns The result of signing in after the password reset.
     */
    async signIn(
        inputs?: SignInContinuationInputsV2
    ): Promise<SignInContinuationResultV2> {
        const { correlationId, logger, continuationState, flowClient } =
            this.stateParameters;

        try {
            if (inputs?.claims) {
                ArgumentValidator.ensureArgumentIsJSONString(
                    "inputs.claims",
                    inputs.claims,
                    correlationId
                );
            }

            logger.verbose("Signing in with a V2 continuation.", correlationId);

            const result = await flowClient.signInWithContinuation({
                correlationId,
                continuationState,
                scopes: inputs?.scopes,
            });

            const account = new CustomAuthAccountData(
                result.authenticationResult.account,
                this.stateParameters.config,
                this.stateParameters.cacheClient,
                logger,
                correlationId
            );

            return new CustomAuthResultV2(
                new CompletedStateV2(),
                account,
                continuationState.scenario
            );
        } catch (error) {
            logger.errorPii(
                `Failed to sign in with a V2 continuation. Error: '${error}'.`,
                correlationId
            );

            return CustomAuthResultV2.createWithError(error, {
                errorType: SignInContinuationErrorV2,
                scenario: continuationState.scenario,
                correlationId,
            });
        }
    }
}
