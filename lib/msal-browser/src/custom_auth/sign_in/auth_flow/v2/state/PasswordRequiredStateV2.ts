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
import { MFARequiredStateV2 } from "../../../../core/auth_flow/v2/state/MFARequiredStateV2.js";
import {
    FLOW_COMPLETED_V2,
    FLOW_MFA_REQUIRED_V2,
} from "../../../../core/interaction_client/v2/result/FlowActionResultV2.js";
import { CustomAuthError } from "../../../../core/error/CustomAuthError.js";
import { UNSUPPORTED_FLOW_TRANSITION } from "../../../../core/network_client/custom_auth_api/v2/ErrorCodesV2.js";

/**
 * State returned when the selected sign-in method requires the user's
 * password.
 */
export class PasswordRequiredStateV2 extends AuthFlowActionRequiredStateBase<PasswordRequiredStateParametersV2> {
    readonly stateType = "passwordRequired";

    /**
     * Submits the password and advances sign-in.
     * @param password - The account password.
     * @returns A completed sign-in, MFA selection, or password submission error.
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
            const resultType: string = result.type;

            if (result.type === FLOW_COMPLETED_V2) {
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
            }

            if (result.type === FLOW_MFA_REQUIRED_V2) {
                return new CustomAuthResultV2(
                    new MFARequiredStateV2({
                        correlationId: result.correlationId,
                        logger,
                        config: this.stateParameters.config,
                        flowClient,
                        continuationState: result.continuationState,
                        cacheClient: this.stateParameters.cacheClient,
                        methods: result.methods,
                    }),
                    undefined,
                    result.continuationState.scenario
                );
            }

            throw new CustomAuthError(
                UNSUPPORTED_FLOW_TRANSITION,
                `Password verification result type '${resultType}' is not supported.`,
                correlationId
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
