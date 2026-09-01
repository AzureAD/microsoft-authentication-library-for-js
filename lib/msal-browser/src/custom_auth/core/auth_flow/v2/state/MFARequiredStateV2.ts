/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationMethodV2 } from "../AuthenticationMethodV2.js";
import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import { RequestChallengeErrorV2 } from "../error/RequestChallengeErrorV2.js";
import { CustomAuthError } from "../../../error/CustomAuthError.js";
import { UNSUPPORTED_FLOW_TRANSITION } from "../../../network_client/custom_auth_api/v2/ErrorCodesV2.js";
import { FLOW_CODE_REQUIRED_V2 } from "../../../interaction_client/v2/result/FlowActionResultV2.js";
import { ChallengeVerificationRequiredStateV2 } from "./ChallengeVerificationRequiredStateV2.js";
import type { MFARequiredStateParametersV2 } from "./CustomAuthStateParametersV2.js";
import type { MFARequestChallengeResultV2 } from "../result/MFARequestChallengeResultV2.js";
import { AuthenticationMethodSelectionStateBaseV2 } from "./AuthenticationMethodSelectionStateBaseV2.js";

/**
 * State returned when sign-in requires a registered multi-factor
 * authentication method.
 */
export class MFARequiredStateV2 extends AuthenticationMethodSelectionStateBaseV2<MFARequiredStateParametersV2> {
    readonly stateType = "mfaRequired";

    /**
     * Requests a challenge for a registered MFA method.
     * @param method - A method from {@link methods}.
     * @returns A result requiring challenge verification or describing failure.
     */
    async requestChallenge(
        method: AuthenticationMethodV2
    ): Promise<MFARequestChallengeResultV2> {
        const { correlationId, logger, continuationState, flowClient } =
            this.stateParameters;

        try {
            const { result, selectedMethod } =
                await this.requestSelectedMethodChallenge(method);

            if (result.type !== FLOW_CODE_REQUIRED_V2) {
                throw new CustomAuthError(
                    UNSUPPORTED_FLOW_TRANSITION,
                    `MFA method selection expected a code challenge but received '${result.type}'.`,
                    correlationId
                );
            }

            return new CustomAuthResultV2(
                new ChallengeVerificationRequiredStateV2({
                    correlationId: result.correlationId,
                    logger,
                    config: this.stateParameters.config,
                    flowClient,
                    continuationState: result.continuationState,
                    cacheClient: this.stateParameters.cacheClient,
                    method: selectedMethod,
                    sentTo: result.sentTo,
                    channel: result.channel,
                    codeLength: result.codeLength,
                }),
                undefined,
                result.continuationState.scenario
            );
        } catch (error) {
            logger.errorPii(
                `Failed to request V2 MFA challenge. Error: '${error}'.`,
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
