/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../../../core/auth_flow/AuthFlowState.js";
import type { PasswordRequiredStateParametersV2 } from "./SignInStateParametersV2.js";
import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import { CompletedStateV2 } from "../../../../core/auth_flow/v2/state/CompletedStateV2.js";
import { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import { SubmitPasswordErrorV2 } from "../error_type/SubmitPasswordErrorV2.js";
import type { SubmitPasswordResultV2 } from "../result/SubmitPasswordResultV2.js";

/**
 * State returned when the selected sign-in method requires the user's
 * password.
 */
export class PasswordRequiredStateV2 extends AuthFlowActionRequiredStateBase<PasswordRequiredStateParametersV2> {
    readonly stateType = "passwordRequired";

    /**
     * Submits the password and completes single-factor sign-in.
     * @param password - The account password.
     * @returns The completed sign-in result or a password submission error.
     */
    async submitPassword(password: string): Promise<SubmitPasswordResultV2> {
        const { correlationId, logger, continuationState, flowClient } =
            this.stateParameters;

        try {
            this.ensurePasswordIsNotEmpty(password);
            const result = await flowClient.submitSignInPassword({
                correlationId,
                continuationState,
                password,
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
                `Failed to submit V2 sign-in password. Error: '${error}'.`,
                correlationId
            );

            return CustomAuthResultV2.createWithError(error, {
                errorType: SubmitPasswordErrorV2,
                scenario: continuationState.scenario,
                correlationId,
            });
        }
    }
}
