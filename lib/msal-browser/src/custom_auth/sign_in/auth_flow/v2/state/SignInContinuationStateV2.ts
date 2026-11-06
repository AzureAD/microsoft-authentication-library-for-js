/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../../../core/auth_flow/AuthFlowState.js";
import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import { CompletedStateV2 } from "../../../../core/auth_flow/v2/state/CompletedStateV2.js";
import { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import type { SignInContinuationStateParametersV2 } from "./SignInStateParametersV2.js";
import type { SignInContinuationResultV2 } from "../result/SignInContinuationResultV2.js";

/**
 * State returned when a completed V2 flow can sign the user in.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export class SignInContinuationStateV2 extends AuthFlowActionRequiredStateBase<SignInContinuationStateParametersV2> {
    readonly stateType = "signInContinuation";

    /**
     * Signs the user in after completing the V2 flow.
     * @returns The result of completing the continuation sign-in.
     */
    async signIn(): Promise<SignInContinuationResultV2> {
        const { correlationId, logger, continuationState, flowClient } =
            this.stateParameters;

        try {
            logger.verbose("Signing in with a V2 continuation.", correlationId);

            const result = await flowClient.signInWithContinuation({
                correlationId,
                continuationState,
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
                scenario: continuationState.scenario,
                correlationId,
            });
        }
    }
}
