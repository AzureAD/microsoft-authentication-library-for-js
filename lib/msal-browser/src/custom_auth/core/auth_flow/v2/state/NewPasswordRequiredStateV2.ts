/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import { SubmitNewPasswordErrorV2 } from "../error/SubmitNewPasswordErrorV2.js";
import { SignInContinuationStateV2 } from "./SignInContinuationStateV2.js";
import type { NewPasswordRequiredStateParametersV2 } from "./CustomAuthStateParametersV2.js";
import type { SubmitNewPasswordResultV2 } from "../result/SubmitNewPasswordResultV2.js";

/**
 * State returned when the user must supply a new password to complete the flow.
 * A successful submission returns `SignInContinuationStateV2` so the app can
 * sign the user in.
 */
export class NewPasswordRequiredStateV2 extends AuthFlowActionRequiredStateBase<NewPasswordRequiredStateParametersV2> {
    readonly stateType = "newPasswordRequired";

    /**
     * Submits the new password to complete the reset. The result either allows
     * sign-in or reports that the password was rejected.
     * @param password - The new password to set.
     * @returns The result of submitting the new password.
     */
    async submitNewPassword(
        password: string
    ): Promise<SubmitNewPasswordResultV2> {
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

            return new CustomAuthResultV2(
                new SignInContinuationStateV2({
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

            return CustomAuthResultV2.createWithError(error, {
                errorType: SubmitNewPasswordErrorV2,
                scenario: continuationState.scenario,
                correlationId,
            });
        }
    }
}
