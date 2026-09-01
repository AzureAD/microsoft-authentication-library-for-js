/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationMethodV2 } from "../AuthenticationMethodV2.js";
import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import { RequestChallengeErrorV2 } from "../error/RequestChallengeErrorV2.js";
import { ChallengeVerificationRequiredStateV2 } from "./ChallengeVerificationRequiredStateV2.js";
import type { AuthenticationMethodSelectionRequiredStateParametersV2 } from "./CustomAuthStateParametersV2.js";
import type { RequestChallengeResultV2 } from "../result/RequestChallengeResultV2.js";
import { FLOW_CODE_REQUIRED_V2 } from "../../../interaction_client/v2/result/FlowActionResultV2.js";
import { AuthenticationMethodSelectionStateBaseV2 } from "./AuthenticationMethodSelectionStateBaseV2.js";
import { CustomAuthError } from "../../../error/CustomAuthError.js";
import { UNSUPPORTED_FLOW_TRANSITION } from "../../../network_client/custom_auth_api/v2/ErrorCodesV2.js";

/**
 * State returned when the user must select one of several authentication
 * methods before a challenge can be issued. It exposes the list of offered
 * methods and lets the app request a challenge for the chosen one. The flow
 * stays on this state until a challenge is successfully requested.
 */
export class AuthenticationMethodSelectionRequiredStateV2 extends AuthenticationMethodSelectionStateBaseV2<AuthenticationMethodSelectionRequiredStateParametersV2> {
    readonly stateType = "authenticationMethodSelectionRequired";

    /**
     * Requests a challenge for the selected authentication method. The returned
     * state identifies the credential the application must collect.
     * @param method - The method to challenge, from {@link methods}.
     * @returns The result of requesting the challenge.
     */
    async requestChallenge(
        method: AuthenticationMethodV2
    ): Promise<RequestChallengeResultV2> {
        const { correlationId, logger, continuationState, flowClient } =
            this.stateParameters;

        try {
            logger.verbose(
                "Requesting challenge for the selected V2 method.",
                correlationId
            );

            const { result, selectedMethod } =
                await this.requestSelectedMethodChallenge(method);
            const resultType: string = result.type;

            const commonStateParameters = {
                correlationId: result.correlationId,
                logger,
                config: this.stateParameters.config,
                flowClient,
                continuationState: result.continuationState,
                cacheClient: this.stateParameters.cacheClient,
            };

            if (
                result.type === FLOW_CODE_REQUIRED_V2 &&
                result.channel?.toLowerCase() === "email"
            ) {
                return new CustomAuthResultV2(
                    new ChallengeVerificationRequiredStateV2({
                        ...commonStateParameters,
                        method: selectedMethod,
                        sentTo: result.sentTo,
                        channel: result.channel,
                        codeLength: result.codeLength,
                    }),
                    undefined,
                    result.continuationState.scenario
                );
            }

            throw new CustomAuthError(
                UNSUPPORTED_FLOW_TRANSITION,
                `Challenge type '${resultType}' with channel '${
                    result.type === FLOW_CODE_REQUIRED_V2
                        ? result.channel
                        : "password"
                }' is not supported for password reset.`,
                correlationId
            );
        } catch (error) {
            logger.errorPii(
                `Failed to request V2 challenge. Error: '${error}'.`,
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
