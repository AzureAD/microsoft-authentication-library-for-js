/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import { CustomAuthV2Result } from "../CustomAuthV2Result.js";
import { SubmitNewPasswordError } from "../error/SubmitNewPasswordError.js";
import { toV2Error } from "./V2StateErrorHelper.js";
import { V2SignInContinuationState } from "./V2SignInContinuationState.js";
import type { NewPasswordRequiredStateParameters } from "./CustomAuthV2StateParameters.js";
import type { SubmitNewPasswordResult } from "../result/SubmitNewPasswordResult.js";

/**
 * State returned when the user must supply a new password to complete the flow.
 * This is the final password-entry step: once a valid new password is submitted
 * the reset completes and the flow surfaces `V2SignInContinuationState` so
 * the app can sign the user in.
 */
export class NewPasswordRequiredState extends AuthFlowActionRequiredStateBase<NewPasswordRequiredStateParameters> {
    readonly stateType = "newPasswordRequired";

    /**
     * Submits the new password to complete the reset. On success the returned
     * result reaches `V2SignInContinuationState`, from which the app signs
     * the user in; on failure the result's error reports whether the password
     * was rejected (for example too weak) so the app can prompt for a different
     * one.
     * @param password - The new password to set.
     * @returns The result of submitting the new password.
     */
    async submitNewPassword(password: string): Promise<SubmitNewPasswordResult> {
        const { correlationId, logger, continuationState, flowClient } =
            this.stateParameters;

        try {
            this.ensurePasswordIsNotEmpty(password);

            logger.verbose("Submitting V2 new password.", correlationId);

            const result = await flowClient.submitPassword({
                correlationId,
                continuationState,
                newPassword: password,
            });

            return new CustomAuthV2Result(
                new V2SignInContinuationState({
                    correlationId: result.correlationId,
                    logger,
                    config: this.stateParameters.config,
                    flowClient,
                    continuationState: result.continuationState,
                    cacheClient: this.stateParameters.cacheClient,
                }),
                undefined,
                result.continuationState.scenario
            );
        } catch (error) {
            logger.errorPii(
                `Failed to submit V2 new password. Error: '${error}'.`,
                correlationId
            );

            return CustomAuthV2Result.createWithError(
                new SubmitNewPasswordError(
                    toV2Error(error, correlationId),
                    continuationState.scenario
                )
            );
        }
    }
}
