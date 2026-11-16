/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../../../core/auth_flow/AuthFlowState.js";
import type { CustomAuthActionRequiredStateParametersV2 } from "../../../../core/auth_flow/v2/state/CustomAuthStateParametersV2.js";
import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import type { ExistingAccountSubmitPasswordResultV2 } from "../result/ExistingAccountActionResultsV2.js";
import { handleExistingAccountVerificationResultV2 } from "./ExistingAccountStateTransitionHelperV2.js";

/**
 * State returned when sign-up discovers an existing account that requires its
 * current password. The password is verified as an authentication credential.
 */
export class ExistingAccountPasswordRequiredStateV2 extends AuthFlowActionRequiredStateBase<CustomAuthActionRequiredStateParametersV2> {
    readonly stateType = "existingAccountPasswordRequired";

    /**
     * Verifies the existing account's current password and continues authentication.
     * The result can complete authentication or require enrollment or MFA.
     * @param password - The existing account password.
     * @returns The next existing-account authentication result.
     */
    async submitPassword(
        password: string
    ): Promise<ExistingAccountSubmitPasswordResultV2> {
        const { correlationId, logger, continuationState, flowClient } =
            this.stateParameters;

        try {
            this.ensurePasswordIsNotEmpty(password);
            const result = await flowClient.submitSignInPassword({
                correlationId,
                continuationState,
                password,
            });
            return handleExistingAccountVerificationResultV2(
                result,
                this.stateParameters
            );
        } catch (error) {
            logger.errorPii(
                `Failed to submit V2 existing-account password. Error: '${error}'.`,
                correlationId
            );
            return CustomAuthResultV2.createWithError(error, {
                scenario: continuationState.scenario,
                correlationId,
            });
        }
    }
}
