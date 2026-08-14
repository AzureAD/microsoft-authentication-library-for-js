/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import { CustomAuthV2Result } from "../CustomAuthV2Result.js";
import { SignInAfterResetPasswordError } from "../error/SignInAfterResetPasswordError.js";
import { toV2ApiError } from "./V2StateErrorHelper.js";
import { CompletedState } from "./CompletedState.js";
import { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import type { SignInAfterResetPasswordStateParameters } from "./CustomAuthV2StateParameters.js";
import type { SignInAfterResetPasswordResult } from "../result/SignInAfterResetPasswordResult.js";
import type { SignInAfterResetPasswordInputs } from "../../../../CustomAuthV2ActionInputs.js";

/**
 * State returned once a password reset has completed, allowing the app to sign
 * the just-reset user in without re-entering credentials. The reset flow does
 * not end at `CompletedState` directly; instead it surfaces this state carrying
 * the reset-flow continuation, mirroring V1's `ResetPasswordCompletedState` and
 * iOS's `SignInAfterResetPasswordState`. Calling {@link signIn} redeems that
 * continuation for tokens and reaches the completed state with account data.
 */
export class SignInAfterResetPasswordState extends AuthFlowActionRequiredStateBase<SignInAfterResetPasswordStateParameters> {
    readonly stateType = "signInAfterResetPassword";

    /**
     * Signs the user in using the continuation established by the completed
     * password reset. On success the returned result reaches the completed state
     * carrying the signed-in account data; on failure the result's error reports
     * why the follow-up sign-in could not complete.
     * @param inputs - Optional scopes and claims requested for the issued token.
     * @returns The result of signing in after the password reset.
     */
    async signIn(
        inputs?: SignInAfterResetPasswordInputs
    ): Promise<SignInAfterResetPasswordResult> {
        const { correlationId, logger, continuationState, flowClient } =
            this.stateParameters;

        try {
            logger.verbose(
                "Signing in after V2 password reset.",
                correlationId
            );

            const result = await flowClient.signInAfterReset({
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
                `Failed to sign in after V2 password reset. Error: '${error}'.`,
                correlationId
            );

            return CustomAuthV2Result.createWithError(
                new SignInAfterResetPasswordError(
                    toV2ApiError(error, correlationId),
                    continuationState.scenario
                )
            );
        }
    }
}
