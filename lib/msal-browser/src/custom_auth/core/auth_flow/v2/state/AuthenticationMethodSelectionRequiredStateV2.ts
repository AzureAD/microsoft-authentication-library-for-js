/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import { AuthenticationMethodV2 } from "../AuthenticationMethodV2.js";
import { InvalidArgumentError } from "../../../error/InvalidArgumentError.js";
import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import { RequestChallengeErrorV2 } from "../error/RequestChallengeErrorV2.js";
import { ChallengeVerificationRequiredStateV2 } from "./ChallengeVerificationRequiredStateV2.js";
import { PasswordRequiredStateV2 } from "../../../../sign_in/auth_flow/v2/state/PasswordRequiredStateV2.js";
import type { AuthenticationMethodSelectionRequiredStateParametersV2 } from "./CustomAuthStateParametersV2.js";
import type { RequestChallengeResultV2 } from "../result/RequestChallengeResultV2.js";
import { FLOW_PASSWORD_REQUIRED_V2 } from "../../../interaction_client/v2/result/FlowActionResultV2.js";

/**
 * State returned when the user must select one of several authentication
 * methods before a challenge can be issued. It exposes the list of offered
 * methods and lets the app request a challenge for the chosen one. The flow
 * stays on this state until a challenge is successfully requested.
 */
export class AuthenticationMethodSelectionRequiredStateV2 extends AuthFlowActionRequiredStateBase<AuthenticationMethodSelectionRequiredStateParametersV2> {
    readonly stateType = "authenticationMethodSelectionRequired";

    readonly methods: readonly AuthenticationMethodV2[];

    constructor(
        stateParameters: AuthenticationMethodSelectionRequiredStateParametersV2
    ) {
        super(stateParameters);
        this.methods = stateParameters.methods;
    }

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
            // Resolve against server-provided methods to avoid sending the continuation token to a caller-supplied URL.
            const selectedMethod = this.stateParameters.methods.find(
                (candidate) => candidate.id === method.id
            );

            if (!selectedMethod) {
                throw new InvalidArgumentError("method", correlationId);
            }

            logger.verbose(
                "Requesting challenge for the selected V2 method.",
                correlationId
            );

            const result = await flowClient.requestChallenge({
                correlationId,
                continuationState: {
                    ...continuationState,
                    links: {
                        ...continuationState.links,
                        challenge: selectedMethod.challengeHref,
                    },
                },
            });

            const commonStateParameters = {
                correlationId: result.correlationId,
                logger,
                config: this.stateParameters.config,
                flowClient,
                continuationState: result.continuationState,
                cacheClient: this.stateParameters.cacheClient,
            };
            const nextState =
                result.type === FLOW_PASSWORD_REQUIRED_V2
                    ? new PasswordRequiredStateV2(commonStateParameters)
                    : new ChallengeVerificationRequiredStateV2({
                          ...commonStateParameters,
                          method: selectedMethod,
                          sentTo: result.sentTo,
                          channel: result.channel,
                          codeLength: result.codeLength,
                      });

            return new CustomAuthResultV2(
                nextState,
                undefined,
                result.continuationState.scenario
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
