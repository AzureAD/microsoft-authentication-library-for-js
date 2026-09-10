/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import { VerifyChallengeErrorV2 } from "../error/VerifyChallengeErrorV2.js";
import { RequestChallengeErrorV2 } from "../error/RequestChallengeErrorV2.js";
import type { MFAVerificationRequiredStateParametersV2 } from "./CustomAuthStateParametersV2.js";
import type { MFASubmitChallengeResultV2 } from "../result/MFASubmitChallengeResultV2.js";
import type { MFAResendChallengeResultV2 } from "../result/MFAResendChallengeResultV2.js";
import { CompletedStateV2 } from "./CompletedStateV2.js";
import { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import { FLOW_COMPLETED_V2 } from "../../../interaction_client/v2/result/FlowActionResultV2.js";
import { CustomAuthError } from "../../../error/CustomAuthError.js";
import { UNSUPPORTED_FLOW_TRANSITION } from "../../../network_client/custom_auth_api/v2/ErrorCodesV2.js";
import { CodeVerificationStateBaseV2 } from "./CodeVerificationStateBaseV2.js";

/**
 * State returned when sign-in requires verification of an email or SMS MFA
 * challenge. It allows the app to submit the challenge or request a replacement.
 */
export class MFAVerificationRequiredStateV2 extends CodeVerificationStateBaseV2<MFAVerificationRequiredStateParametersV2> {
    readonly stateType = "mfaVerificationRequired";

    /**
     * Submits the email or SMS challenge as the second authentication factor.
     * Successful verification completes sign-in.
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
            const result = await this.submitCodeCore(challenge);

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
                errorType: VerifyChallengeErrorV2,
                scenario: continuationState.scenario,
                correlationId,
            });
        }
    }

    /**
     * Requests a replacement challenge for the selected MFA method. The
     * returned state contains the refreshed email or SMS challenge metadata.
     * @returns The result of requesting a replacement MFA challenge.
     */
    async resendChallenge(): Promise<MFAResendChallengeResultV2> {
        const { correlationId, logger, continuationState } =
            this.stateParameters;

        try {
            logger.verbose("Resending V2 MFA challenge.", correlationId);
            const result = await this.resendCodeCore();

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
                errorType: RequestChallengeErrorV2,
                scenario: continuationState.scenario,
                correlationId,
            });
        }
    }
}
