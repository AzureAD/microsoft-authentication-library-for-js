/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ChallengeVerificationStateBaseV2 } from "../../../../core/auth_flow/v2/state/ChallengeVerificationStateBaseV2.js";
import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import { CustomAuthError } from "../../../../core/error/CustomAuthError.js";
import { UNSUPPORTED_FLOW_TRANSITION } from "../../../../core/network_client/custom_auth_api/v2/ErrorCodesV2.js";
import {
    FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
    FLOW_COMPLETED_V2,
    FLOW_MFA_REQUIRED_V2,
} from "../../../../core/interaction_client/v2/result/FlowActionResultV2.js";
import type { RequestChallengeResultV2 } from "../../../../core/auth_flow/v2/result/RequestChallengeResultV2.js";
import type { ExistingAccountSubmitCodeResultV2 } from "../result/ExistingAccountActionResultsV2.js";
import { handleExistingAccountVerificationResultV2 } from "./ExistingAccountStateTransitionHelperV2.js";

/**
 * State returned when sign-up discovers an existing account that requires an
 * email code. Submitting or resending the code preserves existing-account authentication.
 */
export class ExistingAccountCodeRequiredStateV2 extends ChallengeVerificationStateBaseV2 {
    readonly stateType = "existingAccountCodeRequired";

    /**
     * Submits the existing account's email code and continues authentication.
     * The result can complete authentication or require enrollment or MFA.
     * @param code - The email code to verify.
     * @returns The next existing-account authentication result.
     */
    async submitCode(code: string): Promise<ExistingAccountSubmitCodeResultV2> {
        const { correlationId, logger, continuationState } =
            this.stateParameters;

        try {
            const result = await this.submitCodeCore(code);
            if (
                result.type === FLOW_COMPLETED_V2 ||
                result.type === FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2 ||
                result.type === FLOW_MFA_REQUIRED_V2
            ) {
                return handleExistingAccountVerificationResultV2(
                    result,
                    this.stateParameters
                );
            }

            const resultType: string = result.type;
            throw new CustomAuthError(
                UNSUPPORTED_FLOW_TRANSITION,
                `Existing-account code submission result type '${resultType}' is not supported.`,
                correlationId
            );
        } catch (error) {
            logger.errorPii(
                `Failed to submit V2 existing-account code. Error: '${error}'.`,
                correlationId
            );
            return CustomAuthResultV2.createWithError(error, {
                scenario: continuationState.scenario,
                correlationId,
            });
        }
    }

    /**
     * Requests a replacement email code for the existing account. The returned
     * state contains the fresh continuation token and challenge metadata.
     * @returns The refreshed existing-account code state or an error.
     */
    async resendCode(): Promise<RequestChallengeResultV2> {
        const { correlationId, logger, continuationState } =
            this.stateParameters;

        try {
            const result = await this.resendCodeCore();
            return new CustomAuthResultV2(
                new ExistingAccountCodeRequiredStateV2({
                    ...this.stateParameters,
                    correlationId: result.correlationId,
                    continuationState: result.continuationState,
                    sentTo: result.sentTo,
                    channel: result.channel,
                    codeLength: result.codeLength,
                }),
                undefined,
                result.continuationState.scenario
            );
        } catch (error) {
            logger.errorPii(
                `Failed to resend V2 existing-account code. Error: '${error}'.`,
                correlationId
            );
            return CustomAuthResultV2.createWithError(error, {
                scenario: continuationState.scenario,
                correlationId,
            });
        }
    }
}
