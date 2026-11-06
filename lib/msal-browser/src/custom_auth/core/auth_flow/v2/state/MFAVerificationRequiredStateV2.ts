/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { MFAVerificationRequiredStateParametersV2 } from "./CustomAuthStateParametersV2.js";
import type { MFASubmitChallengeResultV2 } from "../result/MFASubmitChallengeResultV2.js";
import type { RequestChallengeResultV2 } from "../result/RequestChallengeResultV2.js";
import { CompletedStateV2 } from "./CompletedStateV2.js";
import { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import {
    FLOW_COMPLETED_V2,
    FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2,
} from "../../../interaction_client/v2/result/FlowActionResultV2.js";
import { SignInContinuationStateV2 } from "../../../../sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import { CustomAuthError } from "../../../error/CustomAuthError.js";
import { UNSUPPORTED_FLOW_TRANSITION } from "../../../network_client/custom_auth_api/v2/ErrorCodesV2.js";
import { ChallengeVerificationStateBaseV2 } from "./ChallengeVerificationStateBaseV2.js";
import { AuthenticationFactorV2 } from "../../../network_client/custom_auth_api/v2/result/BaseResultsV2.js";

/**
 * State returned when authentication requires verification of an email or SMS MFA
 * challenge. It allows the app to submit the challenge or request a replacement.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export class MFAVerificationRequiredStateV2 extends ChallengeVerificationStateBaseV2<MFAVerificationRequiredStateParametersV2> {
    readonly stateType = "mfaVerificationRequired";

    /**
     * Submits the email or SMS challenge as the second authentication factor.
     * @param challenge - The challenge value to submit.
     * @returns The result of submitting the MFA challenge.
     */
    async submitChallenge(
        challenge: string
    ): Promise<MFASubmitChallengeResultV2> {
        const { correlationId, logger, continuationState } =
            this.stateParameters;

        try {
            logger.verbose("Submitting V2 MFA challenge.", correlationId);
            const result = await this.submitCodeCore(
                challenge,
                AuthenticationFactorV2.MULTI_FACTOR
            );

            if (result.type === FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2) {
                return new CustomAuthResultV2(
                    new SignInContinuationStateV2({
                        correlationId: result.correlationId,
                        logger,
                        config: this.stateParameters.config,
                        flowClient: this.stateParameters.flowClient,
                        continuationState: result.continuationState,
                        cacheClient: this.stateParameters.cacheClient,
                    }),
                    undefined,
                    result.continuationState.scenario
                );
            }

            if (result.type !== FLOW_COMPLETED_V2) {
                throw new CustomAuthError(
                    UNSUPPORTED_FLOW_TRANSITION,
                    `MFA challenge submission result type '${result.type}' is not supported.`,
                    correlationId
                );
            }

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
                `Failed to submit V2 MFA challenge. Error: '${error}'.`,
                correlationId
            );

            return CustomAuthResultV2.createWithError(error, {
                scenario: continuationState.scenario,
                correlationId,
                errorContext: "mfaVerification",
            });
        }
    }

    /**
     * Requests a replacement challenge for the selected MFA method.
     * @returns The result of requesting a replacement MFA challenge.
     */
    async resendChallenge(): Promise<RequestChallengeResultV2> {
        const { correlationId, logger, continuationState } =
            this.stateParameters;

        try {
            logger.verbose("Resending V2 MFA challenge.", correlationId);
            const result = await this.resendCodeCore(
                AuthenticationFactorV2.MULTI_FACTOR
            );

            return new CustomAuthResultV2(
                new MFAVerificationRequiredStateV2({
                    correlationId: result.correlationId,
                    logger,
                    config: this.stateParameters.config,
                    flowClient: this.stateParameters.flowClient,
                    continuationState: result.continuationState,
                    cacheClient: this.stateParameters.cacheClient,
                    method: this.method,
                    sentTo: result.sentTo,
                    channel: result.channel,
                    codeLength: result.codeLength,
                }),
                undefined,
                result.continuationState.scenario
            );
        } catch (error) {
            logger.errorPii(
                `Failed to resend V2 MFA challenge. Error: '${error}'.`,
                correlationId
            );

            return CustomAuthResultV2.createWithError(error, {
                scenario: continuationState.scenario,
                correlationId,
            });
        }
    }
}
