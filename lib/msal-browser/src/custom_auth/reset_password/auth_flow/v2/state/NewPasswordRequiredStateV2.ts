/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../../../core/auth_flow/AuthFlowState.js";
import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import { AuthMethodRegistrationRequiredStateV2 } from "../../../../core/auth_flow/v2/state/AuthMethodRegistrationRequiredStateV2.js";
import {
    FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
    FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2,
} from "../../../../core/interaction_client/v2/result/FlowActionResultV2.js";
import { CustomAuthError } from "../../../../core/error/CustomAuthError.js";
import { UNSUPPORTED_FLOW_TRANSITION } from "../../../../core/network_client/custom_auth_api/v2/ErrorCodesV2.js";
import { SignInContinuationStateV2 } from "../../../../sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import type { NewPasswordRequiredStateParametersV2 } from "./ResetPasswordStateParametersV2.js";
import type { SubmitNewPasswordResultV2 } from "../result/SubmitNewPasswordResultV2.js";

/**
 * State returned when the user must supply a new password to complete the flow.
 * A successful submission can require registration or return a continuation
 * for sign-in.
 */
export class NewPasswordRequiredStateV2 extends AuthFlowActionRequiredStateBase<NewPasswordRequiredStateParametersV2> {
    readonly stateType = "newPasswordRequired";

    /**
     * Submits the new password to complete the reset. Enrollment may be
     * required before sign-in; a rejected password returns an error.
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

            const result = await flowClient.submitNewPassword({
                correlationId,
                continuationState,
                newPassword: password,
            });
            const resultType: string = result.type;

            if (result.type === FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2) {
                return new CustomAuthResultV2(
                    new AuthMethodRegistrationRequiredStateV2({
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

            if (result.type === FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2) {
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
            }

            throw new CustomAuthError(
                UNSUPPORTED_FLOW_TRANSITION,
                `Password submission result type '${resultType}' is not supported.`,
                correlationId
            );
        } catch (error) {
            logger.errorPii(
                `Failed to submit V2 new password. Error: '${error}'.`,
                correlationId
            );

            return CustomAuthResultV2.createWithError(error, {
                scenario: continuationState.scenario,
                correlationId,
            });
        }
    }
}
